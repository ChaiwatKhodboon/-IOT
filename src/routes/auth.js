const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const pool = require('../db');
const { jwtSecret, otpSecret } = require('../config');
const { sendPasswordResetOtp } = require('../mailer');
const { cleanText } = require('../utils/validation');
const { authenticate } = require('../middleware/auth');
const { broadcast } = require('../realtime');
const router = express.Router();
const { createGoogleAuthRouter } = require('./google-auth');
const { googleClientId, isProduction } = require('../config');
router.use(createGoogleAuthRouter({ pool, clientId: googleClientId, secret: jwtSecret, production: isProduction, broadcast }));
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_RESPONSE = 'หากอีเมลนี้มีบัญชีอยู่ ระบบจะส่งรหัส OTP ให้ กรุณาตรวจสอบกล่องจดหมายและจดหมายขยะ';
const otpHash = (userId, otp) => crypto.createHmac('sha256', otpSecret).update(`${userId}:${otp}`).digest('hex');

router.post('/login', async (req, res, next) => {
  try {
    const username = cleanText(req.body.username, 50);
    const { rows } = await pool.query('SELECT id, username, email, password_hash, full_name, student_id, avatar_data, role FROM users WHERE (LOWER(username)=$1 OR LOWER(COALESCE(email,\'\'))=$1) AND active=TRUE', [username.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password_hash))) return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    const profile = { id: user.id, username: user.username, email: user.email, fullName: user.full_name, studentId: user.student_id, avatarUrl: user.avatar_data, role: user.role };
    const claims = { id: user.id, username: user.username, fullName: user.full_name, studentId: user.student_id, role: user.role };
    res.json({ token: jwt.sign(claims, jwtSecret, { expiresIn: '8h' }), user: profile });
  } catch (error) { next(error); }
});

router.post('/register', async (req, res, next) => {
  try {
    const username = cleanText(req.body.username, 50).toLowerCase();
    const email = cleanText(req.body.email || (EMAIL_PATTERN.test(username) ? username : ''), 254).toLowerCase();
    const fullName = cleanText(req.body.fullName, 120) || username.split('@')[0];
    const password = String(req.body.password || '');
    if (!username || username.length < 4 || password.length < 8 || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อผู้ใช้ อีเมลที่ถูกต้อง และรหัสผ่านอย่างน้อย 8 ตัวอักษร' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users(username,email,password_hash,full_name,student_id,role)
       VALUES($1,$2,$3,$4,$5,'user')
       RETURNING id,username,email,full_name,student_id,role`,
      [username, email, passwordHash, fullName, cleanText(req.body.studentId, 20) || null]
    );
    const user = rows[0];
    broadcast('users');
    return res.status(201).json({
      message: 'สมัครสมาชิกเรียบร้อยแล้ว',
      user: { id:user.id, username:user.username, email:user.email, fullName:user.full_name, studentId:user.student_id, role:user.role }
    });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว' });
    return next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = cleanText(req.body.email, 254).toLowerCase();
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ message: 'กรุณากรอกอีเมลให้ถูกต้อง' });
    const { rows } = await pool.query(
      `SELECT id,full_name,email FROM users
       WHERE active=TRUE AND LOWER(COALESCE(email,''))=$1 LIMIT 1`, [email]
    );
    const user = rows[0];
    if (!user) return res.json({ message: OTP_RESPONSE });

    const recent = await pool.query(
      `SELECT COUNT(*)::int AS count, MAX(created_at) AS latest
       FROM password_reset_otps WHERE user_id=$1 AND created_at>NOW()-INTERVAL '15 minutes'`, [user.id]
    );
    const latest = recent.rows[0].latest ? new Date(recent.rows[0].latest).getTime() : 0;
    if (recent.rows[0].count >= 3 || Date.now() - latest < 60_000) {
      return res.json({ message: OTP_RESPONSE });
    }

    const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    await pool.query(
      `INSERT INTO password_reset_otps(user_id,otp_hash,expires_at)
       VALUES($1,$2,NOW()+INTERVAL '5 minutes')`, [user.id, otpHash(user.id, otp)]
    );
    try {
      await sendPasswordResetOtp({ to: user.email, name: user.full_name, otp });
    } catch (error) {
      console.error('ส่งอีเมล OTP ไม่สำเร็จ:', error.message);
      return res.status(503).json({ message: 'ไม่สามารถส่งอีเมลได้ กรุณาตรวจสอบการตั้งค่าอีเมลแล้วลองใหม่' });
    }
    return res.json({ message: OTP_RESPONSE });
  } catch (error) { return next(error); }
});

router.post('/reset-password', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const email = cleanText(req.body.email, 254).toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const password = String(req.body.password || '');
    if (!EMAIL_PATTERN.test(email) || !/^\d{6}$/.test(otp) || password.length < 8) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'กรุณากรอกอีเมล รหัส OTP 6 หลัก และรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร' });
    }
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT o.id,o.user_id,o.otp_hash,o.attempts
       FROM password_reset_otps o JOIN users u ON u.id=o.user_id
       WHERE LOWER(COALESCE(u.email,''))=$1 AND u.active=TRUE
         AND o.used_at IS NULL AND o.expires_at>NOW()
       ORDER BY o.created_at DESC LIMIT 1 FOR UPDATE`, [email]
    );
    const record = rows[0];
    const supplied = record ? otpHash(record.user_id, otp) : '0'.repeat(64);
    const valid = record && record.attempts < 5 && crypto.timingSafeEqual(Buffer.from(record.otp_hash), Buffer.from(supplied));
    if (!valid) {
      if (record) await client.query('UPDATE password_reset_otps SET attempts=attempts+1 WHERE id=$1', [record.id]);
      await client.query('COMMIT');
      return res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้อง หมดอายุ หรือถูกใช้งานแล้ว' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await client.query('UPDATE users SET password_hash=$1 WHERE id=$2', [passwordHash, record.user_id]);
    await client.query('UPDATE password_reset_otps SET used_at=NOW() WHERE user_id=$1 AND used_at IS NULL', [record.user_id]);
    await client.query('COMMIT');
    return res.json({ message: 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบ' });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally { client.release(); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, full_name, student_id, avatar_data, role FROM users WHERE id=$1 AND active=TRUE',
      [req.user.id]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'บัญชีนี้ไม่สามารถใช้งานได้' });
    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      studentId: user.student_id,
      avatarUrl: user.avatar_data,
      role: user.role
    });
  } catch (error) { next(error); }
});

router.put('/avatar', authenticate, async (req, res, next) => {
  try {
    const avatarUrl = typeof req.body.avatarUrl === 'string' ? req.body.avatarUrl.trim() : '';
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(avatarUrl) || avatarUrl.length > 2800000) {
      return res.status(400).json({ message: 'รูปโปรไฟล์ต้องเป็น JPG, PNG หรือ WebP และมีขนาดไม่เกิน 2 MB' });
    }
    const { rows } = await pool.query(
      'UPDATE users SET avatar_data=$1 WHERE id=$2 AND active=TRUE RETURNING avatar_data AS "avatarUrl"',
      [avatarUrl, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });
    broadcast('users'); return res.json(rows[0]);
  } catch (error) { return next(error); }
});
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const username = cleanText(req.body.username, 50).toLowerCase();
    const studentId = cleanText(req.body.studentId, 20) || null;
    if (!/^[a-z0-9._-]{4,50}$/i.test(username)) return res.status(400).json({ message: 'ชื่อผู้ใช้ต้องมี 4-50 ตัวอักษร และใช้ได้เฉพาะ a-z, 0-9, จุด, ขีดกลาง หรือขีดล่าง' });
    const { rows } = await pool.query(
      'UPDATE users SET username=$1,student_id=$2 WHERE id=$3 AND active=TRUE RETURNING id,username,email,full_name AS "fullName",student_id AS "studentId",avatar_data AS "avatarUrl",role',
      [username, studentId, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });
    broadcast('users');
    return res.json(rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
    return next(error);
  }
});

module.exports = router;

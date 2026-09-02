const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { jwtSecret } = require('../config');
const { cleanText } = require('../utils/validation');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const username = cleanText(req.body.username, 50);
    const { rows } = await pool.query('SELECT id, username, password_hash, full_name, student_id, avatar_data, role FROM users WHERE username=$1 AND active=TRUE', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password_hash))) return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    const profile = { id: user.id, username: user.username, fullName: user.full_name, studentId: user.student_id, avatarUrl: user.avatar_data, role: user.role };
    const claims = { id: user.id, username: user.username, fullName: user.full_name, studentId: user.student_id, role: user.role };
    res.json({ token: jwt.sign(claims, jwtSecret, { expiresIn: '8h' }), user: profile });
  } catch (error) { next(error); }
});

router.post('/register', async (req, res, next) => {
  try {
    const username = cleanText(req.body.username, 50).toLowerCase();
    const fullName = cleanText(req.body.fullName, 120) || username.split('@')[0];
    const password = String(req.body.password || '');
    if (!username || username.length < 4 || password.length < 8) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร และรหัสผ่านอย่างน้อย 8 ตัวอักษร' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users(username,password_hash,full_name,student_id,role)
       VALUES($1,$2,$3,$4,'user')
       RETURNING id,username,full_name,student_id,role`,
      [username, passwordHash, fullName, cleanText(req.body.studentId, 20) || null]
    );
    const user = rows[0];
    return res.status(201).json({
      message: 'สมัครสมาชิกเรียบร้อยแล้ว',
      user: { id:user.id, username:user.username, fullName:user.full_name, studentId:user.student_id, role:user.role }
    });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
    return next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, full_name, student_id, avatar_data, role FROM users WHERE id=$1 AND active=TRUE',
      [req.user.id]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'บัญชีนี้ไม่สามารถใช้งานได้' });
    return res.json({
      id: user.id,
      username: user.username,
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
    return res.json(rows[0]);
  } catch (error) { return next(error); }
});
module.exports = router;

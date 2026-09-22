const express = require('express');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createGoogleVerifier } = require('../google-identity');

const TEN_MINUTES = 600_000;
const MAX_ATTEMPT_ADDRESSES = 10_000;
const MAX_ATTEMPTS = 20;

function recordLoginAttempt(attempts, address, now) {
  for (const [key, value] of attempts) {
    if (value.expires <= now) attempts.delete(key);
  }
  let entry = attempts.get(address);
  if (!entry) {
    if (attempts.size >= MAX_ATTEMPT_ADDRESSES) {
      return { status: 429, message: 'กรุณารอสักครู่แล้วลองใหม่' };
    }
    entry = { count: 0, expires: now + TEN_MINUTES };
    attempts.set(address, entry);
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    return { status: 429, message: 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 10 นาที' };
  }
  return null;
}

function challengeCookie(req, cookieName) {
  return (req.headers.cookie || '').split(';').map(value => value.trim())
    .find(value => value.startsWith(cookieName + '='));
}

async function verifyCredential(req, cookieName, secret, clientId, verify) {
  const cookie = challengeCookie(req, cookieName);
  const encoded = cookie?.slice(cookieName.length + 1) || '';
  const challenge = jwt.verify(decodeURIComponent(encoded), secret, {
    algorithms: ['HS256'], audience: 'iot-google-login'
  });
  if (challenge.purpose !== 'google-login') throw new Error('Invalid challenge');
  const payload = await verify(req.body.credential, clientId);
  if (typeof payload.nonce !== 'string' || payload.nonce !== challenge.nonce) {
    throw new Error('Invalid nonce');
  }
  return payload;
}

function googleOwnsEmail(payload, email) {
  return email.endsWith('@gmail.com') || (typeof payload.hd === 'string' && Boolean(payload.hd));
}

async function createGoogleUser(client, payload, email) {
  if (!googleOwnsEmail(payload, email)) {
    return { error: { status: 403, message: 'อีเมลนี้ไม่ได้ให้บริการโดย Gmail หรือ Google Workspace กรุณาสมัครด้วยอีเมลและรหัสผ่านก่อน แล้วเชื่อมต่อ Google' } };
  }
  const passwordHash = await bcrypt.hash(crypto.randomBytes(48).toString('base64url'), 10);
  const fullName = String(payload.name || email.split('@')[0]).trim().slice(0, 120) || 'ผู้ใช้งาน';
  const result = await client.query(
    "INSERT INTO users(username,email,password_hash,full_name,role,google_sub) VALUES($1,$2,$3,$4,'user',$5) RETURNING *",
    ['google_' + crypto.randomBytes(16).toString('hex'), email, passwordHash, fullName, payload.sub]
  );
  return { user: result.rows[0] };
}

async function linkExistingUser(client, user, payload, password) {
  if (!user.active) return { error: { status: 403, message: 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ' } };
  if (user.google_sub && user.google_sub !== payload.sub) {
    return { error: { status: 409, message: 'บัญชีนี้ผูกกับ Google บัญชีอื่นแล้ว' } };
  }
  if (!password) {
    return { error: { status: 200, body: { linkingRequired: true, message: 'พบบัญชีเดิม กรุณายืนยันรหัสผ่านของระบบเพื่อเชื่อมต่อ Google' } } };
  }
  const validPassword = typeof password === 'string' && password.length <= 1024
    && await bcrypt.compare(password, user.password_hash);
  if (!validPassword) return { error: { status: 401, message: 'รหัสผ่านบัญชีเดิมไม่ถูกต้อง' } };
  await client.query('UPDATE users SET google_sub=$1 WHERE id=$2', [payload.sub, user.id]);
  return { user };
}

async function resolveGoogleUser(client, payload, password) {
  const bySubject = await client.query('SELECT * FROM users WHERE google_sub=$1 FOR UPDATE', [payload.sub]);
  if (bySubject.rows[0]) return { user: bySubject.rows[0] };
  const email = payload.email.toLowerCase();
  const existing = await client.query('SELECT * FROM users WHERE LOWER(email)=$1 FOR UPDATE', [email]);
  if (existing.rows[0]) return linkExistingUser(client, existing.rows[0], payload, password);
  return createGoogleUser(client, payload, email);
}

async function rollbackResponse(client, res, error) {
  await client.query('ROLLBACK');
  return res.status(error.status).json(error.body || { message: error.message });
}

function userSession(user, secret) {
  const profile = { id: user.id, username: user.username, email: user.email, fullName: user.full_name,
    studentId: user.student_id, avatarUrl: user.avatar_data, role: user.role };
  const token = jwt.sign({ id: user.id, username: user.username, fullName: user.full_name,
    studentId: user.student_id, role: user.role }, secret, { expiresIn: '8h' });
  return { token, user: profile };
}

function createGoogleAuthRouter({ pool, clientId, secret, production = false, verify = createGoogleVerifier(), broadcast = () => {} }) {
  const router = express.Router();
  const cookieName = 'iot_google_challenge';
  const attempts = new Map();
  const cookieOptions = req => ({ httpOnly: true, sameSite: 'strict', secure: production || req.secure, path: '/api/auth/google' });

  router.get('/google/config', (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!clientId) return res.json({ enabled: false });
    const nonce = crypto.randomBytes(32).toString('base64url');
    const challenge = jwt.sign({ nonce, purpose: 'google-login' }, secret, { expiresIn: '10m', audience: 'iot-google-login' });
    res.cookie(cookieName, challenge, { ...cookieOptions(req), maxAge: TEN_MINUTES });
    return res.json({ enabled: true, clientId, nonce });
  });

  router.post('/google', async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!clientId) return res.status(503).json({ message: 'ยังไม่เปิดใช้งานการเข้าสู่ระบบด้วย Google' });
    if (!req.is('application/json') || req.get('sec-fetch-site') === 'cross-site') {
      return res.status(403).json({ message: 'คำขอเข้าสู่ระบบไม่ถูกต้อง' });
    }
    const limitError = recordLoginAttempt(attempts, req.ip || 'unknown', Date.now());
    if (limitError) return res.status(limitError.status).json({ message: limitError.message });

    let payload;
    try {
      payload = await verifyCredential(req, cookieName, secret, clientId, verify);
    } catch {
      return res.status(401).json({ message: 'ยืนยัน Google ไม่สำเร็จหรือหมดเวลา กรุณาเลือกบัญชีใหม่' });
    }

    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const result = await resolveGoogleUser(client, payload, req.body.password);
      if (result.error) return rollbackResponse(client, res, result.error);
      if (!result.user.active) {
        return rollbackResponse(client, res, { status: 403, message: 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
      }
      await client.query('COMMIT');
      res.clearCookie(cookieName, cookieOptions(req));
      broadcast('users');
      return res.json(userSession(result.user, secret));
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      if (error.code === '23505') {
        return res.status(409).json({ message: 'บัญชีเพิ่งถูกสร้างหรือเชื่อมต่อ กรุณาลองเข้าสู่ระบบอีกครั้ง' });
      }
      return next(error);
    } finally {
      client?.release();
    }
  });
  return router;
}

module.exports = { createGoogleAuthRouter };

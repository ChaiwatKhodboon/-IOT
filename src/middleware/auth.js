const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
  try { req.user = jwt.verify(token, jwtSecret); return next(); }
  catch { return res.status(401).json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' }); }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'เฉพาะผู้ดูแลระบบเท่านั้น' });
  return next();
}

module.exports = { authenticate, adminOnly };

const express = require('express');
const pool = require('../db');
const { authenticate, adminOnly } = require('../middleware/auth');
const { cleanText } = require('../utils/validation');
const { broadcast } = require('../realtime');
const router = express.Router();

router.use(authenticate, adminOnly);

router.get('/', async (req, res, next) => {
  try {
    const search = cleanText(req.query.search, 100);
    const values = search ? [`%${search}%`] : [];
    const where = search ? 'WHERE username ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1 OR student_id ILIKE $1' : '';
    const { rows } = await pool.query(
      `SELECT u.id,u.username,u.email,u.full_name AS "fullName",u.student_id AS "studentId",u.avatar_data AS "avatarUrl",u.role,u.active,u.created_at AS "createdAt",
       COUNT(l.id) FILTER (WHERE l.status='borrowed')::int AS "activeLoans",
       COUNT(l.id) FILTER (WHERE l.status='borrowed' AND l.due_at<NOW())::int AS "overdueLoans"
       FROM users u LEFT JOIN loans l ON l.user_id=u.id ${where}
       GROUP BY u.id ORDER BY u.created_at DESC`, values
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const role = req.body.role === 'admin' ? 'admin' : 'user';
    const active = req.body.active !== false;
    if (Number(req.params.id) === Number(req.user.id) && (!active || role !== 'admin')) {
      return res.status(400).json({ message: 'ไม่สามารถปิดใช้งานหรือลดสิทธิ์บัญชีที่กำลังใช้งานอยู่' });
    }
    const fullName = cleanText(req.body.fullName, 120);
    const email = cleanText(req.body.email, 254).toLowerCase() || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    if (!fullName) return res.status(400).json({ message: 'กรุณาระบุชื่อผู้ใช้' });
    const { rows } = await pool.query(
      'UPDATE users SET full_name=$1,student_id=$2,email=$3,role=$4,active=$5 WHERE id=$6 RETURNING id,username,email,full_name AS "fullName",student_id AS "studentId",role,active',
      [fullName, cleanText(req.body.studentId, 20) || null, email, role, active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });
    broadcast('users'); res.json(rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    next(error);
  }
});

module.exports = router;

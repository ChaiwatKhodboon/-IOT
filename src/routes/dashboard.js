const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
router.get('/', authenticate, async (req, res, next) => {
  try {
    const own = req.user.role === 'admin' ? '' : ' AND user_id=$1'; const params = req.user.role === 'admin' ? [] : [req.user.id];
    const [eq, active, overdue, issues] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(total_quantity),0)::int AS total,
        COALESCE(SUM(available_quantity) FILTER (WHERE status<>'retired'),0)::int AS available,
        COALESCE(SUM(maintenance_quantity) FILTER (WHERE status<>'retired'),0)::int AS maintenance,
        COALESCE(SUM(available_quantity+maintenance_quantity) FILTER (WHERE status='retired'),0)::int AS retired,
        (SELECT COALESCE(SUM(quantity),0)::int FROM loans WHERE status='borrowed') AS "borrowedQuantity",
        (SELECT COALESCE(SUM(quantity),0)::int FROM loans WHERE status='returned' AND return_condition='lost') AS lost
        FROM equipment`),
      pool.query(`SELECT COALESCE(SUM(quantity),0)::int AS count FROM loans WHERE status='borrowed'${own}`, params),
      pool.query(`SELECT COUNT(*)::int AS count FROM loans WHERE status='borrowed' AND due_at<NOW()${own}`, params),
      pool.query(`SELECT COALESCE(SUM(quantity),0)::int AS count FROM loans WHERE return_condition IN ('damaged','lost','abnormal')${own}`, params)
    ]);
    res.json({ ...eq.rows[0], activeLoans: active.rows[0].count, overdueLoans: overdue.rows[0].count, issueReports: issues.rows[0].count });
  } catch (error) { next(error); }
});
module.exports = router;

const express = require('express');
const pool = require('../db');
const { authenticate, adminOnly } = require('../middleware/auth');
const { positiveInteger, cleanText } = require('../utils/validation');
const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const values = []; const conditions = [];
    if (req.user.role !== 'admin') { values.push(req.user.id); conditions.push(`l.user_id=$${values.length}`); }
    if (req.query.status) { values.push(req.query.status); conditions.push(`l.status=$${values.length}`); }
    if (req.query.search) { values.push(`%${req.query.search}%`); conditions.push(`(e.name ILIKE $${values.length} OR e.code ILIKE $${values.length} OR u.full_name ILIKE $${values.length})`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT l.id,l.quantity,l.borrowed_at AS "borrowedAt",l.due_at AS "dueAt",l.returned_at AS "returnedAt",l.repaired_at AS "repairedAt",l.status,l.borrow_remark AS "borrowRemark",l.return_remark AS "returnRemark",l.return_condition AS "returnCondition",e.id AS "equipmentId",e.code AS "equipmentCode",e.name AS "equipmentName",u.id AS "userId",u.full_name AS "borrowerName",u.student_id AS "studentId" FROM loans l JOIN equipment e ON e.id=l.equipment_id JOIN users u ON u.id=l.user_id ${where} ORDER BY l.borrowed_at DESC`, values);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/', authenticate, async (req, res, next) => {
  if (!positiveInteger(req.body.equipmentId) || !positiveInteger(req.body.quantity)) return res.status(400).json({ message: 'กรุณาระบุอุปกรณ์และจำนวนให้ถูกต้อง' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const eq = await client.query("SELECT * FROM equipment WHERE id=$1 AND status<>'retired' AND available_quantity>0 FOR UPDATE", [req.body.equipmentId]);
    if (!eq.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'ไม่พบอุปกรณ์ที่พร้อมให้ยืม' }); }
    const quantity = Number(req.body.quantity);
    if (eq.rows[0].available_quantity < quantity) { await client.query('ROLLBACK'); return res.status(409).json({ message: `อุปกรณ์คงเหลือเพียง ${eq.rows[0].available_quantity} ชิ้น` }); }
    await client.query('UPDATE equipment SET available_quantity=available_quantity-$1,updated_at=NOW() WHERE id=$2', [quantity, req.body.equipmentId]);
    const { rows } = await client.query('INSERT INTO loans(user_id,equipment_id,quantity,due_at,borrow_remark) VALUES($1,$2,$3,$4,$5) RETURNING *', [req.user.id,req.body.equipmentId,quantity,req.body.dueAt || null,cleanText(req.body.remark,500)]);
    await client.query('COMMIT'); res.status(201).json(rows[0]);
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/:id/return', authenticate, async (req, res, next) => {
  const valid = ['normal','damaged','lost','abnormal'];
  if (!valid.includes(req.body.condition)) return res.status(400).json({ message: 'กรุณาระบุสภาพอุปกรณ์' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const values = [req.params.id]; let ownership = '';
    if (req.user.role !== 'admin') { values.push(req.user.id); ownership = ' AND user_id=$2'; }
    const loan = await client.query(`SELECT * FROM loans WHERE id=$1 AND status='borrowed'${ownership} FOR UPDATE`, values);
    if (!loan.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'ไม่พบรายการยืมที่คืนได้' }); }
    const item = loan.rows[0];
    await client.query("UPDATE loans SET status='returned',returned_at=NOW(),return_condition=$1,return_remark=$2,updated_at=NOW() WHERE id=$3", [req.body.condition,cleanText(req.body.remark,500),item.id]);
    if (req.body.condition === 'normal') await client.query('UPDATE equipment SET available_quantity=available_quantity+$1,updated_at=NOW() WHERE id=$2', [item.quantity,item.equipment_id]);
    if (['damaged','abnormal'].includes(req.body.condition)) await client.query("UPDATE equipment SET maintenance_quantity=maintenance_quantity+$1,status='maintenance',updated_at=NOW() WHERE id=$2", [item.quantity,item.equipment_id]);
    await client.query('COMMIT'); res.json({ message: 'บันทึกการคืนเรียบร้อยแล้ว' });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/:id/repair', authenticate, adminOnly, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const loan = await client.query("SELECT * FROM loans WHERE id=$1 AND status='returned' AND return_condition IN ('damaged','abnormal') AND repaired_at IS NULL FOR UPDATE", [req.params.id]);
    if (!loan.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'ไม่พบรายการชำรุดที่รอซ่อม หรือรายการนี้เสร็จสิ้นแล้ว' }); }
    const item = loan.rows[0];
    const equipment = await client.query('SELECT * FROM equipment WHERE id=$1 FOR UPDATE', [item.equipment_id]);
    if (!equipment.rows[0] || equipment.rows[0].maintenance_quantity < item.quantity) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'จำนวนอุปกรณ์รอซ่อมไม่ตรงกับรายการ กรุณาตรวจสอบข้อมูล' });
    }
    await client.query("UPDATE equipment SET maintenance_quantity=maintenance_quantity-$1,available_quantity=available_quantity+$1,status=CASE WHEN maintenance_quantity-$1=0 THEN 'available'::equipment_status ELSE 'maintenance'::equipment_status END,updated_at=NOW() WHERE id=$2", [item.quantity,item.equipment_id]);
    await client.query('UPDATE loans SET repaired_at=NOW(),updated_at=NOW() WHERE id=$1', [item.id]);
    await client.query('COMMIT');
    res.json({ message: `ซ่อมเสร็จแล้ว ${item.quantity} ชิ้น และพร้อมให้ยืม` });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.put('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE loans SET due_at=$1,borrow_remark=$2,updated_at=NOW() WHERE id=$3 RETURNING *', [req.body.dueAt || null,cleanText(req.body.remark,500),req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'ไม่พบรายการยืม' }); res.json(rows[0]);
  } catch (error) { next(error); }
});
module.exports = router;

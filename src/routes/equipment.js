const express = require('express');
const pool = require('../db');
const { authenticate, adminOnly } = require('../middleware/auth');
const { equipmentInput } = require('../utils/validation');
const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const params = search ? [`%${search}%`] : [];
    const where = search ? 'WHERE code ILIKE $1 OR name ILIKE $1 OR category ILIKE $1' : '';
    const { rows } = await pool.query(`SELECT id, code, name, category, description, image_data AS "imageUrl", total_quantity AS "totalQuantity", available_quantity AS "availableQuantity", maintenance_quantity AS "maintenanceQuantity", status, created_at AS "createdAt", updated_at AS "updatedAt" FROM equipment ${where} ORDER BY name`, params);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/', authenticate, adminOnly, async (req, res, next) => {
  const parsed = equipmentInput(req.body); if (parsed.error) return res.status(400).json({ message: parsed.error });
  const d = parsed.data;
  try {
    const { rows } = await pool.query('INSERT INTO equipment(code,name,category,description,image_data,total_quantity,available_quantity,status) VALUES($1,$2,$3,$4,$5,$6,$6,$7) RETURNING *', [d.code,d.name,d.category,d.description,d.imageUrl,d.totalQuantity,d.status]);
    res.status(201).json(rows[0]);
  } catch (error) { if (error.code === '23505') return res.status(409).json({ message: 'รหัสอุปกรณ์นี้มีอยู่แล้ว' }); next(error); }
});

router.put('/:id', authenticate, adminOnly, async (req, res, next) => {
  const parsed = equipmentInput(req.body); if (parsed.error) return res.status(400).json({ message: parsed.error });
  const d = parsed.data;
  try {
    const { rows } = await pool.query(`UPDATE equipment SET code=$1,name=$2,category=$3,description=$4,total_quantity=$5,available_quantity=available_quantity+($5-total_quantity),status=$6,image_data=COALESCE($7,image_data),updated_at=NOW() WHERE id=$8 AND available_quantity+($5-total_quantity)>=0 RETURNING *`, [d.code,d.name,d.category,d.description,d.totalQuantity,d.status,d.imageUrl,req.params.id]);
    if (!rows[0]) return res.status(400).json({ message: 'จำนวนรวมต้องไม่น้อยกว่าจำนวนที่กำลังถูกยืม' });
    res.json(rows[0]);
  } catch (error) { if (error.code === '23505') return res.status(409).json({ message: 'รหัสอุปกรณ์นี้มีอยู่แล้ว' }); next(error); }
});

router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const active = await pool.query("SELECT 1 FROM loans WHERE equipment_id=$1 AND status='borrowed'", [req.params.id]);
    if (active.rowCount) return res.status(409).json({ message: 'ลบไม่ได้ เนื่องจากอุปกรณ์กำลังถูกยืม' });
    const result = await pool.query('DELETE FROM equipment WHERE id=$1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'ไม่พบอุปกรณ์' });
    res.status(204).end();
  } catch (error) { if (error.code === '23503') return res.status(409).json({ message: 'อุปกรณ์มีประวัติการใช้งาน จึงไม่สามารถลบได้ (เปลี่ยนสถานะเป็นเลิกใช้งานแทน)' }); next(error); }
});
module.exports = router;

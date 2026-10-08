const express = require('express');
const pool = require('../db');
const { authenticate, adminOnly } = require('../middleware/auth');
const { positiveInteger, cleanText } = require('../utils/validation');
const { broadcast } = require('../realtime');
const {setActor,auditedQuery}=require('../utils/audit');
const {parseReturn}=require('../utils/returns');
const {randomUUID}=require('node:crypto');
const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const values = []; const conditions = [];
    if (req.user.role !== 'admin') { values.push(req.user.id); conditions.push(`l.user_id=$${values.length}`); }
    if (req.query.status==='pending_return') conditions.push('l.pending_return IS NOT NULL');
    else if (req.query.status) { values.push(req.query.status); conditions.push(`l.status=$${values.length}`); }
    if (req.query.search) { values.push(`%${req.query.search}%`); conditions.push(`(e.name ILIKE $${values.length} OR e.code ILIKE $${values.length} OR COALESCE(l.borrower_name,u.full_name) ILIKE $${values.length})`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const order = req.query.sort === 'recent'
      ? 'COALESCE(l.repaired_at,l.returned_at,l.borrowed_at) DESC,l.id DESC'
      : "(l.status='borrowed' AND l.due_at<NOW()) DESC,l.borrowed_at DESC";
    const { rows } = await pool.query(`SELECT l.id,l.quantity,l.pending_return AS "pendingReturn",l.return_rejection AS "returnRejection",l.original_quantity AS "originalQuantity",COALESCE(l.parent_loan_id,l.id) AS "rootLoanId",l.returned_by AS "returnedBy",(SELECT full_name FROM users WHERE id=l.returned_by) AS "returnedByName",(SELECT full_name FROM users WHERE id=l.repaired_by) AS "repairedByName",l.borrowed_at AS "borrowedAt",l.due_at AS "dueAt",l.returned_at AS "returnedAt",l.repaired_at AS "repairedAt",l.status,l.borrow_remark AS "borrowRemark",l.return_remark AS "returnRemark",l.return_condition AS "returnCondition",(l.status='borrowed' AND l.due_at<NOW()) AS "isOverdue",CASE WHEN l.status='borrowed' AND l.due_at<NOW() THEN CEIL(EXTRACT(EPOCH FROM (NOW()-l.due_at))/86400)::int ELSE 0 END AS "overdueDays",e.id AS "equipmentId",e.code AS "equipmentCode",e.name AS "equipmentName",e.image_data AS "imageUrl",u.id AS "userId",COALESCE(l.borrower_name,u.full_name) AS "borrowerName",u.student_id AS "studentId",u.avatar_data AS "borrowerAvatar" FROM loans l JOIN equipment e ON e.id=l.equipment_id JOIN users u ON u.id=l.user_id ${where} ORDER BY ${order}`, values);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/', authenticate, async (req, res, next) => {
  if (!positiveInteger(req.body.equipmentId) || !positiveInteger(req.body.quantity)) return res.status(400).json({ message: 'กรุณาระบุอุปกรณ์และจำนวนให้ถูกต้อง' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setActor(client,req.user.id);
    const eq = await client.query("SELECT * FROM equipment WHERE id=$1 AND status<>'retired' AND available_quantity>0 FOR UPDATE", [req.body.equipmentId]);
    if (!eq.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'ไม่พบอุปกรณ์ที่พร้อมให้ยืม' }); }
    const quantity = Number(req.body.quantity);
    if (eq.rows[0].available_quantity < quantity) { await client.query('ROLLBACK'); return res.status(409).json({ message: `อุปกรณ์คงเหลือเพียง ${eq.rows[0].available_quantity} ชิ้น` }); }
    await client.query('UPDATE equipment SET available_quantity=available_quantity-$1,updated_at=NOW() WHERE id=$2', [quantity, req.body.equipmentId]);
    const { rows } = await client.query('INSERT INTO loans(user_id,equipment_id,quantity,original_quantity,due_at,borrow_remark,borrower_name) VALUES($1,$2,$3,$3,$4,$5,COALESCE($6,(SELECT full_name FROM users WHERE id=$1))) RETURNING *', [req.user.id,req.body.equipmentId,quantity,req.body.dueAt || null,cleanText(req.body.remark,500),cleanText(req.body.borrowerName,120)||null]);
    await client.query('COMMIT'); broadcast('loans'); res.status(201).json(rows[0]);
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/:id/return', authenticate, async (req, res, next) => {
  const requestId=req.body.requestId;
  if(requestId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId))return res.status(400).json({message:'รหัสคำขอไม่ถูกต้อง'});
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setActor(client,req.user.id);
    const payload={quantities:req.body.quantities??null,condition:req.body.condition??null,quantity:req.body.quantity??null,remark:cleanText(req.body.remark,500),inspectionId:req.body.inspectionId??null};
    if(requestId){
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[requestId]);
      const previous=await client.query('SELECT * FROM loan_return_requests WHERE request_id=$1',[requestId]);
      if(previous.rows[0]){
        const saved=previous.rows[0];
        const same=await client.query('SELECT $1::jsonb=$2::jsonb AS same',[JSON.stringify(saved.payload),JSON.stringify(payload)]);
        if(String(saved.actor_id)!==String(req.user.id)||String(saved.loan_id)!==String(req.params.id)||!same.rows[0].same){await client.query('ROLLBACK');return res.status(409).json({message:'คำขอนี้ถูกใช้แล้ว กรุณาเปิดหน้าคืนอุปกรณ์ใหม่'})}
        await client.query('COMMIT');return res.json(saved.result);
      }
    }
    const values = [req.params.id]; let ownership = '';
    if (req.user.role !== 'admin') { values.push(req.user.id); ownership = ' AND user_id=$2'; }
    const loan = await client.query(`SELECT * FROM loans WHERE id=$1 AND status='borrowed'${ownership} FOR UPDATE`, values);
    if (!loan.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'ไม่พบรายการยืมที่คืนได้' }); }
    const item = loan.rows[0];
    if(req.user.role!=='admin'&&item.pending_return){await client.query('ROLLBACK');return res.status(409).json({message:'รายการนี้รอเจ้าหน้าที่ตรวจรับแล้ว'})}
    if(req.user.role==='admin'&&String(item.pending_return?.id||'')!==String(req.body.inspectionId||'')){
      await client.query('ROLLBACK');return res.status(409).json({message:'คำขอคืนเปลี่ยนแปลงแล้ว กรุณาเปิดรายการใหม่'})
    }
    let parsed;
    try{parsed=parseReturn(req.body,item.quantity)}catch(error){await client.query('ROLLBACK');return res.status(400).json({message:error.message})}
    const {parts,total,remaining}=parsed;
    if(req.user.role!=='admin'){
      const pending={id:randomUUID(),quantities:Object.fromEntries(parts.map(part=>[part.condition,part.quantity])),quantity:total,remark:payload.remark,requestedBy:req.user.id,requestedAt:new Date().toISOString()};
      await client.query('UPDATE loans SET pending_return=$1,return_rejection=NULL,updated_at=NOW() WHERE id=$2',[JSON.stringify(pending),item.id]);
      const result={message:'ส่งคำขอคืนแล้ว รอเจ้าหน้าที่ตรวจรับ',status:'pending_return',requestedQuantity:total,remainingQuantity:item.quantity};
      if(requestId)await client.query('INSERT INTO loan_return_requests(request_id,loan_id,actor_id,payload,result) VALUES($1,$2,$3,$4,$5)',[requestId,item.id,req.user.id,JSON.stringify(payload),JSON.stringify(result)]);
      await client.query('COMMIT');broadcast('loans');return res.status(202).json(result);
    }
    if(item.pending_return)await client.query('UPDATE loans SET pending_return=NULL,return_rejection=NULL,updated_at=NOW() WHERE id=$1',[item.id]);
    await client.query('SELECT id FROM equipment WHERE id=$1 FOR UPDATE',[item.equipment_id]);
    if(remaining>0)await client.query('UPDATE loans SET quantity=$1,updated_at=NOW() WHERE id=$2',[remaining,item.id]);
    for(let index=0;index<parts.length;index++){
      const part=parts[index];
      if(remaining===0&&index===0){
        await client.query("UPDATE loans SET quantity=$1,status='returned',returned_at=NOW(),return_condition=$2,return_remark=$3,returned_by=$4,updated_at=NOW() WHERE id=$5",[part.quantity,part.condition,payload.remark,req.user.id,item.id]);
      }else{
        await client.query(`INSERT INTO loans(user_id,equipment_id,quantity,original_quantity,parent_loan_id,borrowed_at,due_at,status,borrow_remark,borrower_name,returned_at,return_condition,return_remark,returned_by)
          VALUES($1,$2,$3,$3,$4,$5,$6,'returned',$7,$8,NOW(),$9,$10,$11)`,[item.user_id,item.equipment_id,part.quantity,item.parent_loan_id||item.id,item.borrowed_at,item.due_at,item.borrow_remark,item.borrower_name,part.condition,payload.remark,req.user.id]);
      }
    }
    const normal=parts.find(part=>part.condition==='normal')?.quantity||0;
    const damaged=parts.filter(part=>['damaged','abnormal'].includes(part.condition)).reduce((sum,part)=>sum+part.quantity,0);
    await client.query("UPDATE equipment SET available_quantity=available_quantity+$1,maintenance_quantity=maintenance_quantity+$2,status=CASE WHEN status='retired' THEN status WHEN maintenance_quantity+$2>0 THEN 'maintenance'::equipment_status ELSE status END,updated_at=NOW() WHERE id=$3",[normal,damaged,item.equipment_id]);
    const result={message:'บันทึกการคืนเรียบร้อยแล้ว',returnedQuantity:total,remainingQuantity:remaining};
    if(requestId)await client.query('INSERT INTO loan_return_requests(request_id,loan_id,actor_id,payload,result) VALUES($1,$2,$3,$4,$5)',[requestId,item.id,req.user.id,JSON.stringify(payload),JSON.stringify(result)]);
    await client.query('COMMIT'); broadcast('loans'); res.json(result);
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/:id/return/reject', authenticate, adminOnly, async(req,res,next)=>{
  const reason=cleanText(req.body.reason,500);
  if(!reason)return res.status(400).json({message:'กรุณาระบุเหตุผลที่ส่งกลับ'});
  const client=await pool.connect();
  try{
    await client.query('BEGIN');await setActor(client,req.user.id);
    const {rows}=await client.query("SELECT * FROM loans WHERE id=$1 AND status='borrowed' FOR UPDATE",[req.params.id]);
    const item=rows[0];
    if(!item?.pending_return||item.pending_return.id!==req.body.inspectionId){await client.query('ROLLBACK');return res.status(409).json({message:'คำขอคืนเปลี่ยนแปลงแล้ว กรุณาเปิดรายการใหม่'})}
    await client.query('UPDATE loans SET pending_return=NULL,return_rejection=$1,updated_at=NOW() WHERE id=$2',[reason,item.id]);
    await client.query('COMMIT');broadcast('loans');res.json({message:'ส่งกลับให้ผู้ยืมแก้ไขแล้ว'});
  }catch(error){await client.query('ROLLBACK');next(error)}finally{client.release()}
});

router.post('/:id/repair', authenticate, adminOnly, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setActor(client,req.user.id);
    const loan = await client.query("SELECT * FROM loans WHERE id=$1 AND status='returned' AND return_condition IN ('damaged','abnormal') AND repaired_at IS NULL FOR UPDATE", [req.params.id]);
    if (!loan.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'ไม่พบรายการชำรุดที่รอซ่อม หรือรายการนี้เสร็จสิ้นแล้ว' }); }
    const item = loan.rows[0];
    const equipment = await client.query('SELECT * FROM equipment WHERE id=$1 FOR UPDATE', [item.equipment_id]);
    if (!equipment.rows[0] || equipment.rows[0].maintenance_quantity < item.quantity) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'จำนวนอุปกรณ์รอซ่อมไม่ตรงกับรายการ กรุณาตรวจสอบข้อมูล' });
    }
    await client.query("UPDATE equipment SET maintenance_quantity=maintenance_quantity-$1,available_quantity=available_quantity+$1,status=CASE WHEN maintenance_quantity-$1=0 THEN 'available'::equipment_status ELSE 'maintenance'::equipment_status END,updated_at=NOW() WHERE id=$2", [item.quantity,item.equipment_id]);
    await client.query('UPDATE loans SET repaired_at=NOW(),repaired_by=$2,updated_at=NOW() WHERE id=$1', [item.id,req.user.id]);
    await client.query('COMMIT');
    broadcast('loans');
    res.json({ message: `ซ่อมเสร็จแล้ว ${item.quantity} ชิ้น และพร้อมให้ยืม` });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.put('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { rows } = await auditedQuery(req.user.id,'UPDATE loans SET due_at=$1,borrow_remark=$2,updated_at=NOW() WHERE id=$3 RETURNING *', [req.body.dueAt || null,cleanText(req.body.remark,500),req.params.id]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'ไม่พบรายการยืม' });
    }
    broadcast('loans');
    return res.json(rows[0]);
  } catch (error) { next(error); }
});
module.exports = router;

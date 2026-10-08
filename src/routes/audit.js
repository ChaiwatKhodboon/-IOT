const express=require('express');
const pool=require('../db');
const {authenticate,adminOnly}=require('../middleware/auth');
const router=express.Router();
router.get('/',authenticate,adminOnly,async(req,res,next)=>{
  try{
    const search=String(req.query.search||'').trim().slice(0,120);
    const type=['loans','equipment','users'].includes(req.query.type)?req.query.type:'';
    const before=/^\d+$/.test(String(req.query.before||''))?req.query.before:null;
    const role=['admin','user'].includes(req.query.role)?req.query.role:'';
    const {rows}=await pool.query(`WITH enriched AS (
      SELECT a.*,actor.role AS actor_role,COALESCE(a.after_data,a.before_data) AS data,
        COALESCE(a.after_data->>'name',a.before_data->>'name',e.name,history.data->>'name') AS equipment_name,
        COALESCE(a.after_data->>'code',a.before_data->>'code',e.code,history.data->>'code') AS equipment_code,
        COALESCE(a.after_data->>'borrower_name',a.before_data->>'borrower_name',borrower.full_name) AS borrower_name,
        COALESCE(a.after_data->>'full_name',a.before_data->>'full_name') AS account_name
      FROM audit_logs a
      LEFT JOIN users actor ON actor.id=a.actor_id
      LEFT JOIN equipment e ON a.entity_type='loans' AND e.id::text=COALESCE(a.after_data->>'equipment_id',a.before_data->>'equipment_id')
      LEFT JOIN users borrower ON a.entity_type='loans' AND borrower.id::text=COALESCE(a.after_data->>'user_id',a.before_data->>'user_id')
      LEFT JOIN LATERAL (SELECT COALESCE(h.after_data,h.before_data) AS data FROM audit_logs h
        WHERE a.entity_type='loans' AND h.entity_type='equipment' AND h.entity_id::text=COALESCE(a.after_data->>'equipment_id',a.before_data->>'equipment_id')
        ORDER BY h.id DESC LIMIT 1) history ON true
    ), page AS (
      SELECT * FROM enriched WHERE ($1='' OR actor_name ILIKE '%'||$1||'%' OR entity_id::text=$1
        OR equipment_name ILIKE '%'||$1||'%' OR equipment_code ILIKE '%'||$1||'%'
        OR borrower_name ILIKE '%'||$1||'%' OR account_name ILIKE '%'||$1||'%'
        OR data->>'username' ILIKE '%'||$1||'%')
      AND ($2='' OR entity_type=$2) AND ($3::bigint IS NULL OR id<$3::bigint)
      AND ($4::text='' OR actor_role::text=$4::text) ORDER BY id DESC LIMIT 51
    ) SELECT p.id,p.actor_id AS "actorId",p.actor_name AS "actorName",p.entity_type AS "entityType",p.entity_id AS "entityId",p.action,
      p.before_data AS "beforeData",p.after_data AS "afterData",p.created_at AS "createdAt",p.actor_role AS "actorRole",
      p.equipment_name AS "equipmentName",p.equipment_code AS "equipmentCode",p.borrower_name AS "borrowerName",p.account_name AS "accountName",
      COALESCE((SELECT jsonb_object_agg(u.id::text,u.full_name) FROM users u WHERE u.id::text IN
        (p.before_data->>'user_id',p.after_data->>'user_id',p.before_data->>'returned_by',p.after_data->>'returned_by',p.before_data->>'repaired_by',p.after_data->>'repaired_by')),'{}'::jsonb) AS "personNames",
      COALESCE((SELECT jsonb_agg(jsonb_build_object('action',r.action,'quantity',r.after_data->'quantity','condition',r.after_data->>'return_condition','loanId',r.entity_id,'borrowerName',COALESCE(r.after_data->>'borrower_name',ru.full_name)))
        FROM audit_logs r LEFT JOIN users ru ON ru.id::text=r.after_data->>'user_id'
        WHERE p.entity_type='equipment' AND r.entity_type='loans' AND r.created_at=p.created_at
        AND r.actor_id IS NOT DISTINCT FROM p.actor_id AND r.after_data->>'equipment_id'=p.entity_id::text
        AND r.action IN ('return','borrow','repair')),'[]'::jsonb) AS "relatedActions"
    FROM page p ORDER BY p.id DESC`,[search,type,before,role]);
    const items=rows.slice(0,50);
    res.json({items,nextCursor:rows.length>50?items.at(-1).id:null});
  }catch(error){next(error)}
});
module.exports=router;

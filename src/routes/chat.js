const express = require('express');
const { authenticate } = require('../middleware/auth');

function createChatRouter({ pool, broadcast }) {
  const router = express.Router();
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.use(authenticate);
  router.use(async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT id,role FROM users WHERE id=$1 AND active=TRUE', [req.user.id]);
      if (!rows[0]) return res.status(401).json({ message: 'บัญชีนี้ไม่สามารถใช้งานได้' });
      req.user.role = rows[0].role;
      next();
    } catch (error) { next(error); }
  });
  router.get('/rooms', async (req, res, next) => {
    try {
      if (req.user.role !== 'admin') {
        await pool.query('INSERT INTO chat_rooms(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING', [req.user.id]);
      }
      const { rows } = await pool.query(`SELECT r.id,u.full_name AS "fullName",u.username,
        last.body AS "lastMessage",last.created_at AS "lastAt",
        (SELECT COUNT(*)::int FROM chat_messages m WHERE m.room_id=r.id
          AND m.sender_role<>$2 AND m.id>CASE WHEN $2='admin' THEN r.admin_read_id ELSE r.user_read_id END) AS unread
        FROM chat_rooms r JOIN users u ON u.id=r.user_id
        LEFT JOIN LATERAL (SELECT body,created_at FROM chat_messages WHERE room_id=r.id ORDER BY id DESC LIMIT 1) last ON TRUE
        WHERE ($2='admin' OR r.user_id=$1) AND ($2<>'admin' OR last.created_at IS NOT NULL)
        ORDER BY last.created_at DESC NULLS LAST,r.id DESC`, [req.user.id, req.user.role]);
      res.json(rows);
    } catch (error) { next(error); }
  });
  router.use('/:roomId', async (req, res, next) => {
    try {
      const id = Number(req.params.roomId);
      if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) return res.status(400).json({ message: 'ห้องสนทนาไม่ถูกต้อง' });
      const { rows } = await pool.query('SELECT id FROM chat_rooms WHERE id=$1 AND ($2=\'admin\' OR user_id=$3)', [id, req.user.role, req.user.id]);
      if (!rows[0]) return res.status(404).json({ message: 'ไม่พบห้องสนทนา' });
      req.chatRoomId = id;
      next();
    } catch (error) { next(error); }
  });
  router.get('/:roomId/messages', async (req, res, next) => {
    try {
      const before = req.query.before === undefined ? 2147483647 : Number(req.query.before);
      if (!Number.isSafeInteger(before) || before < 1 || before > 2147483647) return res.status(400).json({ message: 'ห้องสนทนาไม่ถูกต้อง' });
      const { rows } = await pool.query(`SELECT m.id,m.body,m.sender_role AS "senderRole",
        u.full_name AS "senderName",m.created_at AS "createdAt"
        FROM chat_messages m JOIN users u ON u.id=m.sender_id
        WHERE m.room_id=$1 AND m.id<$2 ORDER BY m.id DESC LIMIT 50`, [req.chatRoomId, before]);
      res.json({ messages: rows.reverse(), hasMore: rows.length === 50 });
    } catch (error) { next(error); }
  });
  router.post('/:roomId/messages', async (req, res, next) => {
    try {
      const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
      if (!body || [...body].length > 2000) return res.status(400).json({ message: 'กรุณากรอกข้อความไม่เกิน 2,000 ตัวอักษร' });
      const { rows } = await pool.query(`INSERT INTO chat_messages(room_id,sender_id,sender_role,body)
        VALUES($1,$2,$3,$4) RETURNING id,body,sender_role AS "senderRole",created_at AS "createdAt"`,
      [req.chatRoomId, req.user.id, req.user.role, body]);
      // Public change events contain no message, sender or room identifiers.
      broadcast('chat');
      res.status(201).json(rows[0]);
    } catch (error) { next(error); }
  });
  router.post('/:roomId/read', async (req, res, next) => {
    try {
      const messageId = Number(req.body.messageId);
      if (!Number.isSafeInteger(messageId) || messageId < 1 || messageId > 2147483647) return res.status(400).json({ message: 'ข้อความไม่ถูกต้อง' });
      const column = req.user.role === 'admin' ? 'admin_read_id' : 'user_read_id';
      await pool.query(`UPDATE chat_rooms SET ${column}=GREATEST(${column},$2)
        WHERE id=$1 AND EXISTS(SELECT 1 FROM chat_messages WHERE room_id=$1 AND id=$2)`, [req.chatRoomId, messageId]);
      res.sendStatus(204);
    } catch (error) { next(error); }
  });
  return router;
}
module.exports = { createChatRouter };

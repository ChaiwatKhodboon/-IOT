const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const express=require('express');
const jwt=require('jsonwebtoken');
const {createChatRouter}=require('../src/routes/chat');
const {jwtSecret}=require('../src/config');

test('chat persists messages, isolates rooms, counts unread and paginates history', {skip:process.env.DB_INTEGRATION!=='1'}, async t=>{
  const pool=require('../src/db'),client=await pool.connect();
  t.after(async()=>{await client.query('ROLLBACK');client.release();await pool.end()});
  await client.query('BEGIN');
  await client.query(`CREATE TEMP TABLE users(id INTEGER PRIMARY KEY,username TEXT,full_name TEXT,role TEXT,active BOOLEAN);
    INSERT INTO users VALUES(1,'member','Member','user',TRUE),(2,'staff','Staff','admin',TRUE),(3,'other','Other','user',TRUE)`);
  const migration=fs.readFileSync('database/migrations/013_admin_chat.sql','utf8').replaceAll('CREATE TABLE IF NOT EXISTS','CREATE TEMP TABLE IF NOT EXISTS');
  await client.query(migration);
  const notifications=[];
  const app=express();app.use(express.json());
  app.use('/chat',createChatRouter({pool:{query:(...args)=>client.query(...args)},broadcast:type=>notifications.push(type)}));
  app.use((error,req,res,next)=>res.status(500).json({message:error.message}));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const tokens=[null,...[1,2,3].map(id=>jwt.sign({id,role:id===2?'admin':'user'},jwtSecret,{expiresIn:'1h'}))];
  async function api(path,actor=1,method='GET',body){
    const response=await fetch(`http://127.0.0.1:${server.address().port}/chat${path}`,{method,
      headers:{'Content-Type':'application/json',...(tokens[actor]?{Authorization:`Bearer ${tokens[actor]}`}:{})},body:body?JSON.stringify(body):undefined});
    return {status:response.status,data:response.status===204?null:await response.json()};
  }
  assert.equal((await api('/rooms',0)).status,401);
  const room=(await api('/rooms')).data[0].id;
  assert.equal((await api('/rooms')).data.length,1,'one room per member');
  const otherRoom=(await api('/rooms',3)).data[0].id;
  for(const [path,method,body] of [[`/${room}/messages`,'GET'],[`/${room}/messages`,'POST',{body:'unauthorized'}],[`/${room}/read`,'POST',{messageId:1}]]){
    assert.equal((await api(path,3,method,body)).status,404);
  }
  assert.equal((await api('/oops/messages')).status,400);
  for(const body of ['', ' '.repeat(10),'a'.repeat(2001),123])assert.equal((await api(`/${room}/messages`,1,'POST',{body})).status,400);
  const sent=await api(`/${room}/messages`,1,'POST',{body:' <script>alert(1)</script> สวัสดี '});
  assert.equal(sent.status,201);assert.equal(sent.data.body,'<script>alert(1)</script> สวัสดี');
  assert.deepEqual(notifications,['chat'],'change notifications carry no private content');
  assert.equal((await api('/rooms',2)).data.find(r=>r.id===room).unread,1);
  assert.equal((await api('/rooms',3)).data[0].unread,0);
  assert.equal((await api(`/${room}/messages`,2)).data.messages[0].body,sent.data.body);
  const reply=(await api(`/${room}/messages`,2,'POST',{body:'ตอบกลับจากแอดมิน'})).data;
  assert.equal((await api('/rooms')).data[0].unread,1);
  await api(`/${room}/read`,2,'POST',{messageId:sent.data.id});
  assert.equal((await api('/rooms',2)).data.find(r=>r.id===room).unread,0);
  await api(`/${room}/read`,1,'POST',{messageId:reply.id});
  assert.equal((await api('/rooms')).data[0].unread,0);
  await client.query(`INSERT INTO chat_messages(room_id,sender_id,sender_role,body)
    SELECT $1,2,'admin','History '||n FROM generate_series(1,55) n`,[room]);
  const latest=(await api(`/${room}/messages`)).data;
  assert.equal(latest.messages.length,50);assert.equal(latest.hasMore,true);
  const older=(await api(`/${room}/messages?before=${latest.messages[0].id}`)).data;
  assert.equal(older.messages.length,7);assert.equal(older.hasMore,false);
  assert.ok(older.messages.at(-1).id<latest.messages[0].id);
  // Reading an old page cannot move the cursor backward; reading does not consume newer unseen messages.
  await api(`/${room}/read`,1,'POST',{messageId:latest.messages.at(-1).id});
  await api(`/${room}/read`,1,'POST',{messageId:sent.data.id});
  assert.equal((await api('/rooms')).data[0].unread,0);
  const otherMessage=(await api(`/${otherRoom}/messages`,3,'POST',{body:'private'})).data;
  await api(`/${room}/read`,1,'POST',{messageId:otherMessage.id});
  const newMessage=(await api(`/${room}/messages`,2,'POST',{body:'new'})).data;
  assert.equal((await api('/rooms')).data[0].unread,1);
  assert.ok(newMessage.id>reply.id);
  assert.equal((await api(`/${room}/messages?before=NaN`)).status,400);
  assert.equal((await api(`/${room}/read`,1,'POST',{messageId:-1})).status,400);
  await client.query('UPDATE users SET active=FALSE WHERE id=1');
  assert.equal((await api('/rooms')).status,401);
  // DB role overrides stale token claims.
  await client.query("UPDATE users SET role='user' WHERE id=2");
  assert.equal((await api(`/${room}/messages`,2)).status,404);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const { createGoogleVerifier } = require('../src/google-identity');
const { createGoogleAuthRouter } = require('../src/routes/google-auth');

const audience = 'test-client.apps.googleusercontent.com';
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' };
let keyRequests = 0;
const verify = createGoogleVerifier({ fetchKeys: async () => {
  keyRequests++;
  return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'cache-control': 'max-age=3600' } });
} });
const sign = (claims = {}, options = {}) => jwt.sign({
  sub: 'google-123', email: 'person@gmail.com', email_verified: true,
  name: 'ชื่อทดสอบ', ...claims
}, privateKey, { algorithm: 'RS256', keyid: 'test-key', issuer: 'https://accounts.google.com', audience, expiresIn: '5m', ...options });

test('Google signature verifier rejects forged, wrong-audience, expired, wrong-issuer and unverified tokens', async () => {
  assert.equal((await verify(sign(), audience)).sub, 'google-123');
  const before = keyRequests;
  await verify(sign(), audience);
  assert.equal(keyRequests, before, 'Google public keys are cached');
  const otherKey = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  const forged = jwt.sign({ sub: 'attacker' }, otherKey, { algorithm: 'RS256', keyid: 'test-key', audience, issuer: 'https://accounts.google.com', expiresIn: '5m' });
  for (const token of [forged, sign({}, { audience: 'other-app' }), sign({}, { expiresIn: '-1s' }), sign({}, { issuer: 'https://attacker.test' }), sign({ email_verified: false }), sign({ sub: '' }), 'not-a-token', jwt.sign({ sub:'attacker' }, 'fake', { algorithm:'HS256' })]) {
    await assert.rejects(verify(token, audience));
  }
});

async function fixture(t, initial = [], enabled = true) {
  const users = structuredClone(initial), queries = [];
  const client = {
    async query(sql, params = []) {
      queries.push(sql);
      if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) return { rows: [] };
      if (sql.startsWith('SELECT * FROM users WHERE google_sub')) return { rows: users.filter(u => u.google_sub === params[0]) };
      if (sql.startsWith('SELECT * FROM users WHERE LOWER(email)')) return { rows: users.filter(u => u.email.toLowerCase() === params[0]) };
      if (sql.startsWith('UPDATE users SET google_sub')) { users.find(u=>u.id===params[1]).google_sub=params[0]; return { rows: [] }; }
      if (sql.startsWith('INSERT INTO users')) {
        const user = { id: 99, username: params[0], email: params[1], password_hash: params[2], full_name: params[3], google_sub: params[4], role: 'user', active: true };
        users.push(user); return { rows: [user] };
      }
      throw new Error('Unexpected query: '+sql);
    }, release() {}
  };
  const app = express(); app.use(express.json());
  app.use('/api/auth', createGoogleAuthRouter({ pool: { connect:async()=>client }, clientId: enabled ? audience : '', secret: 'local-test-signing-secret', verify }));
  app.use((error,req,res,next)=>res.status(500).json({ message:error.message }));
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const base='http://127.0.0.1:'+server.address().port;
  const config=await fetch(base+'/api/auth/google/config');
  const cookie=config.headers.get('set-cookie')?.split(';')[0] || '';
  const data=await config.json();
  const credential=sign({ nonce:data.nonce });
  const post=async(body={credential}, headers={})=>{
    const r=await fetch(base+'/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie,...headers},body:JSON.stringify(body)});
    return { status:r.status, data:await r.json(), cookie:r.headers.get('set-cookie') };
  };
  return {post,users,queries,credential,nonce:data.nonce,config:data};
}

test('new Google account receives user role and unpredictable unusable password; returns existing login contract', async t=>{
  const f=await fixture(t);
  const r=await f.post();
  assert.equal(r.status,200); assert.equal(r.data.user.role,'user');
  assert.equal(f.users.length,1); assert.equal(f.users[0].google_sub,'google-123');
  assert.ok(f.users[0].password_hash.startsWith('$2'));
  assert.equal(jwt.verify(r.data.token,'local-test-signing-secret').role,'user');
  assert.match(r.cookie,/Expires=Thu, 01 Jan 1970/);
});
test('missing cookie, wrong nonce, forged token and cross-site request cannot access the database',async t=>{
  const f=await fixture(t);
  assert.equal((await f.post({credential:f.credential},{Cookie:''})).status,401);
  assert.equal((await f.post({credential:sign({nonce:'wrong'})})).status,401);
  assert.equal((await f.post({credential:'fake'})).status,401);
  assert.equal((await f.post({credential:f.credential},{'sec-fetch-site':'cross-site'})).status,403);
  assert.equal(f.queries.length,0);
});
test('existing account requires correct local password before linking and retains its role/history ID',async t=>{
  const user={id:7,username:'existing',email:'person@gmail.com',full_name:'Existing',active:true,role:'admin',password_hash:await bcrypt.hash('existing-password',4)};
  const f=await fixture(t,[user]);
  assert.equal((await f.post()).data.linkingRequired,true);
  assert.equal(f.users[0].google_sub,undefined);
  assert.equal((await f.post({credential:f.credential,password:'wrong'})).status,401);
  const r=await f.post({credential:f.credential,password:'existing-password'});
  assert.equal(r.data.user.id,7); assert.equal(r.data.user.role,'admin');
  assert.equal(f.users.length,1); assert.equal(f.users[0].google_sub,'google-123');
});
test('linked subject is stable even when Google email changes',async t=>{
  const f=await fixture(t,[{id:8,username:'linked',email:'old@gmail.com',active:true,role:'user',google_sub:'google-123'}]);
  const r=await f.post();
  assert.equal(r.data.user.id,8); assert.equal(f.users.length,1);
});
test('disabled users cannot sign in or link Google',async t=>{
  for(const linked of [true,false]) {
    const f=await fixture(t,[{id:8,email:'person@gmail.com',active:false,role:'user',google_sub:linked?'google-123':null}]);
    assert.equal((await f.post()).status,403);
    assert.ok(!f.queries.includes('COMMIT'));
  }
});
test('cannot replace another Google subject already linked to an email',async t=>{
  const f=await fixture(t,[{id:8,email:'person@gmail.com',active:true,role:'user',google_sub:'someone-else'}]);
  assert.equal((await f.post()).status,409);
  assert.equal(f.users[0].google_sub,'someone-else');
});
test('new third-party email requires local signup; Workspace email can register',async t=>{
  const f=await fixture(t);
  assert.equal((await f.post({credential:sign({nonce:f.nonce,email:'person@example.org'})})).status,403);
  assert.equal(f.users.length,0);
  assert.equal((await f.post({credential:sign({nonce:f.nonce,email:'person@university.ac.th',hd:'university.ac.th'})})).status,200);
});
test('unconfigured Google login is disabled without querying users',async t=>{
  const f=await fixture(t,[],false);
  assert.equal(f.config.enabled,false);
  assert.equal((await f.post()).status,503);
  assert.equal(f.queries.length,0);
});
test('repeated login failures are rate limited',async t=>{
  const f=await fixture(t);
  for(let i=0;i<20;i++) assert.equal((await f.post({credential:'bad'})).status,401);
  assert.equal((await f.post({credential:'bad'})).status,429);
});

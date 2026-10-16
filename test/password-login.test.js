const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../src/db');
const router = require('../src/routes/auth');
const { jwtSecret } = require('../src/config');

const login = router.stack.find(layer => layer.route?.path === '/login').route.stack[0].handle;

test('password login accepts username and a 254-character email, and rejects invalid credentials', async t => {
  const email = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`;
  assert.equal(email.length, 254);
  const user = { id: 7, username: 'member', email, active: true,
    password_hash: await bcrypt.hash('test-password', 4), full_name: 'Test Member', role: 'user' };
  const originalQuery = pool.query;
  t.after(() => { pool.query = originalQuery; });
  pool.query = async (sql, [identifier]) => {
    assert.match(sql, /LOWER\(username\)=\$1 OR LOWER\(COALESCE\(email/);
    assert.match(sql, /active=TRUE/);
    return { rows: user.active && [user.username, user.email].includes(identifier) ? [user] : [] };
  };
  async function attempt(username, password = 'test-password') {
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; } };
    await login({ body: { username, password } }, response, error => { throw error; });
    return response;
  }
  for (const identifier of ['member', ' MEMBER ', email, ` ${email.toUpperCase()} `]) {
    const response = await attempt(identifier);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.user.id, user.id);
    assert.equal(jwt.verify(response.body.token, jwtSecret).id, user.id);
    assert.equal(response.body.user.password_hash, undefined);
  }
  for (const [identifier, password] of [['member', 'wrong-password'], ['missing', 'test-password'], ['', '']]) {
    const response = await attempt(identifier, password);
    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
  }
  user.active = false;
  assert.equal((await attempt(email)).statusCode, 401);
});

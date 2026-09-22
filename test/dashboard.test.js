const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../public/app.js'), 'utf8');
const dashboardSource = source.slice(source.indexOf('async function dashboard()'), source.indexOf('async function borrow()'));

async function render(role, recent = [], extras = {}) {
  const content = { innerHTML: '' }, requests = [];
  const context = vm.createContext({
    state: { user: { role } }, $: () => content,
    api: async path => {
      requests.push(path);
      return path === '/dashboard'
        ? { total: 162, available: 140, borrowedQuantity: 18, activeLoans: 0, maintenance: 4, lost: 0, retired: 0, ...extras }
        : recent;
    },
    loanCard: loan => `<article>${loan.status}</article>`, date: value => value
  });
  vm.runInContext(dashboardSource, context);
  await context.dashboard();
  return { html: content.innerHTML, requests };
}

test('user overview shows all 18 borrowed units even when the user has no active loans', async () => {
  const { html, requests } = await render('user');
  assert.match(html, /<strong>18<\/strong><span>ถูกยืมอยู่/);
  assert.match(html, /ความเคลื่อนไหวล่าสุดของฉัน/);
  assert.match(html, /ยังไม่มีประวัติการยืม–คืน/);
  assert.deepEqual(requests, ['/dashboard', '/loans?sort=recent']);
});

test('recent activity includes returned loans and their return date', async () => {
  const { html } = await render('admin', [{ status: 'returned', borrowedAt: '2026-09-01', returnedAt: '2026-09-22' }]);
  assert.match(html, /<article>returned<\/article>/);
  assert.match(html, /คืนเมื่อ 2026-09-22/);
  assert.doesNotMatch(html, /ล่าสุดของฉัน/);
});

test('lost and retired units are visible when present', async () => {
  const { html } = await render('user', [], { lost: 2, retired: 3 });
  assert.match(html, /<strong>2<\/strong><span>สูญหาย/);
  assert.match(html, /<strong>3<\/strong><span>เลิกใช้งาน/);
});

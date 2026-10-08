const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../public/returns-audit.js'),'utf8');
const context=vm.createContext({Intl,Date,I18n:{language:()=> 'th'},t:value=>value,labels:{normal:'ปกติ'},txt:{borrowed:'กำลังยืม',returned:'คืนแล้ว'},esc:value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))});
vm.runInContext(source.slice(source.indexOf('  const actionLabels='),source.indexOf('  window.audit='))+'\nthis.render=renderAuditCard;this.format=auditValue;',context);
test('audit displays names, stock reason and Bangkok time',()=>{
  const html=context.render({entityType:'equipment',entityId:4,action:'update',actorName:'สมชาย',equipmentName:'DHT22',equipmentCode:'IOT-1',createdAt:'2026-09-28T16:27:07Z',beforeData:{available_quantity:3},afterData:{available_quantity:4},relatedActions:[{action:'return',quantity:1,condition:'normal',loanId:18,borrowerName:'สมหญิง'}]});
  for(const value of ['สมชาย','สมหญิง','DHT22','IOT-1','ปรับสต็อกจากการคืน','3 ชิ้น','4 ชิ้น','28 กันยายน 2569 เวลา 23:27:07 น.'])assert.ok(html.includes(value),value);
});
test('unknown reasons remain edits and content is escaped',()=>{
  const html=context.render({entityType:'equipment',entityId:4,action:'update',actorName:'<script>',equipmentName:'<img src=x>',createdAt:'2026-09-28T00:00:00Z',beforeData:{available_quantity:3},afterData:{available_quantity:4}});
  assert.ok(html.includes('แก้ไขข้อมูล'));assert.ok(!html.includes('ปรับสต็อกจากการคืน'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;img'));
});
test('status, person IDs and dates are readable',()=>{
  assert.equal(context.format('status','returned',{}),'คืนแล้ว');
  assert.equal(context.format('returned_by',2,{personNames:{2:'สมชาย'}}),'สมชาย (#2)');
  assert.match(context.format('due_at','2026-09-28T17:00:00Z',{}),/29 กันยายน 2569 เวลา 00:00:00/);
});
test('audit explains stock changes and identifies actor role without guessing',()=>{
  const item={entityType:'equipment',entityId:4,action:'update',actorName:'สมชาย',actorRole:'admin',equipmentName:'DHT22',createdAt:'2026-09-28T00:00:00Z',beforeData:{available_quantity:3},afterData:{available_quantity:4}};
  const html=context.render(item);
  assert.ok(html.includes('ผู้ดูแลระบบ'));assert.ok(html.includes('จำนวนที่ยืมได้เพิ่มขึ้น 1 ชิ้น'));
  assert.ok(context.render({...item,actorRole:null}).includes('ไม่ระบุ (รายการเดิม)'));
});
test('audit distinguishes return submissions from rejection and escapes the reason',()=>{
  const item={entityType:'loans',entityId:8,action:'update',actorName:'สมชาย',actorRole:'user',equipmentName:'DHT22',createdAt:'2026-09-28T00:00:00Z',beforeData:{pending_return:null},afterData:{pending_return:{quantity:2,requestedAt:'2026-09-28T00:00:00Z',remark:'พร้อมคืน'}}};
  assert.ok(context.render(item).includes('ส่งคำขอคืนอุปกรณ์'));
  const rejected=context.render({...item,afterData:{pending_return:null,return_rejection:'<script>เหตุผล</script>'}});
  assert.ok(rejected.includes('ส่งคำขอคืนกลับให้แก้ไข'));assert.ok(rejected.includes('&lt;script&gt;'));assert.ok(!rejected.includes('<script>'));
});

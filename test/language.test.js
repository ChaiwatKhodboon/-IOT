const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function setup(language='th'){
  let preference=JSON.stringify({language}),observer;
  const elements=[],texts=[];
  function element(attributes={},ignored=false){
    const node={nodeType:1,isConnected:true,dataset:{},textContent:'',
      closest:()=>ignored?node:null,matches:selector=>selector==='time[data-date]'&&!!node.dataset.date,
      getAttribute:name=>attributes[name]??null,setAttribute:(name,value)=>attributes[name]=value,
      querySelectorAll:()=>[],attributes};
    elements.push(node);return node;
  }
  const body=element();body.querySelectorAll=()=>elements.filter(node=>node!==body);
  const document={body,documentElement:{},createTreeWalker(root){
    const children=texts.filter(node=>root===body||node.parentElement===root);let index=0;
    return {nextNode:()=>children[index++]};
  }};
  const window={addEventListener(){},dispatchEvent(){},showNotification:value=>value};
  const context=vm.createContext({window,document,localStorage:{getItem:()=>preference},Intl,Date,Event,
    Node:{TEXT_NODE:3,ELEMENT_NODE:1},NodeFilter:{SHOW_TEXT:4},
    MutationObserver:class{constructor(callback){observer=callback}observe(){}}});
  vm.runInContext(fs.readFileSync(require.resolve('../public/language.js'),'utf8'),context);
  return {window,document,element,translate:window.I18n.translate,
    text(value,parent=element()){const node={nodeType:3,isConnected:true,nodeValue:value,parentElement:parent};texts.push(node);return node},
    change(value){preference=JSON.stringify({language:value});window.applyLanguage()},
    mutate(node,type='characterData'){observer([{type,target:node,addedNodes:[]}])}
  };
}

test('translates decorated labels, dynamic counters and server errors without substring substitution',()=>{
  const {translate:t}=setup('en');
  assert.equal(t('✓ เพิ่มแล้ว · 3 ชิ้น'),'✓ Added · 3 units');
  assert.equal(t(' · ชำรุด 3 ชิ้น · ยืมได้ 1 ชิ้น'),' · 3 damaged units · 1 available units');
  assert.equal(t('เซ็นเซอร์: ✓ เพิ่มแล้ว · 2 ชิ้น — เพิ่มอีก 1 ชิ้น'),'เซ็นเซอร์: ✓ Added · 2 units — Add one more unit');
  assert.equal(t('⚠ มีรายการเกินกำหนด 12 รายการ'),'⚠ 12 overdue loans');
  assert.equal(t('ประวัติทั้งหมด 10 รายการ · กำลังยืม 3 · เกินกำหนด 2'),'10 history records · 3 on loan · 2 overdue');
  assert.equal(t('ซ่อมเสร็จแล้ว 2 ชิ้น และพร้อมให้ยืม'),'2 units repaired and available');
  assert.equal(t('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'),'Incorrect username or password');
  assert.equal(t('เซ็นเซอร์ชำรุดของสมชาย'),'เซ็นเซอร์ชำรุดของสมชาย');
});

test('language switches restore Thai and preserve updates made to existing text nodes',()=>{
  const app=setup();const node=app.text('กำลังบันทึก...');
  app.change('en');assert.equal(node.nodeValue,'Saving...');
  node.nodeValue='บันทึกข้อมูลเรียบร้อยแล้ว';app.mutate(node);
  assert.equal(node.nodeValue,'Details saved');
  app.change('th');assert.equal(node.nodeValue,'บันทึกข้อมูลเรียบร้อยแล้ว');
  node.nodeValue='กำลังส่ง...';app.mutate(node);
  app.change('en');assert.equal(node.nodeValue,'Sending...');
  app.mutate(node);assert.equal(node.nodeValue,'Sending...');
});

test('new root attributes and changed accessible labels follow the language',()=>{
  const app=setup('en');const button=app.element({'aria-label':'แสดงรหัสผ่าน',title:'แก้ไขชื่อผู้ใช้'});
  app.window.I18n.apply(button);
  assert.equal(button.attributes['aria-label'],'Show password');
  button.setAttribute('aria-label','ซ่อนรหัสผ่าน');app.mutate(button,'attributes');
  assert.equal(button.attributes['aria-label'],'Hide password');
  app.change('th');assert.equal(button.attributes['aria-label'],'ซ่อนรหัสผ่าน');
  assert.equal(button.attributes.title,'แก้ไขชื่อผู้ใช้');
});

test('user content marked as untranslatable is preserved even when it matches a UI label',()=>{
  const app=setup();const node=app.text('ผู้ดูแลระบบ',app.element({},true));
  app.change('en');assert.equal(node.nodeValue,'ผู้ดูแลระบบ');
  app.change('th');assert.equal(node.nodeValue,'ผู้ดูแลระบบ');
});

test('dates, document language, in-app confirmation and original English labels switch both ways',()=>{
  const app=setup();const time=app.element();time.dataset.date='2026-09-24T12:00:00Z';
  const node=app.text('ACCOUNT MANAGEMENT');app.change('th');
  assert.equal(node.nodeValue,'จัดการบัญชี');assert.match(time.textContent,/2569/);
  app.change('en');assert.equal(node.nodeValue,'ACCOUNT MANAGEMENT');
  assert.match(time.textContent,/2026/);assert.equal(app.document.documentElement.lang,'en');
  assert.equal(app.window.confirmLocalized('ยืนยันการลบอุปกรณ์รายการนี้?'),'Delete this equipment?');
  app.change('th');assert.match(time.textContent,/2569/);
});

test('API messages have English translations',()=>{
  const app=setup('en');
  const paths=['src/routes/auth.js','src/routes/equipment.js','src/routes/loans.js','src/routes/users.js','src/routes/google-auth.js','src/middleware/auth.js','src/utils/validation.js','src/app.js'];
  for(const path of paths){
    const source=fs.readFileSync(path,'utf8');
    for(const match of source.matchAll(/(?:message|error):\s*'([^']*[ก-๙][^']*)'/g)){
      assert.doesNotMatch(app.translate(match[1]),/[ก-๙]/,`${path}: ${match[1]}`);
    }
  }
});

test('static UI labels and placeholders have English translations',()=>{
  const app=setup('en');
  for(const path of ['public/index.html','public/app.js','public/admin-ui.js','public/management-ui.js','public/auth-pages.js','public/google-login.js']){
    const source=fs.readFileSync(path,'utf8');
    const strings=[...source.matchAll(/(['"])([^'"\r\n]*[ก-๙][^'"\r\n]*)\1/g)].map(match=>match[2]);
    const labels=[...source.matchAll(/>([^<>\r\n]*[ก-๙][^<>\r\n]*)</g)].map(match=>match[1].trim());
    for(const value of [...strings,...labels]){
      if(/[<>{}`]/.test(value))continue;
      assert.doesNotMatch(app.translate(value),/[ก-๙]/,`${path}: ${value}`);
    }
  }
});

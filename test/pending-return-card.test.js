const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const app=fs.readFileSync(require.resolve('../public/app.js'),'utf8');
const cardSource=app.match(/^function loanCard\(.*$/m)?.[0];
const pendingSource=fs.readFileSync(require.resolve('../public/returns-audit.js'),'utf8');
const setup=pendingSource.slice(0,pendingSource.indexOf('  const baseAdminCards='))+'})();';

test('pending return card shows one status badge and a full-width notice',()=>{
  const context=vm.createContext({
    window:{},state:{user:{role:'user'}},
    txt:{borrowed:'กำลังยืม',pending_return:'รอตรวจรับ'},
    I18n:{translate:value=>value},
    esc:value=>String(value??''),date:value=>String(value??''),equipmentArt:()=>''
  });
  vm.runInContext(cardSource+';window.loanCard=loanCard;',context);
  vm.runInContext(setup,context);
  const loan={id:16,rootLoanId:16,equipmentCode:'IOT-SEN-001',equipmentName:'DHT22',quantity:1,originalQuantity:1,status:'borrowed',pendingReturn:{quantity:1,requestedAt:'2026-09-30',remark:'ตรวจสภาพ'}};
  const html=context.window.loanCard(loan,'<button>คืน</button>');
  assert.match(html,/<span class="badge pending_return">รอตรวจรับ<\/span>/);
  assert.doesNotMatch(html,/badge borrowed|<button>คืน<\/button>/);
  assert.match(html,/<div class="return-summary"><strong>รอตรวจรับ · 1 ชิ้น/);
  assert.match(html,/<footer>.*<\/footer><div class="return-summary">/);
  assert.match(fs.readFileSync(require.resolve('../public/styles.css'),'utf8'),/\.loan-card>\.return-summary\{grid-column:1\/-1/);
});

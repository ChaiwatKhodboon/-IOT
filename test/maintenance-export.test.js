const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../public/management-ui.js'),'utf8');
const helpers=source.slice(source.indexOf('  const csvCell='),source.indexOf('  window.exportLoanExcel='));
const report=source.slice(source.indexOf('  const maintenanceReportItems='),source.indexOf('  const baseRenderAdminLoans='));
const items=[
  {id:1,borrowerName:'สมชาย',equipmentCode:'001',equipmentName:'DHT22',quantity:2,returnedAt:'2026-09-01T00:00:00',returnCondition:'damaged',returnRemark:'สายขาด'},
  {id:2,borrowerName:'สมหญิง',equipmentName:'ESP32',quantity:3,returnedAt:'2026-09-30T23:59:59.999',returnCondition:'abnormal',repairedAt:'2026-10-02T10:00:00'},
  {id:3,returnedAt:'2026-10-01T00:00:00',returnCondition:'lost'},
  {id:4,borrowedAt:'2026-09-15T12:00:00',borrowRemark:'ตรวจสอบสาย'},
  {id:5,returnedAt:'2026-09-20T12:00:00',returnCondition:'normal'}
];
function setup(data=items){
  const downloads=[],messages=[],requests=[];
  let closed=false;
  const context=vm.createContext({
    window:{},Blob,setTimeout:fn=>fn(),
    txt:{damaged:'ชำรุด',abnormal:'ผิดปกติ',lost:'สูญหาย'},
    api:async path=>{requests.push(path);return data;},
    URL:{createObjectURL:blob=>{downloads.push({blob});return 'blob:report';},revokeObjectURL:()=>{}},
    document:{createElement:()=>({click(){downloads.at(-1).filename=this.download;},remove(){}}),body:{appendChild(){}}},
    modal:{close(){closed=true;}},toast:(...args)=>messages.push(args)
  });
  vm.runInContext(helpers+report+'\nthis.filter=maintenanceReportItems;this.rows=maintenanceReportRows;',context);
  return {context,downloads,messages,requests,isClosed:()=>closed};
}
test('all dates includes repaired and remark records but excludes ordinary returns',()=>{
  const {context}=setup();
  assert.deepEqual(Array.from(context.filter(items),item=>item.id),[1,4,2,3]);
});
test('report range includes both whole boundary days and filters by report date, not repair date',()=>{
  const {context}=setup();
  assert.deepEqual(Array.from(context.filter(items,'2026-09-01','2026-09-30'),item=>item.id),[1,4,2]);
  assert.throws(()=>context.filter(items,'2026-09-30','2026-09-01'),/ช่วงวันที่/);
  assert.throws(()=>context.filter(items,'2026-09-01',''),/ช่วงวันที่/);
});
test('download includes Thai names, quantity, completed dates, notes and UTF-8 BOM',async()=>{
  const {context,downloads,isClosed}=setup();
  await context.window.exportMaintenanceExcel('2026-09-01','2026-09-30');
  assert.equal(downloads.length,1);
  assert.equal(downloads[0].filename,'รายงานซ่อมบำรุง_2026-09-01_ถึง_2026-09-30.csv');
  const bytes=new Uint8Array(await downloads[0].blob.arrayBuffer());
  assert.deepEqual(Array.from(bytes.slice(0,3)),[239,187,191]);
  const csv=await downloads[0].blob.text();
  assert.match(csv,/สมชาย/);assert.match(csv,/"DHT22","2"/);
  assert.match(csv,/2026-10-02 10:00/);assert.match(csv,/ซ่อมเสร็จแล้ว/);
  assert.match(csv,/สายขาด/);assert.match(csv,/ยังไม่คืน/);
  assert.equal(isClosed(),true);
});
test('CSV escapes quotes, newlines and formula-like user notes',async()=>{
  const {context,downloads}=setup([{...items[0],equipmentName:'อุปกรณ์ "A", B',returnRemark:'=HYPERLINK("x")\nบรรทัดใหม่'}]);
  await context.window.exportMaintenanceExcel();
  const csv=await downloads[0].blob.text();
  assert.match(csv,/"อุปกรณ์ ""A"", B"/);
  assert.ok(csv.includes('"\'=HYPERLINK(""x"")\nบรรทัดใหม่"'));
  assert.equal(downloads[0].filename,'รายงานซ่อมบำรุง_ทั้งหมด.csv');
});

test('English maintenance exports translate labels while preserving borrower names and notes',async()=>{
  const {context,downloads}=setup();
  context.window.I18n={language:()=> 'en',translate:value=>({'ลำดับ':'No.','สถานะการซ่อม':'Repair status','รอซ่อม':'Awaiting repair','ชำรุด':'Damaged'}[value]||value)};
  await context.window.exportMaintenanceExcel();
  const csv=await downloads[0].blob.text();
  assert.match(csv,/"No."/);assert.match(csv,/"Repair status"/);
  assert.match(csv,/"Awaiting repair"/);assert.match(csv,/"Damaged"/);
  assert.match(csv,/สมชาย/);assert.match(csv,/สายขาด/);
  assert.equal(downloads[0].filename,'maintenance_report_all.csv');
});
test('empty reports and invalid ranges do not download or close the dialog',async()=>{
  const {context,downloads,messages,requests,isClosed}=setup([]);
  await context.window.exportMaintenanceExcel('invalid','2026-09-30');
  assert.equal(requests.length,0);
  await context.window.exportMaintenanceExcel();
  assert.equal(downloads.length,0);assert.equal(isClosed(),false);
  assert.equal(messages.length,2);assert.equal(messages[1][1],true);
});

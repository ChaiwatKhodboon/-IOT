const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function setup(){
  const nodes={};
  function node(){return {dataset:{},handlers:{},textContent:'',hidden:false,
    setAttribute(){},focus(){this.focused=true},
    addEventListener(name,handler){this.handlers[name]=handler},
    querySelector(selector){return nodes[selector]??=node()},
    showModal(){this.open=true},close(){this.open=false;this.handlers.close()},
  }}
  const dialog=node();
  const window={addEventListener(){},I18n:{language:()=> 'th',translate:value=>value}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/notifications.js'),'utf8'),{
    window,document:{createElement:()=>dialog,body:{appendChild(){}}}
  });
  return {window,dialog,nodes};
}

test('confirmation waits for a decision and cancellation never approves',async()=>{
  const {window,dialog,nodes}=setup();
  let settled=false;
  const decision=window.showNotification('Delete?',{confirm:true}).then(value=>{settled=true;return value});
  await Promise.resolve();
  assert.equal(settled,false);
  assert.equal(dialog.open,true);
  assert.equal(nodes['[data-cancel]'].hidden,false);
  assert.equal(nodes['[data-cancel]'].focused,true);
  nodes['[data-cancel]'].handlers.click();
  assert.equal(await decision,false);
  assert.equal(dialog.open,false);
});

test('OK approves, messages queue in order, and Escape cancels',async()=>{
  const {window,dialog,nodes}=setup();
  const first=window.showNotification('First',{confirm:true});
  const second=window.showNotification('Second',{confirm:true});
  assert.equal(nodes.p.textContent,'First');
  nodes['[data-accept]'].handlers.click();
  assert.equal(await first,true);
  assert.equal(nodes.p.textContent,'Second');
  let prevented=false;
  dialog.handlers.cancel({preventDefault(){prevented=true}});
  assert.equal(await second,false);
  assert.equal(prevented,true);
});

test('error messages use text content and an acknowledgement button',async()=>{
  const {window,dialog,nodes}=setup();
  const result=window.showNotification('<img src=x onerror=alert(1)>',{error:true});
  assert.equal(nodes.p.textContent,'<img src=x onerror=alert(1)>');
  assert.equal(dialog.dataset.error,'true');
  assert.equal(nodes['[data-cancel]'].hidden,true);
  nodes['[data-accept]'].handlers.click();
  assert.equal(await result,true);
});

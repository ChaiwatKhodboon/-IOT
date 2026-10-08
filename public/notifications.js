(function notifications(){
  const queue=[];
  let active=null;
  const dialog=document.createElement('dialog');
  dialog.className='notification-dialog';
  dialog.setAttribute('aria-labelledby','notificationTitle');
  dialog.setAttribute('aria-describedby','notificationMessage');
  dialog.innerHTML='<div class="notification-icon" aria-hidden="true"></div><h2 id="notificationTitle"></h2><p id="notificationMessage"></p><div class="notification-actions"><button type="button" class="button secondary" data-cancel></button><button type="button" class="button primary" data-accept></button></div>';
  document.body.appendChild(dialog);
  const cancel=dialog.querySelector('[data-cancel]');
  const accept=dialog.querySelector('[data-accept]');
  function render(){
    if(!active)return;
    const english=window.I18n?.language()==='en';
    dialog.querySelector('h2').textContent=active.confirm?(english?'Confirm action':'ยืนยันการทำรายการ'):active.error?(english?'Unable to complete':'ไม่สามารถทำรายการได้'):(english?'Notification':'แจ้งเตือน');
    dialog.querySelector('p').textContent=window.I18n?.translate(active.message)||active.message;
    dialog.querySelector('.notification-icon').textContent=active.confirm?'?':active.error?'!':'✓';
    dialog.dataset.error=String(active.error);
    cancel.textContent=english?'Cancel':'ยกเลิก';
    accept.textContent=english?'OK':'ตกลง';
    cancel.hidden=!active.confirm;
  }
  function next(){
    if(active||!queue.length)return;
    active=queue.shift();
    render();
    dialog.showModal();
    (active.confirm?cancel:accept).focus();
  }
  function finish(result){
    if(!active)return;
    active.result=result;
    dialog.close();
  }
  accept.addEventListener('click',()=>finish(true));
  cancel.addEventListener('click',()=>finish(false));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false)});
  dialog.addEventListener('close',()=>{
    const completed=active;
    active=null;
    completed?.resolve(completed.result===true);
    next();
  });
  window.addEventListener('languagechange',render);
  window.showNotification=(message,{confirm=false,error=false}={})=>new Promise(resolve=>{
    queue.push({message:String(message),confirm,error,resolve});
    next();
  });
})();

(function returnsAndAudit(){
  const labels={normal:'ปกติ',damaged:'ชำรุด',lost:'สูญหาย',abnormal:'ผิดปกติ'};
  const t=value=>I18n.translate(value);
  function returnDetails(loan,withAction=false){
    const borrowed=loan.status==='borrowed';
    const pending=loan.pendingReturn;
    const notice=pending?`<div class="return-summary"><strong>รอตรวจรับ · ${esc(pending.quantity)} ชิ้น</strong><p>สต็อกจะเพิ่มหลังเจ้าหน้าที่ตรวจรับเท่านั้น</p><p>วันที่แจ้งคืน ${date(pending.requestedAt)}</p><p>${esc(pending.remark||'')}</p></div>`:loan.returnRejection?`<p class="return-summary">ส่งกลับให้แก้ไข: ${esc(loan.returnRejection)}</p>`:'';
    return notice+`<div class="return-history-note"><div class="return-reference"><span>รายการยืมต้นทาง</span><strong>#${esc(loan.rootLoanId||loan.id)}</strong></div>${borrowed?`<div class="return-stats"><div class="return-stat outstanding"><span>ค้างคืน</span><div><strong>${esc(loan.quantity)}</strong><span>ชิ้น</span></div></div><div class="return-stat"><span>ยืมเดิม</span><div><strong>${esc(loan.originalQuantity||loan.quantity)}</strong><span>ชิ้น</span></div></div></div>${withAction?`<button type="button" class="button secondary return-record-button" onclick="returnForm(${Number(loan.id)})">${loan.pendingReturn?'ตรวจรับคืน':'ตรวจรับคืนหน้าเคาน์เตอร์'} <span aria-hidden="true">→</span></button>`:''}`:`<div class="return-receipt"><strong>${esc(t(labels[loan.returnCondition]||'คืนแล้ว'))} · ${esc(loan.quantity)} <span>ชิ้น</span></strong><div><span>ผู้บันทึกการคืน</span><b translate="no">${esc(loan.returnedByName||t('ไม่ระบุ (รายการเดิม)'))}</b></div><div><span>วันที่คืนจริง</span>${date(loan.returnedAt)}</div></div>`}</div>`;
  }
  const baseCard=window.loanCard;
  window.loanCard=function(loan,action=''){
    const details=returnDetails(loan);
    if(loan.pendingReturn&&state.user?.role!=='admin')action='';
    return baseCard(loan,action).replace('</article>',details+'</article>');
  };
  const baseAdminCards=window.renderAdminLoans;
  window.renderAdminLoans=function(items){
    const shell=document.createElement('div');shell.innerHTML=baseAdminCards(items);
    shell.querySelectorAll('.admin-loan-card').forEach((card,index)=>{
      const item=items[index];
      card.insertAdjacentHTML('beforeend',returnDetails(item,true));
    });
    return shell.innerHTML;
  };
  window.returnForm=function(id){
    const loan=state.loans.find(item=>String(item.id)===String(id));
    if(!loan||loan.status!=='borrowed')return;
    const admin=state.user?.role==='admin';
    if(loan.pendingReturn&&!admin){toast(t('รายการนี้รอเจ้าหน้าที่ตรวจรับแล้ว'));return}
    const pending=loan.pendingReturn;
    const heading=admin?'ตรวจรับคืน':'ส่งคำขอคืน';
    const requestId=crypto.randomUUID();
    $('#content').innerHTML=`<h1 class="page-title">${heading}</h1><p class="subtitle">${admin?'ระบุจำนวนและสภาพที่ตรวจรับจริง ส่วนที่เหลือจะยังค้างคืน':'กรอกจำนวนที่ต้องการคืน สต็อกจะเพิ่มหลังเจ้าหน้าที่ตรวจรับเท่านั้น'}</p>${loanCard(loan)}
      <form id="partialReturnForm" class="card return-form">
      <label class="field return-total-field">จำนวนที่คืนครั้งนี้ <small>สูงสุด ${loan.quantity} ชิ้น</small>
        <input type="number" name="returnTotal" min="1" max="${loan.quantity}" step="1" value="${pending?.quantity||1}" inputmode="numeric" required>
      </label>
      <p class="meta">แยกจำนวนตามสภาพอุปกรณ์ (รวมให้ตรงกับจำนวนคืนด้านบน)</p>
      <div class="return-quantity-grid">${Object.entries(labels).map(([key,label])=>`<label class="field">${label}<input type="number" name="${key}" min="0" max="${loan.quantity}" step="1" value="${pending?.quantities[key]??(key==='normal'?1:0)}" inputmode="numeric" required></label>`).join('')}</div>
      <p id="returnSummary" class="return-summary" aria-live="polite"></p>
      <label class="field">หมายเหตุ/รายละเอียดเพิ่มเติม<textarea name="remark" rows="3" maxlength="500">${esc(pending?.remark||'')}</textarea></label>
      ${admin&&pending?'<label class="field">เหตุผลที่ส่งกลับ<textarea name="rejectionReason" rows="2" maxlength="500"></textarea></label><button type="button" class="button danger" id="rejectReturn">ส่งกลับให้แก้ไข</button>':''}
      <div class="notification-actions"><button type="button" class="button secondary" id="cancelReturn">ยกเลิก</button><button class="button primary" id="saveReturn" type="submit">${admin?'ยืนยันตรวจรับและปรับสต็อก':'ส่งคำขอคืน'}</button></div></form>`;
    const form=$('#partialReturnForm'),save=$('#saveReturn'),cancel=$('#cancelReturn');
    const quantities=()=>Object.fromEntries(Object.keys(labels).map(key=>[key,Number(form.elements[key].value)]));
    const update=()=>{
      const chosen=Number(form.elements.returnTotal.value),values=Object.values(quantities()),brokenDown=values.reduce((sum,value)=>sum+value,0);
      const valid=Number.isSafeInteger(chosen)&&chosen>=1&&chosen<=loan.quantity&&values.every(value=>Number.isSafeInteger(value)&&value>=0)&&brokenDown===chosen;
      save.disabled=!valid;
      $('#returnSummary').textContent=brokenDown!==chosen
        ?(I18n.language()==='en'?`Condition quantities total ${brokenDown}; choose ${chosen} units above.`:`จำนวนแยกตามสภาพรวม ${brokenDown} ชิ้น ต้องเท่ากับจำนวนคืน ${chosen} ชิ้น`)
        :(I18n.language()==='en'?`Returning ${chosen} · Remaining ${loan.quantity-chosen} / ${loan.quantity}`:`คืนครั้งนี้ ${chosen} ชิ้น · ค้างคืน ${loan.quantity-chosen} จาก ${loan.quantity} ชิ้น`);
      return valid;
    };
    form.oninput=event=>{
      if(event.target===form.elements.returnTotal){
        form.elements.normal.value=form.elements.returnTotal.value;
        for(const key of Object.keys(labels).filter(key=>key!=='normal'))form.elements[key].value=0;
      }
      update();
    };
    update();
    cancel.onclick=()=>route();
    let busy=false;
    form.onsubmit=async event=>{
      event.preventDefault();if(busy||!update())return;
      busy=true;save.disabled=true;cancel.disabled=true;
      const payload={requestId,quantities:quantities(),remark:form.elements.remark.value,inspectionId:admin?pending?.id:null};
      form.querySelectorAll('input,textarea').forEach(input=>input.disabled=true);
      try{
        if(!await confirmLocalized(admin?'ยืนยันตรวจรับและปรับสต็อกตามจำนวนที่ระบุ?':'ส่งคำขอคืนให้เจ้าหน้าที่ตรวจรับ?'))return;
        const result=await api(`/loans/${loan.id}/return`,{method:'POST',body:JSON.stringify(payload)});
        await route();
        toast(result.status==='pending_return'?t(result.message):I18n.language()==='en'?`Recorded ${result.returnedQuantity} units. Remaining: ${result.remainingQuantity}.`:`บันทึกคืน ${result.returnedQuantity} ชิ้นแล้ว · ค้างคืน ${result.remainingQuantity} ชิ้น`);
      }catch(error){toast(error.message,true)}
      finally{busy=false;cancel.disabled=false;form.querySelectorAll('input,textarea').forEach(input=>input.disabled=false);if(form.isConnected)update()}
    };
    const reject=$('#rejectReturn');
    if(reject)reject.onclick=async()=>{
      if(busy)return;
      const reason=form.elements.rejectionReason.value.trim();
      if(!reason){toast(t('กรุณาระบุเหตุผลที่ส่งกลับ'),true);return}
      busy=true;reject.disabled=true;save.disabled=true;cancel.disabled=true;
      try{
        if(!await confirmLocalized('ส่งกลับให้ผู้ยืมแก้ไขคำขอคืน?'))return;
        const result=await api(`/loans/${loan.id}/return/reject`,{method:'POST',body:JSON.stringify({inspectionId:pending.id,reason})});
        await route();toast(t(result.message));
      }catch(error){toast(error.message,true)}finally{busy=false;reject.disabled=false;cancel.disabled=false;if(form.isConnected)update()}
    };
  };
  const actionLabels={insert:'เพิ่มข้อมูล',update:'แก้ไขข้อมูล',delete:'ลบข้อมูล',borrow:'ยืมอุปกรณ์',return:'บันทึกคืน',partial_return:'คืนบางส่วน',repair:'ปิดงานซ่อม'};
  const entityLabels={loans:'การยืม–คืน',equipment:'อุปกรณ์',users:'ผู้ใช้งาน'};
  const fieldLabels={pending_return:'คำขอรอตรวจรับ',return_rejection:'เหตุผลที่ส่งกลับ',id:'รหัส',user_id:'รหัสผู้ยืม',equipment_id:'รหัสอุปกรณ์',quantity:'จำนวน',original_quantity:'จำนวนยืมเดิม',parent_loan_id:'รายการยืมต้นทาง',borrowed_at:'วันยืม',due_at:'กำหนดคืน',returned_at:'วันคืน',status:'สถานะ',borrow_remark:'หมายเหตุการยืม',borrower_name:'ชื่อผู้ยืม',return_remark:'หมายเหตุการคืน',return_condition:'สภาพตอนคืน',repaired_at:'วันซ่อมเสร็จ',returned_by:'ผู้บันทึกคืน (รหัส)',repaired_by:'ผู้ปิดงานซ่อม (รหัส)',code:'รหัสอุปกรณ์',name:'ชื่ออุปกรณ์',category:'หมวดหมู่',description:'รายละเอียด',total_quantity:'จำนวนรวม',available_quantity:'พร้อมยืม',maintenance_quantity:'รอซ่อม',username:'ชื่อผู้ใช้',full_name:'ชื่อ-นามสกุล',email:'อีเมล',student_id:'รหัสนิสิต',role:'สิทธิ์',active:'เปิดใช้งาน',avatar_changed:'เปลี่ยนรูปโปรไฟล์',image_changed:'เปลี่ยนรูปอุปกรณ์'};
  function auditDate(value){
    if(!value)return '—';
    const instant=new Date(value);if(Number.isNaN(instant.getTime()))return String(value);
    const english=I18n.language()==='en';
    const day=new Intl.DateTimeFormat(english?'en-GB':'th-TH',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Bangkok'}).format(instant);
    const time=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Bangkok'}).format(instant);
    return english?`${day} at ${time} (Bangkok)`:`${day} เวลา ${time} น.`;
  }
  function auditValue(key,value,item){
    if(value===undefined||value===null||value==='')return '—';
    if(['borrowed_at','due_at','returned_at','repaired_at','created_at','updated_at'].includes(key))return auditDate(value);
    if(['user_id','returned_by','repaired_by'].includes(key))return `${item.personNames?.[value]||(String(value)===String(item.actorId)?item.actorName:t('ไม่ระบุ'))} (#${value})`;
    if(key==='equipment_id'&&item.equipmentName)return `${item.equipmentName}${item.equipmentCode?' · '+item.equipmentCode:''}`;
    if(['quantity','original_quantity','total_quantity','available_quantity','maintenance_quantity'].includes(key))return `${value} ${t('ชิ้น')}`;
    if(key==='status'||key==='return_condition')return t(txt[value]||value);
    if(key==='role')return t(value==='admin'?'ผู้ดูแลระบบ':'ผู้ใช้งานทั่วไป');
    if(key==='active')return t(value?'เปิดใช้งาน':'ปิดใช้งาน');
    if(key==='pending_return')return `${t('รอตรวจรับ')} · ${value.quantity} ${t('ชิ้น')} · ${auditDate(value.requestedAt)} · ${value.remark||''}`;
    if(typeof value==='boolean')return t(value?'ใช่':'ไม่ใช่');
    return String(value);
  }
  function renderAuditCard(item){
    const before=item.beforeData||{},after=item.afterData||{},data=item.afterData||item.beforeData||{};
    const fields=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(key=>!['id','updated_at','created_at'].includes(key)&&JSON.stringify(before[key])!==JSON.stringify(after[key]));
    const related=item.relatedActions||[];
    const cause=related.length&&related.every(event=>event.action===related[0].action)?related[0].action:null;
    let action=item.entityType==='equipment'&&cause?({return:'ปรับสต็อกจากการคืน',borrow:'ปรับสต็อกจากการยืม',repair:'ปรับสต็อกจากการซ่อมเสร็จ'}[cause]):actionLabels[item.action]||item.action;
    if(item.entityType==='loans'&&item.action==='update'){
      if(after.return_rejection&&before.return_rejection!==after.return_rejection)action='ส่งคำขอคืนกลับให้แก้ไข';
      else if(after.pending_return&&JSON.stringify(before.pending_return)!==JSON.stringify(after.pending_return))action='ส่งคำขอคืนอุปกรณ์';
    }
    const name=item.entityType==='users'?(item.accountName||data.username||t('บัญชีผู้ใช้')):(item.equipmentName||`${t('อุปกรณ์')} #${item.entityId}`);
    const code=item.entityType==='users'?data.username:item.equipmentCode;
    const people=[...new Set([item.borrowerName,...related.map(event=>event.borrowerName)].filter(Boolean))];
    const root=data.parent_loan_id||item.entityId;
    const priority=['available_quantity','maintenance_quantity','total_quantity','quantity','status','return_condition','due_at','role','active','name','full_name'];
    const summaryFields=fields.filter(key=>priority.includes(key)).sort((a,b)=>priority.indexOf(a)-priority.indexOf(b)).slice(0,4);
    const change=(key)=>`<div class="audit-change"><span>${esc(t(fieldLabels[key]||key))}</span><div><span class="audit-before" translate="no">${esc(auditValue(key,before[key],item))}</span><span class="audit-change-arrow" aria-label="${esc(t('เปลี่ยนเป็น'))}">→</span><strong translate="no">${esc(auditValue(key,after[key],item))}</strong></div></div>`;
    const descriptions=related.map(event=>`${t(actionLabels[event.action])} ${event.quantity} ${t('ชิ้น')}${event.action==='return'?' · '+t(labels[event.condition]||event.condition):''} (${t('รายการยืม')} #${event.loanId})`);
    if(item.entityType==='loans'&&['borrow','return','repair'].includes(item.action))descriptions.push(`${t(actionLabels[item.action])} ${data.quantity} ${t('ชิ้น')}${data.return_condition?' · '+t(labels[data.return_condition]||data.return_condition):''}`);
    if(item.action==='partial_return')descriptions.push(I18n.language()==='en'?`Returned ${before.quantity-after.quantity} units · ${after.quantity} still outstanding`:`คืนครั้งนี้ ${before.quantity-after.quantity} ชิ้น · ยังค้างคืน ${after.quantity} ชิ้น`);
    const actorRole=item.actorRole==='admin'?'ผู้ดูแลระบบ':item.actorRole==='user'?'ผู้ใช้งานทั่วไป':'ไม่ระบุ (รายการเดิม)';
    const explanation=I18n.language()==='en'
      ?`${item.actorName||t('ไม่ระบุ')} · ${t(action)} · ${name}`
      :`${item.actorName||t('ไม่ระบุ')} ทำรายการ “${action}” กับ${item.entityType==='users'?'บัญชี':'อุปกรณ์'} ${name}`;
    if(item.entityType==='equipment'&&fields.includes('available_quantity')){
      const delta=Number(after.available_quantity)-Number(before.available_quantity);
      if(Number.isFinite(delta)&&before.available_quantity!=null&&after.available_quantity!=null)descriptions.push(I18n.language()==='en'?`Available stock ${delta>=0?'increased':'decreased'} by ${Math.abs(delta)} units`:`จำนวนที่ยืมได้${delta>=0?'เพิ่มขึ้น':'ลดลง'} ${Math.abs(delta)} ชิ้น`);
    }
    if(after.return_rejection&&before.return_rejection!==after.return_rejection)descriptions.push(`${t('เหตุผลที่ส่งกลับ')}: ${after.return_rejection}`);
    if(after.pending_return&&JSON.stringify(before.pending_return)!==JSON.stringify(after.pending_return))descriptions.push(`${t('คำขอรอตรวจรับ')}: ${auditValue('pending_return',after.pending_return,item)}`);
    return `<article class="card audit-card audit-readable"><header class="audit-event-header"><span class="audit-event-kind">${esc(t(action))}</span><time datetime="${esc(item.createdAt)}" translate="no">${esc(auditDate(item.createdAt))}</time></header>
      <h2 class="audit-subject" translate="no">${esc(name)}</h2><p class="audit-reference">${code?`<span translate="no">${esc(code)}</span><span aria-hidden="true"> · </span>`:''}${esc(t(item.entityType==='loans'?'รายการยืมต้นทาง':'รหัสอ้างอิง'))} #${esc(root)}</p>
      <p class="audit-explanation" translate="no">${esc(explanation)}</p>
      <div class="audit-people"><div><span>ผู้ทำรายการ</span><strong translate="no">${esc(item.actorName||t('ไม่ระบุ'))}</strong><small>${esc(t(actorRole))}</small></div>${people.length?`<div><span>ผู้ยืม</span><strong translate="no">${esc(people.join(', '))}</strong></div>`:''}<div><span>ประเภทข้อมูล</span><strong>${esc(t(entityLabels[item.entityType]||item.entityType))}</strong></div></div>
      ${descriptions.length?`<div class="audit-description">${descriptions.map(line=>`<p translate="no">${esc(line)}</p>`).join('')}</div>`:''}
      ${summaryFields.length?`<div class="audit-change-list">${summaryFields.map(change).join('')}</div>`:''}
      <details><summary>ดูรายละเอียดการเปลี่ยนแปลง (${fields.length})</summary><div class="audit-table-wrap"><table class="audit-table"><thead><tr><th>ข้อมูล</th><th>ก่อน</th><th>หลัง</th></tr></thead><tbody>${fields.map(key=>`<tr><th>${esc(t(fieldLabels[key]||key))}</th><td translate="no">${esc(auditValue(key,before[key],item))}</td><td translate="no">${esc(auditValue(key,after[key],item))}</td></tr>`).join('')}</tbody></table></div></details></article>`;
  }
  window.audit=async function(){
    if(state.user?.role!=='admin')return;
    $('#content').innerHTML=`<h1 class="page-title">ประวัติการทำงาน</h1><p class="subtitle">ตรวจสอบว่าใครทำอะไรกับอุปกรณ์ พร้อมรายละเอียดและวันเวลา (เวลาประเทศไทย)</p><form id="auditFilters" class="audit-filters"><label class="field">ค้นหาชื่อคน ชื่ออุปกรณ์ หรือรหัส<input name="search" maxlength="120" placeholder="เช่น ชื่อผู้ยืม, DHT22, IOT-SEN-001"></label><label class="field">ประเภทข้อมูล<select name="type"><option value="">ทั้งหมด</option>${Object.entries(entityLabels).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label><button class="button secondary" type="submit">ค้นหา</button></form><div id="auditList" aria-live="polite"></div><button id="auditMore" class="button secondary wide" hidden>โหลดเพิ่มเติม</button>`;
    $('#auditFilters').insertAdjacentHTML('beforebegin',`<div class="audit-role-picker" role="group" aria-label="${esc(t('เลือกผู้ทำรายการ'))}"><button type="button" data-role="" aria-pressed="true">ทั้งหมด</button><button type="button" data-role="admin" aria-pressed="false">ผู้ดูแลระบบ</button><button type="button" data-role="user" aria-pressed="false">ผู้ใช้งานทั่วไป</button></div>`);
    const form=$('#auditFilters'),list=$('#auditList'),more=$('#auditMore');
    const roleButtons=[...document.querySelectorAll('.audit-role-picker button')];
    let cursor=null,search='',type='',role='',loading=false;
    async function load(reset){
      if(loading)return;loading=true;more.disabled=true;
      form.querySelector('button').disabled=true;
      roleButtons.forEach(button=>button.disabled=true);
      if(reset){cursor=null;search=form.elements.search.value;type=form.elements.type.value}
      try{
        const result=await api('/audit?'+new URLSearchParams({search,type,role,...(cursor?{before:cursor}:{})}));
        if(!list.isConnected)return;
        if(reset)list.innerHTML='';
        list.insertAdjacentHTML('beforeend',result.items.map(renderAuditCard).join('')||(!cursor?'<p class="subtitle">ยังไม่มีประวัติที่ตรงกับการค้นหา</p>':''));
        cursor=result.nextCursor;more.hidden=!cursor;
      }catch(error){if(reset){list.innerHTML=`<p class="audit-load-error" role="alert">${esc(error.message)}</p>`;more.hidden=true}toast(error.message,true)}finally{loading=false;more.disabled=false;form.querySelector('button').disabled=false;roleButtons.forEach(button=>button.disabled=false)}
    }
    form.onsubmit=event=>{event.preventDefault();load(true)};more.onclick=()=>load(false);
    roleButtons.forEach(button=>button.onclick=()=>{if(loading)return;role=button.dataset.role;roleButtons.forEach(value=>value.setAttribute('aria-pressed',String(value===button)));load(true)});
    await load(true);
  };
})();

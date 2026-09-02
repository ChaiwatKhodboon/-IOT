(function managementFeatures(){
  const isOverdue=loan=>loan.status==='borrowed'&&loan.dueAt&&new Date(loan.dueAt)<new Date();
  const overdueText=loan=>`เกินกำหนด ${loan.overdueDays||Math.max(1,Math.ceil((Date.now()-new Date(loan.dueAt))/86400000))} วัน`;

  const baseNav=nav;
  nav=function(){
    if(state.user?.role!=='admin')return baseNav();
    const items=[['dashboard','⌂','ตรวจเช็ค'],['stock','▣','คลัง'],['loans','⇄','ติดตาม'],['maintenance','⌕','ซ่อมบำรุง'],['accounts','♙','ผู้ใช้งาน'],['profile','●','บัญชี']];
    $('#bottomNav').innerHTML=items.map(([page,icon,label])=>`<a href="#${page}" data-p="${page}"><b>${icon}</b>${label}</a>`).join('');
  };

  const baseLoanCard=loanCard;
  loanCard=function(loan,action=''){
    const html=baseLoanCard(loan,action);
    return isOverdue(loan)?html.replace('class="card loan-card"','class="card loan-card overdue-card"').replace(`<span class="badge ${loan.status}">${txt[loan.status]}</span>`,`<span class="badge overdue">${overdueText(loan)}</span>`):html;
  };

  const baseDashboard=dashboard;
  dashboard=async function(){
    await baseDashboard();
    const data=await api('/dashboard');
    if(data.overdueLoans>0){
      $('#content').insertAdjacentHTML('afterbegin',`<a class="overdue-alert" href="#loans"><b>⚠ มีรายการเกินกำหนด ${data.overdueLoans} รายการ</b><span>ตรวจสอบและติดตามการคืนอุปกรณ์ →</span></a>`);
    }
  };

  window.renderAdminEquipment=function(items){
    if(!items.length)return '<div class="card empty-state"><b>ไม่พบอุปกรณ์</b><p>ลองเปลี่ยนคำค้นหา หรือเพิ่มอุปกรณ์รายการใหม่</p></div>';
    return items.map(item=>`<article class="card admin-equipment-card">
      <div class="device-art">${equipmentArt(item)}</div>
      <div class="equipment-copy"><span class="badge ${item.status==='retired'?'retired':(item.maintenanceQuantity||0)>0?'maintenance':'available'}">${txt[item.status==='retired'?'retired':(item.maintenanceQuantity||0)>0?'maintenance':'available']}</span><h3>${esc(item.name)}</h3><div class="code">${esc(item.code)}</div><p class="meta">${esc(item.category)} · ชำรุด ${item.maintenanceQuantity||0} ชิ้น · ยืมได้ ${item.availableQuantity} ชิ้น</p></div>
      <div class="admin-card-tools">
        <button type="button" class="icon-edit" onclick="editAdminEquipment(${item.id})">✎ <span>แก้ไข</span></button>
        <input id="equipment-image-${item.id}" class="equipment-image-input" type="file" accept="image/jpeg,image/png,image/webp" onchange="changeEquipmentImage(event,${item.id})">
        <label class="icon-image" for="equipment-image-${item.id}">▣ <span>${item.imageUrl?'เปลี่ยนรูป':'เพิ่มรูป'}</span></label>
        <button type="button" class="icon-delete" onclick="removeAdminEquipment(${item.id})">⌫ <span>ลบ</span></button>
      </div>
    </article>`).join('');
  };

  window.editAdminEquipment=function(id){
    const item=state.equipment.find(value=>String(value.id)===String(id));
    if(!item)return;
    $('#modalBody').innerHTML=`<h2>แก้ไขอุปกรณ์</h2><p class="subtitle">ปรับข้อมูลอุปกรณ์และสถานะการใช้งาน</p><form id="editEquipmentForm">
      <label class="field">ชื่ออุปกรณ์<input name="name" value="${esc(item.name)}" required></label>
      <label class="field">รหัสอุปกรณ์<input name="code" value="${esc(item.code)}" required></label>
      <label class="field">หมวดหมู่<input name="category" value="${esc(item.category)}" required></label>
      <label class="field">จำนวนทั้งหมด<input name="totalQuantity" type="number" min="1" value="${item.totalQuantity}" required></label>
      <label class="field">สถานะ<select name="status"><option value="available">พร้อมใช้งาน</option><option value="maintenance">ซ่อมบำรุง</option><option value="retired">เลิกใช้งาน</option></select></label>
      <label class="field">รายละเอียด<textarea name="description" rows="3">${esc(item.description||'')}</textarea></label>
      <button class="button primary wide">บันทึกการแก้ไข</button></form>`;
    $('#editEquipmentForm [name="status"]').value=item.status;
    $('#editEquipmentForm').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{const data=Object.fromEntries(new FormData(event.target));data.totalQuantity=Number(data.totalQuantity);data.imageUrl=item.imageUrl||null;await api(`/equipment/${id}`,{method:'PUT',body:JSON.stringify(data)});modal.close();toast('แก้ไขอุปกรณ์เรียบร้อยแล้ว');await stock()}catch(error){toast(error.message,true);button.disabled=false}};
    modal.showModal();
  };

  window.accounts=async function(){
    if(state.user?.role!=='admin')return profile();
    const users=await api('/users');
    $('#content').innerHTML=`<div class="admin-page-head"><div><h1 class="page-title">จัดการบัญชีผู้ใช้</h1><p class="subtitle">ตรวจสอบสิทธิ์ สถานะ และรายการยืมของสมาชิก</p></div><span class="count-pill">${users.length} บัญชี</span></div><div class="search"><input id="accountSearch" placeholder="ค้นหาชื่อ ชื่อผู้ใช้ หรือรหัสนิสิต..."></div><div id="accountList" class="account-grid">${renderAccounts(users)}</div>`;
    $('#accountSearch').oninput=event=>{const q=event.target.value.toLowerCase();$('#accountList').innerHTML=renderAccounts(users.filter(user=>`${user.fullName} ${user.username} ${user.studentId||''}`.toLowerCase().includes(q)))};
  };

  window.renderAccounts=function(users){
    if(!users.length)return '<div class="card empty-state"><b>ไม่พบบัญชีผู้ใช้</b></div>';
    return users.map(user=>`<article class="card account-card ${user.active?'':'inactive'}"><div class="account-avatar">${user.avatarUrl?`<img src="${esc(user.avatarUrl)}" alt="">`:esc((user.fullName||'?')[0])}</div><div class="account-copy"><span class="badge ${user.active?'available':'retired'}">${user.active?'ใช้งานได้':'ปิดใช้งาน'}</span><h3>${esc(user.fullName)}</h3><div class="code">${esc(user.username)}</div><p class="meta">${esc(user.studentId||'ไม่มีรหัสนิสิต')} · ${user.role==='admin'?'ผู้ดูแลระบบ':'ผู้ใช้งาน'}</p><p class="account-stats">กำลังยืม ${user.activeLoans} · <strong class="${user.overdueLoans?'red-text':''}">เกินกำหนด ${user.overdueLoans}</strong></p></div><div class="account-actions"><button class="button secondary compact" onclick="showUserLoans(${user.id})">ดูการยืม</button><button class="button secondary compact" onclick="editAccount(${user.id})">แก้ไขข้อมูล</button><button class="button ${user.active?'danger':'primary'} compact" onclick="toggleAccount(${user.id})">${user.active?'ปิดบัญชี':'เปิดบัญชี'}</button></div></article>`).join('');
  };

  window.editAccount=async function(id){
    const users=await api('/users');const user=users.find(value=>String(value.id)===String(id));if(!user)return;
    $('#modalBody').innerHTML=`<h2>แก้ไขบัญชีผู้ใช้</h2><form id="accountForm"><label class="field">ชื่อ-นามสกุล<input name="fullName" value="${esc(user.fullName)}" required></label><label class="field">รหัสนิสิต<input name="studentId" value="${esc(user.studentId||'')}"></label><label class="field">สิทธิ์<select name="role"><option value="user">ผู้ใช้งาน</option><option value="admin">ผู้ดูแลระบบ</option></select></label><label class="toggle-row"><input name="active" type="checkbox" ${user.active?'checked':''}><span>อนุญาตให้เข้าสู่ระบบ</span></label><button class="button primary wide">บันทึกบัญชี</button></form>`;
    $('#accountForm [name="role"]').value=user.role;
    const accountModal=document.querySelector('#modal');
    $('#accountForm').onsubmit=async event=>{event.preventDefault();const form=Object.fromEntries(new FormData(event.target));form.active=$('#accountForm [name="active"]').checked;try{await api(`/users/${id}`,{method:'PUT',body:JSON.stringify(form)});accountModal.close();toast('บันทึกบัญชีเรียบร้อยแล้ว');await accounts()}catch(error){toast(error.message,true)}};accountModal.showModal();
  };

  window.toggleAccount=async function(id){
    try{
      const users=await api('/users');const user=users.find(value=>String(value.id)===String(id));if(!user)return;
      const action=user.active?'ปิด':'เปิด';
      if(!confirm(`ยืนยันการ${action}บัญชีของ ${user.fullName}?`))return;
      await api(`/users/${id}`,{method:'PUT',body:JSON.stringify({fullName:user.fullName,studentId:user.studentId,role:user.role,active:!user.active})});
      toast(`${action}บัญชีเรียบร้อยแล้ว`);await accounts();
    }catch(error){toast(error.message,true)}
  };

  window.showUserLoans=async function(id){
    try{
      const [users,loans]=await Promise.all([api('/users'),api('/loans')]);
      const user=users.find(value=>String(value.id)===String(id));
      const items=loans.filter(loan=>String(loan.userId)===String(id));
      $('#content').innerHTML=`<div class="admin-page-head"><div><button class="back-link" onclick="accounts()">← กลับหน้าผู้ใช้งาน</button><h1 class="page-title">รายการยืมของ ${esc(user?.fullName||'ผู้ใช้งาน')}</h1><p class="subtitle">ประวัติทั้งหมด ${items.length} รายการ · กำลังยืม ${items.filter(x=>x.status==='borrowed').length} · เกินกำหนด ${items.filter(isOverdue).length}</p></div></div><div id="adminLoanList">${renderAdminLoans(items)}</div>`;
    }catch(error){toast(error.message,true)}
  };

  const baseRenderAdminLoans=window.renderAdminLoans;
  window.renderAdminLoans=function(items){
    const html=baseRenderAdminLoans(items);
    if(!items.some(isOverdue))return html;
    const shell=document.createElement('div');shell.innerHTML=html;
    shell.querySelectorAll('.admin-loan-card').forEach((card,index)=>{if(isOverdue(items[index])){card.classList.add('overdue-card');const badge=card.querySelector('.badge');if(badge){badge.className='badge overdue';badge.textContent=overdueText(items[index])}}});
    return shell.innerHTML;
  };

  const baseRoute=route;
  route=async function(){if(location.hash==='#accounts'){active('accounts');try{await accounts()}catch(error){toast(error.message,true)}return}return baseRoute()};
})();

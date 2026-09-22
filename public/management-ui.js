(function managementFeatures(){
  const defaultPreferences={theme:'light',language:'th',reduceMotion:false,confirmLogout:true};
  const readPreferences=()=>{
    try{return {...defaultPreferences,...JSON.parse(localStorage.getItem('preferences')||'{}')}}catch{return {...defaultPreferences}}
  };
  const resolveTheme=value=>{
    if(value!=='system')return value;
    return matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
  };
  const englishText={
    'ยืม':'Borrow','คืน':'Return','ประวัติ':'History','บัญชี':'Account',
    'ภาพรวมอุปกรณ์':'Equipment overview','จัดการอุปกรณ์ทั้งหมด':'Manage all equipment','ตรวจสอบกำหนดคืน':'Review return deadlines','ดูแลและติดตามการซ่อม':'Track equipment repairs','ค้นหาอุปกรณ์ที่ต้องการ':'Find equipment to borrow','จัดการรายการที่ยืมไว้':'Manage borrowed equipment','ดูรายการใช้งานที่ผ่านมา':'View borrowing history','ข้อมูลส่วนตัวและตั้งค่า':'Profile and preferences',
    'ระบบยืม-คืน อุปกรณ์ IoT':'IOT Equipment Loan System','ระบบยืม-คืน อุปกรณ์ IOT':'IOT Equipment Loan System','สาขาเทคโนโลยีสารสนเทศ':'Information Technology','เมนูจัดการระบบ':'SYSTEM MENU',
    'ตรวจเช็ค':'Dashboard','คลังอุปกรณ์':'Equipment','ติดตามการยืม':'Loan Tracking','ซ่อมบำรุง':'Maintenance','ผู้ใช้งาน':'Users','บัญชีของฉัน':'My Account','บัญชีAdmin':'Admin Account','บัญชีผู้ใช้งาน':'User Account',
    'เข้าสู่ระบบ':'Sign in','ลงชื่อเข้าใช้ระบบ':'Sign in to continue','ชื่อผู้ใช้':'Username','รหัสผ่าน':'Password','ลืมรหัสผ่าน?':'Forgot password?','สมัครสมาชิกสำหรับผู้ใช้งาน':'Create a user account','สมัครสมาชิก':'Create account','ลงทะเบียนผู้ใช้ใหม่':'New user registration','มีบัญชีอยู่แล้ว / กลับเข้าสู่ระบบ':'Already registered? Sign in',
    'ภาพรวมสถานะอุปกรณ์ทั้งหมดและความเคลื่อนไหวล่าสุด':'Overview of equipment status and recent activity','อุปกรณ์ทั้งหมด':'Total equipment','พร้อมใช้งาน':'Available','ถูกยืมอยู่':'On loan','ชำรุด/รอซ่อม':'Damaged / maintenance','ความเคลื่อนไหวล่าสุด':'Recent activity','ดูทั้งหมด':'View all',
    'คลัง':'Equipment','จัดการข้อมูลอุปกรณ์ทั้งหมด':'Manage all equipment','เพิ่ม':'Add','แก้ไข':'Edit','ลบ':'Delete','เพิ่มรูป':'Add image','เปลี่ยนรูป':'Change image','รวมอุปกรณ์':'Total','ต้องซ่อม':'Needs repair',
    'ตรวจสอบว่าใครกำลังยืมอุปกรณ์และกำหนดคืน':'Review borrowers and return deadlines','ดาวน์โหลด Excel':'Download Excel','ทั้งหมด':'All','กำลังยืม':'Borrowed','คืนแล้ว':'Returned','ผู้ยืม':'Borrower','วันที่ยืม':'Borrowed date','กำหนดคืน':'Due date','วันที่คืนจริง':'Returned date',
    'จัดการบัญชีผู้ใช้':'User Management','แก้ไขข้อมูล':'Edit details','ดูการยืม':'View loans','ปิดบัญชี':'Disable account','เปิดบัญชี':'Enable account','ผู้ดูแลระบบ':'Administrator','นักศึกษา':'Student','รหัสนิสิต':'Student ID','เปลี่ยนรูปโปรไฟล์':'Change profile image','เพิ่มรูปโปรไฟล์':'Add profile image','ออกจากระบบ':'Sign out',
    'ตั้งค่าระบบ':'Settings','ธีมหน้าจอและการใช้งาน':'Appearance and preferences','รูปแบบหน้าจอ':'Appearance','สว่าง':'Light','มืด':'Dark','ตามระบบ':'System','การใช้งาน':'Behavior','ลดการเคลื่อนไหว':'Reduce motion','ยืนยันก่อนออกจากระบบ':'Confirm before signing out','บันทึกการตั้งค่า':'Save settings',
    'บัญชีผู้ใช้':'User Account','จัดการข้อมูลส่วนตัว รูปโปรไฟล์ และการตั้งค่าบัญชี':'Manage personal information, profile image and account preferences','บัญชีใช้งานอยู่':'Account active','ชื่อ-นามสกุล':'Full name','ชื่อผู้ใช้ / อีเมล':'Username / Email','สิทธิ์การใช้งาน':'Access level','ผู้ใช้งานทั่วไป':'Standard user','ธีม ภาษา และการใช้งาน':'Theme, language and preferences','สิ้นสุดเซสชันการใช้งานบนอุปกรณ์นี้':'End the session on this device'
  };
  const originalText=new WeakMap(),originalAttributes=new WeakMap();
  const translatedValue=(source,english)=>english?(englishText[source]||source):source;
  const translateTextNodes=(root,english)=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      if(!originalText.has(node))originalText.set(node,node.nodeValue);
      const source=originalText.get(node),trimmed=source.trim();
      node.nodeValue=englishText[trimmed]&&english?source.replace(trimmed,englishText[trimmed]):source;
    }
  };
  const translateAttributes=(root,english)=>{
    root.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(element=>{
      if(!originalAttributes.has(element))originalAttributes.set(element,{placeholder:element.getAttribute('placeholder'),title:element.getAttribute('title'),ariaLabel:element.getAttribute('aria-label')});
      const values=originalAttributes.get(element);
      for(const [property,attribute] of [['placeholder','placeholder'],['title','title'],['ariaLabel','aria-label']]){
        const source=values[property];
        if(source!=null)element.setAttribute(attribute,translatedValue(source,english));
      }
    });
  };
  const translateElement=root=>{
    const english=readPreferences().language==='en';
    document.documentElement.lang=english?'en':'th';
    document.title=english?'IoT Equipment Loan System':'ระบบยืมคืนอุปกรณ์ IoT';
    translateTextNodes(root,english);
    translateAttributes(root,english);
  };
  window.applyLanguage=()=>translateElement(document.body);
  window.applyPreferences=function(){
    const preferences=readPreferences();
    document.documentElement.dataset.theme=resolveTheme(preferences.theme);
    document.documentElement.dataset.reduceMotion=preferences.reduceMotion?'true':'false';
    applyLanguage();
  };
  applyPreferences();
  new MutationObserver(records=>{if(readPreferences().language==='en')records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===Node.ELEMENT_NODE)translateElement(node);else if(node.nodeType===Node.TEXT_NODE&&node.parentElement)translateElement(node.parentElement)}))}).observe(document.body,{childList:true,subtree:true});
  matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change',()=>{if(readPreferences().theme==='system')applyPreferences()});

  window.openSettings=function(){
    const preferences=readPreferences();
    $('#modalBody').innerHTML=`<div class="settings-heading"><span class="settings-icon">⚙</span><div><h2>ตั้งค่าระบบ</h2><p class="subtitle">ปรับรูปแบบการแสดงผลให้เหมาะกับการใช้งาน</p></div></div><form id="settingsForm">
      <label class="field settings-language">ภาษา / Language<select name="language"><option value="th" ${preferences.language==='th'?'selected':''}>ไทย</option><option value="en" ${preferences.language==='en'?'selected':''}>English</option></select></label>
      <fieldset class="settings-group"><legend>รูปแบบหน้าจอ</legend><div class="theme-options">
        <label class="theme-option"><input type="radio" name="theme" value="light" ${preferences.theme==='light'?'checked':''}><span class="theme-preview light-preview"><i></i></span><b>สว่าง</b></label>
        <label class="theme-option"><input type="radio" name="theme" value="dark" ${preferences.theme==='dark'?'checked':''}><span class="theme-preview dark-preview"><i></i></span><b>มืด</b></label>
        <label class="theme-option"><input type="radio" name="theme" value="system" ${preferences.theme==='system'?'checked':''}><span class="theme-preview system-preview"><i></i></span><b>ตามระบบ</b></label>
      </div></fieldset>
      <fieldset class="settings-group"><legend>การใช้งาน</legend>
        <label class="setting-switch"><span><b>ลดการเคลื่อนไหว</b><small>ลดเอฟเฟกต์และแอนิเมชันในหน้าจอ</small></span><input name="reduceMotion" type="checkbox" ${preferences.reduceMotion?'checked':''}></label>
        <label class="setting-switch"><span><b>ยืนยันก่อนออกจากระบบ</b><small>ป้องกันการกดออกจากระบบโดยไม่ตั้งใจ</small></span><input name="confirmLogout" type="checkbox" ${preferences.confirmLogout?'checked':''}></label>
      </fieldset>
      <button class="button primary wide" type="submit">บันทึกการตั้งค่า</button></form>`;
    $('#settingsForm').onsubmit=event=>{event.preventDefault();const form=event.currentTarget;localStorage.setItem('preferences',JSON.stringify({theme:new FormData(form).get('theme')||'light',language:form.language.value||'th',reduceMotion:form.reduceMotion.checked,confirmLogout:form.confirmLogout.checked}));applyPreferences();modal.close();toast(readPreferences().language==='en'?'Settings saved':'บันทึกการตั้งค่าแล้ว')};
    modal.showModal();
  };

  window.requestLogout=function(){
    if(readPreferences().confirmLogout&&!confirm('ต้องการออกจากระบบใช่หรือไม่?'))return;
    logout();
  };
  const managementIcon=name=>({
    borrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7 12 3l8 4-8 4zM4 7v10l8 4 4-2M12 11v10M15 14h7m-3-3 3 3-3 3"/></svg>',
    return:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7 12 3l8 4-8 4zM4 7v10l8 4 8-4v-4M12 11v10M22 10h-7m3-3-3 3 3 3"/></svg>',
    history:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11a9 9 0 1 1 2.6 7M3 4v7h7M12 7v5l3 2"/></svg>',
    dashboard:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5V20h-5v-5H9v5H4z"/></svg>',
    stock:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5zM4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
    loans:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h12M14 4l3 3-3 3M19 17H7M10 14l-3 3 3 3"/></svg>',
    maintenance:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-3 3-3-3z"/></svg>',
    accounts:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-4 2.5-6 5.5-6s4.9 2 5.5 6M16 11h5M18.5 8.5v5"/></svg>',
    profile:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4.5 3-6.5 7-6.5s6.3 2 7 6.5"/></svg>'
  }[name]);
  const isOverdue=loan=>loan.status==='borrowed'&&loan.dueAt&&new Date(loan.dueAt)<new Date();
  const overdueText=loan=>`เกินกำหนด ${loan.overdueDays||Math.max(1,Math.ceil((Date.now()-new Date(loan.dueAt))/86400000))} วัน`;

  window.nav=function(){
    const admin=state.user?.role==='admin';
    const items=admin
      ? [['dashboard','ตรวจเช็ค','ภาพรวมอุปกรณ์'],['stock','คลังอุปกรณ์','จัดการอุปกรณ์ทั้งหมด'],['loans','ติดตามการยืม','ตรวจสอบกำหนดคืน'],['maintenance','ซ่อมบำรุง','ดูแลและติดตามการซ่อม'],['accounts','ผู้ใช้งาน','จัดการบัญชีผู้ใช้'],['profile','บัญชีของฉัน',state.user?.fullName||'ข้อมูลส่วนตัวและตั้งค่า']]
      : [['dashboard','ตรวจเช็ค','ภาพรวมอุปกรณ์'],['borrow','ยืม','ค้นหาอุปกรณ์ที่ต้องการ'],['return','คืน','จัดการรายการที่ยืมไว้'],['loans','ประวัติ','ดูรายการใช้งานที่ผ่านมา'],['profile','บัญชี',state.user?.fullName||'ข้อมูลส่วนตัวและตั้งค่า']];
    const navigation=$('#bottomNav');
    navigation.classList.add('modern-nav');
    navigation.style.setProperty('--nav-count',items.length);
    navigation.setAttribute('aria-label','เมนูจัดการระบบ');
    navigation.innerHTML=items.map(([page,label,description])=>`<a href="#${page}" data-p="${page}" aria-label="${label}"><b class="nav-icon">${managementIcon(!admin&&page==='loans'?'history':page)}</b><span class="nav-copy"><span class="nav-label">${label}</span><small>${esc(description)}</small></span><span class="nav-arrow" aria-hidden="true">›</span></a>`).join('');
    window.active(location.hash.slice(1)||'dashboard');
  };
  const baseActive=window.active;
  window.active=function(page){
    baseActive(page);
    document.querySelectorAll('#bottomNav a').forEach(link=>{
      if(link.dataset.p===page)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
  };

  const baseLoanCard=window.loanCard;
  window.loanCard=function(loan,action=''){
    const html=baseLoanCard(loan,action);
    return isOverdue(loan)?html.replace('class="card loan-card"','class="card loan-card overdue-card"').replace(`<span class="badge ${loan.status}">${txt[loan.status]}</span>`,`<span class="badge overdue">${overdueText(loan)}</span>`):html;
  };

  const baseDashboard=window.dashboard;
  window.dashboard=async function(){
    await baseDashboard();
    const data=await api('/dashboard');
    if(data.overdueLoans>0){
      $('#content').insertAdjacentHTML('afterbegin',`<a class="overdue-alert" href="#loans"><b>⚠ มีรายการเกินกำหนด ${data.overdueLoans} รายการ</b><span>ตรวจสอบและติดตามการคืนอุปกรณ์ →</span></a>`);
    }
  };

  const equipmentDisplayStatus=item=>{
    if(item.status==='retired')return 'retired';
    if((item.maintenanceQuantity||0)>0)return 'maintenance';
    return 'available';
  };

  window.renderAdminEquipment=function(items){
    if(!items.length)return '<div class="card empty-state"><b>ไม่พบอุปกรณ์</b><p>ลองเปลี่ยนคำค้นหา หรือเพิ่มอุปกรณ์รายการใหม่</p></div>';
    return items.map(item=>{
      const displayStatus=equipmentDisplayStatus(item);
      return `<article class="card admin-equipment-card">
      <div class="device-art">${equipmentArt(item)}</div>
      <div class="equipment-copy"><span class="badge ${displayStatus}">${txt[displayStatus]}</span><h3>${esc(item.name)}</h3><div class="code">${esc(item.code)}</div><p class="meta">${esc(item.category)} · ชำรุด ${item.maintenanceQuantity||0} ชิ้น · ยืมได้ ${item.availableQuantity} ชิ้น</p></div>
      <div class="admin-card-tools">
        <button type="button" class="icon-edit" onclick="editAdminEquipment(${item.id})">✎ <span>แก้ไข</span></button>
        <input id="equipment-image-${item.id}" class="equipment-image-input" type="file" accept="image/jpeg,image/png,image/webp" onchange="changeEquipmentImage(event,${item.id})">
        <label class="icon-image" for="equipment-image-${item.id}">▣ <span>${item.imageUrl?'เปลี่ยนรูป':'เพิ่มรูป'}</span></label>
        <button type="button" class="icon-delete" onclick="removeAdminEquipment(${item.id})">⌫ <span>ลบ</span></button>
      </div>
    </article>`;
    }).join('');
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
    $('#content').innerHTML=`<div class="admin-page-head"><div><h1 class="page-title">จัดการบัญชีผู้ใช้</h1><p class="subtitle">ตรวจสอบสิทธิ์ สถานะ และรายการยืมของสมาชิก</p></div><span class="count-pill">${users.length} บัญชี</span></div><div class="search"><input id="accountSearch" placeholder="ค้นหาชื่อ ชื่อผู้ใช้ อีเมล หรือรหัสนิสิต..."></div><div id="accountList" class="account-grid">${renderAccounts(users)}</div>`;
    $('#accountSearch').oninput=event=>{const q=event.target.value.toLowerCase();$('#accountList').innerHTML=renderAccounts(users.filter(user=>`${user.fullName} ${user.username} ${user.email||''} ${user.studentId||''}`.toLowerCase().includes(q)))};
  };

  const accountAvatar=user=>{
    if(user.avatarUrl)return `<img src="${esc(user.avatarUrl)}" alt="">`;
    return esc((user.fullName||'?')[0]);
  };
  const accountStatus=user=>user.active?'available':'retired';
  const accountStatusText=user=>user.active?'ใช้งานได้':'ปิดใช้งาน';
  const accountRole=user=>user.role==='admin'?'ผู้ดูแลระบบ':'ผู้ใช้งาน';
  const accountToggleClass=user=>user.active?'danger':'primary';
  const accountToggleText=user=>user.active?'ปิดบัญชี':'เปิดบัญชี';
  const accountCard=user=>`<article class="card account-card ${user.active?'':'inactive'}"><div class="account-avatar">${accountAvatar(user)}</div><div class="account-copy"><span class="badge ${accountStatus(user)}">${accountStatusText(user)}</span><h3>${esc(user.fullName)}</h3><div class="code">${esc(user.username)}</div><p class="meta">${esc(user.email||'ยังไม่ผูกอีเมล')} · ${esc(user.studentId||'ไม่มีรหัสนิสิต')} · ${accountRole(user)}</p><p class="account-stats">กำลังยืม ${user.activeLoans} · <strong class="${user.overdueLoans?'red-text':''}">เกินกำหนด ${user.overdueLoans}</strong></p></div><div class="account-actions"><button class="button secondary compact" onclick="showUserLoans(${user.id})">ดูการยืม</button><button class="button secondary compact" onclick="editAccount(${user.id})">แก้ไขข้อมูล</button><button class="button ${accountToggleClass(user)} compact" onclick="toggleAccount(${user.id})">${accountToggleText(user)}</button></div></article>`;

  window.renderAccounts=function(users){
    if(!users.length)return '<div class="card empty-state"><b>ไม่พบบัญชีผู้ใช้</b></div>';
    return users.map(accountCard).join('');
  };

  window.editAccount=async function(id){
    const users=await api('/users');const user=users.find(value=>String(value.id)===String(id));if(!user)return;
    $('#modalBody').innerHTML=`<h2>แก้ไขบัญชีผู้ใช้</h2><form id="accountForm"><label class="field">ชื่อ-นามสกุล<input name="fullName" value="${esc(user.fullName)}" required></label><label class="field">อีเมลสำหรับกู้คืนรหัสผ่าน<input name="email" type="email" value="${esc(user.email||'')}"></label><label class="field">รหัสนิสิต<input name="studentId" value="${esc(user.studentId||'')}"></label><label class="field">สิทธิ์<select name="role"><option value="user">ผู้ใช้งาน</option><option value="admin">ผู้ดูแลระบบ</option></select></label><label class="toggle-row"><input name="active" type="checkbox" ${user.active?'checked':''}><span>อนุญาตให้เข้าสู่ระบบ</span></label><button class="button primary wide">บันทึกบัญชี</button></form>`;
    $('#accountForm [name="role"]').value=user.role;
    const accountModal=document.querySelector('#modal');
    $('#accountForm').onsubmit=async event=>{event.preventDefault();const form=Object.fromEntries(new FormData(event.target));form.active=$('#accountForm [name="active"]').checked;try{await api(`/users/${id}`,{method:'PUT',body:JSON.stringify(form)});accountModal.close();toast('บันทึกบัญชีเรียบร้อยแล้ว');await accounts()}catch(error){toast(error.message,true)}};accountModal.showModal();
  };

  window.toggleAccount=async function(id){
    try{
      const users=await api('/users');const user=users.find(value=>String(value.id)===String(id));if(!user)return;
      const action=user.active?'ปิด':'เปิด';
      if(!confirm(`ยืนยันการ${action}บัญชีของ ${user.fullName}?`))return;
      await api(`/users/${id}`,{method:'PUT',body:JSON.stringify({fullName:user.fullName,email:user.email,studentId:user.studentId,role:user.role,active:!user.active})});
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

  const inputDate=value=>{
    const dateValue=new Date(value);
    if(Number.isNaN(dateValue.getTime()))return '';
    const offset=dateValue.getTimezoneOffset()*60000;
    return new Date(dateValue-offset).toISOString().slice(0,10);
  };

  window.openLoanExport=function(){
    const dates=state.loans.map(item=>new Date(item.borrowedAt)).filter(value=>!Number.isNaN(value.getTime()));
    const first=dates.length?new Date(Math.min(...dates)):new Date();
    const last=dates.length?new Date(Math.max(...dates)):new Date();
    $('#modalBody').innerHTML=`<h2>ดาวน์โหลดข้อมูล Excel</h2><p class="subtitle">เลือกช่วงตามวันที่ยืม ระบบจะส่งออกทุกสถานะในช่วงที่เลือก</p><form id="loanExportForm">
      <div class="export-range"><label class="field">ตั้งแต่วันที่<input name="from" type="date" value="${inputDate(first)}" required></label><label class="field">ถึงวันที่<input name="to" type="date" value="${inputDate(last)}" required></label></div>
      <div class="export-note">ข้อมูลที่ได้: ผู้ยืม รหัสนิสิต อีเมล อุปกรณ์ จำนวน สถานะ วันยืม กำหนดคืน วันคืน สภาพและหมายเหตุ</div>
      <button class="button primary wide" type="submit">ดาวน์โหลดข้อมูล</button></form>`;
    $('#loanExportForm').onsubmit=event=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.target));exportLoanExcel(values.from,values.to)};
    modal.showModal();
  };

  const csvCell=value=>{
    let text=value==null?'':String(value);
    if(/^[=+\-@]/.test(text))text=`'${text}`;
    return `"${text.replace(/"/g,'""')}"`;
  };
  const exportDate=value=>{
    if(!value)return '';
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return '';
    const pad=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  window.exportLoanExcel=async function(from,to){
    try{
      const start=new Date(`${from}T00:00:00`),end=new Date(`${to}T23:59:59.999`);
      if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||start>end){toast('กรุณาเลือกช่วงวันที่ให้ถูกต้อง',true);return;}
      const [allLoans,users]=await Promise.all([api('/loans'),api('/users')]);
      const userMap=new Map(users.map(user=>[String(user.id),user]));
      const items=allLoans.filter(item=>{const borrowed=new Date(item.borrowedAt);return borrowed>=start&&borrowed<=end});
      if(!items.length){toast('ไม่พบข้อมูลในช่วงวันที่ที่เลือก',true);return;}
      const headers=['ลำดับ','รหัสรายการ','ชื่อ-นามสกุล','รหัสนิสิต','อีเมล/ชื่อผู้ใช้','สิทธิ์','รหัสอุปกรณ์','ชื่ออุปกรณ์','จำนวน','วันที่ยืม','กำหนดคืน','วันที่คืนจริง','สถานะ','สภาพตอนคืน','หมายเหตุการยืม','หมายเหตุการคืน'];
      const rows=items.map((item,index)=>{const user=userMap.get(String(item.userId))||{};return [index+1,item.id,item.borrowerName,item.studentId||'',user.username||'',user.role==='admin'?'ผู้ดูแลระบบ':'ผู้ใช้งาน',item.equipmentCode,item.equipmentName,item.quantity,exportDate(item.borrowedAt),exportDate(item.dueAt),exportDate(item.returnedAt),txt[item.status]||item.status,txt[item.returnCondition]||item.returnCondition||'',item.borrowRemark||'',item.returnRemark||'']});
      const csv=[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
      const blob=new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=`รายงานการยืม_${from}_ถึง_${to}.csv`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);modal.close();toast(`ดาวน์โหลดแล้ว ${items.length} รายการ`);
    }catch(error){toast(error.message||'ดาวน์โหลดไม่สำเร็จ',true)}
  };

  const baseRenderAdminLoans=window.renderAdminLoans;
  window.renderAdminLoans=function(items){
    const html=baseRenderAdminLoans(items);
    if(!items.some(isOverdue))return html;
    const shell=document.createElement('div');shell.innerHTML=html;
    shell.querySelectorAll('.admin-loan-card').forEach((card,index)=>{if(isOverdue(items[index])){card.classList.add('overdue-card');const badge=card.querySelector('.badge');if(badge){badge.className='badge overdue';badge.textContent=overdueText(items[index])}}});
    return shell.innerHTML;
  };


  function editableProfileDetail(field,label){
    return '<div class="profile-detail" id="profile-'+field+'"><small>'+label+'</small><div class="profile-value-row"><b>'+esc(state.user[field]||'-')+'</b><button type="button" class="profile-pencil" data-profile-field="'+field+'" aria-label="แก้ไข'+label+'" title="แก้ไข'+label+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg></button></div></div>';
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-profile-field]');
    if(button)editProfileField(button.dataset.profileField);
  });
  function editProfileField(field){
    if(!['username','studentId'].includes(field))return;
    const box=document.getElementById('profile-'+field);
    const label=field==='username'?'ชื่อผู้ใช้':'รหัสนิสิต';
    box.innerHTML='<form class="profile-inline-form"><label class="field">'+label+'<input name="'+field+'" value="'+esc(state.user[field]||'')+'" maxlength="'+(field==='username'?50:20)+'" '+(field==='username'?'minlength="4" pattern="[A-Za-z0-9._-]+" required':'')+'></label><p class="profile-edit-error" role="alert"></p><div class="profile-inline-actions"><button class="button primary compact" type="submit">บันทึก</button><button class="button secondary compact" type="button">ยกเลิก</button></div></form>';
    const form=box.querySelector('form'),cancel=form.querySelector('[type=button]');
    const restore=()=>{box.outerHTML=editableProfileDetail(field,label);document.querySelector('#profile-'+field+' button').focus()};
    cancel.onclick=restore;
    form.onkeydown=event=>{if(event.key==='Escape'&&!cancel.disabled){event.preventDefault();restore()}};
    form.onsubmit=async event=>{
      event.preventDefault();
      const payload={username:state.user.username,studentId:state.user.studentId||'',[field]:form.elements[field].value.trim()};
      form.querySelectorAll('button').forEach(button=>button.disabled=true);
      try{
        const user=await api('/auth/profile',{method:'PUT',body:JSON.stringify(payload)});
        Object.assign(state.user,user);localStorage.setItem('user',JSON.stringify(state.user));restore();
        const identity=document.querySelector('.profile-primary p');if(identity)identity.textContent=state.user.username;
        toast('บันทึกข้อมูลเรียบร้อยแล้ว');
      }catch(error){form.querySelector('.profile-edit-error').textContent=error.message;form.querySelectorAll('button').forEach(button=>button.disabled=false)}
    };
    form.querySelector('input').focus();
  }

  window.profile=function(){
    const admin=state.user.role==='admin',avatar=state.user.avatarUrl?`<img src="${esc(state.user.avatarUrl)}" alt="รูปโปรไฟล์">`:`<span>${esc((state.user.fullName||state.user.username||'?')[0])}</span>`;
    $('#content').innerHTML=`<section class="profile-page">
      <header class="profile-page-head"><div><p class="profile-overline">ACCOUNT MANAGEMENT</p><h1 class="page-title">บัญชีผู้ใช้</h1><p class="subtitle">จัดการข้อมูลส่วนตัว รูปโปรไฟล์ และการตั้งค่าบัญชี</p></div><span class="profile-status"><i></i>บัญชีใช้งานอยู่</span></header>
      <div class="profile-panel">
        <div class="profile-identity"><div class="profile-avatar-large">${avatar}</div><div class="profile-primary"><span class="profile-role">${admin?'ผู้ดูแลระบบ':'นักศึกษา'}</span><h2>${esc(state.user.fullName)}</h2><p>${esc(state.user.username)}</p></div><div class="profile-upload"><input id="profileImageInput" class="profile-image-input" type="file" accept="image/jpeg,image/png,image/webp" onchange="changeProfileImage(event)"><label for="profileImageInput" class="button secondary"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4l1.5-2h5L16 7h4v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg>${state.user.avatarUrl?'เปลี่ยนรูปโปรไฟล์':'เพิ่มรูปโปรไฟล์'}</label></div></div>
        <div class="profile-divider"></div>
        <div class="profile-details"><div class="profile-detail"><small>ชื่อ-นามสกุล</small><b>${esc(state.user.fullName)}</b></div>${editableProfileDetail("username","ชื่อผู้ใช้")}<div class="profile-detail"><small>อีเมล</small><b>${esc(state.user.email||'ยังไม่ผูกอีเมล')}</b></div>${editableProfileDetail("studentId","รหัสนิสิต")}<div class="profile-detail"><small>สิทธิ์การใช้งาน</small><b>${admin?'ผู้ดูแลระบบ':'ผู้ใช้งานทั่วไป'}</b></div></div>
      </div>
      <div class="profile-actions"><button class="profile-action-card" type="button" onclick="forgotPassword(state.user.email||'','change')"><span class="profile-action-icon">⚿</span><span><b>เปลี่ยนรหัสผ่าน</b><small>ยืนยันตัวตนด้วย OTP ทางอีเมล</small></span><span class="profile-action-arrow">›</span></button><button class="profile-action-card" type="button" onclick="openSettings()"><span class="profile-action-icon">⚙</span><span><b>ตั้งค่าระบบ</b><small>ธีม ภาษา และการใช้งาน</small></span><span class="profile-action-arrow">›</span></button><button class="profile-action-card danger" type="button" onclick="requestLogout()"><span class="profile-action-icon">⇥</span><span><b>ออกจากระบบ</b><small>สิ้นสุดเซสชันการใช้งานบนอุปกรณ์นี้</small></span><span class="profile-action-arrow">›</span></button></div>
    </section>`;
    applyLanguage();
  };

  const baseRoute=window.route;
  window.route=async function(){
    const contentScroller=document.querySelector('main');
    if(contentScroller)contentScroller.scrollTo({top:0,left:0,behavior:'auto'});
    if(location.hash==='#accounts'){
      window.active('accounts');
      try{await accounts()}catch(error){toast(error.message,true)}
      return;
    }
    await baseRoute();
    if(contentScroller)contentScroller.scrollTop=0;
  };
})();

(function enhanceAdminUI(){
  const svg=(name)=>({
    dashboard:'<svg viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
    stock:'<svg viewBox="0 0 24 24"><path d="M4 7h16v13H4zM7 4h10v3H7zM8 11h8M8 15h8"/></svg>',
    loans:'<svg viewBox="0 0 24 24"><path d="M4 7h11M4 12h8M4 17h7M17 10v10M13 16l4 4 4-4"/></svg>',
    maintenance:'<svg viewBox="0 0 24 24"><path d="M14 6a4 4 0 0 0-5 5L3 17l4 4 6-6a4 4 0 0 0 5-5l-3 3-4-4z"/></svg>',
    profile:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/></svg>'
  }[name]);

  const originalNav=nav;
  nav=function(){
    if(state.user?.role!=='admin')return originalNav();
    const items=[['dashboard','ตรวจเช็ค'],['stock','คลัง'],['loans','ติดตาม'],['maintenance','ซ่อมบำรุง'],['profile','บัญชี']];
    $('#bottomNav').innerHTML=items.map(([page,label])=>`<a href="#${page}" data-p="${page}"><b>${svg(page)}</b>${label}</a>`).join('');
  };

  const originalStock=stock;
  add=async function(){
    $('#content').innerHTML=`
      <h1 class="page-title">เพิ่มอุปกรณ์</h1>
      <p class="subtitle">กรอกข้อมูลและแนบภาพอุปกรณ์เพื่อให้ผู้ใช้งานเห็นภาพจริง</p>
      <form id="addForm">
        <label class="field">ชื่ออุปกรณ์<input name="name" placeholder="เช่น ESP32" required></label>
        <label class="field">รหัสอุปกรณ์<input name="code" placeholder="เช่น IOT-1234" required></label>
        <label class="field">หมวดหมู่<input name="category" placeholder="เลือกหมวดหมู่" required></label>
        <label class="field">จำนวนอุปกรณ์ทั้งหมด<input name="totalQuantity" type="number" min="1" value="1" required></label>
        <label class="field">รายละเอียด<textarea name="description" rows="3"></textarea></label>
        <div class="image-upload">
          <div id="equipmentImagePreview" class="image-preview">ยังไม่ได้เลือกภาพ</div>
          <label class="field">ภาพอุปกรณ์
            <input id="equipmentImage" type="file" accept="image/jpeg,image/png,image/webp">
            <span class="image-help">รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 2 MB</span>
          </label>
        </div>
        <input type="hidden" name="status" value="available">
        <button class="button primary wide">▣ บันทึกข้อมูล</button>
      </form>`;
    let imageUrl='';
    const input=$('#equipmentImage');
    input.onchange=()=>{
      const file=input.files[0];
      if(!file){imageUrl='';$('#equipmentImagePreview').textContent='ยังไม่ได้เลือกภาพ';return;}
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024){
        input.value='';imageUrl='';
        $('#equipmentImagePreview').textContent='ยังไม่ได้เลือกภาพ';
        toast('รูปภาพต้องเป็น JPG, PNG หรือ WebP และไม่เกิน 2 MB',true);return;
      }
      const reader=new FileReader();
      reader.onload=()=>{imageUrl=reader.result;$('#equipmentImagePreview').innerHTML=`<img src="${imageUrl}" alt="ตัวอย่างภาพอุปกรณ์">`;};
      reader.readAsDataURL(file);
    };
    $('#addForm').onsubmit=async event=>{
      event.preventDefault();
      const button=event.submitter;
      if(button)button.disabled=true;
      try{
        const data=Object.fromEntries(new FormData(event.target));
        data.imageUrl=imageUrl;
        await api('/equipment',{method:'POST',body:JSON.stringify(data)});
        toast('บันทึกข้อมูลและภาพอุปกรณ์แล้ว');
        location.hash='stock';
      }catch(error){toast(error.message,true);if(button)button.disabled=false;}
    };
  };

  stock=async function(){
    state.equipment=await api('/equipment');
    $('#content').innerHTML=`
      <div class="admin-page-head">
        <div><h1 class="page-title">คลัง</h1><p class="subtitle">จัดการข้อมูลอุปกรณ์ทั้งหมด</p></div>
        <button class="button primary compact" onclick="location.hash='add'">＋ เพิ่ม</button>
      </div>
      <div class="search"><input id="adminEquipmentSearch" placeholder="ค้นหาด้วย ID หรือชื่ออุปกรณ์..."></div>
      <div id="adminEquipmentList">${renderAdminEquipment(state.equipment)}</div>
      <div class="admin-stock"><div><small>รวมอุปกรณ์</small><strong>${state.equipment.reduce((sum,item)=>sum+item.totalQuantity,0)}</strong></div><div><small>ต้องซ่อม</small><strong>${state.equipment.reduce((sum,item)=>sum+(item.maintenanceQuantity||0),0)}</strong></div></div>`;
    $('#adminEquipmentSearch').oninput=event=>{
      const search=event.target.value.toLowerCase();
      $('#adminEquipmentList').innerHTML=renderAdminEquipment(state.equipment.filter(item=>(item.name+item.code+item.category).toLowerCase().includes(search)));
    };
  };

  window.renderAdminEquipment=function(items){
    if(!items.length)return '<div class="card empty-state">ไม่พบอุปกรณ์</div>';
    return items.map(item=>`<article class="card admin-equipment-card">
      <div class="device-art">${equipmentArt(item)}</div>
      <div><span class="badge ${item.status==='retired'?'retired':(item.maintenanceQuantity||0)>0?'maintenance':'available'}">${txt[item.status==='retired'?'retired':(item.maintenanceQuantity||0)>0?'maintenance':'available']}</span><h3>${esc(item.name)}</h3><div class="code">${esc(item.code)}</div><p class="meta">${esc(item.category)} · ชำรุด ${item.maintenanceQuantity||0} ชิ้น · ยืมได้ ${item.availableQuantity} ชิ้น</p></div>
      <div class="admin-card-tools">
        <input id="equipment-image-${item.id}" class="equipment-image-input" type="file" accept="image/jpeg,image/png,image/webp" onchange="changeEquipmentImage(event,${item.id})">
        <label class="icon-image" for="equipment-image-${item.id}" aria-label="เพิ่มหรือเปลี่ยนรูป ${esc(item.name)}" title="เพิ่มหรือเปลี่ยนรูป"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4l1.5-2h5L16 7h4v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg><span>${item.imageUrl?'เปลี่ยนรูป':'เพิ่มรูป'}</span></label>
        <button type="button" class="icon-delete" aria-label="ลบ ${esc(item.name)}" title="ลบอุปกรณ์" onclick="removeAdminEquipment(${item.id})"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"/></svg><span>ลบ</span></button>
      </div>
    </article>`).join('');
  };

  window.changeEquipmentImage=function(event,id){
    const item=state.equipment.find(value=>String(value.id)===String(id));
    if(!item)return;
    const input=event.currentTarget;
    const file=input.files?.[0];
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024){
      input.value='';
      toast('รูปภาพต้องเป็น JPG, PNG หรือ WebP และไม่เกิน 2 MB',true);return;
    }
    const reader=new FileReader();
    reader.onerror=()=>toast('ไม่สามารถอ่านไฟล์รูปภาพได้',true);
    reader.onload=async()=>{
      const previousImage=item.imageUrl;
      item.imageUrl=reader.result;
      const list=$('#adminEquipmentList');
      if(list)list.innerHTML=renderAdminEquipment(state.equipment);
      toast('กำลังบันทึกรูปภาพ...');
      try{
        await api(`/equipment/${id}`,{method:'PUT',body:JSON.stringify({
          code:item.code,name:item.name,category:item.category,
          description:item.description||'',totalQuantity:item.totalQuantity,
          status:item.status,imageUrl:reader.result
        })});
        toast('บันทึกภาพอุปกรณ์แล้ว');
        await stock();
      }catch(error){
        item.imageUrl=previousImage;
        const currentList=$('#adminEquipmentList');
        if(currentList)currentList.innerHTML=renderAdminEquipment(state.equipment);
        input.value='';
        toast(error.message||'บันทึกรูปภาพไม่สำเร็จ',true);
      }
    };
    reader.readAsDataURL(file);
  };

  window.removeAdminEquipment=async function(id){
    if(!confirm('ยืนยันการลบอุปกรณ์รายการนี้?'))return;
    try{
      await api(`/equipment/${id}`,{method:'DELETE'});
      toast('ลบอุปกรณ์เรียบร้อยแล้ว');
      await stock();
    }catch(error){toast(error.message,true);}
  };

  const originalLoans=loans;
  loans=async function(){
    if(state.user?.role!=='admin')return originalLoans();
    state.loans=await api('/loans');
    $('#content').innerHTML=`
      <h1 class="page-title">ติดตามการยืม</h1>
      <p class="subtitle">ตรวจสอบว่าใครกำลังยืมอุปกรณ์และกำหนดคืน</p>
      <div class="search"><input id="adminLoanSearch" placeholder="ค้นหาชื่อผู้ยืม รหัสนิสิต หรืออุปกรณ์..."></div>
      <div class="filter-row"><button class="chip active" data-status="">ทั้งหมด</button><button class="chip" data-status="borrowed">กำลังยืม</button><button class="chip" data-status="returned">คืนแล้ว</button></div>
      <div id="adminLoanList">${renderAdminLoans(state.loans)}</div>`;
    let selectedStatus='';
    const update=()=>{
      const search=$('#adminLoanSearch').value.toLowerCase();
      const filtered=state.loans.filter(item=>(!selectedStatus||item.status===selectedStatus)&&(`${item.borrowerName} ${item.studentId||''} ${item.equipmentName} ${item.equipmentCode}`).toLowerCase().includes(search));
      $('#adminLoanList').innerHTML=renderAdminLoans(filtered);
    };
    $('#adminLoanSearch').oninput=update;
    document.querySelectorAll('[data-status]').forEach(button=>button.onclick=()=>{
      document.querySelectorAll('[data-status]').forEach(item=>item.classList.remove('active'));
      button.classList.add('active');selectedStatus=button.dataset.status;update();
    });
  };

  window.renderAdminLoans=function(items){
    if(!items.length)return '<div class="card empty-state">ไม่พบรายการยืม</div>';
    return items.map(item=>`<article class="card admin-loan-card">
      <div class="admin-loan-top"><div class="device-art">${equipmentArt({imageUrl:item.imageUrl,name:item.equipmentName,category:''})}</div><div><div class="code">${esc(item.equipmentCode)}</div><h3>${esc(item.equipmentName)}</h3><p class="meta">จำนวน ${item.quantity} ชิ้น</p></div><span class="badge ${item.status}">${txt[item.status]}</span></div>
      <div class="borrower-row"><span class="borrower-avatar">${esc((item.borrowerName||'?')[0])}</span><div><small>ผู้ยืม</small><b>${esc(item.borrowerName)}</b><span>${esc(item.studentId||'ไม่มีรหัสนิสิต')}</span></div></div>
      <footer><span>วันที่ยืม <b>${date(item.borrowedAt)}</b></span><span>กำหนดคืน <b>${date(item.dueAt)}</b></span></footer>
    </article>`).join('');
  };

  window.maintenance=async function(){
    const allLoans=await api('/loans');
    const issueConditions=['damaged','abnormal','lost'];
    const items=allLoans.filter(item=>{
      const repairable=['damaged','abnormal'].includes(item.returnCondition);
      return (!repairable||!item.repairedAt)&&(item.borrowRemark||item.returnRemark||issueConditions.includes(item.returnCondition));
    });
    $('#content').innerHTML=`<h1 class="page-title">ซ่อมบำรุง</h1><p class="subtitle">แสดงเฉพาะอุปกรณ์ที่มีหมายเหตุหรือถูกระบุว่าชำรุด</p><div class="search"><input id="maintenanceSearch" placeholder="ค้นหาอุปกรณ์หรือผู้แจ้ง..."></div><div id="maintenanceList">${renderMaintenance(items)}</div>`;
    $('#maintenanceSearch').oninput=event=>{
      const search=event.target.value.toLowerCase();
      $('#maintenanceList').innerHTML=renderMaintenance(items.filter(item=>(`${item.equipmentName} ${item.equipmentCode} ${item.borrowerName} ${item.borrowRemark||''} ${item.returnRemark||''}`).toLowerCase().includes(search)));
    };
  };

  window.renderMaintenance=function(items){
    if(!items.length)return '<div class="card empty-state"><b>ไม่มีอุปกรณ์รอซ่อม</b><p class="meta">รายการที่มีหมายเหตุหรือระบุว่าชำรุดจะแสดงที่นี่</p></div>';
    return items.map(item=>`<article class="card maintenance-card ${item.returnCondition||'remark'}">
      <div class="admin-loan-top"><div class="device-art">${equipmentArt({imageUrl:item.imageUrl,name:item.equipmentName,category:''})}</div><div><div class="code">${esc(item.equipmentCode)}</div><h3>${esc(item.equipmentName)}</h3><p class="meta">แจ้งโดย ${esc(item.borrowerName)}${item.studentId?` · ${esc(item.studentId)}`:''}</p></div>${item.returnCondition?`<span class="badge ${item.returnCondition}">${txt[item.returnCondition]}</span>`:'<span class="badge borrowed">มีหมายเหตุ</span>'}</div>
      <div class="issue-note"><small>หมายเหตุ</small><p>${esc(item.returnRemark||item.borrowRemark||'ไม่ได้ระบุรายละเอียด')}</p></div>
      <footer><span>วันที่แจ้ง/คืน <b>${date(item.returnedAt||item.borrowedAt)}</b></span>${['damaged','abnormal'].includes(item.returnCondition)?`<button class="button primary compact" onclick="completeRepair(${item.id})">✓ เสร็จสิ้น</button>`:''}</footer>
    </article>`).join('');
  };

  window.completeRepair=async function(id){
    if(!confirm('ยืนยันว่าซ่อมอุปกรณ์รายการนี้เสร็จแล้วและพร้อมให้ยืม?'))return;
    try{
      const result=await api(`/loans/${id}/repair`,{method:'POST'});
      toast(result.message);
      await window.maintenance();
    }catch(error){toast(error.message,true);}
  };

  window.addEventListener('hashchange',()=>{
    if(location.hash==='#maintenance'&&state.user?.role==='admin'){
      active('maintenance');
      window.maintenance().catch(error=>toast(error.message,true));
    }
  });

  if(state.user?.role==='admin'){
    nav();
    if(location.hash==='#maintenance')window.maintenance();
    else active(location.hash.slice(1)||'dashboard');
  }
})();

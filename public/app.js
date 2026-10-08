const state={token:localStorage.getItem('token'),user:JSON.parse(localStorage.getItem('user')||'null'),equipment:[],loans:[],cart:JSON.parse(localStorage.getItem('cart')||'[]')};
let realtimeSource=null,realtimeTimer=null;
function stopRealtime(){if(realtimeSource){realtimeSource.close();realtimeSource=null}clearTimeout(realtimeTimer)}
function refreshFromRealtime(type){
  if(type==='connected'||!state.user||$('#appView').classList.contains('hidden'))return;
  const page=location.hash.slice(1)||'dashboard';
  const relevant={dashboard:['loans','equipment'],borrow:['loans','equipment'],return:['loans'],loans:['loans','equipment','users'],stock:['loans','equipment'],maintenance:['loans','equipment'],accounts:['loans','users']}[page]||[];
  if(!relevant.includes(type))return;
  clearTimeout(realtimeTimer);
  realtimeTimer=setTimeout(()=>{
    if(document.querySelector('#content form,dialog[open]'))return;
    if(page==='borrow'&&document.querySelector('#content .success'))return;
    route();
  },250);
}
function startRealtime(){
  stopRealtime();
  realtimeSource=new EventSource('/api/events');
  realtimeSource.onmessage=event=>{try{refreshFromRealtime(JSON.parse(event.data).type)}catch{}};
}
const $=s=>document.querySelector(s),esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const txt={outOfStock:'หมด',available:'พร้อมยืม',maintenance:'ซ่อมบำรุง',retired:'เลิกใช้งาน',borrowed:'กำลังยืม',pending_return:'รอตรวจรับ',returned:'คืนแล้ว',normal:'ปกติ',damaged:'ชำรุด',lost:'สูญหาย',abnormal:'ผิดปกติ'};
const date=v=>v?`<time data-date="${esc(v)}" datetime="${esc(v)}">${I18n.formatDate(v)}</time>`:'-';
async function api(path,opt={}){const r=await fetch('/api'+path,{...opt,headers:{'Content-Type':'application/json',...(state.token?{Authorization:`Bearer ${state.token}`}:{})}});if(r.status===204)return null;const d=await r.json();if(!r.ok){if(r.status===401)logout();throw Error(d.message||'เกิดข้อผิดพลาด')}return d}
function toast(message,error=false){return window.showNotification(message,{error})}
function saveCart(){localStorage.setItem('cart',JSON.stringify(state.cart))}function icon(e){return /sensor|dht|เซ็นเซอร์/i.test(e.name+e.category)?'♨':/led/i.test(e.name)?'▥':'▣'}
function equipmentArt(e){return e.imageUrl?`<img class="device-image" src="${esc(e.imageUrl)}" alt="${esc(e.name)}">`:`<span>${icon(e)}</span>`}
function login(d){state.token=d.token;state.user=d.user;localStorage.setItem('token',d.token);localStorage.setItem('user',JSON.stringify(d.user));history.replaceState(null,'','#dashboard');showApp()}
function logout(){stopRealtime();localStorage.removeItem('token');localStorage.removeItem('user');state.token=null;state.user=null;$('#appView').classList.add('hidden');$('#loginView').classList.remove('hidden')}
function nav(){const admin=state.user.role==='admin';const items=admin?[['dashboard','▦','ตรวจเช็ค'],['stock','▤','คลัง'],['add','⊕','เพิ่ม'],['loans','⌖','ติดตาม'],['profile','♙','บัญชี']]:[['dashboard','▦','ตรวจเช็ค'],['borrow','↝','ยืม'],['return','▣','คืน'],['loans','◴','ประวัติ'],['profile','♙','บัญชี']];$('#bottomNav').innerHTML=items.map(([p,i,t])=>`<a href="#${p}" data-p="${p}"><b>${i}</b>${t}</a>`).join('')}
function showApp(){if(!state.user)return logout();$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');nav();startRealtime();route()}
function active(page){document.querySelectorAll('#bottomNav a').forEach(a=>a.classList.toggle('active',a.dataset.p===page))}
function equipmentCard(e,withAdd=false){
  const repairing=e.maintenanceQuantity||0,cardStatus=e.status==='retired'?'retired':repairing>0&&repairing===e.totalQuantity?'maintenance':e.availableQuantity>0?'available':'outOfStock';
  const selected=state.cart.find(item=>item.id==e.id)?.quantity||0;
  const full=selected>=e.availableQuantity;
  const addLabel=selected?`✓ เพิ่มแล้ว · ${selected} ชิ้น`:'＋ เพิ่มในรายการ';
  const addHint=full?'เลือกครบจำนวนที่พร้อมให้ยืมแล้ว':selected?'เพิ่มอีก 1 ชิ้น':'เพิ่มในรายการยืม';
  return `<article class="card equipment-card"><div class="device-art">${equipmentArt(e)}</div><div><span class="badge ${cardStatus}">${txt[cardStatus]}</span><h3>${esc(e.name)}</h3><div class="code">${esc(e.code)}</div><p class="meta"><span translate="no">${esc(e.category)}</span> · ชำรุด ${repairing} ชิ้น · ยืมได้ ${e.availableQuantity} ชิ้น</p></div>${withAdd&&e.status!=='retired'&&e.availableQuantity>0?`<div class="card-action"><button class="button primary${selected?' is-selected':''}" onclick="addCart(${e.id})" title="${addHint}" aria-label="${esc(e.name)}: ${addLabel} — ${addHint}" ${full?'disabled':''}>${addLabel}</button></div>`:''}</article>`;
}
function loanCard(l,action=''){const displayStatus=l.pendingReturn?'pending_return':l.status;return `<article class="card loan-card"><div class="device-art">${equipmentArt({imageUrl:l.imageUrl,name:l.equipmentName,category:''})}</div><div><div class="code">${esc(l.equipmentCode)}</div><h3>${esc(l.equipmentName)}</h3><p class="meta">จำนวน ${l.quantity} ชิ้น</p></div><span class="badge ${displayStatus}">${txt[displayStatus]}</span><footer><span>วันที่ยืม<br><b>${date(l.borrowedAt)}</b></span><span>กำหนดคืน<br><b>${date(l.dueAt)}</b></span>${action}</footer></article>`}
async function dashboard(){
  const [d,loans]=await Promise.all([api('/dashboard'),api('/loans?sort=recent')]);
  const cards=[
    [d.total,'อุปกรณ์ทั้งหมด',''],[d.available,'พร้อมใช้งาน','green'],
    [d.borrowedQuantity,'ถูกยืมอยู่','orange'],[d.maintenance,'ชำรุด/รอซ่อม','red']
  ];
  if(d.lost>0)cards.push([d.lost,'สูญหาย','red']);
  if(d.retired>0)cards.push([d.retired,'เลิกใช้งาน','']);
  const activityTitle=state.user.role==='admin'?'ความเคลื่อนไหวล่าสุด':'ความเคลื่อนไหวล่าสุดของฉัน';
  $('#content').innerHTML=`<h1 class="page-title">ตรวจเช็ค</h1><p class="subtitle">ภาพรวมสถานะอุปกรณ์ทั้งหมดและความเคลื่อนไหวล่าสุด</p><section class="stats">${cards.map(([value,label,color])=>`<div class="stat ${color}"><strong>${value}</strong><span>${label}</span></div>`).join('')}</section><p class="meta">จำนวนอุปกรณ์ทั้งระบบ (หน่วย: ชิ้น)</p><h2 class="section-title">${activityTitle} <a href="#loans">ดูทั้งหมด</a></h2>${loans.slice(0,4).map(l=>loanCard(l)+`<p class="meta">${l.repairedAt?'ซ่อมเสร็จเมื่อ':l.returnedAt?'คืนเมื่อ':'ยืมเมื่อ'} ${date(l.repairedAt||l.returnedAt||l.borrowedAt)}</p>`).join('')||'<p class="subtitle">ยังไม่มีประวัติการยืม–คืน</p>'}`;
}
async function borrow(){state.equipment=await api('/equipment');$('#content').innerHTML=`<h1 class="page-title">ยืมอุปกรณ์</h1><p class="subtitle">เลือกอุปกรณ์ที่พร้อมใช้งาน แล้วกรอกข้อมูลผู้ยืมเพื่อบันทึกการยืม</p><h2 class="section-title">▤ อุปกรณ์ที่พร้อมให้ยืม <span class="badge available">${state.equipment.filter(e=>e.status!=='retired'&&e.availableQuantity>0).length} รายการ</span></h2><div class="search"><input id="searchEq" placeholder="ค้นหาอุปกรณ์"></div><div id="eqList">${state.equipment.map(e=>equipmentCard(e,true)).join('')}</div>${state.cart.length?`<div class="cart-bar"><b>▣</b><span>เลือกแล้ว<br>${state.cart.length} รายการ</span><button class="button primary" onclick="renderCart()">ยืนยันการยืม →</button></div>`:''}`;$('#searchEq').oninput=e=>{$('#eqList').innerHTML=state.equipment.filter(x=>(x.name+x.code+x.category).toLowerCase().includes(e.target.value.toLowerCase())).map(x=>equipmentCard(x,true)).join('')}}
function addCart(id){const e=state.equipment.find(x=>x.id==id),found=state.cart.find(x=>x.id==id);if(!e||e.status==='retired'||e.availableQuantity<=0)return;if(found&&found.quantity>=e.availableQuantity){toast('เลือกครบจำนวนที่พร้อมให้ยืมแล้ว');return}if(found){found.quantity++;found.max=e.availableQuantity}else state.cart.push({id:e.id,name:e.name,code:e.code,imageUrl:e.imageUrl,quantity:1,max:e.availableQuantity});saveCart();borrow();toast('เพิ่มในรายการยืมแล้ว')}
function renderCart(){const dueDate=document.querySelector('#dueDateDisplay')?.value||'';const borrowerName=document.querySelector('#cartForm [name="borrowerName"]')?.value??state.user.fullName;active('borrow');$('#content').innerHTML=`<h1 class="page-title">ตะกร้าอุปกรณ์</h1><p class="subtitle">ตรวจสอบจำนวนและกรอกข้อมูลการยืม</p><div class="cart-list">${state.cart.map((x,i)=>`<article class="card"><div class="device-art">${equipmentArt({imageUrl:x.imageUrl,name:x.name,category:''})}</div><div><h3>${esc(x.name)}</h3><div class="code">${esc(x.code)}</div></div><div class="counter"><button onclick="qty(${i},-1)">−</button><span>${x.quantity}</span><button onclick="qty(${i},1)">＋</button></div></article>`).join('')}</div><form id="cartForm"><label class="field">ชื่อผู้ยืม<input name="borrowerName" value="${esc(borrowerName)}" maxlength="120" autocomplete="name" placeholder="${esc(state.user.fullName)}"></label><div class="field"><label for="dueDateDisplay">กำหนดคืน (Return Date)</label><div class="return-date-input"><input id="dueDateDisplay" type="text" placeholder="วว/ดด/ปปปป" maxlength="10" required aria-describedby="dueDateHint" autocomplete="off"><span class="return-date-picker"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18"/></svg><input id="dueDatePicker" name="dueAt" type="date" aria-label="เลือกกำหนดคืนจากปฏิทิน"></span></div><small id="dueDateHint">วัน/เดือน/ปี ค.ศ. เช่น 25/09/2026</small></div><label class="field">หมายเหตุ<textarea name="remark" rows="3"></textarea></label><div class="summary"><div><span>จำนวนอุปกรณ์รวม</span><b>${state.cart.reduce((s,x)=>s+x.quantity,0)} ชิ้น</b></div><div><span>หมวดหมู่</span><b>${state.cart.length} รายการ</b></div></div><button class="button primary wide">● ยืนยันการยืม</button></form>`;$('#cartForm').onsubmit=submitCart;bindReturnDate(dueDate)}
function dateInputToISO(value){
  const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if(!match)return '';
  const [,day,month,year]=match;
  if(Number(year)<1000)return '';
  const parsed=new Date(`${year}-${month}-${day}T00:00:00Z`);
  return Number.isFinite(parsed.getTime())&&parsed.getUTCFullYear()===Number(year)&&parsed.getUTCMonth()+1===Number(month)&&parsed.getUTCDate()===Number(day)?`${year}-${month}-${day}`:'';
}
function bindReturnDate(value=''){
  const display=$('#dueDateDisplay'),picker=$('#dueDatePicker');
  display.value=value;
  const sync=()=>{
    const iso=dateInputToISO(display.value);
    display.setCustomValidity(display.value&&!iso?I18n.translate('กรุณาระบุวันที่จริงในรูปแบบ วัน/เดือน/ปี ค.ศ. เช่น 25/09/2026'):'');
    picker.value=iso;
  };
  display.oninput=sync;
  picker.onchange=()=>{display.value=picker.value?picker.value.split('-').reverse().join('/'):'';sync()};
  sync();
}
function qty(i,n){state.cart[i].quantity=Math.max(0,Math.min(state.cart[i].max,state.cart[i].quantity+n));if(!state.cart[i].quantity)state.cart.splice(i,1);saveCart();renderCart()}
async function submitCart(e){e.preventDefault();const form=Object.fromEntries(new FormData(e.target));try{for(const x of state.cart)await api('/loans',{method:'POST',body:JSON.stringify({equipmentId:x.id,quantity:x.quantity,...form})});state.cart=[];saveCart();$('#content').innerHTML=`<div class="success"><div class="success-icon">✓</div><h2 class="page-title">ทำรายการสำเร็จ</h2><p class="subtitle">บันทึกข้อมูลการยืมอุปกรณ์เรียบร้อยแล้ว</p><div class="card"><b>รายการยืมได้รับการบันทึกแล้ว</b><p class="meta">สามารถตรวจสอบกำหนดคืนได้ที่หน้าประวัติ</p></div><div class="success-actions"><button class="button primary" onclick="location.hash='loans'">ดูประวัติ</button><button class="button secondary" onclick="location.hash='dashboard'">กลับหน้าหลัก</button></div></div>`}catch(err){toast(err.message,true)}}
async function returns(){state.loans=await api('/loans?status=borrowed');$('#content').innerHTML=`<h1 class="page-title">คืนอุปกรณ์</h1><p class="subtitle">เลือกอุปกรณ์ที่ต้องการคืน</p><div class="search"><input placeholder="ค้นหาอุปกรณ์"></div>${state.loans.map(l=>loanCard(l,`<button class="button primary" onclick="returnForm(${l.id})">คืน</button>`)).join('')||'<p class="subtitle">ไม่มีอุปกรณ์ที่รอคืน</p>'}`}
function returnForm(id){const l=state.loans.find(x=>x.id==id);$('#content').innerHTML=`<h1 class="page-title">คืนอุปกรณ์</h1><p class="subtitle">เลือกอุปกรณ์และระบุสภาพ</p>${loanCard(l)}<form id="returnForm"><h2 class="section-title">สภาพอุปกรณ์เมื่อคืน</h2><div class="filter-row"><label class="chip active"><input type="radio" name="condition" value="normal" checked hidden>✓ ปกติ (Normal)</label><label class="chip"><input type="radio" name="condition" value="damaged" hidden>⌕ ชำรุด (Damaged)</label><label class="chip"><input type="radio" name="condition" value="lost" hidden>□ สูญหาย (Lost)</label></div><label class="field">หมายเหตุ/รายละเอียดเพิ่มเติม<textarea name="remark" rows="4" placeholder="ระบุรายละเอียดเพิ่มเติมหากอุปกรณ์มีปัญหา..."></textarea></label><button class="button primary wide">● ยืนยันการคืนอุปกรณ์</button></form>`;document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));c.classList.add('active')});$('#returnForm').onsubmit=async e=>{e.preventDefault();try{await api(`/loans/${id}/return`,{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});$('#content').innerHTML=`<div class="success"><div class="success-icon">✓</div><h2 class="page-title">คืนอุปกรณ์สำเร็จ</h2><p class="subtitle">บันทึกข้อมูลการคืนอุปกรณ์เรียบร้อยแล้ว</p><button class="button primary" onclick="location.hash='loans'">ดูประวัติ</button></div>`}catch(err){toast(err.message,true)}}}
function filterLoanHistory(items,search='',status='',now=new Date()){
  const query=search.trim().toLowerCase();
  const today=new Date(now);today.setHours(0,0,0,0);
  const cutoff=new Date(today);cutoff.setDate(cutoff.getDate()+4);
  return items.filter(loan=>{
    const matchesSearch=[loan.id,loan.equipmentId,loan.equipmentCode,loan.equipmentName].some(value=>String(value??'').toLowerCase().includes(query));
    const due=loan.dueAt?new Date(loan.dueAt):null;
    const matchesStatus=status==='pending_return'?!!loan.pendingReturn:status==='dueSoon'?loan.status==='borrowed'&&due&&due>=today&&due<cutoff:!status||loan.status===status;
    return matchesSearch&&matchesStatus;
  });
}
async function loans(){
  const previousSearch=$('#loanSearch')?.value||'';
  const previousStatus=$('#loanFilters .active')?.dataset.status||'';
  state.loans=await api('/loans');
  const returned=state.loans.filter(x=>x.status==='returned').length,activeLoans=state.loans.length-returned,issues=state.loans.filter(x=>['damaged','lost','abnormal'].includes(x.returnCondition)).length;
  $('#content').innerHTML=`<h1 class="page-title">ประวัติการใช้อุปกรณ์</h1><section class="stats"><div class="stat green"><strong>${activeLoans}</strong><span>กำลังยืม</span></div><div class="stat"><strong>${returned}</strong><span>คืนแล้ว</span></div><div class="stat red"><strong>${issues}</strong><span>เลขแจ้งซ่อม</span></div></section><div class="search"><input id="loanSearch" type="search" aria-label="ค้นหาด้วย ID หรือชื่ออุปกรณ์" placeholder="ค้นหาด้วย ID หรือชื่ออุปกรณ์" value="${esc(previousSearch)}"></div><div id="loanFilters" class="filter-row" role="group" aria-label="กรองสถานะการยืม">${[['','ทั้งหมด'],['returned','คืนแล้ว'],['borrowed','กำลังยืม'],['pending_return','รอตรวจรับ'],['dueSoon','ใกล้กำหนด']].map(([status,label])=>`<button type="button" class="chip${status===previousStatus?' active':''}" data-status="${status}" aria-pressed="${status===previousStatus}"${status==='dueSoon'?' title="ครบกำหนดตั้งแต่วันนี้ถึงอีก 3 วัน"':''}>${label}</button>`).join('')}</div><div id="loanList" aria-live="polite"></div>`;
  let selectedStatus=previousStatus;
  const render=()=>{
    const filtered=filterLoanHistory(state.loans,$('#loanSearch').value,selectedStatus);
    $('#loanList').innerHTML=filtered.map(loan=>loanCard(loan)).join('')||`<p class="subtitle">${state.loans.length?'ไม่พบรายการที่ตรงกับการค้นหาหรือตัวกรอง':'ยังไม่มีประวัติ'}</p>`;
  };
  $('#loanSearch').oninput=render;
  document.querySelectorAll('#loanFilters button').forEach(button=>button.onclick=()=>{
    selectedStatus=button.dataset.status;
    document.querySelectorAll('#loanFilters button').forEach(chip=>{
      const selected=chip.dataset.status===selectedStatus;
      chip.classList.toggle('active',selected);
      chip.setAttribute('aria-pressed',String(selected));
    });
    render();
  });
  render();
}
async function stock(){state.equipment=await api('/equipment');$('#content').innerHTML=`<h1 class="page-title">คลัง</h1><p class="subtitle">อุปกรณ์ทั้งหมด</p><div class="search"><input placeholder="ค้นหาด้วย ID หรือชื่ออุปกรณ์"></div>${state.equipment.map(e=>equipmentCard(e)).join('')}<div class="admin-stock"><div><small>รวมอุปกรณ์</small><strong>${state.equipment.reduce((s,e)=>s+e.totalQuantity,0)}</strong></div><div><small>ต้องซ่อม</small><strong>${state.equipment.filter(e=>e.status==='maintenance').length}</strong></div></div>`}
async function add(){state.equipment=await api('/equipment');$('#content').innerHTML=`<h1 class="page-title">เพิ่มอุปกรณ์</h1><form id="addForm"><label class="field">ชื่ออุปกรณ์<input name="name" placeholder="เช่น ESP32" required></label><label class="field">รหัสอุปกรณ์<input name="code" placeholder="เช่น IOT-1234" required></label><label class="field">หมวดหมู่<input name="category" placeholder="เลือกหมวดหมู่" required></label><label class="field">จำนวนอุปกรณ์ทั้งหมด<input name="totalQuantity" type="number" min="1" value="1" required></label><label class="field">รายละเอียด<textarea name="description"></textarea></label><input type="hidden" name="status" value="available"><button class="button primary wide">▣ บันทึกข้อมูล</button></form>`;$('#addForm').onsubmit=async e=>{e.preventDefault();try{await api('/equipment',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast('บันทึกข้อมูลแล้ว');e.target.reset()}catch(err){toast(err.message,true)}}}
function profile(){const admin=state.user.role==='admin';$('#content').innerHTML=`<section class="profile"><h1 class="page-title">บัญชี${admin?'Admin':'ผู้ใช้งาน'}</h1><div class="profile-avatar">${state.user.avatarUrl?`<img src="${esc(state.user.avatarUrl)}" alt="รูปโปรไฟล์">`:admin?'♟':'♙'}</div><input id="profileImageInput" class="profile-image-input" type="file" accept="image/jpeg,image/png,image/webp" onchange="changeProfileImage(event)"><label for="profileImageInput" class="button profile-image-button">▣ ${state.user.avatarUrl?'เปลี่ยนรูปโปรไฟล์':'เพิ่มรูปโปรไฟล์'}</label><h2 translate="no">${esc(state.user.fullName)}</h2><span class="badge available">● ${admin?'ผู้ดูแลระบบ':'นักศึกษา'}</span><div class="info-card"><small class="meta">ชื่อผู้ใช้</small><div translate="no">${esc(state.user.username)}</div>${state.user.studentId?`<hr><small class="meta">รหัสนิสิต</small><div>${esc(state.user.studentId)}</div>`:''}</div><button class="button danger wide" onclick="logout()">⇥ ออกจากระบบ</button></section>`}
async function changeProfileImage(event){const input=event.currentTarget,file=input.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024){input.value='';return toast('รูปโปรไฟล์ต้องเป็น JPG, PNG หรือ WebP และไม่เกิน 2 MB',true)}const reader=new FileReader();reader.onerror=()=>toast('ไม่สามารถอ่านไฟล์รูปภาพได้',true);reader.onload=async()=>{const previous=state.user.avatarUrl;state.user.avatarUrl=reader.result;profile();toast('กำลังบันทึกรูปโปรไฟล์...');try{const saved=await api('/auth/avatar',{method:'PUT',body:JSON.stringify({avatarUrl:reader.result})});state.user.avatarUrl=saved.avatarUrl;localStorage.setItem('user',JSON.stringify(state.user));profile();toast('เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว')}catch(error){state.user.avatarUrl=previous;localStorage.setItem('user',JSON.stringify(state.user));profile();toast(error.message,true)}};reader.readAsDataURL(file)}
async function route(){let p=location.hash.slice(1)||'dashboard';active(p);try{await({dashboard,borrow,return:returns,loans,profile,stock,add,audit:window.audit,accounts:window.accounts,maintenance:window.maintenance}[p]||dashboard)()}catch(e){toast(e.message,true)}}
$('#loginForm').onsubmit=async e=>{e.preventDefault();try{login(await api('/auth/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}))}catch(err){toast(err.message,true)}};window.addEventListener('hashchange',route);if('serviceWorker'in navigator)navigator.serviceWorker.register('/service-worker.js');let prompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;$('#installBtn').classList.remove('hidden')});$('#installBtn').onclick=async()=>{if(prompt)await prompt.prompt()};if(state.token&&state.user)showApp();

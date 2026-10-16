(()=>{
  const root=document.createElement('div');
  root.id='chatWidget';root.hidden=true;
  root.innerHTML=`<section class="chat-panel" id="chatPanel" aria-label="แชทติดต่อแอดมิน" hidden>
    <header class="chat-header"><div class="chat-heading"><span class="chat-header-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 1-8 8H6l-4 3V11a9 9 0 1 1 18 0Z"/><path d="M7 9h8M7 13h5"/></svg></span><div><strong id="chatTitle">ติดต่อแอดมิน</strong><small id="chatSubtitle">ฝากข้อความไว้ได้ แม้แอดมินไม่อยู่</small></div></div><button type="button" id="chatClose" aria-label="ปิดแชท"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
    <div class="chat-layout"><aside class="chat-rooms" id="chatRooms" aria-label="ห้องสนทนา"></aside>
    <div class="chat-conversation"><div class="chat-conversation-title" id="chatRoomTitle" translate="no"></div>
    <button type="button" class="chat-older" id="chatOlder" hidden>โหลดข้อความก่อนหน้า</button>
    <div class="chat-messages" id="chatMessages" role="log" aria-label="ข้อความสนทนา" aria-live="polite"></div>
    <p class="chat-status" id="chatStatus" role="status"></p>
    <form id="chatForm" class="chat-compose"><textarea id="chatInput" rows="2" maxlength="2000" placeholder="พิมพ์ข้อความถึงแอดมิน…" aria-label="ข้อความ" required></textarea><button type="submit" id="chatSend"><span>ส่ง</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 14-7-5 14-3-6-6-1Z"/><path d="m11 13 8-8"/></svg></button></form></div></div>
  </section><button type="button" class="chat-launcher" id="chatLauncher" aria-controls="chatPanel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-4 3V11.5a9.5 9.5 0 1 1 19 0Z"/><path d="M6 10h9M6 14h6"/></svg><span id="chatLauncherLabel">ติดต่อแอดมิน</span><b class="chat-badge" id="chatBadge" hidden></b></button>`;
  document.body.appendChild(root);
  const find=id=>root.querySelector('#'+id),panel=find('chatPanel'),input=find('chatInput'),messagesBox=find('chatMessages');
  let rooms=[],selected=null,messages=[],hasMore=false,opened=false,timer=null,generation=0,busy=false,queued=false,sending=false,drafts={};
  const admin=()=>state.user?.role==='admin';
  const translate=text=>window.I18n?.translate(text)||text;
  const timestamp=value=>new Intl.DateTimeFormat(I18n.language()==='en'?'en-GB':'th-TH',{timeZone:'Asia/Bangkok',dateStyle:'short',timeStyle:'short'}).format(new Date(value));
  let layoutFrame=null;
  function positionWidget(){
    if(root.hidden)return;
    const viewport=window.visualViewport;
    const width=viewport?.width||window.innerWidth,height=viewport?.height||window.innerHeight;
    const left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0;
    const gap=width<=560?12:20,viewportBottom=top+height;
    const nav=document.querySelector('#bottomNav'),navRect=nav?.getBoundingClientRect();
    const navVisible=navRect&&navRect.width>navRect.height&&navRect.top<viewportBottom&&navRect.bottom>top;
    const navSpace=navVisible?Math.max(0,viewportBottom-navRect.top):0;
    const short=height-navSpace<480;
    root.classList.toggle('chat-short',short);
    const docked=short||width<=560;
    root.classList.toggle('chat-docked',docked);
    const safeBottom=parseFloat(getComputedStyle(root).getPropertyValue('--chat-safe-bottom'))||0;
    const bottom=Math.max(Math.max(0,window.innerHeight-viewportBottom)+navSpace+gap,safeBottom);
    const available=Math.max(0,window.innerHeight-top-bottom-gap-(docked?0:66));
    root.classList.toggle('chat-tight',available<280);
    root.style.setProperty('--chat-right',`${Math.max(gap,window.innerWidth-left-width+gap)}px`);
    root.style.setProperty('--chat-bottom',`${bottom}px`);
    root.style.setProperty('--chat-width',`${Math.max(0,width-gap*2)}px`);
    root.style.setProperty('--chat-available',`${available}px`);
  }
  function schedulePosition(){cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(positionWidget)}
  function status(text=''){find('chatStatus').textContent=translate(text)}
  function roomList(){
    find('chatRooms').hidden=!admin();
    root.classList.toggle('chat-admin',admin());
    find('chatRooms').innerHTML=rooms.map(room=>`<button type="button" class="chat-room ${room.id===selected?'selected':''}" data-room="${room.id}" aria-pressed="${room.id===selected}"><span class="chat-room-avatar" translate="no" aria-hidden="true">${esc([...(room.fullName||room.username||'?')][0])}</span><span class="chat-room-copy"><strong translate="no">${esc(room.fullName||room.username)}</strong><span class="chat-room-preview" translate="no">${esc(room.lastMessage||'—')}</span></span>${room.unread?`<b>${room.unread}</b>`:''}</button>`).join('')||`<p class="chat-empty">${translate('ยังไม่มีผู้ใช้ส่งข้อความ')}</p>`;
    const count=rooms.reduce((sum,room)=>sum+room.unread,0);
    find('chatBadge').hidden=!count;find('chatBadge').textContent=count>99?'99+':count;
    find('chatRoomTitle').textContent=admin()?(rooms.find(room=>room.id===selected)?.fullName||''):translate('แอดมิน');
    input.disabled=!selected||sending;find('chatSend').disabled=!selected||sending;
    schedulePosition();
  }
  function drawMessages(forceBottom=false){
    const nearBottom=messagesBox.scrollHeight-messagesBox.scrollTop-messagesBox.clientHeight<70;
    messagesBox.innerHTML=messages.map(message=>`<article class="chat-message ${message.senderRole===(admin()?'admin':'user')?'mine':''}"><small translate="no">${esc(message.senderRole==='admin'?translate('แอดมิน'):message.senderName||'')}</small><p translate="no">${esc(message.body)}</p><time translate="no" datetime="${esc(message.createdAt)}">${esc(timestamp(message.createdAt))}</time></article>`).join('')||`<p class="chat-empty">${translate(selected?'เริ่มสนทนาได้เลย':'เลือกห้องสนทนาเพื่อตอบกลับ')}</p>`;
    find('chatOlder').hidden=!hasMore;
    if(forceBottom||nearBottom)messagesBox.scrollTop=messagesBox.scrollHeight;
  }
  async function markRead(session=generation){
    if(!opened||document.visibilityState==='hidden'||!document.hasFocus()||!selected||!messages.length)return;
    const roomId=selected,last=messages[messages.length-1].id;
    await api(`/chat/${roomId}/read`,{method:'POST',body:JSON.stringify({messageId:last})});
    if(session!==generation||selected!==roomId)return;
    const room=rooms.find(item=>item.id===roomId);if(room){room.unread=0;roomList()}
  }
  async function refresh(){
    if(!state.user||root.hidden)return;
    if(busy){queued=true;return}
    busy=true;const session=generation,roomId=selected;
    try{
      const nextRooms=await api('/chat/rooms');
      if(session!==generation)return;
      rooms=nextRooms;
      if(!selected&&!admin())selected=rooms[0]?.id||null;
      roomList();
      if(opened&&selected){
        const activeRoom=selected;
        const data=await api(`/chat/${activeRoom}/messages`);
        if(session!==generation||selected!==activeRoom)return;
        const beforeIds=messages.map(item=>item.id).join(',');
        const merged=new Map(messages.map(item=>[item.id,item]));
        data.messages.forEach(item=>merged.set(item.id,item));
        messages=[...merged.values()].sort((a,b)=>a.id-b.id);
        if(beforeIds!==messages.map(item=>item.id).join(',')||!messages.length)drawMessages(!roomId);
        if(messages.length<=50){hasMore=data.hasMore;find('chatOlder').hidden=!hasMore}
        await markRead(session);
      }else if(opened)drawMessages();
      status();
    }catch(error){if(session===generation&&state.user)status(error.message)}
    finally{if(session===generation){busy=false;if(queued){queued=false;refresh()}}}
  }
  function open(value){
    opened=value;panel.hidden=!value;root.classList.toggle('is-open',value);find('chatLauncher').setAttribute('aria-expanded',String(value));positionWidget();
    if(value){drawMessages();refresh();input.focus()}else find('chatLauncher').focus();
  }
  function stop(){
    generation++;clearInterval(timer);cancelAnimationFrame(layoutFrame);timer=null;root.hidden=true;panel.hidden=true;root.classList.remove('is-open');opened=false;
    rooms=[];selected=null;messages=[];hasMore=false;busy=false;queued=false;sending=false;drafts={};input.value='';
    messagesBox.replaceChildren();find('chatRooms').replaceChildren();status();
    find('chatBadge').hidden=true;find('chatLauncher').setAttribute('aria-expanded','false');
  }
  function start(){
    stop();if(!state.user)return;
    root.hidden=false;
    find('chatTitle').textContent=translate(admin()?'ข้อความจากผู้ใช้':'ติดต่อแอดมิน');
    find('chatSubtitle').textContent=translate(admin()?'เลือกห้องสนทนาเพื่อตอบกลับ':'ฝากข้อความไว้ได้ แม้แอดมินไม่อยู่');
    find('chatLauncherLabel').textContent=translate(admin()?'กล่องข้อความ':'ติดต่อแอดมิน');
    input.setAttribute('placeholder',translate(admin()?'พิมพ์ข้อความตอบกลับ…':'พิมพ์ข้อความถึงแอดมิน…'));
    roomList();refresh();timer=setInterval(()=>{if(document.visibilityState!=='hidden')refresh()},15000);
  }
  find('chatLauncher').onclick=()=>open(!opened);find('chatClose').onclick=()=>open(false);
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened)open(false)});
  find('chatRooms').onclick=event=>{
    const button=event.target.closest('[data-room]');if(!button||sending)return;
    drafts[selected]=input.value;generation++;busy=false;selected=Number(button.dataset.room);
    messages=[];hasMore=false;input.value=drafts[selected]||'';roomList();drawMessages(true);refresh();input.focus();
  };
  find('chatOlder').onclick=async()=>{
    const session=generation,roomId=selected,button=find('chatOlder');if(!messages.length)return;
    button.disabled=true;
    try{
      const data=await api(`/chat/${roomId}/messages?before=${messages[0].id}`);
      if(session!==generation||roomId!==selected)return;
      const height=messagesBox.scrollHeight,top=messagesBox.scrollTop;
      const merged=new Map([...data.messages,...messages].map(message=>[message.id,message]));
      messages=[...merged.values()].sort((a,b)=>a.id-b.id);hasMore=data.hasMore;drawMessages();
      messagesBox.scrollTop=top+messagesBox.scrollHeight-height;
    }catch(error){if(session===generation)status(error.message)}finally{button.disabled=false}
  };
  find('chatForm').onsubmit=async event=>{
    event.preventDefault();const body=input.value.trim();if(!body||!selected||sending)return;
    const session=generation,roomId=selected;sending=true;roomList();status('กำลังส่งข้อความ…');
    try{
      const message=await api(`/chat/${roomId}/messages`,{method:'POST',body:JSON.stringify({body})});
      if(session!==generation)return;
      input.value='';drafts[roomId]='';
      if(!messages.some(item=>item.id===message.id))messages.push({...message,senderName:state.user.fullName});
      messages.sort((a,b)=>a.id-b.id);drawMessages(true);status();
      await markRead(session);refresh();
    }catch(error){if(session===generation)status(error.message)}
    finally{if(session===generation){sending=false;roomList();input.focus()}}
  };
  window.addEventListener('focus',()=>{if(opened)refresh()});
  window.addEventListener('resize',schedulePosition);
  window.visualViewport?.addEventListener('resize',schedulePosition);
  window.visualViewport?.addEventListener('scroll',schedulePosition);
  if(window.ResizeObserver){const nav=document.querySelector('#bottomNav');if(nav)new ResizeObserver(schedulePosition).observe(nav)}
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});
  window.addEventListener('languagechange',()=>{if(!root.hidden){roomList();if(opened)drawMessages()}});
  window.ChatWidget={start,stop,refresh};if(state.user)start();
})();

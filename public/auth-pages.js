(function setupAuthPages(){
  const loginView=document.querySelector('#loginView');
  const signupView=document.querySelector('#signupView');
  const showSignup=document.querySelector('#showSignup');
  const showLogin=document.querySelector('#showLogin');
  const signupForm=document.querySelector('#signupForm');
  const loginForm=document.querySelector('#loginForm');

  function clearLoginFields(){
    if(!loginView.classList.contains('hidden')){
      loginForm.reset();
      loginForm.querySelector('[name="username"]').value='';
      loginForm.querySelector('[name="password"]').value='';
      loginForm.querySelectorAll('.password-field input').forEach(input=>input.type='password');
      loginForm.querySelectorAll('.password-toggle').forEach(button=>button.setAttribute('aria-pressed','false'));
    }
  }

  window.togglePassword=function(button){
    const input=button.closest('.password-field')?.querySelector('input');
    if(!input)return;
    const showing=input.type==='text';
    input.type=showing?'password':'text';
    button.setAttribute('aria-pressed',String(!showing));
    button.setAttribute('aria-label',showing?'แสดงรหัสผ่าน':'ซ่อนรหัสผ่าน');
    input.focus({preventScroll:true});
  };

  window.forgotPassword=function(){
    const username=loginForm.querySelector('[name="username"]').value.trim();
    $('#modalBody').innerHTML=`<div class="forgot-dialog-icon">⚿</div><h2>ลืมรหัสผ่าน</h2><p class="subtitle">เพื่อความปลอดภัย ระบบไม่อนุญาตให้รีเซ็ตรหัสผ่านด้วยรหัสนิสิตเพียงอย่างเดียว</p><div class="forgot-help"><b>กรุณาติดต่อผู้ดูแลระบบ</b><span>แจ้งชื่อ-นามสกุล รหัสนิสิต และชื่อผู้ใช้เพื่อตรวจสอบตัวตน</span>${username?`<small>ชื่อผู้ใช้ที่กรอก: <strong>${esc(username)}</strong></small>`:''}</div><button class="button primary wide" type="button" onclick="modal.close()">เข้าใจแล้ว</button>`;
    modal.showModal();
  };

  clearLoginFields();
  setTimeout(clearLoginFields,100);
  setTimeout(clearLoginFields,500);
  window.addEventListener('pageshow',clearLoginFields);

  function switchView(view){
    loginView.classList.toggle('hidden',view!=='login');
    signupView.classList.toggle('hidden',view!=='signup');
    window.scrollTo({top:0,behavior:'instant'});
  }

  showSignup.addEventListener('click',()=>switchView('signup'));
  showLogin.addEventListener('click',()=>{switchView('login');clearLoginFields();});

  signupForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const values=Object.fromEntries(new FormData(signupForm));
    if(values.password!==values.confirmPassword){
      toast('รหัสผ่านทั้งสองช่องไม่ตรงกัน',true);
      return;
    }
    const submit=signupForm.querySelector('button[type="submit"],button:not([type])');
    submit.disabled=true;
    submit.textContent='กำลังลงทะเบียน...';
    try{
      await api('/auth/register',{method:'POST',body:JSON.stringify(values)});
      signupForm.reset();
      switchView('login');
      document.querySelector('#loginForm [name="username"]').value=values.username;
      toast('สมัครสมาชิกเรียบร้อย กรุณาเข้าสู่ระบบ');
    }catch(error){toast(error.message,true);}
    finally{submit.disabled=false;submit.textContent='ลงทะเบียน';}
  });
})();

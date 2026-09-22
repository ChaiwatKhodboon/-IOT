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

  let passwordFlow='forgot';
  window.forgotPassword=function(defaultEmail='',flow='forgot'){
    passwordFlow=flow;
    const entered=loginForm.querySelector('[name="username"]').value.trim();
    const suggested=defaultEmail||(entered.includes('@')?entered:'');
    const title=flow==='change'?'เปลี่ยนรหัสผ่าน':'ลืมรหัสผ่าน';
    $('#modalBody').innerHTML=`<div class="forgot-dialog-icon">✉</div><h2>${title}</h2><p class="subtitle">กรอกอีเมลที่ผูกกับบัญชี ระบบจะส่งรหัส OTP 6 หลักให้คุณ</p><form id="otpRequestForm"><label class="field">อีเมล<input name="email" type="email" autocomplete="email" value="${esc(suggested)}" placeholder="name@example.com" required></label><button class="button primary wide">ส่งรหัส OTP</button></form>`;
    modal.showModal();
    $('#otpRequestForm').onsubmit=requestOtp;
  };

  async function requestOtp(event){
    event.preventDefault();
    const button=event.currentTarget.querySelector('button');
    const email=event.currentTarget.email.value.trim().toLowerCase();
    button.disabled=true;button.textContent='กำลังส่ง...';
    try{
      const result=await api('/auth/forgot-password',{method:'POST',body:JSON.stringify({email})});
      $('#modalBody').innerHTML=`<div class="forgot-dialog-icon">✓</div><h2>ตรวจสอบอีเมล</h2><p class="subtitle">${esc(result.message)}</p><form id="otpResetForm"><input type="hidden" name="email" value="${esc(email)}"><label class="field">รหัส OTP 6 หลัก<input name="otp" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" placeholder="000000" required></label><label class="field">รหัสผ่านใหม่<div class="password-field"><input name="password" type="password" minlength="8" autocomplete="new-password" placeholder="อย่างน้อย 8 ตัวอักษร" required><button class="password-toggle" type="button" onclick="togglePassword(this)" aria-label="แสดงรหัสผ่าน">◉</button></div></label><label class="field">ยืนยันรหัสผ่านใหม่<input name="confirmPassword" type="password" minlength="8" autocomplete="new-password" required></label><button class="button primary wide">ตั้งรหัสผ่านใหม่</button><button id="resendOtp" class="button secondary wide" type="button">ส่ง OTP ใหม่</button></form>`;
      $('#otpResetForm').onsubmit=resetPassword;
      $('#resendOtp').onclick=()=>forgotPassword(email,passwordFlow);
    }catch(error){toast(error.message,true);button.disabled=false;button.textContent='ส่งรหัส OTP';}
  }

  async function resetPassword(event){
    event.preventDefault();
    const values=Object.fromEntries(new FormData(event.currentTarget));
    if(values.password!==values.confirmPassword)return toast('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน',true);
    const button=event.currentTarget.querySelector('button[type="submit"],button:not([type])');
    button.disabled=true;button.textContent='กำลังบันทึก...';
    try{
      const result=await api('/auth/reset-password',{method:'POST',body:JSON.stringify(values)});
      modal.close();
      if(passwordFlow==='change')logout();
      loginForm.querySelector('[name="username"]').value=values.email;loginForm.querySelector('[name="password"]').value='';
      toast(result.message);
    }catch(error){toast(error.message,true);button.disabled=false;button.textContent='ตั้งรหัสผ่านใหม่';}
  }

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

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
    }
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

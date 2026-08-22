(async function secureBootstrap(){
  const token=localStorage.getItem('token');
  const storedUser=localStorage.getItem('user');
  if(token&&storedUser){
    try{
      const response=await fetch('/api/auth/me',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
      if(!response.ok)throw new Error('invalid session');
      localStorage.setItem('user',JSON.stringify(await response.json()));
    }catch{
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('cart');
      history.replaceState(null,'',location.pathname);
    }
  }else{
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    if(location.hash)history.replaceState(null,'',location.pathname);
  }

  const appScript=document.createElement('script');
  appScript.src='/app.js?v=admin-v6';
  appScript.onload=()=>{
    const authScript=document.createElement('script');
    authScript.src='/auth-pages.js?v=auth-v9';
    authScript.onload=()=>{
      const adminScript=document.createElement('script');
      adminScript.src='/admin-ui.js?v=admin-v10';
      document.body.appendChild(adminScript);
    };
    document.body.appendChild(authScript);
  };
  document.body.appendChild(appScript);

  setInterval(async()=>{
    const currentToken=localStorage.getItem('token');
    if(!currentToken)return;
    try{
      const response=await fetch('/api/auth/me',{headers:{Authorization:`Bearer ${currentToken}`},cache:'no-store'});
      if(!response.ok)throw new Error('expired');
    }catch{
      localStorage.clear();
      location.replace('/');
    }
  },60000);
})();

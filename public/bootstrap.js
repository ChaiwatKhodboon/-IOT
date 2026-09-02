(async function secureBootstrap(){
  // Never reuse a previous login when the app is opened or refreshed.
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  if(location.hash)history.replaceState(null,'',location.pathname);

  const appScript=document.createElement('script');
  appScript.src='/app.js?v=management-v3';
  appScript.onload=()=>{
    const authScript=document.createElement('script');
    authScript.src='/auth-pages.js?v=auth-v9';
    authScript.onload=()=>{
      const adminScript=document.createElement('script');
      adminScript.src='/admin-ui.js?v=management-v1';
      adminScript.onload=()=>{
        const managementScript=document.createElement('script');
        managementScript.src='/management-ui.js?v=management-v3';
        document.body.appendChild(managementScript);
      };
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

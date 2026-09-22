(function setupGoogleLogin() {
  const area = document.querySelector('#googleSignIn');
  const target = document.querySelector('#googleButton');
  const status = document.querySelector('#googleStatus');
  const linkForm = document.querySelector('#googleLinkForm');
  let pendingCredential = '', busy = false, sdkPromise;

  function loadSdk() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client?hl=th';
      script.async = true;
      const timer = setTimeout(() => reject(new Error('โหลด Google ไม่สำเร็จ กรุณารีเฟรชหน้าเว็บแล้วลองใหม่')), 15000);
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); reject(new Error('เชื่อมต่อ Google ไม่สำเร็จ คุณยังเข้าสู่ระบบด้วยรหัสผ่านได้')); };
      document.head.appendChild(script);
    });
    return sdkPromise;
  }

  async function sendCredential(credential, password) {
    if (busy) return;
    busy = true;
    area.setAttribute('aria-busy', 'true');
    linkForm.querySelector('button[type="submit"]').disabled = true;
    status.textContent = 'กำลังยืนยันบัญชี Google…';
    try {
      // Use this endpoint directly: a failed Google attempt must not log out an existing session.
      const response = await fetch('/api/auth/google', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, ...(password ? { password } : {}) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      if (data.linkingRequired) {
        pendingCredential = credential;
        linkForm.classList.remove('hidden');
        status.textContent = data.message;
        linkForm.querySelector('input').focus();
      } else {
        pendingCredential = '';
        linkForm.reset(); linkForm.classList.add('hidden');
        status.textContent = '';
        login(data);
      }
    } catch (error) {
      status.textContent = error.message;
      if (!password) await prepare(false);
    } finally {
      busy = false;
      area.removeAttribute('aria-busy');
      linkForm.querySelector('button[type="submit"]').disabled = false;
      if (password) linkForm.reset();
    }
  }

  async function prepare(clearMessage = true) {
    try {
      const response = await fetch('/api/auth/google/config', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('ตรวจสอบการเข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      const config = await response.json();
      if (!config.enabled) { status.textContent = 'การเข้าสู่ระบบด้วย Google ยังไม่เปิดใช้งาน'; return; }
      await loadSdk();
      google.accounts.id.initialize({
        client_id: config.clientId, nonce: config.nonce,
        auto_select: false, button_auto_select: false, ux_mode: 'popup',
        callback: result => { if (result.credential) sendCredential(result.credential); }
      });
      google.accounts.id.disableAutoSelect();
      target.replaceChildren();
      const width = Math.max(200, Math.min(400, Math.floor(area.getBoundingClientRect().width)));
      // Medium buttons omit the previous Google account's name and photo.
      google.accounts.id.renderButton(target, { type: 'standard', theme: 'outline', size: 'medium', text: 'signin_with', shape: 'rectangular', width, locale: 'th' });
      if (clearMessage) status.textContent = '';
    } catch (error) { status.textContent = error.message; }
  }
  linkForm.onsubmit = event => {
    event.preventDefault();
    if (pendingCredential) sendCredential(pendingCredential, linkForm.querySelector('input').value);
  };
  document.querySelector('#googleLinkCancel').onclick = () => {
    pendingCredential = ''; linkForm.reset(); linkForm.classList.add('hidden'); prepare();
  };
  // Refresh the one-time challenge when returning to the login screen after logout.
  const view = document.querySelector('#loginView');
  let hidden = view.classList.contains('hidden');
  new MutationObserver(() => {
    const next = view.classList.contains('hidden');
    if (hidden && !next) { pendingCredential = ''; linkForm.reset(); linkForm.classList.add('hidden'); prepare(); }
    hidden = next;
  }).observe(view, { attributes: true, attributeFilter: ['class'] });
  prepare();
})();

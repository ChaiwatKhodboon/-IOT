const CACHE='iot-loan-v46-dashboard-counts';
const ASSETS=['/','/index.html','/styles.css','/bootstrap.js','/app.js','/auth-pages.js','/google-login.js','/admin-ui.js','/management-ui.js','/manifest.webmanifest','/icons/IT.jpg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim()));
});

self.addEventListener('message',event=>{
  event.waitUntil((async()=>{
    if(!event.source?.id)return;
    const source=await self.clients.get(event.source.id);
    if(!source||new URL(source.url).origin!==self.location.origin)return;
    if(event.data==='SKIP_WAITING')await self.skipWaiting();
  })());
});

self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('/index.html'))));
});

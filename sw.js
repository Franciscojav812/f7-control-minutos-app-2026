const V='f7-uefa1',SHELL=['./','index.html','app.js','styles.css','manifest.webmanifest','crest.jpg','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='f7-fonts'&&!k.startsWith('ftms-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.open('f7-fonts').then(c=>c.match(r).then(h=>{const n=fetch(r).then(x=>{c.put(r,x.clone());return x}).catch(()=>h);return h||n})));return}
  if(u.origin!==location.origin)return;
  e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:true}).then(h=>h||fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x}).catch(()=>c.match('index.html')))));
});

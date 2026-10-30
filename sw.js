/* Service worker de Banquillo · Minutos (ámbito raíz).
   - Caché primero: la app abre al instante y sin conexión.
   - En la instalación guarda TAMBIÉN Táctica (/ftms/) y las fuentes, para que todo funcione sin cobertura
     aunque Táctica no se haya abierto nunca con conexión.
   - Al publicar cambios hay que subir V para que los móviles descarguen la versión nueva. */
const V='f7-clubes1',
  SHELL=['./','index.html','app.js','styles.css','manifest.webmanifest','crest.jpg','icon.svg','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png','ftms/','ftms/index.html'],
  FONT_CSS='https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,700&family=Barlow:wght@500;600;700&display=swap';
/* guarda la hoja de Google Fonts y los archivos de letra que enlaza (si hay conexión; si no, se usa la letra del sistema) */
function cacheFonts(){return caches.open('f7-fonts').then(c=>c.match(FONT_CSS).then(h=>h?null:fetch(FONT_CSS).then(r=>{if(!r.ok)return;
  return r.clone().text().then(css=>c.put(FONT_CSS,r).then(()=>Promise.all((css.match(/https:\/\/fonts\.gstatic\.com\/[^)'"]+/g)||[]).map(u=>fetch(u,{mode:'cors'}).then(x=>x.ok&&c.put(u,x)).catch(()=>{})))))}))).catch(()=>{})}
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(cacheFonts).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='f7-fonts'&&!k.startsWith('ftms-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.open('f7-fonts').then(c=>c.match(r.url).then(h=>{const n=fetch(r).then(x=>{if(x.ok||x.type==='opaque')c.put(r.url,x.clone());return x}).catch(()=>h);return h||n})));return}
  if(u.origin!==location.origin)return;
  const nav=r.mode==='navigate',home=u.pathname.includes('/ftms/')?'ftms/index.html':'index.html';
  e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:true}).then(h=>h||fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x}).catch(()=>nav?c.match(home):Response.error()))));
});

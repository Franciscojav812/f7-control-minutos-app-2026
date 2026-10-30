/* Service worker de Banquillo · Táctica (ámbito /ftms/).
   - Red primero, pero si la red tarda más de 3 s (poca cobertura en el campo) o no hay conexión,
     sirve la copia guardada. La app de minutos ya deja guardada esta página al instalarse.
   - Solo borra cachés que empiezan por "ftms-": no interfiere con la caché de la app de minutos. */
const C = 'ftms-v3', ESPERA = 3000;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', '../icon.svg', '../crest.jpg'])).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x.startsWith('ftms-') && x !== C).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  /* fuentes: misma caché que la app de minutos ('f7-fonts') */
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open('f7-fonts').then(c => c.match(r.url).then(h => {
      const n = fetch(r).then(x => { if (x.ok || x.type === 'opaque') c.put(r.url, x.clone()); return x; }).catch(() => h);
      return h || n;
    })));
    return;
  }
  if (u.origin !== location.origin) return;
  const copia = () => caches.match(r, { ignoreSearch: true })
    .then(m => m || (r.mode === 'navigate' ? caches.match('./index.html') : undefined));
  const red = fetch(r).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
    return res;
  });
  e.respondWith(new Promise(ok => {
    let hecho = false;
    const fin = x => { if (!hecho && x) { hecho = true; ok(x); } };
    const t = setTimeout(() => copia().then(fin), ESPERA);
    red.then(x => { clearTimeout(t); fin(x); })
       .catch(() => { clearTimeout(t); copia().then(m => { if (m) fin(m); else if (!hecho) { hecho = true; ok(Response.error()); } }); });
    /* si la copia no existe al cumplir el plazo, se sigue esperando a la red */
  }));
});

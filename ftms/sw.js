/* Service worker del FTMS (ámbito /ftms/).
   - Red primero; si no hay conexión, sirve la última copia guardada.
   - Solo toca cachés que empiezan por "ftms-": no interfiere con la caché de la app de minutos. */
const C = 'ftms-v2';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html'])).catch(() => {}));
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
  /* fuentes: misma caché que la app de minutos ('f7-fonts') para verse igual sin conexión */
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open('f7-fonts').then(c => c.match(r).then(h => {
      const n = fetch(r).then(x => { c.put(r, x.clone()); return x; }).catch(() => h);
      return h || n;
    })));
    return;
  }
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('./index.html')))
  );
});

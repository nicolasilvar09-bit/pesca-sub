// Deep Spear: funciona sem internet depois da primeira visita.
// Página: rede primeiro (pega atualização), cache se estiver offline. Ícones: cache primeiro.
const C = 'deepspear-v2';
const PRE = ['./', 'index.html', 'manifest.webmanifest', 'brand/icon-192.png', 'brand/icon-512.png', 'brand/icon-180.png', 'brand/icon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(PRE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const page = r.mode === 'navigate' || r.url.endsWith('.html');
  e.respondWith(page
    ? fetch(r, { cache: 'no-store' }).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
    : caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; })));
});

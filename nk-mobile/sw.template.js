// NK Mobile: funciona sem internet depois da primeira visita (gerado pelo build.py).
// Página: rede primeiro (pega atualização), cache se estiver sem internet. Modelos e ícones: cache primeiro.
const C = 'nkmobile-%%VER%%';
const PRE = %%FILES%%;
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(PRE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => (k.startsWith('nkmobile-') || k.startsWith('ilhazero-')) && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const page = r.mode === 'navigate' || r.url.endsWith('.html') || r.url.endsWith('/');
  e.respondWith(page
    ? fetch(r, { cache: 'no-store' }).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
    : caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; })));
});

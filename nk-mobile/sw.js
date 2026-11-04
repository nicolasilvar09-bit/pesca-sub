// NK Mobile: funciona sem internet depois da primeira visita (gerado pelo build.py).
// Página: rede primeiro (pega atualização), cache se estiver sem internet. Modelos e ícones: cache primeiro.
const C = 'nkmobile-80b648a6f6';
const PRE = ["./", "index.html", "manifest.webmanifest", "brand/icon-1024.png", "brand/icon-180.png", "brand/icon-192.png", "brand/icon-32.png", "brand/icon-512.png", "brand/icon-maskable-512.png", "assets/CREDITS.md", "assets/plane.glb", "assets/chars/LICENSE-Rocketbox.txt", "assets/chars/anims.glb", "assets/chars/f_casual.glb", "assets/chars/f_jacket.glb", "assets/chars/f_police.glb", "assets/chars/f_soldier1.glb", "assets/chars/f_soldier2.glb", "assets/chars/m_casual.glb", "assets/chars/m_hoodie.glb", "assets/chars/m_police.glb", "assets/chars/m_soldier1.glb", "assets/chars/m_soldier2.glb", "assets/guns/akm.glb", "assets/guns/m16a2.glb", "assets/guns/m625.glb", "assets/guns/mosin.glb", "assets/guns/p226.glb", "assets/maps/bal.jpg", "assets/maps/nk.jpg", "assets/nature/BirchTree_2.glb", "assets/nature/Bush_1.glb", "assets/nature/Bush_2.glb", "assets/nature/CommonTree_3.glb", "assets/nature/CommonTree_4.glb", "assets/nature/PalmTree_2.glb", "assets/nature/PineTree_2.glb", "assets/nature/PineTree_4.glb", "assets/nature/Rock_1.glb", "assets/nature/Rock_2.glb", "assets/nature/Rock_3.glb", "assets/nature/Rock_4.glb", "assets/nature/Rock_5.glb", "assets/nature/Rock_Moss_1.glb", "assets/nature/Rock_Moss_2.glb", "assets/tex/terrain.jpg", "assets/tex/walls.jpg"];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(PRE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => (k.startsWith('nkmobile-') || k.startsWith('ilhazero-')) && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const page = r.mode === 'navigate' || r.url.endsWith('.html') || r.url.endsWith('/');
  e.respondWith(page
    ? fetch(r, { cache: 'no-store' }).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
    : caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; })));
});

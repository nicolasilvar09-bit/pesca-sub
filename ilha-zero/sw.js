// endereço antigo: apaga o modo offline velho e leva quem abrir para o NK Mobile
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('ilhazero-')) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) { try { c.navigate(new URL('../nk-mobile/', c.url).href); } catch (e) { } }
})()));

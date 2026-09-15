// Legacy cleanup stub — the vanilla app's workbox service worker used to
// live here. Once the browser checks for an update it gets this file, which
// clears every cache and unregisters itself so the Angular PWA takes over.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  await self.registration.unregister();
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(c => c.navigate(c.url));
});

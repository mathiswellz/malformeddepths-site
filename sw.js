// The site's service worker (0.1.64, 2026-11-28): keeps the game's pictures and sounds on the player's device, so a second visit opens
// almost at once. The page itself (game.html) always comes fresh from the site when there is a connection. A kept file is shown at once
// and quietly re-checked with the site for next time, so new art reaches players one visit later. Videos and range requests are left alone.
const KEEP = 'md-assets-1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for(const k of await caches.keys()) if(k !== KEEP) await caches.delete(k);
  await self.clients.claim(); })()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if(r.method !== 'GET' || u.origin !== location.origin || r.headers.has('range')) return;
  if(u.pathname.endsWith('.html') || u.pathname.endsWith('/')){   // the page: fresh when online, the kept copy when not
    e.respondWith(fetch(r).then(res => { if(res.ok){ const c = res.clone(); caches.open(KEEP).then(k => k.put(r, c)); } return res; }).catch(() => caches.match(r).then(m => m || Response.error())));
    return; }
  if(!u.pathname.includes('/assets/') || /\.(webm|mov)$/.test(u.pathname) || (/\.mp4$/.test(u.pathname) && !/\/(sfx|music|voice)\//.test(u.pathname))) return;   // (sounds are .mp4 too: those are kept)
  e.respondWith(caches.open(KEEP).then(async k => {
    const kept = await k.match(r);
    const fresh = fetch(r).then(res => { if(res.ok && res.status === 200) k.put(r, res.clone()); return res; });
    if(kept){ e.waitUntil(fresh.catch(() => {})); return kept; }
    return fresh; }));
});

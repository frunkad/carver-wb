/* Carver W&B service worker — offline-first app shell with explicit update flow.
 * CACHE_VERSION is stamped by scripts/stamp.js (content hash of all assets) before every deploy.
 */
const CACHE_VERSION = 'wb-f99cc61017';
const PRECACHE = [
  './',            // index.html (Pages 308-redirects /index.html -> /, so cache the canonical URL)
  'app.js',
  'pwa.js',
  'calc.js',
  'style.css',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-192.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  // Fetch fresh copies (bypass HTTP cache) into a new versioned cache.
  // No skipWaiting here: a new version waits until the user taps "Update" or the app is relaunched.
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('wb-') && k !== CACHE_VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  if (d.type === 'GET_VERSION' && event.ports[0]) event.ports[0].postMessage(CACHE_VERSION);
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // e.g. GitHub link: let the browser handle it
  if (url.pathname.endsWith('/sw.js')) return;               // never serve the SW itself from cache

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    if (req.mode === 'navigate') {
      // App shell: any navigation (incl. ?ac=RUM&fuel=… links) gets the cached index.html.
      const hit = await cache.match('./');
      if (hit) return hit;
    } else {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
    }
    try {
      return await fetch(req);
    } catch (e) {
      const fallback = req.mode === 'navigate' ? await cache.match('./') : undefined;
      return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});

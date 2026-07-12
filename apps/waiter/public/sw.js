const CACHE_NAME = 'serveiq-cache-v1';
const API_CACHE = 'serveiq-api-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/icon/icon-192.png',
  '/assets/icon/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of STATIC_ASSETS) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch {
          // skip assets that fail to fetch
        }
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP(S) requests (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // API requests — network-first, cache fallback (GET only)
  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'GET') {
      event.respondWith(networkFirstWithCache(request, API_CACHE));
    }
    return;
  }

  // Static assets — cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (request.method !== 'GET') return response;
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    }))
  );
});

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    const clone = response.clone();
    const cache = await caches.open(cacheName);
    cache.put(request, clone);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ offline: true, message: 'You are offline. Cached data may be stale.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

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
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
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

  // API requests — network-first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // Static assets — cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
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

const CACHE_NAME = 'menu-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
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
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;

  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'GET') {
      event.respondWith(networkFirstWithCache(request, CACHE_NAME));
    }
    return;
  }

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
    return new Response(JSON.stringify({ offline: true, message: 'You are offline.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

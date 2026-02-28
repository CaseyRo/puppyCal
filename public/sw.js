const CACHE = 'puppycal-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/main.js',
  '/main.css',
  '/i18n/nl.json',
  '/i18n/en.json',
  '/icons/icon-192.png',
  '/icons/icon-192.avif',
  '/icons/icon-512.png',
  '/icons/site.webmanifest',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Cache successful same-origin responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: serve root for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/') ?? caches.match('/index.html');
          }
        });
    })
  );
});

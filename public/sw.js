const CACHE = 'puppycal-__VERSION__';

const PRECACHE = [
  '/',
  '/index.html',
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

  if (request.mode === 'navigate') {
    // Network-first for navigation — index.html must be fresh to load correct bundle hashes
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/')))
    );
  } else {
    // Stale-while-revalidate for assets — serve cached immediately, refresh in background
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached ?? networkFetch;
      })
    );
  }
});

const CACHE_NAME = 'venta-dominical-v6';

const urlsToCache = [
  '/Actividad-dominical-v-1.1/',
  '/Actividad-dominical-v-1.1/index.html',
  '/Actividad-dominical-v-1.1/main.js',
  '/Actividad-dominical-v-1.1/manifest.json',
  '/Actividad-dominical-v-1.1/icon-192x192.png',
  '/Actividad-dominical-v-1.1/icon-512x512.png',
  '/Actividad-dominical-v-1.1/images/logo.jpg',
  '/Actividad-dominical-v-1.1/offline.html',

  // CDN
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// INSTALL
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Error cacheando:', err))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH (OFFLINE FIRST)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request)
          .then(networkResponse => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match('/Actividad-dominical-v-1.1/offline.html');
            }
          });
      })
  );
});
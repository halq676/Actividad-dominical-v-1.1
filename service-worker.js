const CACHE_NAME = 'venta-dominical-v3';
const urlsToCache = [
  '/Actividad-dominical-v-1.1/',
  '/Actividad-dominical-v-1.1/index.html',
  '/Actividad-dominical-v-1.1/style.css',
  '/Actividad-dominical-v-1.1/main.js',
  '/Actividad-dominical-v-1.1/manifest.json',
  '/Actividad-dominical-v-1.1/js/xlsx.full.min.js',
  '/Actividad-dominical-v-1.1/images/logo.jpg',
  '/Actividad-dominical-v-1.1/images/icon-192x192.png',
  '/Actividad-dominical-v-1.1/images/icon-512x512.png',
  '/Actividad-dominical-v-1.1/offline.html'
];

// Instalar y guardar en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Archivos cacheados correctamente');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activar y limpiar versiones antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Eliminando caché antigua:', key);
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/Actividad-dominical-v-1.1/offline.html');
        }
      });
    })
  );
});

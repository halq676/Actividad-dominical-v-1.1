const CACHE_NAME = 'inventario-cache-v1';
const urlsToCache = [
  './index.html',
  './style.css',
  './main.js',
  './service-worker.js',
  './manifest.json',
  './images/logo.jpg',
  './images/icon-192x192.png',
  './images/icon-512x512.png',
  './js/xlsx.full.min.js'
];

// Instalación y precacheo
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Intercepción de peticiones
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Devuelve la respuesta desde la caché si existe
      }
      return fetch(event.request).catch(() => {
        // Si no hay conexión, devuelve el index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

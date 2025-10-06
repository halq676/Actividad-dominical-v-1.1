const CACHE_NAME = 'venta-dominical-v3'; // Mantienes la versión v3
const urlsToCache = [
  // Archivos esenciales del proyecto (usando el nombre del proyecto como subdirectorio)
  '/Actividad-dominical-v-1.1/',
  '/Actividad-dominical-v-1.1/index.html',
  '/Actividad-dominical-v-1.1/style.css',
  '/Actividad-dominical-v-1.1/main.js',
  '/Actividad-dominical-v-1.1/manifest.json',
  '/Actividad-dominical-v-1.1/offline.html',
  '/Actividad-dominical-v-1.1/images/logo.jpg',
  '/Actividad-dominical-v-1.1/images/icon-192x192.png',
  '/Actividad-dominical-v-1.1/images/icon-512x512.png',
  
  // ------------------------------------------------------------------
  //  ¡CRÍTICO! CACHEO DE LIBRERÍAS CDN (URLs completas)
  // ------------------------------------------------------------------
  // 1. Bootstrap CSS (para estilos)
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  // 2. XLSX Script (para exportar a Excel offline)
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 
];

// Instalar y guardar en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Archivos cacheados correctamente');
      return cache.addAll(urlsToCache);
    }).catch(err => {
      console.error('Fallo al cachear un recurso. Asegúrese que las URLs completas de CDN sean correctas.', err);
    })
  );
  // self.skipWaiting() hace que el SW tome control inmediatamente.
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
  // self.clients.claim() asegura que las páginas ya abiertas sean controladas por el nuevo SW.
  self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
  // Ignora peticiones que no sean GET (como POST, PUT, etc.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 1. Si está en caché, devuelve la respuesta cacheada
      if (cachedResponse) return cachedResponse;
      
      // 2. Si no está en caché, intenta ir a la red
      return fetch(event.request).catch(() => {
        // 3. Si falla la red y es una navegación a una página, devuelve offline.html
        if (event.request.mode === 'navigate') {
          return caches.match('/Actividad-dominical-v-1.1/offline.html');
        }
        // Si no es una navegación (ej. un ícono que falta), simplemente falla
      });
    })
  );
});
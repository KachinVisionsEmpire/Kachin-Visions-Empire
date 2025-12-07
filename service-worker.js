// Service Worker for Kachin Visions Empire
const CACHE_NAME = 'kve-v1';
const APP_NAME = 'Kachin Visions Empire';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/Kachin-Visions-Empire/',
          '/Kachin-Visions-Empire/index.html',
          '/Kachin-Visions-Empire/manifest.json',
          '/Kachin-Visions-Empire/icons/icon-72x72.png',
          '/Kachin-Visions-Empire/icons/icon-192x192.png',
          '/Kachin-Visions-Empire/icons/icon-512x512.png'
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip video files (let browser handle)
  if (url.pathname.match(/\.(mp4|webm|m3u8)$/)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request).then((networkResponse) => {
          // Don't cache if not a successful response
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          
          // Cache the response
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
            
          return networkResponse;
        });
      })
      .catch(() => {
        // If both cache and network fail, show offline page for HTML requests
        if (event.request.mode === 'navigate') {
          return caches.match('/Kachin-Visions-Empire/index.html');
        }
        return new Response('Offline', { status: 503 });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded successfully');
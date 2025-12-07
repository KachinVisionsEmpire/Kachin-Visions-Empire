// Service Worker for Kachin Visions Empire PWA
const CACHE_NAME = 'kachin-visions-cache-v2.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  // Skip Firebase URLs and external resources
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic') ||
      event.request.url.includes('cdnjs') ||
      event.request.url.includes('jsdelivr')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // For HTML requests, return the cached page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});

// Background Sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-video-downloads') {
    event.waitUntil(syncVideoDownloads());
  }
});

async function syncVideoDownloads() {
  // Implement background sync for video downloads
  const offlineDownloads = await getOfflineDownloads();
  
  for (const download of offlineDownloads) {
    try {
      // Sync each download to server
      await syncDownloadToServer(download);
    } catch (error) {
      console.error('Sync failed for download:', download.id, error);
    }
  }
}

// Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update from Kachin Visions Empire',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/explore-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Kachin Visions Empire', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('Notification click received.');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (const client of windowClients) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
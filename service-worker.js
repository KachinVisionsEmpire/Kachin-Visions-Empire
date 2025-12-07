// Kachin Visions Empire Service Worker
// Version: 2.0.0

const CACHE_NAME = 'kve-cache-v2';
const APP_NAME = 'Kachin Visions Empire';
const VERSION = '2.0.0';

// Core assets to cache on install
const CORE_ASSETS = [
  '/Kachin-Visions-Empire/',
  '/Kachin-Visions-Empire/index.html',
  '/Kachin-Visions-Empire/manifest.json',
  '/Kachin-Visions-Empire/favicon.ico'
];

// ==================== INSTALL EVENT ====================
self.addEventListener('install', (event) => {
  console.log(`[${APP_NAME}] Service Worker installing v${VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// ==================== ACTIVATE EVENT ====================
self.addEventListener('activate', (event) => {
  console.log(`[${APP_NAME}] Service Worker activating v${VERSION}`);
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
      .then(() => {
        // Send message to all clients
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SW_ACTIVATED',
              version: VERSION,
              cacheName: CACHE_NAME
            });
          });
        });
      })
  );
});

// ==================== FETCH EVENT ====================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip browser extensions
  if (url.protocol === 'chrome-extension:') return;
  
  // Skip video/streaming content (let browser handle)
  if (url.pathname.match(/\.(mp4|webm|m3u8|m3u)$/) ||
      url.hostname.includes('youtube.com') ||
      url.hostname.includes('youtu.be') ||
      url.hostname.includes('cloudinary.com')) {
    return;
  }
  
  // Handle request
  event.respondWith(
    handleFetch(event.request)
      .catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);
        return createOfflineResponse();
      })
  );
});

// ==================== FETCH HANDLER ====================
async function handleFetch(request) {
  const url = new URL(request.url);
  
  // For same-origin requests, try cache first
  if (url.origin === self.location.origin) {
    return cacheFirst(request);
  }
  
  // For CDN resources, try network first
  return networkFirst(request);
}

// Cache First Strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    updateCache(request);
    return cachedResponse;
  }
  
  // Not in cache, try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If HTML request, return offline page
    if (request.mode === 'navigate') {
      return getOfflinePage();
    }
    throw error;
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Update cache in background
async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
    }
  } catch (error) {
    // Silently fail - we already have cached version
  }
}

// ==================== OFFLINE SUPPORT ====================
async function getOfflinePage() {
  const cache = await caches.open(CACHE_NAME);
  const cachedPage = await cache.match('/Kachin-Visions-Empire/');
  
  if (cachedPage) {
    return cachedPage;
  }
  
  return createOfflineResponse();
}

function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${APP_NAME} - Offline</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #050510, #0a0a1a);
          color: #f0f8ff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          text-align: center;
        }
        .container {
          max-width: 600px;
          background: rgba(15, 20, 40, 0.9);
          padding: 40px;
          border-radius: 20px;
          border: 1px solid rgba(255, 153, 0, 0.3);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        h1 {
          color: #ff9900;
          margin-bottom: 20px;
          font-size: 28px;
        }
        p {
          margin-bottom: 30px;
          font-size: 18px;
          line-height: 1.6;
        }
        .icon {
          font-size: 60px;
          margin-bottom: 20px;
          color: #ffcc00;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        button {
          background: linear-gradient(135deg, #ff9900, #ff5500);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 10px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.3s;
        }
        button:hover {
          transform: translateY(-3px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📶</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection. Some features require an internet connection to work properly.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
}

// ==================== PUSH NOTIFICATIONS ====================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch (error) {
    data = {
      title: APP_NAME,
      body: event.data.text() || 'New update available',
      icon: '/Kachin-Visions-Empire/icons/icon-192.png'
    };
  }
  
  const options = {
    body: data.body || `${APP_NAME} Notification`,
    icon: data.icon || '/Kachin-Visions-Empire/icons/icon-192.png',
    badge: '/Kachin-Visions-Empire/favicon.ico',
    tag: 'kve-notification',
    data: {
      url: data.url || '/Kachin-Visions-Empire/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || APP_NAME, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data.url || '/Kachin-Visions-Empire/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ==================== MESSAGE HANDLING ====================
self.addEventListener('message', (event) => {
  if (!event.data) return;
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearCache();
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo(event);
      break;
      
    case 'CHECK_VERSION':
      event.ports[0]?.postMessage({
        type: 'VERSION_INFO',
        version: VERSION,
        appName: APP_NAME,
        cacheName: CACHE_NAME
      });
      break;
  }
});

async function clearCache() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[Service Worker] All caches cleared');
}

async function getCacheInfo(event) {
  const cacheNames = await caches.keys();
  const cacheInfo = [];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    cacheInfo.push({
      name: cacheName,
      size: requests.length
    });
  }
  
  event.ports[0]?.postMessage({
    type: 'CACHE_INFO',
    caches: cacheInfo,
    total: cacheInfo.reduce((sum, cache) => sum + cache.size, 0)
  });
}

// ==================== PERIODIC SYNC ====================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCachePeriodically());
  }
});

async function updateCachePeriodically() {
  console.log('[Service Worker] Periodic sync started');
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedUrls = await cache.keys();
    
    for (const request of cachedUrls) {
      await updateCache(request);
    }
    
    console.log('[Service Worker] Periodic sync completed');
  } catch (error) {
    console.error('[Service Worker] Periodic sync failed:', error);
  }
}

// ==================== CACHE CLEANUP ====================
setInterval(async () => {
  await cleanupOldCaches();
}, 24 * 60 * 60 * 1000); // Run once a day

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentTime = Date.now();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const fetchedDate = new Date(dateHeader).getTime();
          const age = currentTime - fetchedDate;
          
          // Delete entries older than 7 days
          if (age > 7 * 24 * 60 * 60 * 1000) {
            await cache.delete(request);
            console.log(`[Cache Cleanup] Removed old cache: ${request.url}`);
          }
        }
      }
    }
  }
}

console.log(`[${APP_NAME}] Service Worker loaded successfully v${VERSION}`);
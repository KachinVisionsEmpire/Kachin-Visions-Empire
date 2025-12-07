// service-worker.js - Kachin Visions Empire PWA
// ဒီ JS တစ်ဖိုင်ထဲမှာပဲ PWA အတွက် လိုအပ်သမျှ ပြည့်စုံအောင် ရေးထားပါတယ်

// Cache Configuration
const CACHE_NAME = 'kve-v3';
const STATIC_CACHE = 'kve-static-v3';
const DYNAMIC_CACHE = 'kve-dynamic-v3';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  // HTML
  '/Kachin-Visions-Empire/',
  '/Kachin-Visions-Empire/index.html',
  
  // Manifest and Icons
  '/Kachin-Visions-Empire/manifest.json',
  
  // Essential Icons (အရေးကြီးဆုံး icons သုံးခုပဲ ထည့်ထားတယ် - 404 error ရှောင်ဖို့)
  '/Kachin-Visions-Empire/icons/icon-72x72.png',
  '/Kachin-Visions-Empire/icons/icon-96x96.png',
  '/Kachin-Visions-Empire/icons/icon-192x192.png',
  '/Kachin-Visions-Empire/icons/icon-512x512.png',
  
  // Firebase SDKs (CDN links - cache လုပ်မယ်)
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage-compat.js',
  
  // External Libraries
  'https://cdn.jsdelivr.net/npm/hls.js@latest',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Network-first then cache strategy for these
const NETWORK_FIRST_URLS = [
  /\/api\//,
  /firestore\.googleapis\.com/,
  /firebaseio\.com/
];

// Cache-first strategy for these
const CACHE_FIRST_URLS = [
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
  /\.(css|js)$/,
  /gstatic\.com/,
  /cdnjs\.cloudflare\.com/,
  /cdn\.jsdelivr\.net/
];

// ==================== SERVICE WORKER EVENTS ====================

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Cache install failed:', error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, CACHE_NAME];
  
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
  );
});

// Fetch Event - Handle all network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip Firebase Storage and external video sources
  if (url.href.includes('cloudinary.com') || 
      url.href.includes('youtube.com') ||
      url.href.includes('youtu.be') ||
      url.href.includes('firebasestorage.googleapis.com') ||
      url.href.includes('.m3u8') ||
      url.href.includes('.mp4') ||
      url.href.includes('.webm')) {
    return;
  }
  
  // Handle based on URL pattern
  event.respondWith(
    handleFetch(event.request)
      .catch((error) => {
        console.error('[Service Worker] Fetch failed:', error, event.request.url);
        
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/Kachin-Visions-Empire/')
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return createOfflineResponse();
            });
        }
        
        return createErrorResponse();
      })
  );
});

// ==================== FETCH STRATEGIES ====================

async function handleFetch(request) {
  const url = request.url;
  
  // Network First for API calls
  for (const pattern of NETWORK_FIRST_URLS) {
    if (pattern.test(url)) {
      return networkFirst(request);
    }
  }
  
  // Cache First for static assets
  for (const pattern of CACHE_FIRST_URLS) {
    if (pattern.test(url)) {
      return cacheFirst(request);
    }
  }
  
  // Default: Network First with cache fallback
  return networkFirst(request);
}

// Network First Strategy
async function networkFirst(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache it
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If HTML request and no cache, return offline page
    if (request.mode === 'navigate') {
      return caches.match('/Kachin-Visions-Empire/')
        .then((response) => response || createOfflineResponse());
    }
    
    throw error;
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, networkResponse));
        }
      })
      .catch(() => { /* Ignore update errors */ });
    
    return cachedResponse;
  }
  
  // Not in cache, try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// ==================== RESPONSE HELPERS ====================

function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kachin Visions Empire - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #050510, #0a0a1a, #1a0f0a);
          color: #f0f8ff;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20px;
        }
        h1 {
          color: #ff9900;
          margin-bottom: 20px;
          font-size: 24px;
        }
        p {
          margin-bottom: 30px;
          font-size: 16px;
          max-width: 500px;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 20px;
          color: #ffcc00;
        }
        .button {
          background: #ff9900;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="icon">📶</div>
      <h1>You're Offline</h1>
      <p>Please check your internet connection and try again. Some downloaded videos may still be available.</p>
      <button class="button" onclick="window.location.reload()">Retry Connection</button>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function createErrorResponse() {
  return new Response('Resource not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// ==================== MESSAGE HANDLING ====================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.ports[0].postMessage({
      type: 'CACHE_STATUS',
      caches: [STATIC_CACHE, DYNAMIC_CACHE]
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(DYNAMIC_CACHE)
      .then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
  }
});

// ==================== BACKGROUND SYNC ====================

// Register for background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-videos') {
    event.waitUntil(syncVideos());
  }
});

async function syncVideos() {
  console.log('[Background Sync] Syncing video data...');
  
  // Here you can implement background data syncing
  // For example, sync downloaded video metadata
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    // Your sync logic here
    return Promise.resolve();
  } catch (error) {
    console.error('[Background Sync] Failed:', error);
    return Promise.reject(error);
  }
}

// ==================== PUSH NOTIFICATIONS ====================

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New update from Kachin Visions Empire',
    icon: '/Kachin-Visions-Empire/icons/icon-192x192.png',
    badge: '/Kachin-Visions-Empire/icons/icon-72x72.png',
    tag: data.tag || 'kve-notification',
    data: data.url || '/Kachin-Visions-Empire/',
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kachin Visions Empire', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data || '/Kachin-Visions-Empire/');
          }
        })
    );
  }
});

// ==================== PERIODIC SYNC ====================

if ('periodicSync' in self.registration) {
  try {
    self.registration.periodicSync.register('video-sync', {
      minInterval: 24 * 60 * 60 * 1000 // 24 hours
    }).then(() => {
      console.log('[Periodic Sync] Registered');
    }).catch((error) => {
      console.error('[Periodic Sync] Registration failed:', error);
    });
  } catch (error) {
    console.error('[Periodic Sync] Not supported:', error);
  }
}

// ==================== CACHE MANAGEMENT ====================

// Function to pre-cache additional resources
async function preCacheResources(resources) {
  const cache = await caches.open(STATIC_CACHE);
  return cache.addAll(resources);
}

// Function to clean up expired caches
async function cleanupExpiredCaches() {
  const cacheNames = await caches.keys();
  const currentTime = Date.now();
  
  for (const cacheName of cacheNames) {
    if (cacheName.includes('kve-')) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const fetchedTime = new Date(dateHeader).getTime();
            const age = currentTime - fetchedTime;
            
            // Delete cache older than 30 days
            if (age > 30 * 24 * 60 * 60 * 1000) {
              await cache.delete(request);
            }
          }
        }
      }
    }
  }
}

// Run cleanup once a day
setInterval(() => {
  cleanupExpiredCaches().catch(console.error);
}, 24 * 60 * 60 * 1000);

console.log('[Service Worker] Loaded successfully');
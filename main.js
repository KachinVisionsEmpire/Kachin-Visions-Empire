// Kachin Visions Empire - Main Application Script
// This should be added to your HTML file

// ==================== PWA INSTALLATION ====================

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = '/Kachin-Visions-Empire/service-worker.js';
    
    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 Service Worker update found');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateNotification();
            }
          });
        });
        
        // Periodically check for updates
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// PWA Install Prompt
let deferredPrompt;
const installButton = document.getElementById('installButton');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button if not already installed
  if (!isPWAInstalled()) {
    showInstallButton();
  }
});

function showInstallButton() {
  const installBtn = document.createElement('button');
  installBtn.id = 'pwaInstallBtn';
  installBtn.innerHTML = `
    <i class="fas fa-download"></i> 
    <span>Install App</span>
    <small>For better experience</small>
  `;
  
  installBtn.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: linear-gradient(135deg, #ff9900, #ff5500);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    font-weight: bold;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 5px 15px rgba(255, 153, 0, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: all 0.3s;
    animation: bounce 2s infinite;
  `;
  
  // Add bounce animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  `;
  document.head.appendChild(style);
  
  installBtn.onclick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted PWA installation');
      trackInstallation();
    }
    
    deferredPrompt = null;
    installBtn.remove();
  };
  
  document.body.appendChild(installBtn);
  
  // Auto-hide after 30 seconds
  setTimeout(() => {
    if (installBtn.parentNode) {
      installBtn.style.opacity = '0';
      installBtn.style.transform = 'translateY(20px)';
      setTimeout(() => installBtn.remove(), 500);
    }
  }, 30000);
}

function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://');
}

function showUpdateNotification() {
  const updateNotify = document.createElement('div');
  updateNotify.id = 'updateNotification';
  updateNotify.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <i class="fas fa-sync-alt" style="color: #ff9900;"></i>
      <span>New update available!</span>
    </div>
    <button id="refreshBtn" style="
      background: #ff9900;
      color: white;
      border: none;
      padding: 5px 15px;
      border-radius: 15px;
      cursor: pointer;
    ">Refresh</button>
  `;
  
  updateNotify.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(15, 20, 40, 0.95);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    border: 1px solid rgba(255, 153, 0, 0.3);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    animation: slideIn 0.5s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(updateNotify);
  
  document.getElementById('refreshBtn').onclick = () => {
    window.location.reload();
  };
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (updateNotify.parentNode) {
      updateNotify.remove();
    }
  }, 10000);
}

function trackInstallation() {
  // Send installation event to analytics if needed
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_installation', {
      'event_category': 'engagement',
      'event_label': 'PWA Installation'
    });
  }
}

// ==================== OFFLINE DETECTION ====================

function updateOnlineStatus() {
  const statusElement = document.getElementById('connectionStatus');
  if (!statusElement) return;
  
  if (navigator.onLine) {
    statusElement.className = 'connection-status online-status-badge';
    statusElement.innerHTML = '<i class="fas fa-wifi"></i> Online';
    statusElement.style.display = 'flex';
  } else {
    statusElement.className = 'connection-status offline-status-badge';
    statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
    statusElement.style.display = 'flex';
    
    // Show offline modal if no cached content
    setTimeout(() => {
      if (!navigator.onLine) {
        showOfflineModal();
      }
    }, 2000);
  }
}

function showOfflineModal() {
  const modal = document.createElement('div');
  modal.id = 'offlineModal';
  modal.innerHTML = `
    <div class="modal-content" style="
      background: var(--dark);
      padding: 20px;
      border-radius: 12px;
      max-width: 400px;
      text-align: center;
    ">
      <div style="font-size: 48px; margin-bottom: 15px; color: #ff9900;">
        <i class="fas fa-wifi-slash"></i>
      </div>
      <h3 style="margin-bottom: 10px;">You're Offline</h3>
      <p style="margin-bottom: 20px; font-size: 14px;">
        Some features may not be available. Downloaded videos can still be accessed.
      </p>
      <button id="closeOfflineModal" style="
        background: #ff9900;
        color: white;
        border: none;
        padding: 10px 30px;
        border-radius: 6px;
        cursor: pointer;
      ">Continue</button>
    </div>
  `;
  
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('closeOfflineModal').onclick = () => {
    modal.remove();
  };
}

// ==================== INITIALIZATION ====================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Kachin Visions Empire App Initializing...');
  
  // Setup online/offline detection
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
  
  // Check if running as PWA
  if (isPWAInstalled()) {
    document.documentElement.setAttribute('data-pwa', 'true');
    console.log('📱 Running as installed PWA');
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission();
      }, 3000);
    }
  }
  
  // Initialize periodic sync if available
  if ('periodicSync' in navigator && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.periodicSync.register('update-cache', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      }).catch(console.error);
    });
  }
  
  // Check for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_ACTIVATED') {
        console.log('🔄 Service Worker updated to v' + event.data.version);
      }
    });
  }
  
  // Cache cleanup on startup
  cleanupOldCaches();
});

// ==================== CACHE MANAGEMENT ====================

async function cleanupOldCaches() {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      const currentCache = 'kve-cache-v2';
      
      for (const cacheName of cacheNames) {
        if (!cacheName.includes('kve-cache')) continue;
        
        if (cacheName !== currentCache) {
          await caches.delete(cacheName);
          console.log('🗑️ Deleted old cache:', cacheName);
        }
      }
    } catch (error) {
      console.error('Error cleaning caches:', error);
    }
  }
}

// Export functions for global access
window.KVE = {
  installPWA: () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else if (isPWAInstalled()) {
      alert('App is already installed!');
    } else {
      alert('Installation not available. Try refreshing the page.');
    }
  },
  
  clearCache: async () => {
    if ('caches' in window) {
      await caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      });
      alert('Cache cleared successfully!');
      window.location.reload();
    }
  },
  
  checkUpdate: () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration()
        .then((registration) => {
          if (registration) {
            registration.update();
            alert('Checking for updates...');
          }
        });
    }
  },
  
  getAppInfo: () => {
    return {
      isPWA: isPWAInstalled(),
      version: '2.0.0',
      cacheSupported: 'caches' in window,
      serviceWorker: 'serviceWorker' in navigator,
      online: navigator.onLine
    };
  }
};

console.log('✅ Kachin Visions Empire App initialized successfully');
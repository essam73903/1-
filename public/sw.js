const CACHE_NAME = 'sama-almamlakah-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/src/main.tsx',
  '/src/index.css'
];

// Install Event - cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline skeleton');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Pre-cache failed (expected in dev mode, assets will cache on fetch):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests and internal live-reloads/websockets
  if (event.request.method !== 'GET' || requestUrl.pathname.includes('/vite') || requestUrl.pathname.includes('hot-update') || event.request.url.startsWith('ws:')) {
    return;
  }

  // 1. Special Handling for API endpoints (e.g., labor news) - Network First, fallback to cached
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return empty or structured JSON fallback
            return new Response(JSON.stringify({
              newsContent: "### 📌 وضع عدم الاتصال نشط حالياً\n\nتعمل البوابة الإلكترونية لمكتب **سما المملكة** الآن بكفاءة وبشكل كامل في وضع عدم الاتصال (Offline mode). يمكنك تصفح دليل الخدمات، حساب قيود المعاملات وتصدير ملفات الحسابات محلياً بدون إنترنت بشكل مريح وآمن.",
              sources: []
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // 2. Default Strategy: Stale-While-Revalidate for JS, CSS, Google Fonts and Unsplash images
  // This serves cached resources instantly (high-speed response) while updating cache in the background.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Silent catch for offline status - will just resolve with cached value
        });

      return cachedResponse || fetchPromise;
    })
  );
});

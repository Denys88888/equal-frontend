const CACHE_NAME = 'equal-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

const API_CACHE_PREFIX = 'equal-api-';
const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

// Install: Precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && !name.startsWith(API_CACHE_PREFIX))
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Fetch: Cache-first for static assets, network-first for API, fallback to index.html for navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests: Network-first with 5-min cache
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.')) {
    event.respondWith(networkFirstWithTimeout(request));
    return;
  }

  // Navigation requests: Serve from cache or fallback to index.html (SPA support)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          return caches.match('/index.html');
        });
      })
    );
    return;
  }

  // Static assets: Cache-first strategy
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached response and revalidate in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(request).then((response) => {
        if (response.ok && (request.destination === 'script' || request.destination === 'style' || request.destination === 'image' || request.destination === 'font')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // If fetch fails for HTML, fallback to index.html
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
        // Otherwise just fail
        throw new Error('Network request failed and no cache available');
      });
    })
  );
});

/**
 * Network-first strategy for API calls with a 5-minute cache.
 * Falls back to cached response if network fails.
 */
async function networkFirstWithTimeout(request) {
  const cacheName = API_CACHE_PREFIX + 'responses';

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const clone = networkResponse.clone();
      const headers = new Headers(clone.headers);
      headers.append('x-equal-cache-timestamp', Date.now().toString());
      const responseWithTimestamp = new Response(clone.body, {
        status: clone.status,
        statusText: clone.statusText,
        headers: headers,
      });
      await cache.put(request, responseWithTimestamp);
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const cachedTime = cachedResponse.headers.get('x-equal-cache-timestamp');
      if (cachedTime && Date.now() - parseInt(cachedTime) < API_CACHE_MAX_AGE) {
        return cachedResponse;
      }
    }

    throw error;
  }
}

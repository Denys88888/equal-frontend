const VERSION = 'equal-v2';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const PRECACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // One bad URL rejects the whole addAll and the SW never installs, so each
      // entry is added independently.
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isAsset(url) {
  return /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|gif|webp|ico|webm|mp3|wav|ogg|m4a)$/i.test(url.pathname);
}

function isApi(url) {
  return url.pathname.startsWith('/v1/') || /\/api\//.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Cross-origin (Pi SDK, Google Fonts, Cloudinary) is left to the network so
  // the SW never serves a stale third-party script.
  if (url.origin !== self.location.origin) return;

  // NetworkFirst for the API: fresh data when online, last-known when not.
  if (isApi(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // CacheFirst for hashed build assets, uploaded photos and voice notes.
  if (isAsset(url) || url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigations: network first, falling back to the cached shell so a reload
  // offline still boots the SPA instead of showing the browser error page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then((cached) => cached || caches.match('/'))
      )
    );
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Equal', body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Equal', {
      body: data.body || 'You have a new notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'default',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing tab rather than piling up new windows on every tap.
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && target !== '/') client.navigate(target).catch(() => {});
          return;
        }
      }
      return self.clients.openWindow(target);
    })
  );
});

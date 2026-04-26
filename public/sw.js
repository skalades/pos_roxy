const CACHE_NAME = 'roxy-v2-cache-v4';
const ASSETS_TO_CACHE = [
  '/logo.png',
  '/manifest.json',
];

// ===================================================================
// INSTALL: Cache aset statis esensial
// ===================================================================
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// ===================================================================
// ACTIVATE: Hapus cache lama & claim semua tab
// ===================================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
    ])
  );
});

// ===================================================================
// FETCH: Jangan intercept navigate requests!
// Laravel banyak menggunakan redirect (302) untuk auth.
// Jika SW intercept navigate + server redirect → ERR_FAILED.
// Biarkan browser handle semua navigasi secara native.
// SW hanya cache aset statis (gambar, font, dll).
// ===================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Abaikan request non-HTTP (chrome-extension://, dll)
  if (!url.protocol.startsWith('http')) return;

  // 2. KRITIS: Jangan intercept navigate requests
  //    Biarkan browser handle langsung ke server (termasuk redirect auth)
  if (request.mode === 'navigate') return;

  // 3. Abaikan request ke domain lain (CDN fonts bunny.net, dll)
  if (url.origin !== self.location.origin) return;

  // 4. Hanya cache aset statis: gambar, font, manifest
  //    Jangan cache JS/CSS build (Vite sudah handle hash-based versioning)
  const isStaticAsset =
    url.pathname.startsWith('/logo') ||
    url.pathname === '/manifest.json' ||
    url.pathname.startsWith('/favicon');

  if (isStaticAsset) {
    // Cache First untuk aset statis
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          // Cache response yang valid
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 5. Semua request lain (JS/CSS Vite build, API, dll) → langsung ke network
  //    Tidak di-intercept agar tidak mengganggu Inertia.js
});

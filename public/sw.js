const CACHE_NAME = 'roxy-v2-cache-v3';
const ASSETS_TO_CACHE = [
  '/logo.png',
  '/manifest.json',
];

// ===================================================================
// INSTALL: Cache aset statis esensial
// ===================================================================
self.addEventListener('install', (event) => {
  // skipWaiting agar SW baru langsung aktif tanpa tunggu tab lama ditutup
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// ===================================================================
// ACTIVATE: Hapus cache lama & langsung claim semua tab yang terbuka
// ===================================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // PERBAIKAN BUG #2: clients.claim() wajib ada bersama skipWaiting()
      // agar SW baru langsung mengontrol semua tab/window tanpa perlu reload
      clients.claim(),

      // Hapus cache versi lama
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
// FETCH: Strategi request berdasarkan tipe
// ===================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Abaikan request non-HTTP (chrome-extension://, dll)
  if (!url.protocol.startsWith('http')) return;

  // Abaikan request ke domain lain (CDN fonts, dll)
  if (url.origin !== self.location.origin) return;

  // -------------------------------------------------------------------
  // STRATEGI NAVIGASI: Network First dengan HTML Shell Fallback
  // PERBAIKAN BUG #1: Tidak lagi return undefined saat cache miss
  // -------------------------------------------------------------------
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { credentials: 'same-origin' })
        .then((response) => {
          // Jika berhasil, clone dan simpan ke cache sebagai shell fallback
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Hanya cache response sukses (status 200)
            if (cloned.status === 200) {
              cache.put(request, cloned);
            }
          });
          return response;
        })
        .catch(() => {
          // Network gagal → coba ambil dari cache
          return caches.match(request).then((cached) => {
            if (cached) return cached;

            // Tidak ada cache → kembalikan response error yang informatif
            // (bukan undefined yang menyebabkan ERR_FAILED)
            return new Response(
              `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tidak Ada Koneksi – ROXY</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; text-align: center; padding: 2rem; }
    .card { background: #1e293b; border-radius: 1rem; padding: 3rem 2rem; max-width: 400px; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #0d9488; }
    p { color: #94a3b8; margin-bottom: 2rem; line-height: 1.6; }
    button { background: #0d9488; color: white; border: none; padding: 0.75rem 2rem;
             border-radius: 0.5rem; font-size: 1rem; cursor: pointer; }
    button:hover { background: #0f766e; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📡 Tidak Ada Koneksi</h1>
    <p>ROXY tidak dapat terhubung ke server. Pastikan perangkat Anda terhubung ke internet lalu coba lagi.</p>
    <button onclick="window.location.reload()">🔄 Coba Lagi</button>
  </div>
</body>
</html>`,
              {
                status: 503,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
              }
            );
          });
        })
    );
    return;
  }

  // -------------------------------------------------------------------
  // STRATEGI ASET STATIS: Cache First, fallback ke Network
  // -------------------------------------------------------------------
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request);
    })
  );
});

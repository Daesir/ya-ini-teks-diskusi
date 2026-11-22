/* Service worker: aplikasi tetap bisa dibuka tanpa internet setelah dibuka sekali.
   Naikkan nomor VERSI setiap kali index.html diperbarui agar pengguna menerima versi terbaru. */
const VERSI = 'sidang-v5-2';
const INTI = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const LUAR = ['https://cdnjs.cloudflare.com/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(INTI)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  const sama = url.startsWith(self.location.origin);
  const luar = LUAR.some(p => url.startsWith(p));
  if (!sama && !luar) return; /* tautan YouTube dan GoodStats tetap lewat jaringan */

  if (req.mode === 'navigate') {
    /* halaman utama: coba jaringan dulu, jatuh ke cache bila offline */
    e.respondWith(
      fetch(req).then(r => { const k = r.clone(); caches.open(VERSI).then(c => c.put('./index.html', k)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  /* aset lain: cache dulu, perbarui di latar belakang */
  e.respondWith(
    caches.match(req).then(hit => {
      const jaringan = fetch(req).then(r => {
        if (r && (r.ok || r.type === 'opaque')) { const k = r.clone(); caches.open(VERSI).then(c => c.put(req, k)); }
        return r;
      }).catch(() => hit);
      return hit || jaringan;
    })
  );
});

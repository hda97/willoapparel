// Service worker Dunia Kotak: HANYA untuk notifikasi HP (Huda 11 Nov 2026). Tidak menyimpan cache dan tidak menyadap
// permintaan halaman, jadi game tetap selalu memuat versi terbaru dari server.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = {}; }
  const judul = d.judul || 'Dunia Kotak';
  e.waitUntil(self.registration.showNotification(judul, {
    body: d.isi || 'Ada kabar baru di desamu.',
    icon: '/duniakotak/ikon/ikon-192.png',
    badge: '/duniakotak/ikon/ikon-192.png',
    tag: d.tag || 'dk',
    renotify: true,
    data: { url: d.url || '/duniakotak/mabar/', jenis: d.jenis || '' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const { url, jenis } = e.notification.data || {};
  e.waitUntil((async () => {
    if (jenis) fetch('/duniakotak/api/notif-klik', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jenis }) }).catch(() => {});
    const semua = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const ada = semua.find(c => new URL(c.url).pathname.startsWith('/duniakotak/mabar'));
    if (ada) return ada.focus();
    return self.clients.openWindow(url || '/duniakotak/mabar/');
  })());
});

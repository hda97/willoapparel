// Penanda iklan: pengunjung yang datang dari Google Ads (gclid atau utm_source=google)
// mendapat tambahan "(dari Google)" di pesan WhatsApp, juga saat kembali dalam 30 hari.
(function () {
  var KEY = 'willo_dari_google', TAG = ' (dari Google)';
  var q = new URLSearchParams(location.search);
  var fromAd = q.has('gclid') || q.has('gbraid') || q.has('wbraid') || (q.get('utm_source') || '').toLowerCase() === 'google';
  var DAYS30 = 30 * 24 * 3600 * 1000;
  try {
    if (fromAd) localStorage.setItem(KEY, String(Date.now() + DAYS30));
    else fromAd = Number(localStorage.getItem(KEY) || 0) > Date.now();
  } catch (e) {}
  if (!fromAd) return;
  document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
    try {
      var u = new URL(a.href);
      var text = u.searchParams.get('text') || 'Halo Willo Apparel';
      if (text.indexOf(TAG.trim()) === -1) u.searchParams.set('text', text + TAG);
      a.href = u.toString();
    } catch (e) {}
  });
})();

// Catatan kunjungan milik sendiri (worker.js → Analytics Engine): satu sinyal "view" per halaman
// dari browser sungguhan, dan satu sinyal "wa" per klik tombol WhatsApp.
function willoKirim(t) {
  try {
    var q = new URLSearchParams(location.search);
    var u = '/_k?t=' + t + '&p=' + encodeURIComponent(location.pathname) +
      '&r=' + encodeURIComponent(document.referrer || '') + '&u=' + encodeURIComponent(q.get('utm_source') || '');
    if (navigator.sendBeacon) navigator.sendBeacon(u); else fetch(u, { keepalive: true });
  } catch (e) {}
}
willoKirim('view');

// Catat setiap klik tombol WhatsApp ke Google Analytics (GA4) sebagai event "klik_whatsapp".
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href*="wa.me/"]');
  if (a) willoKirim('wa');
  if (!a || typeof gtag !== 'function') return;
  gtag('event', 'klik_whatsapp', {
    halaman: location.pathname,
    tombol: (a.className || 'tautan') + ' | ' + (a.textContent || '').trim().slice(0, 40)
  });
});

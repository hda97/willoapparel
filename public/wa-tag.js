// Meta Pixel (iklan Facebook/Instagram). Isi ID Pixel dari Events Manager; kosong = tidak dimuat.
// Mencatat PageView di setiap halaman dan "Contact" setiap klik tombol WhatsApp.
var WILLO_PIXEL_ID = '';
if (WILLO_PIXEL_ID) {
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', WILLO_PIXEL_ID);
  fbq('track', 'PageView');
}

// Penanda iklan Meta: pengunjung dari iklan Facebook/Instagram (fbclid atau utm_source=meta/facebook/instagram)
// mendapat tambahan "(dari IG/FB)" di pesan WhatsApp, juga saat kembali dalam 30 hari.
(function () {
  var KEY = 'willo_dari_meta', TAG = ' (dari IG/FB)';
  var q = new URLSearchParams(location.search), src = (q.get('utm_source') || '').toLowerCase();
  var fromAd = q.has('fbclid') && src !== 'google' || ['meta', 'facebook', 'instagram', 'fb', 'ig'].indexOf(src) !== -1;
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
  if (a && typeof fbq === 'function') fbq('track', 'Contact', { content_name: location.pathname });
  if (!a || typeof gtag !== 'function') return;
  gtag('event', 'klik_whatsapp', {
    halaman: location.pathname,
    tombol: (a.className || 'tautan') + ' | ' + (a.textContent || '').trim().slice(0, 40)
  });
});

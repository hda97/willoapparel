// Penanda iklan: pengunjung yang datang dari Google Ads (gclid atau utm_source=google)
// mendapat tambahan "(dari Google)" di pesan WhatsApp, juga saat pindah halaman.
(function () {
  var KEY = 'willo_dari_google', TAG = ' (dari Google)';
  var q = new URLSearchParams(location.search);
  var fromAd = q.has('gclid') || q.has('gbraid') || q.has('wbraid') || (q.get('utm_source') || '').toLowerCase() === 'google';
  try {
    if (fromAd) sessionStorage.setItem(KEY, '1');
    else fromAd = sessionStorage.getItem(KEY) === '1';
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

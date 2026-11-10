// Mode aplikasi Android Dunia Kotak (Capacitor, Google Play) — Huda 10 Nov 2026.
// Aplikasi menambahkan "DuniaKotakAndroid" ke user agent. Di dalam aplikasi:
// - Bata/Trakteer disembunyikan (aturan pembayaran Google Play: barang digital wajib Google Play Billing).
// - Login Google versi web disembunyikan (Google memblokir login di WebView); masuk pakai username/kode warga.
// Versi web (Chrome biasa) TIDAK berubah.
(function () {
  if (!/DuniaKotakAndroid/.test(navigator.userAgent || '')) return;
  window.DK_APP = 'android';
  document.documentElement.classList.add('app-android');
  var css = [
    'a[href*="trakteer.id"]', 'a[href*="saweria.co"]', '#bDukung', '#bPendukung', '#panelPendukung', '.dukungKecil', '.tombol.bata',
    '#tabToko [data-tab="topup"]', '.topup',
    '#gbtn', '#gbtnMasuk', '#dalamApp', '#masukDalamApp', '#bukaChrome', '#bukaChrome2', '.cara [data-cara="google"]'
  ].map(function (s) { return '.app-android ' + s; }).join(',') + '{display:none!important}';
  var st = document.createElement('style'); st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
})();

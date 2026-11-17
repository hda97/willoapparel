/* Sinkron penjualan ke Dashboard owner (Huda 15 Nov 2026). Mati sampai owner menyalakannya di menu utama.
   Yang dikirim: catatan penjualan Kasir (no faktur, waktu, barang, jumlah, harga, kategori, total, diskon, cara bayar, batal).
   Tanpa data pelanggan. Bila tidak ada internet, antrean dikirim nanti otomatis. */
(function(){
  "use strict";
  var K = "willo_sinkron_v1", J = "willo_jual_v1", API = "https://willoapparel.com/alat/api/toko/", DASH = "https://willoapparel.com/alat/owner/";
  function baca(){ try { return JSON.parse(localStorage.getItem(K)) || {}; } catch(e){ return {}; } }
  function tulis(o){ try { localStorage.setItem(K, JSON.stringify(o)); } catch(e){} }
  function bacaJual(){ try { return JSON.parse(localStorage.getItem(J)) || []; } catch(e){ return []; } }
  function kunciJ(j){ return String(j.no) + "-" + j.w; }
  function aktif(){ var s = baca(); return !!(s.id && s.kunci && s.aktif); }
  function acak(n){ var a = "abcdefghijklmnopqrstuvwxyz0123456789", b = new Uint8Array(n), o = ""; crypto.getRandomValues(b); for (var i = 0; i < n; i++) o += a[b[i] % 36]; return o; }
  function kabari(){ document.dispatchEvent(new CustomEvent("lumbung-sinkron", { detail: baca() })); }
  var jalan = false;
  function kirim(){
    if (!aktif() || jalan || navigator.onLine === false) return Promise.resolve();
    var s = baca(); if (!(s.antre || []).length) return Promise.resolve();
    var peta = {}; bacaJual().forEach(function(j){ peta[kunciJ(j)] = j; });
    var batch = s.antre.slice(0, 300), isi = batch.map(function(k){ return peta[k]; }).filter(Boolean).map(function(j){ return { id: kunciJ(j), w: j.w, d: j }; });
    var nama = ""; try { nama = (JSON.parse(localStorage.getItem("willo_kasir_v1")) || {}).nama || ""; } catch(e){}
    jalan = true;
    return fetch(API + s.id, { method: "POST", headers: { "content-type": "application/json", "x-kunci": s.kunci }, body: JSON.stringify({ nama: nama, jual: isi }) })
      .then(function(r){ if (!r.ok) throw new Error("server " + r.status); return r.json(); })
      .then(function(d){
        var s2 = baca(); if (d && d.lisensi) s2.lisensi = d.lisensi; s2.antre = (s2.antre || []).filter(function(k){ return batch.indexOf(k) < 0; }); s2.terakhir = Date.now(); s2.galat = ""; tulis(s2); jalan = false; kabari();
        if (s2.antre.length) return kirim();
      })
      .catch(function(e){ jalan = false; var s2 = baca(); s2.galat = String(e && e.message || e); tulis(s2); kabari(); });
  }
  function antre(j){
    if (!aktif() || !j) return; var s = baca(), k = kunciJ(j); s.antre = s.antre || [];
    if (s.antre.indexOf(k) < 0) s.antre.push(k); tulis(s); kirim();
  }
  function nyalakan(){
    var s = baca(); if (!s.id) { s.id = acak(20); s.kunci = acak(32); }
    var batas = Date.now() - 120 * 864e5; s.aktif = true;
    s.antre = bacaJual().filter(function(j){ return j.w >= batas; }).map(kunciJ); tulis(s); kabari();
    return kirim().then(function(){ return cekLisensi(); });
  }
  function matikan(){ var s = baca(); s.aktif = false; tulis(s); kabari(); }
  function gantiKunci(){
    var s = baca(); if (!s.id) return nyalakan();
    var baru = acak(32);
    return fetch(API + s.id + "/ganti", { method:"POST", headers:{ "content-type":"application/json", "x-kunci":s.kunci }, body:JSON.stringify({ baru:baru }) })
      .then(function(r){ if (!r.ok) throw new Error("Gagal mengganti kunci (cek internet)."); var s2 = baca(); s2.kunci = baru; tulis(s2); kabari(); });
  }
  // ---- Lumbung Pro: status langganan, aktivasi kode, cadangan ke server ----
  var CADANG = /^willo_(kasir|kas|nota|antrian|tagihan|printer|jual|cetak|hpp|stok|owner|absen|beli|leads)_v1$/;
  function siapkanId(){ var s = baca(); if (!s.id) { s.id = acak(20); s.kunci = acak(32); tulis(s); } return s; }
  function minta(jalur, opsi){
    var s = siapkanId(); opsi = opsi || {}; opsi.headers = Object.assign({ "content-type":"application/json", "x-kunci":s.kunci }, opsi.headers || {});
    return fetch(API + s.id + jalur, opsi).then(function(r){ return r.json().catch(function(){ return {}; }).then(function(d){ if (d && d.lisensi) { var s2 = baca(); s2.lisensi = d.lisensi; tulis(s2); kabari(); } if (!r.ok) { var e = new Error(d.galat === "pro" ? "Langganan Pro belum aktif." : d.galat === "kunci" ? "Kunci toko tidak cocok." : (d.galat || "Server " + r.status)); e.status = r.status; throw e; } return d; }); });
  }
  function aktifkan(kode){
    var s = siapkanId();
    if (!s.aktif) { s.aktif = true; s.antre = bacaJual().filter(function(j){ return j.w >= Date.now() - 120 * 864e5; }).map(kunciJ); tulis(s); }
    return minta("/aktifkan", { method:"POST", body:JSON.stringify({ kode:kode }) }).then(function(d){ kirim(); return d; });
  }
  function cekLisensi(){ var s = baca(); if (!s.id) return Promise.resolve(null); var n = Date.now(); return minta("?dari=" + n + "&sampai=" + n, { method:"GET" }).then(function(){ return baca().lisensi; }, function(){ return baca().lisensi; }); }
  function isiCadangan(){ var d = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (CADANG.test(k)) d[k] = localStorage.getItem(k); } return { lumbung:1, dibuat:new Date().toISOString(), data:d }; }
  function cadangkan(){
    return minta("/cadangan", { method:"POST", body:JSON.stringify(isiCadangan()) }).then(function(d){ var s = baca(); s.cadang = d.w || Date.now(); s.galatCadang = ""; tulis(s); kabari(); return d; },
      function(e){ var s = baca(); s.galatCadang = e.message; tulis(s); kabari(); throw e; });
  }
  // Pulihkan di HP/tablet baru dari link dashboard owner (berisi #t=ID&k=KUNCI).
  function pulihkan(teksLink){
    var t = /[#&?]t=([a-z0-9]{16,40})/.exec(teksLink || ""), k = /[#&?]k=([a-z0-9]{24,80})/.exec(teksLink || "");
    if (teksLink && !(t && k)) return Promise.reject(new Error("Link tidak dikenali. Tempel link dashboard owner yang lengkap."));
    if (t && k) { var s = baca(); s.id = t[1]; s.kunci = k[1]; s.aktif = true; s.antre = []; tulis(s); }
    return minta("/cadangan", { method:"GET" }).then(function(d){
      var data = d && d.data && d.data.data; if (!data) throw new Error("Cadangan rusak.");
      Object.keys(data).forEach(function(key){ if (CADANG.test(key)) localStorage.setItem(key, data[key]); });
      return d;
    });
  }
  function pro(){ var L = baca().lisensi; return !!(L && L.aktif); }
  // Cadangan otomatis sekali sehari selama Pro/masa coba aktif dan dashboard menyala.
  function cadangOtomatis(){ var s = baca(); if (aktif() && pro() && navigator.onLine !== false && Date.now() - (s.cadang || 0) > 20 * 3600e3) cadangkan().catch(function(){}); }
  function link(){ var s = baca(); return s.id ? DASH + "#t=" + s.id + "&k=" + s.kunci : ""; }
  window.LumbungSinkron = { antre: antre, kirim: kirim, nyalakan: nyalakan, matikan: matikan, gantiKunci: gantiKunci, link: link, status: baca, aktif: aktif,
    aktifkan: aktifkan, cekLisensi: cekLisensi, cadangkan: cadangkan, pulihkan: pulihkan, pro: pro };
  setTimeout(kirim, 2500); setInterval(kirim, 60000); setTimeout(cadangOtomatis, 8000); setInterval(cadangOtomatis, 3600e3);
  window.addEventListener("online", function(){ kirim(); });
})();

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
      .then(function(){
        var s2 = baca(); s2.antre = (s2.antre || []).filter(function(k){ return batch.indexOf(k) < 0; }); s2.terakhir = Date.now(); s2.galat = ""; tulis(s2); jalan = false; kabari();
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
    s.antre = bacaJual().filter(function(j){ return j.w >= batas; }).map(kunciJ); tulis(s); kabari(); return kirim();
  }
  function matikan(){ var s = baca(); s.aktif = false; tulis(s); kabari(); }
  function gantiKunci(){ var s = baca(); s.id = acak(20); s.kunci = acak(32); tulis(s); return nyalakan(); }
  function link(){ var s = baca(); return s.id ? DASH + "#t=" + s.id + "&k=" + s.kunci : ""; }
  window.LumbungSinkron = { antre: antre, kirim: kirim, nyalakan: nyalakan, matikan: matikan, gantiKunci: gantiKunci, link: link, status: baca, aktif: aktif };
  setTimeout(kirim, 2500); setInterval(kirim, 60000);
  window.addEventListener("online", function(){ kirim(); });
})();

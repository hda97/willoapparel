/* Cetak ke printer termal (58/80 mm, ESC/POS) dari alat usaha Willo.
   1) Bluetooth langsung lewat Web Bluetooth (Chrome Android / Chrome & Edge laptop, printer BLE).
   2) Cadangan: aplikasi gratis RawBT di Android (printer Bluetooth klasik/USB/Wi-Fi).
   Pakai: CetakTermal.cetak(teks) → Promise. Lebar baris 32 karakter (58 mm). */
(function(){
  // Layanan BLE yang umum dipakai printer termal murah.
  var LAYANAN = [
    "000018f0-0000-1000-8000-00805f9b34fb",
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    "0000ff00-0000-1000-8000-00805f9b34fb",
    "0000ffe0-0000-1000-8000-00805f9b34fb",
    "0000fee7-0000-1000-8000-00805f9b34fb"
  ];
  var karakter = null, perangkat = null;

  // Di dalam aplikasi Android Lumbung: cetak lewat plugin asli (Bluetooth classic), tanpa RawBT.
  var KUNCI_PRINTER = "willo_printer_v1";
  function aplikasi(){
    var C = window.Capacitor;
    try { return C && C.nativePromise && (C.isNativePlatform ? C.isNativePlatform() : (C.getPlatform && C.getPlatform() !== "web")) ? C : null; } catch(e){ return null; }
  }
  if (aplikasi()) document.documentElement.classList.add("app-android");
  // Pengganti fitur browser yang tidak ada di WebView aplikasi: unduh file, cetak halaman, suara.
  window.Lumbung = {
    aplikasi: function(){ return !!aplikasi(); },
    unduh: function(nama, isi, tipe){
      var C = aplikasi();
      if (C) {
        var u8 = new TextEncoder().encode(isi);
        return C.nativePromise("PrinterWillo", "bagikanFile", { nama:nama, data:keBase64(u8), mime:(tipe || "text/plain").split(";")[0] });
      }
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([isi], { type:tipe || "text/plain" })); a.download = nama;
      document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
      return Promise.resolve();
    },
    cetakHalaman: function(judul){
      var C = aplikasi();
      if (C) return C.nativePromise("PrinterWillo", "cetakHalaman", { judul:judul || document.title });
      window.print(); return Promise.resolve();
    },
    bicara: function(teks){
      var C = aplikasi();
      if (C) { C.nativePromise("PrinterWillo", "bicara", { teks:teks }); return true; }
      return false;
    }
  };
  function simpanan(){ try { return JSON.parse(localStorage.getItem(KUNCI_PRINTER)) || null; } catch(e){ return null; } }
  function keBase64(u8){ var s = ""; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function galat(pesan, kode){ var e = new Error(pesan); e.code = kode; return e; }
  // Dialog pilih printer dari daftar perangkat yang sudah dipasangkan di HP.
  function pilihPrinter(){
    var C = aplikasi();
    return C.nativePromise("PrinterWillo", "daftar", {}).then(function(r){
      var daftar = (r && r.perangkat) || [];
      return new Promise(function(ok, gagal){
        var d = document.createElement("dialog");
        d.innerHTML = '<div class="isi-dialog"><h2>Pilih printer</h2><p class="kecil redup" style="margin-top:0"></p><div class="daftar-printer" style="display:grid;gap:8px;margin:10px 0"></div>' +
          '<button class="btn lebar" data-a="cari" style="margin-bottom:10px">🔍 Cari printer di sekitar</button>' +
          '<div class="baris"><button class="btn dua" data-a="atur">Pengaturan Bluetooth</button><button class="btn dua" data-a="batal">Batal</button></div></div>';
        var info = d.querySelector("p");
        info.textContent = daftar.length ? "Ketuk nama printer termalmu. Pilihan ini diingat. Tidak ada di daftar? Ketuk Cari printer." :
          "Nyalakan printer, lalu ketuk “Cari printer di sekitar”.";
        var wadah = d.querySelector(".daftar-printer"), selesai = false, ada = {};
        function tombol(p, baru){
          if (ada[p.alamat]) return; ada[p.alamat] = 1;
          var b = document.createElement("button"); b.className = "btn lebar dua"; b.textContent = (p.printer || !baru ? "🖨️ " : "📶 ") + p.nama + (baru ? " (baru)" : "");
          b.onclick = function(){ selesai = true; var s = { nama:p.nama, alamat:p.alamat }; try { localStorage.setItem(KUNCI_PRINTER, JSON.stringify(s)); } catch(e){} d.close(); ok(s); };
          if (baru && p.printer) wadah.insertBefore(b, wadah.firstChild); else wadah.appendChild(b);
        }
        daftar.forEach(function(p){ tombol(p, false); });
        var bc = d.querySelector('[data-a="cari"]');
        bc.onclick = function(){
          bc.disabled = true; bc.textContent = "Mencari printer… (±12 detik)";
          C.nativePromise("PrinterWillo", "cari", {}).then(function(r){
            var baru = ((r && r.perangkat) || []).filter(function(p){ return !ada[p.alamat]; });
            baru.forEach(function(p){ tombol(p, true); });
            info.textContent = baru.length ? "Ketuk nama printer (biasanya berawalan Printer, MTP, RPP, BlueTooth Printer, atau kode model). Pilihan ini diingat." :
              "Tidak ada perangkat baru ditemukan. Pastikan printer menyala, dekat dengan HP, dan tidak sedang tersambung ke aplikasi/HP lain.";
          }, function(e){ info.textContent = (e && e.message) || "Gagal mencari printer."; })
          .then(function(){ bc.disabled = false; bc.textContent = "🔍 Cari lagi"; });
        };
        if (!daftar.length) setTimeout(function(){ bc.click(); }, 300);
        d.querySelector('[data-a="atur"]').onclick = function(){ C.nativePromise("PrinterWillo", "bukaPengaturan", {}); d.close(); };
        d.querySelector('[data-a="batal"]').onclick = function(){ d.close(); };
        d.addEventListener("close", function(){ d.remove(); if (!selesai) gagal(galat("", "BATAL")); });
        document.body.appendChild(d); d.showModal();
      });
    });
  }
  function cetakAsli(teks, opsi){
    var C = aplikasi(), p = simpanan();
    return (p ? Promise.resolve(p) : pilihPrinter()).then(function(p){
      return C.nativePromise("PrinterWillo", "cetak", { alamat:p.alamat, data:keBase64(keByte(teks, opsi)) }).then(function(){ return "asli"; }, function(e){
        // Gagal tersambung: lupakan pilihan supaya ketukan berikutnya bisa memilih printer lain.
        if (e && e.code === "SAMBUNG") try { localStorage.removeItem(KUNCI_PRINTER); } catch(x){}
        throw e;
      });
    });
  }

  function bisaBle(){ return !!(navigator.bluetooth && navigator.bluetooth.requestDevice); }
  function android(){ return /Android/i.test(navigator.userAgent); }

  // Teks → byte ESC/POS. Huruf di luar ASCII diganti agar printer tidak mencetak simbol aneh.
  function ascii(teks){
    return String(teks).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[−–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/×/g, "x").replace(/[^\x0a\x20-\x7e]/g, "");
  }
  // opsi.besar: teks pendek (mis. nomor antrian) dicetak besar di tengah sebelum teks biasa.
  // Pengaturan cetak (menu Pengaturan toko): logo, barcode, huruf besar Total, struk ringkas, jarak kertas akhir.
  var KUNCI_CETAK = "willo_cetak_v1";
  function atur(){
    var a = {}; try { a = JSON.parse(localStorage.getItem(KUNCI_CETAK)) || {}; } catch(e){}
    return { logo:a.logo !== false, barcode:a.barcode !== false, tebal:a.tebal !== false, ringkas:a.ringkas !== false, jarak:a.jarak != null ? Math.max(0, Math.min(6, +a.jarak || 0)) : 2 };
  }
  function keByte(teks, opsi){
    var A = atur(); opsi = opsi ? Object.assign({}, opsi) : {};
    if (!A.logo) delete opsi.gambar; if (!A.barcode) delete opsi.barcode; if (!A.tebal) delete opsi.tebal;
    var b = [0x1b, 0x40, 0x1b, 0x74, 0x00]; // reset + tabel karakter dasar
    var tambah = function(s){ s = ascii(s); for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); };
    // opsi.gambar: logo hitam-putih {w: byte per baris, h: tinggi titik, d: base64 bit} → GS v 0 di tengah.
    if (opsi && opsi.gambar && opsi.gambar.d) {
      try {
        var g = opsi.gambar, bit = atob(g.d);
        b.push(0x1b, 0x61, 0x01, 0x1d, 0x76, 0x30, 0x00, g.w & 255, g.w >> 8, g.h & 255, g.h >> 8);
        for (var j = 0; j < bit.length; j++) b.push(bit.charCodeAt(j));
        b.push(0x0a, 0x1b, 0x61, 0x00);
      } catch(e){}
    }
    if (opsi && opsi.atas) { b.push(0x1b, 0x61, 0x01); tambah(opsi.atas + "\n"); }
    if (opsi && opsi.besar) { b.push(0x1b, 0x61, 0x01, 0x1d, 0x21, 0x33); tambah(opsi.besar + "\n"); b.push(0x1d, 0x21, 0x00); }
    if (opsi && (opsi.atas || opsi.besar)) b.push(0x1b, 0x61, opsi.tengah ? 0x01 : 0x00);
    // opsi.tebal: awalan baris yang dicetak tebal + tinggi ganda (mis. Total, Tunai, Kembalian).
    if (opsi && opsi.tebal) {
      teks.split("\n").forEach(function(baris, i, semua){
        var t = baris.trim(), tb = opsi.tebal.some(function(a){ return t.indexOf(a) === 0; });
        if (tb) b.push(0x1b, 0x21, 0x18);
        tambah(baris + (i < semua.length - 1 ? "\n" : ""));
        if (tb) b.push(0x1b, 0x21, 0x00);
      });
    } else tambah(teks);
    // opsi.barcode: kode CODE128 di tengah bawah (mis. nomor faktur).
    if (opsi && opsi.barcode) {
      var kode = ascii(String(opsi.barcode)).slice(0, 30);
      b.push(0x0a, 0x1b, 0x61, 0x01, 0x1d, 0x68, 0x30, 0x1d, 0x77, 0x02, 0x1d, 0x48, 0x00, 0x1d, 0x6b, 0x49, kode.length + 2, 0x7b, 0x42);
      for (var k = 0; k < kode.length; k++) b.push(kode.charCodeAt(k));
      b.push(0x1b, 0x61, 0x00);
    }
    // Jarak akhir supaya tulisan terakhir lewat dari gigi sobek printer, lalu potong (jika ada pisau).
    b.push(0x0a); for (var f = 0; f < A.jarak; f++) b.push(0x0a);
    b.push(0x1d, 0x56, 0x42, 0x00);
    return new Uint8Array(b);
  }

  function sambung(){
    if (karakter && perangkat && perangkat.gatt.connected) return Promise.resolve(karakter);
    var p = perangkat ? Promise.resolve(perangkat) : navigator.bluetooth.requestDevice({ acceptAllDevices:true, optionalServices:LAYANAN });
    return p.then(function(d){
      perangkat = d;
      d.addEventListener("gattserverdisconnected", function(){ karakter = null; });
      return d.gatt.connect();
    }).then(function(server){
      return server.getPrimaryServices();
    }).then(function(daftar){
      // Cari karakteristik pertama yang bisa ditulis.
      var cari = function(i){
        if (i >= daftar.length) throw new Error("Printer ini tidak menyediakan jalur cetak Bluetooth LE.");
        return daftar[i].getCharacteristics().then(function(cs){
          var c = cs.filter(function(x){ return x.properties.writeWithoutResponse || x.properties.write; })[0];
          return c || cari(i + 1);
        });
      };
      return cari(0);
    }).then(function(c){ karakter = c; return c; });
  }

  function kirim(c, data){
    var ukuran = 100, i = 0;
    var langkah = function(){
      if (i >= data.length) return Promise.resolve();
      var potong = data.slice(i, i + ukuran); i += ukuran;
      var tulis = c.properties.writeWithoutResponse && c.writeValueWithoutResponse ? c.writeValueWithoutResponse(potong) : c.writeValue(potong);
      return tulis.then(function(){ return new Promise(function(r){ setTimeout(r, 25); }); }).then(langkah);
    };
    return langkah();
  }

  // Di Android dibuka lewat intent: kalau RawBT belum terpasang, Chrome membuka Play Store.
  function lewatRawbt(teks, opsi){
    var b = keByte(teks, opsi), s = "";
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    var data = btoa(s);
    location.href = android() ? "intent:base64," + data + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;" : "rawbt:base64," + data;
  }
  // Teks gagal yang bisa dimengerti pemilik toko. "" = pengguna sendiri menutup daftar printer.
  function pesanGagal(e){
    if (!e) return "Gagal mencetak";
    if (e.code === "BATAL") return "";
    if (aplikasi() && e.message) return e.message;
    var m = String(e.message || "");
    if (e.name === "NotFoundError" && /cancel/i.test(m)) return "";
    if (e.name === "NotFoundError" || /adapter|availab/i.test(m)) return "Bluetooth HP belum menyala. Nyalakan Bluetooth (dan Lokasi), lalu coba lagi.";
    if (e.name === "SecurityError" || e.name === "NotAllowedError") return "Chrome belum diizinkan memakai Bluetooth. Buka Setelan HP > Aplikasi > Chrome > Izin, izinkan Perangkat di sekitar, lalu coba lagi.";
    if (e.name === "NetworkError") return "Printer tidak tersambung. Pastikan printer menyala dan dekat, lalu coba lagi.";
    return m || "Gagal mencetak";
  }
  function siapBle(){
    if (!navigator.bluetooth.getAvailability) return Promise.resolve();
    return navigator.bluetooth.getAvailability().then(function(ada){
      if (!ada) { var e = new Error("Bluetooth HP belum menyala. Nyalakan Bluetooth (dan Lokasi), lalu coba lagi."); e.name = "TidakAda"; throw e; }
    }, function(){});
  }

  window.CetakTermal = {
    bisaBle: bisaBle,
    atur: atur,
    simpanAtur: function(a){ try { localStorage.setItem(KUNCI_CETAK, JSON.stringify(a)); } catch(e){} },
    keByte: keByte,
    android: android,
    terhubung: function(){ if (aplikasi()) return !!simpanan(); return !!(karakter && perangkat && perangkat.gatt.connected); },
    nama: function(){ if (aplikasi()) { var p = simpanan(); return p ? p.nama : ""; } return perangkat ? (perangkat.name || "printer") : ""; },
    cetak: function(teks, opsi){
      if (aplikasi()) return cetakAsli(teks, opsi);
      if (!bisaBle()) {
        // Browser di dalam aplikasi (WA, IG, Samsung Internet) belum punya Web Bluetooth: pakai RawBT.
        if (android()) { lewatRawbt(teks, opsi); return Promise.resolve("rawbt"); }
        return Promise.reject(new Error("Browser ini belum bisa Bluetooth. Buka halaman ini di Chrome (Android atau laptop)."));
      }
      return siapBle().then(sambung).then(function(c){ return kirim(c, keByte(teks, opsi)); }).then(function(){ return "ble"; },
        function(e){ if (e && e.name === "NetworkError") { perangkat = null; karakter = null; } throw e; });
    },
    rawbt: function(teks, opsi){ if (aplikasi()) return cetakAsli(teks, opsi).catch(function(e){ var m = pesanGagal(e); if (m) alert(m); }); lewatRawbt(teks, opsi); },
    aplikasi: function(){ return !!aplikasi(); },
    pesanGagal: pesanGagal,
    lupakan: function(){ if (aplikasi()) { try { localStorage.removeItem(KUNCI_PRINTER); } catch(e){} window.Capacitor.nativePromise("PrinterWillo", "putus", {}); return; } try { if (perangkat && perangkat.gatt.connected) perangkat.gatt.disconnect(); } catch(e){} perangkat = null; karakter = null; }
  };
})();

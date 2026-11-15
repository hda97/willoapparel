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
          '<div class="baris"><button class="btn dua" data-a="atur">Pengaturan Bluetooth</button><button class="btn dua" data-a="batal">Batal</button></div></div>';
        d.querySelector("p").textContent = daftar.length ? "Ketuk nama printer termalmu. Pilihan ini diingat." :
          "Belum ada printer yang dipasangkan. Nyalakan printer, buka Pengaturan Bluetooth, pasangkan printernya (PIN biasanya 0000 atau 1234), lalu coba cetak lagi.";
        var wadah = d.querySelector(".daftar-printer"), selesai = false;
        daftar.forEach(function(p){
          var b = document.createElement("button"); b.className = "btn lebar dua"; b.textContent = "🖨️ " + p.nama;
          b.onclick = function(){ selesai = true; try { localStorage.setItem(KUNCI_PRINTER, JSON.stringify(p)); } catch(e){} d.close(); ok(p); };
          wadah.appendChild(b);
        });
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
  function keByte(teks, opsi){
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
    tambah(teks);
    b.push(0x0a, 0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x42, 0x00); // beri jarak + potong kertas (jika ada pisau)
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

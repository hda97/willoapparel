/* Mode owner & pegawai (Huda 15 Nov 2026).
   Bila PIN owner dipasang: pegawai hanya bisa berjualan. Bagian bertanda [data-owner] disembunyikan,
   halaman bertanda <html data-halaman-owner> minta PIN. Status terbuka hilang saat aplikasi ditutup,
   setelah 15 menit tidak disentuh, atau saat menekan "Kunci". PIN disimpan sebagai sidik SHA-256, bukan angka aslinya. */
(function(){
  "use strict";
  var KUNCI = "willo_owner_v1", SESI = "willo_owner_buka", DIAM = 15 * 60 * 1000;
  function data(){ try { return JSON.parse(localStorage.getItem(KUNCI)) || {}; } catch(e){ return {}; } }
  function adaPin(){ return !!data().pin; }
  function terbuka(){ try { var w = +sessionStorage.getItem(SESI) || 0; return w && Date.now() - w < DIAM; } catch(e){ return false; } }
  function catatBuka(){ try { sessionStorage.setItem(SESI, String(Date.now())); } catch(e){} }
  function terkunci(){ return adaPin() && !terbuka(); }
  function sidik(pin){
    var teks = "lumbung-willo:" + pin;
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(teks)).then(function(b){ return Array.prototype.map.call(new Uint8Array(b), function(x){ return ("0" + x.toString(16)).slice(-2); }).join(""); });
    }
    var h = 5381; for (var i = 0; i < teks.length; i++) h = ((h << 5) + h + teks.charCodeAt(i)) >>> 0;
    return Promise.resolve("d" + h.toString(16));
  }
  function terapkan(){
    var k = terkunci(); document.documentElement.classList.toggle("mode-pegawai", k);
    var t = document.getElementById("ownerTombol");
    if (t) { t.classList.toggle("tersembunyi", !adaPin()); t.textContent = k ? "🔒 Mode pegawai · Masuk owner" : "🔓 Owner · Kunci"; }
    var tirai = document.getElementById("ownerTirai");
    if (tirai) tirai.classList.toggle("tersembunyi", !(k && document.documentElement.hasAttribute("data-halaman-owner")));
    document.dispatchEvent(new CustomEvent("lumbung-owner", { detail:{ terkunci:k } }));
  }
  var dlg;
  function dialog(){
    if (dlg) return dlg;
    dlg = document.createElement("dialog"); dlg.id = "ownerDialog"; dlg.setAttribute("data-teks", "");
    dlg.innerHTML = '<form method="dialog" style="margin:0"><h2 id="odJudul" style="margin:0 0 6px">Masuk owner</h2><p class="kecil redup" id="odKet" style="margin:0 0 10px">Masukkan PIN owner.</p>' +
      '<input id="odPin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" style="width:100%;font-size:28px;letter-spacing:.4em;text-align:center;padding:10px;border:1px solid var(--garis);border-radius:10px">' +
      '<p class="kecil" id="odSalah" style="color:var(--merah);min-height:1.2em;margin:6px 0"></p>' +
      '<div class="baris" style="justify-content:flex-end;gap:8px"><button class="btn dua" value="batal" formnovalidate>Batal</button><button class="btn" value="ok" id="odOk">Masuk</button></div></form>';
    dlg.style.cssText = "border:0;border-radius:16px;padding:18px;width:min(92vw,340px)";
    document.body.appendChild(dlg);
    return dlg;
  }
  function mintaPin(judul, ket, salah){
    return new Promise(function(selesai){
      var d = dialog(); d.querySelector("#odJudul").textContent = judul; d.querySelector("#odKet").textContent = ket;
      d.querySelector("#odSalah").textContent = salah || ""; var inp = d.querySelector("#odPin"); inp.value = "";
      d.onclose = function(){ selesai(d.returnValue === "ok" ? inp.value.replace(/\D/g, "") : null); };
      d.returnValue = ""; d.showModal(); setTimeout(function(){ inp.focus(); }, 50);
    });
  }
  function buka(salah){
    return mintaPin("Masuk owner", "Masukkan PIN owner untuk membuka laporan, harga, dan pengaturan.", salah).then(function(pin){
      if (pin == null) return false;
      return sidik(pin).then(function(h){
        if (h === data().pin) { catatBuka(); terapkan(); return true; }
        return buka("PIN salah, coba lagi.");
      });
    });
  }
  function kunci(){ try { sessionStorage.removeItem(SESI); } catch(e){} terapkan(); }
  function pasangPin(){
    return mintaPin("Buat PIN owner", "4 sampai 8 angka. Jangan beri tahu pegawai.").then(function(a){
      if (a == null) return false;
      if (a.length < 4) { alert("PIN minimal 4 angka."); return false; }
      return mintaPin("Ulangi PIN", "Ketik sekali lagi PIN yang sama.").then(function(b2){
        if (b2 == null) return false;
        if (a !== b2) { alert("PIN tidak sama. Coba lagi."); return false; }
        return sidik(a).then(function(h){ var d = data(); d.pin = h; localStorage.setItem(KUNCI, JSON.stringify(d)); catatBuka(); terapkan(); return true; });
      });
    });
  }
  function hapusPin(){ var d = data(); delete d.pin; localStorage.setItem(KUNCI, JSON.stringify(d)); terapkan(); }
  // Langsung sembunyikan bagian owner sebelum halaman tergambar (tanpa kedip).
  document.documentElement.classList.toggle("mode-pegawai", terkunci());
  window.LumbungOwner = { terkunci:terkunci, adaPin:adaPin, buka:buka, kunci:kunci, pasangPin:pasangPin, hapusPin:hapusPin, terapkan:terapkan };

  var st = document.createElement("style");
  (function(){
    st.textContent = "html.mode-pegawai [data-owner]{display:none!important}" +
      "html.mode-pegawai[data-halaman-owner] body>*:not(#ownerTirai):not(dialog):not(header){visibility:hidden}" +
      "#ownerTombol{border:0;background:rgba(255,255,255,.14);color:inherit;font:inherit;font-size:13px;font-weight:700;border-radius:999px;padding:5px 10px;cursor:pointer;white-space:nowrap}" +
      "#ownerTirai{position:fixed;inset:0;z-index:30;background:var(--bg,#f6f4ef);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}";
    (document.head || document.documentElement).appendChild(st);
  })();
  function mulai(){
    var atas = document.querySelector("header.atas .wrap");
    if (atas) { var t = document.createElement("button"); t.type = "button"; t.id = "ownerTombol"; t.className = "tersembunyi"; t.onclick = function(){ if (terkunci()) buka(); else kunci(); }; atas.appendChild(t); }
    if (document.documentElement.hasAttribute("data-halaman-owner")) {
      var tr = document.createElement("div"); tr.id = "ownerTirai"; tr.className = "tersembunyi";
      tr.innerHTML = '<div style="font-size:44px">🔒</div><h2 style="margin:0">Khusus owner</h2><p class="redup" style="margin:0;max-width:320px">Halaman ini berisi catatan uang. Masukkan PIN owner untuk membukanya.</p>' +
        '<button class="btn" type="button" id="ownerTiraiBuka">Masukkan PIN</button><a href="/alat/" class="redup">← Kembali</a>';
      document.body.appendChild(tr); document.getElementById("ownerTiraiBuka").onclick = function(){ buka(); };
    }
    terapkan();
    // Perpanjang sesi owner selama layar disentuh; kunci otomatis setelah 15 menit diam.
    ["pointerdown","keydown"].forEach(function(ev){ document.addEventListener(ev, function(){ if (adaPin() && terbuka()) catatBuka(); }, true); });
    setInterval(function(){ if (adaPin() && !terbuka() && !document.documentElement.classList.contains("mode-pegawai")) terapkan(); }, 30000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulai); else mulai();
})();

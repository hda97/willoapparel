// DESA GABUNGAN (Huda 8 Nov 2026): 5 dusun disatukan dalam satu denah desa.
// Tiap dusun tetap dimuat sendiri (ringan untuk HP), tapi letaknya nyata di satu peta: keluar lewat gapura,
// jalan kaki di Jl. Raya Dunia Kotak, lalu masuk gapura dusun tetangga. Bus tetap ada.
// Gambar: aset/peta-desa.jpg = render 3D asli tiap dusun (kamera miring 35° dari selatan), sumber di
// /mnt/project-files/desa-kotak/denah-desa-gabungan/sumber/ (r3d.js, glue.js, komposit.py).

// letak tiap dusun di desa: titik (0,0) lokal dusun → (gx, gz) satuan dunia desa; GERBANG = ujung jalan gapura (lokal)
export const LETAK = {
  curug: {gx: 0, gz: 0, gerbang: [971, 240], batas: [-767.5, 1070, -872.5, 247.5]},
  kulon: {gx: 1885, gz: 450, gerbang: [0, 145], batas: [-665, 665, -1550, 150]},
  wetan: {gx: 411, gz: 1387, gerbang: [0, 985], batas: [-345, 650, -990, 990]},
  tlaga: {gx: 801, gz: 3797, gerbang: [0, 215], batas: [-720, 720, -1270, 220]},
  segara: {gx: 2625, gz: 2520, gerbang: [0, 1205], batas: [-745, 755, -325, 1210]},
};
const IKON = {wetan: '🌾', kulon: '🍃', curug: '💦', tlaga: '🛶', segara: '🏙️'};
// proyeksi gambar peta (sama dengan komposit.py, gambar diperkecil 1/2): u = (x - X0)·K, v = (z·sin35 − y·cos35 − VTOP)·K
const K = .35, X0 = -1050, VTOP = -1639.0434763441212, SN = Math.sin(35 * Math.PI / 180), IMG = [1610, 1461];
const keGambar = (x, z) => [(x - X0) * K / IMG[0] * 100, (z * SN - VTOP) * K / IMG[1] * 100];
const global = (d, x, z) => [x + LETAK[d].gx, z + LETAK[d].gz];

// Jl. Raya Dunia Kotak: jalan utama (urut utara → selatan) + cabang ke tiap gapura
const UTAMA = [[1150, 240], [1150, 800], [1150, 2452], [1650, 2452], [1650, 3800], [1650, 4200]];
const CABANG = {curug: [0, [[971, 240]]], kulon: [1, [[1885, 800], [1885, 595]]], wetan: [2, [[411, 2452], [411, 2372]]],
  segara: [4, [[2625, 3800], [2625, 3725]]], tlaga: [5, [[801, 4200], [801, 4012]]]};
export function ruteJalan(a, b) {
  const [ia, ca] = CABANG[a], [ib, cb] = CABANG[b];
  const tengah = ia <= ib ? UTAMA.slice(ia, ib + 1) : UTAMA.slice(ib, ia + 1).reverse();
  return [...ca.slice().reverse(), ...tengah, ...cb];
}
const panjang = p => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
const ARAH = (a, b) => { const [ax, az] = global(a, 0, 0), [bx, bz] = global(b, 0, 0), dx = bx - ax, dz = bz - az;
  const ns = dz < -300 ? 'utara' : dz > 300 ? 'selatan' : '', ew = dx < -300 ? 'barat' : dx > 300 ? 'timur' : '';
  return ns && ew ? ns + ' ' + ew : ns || ew || 'dekat'; };

export function pasangDesaGabung(o) {
  // o: {DI, NAMA (dusun yang sudah dibuka), VS, tokoh, tanah, toast, bunyi, pindahBus}
  const {DI, NAMA, VS} = o;
  const ada = d => !!NAMA[d];
  const css = document.createElement('style');
  css.textContent = `#panelDesa .panel{width:min(960px,96vw);padding:10px 12px}
#desaBingkai{position:relative;border-radius:14px;height:calc(100 * var(--vh,1vh) - 170px);min-height:320px;background:#9fd3f5;overflow:hidden}
#desaBingkai iframe{display:block;width:100%;height:100%;border:0}
.dsAku{position:absolute;transform:translate(-50%,-100%);pointer-events:none;font:900 12px Montserrat,sans-serif;color:#fff;background:#2f6fd8;border:2px solid #fff;border-radius:999px;padding:3px 8px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.4)}
.dsAku:after{content:'';position:absolute;left:50%;bottom:-8px;margin-left:-6px;border:6px solid transparent;border-top-color:#2f6fd8}
#chipGapura{position:fixed;left:50%;top:calc(74px + env(safe-area-inset-top));transform:translateX(-50%);z-index:30;border:0;border-radius:999px;padding:10px 16px;background:#f2a13a;color:#2a1a05;font:900 14px Montserrat,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer;animation:popMuncul .16s ease-out}
.dsPilih{display:block;width:100%;margin:6px 0;padding:11px 12px;border-radius:12px;border:2px solid #cbbd9e;background:#fff;color:#2a2a2a;font:700 15px Montserrat,sans-serif;text-align:left;cursor:pointer}
.dsPilih small{display:block;font-weight:600;color:#6a5a48;font-size:12px;margin-top:2px}
#layarJalan{position:fixed;inset:0;z-index:70;background:#0e1626;display:grid;place-items:center}
#layarJalan .bj{position:relative;width:min(96vw,calc(96 * var(--vh,1vh) * 1610 / 1461 - 80px));}
#layarJalan img{display:block;width:100%;border-radius:12px;opacity:.92}
#layarJalan svg{position:absolute;inset:0;width:100%;height:100%}
#layarJalan .tk{position:absolute;left:0;right:0;bottom:-40px;text-align:center;color:#fff;font:800 15px Montserrat,sans-serif}`;
  document.head.appendChild(css);

  // ---------- panel "Seluruh Desa" ----------
  const pn = document.createElement('div'); pn.id = 'panelDesa'; pn.className = 'layarPenuh'; pn.hidden = true;
  pn.innerHTML = `<div class="panel"><div class="petaAtas"><h2>🌄 Peta Desa Dunia Kotak</h2><button class="tutupX" data-x aria-label="Tutup">✕</button></div>
    <div id="desaBingkai"><iframe title="Pulau 3D Desa Dunia Kotak" allow="web-share; clipboard-write" loading="lazy"></iframe></div>
    <p class="kecil" style="margin:8px 0 0">Putar & zoom pulau. Ketuk dusun untuk berkunjung lewat Jl. Raya Dunia Kotak, atau naik bus 🚌.</p></div>`;
  document.body.appendChild(pn);
  pn.onclick = e => { if (e.target === pn || e.target.closest('[data-x]')) pn.hidden = true; };
  // Peta Desa = pulau 3D yang sama dengan willoapparel.com/duniakotak/pulau/ (Huda 8 Nov: jadi bahan konten).
  // Ketuk nama dusun di pulau → pesan {dk:'pergi', dusun} → jalan kaki ke dusun itu.
  addEventListener('message', e => {
    if (e.origin !== location.origin || !e.data || e.data.dk !== 'pergi' || pn.hidden) return;
    const d = String(e.data.dusun || ''); if (!LETAK[d] || d === DI) return;
    if (!ada(d)) { o.toast(d === 'segara' ? 'Dusun Kotak Segara dibuka setelah 4 dusun lain penuh! 🏙️' : 'Dusun ini belum dibuka.', 3000); return; }
    pn.hidden = true; jalanKe(d);
  });
  const bukaDesa = () => {
    const f = pn.querySelector('iframe');
    if (!f.src) f.src = `/duniakotak/pulau/?embed=1&game=1&di=${encodeURIComponent(DI)}`;
    pn.hidden = false;
  };
  // tombol di Peta Dusun → Peta Desa
  const atas = document.querySelector('#panelPeta .petaAtas');
  if (atas) { const b = document.createElement('button'); b.id = 'bPetaDesa'; b.type = 'button'; b.textContent = '🌄 Seluruh Desa';
    b.style.cssText = 'margin-left:auto;margin-right:8px;border:0;border-radius:999px;padding:7px 12px;background:#ffd23a;color:#2a1a05;font:900 13px Montserrat,sans-serif;cursor:pointer';
    b.onclick = () => { document.getElementById('panelPeta').hidden = true; bukaDesa(); }; atas.insertBefore(b, atas.lastElementChild); }

  // ---------- gapura: jalan kaki ke dusun lain ----------
  const chip = document.createElement('button'); chip.id = 'chipGapura'; chip.hidden = true; chip.textContent = '🛣️ Gapura · jalan kaki ke dusun lain';
  document.body.appendChild(chip); chip.onclick = () => pilihan(false);
  function pilihan(dariPeta) {
    let p = document.getElementById('pilihJalan');
    if (!p) { p = document.createElement('div'); p.id = 'pilihJalan'; p.className = 'layarPenuh popup'; document.body.appendChild(p);
      p.onclick = e => { const b = e.target.closest('button'); if (e.target === p || (b && b.dataset.batal != null)) { p.hidden = true; return; }
        if (!b) return; if (b.dataset.jalan) { p.hidden = true; jalanKe(b.dataset.jalan); } else if (b.dataset.bus) { p.hidden = true; o.pindahBus(b.dataset.bus); } }; }
    const kd = o.kend && o.kend();
    const daftar = Object.keys(LETAK).filter(d => d !== DI && ada(d)).map(d => { const m = Math.round(panjang(ruteJalan(DI, d)) / VS);
      return `<button class="dsPilih" data-jalan="${d}">${IKON[d]} ${kd ? kd.ikon + ' Naik ' + kd.nama : 'Jalan kaki'} ke Dusun ${NAMA[d]}<small>arah ${ARAH(DI, d)} · ±${m} m lewat Jl. Raya Dunia Kotak</small></button>`; }).join('');
    p.innerHTML = `<div class="panel" style="max-width:360px"><h2 style="margin:0 0 6px">🛣️ Jl. Raya Dunia Kotak</h2>
      <p class="kecil" style="margin:0 0 6px">${dariPeta ? 'Jalan kaki dimulai dari gapura dusunmu.' : 'Kamu di gapura Dusun ' + NAMA[DI] + '. Mau ke mana?'}</p>${daftar}
      <button class="dsPilih" data-batal style="background:none;border:0;text-align:center;color:#ccc">Batal</button></div>`;
    p.hidden = false;
  }
  // animasi jalan kaki di peta desa, lalu masuk dusun tujuan lewat gapuranya
  function jalanKe(d) {
    const rt = ruteJalan(DI, d), pts = rt.map(([x, z]) => keGambar(x, z)), kd = o.kend && o.kend();
    const L = document.createElement('div'); L.id = 'layarJalan';
    L.innerHTML = `<div class="bj"><img src="/duniakotak/mabar/aset/peta-desa.jpg" alt=""><svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="#2f6fd8" stroke-width=".9" stroke-dasharray="1.6 1" vector-effect="non-scaling-stroke" style="stroke-width:5px"/></svg>
      <div class="dsAku" id="jalanAku">${kd ? kd.ikon : '🚶'} Kamu</div><div class="tk">${kd ? 'Naik ' + kd.nama : 'Berjalan'} di Jl. Raya Dunia Kotak menuju Dusun ${NAMA[d]}…</div></div>`;
    document.body.appendChild(L); if (o.bunyi) o.bunyi('klik');
    const tot = panjang(pts), dur = 3200, t0 = performance.now(), aku = L.querySelector('#jalanAku');
    const step = t => { const f = Math.min(1, (t - t0) / dur); let s = f * tot, i = 0;
      while (i < pts.length - 2 && s > Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])) { s -= Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); i++; }
      const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, k = Math.min(1, s / l);
      aku.style.left = (a[0] + (b[0] - a[0]) * k) + '%'; aku.style.top = (a[1] + (b[1] - a[1]) * k) + '%';
      if (f < 1) requestAnimationFrame(step); else { const u = new URL(location.href); u.searchParams.set('dusun', d); u.searchParams.set('ke', 'gapura'); location.href = u.toString(); } };
    requestAnimationFrame(step);
  }
  // dipanggil tiap frame dari loop game: tampilkan tombol gapura saat pemain di ujung jalan gapura
  let dekatG = false;
  function cek(me) {
    if (!me) return; const g = LETAK[DI] && LETAK[DI].gerbang; if (!g) return;
    const d = Math.hypot(me.position.x - g[0], me.position.z - g[1]), dekat = d < (dekatG ? 34 : 26);
    if (dekat) { const kd = o.kend && o.kend(), t = '🛣️ Gapura · ' + (kd ? kd.ikon + ' naik ' + kd.nama : 'jalan kaki') + ' ke dusun lain'; if (chip.textContent !== t) chip.textContent = t; }
    if (dekat !== dekatG) { dekatG = dekat; chip.hidden = !dekat; if (dekat && o.bunyi) o.bunyi('klik'); }
  }
  // tiba lewat gapura: berdiri di ujung jalan gapura dusun ini, menghadap ke dalam dusun
  function tiba() {
    const me = o.tokoh.saya, g = LETAK[DI] && LETAK[DI].gerbang; if (!me || !g) return false;
    const x = g[0], z = g[1] - 14; me.position.set(x, o.tanah ? o.tanah(x, z, 0) : 0, z); me.rotation.y = Math.PI;
    o.toast(`🛣️ Sampai di gapura Dusun ${NAMA[DI]}. Selamat datang!`, 3500); return true;
  }
  return {buka: bukaDesa, cek, tiba, pilihan};
}

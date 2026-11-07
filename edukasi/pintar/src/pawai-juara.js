// ===================================================================
// PAWAI JUARA: pemimpin pawai (warga pembawa bendera) berjalan seperti ular di alun-alun.
// Arahkan ke petak jawaban yang benar: +1 warga bergabung ke barisan. Salah: 1 warga keluar.
// ===================================================================
const CSS_GAME = /*CSS*/`
#pAtas{position:fixed;left:max(10px,env(safe-area-inset-left));right:calc(max(10px,env(safe-area-inset-right)) + 212px);top:max(10px,env(safe-area-inset-top));--fsSoal:clamp(19px,3.2vw,28px);--fsOpsi:clamp(15px,2.4vw,20px)}
#pAtas .op{min-height:40px;cursor:default;padding:5px 9px}
#pAtas .kOpsi{pointer-events:none}
@media (max-width:760px){#pAtas{right:max(10px,env(safe-area-inset-right));top:calc(max(10px,env(safe-area-inset-top)) + 54px)}#pAtas .kSoal{padding:8px 10px 10px;gap:6px}}
#pSkor{position:fixed;left:max(10px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));background:#fff;border-radius:16px;padding:6px 14px;font-weight:800;font-size:clamp(16px,3.6vw,21px);box-shadow:0 5px 0 rgba(0,0,0,.14);line-height:1.2}
#pSkor small{display:block;color:#868e96;font-size:.75em}
#dpad{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(3,58px);grid-template-rows:repeat(2,58px);gap:6px}
#dpad button{border:0;border-radius:16px;background:rgba(73,80,87,.9);color:#fff;font-size:26px;font-weight:800;box-shadow:0 5px 0 rgba(0,0,0,.25);cursor:pointer;touch-action:none}
#dpad button:active,#dpad button.tekan{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.25);background:#1c7ed6}
#dpad .atas{grid-column:2;grid-row:1}#dpad .kiri{grid-column:1;grid-row:2}#dpad .bawah{grid-column:2;grid-row:2}#dpad .kanan{grid-column:3;grid-row:2}
#pPesan{position:fixed;left:50%;top:52%;transform:translate(-50%,-50%);background:#fff;border-radius:18px;padding:6px 18px;font-weight:800;font-size:clamp(20px,5vw,30px);box-shadow:0 6px 0 rgba(0,0,0,.15);pointer-events:none;white-space:nowrap;animation:muncul .3s}
/*AKHIR-CSS*/`;

const N = 4; // petak -4..4 (9 x 9)
const WARNA_PETAK = {A: '#ff6b6b', B: '#4dabf7', C: '#fab005', D: '#40c057'};
const PW = {pemain: bacaLS('dkpintar:pawai', {nama: '', tokoh: 0}), barisan: [], jejak: [], arah: null, antriArah: null, t: 0, LANGKAH: .42, petak: [], kartu: null, sesi: 0, gerak: false, skor: {benar: 0, salah: 0, no: 0}, total: 10};

Object.assign(GAME, {
  id: 'pawai-juara', judul: 'Pawai Juara', ajak: 'Pimpin pawai ke jawaban yang benar!',
  jumlah: {label: 'Jumlah soal', opsi: [5, 10, 15, 20], def: 10},
  musik: {bpm: 116, nada: 60, alat: 'marimba', progresi: [0, 5, 3, 4], benih: 45},
  bantuan: `<ul><li>Baca soal di atas. Setiap pilihan A, B, C, D punya petak berwarna di alun-alun.</li>
    <li>Arahkan pemimpin pawai ke petak jawaban yang benar dengan tombol panah, geser jari di layar, atau tombol panah/WASD di keyboard.</li>
    <li>Benar: satu warga bergabung ke barisan pawai. Salah: satu warga keluar barisan.</li><li>Menabrak pagar tidak apa-apa, pemimpin hanya berhenti.</li></ul>`,
  siapkan() {
    siapPanggung({langit: '#7fcdff', bayangan: 18});
    const sc = P.sc; sc.add(tanah('#5cbf4a', 200));
    for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) sc.add(di(kotak(.97, .12, .97, (i + j) % 2 ? '#f3d9a4' : '#fbe7bf', .04), i, .06, j));
    for (let i = -N - 1; i <= N + 1; i++) [[i, -N - 1], [i, N + 1], [-N - 1, i], [N + 1, i]].forEach(([x, z]) => { if (Math.abs(x) <= N + 1 && Math.abs(z) <= N + 1) sc.add(di(kotak(.92, .5, .92, variasi('#c98a4b', .04), .12), x, .25, z)); });
    // umbul-umbul & bendera merah putih di sudut pagar
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const g = new THREE.Group(); g.add(di(kotak(.12, 3.2, .12, '#f1f3f5', .03), 0, 1.6, 0)); g.add(di(kotak(.05, .4, .9, '#e03131', .02), 0, 2.95, .5)); g.add(di(kotak(.05, .4, .9, '#ffffff', .02), 0, 2.55, .5)); g.position.set(a * (N + 1), .5, b * (N + 1)); sc.add(g); });
    for (let i = -N; i <= N; i++) [-N - 1, N + 1].forEach(z => sc.add(di(kotak(.32, .32, .06, i % 2 ? '#e03131' : '#ffffff', .03), i, 1.75 - Math.abs(Math.sin(i * .6)) * .2, z)));
    for (let i = -N; i <= N; i++) [-N - 1, N + 1].forEach(x => sc.add(di(kotak(.06, .32, .32, i % 2 ? '#e03131' : '#ffffff', .03), x, 1.75 - Math.abs(Math.sin(i * .6)) * .2, i)));
    // rumah & pohon di sekeliling alun-alun
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, r = 11.5; const rm = rumahMesh(k % 3 ? 'kecil' : 'duaLantai', {dinding: ['krem', 'hijau', 'biru', 'kuning', 'merahMuda', 'ungu'][k % 6], atap: ['merah', 'oranye', 'biru', 'hijau', 'cokelat'][k % 5]});
      rm.scale.setScalar(.55); rm.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); rm.lookAt(0, 0, 0); sc.add(rm); }
    for (let k = 0; k < 26; k++) { const a = k / 26 * Math.PI * 2 + .1, r = acak(8, 9.5); const p = pohon(acak(.45, .65)); p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); sc.add(p); }
    for (let i = 0; i < 60; i++) { const a = acak(0, Math.PI * 2), r = acak(6, 9); const b = bunga(pilih(['#ff6fa3', '#ffd23f', '#a78bfa', '#ff922b', '#ffffff'])); b.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); sc.add(b); }
    for (let i = 0; i < 6; i++) { const a = awan(acak(1, 1.6)); a.position.set(acak(-16, 16), acak(10, 14), acak(-26, -16)); sc.add(a); }
    this.buatPemimpin(); this.posisiAwal();
    // kontrol: keyboard + geser jari
    addEventListener('keydown', e => { const m = {ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0]}[e.code]; if (m && MAIN) { e.preventDefault(); this.arahkan(m); } });
    let awal = null; const c = P.R.domElement;
    c.addEventListener('pointerdown', e => { awal = {x: e.clientX, y: e.clientY}; });
    c.addEventListener('pointerup', e => { if (!awal || !MAIN) return; const dx = e.clientX - awal.x, dy = e.clientY - awal.y; awal = null; if (Math.hypot(dx, dy) < 24) return; this.arahkan(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]); });
  },
  buatPemimpin() {
    if (PW.pemimpin) P.sc.remove(PW.pemimpin);
    const pm = PW.pemain, o = pm.tokoh < SISWA.length ? SISWA[pm.tokoh].o : wargaAcak(3);
    const t = buatTokoh({...o, ekspresi: 'senang'}, .36);
    // bendera merah putih di tangan kanan (ikut lengan)
    const arm = t.userData.u.armR, f = new THREE.Group(); f.add(di(kotak(.14, 4, .14, '#e9ecef', .04), 0, -2.6, 0));
    f.add(di(kotak(.06, .7, 1.5, '#e03131', .02), 0, -4.25, .78)); f.add(di(kotak(.06, .7, 1.5, '#ffffff', .02), 0, -3.55, .78)); arm.add(f);
    t.userData.mode = 'bendera'; P.sc.add(t); PW.pemimpin = t;
  },
  posisiAwal() {
    PW.barisan.forEach(b => P.sc.remove(b)); PW.barisan = []; PW.jejak = [[0, 2]]; PW.arah = null; PW.antriArah = null;
    PW.pemimpin.position.set(0, .12, 2); PW.pemimpin.rotation.y = 0; PW.pemimpin.userData.dari = PW.pemimpin.position.clone(); PW.pemimpin.userData.ke = PW.pemimpin.position.clone();
    PW.petak.forEach(p => P.sc.remove(p)); PW.petak = [];
    // dua warga ikut di layar judul supaya terlihat seperti pawai
    if (!MAIN) for (let i = 0; i < 3; i++) { this.tambahWarga(true); } PW.pemimpin.position.z = 1; PW.jejak[0] = [0, 1]; PW.barisan.forEach((w, i) => { w.position.z = 2 + i; this.siapGerak(w); }); this.siapGerak(PW.pemimpin);
  },
  layarPemain(el, lanjut) {
    const pm = PW.pemain;
    el.innerHTML = `<h2 style="margin:0">Pilih pemimpin pawai</h2><div class="pKartu"><input type="text" id="pNama" maxlength="16" placeholder="Nama pemain" value="${esc(pm.nama)}" aria-label="Nama pemain">
      <div class="tokohPil">${[...SISWA.map((s, i) => [i, 'Seragam ' + s.nama]), [SISWA.length, 'Warga acak']].map(([i, t]) => `<button data-i="${i}" class="${pm.tokoh === i ? 'on' : ''}">${t}</button>`).join('')}</div>
      <span class="gInfo">Pemimpin di belakang berganti sesuai pilihan. Guru bisa memanggil murid bergantian; skor tiap giliran muncul di layar hasil.</span></div>
      <div class="aBaris"><span></span><button class="besar" id="pMulai">▶ Mulai Pawai</button></div>`;
    el.querySelectorAll('.tokohPil button').forEach(b => b.onclick = () => { efek.pop(); pm.tokoh = +b.dataset.i; el.querySelectorAll('.tokohPil button').forEach(x => x.classList.toggle('on', x === b)); const p = PW.pemimpin.position.clone(); this.buatPemimpin(); PW.pemimpin.position.copy(p); this.siapGerak(PW.pemimpin); setMode(PW.pemimpin, 'senang', .8); });
    $('pMulai').onclick = () => { efek.ketuk(); pm.nama = $('pNama').value.trim().slice(0, 16); simpanLS('dkpintar:pawai', pm); lanjut(); };
  },
  siapGerak(o) { o.userData.dari = o.position.clone(); o.userData.ke = o.position.clone(); },
  tambahWarga(diam = false) {
    const w = buatTokoh(wargaAcak(PW.barisan.length), .33); const ekor = PW.jejak[PW.barisan.length + 1] || PW.jejak[PW.jejak.length - 1];
    const asal = PW.barisan.length ? PW.barisan[PW.barisan.length - 1].position : PW.pemimpin.position;
    w.position.set(diam ? asal.x : ekor[0], .12, diam ? asal.z + 1 : ekor[1]); if (diam) PW.jejak.push([w.position.x, w.position.z]);
    this.siapGerak(w); P.sc.add(w); PW.barisan.push(w); if (!diam) { setMode(w, 'senang', 1); w.scale.setScalar(.01); animasi(.4, e => w.scale.setScalar(Math.max(.01, e))); }
  },
  kurangiWarga() { const w = PW.barisan.pop(); if (!w) return; konfeti(w.position.clone().add(new THREE.Vector3(0, .5, 0)), 14, ['#adb5bd', '#ced4da', '#868e96']); animasi(.3, e => w.scale.setScalar(Math.max(.01, 1 - e))).then(() => P.sc.remove(w)); },
  arahkan(d) {
    if (JEDA || !PW.gerak) return; const n = PW.barisan.length;
    const a = PW.antriArah || PW.arah; if (a && n && a[0] === -d[0] && a[1] === -d[1]) return; // tidak boleh berbalik menembus barisan
    PW.antriArah = d; if (!PW.arah) { PW.arah = d; PW.antriArah = null; PW.t = PW.LANGKAH; } efek.ketuk();
  },
  mulai() {
    const sesi = ++PW.sesi; PW.total = ATUR.jumlah || 10; PW.skor = {benar: 0, salah: 0, no: 0};
    this.posisiAwal();
    const ui = $('ui'); ui.innerHTML = `<div id="pAtas"></div><div id="pSkor"></div><div id="dpad"><button class="atas" data-d="0,-1" aria-label="Atas">▲</button><button class="kiri" data-d="-1,0" aria-label="Kiri">◀</button><button class="bawah" data-d="0,1" aria-label="Bawah">▼</button><button class="kanan" data-d="1,0" aria-label="Kanan">▶</button></div>`;
    ui.querySelectorAll('#dpad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('tekan'); setTimeout(() => b.classList.remove('tekan'), 150); this.arahkan(b.dataset.d.split(',').map(Number)); }));
    PW.kartu = buatKartu($('pAtas')); this.tulisSkor(); this.putaran(sesi);
  },
  tulisSkor() { $('pSkor') && ($('pSkor').innerHTML = `🚩 Barisan: ${PW.barisan.length + 1}<small>Soal ${Math.min(PW.skor.no, PW.total)} / ${PW.total}</small>`); },
  async putaran(sesi) {
    while (sesi === PW.sesi && PW.skor.no < PW.total) {
      PW.skor.no++; this.tulisSkor();
      const s = ambilSoal(0); this.pasangPetak(s); PW.gerak = true;
      const h = await tanya(PW.kartu, s); if (sesi !== PW.sesi) return;
      PW.gerak = false; PW.arah = null; PW.antriArah = null;
      if (h.benar) { efek.benar(); PW.skor.benar++; this.tambahWarga(); konfeti(PW.pemimpin.position.clone().add(new THREE.Vector3(0, .8, 0))); setMode(PW.pemimpin, 'senang', 1.2); }
      else { efek.salah(); PW.skor.salah++; this.kurangiWarga(); setMode(PW.pemimpin, 'geleng', 1.2); }
      this.tulisSkor(); this.hapusPetak(h.kunci);
      await umpan(PW.kartu, h, {tambahan: h.benar ? '+1 warga ikut pawai! 🎉' : ''}); if (sesi !== PW.sesi) return;
      PW.petak.forEach(p => P.sc.remove(p)); PW.petak = []; PW.pemimpin.userData.mode = 'bendera';
    }
    if (sesi !== PW.sesi) return;
    const nama = PW.pemain.nama || 'Kamu', b = PW.barisan.length + 1, bintang = PW.skor.benar >= PW.total * .8 ? 3 : PW.skor.benar >= PW.total * .5 ? 2 : 1;
    konfeti(PW.pemimpin.position.clone().add(new THREE.Vector3(0, 1, 0)), 50); PW.barisan.forEach(w => setMode(w, 'senang', 99));
    layarHasil(`${esc(nama)}: pawai ${b} orang!`, `<div style="font-size:clamp(30px,8vw,44px);color:#fab005;letter-spacing:4px">${'★'.repeat(bintang)}<span style="color:#dee2e6">${'★'.repeat(3 - bintang)}</span></div>${PW.skor.benar} benar · ${PW.skor.salah} salah dari ${PW.total} soal`);
  },
  pasangPetak(s) {
    PW.petak.forEach(p => P.sc.remove(p)); PW.petak = [];
    const lp = PW.pemimpin.position, dipakai = PW.jejak.slice(0, PW.barisan.length + 1).map(([x, z]) => Math.round(x) + ',' + Math.round(z));
    const ops = opsiSoal(s); let coba = 0; const pos = [];
    while (pos.length < ops.length && coba++ < 500) {
      const x = acakInt(-N + 1, N - 1), z = acakInt(-N + 1, N - 1);
      if (Math.abs(x - Math.round(lp.x)) + Math.abs(z - Math.round(lp.z)) < 3 || dipakai.includes(x + ',' + z) || pos.some(p => Math.abs(p[0] - x) + Math.abs(p[1] - z) < 3)) continue;
      pos.push([x, z]);
    }
    ops.forEach((o, i) => { const p = pos[i] || [i * 2 - 3, -4]; const t = ubin(.94, .94, WARNA_PETAK[o.h], o.h, '#fff', {kecil: o.teks.length <= 16 ? o.teks : '', tebal: .18});
      t.position.set(p[0], .1, p[1]); t.userData = {h: o.h, x: p[0], z: p[1], label: t.userData.label}; P.sc.add(t); PW.petak.push(t); t.scale.setScalar(.01); animasi(.35, e => t.scale.setScalar(Math.max(.01, e))); });
    efek.pop();
  },
  hapusPetak(kunci) { PW.petak.forEach(p => { if (p.userData.h !== kunci) animasi(.3, e => p.scale.setScalar(Math.max(.01, 1 - e))); else p.position.y = .16; }); },
  langkah() {
    if (PW.antriArah) { PW.arah = PW.antriArah; PW.antriArah = null; }
    const [cx, cz] = PW.jejak[0], nx = cx + PW.arah[0], nz = cz + PW.arah[1];
    if (Math.abs(nx) > N || Math.abs(nz) > N) { efek.tabrak(); PW.arah = null; [PW.pemimpin, ...PW.barisan].forEach(o => this.siapGerak(o)); return; }
    PW.jejak.unshift([nx, nz]); PW.jejak.length = Math.min(PW.jejak.length, PW.barisan.length + 3);
    [PW.pemimpin, ...PW.barisan].forEach((o, i) => { o.userData.dari = o.position.clone(); const j = PW.jejak[i] || PW.jejak[PW.jejak.length - 1]; o.userData.ke = new THREE.Vector3(j[0], .12, j[1]); });
    efek.langkah();
    const hit = PW.petak.find(p => p.userData.x === nx && p.userData.z === nz);
    if (hit && PW.kartu.aktif) { PW.arah = null; setTimeout(() => PW.kartu.selesai(hit.userData.h), 0); }
  },
  keMenu() { PW.sesi++; PW.gerak = false; $('ui').innerHTML = ''; this.posisiAwal(); },
  ukur() {
    const cam = P.cam, w = innerWidth, h = innerHeight, tg = tegak();
    // ruang kosong: di bawah kartu soal (HP) / seluruh layar dikurangi kartu (laptop)
    const ka = $('pAtas'), atas = document.body.dataset.layar === 'main' && ka && ka.firstChild ? ka.getBoundingClientRect().bottom + 6 : (tg ? 70 : 40);
    const bawah = h - (tg && document.body.dataset.layar === 'main' ? 70 : 6), tinggi = Math.max(120, bawah - atas);
    cam.fov = 40; const fovV = THREE.MathUtils.degToRad(cam.fov) * tinggi / h, fovH = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * w / h);
    const S = 2 * N + 2.4, sud = THREE.MathUtils.degToRad(tg ? 60 : 50);
    const d = Math.max((S / 2) / Math.tan(fovH / 2) * 1.04, (S * Math.sin(sud) / 2 + .9) / Math.tan(fovV / 2));
    cam.position.set(0, Math.sin(sud) * d, Math.cos(sud) * d + .3); cam.lookAt(0, 0, .3);
    const dy = (atas + bawah) / 2 - h / 2; cam.setViewOffset(w, h, 0, -dy, w, h); cam.updateProjectionMatrix();
  },
  update(dt) {
    [PW.pemimpin, ...PW.barisan].forEach(o => animTokoh(o, dt));
    if (MAIN && PW.arah && PW.gerak) { PW.t += dt; if (PW.t >= PW.LANGKAH) { PW.t = 0; this.langkah(); } }
    const p = Math.min(1, PW.t / PW.LANGKAH);
    [PW.pemimpin, ...PW.barisan].forEach(o => { const u = o.userData; if (!u.dari) return; const bergerak = PW.arah && PW.gerak && u.dari.distanceTo(u.ke) > .01;
      if (bergerak) { o.position.lerpVectors(u.dari, u.ke, p); const ry = Math.atan2(u.ke.x - u.dari.x, u.ke.z - u.dari.z); let da = ry - o.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); o.rotation.y += da * Math.min(1, dt * 12); }
      else if (u.dari.distanceTo(u.ke) > .01) { o.position.copy(u.ke); }
      if (o === PW.pemimpin) { u.jalan = bergerak; if (u.mode !== 'senang' && u.mode !== 'geleng') u.mode = 'bendera'; } else if (u.mode !== 'senang') u.mode = bergerak ? 'jalan' : 'diam'; });
    PW.petak.forEach((t, i) => { if (t.scale.x > .99) t.position.y = .1 + Math.abs(Math.sin(performance.now() / 400 + i)) * .06; });
    if (this._ukurT === undefined || (this._ukurT += dt) > .5) { this._ukurT = 0; this.ukur(); }
  },
});
GAME.uji = PW;
jalankan();

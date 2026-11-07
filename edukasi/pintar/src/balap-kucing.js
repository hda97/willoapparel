// ===================================================================
// BALAP KUCING: 2 pemain, layar dibelah dua, jawaban benar = kucing berlari maju.
// Laptop/tablet rebah: kiri-kanan. HP tegak: atas-bawah, sisi Pemain 1 diputar terbalik
// supaya dua anak bisa duduk berhadapan.
// ===================================================================
const CSS_GAME = /*CSS*/`
.sisi{position:fixed;display:flex;flex-direction:column;justify-content:space-between;gap:8px;padding:10px;pointer-events:none;--fsSoal:clamp(17px,2.4vw,28px);--fsOpsi:clamp(15px,1.9vw,22px)}
.sisi.p1{left:0;top:0;bottom:0;width:50%;padding-right:32px}.sisi.p2{right:0;top:0;bottom:0;width:50%;padding-left:32px}
body.tegak .sisi{--fsSoal:clamp(15px,4.4vw,24px);--fsOpsi:clamp(14px,3.8vw,20px)}
body.tegak .sisi.p1{left:0;right:0;top:0;bottom:auto;width:auto;height:50%;transform:rotate(180deg);padding:30px 10px 8px}
body.tegak .sisi.p2{left:0;right:0;bottom:0;top:auto;width:auto;height:50%;padding:30px 10px 8px}
.sInfo{display:flex;flex-direction:column;gap:5px;max-width:420px;width:100%}
.sisi.p2 .sInfo{align-self:flex-end}
body.tegak .sisi .sInfo{max-width:62%}
.sNama{display:flex;justify-content:space-between;gap:8px;background:#fff;border-radius:14px;padding:3px 12px;font-weight:800;font-size:clamp(15px,2vw,20px);box-shadow:0 4px 0 rgba(0,0,0,.12)}
.sNama b{color:var(--w)}.sJalur{height:12px;background:rgba(255,255,255,.85);border-radius:99px;overflow:hidden;box-shadow:0 2px 0 rgba(0,0,0,.1)}.sJalur i{display:block;height:100%;width:0;background:var(--w);transition:width .6s}
.sSoal{max-width:560px;width:100%;align-self:center}
body.tegak .kSoal{padding:8px 10px 10px;gap:6px}body.tegak .op{min-height:42px;padding:5px 8px}
body.g-balap-kucing #hud{left:50%;right:auto;transform:translateX(-50%);gap:6px;flex-direction:column}
body.g-balap-kucing #hud button{width:40px;height:40px;font-size:18px}
body.g-balap-kucing.tegak #hud{top:50%;transform:translate(-50%,-50%);flex-direction:row}
#garisBelah{position:fixed;background:#1f2a33;pointer-events:none;left:calc(50% - 3px);top:0;bottom:0;width:6px}
body.tegak #garisBelah{left:0;right:0;top:calc(50% - 3px);bottom:auto;width:auto;height:6px}
.namaWarna{font-size:14px;color:#868e96;font-weight:700}
/*AKHIR-CSS*/`;

const LANGKAH = 2.4, JALUR_Z = [-1.05, 1.05];
const WARNA_P = ['#e8590c', '#1c7ed6'];
const B = {pemain: bacaLS('dkpintar:balap', [{nama: 'Pemain 1', warna: 'oranye'}, {nama: 'Pemain 2', warna: 'putih'}]), kucing: [], kartu: [], camX: [0, 0], sesi: 0, skor: [], target: 10, podium: null};

Object.assign(GAME, {
  id: 'balap-kucing', judul: 'Balap Kucing', ajak: 'Jawab benar, kucingmu berlari ke garis finis!',
  jumlah: {label: 'Jawaban benar untuk sampai finis', opsi: [5, 10, 15], def: 10},
  musik: {bpm: 132, nada: 62, alat: 'xilofon', progresi: [0, 3, 4, 4], benih: 21},
  bantuan: `<ul><li>Dua pemain bermain bersamaan. Pemain 1 memakai sisi kiri (di HP: sisi atas), Pemain 2 sisi kanan (di HP: sisi bawah).</li>
    <li>Setiap pemain mendapat soal sendiri. Ketuk jawaban yang benar, kucingmu berlari satu langkah.</li>
    <li>Jawaban salah: kucing tidak maju dan muncul penjelasan.</li><li>Kucing pertama yang sampai di garis finis menang!</li></ul>`,
  siapkan() {
    siapPanggung({langit: '#8fd3ff'});
    const sc = P.sc; sc.add(tanah('#5fbf4a', 220));
    for (let x = -14; x < 64; x += 1.2) sc.add(di(kotak(1.15, .08, 4.4, Math.round(x / 1.2) % 2 ? '#e0c79a' : '#ecd7ab', .03), x, .04, 0));
    sc.add(di(kotak(78, .1, .08, '#ffffff', .02), 24, .06, 0));
    // gapura start
    for (let x = -14; x < 64; x += 5.5) { const r = rumahMesh(['kecil', 'duaLantai'][Math.abs(Math.round(x)) % 2], {dinding: ['krem', 'hijau', 'biru', 'kuning', 'merahMuda', 'putih'][Math.abs(Math.round(x * 3)) % 6], atap: ['merah', 'oranye', 'cokelat', 'biru', 'hijau'][Math.abs(Math.round(x * 7)) % 5]});
      r.scale.setScalar(.55); r.position.set(x, 0, -6.4); sc.add(r); const p = pohon(.6); p.position.set(x + 2.8, 0, -4.4); sc.add(p); }
    for (let x = -12; x < 64; x += 3.6) { const p = pohon(acak(.45, .6)); p.position.set(x + acak(-.5, .5), 0, acak(-3.6, -3)); sc.add(p); }
    for (let x = -12; x < 64; x += 2.2) { const s2 = acak(.35, .55); sc.add(di(kotak(s2 * 1.6, s2, s2 * 1.2, variasi('#3fae3f', .06), .12), x + acak(-.4, .4), s2 / 2, acak(3.4, 4.2))); }
    for (let i = 0; i < 70; i++) { const b = bunga(pilih(['#ff6fa3', '#ffd23f', '#a78bfa', '#ff922b', '#ffffff'])); b.position.set(acak(-14, 64), 0, pilih([-1, 1]) * acak(2.6, 3.6)); sc.add(b); }
    for (let i = 0; i < 9; i++) { const a = awan(acak(1, 1.8)); a.position.set(acak(-10, 60), acak(9, 13), acak(-24, -14)); sc.add(a); }
    B.garisStart = new THREE.Group(); for (let i = 0; i < 9; i++) B.garisStart.add(di(kotak(.4, .1, .48, i % 2 ? '#ffffff' : '#ff6b6b', .02), 0, .07, -2 + i * .5)); sc.add(B.garisStart);
    B.finis = new THREE.Group(); for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) B.finis.add(di(kotak(.5, .1, .5, (i + j) % 2 ? '#222' : '#fff', .02), j * .5, .07, -2 + i * .5));
    [[-2.4], [2.4]].forEach(([z]) => B.finis.add(di(kotak(.22, 3.2, .22, '#f1f3f5'), .25, 1.6, z)));
    const span = new THREE.Mesh(new THREE.BoxGeometry(.25, .9, 5), [0, 1, 2, 3, 4, 5].map(i => new THREE.MeshStandardMaterial(i === 4 || i === 5 ? {color: '#e03131'} : {color: '#e03131'})));
    const pt = new THREE.Mesh(new THREE.PlaneGeometry(4.6, .8), new THREE.MeshStandardMaterial({map: teksKanvasLebar('FINIS', '#e03131'), roughness: .7})); pt.rotation.y = Math.PI / 2; pt.position.x = -.14;
    const pt2 = pt.clone(); pt2.rotation.y = -Math.PI / 2; pt2.position.x = .14; const pita = new THREE.Group(); pita.add(span, pt, pt2); pita.position.set(.25, 3.15, 0); B.finis.add(pita); sc.add(B.finis);
    // podium hasil
    B.podium = new THREE.Group(); B.podium.add(di(kotak(1.9, 1.1, 1.7, '#ffd43b', .1), -1.05, .55, 0)); B.podium.add(di(kotak(1.9, .6, 1.7, '#ced4da', .1), 1.05, .3, 0)); sc.add(B.podium);
    B.kucing = B.pemain.map(p => { const k = buatKucing(p.warna); sc.add(k); return k; });
    B.finis.position.x = 10 * LANGKAH + .6; B.podium.visible = false;
    this.posisiAwal();
  },
  posisiAwal() { B.kucing.forEach((k, i) => { k.position.set(i ? 1 : -1, 0, .3); k.rotation.y = .3 * (i ? -1 : 1); setMode(k, 'diam'); }); B.camX = [0, 0]; },
  layarPemain(el, lanjut) {
    const nmW = w => WARNA_KUCING[w].nama;
    el.innerHTML = `<h2 style="margin:0">Pilih kucingmu</h2><div class="pGrid">${B.pemain.map((p, i) => `<div class="pKartu" style="border-color:${WARNA_P[i]}"><b style="color:${WARNA_P[i]};font-size:20px">Pemain ${i + 1}</b>
      <input type="text" id="pNama${i}" maxlength="14" value="${esc(p.nama)}" aria-label="Nama pemain ${i + 1}">
      <div class="pal" data-i="${i}">${DAFTAR_KUCING.map(w => { const W = WARNA_KUCING[w]; const bg = W.tambal ? `conic-gradient(${W.tambal[0]} 0 33%,${W.tambal[1]} 0 66%,${W.bulu} 0)` : W.dada ? `linear-gradient(90deg,${W.bulu} 55%,${W.terang} 55%)` : W.bulu;
        return `<button data-w="${w}" title="${W.nama}" aria-label="${W.nama}" class="${p.warna === w ? 'on' : ''}" style="background:${bg}"></button>`; }).join('')}</div>
      <div class="namaWarna" id="pWarna${i}">Kucing ${nmW(p.warna)}</div></div>`).join('')}</div>
      <div class="aBaris"><span class="gInfo">Kucing di belakang ikut berganti warna.</span><button class="besar" id="pMulai">▶ Mulai Balapan</button></div>`;
    el.querySelectorAll('.pal').forEach(pl => pl.querySelectorAll('button').forEach(b => b.onclick = () => { efek.pop(); const i = +pl.dataset.i; B.pemain[i].warna = b.dataset.w;
      pl.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); $('pWarna' + i).textContent = 'Kucing ' + nmW(b.dataset.w); this.gantiKucing(i); }));
    $('pMulai').onclick = () => { efek.ketuk(); B.pemain.forEach((p, i) => { p.nama = ($('pNama' + i).value.trim() || 'Pemain ' + (i + 1)).slice(0, 14); }); simpanLS('dkpintar:balap', B.pemain); lanjut(); };
  },
  gantiKucing(i) { const lama = B.kucing[i], k = buatKucing(B.pemain[i].warna); k.position.copy(lama.position); k.rotation.copy(lama.rotation); P.sc.remove(lama); P.sc.add(k); B.kucing[i] = k; setMode(k, 'senang', .8); efek.lompat(); },
  mulai() {
    const sesi = ++B.sesi; B.target = ATUR.jumlah || 10; B.skor = [{benar: 0, salah: 0, langkah: 0}, {benar: 0, salah: 0, langkah: 0}]; B.selesai = false;
    B.kucing.forEach((k, i) => { k.position.set(0, 0, JALUR_Z[i]); k.rotation.y = Math.PI / 2; setMode(k, 'diam'); }); B.camX = [0, 0];
    B.finis.position.x = B.target * LANGKAH + .6; B.podium.position.set(B.finis.position.x + 4.5, 0, 0); B.podium.visible = false;
    const ui = $('ui'); ui.innerHTML = '<div id="garisBelah"></div>'; B.kartu = [];
    B.pemain.forEach((p, i) => { const s = document.createElement('div'); s.className = 'sisi p' + (i + 1); s.style.setProperty('--w', WARNA_P[i]);
      s.innerHTML = `<div class="sInfo"><div class="sNama"><b>${esc(p.nama)}</b><span class="sLangkah">🐾 0 / ${B.target}</span></div><div class="sJalur"><i></i></div></div><div class="sSoal"></div>`;
      ui.appendChild(s); B.kartu[i] = {k: buatKartu(s.querySelector('.sSoal')), info: s}; });
    this.ukur(); B.pemain.forEach((p, i) => this.putaran(i, sesi));
  },
  async putaran(i, sesi) {
    const kk = B.kartu[i], k = B.kucing[i], sk = B.skor[i];
    while (sesi === B.sesi && !B.selesai) {
      const h = await tanya(kk.k, ambilSoal(i)); if (sesi !== B.sesi || B.selesai) return;
      let lari = Promise.resolve();
      if (h.benar) { efek.benar(); sk.benar++; sk.langkah++; lari = this.lari(i); kk.info.querySelector('.sLangkah').textContent = `🐾 ${sk.langkah} / ${B.target}`; kk.info.querySelector('.sJalur i').style.width = (sk.langkah / B.target * 100) + '%'; }
      else { efek.salah(); sk.salah++; setMode(k, 'geleng', 1.2); }
      if (sk.langkah >= B.target) { await lari; if (sesi === B.sesi && !B.selesai) this.menang(i, sesi); return; }
      await Promise.all([umpan(kk.k, h, {tambahan: h.benar ? `${esc(B.pemain[i].nama)} maju 1 langkah` : ''}), lari]);
    }
  },
  lari(i) { const k = B.kucing[i]; const x0 = k.position.x, x1 = B.skor[i].langkah * LANGKAH; setMode(k, 'lari'); efek.wus();
    return animasi(.9, e => { k.position.x = x0 + (x1 - x0) * e; }, t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2).then(() => { setMode(k, 'senang', .6); }); },
  async menang(i, sesi) {
    B.selesai = true; B.kartu.forEach(({k}) => { k.aktif = false; kartuAktif.delete(k); }); $('ui').innerHTML = ''; tampilHUD(false);
    efek.menang(); konfeti(B.kucing[i].position.clone().add(new THREE.Vector3(0, 1, 0)), 50);
    await tunggu(1.6); if (sesi !== B.sesi) return;
    const j = 1 - i, px = B.podium.position.x; B.podium.visible = true;
    B.kucing[i].position.set(px - 1.05, 1.1, 0); B.kucing[j].position.set(px + 1.05, .6, 0); B.kucing.forEach((k, n) => { k.rotation.y = n === i ? .25 : -.25; setMode(k, 'diam'); }); setMode(B.kucing[i], 'senang', 99);
    konfeti(new THREE.Vector3(px, 3, 0), 60);
    const baris = [i, j].map((n, r) => `<tr><td>${r ? '🥈' : '🏆'} <b style="color:${WARNA_P[n]}">${esc(B.pemain[n].nama)}</b></td><td>${B.skor[n].benar} benar · ${B.skor[n].salah} salah</td></tr>`).join('');
    layarHasil(`${B.pemain[i].nama} menang!`, `<table class="hTabel">${baris}</table>`);
  },
  keMenu() { B.sesi++; B.selesai = true; $('ui').innerHTML = ''; B.podium.visible = false; this.posisiAwal(); },
  ukur() { document.body.classList.toggle('tegak', tegak()); },
  update(dt) {
    B.kucing.forEach(k => animTokoh(k, dt));
    B.kucing.forEach((k, i) => { B.camX[i] += (k.position.x - B.camX[i]) * Math.min(1, dt * 3); });
    ikutCahaya((B.camX[0] + B.camX[1]) / 2 + 2, 0, 0);
  },
  render() {
    const R = P.R, cam = P.cam, w = innerWidth, h = innerHeight;
    const belah = document.body.dataset.layar === 'main' && !B.selesai;
    if (!belah) {
      R.setScissorTest(false); R.setViewport(0, 0, w, h); cam.aspect = w / h; cam.up.set(0, 1, 0);
      const lay = document.body.dataset.layar, px = B.podium ? B.podium.position.x : 0;
      if (lay === 'lHasil' || B.selesai && lay === 'main') { const tg = tegak(); cam.fov = tg ? 52 : 36; cam.position.set(px, 3, tg ? 10.5 : 8); cam.lookAt(px, tg ? 1.2 : 1.5, 0); }
      else { const tg = tegak(); cam.fov = tg ? 46 : 30; cam.position.set(0, tg ? 3.2 : 2.4, tg ? 9 : 8); cam.lookAt(0, tg ? .5 : .9, 0); }
      cam.updateProjectionMatrix(); R.render(P.sc, cam); return;
    }
    R.setScissorTest(true); const tg = tegak();
    for (let i = 0; i < 2; i++) {
      // tegak: P1 di atas (diputar 180°), P2 di bawah; rebah: P1 kiri, P2 kanan
      const vx = tg ? 0 : i * w / 2, vy = tg ? (i ? 0 : h / 2) : 0, vw = tg ? w : w / 2, vh = tg ? h / 2 : h;
      R.setViewport(vx, vy, vw, vh); R.setScissor(vx, vy, vw, vh);
      cam.aspect = vw / vh; cam.fov = tg ? 44 : 46; cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
      const x = B.camX[i], z = JALUR_Z[i];
      cam.position.set(x - 2.6, 3.4, z + (tg ? 6.8 : 7.6)); cam.lookAt(x + 1.6, tg ? -1 : .2, z - .2);
      if (tg && i === 0) cam.rotateZ(Math.PI);
      R.render(P.sc, cam);
    }
    R.setScissorTest(false);
  },
});
// tulisan memanjang untuk spanduk
function teksKanvasLebar(teks, bg) { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 512, 96); x.fillStyle = '#fff'; x.font = "800 70px 'Baloo 2', Arial"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(teks, 256, 54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
GAME.uji = B;
jalankan();

// PELAYARAN NUSANTARA (IPS SMP): peta Nusantara voxel di atas laut.
// Empat rakit dermaga A-D mengapung di depan peta. Murid/tim berlari ke rakit jawabannya.
// Saat jawaban dibuka, rakit benar bersinar dan kapal tim berlayar maju di rute "dari Sabang sampai Merauke";
// kapal tim yang salah dihantam ombak. Kelompok di satu layar (1 kapal per tim) atau satu kelas lewat HP (1 kapal kelas).
Object.assign(GAME, {
  id: 'pelayaran-nusantara', judul: 'Pelayaran Nusantara',
  ajak: 'Jawab soal sejarah dan geografi, layarkan kapalmu dari Sabang sampai Merauke!',
  labelJumlah: 'Jumlah soal (= panjang pelayaran)',
  ukuranTokoh: {skala: .45, labelY: 2.8},
  bantuan: `<ol><li>Soal IPS muncul dengan 4 pilihan: <b>A</b> merah, <b>B</b> biru, <b>C</b> kuning, <b>D</b> hijau.</li>
    <li>Pilih jawaban. Avatar berlari ke rakit dermaga warna yang sama.</li>
    <li>Saat jawaban dibuka, <b>rakit benar bersinar dan kapal berlayar maju</b> menuju pelabuhan berikutnya. Kapal yang salah dihantam ombak dan tertahan.</li>
    <li>Rute pelayaran: dari Sabang sampai Merauke. Kapal yang paling jauh paling unggul. Poin: benar 500 ditambah bonus kecepatan.</li>
    <li><b>Kelompok di layar ini:</b> tiap tim punya kapal sendiri. Tim menekan tombol warnanya, atau keyboard (Tim Merah 1 2 3 4, Biru Q W E R, Kuning A S D F, Hijau Z X C V).</li>
    <li><b>Satu kelas lewat HP:</b> murid scan QR di layar lalu menjawab di HP. Kapal Kelas berlayar sesuai rata-rata jawaban benar satu kelas.</li></ol>`,
  musik: {bpm: 96, nada: 62, alat: 'marimba', progresi: [0, 5, 3, 4], benih: 88},
  teksMaju: p => `Kapal berlayar ${p.lantai} kali ⛵`,
});

const WN = {A: '#e8453c', B: '#2f80ed', C: '#f2a20c', D: '#27ae60'};
const ZONA = {A: [-4.1, .8], B: [4.1, .8], C: [-4.1, 5.9], D: [4.1, 5.9]};
const ZW = 7.2, ZD = 4.4;
const SX = .58, SZ = .74;
const gx = lon => (lon - 118) * SX, gz = lat => -10.6 - lat * SZ;
// pulau: ruas kapsul dalam derajat (lon1, lat1, lon2, lat2, jari-jari derajat)
const PULAU = [
  [95.6, 5.3, 98.6, 2.9, 0.75],
  [98.6, 2.9, 102.0, -0.3, 1.6],
  [102.0, -0.3, 104.6, -4.6, 1.3],
  [106.1, -6.7, 111, -6.9, 0.5],
  [111, -6.9, 114.2, -7.8, 0.5],
  [115.0, -8.35, 115.6, -8.45, 0.3],
  [116.3, -8.6, 118.9, -8.5, 0.3],
  [120.0, -8.6, 123.0, -8.5, 0.3],
  [119.4, -9.7, 120.6, -9.8, 0.25],
  [123.9, -10.0, 127.0, -8.7, 0.35],
  [110.0, 1.0, 111.0, -1.6, 1.0],
  [111.0, -1.6, 115.8, -2.4, 1.0],
  [110.4, 1.4, 116.8, 3.8, 1.3],
  [114.0, 4.6, 117.0, 6.3, 0.8],
  [115.8, -2.4, 117.4, 1.6, 1.0],
  [119.8, -5.0, 119.9, -1.0, 0.45],
  [119.9, -1.0, 121, 1.0, 0.35],
  [121, 1.0, 125, 1.4, 0.3],
  [120.7, -1.4, 123.3, -0.9, 0.3],
  [120.4, -2.8, 121.4, -3.3, 0.35],
  [121.4, -3.3, 122.4, -4.4, 0.35],
  [127.9, 1.8, 128.2, -0.6, 0.4],
  [128.2, -3.0, 130.8, -3.2, 0.35],
  [126.2, -3.3, 126.9, -3.5, 0.35],
  [131, -1.0, 134, -3.2, 0.7],
  [134, -3.4, 141, -5.0, 1.7]];
// rute laut: [lon, lat, nama pelabuhan atau null untuk titik belok]
const RUTE = [
  [95.0, 6.3, 'Sabang'],
  [94.6, 4.9, null],
  [96.6, 3.0, null],
  [99.6, -1.5, 'Padang'],
  [101.8, -4.1, 'Bengkulu'],
  [103.5, -6.3, null],
  [105.2, -6.2, null],
  [106.8, -5.7, 'Jakarta'],
  [108.4, -0.6, 'Pontianak'],
  [109.2, -3.4, null],
  [114.4, -4.4, 'Banjarmasin'],
  [112.8, -6.4, 'Surabaya'],
  [115.4, -7.75, 'Bali'],
  [118.9, -5.4, 'Makassar'],
  [121.5, -6.3, null],
  [123.3, -7.7, 'Flores'],
  [128.2, -4.0, 'Ambon'],
  [132.4, -6.0, 'Tual'],
  [137.5, -8.9, null],
  [140.2, -9.2, 'Merauke']];
Object.assign(M, {zona: {}, kapal: [], rute: [], panjangRute: 1, peta: null, podium: null, rakit: []});

// ---------- dunia ----------
function jarakRuas(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - ax - t * dx, pz - az - t * dz); }
function bangunPeta() {
  const g = new THREE.Group(); M.peta = g; const sel = .45; const sel3 = [];
  for (let x = -14.5; x <= 14.5; x += sel) for (let z = -16; z <= -2.6; z += sel) {
    const lon = x / SX + 118, lat = -(z + 10.6) / SZ;
    let dekat = Infinity; PULAU.forEach(([a, b, c, d, r]) => { dekat = Math.min(dekat, jarakRuas(lon, lat, a, b, c, d) - r); });
    let laut = Infinity; for (let i = 0; i < RUTE.length - 1; i++) laut = Math.min(laut, jarakRuas(lon, lat, RUTE[i][0], RUTE[i][1], RUTE[i + 1][0], RUTE[i + 1][1]));
    if (dekat < 0 && laut > .3) sel3.push([x, z, Math.min(-dekat, laut - .3) * 1.4]);
  }
  const geo = new THREE.BoxGeometry(sel, 1, sel); const mat = new THREE.MeshStandardMaterial({roughness: .9});
  const im = new THREE.InstancedMesh(geo, mat, sel3.length); const m4 = new THREE.Matrix4(); const w = new THREE.Color();
  sel3.forEach(([x, z, dalam], i) => { const pantai = dalam < .28, gunung = dalam > .9 && Math.random() < .35; const h = pantai ? .22 : gunung ? acak(.8, 1.3) : acak(.38, .55);
    m4.makeScale(1, h, 1); m4.setPosition(x, h / 2 - .05, z); im.setMatrixAt(i, m4); w.set(pantai ? '#f1d9a0' : gunung ? variasi('#4f8a3c', .05) : variasi('#6fbf5a', .05)); im.setColorAt(i, w); });
  im.castShadow = im.receiveShadow = true; g.add(im);
  // pohon kecil di beberapa sel daratan
  sel3.filter(([, , d]) => d > .45).forEach(([x, z]) => { if (Math.random() < .06) { const t = pohon(.35); t.position.set(x, .45, z); g.add(t); } });
  // pelabuhan
  M.rute = RUTE.map(([lo, la, nm]) => ({x: gx(lo), z: gz(la), nm}));
  let tot = 0; M.rute.forEach((r, i) => { r.s = tot; if (i < M.rute.length - 1) tot += Math.hypot(M.rute[i + 1].x - r.x, M.rute[i + 1].z - r.z); }); M.panjangRute = tot;
  // garis rute putus-putus
  for (let s = 0; s < tot; s += .55) { const p = titikRute(s / tot); const d = di(kotak(.18, .04, .18, '#ffffff', .02, {transparent: true, opacity: .75}), p.x, .06, p.z); d.castShadow = false; g.add(d); }
  M.rute.forEach((r, i) => { if (!r.nm) return; const ujung = i === 0 || i === M.rute.length - 1;
    g.add(di(kotak(.5, .5, .5, ujung ? '#e03131' : '#f8f9fa', .05), r.x, .25, r.z)); g.add(di(kotak(.24, ujung ? 1.4 : 1, .24, ujung ? '#f8f9fa' : '#e03131', .03), r.x, ujung ? .9 : .7, r.z));
    const lb = papanNama(r.nm, ujung ? 3.4 : 2.8, ujung ? .75 : .62, ujung ? '#e03131' : 'rgba(29,43,68,.88)', '#ffffff'); lb.position.set(r.x, ujung ? 2.1 : 1.7, r.z); lb.rotation.x = -.5; g.add(lb); r.label = lb; });
  P.sc.add(g);
}
function titikRute(f) {
  const s = Math.max(0, Math.min(1, f)) * M.panjangRute; const R = M.rute;
  for (let i = 0; i < R.length - 1; i++) { const pj = R[i + 1].s - R[i].s; if (s <= R[i + 1].s || i === R.length - 2) { const t = pj ? Math.min(1, (s - R[i].s) / pj) : 0; return {x: R[i].x + (R[i + 1].x - R[i].x) * t, z: R[i].z + (R[i + 1].z - R[i].z) * t, arah: Math.atan2(R[i + 1].x - R[i].x, R[i + 1].z - R[i].z)}; } }
  return {x: R[0].x, z: R[0].z, arah: 0};
}
function pelabuhanTerakhir(f) { const s = f * M.panjangRute; let nm = M.rute[0].nm; M.rute.forEach(r => { if (r.nm && r.s <= s + .01) nm = r.nm; }); return nm; }
function kapalVoxel(warna, s = 1) {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  b.add(di(kotak(.7 * s, .3 * s, 1.5 * s, '#8b5a2b', .06), 0, .15 * s, 0)); b.add(di(kotak(.5 * s, .22 * s, .4 * s, '#8b5a2b', .05), 0, .2 * s, .85 * s));
  b.add(di(kotak(.74 * s, .1 * s, 1.54 * s, warna, .03), 0, .32 * s, 0));
  b.add(di(kotak(.08 * s, 1.5 * s, .08 * s, '#5c3d2e', .02), 0, 1 * s, -.05 * s));
  const layar = di(kotak(.06 * s, .95 * s, .9 * s, '#f8f9fa', .02), 0, 1.15 * s, .05 * s); layar.rotation.y = Math.PI / 2; layar.rotation.y = 0; b.add(layar);
  const layar2 = di(kotak(.9 * s, .9 * s, .05 * s, '#f8f9fa', .02), 0, 1.1 * s, .05 * s); b.add(layar2); layar.visible = false;
  b.add(di(kotak(.92 * s, .2 * s, .07 * s, warna, .02), 0, 1.2 * s, .06 * s));
  b.add(di(kotak(.04 * s, .26 * s, .3 * s, warna, .01), 0, 1.86 * s, .1 * s));
  g.userData = {b}; return g;
}
function siapkanDunia() {
  siapPanggung({langit: '#bfe6ff', bayangan: 30});
  // laut dengan ombak bertekstur
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#3aa0d8'; x.fillRect(0, 0, 128, 128); x.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 9; i++) x.fillRect(Math.random() * 110, Math.random() * 120, 18, 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(40, 40);
  const laut = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({map: t, roughness: .35, metalness: .05})); laut.rotation.x = -Math.PI / 2; laut.receiveShadow = true; P.sc.add(laut); M.lautTex = t;
  // pantai depan tempat murid menunggu
  P.sc.add(di(kotak(40, .5, 6, '#f1d9a0', .1), 0, .1, 11.2)); P.sc.add(di(kotak(40, .3, 30, '#86c96b', .05), 0, .1, 27));
  for (let i = 0; i < 9; i++) { const k = new THREE.Group(); k.add(di(kotak(.25, 2.6, .25, '#8b5a2b', .03), 0, 1.3, 0)); [0, 1.6, 3.1, 4.7].forEach(a => { const d = di(kotak(1.3, .1, .4, '#2f9e44', .03), Math.sin(a) * .6, 2.6, Math.cos(a) * .6); d.rotation.y = a; k.add(d); }); k.position.set((i % 2 ? 1 : -1) * (10 + Math.floor(i / 2) * 3.2) + acak(-.6, .6), .3, 12.6 + acak(-.4, .4)); P.sc.add(k); }
  bangunPeta();
  // empat rakit dermaga A-D
  Object.entries(ZONA).forEach(([h, [zx, zz]]) => {
    const g = new THREE.Group(); g.position.set(zx, 0, zz); P.sc.add(g);
    for (let i = 0; i < 9; i++) g.add(di(kotak(ZW / 9 - .05, .3, ZD, variasi('#a9764a', .05), .05), -ZW / 2 + (i + .5) * ZW / 9, .12, 0));
    const alas = kotak(ZW - .5, .06, ZD - .5, WN[h], .02, {transparent: true, opacity: .8}); alas.position.y = .3; alas.castShadow = false; g.add(alas);
    const huruf = hurufLantai(h, 1.7); huruf.position.set(0, .34, 0); g.add(huruf);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(di(kotak(.3, 1.1, .3, '#5c3d2e', .03), sx * (ZW / 2 - .1), .4, sz * (ZD / 2 - .1))));
    const bendera = di(kotak(.9, .55, .04, WN[h], .02), -ZW / 2 + .55, 1.6, -ZD / 2 + .1); g.add(bendera); g.add(di(kotak(.08, 1.8, .08, '#495057', .02), -ZW / 2 + .1, .9, -ZD / 2 + .1));
    const cahaya = new THREE.PointLight(WN[h], 0, 9); cahaya.position.set(0, 2.5, 0); g.add(cahaya);
    M.zona[h] = {g, alas, cahaya}; M.rakit.push(g);
  });
  const pn = papanNama('PELAYARAN NUSANTARA', 7, 1, '#1d2b44', '#ffd43b'); pn.position.set(-12, 1.8, 9.8); pn.rotation.y = .4; P.sc.add(pn);
  P.sc.add(di(kotak(.2, 1.6, .2, '#8b5a2b', .04), -12, .9, 9.8));
  for (let i = 0; i < 10; i++) { const w = awan(acak(1.5, 3)); w.position.set(acak(-40, 40), acak(18, 30), acak(-60, -30)); P.sc.add(w); }
  M.demo = kapalVoxel('#e03131', 1.3); P.sc.add(M.demo);
}
function bangunKapal() {
  M.kapal.forEach(k => P.sc.remove(k.g)); M.kapal = [];
  if (!SESI) return;
  if (SESI.mode === 'layar') {
    const tim = [...PEMAIN.values()];
    tim.forEach((p, i) => { const w = TIM[p.tim].warna; const k = kapalVoxel(w, 1.5); P.sc.add(k); const lb = labelNama(p.nama, w, '#fff'); lb.position.set(0, 3.2, 0); lb.scale.multiplyScalar(1.7); k.add(lb);
      M.kapal.push({g: k, p, pos: 0, goyang: 0, geser: (i - (tim.length - 1) / 2) * .75, singgah: M.rute[0].nm}); });
  } else {
    const k = kapalVoxel('#e8590c', 1.7); P.sc.add(k); const lb = labelNama('Kapal Kelas', '#e8590c', '#fff'); lb.position.set(0, 3.5, 0); lb.scale.multiplyScalar(1.7); k.add(lb);
    M.kapal.push({g: k, p: null, pos: 0, goyang: 0, geser: 0, singgah: M.rute[0].nm});
  }
}
function targetKapal(k) {
  const n = Math.max(1, SESI ? SESI.soal.length : 10);
  if (k.p) return Math.min(1, k.p.lantai / n);
  let benar = 0; PEMAIN.forEach(p => { benar += p.benar; }); return Math.min(1, benar / Math.max(1, PEMAIN.size) / n);
}
function letakKapal(g, f, geser, t, goyang) {
  const p = titikRute(f); const nx = Math.cos(p.arah), nz = -Math.sin(p.arah);
  g.position.set(p.x + nx * geser, .02 + Math.sin(t * 2.2 + geser) * .05, p.z + nz * geser); g.rotation.y = p.arah;
  g.userData.b.rotation.z = Math.sin(t * 1.6 + geser) * .06 + (goyang > 0 ? Math.sin(t * 14) * .3 * goyang : 0);
}
function updateKapal(dt, t) {
  M.kapal.forEach(k => { const tg = targetKapal(k); k.pos += (tg - k.pos) * Math.min(1, dt * 1.2); k.goyang = Math.max(0, k.goyang - dt * .8); letakKapal(k.g, k.pos, k.geser, t, k.goyang); });
  if (M.demo && M.demo.visible) letakKapal(M.demo, (t * .025) % 1, 0, t, 0);
  M.rakit.forEach((r, i) => { r.position.y = Math.sin(t * 1.4 + i) * .05; });
  if (M.lautTex) { M.lautTex.offset.x = t * .01; M.lautTex.offset.y = t * .006; }
}
function pesanSinggah(k) {
  const nm = pelabuhanTerakhir(targetKapal(k)); if (nm === k.singgah) return; k.singgah = nm;
  const pp = papanNama('Tiba di ' + nm + '!', 4, .8, '#ffd43b', '#1d2b44'); const p = M.rute.find(r => r.nm === nm); pp.position.set(p.x, 3.2, p.z); P.sc.add(pp);
  animasi(2.4, e => { pp.position.y = 3.2 + e * 1.2; pp.material.opacity = e < .7 ? 1 : 1 - (e - .7) / .3; }).then(() => P.sc.remove(pp));
}

// ---------- posisi tokoh ----------
function jawabanKini(p) { return SESI && SESI.no >= 0 && SESI.fase !== 'mulai' && SESI.fase !== 'akhir' ? p.jawab[SESI.no] : null; }
function aturPosisi() {
  const layar = SESI && SESI.mode === 'layar';
  const per = {A: [], B: [], C: [], D: [], '-': []};
  PEMAIN.forEach(p => { const g = M.ent.get(p.id); if (!g) return; const j = M.mode === 'main' ? jawabanKini(p) : null; per[j ? j.h : '-'].push(g); });
  Object.entries(ZONA).forEach(([h, [zx, zz]]) => susunKotak(per[h], zx, zz, ZW - 1.2, ZD - 1, .35, layar ? 2.4 : 1.1));
  susunKotak(per['-'], 0, 11.3, layar ? 14 : 24, layar ? 3 : 4.6, .35, layar ? 3.4 : 1.2);
  M.ent.forEach(g => { g.userData.arah = 0; });
}

// ---------- kamera ----------
function aturKamera(dt) {
  const c = M.cam, lebar = Math.max(1, 1.45 / P.cam.aspect), muat = 15 / (Math.tan(P.cam.fov * Math.PI / 360) * P.cam.aspect);
  if (M.mode === 'main') Object.assign(c, {tx: 0, ty: 0, tz: -6.3, td: Math.max(20 * lebar, muat * .7), tinggi: 1.15, th: 0});
  else if (M.mode === 'lobi') Object.assign(c, {tx: 0, ty: 1, tz: 4.5, td: 22 * lebar, tinggi: .5, th: 0});
  else if (M.mode === 'podium') Object.assign(c, {tx: 2.2, ty: 2.2, tz: 3.4, td: 13.5 * lebar, tinggi: .24, th: 0});
  else { c.th = 0; Object.assign(c, {tx: 0, ty: 0, tz: -4, td: Math.max(26, muat), tinggi: .62}); }
  gerakKamera(dt, {sway: M.mode === 'judul' ? 0 : .1});
}

// ---------- kait dari inti ----------
pasangHookUmum({aturPosisi, siapkanDunia, hiasan: 8});
GAME.letakHias = hias => hias.forEach((s, i) => { s.position.set(acak(-14, 14), .35, acak(9.8, 12.6)); s.rotation.y = acak(-1, 1); });
GAME.reset = () => { M.kapal.forEach(k => P.sc.remove(k.g)); M.kapal = []; M.demo.visible = true; if (M.podium) { P.sc.remove(M.podium); M.podium = null; } };
GAME.mulai = () => {
  M.mode = 'main'; (M.hias || []).forEach(s => { s.visible = false; }); if (M.podium) { P.sc.remove(M.podium); M.podium = null; }
  M.ent.forEach(g => P.sc.remove(g)); M.ent.clear(); PEMAIN.forEach(p => buatEnt(p, GAME.ukuranTokoh)); aturPosisi(); M.ent.forEach(g => g.position.copy(g.userData.target));
  M.demo.visible = false; bangunKapal();
};
GAME.soalBaru = () => { Object.values(M.zona).forEach(z => { z.cahaya.intensity = 0; z.alas.material.emissiveIntensity = 0; }); aturPosisi(); };
GAME.bukaJawaban = async (kunci, hasil) => {
  aturPosisi(); await tunggu(.8); efek.gong();
  const z = M.zona[kunci]; z.alas.material.emissive.set(WN[kunci]);
  await animasi(.6, e => { z.cahaya.intensity = e * 40; z.alas.material.emissiveIntensity = e * .5; });
  Object.keys(ZONA).forEach(h => { if (h !== kunci && hasil.some(x => x.j && x.j.h === h)) asap(new THREE.Vector3(ZONA[h][0], .4, ZONA[h][1]), '#e7f5ff', 16, 2.4); });
  hasil.forEach(({p, j, benar}) => { const g = M.ent.get(p.id); if (!g) return;
    if (benar) { p.lantai += 1; g.userData.avatar.forEach(a => setMode(a, 'senang', 1.8)); konfeti(g.position.clone().add(new THREE.Vector3(0, 1.4, 0)), SESI.mode === 'layar' ? 26 : 5, [WN[kunci], '#ffd43b', '#ffffff']); }
    else if (j) g.userData.avatar.forEach(a => setMode(a, 'geleng', 1.4)); });
  M.kapal.forEach(k => { if (!k.p) return; const h = hasil.find(x => x.p.id === k.p.id); if (h && !h.benar) { k.goyang = 1.4; asap(k.g.position.clone().add(new THREE.Vector3(0, .3, 0)), '#e7f5ff', 8, .5); } });
  efek.naik(); await tunggu(.3); efek.benar();
  await tunggu(1.2); M.kapal.forEach(pesanSinggah); await tunggu(.6);
};
GAME.podium = async (urut, st) => {
  M.mode = 'podium'; M.kapal.forEach(k => { k.g.visible = false; });
  if (!M.podium) { const pod = new THREE.Group(); pod.position.set(0, .3, 3.4); P.sc.add(pod); M.podium = pod;
    [[0, 1.5, '#ffd43b', '1'], [-2.6, 1.0, '#ced4da', '2'], [2.6, .6, '#e8a25a', '3']].forEach(([x, h, c, nm]) => { pod.add(di(kotak(2.4, h, 2.4, c, .1), x, h / 2, 0)); const t = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({map: teksKanvas(nm, null, '#1d2b44'), transparent: true})); t.position.set(x, h / 2, 1.21); pod.add(t); }); }
  const juara = st ? st.slice(0, 3).map(t => [...PEMAIN.values()].filter(p => p.tim === t.i).sort((a, b) => b.poin - a.poin)[0]).filter(Boolean) : urut.slice(0, 3);
  const tempat = [[0, 1.5], [-2.6, 1.0], [2.6, .6]];
  M.ent.forEach((g, id) => { if (!juara.some(p => p.id === id)) g.visible = false; });
  juara.forEach((p, i) => { const g = M.ent.get(p.id); if (!g) return; g.visible = true; g.userData.terbang = true; g.position.set(tempat[i][0], tempat[i][1] + .3, 3.4); g.userData.target.copy(g.position);
    g.userData.avatar.forEach(a => { a.rotation.y = 0; setMode(a, 'senang', 99); }); if (st) g.userData.label.material.map = labelNama(st[i].nama, st[i].warna, '#fff').material.map; });
  await tunggu(.6); konfeti(new THREE.Vector3(0, 4, 3.4), 90); efek.kilau(); await tunggu(2.4);
};
GAME.update = (dt, t) => {
  updateKapal(dt, t); updateAsap(dt);
  if (M.ent.size) majuEnt(dt); (M.hias || []).forEach(s => s.visible && animTokoh(s, dt)); aturKamera(dt);
};
jalankan();

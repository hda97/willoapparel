// LAB AJAIB (IPA SMP): laboratorium voxel untuk satu kelas.
// Di meja depan ada percobaan sesuai topik soal. Murid/tim berlari ke meja warna jawabannya (A-D).
// Saat jawaban dibuka, percobaan berjalan: meja yang benar bersinar dan mengisi Energi Lab,
// meja yang salah berasap. Bisa kelompok di satu layar (2-4 tim) atau satu kelas lewat HP.
Object.assign(GAME, {
  id: 'lab-ajaib', judul: 'Lab Ajaib',
  ajak: 'Tebak hasil percobaan IPA, kumpulkan Energi Lab, dan jadilah ilmuwan juara kelas!',
  labelJumlah: 'Jumlah percobaan',
  ukuranTokoh: {skala: .47, labelY: 2.9},
  bantuan: `<ol><li>Di meja percobaan muncul soal IPA dengan 4 pilihan: <b>A</b> merah, <b>B</b> biru, <b>C</b> kuning, <b>D</b> hijau.</li>
    <li>Pilih jawaban. Avatar berlari ke meja lab warna yang sama.</li>
    <li>Saat jawaban dibuka, percobaan dijalankan. <b>Meja benar bersinar</b> dan menambah 1 Energi Lab, <b>meja salah berasap</b>.</li>
    <li>Poin: benar 500, ditambah bonus kecepatan. Tabung energi di dinding menunjukkan kemajuan.</li>
    <li><b>Kelompok di layar ini:</b> tiap tim menekan tombol warnanya, atau keyboard (Tim Merah 1 2 3 4, Biru Q W E R, Kuning A S D F, Hijau Z X C V).</li>
    <li><b>Satu kelas lewat HP:</b> murid scan QR di layar, lalu menjawab di HP.</li></ol>`,
  musik: {bpm: 104, nada: 60, alat: 'marimba', progresi: [0, 3, 4, 2], benih: 33},
  teksMaju: p => `Energi Lab ${p.lantai} ⚗️`,
});

const WARNA_H2 = {A: '#e8453c', B: '#2f80ed', C: '#f2a20c', D: '#27ae60'};
const ZONA = {A: [-4.1, -2.4], B: [4.1, -2.4], C: [-4.1, 2.9], D: [4.1, 2.9]};
const ZW = 7.2, ZD = 4.6;
Object.assign(M, {zona: {}, tabung: [], reaktor: null, alat: null, alatTopik: '', podium: null, meja: null});

// ---------- dunia ----------
function kaca(w, h, d, warna, op = .35) { const m = kotak(w, h, d, warna, .08, {transparent: true, opacity: op, roughness: .1}); m.castShadow = false; return m; }
function labu(warna, s = 1) { // labu Erlenmeyer kotak
  const g = new THREE.Group(); g.add(di(kaca(.9 * s, .7 * s, .9 * s, '#dff3ff'), 0, .35 * s, 0)); g.add(di(kaca(.4 * s, .5 * s, .4 * s, '#dff3ff'), 0, .95 * s, 0));
  const isi = di(kotak(.78 * s, .42 * s, .78 * s, warna, .06, {emissive: warna, emissiveIntensity: .25}), 0, .24 * s, 0); isi.castShadow = false; g.add(isi); g.userData.isi = isi; return g;
}
function siapkanDunia() {
  siapPanggung({langit: '#cfe8ff', bayangan: 26});
  // lantai keramik kotak-kotak
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#e9f1f7' : '#f8fbfd'; x.fillRect(i * 64, j * 64, 64, 64); }
  x.strokeStyle = 'rgba(120,150,180,.25)'; x.lineWidth = 2; x.strokeRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(17, 15);
  const lantai = new THREE.Mesh(new THREE.PlaneGeometry(34, 30), new THREE.MeshStandardMaterial({map: t, roughness: .7})); lantai.rotation.x = -Math.PI / 2; lantai.position.z = 1; lantai.receiveShadow = true; P.sc.add(lantai);
  P.sc.add(di(tanah('#7cc96b', 240), 0, -.02, 0));
  // dinding belakang + samping dengan jendela
  const dinding = '#bfe0f5', les = '#2b6cb0';
  P.sc.add(di(kotak(34, 6, .5, dinding, .05), 0, 3, -13.75));
  P.sc.add(di(kotak(.5, 6, 30, dinding, .05), -17, 3, 1)); P.sc.add(di(kotak(.5, 6, 30, dinding, .05), 17, 3, 1));
  P.sc.add(di(kotak(34.4, .4, .7, les, .05), 0, 6.1, -13.75)); P.sc.add(di(kotak(.7, .4, 30, les, .05), -17, 6.1, 1)); P.sc.add(di(kotak(.7, .4, 30, les, .05), 17, 6.1, 1));
  [-8, 0, 8].forEach(z => { [-1, 1].forEach(sx => { const j = kaca(.2, 2.2, 3.2, '#e8f7ff', .55); j.position.set(sx * 16.7, 3.4, z); P.sc.add(j); P.sc.add(di(kotak(.3, .2, 3.6, '#ffffff', .03), sx * 16.7, 2.2, z)); }); });
  // rak penuh tabung di dinding belakang
  [-13.5, 13.5].forEach(xr => { P.sc.add(di(kotak(5, .25, 1.2, '#8b5a2b', .04), xr * .78, 2.3, -13)); P.sc.add(di(kotak(5, .25, 1.2, '#8b5a2b', .04), xr * .78, 3.8, -13));
    for (let i = 0; i < 6; i++) { const l = labu(pilih(['#ff6b6b', '#4dabf7', '#ffd43b', '#51cf66', '#cc5de8']), .55); l.position.set(xr * .78 - 2 + i * .8, 2.42 + (i % 2) * 1.5, -13); P.sc.add(l); } });
  // papan tulis
  P.sc.add(di(kotak(9, 3.4, .2, '#2f4f3f', .05), 0, 3.6, -13.4)); const pt = papanNama('LAB AJAIB', 8, 1.3, 'rgba(0,0,0,0)', '#ffffff'); pt.position.set(0, 4.3, -13.28); P.sc.add(pt);
  const rumus = papanNama('H₂O · F = m·a · V = I·R', 8, .9, 'rgba(0,0,0,0)', '#c3fae8'); rumus.position.set(0, 3.1, -13.28); P.sc.add(rumus);
  // meja percobaan utama
  const meja = new THREE.Group(); meja.position.set(0, 0, -8.3); P.sc.add(meja); M.meja = meja;
  meja.add(di(kotak(9, .3, 3.2, '#f1f3f5', .05), 0, 1.25, 0)); meja.add(di(kotak(8.6, 1.1, 2.8, '#5c7cfa', .05), 0, .55, 0));
  // reaktor energi kelas di belakang meja
  const r = new THREE.Group(); r.position.set(-8, 0, -8.6); P.sc.add(r);
  r.add(di(kotak(2.4, .5, 2.4, '#495057', .08), 0, .25, 0)); r.add(di(kaca(1.8, 5, 1.8, '#e3fafc', .3), 0, 3, 0)); r.add(di(kotak(2.4, .4, 2.4, '#495057', .08), 0, 5.7, 0));
  const cair = di(kotak(1.6, 1, 1.6, '#22b8cf', .05, {emissive: '#22b8cf', emissiveIntensity: .5}), 0, .5, 0); cair.castShadow = false; r.add(cair); M.reaktor = {g: r, cair, isi: 0, target: 0};
  const lr = papanNama('ENERGI LAB', 3.2, .7); lr.position.set(0, 6.4, .1); r.add(lr);
  // empat meja jawaban A-D
  Object.entries(ZONA).forEach(([h, [zx, zz]]) => {
    const g = new THREE.Group(); g.position.set(zx, 0, zz); P.sc.add(g);
    const alas = kotak(ZW, .12, ZD, WARNA_H2[h], .05); alas.position.y = .06; g.add(alas);
    const huruf = hurufLantai(h, 1.7); huruf.position.set(0, .13, 0); g.add(huruf);
    const sisi = zx < 0 ? -1 : 1; // meja kecil di sisi luar zona
    const mj = di(kotak(1.2, 1.1, 3, '#dee2e6', .05), sisi * (ZW / 2 + .8), .55, 0); g.add(mj);
    const l = labu(WARNA_H2[h], 1.1); l.position.set(sisi * (ZW / 2 + .8), 1.1, -.6); g.add(l);
    const l2 = labu(WARNA_H2[h], .7); l2.position.set(sisi * (ZW / 2 + .8), 1.1, .7); g.add(l2);
    const cahaya = new THREE.PointLight(WARNA_H2[h], 0, 9); cahaya.position.set(0, 2.5, 0); g.add(cahaya);
    M.zona[h] = {g, alas, labu: [l, l2], cahaya};
  });
  // papan nama di depan
  const pn = papanNama('LAB AJAIB', 5, 1); pn.position.set(-12.5, 1.5, 10.5); pn.rotation.y = .5; P.sc.add(pn);
  P.sc.add(di(kotak(.2, 1.5, .2, '#8b5a2b', .04), -12.5, .75, 10.4));
  for (let i = 0; i < 26; i++) { const a = acak(0, Math.PI * 2), rr = acak(26, 70); const tr = pohon(acak(.9, 1.5)); tr.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr + (Math.sin(a) < 0 ? -6 : 0)); P.sc.add(tr); }
  pasangAlat('');
}

// ---------- alat percobaan per topik ----------
function topikKe(t) {
  t = (t || '').toLowerCase();
  if (/zat|wujud|massa jenis/.test(t)) return 'es';
  if (/suhu|kalor/.test(t)) return 'termo';
  if (/ukur/.test(t)) return 'timbangan';
  if (/gaya|gerak|pesawat/.test(t)) return 'bidang';
  if (/tekanan/.test(t)) return 'tangki';
  if (/cerna|darah|jantung|peredaran/.test(t)) return 'jantung';
  if (/listrik/.test(t)) return 'lampu';
  if (/magnet/.test(t)) return 'magnet';
  if (/surya|planet|bumi/.test(t)) return 'surya';
  if (/klasifikasi|ekosistem|reproduksi|pewarisan|sel|tumbuh/.test(t)) return 'tanaman';
  return 'labu';
}
function pasangAlat(topik) {
  const jenis = topikKe(topik); if (M.alat && M.alatTopik === jenis) { M.alat.reset && M.alat.reset(); return; }
  if (M.alat) M.meja.remove(M.alat.g);
  const g = new THREE.Group(); g.position.y = 1.4; g.scale.setScalar(1.45); M.meja.add(g); const a = {g, jenis, idle() {}, jalan() {}, reset() {}};
  const L = labu('#a5d8ff', 1.2); L.position.set(2.4, 0, .3); g.add(L); a.labu = L; // labu tetap, berubah warna saat dibuka
  if (jenis === 'es') {
    const gelas = di(kaca(1.6, 1.8, 1.6, '#e7f5ff', .3), -.5, .9, 0); g.add(gelas);
    const air = di(kotak(1.4, .3, 1.4, '#74c0fc', .05), -.5, .15, 0); air.castShadow = false; g.add(air);
    const es = di(kotak(.9, .9, .9, '#e3fafc', .1, {transparent: true, opacity: .9, roughness: .1}), -.5, .8, 0); g.add(es);
    a.reset = () => { es.scale.setScalar(1); es.position.y = .8; air.scale.y = 1; air.position.y = .15; };
    a.idle = t => { es.rotation.y = Math.sin(t) * .1; };
    a.jalan = e => { es.scale.setScalar(Math.max(.05, 1 - e)); es.position.y = .3 + .5 * (1 - e); air.scale.y = 1 + e * 3; air.position.y = .15 + e * .45; };
  } else if (jenis === 'termo') {
    g.add(di(kotak(.4, 3, .4, '#ffffff', .15), -.6, 1.5, 0)); const merah = di(kotak(.2, 1, .2, '#e03131', .05), -.6, .6, .12); g.add(merah); g.add(di(kotak(.6, .6, .6, '#e03131', .2), -.6, .2, 0));
    const tungku = di(kotak(1, .4, 1, '#495057', .05), -2.2, .2, 0); g.add(tungku); const api = di(kotak(.5, .8, .5, '#ff922b', .2, {emissive: '#ff6b00', emissiveIntensity: .8}), -2.2, .8, 0); api.castShadow = false; g.add(api);
    a.reset = () => { merah.scale.y = 1; merah.position.y = .6; };
    a.idle = t => { api.scale.set(1, 1 + Math.sin(t * 9) * .15, 1); };
    a.jalan = e => { merah.scale.y = 1 + e * 2.2; merah.position.y = .6 + e * 1.1; };
  } else if (jenis === 'timbangan') {
    g.add(di(kotak(.3, 1.8, .3, '#868e96', .05), -.5, .9, 0)); const lengan = new THREE.Group(); lengan.position.set(-.5, 1.8, 0); g.add(lengan);
    lengan.add(di(kotak(3.2, .15, .2, '#495057', .03), 0, 0, 0)); const ki = di(kotak(1, .12, 1, '#adb5bd', .03), -1.5, -.5, 0), ka = di(kotak(1, .12, 1, '#adb5bd', .03), 1.5, -.5, 0); lengan.add(ki, ka);
    ki.add(di(kotak(.5, .5, .5, '#fab005', .05), 0, .3, 0)); ka.add(di(kotak(.35, .35, .35, '#868e96', .05), 0, .25, 0));
    a.reset = () => { lengan.rotation.z = 0; }; a.idle = t => { lengan.rotation.z = Math.sin(t * 1.5) * .05; }; a.jalan = e => { lengan.rotation.z = e * .25; };
  } else if (jenis === 'bidang') {
    const ram = di(kotak(4, .2, 1.2, '#c98a4b', .03), -.8, .9, 0); ram.rotation.z = -.4; g.add(ram); g.add(di(kotak(.3, 1.8, 1.2, '#8b5a2b', .03), -2.6, .9, 0));
    const bola = di(kotak(.5, .5, .5, '#e03131', .25), -2.4, 1.95, 0); g.add(bola);
    a.reset = () => bola.position.set(-2.4, 1.95, 0); a.idle = t => { bola.rotation.z = t; };
    a.jalan = e => { bola.position.set(-2.4 + e * 3.6, 1.95 - e * 1.55, 0); bola.rotation.z = -e * 12; };
  } else if (jenis === 'tangki') {
    g.add(di(kaca(1.8, 2.6, 1.4, '#e7f5ff', .3), -.6, 1.3, 0)); const air = di(kotak(1.6, 2.2, 1.2, '#4dabf7', .05, {transparent: true, opacity: .8}), -.6, 1.15, 0); air.castShadow = false; g.add(air);
    const pancar = [.5, 1.2, 1.9].map((y, i) => { const p = di(kotak(.15, .15, .15, '#4dabf7', .05), .35, y, 0); p.castShadow = false; g.add(p); p.userData.y = y; p.userData.k = 3 - i; return p; });
    a.reset = () => pancar.forEach(p => { p.scale.set(1, 1, 1); p.position.x = .35; }); a.idle = () => {};
    a.jalan = e => pancar.forEach(p => { p.scale.set(1 + e * p.userData.k * 5, 1, 1); p.position.x = .35 + e * p.userData.k * .37; });
  } else if (jenis === 'jantung') {
    const j = new THREE.Group(); j.position.set(-.6, 1, 0); g.add(j); [[-.35, .25], [.35, .25], [0, -.2]].forEach(([x, y]) => j.add(di(kotak(.9, .9, .8, '#e03131', .2), x, y, 0))); j.add(di(kotak(.3, .7, .3, '#c92a2a', .05), -.2, .85, 0)); j.add(di(kotak(.3, .6, .3, '#1c7ed6', .05), .3, .85, 0));
    a.reset = () => j.scale.setScalar(1); a.idle = t => { const d = Math.pow(Math.max(0, Math.sin(t * 5)), 6); j.scale.setScalar(1 + d * .08); }; a.jalan = (e, t) => { j.scale.setScalar(1 + Math.abs(Math.sin(e * 18)) * .18); };
  } else if (jenis === 'lampu') {
    g.add(di(kotak(1, .6, .5, '#212529', .05), -2, .3, 0)); g.add(di(kotak(.4, .62, .52, '#fab005', .03), -1.8, .31, 0));
    g.add(di(kotak(2.2, .08, .08, '#e03131', .02), -.9, .1, .2)); g.add(di(kotak(.4, .5, .4, '#868e96', .05), .2, .25, 0));
    const bohlam = di(kotak(.7, .8, .7, '#fff3bf', .3, {emissive: '#ffd43b', emissiveIntensity: 0}), .2, .9, 0); g.add(bohlam); const nyala = new THREE.PointLight('#ffd43b', 0, 8); nyala.position.set(.2, 1.2, .5); g.add(nyala);
    a.reset = () => { bohlam.material.emissiveIntensity = 0; nyala.intensity = 0; }; a.jalan = e => { bohlam.material.emissiveIntensity = e * 1.6; nyala.intensity = e * 18; };
  } else if (jenis === 'magnet') {
    const mg = new THREE.Group(); mg.position.set(-.8, 1.6, 0); g.add(mg); mg.add(di(kotak(1.6, .4, .5, '#adb5bd', .05), 0, .55, 0)); mg.add(di(kotak(.45, 1, .5, '#e03131', .05), -.58, 0, 0)); mg.add(di(kotak(.45, 1, .5, '#1c7ed6', .05), .58, 0, 0));
    const klip = Array.from({length: 6}, (_, i) => { const k = di(kotak(.3, .08, .15, '#868e96', .02), -1.7 + i * .38, .05, acak(-.4, .4)); g.add(k); k.userData.p0 = k.position.clone(); return k; });
    a.reset = () => klip.forEach(k => { k.position.copy(k.userData.p0); k.rotation.z = 0; }); a.idle = t => { mg.position.y = 1.6 + Math.sin(t * 2) * .05; };
    a.jalan = e => klip.forEach((k, i) => { const tg = new THREE.Vector3(-.8 + (i % 2 ? .58 : -.58), 1.05, 0); k.position.lerpVectors(k.userData.p0, tg, Math.min(1, e * 1.4 - i * .05 < 0 ? 0 : e * 1.4 - i * .05)); k.rotation.z = e * 1.2; });
  } else if (jenis === 'surya') {
    const mt = di(kotak(1, 1, 1, '#ffd43b', .3, {emissive: '#ffa94d', emissiveIntensity: .8}), -.8, 1.2, 0); g.add(mt);
    const pl = [['#adb5bd', .9, .25], ['#ffa94d', 1.3, .32], ['#4dabf7', 1.75, .36], ['#e8590c', 2.2, .3]].map(([c, r, s], i) => { const p = di(kotak(s, s, s, c, .1), 0, 1.2, 0); g.add(p); p.userData = {r, f: 1.6 - i * .3, a: i * 1.7}; return p; });
    a.idle = t => pl.forEach(p => { const u = p.userData; p.position.set(-.8 + Math.cos(t * u.f + u.a) * u.r, 1.2, Math.sin(t * u.f + u.a) * u.r * .7); }); a.kencang = 1;
    a.jalan = e => { a.kencang = 1 + Math.sin(e * Math.PI) * 6; };
  } else if (jenis === 'tanaman') {
    g.add(di(kotak(1.2, .8, 1.2, '#c0392b', .1), -.6, .4, 0)); g.add(di(kotak(1, .1, 1, '#5c3d2e', .02), -.6, .82, 0));
    const batang = di(kotak(.15, 1, .15, '#2f9e44', .03), -.6, 1.3, 0); g.add(batang); const daun = [di(kotak(.6, .1, .3, '#51cf66', .03), -.95, 1.4, 0), di(kotak(.6, .1, .3, '#51cf66', .03), -.25, 1.6, 0)]; daun.forEach(d => g.add(d));
    const bunga = di(kotak(.6, .45, .6, '#f783ac', .15), -.6, 1.9, 0); bunga.scale.setScalar(.01); g.add(bunga);
    a.reset = () => { batang.scale.y = 1; batang.position.y = 1.3; bunga.scale.setScalar(.01); bunga.position.y = 1.9; }; a.idle = t => { daun.forEach((d, i) => { d.rotation.z = Math.sin(t * 2 + i) * .08; }); };
    a.jalan = e => { batang.scale.y = 1 + e; batang.position.y = 1.3 + e * .5; bunga.scale.setScalar(Math.max(.01, e)); bunga.position.y = 1.9 + e * 1; };
  } else {
    [-1.6, -.4].forEach((x, i) => { const l = labu(['#ff8787', '#69db7c'][i], 1); l.position.set(x, 0, 0); g.add(l); });
  }
  M.alat = a; M.alatTopik = jenis; a.reset();
}

// ---------- posisi tokoh ----------
function jawabanKini(p) { return SESI && SESI.no >= 0 && SESI.fase !== 'mulai' && SESI.fase !== 'akhir' ? p.jawab[SESI.no] : null; }
function aturPosisi() {
  const layar = SESI && SESI.mode === 'layar';
  const per = {A: [], B: [], C: [], D: [], '-': []};
  PEMAIN.forEach(p => { const g = M.ent.get(p.id); if (!g) return; const j = M.mode === 'main' ? jawabanKini(p) : null; per[j ? j.h : '-'].push(g); });
  Object.entries(ZONA).forEach(([h, [zx, zz]]) => susunKotak(per[h], zx, zz, ZW - 1, ZD - .8, .12, layar ? 2.4 : 1.15));
  // belum menjawab / lobi: berkumpul di depan
  susunKotak(per['-'], 0, layar ? 8 : 9, layar ? 14 : 22, layar ? 3 : 6, 0, layar ? 3.4 : 1.25);
  M.ent.forEach(g => { g.userData.arah = Math.PI * 0; });
}

// ---------- kamera ----------
function aturKamera(dt) {
  const c = M.cam, lebar = Math.max(1, 1.45 / P.cam.aspect);
  if (M.mode === 'main') Object.assign(c, {tx: 0, ty: 1, tz: -1.5, td: 25 * lebar, tinggi: .55, th: 0});
  else if (M.mode === 'lobi') Object.assign(c, {tx: 0, ty: 1, tz: 4, td: 21 * lebar, tinggi: .42, th: 0});
  else if (M.mode === 'podium') Object.assign(c, {tx: 2.2, ty: 2.2, tz: -4.5, td: 13.5 * lebar, tinggi: .22, th: 0});
  else { c.th += dt * .05; Object.assign(c, {tx: 0, ty: 1.5, tz: -2, td: 27, tinggi: .5}); }
  gerakKamera(dt, {sway: M.mode === 'judul' ? 0 : .12});
}

// ---------- tabung energi tim / reaktor kelas ----------
function bangunTabung() {
  M.tabung.forEach(t => P.sc.remove(t.g)); M.tabung = [];
  if (!SESI || SESI.mode !== 'layar') return;
  const tim = [...PEMAIN.values()]; const posX = [6.6, 8.6, 10.6, 12.6];
  tim.forEach((p, i) => { const g = new THREE.Group(); g.position.set(posX[i] ?? (6.6 + i * 2), 0, -8.6); P.sc.add(g);
    g.add(di(kotak(1.8, .4, 1.8, '#495057', .06), 0, .2, 0)); g.add(di(kaca(1.3, 4.2, 1.3, '#f1f3f5', .3), 0, 2.5, 0)); g.add(di(kotak(1.8, .35, 1.8, '#495057', .06), 0, 4.75, 0));
    const w = TIM[p.tim].warna; const cair = di(kotak(1.1, 1, 1.1, w, .05, {emissive: w, emissiveIntensity: .4}), 0, .45, 0); cair.castShadow = false; cair.scale.y = .01; g.add(cair);
    const lb = labelNama(p.nama, w, '#fff'); lb.position.y = 5.5; lb.scale.multiplyScalar(1.8); g.add(lb);
    M.tabung.push({g, cair, p, isi: 0}); });
}
function updateEnergi(dt) {
  const n = SESI ? SESI.soal.length : 10;
  M.tabung.forEach(t => { const tg = Math.min(1, t.p.lantai / Math.max(1, n)); t.isi += (tg - t.isi) * Math.min(1, dt * 2); t.cair.scale.y = Math.max(.01, t.isi * 3.9); t.cair.position.y = .4 + t.isi * 3.9 / 2; });
  if (M.reaktor) { const r = M.reaktor; r.isi += (r.target - r.isi) * Math.min(1, dt * 2); r.cair.scale.y = Math.max(.02, r.isi * 4.8); r.cair.position.y = .5 + r.isi * 4.8 / 2; }
}
function hitungReaktor() {
  if (!SESI) { M.reaktor.target = 0; return; } let benar = 0, total = 0;
  PEMAIN.forEach(p => { benar += p.benar; }); total = Math.max(1, PEMAIN.size * SESI.soal.length); M.reaktor.target = benar / total;
}

// ---------- kait dari inti ----------
pasangHookUmum({aturPosisi, siapkanDunia, hiasan: 8});
GAME.letakHias = hias => hias.forEach((s, i) => { const [x, z] = Object.values(ZONA)[i % 4]; s.position.set(x + acak(-2, 2), .12, z + acak(-1.5, 1.5)); s.rotation.y = acak(-1, 1); });
GAME.reset = () => { M.tabung.forEach(t => P.sc.remove(t.g)); M.tabung = []; M.reaktor.target = 0; pasangAlat(''); if (M.podium) { P.sc.remove(M.podium); M.podium = null; } };
GAME.mulai = () => {
  M.mode = 'main'; (M.hias || []).forEach(s => { s.visible = false; }); if (M.podium) { P.sc.remove(M.podium); M.podium = null; }
  M.ent.forEach(g => P.sc.remove(g)); M.ent.clear(); PEMAIN.forEach(p => buatEnt(p, GAME.ukuranTokoh)); aturPosisi(); M.ent.forEach(g => g.position.copy(g.userData.target));
  bangunTabung(); M.reaktor.target = 0;
};
GAME.soalBaru = () => { const q = SESI.soal[SESI.no]; pasangAlat(q && q.topik); M.alat.labu.userData.isi.material.color.set('#a5d8ff'); Object.values(M.zona).forEach(z => { z.cahaya.intensity = 0; }); aturPosisi(); };
GAME.bukaJawaban = async (kunci, hasil) => {
  aturPosisi(); await tunggu(.8);
  // percobaan berjalan
  efek.gong(); const a = M.alat; a.labu.userData.isi.material.color.set(WARNA_H2[kunci]); a.labu.userData.isi.material.emissive.set(WARNA_H2[kunci]);
  asap(new THREE.Vector3(3.5, 4.2, -8), WARNA_H2[kunci], 10, .5);
  await animasi(1.4, e => a.jalan(e));
  // meja benar bersinar, meja salah berasap
  const z = M.zona[kunci]; await animasi(.5, e => { z.cahaya.intensity = e * 40; });
  Object.entries(M.zona).forEach(([h, zz]) => { if (h !== kunci && hasil.some(x => x.j && x.j.h === h)) { asap(new THREE.Vector3(ZONA[h][0], .8, ZONA[h][1]), '#6c757d', 16, 2.2); } });
  efek.runtuh();
  hasil.forEach(({p, j, benar}) => { const g = M.ent.get(p.id); if (!g) return;
    if (benar) { p.lantai += 1; g.userData.avatar.forEach(a2 => setMode(a2, 'senang', 1.8)); konfeti(g.position.clone().add(new THREE.Vector3(0, 1.4, 0)), SESI.mode === 'layar' ? 26 : 5, [WARNA_H2[kunci], '#ffd43b', '#ffffff']); }
    else if (j) g.userData.avatar.forEach(a2 => setMode(a2, 'geleng', 1.4)); });
  await tunggu(.3); efek.benar(); hitungReaktor();
  await tunggu(1.1);
};
GAME.podium = async (urut, st) => {
  M.mode = 'podium';
  if (!M.podium) { const pod = new THREE.Group(); pod.position.set(0, 0, -4.5); P.sc.add(pod); M.podium = pod;
    [[0, 1.5, '#ffd43b', '1'], [-2.6, 1.0, '#ced4da', '2'], [2.6, .6, '#e8a25a', '3']].forEach(([x, h, c, nm]) => { pod.add(di(kotak(2.4, h, 2.4, c, .1), x, h / 2, 0)); const t = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({map: teksKanvas(nm, null, '#1d2b44'), transparent: true})); t.position.set(x, h / 2, 1.21); pod.add(t); }); }
  const juara = st ? st.slice(0, 3).map(t => [...PEMAIN.values()].filter(p => p.tim === t.i).sort((a, b) => b.poin - a.poin)[0]).filter(Boolean) : urut.slice(0, 3);
  const tempat = [[0, 1.5], [-2.6, 1.0], [2.6, .6]];
  M.ent.forEach((g, id) => { if (!juara.some(p => p.id === id)) g.visible = false; });
  juara.forEach((p, i) => { const g = M.ent.get(p.id); if (!g) return; g.visible = true; g.userData.terbang = true; g.position.set(tempat[i][0], tempat[i][1], -4.5); g.userData.target.copy(g.position);
    g.userData.avatar.forEach(a => { a.rotation.y = 0; setMode(a, 'senang', 99); }); if (st) g.userData.label.material.map = labelNama(st[i].nama, st[i].warna, '#fff').material.map; });
  await tunggu(.6); konfeti(new THREE.Vector3(0, 4, -4.5), 90); efek.kilau(); await tunggu(2.4);
};
GAME.update = (dt, t) => {
  if (M.alat) { M.alat.idle(t * (M.alat.kencang || 1)); }
  updateEnergi(dt); updateAsap(dt);
  if (M.ent.size) majuEnt(dt); (M.hias || []).forEach(s => s.visible && animTokoh(s, dt)); aturKamera(dt);
};
jalankan();

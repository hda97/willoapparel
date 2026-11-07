// CODING QUEST (Informatika SMP): lab komputer voxel untuk satu kelas.
// Empat blok perintah raksasa A-D di lantai. Murid/tim berlari ke blok jawabannya.
// Saat jawaban dibuka, layar besar menjalankan kode: blok benar menyala dan robot tim maju 1 petak
// di lintasan sirkuit; robot tim yang salah kena "error" dan berasap.
// Bisa kelompok di satu layar (2-4 tim, 1 robot per tim) atau satu kelas lewat HP (1 robot kelas).
Object.assign(GAME, {
  id: 'coding-quest', judul: 'Coding Quest',
  ajak: 'Jawab soal Informatika, jalankan kodenya, dan bawa robotmu sampai garis finis!',
  labelJumlah: 'Jumlah soal (= panjang lintasan robot)',
  ukuranTokoh: {skala: .47, labelY: 2.9},
  bantuan: `<ol><li>Soal Informatika muncul dengan 4 pilihan: <b>A</b> merah, <b>B</b> biru, <b>C</b> kuning, <b>D</b> hijau.</li>
    <li>Pilih jawaban. Avatar berlari ke blok perintah warna yang sama.</li>
    <li>Saat jawaban dibuka, layar menjalankan kode. <b>Blok benar menyala dan robot maju 1 petak</b>. Robot yang salah kena error dan berasap.</li>
    <li>Poin: benar 500, ditambah bonus kecepatan. Robot paling jauh di lintasan sirkuit paling unggul.</li>
    <li><b>Kelompok di layar ini:</b> tiap tim punya robot sendiri. Tim menekan tombol warnanya, atau keyboard (Tim Merah 1 2 3 4, Biru Q W E R, Kuning A S D F, Hijau Z X C V).</li>
    <li><b>Satu kelas lewat HP:</b> murid scan QR di layar lalu menjawab di HP. Robot kelas maju sesuai rata-rata jawaban benar satu kelas.</li></ol>`,
  musik: {bpm: 116, nada: 57, alat: 'marimba', progresi: [0, 5, 3, 4], benih: 77},
  teksMaju: p => `Robot maju ${p.lantai} petak 🤖`,
});

const WC = {A: '#e8453c', B: '#2f80ed', C: '#f2a20c', D: '#27ae60'};
const ZONA = {A: [-4.1, -2.0], B: [4.1, -2.0], C: [-4.1, 3.3], D: [4.1, 3.3]};
const ZW = 7.2, ZD = 4.6;
const PANJANG_LINTAS = 21;
Object.assign(M, {zona: {}, robot: [], demo: null, lintas: null, layar: null, podium: null, n: 10});

// ---------- dunia ----------
function robotVoxel(warna, s = 1) {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  b.add(di(kotak(.9 * s, .7 * s, .7 * s, warna, .1), 0, .62 * s, 0));
  b.add(di(kotak(.5 * s, .3 * s, .05 * s, '#f8f9fa', .03), 0, .65 * s, .36 * s));
  const kepala = di(kotak(.72 * s, .5 * s, .6 * s, '#dee2e6', .1), 0, 1.24 * s, 0); b.add(kepala);
  const mata = []; [-.16, .16].forEach(x => { const m = di(kotak(.14 * s, .14 * s, .04 * s, '#3bc9db', .02, {emissive: '#3bc9db', emissiveIntensity: .9}), x * s, 1.27 * s, .31 * s); m.castShadow = false; b.add(m); mata.push(m); });
  b.add(di(kotak(.05 * s, .32 * s, .05 * s, '#495057', .02), 0, 1.65 * s, 0));
  const bola = di(kotak(.16 * s, .16 * s, .16 * s, warna, .05, {emissive: warna, emissiveIntensity: .7}), 0, 1.86 * s, 0); b.add(bola);
  const roda = []; [[-.5, .26], [.5, .26], [-.5, -.26], [.5, -.26]].forEach(([x, z]) => { const r = di(kotak(.14 * s, .36 * s, .36 * s, '#212529', .05), x * s, .2 * s, z * s); g.add(r); roda.push(r); });
  [-1, 1].forEach(sx => b.add(di(kotak(.12 * s, .44 * s, .12 * s, '#adb5bd', .03), sx * .52 * s, .7 * s, 0)));
  g.userData = {b, mata, bola, roda, s}; return g;
}
function teksLayar(baris, kunci) {
  const c = M.layar.kanvas, x = c.getContext('2d');
  x.fillStyle = '#0b1324'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#16213a'; x.fillRect(0, 0, c.width, 70);
  ['#ff6b6b', '#ffd43b', '#51cf66'].forEach((w, i) => { x.fillStyle = w; x.beginPath(); x.arc(40 + i * 40, 35, 12, 0, Math.PI * 2); x.fill(); });
  x.fillStyle = '#c1c9d6'; x.font = `700 34px 'Baloo 2', monospace`; x.textBaseline = 'middle'; x.fillText('robot.js', 180, 37);
  x.font = `700 46px ui-monospace, Menlo, Consolas, monospace`;
  baris.forEach((b, i) => { let px = 40; const y = 130 + i * 66;
    x.fillStyle = '#5c6b85'; x.fillText(String(i + 1).padStart(2, ' '), px, y); px += 90;
    b.forEach(([t, w]) => { x.fillStyle = w; x.fillText(t, px, y); px += x.measureText(t).width; }); });
  if (kunci) { x.fillStyle = WC[kunci]; x.fillRect(0, c.height - 14, c.width, 14); }
  M.layar.tex.needsUpdate = true;
}
const KW = '#cc5de8', FN = '#4dabf7', ST = '#ffd43b', CM = '#69db7c', TX = '#e9ecef';
function layarSiap() { teksLayar([[['// CODING QUEST', CM]], [['let ', KW], ['robot', TX], [' = ', TX], ['new ', KW], ['Robot', FN], ['();', TX]], [['while ', KW], ['(', TX], ['belajar', TX], [') {', TX]], [['  robot.', TX], ['maju', FN], ['();', TX]], [['}', TX]]]); }
function layarSoal(q) {
  const topik = (q && q.topik) || 'Informatika';
  teksLayar([[['// ' + topik, CM]], [['let ', KW], ['jawab', TX], [' = ', TX], ['tanya', FN], ['();', TX]], [['if ', KW], ['(jawab == ', TX], ['"?"', ST], [') {', TX]], [['  robot.', TX], ['maju', FN], ['(1);', TX]], [['} ', TX], ['else ', KW], ['{ ', TX], ['error', FN], ['(); }', TX]]]);
}
function layarJawab(kunci) {
  teksLayar([[['// jawaban dibuka', CM]], [['let ', KW], ['kunci', TX], [' = ', TX], [`"${kunci}"`, ST], [';', TX]], [['if ', KW], ['(jawab == ', TX], [`"${kunci}"`, ST], [') {', TX]], [['  robot.', TX], ['maju', FN], ['(1);  ', TX], ['// ✓', CM]], [['} ', TX], ['else ', KW], ['{ ', TX], ['error', FN], ['(); }', TX]]], kunci);
}
function siapkanDunia() {
  siapPanggung({langit: '#cfe3ff', bayangan: 26});
  // lantai lab komputer: ubin gelap dengan garis sirkuit
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#26324a'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(102,217,232,.35)'; x.lineWidth = 3; x.strokeRect(2, 2, 124, 124);
  x.beginPath(); x.moveTo(64, 2); x.lineTo(64, 40); x.lineTo(90, 64); x.lineTo(126, 64); x.stroke(); x.fillStyle = 'rgba(102,217,232,.5)'; x.fillRect(58, 36, 12, 12);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 11);
  const lantai = new THREE.Mesh(new THREE.PlaneGeometry(34, 30), new THREE.MeshStandardMaterial({map: t, roughness: .6})); lantai.rotation.x = -Math.PI / 2; lantai.position.z = 1; lantai.receiveShadow = true; P.sc.add(lantai);
  P.sc.add(di(tanah('#7cc96b', 240), 0, -.02, 0));
  // dinding
  const dinding = '#dbe4ff', les = '#364fc7';
  P.sc.add(di(kotak(34, 6.5, .5, dinding, .05), 0, 3.25, -13.75));
  P.sc.add(di(kotak(.5, 6.5, 30, dinding, .05), -17, 3.25, 1)); P.sc.add(di(kotak(.5, 6.5, 30, dinding, .05), 17, 3.25, 1));
  P.sc.add(di(kotak(34.4, .4, .7, les, .05), 0, 6.6, -13.75)); P.sc.add(di(kotak(.7, .4, 30, les, .05), -17, 6.6, 1)); P.sc.add(di(kotak(.7, .4, 30, les, .05), 17, 6.6, 1));
  // layar kode besar
  P.sc.add(di(kotak(11, 4.6, .3, '#1d2b44', .08), 0, 3.9, -13.35));
  const kv = document.createElement('canvas'); kv.width = 1100; kv.height = 440; const tex = new THREE.CanvasTexture(kv); tex.colorSpace = THREE.SRGBColorSpace;
  const lay = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 4.16), new THREE.MeshBasicMaterial({map: tex})); lay.position.set(0, 3.9, -13.18); P.sc.add(lay);
  M.layar = {kanvas: kv, tex}; layarSiap();
  // deretan komputer di dinding kiri & kanan belakang
  [-1, 1].forEach(sx => { for (let i = 0; i < 3; i++) { const gx = sx * (10 + i * 2.2);
    P.sc.add(di(kotak(1.9, .15, 1.2, '#868e96', .03), gx, 1.1, -12.9)); P.sc.add(di(kotak(1.7, 1.05, .12, '#212529', .05), gx, 1.85, -13.2));
    const m = di(kotak(1.5, .85, .02, pilih(['#3bc9db', '#748ffc', '#69db7c']), .01, {emissive: '#3bc9db', emissiveIntensity: .35}), gx, 1.85, -13.13); m.castShadow = false; P.sc.add(m);
    P.sc.add(di(kotak(.2, 1.05, .2, '#495057', .03), gx, .55, -12.9)); } });
  // lintasan robot (dibangun ulang sesuai jumlah soal)
  bangunLintas(10, 2);
  // empat blok perintah A-D (mirip blok kode)
  Object.entries(ZONA).forEach(([h, [zx, zz]]) => {
    const g = new THREE.Group(); g.position.set(zx, 0, zz); P.sc.add(g);
    const alas = kotak(ZW, .22, ZD, WC[h], .05); alas.position.y = .11; g.add(alas);
    g.add(di(kotak(1.4, .22, .5, WC[h], .04), -ZW / 2 + 1.4, .11, -ZD / 2 - .2)); // tonjolan blok
    const huruf = hurufLantai(h, 1.7); huruf.position.set(-ZW / 2 + 1.3, .24, 0); g.add(huruf);
    const kata = papanNama(['maju()', 'putar()', 'ulangi()', 'jika()'][('ABCD').indexOf(h)], 3.6, .9, 'rgba(0,0,0,0)', 'rgba(255,255,255,.85)'); kata.rotation.x = -Math.PI / 2; kata.position.set(.9, .24, 0); g.add(kata);
    const sisi = zx < 0 ? -1 : 1; // meja komputer kecil di sisi luar
    g.add(di(kotak(1.2, 1.05, 2.4, '#adb5bd', .05), sisi * (ZW / 2 + .8), .53, 0));
    g.add(di(kotak(.12, .8, 1.3, '#212529', .03), sisi * (ZW / 2 + .8) + sisi * .3, 1.45, 0));
    const scr = di(kotak(.03, .66, 1.16, WC[h], .01, {emissive: WC[h], emissiveIntensity: .5}), sisi * (ZW / 2 + .8) - sisi * .25 + sisi * .5 * 0, 1.45, 0); scr.position.x = sisi * (ZW / 2 + .8) + sisi * .23 - sisi * .3; scr.castShadow = false; g.add(scr);
    const cahaya = new THREE.PointLight(WC[h], 0, 9); cahaya.position.set(0, 2.5, 0); g.add(cahaya);
    M.zona[h] = {g, alas, cahaya};
  });
  const pn = papanNama('CODING QUEST', 6, 1); pn.position.set(-12.5, 1.6, 10.5); pn.rotation.y = .5; P.sc.add(pn);
  P.sc.add(di(kotak(.2, 1.6, .2, '#495057', .04), -12.5, .8, 10.4));
  for (let i = 0; i < 26; i++) { const a = acak(0, Math.PI * 2), rr = acak(26, 70); const tr = pohon(acak(.9, 1.5)); tr.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr + (Math.sin(a) < 0 ? -6 : 0)); P.sc.add(tr); }
  M.demo = robotVoxel('#748ffc', 1.3); M.demo.position.set(0, .3, -9.2); P.sc.add(M.demo);
}
// lintasan sirkuit: n petak + START dan FINISH, satu jalur per robot
function zLajur(i, nl) { if (nl <= 1) return -9.3; const jarak = Math.min(1.55, 5.4 / (nl - 1)); return -9.3 + (i - (nl - 1) / 2) * jarak; }
function lebarPetak(n) { return PANJANG_LINTAS / (n + 1); }
function xPetak(k, n) { const w = lebarPetak(n); return -PANJANG_LINTAS / 2 + w * (k + .5); }
function bangunLintas(n, nl) {
  if (M.lintas) P.sc.remove(M.lintas);
  const g = new THREE.Group(); M.lintas = g; M.n = n; const w = lebarPetak(n);
  g.add(di(kotak(PANJANG_LINTAS + 1.4, .2, 6.6, '#1d2b44', .05), 0, .1, -9.3));
  for (let i = 0; i < nl; i++) { const z = zLajur(i, nl), tebal = nl <= 1 ? 3 : Math.min(1.3, 5.4 / Math.max(1, nl - 1) - .2);
    for (let k = 0; k <= n; k++) { const ujung = k === 0 ? '#495057' : k === n ? '#ffd43b' : (k % 2 ? '#3b5bdb' : '#4263eb');
      const t = kotak(w - .08, .08, tebal, ujung, .02, k === n ? {emissive: '#ffd43b', emissiveIntensity: .3} : {}); t.position.set(xPetak(k, n), .24, z); t.castShadow = false; g.add(t); } }
  for (let k = 1; k < n; k++) if (n <= 16 || k % 2 === 0) { const nb = papanNama(String(k), Math.min(.9, w * .9), .5, 'rgba(0,0,0,0)', 'rgba(255,255,255,.75)'); nb.rotation.x = -Math.PI / 2; nb.position.set(xPetak(k, n), .3, -5.95 - .25); g.add(nb); }
  const s = papanNama('START', 2.2, .6, '#495057', '#ffffff'); s.position.set(xPetak(0, n), 1.2, -12.75); g.add(s); g.add(di(kotak(.1, .9, .1, '#495057', .02), xPetak(0, n), .5, -12.75));
  const f = papanNama('FINISH', 2.4, .66, '#e03131', '#ffffff'); f.position.set(xPetak(n, n), 1.3, -12.75); g.add(f); g.add(di(kotak(.1, 1, .1, '#e03131', .02), xPetak(n, n), .5, -12.75));
  P.sc.add(g);
}
function bangunRobot() {
  M.robot.forEach(r => P.sc.remove(r.g)); M.robot = [];
  if (!SESI) return; const n = SESI.soal.length;
  if (SESI.mode === 'layar') {
    const tim = [...PEMAIN.values()]; bangunLintas(n, tim.length);
    tim.forEach((p, i) => { const w = TIM[p.tim].warna; const r = robotVoxel(w, tim.length > 3 ? 1.15 : 1.35); const z = zLajur(i, tim.length);
      r.position.set(xPetak(0, n), .28, z); P.sc.add(r); const lb = labelNama(p.nama, w, '#fff'); lb.position.set(0, 3.1, 0); lb.scale.multiplyScalar(1.5); r.add(lb); r.rotation.y = Math.PI / 2;
      M.robot.push({g: r, p, pos: 0, goyang: 0}); });
  } else {
    bangunLintas(n, 1);
    const r = robotVoxel('#7048e8', 2); r.position.set(xPetak(0, n), .28, zLajur(0, 1)); r.rotation.y = Math.PI / 2; P.sc.add(r);
    const lb = labelNama('Robot Kelas', '#7048e8', '#fff'); lb.position.set(0, 4.4, 0); lb.scale.multiplyScalar(1.8); r.add(lb);
    M.robot.push({g: r, p: null, pos: 0, goyang: 0});
  }
}
function targetRobot(r) {
  if (r.p) return Math.min(M.n, r.p.lantai);
  let benar = 0; PEMAIN.forEach(p => { benar += p.benar; }); return Math.min(M.n, benar / Math.max(1, PEMAIN.size));
}
function updateRobot(dt, t) {
  M.robot.forEach((r, i) => { const tg = targetRobot(r); const beda = tg - r.pos; r.pos += beda * Math.min(1, dt * 1.6); const jalan = Math.abs(beda) > .02;
    const u = r.g.userData; r.g.position.x = xPetak(r.pos, M.n) + (r.goyang > 0 ? Math.sin(t * 60) * .12 * r.goyang : 0); r.goyang = Math.max(0, r.goyang - dt);
    u.roda.forEach(w => { if (jalan) w.rotation.x += dt * 9; }); u.b.position.y = jalan ? Math.abs(Math.sin(t * 14)) * .06 : Math.sin(t * 2 + i) * .03;
    u.bola.material.emissiveIntensity = r.goyang > 0 ? (Math.sin(t * 30) > 0 ? 1.5 : .1) : .7;
    u.mata.forEach(m => m.material.emissive.set(r.goyang > 0 ? '#ff6b6b' : '#3bc9db')); });
  if (M.demo && M.demo.visible) { const u = M.demo.userData; M.demo.position.x = Math.sin(t * .35) * 8.5; M.demo.rotation.y = Math.cos(t * .35) > 0 ? Math.PI / 2 : -Math.PI / 2; u.roda.forEach(w => { w.rotation.x += dt * 6; }); u.b.position.y = Math.abs(Math.sin(t * 10)) * .05; }
}

// ---------- posisi tokoh ----------
function jawabanKini(p) { return SESI && SESI.no >= 0 && SESI.fase !== 'mulai' && SESI.fase !== 'akhir' ? p.jawab[SESI.no] : null; }
function aturPosisi() {
  const layar = SESI && SESI.mode === 'layar';
  const per = {A: [], B: [], C: [], D: [], '-': []};
  PEMAIN.forEach(p => { const g = M.ent.get(p.id); if (!g) return; const j = M.mode === 'main' ? jawabanKini(p) : null; per[j ? j.h : '-'].push(g); });
  Object.entries(ZONA).forEach(([h, [zx, zz]]) => susunKotak(per[h], zx + .5, zz, ZW - 1.8, ZD - .8, .22, layar ? 2.4 : 1.15));
  susunKotak(per['-'], 0, layar ? 8.6 : 9.4, layar ? 14 : 22, layar ? 3 : 6, 0, layar ? 3.4 : 1.25);
  M.ent.forEach(g => { g.userData.arah = 0; });
}

// ---------- kamera ----------
function aturKamera(dt) {
  const c = M.cam, lebar = Math.max(1, 1.45 / P.cam.aspect);
  if (M.mode === 'main') Object.assign(c, {tx: 0, ty: 1, tz: -2.5, td: 25 * lebar, tinggi: .6, th: 0});
  else if (M.mode === 'lobi') Object.assign(c, {tx: 0, ty: 1, tz: 4, td: 21 * lebar, tinggi: .42, th: 0});
  else if (M.mode === 'podium') Object.assign(c, {tx: 2.2, ty: 2.2, tz: -3.5, td: 13.5 * lebar, tinggi: .22, th: 0});
  else { c.th += dt * .05; Object.assign(c, {tx: 0, ty: 1.5, tz: -3, td: 27, tinggi: .5}); }
  gerakKamera(dt, {sway: M.mode === 'judul' ? 0 : .12});
}

// ---------- kait dari inti ----------
pasangHookUmum({aturPosisi, siapkanDunia, hiasan: 8});
GAME.letakHias = hias => hias.forEach((s, i) => { const [x, z] = Object.values(ZONA)[i % 4]; s.position.set(x + acak(-2, 2.5), .22, z + acak(-1.5, 1.5)); s.rotation.y = acak(-1, 1); });
GAME.reset = () => { M.robot.forEach(r => P.sc.remove(r.g)); M.robot = []; bangunLintas(10, 2); M.demo.visible = true; layarSiap(); if (M.podium) { P.sc.remove(M.podium); M.podium = null; } };
GAME.mulai = () => {
  M.mode = 'main'; (M.hias || []).forEach(s => { s.visible = false; }); if (M.podium) { P.sc.remove(M.podium); M.podium = null; }
  M.ent.forEach(g => P.sc.remove(g)); M.ent.clear(); PEMAIN.forEach(p => buatEnt(p, GAME.ukuranTokoh)); aturPosisi(); M.ent.forEach(g => g.position.copy(g.userData.target));
  M.demo.visible = false; bangunRobot();
};
GAME.soalBaru = () => { layarSoal(SESI.soal[SESI.no]); Object.values(M.zona).forEach(z => { z.cahaya.intensity = 0; z.alas.material.emissiveIntensity = 0; }); aturPosisi(); };
GAME.bukaJawaban = async (kunci, hasil) => {
  aturPosisi(); await tunggu(.8);
  efek.gong(); layarJawab(kunci);
  await tunggu(.7);
  const z = M.zona[kunci]; z.alas.material.emissive && z.alas.material.emissive.set(WC[kunci]);
  await animasi(.5, e => { z.cahaya.intensity = e * 40; if (z.alas.material.emissive) z.alas.material.emissiveIntensity = e * .45; });
  Object.keys(ZONA).forEach(h => { if (h !== kunci && hasil.some(x => x.j && x.j.h === h)) asap(new THREE.Vector3(ZONA[h][0], .8, ZONA[h][1]), '#495057', 14, 2.2); });
  hasil.forEach(({p, j, benar}) => { const g = M.ent.get(p.id); if (!g) return;
    if (benar) { p.lantai += 1; g.userData.avatar.forEach(a => setMode(a, 'senang', 1.8)); konfeti(g.position.clone().add(new THREE.Vector3(0, 1.4, 0)), SESI.mode === 'layar' ? 26 : 5, [WC[kunci], '#ffd43b', '#ffffff']); }
    else if (j) g.userData.avatar.forEach(a => setMode(a, 'geleng', 1.4)); });
  // robot tim yang salah kena error
  M.robot.forEach(r => { if (!r.p) return; const h = hasil.find(x => x.p.id === r.p.id); if (h && !h.benar) { r.goyang = 1.2; asap(r.g.position.clone().add(new THREE.Vector3(0, 1.2, 0)), '#868e96', 6, .4); } });
  efek.naik(); await tunggu(.3); efek.benar();
  await tunggu(1.3);
};
GAME.podium = async (urut, st) => {
  M.mode = 'podium'; M.robot.forEach(r => { r.g.visible = false; });
  teksLayar([[['// program selesai', CM]], [['console.', TX], ['log', FN], ['(', TX], ['"Selamat, juara!"', ST], [');', TX]], [['robot.', TX], ['menari', FN], ['();', TX]]]);
  if (!M.podium) { const pod = new THREE.Group(); pod.position.set(0, 0, -3.5); P.sc.add(pod); M.podium = pod;
    [[0, 1.5, '#ffd43b', '1'], [-2.6, 1.0, '#ced4da', '2'], [2.6, .6, '#e8a25a', '3']].forEach(([x, h, c, nm]) => { pod.add(di(kotak(2.4, h, 2.4, c, .1), x, h / 2, 0)); const t = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({map: teksKanvas(nm, null, '#1d2b44'), transparent: true})); t.position.set(x, h / 2, 1.21); pod.add(t); }); }
  const juara = st ? st.slice(0, 3).map(t => [...PEMAIN.values()].filter(p => p.tim === t.i).sort((a, b) => b.poin - a.poin)[0]).filter(Boolean) : urut.slice(0, 3);
  const tempat = [[0, 1.5], [-2.6, 1.0], [2.6, .6]];
  M.ent.forEach((g, id) => { if (!juara.some(p => p.id === id)) g.visible = false; });
  juara.forEach((p, i) => { const g = M.ent.get(p.id); if (!g) return; g.visible = true; g.userData.terbang = true; g.position.set(tempat[i][0], tempat[i][1], -3.5); g.userData.target.copy(g.position);
    g.userData.avatar.forEach(a => { a.rotation.y = 0; setMode(a, 'senang', 99); }); if (st) g.userData.label.material.map = labelNama(st[i].nama, st[i].warna, '#fff').material.map; });
  await tunggu(.6); konfeti(new THREE.Vector3(0, 4, -3.5), 90); efek.kilau(); await tunggu(2.4);
};
GAME.update = (dt, t) => {
  updateRobot(dt, t); updateAsap(dt);
  if (M.ent.size) majuEnt(dt); (M.hias || []).forEach(s => s.visible && animTokoh(s, dt)); aturKamera(dt);
};
jalankan();

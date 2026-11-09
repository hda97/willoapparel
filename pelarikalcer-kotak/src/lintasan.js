// LINTASAN PELARI KALCER · DUNIA KOTAK (Huda 9 Nov 2026)
// Rencana: rute CFD Kotak Wetan dulu, lalu 6 rute Nusantara gaya kotak (menu Maps) + jalur Flyover & Rel Kereta dari GDD 6.6-6.7.
// Urutan terkunci: rute ke-n terbuka setelah pelari finish rute ke-(n-1).
// Semua benda dibuat dari balok (gaya Dunia Kotak) + aset asli desa (rumah, warung, fasum, kucing, avatar warga).
// Tanpa bendera / atribut negara (aturan Master Bundle) — pagar flyover pakai warna Dunia Kotak.
// Setiap rute: 1 KM, fisika & aturan koin sama, jadi papan peringkat tetap adil.

// ---------- tekstur jalan & tepi ----------
const bintik = (x, w, h, n, warna) => { for (let i = 0; i < n; i++) { x.fillStyle = warna(); x.fillRect(Math.random() * w, Math.random() * h, 3, 3); } };
const JALAN = {
  aspal: (x, w, h) => { x.fillStyle = '#5b5f68'; x.fillRect(0, 0, w, h); bintik(x, w, h, 900, () => `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},${.03 + Math.random() * .04})`);
    x.fillStyle = '#f4f1ea'; for (const lx of [w * 0.335, w * 0.665]) x.fillRect(lx - 3, 0, 6, h * .55); x.fillRect(4, 0, 7, h); x.fillRect(w - 11, 0, 7, h); },
  aspalKota: (x, w, h) => { x.fillStyle = '#4a4e57'; x.fillRect(0, 0, w, h); bintik(x, w, h, 900, () => `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},${.03 + Math.random() * .05})`);
    x.fillStyle = '#f4f1ea'; for (const lx of [w * 0.335, w * 0.665]) x.fillRect(lx - 3, 0, 6, h * .55); x.fillStyle = '#f2c14a'; x.fillRect(4, 0, 6, h); x.fillRect(w - 10, 0, 6, h); },
  paving: (x, w, h) => { x.fillStyle = '#9a8f80'; x.fillRect(0, 0, w, h); const c = ['#a89c8a', '#8e8374', '#b3a691', '#968a7a'];
    for (let r = 0; r < h; r += 16) for (let k = (r / 16) % 2 ? -16 : 0; k < w; k += 32) { x.fillStyle = c[(r + k) & 3 ? (r / 16 + k / 32) & 3 : 0]; x.fillRect(k + 1, r + 1, 30, 14); } },
  papan: (x, w, h) => { x.fillStyle = '#8a5a34'; x.fillRect(0, 0, w, h); const c = ['#a46a3c', '#9a6236', '#b07444', '#94603a'];
    for (let r = 0; r < h; r += 16) { x.fillStyle = c[(r / 16) % 4]; x.fillRect(0, r + 1, w, 14); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(w * .3, r + 6, 3, 3); x.fillRect(w * .7, r + 6, 3, 3); } },
  tanahMerah: (x, w, h) => { x.fillStyle = '#9a4f2c'; x.fillRect(0, 0, w, h); bintik(x, w, h, 700, () => pilihA(['#b0613a', '#83412a', '#a85a34', '#c0b0a0'])); },
  pasirVulkanik: (x, w, h) => { x.fillStyle = '#5c5652'; x.fillRect(0, 0, w, h); bintik(x, w, h, 900, () => pilihA(['#6e6862', '#4a4542', '#7a736c', '#3e3a37'])); },
  sabana: (x, w, h) => { x.fillStyle = '#9c7a50'; x.fillRect(0, 0, w, h); bintik(x, w, h, 700, () => pilihA(['#b08c5c', '#84663e', '#a8946a', '#c2b07a'])); },
};
const TEPI = {
  trotoar: (x, w, h) => { x.fillStyle = '#e9d9b4'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d4c094'; x.lineWidth = 4; for (let i = 0; i <= w; i += 64) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } },
  trotoarKota: (x, w, h) => { x.fillStyle = '#c9c4ba'; x.fillRect(0, 0, w, h); x.strokeStyle = '#a9a398'; x.lineWidth = 4; for (let i = 0; i <= w; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } x.fillStyle = '#f2c14a'; x.fillRect(w * .4, 0, w * .2, h); },
  batuAlam: (x, w, h) => { x.fillStyle = '#b8ab94'; x.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { x.fillStyle = pilihA(['#a89a82', '#c6baa4', '#9a8e78']); x.fillRect(Math.random() * w, Math.random() * h, 18, 12); } },
  pasir: (x, w, h) => { x.fillStyle = '#ecd9a4'; x.fillRect(0, 0, w, h); bintik(x, w, h, 500, () => pilihA(['#f4e4b6', '#dcc68e', '#e6d29a'])); },
  rumput: (x, w, h) => { x.fillStyle = '#4f8a3a'; x.fillRect(0, 0, w, h); bintik(x, w, h, 700, () => pilihA(['#5c9a44', '#3f7a30', '#6aa64e', '#7a5a3a'])); },
  abu: (x, w, h) => { x.fillStyle = '#7a736c'; x.fillRect(0, 0, w, h); bintik(x, w, h, 600, () => pilihA(['#8a837a', '#6a645e', '#948c82'])); },
  sabanaRumput: (x, w, h) => { x.fillStyle = '#b4b85e'; x.fillRect(0, 0, w, h); bintik(x, w, h, 700, () => pilihA(['#c6c46c', '#a0a64e', '#d0c27a', '#8c9a46'])); },
};
const pilihA = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- daftar rute (urutan = urutan buka) ----------
export const RUTE = [
  { id: 'wetan', sorot: 'Keliling desa: sekolah, masjid, warung dan taman kota.', ikon: '🏘️', nama: 'CFD Kotak Wetan', jenis: 'Desa', permukaan: 'jalan desa', el: 9, mulai: 'START · CFD KOTAK WETAN',
    langit: ['#5ab4ff', '#bfe4ff', '#f2f8ff'], kabut: [0xd6ecff, 120, 330], tanah: 0x8cc46a, jalan: 'aspal', tepi: 'trotoar', rintangan: ['kerucut', 'kerucut', 'pembatas', 'lubang'], gunung: [.33, .3, .45], rencana: desa, kucing: true },
  { id: 'sudirman', sorot: 'Jalan kota di antara gedung tinggi, lalu naik flyover di meter 380.', ikon: '🏙️', nama: 'Jakarta Sudirman CFD', jenis: 'Road', permukaan: 'aspal kota + flyover', el: 14, mulai: 'START · SUDIRMAN CFD',
    langit: ['#4f9fe6', '#b8dcf6', '#eef4f8'], kabut: [0xd8e6ee, 110, 320], tanah: 0x9aa39a, jalan: 'aspalKota', tepi: 'trotoarKota', rintangan: ['kerucut', 'kerucut', 'pembatas', 'lubang'], gunung: null, turun: [[380, 560, 13]], rencana: sudirman, latar: latarKota },
  { id: 'borobudur', sorot: 'Paving desa dengan candi di kejauhan dan perlintasan rel kereta.', ikon: '🛕', nama: 'Jogja Borobudur', jenis: 'Road', permukaan: 'paving desa + rel kereta', el: 28, mulai: 'START · JOGJA BOROBUDUR',
    langit: ['#5aa8f0', '#c4e2f6', '#f6f4ea'], kabut: [0xe2ecea, 110, 320], tanah: 0x86b85e, jalan: 'paving', tepi: 'batuAlam', rintangan: ['kerucut', 'pembatas', 'lubang', 'batu'], gunung: [.3, .25, .42], rencana: borobudur, latar: latarMerapi, kucing: true },
  { id: 'sanur', sorot: 'Boardwalk kayu di tepi pantai, berjajar pohon kelapa.', ikon: '🏝️', nama: 'Bali Sanur', jenis: 'Road', permukaan: 'boardwalk pantai', el: 8, mulai: 'START · SANUR BEACH RUN',
    langit: ['#38a8f0', '#a8def8', '#fff6e4'], kabut: [0xdaf0f8, 130, 340], tanah: 0xe9d6a0, jalan: 'papan', tepi: 'pasir', rintangan: ['kerucut', 'pembatas', 'batu'], gunung: null, rencana: sanur, latar: latarLaut },
  { id: 'lawu', sorot: 'Trail tanah merah di hutan pinus. Awas batu, akar dan kayu!', ikon: '🌲', nama: 'Siksorogo Lawu', jenis: 'Trail', permukaan: 'tanah merah', el: 120, mulai: 'START · SIKSOROGO LAWU TRAIL',
    langit: ['#7fa8c8', '#c8d8dc', '#e8eee8'], kabut: [0xcfdad4, 60, 230], tanah: 0x4f7a3a, jalan: 'tanahMerah', tepi: 'rumput', rintangan: ['batu', 'akar', 'kayu', 'akar'], gunung: [.32, .35, .3], rencana: lawu, trail: true },
  { id: 'bromo', sorot: 'Lautan pasir vulkanik, gunung berasap di depan mata.', ikon: '🌋', nama: 'Bromo Trail', jenis: 'Trail', permukaan: 'pasir vulkanik', el: 95, mulai: 'START · BROMO SEA OF SAND',
    langit: ['#6a7fd0', '#e6b8c8', '#fbe8d6'], kabut: [0xe8d8d4, 90, 300], tanah: 0x6e665e, jalan: 'pasirVulkanik', tepi: 'abu', rintangan: ['batu', 'batu', 'kayu', 'akar'], gunung: null, rencana: bromo, latar: latarBromo, trail: true },
  { id: 'rinjani', sorot: 'Sabana di atas awan, tanjakan paling tinggi: +140 m.', ikon: '⛰️', nama: 'Dieng & Rinjani', jenis: 'Trail', permukaan: 'sabana', el: 140, mulai: 'START · DIENG RINJANI SKYRUN',
    langit: ['#4a9ae8', '#bfe0f4', '#f4f8f0'], kabut: [0xe6efe8, 90, 300], tanah: 0xa8b85a, jalan: 'sabana', tepi: 'sabanaRumput', rintangan: ['batu', 'akar', 'kayu', 'batu'], gunung: null, rencana: rinjani, latar: latarRinjani, trail: true },
];
export const TEKS_JALAN = JALAN, TEKS_TEPI = TEPI;

// ---------- pembantu balok ----------
function grup(K, daftar) { const g = new K.THREE.Group(); for (const [w, h, d, c, x, y, z, r = .06] of daftar) { const m = K.kotak(w, h, d, c, r); m.position.set(x, y, z); g.add(m); } return g; }
function di(K, o, x, y, z, ry = 0) { o.position.set(x, y, z); o.rotation.y = ry; return o; }
const hadap = (s) => (s > 0 ? -Math.PI / 2 : Math.PI / 2);
const TEX = {};
function texJendela(K, warna, kaca) { const k = warna + kaca; return TEX[k] || (TEX[k] = K.tekstur(64, 128, (x, w, h) => { x.fillStyle = warna; x.fillRect(0, 0, w, h); for (let r = 6; r < h - 4; r += 12) for (let c = 6; c < w - 4; c += 14) { x.fillStyle = Math.random() < .2 ? '#f6e7a8' : kaca; x.fillRect(c, r, 9, 8); } }, true)); }
function gedung(K, s, d, y0 = 0, jarak = 24) {
  const { THREE } = K; const g = new THREE.Group(); const h = 22 + K.rnd() * 34, w = 12 + K.rnd() * 6;
  const [dw, kc] = K.pilih([['#d8d4cc', '#5a7a9a'], ['#9aa8b4', '#3a5a7a'], ['#e6dccb', '#6a8aa8'], ['#5a6470', '#9ac4e0'], ['#c8b8a0', '#4a6a8a']]);
  const t = texJendela(K, dw, kc).clone(); t.needsUpdate = true; t.repeat.set(Math.round(w / 4), Math.round(h / 8));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ map: t, roughness: .7 })); m.position.set(s * (jarak + w / 2), y0 + h / 2, -d * K.U); m.castShadow = m.receiveShadow = true; g.add(m);
  const atas = K.kotak(w * .6, 2.4, w * .6, 0x8a8f96, .2); atas.position.set(m.position.x, y0 + h + 1.2, m.position.z); g.add(atas);
  return g;
}
function lampu(K, s, d, y0 = 0) { return grup(K, [[.3, 6, .3, 0x2c3150, s * 9.4, y0 + 3, -d * K.U, .05], [1.8, .25, .3, 0x2c3150, s * 8.6, y0 + 6, -d * K.U, .05], [.7, .3, .5, 0xfff2c0, s * 7.8, y0 + 5.8, -d * K.U, .1]]); }
function pohonKelapa(K, x, z, s = 1) {
  const g = new K.THREE.Group(); for (let i = 0; i < 7; i++) { const b = K.kotak(.55 * s, 1.1 * s, .55 * s, i % 2 ? 0x8a6a4a : 0x9a7a56, .1); b.position.set(i * .12 * s, (.55 + i * 1.05) * s, 0); g.add(b); }
  const top = 7.6 * s; for (let a = 0; a < 6; a++) { const l = K.kotak(3.6 * s, .2 * s, .8 * s, a % 2 ? 0x3f9a44 : 0x56b04c, .08); const r = a / 6 * Math.PI * 2; l.position.set(.84 * s + Math.cos(r) * 1.6 * s, top - .3 * s, Math.sin(r) * 1.6 * s); l.rotation.y = -r; l.rotation.z = -.35; g.add(l); }
  for (let i = 0; i < 3; i++) { const k = K.kotak(.5 * s, .5 * s, .5 * s, 0x6a4a2a, .2); k.position.set(.84 * s + (i - 1) * .45 * s, top - .7 * s, (i % 2 - .5) * .4 * s); g.add(k); }
  g.position.set(x, 0, z); return g;
}
function pinus(K, x, z, s = 1, y0 = 0) {
  const g = new K.THREE.Group(); const t = K.kotak(.6 * s, 4 * s, .6 * s, 0x5a3a22, .08); t.position.y = 2 * s; g.add(t);
  for (let i = 0; i < 5; i++) { const w = (3.6 - i * .66) * s; const l = K.kotak(w, 1.3 * s, w, i % 2 ? 0x2f6a3a : 0x3a7a44, .2); l.position.y = (3 + i * 1.15) * s; l.rotation.y = i * .5; g.add(l); }
  g.position.set(x, y0, z); return g;
}
function batuBesar(K, x, z, s = 1, warna = 0x8a8478) { const g = grup(K, [[2.2 * s, 1.6 * s, 2 * s, warna, 0, .8 * s, 0, .4], [1.4 * s, 1.1 * s, 1.3 * s, warna - 0x101010, .9 * s, .55 * s, .8 * s, .35]]); g.position.set(x, 0, z); return g; }
function papan(K, s, d, teks, bg, y0 = 0, x = 9.6) { const { THREE } = K; const g = new THREE.Group(); const ry = hadap(s) + (s > 0 ? .5 : -.5), z = -d * K.U;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.3), new THREE.MeshStandardMaterial({ map: K.papanTeks(teks, { bg }) })); p.position.set(s * x, y0 + 3, z); p.rotation.y = ry; g.add(p);
  for (const dx of [-2.3, 2.3]) { const t = K.kotak(.2, 3, .2, 0x3a3a3a, .04); t.position.set(s * x + Math.cos(ry) * dx, y0 + 1.5, z - Math.sin(ry) * dx); g.add(t); } return g; }

// ---------- 1. CFD Kotak Wetan (rute asli) ----------
function desa(tambah, K, FINISH) {
  const SAWAH = [[160, 255], [600, 690]]; const diSawah = (d) => SAWAH.some(([a, b]) => d > a && d < b);
  const LM = [{ d: 110, sisi: -1, buat: () => K.F.sekolah(), nama: 'SD KOTAK WETAN' }, { d: 330, sisi: 1, buat: () => K.F.masjid(), nama: 'MASJID' }, { d: 430, sisi: -1, buat: () => K.F.warung(), nama: 'WARUNG' }, { d: 760, sisi: 1, buat: () => K.F.tamanKota(), nama: 'TAMAN KOTA' }, { d: 880, sisi: -1, buat: () => K.F.stadion(), nama: 'STADION' }];
  const dekat = (d, s) => LM.some((l) => l.sisi === s && Math.abs(l.d - d) < 34);
  for (let d = -20; d < FINISH + 140; d += 8.5) for (const s of [-1, 1]) {
    if (dekat(d, s)) continue;
    if (diSawah(d)) { if (Math.round(d / 8.5) % 2 === 0) tambah(d, () => K.sawah(s, d)); continue; }
    const r = K.rnd();
    if (r < 0.62) { const dn = K.pilih(K.DINDING), at = K.pilih(K.ATAP), dua = K.rnd() < .25; tambah(d, () => K.rumah(s, d, dn, at, dua)); }
    else if (r < 0.74) { const n = K.pilih(['WARUNG BU SRI', 'KOPI SKENA', 'JUS BUAH', 'BUBUR AYAM', 'ES DAWET']); tambah(d, () => K.warungDepan(s, d, n)); }
    else tambah(d, () => K.pohonPohon(s, d));
    if (K.rnd() < 0.5) { const x = s * (10.3 + K.rnd() * .6), sk = 0.9 + K.rnd() * .3; tambah(d + 4, () => K.pohon(x, -(d + 4) * K.U, sk)); }
  }
  LM.forEach((l) => tambah(l.d, () => K.landmark(l)));
}

// ---------- 2. Jakarta Sudirman CFD + Flyover ----------
function angkot(K, s, d) { const z = -d * K.U, x = s * 11.2; const g = grup(K, [[2.3, 2, 5.2, 0x2f9a4a, x, 1.3, z, .25], [2.32, .8, 3.4, 0x9ad0f0, x, 1.9, z - .6, .1], [2.34, .25, 5.22, 0xf2c14a, x, .9, z, .05], [2.4, .3, .6, 0x2c2c2c, x, .3, z + 1.8, .1], [2.4, .3, .6, 0x2c2c2c, x, .3, z - 1.8, .1]]); return g; }
function gerobakBakso(K, s, d) { const z = -d * K.U, x = s * 9.9; return grup(K, [[1.2, 1.1, 2.2, 0xf6f3ee, x, 1.1, z], [1.3, .15, 2.4, 0xe05a3a, x, 2.6, z], [.1, 1, .1, 0x7a4f2a, x - .5, 2.1, z - 1], [.1, 1, .1, 0x7a4f2a, x + .5, 2.1, z + 1], [.5, .5, .5, 0x9a9a9a, x, 1.9, z + .5, .2], [.9, .9, .2, 0x2c2c2c, x + s * .6, .45, z, .3]]); }
function halte(K, s, d) { const z = -d * K.U, x = s * 10.6; const g = grup(K, [[2.8, .2, 6, 0x3a8ad8, x, 3.2, z], [.2, 3.2, .2, 0x2c3150, x - s * 1.2, 1.6, z - 2.8], [.2, 3.2, .2, 0x2c3150, x - s * 1.2, 1.6, z + 2.8], [.15, 2.2, 6, 0xbfe4ff, x + s * 1.3, 1.6, z, .02], [1, .25, 4.6, 0x8a8f96, x, .8, z]]); return g; }
function rambu(K, s, d) { return papan(K, s, d, s > 0 ? 'JAKARTA →' : '← BANDUNG', '#1f7a4a'); }
function tugu(K) { // tugu kota gaya kotak (inspirasi lintasan 4 GDD), latar belakang kanan
  return grup(K, [[16, 2, 16, 0xd8d0c0, 0, 1, 0, .2], [10, 3, 10, 0xe6e0d4, 0, 3.5, 0, .2], [3.2, 34, 3.2, 0xf4f2ec, 0, 22, 0, .3], [4.6, 2.4, 4.6, 0x3a3a3a, 0, 40, 0, .2], [2, 2.6, 2, 0xf2c14a, 0, 42.6, 0, .4], [1.3, 2, 1.3, 0xffd75a, 0, 44.6, 0, .4]]);
}
function sudirman(tambah, K, FINISH, R) {
  const [a0, b0, dalam] = R.turun[0];
  for (let d = -20; d < FINISH + 140; d += 9) for (const s of [-1, 1]) {
    if (d > a0 - 4 && d < b0 + 4) { // flyover: pagar baja di tepi, kota di bawah
      tambah(d, () => grup(K, [[.25, 1.3, .25, 0x2c3150, s * 8.9, .65, -d * K.U, .04], [.2, .26, 9 * K.U, 0x8a8f96, s * 8.9, 1.15, -d * K.U, .04], [.2, .2, 9 * K.U, 0xe0803a, s * 8.9, .7, -d * K.U, .04]]));
      if (Math.round(d / 9) % 3 === 0) tambah(d, () => grup(K, [[3, dalam, 3, 0xb8b2a6, s * 3.5, -dalam / 2, -d * K.U, .1]]));
      if (K.rnd() < .7) tambah(d, () => gedung(K, s, d, -dalam, 22 + K.rnd() * 18));
      if (K.rnd() < .3) tambah(d, () => grup(K, [[3.6, 1.8, 6, K.pilih([0x2f9a4a, 0x3a8ad8, 0xe0503a, 0xf6f3ee]), s * (16 + K.rnd() * 6), -dalam + 1, -d * K.U, .3]]));
      continue;
    }
    const r = K.rnd();
    if (r < .55) tambah(d, () => gedung(K, s, d));
    else if (r < .7) tambah(d, () => K.pohon(s * 12, -d * K.U, 1.1));
    else if (r < .8) { const n = K.pilih(['KOPI SKENA', 'JUS BUAH', 'BUBUR AYAM', 'ROTI BAKAR']); tambah(d, () => K.warungDepan(s, d, n)); }
    if (Math.round(d / 9) % 4 === 0) tambah(d, () => lampu(K, s, d));
    const r2 = K.rnd(); if (r2 < .12) tambah(d, () => angkot(K, s, d + 3)); else if (r2 < .22) tambah(d, () => gerobakBakso(K, s, d + 3)); else if (r2 < .27) tambah(d, () => halte(K, s, d + 4));
  }
  tambah(a0 - 12, () => papan(K, 1, a0 - 12, 'FLYOVER · NAIK', '#2c3150'));
  [140, 700].forEach((d) => tambah(d, () => rambu(K, d < 400 ? 1 : -1, d)));
  tambah(800, () => di(K, tugu(K), 55, 0, -960 * K.U));
}
function latarKota(K, dunia, PANJANG, jauh) { for (let i = 0; i < 14; i++) { const h = 40 + K.rnd() * 60; const m = K.kotak(24 + K.rnd() * 16, h, 24, new K.THREE.Color().setHSL(.58, .12, .55 + K.rnd() * .12), 1); m.position.set((i - 7) * 34, h / 2 - 4, -400 - K.rnd() * 40); jauh.add(m); } }

// ---------- 3. Jogja Borobudur + Rel Kereta heritage ----------
function joglo(K, s, d) { const z = -d * K.U, x = s * 18; const g = grup(K, [[11, .6, 11, 0xcfc6b0, x, .3, z], [9, 3.4, 9, 0xb07a48, x, 2.3, z], [12, 1, 12, 0x7a3a26, x, 4.5, z, .1], [9, 1, 9, 0x8a4a2e, x, 5.4, z, .1], [5.6, 1.2, 5.6, 0x7a3a26, x, 6.4, z, .1], [2.4, .8, 2.4, 0x8a4a2e, x, 7.3, z, .1], [.5, 2.4, .5, 0x6b3e22, x - s * 4.6, 1.8, z - 4.6], [.5, 2.4, .5, 0x6b3e22, x - s * 4.6, 1.8, z + 4.6], [.3, 2.2, 1.6, 0x6b3e22, x - s * 4.52, 1.7, z]]); return g; }
function candiBorobudur(K) {
  const L = []; const batu = [0x8a8478, 0x7e786c, 0x948e82];
  for (let i = 0; i < 6; i++) { const w = 60 - i * 8; L.push([w, 3.4, w, batu[i % 3], 0, 1.7 + i * 3.4, 0, .3]); }
  for (let i = 0; i < 3; i++) { const r = 16 - i * 4.4, n = 12 - i * 3, y = 20.4 + i * 2.6; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; L.push([2.2, 2.4, 2.2, 0x9a9488, Math.cos(a) * r, y + 1.2, Math.sin(a) * r, .8], [.5, .9, .5, 0x8a8478, Math.cos(a) * r, y + 2.8, Math.sin(a) * r, .2]); } }
  L.push([7, 6, 7, 0x9a9488, 0, 31, 0, 2.6], [1.6, 3.6, 1.6, 0x8a8478, 0, 35.6, 0, .4]); return grup(K, L);
}
function rel(K, d, x) { const z = -d * K.U; const L = [[4.2, .35, 9 * K.U, 0x8a8478, x, .18, z, .05], [.18, .22, 9 * K.U, 0x6a6e74, x - .9, .5, z, .03], [.18, .22, 9 * K.U, 0x6a6e74, x + .9, .5, z, .03]]; for (let i = -4; i <= 4; i++) L.push([2.8, .16, .45, 0x6b4a2e, x, .38, z + i * 2.2, .03]); return grup(K, L); }
function lokomotif(K, d, x) { const z = -d * K.U; return grup(K, [[2.6, 2.6, 9, 0x2a3a2e, x, 2, z, .3], [2.8, 3.2, 3, 0x1e2a22, x, 2.6, z + 3.6, .2], [1, 1.6, 1, 0x1e1e1e, x, 4, z - 3, .2], [2.2, .5, 9.4, 0xb8322a, x, .9, z, .1], [.8, .8, .3, 0xfff2c0, x, 2.2, z - 4.6, .1], ...[-3, 0, 3].map((k) => [2.9, 1, 1, 0x1e1e1e, x, .7, z + k, .4])]); }
function stasiun(K, d, x) { const z = -d * K.U; const g = grup(K, [[7, .8, 20, 0xcfc6b0, x, .4, z], [6, 3.6, 16, 0xf1dcb4, x + 1.6, 2.6, z], [7.4, .8, 18, 0x3f8a5a, x + 1.6, 4.8, z, .1], [5, 1.2, 12, 0x3f8a5a, x + 1.6, 5.8, z, .1]]);
  const p = new K.THREE.Mesh(new K.THREE.PlaneGeometry(8, 1.4), new K.THREE.MeshStandardMaterial({ map: K.papanTeks('STASIUN KOTAK', { bg: '#2c3150' }) })); p.position.set(x - 1.4, 3.6, z); p.rotation.y = -Math.PI / 2; g.add(p); return g; }
function borobudur(tambah, K, FINISH) {
  const SAWAH = [[150, 240], [700, 780]], REL = [400, 640]; const diSawah = (d) => SAWAH.some(([a, b]) => d > a && d < b);
  for (let d = -20; d < FINISH + 140; d += 8.5) for (const s of [-1, 1]) {
    if (s > 0 && d > REL[0] && d < REL[1]) continue;
    if (diSawah(d)) { if (Math.round(d / 8.5) % 2 === 0) tambah(d, () => K.sawah(s, d)); continue; }
    const r = K.rnd();
    if (r < .38) tambah(d, () => joglo(K, s, d));
    else if (r < .6) { const dn = K.pilih(['krem', 'putih', 'kuning', 'kayu']), at = K.pilih(['merah', 'oranye', 'cokelat']); tambah(d, () => K.rumah(s, d, dn, at, false)); }
    else if (r < .7) { const n = K.pilih(['GUDEG BU WATI', 'ANGKRINGAN', 'WEDANG JAHE', 'BAKPIA']); tambah(d, () => K.warungDepan(s, d, n)); }
    else tambah(d, () => K.pohonPohon(s, d));
    if (K.rnd() < .25) { const x = s * 10.4; tambah(d + 4, () => batuBesar(K, x, -(d + 4) * K.U, .45, 0x9a9488)); }
  }
  for (let d = REL[0]; d < REL[1]; d += 9) tambah(d, () => rel(K, d, 13.5));
  tambah(REL[0] + 4, () => papan(K, 1, REL[0] + 4, 'JALUR REL HERITAGE', '#6b4a2e'));
  tambah(470, () => stasiun(K, 470, 20)); tambah(570, () => lokomotif(K, 570, 13.5));
  tambah(300, () => K.landmark({ d: 300, sisi: 1, buat: () => K.F.masjid(), nama: 'MASJID' }));
  tambah(640, () => di(K, candiBorobudur(K), -90, 0, -800 * K.U));
  tambah(880, () => papan(K, -1, 880, 'BOROBUDUR 2 KM', '#6b4a2e'));
}
function latarMerapi(K, dunia, PANJANG, jauh) { const L = []; for (let i = 0; i < 7; i++) { const w = 140 - i * 18; L.push([w, 12, w * .7, i % 2 ? 0x5a7a4a : 0x6a8a56, 0, 6 + i * 12, 0, 3]); } L.push([12, 6, 10, 0x8a8a8a, 0, 88, 0, 2], [8, 5, 6, 0xf2f2f2, 4, 96, 0, 2]); const g = grup(K, L); g.position.set(70, -10, -470); jauh.add(g); }

// ---------- 4. Bali Sanur ----------
function candiBentar(K, d) { // gerbang terbelah di atas lintasan
  const z = -d * K.U, L = [];
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const w = 4 - i * .5, h = 2.4; const bata = i % 2 ? 0xb5532e : 0xa04a28; L.push([w, h, 3.4 - i * .3, bata, s * (6.6 + (i * .25)), h / 2 + i * h, z, .1], [w + .3, .3, 3.6 - i * .3, 0x8a8478, s * (6.6 + i * .25), (i + 1) * h, z, .05]); }
  return grup(K, L);
}
function jukung(K, d, x) { const z = -d * K.U; return grup(K, [[1.2, .7, 8, 0xf6f3ee, x, .35, z, .3], [1.25, .2, 8.1, 0x3a8ad8, x, .55, z, .05], [.12, .12, 6, 0x9a7a56, x + 3, .6, z, .04], [3.2, .1, .12, 0x9a7a56, x + 1.5, .7, z - 2, .02], [3.2, .1, .12, 0x9a7a56, x + 1.5, .7, z + 2, .02], [.12, 4.6, .12, 0x7a5a3a, x, 2.6, z - 1, .04], [.08, 3.4, 2.6, 0xe05a6a, x, 3, z, .02]]); }
function payung(K, s, d) { const z = -d * K.U, x = s * (12 + K.rnd() * 6); const c = K.pilih([0xe05a6a, 0x3a8ad8, 0xf2c14a, 0x3aa860]); return grup(K, [[.15, 3.2, .15, 0xf6f3ee, x, 1.6, z, .04], [3.4, .3, 3.4, c, x, 3.2, z, .15], [2.2, .25, 2.2, c, x, 3.5, z, .15], [1, .3, 2.4, 0xf6f3ee, x + 1.4, .3, z, .05]]); }
function sanur(tambah, K, FINISH) {
  for (let d = -20; d < FINISH + 140; d += 8) {
    // kiri: pantai & laut
    if (K.rnd() < .6) { const x = -(10.5 + K.rnd() * 5), sk = .9 + K.rnd() * .3; tambah(d, () => pohonKelapa(K, x, -d * K.U, sk)); }
    if (K.rnd() < .12) { const x = -(26 + K.rnd() * 30); tambah(d, () => jukung(K, d, x)); }
    if (K.rnd() < .18) tambah(d, () => payung(K, -1, d));
    // kanan: warung, rumah, kelapa
    const r = K.rnd();
    if (r < .38) { const dn = K.pilih(['putih', 'krem', 'kuning', 'biru']), at = K.pilih(['oranye', 'cokelat', 'merah']); tambah(d, () => K.rumah(1, d, dn, at, K.rnd() < .2)); }
    else if (r < .55) { const n = K.pilih(['ES KELAPA', 'NASI JINGGO', 'SURF RENTAL', 'KOPI PANTAI']); tambah(d, () => K.warungDepan(1, d, n)); }
    else { const sk = 1 + K.rnd() * .3; tambah(d, () => pohonKelapa(K, 12 + K.rnd() * 4, -d * K.U, sk)); }
  }
  [300, 820].forEach((d) => tambah(d, () => candiBentar(K, d)));
  tambah(640, () => K.landmark({ d: 640, sisi: 1, buat: () => K.F.pura(), nama: 'PURA' }));
}
function latarLaut(K, dunia, PANJANG, jauh) { const { THREE } = K;
  const laut = new THREE.Mesh(new THREE.PlaneGeometry(400, PANJANG + 600), new THREE.MeshStandardMaterial({ color: 0x3fa9d8, roughness: .25, metalness: .1 })); laut.rotation.x = -Math.PI / 2; laut.position.set(-216, 0.03, -PANJANG / 2); laut.receiveShadow = true; dunia.add(laut);
  const ombak = new THREE.Mesh(new THREE.PlaneGeometry(2, PANJANG + 600), new THREE.MeshStandardMaterial({ color: 0xeaf6fb, roughness: .5 })); ombak.rotation.x = -Math.PI / 2; ombak.position.set(-17, 0.05, -PANJANG / 2); dunia.add(ombak);
  const g = grup(K, [[90, 30, 40, 0x5a8aa0, -120, 0, 0, 4], [50, 46, 30, 0x6a9ab0, -100, 4, -10, 4]]); g.position.set(-40, -6, -470); jauh.add(g); }

// ---------- 5. Siksorogo Lawu (trail) ----------
function akarSamping(K, x, z) { return grup(K, [[3, .3, .4, 0x5a3a22, x, .15, z, .1], [.4, .3, 2.4, 0x5a3a22, x + .8, .15, z + .6, .1]]); }
function kebunTeh(K, s, d) { const z = -d * K.U, L = []; for (let r = 0; r < 5; r++) L.push([2.2, 1.4, 16, r % 2 ? 0x4a9a44 : 0x56aa4c, s * (13 + r * 3.2), .7 + r * .6, z, .6]); return grup(K, L); }
function pitaTrail(K, s, d) { const z = -d * K.U, x = s * 8.6; return grup(K, [[.18, 2.4, .18, 0x6b4a2e, x, 1.2, z, .03], [.6, .25, .08, 0xe05a6a, x + s * .3, 2.1, z, .02], [.5, .22, .08, 0xf2c14a, x + s * .3, 1.8, z, .02]]); }
function lawu(tambah, K, FINISH) {
  const TEH = [[300, 420], [720, 800]]; const diTeh = (d) => TEH.some(([a, b]) => d > a && d < b);
  for (let d = -20; d < FINISH + 140; d += 7) for (const s of [-1, 1]) {
    if (diTeh(d) && s > 0) { if (Math.round(d / 7) % 2 === 0) tambah(d, () => kebunTeh(K, s, d)); continue; }
    const n = 1 + Math.floor(K.rnd() * 3); for (let i = 0; i < n; i++) { const x = s * (10 + K.rnd() * 22), z = -(d + K.rnd() * 6) * K.U, sk = 1 + K.rnd() * .7; tambah(d, () => pinus(K, x, z, sk)); }
    if (K.rnd() < .3) { const x = s * (9.5 + K.rnd() * 2); tambah(d, () => batuBesar(K, x, -d * K.U, .5 + K.rnd() * .5, 0x7a7468)); }
    if (K.rnd() < .25) { const x = s * 9.4; tambah(d, () => akarSamping(K, x, -d * K.U)); }
    if (Math.round(d / 7) % 9 === 0) tambah(d, () => pitaTrail(K, s, d));
  }
  tambah(500, () => papan(K, -1, 500, 'POS 2 · CEMORO', '#3a5a2e'));
  tambah(850, () => papan(K, 1, 850, 'PUNCAK ARGO DUMILAH 3 KM', '#3a5a2e'));
}

// ---------- 6. Bromo (pasir vulkanik) ----------
function jip(K, s, d) { const z = -d * K.U, x = s * (13 + K.rnd() * 10); const c = K.pilih([0x5f6a3e, 0x2c3150, 0xf6f3ee, 0x9a3a2a]); return grup(K, [[2.6, 1.6, 4.6, c, x, 1.4, z, .2], [2.4, 1.1, 2.4, c, x, 2.7, z + .6, .15], [2.42, .7, 1.6, 0x9ad0f0, x, 2.75, z - .3, .05], ...[[-1.5, -1.6], [-1.5, 1.6], [1.5, -1.6], [1.5, 1.6]].map(([a, b]) => [.5, 1.1, 1.1, 0x1e1e1e, x + a * .9, .55, z + b, .4])]); }
function semakKering(K, x, z) { return grup(K, [[1.2, .7, 1.2, 0x9a8a5a, x, .35, z, .3], [.8, .5, .8, 0xa89a62, x + .5, .7, z + .3, .25]]); }
function bromo(tambah, K, FINISH) {
  for (let d = -20; d < FINISH + 140; d += 9) for (const s of [-1, 1]) {
    const r = K.rnd();
    if (r < .25) { const x = s * (10 + K.rnd() * 25), sk = .5 + K.rnd(); tambah(d, () => batuBesar(K, x, -d * K.U, sk, 0x4a4542)); }
    else if (r < .45) { const x = s * (9.5 + K.rnd() * 10); tambah(d, () => semakKering(K, x, -d * K.U)); }
    if (K.rnd() < .08) tambah(d, () => jip(K, s, d));
    if (Math.round(d / 9) % 8 === 0) tambah(d, () => pitaTrail(K, s, d));
  }
  tambah(420, () => K.landmark({ d: 420, sisi: -1, buat: () => K.F.pura(), nama: 'PURA LAUTAN PASIR' }));
  tambah(700, () => papan(K, 1, 700, 'KAWAH 1,5 KM', '#4a4542'));
}
function latarBromo(K, dunia, PANJANG, jauh) {
  const kerucut = (x, z, alas, n, warna, puncak) => { const L = []; for (let i = 0; i < n; i++) { const w = alas - i * (alas / (n + 1)); L.push([w, 8, w, warna[i % warna.length], 0, 4 + i * 8, 0, 2]); } if (puncak) L.push([alas / (n + 1) * 1.2, 2, alas / (n + 1) * 1.2, 0x2a2624, 0, n * 8 + 1, 0, .5]); const g = grup(K, L); g.position.set(x, -4, z); jauh.add(g); return g; };
  kerucut(-110, -380, 120, 7, [0x8a7a6a, 0x7a6c5e], true); // Bromo
  kerucut(20, -420, 100, 8, [0x5a7a3a, 0x4a6a32]); // Batok
  kerucut(200, -540, 160, 12, [0x6a6a7a, 0x7a7a8a]); // Semeru jauh
  for (let i = 0; i < 8; i++) { const a = K.kotak(10 + i * 2, 6, 10 + i * 2, 0xf4f0ec, 3); a.material.transparent = true; a.material.opacity = .8 - i * .08; a.position.set(-110 + i * 3, 56 + i * 7, -380); jauh.add(a); }
}

// ---------- 7. Dieng & Rinjani (sabana) ----------
function edelweis(K, x, z) { const L = [[1, .6, 1, 0x8a9a7a, x, .3, z, .3]]; for (let i = 0; i < 5; i++) L.push([.3, .3, .3, 0xf6f3e4, x + Math.cos(i) * .5, .75, z + Math.sin(i) * .5, .1]); return grup(K, L); }
function candiKecil(K, s, d) { const z = -d * K.U, x = s * 18; return grup(K, [[8, 1.2, 8, 0x7e786c, x, .6, z, .1], [6, 4, 6, 0x8a8478, x, 3.2, z, .1], [5, 1.2, 5, 0x7e786c, x, 5.8, z, .1], [3.4, 1.2, 3.4, 0x8a8478, x, 7, z, .1], [1.8, 1.4, 1.8, 0x7e786c, x, 8.3, z, .2], [1.6, 2.4, .3, 0x3a3630, x - s * 3, 2.4, z, .05]]); }
function telaga(K, s, d) { const { THREE } = K; const m = new THREE.Mesh(new THREE.BoxGeometry(34, .2, 60), new THREE.MeshStandardMaterial({ color: 0x3fb8a8, roughness: .2, metalness: .1 })); m.position.set(s * 30, .05, -d * K.U); m.receiveShadow = true; return m; }
function rinjani(tambah, K, FINISH) {
  tambah(260, () => telaga(K, -1, 260)); tambah(620, () => telaga(K, 1, 620));
  for (let d = -20; d < FINISH + 140; d += 8) for (const s of [-1, 1]) {
    if ((s < 0 && Math.abs(d - 260) < 16) || (s > 0 && Math.abs(d - 620) < 16)) continue;
    const r = K.rnd();
    if (r < .35) { const x = s * (9.6 + K.rnd() * 12); tambah(d, () => edelweis(K, x, -d * K.U)); }
    else if (r < .5) { const x = s * (11 + K.rnd() * 20), sk = .8 + K.rnd() * .5; tambah(d, () => pinus(K, x, -d * K.U, sk)); }
    else if (r < .62) { const x = s * (10 + K.rnd() * 20), sk = .4 + K.rnd() * .6; tambah(d, () => batuBesar(K, x, -d * K.U, sk, 0x8a8478)); }
    if (Math.round(d / 8) % 9 === 0) tambah(d, () => pitaTrail(K, s, d));
  }
  tambah(150, () => candiKecil(K, 1, 150)); tambah(420, () => candiKecil(K, -1, 420));
  tambah(270, () => papan(K, -1, 240, 'TELAGA WARNA', '#2f7a6a'));
  tambah(800, () => papan(K, 1, 800, 'PLAWANGAN · SEGARA ANAK', '#2f7a6a'));
}
function latarRinjani(K, dunia, PANJANG, jauh) {
  const L = []; for (let i = 0; i < 10; i++) { const w = 200 - i * 19; L.push([w, 10, w * .6, i < 6 ? (i % 2 ? 0x6a8a4a : 0x7a9a56) : (i % 2 ? 0x8a8478 : 0x9a9488), 0, 5 + i * 10, 0, 3]); }
  const g = grup(K, L); g.position.set(-20, -14, -500); jauh.add(g);
  for (let i = 0; i < 26; i++) { const a = K.kotak(30 + K.rnd() * 40, 4, 20 + K.rnd() * 20, 0xffffff, 2); a.material.transparent = true; a.material.opacity = .85; a.position.set((K.rnd() - .5) * 600, 2 + K.rnd() * 6, -360 - K.rnd() * 120); jauh.add(a); }
}

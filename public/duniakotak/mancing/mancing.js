// Mancing Kotak (Huda 18 Nov 2026: "Buatkan saya game mancing untuk Dunia Kotak persis seperti Pelari Kalcer dan Reli").
// Lomba mancing 90 detik dari ujung dermaga. Alur & pola SAMA dengan Reli Kotak: lobi ringkas (lokasi, rekor, posisi, joran, peringkat 3
// teratas), hitung mundur, main, pop up hasil 4 kotak angka; 2 POST per sesi (mulai & selesai), lobi pakai GET publik ber-cache.
// Cara main (santai, tanpa kalah): TAHAN tombol untuk mengisi tenaga lemparan, LEPAS untuk melempar → tunggu pelampung TENGGELAM →
// ketuk TARIK! → TAHAN GULUNG untuk menarik ikan, lepas sebentar kalau meter tegangan merah. Senar tidak pernah putus: kalau terlalu
// tegang senar kendor sebentar dan ikan menjauh sedikit. Ikan yang lepas umpan cukup dilempar lagi.
// Rekor = total berat ikan (gram) dalam satu sesi, per lokasi. Masuk dari gapura Mancing Kotak di Dermaga Kotak Tlaga (tombol 🏆 Lomba).
// 3 lokasi: 1 Danau Tlaga, 2 Sungai Wetan, 3 Laut Segara. Lokasi 2–3 terkunci sampai warga selesai satu sesi di lokasi 1.
// Ikan & benda di sini nama umum ikan Nusantara, tanpa merek/karakter berhak cipta. Tamu boleh latihan tanpa rekor/koin.
import '../mabar/js/putar.js'; // HP tegak -> tampil mendatar, sama seperti game desa & Reli Kotak
import * as THREE from 'three';
import {warga, pose} from '../mabar/js/aset/avatar.js';
import {ikanMesh, perahu} from './model.js?v=20261118m';   // ikan per jenis & perahu

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const baca = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const simpan = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const kgTeks = g => (g / 1000).toFixed(2).replace('.', ',') + ' kg';
const kgPendek = g => !(g > 0) ? '–' : g >= 10000 ? (g / 1000).toFixed(1).replace('.', ',') + ' kg' : kgTeks(g);
const jamTeks = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let AKUN = null; { const w = baca('dk_warga'); if (w && w.kunci) AKUN = {no: w.no, kunci: w.kunci, ig: w.ig}; }
const LOKAL = Object.assign({rk: {}, pos: {}, av: null, buka: 1}, baca('dk_mancing') || {});   // cache di HP: rekor & posisi per lokasi, avatar, lokasi terbuka
for (const k of ['rk', 'pos']) if (!LOKAL[k] || typeof LOKAL[k] !== 'object') LOKAL[k] = {};
const DURASI = 90, KOIN_SESI = 10, TAMBAHAN = 20;   // detik main; detik tambahan maksimal untuk menyelesaikan tarikan saat waktu habis

// ---------- suara kecil (WebAudio, tanpa file) ----------
let AC = null;
function siapSuara() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} }
function bunyi(fr = 660, d = .08, tipe = 'square', v = .05) {
  try { if (!AC) return; const o = AC.createOscillator(), g = AC.createGain();
    o.type = tipe; o.frequency.value = fr; g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d);
    o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d + .02); } catch (e) {}
}
function cebur(v = .12) {   // bunyi "plung" pelampung jatuh ke air
  try { if (!AC) return; const n = AC.sampleRate * .25 | 0, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = v;
    s.buffer = b; s.connect(f).connect(g).connect(AC.destination); s.start(); } catch (e) {}
}
const getar = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

// ---------- API (hemat: lobi pakai GET publik yang di-cache server; POST hanya saat mulai & selesai) ----------
async function apiM(op, data = {}) {
  try {
    if (!op) { const r = await fetch('/duniakotak/api/mancing?l=' + L_NO); return await r.json(); }
    const r = await fetch('/duniakotak/api/mancing', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({kunci: AKUN.kunci, op, l: L_NO, ...data})});
    const j = await r.json(); if (r.status === 401) { AKUN = null; } return j;
  } catch (e) { return {galat: 'Sinyal putus. Coba lagi sebentar.'}; }
}

// =====================================================================
// 1. LOKASI & IKAN
// =====================================================================
// ikan: [nama, ikon, kg min, kg maks, peluang, warna badan, warna perut, panjang dasar]; kg 0 = sampah (lucu, tidak dihitung ekor)
const LOKASI = [
  {nama: 'Danau Tlaga', ikon: '🏞️', judul: 'DERMAGA KOTAK TLAGA', jenis: 'danau', langit: 0x8fd0f2, kabut: 0xb4dcf0, air: 0x3a92d8, jauh: 26,
    ikan: [['Nila', '🐟', .2, 1.1, 30, 0x7e8e9e, 0xd8dde2, 1], ['Mujair', '🐟', .15, .6, 24, 0x5d6e5a, 0xc8d0b8, .85], ['Lele', '🐟', .3, 2, 12, 0x46464e, 0x9a9aa2, 1.3],
      ['Gurami', '🐠', .6, 3, 12, 0xb09a6a, 0xeee0b8, 1.2], ['Ikan Mas', '🐠', .5, 3.5, 9, 0xf09a2a, 0xffd27a, 1.15], ['Patin', '🐟', 1, 5, 6, 0xaab4c0, 0xf0f2f4, 1.6],
      ['Sepatu butut', '👟', 0, 0, 4, 0x6a4a3a, 0xe8e0d0, .9]]},
  {nama: 'Sungai Wetan', ikon: '🌾', judul: 'TEPI SUNGAI KOTAK WETAN', jenis: 'sungai', langit: 0x9ad6ff, kabut: 0xc2e6f8, air: 0x4a9ac0, jauh: 22,
    ikan: [['Wader', '🐟', .05, .2, 30, 0xb8c4c8, 0xf4f6f6, .6], ['Nilem', '🐟', .1, .4, 20, 0x6a8a7a, 0xd0dcd0, .8], ['Betok', '🐟', .1, .35, 15, 0x5a6a3a, 0xc8c890, .7],
      ['Belut', '🐍', .2, 1, 10, 0x6a5a2a, 0xb8a060, 1.4], ['Gabus', '🐟', .5, 3.5, 9, 0x3e4a3a, 0xa8b098, 1.3], ['Baung', '🐟', .6, 4, 7, 0x8a7a6a, 0xe0d8c8, 1.35],
      ['Kaleng bekas', '🥫', 0, 0, 4, 0xc0c4c8, 0xe0503a, .7]]},
  {nama: 'Laut Segara', ikon: '🌊', judul: 'PELABUHAN KOTAK SEGARA', jenis: 'laut', langit: 0x86ccff, kabut: 0xbfe4fa, air: 0x2a7ec8, jauh: 30,
    ikan: [['Ikan Layang', '🐟', .1, .4, 25, 0x4a7aa8, 0xe4eef6, .8], ['Baronang', '🐠', .3, 1.5, 18, 0x9a8a5a, 0xe8e0c0, 1], ['Cumi', '🦑', .2, 1, 12, 0xf0c8c0, 0xfff0ea, .9],
      ['Tongkol', '🐟', 1, 4, 15, 0x2a4a7a, 0xd8e0ea, 1.3], ['Kakap Merah', '🐠', 1, 6, 10, 0xd8443a, 0xffc8b8, 1.4], ['Kerapu', '🐠', 1, 8, 8, 0x8a5a3a, 0xe0b890, 1.5],
      ['Tenggiri', '🐟', 2, 10, 5, 0x6a8ab0, 0xeef2f6, 2], ['Botol plastik', '🧴', 0, 0, 3, 0x8ad0e8, 0xffffff, .8]]},
];
const NL = Math.max(1, Math.min(LOKASI.length, Math.floor(+new URLSearchParams(location.search).get('l') || baca('dk_mancing_l') || 1)));
const L_NO = NL <= (LOKAL.buka >= 3 ? 3 : 1) ? NL : 1, LT = LOKASI[L_NO - 1];   // lokasi terkunci → kembali ke lokasi 1
const KG_MAKS = Math.max(...LT.ikan.map(i => i[3]));
function undiIkan(jauh) {   // jauh 0..1: lemparan jauh = peluang ikan besar lebih tinggi
  const bobot = LT.ikan.map(i => i[4] * (1 + jauh * 1.6 * (i[3] / KG_MAKS)));
  let r = Math.random() * bobot.reduce((a, b) => a + b, 0), k = 0; while (r > bobot[k] && k < bobot.length - 1) r -= bobot[k++];
  const i = LT.ikan[k], u = Math.random() ** (2.1 - jauh * .8);
  return {nama: i[0], ikon: i[1], g: i[3] ? Math.round((i[2] + (i[3] - i[2]) * u) * 1000) : 0, warna: i[5], perut: i[6], pj: i[7], kuat: i[3] ? .55 + 1.5 * (i[2] + (i[3] - i[2]) * u) / KG_MAKS : .25};
}

// =====================================================================
// 2. DUNIA 3D: dermaga kayu menjorok ke air, avatar warga di ujung dermaga menghadap air (-z)
// =====================================================================
const R = new THREE.WebGLRenderer({canvas: $('kanvas'), antialias: true, powerPreference: 'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputColorSpace = THREE.SRGBColorSpace;
const sc = new THREE.Scene(); sc.background = new THREE.Color(LT.langit); sc.fog = new THREE.Fog(LT.kabut, 70, LT.jenis === 'laut' ? 320 : 230);
const cam = new THREE.PerspectiveCamera(55, 1, .2, 700);
sc.add(new THREE.HemisphereLight(0xffffff, 0x6a9a7a, 1.25));
const MATAHARI = new THREE.DirectionalLight(0xfff0d0, 2.2); MATAHARI.position.set(-18, 30, 14); MATAHARI.castShadow = true; MATAHARI.shadow.mapSize.set(1024, 1024);
Object.assign(MATAHARI.shadow.camera, {left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 90}); MATAHARI.shadow.bias = -.0008; MATAHARI.shadow.normalBias = .3;
MATAHARI.target.position.set(0, 0, -6); sc.add(MATAHARI, MATAHARI.target);
const matS = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .85, ...o});
const kotak = (w, h, d, c, x = 0, y = 0, z = 0, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || matS(c)); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
function teksTex(w, h, isi, latar = '#2c3150', warna = '#ffffff') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = latar; g.fillRect(0, 0, w, h);
  g.fillStyle = warna; g.textAlign = 'center'; g.textBaseline = 'middle'; let u = h * .62; g.font = `900 ${u}px Montserrat, system-ui, sans-serif`;
  while (g.measureText(isi).width > w * .9 && u > 8) { u -= 2; g.font = `900 ${u}px Montserrat, system-ui, sans-serif`; }
  g.fillText(isi, w / 2, h / 2 + 2); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let acak = 7 + L_NO * 101; const rnd = () => { acak = (acak * 16807) % 2147483647; return (acak - 1) / 2147483646; };   // pemandangan tetap tiap lokasi

// ---- air: bidang berombak pelan (low-poly) ----
const AIR_W = LT.jenis === 'sungai' ? 600 : 700, AIR_D = LT.jenis === 'sungai' ? 44 : 520;
const AIR_Z = LT.jenis === 'sungai' ? -14 : LT.jenis === 'danau' ? -60 : -200;
const geoAir = new THREE.PlaneGeometry(AIR_W, AIR_D, LT.jenis === 'sungai' ? 90 : 70, LT.jenis === 'sungai' ? 10 : 70); geoAir.rotateX(-Math.PI / 2);
const AIR = new THREE.Mesh(geoAir, matS(LT.air, {roughness: .25, metalness: .05, flatShading: true, transparent: true, opacity: .93}));
AIR.position.set(0, 0, AIR_Z); AIR.receiveShadow = true; sc.add(AIR);
const AIR0 = Float32Array.from(geoAir.attributes.position.array);
function ombak(t) {
  const p = geoAir.attributes.position.array, kuat = LT.jenis === 'laut' ? .28 : .1;
  for (let i = 0; i < p.length; i += 3) { const x = AIR0[i], z = AIR0[i + 2] + AIR_Z; p[i + 1] = kuat * (Math.sin(x * .21 + t * 1.3) + Math.cos(z * .17 + t * .9)) + (LT.jenis === 'sungai' ? .06 * Math.sin(x * .5 - t * 3) : 0); }
  geoAir.attributes.position.needsUpdate = true; geoAir.computeVertexNormals();
}
const tinggiAir = (x, z, t) => (LT.jenis === 'laut' ? .28 : .1) * (Math.sin(x * .21 + t * 1.3) + Math.cos(z * .17 + t * .9));

// ---- daratan & pemandangan per lokasi ----
const dasar = kotak(1400, .4, 1400, LT.jenis === 'laut' ? 0xe2cf98 : 0x5f9e44, 0, -1.6, 0); dasar.castShadow = false; sc.add(dasar);   // dasar air/tanah jauh
const pohon = (x, z, s = 1, kelapa = false) => { const g = new THREE.Group();
  if (kelapa) { g.add(kotak(.5, 6, .5, 0x8a6a3a, 0, 3, 0)); for (let k = 0; k < 5; k++) { const d = kotak(.5, .15, 3.2, 0x3a9a3a, 0, 6, 1.3); const p = new THREE.Group(); p.add(d); p.rotation.y = k * 1.256; p.rotation.x = .25; p.position.y = 0; g.add(p); } }
  else { g.add(kotak(.6, 2.2, .6, 0x7a5232, 0, 1.1, 0)); const c = [0x3f9a42, 0x4cae4a, 0x2f8a3e][Math.floor(rnd() * 3)]; g.add(kotak(2.8, 2.4, 2.8, c, 0, 3.2, 0), kotak(1.9, 1.4, 1.9, c, 0, 4.9, 0)); }
  g.position.set(x, 0, z); g.scale.setScalar(s); sc.add(g); return g; };
const rumah = (x, z, ry = 0, s = 1) => { const g = new THREE.Group(), c = [0xf4ecd8, 0xe8d8b8, 0xd8e4f0, 0xf0d8c8][Math.floor(rnd() * 4)], a = [0xc8553d, 0x3a7ad8, 0x3aa860, 0xe0a020][Math.floor(rnd() * 4)];
  g.add(kotak(5, 3.2, 5, c, 0, 1.6, 0), kotak(5.8, 1, 5.8, a, 0, 3.6, 0), kotak(3.6, .8, 3.6, a, 0, 4.4, 0), kotak(1.1, 1.9, .1, 0x7a5232, 0, .95, 2.52));
  g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); sc.add(g); return g; };
const darat = (x, z, w, d, c = 0x6aae4c, y = .25) => { const m = kotak(w, 1.2, d, c, x, y - .6, z); m.castShadow = false; sc.add(m); return m; };
const PERAHU = [];   // perahu yang terayun ombak
if (LT.jenis === 'danau') {
  // danau elips: tepi rumput & pasir di sekeliling, rumah warga & pohon di tepi seberang, bukit di belakang
  const rx = 95, rz = 70, cz = AIR_Z + 10;
  for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2, x = Math.cos(a) * (rx + 14), z = cz + Math.sin(a) * (rz + 14);
    const m = darat(x, z, 34, 34, 0x6aae4c); m.rotation.y = -a; const p = darat(Math.cos(a) * (rx + 2), cz + Math.sin(a) * (rz + 2), 10, 14, 0xd8c08a, .12); p.rotation.y = -a;
    if (z < 6 || Math.abs(x) > 18) { pohon(Math.cos(a) * (rx + 9 + rnd() * 6), cz + Math.sin(a) * (rz + 9 + rnd() * 6), .9 + rnd() * .5); if (k % 3 === 0) rumah(Math.cos(a) * (rx + 20), cz + Math.sin(a) * (rz + 20), -a - Math.PI / 2, .9); } }
  for (let k = 0; k < 7; k++) { const b = kotak(60 + rnd() * 40, 14 + rnd() * 18, 30, [0x4f8a48, 0x5a9a52, 0x46804a][k % 3], -180 + k * 60, 4, cz - rz - 60 - rnd() * 30); b.castShadow = false; sc.add(b); }
  for (let k = 0; k < 14; k++) { const t = kotak(1.6, .08, 1.6, 0x4caa50, -24 + rnd() * 48, .1, -6 - rnd() * 40); t.rotation.y = rnd() * 3; sc.add(t); }   // daun teratai
  const pr = perahu('sampan', 0x3a9a8a); pr.position.set(-22, .05, -30); pr.rotation.y = .6; sc.add(pr); const p2 = perahu('sampan', 0xe0a020); p2.position.set(30, .05, -48); p2.rotation.y = -1.1; sc.add(p2); PERAHU.push(pr, p2);
} else if (LT.jenis === 'sungai') {
  { const pr = perahu('sampan', 0x3a7ad8); pr.position.set(-26, .05, -6); pr.rotation.y = 1.4; sc.add(pr); PERAHU.push(pr); }
  // sungai mengalir ke samping: tepi dekat (tempat dermaga) & tepi seberang dengan sawah, pohon, rumah, gunung
  darat(0, 30, 900, 40, 0x6aae4c); darat(0, -66, 900, 60, 0x6aae4c);
  for (let k = 0; k < 30; k++) { const s = kotak(14, .3, 10, k % 2 ? 0x8ccf4a : 0x9ad85a, -200 + k * 14, .32, -48); s.castShadow = false; sc.add(s); }   // petak sawah seberang
  for (let k = 0; k < 26; k++) pohon(-160 + k * 13 + rnd() * 4, -40 + rnd() * 2, .8 + rnd() * .4);
  for (let k = 0; k < 7; k++) rumah(-110 + k * 34 + rnd() * 8, -70, 0, .9);
  for (let k = 0; k < 6; k++) { const g = kotak(90, 30 + rnd() * 30, 40, [0x4a7a52, 0x56865a][k % 2], -220 + k * 90, 8, -150); g.castShadow = false; sc.add(g); }
  for (let k = 0; k < 18; k++) pohon(-90 + k * 10 + rnd() * 3, 14 + rnd() * 4, .7 + rnd() * .3);
  for (let k = 0; k < 20; k++) sc.add(kotak(.25, 1 + rnd(), .25, 0x5a8a3a, -30 + rnd() * 60, .4, 8.8 + rnd() * 1.2));   // rumput tinggi tepi
} else {
  // laut lepas: pantai di belakang, menara apartemen Segara di kanan, pulau kecil & perahu nelayan di kejauhan
  darat(0, 38, 900, 46, 0xe2cf98);
  for (let k = 0; k < 16; k++) pohon(-80 + k * 10 + rnd() * 4, 24 + rnd() * 6, .9, true);
  for (let k = 0; k < 6; k++) { const h = 22 + rnd() * 30, g = kotak(12, h, 12, [0xe8eef4, 0xd8e4f0, 0xf4ecd8][k % 3], 70 + k * 16, h / 2, -10 - k * 22); sc.add(g); sc.add(kotak(12.4, 1, 12.4, 0x3a7ad8, 70 + k * 16, h + .5, -10 - k * 22)); }
  for (let k = 0; k < 3; k++) { const x = -120 + k * 110, z = -230 - rnd() * 60; const p = kotak(40 + rnd() * 30, 10, 26, 0x5a9a52, x, 2, z); p.castShadow = false; sc.add(p); pohon(x, z, 1.4, true); }
  for (let k = 0; k < 3; k++) { const pr = perahu(k === 1 ? 'jukung' : 'kapal', [0x3a7ad8, 0xe0a020, 0x2a9a9a][k], k === 2 ? 0xe0503a : 0xf4f0e6); pr.position.set(-50 + k * 45, .1, -70 - k * 30); pr.rotation.y = k + .4; sc.add(pr); PERAHU.push(pr); }
}

// ---- dermaga kayu: dari darat (z +24) menjorok ke air sampai z 0 ----
const DERMAGA_Y = .75, DZ1 = LT.jenis === 'sungai' ? 12 : 24;
{ const g = new THREE.Group();
  for (let z = -1; z < DZ1; z += 1.1) g.add(kotak(4, .18, 1, (Math.round(z) % 2 ? 0x9a6a3a : 0xa8784a), 0, DERMAGA_Y, z + .5));
  for (let z = 0; z < DZ1; z += 4) for (const x of [-1.9, 1.9]) g.add(kotak(.35, 2.4, .35, 0x6a4426, x, -.3, z));
  for (const x of [-2.05, 2.05]) g.add(kotak(.18, .9, .18, 0x6a4426, x, DERMAGA_Y + .5, -.6), kotak(.12, .12, DZ1 - 2, 0x8a5a2a, x, DERMAGA_Y + .9, DZ1 / 2 + .3));
  // ember ikan & kursi lipat di samping avatar
  const ember = new THREE.Group(); ember.add(kotak(.8, .8, .8, 0x3a7ad8, 0, .4, 0), kotak(.7, .05, .7, 0x2a6ab0, 0, .78, 0)); ember.position.set(-1.2, DERMAGA_Y + .1, 1.6); g.add(ember);
  g.add(kotak(.9, .12, .9, 0x2a9a6a, 1.25, DERMAGA_Y + .55, 2.2), kotak(.9, .8, .1, 0x2a9a6a, 1.25, DERMAGA_Y + .95, 2.65));
  // papan nama lokasi di pangkal dermaga
  const pap = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1), new THREE.MeshBasicMaterial({map: teksTex(512, 116, '🎣 MANCING KOTAK · ' + LT.nama.toUpperCase(), '#2c3150', '#f2c14a')}));
  for (const x of [-2.3, 2.3]) g.add(kotak(.25, 3.2, .25, 0x6a4426, x, DERMAGA_Y + 1.5, DZ1 - 1)); pap.position.set(0, DERMAGA_Y + 2.7, DZ1 - 1.15); pap.rotation.y = Math.PI; g.add(pap);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); sc.add(g);
  // sampan warga ditambat di samping dermaga
  const sp = perahu(LT.jenis === 'laut' ? 'jukung' : 'sampan', LT.jenis === 'laut' ? 0x2a9a9a : 0xc8553d); sp.position.set(LT.jenis === 'laut' ? -6.2 : -4.3, .05, 7.5); sp.rotation.y = .06; sc.add(sp); PERAHU.push(sp); }

// ---- avatar warga (asli dari akun) + joran ----
const JORAN = [{id: 'bambu', nama: 'Joran Bambu', ikon: '🎋', batang: 0xc8a050, ruas: 0x8a6a2a}, {id: 'karbon', nama: 'Joran Karbon', ikon: '🎣', batang: 0x2a2c34, ruas: 0xe0503a},
  {id: 'juragan', nama: 'Joran Juragan', ikon: '✨', batang: 0xf2c14a, ruas: 0xffffff}];
const PELAMPUNG = [['merah', 0xe0503a], ['oranye', 0xf28a2a], ['hijau', 0x3aa860], ['biru', 0x3a7bd5], ['ungu', 0x8a5ad8]];
let joranPilih = Math.max(0, JORAN.findIndex(j => j.id === baca('dk_mancing_joran')));
let pelampungPilih = Math.max(0, PELAMPUNG.findIndex(p => p[0] === baca('dk_mancing_pelampung')));
const ORANG = new THREE.Group(); ORANG.position.set(0, DERMAGA_Y + .09, .9); sc.add(ORANG);
let AV = null;
function pasangAvatar(av) {
  ORANG.clear(); AV = null;
  try { const o = warga(av || {jenis: 'L', atasan: {jenis: 'kaos', warna: '#3a7bd5'}, topi: null}); const b = new THREE.Box3().setFromObject(o), h = b.max.y - b.min.y || 1, k = 1.75 / h;
    o.scale.setScalar(k); o.position.y = -b.min.y * k; o.rotation.y = Math.PI; o.traverse(m => { if (m.isMesh) m.castShadow = true; }); ORANG.add(o); AV = o; } catch (e) {}
}
pasangAvatar(LOKAL.av);
// joran = grup berporos di tangan kanan; ujungnya (UJUNG) dipakai menggambar senar
const POROS = new THREE.Group(); POROS.position.set(.42, DERMAGA_Y + 1.15, .3); sc.add(POROS);
const JORAN_P = 3.4; let UJUNG = new THREE.Object3D();
function pasangJoran() {
  POROS.clear(); const j = JORAN[joranPilih], g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.03, .065, JORAN_P, 6), matS(j.batang, {roughness: .5})); b.position.y = JORAN_P / 2; b.castShadow = true; g.add(b);
  g.add(kotak(.16, .55, .16, 0x1d1e24, 0, .3, 0));                                   // gagang
  const rl = kotak(.26, .26, .22, j.ruas, .14, .62, 0); g.add(rl);                    // gulungan (reel)
  for (let k = 1; k <= 3; k++) g.add(kotak(.08, .05, .08, j.ruas, 0, JORAN_P * k / 4, 0));
  UJUNG = new THREE.Object3D(); UJUNG.position.y = JORAN_P; g.add(UJUNG); POROS.add(g); POROS.userData.reel = rl;
}
pasangJoran();
// pelampung + senar
const PL = new THREE.Group(); { const c = PELAMPUNG[pelampungPilih][1];
  const a = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), matS(c, {roughness: .4})), bw = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), matS(0xffffff, {roughness: .4}));
  PL.add(a, bw, kotak(.03, .3, .03, 0x1d1e24, 0, .26, 0)); PL.userData.atas = a; } PL.visible = false; sc.add(PL);
function warnaPelampung() { PL.userData.atas.material.color.setHex(PELAMPUNG[pelampungPilih][1]); }
const N_SENAR = 22, geoSenar = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_SENAR * 3), 3));
const SENAR = new THREE.Line(geoSenar, new THREE.LineBasicMaterial({color: 0xf4f4f4, transparent: true, opacity: .85})); SENAR.frustumCulled = false; SENAR.visible = false; sc.add(SENAR);
// tanda seru di atas pelampung saat ikan menyambar
const SERU = new THREE.Sprite(new THREE.SpriteMaterial({map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#ffd23a'; g.strokeStyle = '#1d1e24'; g.lineWidth = 8; g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#1d1e24'; g.fillRect(55, 26, 18, 52); g.fillRect(55, 88, 18, 16); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), depthTest: false})); SERU.scale.set(1.3, 1.3, 1); SERU.visible = false; sc.add(SERU);
// riak air (cincin) di pelampung
const RIAK = []; for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 24), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0, depthWrite: false})); m.rotation.x = -Math.PI / 2; m.userData.t = 9; sc.add(m); RIAK.push(m); }
function riak(x, z, besar = 1) { const m = RIAK.find(r => r.userData.t > 1.2) || RIAK[0]; m.position.set(x, .12, z); m.userData.t = 0; m.userData.b = besar; }
// ikan yang sedang ditarik (muncul saat dekat) & ikan di tangan saat tertangkap
let IKAN3D = null;
function pasangIkan3D(f) { if (IKAN3D) sc.remove(IKAN3D); IKAN3D = ikanMesh(f); IKAN3D.userData.s0 = IKAN3D.scale.x; IKAN3D.visible = false; IKAN3D.traverse(m => { if (m.isMesh) { m.castShadow = true; for (const mt of [].concat(m.material)) if (mt.emissive) mt.emissive.setHex(0x303030); } }); sc.add(IKAN3D); }

// =====================================================================
// 3. PERMAINAN
// =====================================================================
// MODE: lobi | hitung | siap (siap lempar) | isi (menahan, mengisi tenaga) | terbang | tunggu | sambar | tarik | dapat | habis
let MODE = 'lobi', sisa = DURASI, tambahan = 0, totalG = 0, ekor = 0, terbesar = null, TANGKAP = [];
const S = {kuat: 0, kuatT: 0, tx: 0, tz: -10, jauh: 0, tTunggu: 0, sambarT: 0, getarN: 0, ikan: null, jarak: 0, jarak0: 0, tegang: 0, kendor: 0, lawan: 0, lawanT: 0, tahan: false, tTerbang: 0, ayun: 0, tDapat: 0, klik: 0, pesanT: 0};
const JALAN_AWAL = new THREE.Vector3();
function petunjuk(t) { const p = $('petunjuk'); if (p._t !== t) { p._t = t; p.textContent = t; } }
function kabar(t, ms = 2200, kelas = '') { const k = $('kabar'); if (k.childElementCount > 1) k.firstChild.remove(); const d = document.createElement('div'); d.className = 'kaca ' + kelas; d.textContent = t; d.style.animationDuration = ms + 'ms'; k.append(d); setTimeout(() => d.remove(), ms); }
function tombol(ikon, teks, kecil, kelas = '') { const b = $('bAksi'); b.className = kelas; b.querySelector('i').textContent = ikon; $('bAksiT').textContent = teks; $('bAksiK').textContent = kecil; }
function meter(on, nilai = 0, kelas = '', label = '') { const m = $('meter'); m.style.visibility = on ? 'visible' : 'hidden'; m.className = kelas; m.firstElementChild.style.height = Math.round(Math.max(0, Math.min(1, nilai)) * 100) + '%'; $('meterL').textContent = label; }
function tulisTangkap() { $('tBerat').textContent = kgTeks(totalG); $('tEkor').textContent = ekor + ' EKOR' + (terbesar ? ' · TERBESAR ' + kgPendek(terbesar.g) : ''); }
function tampilHUD(on) { for (const id of ['keluar', 'jam', 'tangkap', 'petunjuk', 'kendali']) $(id).hidden = !on; $('lobi').hidden = on; $('dompet').hidden = on || !$('dompet').textContent; }
function keSiap() {
  MODE = 'siap'; PL.visible = SENAR.visible = SERU.visible = false; if (IKAN3D) IKAN3D.visible = false; S.tahan = false;
  tombol('🎣', 'LEMPAR', 'TAHAN · LEPAS'); meter(false); petunjuk('Tahan tombol untuk isi tenaga, lepas untuk melempar. Makin jauh, peluang ikan besar makin tinggi.');
}
function lempar() {
  MODE = 'terbang'; S.jauh = S.kuat; const d = 5 + S.kuat * (LT.jauh - 5); S.tx = (Math.random() - .5) * (2 + d * .35); S.tz = ORANG.position.z - 1 - d;
  S.tTerbang = 0; S.ayun = 1; PL.visible = SENAR.visible = true; bunyi(520, .1, 'triangle', .05); bunyi(780, .12, 'triangle', .04);
  tombol('⏳', 'TUNGGU', 'IKAN MENDEKAT', 'tunggu'); meter(false); petunjuk('Tunggu pelampung tenggelam, lalu langsung ketuk TARIK!');
}
function mulaiTunggu() { MODE = 'tunggu'; S.tTunggu = .9 + Math.random() * 2.3 - S.jauh * .3; S.getarN = Math.floor(Math.random() * 3); S.ikan = undiIkan(S.jauh); cebur(); riak(S.tx, S.tz, 1.4); }
function sambar() { MODE = 'sambar'; S.sambarT = 1.6; SERU.visible = true; bunyi(990, .1, 'square', .07); bunyi(1320, .14, 'square', .06); getar(80); riak(S.tx, S.tz, 2);
  tombol('❗', 'TARIK!', 'KETUK SEKARANG', 'tarik'); petunjuk('Pelampung tenggelam! Ketuk TARIK!'); }
function mulaiTarik() {
  MODE = 'tarik'; SERU.visible = false; S.jarak0 = S.jarak = Math.hypot(S.tx, S.tz - ORANG.position.z); S.tegang = .25; S.kendor = 0; S.lawan = 0; S.lawanT = 1 + Math.random() * 2; S.tahan = false;
  pasangIkan3D(S.ikan); bunyi(660, .08); getar(40);
  tombol('🌀', 'GULUNG', 'TAHAN', 'gulung'); petunjuk(S.ikan.g ? 'Tahan GULUNG untuk menarik. Kalau meter merah, lepas sebentar.' : 'Kok ringan ya… gulung saja!');
}
function lepasUmpan(t) { MODE = 'gulungKosong'; SERU.visible = false; S.tDapat = .7; kabar(t, 2000); bunyi(300, .18, 'triangle', .05); tombol('⏳', '…', 'MENGGULUNG', 'tunggu'); }
function dapatIkan() {
  const f = S.ikan; MODE = 'dapat'; S.tDapat = 1.5;
  if (f.g) { totalG += f.g; ekor++; if (!terbesar || f.g > terbesar.g) terbesar = f; TANGKAP.push(f); }
  tulisTangkap(); getar([40, 40, 60]);
  if (f.g) { bunyi(880, .1, 'triangle', .06); setTimeout(() => bunyi(1175, .12, 'triangle', .06), 90); setTimeout(() => bunyi(1568, .2, 'triangle', .06), 190); kabar(`${f.ikon} ${f.nama} · ${kgTeks(f.g)}${terbesar === f && ekor > 1 ? ' · TERBESAR!' : ''}`, 2000, 'ikan'); }
  else { bunyi(330, .2, 'sawtooth', .04); kabar(`${f.ikon} Dapat ${f.nama.toLowerCase()}… he he. Tidak dihitung ya`, 2200); }
  tombol('✨', 'DAPAT!', f.g ? kgTeks(f.g) : 'SAMPAH', 'gulung'); meter(false); SENAR.visible = false; PL.visible = false;
}
// ---------- kontrol: satu tombol besar (tahan/lepas), keyboard Spasi/Enter ----------
function tekan() {
  if (MODE === 'siap') { MODE = 'isi'; S.kuat = 0; S.kuatT = 0; S.tahan = true; tombol('💪', 'LEPAS!', 'UNTUK MELEMPAR'); return; }
  if (MODE === 'tunggu') { if (performance.now() - S.pesanT > 1500) { S.pesanT = performance.now(); kabar('Sabar… tunggu pelampung tenggelam', 1400); } return; }
  if (MODE === 'sambar') { mulaiTarik(); S.tahan = true; return; }
  if (MODE === 'tarik') S.tahan = true;
}
function lepas() {
  if (MODE === 'isi') { lempar(); return; }
  S.tahan = false;
}
{ const b = $('bAksi'); let id = null;
  b.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; b.setPointerCapture?.(e.pointerId); b.classList.add('tekan'); siapSuara(); tekan(); });
  const off = e => { if (e && id !== null && e.pointerId !== id) return; id = null; b.classList.remove('tekan'); lepas(); };
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(t, off);
  b.addEventListener('contextmenu', e => e.preventDefault()); }
let tKey = false;
addEventListener('keydown', e => { if (e.code === 'Space' || (e.code === 'Enter' && MODE !== 'lobi' && MODE !== 'habis')) { e.preventDefault(); if (!tKey) { tKey = true; siapSuara(); tekan(); } } else if (e.code === 'Enter' && MODE === 'lobi') mulaiSesi(); });
addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'Enter') { tKey = false; lepas(); } });
addEventListener('blur', () => { tKey = false; S.tahan = false; if (MODE === 'isi') lempar(); });

// ---------- langkah permainan tiap frame ----------
const _v = new THREE.Vector3(), _u = new THREE.Vector3();
function langkah(dt, t) {
  const main = MODE !== 'lobi' && MODE !== 'hitung' && MODE !== 'habis';
  if (main) {
    if (sisa > 0) { sisa -= dt; if (sisa <= 0) { sisa = 0; if (MODE === 'tarik' || MODE === 'sambar' || MODE === 'dapat') { tambahan = TAMBAHAN; $('jam').classList.add('habis'); $('jKet').textContent = 'WAKTU HABIS · SELESAIKAN!'; kabar('⏰ Waktu habis! Selesaikan ikan terakhir', 2000); } else return selesaiSesi(); } }
    else { tambahan -= dt; if (tambahan <= 0 && MODE !== 'dapat') return selesaiSesi(); }
    $('jWaktu').textContent = jamTeks(sisa > 0 ? sisa : 0);
  }
  // tenaga lemparan: naik-turun bolak-balik selama ditahan
  if (MODE === 'isi') { S.kuatT += dt; const f = (S.kuatT / 1.4) % 2; S.kuat = f < 1 ? f : 2 - f; meter(true, S.kuat, 'kuat', Math.round(5 + S.kuat * (LT.jauh - 5)) + ' m'); S.ayun = -S.kuat * .9; }
  if (MODE === 'terbang') {
    S.tTerbang += dt / .75; const k = Math.min(1, S.tTerbang); UJUNG.getWorldPosition(_v);
    PL.position.set(_v.x + (S.tx - _v.x) * k, _v.y + (0 - _v.y) * k + Math.sin(k * Math.PI) * (2 + S.jauh * 5), _v.z + (S.tz - _v.z) * k);
    if (k >= 1) mulaiTunggu();
  }
  if (MODE === 'tunggu' || MODE === 'sambar' || MODE === 'tarik' || MODE === 'gulungKosong') {
    let dip = 0;
    if (MODE === 'tunggu') { S.tTunggu -= dt; if (S.getarN > 0 && S.tTunggu < S.getarN * .7) { S.getarN--; dip = .12; riak(S.tx, S.tz, .7); bunyi(420, .05, 'triangle', .03); } if (S.tTunggu <= 0) sambar(); }
    if (MODE === 'sambar') { S.sambarT -= dt; dip = .45 + .1 * Math.sin(t * 30); if (S.sambarT <= 0) lepasUmpan('Ikannya makan umpan lalu kabur 😅 Lempar lagi!'); }
    if (MODE === 'gulungKosong') { S.tDapat -= dt; const k = Math.max(0, S.tDapat / .7); POROS.getWorldPosition(_u); S.tx = _u.x + (S.tx - _u.x) * Math.min(1, k + .2); S.tz = ORANG.position.z - 1 + (S.tz - ORANG.position.z + 1) * Math.min(1, k + .2); if (S.tDapat <= 0) keSiap(); }
    if (MODE === 'tarik') {
      const f = S.ikan, kuat = f.kuat;
      S.lawanT -= dt; if (S.lawanT <= 0) { if (S.lawan > 0) { S.lawan = 0; S.lawanT = 1.2 + Math.random() * 2.2 / Math.max(.6, kuat); } else if (f.g) { S.lawan = .7 + Math.random() * .6; S.lawanT = S.lawan; bunyi(250, .08, 'sawtooth', .03); getar(30); } }
      if (S.kendor > 0) { S.kendor -= dt; S.tahan = false; }
      if (S.tahan && S.kendor <= 0) {
        S.jarak -= Math.max(2.6, 6.2 - kuat * 1.7) * dt * (S.lawan > 0 ? .45 : 1);
        S.tegang += (.12 + .22 * kuat + (S.lawan > 0 ? .7 * kuat : 0)) * dt;
        S.klik += dt; if (S.klik > .07) { S.klik = 0; bunyi(1800 + Math.random() * 200, .015, 'square', .02); }
      } else { S.tegang -= .8 * dt; S.jarak = Math.min(S.jarak0 + 3, S.jarak + kuat * (S.lawan > 0 ? 1.6 : .5) * dt); }
      S.tegang = Math.max(0, S.tegang);
      if (S.tegang >= 1) { S.tegang = .78; S.kendor = 1; S.jarak = Math.min(S.jarak0 + 3, S.jarak + 1.5); kabar('〰️ Senar kendor sebentar, ikannya menjauh', 1500); bunyi(200, .2, 'triangle', .05); getar(60); }
      const k = S.jarak / Math.max(.1, Math.hypot(S.tx, S.tz - ORANG.position.z)); S.tx *= Math.min(1.2, k); S.tz = ORANG.position.z + (S.tz - ORANG.position.z) * Math.min(1.2, k);
      S.tx += Math.sin(t * (1.5 + kuat)) * dt * (S.lawan > 0 ? 3 : .8) * (f.g ? 1 : 0);
      meter(true, S.tegang, S.tegang > .82 ? 'bahaya' : S.tegang > .6 ? 'awas' : '', Math.max(0, S.jarak).toFixed(1).replace('.', ',') + ' m');
      petunjuk(S.kendor > 0 ? 'Senar kendor… tunggu sebentar, lalu tahan GULUNG lagi.' : S.lawan > 0 ? '🐟 Ikan melawan! Lepas dulu kalau meter merah.' : S.tegang > .82 ? 'Meter merah! Lepas sebentar.' : 'Tahan GULUNG untuk menarik ikan.');
      $('bAksi').classList.toggle('tekan', S.tahan);
      if (S.jarak <= .8) dapatIkan();
    }
    const yAir = tinggiAir(S.tx, S.tz, t);
    PL.position.set(S.tx, yAir + .05 - dip + (MODE === 'tunggu' ? .03 * Math.sin(t * 2.4) : 0) - (MODE === 'tarik' ? .15 + S.tegang * .2 : 0), S.tz);
    // ikan terlihat di bawah permukaan saat dekat (<7 m), menggelepar
    if (MODE === 'tarik' && IKAN3D) { IKAN3D.visible = S.jarak < 7; IKAN3D.position.set(S.tx, yAir - .45 + Math.max(0, 7 - S.jarak) * .04, S.tz - .3); IKAN3D.rotation.set(0, Math.PI + Math.sin(t * 9) * .4, 0); if (IKAN3D.userData.ekor) IKAN3D.userData.ekor.rotation.y = Math.sin(t * 18) * .5; }
    if (MODE === 'tarik' && Math.random() < dt * (S.lawan > 0 ? 6 : 1.5)) riak(S.tx, S.tz, S.lawan > 0 ? 1.4 : .8);
  }
  if (MODE === 'dapat') {
    S.tDapat -= dt; if (IKAN3D) { UJUNG.getWorldPosition(_v); IKAN3D.visible = true; const s0 = IKAN3D.userData.s0, k = THREE.MathUtils.smoothstep(1.5 - S.tDapat, .25, .7);   // ikan naik dari ujung joran lalu dipamerkan dekat kamera, tampak samping
      _v.y -= .45 + .5 * s0; cam.getWorldDirection(_u); _u.y = 0; _u.normalize(); const dx = cam.position.x + _u.x * 3.4 - _u.z * .7, dz = cam.position.z + _u.z * 3.4 + _u.x * .7;
      IKAN3D.position.set(_v.x + (dx - _v.x) * k, _v.y + (cam.position.y - .75 - _v.y) * k + Math.sin(t * 6) * .05, _v.z + (dz - _v.z) * k);
      IKAN3D.scale.setScalar(s0 * (1 + k * (Math.min(1.25, 1.5 / (1.1 * s0)) - 1)));
      IKAN3D.rotation.set((-Math.PI / 2 + .12) * (1 - k) + Math.sin(t * 3) * .12 * k, Math.atan2(_u.x, _u.z) + Math.PI / 2 * k + Math.sin(t * 14) * .2 * (1 - k), (t * 1.6) * (1 - k));
      if (IKAN3D.userData.ekor) IKAN3D.userData.ekor.rotation.y = Math.sin(t * 16) * .45; }
    if (S.tDapat <= 0) { if (IKAN3D) IKAN3D.visible = false; if (sisa <= 0) return selesaiSesi(); keSiap(); }
  }
  // ayunan joran: siap = tegak condong ke depan, isi = ditarik ke belakang, terbang = maju, tarik = melengkung naik-turun
  const target = MODE === 'isi' ? -S.kuat * .9 : MODE === 'terbang' ? .55 : MODE === 'tarik' ? -.25 - S.tegang * .35 + Math.sin(t * 14) * .03 * (S.lawan > 0 ? 3 : 1) : MODE === 'dapat' ? -.55 : .25;
  S.ayun += (target - S.ayun) * Math.min(1, dt * (MODE === 'terbang' ? 18 : 8));
  POROS.rotation.x = -(.75 - S.ayun);   // 0 rad = tegak; negatif = condong ke air (-z)
  if (POROS.userData.reel) POROS.userData.reel.rotation.x += (MODE === 'tarik' && S.tahan ? 18 : MODE === 'gulungKosong' ? 14 : 0) * dt;
  if (AV) { pose(AV, {armR: -1.05 - S.ayun * .35, armL: -.75, armLz: -.35, armRz: .05, head: MODE === 'tunggu' || MODE === 'sambar' ? .15 : 0, legL: 0, legR: 0}); }
  // senar: dari ujung joran ke pelampung, melengkung (kendor) kecuali saat ditarik tegang
  if (SENAR.visible) { UJUNG.getWorldPosition(_v); const p = geoSenar.attributes.position.array, ujung = PL.position, kendor = MODE === 'tarik' ? .3 * (1 - S.tegang) : MODE === 'terbang' ? .2 : 1.1;
    for (let i = 0; i < N_SENAR; i++) { const k = i / (N_SENAR - 1); p[i * 3] = _v.x + (ujung.x - _v.x) * k; p[i * 3 + 1] = _v.y + (ujung.y + .2 - _v.y) * k - Math.sin(k * Math.PI) * kendor * (MODE === 'terbang' ? .3 : 1); p[i * 3 + 2] = _v.z + (ujung.z - _v.z) * k; }
    geoSenar.attributes.position.needsUpdate = true; }
  if (SERU.visible) SERU.position.set(PL.position.x, PL.position.y + 1.4 + Math.sin(t * 10) * .1, PL.position.z);
  for (const r of RIAK) { r.userData.t += dt; const k = r.userData.t / 1.2; if (k > 1) { r.material.opacity = 0; continue; } const s = (.3 + k * 2.2) * (r.userData.b || 1); r.scale.set(s, s, s); r.material.opacity = .55 * (1 - k); }
}

// ---------- kamera: di belakang-kanan avatar, menatap ke arah pelampung ----------
const camLihat = new THREE.Vector3(0, 0, -12);
function kamera(dt, t) {
  let pos, lihat;
  if (MODE === 'lobi' || MODE === 'habis') { const a = Math.sin(t * .15) * .25; pos = _v.set(1.4 + Math.sin(a) * 6, DERMAGA_Y + 2.4, ORANG.position.z - Math.cos(a) * 6); lihat = _u.set(2.3, DERMAGA_Y + 1.4, ORANG.position.z); }   // dari arah air: wajah warga terlihat, warga di kanan layar (lobi di kiri)
  else { const fz = (MODE === 'tunggu' || MODE === 'sambar' || MODE === 'tarik' || MODE === 'gulungKosong') ? PL.position.z : -10;
    const jauhK = Math.min(1, Math.max(0, -fz / LT.jauh));
    pos = _v.set(2.4, DERMAGA_Y + 3.4 + jauhK * 1.6, ORANG.position.z + 5.2 + jauhK * 2); lihat = _u.set((MODE === 'tarik' ? PL.position.x : 0) * .5, 0, Math.min(-4, fz * .75)); }
  const k = Math.min(1, dt * (MODE === 'lobi' ? 2 : 3)); cam.position.lerp(pos, k); camLihat.lerp(lihat, k); cam.lookAt(camLihat);
}
cam.position.set(1.4, DERMAGA_Y + 2.4, ORANG.position.z - 6); camLihat.set(2.3, DERMAGA_Y + 1.4, ORANG.position.z);

// =====================================================================
// 4. ALUR: lobi → hitung mundur → mancing 90 detik → hasil
// =====================================================================
const terbuka = n => n === 1 || LOKAL.buka >= 3;
function tulisLokasi() {
  $('lJudul').textContent = `🎣 LOKASI ${L_NO} · ${LT.judul}`;
  $('lLokasi').innerHTML = LOKASI.map((x, i) => { const n = i + 1, b = terbuka(n); return `<button class="kaca ${n === L_NO ? 'pilih' : ''} ${b ? '' : 'kunci'}" data-l="${n}" aria-label="Lokasi ${n} ${esc(x.nama)}${b ? '' : ', terkunci'}"><i>${b ? x.ikon : '🔒'}</i>${esc(x.nama.split(' ')[0])}</button>`; }).join('');
}
$('lLokasi').addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (!b) return; const n = +b.dataset.l;
  if (!terbuka(n)) { kabar('🔒 Selesaikan satu sesi di Danau Tlaga dulu'); bunyi(220, .12); return; }
  if (n === L_NO) return; simpan('dk_mancing_l', n); const u = new URL(location.href); u.searchParams.set('l', n); location.href = u.toString(); });
function tulisLobi(top) {
  tulisLokasi();
  $('lRekor').textContent = kgPendek(LOKAL.rk[L_NO]); $('lPos').textContent = LOKAL.pos[L_NO] ? '#' + LOKAL.pos[L_NO] : AKUN ? '–' : 'Tamu';
  if (top) { const L = (top.top || []).slice(0, 3); $('lTop').innerHTML = L.length ? L.map((x, n) => `<span class="kaca ${AKUN && x.no === AKUN.no ? 'saya' : ''}">${['🥇', '🥈', '🥉'][n]} ${esc(x.u ? '@' + x.u : 'Warga ' + x.no)} ${kgPendek(x.g)}</span>`).join('') : '<span class="kaca">Belum ada rekor. Jadi yang pertama!</span>'; }
  $('lAturan').textContent = AKUN ? `${DURASI} detik, kejar ikan terberat · +${KOIN_SESI} 🪙 (3x sehari)` : 'Mode tamu: latihan. Masuk desa sebagai warga untuk rekor & 🪙';
}
function tulisJoran() { const j = JORAN[joranPilih]; $('lJoran').innerHTML = `<i>${j.ikon}</i>${esc(j.nama)}`; $('lJoran').setAttribute('aria-label', 'Ganti joran, sekarang ' + j.nama); }
$('lJoran').onclick = () => { joranPilih = (joranPilih + 1) % JORAN.length; simpan('dk_mancing_joran', JORAN[joranPilih].id); tulisJoran(); pasangJoran(); siapSuara(); bunyi(660, .06); }; tulisJoran();
PELAMPUNG.forEach(([n, c], i) => { const b = document.createElement('button'); b.className = 'titik'; b.style.background = '#' + c.toString(16).padStart(6, '0'); b.title = 'Pelampung ' + n; b.setAttribute('aria-label', 'Warna pelampung ' + n);
  if (i === pelampungPilih) b.classList.add('pilih'); b.onclick = () => { document.querySelectorAll('#lWarna .titik').forEach(x => x.classList.remove('pilih')); b.classList.add('pilih'); pelampungPilih = i; simpan('dk_mancing_pelampung', n); warnaPelampung(); siapSuara(); bunyi(880, .05); }; $('lWarna').append(b); });
tulisLobi(null);
apiM(null).then(j => { if (j && !j.galat) tulisLobi(j); });
let idSesi = 0;
async function mulaiSesi() {
  if (MODE !== 'lobi' && MODE !== 'habis') return; siapSuara();
  $('hasil').hidden = true; MODE = 'hitung'; tampilHUD(true); const id = ++idSesi;
  sisa = DURASI; tambahan = 0; totalG = 0; ekor = 0; terbesar = null; TANGKAP = []; tulisTangkap(); $('jWaktu').textContent = jamTeks(DURASI); $('jam').classList.remove('habis'); $('jKet').textContent = 'SISA WAKTU';
  tombol('🎣', 'SIAP…', ''); meter(false); petunjuk('Siapkan joranmu…'); PL.visible = SENAR.visible = SERU.visible = false;
  if (AKUN) apiM('mulai').then(j => { if (j && j.saya) { if (j.saya.buka > LOKAL.buka) { LOKAL.buka = j.saya.buka; simpan('dk_mancing', LOKAL); } if (j.saya.avatar && JSON.stringify(j.saya.avatar) !== JSON.stringify(LOKAL.av)) { LOKAL.av = j.saya.avatar; simpan('dk_mancing', LOKAL); pasangAvatar(LOKAL.av); } } });
  for (const t of ['3', '2', '1']) { if (id !== idSesi) return; $('hitung').hidden = false; $('hitung').innerHTML = `<b>${t}</b>`; bunyi(440, .18, 'square', .07); await new Promise(r => setTimeout(r, 800)); }
  if (id !== idSesi) return; $('hitung').innerHTML = '<b style="color:#9ef0a0">MANCING!</b>'; bunyi(880, .35, 'square', .08); setTimeout(() => { if (id === idSesi) $('hitung').hidden = true; }, 700);
  keSiap();
}
$('bMulai').onclick = mulaiSesi; $('bLagi').onclick = mulaiSesi;
$('keluar').onclick = () => { idSesi++; MODE = 'lobi'; $('hitung').hidden = true; PL.visible = SENAR.visible = SERU.visible = false; if (IKAN3D) IKAN3D.visible = false; tampilHUD(false); };
async function selesaiSesi() {
  if (MODE === 'habis') return; MODE = 'habis'; const id = idSesi, t0 = performance.now(); PL.visible = SENAR.visible = SERU.visible = false; if (IKAN3D) IKAN3D.visible = false;
  bunyi(1046, .3, 'triangle', .07); setTimeout(() => bunyi(1318, .5, 'triangle', .07), 160); kabar('⏰ WAKTU HABIS! ' + kgTeks(totalG), 1800);
  $('kendali').hidden = true; $('petunjuk').hidden = true;
  const rekorLama = LOKAL.rk[L_NO] || 0, baruLokal = totalG > rekorLama, bukaBaru = L_NO === 1 && LOKAL.buka < 3;
  if (baruLokal) LOKAL.rk[L_NO] = totalG;
  if (bukaBaru) LOKAL.buka = 3;   // selesai satu sesi di Danau Tlaga = lokasi 2–3 terbuka
  let j = null; if (AKUN) j = await apiM('selesai', {g: totalG, e: ekor});
  await new Promise(r => setTimeout(r, Math.max(0, 1400 - (performance.now() - t0))));
  if (id !== idSesi) return;
  if (j && j.saya) { if (j.saya.rekor) LOKAL.rk[L_NO] = j.saya.rekor; LOKAL.pos[L_NO] = j.saya.pos || LOKAL.pos[L_NO]; if (j.saya.buka > LOKAL.buka) LOKAL.buka = j.saya.buka; if (j.saya.avatar) LOKAL.av = j.saya.avatar;
    $('dompet').textContent = `🪙 ${j.saya.koin ?? 0}  💎 ${j.saya.permata ?? 0}`; }
  simpan('dk_mancing', LOKAL);
  // misi harian "Ikut Lomba Mancing Kotak": progres ditulis ke dk_misi (sama dengan game desa), diklaim saat warga kembali ke desa
  if (AKUN && j && j.saya && !j.galat) { const hari = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10), m = baca('dk_misi') || {};
    const ms = m.t === hari && m.no === AKUN.no ? m : {t: hari, no: AKUN.no, p: {}}; ms.p = ms.p || {}; ms.p.lombamancing = (+ms.p.lombamancing || 0) + 1; simpan('dk_misi', ms); }
  $('hsJudul').textContent = baruLokal && rekorLama ? 'REKOR BARU! 🎣🎉' : 'WAKTU HABIS! 🎣';
  $('hsRinci').innerHTML = `<div class="utamaA"><b>${kgPendek(totalG)}</b><small>TOTAL BERAT</small></div><div><b>${kgPendek(LOKAL.rk[L_NO])}</b><small>REKORMU</small></div>` +
    `<div><b>${j && j.saya && j.saya.pos ? '#' + j.saya.pos : '–'}</b><small>POSISI</small></div><div><b>${j && j.dapat ? '+' + j.dapat + ' 🪙' : '0 🪙'}</b><small>KOIN</small></div>`;
  const ringkas = `${ekor} ekor${terbesar ? `, terbesar ${terbesar.nama} ${kgPendek(terbesar.g)}` : ''}. `;
  $('hsHadiah').textContent = ringkas + (!AKUN ? 'Main sebagai tamu: rekor hanya di HP ini. Masuk sebagai warga di desa supaya rekor & koin tercatat.'
    : j && j.galat ? j.galat : j && j.dapat ? `Sesi ke-${j.saya.sesiHari} hari ini. Koin tinggal ${j.saya.sisaKoin}x lagi hari ini.` : 'Jatah koin hari ini habis. Rekor tetap dicatat, kejar posisi #1!');
  if (bukaBaru) { $('hsJudul').textContent = '🔓 2 LOKASI BARU TERBUKA!'; $('hsHadiah').innerHTML = esc($('hsHadiah').textContent) + ' <button class="kedua" id="bLanjut" style="display:inline-block;width:auto;padding:5px 10px;margin-top:4px;color:#f2c14a">🌾 Coba Sungai Wetan →</button>';
    $('bLanjut').onclick = () => { simpan('dk_mancing_l', 2); const u = new URL(location.href); u.searchParams.set('l', 2); location.href = u.toString(); }; }
  $('hasil').hidden = false; tulisLobi(j);
}

// ---------- loop ----------
function ukur() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 1.5 ? 64 : 55; cam.updateProjectionMatrix(); }
addEventListener('resize', ukur); ukur();
let lama = performance.now(), fr = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - lama) / 1000), t = now / 1000; lama = now; fr++;
  if (fr % 2 === 0) { ombak(t); for (const pr of PERAHU) { const y0 = pr.userData.y0 ??= pr.position.y; pr.position.y = y0 + tinggiAir(pr.position.x, pr.position.z, t); pr.rotation.z = Math.sin(t * 1.3 + pr.position.x) * .04; pr.rotation.x = Math.cos(t * 1.1 + pr.position.z) * .025; } }
  langkah(dt, t); kamera(dt, t);
  R.render(sc, cam);
}
requestAnimationFrame(loop);
// untuk uji otomatis (Playwright)
window.__mk = {S, mode: () => MODE, sim: detik => {   // main otomatis dengan langkah tetap 1/60 dtk (uji keseimbangan)
    let n = 0, kendor = 0; const ok = () => MODE !== 'habis' && MODE !== 'lobi';
    for (let k = 0; k < detik * 60 && ok(); k++) { const t = k / 60;
      if (MODE === 'siap') tekan(); else if (MODE === 'isi' && S.kuat > .85) lepas(); else if (MODE === 'sambar' && S.sambarT < 1.2) tekan();
      else if (MODE === 'tarik') { if (S.tegang > .75) lepas(); else if (S.tegang < .4) tekan(); if (S.kendor > 0) kendor++; }
      langkah(1 / 60, t); n++; }
    return {mode: MODE, detik: +(n / 60).toFixed(1), totalG, ekor, kendor}; }, mulai: mulaiSesi, tekan, lepas, sisa: v => { if (v != null) sisa = v; return sisa; }, hasil: () => ({totalG, ekor, terbesar}), L_NO, LOKAL};

// Reli Kotak (Huda 10 Nov 2026: "Saya mau buat game serupa versi dunia kotak, detail mobilnya pelajari").
// Balap reli jalan tanah sekali jalan (start → 20 gerbang → finish) di hutan pinus lereng Kotak Curug.
// Hasil bedah video referensi yang dipakai: mobil hatchback kotak gaya reli 80-an dengan sayap belakang, bumper hitam, lampu rem
// kotak yang menyala terang, ban besar, garis tepi hitam (gaya kartun low-poly); bodi oleng & ngepot di tikungan, api knalpot saat
// ganti gigi, debu & bekas ban; kamera kejar dari belakang yang sedikit telat; jalan tanah sempit, tikungan miring, rambu panah
// kuning; HUD stopwatch + "Gerbang n dari 20" + peta mini + speedometer & gigi. Mobil dan namanya ORIGINAL (bukan merek/game asli).
// Masuk dari Sirkuit Reli Kotak di Dusun Kotak Curug (tombol 🏁 Reli). Gaya santai: gas otomatis, tidak ada kalah, tepi jalan
// semak (mobil memantul, tidak keluar lintasan). Hemat API (paket gratis Cloudflare): lobi 1 GET publik ber-cache, tiap balapan
// 2 POST (mulai & selesai). Tamu boleh latihan tanpa rekor/koin.
import '../mabar/js/putar.js'; // HP tegak -> tampil mendatar, sama seperti game desa
import * as THREE from 'three';
import {warga} from '../mabar/js/aset/avatar.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const baca = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const simpan = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const jamTeks = ms => { if (!(ms > 0)) return '–'; const t = ms / 1000, m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2); };
let AKUN = null; { const w = baca('dk_warga'); if (w && w.kunci) AKUN = {no: w.no, kunci: w.kunci, ig: w.ig}; }
const LOKAL = Object.assign({rekor: 0, pos: 0, av: null, split: null}, baca('dk_reli') || {});   // cache di HP: rekor, posisi, avatar, split rekor
const GERBANG = 20, LEBAR = 9, SEMAK = LEBAR / 2 + 5;   // jalan sempit 9 m; semak pembatas 5 m dari tepi jalan
const VMAX = 34, VRUMPUT = 17;                           // ±122 km/j di jalan tanah, ±60 km/j di rumput
const KOIN_FINISH = 10;

// ---------- suara kecil (WebAudio, tanpa file) ----------
let AC = null, MESIN = null;
function siapSuara() {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
    if (!MESIN) { const o = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 520; g.gain.value = 0;
      o.connect(f); o2.connect(f); f.connect(g).connect(AC.destination); o.start(); o2.start(); MESIN = {o, o2, f, g}; } } catch (e) {}
}
function bunyi(fr = 660, d = .08, tipe = 'square', v = .05) {
  try { if (!AC) return; const o = AC.createOscillator(), g = AC.createGain();
    o.type = tipe; o.frequency.value = fr; g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d);
    o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d + .02); } catch (e) {}
}
function letup(v = .09) {   // "dor" knalpot saat ganti gigi
  try { if (!AC) return; const n = AC.sampleRate * .09 | 0, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = v;
    s.buffer = b; s.connect(f).connect(g).connect(AC.destination); s.start(); } catch (e) {}
}

// ---------- API (hemat: lobi pakai GET publik yang di-cache server; POST hanya saat mulai & selesai) ----------
async function apiR(op, data = {}) {
  try {
    if (!op) { const r = await fetch('/duniakotak/api/reli'); return await r.json(); }
    const r = await fetch('/duniakotak/api/reli', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({kunci: AKUN.kunci, op, ...data})});
    const j = await r.json(); if (r.status === 401) { AKUN = null; } return j;
  } catch (e) { return {galat: 'Sinyal putus. Coba lagi sebentar.'}; }
}

// =====================================================================
// 1. LINTASAN: jalan tanah berkelok (spline), tikungan miring, 20 gerbang
// =====================================================================
const TITIK = [[0, 30], [0, -40], [8, -105], [42, -152], [95, -168], [142, -150], [168, -108], [205, -88], [248, -104], [268, -150], [252, -200], [206, -232],
  [152, -248], [112, -288], [106, -342], [140, -384], [196, -394], [242, -372], [282, -332], [332, -318], [372, -348], [384, -400], [362, -452], [312, -476], [262, -478]];
const kurva = new THREE.CatmullRomCurve3(TITIK.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
const PANJANG = kurva.getLength(), DS = 2, NS = Math.round(PANJANG / DS), dsAsli = PANJANG / NS;
const T = [];   // sampel lintasan tiap ±2 m: posisi, arah, kanan, tinggi, kemiringan tikungan
for (let i = 0; i <= NS; i++) {
  const u = i / NS, p = kurva.getPointAt(u), t = kurva.getTangentAt(u), s = i * dsAsli;
  const y = 3.2 * Math.sin(s / 95) + 1.6 * Math.sin(s / 41 + 1.3) - 3.2 * Math.sin(0) - 1.6 * Math.sin(1.3);   // naik turun bukit pelan, start di y 0
  T.push({x: p.x, z: p.z, y, tx: t.x, tz: t.z, nx: -t.z, nz: t.x, s, k: 0, bk: 0});
}
for (let i = 0; i <= NS; i++) { const a = T[Math.max(0, i - 2)], b = T[Math.min(NS, i + 2)]; T[i].k0 = (a.tz * b.tx - a.tx * b.tz) / (4 * dsAsli); }
for (let i = 0; i <= NS; i++) { let j = 0, n = 0; for (let d = -6; d <= 6; d++) { const q = T[i + d]; if (q) { j += q.k0; n++; } } T[i].k = j / n;
  T[i].bk = Math.max(-.2, Math.min(.2, -T[i].k * 7)); }   // tikungan miring: sisi luar tikungan lebih tinggi
const yJalan = (i, d) => { const q = T[i]; const dd = Math.max(-LEBAR / 2 - 1, Math.min(LEBAR / 2 + 1, d)); return q.y + dd * q.bk - Math.max(0, Math.abs(d) - LEBAR / 2 - 1) * .06; };
// proyeksi posisi ke lintasan (cari lokal di sekitar indeks terakhir)
function proyeksi(x, z, ih = 0, jang = 24) {
  let bi = ih, bd = 1e18;
  for (let i = Math.max(0, ih - jang); i <= Math.min(NS, ih + jang); i++) { const q = T[i], d = (x - q.x) ** 2 + (z - q.z) ** 2; if (d < bd) { bd = d; bi = i; } }
  const q = T[bi]; return {i: bi, d: (x - q.x) * q.nx + (z - q.z) * q.nz, s: q.s + (x - q.x) * q.tx + (z - q.z) * q.tz};
}
function terdekat(x, z, langkah = 3) { let bd = 1e18, bi = 0; for (let i = 0; i <= NS; i += langkah) { const q = T[i], d = (x - q.x) ** 2 + (z - q.z) ** 2; if (d < bd) { bd = d; bi = i; } } return {i: bi, d: Math.sqrt(bd)}; }
const IG = []; for (let g = 1; g <= GERBANG; g++) IG.push(Math.min(NS - 4, Math.round((40 + (PANJANG - 70 - 40) * g / GERBANG) / dsAsli)));   // gerbang ke-20 = FINISH
const I_START = Math.round(30 / dsAsli);   // garis start 30 m dari ujung lintasan

// ---------- 3D dasar ----------
const R = new THREE.WebGLRenderer({canvas: $('kanvas'), antialias: true, powerPreference: 'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputColorSpace = THREE.SRGBColorSpace;
const sc = new THREE.Scene(); sc.background = new THREE.Color(0x9fd3f5); sc.fog = new THREE.Fog(0xb6dcf2, 140, 330);
const cam = new THREE.PerspectiveCamera(60, 1, .3, 900);
sc.add(new THREE.HemisphereLight(0xffffff, 0x7a9a5a, 1.2));
const MATAHARI = new THREE.DirectionalLight(0xfff0d0, 2.1); MATAHARI.castShadow = true; MATAHARI.shadow.mapSize.set(1024, 1024);
Object.assign(MATAHARI.shadow.camera, {left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 160}); MATAHARI.shadow.bias = -.0008; MATAHARI.shadow.normalBias = .4;
sc.add(MATAHARI, MATAHARI.target);
const matS = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .85, ...o});
const kotak = (w, h, d, c, x = 0, y = 0, z = 0, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || matS(c)); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
function teksTex(w, h, isi, latar = '#2c3150', warna = '#ffffff', font = 900) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (typeof latar === 'function') latar(g, w, h); else { g.fillStyle = latar; g.fillRect(0, 0, w, h); }
  g.fillStyle = warna; g.textAlign = 'center'; g.textBaseline = 'middle';
  let u = h * .62; g.font = `${font} ${u}px Montserrat, system-ui, sans-serif`; while (g.measureText(isi).width > w * .9 && u > 8) { u -= 2; g.font = `${font} ${u}px Montserrat, system-ui, sans-serif`; }
  g.fillText(isi, w / 2, h / 2 + 2); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const kotakKotak = (g, w, h, n = 8) => { const s = h / 2; for (let x = 0; x * s < w; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#1b1c21' : '#ffffff'; g.fillRect(x * s, y * s, s, s); } };

// ---------- tanah (mengikuti tinggi lintasan, bukit di kejauhan) ----------
let BX0 = 1e9, BX1 = -1e9, BZ0 = 1e9, BZ1 = -1e9; for (const q of T) { BX0 = Math.min(BX0, q.x); BX1 = Math.max(BX1, q.x); BZ0 = Math.min(BZ0, q.z); BZ1 = Math.max(BZ1, q.z); }
const PINGGIR = 170, X0 = BX0 - PINGGIR, X1 = BX1 + PINGGIR, Z0 = BZ0 - PINGGIR, Z1 = BZ1 + PINGGIR;
const bukit = (x, z) => 4 * Math.sin(x / 47) * Math.cos(z / 61) + 2.5 * Math.sin((x + z) / 29);
function yTanah(x, z) { const n = terdekat(x, z, 2), q = T[n.i]; const jauh = Math.max(0, Math.min(1, (n.d - LEBAR / 2 - 4) / 40));
  return q.y - .22 - (n.d < LEBAR / 2 + 2 ? 0 : .1) + jauh * jauh * (bukit(x, z) + 1.5 + Math.max(0, n.d - 120) * .35); }
{
  const SX = Math.ceil((X1 - X0) / 5), SZ = Math.ceil((Z1 - Z0) / 5), geo = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, SX, SZ); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, warnaT = [], c = new THREE.Color();
  for (let k = 0; k < pos.count; k++) { const x = pos.getX(k) + (X0 + X1) / 2, z = pos.getZ(k) + (Z0 + Z1) / 2; pos.setY(k, yTanah(x, z));
    const r = Math.sin(x * .37 + z * .11) * .5 + Math.sin(x * .07 - z * .19) * .5; c.setHSL(.27 + r * .02, .42, .42 + r * .05); warnaT.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(warnaT, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({vertexColors: true})); m.position.set((X0 + X1) / 2, 0, (Z0 + Z1) / 2); m.receiveShadow = true; sc.add(m);
}
// ---------- jalan tanah: pita dengan bahu rumput-tanah, dua alur ban, tikungan miring ----------
{
  const PROF = [[-LEBAR / 2 - 2.6, 'r'], [-LEBAR / 2, 't'], [-2.4, 'a'], [-1.5, 't'], [0, 'p'], [1.5, 't'], [2.4, 'a'], [LEBAR / 2, 't'], [LEBAR / 2 + 2.6, 'r']];
  const W = {r: new THREE.Color(0x8a9a5a), t: new THREE.Color(0xc9a77a), a: new THREE.Color(0xa88660), p: new THREE.Color(0xd2b48a)};
  const pos = [], col = [], idx = [], NP = PROF.length, c = new THREE.Color();
  for (let i = 0; i <= NS; i++) { const q = T[i]; for (const [d, w] of PROF) { const y = Math.abs(d) > LEBAR / 2 + .1 ? yJalan(i, Math.sign(d) * (LEBAR / 2)) - .32 : yJalan(i, d);
    pos.push(q.x + q.nx * d, y + .04, q.z + q.nz * d); c.copy(W[w]).offsetHSL(0, 0, (Math.sin(i * 1.7 + d) * .5) * .025); col.push(c.r, c.g, c.b); } }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NP - 1; j++) { const a = i * NP + j, b = a + NP; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({vertexColors: true})); m.receiveShadow = true; sc.add(m);
}
// ---------- pohon (pinus kotak khas Curug + pohon bulat), dibuat instanced supaya ringan di HP ----------
{
  const TT = [], acak = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const aman = (x, z, r) => terdekat(x, z, 2).d > r;
  for (let i = 0; i <= NS; i += 3) for (const sd of [-1, 1]) { if (acak() < .25) continue; const q = T[i], d = sd * (SEMAK + 3.5 + acak() * 22), x = q.x + q.nx * d + (acak() - .5) * 4, z = q.z + q.nz * d + (acak() - .5) * 4;
    if (aman(x, z, SEMAK + 3)) TT.push([x, z, .8 + acak() * .6, acak() < .7 ? 0 : 1]); }
  for (let k = 0; k < 900; k++) { const x = X0 + 20 + acak() * (X1 - X0 - 40), z = Z0 + 20 + acak() * (Z1 - Z0 - 40); if (aman(x, z, SEMAK + 4)) TT.push([x, z, 1 + acak() * .8, acak() < .6 ? 0 : 1]); }
  const BAG = [[.5, 1.8, .5, 0, .9, 0x6a4426], [3.2, 1.3, 3.2, 1, 2.1, 0], [2.4, 1.3, 2.4, 1, 3.3, 0], [1.5, 1.2, 1.5, 1, 4.4, 0], [.8, 1, .8, 1, 5.3, 0]];   // pinus: batang + 4 susun daun
  const BULAT = [[.55, 2.2, .55, 0, 1.1, 0x6a4426], [3.4, 2.8, 3.4, 1, 3.4, 0], [2.4, 1.2, 2.4, 1, 5.2, 0]];
  const pasang = (daftar, bag) => { if (!daftar.length) return; const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), c = new THREE.Color();
    bag.forEach(([w, h, d, daun, y, warna]) => { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(w, h, d), matS(0xffffff), daftar.length); im.castShadow = true; im.receiveShadow = true;
      daftar.forEach(([x, z, s], n) => { Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (x * 13 + z * 7) % 6.28); P.set(x, yTanah(x, z) + y * s, z); S.setScalar(s); M.compose(P, Q, S); im.setMatrixAt(n, M);
        if (daun) c.setHSL(.33 + ((x * 3 + z) % 7) * .006, .45, .24 + ((x + z * 5) % 5) * .02 + y * .01); else c.setHex(warna); im.setColorAt(n, c); });
      sc.add(im); }); };
  pasang(TT.filter(t => !t[3]), BAG); pasang(TT.filter(t => t[3]), BULAT);
}
// semak pendek di tepi lintasan (penanda batas, mobil memantul di sini)
{
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 1, 1.6), matS(0x4f8a3e), 2 * Math.ceil(NS / 4) + 2), M = new THREE.Matrix4(), c = new THREE.Color(); let n = 0;
  for (let i = 0; i <= NS; i += 4) for (const sd of [-1, 1]) { const q = T[i], d = sd * (SEMAK + .6), x = q.x + q.nx * d, z = q.z + q.nz * d; M.makeTranslation(x, yTanah(x, z) + .35, z); im.setMatrixAt(n, M); c.setHSL(.3, .45, .3 + (i % 3) * .03); im.setColorAt(n++, c); }
  im.count = n; im.castShadow = true; sc.add(im);
}
// gunung di kejauhan (Kotak Curug) + sawah berundak di pinggir
for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, r = 470 + (k % 3) * 60, x = (BX0 + BX1) / 2 + Math.cos(a) * r, z = (BZ0 + BZ1) / 2 + Math.sin(a) * r * .9, h = 70 + (k * 37 % 50);
  const g = new THREE.Group(); [[1, 0], [.7, .45], [.42, .8]].forEach(([s, y]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(150 * s, h * .5, 150 * s), new THREE.MeshLambertMaterial({color: new THREE.Color().setHSL(.32, .32, .3 + y * .08)})); m.position.y = h * y; g.add(m); });
  g.position.set(x, -10, z); g.rotation.y = a; sc.add(g); }

// ---------- rambu panah kuning di tikungan tajam ----------
{
  const tex = [1, -1].map(arah => { const c = document.createElement('canvas'); c.width = 128; c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#f2c230'; g.fillRect(0, 0, 128, 96);
    g.fillStyle = '#1b1c21'; g.beginPath(); const m = arah > 0 ? 1 : -1, cx = 64; g.moveTo(cx - 22 * m, 14); g.lineTo(cx + 18 * m, 48); g.lineTo(cx - 22 * m, 82); g.lineTo(cx - 6 * m, 82); g.lineTo(cx + 34 * m, 48); g.lineTo(cx - 6 * m, 14); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; });
  let akhir = -99;
  for (let i = 10; i < NS - 10; i++) { const q = T[i]; if (Math.abs(q.k) < .022 || i - akhir < 7) continue; akhir = i;
    const sd = q.k > 0 ? 1 : -1, d = sd * (LEBAR / 2 + 2.2), x = q.x + q.nx * d, z = q.z + q.nz * d, y = yTanah(x, z);   // di sisi luar tikungan
    const g = new THREE.Group(); g.add(kotak(.12, 1.3, .12, 0x555555, 0, .65, 0));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .95), new THREE.MeshLambertMaterial({map: tex[q.k > 0 ? 1 : 0]})); p.position.y = 1.55; g.add(p);
    const bl = kotak(1.36, 1, .06, 0x1b1c21, 0, 1.55, -.04); g.add(bl);
    g.position.set(x, y, z); g.rotation.y = Math.atan2(-q.tx, -q.tz); sc.add(g); }
}
// ---------- gerbang: start, 19 gerbang bernomor, finish ----------
const GERBANG_OBJ = [];
function pasangGerbang(i, judul, latar, warna, kotakK = false) {
  const q = T[i], g = new THREE.Group(), lb = LEBAR / 2 + 1.1, tinggi = 4.6, h = Math.max(yJalan(i, -lb), yJalan(i, lb));
  [-1, 1].forEach(s => { g.add(kotak(.4, tinggi + .6, .4, 0x2c3150, s * lb, tinggi / 2 - .3 + (yJalan(i, s * lb) - h) / 2, 0)); g.add(kotak(.6, .35, .6, 0xe0803a, s * lb, yJalan(i, s * lb) - h + .15, 0)); });
  const tex = teksTex(512, 72, judul, kotakK ? (c, w, hh) => { kotakKotak(c, w, hh); c.fillStyle = latar; c.fillRect(w * .18, 0, w * .64, hh); } : latar, warna);
  const ban = new THREE.Mesh(new THREE.BoxGeometry(lb * 2 + .4, 1.05, .25), [0, 1, 2, 3, 4, 5].map(k => k >= 4 ? new THREE.MeshLambertMaterial({map: tex}) : matS(0x2c3150)));
  ban.position.y = tinggi; ban.castShadow = true; g.add(ban);
  g.position.set(q.x, h, q.z); g.rotation.y = Math.atan2(q.tx, q.tz); sc.add(g); return g;
}
pasangGerbang(I_START, 'START · RELI KOTAK', '#e0803a', '#ffffff', true);
IG.forEach((i, n) => GERBANG_OBJ.push(pasangGerbang(i, n === GERBANG - 1 ? 'FINISH · WILLOAPPAREL.COM' : 'GERBANG ' + (n + 1) + ' · DUNIA KOTAK', n === GERBANG - 1 ? '#e0803a' : n % 2 ? '#2c3150' : '#3a7ad8', '#ffffff', n === GERBANG - 1)));
// garis start & finish kotak-kotak di jalan
for (const i of [I_START, IG[GERBANG - 1]]) { const q = T[i], c = document.createElement('canvas'); c.width = 256; c.height = 32; kotakKotak(c.getContext('2d'), 256, 32);
  const t = new THREE.CanvasTexture(c); const m = new THREE.Mesh(new THREE.PlaneGeometry(LEBAR, 1.1), new THREE.MeshLambertMaterial({map: t}));
  m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(q.tx, q.tz) + Math.PI / 2; m.position.set(q.x, yJalan(i, 0) + .07, q.z); sc.add(m); }
// tenda paddock, tumpukan ban & jerami di start
{
  const q = T[I_START + 4], sd = -1, x = q.x + q.nx * sd * (SEMAK + 6), z = q.z + q.nz * sd * (SEMAK + 6), y = yTanah(x, z), g = new THREE.Group();
  [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([a, b]) => g.add(kotak(.15, 2.6, .15, 0xdddddd, a, 1.3, b)));
  const atap = kotak(4.8, .35, 4.8, 0xe0803a, 0, 2.75, 0); g.add(atap); g.add(kotak(4.9, .5, .1, 0x2c3150, 0, 2.4, 2.4));
  const p = new THREE.Mesh(new THREE.PlaneGeometry(4.4, .48), new THREE.MeshBasicMaterial({map: teksTex(512, 56, 'PADDOCK DUNIA KOTAK', '#2c3150', '#f2c14a')})); p.position.set(0, 2.4, 2.46); g.add(p);
  g.add(kotak(1.8, .8, .8, 0x8a6a40, -.6, .4, -.8)); g.position.set(x, y, z); g.rotation.y = Math.atan2(q.tx, q.tz) + Math.PI / 2; sc.add(g);
}
const jerami = (i, sd, n = 3) => { const q = T[i]; for (let k = 0; k < n; k++) { const d = sd * (LEBAR / 2 + 1.6), x = q.x + q.nx * d + q.tx * (k - 1) * 1.5, z = q.z + q.nz * d + q.tz * (k - 1) * 1.5;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1.2, 10), matS(0xe8c66a)); m.rotation.z = Math.PI / 2; m.rotation.y = Math.atan2(q.tx, q.tz); m.position.set(x, yTanah(x, z) + .6, z); m.castShadow = true; sc.add(m); } };
for (let i = 20; i < NS - 20; i += 1) if (Math.abs(T[i].k) > .03 && i % 37 === 0) jerami(i, T[i].k > 0 ? 1 : -1);
jerami(I_START + 2, 1, 4); jerami(IG[GERBANG - 1] + 3, 1, 4); jerami(IG[GERBANG - 1] + 3, -1, 4);

// =====================================================================
// 2. MOBIL: hatchback kotak reli 80-an (original), detail dari bedah video
// =====================================================================
const WARNA_MOBIL = [['merah', 0xb8252c], ['biru', 0x2f6fd8], ['kuning', 0xf2b62a], ['hijau', 0x2f9a54], ['putih', 0xeeeee8], ['hitam', 0x2a2b33]];
let warnaPilih = Math.max(0, WARNA_MOBIL.findIndex(w => w[0] === baca('dk_reli_warna')));
function platTex(teks) { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 256, 64);
  g.strokeStyle = '#1b1c21'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 58); g.fillStyle = '#1b1c21'; g.font = '900 40px Montserrat, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(teks, 128, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function nomorTex(n) { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.fillStyle = '#1b1c21'; g.font = '900 64px Montserrat, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 64, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const GARIS = new THREE.MeshBasicMaterial({color: 0x15161c, side: THREE.BackSide});   // garis tepi hitam gaya kartun (inverted hull)
function garisTepi(m, t = .045) { const o = new THREE.Mesh(m.geometry, GARIS); o.position.copy(m.position); o.rotation.copy(m.rotation);
  m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox, s = new THREE.Vector3(); b.getSize(s); o.scale.set(1 + 2 * t / s.x, 1 + 2 * t / s.y, 1 + 2 * t / s.z); o.scale.multiply(m.scale); return o; }
function buatMobil(warna, no) {
  const mobil = new THREE.Group(), bodi = new THREE.Group(); mobil.add(bodi);   // bodi = bagian yang oleng (ban tetap di tanah)
  const cat = matS(warna, {roughness: .55, metalness: .05}), hitam = matS(0x1d1e24, {roughness: .7}), kaca = new THREE.MeshStandardMaterial({color: 0x23324a, roughness: .2, metalness: .3, transparent: true, opacity: .78});
  const tepi = [], bx = (w, h, d, m, x, y, z, garis = true) => { const o = kotak(w, h, d, 0, x, y, z, m); bodi.add(o); if (garis) tepi.push(garisTepi(o)); return o; };
  // badan bawah (kotak, panjang 4 m), kap pendek, buritan tegak
  bx(1.78, .56, 3.9, cat, 0, .74, 0);
  bx(1.7, .1, 1.25, cat, 0, 1.06, 1.3);                      // kap mesin
  bx(1.84, .24, .2, hitam, 0, .52, 2.02); bx(1.84, .26, .22, hitam, 0, .52, -2.02);   // bumper depan & belakang hitam
  bx(1.82, .14, 3.5, hitam, 0, .44, 0, false);              // list bawah hitam (side skirt)
  // kabin hatchback: atap panjang sampai buritan, pilar warna bodi + kaca gelap (kaca depan & belakang miring)
  bx(1.56, .52, 2.05, cat, 0, 1.3, -.62);
  const kd = kotak(1.48, .5, .07, 0, 0, 0, 0, kaca); kd.rotation.x = -.5; kd.position.set(0, 1.29, .5); bodi.add(kd);
  const kb = kotak(1.48, .5, .07, 0, 0, 0, 0, kaca); kb.rotation.x = .62; kb.position.set(0, 1.27, -1.72); bodi.add(kb);
  [-1, 1].forEach(s => { bodi.add(kotak(.06, .34, .8, 0, s * .79, 1.34, .02, kaca)); bodi.add(kotak(.06, .32, .8, 0, s * .79, 1.34, -.98, kaca)); });   // kaca samping (pintu & belakang)
  bx(1.5, .08, 1.7, cat, 0, 1.59, -.55);                     // atap
  // spakbor lebar (overfender) di atas tiap ban
  for (const [x, z] of [[-.9, 1.25], [.9, 1.25], [-.9, -1.25], [.9, -1.25]]) bx(.16, .3, 1.05, cat, x, .9, z);
  // sayap belakang (spoiler) lebar
  [-.6, .6].forEach(x => bx(.08, .26, .12, hitam, x, 1.17, -1.82, false)); bx(1.86, .06, .42, cat, 0, 1.31, -1.86);
  // lampu belakang kotak (menyala terang saat rem) & lampu depan + 4 lampu reli bulat di bumper
  const lampuRem = new THREE.MeshStandardMaterial({color: 0x8a1010, emissive: 0xff2a1a, emissiveIntensity: .5, roughness: .4});
  [-1, 1].forEach(s => { bodi.add(kotak(.46, .17, .05, 0, s * .6, .86, -1.97, lampuRem)); bodi.add(kotak(.14, .17, .05, 0, s * .3, .86, -1.97, matS(0xf2a23a, {emissive: 0x6a3a00}))); });
  [-1, 1].forEach(s => bodi.add(kotak(.42, .16, .05, 0, s * .6, .86, 1.97, matS(0xfff4c8, {emissive: 0xfff0b0, emissiveIntensity: .35}))));
  [-.54, -.18, .18, .54].forEach(x => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .08, 12), matS(0xfff6c0, {emissive: 0xffe680, emissiveIntensity: .45})); l.rotation.x = Math.PI / 2; l.position.set(x, .62, 2.14); bodi.add(l); });
  // panel belakang bertulisan, plat nomor DK, gantungan derek
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(.8, .16), new THREE.MeshBasicMaterial({map: teksTex(256, 48, 'RELI KOTAK 4WD', '#1d1e24', '#f4f2ff', 800)})); panel.rotation.y = Math.PI; panel.position.set(0, .86, -1.976); bodi.add(panel);
  const plat = new THREE.Mesh(new THREE.PlaneGeometry(.62, .16), new THREE.MeshBasicMaterial({map: platTex('DK ' + (no || 'TAMU'))})); plat.rotation.y = Math.PI; plat.position.set(0, .58, -2.14); bodi.add(plat);
  const derek = new THREE.Mesh(new THREE.TorusGeometry(.07, .025, 6, 12), matS(0xd8d8de, {metalness: .6})); derek.position.set(.35, .36, -2.12); bodi.add(derek);
  // strip sponsor di atas kaca depan, nomor start di pintu, knalpot
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.48, .13), new THREE.MeshBasicMaterial({map: teksTex(512, 44, 'WILLOAPPAREL.COM', '#f2c14a', '#1d1e24', 900)})); strip.rotation.x = -.5; strip.position.set(0, 1.46, .43); bodi.add(strip);
  const nt = nomorTex((no || 7) % 100);
  [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.CircleGeometry(.24, 20), new THREE.MeshBasicMaterial({map: nt})); r.position.set(s * .9, .78, .1); r.rotation.y = s * Math.PI / 2; bodi.add(r); });
  const knalpot = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .22, 8), matS(0x777777, {metalness: .7})); knalpot.rotation.x = Math.PI / 2; knalpot.position.set(-.55, .38, -2.08); bodi.add(knalpot);
  tepi.forEach(o => bodi.add(o));
  // api knalpot (muncul sebentar saat ganti gigi)
  const api = new THREE.Mesh(new THREE.ConeGeometry(.16, .7, 8), new THREE.MeshBasicMaterial({color: 0xffa020, transparent: true, opacity: .9}));
  api.rotation.x = -Math.PI / 2; api.position.set(-.55, .38, -2.5); api.visible = false; bodi.add(api);
  // ban besar menonjol + pelindung lumpur (mud flap)
  const roda = [], gRoda = new THREE.CylinderGeometry(.4, .4, .34, 14), mRoda = matS(0x1b1c21, {roughness: .9}), mVelg = matS(0xd8d8de, {metalness: .5, roughness: .4});
  for (const [x, z, depan] of [[-.92, 1.25, 1], [.92, 1.25, 1], [-.92, -1.25, 0], [.92, -1.25, 0]]) {
    const piv = new THREE.Group(); piv.position.set(x, .4, z); const putar = new THREE.Group(); piv.add(putar);
    const b = new THREE.Mesh(gRoda, mRoda); b.rotation.z = Math.PI / 2; b.castShadow = true; putar.add(b);
    const v = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .36, 8), mVelg); v.rotation.z = Math.PI / 2; putar.add(v); const jr = new THREE.Mesh(new THREE.BoxGeometry(.37, .08, .3), mRoda); putar.add(jr);
    mobil.add(piv); roda.push({piv, putar, depan});
    if (!depan) bodi.add(kotak(.34, .32, .04, 0, x * 1.02, .42, z - .5, hitam));
  }
  // pengemudi: avatar asli warga + helm reli (kelihatan dari kaca)
  const supir = new THREE.Group(); bodi.add(supir);
  mobil.userData = {bodi, roda, lampuRem, api, supir};
  mobil.traverse(m => { if (m.isMesh && m.material !== GARIS) m.castShadow = true; });
  return mobil;
}
function pasangSupir(av) {
  const s = MOBIL.userData.supir; s.clear();
  try { const o = warga(av || {}); const b = new THREE.Box3().setFromObject(o), h = b.max.y - b.min.y || 1, k = 1.25 / h;
    o.scale.setScalar(k); o.position.set(.36, 1.62 - 1.25 - b.min.y * k + .02, -.35); s.add(o);
    const d = o.userData; if (d && d.head) { const helm = new THREE.Group(); helm.add(kotak(1.22, .62, 1.22, 0xf4f2ff, 0, .95, 0), kotak(1.24, .2, 1.24, 0xe0503a, 0, .72, 0), kotak(1.0, .3, .12, 0x1d1e24, 0, .62, .62)); d.head.add(helm); }
  } catch (e) {}
}
let MOBIL = buatMobil(WARNA_MOBIL[warnaPilih][1], AKUN && AKUN.no); sc.add(MOBIL); pasangSupir(LOKAL.av);
function gantiWarna(i) { warnaPilih = i; simpan('dk_reli_warna', WARNA_MOBIL[i][0]); const p = MOBIL.position.clone(), r = MOBIL.rotation.y; sc.remove(MOBIL);
  MOBIL = buatMobil(WARNA_MOBIL[i][1], AKUN && AKUN.no); MOBIL.position.copy(p); MOBIL.rotation.y = r; sc.add(MOBIL); pasangSupir(LOKAL.av); }

// ---------- bekas ban & debu (pool instanced) ----------
const BEKAS_N = 1400, bekas = new THREE.InstancedMesh(new THREE.PlaneGeometry(.3, .7), new THREE.MeshBasicMaterial({color: 0x5a4632, transparent: true, opacity: .42, depthWrite: false}), BEKAS_N);
bekas.count = 0; bekas.frustumCulled = false; bekas.renderOrder = 1; sc.add(bekas); let bekasI = 0;
const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _S = new THREE.Vector3(1, 1, 1), _P = new THREE.Vector3();
const _QX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
function tandaiBekas(x, y, z, arah) { _E.set(0, arah, 0); _Q.setFromEuler(_E).multiply(_QX);
  _P.set(x, y + .06, z); _M.compose(_P, _Q, _S); bekas.setMatrixAt(bekasI, _M); bekasI = (bekasI + 1) % BEKAS_N; bekas.count = Math.max(bekas.count, bekasI); bekas.instanceMatrix.needsUpdate = true; }
const DEBU_N = 90, debu = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color: 0xd8c09a, transparent: true, opacity: .55, depthWrite: false}), DEBU_N);
debu.frustumCulled = false; sc.add(debu); const DEBU = Array.from({length: DEBU_N}, () => ({t: 9, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, s: 0})); let debuI = 0;
for (let i = 0; i < DEBU_N; i++) { _M.makeScale(0, 0, 0); debu.setMatrixAt(i, _M); }
function semburDebu(x, y, z, vx, vz, s = 1) { const p = DEBU[debuI]; debuI = (debuI + 1) % DEBU_N; Object.assign(p, {t: 0, x, y: y + .3, z, vx: vx + (Math.random() - .5) * 2, vy: 1 + Math.random(), vz: vz + (Math.random() - .5) * 2, s}); }

// =====================================================================
// 3. FISIKA MOBIL ARKADE (ngepot di tikungan) + KAMERA
// =====================================================================
const K = {x: 0, z: 0, y: 0, h: 0, vx: 0, vz: 0, setir: 0, gigi: 1, rpm: 0, i: 0, d: 0, apiT: 0, bekasJ: 0, tabrak: 0, mundurT: 0, roll: 0, pitch: 0, vfLama: 0};
const IN = {kiri: 0, kanan: 0, rem: 0, pot: 0, gas: 1, stik: 0};   // stik = analog setir -1 (kiri) … 1 (kanan)
let MODE = 'lobi', waktu = 0, gerbangKe = 0, mulaiT = 0, SPLIT = [], kamYaw = 0, autoPilot = false, finishT = 0;
function taruhDiStart() { const q = T[I_START - 3]; Object.assign(K, {x: q.x, z: q.z, h: Math.atan2(q.tx, q.tz), vx: 0, vz: 0, setir: 0, gigi: 1, rpm: 0, i: I_START - 3, d: 0, roll: 0, pitch: 0});
  K.y = yJalan(K.i, 0); kamYaw = K.h; gerbangKe = 0; waktu = 0; SPLIT = []; bekas.count = 0; bekasI = 0; }
taruhDiStart();
const GIGI = [0, 8, 14, 20, 26, 99];
function fisika(dt) {
  const fx = Math.sin(K.h), fz = Math.cos(K.h), rx = -fz, rz = fx;   // depan & kanan mobil
  let vf = K.vx * fx + K.vz * fz, vr = K.vx * rx + K.vz * rz;
  const pr = proyeksi(K.x, K.z, K.i); K.i = pr.i; K.d = pr.d;
  const diJalan = Math.abs(K.d) < LEBAR / 2 + .4, vmax = diJalan ? VMAX : VRUMPUT, aktif = MODE === 'balap';
  let setirMau = Math.max(-1, Math.min(1, IN.stik + IN.kanan - IN.kiri));
  if (autoPilot || MODE === 'selesai') { const q = T[Math.min(NS, K.i + 4 + Math.round(Math.abs(vf) * .22))], dx = q.x - K.x, dz = q.z - K.z, sudut = Math.atan2(dx, dz) - K.h; setirMau = Math.max(-1, Math.min(1, -Math.atan2(Math.sin(sudut), Math.cos(sudut)) * 2.4)); }
  K.setir += (setirMau - K.setir) * Math.min(1, dt * 7);
  // gas otomatis (santai di HP); rem: melambat lalu mundur pelan
  let rem = IN.rem;
  if (autoPilot) { const ke = T[Math.min(NS, K.i + 22)]; rem = Math.abs(ke.k) > .035 && vf > 21 ? 1 : 0; }
  if (aktif && !rem) vf += 10.5 * Math.max(0, 1 - vf / vmax) * (vf < 0 ? 2 : 1) * dt;
  else if (aktif && rem) { if (vf > .5) vf -= 24 * dt; else vf = Math.max(-7, vf - 5 * dt); }
  if (MODE === 'selesai') vf -= Math.min(vf, 13 * dt);   // lewat finish: mobil mengerem sendiri & tetap di jalan
  if (vf > vmax) vf -= (vf - vmax) * Math.min(1, dt * 2.2);   // rumput memperlambat
  vf -= vf * .06 * dt;
  // belok: cepat di kecepatan sedang, sedikit lebih kaku di kecepatan tinggi; rem tangan bikin buntut keluar (ngepot)
  const laju = Math.min(1, Math.abs(vf) / 6), pot = IN.pot && aktif;
  const yaw = -K.setir * 2.05 * laju * (1 - .38 * Math.min(1, Math.abs(vf) / VMAX)) * (pot ? 1.5 : 1) * Math.sign(vf || 1);
  K.h += yaw * dt;
  const cengkram = pot ? 1.5 : diJalan ? 5.2 - Math.min(1.6, Math.abs(K.setir) * Math.abs(vf) / 22) : 3.4;   // makin kencang belok makin licin (drift)
  vr *= Math.exp(-cengkram * dt); if (pot) vf *= Math.exp(-.5 * dt);
  const fx2 = Math.sin(K.h), fz2 = Math.cos(K.h), rx2 = -fz2, rz2 = fx2;
  K.vx = fx2 * vf + rx2 * vr; K.vz = fz2 * vf + rz2 * vr;
  K.x += K.vx * dt; K.z += K.vz * dt;
  // semak tepi jalan: mobil memantul kembali (tidak bisa keluar lintasan, tidak ada kalah)
  const p2 = proyeksi(K.x, K.z, K.i), q = T[p2.i];
  if (Math.abs(p2.d) > SEMAK) { const s = Math.sign(p2.d), lebih = Math.abs(p2.d) - SEMAK; K.x -= q.nx * s * lebih; K.z -= q.nz * s * lebih;
    const vn = K.vx * q.nx * s + K.vz * q.nz * s; if (vn > 0) { K.vx -= q.nx * s * vn * 1.4; K.vz -= q.nz * s * vn * 1.4; K.vx *= .9; K.vz *= .9;
      if (vn > 4 && performance.now() - K.tabrak > 900) { K.tabrak = performance.now(); bunyi(90, .18, 'triangle', .12); if (aktif) kabar('🌿 Nyerempet semak!'); } } }
  K.i = p2.i; K.d = p2.d;
  // tinggi & kemiringan mengikuti jalan (tikungan miring)
  const yT = yJalan(K.i, K.d); K.y += (yT - K.y) * Math.min(1, dt * 14);
  const qb = T[K.i], rel = K.h - Math.atan2(qb.tx, qb.tz), qn = T[Math.min(NS, K.i + 2)], qp = T[Math.max(0, K.i - 2)], miring = (qn.y - qp.y) / (4 * dsAsli);
  const vf2 = K.vx * fx2 + K.vz * fz2, vr2 = K.vx * rx2 + K.vz * rz2, ak = (vf2 - K.vfLama) / Math.max(dt, .001); K.vfLama = vf2;
  K.roll += ((-qb.bk * Math.cos(rel)) - K.roll) * Math.min(1, dt * 8);
  K.pitch += ((-miring * Math.cos(rel)) - K.pitch) * Math.min(1, dt * 8);
  const b = MOBIL.userData.bodi;   // bodi oleng ke luar tikungan & mengangguk saat gas/rem
  b.rotation.z += (Math.max(-.09, Math.min(.09, yaw * vf2 * .0042)) - b.rotation.z) * Math.min(1, dt * 6);
  b.rotation.x += (Math.max(-.05, Math.min(.05, -ak * .004)) - b.rotation.x) * Math.min(1, dt * 6);
  b.position.y = Math.sin(performance.now() / 70) * .012 * Math.min(1, Math.abs(vf2) / 10) * (diJalan ? 1 : 3);
  MOBIL.position.set(K.x, K.y, K.z); MOBIL.rotation.set(0, 0, 0); MOBIL.rotateY(K.h); MOBIL.rotateZ(K.roll); MOBIL.rotateX(K.pitch);
  for (const r of MOBIL.userData.roda) { r.putar.rotation.x += vf2 * dt / .38; if (r.depan) r.piv.rotation.y = -K.setir * .45; }
  // gigi, putaran mesin, api knalpot saat naik gigi
  const v = Math.abs(vf2); let g = 1; while (g < 5 && v > GIGI[g]) g++;
  if (g > K.gigi && aktif) { K.apiT = .14; letup(); }
  K.gigi = g; K.rpm = Math.min(1, (v - GIGI[g - 1]) / (GIGI[g] - GIGI[g - 1] || 8) * .8 + .2) * (v < .3 ? .15 : 1);
  K.apiT -= dt; MOBIL.userData.api.visible = K.apiT > 0; MOBIL.userData.api.scale.setScalar(.8 + Math.random() * .5);
  MOBIL.userData.lampuRem.emissiveIntensity = rem && aktif ? 3.2 : .5;
  // bekas ban & debu dari roda belakang
  const slip = Math.abs(vr2), roda = [[-.86, -1.3], [.86, -1.3]];
  if ((slip > 2.2 || (rem && v > 6) || (pot && v > 4)) && v > 2) { K.bekasJ += v * dt; if (K.bekasJ > .55) { K.bekasJ = 0;
    for (const [ox, oz] of roda) tandaiBekas(K.x + rx2 * -ox + fx2 * oz, yJalan(K.i, K.d + -ox), K.z + rz2 * -ox + fz2 * oz, Math.atan2(K.vx, K.vz)); } }
  if (v > 4 && Math.random() < Math.min(.9, v / 30 + slip / 8)) { const [ox, oz] = roda[Math.random() < .5 ? 0 : 1]; semburDebu(K.x + rx2 * -ox + fx2 * oz, K.y, K.z + rz2 * -ox + fz2 * oz, -K.vx * .15, -K.vz * .15, .28 + slip * .04 + v * .01); }
  // mesin
  if (MESIN && AC) { const fr = 55 + K.rpm * 120 + K.gigi * 8; MESIN.o.frequency.setTargetAtTime(fr, AC.currentTime, .05); MESIN.o2.frequency.setTargetAtTime(fr / 2, AC.currentTime, .05);
    MESIN.g.gain.setTargetAtTime(MODE === 'lobi' ? 0 : .028 + K.rpm * .02, AC.currentTime, .1); }
  // arah salah (berbalik)
  const maju = K.vx * qb.tx + K.vz * qb.tz; K.mundurT = maju < -3 && aktif ? K.mundurT + dt : 0;
  if (K.mundurT > 1.6) { K.mundurT = -2; kabar('↩️ Arah salah! Putar balik'); }
  return {v: vf2, slip};
}
function updateDebu(dt) {
  for (let i = 0; i < DEBU_N; i++) { const p = DEBU[i]; if (p.t > 1.2) continue; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy *= .96;
    const s = p.t > 1.2 ? 0 : p.s * (.5 + p.t * 1.6) * (1 - p.t / 1.2); _M.makeScale(s, s, s); _M.setPosition(p.x, p.y, p.z); debu.setMatrixAt(i, _M); }
  debu.instanceMatrix.needsUpdate = true;
}
const _kp = new THREE.Vector3(), _kl = new THREE.Vector3();
function kamera(dt, v) {
  if (MODE === 'lobi') { const t = performance.now() / 1000 * .22; _kp.set(K.x + Math.sin(t) * 7.5, K.y + 2.6, K.z + Math.cos(t) * 7.5); cam.position.copy(_kp); cam.lookAt(K.x, K.y + .9, K.z); cam.fov = 50; cam.updateProjectionMatrix(); return; }
  // kamera kejar dari belakang, sedikit telat mengikuti arah mobil supaya ngepot terasa
  let dy = K.h - kamYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); kamYaw += dy * Math.min(1, dt * 3.4);
  const jarak = 7.2 + Math.min(1.8, Math.abs(v) * .04);
  _kp.set(K.x - Math.sin(kamYaw) * jarak, K.y + 2.9, K.z - Math.cos(kamYaw) * jarak);
  { const pc = proyeksi(_kp.x, _kp.z, K.i, 14), q = T[pc.i], bt = SEMAK + .5; if (Math.abs(pc.d) > bt) { const k = Math.sign(pc.d) * (Math.abs(pc.d) - bt); _kp.x -= q.nx * k; _kp.z -= q.nz * k; } }   // kamera tidak masuk hutan
  const yMin = yTanahCepat(_kp.x, _kp.z) + 1.2; if (_kp.y < yMin) _kp.y = yMin;
  cam.position.lerp(_kp, Math.min(1, dt * 10)); _kl.set(K.x + Math.sin(kamYaw) * 4, K.y + 1.1, K.z + Math.cos(kamYaw) * 4); cam.lookAt(_kl);
  const fov = 58 + Math.min(10, Math.abs(v) * .3); if (Math.abs(cam.fov - fov) > .1) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix(); }
}
const yTanahCepat = (x, z) => { const p = proyeksi(x, z, K.i, 12); return yJalan(p.i, p.d) - .3; };

// =====================================================================
// 4. HUD: stopwatch, gerbang, peta mini, speedometer
// =====================================================================
const PETA = $('peta'), pg = PETA.getContext('2d'), petaDasar = document.createElement('canvas'); petaDasar.width = PETA.width; petaDasar.height = PETA.height;
const PS = Math.min((PETA.width - 24) / (BX1 - BX0), (PETA.height - 24) / (BZ1 - BZ0)), pX = x => 12 + (x - BX0) * PS + ((PETA.width - 24) - (BX1 - BX0) * PS) / 2, pZ = z => 12 + (z - BZ0) * PS + ((PETA.height - 24) - (BZ1 - BZ0) * PS) / 2;
{ const g = petaDasar.getContext('2d'); g.lineCap = g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 7; g.beginPath(); T.forEach((q, i) => i ? g.lineTo(pX(q.x), pZ(q.z)) : g.moveTo(pX(q.x), pZ(q.z))); g.stroke();
  g.strokeStyle = '#d8c09a'; g.lineWidth = 4; g.stroke(); const f = T[IG[GERBANG - 1]]; g.fillStyle = '#fff'; g.fillRect(pX(f.x) - 4, pZ(f.z) - 4, 8, 8); g.fillStyle = '#1b1c21'; g.fillRect(pX(f.x) - 4, pZ(f.z) - 4, 4, 4); g.fillRect(pX(f.x), pZ(f.z), 4, 4); }
function gambarPeta() { pg.clearRect(0, 0, PETA.width, PETA.height); pg.drawImage(petaDasar, 0, 0);
  IG.forEach((i, n) => { if (n === GERBANG - 1) return; const q = T[i]; pg.fillStyle = n < gerbangKe ? '#3aa860' : n === gerbangKe ? '#f2c14a' : 'rgba(255,255,255,.55)'; pg.beginPath(); pg.arc(pX(q.x), pZ(q.z), n === gerbangKe ? 4 : 2.6, 0, 7); pg.fill(); });
  pg.save(); pg.translate(pX(K.x), pZ(K.z)); pg.rotate(-K.h + Math.PI); pg.fillStyle = '#ff4a3a'; pg.strokeStyle = '#fff'; pg.lineWidth = 2; pg.beginPath(); pg.moveTo(0, 8); pg.lineTo(5.5, -5); pg.lineTo(-5.5, -5); pg.closePath(); pg.fill(); pg.stroke(); pg.restore(); }
const SP = $('spidoK'), sg = SP.getContext('2d');
function gambarSpido(v) { const W = SP.width, H = SP.height, cx = W / 2, cy = H - 8, r = 92; sg.clearRect(0, 0, W, H); sg.lineCap = 'round';
  const a0 = Math.PI * .95, a1 = Math.PI * 2.05, ar = a0 + (a1 - a0) * K.rpm;
  sg.lineWidth = 16; sg.strokeStyle = 'rgba(19,20,31,.55)'; sg.beginPath(); sg.arc(cx, cy, r, a0, a1); sg.stroke();
  sg.strokeStyle = '#e0503a'; sg.beginPath(); sg.arc(cx, cy, r, a0 + (a1 - a0) * .86, a1); sg.stroke();
  sg.strokeStyle = K.rpm > .86 ? '#ff6a4a' : '#f08a2a'; sg.beginPath(); sg.arc(cx, cy, r, a0, Math.max(a0 + .01, ar)); sg.stroke();
  sg.fillStyle = '#fff'; sg.font = '900 40px Montserrat, system-ui, sans-serif'; sg.textAlign = 'center'; sg.textBaseline = 'alphabetic'; sg.fillText(Math.abs(v) < .3 && IN.rem ? 'N' : v < -.3 ? 'R' : String(K.gigi), cx, cy - 34);
  $('sAngka').textContent = Math.round(Math.abs(v) * 3.6); }
function kabar(t, ms = 2200) { const k = $('kabar'); if (k.childElementCount > 1) k.firstChild.remove(); const d = document.createElement('div'); d.className = 'kaca'; d.textContent = t; d.style.animationDuration = ms + 'ms'; k.append(d); setTimeout(() => d.remove(), ms); }
function tampilHUD(on) { for (const id of ['keluar', 'jam', 'peta', 'spido', 'jarak', 'kiriKanan', 'pedal']) $(id).hidden = !on; $('lobi').hidden = on; $('dompet').hidden = on || !$('dompet').textContent; if (!on) $('split').hidden = true; }

// ---------- kontrol: tombol sentuh (multi-jari) + keyboard ----------
// analog setir: hanya sumbu kiri-kanan dipakai; zona mati kecil di tengah, makin jauh digeser makin tajam beloknya
{ const el = $('kiriKanan'), kn = el.querySelector('i'); let id = null;
  const gerak = e => { const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, maks = r.width / 2 - 8;
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy); if (d > maks) { dx *= maks / d; dy *= maks / d; }
    const x = dx / maks, m = Math.max(0, Math.abs(x) - .08) / .92; IN.stik = Math.sign(x) * Math.pow(m, 1.25); kn.style.transform = `translate(${dx}px,${dy * .35}px)`; };
  el.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; el.setPointerCapture?.(e.pointerId); gerak(e); });
  el.addEventListener('pointermove', e => { if (e.pointerId === id) gerak(e); });
  const lepas = e => { if (e && e.pointerId !== id) return; id = null; IN.stik = 0; kn.style.transform = ''; };
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(t, lepas);
  el.addEventListener('contextmenu', e => e.preventDefault()); }
for (const [id, k] of [['bRem', 'rem'], ['bPot', 'pot']]) { const b = $(id);
  const on = e => { e.preventDefault(); IN[k] = 1; b.classList.add('tekan'); b.setPointerCapture?.(e.pointerId); }, off = () => { IN[k] = 0; b.classList.remove('tekan'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off); b.addEventListener('contextmenu', e => e.preventDefault()); }
const TOMBOL = {ArrowLeft: 'kiri', KeyA: 'kiri', ArrowRight: 'kanan', KeyD: 'kanan', ArrowDown: 'rem', KeyS: 'rem', Space: 'pot'};
addEventListener('keydown', e => { const k = TOMBOL[e.code]; if (k) { IN[k] = 1; e.preventDefault(); } if (e.code === 'Enter' && MODE === 'lobi') mulaiBalap(); });
addEventListener('keyup', e => { const k = TOMBOL[e.code]; if (k) IN[k] = 0; });
addEventListener('blur', () => { for (const k of ['kiri', 'kanan', 'rem', 'pot', 'stik']) IN[k] = 0; });

// =====================================================================
// 5. ALUR: lobi → hitung mundur → balap → finish → hasil
// =====================================================================
function tulisLobi(top) {
  $('lRekor').textContent = jamTeks(LOKAL.rekor); $('lPos').textContent = LOKAL.pos ? '#' + LOKAL.pos : AKUN ? '–' : 'Tamu';
  if (top) { const L = (top.top || []).slice(0, 3); $('lTop').innerHTML = L.length ? L.map((x, n) => `<span class="kaca ${AKUN && x.no === AKUN.no ? 'saya' : ''}">${['🥇', '🥈', '🥉'][n]} ${esc(x.u ? '@' + x.u : 'Warga ' + x.no)} ${jamTeks(x.t)}</span>`).join('') : '<span class="kaca">Belum ada rekor. Jadi yang pertama!</span>'; }
  $('lAturan').textContent = AKUN ? `Lewati ${GERBANG} gerbang secepatnya · Finish = +${KOIN_FINISH} 🪙 (3x sehari)` : 'Mode tamu: latihan. Masuk desa sebagai warga untuk rekor & 🪙';
}
WARNA_MOBIL.forEach(([n, c], i) => { const b = document.createElement('button'); b.style.background = '#' + c.toString(16).padStart(6, '0'); b.title = 'Mobil ' + n; b.setAttribute('aria-label', 'Warna mobil ' + n);
  if (i === warnaPilih) b.classList.add('pilih'); b.onclick = () => { document.querySelectorAll('#lWarna button').forEach(x => x.classList.remove('pilih')); b.classList.add('pilih'); gantiWarna(i); bunyi(880, .05); }; $('lWarna').append(b); });
tulisLobi(null);
apiR(null).then(j => { if (j && !j.galat) tulisLobi(j); });
let idBalap = 0;
async function mulaiBalap() {
  if (MODE !== 'lobi' && MODE !== 'selesai') return; siapSuara();
  $('hasil').hidden = true; taruhDiStart(); MODE = 'hitung'; tampilHUD(true); const id = ++idBalap;
  $('jWaktu').textContent = '0:00.00'; $('jGerbang').textContent = `GERBANG 0 DARI ${GERBANG}`; $('jarak').textContent = '0,00 KM';
  if (AKUN) apiR('mulai').then(j => { if (j && j.saya) { if (j.saya.avatar && JSON.stringify(j.saya.avatar) !== JSON.stringify(LOKAL.av)) { LOKAL.av = j.saya.avatar; simpan('dk_reli', LOKAL); pasangSupir(LOKAL.av); } } });
  for (const t of ['3', '2', '1']) { if (id !== idBalap) return; $('hitung').hidden = false; $('hitung').innerHTML = `<b>${t}</b>`; bunyi(440, .18, 'square', .07); await new Promise(r => setTimeout(r, 800)); }
  if (id !== idBalap) return; $('hitung').innerHTML = '<b style="color:#9ef0a0">GAS!</b>'; bunyi(880, .35, 'square', .08); setTimeout(() => { if (id === idBalap) $('hitung').hidden = true; }, 700);
  MODE = 'balap'; mulaiT = performance.now(); waktu = 0;
}
$('bMulai').onclick = mulaiBalap; $('bLagi').onclick = mulaiBalap;
$('keluar').onclick = () => { idBalap++; MODE = 'lobi'; $('hitung').hidden = true; taruhDiStart(); tampilHUD(false); };
function lewatGerbang() {
  const n = gerbangKe; gerbangKe++; SPLIT[n] = waktu; const rek = LOKAL.split && LOKAL.split[n];
  $('jGerbang').textContent = `GERBANG ${Math.min(gerbangKe, GERBANG)} DARI ${GERBANG}`;
  const sp = $('split'); sp.hidden = false; const beda = rek ? (waktu - rek) / 1000 : null;
  sp.textContent = (n === GERBANG - 1 ? 'FINISH ' : 'GERBANG ' + (n + 1) + ' · ') + jamTeks(waktu) + (beda != null ? `  ${beda < 0 ? '−' : '+'}${Math.abs(beda).toFixed(2)}` : '');
  sp.classList.toggle('cepat', beda != null && beda < 0); clearTimeout(sp._t); sp._t = setTimeout(() => { sp.hidden = true; }, 2200);
  bunyi(n === GERBANG - 1 ? 1046 : 784, .12, 'square', .06);
  if (n === GERBANG - 1) finish();
}
async function finish() {
  MODE = 'selesai'; finishT = performance.now(); const ms = Math.round(waktu), id = idBalap; bunyi(1318, .5, 'triangle', .08); kabar('🏁 FINISH! ' + jamTeks(ms), 1800);
  const rekorLama = LOKAL.rekor, baruLokal = !rekorLama || ms < rekorLama;
  if (baruLokal) { LOKAL.rekor = ms; LOKAL.split = SPLIT.slice(); }
  let j = null; if (AKUN) j = await apiR('selesai', {ms});
  await new Promise(r => setTimeout(r, Math.max(0, 1400 - (performance.now() - finishT))));
  if (id !== idBalap) return;
  if (j && j.saya) { if (j.saya.rekor) LOKAL.rekor = j.saya.rekor; LOKAL.pos = j.saya.pos || LOKAL.pos; if (j.saya.avatar) LOKAL.av = j.saya.avatar;
    $('dompet').textContent = `🪙 ${j.saya.koin ?? 0}  💎 ${j.saya.permata ?? 0}`; }
  simpan('dk_reli', LOKAL);
  $('hsJudul').textContent = baruLokal && rekorLama ? 'REKOR BARU! 🏁🎉' : 'FINISH! 🏁';
  $('hsRinci').innerHTML = `<div class="utamaA"><b>${jamTeks(ms)}</b><small>WAKTU</small></div><div><b>${jamTeks(LOKAL.rekor)}</b><small>REKORMU</small></div>` +
    `<div><b>${j && j.saya && j.saya.pos ? '#' + j.saya.pos : '–'}</b><small>POSISI</small></div><div><b>${j && j.dapat ? '+' + j.dapat + ' 🪙' : '0 🪙'}</b><small>KOIN</small></div>`;
  $('hsHadiah').textContent = !AKUN ? 'Main sebagai tamu: rekor hanya di HP ini. Masuk sebagai warga di desa supaya rekor & koin tercatat.'
    : j && j.galat ? j.galat : j && j.dapat ? `Finish ke-${j.saya.finishHari} hari ini. Koin finish tinggal ${j.saya.sisaKoin}x lagi hari ini.` : 'Jatah koin finish hari ini habis. Rekor tetap dicatat, kejar posisi #1!';
  $('hasil').hidden = false; $('kiriKanan').hidden = $('pedal').hidden = true; tulisLobi(j);
}

// ---------- loop ----------
function ukur() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', ukur); ukur();
let lama = performance.now(), fr = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (t - lama) / 1000); lama = t; fr++;
  let hasil = {v: 0};
  for (let s = 0; s < 2; s++) hasil = fisika(dt / 2);   // 2 sub-langkah supaya stabil di HP yang patah-patah
  if (MODE === 'balap') { waktu = performance.now() - mulaiT; if (gerbangKe < GERBANG && K.i >= IG[gerbangKe]) lewatGerbang(); }
  updateDebu(dt); kamera(dt, hasil.v);
  MATAHARI.position.set(K.x - 30, K.y + 60, K.z + 25); MATAHARI.target.position.set(K.x, K.y, K.z);
  if (MODE !== 'lobi' && fr % 2 === 0) { $('jWaktu').textContent = jamTeks(MODE === 'balap' ? waktu : Math.round(waktu)).replace('–', '0:00.00'); gambarSpido(hasil.v);
    const tot = T[IG[GERBANG - 1]].s - T[I_START].s; $('jarak').textContent = (Math.min(tot, Math.max(0, T[K.i].s - T[I_START].s)) / 1000).toFixed(2).replace('.', ',') + ' / ' + (tot / 1000).toFixed(2).replace('.', ',') + ' KM'; }
  if (MODE !== 'lobi' && fr % 3 === 0) gambarPeta();
  R.render(sc, cam);
}
requestAnimationFrame(loop);
// untuk uji otomatis (Playwright): autopilot menyetir mengikuti lintasan
window.__rk = {K, T, IG, IN, PANJANG, mode: () => MODE, waktu: () => waktu, gerbang: () => gerbangKe, auto: v => { autoPilot = !!v; }, mulai: mulaiBalap, cam,
  sim: detik => { let maks = 0, rumput = 0; for (let k = 0; k < detik * 60 && MODE === 'balap'; k++) { fisika(1 / 120); const h = fisika(1 / 120); maks = Math.max(maks, h.v); if (Math.abs(K.d) > LEBAR / 2) rumput++; mulaiT -= 1000 / 60; waktu = performance.now() - mulaiT; if (gerbangKe < GERBANG && K.i >= IG[gerbangKe]) lewatGerbang(); }
    return {mode: MODE, waktu: Math.round(waktu), gerbang: gerbangKe, maks: +(maks * 3.6).toFixed(0), rumput}; }};

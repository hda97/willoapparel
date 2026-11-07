// ===================================================================
// Inti bersama PAKET GAME SMP DUNIA KOTAK (main bersama).
// Digabung ke setiap game oleh edukasi/smp/build.py -> 1 game = 1 file HTML (offline).
// Isi: panggung 3D, siswa SMP (avatar asli Dunia Kotak), bank soal kelas 7/8/9,
//      pengaturan, KELOMPOK DI SATU LAYAR, SATU KELAS LEWAT HP (laptop guru = server),
//      kartu soal, podium, rekap nilai CSV, Mode Guru (tempel Excel), mode CONTOH,
//      musik & SFX, HUD.
// File game (mis. menara-hitung.js) mengisi objek GAME: dunia 3D dan animasinya.
// ===================================================================
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import qrcode from 'qrcode-generator';
// ASET ASLI DUNIA KOTAK (sama persis dengan game mabar)
import {warga, KULIT, WARNA_RAMBUT} from '../../../public/duniakotak/mabar/js/aset/avatar.js';

const $ = id => document.getElementById(id);
const acak = (a, b) => a + Math.random() * (b - a);
const acakInt = (a, b) => Math.floor(acak(a, b + 1));
const pilih = arr => arr[Math.floor(Math.random() * arr.length)];
const kocok = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const simpanLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const bacaLS = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const angka = n => Math.round(n).toLocaleString('id-ID');

const HTML_ASLI = '<!doctype html>\n' + document.documentElement.outerHTML;
const DATA_BAWAAN = JSON.parse(($('data-soal') || {textContent: '{"soal":[]}'}).textContent);
const GAME = {}; // diisi file game
const KUNCI = () => 'dksmp:' + GAME.id;
let DATA = DATA_BAWAAN;
let JEDA = false, MAIN = false;

// ---- di mana game ini berjalan? ----
// CONTOH: dibuka dari situs (willoapparel.com) -> 3 soal lalu ajakan beli paket.
// SERVER: dibuka dari aplikasi Kelas Dunia Kotak di laptop guru -> mode satu kelas lewat HP aktif.
// versi situs hanya membawa sedikit soal contoh; bank soal lengkap hanya ada di paket
const CONTOH = DATA_BAWAAN.varian === 'contoh' || location.hash === '#contoh';
const BATAS_CONTOH = 3;
let SERVER = null; // {alamat:[...], port} bila jalan dari aplikasi server

// ---------- geometri kotak membulat gaya Dunia Kotak ----------
const _gk = {};
function kotak(w, h, d, c, rad = .06, m = {}) {
  const k = [w, h, d, rad].join(); const g = _gk[k] || (_gk[k] = new RoundedBoxGeometry(w, h, d, 2, Math.min(rad, w / 2 - .001, h / 2 - .001, d / 2 - .001)));
  const o = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: c, roughness: .8, ...m})); o.castShadow = o.receiveShadow = true; return o;
}
const di = (o, x, y, z) => { o.position.set(x, y, z); return o; };
function variasi(hex, kadar = .05) { const c = new THREE.Color(hex); const h = {}; c.getHSL(h); c.setHSL(h.h, h.s, Math.min(1, Math.max(0, h.l + acak(-kadar, kadar)))); return '#' + c.getHexString(); }
function teksKanvas(teks, bg, fg = '#fff', {ukuran = 84} = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, 256, 256); } x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `800 ${ukuran * 2}px 'Baloo 2', Arial, sans-serif`; x.fillText(teks, 128, 136);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function pohon(s = 1) {
  const g = new THREE.Group(); for (let i = 0; i < 3; i++) g.add(di(kotak(.4 * s, .4 * s, .4 * s, variasi('#8b5a2b', .03)), 0, .2 * s + i * .4 * s, 0));
  g.add(di(kotak(1.8 * s, 1.6 * s, 1.8 * s, variasi('#4caf50', .05), .2), 0, 1.9 * s, 0)); g.add(di(kotak(1.1 * s, 1 * s, 1.1 * s, variasi('#5cbf5a', .06), .15), acak(-.25, .25) * s, 3 * s, acak(-.2, .2) * s)); return g;
}
function awan(s = 1) { const g = new THREE.Group(); [[0, 0, 2.2, .7], [-.7, .45, 1.2, .6], [.5, .5, 1.1, .7]].forEach(([x, y, w, h]) => { const b = kotak(w * s, h * s, .9 * s, '#ffffff', .2, {roughness: 1}); b.castShadow = false; b.position.set(x * s, y * s, 0); g.add(b); }); return g; }
function tanah(warna = '#7cc96b', ukuran = 200) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = warna; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) { x.fillStyle = variasi(warna, .05); x.globalAlpha = .5; const s = acak(4, 14); x.fillRect(acak(0, 256), acak(0, 256), s, s * acak(.4, 1)); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(ukuran / 10, ukuran / 10);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ukuran, ukuran), new THREE.MeshStandardMaterial({map: t, roughness: 1})); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
}
// label nama melayang (sprite)
function labelNama(teks, bg = 'rgba(255,255,255,.93)', fg = '#1d2b44') {
  const ukur = document.createElement('canvas').getContext('2d'); ukur.font = "800 56px 'Baloo 2', Arial, sans-serif";
  const w = Math.min(640, Math.ceil(ukur.measureText(teks).width + 44)); const c = document.createElement('canvas'); c.width = w; c.height = 84;
  const x = c.getContext('2d'); x.font = ukur.font; x.fillStyle = bg; x.beginPath(); x.roundRect(2, 6, w - 4, 72, 36); x.fill();
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(teks, w / 2, 44, w - 30);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map: t, depthTest: false, transparent: true})); s.scale.set(w / 84 * .32, .32, 1); s.renderOrder = 10; return s;
}

// ---------- SISWA SMP (avatar asli + seragam putih biru, dasi biru) ----------
const TIM = [
  {nama: 'Tim Merah', warna: '#e03131', kunci: '1234', tombol: ['1', '2', '3', '4']},
  {nama: 'Tim Biru', warna: '#1c7ed6', kunci: 'qwer', tombol: ['Q', 'W', 'E', 'R']},
  {nama: 'Tim Kuning', warna: '#f59f00', kunci: 'asdf', tombol: ['A', 'S', 'D', 'F']},
  {nama: 'Tim Hijau', warna: '#2f9e44', kunci: 'zxcv', tombol: ['Z', 'X', 'C', 'V']},
];
const GAYA_L = ['cepak', 'belah', 'acak', 'keriting'], GAYA_P = ['panjang', 'kuncir', 'kepang', 'bob', 'hijab'];
// rupa = {j:'L'|'P', k:0-5 kulit, g:gaya rambut, w:0-3 warna rambut}
function rupaAcak() { const j = Math.random() < .5 ? 'P' : 'L'; return {j, k: acakInt(0, 4), g: pilih(j === 'P' ? GAYA_P : GAYA_L), w: acakInt(0, 3)}; }
function opsiSiswa(r = {}, warnaTim = null) {
  const j = r.j === 'P' ? 'P' : 'L'; const gaya = (j === 'P' ? GAYA_P : GAYA_L).includes(r.g) ? r.g : (j === 'P' ? 'panjang' : 'cepak');
  const o = {jenis: j, kulit: KULIT[Math.max(0, Math.min(5, r.k | 0))], rambut: {gaya, warna: WARNA_RAMBUT[Math.max(0, Math.min(7, r.w | 0))]},
    atasan: {jenis: 'seragam', warna: '#f6f6f2'}, bawahan: {jenis: j === 'P' ? (gaya === 'hijab' ? 'rok-panjang' : 'rok') : 'celana', warna: '#2b4a8a'}, ekspresi: 'senang'};
  if (gaya === 'hijab') { o.hijab = '#f6f6f2'; o.lenganPanjang = true; }
  if (warnaTim) o.topi = warnaTim;
  return o;
}
// dasi seragam SMP berwarna biru (aset asli menggambar dasi merah SD)
function dasiSMP(w) {
  w.traverse(m => { if (Array.isArray(m.material) && m.material[4] && m.material[4].map && m.material[4].map.image) { const c = m.material[4].map.image, x = c.getContext && c.getContext('2d');
    if (x) { x.fillStyle = '#1f3a6e'; x.fillRect(58, 6, 12, 46); m.material[4].map.needsUpdate = true; } } });
}
// tokoh: grup luar (posisi/arah) + tubuh (loncat) + avatar
// kelas besar: ganti sudut bulat tokoh ke versi hemat (bentuk & warna sama, segitiga jauh lebih sedikit)
const _gRingan = {};
function ringanTokoh(obj) {
  obj.traverse(o => {
    if (!o.isMesh || !o.geometry || o.geometry.type === 'PlaneGeometry' || o.geometry.attributes.position.count < 300) return;
    const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox;
    const w = b.max.x - b.min.x, h = b.max.y - b.min.y, d = b.max.z - b.min.z; const k = [w, h, d].map(v => v.toFixed(3)).join();
    o.geometry = _gRingan[k] || (_gRingan[k] = new RoundedBoxGeometry(w, h, d, 1, Math.min(.05, w / 2 - .001, h / 2 - .001, d / 2 - .001)));
    o.castShadow = false;
  });
  return obj;
}
function buatSiswa(rupa, warnaTim = null, skala = .34) {
  const g = new THREE.Group(), tb = new THREE.Group(); g.add(tb);
  const w = warga(opsiSiswa(rupa, warnaTim)); dasiSMP(w); w.scale.setScalar(skala); tb.add(w);
  g.userData = {tb, u: w.userData, t: Math.random() * 6, mode: 'diam', tMode: 0}; return g;
}
function setMode(o, m, lama = 0) { const u = o.userData; u.mode = m; u.tMode = 0; u.sampai = lama; }
function animTokoh(o, dt) {
  const u = o.userData; u.t += dt; u.tMode += dt; const t = u.t; if (u.sampai && u.tMode > u.sampai) { u.mode = 'diam'; u.sampai = 0; }
  const L = (ob, p, v, f = .25) => { ob.rotation[p] += (v - ob.rotation[p]) * Math.min(1, f * dt * 60); };
  const a = u.u; let lk = 0, lr = 0, kk = 0, kr = 0, ky = 0, ay = 0;
  if (u.mode === 'jalan') { const w = Math.sin(t * 12); lk = w * .7; lr = -w * .7; kk = -w * .6; kr = w * .6; ay = Math.abs(Math.sin(t * 12)) * .05; }
  else if (u.mode === 'senang') { ay = Math.abs(Math.sin(u.tMode * 7)) * .3; lk = -2.6 + Math.sin(t * 14) * .3; lr = -2.6 - Math.sin(t * 14) * .3; }
  else if (u.mode === 'jatuh') { lk = -2.9; lr = -2.9; kk = .5; kr = -.4; }
  else if (u.mode === 'geleng') { ky = Math.sin(u.tMode * 14) * .35 * Math.max(0, 1 - u.tMode / 1.2); }
  else { ay = Math.sin(t * 2.2) * .012; lk = Math.sin(t * 2.2) * .05; lr = -lk; }
  L(a.armL, 'x', lk); L(a.armR, 'x', lr); L(a.legL, 'x', kk); L(a.legR, 'x', kr); L(a.head, 'y', ky);
  u.tb.position.y += (ay - u.tb.position.y) * Math.min(1, .35 * dt * 60);
}

// ---------- panggung ----------
const P = {};
function siapPanggung({langit = '#bfe6ff', bayangan = 30} = {}) {
  const R = new THREE.WebGLRenderer({canvas: $('layar'), antialias: true});
  R.setPixelRatio(Math.min(devicePixelRatio, 1.75)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 1.0;
  const sc = new THREE.Scene(); sc.background = new THREE.Color(langit); sc.fog = new THREE.Fog(langit, 90, 200);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x8fb07a, 1.05));
  const mt = new THREE.DirectionalLight(0xfff1dc, 2.1); mt.position.set(10, 22, 14); mt.castShadow = true; mt.shadow.mapSize.set(2048, 2048);
  Object.assign(mt.shadow.camera, {left: -bayangan, right: bayangan, top: bayangan, bottom: -bayangan, near: 1, far: 120}); mt.shadow.bias = -.0004; sc.add(mt); sc.add(mt.target);
  const cam = new THREE.PerspectiveCamera(36, 1, .1, 400);
  Object.assign(P, {R, sc, cam, mt});
  const ukur = () => { R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
  addEventListener('resize', ukur); ukur(); return P;
}
function ikutCahaya(x, y, z) { P.mt.position.set(x + 12, y + 26, z + 16); P.mt.target.position.set(x, y, z); }

// ---------- suara (disintesis, tanpa file) ----------
let AC = null, SUARA_ON = true, MUSIK_ON = true;
{ const sv = bacaLS('dksmp:suara', null); if (sv) { SUARA_ON = sv[0]; MUSIK_ON = sv[1]; } }
function siapSuara() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (e) {} }
function nada(f, t0, lama, {tipe = 'triangle', vol = .18, ke = null} = {}) {
  if (!AC || !SUARA_ON) return; const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0; o.type = tipe; o.frequency.setValueAtTime(f, t);
  if (ke) o.frequency.exponentialRampToValueAtTime(ke, t + lama);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + lama);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + lama + .05);
}
function desis(lama = .4, f0 = 400, f1 = 2600, vol = .12) {
  if (!AC || !SUARA_ON) return; const n = AC.createBuffer(1, AC.sampleRate * lama, AC.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(), t = AC.currentTime; s.buffer = n; f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + lama * .9); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .05); g.gain.linearRampToValueAtTime(0, t + lama);
  s.connect(f).connect(g).connect(AC.destination); s.start(t);
}
const efek = {
  benar() { [523, 659, 784, 1046].forEach((f, i) => nada(f, i * .08, .25)); },
  salah() { nada(330, 0, .18, {tipe: 'sine', vol: .16}); nada(262, .16, .3, {tipe: 'sine', vol: .16}); },
  ketuk() { nada(880, 0, .05, {tipe: 'sine', vol: .12}); },
  pop() { nada(600, 0, .12, {tipe: 'sine', vol: .18, ke: 1200}); },
  masuk() { nada(660, 0, .1, {tipe: 'sine', vol: .12}); nada(990, .08, .14, {tipe: 'sine', vol: .12}); },
  menang() { [523, 523, 659, 784, 659, 784, 1046].forEach((f, i) => nada(f, i * .13, .3, {tipe: 'square', vol: .07})); },
  kilau() { [2093, 2637, 3136, 2637].forEach((f, i) => nada(f, i * .05, .18, {tipe: 'sine', vol: .05})); },
  naik() { [392, 494, 587, 698, 784, 988].forEach((f, i) => nada(f, i * .07, .16, {tipe: 'triangle', vol: .12})); },
  runtuh() { desis(.7, 2400, 200, .16); nada(140, .05, .3, {tipe: 'square', vol: .07, ke: 50}); },
  detik() { nada(1200, 0, .04, {tipe: 'sine', vol: .06}); },
  gong() { nada(196, 0, 1.2, {tipe: 'sine', vol: .2}); nada(392, 0, .8, {tipe: 'sine', vol: .08}); },
};
let MUSIK = null, mGain = null, mTimer = null, mNext = 0, mStep = 0, mMelodi = [], _redam = false;
function aturMusik(cfg) {
  MUSIK = Object.assign({bpm: 112, nada: 60, skala: [0, 2, 4, 5, 7, 9, 11], alat: 'marimba', progresi: [0, 4, 5, 3], benih: 7, drum: true}, cfg);
  let x = MUSIK.benih * 9301 + 49297; const r = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  mMelodi = []; let deg = 2;
  for (let bar = 0; bar < 4; bar++) { const ak = MUSIK.progresi[bar], na = [ak, ak + 2, ak + 4];
    for (let s = 0; s < 16; s++) { const kuat = s % 4 === 0, main = kuat ? r() < .9 : s % 2 === 0 ? r() < .55 : r() < .18; if (!main) { mMelodi.push(null); continue; }
      if (kuat) { const c = []; na.forEach(d => [d, d + 7].forEach(v => c.push(v))); c.sort((a, b) => Math.abs(a - deg) - Math.abs(b - deg)); deg = c[r() < .7 ? 0 : 1]; } else deg += r() < .5 ? 1 : -1;
      deg = Math.max(0, Math.min(9, deg)); mMelodi.push(deg); } }
}
const frek = (deg, okt = 0) => { const sk = MUSIK.skala, o = Math.floor(deg / 7); return 440 * Math.pow(2, (MUSIK.nada + sk[((deg % 7) + 7) % 7] + 12 * (o + okt) - 69) / 12); };
function bunyiAlat(f, t, lama, alat, vol) {
  const part = {marimba: ['sine', 4, .3], pluck: ['triangle', 2, .25], xilofon: ['triangle', 3.98, .2]}[alat] || ['sine', 2, .2];
  [[part[0], 1, 1, lama], ['sine', part[1], part[2], lama * .35]].forEach(([tp, m, v, l]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = tp; o.frequency.value = f * m;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * v, t + .008); g.gain.exponentialRampToValueAtTime(.0008, t + l); o.connect(g).connect(mGain); o.start(t); o.stop(t + lama + .02); });
}
let _hat = null;
function langkahMusik(i, t) {
  const sp = 60 / MUSIK.bpm / 2, bar = Math.floor(i / 16) % 4, s = i % 16, ak = MUSIK.progresi[bar];
  const m = mMelodi[i % 64]; if (m != null) bunyiAlat(frek(m, 1), t, sp * 1.8, MUSIK.alat, .15);
  if (s % 4 === 0) bunyiAlat(frek(ak, -1), t, sp * 3.5, 'pluck', .16);
  if (MUSIK.drum) {
    if (s % 2 === 1) { if (!_hat) { _hat = AC.createBuffer(1, AC.sampleRate * .05, AC.sampleRate); const d = _hat.getChannelData(0); for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / d.length); }
      const b = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); b.buffer = _hat; f.type = 'highpass'; f.frequency.value = 7000; g.gain.value = s % 4 === 3 ? .07 : .04; b.connect(f).connect(g).connect(mGain); b.start(t); }
    if (s === 0 || s === 8) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(.22, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(g).connect(mGain); o.start(t); o.stop(t + .18); }
  }
}
function mulaiMusik() {
  if (!AC || !MUSIK || mTimer) return; mGain = AC.createGain(); mGain.gain.value = 0; mGain.connect(AC.destination); volMusik(1.5);
  mNext = AC.currentTime + .15; mStep = 0;
  mTimer = setInterval(() => { const sp = 60 / MUSIK.bpm / 2; while (mNext < AC.currentTime + .25) { langkahMusik(mStep, mNext); mNext += sp; mStep++; } }, 60);
}
function volMusik(lama = .3) { if (!mGain) return; const v = !SUARA_ON || !MUSIK_ON ? 0 : (_redam || JEDA) ? .05 : .15; mGain.gain.cancelScheduledValues(AC.currentTime); mGain.gain.setValueAtTime(mGain.gain.value, AC.currentTime); mGain.gain.linearRampToValueAtTime(v, AC.currentTime + lama); }
function redam(on) { _redam = on; volMusik(); }

// ---------- tween & partikel ----------
const tween = [];
function animasi(lama, fn = () => {}, mudah = t => 1 - Math.pow(1 - t, 3)) { return new Promise(res => tween.push({t: 0, lama, fn, mudah, res})); }
const tunggu = lama => animasi(lama);
function updateTween(dt) { for (let i = tween.length - 1; i >= 0; i--) { const w = tween[i]; w.t += dt; const p = Math.min(1, w.t / w.lama); w.fn(w.mudah(p), p); if (p >= 1) { tween.splice(i, 1); w.res(); } } }
const partikel = []; const _gp = new THREE.BoxGeometry(.14, .14, .14);
function konfeti(pos, n = 40, warna = ['#ff5a5f', '#ffd23f', '#3ec1d3', '#7bd389', '#a78bfa', '#ff9f1c']) {
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(_gp, new THREE.MeshStandardMaterial({color: pilih(warna), roughness: .6})); m.position.copy(pos);
    m.userData = {v: new THREE.Vector3(acak(-3, 3), acak(4, 9), acak(-3, 3)), r: new THREE.Vector3(acak(-8, 8), acak(-8, 8), 0), umur: acak(1.2, 2), y0: pos.y - 1}; P.sc.add(m); partikel.push(m); }
}
function updatePartikel(dt) {
  for (let i = partikel.length - 1; i >= 0; i--) { const m = partikel[i], u = m.userData; u.umur -= dt; u.v.y -= 14 * dt; m.position.addScaledVector(u.v, dt); m.rotation.x += u.r.x * dt; m.rotation.y += u.r.y * dt;
    if (m.position.y < u.y0) { m.position.y = u.y0; u.v.multiplyScalar(.4); u.v.y = Math.abs(u.v.y); }
    if (u.umur < .3) m.scale.setScalar(Math.max(.01, u.umur / .3)); if (u.umur <= 0) { P.sc.remove(m); m.material.dispose(); partikel.splice(i, 1); } }
}

// ===================================================================
// BANK SOAL & PENGATURAN
// ===================================================================
{ const s = bacaLS(KUNCI_BANK(), null); if (s && s.sidik === DATA_BAWAAN.sidik && s.data && s.data.soal && s.data.soal.length) DATA = s.data; }
function KUNCI_BANK() { return 'dksmp:bank:' + (DATA_BAWAAN.mapel || 'umum'); }
const normKelas = k => { const m = String(k ?? '').match(/[789]/); return m ? m[0] : '7'; };
function opsiSoal(s) { return ['a', 'b', 'c', 'd'].map((k, i) => ({h: 'ABCD'[i], teks: String(s[k] ?? '').trim()})).filter(o => o.teks); }
function kunciSoal(s) { const k = String(s.kunci || '').trim(); const up = k.toUpperCase(); if (/^[ABCD]$/.test(up)) return up; const o = opsiSoal(s).find(o => o.teks.toLowerCase() === k.toLowerCase()); return o ? o.h : 'A'; }
function soalSah() { return DATA.soal.filter(x => opsiSoal(x).length >= 2 && String(x.soal || '').trim()); }
function daftarTopik(kelas) { const m = new Map(); soalSah().forEach(s => { if (kelas !== 'campur' && normKelas(s.kelas) !== kelas) return; const t = (s.topik || 'Umum').trim(); m.set(t, (m.get(t) || 0) + 1); }); return [...m]; }
let ATUR = Object.assign({kelas: '7', topik: '', jumlah: 10, waktu: 30, jeda: true, cara: 'layar', tim: 2, hpTim: 0}, bacaLS('dksmp:atur', {}));
function pilihSoal(n) {
  let s = soalSah().filter(x => ATUR.kelas === 'campur' || normKelas(x.kelas) === ATUR.kelas);
  if (ATUR.topik) { const t = s.filter(x => (x.topik || 'Umum').trim() === ATUR.topik); if (t.length) s = t; }
  if (!s.length) s = soalSah();
  const out = []; while (out.length < n && s.length) out.push(...kocok(s).slice(0, n - out.length)); return out;
}

// ===================================================================
// PEMAIN (perorangan / tim) & PERINGKAT
// ===================================================================
// pemain = {id, nama, rupa, tim (index atau -1), lantai, poin, benar, jawab:[], on, obj}
const PEMAIN = new Map();
let SESI = null; // {soal:[], no, mode:'layar'|'hp', fase}
function urutPeringkat(daftar) { return [...daftar].sort((a, b) => b.poin - a.poin || b.benar - a.benar || a.nama.localeCompare(b.nama)); }
function skorTim() {
  const n = SESI.mode === 'hp' ? ATUR.hpTim : 0; if (!n) return null;
  return TIM.slice(0, n).map((t, i) => { const a = [...PEMAIN.values()].filter(p => p.tim === i); const poin = a.reduce((s, p) => s + p.poin, 0);
    return {i, nama: t.nama, warna: t.warna, anggota: a.length, poin, rata: a.length ? poin / a.length : 0, benar: a.reduce((s, p) => s + p.benar, 0)}; }).sort((a, b) => b.rata - a.rata);
}

// ===================================================================
// SERVER LAPTOP GURU (WebSocket ke aplikasi Kelas Dunia Kotak)
// ===================================================================
let WS = null, _wsSiap = false;
async function cekServer() {
  if (!/^https?:$/.test(location.protocol) || DI_SITUS) return null;
  try { const r = await fetch('/api/info', {cache: 'no-store'}); if (!r.ok) return null; const j = await r.json(); return j && j.kelasDuniaKotak ? j : null; } catch (e) { return null; }
}
function sambungServer() {
  if (WS) return;
  const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws?peran=guru';
  WS = new WebSocket(url);
  WS.onopen = () => { _wsSiap = true; kirim({t: 'game', id: GAME.id, judul: GAME.judul}); if (SESI && SESI.mode === 'hp') siarKeadaan(); else siarLobi(); };
  WS.onclose = () => { _wsSiap = false; WS = null; setTimeout(sambungServer, 1500); };
  WS.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } terimaServer(m); };
}
function kirim(o) { if (WS && _wsSiap) WS.send(JSON.stringify(o)); }
function siar(data) { kirim({t: 'siar', data}); }
function keMurid(id, data) { kirim({t: 'ke', id, data}); }
// MURID = daftar murid dari server (tetap ada walau guru main kelompok di layar). PEMAIN = yang sedang main.
const MURID = new Map();
const modeHP = () => SESI && SESI.mode === 'hp';
function terimaServer(m) {
  if (m.t === 'murid') {
    const ada = new Set();
    m.daftar.forEach(d => { ada.add(d.id); let p = MURID.get(d.id); const baru = !p;
      if (!p) { p = {id: d.id, nama: d.nama, rupa: d.rupa || rupaAcak(), tim: -1, lantai: 0, poin: 0, benar: 0, jawab: [], on: d.on}; MURID.set(d.id, p); }
      const baruOn = d.on && !p.on; p.on = d.on; p.nama = d.nama; if (d.rupa) p.rupa = d.rupa;
      if (modeHP()) {
        if (baru) { if (ATUR.hpTim) p.tim = d.tim >= 0 && d.tim < ATUR.hpTim && SESI.fase === 'lobi' ? d.tim : timTerkecil(); PEMAIN.set(p.id, p); efek.masuk(); GAME.pemainBaru && GAME.pemainBaru(p); }
        else if (ATUR.hpTim && d.tim >= 0 && d.tim < ATUR.hpTim && p.tim !== d.tim && SESI.fase === 'lobi') { p.tim = d.tim; GAME.pemainBerubah && GAME.pemainBerubah(p); }
        if (baruOn && !baru) kirimKeadaanKe(p);
      } });
    [...MURID.keys()].forEach(id => { if (!ada.has(id)) { const p = MURID.get(id); MURID.delete(id); if (modeHP() && PEMAIN.has(id)) { GAME.pemainHilang && GAME.pemainHilang(p); PEMAIN.delete(id); } } });
    if (modeHP()) { gambarLobi(); gambarHitungJawab(); gambarPapan(); }
  }
  if (m.t === 'jawab') { const p = PEMAIN.get(m.id); if (p && modeHP() && SESI.fase === 'soal' && m.no === SESI.no) terimaJawaban(p, m.h); }
}
function timTerkecil() { const n = ATUR.hpTim; const c = Array(n).fill(0); PEMAIN.forEach(p => { if (p.tim >= 0 && p.tim < n) c[p.tim]++; }); return c.indexOf(Math.min(...c)); }
function infoLobi() { return {t: 'lobi', game: GAME.judul, tim: ATUR.hpTim ? TIM.slice(0, ATUR.hpTim).map(t => ({nama: t.nama, warna: t.warna})) : []}; }
function siarLobi() { siar(infoLobi()); }
function keadaanUntuk(p) {
  if (!SESI || SESI.fase === 'lobi') return infoLobi();
  const q = SESI.soal[SESI.no]; const tim = ATUR.hpTim && p.tim >= 0 ? TIM[p.tim] : null;
  const dasar = {game: GAME.judul, no: SESI.no, total: SESI.soal.length, poin: p.poin, lantai: p.lantai + 1, tim: tim ? {nama: tim.nama, warna: tim.warna} : null};
  if (SESI.fase === 'soal') return {t: 'soal', ...dasar, teks: q.soal, ops: opsiSoal(q).map(o => o.teks), sisa: Math.max(0, Math.ceil(SESI.sisa)), sudah: p.jawab[SESI.no] ? p.jawab[SESI.no].h : null};
  if (SESI.fase === 'hasil') { const j = p.jawab[SESI.no]; const urut = urutPeringkat(PEMAIN.values()); return {t: 'hasil', ...dasar, benar: !!(j && j.benar), pilih: j ? j.h : null, kunci: kunciSoal(q), kunciTeks: (opsiSoal(q).find(o => o.h === kunciSoal(q)) || {}).teks || '', dapat: j ? j.dapat : 0, peringkat: urut.indexOf(p) + 1, dari: urut.length}; }
  if (SESI.fase === 'akhir') { const urut = urutPeringkat(PEMAIN.values()); const st = skorTim(); return {t: 'akhir', ...dasar, benar: p.benar, peringkat: urut.indexOf(p) + 1, dari: urut.length, timJuara: st ? st[0].nama : null}; }
  return infoLobi();
}
function kirimKeadaanKe(p) { keMurid(p.id, keadaanUntuk(p)); }
function siarKeadaan() { PEMAIN.forEach(p => kirimKeadaanKe(p)); }

// ===================================================================
// LAYAR: judul, pengaturan, tim, lobi HP, permainan, akhir
// ===================================================================
const LAYAR = ['lJudul', 'lAtur', 'lTim', 'lLobi', 'lAkhir'];
function tampil(id) { LAYAR.forEach(x => { $(x).hidden = x !== id; }); document.body.dataset.layar = id || 'main'; }
function pastikanDukung() {
  document.querySelectorAll('.dukung').forEach(a => { a.href = 'https://www.willoapparel.com'; a.target = '_blank'; a.rel = 'noopener'; a.innerHTML = 'Supported by <b>www.willoapparel.com</b>';
    a.style.cssText = 'display:inline-block!important;visibility:visible!important;opacity:1!important'; });
}
function layarJudul() {
  const WJ = ['#ff6b6b', '#ff922b', '#fcc419', '#51cf66', '#339af0', '#845ef7', '#f06595'];
  let n = 0; $('jJudul').innerHTML = GAME.judul.split(' ').map(k => `<b class="kata">${[...k].map(c => `<span style="color:${WJ[n % 7]};animation-delay:${(n++ * .09).toFixed(2)}s">${esc(c)}</span>`).join('')}</b>`).join(' ');
  $('jAjak').textContent = GAME.ajak; tampil('lJudul'); pastikanDukung(); GAME.layarJudul && GAME.layarJudul();
  $('bMulai').onclick = () => { siapSuara(); mulaiMusik(); efek.ketuk(); layarAtur(); };
}
function seg(k, opsi) { return `<div class="seg" data-k="${k}">${opsi.map(([v, t]) => `<button data-v="${v}" class="${String(ATUR[k]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`; }
function pasangSeg(wadah, ubah) {
  wadah.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => { efek.ketuk(); const k = sg.dataset.k, v = b.dataset.v;
    ATUR[k] = v === 'true' ? true : v === 'false' ? false : /^-?\d+$/.test(v) ? +v : v; sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); ubah && ubah(k); }));
}
function layarAtur() {
  tampil('lAtur'); MAIN = false; tampilHUD(false); SESI = null; GAME.keMenu && GAME.keMenu();
  if (CONTOH) ATUR.cara = 'layar';
  if (!SERVER && ATUR.cara === 'hp') ATUR.cara = 'layar';
  const gambar = () => {
    const topik = daftarTopik(ATUR.kelas); if (ATUR.topik && !topik.some(t => t[0] === ATUR.topik)) ATUR.topik = '';
    const total = topik.reduce((s, t) => s + t[1], 0);
    $('aKiri').innerHTML = `<div class="lbl">Kelas</div>${seg('kelas', [['7', 'Kelas 7'], ['8', 'Kelas 8'], ['9', 'Kelas 9'], ['campur', 'Campur']])}
      <div class="lbl">Topik</div><div id="aTopik"><button class="pilT ${!ATUR.topik ? 'on' : ''}" data-t=""><span>Semua topik</span><small>${CONTOH ? 'contoh' : total + ' soal'}</small></button>${topik.map(([t, n]) => `<button class="pilT ${t === ATUR.topik ? 'on' : ''}" data-t="${esc(t)}"><span>${esc(t)}</span><small>${CONTOH ? '' : n + ' soal'}</small></button>`).join('')}</div>`;
    $('aKanan').innerHTML = `<div class="lbl">Cara main</div>
      <div class="cara">
        <button class="pilC ${ATUR.cara === 'layar' ? 'on' : ''}" data-c="layar"><b>👥 Kelompok di layar ini</b><small>2 sampai 4 tim, tanpa WiFi. Tim menjawab lewat tombol atau keyboard laptop.</small></button>
        <button class="pilC ${ATUR.cara === 'hp' ? 'on' : ''} ${SERVER ? '' : 'mati'}" data-c="hp"><b>📱 Satu kelas lewat HP</b><small>${SERVER ? 'Murid scan QR di proyektor, menjawab di HP masing-masing atau satu HP per kelompok.' : CONTOH ? 'Tersedia di paket lengkap (aplikasi Kelas Dunia Kotak di laptop guru).' : 'Buka game ini lewat aplikasi Kelas Dunia Kotak di laptop guru untuk mengaktifkan.'}</small></button>
      </div>
      <div class="lbl">Jumlah soal (= tinggi menara)</div>${CONTOH ? `<p class="gInfo" style="margin:0">Versi contoh: ${BATAS_CONTOH} soal. Paket lengkap: 10, 15, atau 20 soal per permainan.</p>` : seg('jumlah', [[10, '10'], [15, '15'], [20, '20']])}
      <div class="lbl">Waktu per soal</div>${seg('waktu', [[20, '20 dtk'], [30, '30 dtk'], [45, '45 dtk'], [60, '60 dtk']])}
      <div class="lbl">Pembahasan <small>(tunggu tombol Lanjut, guru bisa menjelaskan)</small></div>${seg('jeda', [[true, 'Nyala'], [false, 'Mati']])}`;
    $('aTopik').querySelectorAll('.pilT').forEach(b => b.onclick = () => { efek.ketuk(); ATUR.topik = b.dataset.t; $('aTopik').querySelectorAll('.pilT').forEach(x => x.classList.toggle('on', x === b)); });
    $('aKanan').querySelectorAll('.pilC').forEach(b => b.onclick = () => { if (b.classList.contains('mati')) { efek.salah(); if (CONTOH) tawarPaket('Mode satu kelas lewat HP ada di paket lengkap.'); return; } efek.ketuk(); ATUR.cara = b.dataset.c; gambar(); });
    pasangSeg($('lAtur'), k => { if (k === 'kelas') gambar(); });
  };
  gambar();
  $('aLanjut').onclick = () => { efek.ketuk(); simpanLS('dksmp:atur', ATUR); if (ATUR.cara === 'hp') layarLobi(); else layarTim(); };
  $('aGuru').onclick = () => { if (CONTOH) { tawarPaket('Mode Guru untuk mengganti soal ada di paket lengkap.'); return; } bukaGerbangGuru(); };
}

// ---- KELOMPOK DI SATU LAYAR ----
function layarTim() {
  tampil('lTim'); ATUR.tim = Math.max(2, Math.min(4, ATUR.tim || 2));
  const gambar = () => {
    $('tIsi').innerHTML = `<div class="lbl">Jumlah tim</div>${seg('tim', [[2, '2 tim'], [3, '3 tim'], [4, '4 tim']])}
      <div class="tGrid">${TIM.slice(0, ATUR.tim).map((t, i) => `<div class="tKartu" style="--w:${t.warna}"><input id="namaTim${i}" maxlength="18" value="${esc((ATUR.namaTim || [])[i] || t.nama)}"><div class="tKunci">Tombol keyboard: <b>${t.tombol.join(' ')}</b> untuk A B C D</div></div>`).join('')}</div>
      <p class="gInfo">Setiap tim menjawab dengan menekan tombol warnanya di layar, atau tombol keyboard di atas. Tim yang benar paling cepat mendapat bonus.</p>`;
    pasangSeg($('tIsi'), () => gambar());
  };
  gambar();
  $('tKembali').onclick = () => { efek.ketuk(); layarAtur(); };
  $('tMulai').onclick = () => {
    efek.ketuk(); ATUR.namaTim = TIM.map((t, i) => ($('namaTim' + i) ? $('namaTim' + i).value.trim() : '') || (ATUR.namaTim || [])[i] || t.nama); simpanLS('dksmp:atur', ATUR);
    PEMAIN.clear(); TIM.slice(0, ATUR.tim).forEach((t, i) => PEMAIN.set('tim' + i, {id: 'tim' + i, nama: ATUR.namaTim[i], tim: i, rupa: null, lantai: 0, poin: 0, benar: 0, jawab: [], on: true}));
    mulaiSesi('layar');
  };
}

// ---- SATU KELAS LEWAT HP: lobi + QR ----
function alamatMurid() { const a = (SERVER && SERVER.alamat && SERVER.alamat[SERVER._pilih || 0]) || location.hostname; return `http://${a}:${SERVER ? SERVER.port : location.port}/m`; }
function gambarQR(el, teks, sel = 8) {
  const q = qrcode(0, 'M'); q.addData(teks); q.make(); const n = q.getModuleCount(); const c = document.createElement('canvas'); c.width = c.height = (n + 4) * sel; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#1d2b44'; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + 2) * sel, (r + 2) * sel, sel, sel);
  el.innerHTML = ''; el.appendChild(c);
}
function layarLobi() {
  tampil('lLobi'); SESI = {mode: 'hp', fase: 'lobi', soal: [], no: -1};
  PEMAIN.clear(); MURID.forEach(p => { p.lantai = 0; p.poin = 0; p.benar = 0; p.jawab = []; if (ATUR.hpTim && (p.tim < 0 || p.tim >= ATUR.hpTim)) p.tim = -1; PEMAIN.set(p.id, p); });
  if (ATUR.hpTim) PEMAIN.forEach(p => { if (p.tim < 0) p.tim = timTerkecil(); }); else PEMAIN.forEach(p => { p.tim = -1; });
  sambungServer(); GAME.siapLobi && GAME.siapLobi();
  const tulisAlamat = () => { const u = alamatMurid(); gambarQR($('lQR'), u); $('lAlamat').textContent = u.replace(/^http:\/\//, '');
    $('lJaringan').innerHTML = SERVER.alamat.length > 1 ? 'Jaringan: ' + SERVER.alamat.map((a, i) => `<button class="kecil ${i === (SERVER._pilih || 0) ? 'utama' : ''}" data-i="${i}">${esc(a)}</button>`).join(' ') : '';
    $('lJaringan').querySelectorAll('button').forEach(b => b.onclick = () => { SERVER._pilih = +b.dataset.i; tulisAlamat(); }); };
  tulisAlamat();
  $('lAtur2').innerHTML = `<div class="lbl">Main</div>${seg('hpTim', [[0, 'Perorangan'], [2, '2 tim'], [3, '3 tim'], [4, '4 tim']])}`;
  pasangSeg($('lAtur2'), () => { PEMAIN.forEach(p => { p.tim = -1; }); if (ATUR.hpTim) { let i = 0; PEMAIN.forEach(p => { p.tim = i++ % ATUR.hpTim; }); } PEMAIN.forEach(p => GAME.pemainBerubah && GAME.pemainBerubah(p)); simpanLS('dksmp:atur', ATUR); siarLobi(); gambarLobi(); });
  $('lKembali').onclick = () => { efek.ketuk(); siar({t: 'tutup'}); layarAtur(); };
  $('lMulai').onclick = () => { if (!PEMAIN.size) { efek.salah(); return; } efek.ketuk(); mulaiSesi('hp'); };
  gambarLobi(); siarLobi();
}
function gambarLobi() {
  if (!SESI || SESI.fase !== 'lobi' || $('lLobi').hidden) return;
  const daftar = [...PEMAIN.values()];
  $('lJumlah').textContent = daftar.length ? `${daftar.length} murid sudah masuk` : 'Menunggu murid masuk…';
  const satu = p => `<button class="nm ${p.on ? '' : 'off'}" data-id="${esc(p.id)}" title="Ketuk untuk mengeluarkan" style="${p.tim >= 0 && ATUR.hpTim ? `border-color:${TIM[p.tim].warna}` : ''}">${esc(p.nama)}</button>`;
  $('lDaftar').innerHTML = ATUR.hpTim
    ? TIM.slice(0, ATUR.hpTim).map((t, i) => `<div class="lTim" style="--w:${t.warna}"><b>${t.nama}</b> <small>${daftar.filter(p => p.tim === i).length}</small><div>${daftar.filter(p => p.tim === i).map(satu).join('')}</div></div>`).join('')
    : daftar.map(satu).join('');
  $('lDaftar').querySelectorAll('.nm').forEach(b => b.onclick = () => { if (b.dataset.yakin === '1') { kirim({t: 'tendang', id: b.dataset.id}); } else { b.dataset.yakin = '1'; b.textContent = 'Keluarkan? ketuk lagi'; setTimeout(() => { if (b.isConnected) { b.dataset.yakin = ''; gambarLobi(); } }, 2500); } });
  $('lMulai').disabled = !daftar.length;
}

// ===================================================================
// SESI PERMAINAN (sama untuk semua game; dunia & animasi dari GAME)
// ===================================================================
function mulaiSesi(mode) {
  const n = CONTOH ? BATAS_CONTOH : ATUR.jumlah;
  SESI = {mode, soal: pilihSoal(n), no: -1, fase: 'mulai', sisa: 0, urutBenar: 0};
  PEMAIN.forEach(p => { p.lantai = 0; p.poin = 0; p.benar = 0; p.jawab = []; });
  tampil(null); MAIN = true; tampilHUD(true); $('papan').hidden = false; $('alamatKecil').hidden = mode !== 'hp';
  if (mode === 'hp') $('alamatKecil').textContent = '📱 ' + alamatMurid().replace(/^http:\/\//, '');
  GAME.mulai(mode, SESI.soal.length);
  gambarPapan(); lanjutSoal();
}
async function lanjutSoal() {
  SESI.no++;
  if (SESI.no >= SESI.soal.length) return akhirSesi();
  const q = SESI.soal[SESI.no];
  SESI.fase = 'soal'; SESI.sisa = ATUR.waktu; SESI.urutBenar = 0; SESI._detik = Math.ceil(ATUR.waktu); SESI.tMulai = performance.now();
  tampilKartu(q); gambarJawabTim(); gambarHitungJawab();
  GAME.soalBaru && GAME.soalBaru(SESI.no);
  if (SESI.mode === 'hp') siarKeadaan();
}
function tampilKartu(q) {
  const ops = opsiSoal(q);
  $('kNo').textContent = `Soal ${SESI.no + 1} dari ${SESI.soal.length}`;
  $('kTeks').textContent = q.soal; $('kTeks').classList.toggle('panjang', String(q.soal).length > 80);
  $('kOpsi').innerHTML = ops.map(o => `<div class="op" data-h="${o.h}"><i style="background:${WARNA_H[o.h]}">${o.h}</i><span>${esc(o.teks)}</span></div>`).join('');
  $('kartu').hidden = false; $('kartu').className = 'kartu'; $('kWaktu').hidden = false; $('bBuka').hidden = false; $('pembahasan').hidden = true;
}
const WARNA_H = {A: '#e8453c', B: '#2f80ed', C: '#f2a20c', D: '#27ae60'};
// panel jawab tim (mode layar)
function gambarJawabTim() {
  const el = $('jawabTim');
  if (SESI.mode !== 'layar' || SESI.fase !== 'soal') { el.hidden = true; return; }
  el.hidden = false;
  const ops = opsiSoal(SESI.soal[SESI.no]).map(o => o.h);
  el.innerHTML = [...PEMAIN.values()].map(p => { const t = TIM[p.tim], j = p.jawab[SESI.no];
    return `<div class="jt ${j ? 'sudah' : ''}" style="--w:${t.warna}"><b>${esc(p.nama)}</b><div>${ops.map((h, i) => `<button data-id="${p.id}" data-h="${h}" class="${j && j.h === h ? 'pil' : ''}" ${j ? 'disabled' : ''}><i style="background:${WARNA_H[h]}">${h}</i><small>${t.tombol[i]}</small></button>`).join('')}</div>${j ? '<span class="cek">✓ terkunci</span>' : ''}</div>`; }).join('');
  el.querySelectorAll('button[data-h]').forEach(b => b.onclick = () => { const p = PEMAIN.get(b.dataset.id); if (p) terimaJawaban(p, b.dataset.h); });
}
function gambarHitungJawab() {
  if (!SESI || SESI.mode !== 'hp' || SESI.fase !== 'soal') { $('hitungJawab').hidden = true; return; }
  const on = [...PEMAIN.values()].filter(p => p.on), sudah = [...PEMAIN.values()].filter(p => p.jawab[SESI.no]).length;
  $('hitungJawab').hidden = false; $('hitungJawab').textContent = `${sudah} / ${PEMAIN.size} sudah menjawab` + (on.length < PEMAIN.size ? ` · ${PEMAIN.size - on.length} terputus` : '');
}
addEventListener('keydown', e => {
  if (!SESI || SESI.mode !== 'layar' || SESI.fase !== 'soal' || JEDA) return; const k = e.key.toLowerCase();
  [...PEMAIN.values()].forEach(p => { const i = TIM[p.tim].kunci.indexOf(k); if (i >= 0) { const ops = opsiSoal(SESI.soal[SESI.no]); if (ops[i]) terimaJawaban(p, ops[i].h); } });
});
function terimaJawaban(p, h) {
  if (!SESI || SESI.fase !== 'soal' || p.jawab[SESI.no]) return;
  const q = SESI.soal[SESI.no]; if (!opsiSoal(q).some(o => o.h === h)) return;
  const benar = h === kunciSoal(q); const lewat = (performance.now() - SESI.tMulai) / 1000;
  let dapat = 0;
  if (benar) { if (SESI.mode === 'hp') dapat = 500 + Math.round(500 * Math.max(0, 1 - lewat / ATUR.waktu)); else { dapat = 500 + (SESI.urutBenar === 0 ? 200 : 0); } SESI.urutBenar++; }
  p.jawab[SESI.no] = {h, benar, dapat, dtk: Math.round(lewat * 10) / 10};
  efek.pop(); GAME.pilihJawaban && GAME.pilihJawaban(p, h);
  if (SESI.mode === 'layar') gambarJawabTim(); else { gambarHitungJawab(); keMurid(p.id, keadaanUntuk(p)); }
  const semua = [...PEMAIN.values()].filter(x => x.on || SESI.mode === 'layar').every(x => x.jawab[SESI.no]);
  if (semua) setTimeout(() => { if (SESI && SESI.fase === 'soal') bukaJawaban(); }, 600);
}
async function bukaJawaban() {
  if (!SESI || SESI.fase !== 'soal') return;
  SESI.fase = 'buka'; $('kWaktu').hidden = true; $('bBuka').hidden = true; $('jawabTim').hidden = true; $('hitungJawab').hidden = true;
  const q = SESI.soal[SESI.no], kunci = kunciSoal(q);
  $('kOpsi').querySelectorAll('.op').forEach(o => o.classList.add(o.dataset.h === kunci ? 'benar' : 'pudar'));
  efek.gong();
  // hitung hasil, lalu animasi dunia
  const hasil = [...PEMAIN.values()].map(p => { const j = p.jawab[SESI.no]; if (j && j.benar) { p.benar++; p.poin += j.dapat; } return {p, j, benar: !!(j && j.benar)}; });
  await (GAME.bukaJawaban ? GAME.bukaJawaban(kunci, hasil) : tunggu(1));
  SESI.fase = 'hasil'; gambarPapan();
  if (SESI.mode === 'hp') siarKeadaan();
  // pembahasan
  const ops = opsiSoal(q), kOps = ops.find(o => o.h === kunci) || ops[0], jelas = String(q.jelas || '').trim();
  const nb = hasil.filter(h => h.benar).length;
  $('pIsi').innerHTML = `<div class="pJudul">Jawaban: <b style="color:${WARNA_H[kunci]}">${kunci}. ${esc(kOps.teks)}</b></div>${jelas ? `<div class="pJelas">${esc(jelas)}</div>` : ''}<div class="pStat">${nb} dari ${hasil.length} ${SESI.mode === 'layar' ? 'tim' : 'murid'} menjawab benar</div>`;
  $('pembahasan').hidden = false;
  const akhir = SESI.no + 1 >= SESI.soal.length;
  const lanjutTeks = CONTOH && akhir ? 'Selesai ▶' : akhir ? '🏆 Lihat juara' : 'Soal berikutnya ▶';
  $('pLanjut').textContent = lanjutTeks;
  await new Promise(res => { $('pLanjut').onclick = () => { efek.ketuk(); res(); }; if (!ATUR.jeda) tunggu(3.2).then(res); });
  $('pLanjut').onclick = null; $('pembahasan').hidden = true;
  if (CONTOH && akhir) { $('kartu').hidden = true; tawarPaket(`Kamu sudah mencoba ${BATAS_CONTOH} soal contoh.`); return; }
  lanjutSoal();
}
function gambarPapan() {
  if (!SESI || SESI.fase === 'lobi') return;
  const st = skorTim();
  const baris = st ? st.map((t, i) => `<div><span><i style="background:${t.warna}"></i>${esc(t.nama)}</span><b>${angka(t.rata)}</b></div>`)
    : urutPeringkat(PEMAIN.values()).slice(0, SESI.mode === 'layar' ? 4 : 8).map((p, i) => `<div><span>${i + 1}. ${p.tim >= 0 ? `<i style="background:${TIM[p.tim].warna}"></i>` : ''}${esc(p.nama)}</span><b>${angka(p.poin)}</b></div>`);
  $('papan').innerHTML = `<div class="pbJudul">${st ? 'Rata-rata poin tim' : 'Peringkat'}</div>` + baris.join('');
}
async function akhirSesi() {
  SESI.fase = 'akhir'; $('kartu').hidden = true; $('jawabTim').hidden = true; $('hitungJawab').hidden = true; $('papan').hidden = true;
  const urut = urutPeringkat(PEMAIN.values()); const st = skorTim();
  efek.menang();
  if (SESI.mode === 'hp') siarKeadaan();
  await (GAME.podium ? GAME.podium(urut, st) : tunggu(1));
  MAIN = false; tampilHUD(false);
  const top = urut.slice(0, 10);
  $('akJudul').textContent = st ? `🏆 ${st[0].nama} juara!` : `🏆 ${urut[0] ? urut[0].nama : ''} juara!`;
  $('akIsi').innerHTML = (st ? `<table class="hTabel">${st.map((t, i) => `<tr><td>${i + 1}. <i class="tt" style="background:${t.warna}"></i>${esc(t.nama)} <small>(${t.anggota} murid)</small></td><td>${angka(t.rata)} rata-rata</td></tr>`).join('')}</table>` : '')
    + `<table class="hTabel">${top.map((p, i) => `<tr><td>${i + 1}. ${esc(p.nama)}</td><td>${p.benar}/${SESI.soal.length} benar · ${angka(p.poin)}</td></tr>`).join('')}</table>`
    + (urut.length > 10 ? `<div class="gInfo">dan ${urut.length - 10} lainnya. Lengkapnya ada di file nilai.</div>` : '');
  $('akUnduh').hidden = SESI.mode === 'layar' && false;
  tampil('lAkhir'); pastikanDukung();
  $('akUlang').onclick = () => { efek.ketuk(); if (SESI.mode === 'hp') { layarLobi(); } else mulaiSesi('layar'); };
  $('akAtur').onclick = () => { efek.ketuk(); if (SESI.mode === 'hp') siar({t: 'tutup'}); layarAtur(); };
  $('akUnduh').onclick = unduhNilai;
}
function unduhNilai() {
  const n = SESI.soal.length; const urut = urutPeringkat(PEMAIN.values()); const tgl = new Date();
  const kepala = ['Peringkat', SESI.mode === 'layar' ? 'Tim' : 'Nama', 'Tim', 'Benar', 'Jumlah soal', 'Nilai (0-100)', 'Poin', ...Array.from({length: n}, (_, i) => `Soal ${i + 1}`)];
  const baris = urut.map((p, i) => [i + 1, p.nama, p.tim >= 0 ? (SESI.mode === 'layar' ? p.nama : TIM[p.tim].nama) : '', p.benar, n, Math.round(p.benar / n * 100), p.poin,
    ...Array.from({length: n}, (_, k) => { const j = p.jawab[k]; return j ? `${j.h}${j.benar ? ' ✓' : ' ✗'}` : '-'; })]);
  const kunci = ['', 'KUNCI', '', '', '', '', '', ...SESI.soal.map(q => kunciSoal(q))];
  const soalB = ['', 'SOAL', '', '', '', '', '', ...SESI.soal.map(q => q.soal)];
  const csv = '﻿' + [kepala, ...baris, [], kunci, soalB].map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n');
  unduh(`nilai-${GAME.id}-${tgl.toISOString().slice(0, 10)}.csv`, csv, 'text/csv');
}
function unduh(nama, isi, tipe) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([isi], {type: tipe})); a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }

// ---- mode CONTOH: ajakan beli paket ----
function tawarPaket(alasan) {
  $('beliAlasan').textContent = alasan || '';
  $('beliLink').href = window.PAKET_BELI || 'https://www.willoapparel.com/duniakotak/belajar/';
  $('lBeli').hidden = false; MAIN = false; tampilHUD(false);
  $('beliTutup').onclick = () => { $('lBeli').hidden = true; layarAtur(); };
}

// ---------- HUD ----------
function tampilHUD(on) { $('hud').hidden = !on; if (!on) { $('papan').hidden = true; $('alamatKecil').hidden = true; } }
function aturJeda(on) { JEDA = on; $('lJeda').hidden = !on; volMusik(); }
function tulisSuara() { $('bSuara').textContent = !SUARA_ON ? '🔇' : MUSIK_ON ? '🎵' : '🔈'; }
function pasangHUD() {
  tulisSuara();
  $('bSuara').onclick = () => { if (SUARA_ON && MUSIK_ON) MUSIK_ON = false; else if (SUARA_ON) SUARA_ON = false; else { SUARA_ON = MUSIK_ON = true; } volMusik(); tulisSuara(); simpanLS('dksmp:suara', [SUARA_ON, MUSIK_ON]); };
  $('bJeda').onclick = () => { efek.ketuk(); aturJeda(true); };
  $('bBantu').onclick = () => { efek.ketuk(); $('bantuIsi').innerHTML = GAME.bantuan; $('lBantu').hidden = false; if (MAIN) { aturJeda(true); $('lJeda').hidden = true; } };
  $('bantuTutup').onclick = () => { $('lBantu').hidden = true; if (MAIN) aturJeda(false); };
  $('bLayarPenuh').onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} };
  $('jLanjut').onclick = () => { efek.ketuk(); aturJeda(false); };
  $('jMenu').onclick = () => { efek.ketuk(); aturJeda(false); if (SESI && SESI.mode === 'hp') siar({t: 'tutup'}); layarAtur(); };
  $('bBuka').onclick = () => { efek.ketuk(); bukaJawaban(); };
  addEventListener('keydown', e => { if (e.key === 'Escape' && MAIN) aturJeda(!JEDA); });
}

// ===================================================================
// MODE GURU: bank soal, tempel Excel, unduh HTML berisi soal
// ===================================================================
const KOLOM = [['kelas', 'Kelas', '7'], ['topik', 'Topik', 'Bilangan Bulat'], ['soal', 'Soal', '−8 + 5 = …'], ['a', 'A', '−3'], ['b', 'B', '3'], ['c', 'C', '−13'], ['d', 'D', '13'], ['kunci', 'Kunci', 'A'], ['jelas', 'Penjelasan', 'Mundur 8 lalu maju 5.']];
function bukaGerbangGuru() {
  const a = acakInt(6, 12), b = acakInt(6, 12); $('guruGerbang').hidden = false; $('gTanya').textContent = `Untuk guru: berapa ${a} × ${b}?`; $('gJawab').value = ''; $('gJawab').placeholder = '';
  $('gMasuk').onclick = () => { if (+$('gJawab').value === a * b) { $('guruGerbang').hidden = true; bukaGuru(); } else { $('gJawab').value = ''; $('gJawab').placeholder = 'Belum tepat'; } };
  $('gBatal').onclick = () => { $('guruGerbang').hidden = true; }; $('gJawab').onkeydown = e => { if (e.key === 'Enter') $('gMasuk').click(); };
  setTimeout(() => $('gJawab').focus(), 50);
}
let _draf = null, _saring = '';
function bukaGuru() { _draf = JSON.parse(JSON.stringify(DATA)); _saring = ''; $('panelGuru').hidden = false; gambarGuru(); }
function gambarGuru() {
  const d = _draf, kunciS = s => `Kelas ${normKelas(s.kelas)} · ${s.topik || 'Umum'}`, grup = [...new Set(d.soal.map(kunciS))];
  $('guruSaring').innerHTML = `<option value="">Semua (${d.soal.length} soal)</option>` + grup.map(t => `<option ${t === _saring ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const baris = d.soal.map((r, i) => [r, i]).filter(([r]) => !_saring || kunciS(r) === _saring);
  $('guruTabel').innerHTML = `<tr><th>#</th>${KOLOM.map(c => `<th>${c[1]}</th>`).join('')}<th></th></tr>` +
    baris.map(([r, i]) => `<tr><td>${i + 1}</td>${KOLOM.map(([k, , c]) => `<td class="c-${k}"><input data-i="${i}" data-c="${k}" value="${esc(r[k])}" placeholder="${esc(c)}"></td>`).join('')}<td><button class="gHapus" data-i="${i}" title="Hapus">✕</button></td></tr>`).join('');
  $('guruTabel').querySelectorAll('input').forEach(el => el.oninput = () => { d.soal[+el.dataset.i][el.dataset.c] = el.value; });
  $('guruTabel').querySelectorAll('.gHapus').forEach(el => el.onclick = () => { d.soal.splice(+el.dataset.i, 1); gambarGuru(); });
  $('guruInfo').textContent = 'Urutan kolom Excel: ' + KOLOM.map(c => c[1]).join(' | ') + '. Kelas diisi 7, 8, atau 9. Kunci diisi A, B, C, atau D. Pilihan C dan D boleh kosong.';
}
function bacaTempel(teks) {
  const baris = teks.split(/\r?\n/).map(r => r.split(/\t|;/).map(s => s.trim().replace(/^"|"$/g, ''))).filter(r => r.some(Boolean));
  if (baris.length && /^kelas$/i.test(baris[0][0] || '')) baris.shift();
  return baris.map(r => { const o = Object.fromEntries(KOLOM.map(([k], i) => [k, r[i] || ''])); o.kelas = normKelas(o.kelas); return o; }).filter(o => o.soal);
}
function bersihDraf() { _draf.soal = _draf.soal.filter(r => String(r.soal || '').trim()).map(r => ({...r, kelas: normKelas(r.kelas), kunci: kunciSoal(r)})); return _draf; }
function pasangGuru() {
  $('guruSaring').onchange = e => { _saring = e.target.value; gambarGuru(); };
  $('guruTambah').onclick = () => { _draf.soal.push({kelas: ATUR.kelas === 'campur' ? '7' : ATUR.kelas, topik: 'Soal Guru', soal: '', a: '', b: '', c: '', d: '', kunci: 'A', jelas: ''}); _saring = ''; gambarGuru(); const g = $('guruTabel').parentElement; g.scrollTop = g.scrollHeight; };
  $('guruTempel').onclick = () => { const b = bacaTempel($('guruExcel').value); if (!b.length) { $('guruPesan').textContent = 'Tidak ada baris soal yang terbaca.'; return; }
    if ($('guruGanti').checked) _draf.soal = []; _draf.soal.push(...b); $('guruExcel').value = ''; $('guruPesan').textContent = `${b.length} soal ditambahkan.`; _saring = ''; gambarGuru(); };
  $('guruFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; $('guruExcel').value = await f.text(); e.target.value = ''; };
  $('guruSimpan').onclick = () => { const d = bersihDraf(); if (!d.soal.length) { $('guruPesan').textContent = 'Isi minimal satu soal.'; return; }
    DATA = d; simpanLS(KUNCI_BANK(), {sidik: DATA_BAWAAN.sidik, data: d}); $('panelGuru').hidden = true; layarAtur(); };
  $('guruUnduh').onclick = () => { const d = bersihDraf(); const json = JSON.stringify({...d, sidik: 'guru-' + Date.now()}).replace(/</g, '\\u003c');
    const html = HTML_ASLI.replace(/(<script type="application\/json" id="data-soal">)[\s\S]*?(<\/script>)/, (m, a, b) => a + '\n' + json + '\n' + b);
    unduh(GAME.id + '-soal-guru.html', html, 'text/html'); };
  $('guruTemplate').onclick = () => { const r = [KOLOM.map(c => c[1]), KOLOM.map(c => c[2]), ['8', 'Pythagoras', 'Sisi tegak 6 cm dan 8 cm. Sisi miringnya?', '10 cm', '14 cm', '12 cm', '9 cm', 'A', '6² + 8² = 100, akar 100 = 10']];
    unduh('template-soal-dunia-kotak-smp.csv', '﻿' + r.map(x => x.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n'), 'text/csv'); };
  $('guruBawaan').onclick = () => { if ($('guruBawaan').dataset.yakin !== '1') { $('guruBawaan').dataset.yakin = '1'; $('guruBawaan').textContent = 'Yakin? Ketuk lagi'; return; }
    $('guruBawaan').dataset.yakin = ''; $('guruBawaan').textContent = 'Kembalikan soal bawaan'; _draf = JSON.parse(JSON.stringify(DATA_BAWAAN)); try { localStorage.removeItem(KUNCI_BANK()); } catch (e) {} gambarGuru(); };
  $('guruTutup').onclick = () => { $('panelGuru').hidden = true; };
}

// ---------- putaran utama ----------
let _tLalu = performance.now();
function loop() {
  const t = performance.now(), dtNyata = Math.min(1, (t - _tLalu) / 1000), dt = Math.min(.05, dtNyata); _tLalu = t;
  if (!JEDA) {
    updateTween(dt); updatePartikel(dt);
    if (SESI && SESI.fase === 'soal') { SESI.sisa -= dtNyata; // jam nyata, supaya sama dengan hitungan mundur di HP const p = Math.max(0, SESI.sisa / ATUR.waktu); $('kWaktu').firstElementChild.style.width = (p * 100) + '%'; $('kWaktu').classList.toggle('kritis', SESI.sisa < 5);
      const d = Math.ceil(SESI.sisa); if (d < SESI._detik) { SESI._detik = d; $('kDetik').textContent = Math.max(0, d); if (d <= 5 && d > 0) efek.detik(); }
      if (SESI.sisa <= 0) bukaJawaban(); }
    GAME.update && GAME.update(dt, t / 1000);
  }
  const pr = PEMAIN.size > 30 ? 1 : Math.min(devicePixelRatio, 1.75); if (P.R.getPixelRatio() !== pr) P.R.setPixelRatio(pr);
  P.R.render(P.sc, P.cam);
  requestAnimationFrame(loop);
}
async function jalankan() {
  document.title = GAME.judul + ' · Dunia Kotak SMP';
  document.body.classList.add('g-' + GAME.id);
  if (GAME.musik) aturMusik(GAME.musik);
  pasangHUD(); pasangGuru(); GAME.siapkan(); layarJudul(); requestAnimationFrame(loop);
  SERVER = await cekServer(); if (SERVER) { document.body.classList.add('server'); sambungServer(); }
  window.__dks = {GAME, P, ATUR, PEMAIN, SESI: () => SESI, DATA: () => DATA, terimaJawaban, bukaJawaban}; // untuk uji otomatis
}

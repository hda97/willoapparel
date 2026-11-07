// ===================================================================
// Inti bersama DUNIA KOTAK PINTAR (game kuis kelas).
// Digabung ke setiap game oleh edukasi/pintar/build.py -> 1 game = 1 file HTML (offline).
// Isi: panggung 3D, bank soal + pengaturan guru, kartu soal, umpan balik,
//      Mode Guru (tempel Excel), musik & SFX, HUD (suara, jeda, bantuan, kembali).
// ===================================================================
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// ASET ASLI DUNIA KOTAK (sama persis dengan game mabar)
import {warga, KULIT, WARNA_RAMBUT} from '../../../public/duniakotak/mabar/js/aset/avatar.js';
import {kucingMesh, WARNA_KUCING, DAFTAR_KUCING} from '../../../public/duniakotak/mabar/js/aset/kucing.js';
import {rumahMesh} from '../../../public/duniakotak/mabar/js/aset/rumah.js';

const $ = id => document.getElementById(id);
const acak = (a, b) => a + Math.random() * (b - a);
const acakInt = (a, b) => Math.floor(acak(a, b + 1));
const pilih = arr => arr[Math.floor(Math.random() * arr.length)];
const kocok = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const tegak = () => innerWidth / innerHeight < .9;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const simpanLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const bacaLS = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };

// salinan HTML asli (sebelum game berjalan) untuk tombol 'Unduh HTML' di Mode Guru
const HTML_ASLI = '<!doctype html>\n' + document.documentElement.outerHTML;
const DATA_BAWAAN = JSON.parse(($('data-soal') || {textContent: '{"soal":[]}'}).textContent);
// bank soal dipakai bersama ketiga game di perangkat yang sama (kunci sama),
// selama sidik bawaannya sama (file unduhan guru punya sidik sendiri)
const KUNCI_BANK = 'dkpintar:bank';
let DATA = DATA_BAWAAN;
{ const s = bacaLS(KUNCI_BANK, null); if (s && s.sidik === DATA_BAWAAN.sidik && s.data && s.data.soal && s.data.soal.length) DATA = s.data; }

const GAME = {}; // diisi file game: id, judul, ajak, bantuan, jumlah, musik, siapkan, layarPemain, mulai, update, render, hud
let JEDA = false, MAIN = false;

// ---------- geometri kotak membulat gaya Dunia Kotak ----------
const _gk = {};
function kotak(w, h, d, c, rad = .06, m = {}) {
  const k = [w, h, d, rad].join(); const g = _gk[k] || (_gk[k] = new RoundedBoxGeometry(w, h, d, 2, Math.min(rad, w / 2 - .001, h / 2 - .001, d / 2 - .001)));
  const o = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: c, roughness: .8, ...m})); o.castShadow = o.receiveShadow = true; return o;
}
const di = (o, x, y, z) => { o.position.set(x, y, z); return o; };
function variasi(hex, kadar = .05) { const c = new THREE.Color(hex); const h = {}; c.getHSL(h); c.setHSL(h.h, h.s, Math.min(1, Math.max(0, h.l + acak(-kadar, kadar)))); return '#' + c.getHexString(); }
function teksKanvas(teks, bg, fg = '#fff', {kecil = '', ukuran = 84} = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 256, 256); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `800 ${ukuran * 2}px 'Baloo 2', Arial, sans-serif`; x.fillText(teks, 128, kecil ? 108 : 136);
  if (kecil) { let f = 46; x.font = `800 ${f}px 'Baloo 2', Arial, sans-serif`; while (x.measureText(kecil).width > 236 && f > 20) { f -= 2; x.font = `800 ${f}px 'Baloo 2', Arial, sans-serif`; } x.fillText(kecil, 128, 214); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// ubin datar dengan tulisan di atasnya (huruf jawaban, nomor petak)
function ubin(w, d, warna, teks, fg = '#fff', o = {}) {
  const g = new THREE.Group(); const b = kotak(w, o.tebal || .22, d, warna, .07); b.position.y = (o.tebal || .22) / 2; g.add(b);
  if (teks != null) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w * .9, d * .9), new THREE.MeshStandardMaterial({map: teksKanvas(teks, warna, fg, o), roughness: .7})); p.rotation.x = -Math.PI / 2; p.position.y = (o.tebal || .22) + .006; g.add(p); g.userData.label = p; }
  return g;
}
function pohon(s = 1) {
  const g = new THREE.Group(); for (let i = 0; i < 3; i++) g.add(di(kotak(.4 * s, .4 * s, .4 * s, variasi('#8b5a2b', .03)), 0, .2 * s + i * .4 * s, 0));
  g.add(di(kotak(1.8 * s, 1.6 * s, 1.8 * s, variasi('#4caf50', .05), .2), 0, 1.9 * s, 0)); g.add(di(kotak(1.1 * s, 1 * s, 1.1 * s, variasi('#5cbf5a', .06), .15), acak(-.25, .25) * s, 3 * s, acak(-.2, .2) * s)); return g;
}
function bunga(warna) { const g = new THREE.Group(); g.add(di(kotak(.07, .3, .07, '#3f9b3f', .02), 0, .15, 0)); g.add(di(kotak(.2, .14, .2, warna, .05), 0, .34, 0)); g.add(di(kotak(.08, .08, .08, '#ffd23f', .02), 0, .42, 0)); return g; }
function awan(s = 1) { const g = new THREE.Group(); [[0, 0, 2.2, .7], [-.7, .45, 1.2, .6], [.5, .5, 1.1, .7]].forEach(([x, y, w, h]) => { const b = kotak(w * s, h * s, .9 * s, '#ffffff', .2, {roughness: 1}); b.castShadow = false; b.position.set(x * s, y * s, 0); g.add(b); }); return g; }
function tanah(warna = '#7cc96b', ukuran = 160) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = warna; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) { x.fillStyle = variasi(warna, .05); x.globalAlpha = .5; const s = acak(4, 14); x.fillRect(acak(0, 256), acak(0, 256), s, s * acak(.4, 1)); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(ukuran / 10, ukuran / 10);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ukuran, ukuran), new THREE.MeshStandardMaterial({map: t, roughness: 1})); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
}

// ---------- tokoh: siswa & warga (avatar asli) ----------
const SISWA = [
  {nama: 'SD putra', o: {jenis: 'L', rambut: {gaya: 'cepak', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#f6f6f2'}, bawahan: {jenis: 'pendek', warna: '#b8202a'}, topi: '#b8202a', ekspresi: 'senang'}},
  {nama: 'SD putri', o: {jenis: 'P', kulit: '#e0aa7e', rambut: {gaya: 'hijab', warna: '#000'}, hijab: '#f6f6f2', atasan: {jenis: 'seragam', warna: '#f6f6f2'}, bawahan: {jenis: 'rok-panjang', warna: '#b8202a'}, lenganPanjang: true, ekspresi: 'senang'}},
  {nama: 'SMP', o: {jenis: 'L', kulit: '#c98c5e', rambut: {gaya: 'belah', warna: '#3a2416'}, atasan: {jenis: 'seragam', warna: '#f6f6f2'}, bawahan: {jenis: 'celana', warna: '#2a4a8a'}, ekspresi: 'senang'}},
  {nama: 'SMA', o: {jenis: 'P', rambut: {gaya: 'kuncir', warna: '#3a2416'}, atasan: {jenis: 'seragam', warna: '#f6f6f2'}, bawahan: {jenis: 'rok', warna: '#7a7f88'}, ekspresi: 'senang', kacamata: true}},
];
function wargaAcak(i = 0) {
  const P = Math.random() < .5; const baju = ['#4dabf7', '#51cf66', '#fcc419', '#b197fc', '#ff8787', '#ff922b', '#20c997', '#f783ac'];
  return {jenis: P ? 'P' : 'L', kulit: pilih(KULIT.slice(0, 5)), rambut: {gaya: pilih(P ? ['panjang', 'kuncir', 'kepang', 'bob', 'hijab'] : ['cepak', 'belah', 'acak', 'keriting']), warna: pilih(WARNA_RAMBUT.slice(0, 4))},
    atasan: {jenis: pilih(['kaos', 'kaos', 'kemeja', 'batik']), warna: baju[i % baju.length]}, bawahan: {jenis: P ? pilih(['rok', 'celana', 'rok-panjang']) : pilih(['celana', 'pendek']), warna: pilih(['#2f3a52', '#4a5a7a', '#5a3a2a', '#3a3a40'])}, ekspresi: 'senang'};
}
// tokoh: grup luar (posisi/arah) + tubuh (loncat) + avatar
function buatTokoh(opsi, skala = .3) {
  const g = new THREE.Group(), tb = new THREE.Group(); g.add(tb);
  const w = warga(opsi); w.scale.setScalar(skala); tb.add(w);
  const u = w.userData; g.userData = {tb, u, t: Math.random() * 6, mode: 'diam', tMode: 0}; return g;
}
function buatKucing(warna, skala = .55) {
  const g = new THREE.Group(), tb = new THREE.Group(); g.add(tb);
  const k = kucingMesh(warna, {skala}); k.rotation.y = -Math.PI / 2; tb.add(k); // hadap +z
  g.userData = {tb, kucing: k, kepala: k.userData.head, ekor: k.userData.tail, t: Math.random() * 6, mode: 'diam', tMode: 0}; return g;
}
function setMode(o, m, lama = 0) { const u = o.userData; u.mode = m; u.tMode = 0; u.sampai = lama; }
function animTokoh(o, dt) {
  const u = o.userData; u.t += dt; u.tMode += dt; const t = u.t; if (u.sampai && u.tMode > u.sampai) { u.mode = 'diam'; u.sampai = 0; }
  const L = (ob, p, v, f = .25) => { ob.rotation[p] += (v - ob.rotation[p]) * Math.min(1, f * dt * 60); };
  let ay = 0;
  if (u.kucing) {
    if (u.mode === 'lari') ay = Math.abs(Math.sin(t * 16)) * .22; else if (u.mode === 'senang') ay = Math.abs(Math.sin(u.tMode * 8)) * .45; else ay = Math.sin(t * 2) * .015;
    u.tb.rotation.z = u.mode === 'lari' ? Math.sin(t * 16) * .06 : 0;
    u.ekor.rotation.x = Math.sin(t * (u.mode === 'diam' ? 3 : 14)) * .4;
    L(u.kepala, 'x', u.mode === 'geleng' ? Math.sin(u.tMode * 14) * .35 * Math.max(0, 1 - u.tMode / 1.2) : 0, .5);
  } else {
    const a = u.u; let lk = 0, lr = 0, kk = 0, kr = 0, ky = 0;
    if (u.mode === 'jalan') { const w = Math.sin(t * 11); lk = w * .7; lr = -w * .7; kk = -w * .6; kr = w * .6; ay = Math.abs(Math.sin(t * 11)) * .05; }
    else if (u.mode === 'senang') { ay = Math.abs(Math.sin(u.tMode * 7)) * .35; lk = -2.6 + Math.sin(t * 14) * .3; lr = -2.6 - Math.sin(t * 14) * .3; }
    else if (u.mode === 'geleng') { ky = Math.sin(u.tMode * 14) * .35 * Math.max(0, 1 - u.tMode / 1.2); }
    else if (u.mode === 'bendera') { lr = -3.0; const w = Math.sin(t * 11); lk = u.jalan ? w * .7 : 0; kk = u.jalan ? -w * .6 : 0; kr = u.jalan ? w * .6 : 0; ay = u.jalan ? Math.abs(w) * .05 : Math.sin(t * 2) * .01; }
    else { ay = Math.sin(t * 2.2) * .012; lk = Math.sin(t * 2.2) * .05; lr = -lk; }
    L(a.armL, 'x', lk); L(a.armR, 'x', lr); L(a.legL, 'x', kk); L(a.legR, 'x', kr); L(a.head, 'y', ky);
  }
  u.tb.position.y += (ay - u.tb.position.y) * Math.min(1, .35 * dt * 60);
}
// wajah kucing Oyen datar (maskot di pop up), digambar sekali ke gambar
const MASKOT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#f0a050'; x.beginPath(); x.moveTo(14, 44); x.lineTo(30, 6); x.lineTo(52, 34); x.moveTo(114, 44); x.lineTo(98, 6); x.lineTo(76, 34); x.fill();
  x.fillStyle = '#ff9aa8'; x.beginPath(); x.moveTo(24, 36); x.lineTo(31, 18); x.lineTo(42, 32); x.moveTo(104, 36); x.lineTo(97, 18); x.lineTo(86, 32); x.fill();
  x.fillStyle = '#f0a050'; x.beginPath(); x.roundRect(8, 26, 112, 96, 18); x.fill(); x.fillStyle = '#c87830'; x.fillRect(52, 26, 10, 22); x.fillRect(68, 26, 10, 16);
  x.fillStyle = '#fff3e0'; x.fillRect(36, 78, 56, 36); x.fillStyle = '#1a1a1a'; x.fillRect(32, 56, 14, 18); x.fillRect(82, 56, 14, 18); x.fillStyle = '#fff'; x.fillRect(35, 58, 5, 6); x.fillRect(85, 58, 5, 6);
  x.fillStyle = '#ff7a8a'; x.fillRect(58, 80, 12, 8); x.strokeStyle = '#3a2210'; x.lineWidth = 4; x.beginPath(); x.moveTo(64, 88); x.lineTo(64, 94); x.moveTo(52, 100); x.quadraticCurveTo(64, 92, 76, 100); x.stroke();
  return c.toDataURL(); })();

// ---------- panggung ----------
const P = {};
function siapPanggung({langit = '#bfe6ff', kabut = null, bayangan = 30} = {}) {
  const R = new THREE.WebGLRenderer({canvas: $('layar'), antialias: true});
  R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 1.0; // netral: warna tetap cerah, tidak pucat
  const sc = new THREE.Scene(); sc.background = new THREE.Color(langit); sc.fog = new THREE.Fog(kabut || langit, 60, 140);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x8fb07a, 1.05));
  const mt = new THREE.DirectionalLight(0xfff1dc, 2.1); mt.position.set(10, 22, 14); mt.castShadow = true; mt.shadow.mapSize.set(2048, 2048);
  Object.assign(mt.shadow.camera, {left: -bayangan, right: bayangan, top: bayangan, bottom: -bayangan, near: 1, far: 90}); mt.shadow.bias = -.0004; sc.add(mt); sc.add(mt.target);
  const cam = new THREE.PerspectiveCamera(36, 1, .1, 300);
  Object.assign(P, {R, sc, cam, mt});
  const ukur = () => { R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); GAME.ukur && GAME.ukur(); };
  addEventListener('resize', ukur); ukur(); return P;
}
// geser cahaya matahari mengikuti titik fokus (bayangan tetap tajam)
function ikutCahaya(x, y, z) { P.mt.position.set(x + 10, y + 22, z + 14); P.mt.target.position.set(x, y, z); }

// ---------- suara: SFX + musik (disintesis, tanpa file) ----------
let AC = null, SUARA_ON = true, MUSIK_ON = true;
{ const sv = bacaLS('dkpintar:suara', null); if (sv) { SUARA_ON = sv[0]; MUSIK_ON = sv[1]; } }
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
  langkah() { nada(acak(160, 210), 0, .07, {tipe: 'sine', vol: .08, ke: 90}); },
  lompat() { nada(300, 0, .16, {tipe: 'sine', vol: .12, ke: 700}); },
  menang() { [523, 523, 659, 784, 659, 784, 1046].forEach((f, i) => nada(f, i * .13, .3, {tipe: 'square', vol: .07})); },
  kilau() { [2093, 2637, 3136, 2637].forEach((f, i) => nada(f, i * .05, .18, {tipe: 'sine', vol: .05})); },
  dadu() { for (let i = 0; i < 9; i++) nada(acak(500, 900), i * .07, .05, {tipe: 'square', vol: .04}); },
  naik() { [392, 494, 587, 698, 784, 988].forEach((f, i) => nada(f, i * .07, .16, {tipe: 'triangle', vol: .12})); },
  turun() { desis(.7, 2400, 300, .14); [784, 659, 523, 392].forEach((f, i) => nada(f, i * .1, .18, {tipe: 'sine', vol: .1})); },
  tabrak() { nada(140, 0, .14, {tipe: 'square', vol: .08, ke: 70}); },
  wus() { desis(.4); },
  detik() { nada(1200, 0, .04, {tipe: 'sine', vol: .06}); },
};
let MUSIK = null, mGain = null, mTimer = null, mNext = 0, mStep = 0, mMelodi = [], _redam = false;
function aturMusik(cfg) {
  MUSIK = Object.assign({bpm: 110, nada: 60, skala: [0, 2, 4, 5, 7, 9, 11], alat: 'marimba', progresi: [0, 4, 5, 3], benih: 7, drum: true}, cfg);
  let x = MUSIK.benih * 9301 + 49297; const r = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  mMelodi = []; let deg = 2;
  for (let bar = 0; bar < 4; bar++) { const ak = MUSIK.progresi[bar], na = [ak, ak + 2, ak + 4];
    for (let s = 0; s < 16; s++) { const kuat = s % 4 === 0, main = kuat ? r() < .9 : s % 2 === 0 ? r() < .55 : r() < .18; if (!main) { mMelodi.push(null); continue; }
      if (kuat) { const c = []; na.forEach(d => [d, d + 7].forEach(v => c.push(v))); c.sort((a, b) => Math.abs(a - deg) - Math.abs(b - deg)); deg = c[r() < .7 ? 0 : 1]; } else deg += r() < .5 ? 1 : -1;
      deg = Math.max(0, Math.min(9, deg)); mMelodi.push(deg); } }
}
const frek = (deg, okt = 0) => { const sk = MUSIK.skala, o = Math.floor(deg / 7); return 440 * Math.pow(2, (MUSIK.nada + sk[((deg % 7) + 7) % 7] + 12 * (o + okt) - 69) / 12); };
function bunyiAlat(f, t, lama, alat, vol) {
  const part = {marimba: ['sine', 4, .3], pluck: ['triangle', 2, .25], kotakmusik: ['sine', 3, .45], xilofon: ['triangle', 3.98, .2]}[alat] || ['sine', 2, .2];
  [[part[0], 1, 1, lama], ['sine', part[1], part[2], lama * .35]].forEach(([tp, m, v, l]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = tp; o.frequency.value = f * m;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * v, t + .008); g.gain.exponentialRampToValueAtTime(.0008, t + l); o.connect(g).connect(mGain); o.start(t); o.stop(t + lama + .02); });
}
let _hat = null;
function langkahMusik(i, t) {
  const sp = 60 / MUSIK.bpm / 2, bar = Math.floor(i / 16) % 4, s = i % 16, ak = MUSIK.progresi[bar];
  const m = mMelodi[i % 64]; if (m != null) bunyiAlat(frek(m, 1), t, sp * 1.8, MUSIK.alat, .15);
  if (s % 4 === 0) bunyiAlat(frek(ak, -1), t, sp * 3.5, 'pluck', .16);
  if (s % 8 === 4) { bunyiAlat(frek(ak + 2), t, sp * 2, MUSIK.alat, .05); bunyiAlat(frek(ak + 4), t, sp * 2, MUSIK.alat, .05); }
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
function volMusik(lama = .3) { if (!mGain) return; const v = !SUARA_ON || !MUSIK_ON ? 0 : (_redam || JEDA) ? .06 : .18; mGain.gain.cancelScheduledValues(AC.currentTime); mGain.gain.setValueAtTime(mGain.gain.value, AC.currentTime); mGain.gain.linearRampToValueAtTime(v, AC.currentTime + lama); }
document.addEventListener('visibilitychange', () => { if (!AC) return; if (document.hidden) AC.suspend(); else AC.resume(); });

// ---------- tween & partikel (ikut berhenti saat Jeda) ----------
const tween = [];
function animasi(lama, fn = () => {}, mudah = t => 1 - Math.pow(1 - t, 3)) { return new Promise(res => tween.push({t: 0, lama, fn, mudah, res})); }
const tunggu = lama => animasi(lama);
function updateTween(dt) { for (let i = tween.length - 1; i >= 0; i--) { const w = tween[i]; w.t += dt; const p = Math.min(1, w.t / w.lama); w.fn(w.mudah(p), p); if (p >= 1) { tween.splice(i, 1); w.res(); } } }
const lompatKe = (o, ke, lama = .4, tinggi = .6) => { const a = o.position.clone(); return animasi(lama, (e, p) => { o.position.lerpVectors(a, ke, p); o.position.y += Math.sin(p * Math.PI) * tinggi; }, t => t); };
const partikel = []; const _gp = new THREE.BoxGeometry(.12, .12, .12);
function konfeti(pos, n = 36, warna = ['#ff5a5f', '#ffd23f', '#3ec1d3', '#7bd389', '#a78bfa', '#ff9f1c']) {
  efek.kilau();
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(_gp, new THREE.MeshStandardMaterial({color: pilih(warna), roughness: .6})); m.position.copy(pos);
    m.userData = {v: new THREE.Vector3(acak(-3, 3), acak(4, 8), acak(-3, 3)), r: new THREE.Vector3(acak(-8, 8), acak(-8, 8), 0), umur: acak(1, 1.6), y0: pos.y - 1}; P.sc.add(m); partikel.push(m); }
}
function updatePartikel(dt) {
  for (let i = partikel.length - 1; i >= 0; i--) { const m = partikel[i], u = m.userData; u.umur -= dt; u.v.y -= 14 * dt; m.position.addScaledVector(u.v, dt); m.rotation.x += u.r.x * dt; m.rotation.y += u.r.y * dt;
    if (m.position.y < u.y0) { m.position.y = u.y0; u.v.multiplyScalar(.4); u.v.y = Math.abs(u.v.y); }
    if (u.umur < .3) m.scale.setScalar(Math.max(.01, u.umur / .3)); if (u.umur <= 0) { P.sc.remove(m); m.material.dispose(); partikel.splice(i, 1); } }
}

// ===================================================================
// BANK SOAL & PENGATURAN GURU
// ===================================================================
const TINGKAT = [['mudah', 'Mudah'], ['sedang', 'Sedang'], ['sulit', 'Sulit'], ['campur', 'Campur']];
const normTingkat = t => { t = String(t || '').toLowerCase().trim(); return t.startsWith('mud') ? 'mudah' : t.startsWith('sed') ? 'sedang' : t.startsWith('sul') || t.startsWith('suk') ? 'sulit' : 'sedang'; };
function daftarTopik() { const m = new Map(); DATA.soal.forEach(s => { const t = (s.topik || 'Umum').trim(); m.set(t, (m.get(t) || 0) + 1); }); return [...m]; }
let ATUR = Object.assign({topik: '', tingkat: 'campur', timer: 0, jeda: true, jumlah: null}, bacaLS('dkpintar:atur', {}));
function opsiSoal(s) { return ['a', 'b', 'c', 'd'].map((k, i) => ({h: 'ABCD'[i], teks: String(s[k] ?? '').trim()})).filter(o => o.teks); }
function kunciSoal(s) { const k = String(s.kunci || '').trim(); const up = k.toUpperCase(); if (/^[ABCD]$/.test(up)) return up; const o = opsiSoal(s).find(o => o.teks.toLowerCase() === k.toLowerCase()); return o ? o.h : 'A'; }
// antrean soal sesuai topik & tingkat; diacak, berulang bila habis
const ANTRE = {};
function ambilSoal(saluran = 0) {
  const q = ANTRE[saluran] || (ANTRE[saluran] = []);
  if (!q.length) {
    let s = DATA.soal.filter(x => (!ATUR.topik || (x.topik || 'Umum').trim() === ATUR.topik) && opsiSoal(x).length >= 2);
    if (ATUR.tingkat !== 'campur') { const t = s.filter(x => normTingkat(x.tingkat) === ATUR.tingkat); if (t.length) s = t; }
    if (!s.length) s = DATA.soal.filter(x => opsiSoal(x).length >= 2);
    q.push(...kocok(s));
  }
  return q.shift();
}
function resetAntre() { Object.keys(ANTRE).forEach(k => delete ANTRE[k]); }

// ---------- kartu soal + timer + umpan balik (bisa lebih dari satu: layar belah) ----------
const kartuAktif = new Set();
function buatKartu(wadah) {
  const el = document.createElement('div'); el.className = 'kSoal';
  el.innerHTML = `<div class="kWaktu" hidden><i></i></div><div class="kTeks"></div><div class="kOpsi"></div><div class="kUmpan" hidden></div>`;
  wadah.appendChild(el); return {el, teks: el.querySelector('.kTeks'), opsi: el.querySelector('.kOpsi'), waktu: el.querySelector('.kWaktu'), umpan: el.querySelector('.kUmpan'), sisa: 0, aktif: false};
}
const WARNA_H = {A: '#ff6b6b', B: '#4dabf7', C: '#fab005', D: '#51cf66'};
// tampilkan soal; resolve {benar, pilih} saat dijawab atau waktu habis (pilih null)
function tanya(k, s, {opsiTampil = true} = {}) {
  k.el.classList.remove('selesai'); k.umpan.hidden = true; k.soal = s;
  k.teks.textContent = s.soal; k.teks.classList.toggle('panjang', String(s.soal).length > 70);
  const ops = opsiSoal(s), kunci = kunciSoal(s);
  k.opsi.innerHTML = ''; k.opsi.hidden = !opsiTampil; k.opsi.classList.toggle('dua', ops.length <= 2);
  return new Promise(res => {
    k.selesai = (h) => { if (!k.aktif) return; k.aktif = false; kartuAktif.delete(k); k.waktu.hidden = true; const benar = h === kunci;
      k.opsi.querySelectorAll('button').forEach(b => { b.disabled = true; if (b.dataset.h === kunci) b.classList.add('benar'); else if (b.dataset.h === h) b.classList.add('salah'); else b.classList.add('pudar'); });
      res({benar, pilih: h, kunci}); };
    ops.forEach(o => { const b = document.createElement('button'); b.className = 'op'; b.dataset.h = o.h;
      b.innerHTML = `<i style="background:${WARNA_H[o.h]}">${o.h}</i><span>${esc(o.teks)}</span>`; b.onclick = () => { if (JEDA) return; efek.ketuk(); k.selesai(o.h); }; k.opsi.appendChild(b); });
    k.el._kunci = kunci; k.aktif = true; k.sisa = ATUR.timer; k.waktu.hidden = !ATUR.timer; k.waktu.firstElementChild.style.width = '100%'; if (ATUR.timer) kartuAktif.add(k);
  });
}
function updateKartu(dt) {
  kartuAktif.forEach(k => { const lalu = Math.ceil(k.sisa); k.sisa -= dt; const p = Math.max(0, k.sisa / ATUR.timer); k.waktu.firstElementChild.style.width = (p * 100) + '%'; k.waktu.classList.toggle('kritis', k.sisa < 5);
    if (Math.ceil(k.sisa) < lalu && k.sisa < 5 && k.sisa > 0) efek.detik(); if (k.sisa <= 0) k.selesai(null); });
}
// umpan balik di dalam kartu: benar -> singkat; salah -> maskot + kunci + penjelasan.
// Jeda soal nyala -> tunggu tombol Lanjut; mati -> lanjut otomatis.
function umpan(k, hasil, {judulBenar = pilih(['Benar!', 'Hebat!', 'Pintar!', 'Mantap!']), tambahan = ''} = {}) {
  const s = k.soal, kunci = hasil.kunci, ops = opsiSoal(s), kOps = ops.find(o => o.h === kunci) || ops[0];
  const jelas = String(s.jelas || '').trim();
  k.el.classList.add('selesai');
  const isi = hasil.benar
    ? `<div class="uJudul benar">${judulBenar}</div>${tambahan ? `<div class="uTambah">${tambahan}</div>` : ''}${ATUR.jeda && jelas ? `<div class="uJelas">${esc(jelas)}</div>` : ''}`
    : `<img class="uMaskot" src="${MASKOT}" alt=""><div><div class="uJudul salah">${hasil.pilih ? 'Yah, belum tepat!' : 'Waktu habis!'}</div>
       <div class="uJelas">Jawaban benar: <b>${kunci}. ${esc(kOps.teks)}</b>${jelas ? '<br>' + esc(jelas) : ''}</div>${tambahan ? `<div class="uTambah">${tambahan}</div>` : ''}</div>`;
  k.umpan.innerHTML = `<div class="uIsi ${hasil.benar ? '' : 'adaMaskot'}">${isi}</div>` + (ATUR.jeda ? '<button class="uLanjut">Lanjut ▶</button>' : '');
  k.umpan.hidden = false; k.umpan.className = 'kUmpan ' + (hasil.benar ? 'ub' : 'us');
  return new Promise(res => {
    const tutup = () => { k.umpan.hidden = true; res(); };
    if (ATUR.jeda) k.umpan.querySelector('.uLanjut').onclick = () => { efek.ketuk(); tutup(); };
    else tunggu(hasil.benar ? 1.1 : 2.4).then(tutup);
  });
}

// ===================================================================
// LAYAR: judul, pengaturan, pemain, hasil, jeda, bantuan
// ===================================================================
function tampil(id) { ['lJudul', 'lAtur', 'lPemain', 'lHasil'].forEach(x => { $(x).hidden = x !== id; }); document.body.dataset.layar = id || 'main'; }
function pastikanDukung() {
  document.querySelectorAll('.dukung').forEach(a => { a.href = 'https://www.willoapparel.com'; a.target = '_blank'; a.rel = 'noopener'; a.innerHTML = 'Supported by <b>www.willoapparel.com</b>';
    a.style.cssText = 'display:inline-block!important;visibility:visible!important;opacity:1!important'; });
  ['lJudul', 'lHasil'].forEach(id => { const k = $(id); if (k && !k.querySelector('.dukung')) { const a = document.createElement('a'); a.className = 'dukung'; k.querySelector('.kotak, .jBawah')?.appendChild(a); pastikanDukung(); } });
}
function layarJudul() {
  const WJ = ['#ff6b6b', '#ff922b', '#fcc419', '#51cf66', '#339af0', '#845ef7', '#f06595'];
  let n = 0; $('jJudul').innerHTML = GAME.judul.split(' ').map(k => `<b class="kata">${[...k].map(c => `<span style="color:${WJ[n % 7]};animation-delay:${(n++ * .09).toFixed(2)}s">${esc(c)}</span>`).join('')}</b>`).join(' ');
  $('jAjak').textContent = GAME.ajak; tampil('lJudul'); pastikanDukung();
  $('bMulai').onclick = () => { siapSuara(); mulaiMusik(); efek.ketuk(); layarAtur(); };
}
function layarAtur() {
  tampil('lAtur'); MAIN = false; tampilHUD(false);
  const topik = daftarTopik(); if (!topik.some(t => t[0] === ATUR.topik)) ATUR.topik = topik[0] ? topik[0][0] : '';
  const J = GAME.jumlah; if (J && !J.opsi.includes(ATUR.jumlah)) ATUR.jumlah = J.def;
  const seg = (k, opsi) => `<div class="seg" data-k="${k}">${opsi.map(([v, t]) => `<button data-v="${v}" class="${String(ATUR[k]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  $('aTopik').innerHTML = topik.map(([t, n]) => `<button class="pilT ${t === ATUR.topik ? 'on' : ''}" data-t="${esc(t)}"><span>${esc(t)}</span><small>${n} soal</small></button>`).join('') || '<p>Belum ada soal. Buka Mode Guru untuk menambah soal.</p>';
  $('aKanan').innerHTML = `<div class="lbl">Tingkat</div>${seg('tingkat', TINGKAT)}
    <div class="lbl">Timer per soal</div>${seg('timer', [[0, 'Tanpa timer'], [20, '20 dtk'], [30, '30 dtk'], [60, '60 dtk']])}
    <div class="lbl">Jeda soal <small>(tunggu tombol Lanjut, guru bisa menjelaskan)</small></div>${seg('jeda', [[true, 'Nyala'], [false, 'Mati']])}
    ${J ? `<div class="lbl">${J.label}</div>${seg('jumlah', J.opsi.map(v => [v, v]))}` : ''}`;
  $('aTopik').querySelectorAll('.pilT').forEach(b => b.onclick = () => { efek.ketuk(); ATUR.topik = b.dataset.t; $('aTopik').querySelectorAll('.pilT').forEach(x => x.classList.toggle('on', x === b)); });
  $('aKanan').querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => { efek.ketuk(); const k = sg.dataset.k, v = b.dataset.v; ATUR[k] = k === 'jeda' ? v === 'true' : k === 'tingkat' ? v : +v; sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }));
  $('aLanjut').onclick = () => { efek.ketuk(); simpanLS('dkpintar:atur', ATUR); resetAntre(); tampil('lPemain'); GAME.layarPemain($('pIsi'), () => { tampil(null); MAIN = true; tampilHUD(true); GAME.mulai(); }); };
  $('aGuru').onclick = bukaGerbangGuru;
}
function layarHasil(judul, isiHTML) {
  MAIN = false; tampilHUD(false); efek.menang();
  $('hJudul').textContent = judul; $('hIsi').innerHTML = isiHTML; tampil('lHasil'); pastikanDukung();
  $('hUlang').onclick = () => { efek.ketuk(); tampil(null); MAIN = true; tampilHUD(true); resetAntre(); GAME.mulai(); };
  $('hAtur').onclick = () => { efek.ketuk(); GAME.keMenu && GAME.keMenu(); layarAtur(); };
}
function tampilHUD(on) { $('hud').hidden = !on; }
function aturJeda(on) { JEDA = on; $('lJeda').hidden = !on; volMusik(); }
function tulisSuara() { $('bSuara').textContent = !SUARA_ON ? '🔇' : MUSIK_ON ? '🎵' : '🔈'; $('bSuara').title = !SUARA_ON ? 'Semua suara mati' : MUSIK_ON ? 'Musik & efek nyala' : 'Musik mati, efek nyala'; }
function pasangHUD() {
  tulisSuara();
  $('bSuara').onclick = () => { if (SUARA_ON && MUSIK_ON) MUSIK_ON = false; else if (SUARA_ON) SUARA_ON = false; else { SUARA_ON = MUSIK_ON = true; } volMusik(); tulisSuara(); simpanLS('dkpintar:suara', [SUARA_ON, MUSIK_ON]); };
  $('bJeda').onclick = () => { efek.ketuk(); aturJeda(true); };
  $('bBantu').onclick = () => { efek.ketuk(); $('bantuIsi').innerHTML = GAME.bantuan; $('lBantu').hidden = false; if (MAIN) aturJeda(true), $('lJeda').hidden = true; };
  $('bantuTutup').onclick = () => { $('lBantu').hidden = true; if (MAIN) aturJeda(false); };
  $('bKembali').onclick = () => { efek.ketuk(); aturJeda(true); };
  $('jLanjut').onclick = () => { efek.ketuk(); aturJeda(false); };
  $('jMenu').onclick = () => { efek.ketuk(); aturJeda(false); GAME.keMenu && GAME.keMenu(); kartuAktif.clear(); layarAtur(); };
  addEventListener('keydown', e => { if (e.key === 'Escape' && MAIN) aturJeda(!JEDA); });
}

// ===================================================================
// MODE GURU: bank soal bersama, tempel Excel, unduh HTML berisi soal
// ===================================================================
const KOLOM = [['topik', 'Topik', 'IPAS SD'], ['tingkat', 'Tingkat', 'mudah'], ['soal', 'Soal', 'Hewan pemakan tumbuhan disebut…'], ['a', 'A', 'herbivora'], ['b', 'B', 'karnivora'], ['c', 'C', 'omnivora'], ['d', 'D', 'predator'], ['kunci', 'Kunci', 'A'], ['jelas', 'Penjelasan', 'Herbivora memakan tumbuhan.']];
function bukaGerbangGuru() {
  const a = acakInt(3, 9), b = acakInt(3, 9); $('guruGerbang').hidden = false; $('gTanya').textContent = `Untuk guru: berapa ${a} × ${b}?`; $('gJawab').value = ''; $('gJawab').placeholder = '';
  $('gMasuk').onclick = () => { if (+$('gJawab').value === a * b) { $('guruGerbang').hidden = true; bukaGuru(); } else { $('gJawab').value = ''; $('gJawab').placeholder = 'Belum tepat'; } };
  $('gBatal').onclick = () => { $('guruGerbang').hidden = true; }; $('gJawab').onkeydown = e => { if (e.key === 'Enter') $('gMasuk').click(); };
  setTimeout(() => $('gJawab').focus(), 50);
}
let _draf = null, _saring = '';
function bukaGuru() { _draf = JSON.parse(JSON.stringify(DATA)); _saring = ''; $('panelGuru').hidden = false; gambarGuru(); }
function gambarGuru() {
  const d = _draf, topik = [...new Set(d.soal.map(s => s.topik || 'Umum'))];
  $('guruSaring').innerHTML = `<option value="">Semua topik (${d.soal.length} soal)</option>` + topik.map(t => `<option ${t === _saring ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const baris = d.soal.map((r, i) => [r, i]).filter(([r]) => !_saring || (r.topik || 'Umum') === _saring);
  $('guruTabel').innerHTML = `<tr><th>#</th>${KOLOM.map(c => `<th>${c[1]}</th>`).join('')}<th></th></tr>` +
    baris.map(([r, i]) => `<tr><td>${i + 1}</td>${KOLOM.map(([k, , c]) => `<td class="c-${k}"><input data-i="${i}" data-c="${k}" value="${esc(r[k])}" placeholder="${esc(c)}"></td>`).join('')}<td><button class="gHapus" data-i="${i}" title="Hapus">✕</button></td></tr>`).join('');
  $('guruTabel').querySelectorAll('input').forEach(el => el.oninput = () => { d.soal[+el.dataset.i][el.dataset.c] = el.value; });
  $('guruTabel').querySelectorAll('.gHapus').forEach(el => el.onclick = () => { d.soal.splice(+el.dataset.i, 1); gambarGuru(); });
  $('guruInfo').textContent = 'Urutan kolom Excel: ' + KOLOM.map(c => c[1]).join(' | ') + '. Kunci diisi A, B, C, atau D. Pilihan C dan D boleh kosong.';
}
function bacaTempel(teks) {
  const baris = teks.split(/\r?\n/).map(r => r.split(/\t|;/).map(s => s.trim().replace(/^"|"$/g, ''))).filter(r => r.some(Boolean));
  if (baris.length && /^topik$/i.test(baris[0][0] || '')) baris.shift();
  return baris.map(r => { const o = Object.fromEntries(KOLOM.map(([k], i) => [k, r[i] || ''])); o.tingkat = normTingkat(o.tingkat); return o; }).filter(o => o.soal);
}
function bersihDraf() { _draf.soal = _draf.soal.filter(r => String(r.soal || '').trim()).map(r => ({...r, tingkat: normTingkat(r.tingkat), kunci: kunciSoal(r)})); return _draf; }
function unduh(nama, isi, tipe) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([isi], {type: tipe})); a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
function pasangGuru() {
  $('guruSaring').onchange = e => { _saring = e.target.value; gambarGuru(); };
  $('guruTambah').onclick = () => { _draf.soal.push({topik: _saring || (daftarTopik()[0] || ['Umum'])[0], tingkat: 'mudah', soal: '', a: '', b: '', c: '', d: '', kunci: 'A', jelas: ''}); gambarGuru(); const g = $('guruTabel').parentElement; g.scrollTop = g.scrollHeight; };
  $('guruTempel').onclick = () => { const b = bacaTempel($('guruExcel').value); if (!b.length) { $('guruPesan').textContent = 'Tidak ada baris soal yang terbaca.'; return; }
    if ($('guruGanti').checked) _draf.soal = []; _draf.soal.push(...b); $('guruExcel').value = ''; $('guruPesan').textContent = `${b.length} soal ditambahkan.`; _saring = ''; gambarGuru(); };
  $('guruFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; $('guruExcel').value = await f.text(); e.target.value = ''; };
  $('guruSimpan').onclick = () => { const d = bersihDraf(); if (!d.soal.length) { $('guruPesan').textContent = 'Isi minimal satu soal.'; return; }
    DATA = d; simpanLS(KUNCI_BANK, {sidik: DATA_BAWAAN.sidik, data: d}); resetAntre(); $('panelGuru').hidden = true; layarAtur(); };
  $('guruUnduh').onclick = () => { const d = bersihDraf(); const json = JSON.stringify({...d, sidik: 'guru-' + Date.now()}).replace(/</g, '\\u003c');
    const html = HTML_ASLI.replace(/(<script type="application\/json" id="data-soal">)[\s\S]*?(<\/script>)/, (m, a, b) => a + '\n' + json + '\n' + b);
    unduh(GAME.id + '-soal-guru.html', html, 'text/html'); };
  $('guruTemplate').onclick = () => { const r = [KOLOM.map(c => c[1]), KOLOM.map(c => c[2]), ['Matematika Kelas 1', 'sedang', '8 + 5 = …', '12', '13', '14', '15', 'B', '8 + 2 = 10, lalu 10 + 3 = 13']];
    unduh('template-soal-dunia-kotak-pintar.csv', '﻿' + r.map(x => x.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n'), 'text/csv'); };
  $('guruBawaan').onclick = () => { if ($('guruBawaan').dataset.yakin !== '1') { $('guruBawaan').dataset.yakin = '1'; $('guruBawaan').textContent = 'Yakin? Ketuk lagi'; return; }
    $('guruBawaan').dataset.yakin = ''; $('guruBawaan').textContent = 'Kembalikan soal bawaan'; _draf = JSON.parse(JSON.stringify(DATA_BAWAAN)); try { localStorage.removeItem(KUNCI_BANK); } catch (e) {} gambarGuru(); };
  $('guruTutup').onclick = () => { $('panelGuru').hidden = true; };
}

// ---------- putaran utama ----------
let _tLalu = performance.now();
function loop() {
  const t = performance.now(), dt = Math.min(.05, (t - _tLalu) / 1000); _tLalu = t;
  if (!JEDA) { updateTween(dt); updatePartikel(dt); updateKartu(dt); GAME.update && GAME.update(dt, t / 1000); }
  GAME.render ? GAME.render() : P.R.render(P.sc, P.cam);
  requestAnimationFrame(loop);
}
// dipanggil di akhir file game
function jalankan() {
  document.title = GAME.judul + ' · Dunia Kotak Pintar';
  document.body.classList.add('g-' + GAME.id);
  if (GAME.musik) aturMusik(GAME.musik);
  pasangHUD(); pasangGuru(); GAME.siapkan(); layarJudul(); requestAnimationFrame(loop);
  window.__dkp = {GAME, P, ATUR, DATA: () => DATA}; // untuk uji otomatis
}

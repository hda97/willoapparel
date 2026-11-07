// Pelari Kalcer 3D — vertical slice 1 KM (Lintasan 1: Jalan Aspal, Sudirman CFD Pagi)
// Sumber visual: gambar aset dari Huda (dipotong oleh potong_aset.py, disisipkan sebagai window.ASET).
import * as THREE from 'three';
import qrcode from 'qrcode-generator';

const ASET = window.ASET || {};
const $ = (id) => document.getElementById(id);
document.querySelectorAll('img[data-aset]').forEach((im) => { im.src = ASET[im.dataset.aset] || ''; });

// ---------------- konstanta desain (GDD) ----------------
const JARAK_FINISH = 1000;             // meter
const LAJUR = [-2.2, 0, 2.2];
const KECEPATAN_DASAR = 10;            // m/s dunia game
const BONUS_SEPATU = 1.20;             // Sepatu 1 Putih Merah: pace dasar +20%
const KALI_SPRINT = 1.45;
const KALI_WALL = 0.65;                // The Wall: kecepatan turun 35%
const BATAS_WALL = 22;                 // stamina < 22%
const KURAS_NORMAL = 0.55;             // % per detik
const KURAS_SPRINT = KURAS_NORMAL * 2.3;
const HEMAT_DRAFT = 0.15;
const SKALA_WAKTU = 3.4;               // detik game -> detik "lomba" (pace realistis ~4:45/km)
const ELEVASI = 14;                    // Lintasan 1: +14 m
const WS_MULAI = 450, WS_TENGAH = 540, WS_JENDELA = [515, 565], WS_SELESAI = 650;
const URL_KAMPANYE = 'https://www.willoapparel.com/pelarikalcer';

const tinggi = (d) => (d <= 0 || d >= JARAK_FINISH ? 0 : ELEVASI * Math.sin(Math.PI * d / JARAK_FINISH) ** 2);

// ---------------- simpanan lokal ----------------
const KUNCI = 'pelarikalcer:v1';
let simpan = { koin: 0, nama: 'SkenaRunner_ID', gender: 'pria', inv: { botol: 0, gel: 0, pisang: 0 }, terbaik: 0 };
try { const s = JSON.parse(localStorage.getItem(KUNCI) || 'null'); if (s) simpan = { ...simpan, ...s, inv: { ...simpan.inv, ...(s.inv || {}) } }; } catch (e) { /* tanpa storage */ }
const tulisSimpan = () => { try { localStorage.setItem(KUNCI, JSON.stringify(simpan)); } catch (e) { /* abaikan */ } };

// ---------------- audio sederhana ----------------
let ac = null;
function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
function nada(f1, f2, dur, tipe = 'sine', vol = 0.15, tunda = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + tunda; const o = a.createOscillator(); const g = a.createGain();
  o.type = tipe; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  koin: () => nada(1300, 1900, 0.09, 'sine', 0.08),
  lompat: () => nada(300, 620, 0.16, 'triangle', 0.1),
  tabrak: () => { nada(160, 50, 0.3, 'sawtooth', 0.18); },
  power: () => { nada(500, 1000, 0.12, 'square', 0.06); nada(750, 1500, 0.14, 'square', 0.06, 0.09); },
  bip: (t = 0) => nada(1760, 1760, 0.09, 'square', 0.07, t),
  peluit: () => { for (let i = 0; i < 6; i++) nada(2600 + (i % 2) * 300, 2600 + (i % 2) * 300, 0.06, 'sine', 0.09, i * 0.06); },
  minum: () => { nada(400, 900, 0.2, 'sine', 0.12); nada(900, 1400, 0.15, 'sine', 0.08, 0.15); },
};

// ---------------- renderer & scene ----------------
const kanvas = $('layar');
const renderer = new THREE.WebGLRenderer({ canvas: kanvas, antialias: true, preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const LANGIT = (() => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#5aa6e8'); gr.addColorStop(0.55, '#a9d3f2'); gr.addColorStop(0.8, '#f6e2c3'); gr.addColorStop(1, '#f3c9a0');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
scene.background = LANGIT;
scene.fog = new THREE.Fog(0xcfe0ee, 70, 260);
const kamera = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 420);
scene.add(new THREE.HemisphereLight(0xdff0ff, 0x6b5a45, 1.6));
const matahari = new THREE.DirectionalLight(0xfff1d6, 1.9); matahari.position.set(-30, 50, 20); scene.add(matahari);

function ukur() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); kamera.aspect = w / h;
  kamera.fov = w / h < 1 ? 80 : 62; kamera.updateProjectionMatrix();
}
window.addEventListener('resize', ukur); ukur();

// ---------------- tekstur prosedural ----------------
function kanvasTex(w, h, gambar, ulang) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; gambar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (ulang) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
function bintik(g, w, h, n, warna, ukuran = 2) { for (let i = 0; i < n; i++) { g.fillStyle = warna[i % warna.length]; g.fillRect(Math.random() * w, Math.random() * h, ukuran, ukuran); } }

const texAspal = kanvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#3b3f45'; g.fillRect(0, 0, w, h);
  bintik(g, w, h, 5000, ['#34383d', '#45494f', '#2f3236', '#4b4f55']);
  g.fillStyle = '#f2f2ee'; // garis tepi
  g.fillRect(w * 0.025, 0, 5, h); g.fillRect(w * 0.975 - 5, 0, 5, h);
  for (const u of [0.347, 0.653]) { g.fillRect(w * u - 3, h * 0.08, 6, h * 0.42); } // garis putus lajur
}, true);
const texTrotoar = kanvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#b9b1a5'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#9d958a'; g.lineWidth = 2;
  for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < w + 32; x += 32) { g.strokeRect(x, y, 32, 32); }
  bintik(g, w, h, 600, ['#c4bcb0', '#a8a094']);
}, true);
const texRumput = kanvasTex(128, 128, (g, w, h) => { g.fillStyle = '#5f9a3e'; g.fillRect(0, 0, w, h); bintik(g, w, h, 1800, ['#6eaa47', '#548a35', '#79b552'], 2); }, true);
const texLubang = kanvasTex(128, 128, (g, w, h) => {
  g.translate(w / 2, h / 2); g.beginPath();
  for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2; const r = 50 + Math.sin(i * 2.3) * 8; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8); }
  g.closePath(); g.fillStyle = '#1b1c1e'; g.fill(); g.strokeStyle = '#5c5a55'; g.lineWidth = 5; g.stroke();
  g.fillStyle = '#0d0d0e'; g.beginPath(); g.ellipse(0, 4, 30, 20, 0, 0, Math.PI * 2); g.fill();
});
function texGedung(tint) {
  return kanvasTex(128, 256, (g, w, h) => {
    g.fillStyle = tint; g.fillRect(0, 0, w, h);
    for (let y = 6; y < h - 4; y += 12) for (let x = 6; x < w - 4; x += 14) {
      g.fillStyle = Math.random() < 0.18 ? '#ffe9b0' : (Math.random() < 0.5 ? '#9fc1dc' : '#7e9fbc');
      g.fillRect(x, y, 9, 8);
    }
  }, true);
}
function texSpanduk(teks, bg, fg, sub) {
  return kanvasTex(1024, 160, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (bg === 'kotak') { for (let x = 0; x < w; x += 40) for (let y = 0; y < h; y += 40) { g.fillStyle = ((x + y) / 40) % 2 ? '#111' : '#fff'; g.fillRect(x, y, 40, 40); } g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(140, 20, w - 280, h - 40); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `italic 800 ${sub ? 84 : 100}px "Barlow Condensed", Arial Narrow, sans-serif`; g.fillText(teks, w / 2, sub ? 64 : h / 2 + 4);
    if (sub) { g.font = '600 34px "Barlow Condensed", sans-serif'; g.fillText(sub, w / 2, 128); }
  });
}

// ---------------- jalan & lingkungan ----------------
const PANJANG = JARAK_FINISH + 260, AWAL = -60;
function strip(xTengah, lebar, yOff, tex, mUlangX, mUlangY, warna) {
  const seg = 260; const geo = new THREE.PlaneGeometry(lebar, PANJANG, 1, seg); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i) - PANJANG / 2 - AWAL; // z dunia (negatif = maju)
    pos.setZ(i, z); pos.setY(i, tinggi(-z) + yOff); pos.setX(i, pos.getX(i) + xTengah);
  }
  geo.computeVertexNormals();
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(mUlangX, mUlangY);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: t, color: warna || 0xffffff }));
  scene.add(m); return m;
}
strip(0, 7.2, 0, texAspal, 1, PANJANG / 8);
strip(-4.9, 2.6, 0.14, texTrotoar, 2, PANJANG / 2.6);
strip(4.9, 2.6, 0.14, texTrotoar, 2, PANJANG / 2.6);
strip(-36, 60, 0.02, texRumput, 12, PANJANG / 5);
strip(36, 60, 0.02, texRumput, 12, PANJANG / 5);
// kerb (pinggir trotoar)
for (const sx of [-1, 1]) {
  const mKerb = new THREE.MeshLambertMaterial({ color: 0xd8d2c8 });
  for (let d = AWAL; d < AWAL + PANJANG; d += 10) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 10.05), mKerb);
    const ym = tinggi(d + 5); p.position.set(sx * 3.65, ym + 0.07, -(d + 5));
    p.rotation.x = Math.atan2(tinggi(d + 10) - tinggi(d), 10); scene.add(p);
  }
}

// sprite dari aset
const cacheTex = {};
function texAset(nama) {
  if (!cacheTex[nama]) {
    const t = new THREE.TextureLoader().load(ASET[nama] || ''); t.colorSpace = THREE.SRGBColorSpace; cacheTex[nama] = t;
  }
  return cacheTex[nama];
}
const RASIO = {}; // diisi saat gambar siap
function sprite(nama, tinggiM, opsi = {}) {
  const mat = new THREE.SpriteMaterial({ map: texAset(nama), transparent: true, alphaTest: 0.08, fog: opsi.fog !== false });
  const s = new THREE.Sprite(mat); s.center.set(0.5, 0);
  const atur = (r) => s.scale.set(tinggiM * r, tinggiM, 1);
  if (RASIO[nama]) atur(RASIO[nama]); else {
    const im = new Image(); im.onload = () => { RASIO[nama] = im.width / im.height; atur(RASIO[nama]); }; im.src = ASET[nama] || '';
    atur(1);
  }
  return s;
}
function taruh(obj, x, d, yTambah = 0) { obj.position.set(x, tinggi(d) + yTambah, -d); scene.add(obj); return obj; }

// gedung Sudirman
const tintGedung = ['#7f97ad', '#a8b4bf', '#c9bfae', '#6d8296', '#9aa9b8', '#b8b0a2'].map(texGedung);
let acak = mulberry(17);
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
for (const sx of [-1, 1]) {
  let d = AWAL;
  while (d < AWAL + PANJANG + 120) {
    const lebar = 14 + acak() * 14, tg = 22 + acak() * 70, dalam = 14 + acak() * 10;
    const tex = tintGedung[Math.floor(acak() * tintGedung.length)].clone(); tex.needsUpdate = true; tex.repeat.set(Math.round(lebar / 6), Math.round(tg / 12));
    const g = new THREE.Mesh(new THREE.BoxGeometry(dalam, tg, lebar), new THREE.MeshLambertMaterial({ map: tex }));
    taruh(g, sx * (20 + dalam / 2 + acak() * 8), d + lebar / 2, tg / 2 - 0.5);
    d += lebar + 4 + acak() * 10;
  }
}
// pohon, lampu, bendera, rambu, angkot, gerobak, bangku, sepeda
for (let d = AWAL + 4; d < AWAL + PANJANG; d += 13) {
  for (const sx of [-1, 1]) taruh(sprite('pohon', 5.2 + acak() * 1.5), sx * (8 + acak() * 3), d + acak() * 4);
}
for (let d = AWAL + 10; d < AWAL + PANJANG; d += 30) {
  for (const sx of [-1, 1]) {
    taruh(sprite('lampu', 5.4), sx * 4.6, d);
    if (Math.round(d / 30) % 2 === 0) taruh(sprite('bendera', 3.2), sx * 5.4, d + 3);
  }
}
for (let d = 60; d < JARAK_FINISH; d += 140 + acak() * 60) taruh(sprite('angkot', 2.3), (acak() < 0.5 ? -1 : 1) * 7.4, d);
for (let d = 90; d < JARAK_FINISH; d += 120 + acak() * 70) taruh(sprite('gerobak', 2.1), (acak() < 0.5 ? -1 : 1) * 5.5, d);
for (let d = 40; d < JARAK_FINISH; d += 80 + acak() * 40) taruh(sprite('bangku', 0.95), (acak() < 0.5 ? -1 : 1) * 5.6, d);
for (let d = 120; d < JARAK_FINISH; d += 160 + acak() * 50) taruh(sprite('sepeda', 1.1), (acak() < 0.5 ? -1 : 1) * 6.3, d);
for (const d of [150, 420, 780]) taruh(sprite('rambu', 3.6), 4.5, d);
// Monas di kejauhan, terlihat sepanjang rute
const monas = sprite('monas', 120, { fog: false }); monas.material.fog = false; monas.material.color.set(0xe8eef5); scene.add(monas);

// gerbang (start, water station, finish)
function gerbang(d, tex, warnaTiang, lebar = 9.6) {
  const g = new THREE.Group(); const mt = new THREE.MeshLambertMaterial({ color: warnaTiang });
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.2, 0.35), mt); t.position.set(sx * lebar / 2, 2.6, 0); g.add(t); }
  const sp = new THREE.Mesh(new THREE.BoxGeometry(lebar + 0.4, 1.5, 0.25), [mt, mt, mt, mt, new THREE.MeshBasicMaterial({ map: tex }), new THREE.MeshBasicMaterial({ map: tex })]);
  sp.position.y = 5.0; g.add(sp); taruh(g, 0, d); return g;
}
gerbang(0, texSpanduk('START', '#e3262f', '#fff', 'SUDIRMAN CFD · PELARI KALCER'), 0xb8121b);
gerbang(WS_TENGAH - 22, texSpanduk('WATER STATION', '#2f8cff', '#fff', 'ISOTONIK GRATIS · 0.5 KM'), 0x1d5fc0);
gerbang(JARAK_FINISH, texSpanduk('FINISH', 'kotak', '#fff'), 0x222222);
taruh(sprite('finish', 2.6), -4.3, JARAK_FINISH); taruh(sprite('finish', 2.6), 4.3, JARAK_FINISH);
// meja water station + botol
for (let d = WS_JENDELA[0]; d <= WS_JENDELA[1]; d += 10) for (const sx of [-1, 1]) {
  const meja = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 3), new THREE.MeshLambertMaterial({ color: 0x2f8cff })); taruh(meja, sx * 4.5, d, 0.55);
  for (let k = -1; k <= 1; k++) taruh(sprite('botol', 0.45), sx * 4.5, d + k * 0.9, 0.95);
}

// ---------------- karakter pelari prosedural (merujuk lembar karakter) ----------------
const KULIT = 0xc98e64;
function texJersey(sisi, warna) {
  const t = kanvasTex(256, 256, gambarJersey(sisi, warna));
  if (sisi === 'belakang' && !warna && !gambarGaruda.complete) {
    gambarGaruda.addEventListener('load', () => { gambarJersey(sisi, warna)(t.image.getContext('2d'), 256, 256); t.needsUpdate = true; });
  }
  return t;
}
function gambarJersey(sisi, warna) {
  return (g, w, h) => {
    if (warna) { g.fillStyle = warna; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, h * 0.82, w, h * 0.06); return; }
    if (sisi === 'belakang') {
      g.fillStyle = '#e3262f'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fbfaf7'; g.beginPath(); g.moveTo(0, h * 0.78); g.lineTo(w, h * 0.6); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      const im = gambarGaruda; if (im && im.complete) g.drawImage(im, w * 0.24, h * 0.08, w * 0.52, h * 0.52);
    } else {
      g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e3262f'; g.beginPath(); g.moveTo(0, h * 0.62); g.lineTo(w, h * 0.86); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillRect(0, 0, w, h * 0.07);
      g.fillStyle = '#e3262f'; g.fillRect(w * 0.62, h * 0.2, 34, 12); g.fillStyle = '#fff'; g.fillRect(w * 0.62, h * 0.2 + 12, 34, 12);
      g.strokeStyle = '#ccc'; g.strokeRect(w * 0.62, h * 0.2, 34, 24);
    }
  };
}
const gambarGaruda = new Image(); gambarGaruda.src = ASET.garuda || '';

function buatPelari(opsi = {}) {
  const wanita = opsi.gender === 'wanita';
  const L = (c) => new THREE.MeshLambertMaterial({ color: c });
  const mKulit = L(KULIT), mHitam = L(0x1a1a1d), mPutih = L(0xf5f5f2), mMerah = L(opsi.warna || 0xe3262f);
  const root = new THREE.Group();
  const pinggul = new THREE.Group(); pinggul.position.y = 0.98; root.add(pinggul);
  // badan
  const badan = new THREE.Group(); pinggul.add(badan);
  const tBelakang = texJersey('belakang', opsi.warnaHex), tDepan = texJersey('depan', opsi.warnaHex);
  const mSisi = L(opsi.warna || 0xe3262f);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(wanita ? 0.44 : 0.5, 0.6, 0.27),
    [mSisi, mSisi, mSisi, mSisi, new THREE.MeshLambertMaterial({ map: tBelakang }), new THREE.MeshLambertMaterial({ map: tDepan })]);
  torso.position.y = 0.36; badan.add(torso);
  const celana = new THREE.Mesh(new THREE.BoxGeometry(wanita ? 0.46 : 0.5, 0.24, 0.29), mHitam); celana.position.y = 0.0; badan.add(celana);
  if (wanita) { const tas = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.09, 0.32), mHitam); tas.position.y = 0.12; badan.add(tas); }
  // kepala
  const kepala = new THREE.Group(); kepala.position.y = 0.82; badan.add(kepala);
  const leher = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 8), mKulit); leher.position.y = -0.12; kepala.add(leher);
  const muka = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), mKulit); muka.scale.set(0.92, 1.1, 1); muka.position.y = 0.06; kepala.add(muka);
  const rambut = new THREE.Mesh(new THREE.SphereGeometry(0.158, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), mHitam);
  rambut.scale.set(0.95, 1.1, 1.04); rambut.position.set(0, 0.075, 0.02); rambut.rotation.x = 0.55; kepala.add(rambut);
  for (const sx of [-1, 1]) { const mata = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), mHitam); mata.position.set(sx * 0.05, 0.08, -0.135); kepala.add(mata); }
  if (wanita) {
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.163, 0.163, 0.06, 20, 1, true), mPutih); visor.position.y = 0.12; kepala.add(visor);
    const topi = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.012, 20, 1, false, Math.PI * 0.5, Math.PI), mPutih);
    topi.scale.set(1, 1, 1.4); topi.position.set(0, 0.1, -0.12); kepala.add(topi);
    const ekor = new THREE.Group(); ekor.position.set(0, 0.16, 0.13); kepala.add(ekor);
    const kuncir = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.22, 4, 8), mHitam); kuncir.position.y = -0.14; ekor.add(kuncir);
    root.userData.ekor = ekor;
  } else {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.162, 0.162, 0.045, 20, 1, true), mHitam); band.position.y = 0.11; kepala.add(band);
  }
  // lengan
  function lengan(sx) {
    const bahu = new THREE.Group(); bahu.position.set(sx * (wanita ? 0.27 : 0.3), 0.6, 0); badan.add(bahu);
    const lengAtas = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.2, 4, 8), mKulit); lengAtas.position.y = -0.15; bahu.add(lengAtas);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.14, 10), mMerah); sleeve.position.y = -0.05; bahu.add(sleeve);
    const siku = new THREE.Group(); siku.position.y = -0.29; bahu.add(siku);
    const lengBawah = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.2, 4, 8), mKulit); lengBawah.position.y = -0.13; siku.add(lengBawah);
    if (sx < 0) { const jam = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.05, 10), mHitam); jam.position.y = -0.2; siku.add(jam); }
    return { bahu, siku };
  }
  function kaki(sx) {
    const pangkal = new THREE.Group(); pangkal.position.set(sx * 0.13, -0.04, 0); pinggul.add(pangkal);
    const paha = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.28, 4, 8), mKulit); paha.position.y = -0.22; pangkal.add(paha);
    const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.105, 0.2, 10), mHitam); shorts.position.y = -0.08; pangkal.add(shorts);
    if (wanita) { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.28, 4, 8), L(0x2a2b30)); leg.position.y = -0.22; pangkal.add(leg); }
    const lutut = new THREE.Group(); lutut.position.y = -0.44; pangkal.add(lutut);
    const betis = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.3, 4, 8), wanita ? L(0x2a2b30) : mKulit); betis.position.y = -0.2; lutut.add(betis);
    const kaos = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.066, 0.12, 8), mPutih); kaos.position.y = -0.36; lutut.add(kaos);
    const sepatu = new THREE.Group(); sepatu.position.set(0, -0.45, -0.05); lutut.add(sepatu);
    const atas = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.28), mPutih); atas.position.y = 0.02; sepatu.add(atas);
    const sol = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.3), L(0xe3262f)); sol.position.y = -0.045; sepatu.add(sol);
    const garis = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.025, 0.14), L(0xe3262f)); garis.position.set(0, 0.03, 0.01); garis.rotation.x = 0.35; sepatu.add(garis);
    return { pangkal, lutut };
  }
  const lk = lengan(-1), lka = lengan(1), kk = kaki(-1), kka = kaki(1);
  // bayangan blob
  const bay = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  bay.rotation.x = -Math.PI / 2; bay.position.y = 0.02; root.add(bay);
  root.userData = { ...root.userData, pinggul, badan, kepala, lk, lka, kk, kka, bay, fase: Math.random() * 6 };

  root.userData.animasi = (dt, laju, keadaan = {}) => {
    const u = root.userData; u.fase += dt * laju * 1.05;
    const f = u.fase; const amp = keadaan.wall ? 0.55 : (keadaan.sprint ? 1.05 : 0.85);
    if (keadaan.udara) {
      kk.pangkal.rotation.x = -0.9; kk.lutut.rotation.x = 1.4; kka.pangkal.rotation.x = 0.3; kka.lutut.rotation.x = 0.9;
      lk.bahu.rotation.x = -0.9; lka.bahu.rotation.x = 0.6; pinggul.position.y = 0.98;
    } else if (laju < 0.1) {
      for (const k of [kk, kka]) { k.pangkal.rotation.x *= 0.8; k.lutut.rotation.x *= 0.8; }
      for (const l of [lk, lka]) { l.bahu.rotation.x *= 0.8; l.siku.rotation.x = -0.25; l.bahu.rotation.z = 0; }
      lk.bahu.rotation.z = -0.12; lka.bahu.rotation.z = 0.12; pinggul.position.y = 0.98; badan.rotation.x = 0;
      return;
    } else {
      const s = Math.sin(f), c = Math.cos(f);
      kk.pangkal.rotation.x = -s * amp; kka.pangkal.rotation.x = s * amp;
      kk.lutut.rotation.x = Math.max(0, c) * 1.5 * amp + 0.15; kka.lutut.rotation.x = Math.max(0, -c) * 1.5 * amp + 0.15;
      lk.bahu.rotation.x = s * amp * 0.9; lka.bahu.rotation.x = -s * amp * 0.9;
      pinggul.position.y = 0.94 + Math.abs(c) * 0.07;
    }
    lk.siku.rotation.x = -1.45; lka.siku.rotation.x = -1.45; // siku 90 derajat (GDD)
    lk.bahu.rotation.z = -0.08; lka.bahu.rotation.z = 0.08;
    const condong = keadaan.wall ? 0.42 : (keadaan.sprint ? 0.2 : 0.1);
    badan.rotation.x += (-condong - badan.rotation.x) * Math.min(1, dt * 6);
    kepala.rotation.x = keadaan.wall ? 0.35 : 0.05;
    if (u.ekor) u.ekor.rotation.x = 0.35 + Math.sin(f * 2) * 0.25;
  };
  return root;
}

// ---------------- keadaan permainan ----------------
const pemain = { obj: null, d: 0, x: 0, lajur: 1, y: 0, vy: 0, kecepatan: 0, stamina: 100, nyawa: 3, koin: 0, kebal: 0,
  sprint: false, magnet: 0, perisai: 0, gel: false, botol: 0, waktu: 0, selesai: false, ws: 'belum', lambat: 0, drafting: false };
let mode = 'menu'; // menu | gps | main | jeda | hasil
let entitas = [];  // rintangan & pickup
let peloton = [];
let goyang = 0;

function kosongkanLintasan() {
  for (const e of entitas) scene.remove(e.obj);
  for (const n of peloton) scene.remove(n.obj);
  entitas = []; peloton = [];
}
function bangunLintasan(seed) {
  kosongkanLintasan();
  const r = mulberry(seed);
  const tambah = (jenis, lajur, d, data = {}) => {
    let obj;
    if (jenis === 'kerucut') obj = sprite('kerucut', 0.95);
    else if (jenis === 'lubang') { obj = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.5), new THREE.MeshBasicMaterial({ map: texLubang, transparent: true, depthWrite: false })); obj.rotation.x = -Math.PI / 2; }
    else if (jenis === 'pembatas') {
      obj = new THREE.Group();
      const t = kanvasTex(128, 32, (g, w, h) => { for (let x = -32; x < w; x += 32) { g.fillStyle = '#e3262f'; g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, 0); g.lineTo(x + 32, 0); g.lineTo(x + 16, h); g.fill(); } }, false);
      const papan = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.32, 0.08), [0, 0, 0, 0, 0, 0].map(() => new THREE.MeshLambertMaterial({ color: 0xffffff, map: t })));
      papan.position.y = 0.62; obj.add(papan);
      for (const sx of [-0.8, 0.8]) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.08), new THREE.MeshLambertMaterial({ color: 0xdddddd })); k.position.set(sx, 0.31, 0); obj.add(k); }
    } else obj = sprite(jenis, jenis === 'koin' ? 0.62 : 0.8);
    const yT = jenis === 'lubang' ? 0.025 : (['koin', 'petir', 'magnet', 'perisai', 'hati'].includes(jenis) ? 0.55 + (data.yLebih || 0) : 0);
    taruh(obj, LAJUR[lajur], d, yT);
    entitas.push({ jenis, lajur, d, obj, yDasar: yT, aktif: true, rintangan: ['kerucut', 'lubang', 'pembatas'].includes(jenis) });
  };
  let d = 45;
  let hitung = 0;
  while (d < JARAK_FINISH - 30) {
    if (d > WS_MULAI + 15 && d < WS_SELESAI - 40) { // zona water station: koin saja
      const l = Math.floor(r() * 3); for (let i = 0; i < 6; i++) tambah('koin', l, d + i * 2.4); d += 22; continue;
    }
    hitung++;
    const p = r();
    const lajurBebas = [0, 1, 2].sort(() => r() - 0.5);
    if (p < 0.3) { // kerucut + koin di lajur lain
      tambah('kerucut', lajurBebas[0], d); if (r() < 0.45) tambah('kerucut', lajurBebas[1], d);
      for (let i = 0; i < 5; i++) tambah('koin', lajurBebas[2], d - 4 + i * 2.2);
    } else if (p < 0.48) { // lubang jalan, koin melengkung di atasnya
      tambah('lubang', lajurBebas[0], d);
      for (let i = -2; i <= 2; i++) tambah('koin', lajurBebas[0], d + i * 1.6, { yLebih: (1 - (i * i) / 5) * 1.4 });
    } else if (p < 0.64) { // pembatas jalan
      tambah('pembatas', lajurBebas[0], d); if (r() < 0.35) tambah('kerucut', lajurBebas[1], d + 6);
    } else { // baris koin berpindah lajur
      const l = lajurBebas[0]; for (let i = 0; i < 7; i++) tambah('koin', l, d + i * 2.3);
    }
    if (hitung % 9 === 4) tambah('petir', lajurBebas[2], d + 9);
    if (hitung === 7 || hitung === 30) tambah('magnet', lajurBebas[1], d + 10);
    if (hitung === 15 || hitung === 38) tambah('perisai', lajurBebas[2], d + 10);
    if (hitung === 24) tambah('hati', lajurBebas[1], d + 11);
    d += 17 + r() * 9;
  }
  // peloton NPC
  const warna = [0x2f8cff, 0xffd23f, 0x1f9d55, 0xff7a1a, 0x8a5cf6, 0x111111, 0x00b3b3, 0xf06292];
  for (let i = 0; i < 26; i++) {
    const nd = 25 + i * 36 + r() * 14; if (nd > JARAK_FINISH - 40) break;
    const w = warna[i % warna.length]; const hex = '#' + w.toString(16).padStart(6, '0');
    const obj = buatPelari({ gender: r() < 0.45 ? 'wanita' : 'pria', warna: w, warnaHex: hex });
    obj.scale.setScalar(0.96 + r() * 0.08); scene.add(obj);
    peloton.push({ obj, d: nd, lajur: Math.floor(r() * 3), x: 0, v: 7.4 + r() * 1.8, y: 0, vy: 0 });
  }
  for (const n of peloton) n.x = LAJUR[n.lajur];
}

// ---------------- HUD ----------------
function gambarNyawa() {
  const el = $('nyawa'); el.innerHTML = '';
  const total = Math.max(3, pemain.nyawa);
  for (let i = 0; i < total; i++) { const im = document.createElement('img'); im.src = ASET.hati; im.alt = ''; if (i >= pemain.nyawa) im.className = 'mati'; el.appendChild(im); }
  el.setAttribute('aria-label', `Nyawa ${pemain.nyawa}`);
}
let toastT = 0;
function toast(teks, warna = '#fff', lama = 1.1) { const t = $('toast'); t.textContent = teks; t.style.color = warna; t.style.opacity = 1; toastT = lama; }
const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function warnaStamina(p) { return p > 55 ? 'var(--hijau)' : (p > BATAS_WALL ? 'var(--kuning)' : 'var(--merah)'); }
function perbaruiHUD() {
  const km = Math.min(pemain.d, JARAK_FINISH) / 1000;
  $('jarak').innerHTML = `${km.toFixed(2)} <small>/ 1.00 KM</small>`;
  $('progIsi').style.width = (km * 100).toFixed(1) + '%';
  $('koin').textContent = pemain.koin;
  const st = Math.max(0, pemain.stamina);
  $('stTeks').textContent = Math.round(st) + '%';
  const isi = $('stIsi'); isi.style.width = st + '%'; isi.style.backgroundColor = warnaStamina(st);
  const tLomba = pemain.waktu * SKALA_WAKTU;
  $('waktu').textContent = fmt(tLomba);
  $('pace').textContent = pemain.d > 30 ? fmt(tLomba / (pemain.d / 1000)) : '--:--';
  $('elev').textContent = '+' + Math.round(elevasiNaik(pemain.d));
  const b = []; if (pemain.magnet > 0) b.push(['magnet', pemain.magnet]); if (pemain.perisai > 0) b.push(['perisai', pemain.perisai]); if (pemain.gel) b.push(['gel', null]);
  $('buff').innerHTML = b.map(([n, t]) => `<span class="buff"><img src="${ASET[n]}" alt="">${t != null ? Math.ceil(t) + 's' : '+14%'}</span>`).join('');
}
const elevasiNaik = (d) => (d <= JARAK_FINISH / 2 ? tinggi(d) : ELEVASI);

// ---------------- input ----------------
function geser(arah) { if (mode !== 'main' || pemain.selesai) return; const l = Math.max(0, Math.min(2, pemain.lajur + arah)); if (l !== pemain.lajur) { pemain.lajur = l; nada(600, 800, 0.05, 'sine', 0.05); } }
function lompat() { if (mode !== 'main' || pemain.selesai) return; if (pemain.y <= 0.001) { pemain.vy = 7.4; sfx.lompat(); } }
function setSprint(on) { pemain.sprint = on && mode === 'main'; $('bSprint').classList.toggle('on', pemain.sprint); }
function pakaiBotol() {
  if (mode !== 'main' || pemain.botol <= 0) return;
  pemain.botol--; pemain.stamina = 100; sfx.minum(); toast('STAMINA 100%', '#3ddc84');
  $('bBotol').disabled = pemain.botol <= 0;
}
function ambilIsotonik() {
  if (mode !== 'main' || pemain.ws !== 'aktif') return;
  const d = pemain.d;
  if (d >= WS_JENDELA[0] && d <= WS_JENDELA[1]) {
    pemain.ws = 'dapat'; pemain.stamina = Math.min(100, pemain.stamina + 35); pemain.koin += 50; sfx.minum();
    toast('ISOTONIK! +35% STAMINA · +50 KOIN', '#7cc4ff', 1.6);
  } else { pemain.ws = 'lewat'; toast('Kecepetan! Botolnya jatuh', '#ffb0b0'); nada(300, 150, 0.2, 'triangle', 0.1); }
  $('qte').hidden = true;
}
const tombol = (id, fn) => $(id).addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); fn(); });
tombol('bKiri', () => geser(-1)); tombol('bKanan', () => geser(1)); tombol('bLompat', lompat); tombol('bBotol', pakaiBotol); tombol('bAmbil', ambilIsotonik);
const bs = $('bSprint');
bs.addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); try { bs.setPointerCapture(e.pointerId); } catch (er) { /* */ } setSprint(true); });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) bs.addEventListener(ev, () => setSprint(false));
window.addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') geser(-1);
  else if (k === 'arrowright' || k === 'd') geser(1);
  else if (k === 'arrowup' || k === 'w' || k === ' ') { e.preventDefault(); lompat(); }
  else if (k === 'shift') setSprint(true);
  else if (k === 'e' || k === 'enter') { if (mode === 'main') { if (pemain.ws === 'aktif') ambilIsotonik(); } }
  else if (k === 'q') pakaiBotol();
  else if (k === 'escape' || k === 'p') { if (mode === 'main') jeda(true); else if (mode === 'jeda') jeda(false); }
});
window.addEventListener('keyup', (e) => { if (e.key === 'Shift') setSprint(false); });
// geser layar (swipe)
let sentuh = null;
kanvas.addEventListener('pointerdown', (e) => { sentuh = { x: e.clientX, y: e.clientY }; });
kanvas.addEventListener('pointerup', (e) => {
  if (!sentuh) return; const dx = e.clientX - sentuh.x, dy = e.clientY - sentuh.y; sentuh = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
  if (Math.abs(dx) > Math.abs(dy)) geser(dx > 0 ? 1 : -1); else if (dy < 0) lompat();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'main') jeda(true); });

// ---------------- alur layar ----------------
const tampil = (id, on) => { $(id).hidden = !on; };
function aturMain(on) {
  for (const id of ['hud', 'kKiri', 'kKanan']) tampil(id, on);
  document.body.classList.toggle('main', on);
}
let pratinjau = null;
function pasangPratinjau() {
  if (pratinjau) scene.remove(pratinjau);
  pratinjau = buatPelari({ gender: simpan.gender }); taruh(pratinjau, 0, 0);
  pemain.obj = pratinjau; pemain.d = 0; pemain.x = 0; pemain.y = 0;
}
function pilihGender(g) {
  simpan.gender = g; tulisSimpan();
  $('pPria').setAttribute('aria-pressed', g === 'pria'); $('pWanita').setAttribute('aria-pressed', g === 'wanita');
  pasangPratinjau();
}
$('pPria').onclick = () => pilihGender('pria'); $('pWanita').onclick = () => pilihGender('wanita');
$('nama').value = simpan.nama;
$('nama').addEventListener('input', () => { simpan.nama = $('nama').value.trim().slice(0, 18) || 'SkenaRunner_ID'; tulisSimpan(); });
function perbaruiSaldo() { $('saldo').textContent = simpan.koin; $('saldoToko').textContent = simpan.koin; }

// toko skena
const ITEM = [
  { id: 'botol', nama: 'Botol Minum', harga: 150, desk: 'Isi stamina ke 100% sekali saat lari.' },
  { id: 'gel', nama: 'Energy Gel', harga: 200, desk: 'Kecepatan +14% selama satu lari.' },
  { id: 'pisang', nama: 'Pisang', harga: 100, desk: '+1 nyawa di awal lari.' },
  { id: 'lootbox', nama: 'Loot Box Garuda', harga: 500, desk: 'Gacha: koin melimpah atau bonus pisang.' },
];
function gambarToko() {
  perbaruiSaldo();
  $('daftarToko').innerHTML = ITEM.map((it) => `<div class="item"><img src="${ASET[it.id]}" alt=""><b>${it.nama}</b><p>${it.desk}</p>
    ${it.id !== 'lootbox' ? `<span class="punya">Dibawa: ${simpan.inv[it.id] || 0}</span>` : '<span class="punya">&nbsp;</span>'}
    <button data-beli="${it.id}" ${simpan.koin < it.harga ? 'disabled' : ''}><img src="${ASET.koin}" alt="">${it.harga}</button></div>`).join('');
  $('daftarToko').querySelectorAll('[data-beli]').forEach((b) => { b.onclick = () => beli(b.dataset.beli); });
}
function beli(id) {
  const it = ITEM.find((i) => i.id === id); if (!it || simpan.koin < it.harga) return;
  simpan.koin -= it.harga; audio(); sfx.koin();
  if (id === 'lootbox') {
    const r = Math.random();
    if (r < 0.55) { const k = 300 + Math.floor(Math.random() * 4) * 100; simpan.koin += k; $('hasilLoot').textContent = `Loot Box terbuka: ${k} Koin Garuda!`; }
    else if (r < 0.9) { simpan.inv.pisang += 2; $('hasilLoot').textContent = 'Loot Box terbuka: 2 Pisang (bonus nyawa)!'; }
    else { simpan.koin += 1200; $('hasilLoot').textContent = 'JACKPOT! 1.200 Koin Garuda!'; }
  } else { simpan.inv[id] = (simpan.inv[id] || 0) + 1; $('hasilLoot').textContent = `${it.nama} masuk tas.`; }
  tulisSimpan(); gambarToko();
}
$('bToko').onclick = () => { $('hasilLoot').textContent = ''; gambarToko(); tampil('toko', true); };
$('bTutupToko').onclick = () => { tampil('toko', false); perbaruiSaldo(); };

function keMenu() {
  mode = 'menu'; aturMain(false); for (const id of ['hasil', 'jeda', 'gps', 'qte', 'tembokTeks', 'draft']) tampil(id, false);
  $('tembok').style.opacity = 0;
  tampil('menu', true); kosongkanLintasan(); pasangPratinjau(); perbaruiSaldo();
}

function mulai() {
  audio();
  tampil('menu', false); tampil('hasil', false);
  bangunLintasan(Math.floor(Math.random() * 1e9));
  if (pratinjau) scene.remove(pratinjau);
  pemain.obj = buatPelari({ gender: simpan.gender }); scene.add(pemain.obj);
  Object.assign(pemain, { d: 0, x: 0, lajur: 1, y: 0, vy: 0, kecepatan: 0, stamina: 100, nyawa: 3, koin: 0, kebal: 0, sprint: false,
    magnet: 0, perisai: 0, gel: false, botol: 0, waktu: 0, selesai: false, ws: 'belum', lambat: 0, drafting: false, tabrakan: 0, ambilWs: false });
  // bekal dari toko skena
  if (simpan.inv.gel > 0) { simpan.inv.gel--; pemain.gel = true; }
  if (simpan.inv.pisang > 0) { simpan.inv.pisang--; pemain.nyawa++; }
  pemain.botol = simpan.inv.botol; simpan.inv.botol = 0; tulisSimpan();
  $('bBotol').hidden = pemain.botol <= 0; $('bBotol').disabled = pemain.botol <= 0;
  gambarNyawa(); perbaruiHUD();
  // ritual jam GPS
  mode = 'gps'; tampil('gps', true); $('gps').classList.remove('kunci'); $('jam').classList.remove('kunci'); $('gpsTeks').textContent = 'MENCARI GPS...';
  let n = 0; const iv = setInterval(() => { if (mode !== 'gps') { clearInterval(iv); return; } sfx.bip(); n++; if (n >= 3) clearInterval(iv); }, 600);
  setTimeout(() => {
    if (mode !== 'gps') return;
    $('gps').classList.add('kunci'); $('jam').classList.add('kunci'); $('gpsTeks').textContent = 'GPS LOCKED';
    sfx.bip(0); sfx.bip(0.12);
    setTimeout(() => {
      if (mode !== 'gps') return;
      sfx.peluit(); tampil('gps', false); aturMain(true); mode = 'main'; toast('GO!', '#ffd23f', 0.8);
      if (pemain.gel) setTimeout(() => toast('ENERGY GEL +14%', '#ffd23f'), 900);
    }, 1000);
  }, 2300);
}
$('bMulai').onclick = mulai;
$('bUlang').onclick = mulai;
$('bJeda').onclick = () => jeda(true);
$('bLanjut').onclick = () => jeda(false);
$('bKeluar').onclick = keMenu;
function jeda(on) {
  if (on && mode === 'main') { mode = 'jeda'; setSprint(false); tampil('jeda', true); }
  else if (!on && mode === 'jeda') { mode = 'main'; tampil('jeda', false); jam.getDelta(); }
}

// ---------------- simulasi ----------------
function tabrak(e) {
  if (pemain.kebal > 0) return;
  if (pemain.perisai > 0) { e.aktif = false; e.obj.visible = false; pemain.perisai = 0; toast('PERISAI MENAHAN!', '#7cc4ff'); sfx.power(); return; }
  pemain.nyawa--; pemain.tabrakan++; pemain.kebal = 1.3; pemain.lambat = 0.8; goyang = 0.35; sfx.tabrak();
  const k = $('kilat'); k.style.background = '#e3262f'; k.style.opacity = 0.45; setTimeout(() => { k.style.opacity = 0; }, 120);
  gambarNyawa();
  toast(e.jenis === 'lubang' ? 'KESANDUNG LUBANG!' : (e.jenis === 'pembatas' ? 'NABRAK PEMBATAS!' : 'NABRAK KERUCUT!'), '#ff8a8a');
  if (pemain.nyawa <= 0) selesai(false);
}
function ambil(e) {
  e.aktif = false; e.obj.visible = false;
  switch (e.jenis) {
    case 'koin': pemain.koin += 25; sfx.koin(); break;
    case 'petir': pemain.stamina = Math.min(100, pemain.stamina + 30); sfx.power(); toast('POWER UP +30% STAMINA', '#3ddc84'); break;
    case 'magnet': pemain.magnet = 8; sfx.power(); toast('MAGNET 8 DETIK', '#ff8a8a'); break;
    case 'perisai': pemain.perisai = 8; sfx.power(); toast('PERISAI 8 DETIK', '#7cc4ff'); break;
    case 'hati': pemain.nyawa++; gambarNyawa(); sfx.power(); toast('+1 NYAWA', '#ff8a8a'); break;
    default: break;
  }
}

function langkah(dt) {
  const p = pemain;
  p.waktu += dt;
  // drafting: tepat di belakang NPC di lajur sama
  p.drafting = false; let blokir = null;
  for (const n of peloton) {
    if (Math.abs(n.x - p.x) > 0.9) continue;
    const gap = n.d - p.d;
    if (gap > 0.6 && gap < 6.5) p.drafting = true;
    if (gap > -0.3 && gap < 0.9 && p.y < 0.5 && n.y < 0.5) blokir = n;
  }
  // stamina
  const kuras = (p.sprint ? KURAS_SPRINT : KURAS_NORMAL) * (p.drafting ? 1 - HEMAT_DRAFT : 1);
  p.stamina = Math.max(0, p.stamina - kuras * dt);
  const wall = p.stamina < BATAS_WALL;
  // kecepatan
  let target = KECEPATAN_DASAR * BONUS_SEPATU * (p.gel ? 1.14 : 1);
  if (p.sprint && p.stamina > 0) target *= KALI_SPRINT;
  if (wall) target *= KALI_WALL;
  if (p.lambat > 0) { target *= 0.5; p.lambat -= dt; }
  if (p.selesai) target = 0;
  if (blokir && !p.selesai) { target = Math.min(target, blokir.v); if (!p.blokirToast) { toast('Salip! Pindah lajur', '#ffd23f', 0.9); p.blokirToast = 2; } }
  if (p.blokirToast) p.blokirToast = Math.max(0, p.blokirToast - dt);
  p.kecepatan += (target - p.kecepatan) * Math.min(1, dt * (p.selesai ? 1.5 : 2.5));
  p.d += p.kecepatan * dt;
  // lajur & lompat
  p.x += (LAJUR[p.lajur] - p.x) * Math.min(1, dt * 12);
  if (p.y > 0 || p.vy > 0) { p.vy -= 20 * dt; p.y = Math.max(0, p.y + p.vy * dt); if (p.y === 0) p.vy = 0; }
  p.kebal = Math.max(0, p.kebal - dt); p.magnet = Math.max(0, p.magnet - dt); p.perisai = Math.max(0, p.perisai - dt);
  // tumbukan
  for (const e of entitas) {
    if (!e.aktif) continue;
    const dz = e.d - p.d; if (dz < -2 || dz > 40) continue;
    if (e.jenis === 'koin' && p.magnet > 0 && dz < 16) { // tarik koin
      e.obj.position.x += (p.x - e.obj.position.x) * Math.min(1, dt * 8);
      e.obj.position.z += (-p.d - e.obj.position.z) * Math.min(1, dt * 8);
      if (Math.abs(e.obj.position.z + p.d) < 1 && Math.abs(e.obj.position.x - p.x) < 1) ambil(e);
      continue;
    }
    if (Math.abs(dz) > 0.7 || Math.abs(LAJUR[e.lajur] - p.x) > 1.0) continue;
    if (e.rintangan) { if (p.y < (e.jenis === 'lubang' ? 0.25 : 0.75)) tabrak(e); }
    else if (Math.abs(p.y + 0.9 - (e.yDasar + 0.3)) < 1.2) ambil(e);
    if (mode !== 'main') return;
  }
  // water station QTE
  if (p.ws === 'belum' && p.d >= WS_MULAI) { p.ws = 'aktif'; tampil('qte', true); nada(900, 900, 0.1, 'sine', 0.08); nada(1200, 1200, 0.1, 'sine', 0.08, 0.12); }
  if (p.ws === 'aktif') {
    const siap = p.d >= WS_JENDELA[0] && p.d <= WS_JENDELA[1];
    $('bAmbil').classList.toggle('siap', siap);
    if (p.d > WS_JENDELA[1]) { p.ws = 'lewat'; tampil('qte', false); toast('Water station kelewat', '#ffb0b0'); }
  }
  // NPC
  for (const n of peloton) {
    n.d += n.v * dt;
    // NPC melompati rintangan di depannya
    if (n.y <= 0) for (const e of entitas) { if (e.rintangan && e.lajur === n.lajur && e.d - n.d > 0.4 && e.d - n.d < 1.6) { n.vy = 6.4; break; } }
    if (n.y > 0 || n.vy > 0) { n.vy -= 20 * dt; n.y = Math.max(0, n.y + n.vy * dt); if (n.y === 0) n.vy = 0; }
    n.obj.position.set(n.x, tinggi(n.d) + n.y, -n.d);
    const jauh = Math.abs(n.d - p.d) < 90; n.obj.visible = jauh;
    if (jauh) n.obj.userData.animasi(dt, n.v, { udara: n.y > 0.05 });
  }
  // HUD state
  $('tembok').style.opacity = wall ? 1 : 0; $('tembokTeks').hidden = !wall || p.selesai;
  $('draft').hidden = !p.drafting || wall;
  if (!p.selesai && p.d >= JARAK_FINISH) { p.selesai = true; sfx.peluit(); toast('FINISH!', '#ffd23f', 1.6); setSprint(false); setTimeout(() => selesai(true), 1500); }
  // animasi pemain
  p.obj.position.set(p.x, tinggi(p.d) + p.y, -p.d);
  p.obj.userData.bay.position.y = 0.02 - p.y;
  p.obj.rotation.z = (p.x - LAJUR[p.lajur]) * 0.12;
  p.obj.visible = !(p.kebal > 0 && Math.floor(p.kebal * 12) % 2 === 0);
  p.obj.userData.animasi(dt, p.kecepatan, { udara: p.y > 0.05, wall, sprint: p.sprint && p.stamina > 0 });
}

const jam = new THREE.Clock();
let waktuDunia = 0;
function kameraIkut(dt) {
  const p = pemain; const ty = tinggi(p.d);
  const target = new THREE.Vector3(p.x * 0.6, ty + 2.75 + p.y * 0.35, -p.d + 5.3);
  kamera.position.lerp(target, Math.min(1, dt * 6));
  if (goyang > 0) { goyang -= dt; kamera.position.x += (Math.random() - 0.5) * 0.25; kamera.position.y += (Math.random() - 0.5) * 0.2; }
  kamera.lookAt(p.x * 0.3, tinggi(p.d + 10) + 1.2, -p.d - 10);
}
function putar() {
  requestAnimationFrame(putar);
  const dt = Math.min(0.05, jam.getDelta()); waktuDunia += dt;
  if (mode === 'main') langkah(dt);
  if (mode === 'menu' || mode === 'gps') {
    // pratinjau: kamera mengitari pelari di garis start
    const o = pemain.obj; if (o) { o.userData.animasi(dt, mode === 'gps' ? 0 : 0, {}); o.rotation.y = mode === 'menu' ? Math.PI + Math.sin(waktuDunia * 0.5) * 0.6 : 0; }
    const a = waktuDunia * 0.2;
    const sempit = kamera.aspect < 1.2;
    const geserX = sempit ? 0 : -1.25;
    kamera.position.set(geserX + Math.sin(a) * 0.25, 1.35, 3.3 + Math.cos(a) * 0.15);
    kamera.lookAt(geserX, 1.0, 0);
  } else if (mode !== 'jeda') kameraIkut(dt);
  // koin berputar & pickup melayang
  for (const e of entitas) {
    if (!e.aktif || e.rintangan) continue; const dz = e.d - pemain.d; if (dz > 120 || dz < -5) continue;
    const s = e.obj.scale; const base = e.jenis === 'koin' ? 0.62 : 0.8; const r = RASIO[e.jenis] || 1;
    if (e.jenis === 'koin') s.x = base * r * Math.abs(Math.cos(waktuDunia * 4 + e.d)) + 0.04;
    if (pemain.magnet <= 0) e.obj.position.y = tinggi(e.d) + e.yDasar + Math.sin(waktuDunia * 3 + e.d) * 0.08;
  }
  monas.position.set(-70, tinggi(pemain.d), -pemain.d - 330);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0; }
  if (mode === 'main' || mode === 'jeda') perbaruiHUD();
  renderer.render(scene, kamera);
}

// ---------------- selesai & Race Receipt ----------------
let strukURL = '', captionTeks = '';
function selesai(finish) {
  if (mode !== 'main') return;
  mode = 'hasil'; aturMain(false); toastT = 0; $('toast').style.opacity = 0; for (const id of ['qte', 'tembokTeks', 'draft']) tampil(id, false); $('tembok').style.opacity = 0;
  simpan.koin += pemain.koin; tulisSimpan();
  const tLomba = pemain.waktu * SKALA_WAKTU;
  const jarakKm = Math.min(pemain.d, JARAK_FINISH) / 1000;
  const pace = jarakKm > 0.02 ? tLomba / jarakKm : 0;
  const kalori = Math.round(65 * jarakKm * (simpan.gender === 'wanita' ? 0.9 : 1));
  const elev = Math.round(elevasiNaik(Math.min(pemain.d, JARAK_FINISH)));
  if (finish && (!simpan.terbaik || tLomba < simpan.terbaik)) { simpan.terbaik = tLomba; tulisSimpan(); }
  const data = { finish, nama: simpan.nama, jarakKm, waktu: fmt(tLomba), pace: pace ? fmt(pace) : '--:--', kalori, elev, koin: pemain.koin, tabrakan: pemain.tabrakan, ws: pemain.ws === 'dapat' };
  const c = buatStruk(data);
  strukURL = c.toDataURL('image/png'); $('struk').src = strukURL;
  $('hasilJudul').textContent = finish ? 'FINISH!' : 'DNF';
  $('hasilInfo').textContent = finish ? `${data.waktu} untuk 1 KM, pace ${data.pace}/km. +${pemain.koin} Koin Garuda masuk dompet.` : `Nyawa habis di KM ${jarakKm.toFixed(2)}. Coba lagi, jaga jarak dari kerucut.`;
  captionTeks = finish
    ? `Baru finish 1 KM di Pelari Kalcer 3D! ⏱ ${data.waktu} · pace ${data.pace}/km · +${elev} m 🇮🇩\nLari bareng skena di ${URL_KAMPANYE.replace('https://', '')}\n#PelariKalcer #WilloApparel #CFDSudirman`
    : `Kena The Wall di KM ${jarakKm.toFixed(2)} 😮‍💨 Besok balas dendam! Main Pelari Kalcer 3D di ${URL_KAMPANYE.replace('https://', '')}\n#PelariKalcer #WilloApparel`;
  $('hasilCatatan').textContent = 'Tahan gambar struk untuk menyimpan di HP.';
  tampil('hasil', true);
}
function buatStruk(d) {
  const W = 540, H = 980; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  // kertas struk dengan tepi bergerigi
  g.fillStyle = '#fbfaf5'; g.beginPath(); g.moveTo(0, 12);
  for (let x = 0; x <= W; x += 18) g.lineTo(x, x % 36 ? 0 : 12);
  g.lineTo(W, H - 12); for (let x = W; x >= 0; x -= 18) g.lineTo(x, x % 36 ? H : H - 12); g.closePath(); g.fill();
  const mono = (s, w = 500) => `${w} ${s}px "JetBrains Mono", Menlo, monospace`;
  g.fillStyle = '#16181c'; g.textBaseline = 'alphabetic';
  let y = 58;
  const tengah = (t, f, yy) => { g.font = f; g.textAlign = 'center'; g.fillText(t, W / 2, yy); };
  const garis = () => { g.font = mono(16); g.textAlign = 'center'; g.fillText('- - - - - - - - - - - - - - - - - - - - -', W / 2, y); y += 26; };
  const baris = (k, v, tebal) => { g.font = mono(19, tebal ? 700 : 500); g.textAlign = 'left'; g.fillText(k, 40, y); g.textAlign = 'right'; g.fillText(v, W - 40, y); y += 31; };
  tengah('PELARI KALCER 3D', 'italic 800 46px "Barlow Condensed", Arial Narrow, sans-serif', y); y += 30;
  tengah(d.finish ? 'RACE RECEIPT · FINISHER CARD' : 'RACE RECEIPT · DNF', mono(17, 700), y); y += 24;
  const tgl = new Date(); const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][tgl.getDay()];
  tengah(`${hari}, ${tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · ${tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`, mono(15), y); y += 22;
  tengah('Lintasan 1 · Jalan Aspal · Sudirman CFD', mono(15), y); y += 30;
  garis();
  baris('PELARI', d.nama.toUpperCase().slice(0, 18), true);
  baris('BIB', '#0088');
  baris('JERSEY', 'GARUDA MERAH PUTIH');
  baris('SEPATU', 'SEPATU 1 PUTIH MERAH');
  baris('JAM', 'STEALTH BLACK 10:08');
  garis();
  baris('JARAK', d.jarakKm.toFixed(2) + ' KM', true);
  baris('WAKTU TEMPUH', d.waktu, true);
  baris('AVG PACE', d.pace + ' /km', true);
  baris('ELEVATION GAIN', '+' + d.elev + ' m');
  baris('KALORI', d.kalori + ' kcal');
  baris('WATER STATION', d.ws ? 'ISOTONIK ✓' : 'TERLEWAT');
  baris('KOIN GARUDA', '+' + d.koin);
  baris('TABRAKAN', String(d.tabrakan));
  garis();
  // status besar
  g.save(); g.translate(W / 2, y + 34); g.rotate(-0.05);
  g.strokeStyle = d.finish ? '#e3262f' : '#555'; g.lineWidth = 4; g.strokeRect(-150, -34, 300, 62);
  g.fillStyle = d.finish ? '#e3262f' : '#555'; g.font = 'italic 800 44px "Barlow Condensed", sans-serif'; g.textAlign = 'center'; g.fillText(d.finish ? 'FINISHER 1K' : 'DID NOT FINISH', 0, 13);
  g.restore(); y += 98;
  // QR + tautan
  const qr = qrcode(0, 'M'); qr.addData(URL_KAMPANYE); qr.make();
  const n = qr.getModuleCount(); const uk = 150; const sel = uk / n; const qx = 40, qy = y;
  g.fillStyle = '#fff'; g.fillRect(qx - 6, qy - 6, uk + 12, uk + 12); g.fillStyle = '#16181c';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect(qx + k * sel, qy + r * sel, Math.ceil(sel), Math.ceil(sel));
  g.textAlign = 'left'; g.font = mono(15, 700); g.fillText('GABUNG KOMUNITAS', 214, qy + 28);
  g.font = mono(14); g.fillText('Daftar & lari bareng di', 214, qy + 54);
  g.font = mono(15, 700); g.fillText('willoapparel.com', 214, qy + 80); g.fillText('/pelarikalcer', 214, qy + 101);
  g.font = mono(13); g.fillStyle = '#555'; g.fillText('Kolaborasi resmi', 214, qy + 132); g.fillText('Willo Apparel', 214, qy + 150);
  y = qy + uk + 44;
  g.fillStyle = '#16181c'; tengah('TERIMA KASIH SUDAH LARI!', mono(16, 700), y); y += 22;
  tengah('#PelariKalcer  #WilloApparel', mono(14), y);
  return c;
}
$('bUnduh').onclick = () => {
  try {
    const a = document.createElement('a'); a.href = strukURL; a.download = `race-receipt-pelari-kalcer-${Date.now()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { /* */ }
  $('hasilCatatan').textContent = 'Kalau unduhan tidak mulai, tahan gambar struk lalu pilih Simpan Gambar.';
};
$('bCaption').onclick = () => {
  const done = () => { $('hasilCatatan').textContent = 'Caption tersalin. Tempel di Instagram Story, Reels, atau TikTok.'; };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(captionTeks).then(done).catch(() => { $('hasilCatatan').textContent = captionTeks; });
  else $('hasilCatatan').textContent = captionTeks;
};

// ---------------- mulai ----------------
pilihGender(simpan.gender || 'pria');
perbaruiSaldo();
putar();
// teks spanduk ditulis ulang setelah font siap
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { /* spanduk memakai fallback bila font belum siap */ });
window.__pk = { pemain, get mode() { return mode; } };

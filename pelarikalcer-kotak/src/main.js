// PELARI KALCER · DUNIA KOTAK — game lari CFD keliling desa, pakai aset asli Dunia Kotak (avatar warga, rumah, fasum, kucing).
// Pemain lari ke arah -z. 1 meter lomba = U satuan dunia.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { warga, pose, KULIT, WARNA_RAMBUT, GAYA_RAMBUT } from '../../public/duniakotak/mabar/js/aset/avatar.js';
import { rumahMesh, warungMesh } from '../../public/duniakotak/mabar/js/aset/rumah.js';
import * as F from '../../public/duniakotak/mabar/js/aset/fasum.js';
import { kucingMesh } from '../../public/duniakotak/mabar/js/aset/kucing.js';

// ---------------- konstanta ----------------
const U = 2.2;                       // satuan dunia per meter
const FINISH = 1000;                 // meter
const LAJUR = [-3.2, 0, 3.2];
const V_DASAR = 7.6, KALI_SPRINT = 1.42, KALI_WALL = 0.65, BATAS_WALL = 22;
const KURAS = 0.85, KALI_KURAS_SPRINT = 2.3, SKALA_WAKTU = 3.4;
const WS = { d: 545, buka: 505, tutup: 572 };
const URL_KAMPANYE = 'Supported by www.willoapparel.com';
const $ = (id) => document.getElementById(id);
let acak = 20251107; const rnd = () => (acak = (acak * 16807) % 2147483647) / 2147483647;
const pilih = (a) => a[Math.floor(rnd() * a.length)];

// ---------------- renderer & scene ----------------
const kanvas = $('kanvas');
const R = new THREE.WebGLRenderer({ canvas: kanvas, antialias: true, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, 1.75)); R.outputColorSpace = THREE.SRGBColorSpace;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const sc = new THREE.Scene();
const langit = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#5ab4ff'); g.addColorStop(.6, '#bfe4ff'); g.addColorStop(1, '#f2f8ff'); x.fillStyle = g; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
sc.background = langit; sc.fog = new THREE.Fog(0xd6ecff, 120, 330);
const kam = new THREE.PerspectiveCamera(58, 1, 0.3, 600);
sc.add(new THREE.HemisphereLight(0xfff4ff, 0xa8c8a0, 1.25));
const mentari = new THREE.DirectionalLight(0xfff2d8, 2.1); mentari.castShadow = true;
mentari.shadow.mapSize.set(2048, 2048); Object.assign(mentari.shadow.camera, { left: -40, right: 40, top: 60, bottom: -30, near: 1, far: 160 }); mentari.shadow.bias = -0.0005;
sc.add(mentari, mentari.target);

const gc = {};
function kotak(w, h, d, c, r = 0.06) { const k = [w, h, d, r].join(); const g = gc[k] || (gc[k] = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001))); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: c, roughness: .8 })); m.castShadow = m.receiveShadow = true; return m; }
function tekstur(w, h, f, ulang) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (ulang) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function papanTeks(teks, { w = 512, h = 128, bg = '#2c3150', fg = '#ffffff', font = 900 } = {}) {
  return tekstur(w, h, (x) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; let s = h * .56; x.font = `${font} ${s}px Montserrat, sans-serif`; while (x.measureText(teks).width > w * .9) { s -= 2; x.font = `${font} ${s}px Montserrat, sans-serif`; } x.fillText(teks, w / 2, h / 2 + 2); });
}

// ---------------- dunia statis: tanah, jalan, trotoar ----------------
const PANJANG = (FINISH + 160) * U, AWAL = -60;
const tanah = new THREE.Mesh(new THREE.PlaneGeometry(700, PANJANG + 400), new THREE.MeshStandardMaterial({ color: 0x8cc46a, roughness: 1 }));
tanah.rotation.x = -Math.PI / 2; tanah.position.set(0, -0.02, -PANJANG / 2 + 100); tanah.receiveShadow = true; sc.add(tanah);
const texJalan = tekstur(256, 256, (x, w, h) => { x.fillStyle = '#5b5f68'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},${.03 + rnd() * .04})`; x.fillRect(rnd() * w, rnd() * h, 3, 3); }
  x.fillStyle = '#f4f1ea'; for (const lx of [w * 0.335, w * 0.665]) x.fillRect(lx - 3, 0, 6, h * .55); x.fillRect(4, 0, 7, h); x.fillRect(w - 11, 0, 7, h); }, true);
texJalan.repeat.set(1, PANJANG / 9);
const jalan = new THREE.Mesh(new THREE.PlaneGeometry(10.6, PANJANG + 200), new THREE.MeshStandardMaterial({ map: texJalan, roughness: .95 }));
jalan.rotation.x = -Math.PI / 2; jalan.position.set(0, 0.01, -PANJANG / 2 + 40); jalan.receiveShadow = true; sc.add(jalan);
for (const s of [-1, 1]) {
  const t = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.28, PANJANG + 200), new THREE.MeshStandardMaterial({ map: tekstur(128, 128, (x, w, h) => { x.fillStyle = '#e9d9b4'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d4c094'; x.lineWidth = 4; for (let i = 0; i <= w; i += 64) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } }, true), roughness: .9 }));
  t.material.map.repeat.set(1, (PANJANG + 200) / 3.4); t.position.set(s * 7.0, 0.14, -PANJANG / 2 + 40); t.receiveShadow = true; sc.add(t);
}

// ---------------- rencana desa (deterministik) ----------------
// zona: rumah / sawah ; landmark fasum di jarak tertentu
const SAWAH = [[160, 255], [600, 690]];
const diSawah = (d) => SAWAH.some(([a, b]) => d > a && d < b);
const LANDMARK = [
  { d: 110, sisi: -1, buat: () => F.sekolah(), nama: 'SD KOTAK WETAN' },
  { d: 330, sisi: 1, buat: () => F.masjid(), nama: 'MASJID' },
  { d: 430, sisi: -1, buat: () => F.warung(), nama: 'WARUNG' },
  { d: 760, sisi: 1, buat: () => F.tamanKota(), nama: 'TAMAN KOTA' },
  { d: 880, sisi: -1, buat: () => F.stadion(), nama: 'STADION' },
];
const dekatLandmark = (d, s) => LANDMARK.some((l) => l.sisi === s && Math.abs(l.d - d) < 34);
const RENCANA = []; // {d, buat:fn}
const DINDING = ['krem', 'putih', 'kuning', 'hijau', 'biru', 'merahMuda', 'ungu', 'kayu'], ATAP = ['merah', 'oranye', 'cokelat', 'hijau', 'biru', 'abu'];
for (let d = -20; d < FINISH + 140; d += 8.5) for (const s of [-1, 1]) {
  if (dekatLandmark(d, s)) continue;
  if (diSawah(d)) { if (Math.round(d / 8.5) % 2 === 0) RENCANA.push({ d, buat: () => sawah(s, d) }); continue; }
  const r = rnd();
  if (r < 0.62) { const dn = pilih(DINDING), at = pilih(ATAP), dua = rnd() < .25; RENCANA.push({ d, buat: () => rumah(s, d, dn, at, dua) }); }
  else if (r < 0.74) { const n = pilih(['WARUNG BU SRI', 'KOPI SKENA', 'JUS BUAH', 'BUBUR AYAM', 'ES DAWET']); RENCANA.push({ d, buat: () => warungDepan(s, d, n) }); }
  else RENCANA.push({ d, buat: () => pohonPohon(s, d) });
  if (rnd() < 0.5) RENCANA.push({ d: d + 4, buat: () => pohon(s * (10.3 + rnd() * .6), -(d + 4) * U, 0.9 + rnd() * .3) });
}
LANDMARK.forEach((l) => RENCANA.push({ d: l.d, buat: () => landmark(l) }));
for (let d = 30; d < FINISH; d += 37) if (!diSawah(d)) RENCANA.push({ d, buat: () => penonton(rnd() < .5 ? -1 : 1, d) });
for (let d = 70; d < FINISH; d += 160) RENCANA.push({ d, buat: () => kucing(d) });
[250, 500, 750].forEach((d) => RENCANA.push({ d, buat: () => papanKM(d) }));
RENCANA.sort((a, b) => a.d - b.d);

const VS = 5;
function letak(o, x, z, ry = 0) { o.position.set(x, 0, z); o.rotation.y = ry; o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }
function rumah(s, d, dn, at, dua) { const g = new THREE.Group(); const r = rumahMesh(dua ? 'duaLantai' : 'kecil', { dinding: dn, atap: at }); r.scale.setScalar(VS * .62); g.add(letak(r, s * 18, -d * U, s > 0 ? -Math.PI / 2 : Math.PI / 2));
  // pagar kecil
  for (let i = -3; i <= 3; i++) { if (i === 0) continue; const p = kotak(.3, 1, .3, 0xf6f3ee, .05); p.position.set(s * 9.2, .5, -d * U + i * 2.6); g.add(p); }
  const pl = kotak(.16, .16, 15, 0xf6f3ee, .03); pl.position.set(s * 9.2, .8, -d * U); g.add(pl); return g; }
function warungDepan(s, d, n) { const g = new THREE.Group(); const w = warungMesh({ nama: n, warna: pilih(['#e0503a', '#3a8ad8', '#e0a020', '#3aa860', '#9a5ad8']) }); w.scale.setScalar(VS * .5); g.add(letak(w, s * 13.5, -d * U, s > 0 ? -Math.PI / 2 : Math.PI / 2));
  const r = rumahMesh('kecil', { dinding: pilih(DINDING), atap: pilih(ATAP) }); r.scale.setScalar(VS * .62); g.add(letak(r, s * 22, -d * U, s > 0 ? -Math.PI / 2 : Math.PI / 2)); return g; }
function pohon(x, z, s = 1) { const g = new THREE.Group(); const t = kotak(.6 * s, 3.2 * s, .6 * s, 0x7a4f2a, .08); t.position.y = 1.6 * s; g.add(t);
  const hijau = [0x4fae4a, 0x5cbf52, 0x3f9a44]; for (let i = 0; i < 3; i++) { const l = kotak((3.4 - i * .8) * s, 1.3 * s, (3.4 - i * .8) * s, hijau[i], .3); l.position.y = (3.4 + i * 1.05) * s; l.rotation.y = i * .4; g.add(l); }
  g.position.set(x, 0, z); g.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return g; }
function pohonPohon(s, d) { const g = new THREE.Group(); g.add(pohon(s * 15, -d * U - 3, 1.2)); g.add(pohon(s * 21, -d * U + 4, 1.4)); const sm = kotak(2, 1.2, 2, 0x5aa04a, .4); sm.position.set(s * 12, .6, -d * U + 5); g.add(sm); return g; }
const texSawah = tekstur(64, 64, (x, w, h) => { x.fillStyle = '#9ccc4a'; x.fillRect(0, 0, w, h); x.fillStyle = '#7fb33a'; for (let i = 0; i < w; i += 8) x.fillRect(i, 0, 4, h); }, true);
function sawah(s, d) { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.BoxGeometry(60, .35, 17 * U * .5), new THREE.MeshStandardMaterial({ map: texSawah.clone(), roughness: 1 }));
  p.material.map.repeat.set(12, 3); p.material.map.needsUpdate = true; p.position.set(s * 40, .1, -d * U); p.receiveShadow = true; g.add(p);
  const pm = kotak(60, .6, .8, 0x7a5a3a, .1); pm.position.set(s * 40, .3, -d * U - 9.3); g.add(pm);
  if (rnd() < .5) { const gb = kotak(3, 2.6, 3, 0x9a6a3e, .1); gb.position.set(s * (22 + rnd() * 20), 1.3, -d * U); g.add(gb); const at = kotak(3.8, .4, 3.8, 0xc8a050, .1); at.position.set(gb.position.x, 2.8, gb.position.z); g.add(at); }
  return g; }
function landmark(l) { const g = new THREE.Group(); const f = l.buat(); f.scale.setScalar(2.6); const b = new THREE.Box3().setFromObject(f); const dalam = (b.max.x - b.min.x) / 2;
  g.add(letak(f, l.sisi * (10 + dalam), -l.d * U, l.sisi > 0 ? -Math.PI / 2 : Math.PI / 2));
  const pp = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshStandardMaterial({ map: papanTeks(l.nama) })); pp.position.set(l.sisi * 9.2, 2.6, -l.d * U + 8); pp.rotation.y = l.sisi > 0 ? -Math.PI / 2 + .5 : Math.PI / 2 - .5; g.add(pp);
  for (const dz of [-.5, .5]) { const t = kotak(.2, 2.2, .2, 0x3a3a3a, .04); t.position.set(l.sisi * 9.2 + dz * Math.cos(pp.rotation.y) * 5.6, 1.1, -l.d * U + 8 - dz * Math.sin(pp.rotation.y) * 5.6); g.add(t); }
  return g; }
function penonton(s, d) { const g = new THREE.Group(); const n = 2 + Math.floor(rnd() * 3); for (let i = 0; i < n; i++) { const w = wargaAcak(); w.position.set(s * (7.6 + rnd() * .8), 0.28, -d * U + i * 1.4); w.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; w.userData.sorak = rnd() * 6; g.add(w); PENONTON.push(w); } return g; }
function kucing(d) { const k = kucingMesh(pilih(['hitam', 'putih']), {}); k.scale.setScalar(.6); const s = rnd() < .5 ? -1 : 1; return letak(k, s * 7.4, -d * U, s > 0 ? Math.PI : 0); }
function papanKM(d) { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ map: papanTeks((d / 1000).toFixed(2).replace('.', ',') + ' KM', { w: 256, h: 128, bg: '#e0803a' }) })); p.position.set(6.2, 2.6, -d * U); g.add(p);
  const t = kotak(.22, 2.2, .22, 0x2c3150, .04); t.position.set(6.2, 1.1, -d * U - .05); g.add(t); return g; }
function gapura(d, teks, warna) { const g = new THREE.Group(); const z = -d * U; const tb = 0x2c3150;
  for (const s of [-1, 1]) { const t = kotak(1.1, 7, 1.1, tb, .2); t.position.set(s * 6.3, 3.5, z); g.add(t); }
  const pp = kotak(13.8, 1.9, 1.1, tb, .2); pp.position.set(0, 7.4, z); g.add(pp);
  const tx = new THREE.Mesh(new THREE.PlaneGeometry(12.6, 1.5), new THREE.MeshBasicMaterial({ map: papanTeks(teks, { w: 1024, h: 128, bg: warna }) })); tx.position.set(0, 7.4, z + .56); g.add(tx);
  const tx2 = tx.clone(); tx2.rotation.y = Math.PI; tx2.position.z = z - .56; g.add(tx2);
  for (let i = 0; i < 9; i++) { const b = kotak(.5, .7, .5, [0xe0803a, 0xf2c14a, 0x5ab4ff, 0xe05a6a][i % 4], .2); b.position.set(-6 + i * 1.5, 8.7 + Math.sin(i) * .2, z); g.add(b); }
  sc.add(g); return g; }
const PENONTON = [];
function wargaAcak(o = {}) {
  const P = rnd() < .45; const gaya = pilih(GAYA_RAMBUT[P ? 'P' : 'L']);
  const ats = pilih([['kaos', pilih(['#3a7bd5', '#e05a6a', '#f2c14a', '#3aa860', '#9a5ad8', '#f4f4f2', '#e0803a'])], ['kaos-willo', pilih(['#1d1d22', '#2c3150', '#7a4a2e'])]]);
  return warga({ jenis: P ? 'P' : 'L', kulit: pilih(KULIT), ekspresi: pilih(['normal', 'senang', 'senang']), rambut: { gaya, warna: pilih(WARNA_RAMBUT.slice(0, 4)) },
    atasan: { jenis: ats[0], warna: ats[1] }, bawahan: { jenis: P ? pilih(['celana', 'pendek']) : 'pendek', warna: pilih(['#2f3a52', '#1d1d22', '#5f6a3e', '#7a4a2e']) }, sepatu: pilih(['#1a1a1a', '#f4f4f2', '#e0803a']), ...o });
}
// pemuatan malas: hanya objek dekat pemain yang ada di scene
const aktif = new Map(); let iDepan = 0;
function muatDunia(d) {
  while (iDepan < RENCANA.length && RENCANA[iDepan].d < d + 150) { const r = RENCANA[iDepan]; const o = r.buat(); sc.add(o); aktif.set(r, o); iDepan++; }
  for (const [r, o] of aktif) if (r.d < d - 30) { sc.remove(o); o.traverse((m) => { if (m.isMesh && m.material.map) m.material.map.dispose?.(); }); aktif.delete(r); const ip = PENONTON.indexOf(o); }
  for (let i = PENONTON.length - 1; i >= 0; i--) if (!PENONTON[i].parent?.parent) PENONTON.splice(i, 1);
}
gapura(0, 'START · CFD KOTAK WETAN', '#e0803a'); gapura(WS.d, 'WATER STATION', '#3a8ad8'); gapura(FINISH, 'FINISH · PELARI KALCER', '#3aa860');
// meja water station
for (const s of [-1, 1]) { const m = kotak(1.4, 1.1, 8, 0xf6f3ee, .1); m.position.set(s * 7, .7, -WS.d * U); sc.add(m); for (let i = 0; i < 6; i++) { const b = kotak(.3, .6, .3, 0x5ab4ff, .1); b.position.set(s * 7, 1.55, -WS.d * U - 3 + i * 1.2); sc.add(b); } }
// gunung jauh (latar)
for (let i = 0; i < 9; i++) { const h = 40 + rnd() * 50; const m = kotak(70 + rnd() * 40, h, 50, new THREE.Color().setHSL(.33, .3, .45 + rnd() * .08), 4); m.position.set((i - 4) * 70, h / 2 - 8, -PANJANG - 160); m.castShadow = false; sc.add(m); }

// ---------------- avatar pemain ----------------
const SIMPAN = 'pkdk-avatar';
const DEF = { nama: 'SkenaRunner_ID', jenis: 'L', kulit: 3, rambut: 'acak', warnaRambut: 0, kaos: 0, bawah: 0, topi: 0 };
const KAOS = [['kaos', '#1d1d22', 'Kaos Hitam'], ['kaos', '#2c3150', 'Kaos Navy'], ['kaos', '#8a8d91', 'Kaos Abu'], ['kaos-willo', '#1d1d22', 'Willo Onyx'], ['kaos-willo', '#2c3150', 'Willo Navy'], ['kaos-willo', '#7a4a2e', 'Willo Cokelat'], ['kaos-willo', '#849483', 'Willo Sage'], ['kaos', '#e0803a', 'Kaos Oranye'], ['kaos', '#3aa860', 'Kaos Hijau'], ['kaos', '#f4f4f2', 'Kaos Putih'], ['kaos', '#dfd8c8', 'Lengan Panjang Oat', 1], ['kaos-willo', '#3b2f2a', 'Willo Lengan Panjang', 1], ['jaket', '#516270', 'Windbreaker Slate'], ['jaket', '#a46358', 'Windbreaker Terakota'],
  // jersey khusus pelari cewek: [jenis, warna, nama, lenganPanjang, 'P', warna panel samping]
  ['kaos', '#e8b4a8', 'Jersey Blush', 0, 'P', '#f6f3ee'], ['kaos', '#849483', 'Jersey Sage Panel', 0, 'P', '#dfd8c8'], ['kaos', '#a46358', 'Jersey Terakota', 0, 'P', '#1d1d22'],
  ['kaos', '#b88a9a', 'Jersey Mauve', 0, 'P', '#2c3150'], ['kaos', '#f4f4f2', 'Jersey Putih Oranye', 0, 'P', '#e0803a'], ['kaos', '#dfd8c8', 'Jersey Lengan Panjang Oat', 1, 'P', '#a46358'], ['kaos', '#2c3150', 'Jersey Lengan Panjang Navy', 1, 'P', '#e8b4a8']];
// bawahan: [jenis, warna, nama, khusus]  (P = hanya cewek)
const BAWAH = [['pendek', '#1d1d22', 'Split Shorts Onyx'], ['pendek', '#5f6a3e', 'Shorts Zaitun'], ['pendek', '#2c3150', 'Shorts Navy'], ['celana', '#23272b', 'Legging Panjang'], ['celana', '#3b2f2a', 'Jogger Espresso'], ['rok', '#1d1d22', 'Skort Onyx', 'P'], ['rok', '#a46358', 'Skort Terakota', 'P'], ['rok', '#849483', 'Skort Sage', 'P'], ['rok-panjang', '#384652', 'Rok Panjang + Legging', 'P'],
  // aneka rok lari cewek: [jenis, warna, nama, 'P', warna lis, lipit]
  ['rok', '#e8b4a8', 'Rok Lipit Blush', 'P', '#f6f3ee', 1], ['rok', '#f4f4f2', 'Rok Tenis Putih', 'P', '#e0803a', 1], ['rok', '#2c3150', 'Skort Navy Lis Oranye', 'P', '#e0803a'],
  ['rok', '#b88a9a', 'Rok Lari Mauve', 'P', '#2c3150'], ['rok', '#5f6a3e', 'Skort Zaitun Lipit', 'P', '#dfd8c8', 1],
  ['rok-panjang', '#849483', 'Rok Midi Sage + Legging', 'P', '#dfd8c8'], ['rok-panjang', '#c9b99a', 'Rok Panjang Oat', 'P', '#7a4a2e'], ['rok-panjang', '#1d1d22', 'Rok Panjang Onyx', 'P', '#e0803a']];
// Aturan Huda: yang polos gratis, yang keren (logo Willo, jaket, jersey panel, rok bermotif, cap Willo) dijual di Toko.
const kerenKaos = (k) => k[0] === 'kaos-willo' || k[0] === 'jaket' || !!k[5];
const OUTFIT = [...KAOS.map((k, i) => kerenKaos(k) ? { id: 'kaos-' + i, tipe: 'kaos', i, nama: k[2], P: k[4] === 'P', warna: k[0] === 'jaket' ? 'Windbreaker' : k[5] ? (k[3] ? 'Jersey lengan panjang' : 'Jersey panel samping') : 'Kaos sablon Willo', harga: k[0] === 'jaket' ? 500 : k[3] ? 450 : k[5] ? 350 : 300 } : null),
  ...BAWAH.map((b, i) => b[4] ? { id: 'bawah-' + i, tipe: 'bawah', i, nama: b[2], P: true, warna: b[0] === 'rok' ? (b[5] ? 'Rok lipit + celana dalam' : 'Skort lis kontras') : 'Rok panjang + legging', harga: b[0] === 'rok' ? 250 + (b[5] ? 100 : 0) : 400 } : null)].filter(Boolean);
const outfitBebas = (tipe, i) => { const o = OUTFIT.find((x) => x.tipe === tipe && x.i === i); return !o || D.punya.includes(o.id); };
const TOPI = [['none', 'Tanpa'], ['cap', 'Topi Polos Abu', '#8a8d91', 0, 'polos'], ['cap', 'Topi Polos Hitam', '#1d1d22', 0, 'polos'], ['visor', 'Visor Putih', '#f4f4f2'], ['visor', 'Visor Onyx', '#1d1d22'], ['band', 'Headband Onyx', '#1d1d22'], ['band', 'Headband Oranye', '#e0803a'], ['cap', 'Cap Willo Onyx', '#1d1d22', 1], ['cap', 'Cap Willo Oat', '#dfd8c8', 1], ['cap', 'Cap Willo Terakota', '#a46358', 1]];
TOPI.forEach((t, i) => { if (t[3]) OUTFIT.push({ id: 'topi-' + i, tipe: 'topi', i, nama: t[1], P: false, warna: 'Topi bordir WILLO', harga: 200 }); });
function pasangTopi(w, t) { const h = w.userData.head; if (!t || t[0] === 'none') return;
  if (t[0] === 'band') { const b = kotak(1.02, .16, 1.02, t[2], .05); b.position.y = .86; h.add(b); }
  if (t[0] === 'visor') { const b = kotak(1.02, .16, 1.02, t[2], .05); b.position.y = .9; h.add(b); const v = kotak(.98, .06, .5, t[2], .03); v.position.set(0, .86, .68); h.add(v); }
  if (t[0] === 'cap') { const b = kotak(1.06, .32, 1.06, t[2], .12); b.position.y = 1.1; h.add(b); const v = kotak(.98, .07, .52, t[2], .03); v.position.set(0, .98, .7); h.add(v); if (t[4] === 'polos') return; const lg = new THREE.Mesh(new THREE.PlaneGeometry(.5, .14), new THREE.MeshBasicMaterial({ map: papanTeks('WILLO', { w: 256, h: 72, bg: t[2], fg: t[2] === '#1d1d22' ? '#f4f2ff' : '#1d1d22' }) })); lg.position.set(0, 1.1, .535); h.add(lg); } }
let A = { ...DEF }; try { Object.assign(A, JSON.parse(localStorage.getItem(SIMPAN) || '{}')); } catch (e) {}
const simpanA = () => { try { localStorage.setItem(SIMPAN, JSON.stringify(A)); } catch (e) {} };
function buatPemain() {
  const P = A.jenis === 'P'; let k = KAOS[A.kaos] || KAOS[0]; if ((k[4] === 'P' && !P) || !outfitBebas('kaos', A.kaos)) k = KAOS[0]; let bw = BAWAH[A.bawah] || BAWAH[0]; if (bw[3] === 'P' && (!P || !outfitBebas('bawah', A.bawah))) bw = BAWAH[0];
  const w = warga({ jenis: A.jenis, kulit: KULIT[A.kulit], ekspresi: 'senang', rambut: { gaya: A.rambut, warna: WARNA_RAMBUT[A.warnaRambut] },
    atasan: { jenis: k[0], warna: k[1] }, lenganPanjang: !!k[3], bawahan: { jenis: bw[0], warna: bw[1] }, sepatu: sepatuAktif().c });
  if (A.rambut !== 'hijab' && outfitBebas('topi', A.topi)) pasangTopi(w, TOPI[A.topi]);
  if (k[5]) { const b = w.userData.body; for (const x of [-.535, .535]) { const p = kotak(.06, 1.1, .5, k[5], .02); p.position.set(x, .62, 0); b.add(p); } const kr = kotak(.5, .07, .02, k[5], .01); kr.position.set(0, 1.12, .305); b.add(kr); }
  if (bw[4]) { const y = bw[0] === 'rok' ? .8 : .1, t = bw[0] === 'rok' ? .08 : .14; const lis = kotak(bw[0] === 'rok' ? 1.24 : 1.34, t, bw[0] === 'rok' ? .79 : .9, bw[4], .03); lis.position.y = y; w.add(lis);
    if (bw[5]) for (const x of [-.4, -.2, 0, .2, .4]) { const l = kotak(.035, .58, .02, new THREE.Color(bw[1]).multiplyScalar(.78).getHex(), .01); l.position.set(x, 1.1, .385); w.add(l); } }
  const jm = jamAktif(); const tali = kotak(.52, .2, .54, jm.c, .05); tali.position.set(0, -.78, 0); w.userData.armL.add(tali); const muka = kotak(.3, .24, .08, 0x0d0e10, .04); muka.position.set(0, -.78, .29); w.userData.armL.add(muka);
  const layar = kotak(.22, .16, .02, 0x3aa860, .02); layar.material.emissive = new THREE.Color(0x3aa860); layar.position.set(0, -.78, .335); w.userData.armL.add(layar); pasangGengsi(w, gengsiAktif().id); if (!D.punya.includes('none')) D.punya.push('none');
  // nomor dada BIB #0088 di punggung
  const bib = new THREE.Mesh(new THREE.PlaneGeometry(.62, .42), new THREE.MeshStandardMaterial({ map: tekstur(256, 170, (x, W, H) => { x.fillStyle = '#f6f3ee'; x.fillRect(0, 0, W, H); x.fillStyle = '#e0803a'; x.fillRect(0, 0, W, 34); x.fillStyle = '#fff'; x.font = '800 24px Montserrat'; x.textAlign = 'center'; x.fillText('PELARI KALCER', W / 2, 26); x.fillStyle = '#1d1d22'; x.font = '900 92px Montserrat'; x.fillText('0088', W / 2, 140); }) }));
  bib.position.set(0, .62, -.31); bib.rotation.y = Math.PI; w.userData.body.add(bib);
  return w;
}
let pemain = null;
function gantiPemain() { if (!pemain) return; const p = pemain.position.clone(), r = pemain.rotation.y; sc.remove(pemain); pemain = buatPemain(); pemain.position.copy(p); pemain.rotation.y = r; sc.add(pemain); simpanA(); }

// ---------------- rintangan & pickup ----------------
const OBJ = []; // {d, lajur, jenis, mesh, aktif}
const mKoin = new THREE.MeshStandardMaterial({ color: 0xf2c14a, metalness: .55, roughness: .3, emissive: 0x3a2a00 });
const texW = tekstur(128, 128, (x) => { x.fillStyle = '#f2c14a'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#a8761a'; x.font = '900 92px Montserrat'; x.textAlign = 'center'; x.fillText('W', 64, 98); });
const mKoinMuka = new THREE.MeshStandardMaterial({ map: texW, metalness: .4, roughness: .35 });
function koinMesh() { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .18, 20), [mKoin, mKoinMuka, mKoinMuka]); c.rotation.x = Math.PI / 2; c.castShadow = true; g.add(c); return g; }
function kerucut() { const g = new THREE.Group(); const b = kotak(1.3, .2, 1.3, 0xe0803a, .05); b.position.y = .1; g.add(b); [[.9, .45, 0xe0803a], [.7, .45, 0xf6f3ee], [.5, .45, 0xe0803a], [.3, .35, 0xf6f3ee]].forEach(([s, h, c], i) => { const k = kotak(s, h, s, c, .06); k.position.y = .2 + h / 2 + i * .45; g.add(k); }); return g; }
function pembatas() { const g = new THREE.Group(); for (const s of [-1, 1]) { const k = kotak(.25, 1.3, .7, 0x2c3150, .05); k.position.set(s * 1.1, .65, 0); g.add(k); } for (let i = 0; i < 2; i++) { const p = kotak(2.7, .32, .22, i ? 0xf6f3ee : 0xe0803a, .05); p.position.set(0, .7 + i * .42, 0); g.add(p); } return g; }
function lubang() { const g = new THREE.Group(); const l = kotak(2.4, .05, 1.8, 0x23252a, .03); l.position.y = .03; l.receiveShadow = true; l.castShadow = false; g.add(l); for (let i = 0; i < 5; i++) { const k = kotak(.4, .25, .4, 0x7a7d84, .05); const a = i / 5 * 6.28; k.position.set(Math.cos(a) * 1.35, .12, Math.sin(a) * 1.05); g.add(k); } return g; }
function ikonPickup(warna, simbol) { const g = new THREE.Group(); const k = kotak(1.1, 1.1, 1.1, warna, .25); k.material.emissive = new THREE.Color(warna).multiplyScalar(.25); g.add(k);
  const t = tekstur(128, 128, (x) => { x.font = '80px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(simbol, 64, 70); });
  for (const r of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), new THREE.MeshBasicMaterial({ map: t, transparent: true })); p.rotation.y = r; p.position.set(Math.sin(r) * .56, 0, Math.cos(r) * .56); g.add(p); } return g; }
const BUAT = { koin: koinMesh, kerucut, pembatas, lubang, petir: () => ikonPickup(0x3aa860, '⚡'), magnet: () => ikonPickup(0xe05a6a, '🧲'), perisai: () => ikonPickup(0x3a8ad8, '🛡️'), hati: () => ikonPickup(0xf06a8a, '❤️') };
function isiLintasan() {
  OBJ.length = 0; let d = 40;
  while (d < FINISH - 25) {
    if (d > WS.buka - 10 && d < WS.tutup + 10) { d = WS.tutup + 10; continue; }
    const r = rnd(); const l = Math.floor(rnd() * 3);
    if (r < 0.42) { const jenis = d < 120 ? 'kerucut' : pilih(['kerucut', 'kerucut', 'pembatas', 'lubang']); OBJ.push({ d, lajur: l, jenis });
      if (d > 300 && rnd() < .35) OBJ.push({ d, lajur: (l + 1 + Math.floor(rnd() * 2)) % 3, jenis: pilih(['kerucut', 'lubang']) }); }
    else if (r < 0.88) { const lk = Math.floor(rnd() * 3); for (let i = 0; i < 6; i++) OBJ.push({ d: d + i * 2.6, lajur: lk, jenis: 'koin' }); d += 10; }
    else OBJ.push({ d, lajur: l, jenis: pilih(['petir', 'petir', 'magnet', 'perisai', 'hati']) });
    d += 14 + rnd() * 10;
  }
}

// ---------------- peloton NPC warga ----------------
const NPC = [];
const NAMA_NPC = ['@rakaa_', '@theresiaucy', '@pakguru', '@larisore', '@kopiskena', '@bu.sri', '@adit.tempo', '@nadya.run', '@bayu', '@kakak.pacer', '@dimas_lari', '@salsa.cfd'];
function buatNPC() {
  NPC.forEach((n) => sc.remove(n.m)); NPC.length = 0;
  for (let i = 0; i < 12; i++) { const m = wargaAcak(); m.rotation.y = Math.PI; const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: papanTeks(NAMA_NPC[i], { w: 256, h: 64, bg: 'rgba(44,49,80,.75)' }), depthWrite: false })); label.scale.set(2.4, .6, 1); label.position.y = 4.3; m.add(label);
    const n = { m, nama: NAMA_NPC[i], d: 5 + Math.floor(i / 3) * 3.5 + (i % 2) * 1.2, x: LAJUR[i % 3] + (rnd() - .5) * 1.2, lajur: i % 3, v: V_DASAR * (0.86 + rnd() * 0.24), fase: rnd() * 6 }; if (Math.abs(n.x) < 1.6 && n.d > -1.5) n.x = n.lajur === 1 ? 1.6 : n.x; n.m.position.set(n.x, 0, -n.d * U); sc.add(m); NPC.push(n); }
}

// ---------------- dompet, tas toko, rekor, pemanasan (tersimpan) ----------------
const SIMPAN2 = 'pkdk-data';
let D = { koin: 300, tas: {}, rekor: null, warm: false, sepatu: 'shoe_starter', jam: 'watch_basic', punya: ['shoe_starter', 'watch_basic', 'none'], gengsi: 'none' };
try { Object.assign(D, JSON.parse(localStorage.getItem(SIMPAN2) || '{}')); } catch (e) {}
const simpanD = () => { try { localStorage.setItem(SIMPAN2, JSON.stringify(D)); } catch (e) {} };
// GDD 7.1 Toko Skena
const TOKO = [
  { id: 'isotonik', ik: '🧃', nama: 'Botol Isotonik', efek: 'Stamina penuh lagi sekali saat tinggal 30%', harga: 150 },
  { id: 'gel', ik: '⚡', nama: 'Energy Gel', efek: 'Kecepatan +14% selama 20 detik pertama', harga: 200 },
  { id: 'pisang', ik: '🍌', nama: 'Pisang', efek: '+1 nyawa', harga: 100 },
  { id: 'kopi', ik: '🧋', nama: 'Kopi Skena Kaki', efek: 'Stamina lebih awet 25%', harga: 250 },
  { id: 'bakmi', ik: '🍜', nama: 'Bakmi Carbo-Load', efek: 'Kecepatan +18% sepanjang lari', harga: 300 },
];
// GDD 5.1 & 5.2: sepatu dan jam GPS, basic sampai grail (katalog Willo)
const SEPATU = [
  { id: 'shoe_starter', nama: 'Starter Jogger', warna: 'Stone Grey', tier: 'Tier 1 · Basic', c: '#8A8D91', pace: 8, harga: 0, ket: 'Sol busa EVA standar.' },
  { id: 'daily_oat', nama: 'Willo Daily Cruiser', warna: 'Oat Cream & Gum', tier: 'Tier 2 · Sport', c: '#EAE4D7', pace: 18, harga: 500, ket: 'Sepatu harian empuk, sol karet gum.' },
  { id: 'trail_sandstone', nama: 'Willo Trail Grip', warna: 'Sandstone & Sage', tier: 'Tier 3 · Pro Trail', c: '#B8A692', pace: 22, harga: 850, kebal: true, ket: 'Sol bergerigi, kebal lubang jalan.' },
  { id: 'solomate_carbon', nama: 'Solomate Carbon', warna: 'Matte Onyx & Bone', tier: 'Tier 3 · Pro Carbon', c: '#222528', pace: 28, harga: 1400, ket: 'Pelat karbon untuk kejar PB.' },
  { id: 'nyx_hyperfoam', nama: 'Nyx Hyperfoam Grail', warna: 'Alabaster & Copper', tier: 'Tier 4 · Grail', c: '#F5F4F0', pace: 36, harga: 2400, kebal: true, ket: 'Super-shoe kasta tertinggi.' },
];
const JAM = [
  { id: 'watch_basic', nama: 'Basic Fitness Band', warna: 'Monokrom', tier: 'Tier 1 · Basic', c: '#2A2D30', gps: 3.0, hemat: 5, harga: 0, ket: 'Gelang pintar standar.' },
  { id: 'willo_sport', nama: 'Willo Sport Watch 10:08', warna: 'Onyx / Olive', tier: 'Tier 2 · Sport', c: '#4A5844', gps: 1.5, hemat: 12, harga: 450, ket: 'Layar AMOLED bundar, langkah 8420.' },
  { id: 'coro_pro', nama: 'Willo Coro-Pro Dual-Band', warna: 'Warm Sand', tier: 'Tier 3 · Pro Skena', c: '#B8A692', gps: 0.5, hemat: 20, harga: 950, ket: 'Detak jantung & peringatan The Wall.' },
  { id: 'titanium_ultra', nama: 'Willo Titanium Ultra', warna: 'Sapphire', tier: 'Tier 4 · Grail', c: '#8C7D70', gps: 0, hemat: 30, harga: 2200, ket: 'Bodi titanium, GPS kunci instan.' },
];
// GDD 4.3 + katalog: item bergengsi (1 slot)
const GENGSI = [
  { id: 'none', nama: 'Tanpa Aksesori', warna: 'Lari polos', tier: 'Tier 1 · Basic', pace: 0, hemat: 0, harga: 0 },
  { id: 'waist_bag', nama: 'Running Waist Bag', warna: 'Matte Onyx', tier: 'Tier 1 · Basic', pace: 2, hemat: 5, harga: 150 },
  { id: 'sunglasses_matte', nama: 'Kacamata Lari Matte', warna: 'Tortoiseshell', tier: 'Tier 2 · Sport', pace: 6, hemat: 8, harga: 350 },
  { id: 'handuk', nama: 'Handuk Leher Skena', warna: 'Oat & Terakota', tier: 'Tier 2 · Sport', pace: 4, hemat: 12, harga: 400 },
  { id: 'ransel', nama: 'Ransel Lari Willo', warna: 'Clay', tier: 'Tier 2 · Sport', pace: 5, hemat: 14, harga: 500 },
  { id: 'hydration_vest', nama: 'Hydration Vest Lokal', warna: '2 Soft Flask', tier: 'Tier 3 · Pro Trail', pace: 12, hemat: 22, harga: 750 },
  { id: 'grail_trail_pack', nama: 'Carbon Vest + Bone Conduction + Poles', warna: 'Grail Set', tier: 'Tier 4 · Grail', pace: 22, hemat: 35, harga: 2600 },
];
const gengsiAktif = () => GENGSI.find((x) => x.id === D.gengsi) || GENGSI[0];
function pasangGengsi(w, id) {
  const u = w.userData, b = u.body, h = u.head; const tambah = (p, m, x, y, z) => { m.position.set(x, y, z); p.add(m); return m; };
  if (id === 'waist_bag') { tambah(b, kotak(.72, .24, .2, 0x1e2022, .08), 0, .1, .38); tambah(b, kotak(.6, .03, .02, 0xc5a890, .01), 0, .16, .485); }
  if (id === 'sunglasses_matte' || id === 'grail_trail_pack') { for (const x of [-.2, .2]) tambah(h, kotak(.3, .16, .05, 0x2e2622, .05), x, .62, .5); tambah(h, kotak(.98, .05, .05, 0x3b2f2a, .02), 0, .66, .49); for (const x of [-.47, .47]) tambah(h, kotak(.05, .05, .5, 0x3b2f2a, .02), x, .64, .25); }
  if (id === 'handuk') { tambah(b, kotak(1.05, .2, .22, 0xdfd8c8, .08), 0, 1.18, -.18); for (const x of [-.3, .3]) { tambah(b, kotak(.24, .7, .1, 0xdfd8c8, .05), x, .88, .35); tambah(b, kotak(.25, .12, .11, 0xa46358, .03), x, .7, .35); tambah(b, kotak(.25, .12, .11, 0xa46358, .03), x, .98, .35); } }
  if (id === 'ransel') { tambah(b, kotak(.86, .95, .36, 0xa46358, .14), 0, .65, -.5); tambah(b, kotak(.6, .34, .1, 0x8a4f46, .06), 0, .45, -.72); for (const x of [-.3, .3]) tambah(b, kotak(.12, 1.0, .06, 0x1e2022, .02), x, .66, .32); }
  if (id === 'hydration_vest' || id === 'grail_trail_pack') { const c = id === 'grail_trail_pack' ? 0x2a2d30 : 0x1e2022; tambah(b, kotak(.9, .85, .12, c, .06), 0, .72, -.37);
    for (const x of [-.3, .3]) { tambah(b, kotak(.32, .7, .08, c, .04), x, .75, .33); tambah(b, kotak(.18, .34, .16, 0x5ab4ff, .07), x, .82, .43); tambah(b, kotak(.08, .08, .08, 0x1e2022, .02), x, 1.02, .43); } }
  if (id === 'grail_trail_pack') { tambah(h, kotak(1.05, .08, .2, 0x8c7d70, .03), 0, 1.06, 0); for (const x of [-.5, .5]) tambah(h, kotak(.08, .3, .18, 0x8c7d70, .03), x, .82, .1);
    for (const lg of [u.armL, u.armR]) { const t = kotak(.06, 2.2, .06, 0x2a2d30, .02); t.position.set(0, -1.1, .3); t.rotation.x = .35; lg.add(t); } }
}
// ---------------- aset barang murni balok Dunia Kotak (ikon toko dirender langsung dari model kotak) ----------------
function grup(daftar) { const g = new THREE.Group(); for (const [w, h, d, c, x, y, z, r = .04, ry = 0, rz = 0] of daftar) { const m = kotak(w, h, d, c, r); m.position.set(x, y, z); m.rotation.y = ry; m.rotation.z = rz; g.add(m); } return g; }
function sepatuKotak(o) { // o: atas, sol, tebal, aksen, gerigi, pelat
  const s = o.tebal, L = [[1.7, s, .62, o.sol, 0, s / 2, 0], [1.25, .46, .58, o.atas, -.15, s + .23, 0, .08], [.5, .32, .56, o.atas, .58, s + .16, 0, .1], [.22, .62, .5, o.atas, -.7, s + .31, 0, .05],
    [.16, .5, .6, o.aksen, -.42, s + .25, 0, .02], [.14, .05, .3, 0xf6f3ee, .05, s + .48, 0, .02], [.14, .05, .3, 0xf6f3ee, .25, s + .44, 0, .02], [.14, .05, .3, 0xf6f3ee, -.15, s + .48, 0, .02], [.2, .14, .52, o.aksen, -.72, s + .66, 0, .03]];
  if (o.gerigi) for (let i = 0; i < 5; i++) L.push([.2, .1, .64, 0x2a2d30, -.65 + i * .32, -.04, 0, .02]);
  if (o.pelat) L.push([1.6, .06, .64, o.pelat, 0, s * .55, 0, .01]);
  return grup(L);
}
function jamKotak(o) { // tali, muka, bezel, layar, lebar
  const L = [[.34, 2.0, .1, o.tali, 0, 0, -.06, .05], [o.lebar, o.lebar, .22, o.bezel, 0, 0, .06, .1], [o.lebar - .16, o.lebar - .16, .04, 0x0d0e10, 0, 0, .18, .03],
    [o.lebar * .5, .1, .03, o.layar, 0, .06, .205, .01], [o.lebar * .3, .07, .03, 0xf6f3ee, -.04, -.1, .205, .01]];
  for (let i = 0; i < 4; i++) L.push([.34, .04, .11, 0x000000, 0, -.9 + i * .16, -.06, .01]);
  if (o.tombol) for (const y of [.12, -.12]) L.push([.08, .1, .1, o.bezel, o.lebar / 2 + .04, y, .06, .02]);
  return grup(L);
}
const KAC = [[.3, .16, .05, 0x2e2622, -.2, 0, 0, .05], [.3, .16, .05, 0x2e2622, .2, 0, 0, .05], [.98, .05, .05, 0x8a5a3c, 0, .04, 0, .02], [.05, .05, .6, 0x8a5a3c, -.47, .02, -.3, .02], [.05, .05, .6, 0x8a5a3c, .47, .02, -.3, .02]];
const ROMPI = (c) => [[.9, .85, .12, c, 0, 0, -.4, .06], [.32, .8, .08, c, -.3, 0, .1, .04], [.32, .8, .08, c, .3, 0, .1, .04], [.18, .36, .16, 0x5ab4ff, -.3, .06, .2, .07], [.18, .36, .16, 0x5ab4ff, .3, .06, .2, .07], [.08, .08, .08, 0x1e2022, -.3, .28, .2, .02], [.08, .08, .08, 0x1e2022, .3, .28, .2, .02], [.12, .12, .5, c, -.3, .35, -.15, .03], [.12, .12, .5, c, .3, .35, -.15, .03]];
const MODEL_BARANG = {
  shoe_starter: () => sepatuKotak({ atas: 0x8a8d91, sol: 0xf2f0ea, tebal: .2, aksen: 0x6c6f74 }),
  daily_oat: () => sepatuKotak({ atas: 0xeae4d7, sol: 0xb5803f, tebal: .24, aksen: 0xc9a77c }),
  trail_sandstone: () => sepatuKotak({ atas: 0xb8a692, sol: 0x6f7a62, tebal: .26, aksen: 0x8b9a7a, gerigi: 1 }),
  solomate_carbon: () => sepatuKotak({ atas: 0x222528, sol: 0xe9e4da, tebal: .34, aksen: 0xe9e4da, pelat: 0x3a3d42 }),
  nyx_hyperfoam: () => sepatuKotak({ atas: 0xf5f4f0, sol: 0xf5f4f0, tebal: .46, aksen: 0xb87333, pelat: 0xb87333 }),
  watch_basic: () => jamKotak({ tali: 0x2a2d30, bezel: 0x2a2d30, layar: 0x3aa860, lebar: .5 }),
  willo_sport: () => jamKotak({ tali: 0x4a5844, bezel: 0x1e2022, layar: 0xe0803a, lebar: .66 }),
  coro_pro: () => jamKotak({ tali: 0xb8a692, bezel: 0x5c5248, layar: 0xe05050, lebar: .72, tombol: 1 }),
  titanium_ultra: () => jamKotak({ tali: 0x8c7d70, bezel: 0xc8c6c0, layar: 0x5ab4ff, lebar: .82, tombol: 1 }),
  none: () => grup([[1.1, .12, 1.1, 0xd8d2c4, 0, 0, 0, .05]]),
  waist_bag: () => grup([[.9, .4, .3, 0x1e2022, 0, 0, 0, .12], [.7, .05, .03, 0xc5a890, 0, .08, .16, .01], [2.2, .1, .06, 0x3a3d42, 0, 0, -.18, .02]]),
  sunglasses_matte: () => grup(KAC),
  handuk: () => grup([[1.2, .14, .7, 0xdfd8c8, 0, 0, 0, .05], [1.2, .14, .7, 0xdfd8c8, 0, .15, 0, .05], [1.22, .15, .14, 0xa46358, 0, .07, .2, .02], [1.22, .15, .14, 0xa46358, 0, .07, -.2, .02]]),
  ransel: () => grup([[.86, .95, .36, 0xa46358, 0, 0, 0, .14], [.6, .34, .1, 0x8a4f46, 0, -.2, .22, .06], [.5, .08, .06, 0xe9e4da, 0, .3, .2, .02], [.12, 1.0, .06, 0x1e2022, -.3, .02, -.22, .02], [.12, 1.0, .06, 0x1e2022, .3, .02, -.22, .02]]),
  hydration_vest: () => grup(ROMPI(0x1e2022)),
  grail_trail_pack: () => { const g = grup(ROMPI(0x2a2d30)); const k = grup(KAC); k.position.set(0, .75, .1); g.add(k); g.add(grup([[1.05, .08, .2, 0x8c7d70, 0, 1.0, -.1, .03], [.06, 2.0, .06, 0x2a2d30, -.75, 0, 0, .02, 0, .25], [.06, 2.0, .06, 0x2a2d30, .75, 0, 0, .02, 0, -.25], [.14, .24, .14, 0xb87333, -.5, .9, 0, .03], [.14, .24, .14, 0xb87333, .5, .9, 0, .03]])); return g; },
  isotonik: () => grup([[.5, .9, .5, 0x5ab4ff, 0, 0, 0, .12], [.52, .3, .52, 0xf6f3ee, 0, -.05, 0, .04], [.3, .14, .3, 0xf6f3ee, 0, .52, 0, .04], [.18, .12, .18, 0xe0803a, 0, .64, 0, .03]]),
  gel: () => grup([[.6, .9, .14, 0xe0803a, 0, 0, 0, .05], [.6, .14, .1, 0xf2c14a, 0, .5, 0, .02], [.3, .3, .02, 0xf6f3ee, 0, 0, .08, .01], [.2, .1, .1, 0xf2c14a, .1, .6, 0, .02]]),
  pisang: () => grup([[.3, .3, .3, 0xf2d24a, -.6, .45, 0, .08], [.3, .3, .3, 0xf2d24a, -.32, .15, 0, .08], [.3, .3, .3, 0xf2d24a, 0, 0, 0, .08], [.3, .3, .3, 0xf2d24a, .32, .15, 0, .08], [.3, .3, .3, 0xf2d24a, .6, .45, 0, .08], [.12, .2, .12, 0x5c4630, -.74, .62, 0, .03], [.1, .1, .1, 0x5c4630, .74, .58, 0, .02]]),
  kopi: () => grup([[.6, .8, .6, 0xc9a77c, 0, 0, 0, .06], [.64, .3, .64, 0x6b4a32, 0, -.05, 0, .04], [.66, .1, .66, 0xf6f3ee, 0, .45, 0, .03], [.08, .6, .08, 0x2a2d30, .12, .75, 0, .02, 0, -.2]]),
  bakmi: () => grup([[1.1, .5, 1.1, 0xf6f3ee, 0, 0, 0, .14], [1.0, .1, 1.0, 0xe2b955, 0, .26, 0, .05], [.3, .08, .3, 0xa46358, .2, .33, .2, .03], [.2, .08, .2, 0x6aa84f, -.25, .33, .1, .03], [1.5, .05, .05, 0x8a5a3c, .1, .55, -.15, .02, 0, .15], [1.5, .05, .05, 0x8a5a3c, .1, .55, -.25, .02, 0, .15]]),
};
function modelOutfit(id) {
  const [t, n] = id.split('-'), i = +n;
  if (t === 'topi') { const c = TOPI[i][2]; return grup([[1.06, .32, 1.06, c, 0, 0, 0, .12], [.98, .07, .52, c, 0, -.12, .7, .03], [.5, .14, .02, c === '#1d1d22' ? 0xf4f2ff : 0x1d1d22, 0, 0, .54, .01]]); }
  if (t === 'kaos') { const k = KAOS[i], L = [[1.1, 1.2, .6, k[1], 0, 0, 0, .06], [.5, k[3] ? 1.15 : .45, .5, k[1], -.82, k[3] ? -.1 : .35, 0, .05], [.5, k[3] ? 1.15 : .45, .5, k[1], .82, k[3] ? -.1 : .35, 0, .05]];
    if (k[5]) L.push([.06, 1.1, .5, k[5], -.555, 0, 0, .02], [.06, 1.1, .5, k[5], .555, 0, 0, .02], [.5, .07, .02, k[5], 0, .52, .305, .01]); return grup(L); }
  const b = BAWAH[i], gelap = new THREE.Color(b[1]).multiplyScalar(.78).getHex();
  if (b[0] === 'rok') { const L = [[1.2, .7, .75, b[1], 0, 0, 0, .1], [1.22, .12, .77, gelap, 0, .34, 0, .04], [1.24, .08, .79, b[4], 0, -.32, 0, .03]]; if (b[5]) for (const x of [-.4, -.2, 0, .2, .4]) L.push([.035, .58, .02, gelap, x, -.02, .385, .01]); return grup(L); }
  return grup([[1.22, 1.42, .78, b[1], 0, 0, 0, .12], [1.24, .12, .8, gelap, 0, .7, 0, .04], [1.34, .14, .9, b[4], 0, -.7, 0, .03], [.4, .3, .4, 0x23272b, -.28, -.92, 0, .04], [.4, .3, .4, 0x23272b, .28, -.92, 0, .04]]);
}
let RI = null; const IKON = {};
function ikon(id) {
  if (IKON[id] !== undefined) return IKON[id];
  try {
    RI = RI || new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); RI.setPixelRatio(1); RI.setSize(168, 168, false); RI.outputColorSpace = THREE.SRGBColorSpace;
    const st = new THREE.Scene(); st.add(new THREE.HemisphereLight(0xfff4ff, 0xb8a890, 1.5)); const l = new THREE.DirectionalLight(0xffffff, 1.7); l.position.set(3, 5, 4); st.add(l);
    const m = (MODEL_BARANG[id] || (() => modelOutfit(id)))(); m.rotation.y = -.55; m.rotation.x = .18; st.add(m);
    const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2;
    const k = new THREE.PerspectiveCamera(30, 1, .1, 100); k.position.set(c.x, c.y + r * .5, c.z + r / Math.tan(15 * Math.PI / 180) * 1.02); k.lookAt(c);
    RI.render(st, k); IKON[id] = RI.domElement.toDataURL('image/png');
  } catch (e) { IKON[id] = ''; }
  return IKON[id];
}
const sepatuAktif = () => SEPATU.find((x) => x.id === D.sepatu) || SEPATU[0];
const jamAktif = () => JAM.find((x) => x.id === D.jam) || JAM[0];
// GDD 2.2 ABC Drills
const DRILL = [{ nama: 'High Knees', pose: (t) => ({ legL: -1.4 * Math.max(0, Math.sin(t)), legR: -1.4 * Math.max(0, -Math.sin(t)), armL: Math.sin(t) * .8, armR: -Math.sin(t) * .8 }) },
  { nama: 'Butt Kicks & Arm Swing', pose: (t) => ({ legL: .9 * Math.max(0, Math.sin(t)), legR: .9 * Math.max(0, -Math.sin(t)), armL: -Math.sin(t) * 1.2, armR: Math.sin(t) * 1.2 }) },
  { nama: 'A-Skips', pose: (t) => ({ legL: -1.0 * Math.max(0, Math.sin(t)), legR: -1.0 * Math.max(0, -Math.sin(t)), armL: Math.sin(t) * 1.4, armR: -Math.sin(t) * 1.4 }) }];

let tabToko = 'bekal';
pemain = buatPemain(); sc.add(pemain);
// ---------------- keadaan ----------------
let mode = 'lobi'; // lobi | gps | hitung | lari | selesai | gagal
const P = {};
function resetLari() {
  Object.assign(P, { d: 0, x: 0, lajur: 1, y: 0, vy: 0, v: 0, stamina: 100, nyawa: 3, koin: 0, kebal: 0, magnet: 0, perisai: 0, sprint: false, waktu: 0, wsAmbil: false, draft: false, wall: false, fase: 0, maxEl: 0 });
  P.bekal = { ...D.tas }; P.warm = D.warm; if (P.bekal.pisang) P.nyawa = 4; P.gel = P.bekal.gel ? 20 : 0;
  acak = 7771; isiLintasan(); OBJ.forEach((o) => { if (o.mesh) sc.remove(o.mesh); o.mesh = null; o.habis = false; });
  for (const [r, o] of aktif) sc.remove(o); aktif.clear(); iDepan = 0; acak = 20251107; muatDunia(0);
  buatNPC(); pemain.position.set(0, 0, 0); pemain.rotation.y = Math.PI;
}

// ---------------- UI ----------------
function tampil(id) { ['lobi', 'hud', 'gps', 'struk', 'gagal', 'jeda'].forEach((x) => { $(x).hidden = x !== id && !(id === 'hud' && false); }); if (id) $(id).hidden = false; }
function isiLobi() {
  $('inNama').value = A.nama;
  const bar = (el, items, aktifFn, klik) => { el.innerHTML = ''; items.forEach((it, i) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = it.html; b.setAttribute('aria-pressed', aktifFn(it, i)); if (it.warna) b.style.setProperty('--w', it.warna); b.className = it.warna ? 'swatch' : 'chip'; b.onclick = () => { klik(it, i); isiLobi(); gantiPemain(); }; el.appendChild(b); }); };
  bar($('pilTubuh'), [{ html: 'Laki-laki', v: 'L' }, { html: 'Perempuan', v: 'P' }], (it) => A.jenis === it.v, (it) => { A.jenis = it.v; A.rambut = GAYA_RAMBUT[it.v][0]; if (it.v === 'L' && BAWAH[A.bawah]?.[3]) A.bawah = 0; });
  bar($('pilKulit'), KULIT.map((c) => ({ html: '', warna: c })), (it, i) => A.kulit === i, (it, i) => { A.kulit = i; });
  bar($('pilRambut'), GAYA_RAMBUT[A.jenis].map((g) => ({ html: g[0].toUpperCase() + g.slice(1), v: g })), (it) => A.rambut === it.v, (it) => { A.rambut = it.v; });
  bar($('pilWarnaRambut'), WARNA_RAMBUT.slice(0, 6).map((c) => ({ html: '', warna: c })), (it, i) => A.warnaRambut === i, (it, i) => { A.warnaRambut = i; });
  bar($('pilKaos'), KAOS.map((k, i) => ({ html: '', warna: k[1], i, P: k[4] })).filter((k) => (!k.P || A.jenis === 'P') && outfitBebas('kaos', k.i)), (it) => (A.kaos || 0) === it.i, (it) => { A.kaos = it.i; });
  $('namaKaos').textContent = (KAOS[A.kaos] || KAOS[0])[2];
  bar($('pilBawah'), BAWAH.map((b, i) => ({ html: b[2], i, P: b[3] })).filter((b) => !b.P || (A.jenis === 'P' && outfitBebas('bawah', b.i))), (it) => (A.bawah || 0) === it.i, (it) => { A.bawah = it.i; });
  bar($('pilTopi'), TOPI.map((t, i) => ({ html: t[1], i })).filter((t) => outfitBebas('topi', t.i)), (it) => (A.topi || 0) === it.i, (it) => { A.topi = it.i; });
}
$('inNama').addEventListener('input', (e) => { A.nama = e.target.value.replace(/[^\w.@]/g, '').slice(0, 16) || DEF.nama; simpanA(); });
$('bMulai').onclick = () => { bunyi(660, .08); $('pemanasan').hidden = true; mulaiGPS(); };
$('bWS').onclick = () => ambilAir();
$('bLagi').onclick = () => { resetLari(); keLobi(); };
$('bLagi2').onclick = () => { resetLari(); keLobi(); };
$('bJeda').onclick = () => { if (mode === 'lari') { mode = 'jeda'; $('jeda').hidden = false; } };
$('bLanjut').onclick = () => { mode = 'lari'; $('jeda').hidden = true; jamLalu = performance.now(); };
$('bKeluar').onclick = () => { $('jeda').hidden = true; resetLari(); keLobi(); };
// Simpan struk jadi gambar story 9:16 (1080x1920) untuk IG/WA story finisher
let STRUK = null;
function gambarStory() {
  const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2c3150'); bg.addColorStop(1, '#13141f'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 14; i++) for (let j = 0; j < 25; j++) if ((i + j) % 2) g.fillRect(i * 80, j * 80, 80, 80);
  g.textAlign = 'center'; g.fillStyle = '#f2c14a'; g.font = '800 34px Montserrat, sans-serif'; g.fillText('CFD DESA · DUNIA KOTAK', W / 2, 130);
  g.fillStyle = '#f4f2ff'; g.font = '900 96px Montserrat, sans-serif'; g.fillText('FINISHER!', W / 2, 235);
  const x = 120, y = 280, w = W - 240, hk = 760 + STRUK.rows.length * 40 + 150; g.fillStyle = '#fbf8f1'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 40; g.shadowOffsetY = 18; g.fillRect(x, y, w, hk); g.shadowColor = 'transparent';
  g.beginPath(); for (let i = 0; i <= w; i += 30) { g.lineTo(x + i, y + hk); g.lineTo(x + i + 15, y + hk + 18); } g.lineTo(x + w, y + hk); g.closePath(); g.fill();
  g.fillStyle = '#1d1d22'; g.font = '900 64px Montserrat, sans-serif'; g.fillText('PELARI KALCER', W / 2, y + 100);
  g.font = '28px "Courier New", monospace'; g.fillText('RACE RECEIPT · DUNIA KOTAK', W / 2, y + 148);
  g.fillStyle = '#efe7d6'; g.fillRect(W / 2 - 200, y + 175, 400, 480);
  if (STRUK.img) g.drawImage(STRUK.img, W / 2 - 200, y + 175, 400, 480);
  const garis = (yy) => { g.strokeStyle = '#999'; g.setLineDash([10, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(x + 50, yy); g.lineTo(x + w - 50, yy); g.stroke(); g.setLineDash([]); };
  let yy = y + 690; garis(yy); yy += 46;
  for (const [a, b] of STRUK.rows) { g.textAlign = 'left'; g.font = '30px "Courier New", monospace'; g.fillStyle = '#1d1d22'; g.fillText(a, x + 56, yy); g.textAlign = 'right'; g.font = 'bold 30px "Courier New", monospace'; g.fillText(String(b), x + w - 56, yy); yy += 40; }
  garis(yy - 12); g.textAlign = 'center'; g.font = '28px "Courier New", monospace'; g.fillText('Supported by', W / 2, yy + 44); g.font = 'bold 36px "Courier New", monospace'; g.fillText('www.willoapparel.com', W / 2, yy + 90);
  g.fillStyle = '#f4f2ff'; g.font = '800 40px Montserrat, sans-serif'; g.fillText('Kalcer dulu, PB kemudian 🏃', W / 2, H - 62);
  return c;
}
$('bSimpan').onclick = () => {
  if (!STRUK) return; const c = gambarStory(), url = c.toDataURL('image/png'), nama = 'pelari-kalcer-finisher.png';
  $('storyImg').src = url; $('unduhStory').href = url; $('unduhStory').download = nama; $('story').hidden = false;
  c.toBlob((bl) => { STRUK.blob = bl; $('bBagi').hidden = !(bl && navigator.canShare && navigator.canShare({ files: [new File([bl], nama, { type: 'image/png' })] })); }, 'image/png');
};
$('bBagi').onclick = async () => { try { await navigator.share({ files: [new File([STRUK.blob], 'pelari-kalcer-finisher.png', { type: 'image/png' })], text: STRUK.caption }); } catch (e) {} };
$('bTutupStory').onclick = () => { $('story').hidden = true; };
function tutupLaci() { document.querySelectorAll('.laci').forEach((l) => l.hidden = true); $('lobi').hidden = false; if (mode === 'lobi') $('pemanasan').hidden = false; }
function bukaLaci(id) { tutupLaci(); $('lobi').hidden = true; $('pemanasan').hidden = true; $(id).hidden = false; bunyi(520, .05); }
document.querySelectorAll('[data-tutup]').forEach((b) => b.onclick = tutupLaci);
function isiMenu() {
  $('hDompet').textContent = D.koin.toLocaleString('id-ID');
  const n = Object.keys(D.tas).length; $('tagToko').textContent = n ? n + ' bekal' : '';
  document.querySelectorAll('#tabToko button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tab === tabToko));
  if (tabToko === 'outfit') {
    const bisa = (o) => !o.P || A.jenis === 'P'; const aktif = (o) => (o.tipe === 'kaos' ? A.kaos : o.tipe === 'bawah' ? A.bawah : A.topi) === o.i;
    $('daftarToko').innerHTML = '<p class="catat" style="margin:0 0 6px">Kaos, celana & topi polos gratis di menu Avatar. Yang keren beli di sini, lalu otomatis terpakai.</p>' + OUTFIT.map((o) => { const punya = D.punya.includes(o.id), pakai = bisa(o) && aktif(o);
      return `<div class="gear ${pakai ? 'pakai' : ''}"><img src="${ikon(o.id)}" alt=""><div><small>${o.tipe === 'kaos' ? (o.P ? 'Jersey cewek' : 'Atasan') : o.tipe === 'bawah' ? 'Rok lari cewek' : 'Topi'}</small><b>${o.nama}</b><i>${o.warna}</i><span>${o.P && A.jenis !== 'P' ? 'Khusus avatar cewek' : 'Gaya, tanpa bonus'}</span></div><button data-outfit="${o.id}" ${(!punya && D.koin < o.harga) || (punya && !bisa(o)) ? 'disabled' : ''}>${pakai ? 'Dipakai ✓' : punya ? (bisa(o) ? 'Pakai' : 'Dimiliki') : o.harga.toLocaleString('id-ID') + ' W'}</button></div>`; }).join('');
    $('daftarToko').querySelectorAll('[data-outfit]').forEach((b) => b.onclick = () => { const o = OUTFIT.find((x) => x.id === b.dataset.outfit); if (!D.punya.includes(o.id)) { if (D.koin < o.harga) return; D.koin -= o.harga; D.punya.push(o.id); bunyi(1180, .08, 'triangle'); simpanD(); } if (bisa(o)) { if (o.tipe === 'kaos') A.kaos = o.i; else if (o.tipe === 'bawah') A.bawah = o.i; else A.topi = o.i; simpanA(); gantiPemain(); isiLobi(); } isiMenu(); });
  } else if (tabToko !== 'bekal') { const L = { sepatu: SEPATU, jam: JAM, gengsi: GENGSI }[tabToko]; const kunci = tabToko;
    $('daftarToko').innerHTML = L.map((g) => { const punya = D.punya.includes(g.id), pakai = D[kunci] === g.id; const efek = tabToko === 'gengsi' ? (g.pace ? `+${g.pace}% pace · stamina hemat ${g.hemat}%` : 'Tanpa bonus') : tabToko === 'sepatu' ? `+${g.pace}% pace${g.kebal ? ' · kebal lubang' : ''}` : `GPS ${g.gps ? g.gps.toString().replace('.', ',') + ' dtk' : 'instan'} · stamina hemat ${g.hemat}%`;
      return `<div class="gear ${pakai ? 'pakai' : ''}"><img src="${ikon(g.id)}" alt=""><div><small>${g.tier}</small><b>${g.nama}</b><i>${g.warna}</i><span>${efek}</span></div><button data-gear="${g.id}" ${!punya && D.koin < g.harga ? 'disabled' : ''}>${pakai ? 'Dipakai ✓' : punya ? 'Pakai' : g.harga.toLocaleString('id-ID') + ' W'}</button></div>`; }).join('');
    $('daftarToko').querySelectorAll('[data-gear]').forEach((b) => b.onclick = () => { const g = L.find((x) => x.id === b.dataset.gear); if (!D.punya.includes(g.id)) { if (D.koin < g.harga) return; D.koin -= g.harga; D.punya.push(g.id); bunyi(1180, .08, 'triangle'); } D[kunci] = g.id; simpanD(); gantiPemain(); isiMenu(); });
  } else
  $('daftarToko').innerHTML = TOKO.map((it) => { const punya = D.tas[it.id]; return `<div class="item ${punya ? 'punya' : ''}"><div class="ik"><img src="${ikon(it.id)}" alt="${it.ik}"></div><div><b>${it.nama}</b><small>${it.efek}</small></div><button data-beli="${it.id}" ${punya || D.koin < it.harga ? 'disabled' : ''}>${punya ? 'Di tas ✓' : it.harga + ' W'}</button></div>`; }).join('');
  $('daftarToko').querySelectorAll('[data-beli]').forEach((b) => b.onclick = () => { const it = TOKO.find((x) => x.id === b.dataset.beli); if (D.koin < it.harga) return; D.koin -= it.harga; D.tas[it.id] = 1; simpanD(); bunyi(1180, .08, 'triangle'); isiMenu(); });
  const papan = [['@nadya.run', 236], ['@kakak.pacer', 251], ['@adit.tempo', 268], ['@salsa.cfd', 284], ['@dimas_lari', 301], ['@kopiskena', 322], ['@larisore', 347]];
  if (D.rekor) papan.push(['@' + A.nama, D.rekor, 1]); papan.sort((a, b) => a[1] - b[1]);
  $('daftarRank').innerHTML = papan.map((r, i) => `<div class="rank ${r[2] ? 'saya' : ''}"><span>#${i + 1}</span><span>${r[0]}</span><b>${fmtWaktu(r[1])}</b></div>`).join('') + (D.rekor ? '' : '<p class="catat" style="margin:6px 0">Selesaikan 1 lari untuk masuk papan.</p>');
}
$('mAvatar').onclick = () => bukaLaci('dAvatar'); $('mToko').onclick = () => { isiMenu(); bukaLaci('dToko'); }; $('mRank').onclick = () => { isiMenu(); bukaLaci('dRank'); };
document.querySelectorAll('#tabToko button').forEach((b) => b.onclick = () => { tabToko = b.dataset.tab; isiMenu(); });
const MAPS = [['🏘️', 'CFD Kotak Wetan', 'Desa · 1 KM · +9 m', 1], ['🏙️', 'Jakarta Sudirman CFD', 'Road · aspal kota'], ['🛕', 'Jogja Borobudur', 'Road · paving desa'], ['🏝️', 'Bali Sanur', 'Road · boardwalk pantai'], ['🌲', 'Siksorogo Lawu', 'Trail · tanah merah'], ['🌋', 'Bromo Trail', 'Trail · pasir vulkanik'], ['⛰️', 'Dieng & Rinjani', 'Trail · sabana']];
$('daftarMap').innerHTML = MAPS.map((m) => `<div class="map ${m[3] ? 'buka' : ''}"><span>${m[0]}</span><div><b>${m[1]}</b><small>${m[2]}</small></div><em>${m[3] ? 'Dipilih' : 'Segera'}</em></div>`).join('');
$('bRute').onclick = () => bukaLaci('dMap');
// ---- ABC Drills (GDD 2.2): ketuk avatar di menu, tiap ketuk = 1 gerakan; 8 ketukan per drill, 3 drill ----
const pm = { n: 0, gerak: 0 }; const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function kenaAvatar(e) { ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, kam); if (ray.intersectObject(pemain, true).length) return true;
  const p = pemain.position.clone().setY(2).project(kam); return Math.hypot(p.x - ndc.x, (p.y - ndc.y) * innerHeight / innerWidth) < 0.14; }
kanvas.addEventListener('pointerdown', (e) => { if (mode === 'lobi' && !$('lobi').hidden && kenaAvatar(e)) ketukPemanasan(); });
function ketukPemanasan() {
  if (D.warm) { toast('🔥 Sudah panas! Bonus +12% siap dipakai'); return; }
  pm.n++; pm.gerak = 1; bunyi(500 + (pm.n % 8) * 60, .05, 'triangle');
  if (pm.n >= 24) { D.warm = true; simpanD(); bunyi(1320, .2, 'triangle'); toast('🔥 Pemanasan 100%! Warm-Up +12% pace'); }
  labelPemanasan();
}
function labelPemanasan() { const i = Math.min(2, Math.floor((pm.n - 1) / 8)); $('pemanasan').classList.toggle('selesai', !!D.warm);
  $('pmNama').textContent = D.warm ? '🔥 Pemanasan selesai · +12% pace' : pm.n ? `🔥 ${DRILL[Math.max(0, i)].nama} ${((pm.n - 1) % 8) + 1}/8` : '🔥 Ketuk avatar untuk pemanasan';
  $('pmBar').style.width = (D.warm ? 100 : pm.n / 24 * 100) + '%'; $('pmInfo').textContent = D.warm ? 'Bonus dipakai di lari berikutnya' : `ABC Drills ${pm.n}/24 · selesai = +12% pace`; }
function keLobi() { tutupLaci(); isiMenu(); if (!D.warm) pm.n = 0; labelPemanasan(); $('pemanasan').hidden = false; mode = 'lobi'; ['hud', 'gps', 'struk', 'gagal', 'jeda'].forEach((x) => $(x).hidden = true); $('lobi').hidden = false; $('kontrol').hidden = true; isiLobi(); }
function mulaiGPS() {
  mode = 'gps'; $('lobi').hidden = true; $('gps').hidden = false; $('gps').classList.remove('kunci'); $('gpsTeks').textContent = 'MENCARI GPS...';
  const tunggu = 300 + jamAktif().gps * 1000; $('gpsInfo').textContent = jamAktif().nama + ' · kunci ' + (jamAktif().gps ? jamAktif().gps.toString().replace('.', ',') + ' detik' : 'instan');
  setTimeout(() => { $('gps').classList.add('kunci'); $('gpsTeks').textContent = 'GPS LOCKED'; bunyi(1320, .12); setTimeout(() => bunyi(1320, .12), 160); }, tunggu);
  setTimeout(() => { $('gps').hidden = true; hitungMundur(); }, tunggu + 1000);
}
function hitungMundur() { mode = 'hitung'; $('hud').hidden = false; $('kontrol').hidden = false; let n = 3; const t = () => { $('toast').textContent = n > 0 ? n : 'GO!'; $('toast').hidden = false; bunyi(n > 0 ? 520 : 880, .1); if (n-- > 0) setTimeout(t, 650); else { setTimeout(() => $('toast').hidden = true, 600); mode = 'lari'; jamLalu = performance.now(); $('kontrol').classList.remove('pudar'); setTimeout(() => $('kontrol').classList.add('pudar'), 6000); } }; t(); }
let toastT = 0; function toast(s, ms = 1300) { $('toast').textContent = s; $('toast').hidden = false; clearTimeout(toastT); toastT = setTimeout(() => $('toast').hidden = true, ms); }
const fmtWaktu = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function hud() {
  $('hJarak').textContent = (P.d / 1000).toFixed(2).replace('.', ',');
  const pace = P.d > 5 ? (P.waktu * SKALA_WAKTU) / (P.d / 1000) : 0; $('hPace').textContent = pace ? fmtWaktu(pace) : '–:–';
  const st = $('hStamina'); st.style.width = P.stamina + '%'; st.style.background = P.stamina > 55 ? '#3aa860' : P.stamina > BATAS_WALL ? '#f2c14a' : '#e05a3a';
  $('hNyawa').textContent = '❤️'.repeat(Math.max(0, P.nyawa)) + '🤍'.repeat(Math.max(0, 3 - P.nyawa));
  $('hKoin').textContent = P.koin; $('hRank').textContent = '#' + peringkat();
  const b = []; if (P.draft) b.push('🌬️ Drafting −15%'); if (P.magnet > 0) b.push('🧲 ' + Math.ceil(P.magnet) + 's'); if (P.perisai > 0) b.push('🛡️ ' + Math.ceil(P.perisai) + 's'); if (P.wall) b.push('🧱 THE WALL'); if (P.warm) b.push('🔥 Warm-up +12%'); if (P.gel > 0) b.push('⚡ Gel ' + Math.ceil(P.gel) + 's'); if (P.bekal.bakmi) b.push('🍜 +18%'); if (P.bekal.kopi) b.push('🧋 hemat 25%');
  $('hBuff').innerHTML = b.map((x) => `<span>${x}</span>`).join('');
  $('bWS').hidden = !(P.d > WS.buka && P.d < WS.tutup && !P.wsAmbil);
}
const peringkat = () => 1 + NPC.filter((n) => n.d > P.d).length;

// ---------------- kontrol ----------------
function geser(a) { if (mode !== 'lari') return; const l = Math.max(0, Math.min(2, P.lajur + a)); if (l !== P.lajur) { P.lajur = l; bunyi(440, .04); } }
function lompat() { if (mode !== 'lari' || P.y > .05) return; P.vy = 13.5; bunyi(600, .06); }
addEventListener('keydown', (e) => { if (e.repeat) return; if (e.key === 'ArrowLeft' || e.key === 'a') geser(-1); if (e.key === 'ArrowRight' || e.key === 'd') geser(1); if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') { lompat(); e.preventDefault(); } if (e.key === 'Shift') P.sprint = true; if (e.key === 'e') ambilAir(); if (e.key === 'Escape') $('bJeda').click(); });
addEventListener('keyup', (e) => { if (e.key === 'Shift') P.sprint = false; });
// swipe kiri/kanan = lajur, swipe atas = lompat, tap/tahan = sprint (tanpa tombol layar)
let sentuh = null, sprintTap = 0;
function blokir(e) { return e.target.closest && e.target.closest('button, input, .laci, #lobi, .layar'); }
addEventListener('pointerdown', (e) => { if (blokir(e) || mode !== 'lari') return; sentuh = { x: e.clientX, y: e.clientY, t: performance.now(), geser: false }; });
addEventListener('pointermove', (e) => { if (!sentuh || sentuh.geser) return; const dx = e.clientX - sentuh.x, dy = e.clientY - sentuh.y;
  if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy)) { geser(dx > 0 ? 1 : -1); sentuh.geser = true; } else if (dy < -34 && Math.abs(dy) > Math.abs(dx)) { lompat(); sentuh.geser = true; } });
addEventListener('pointerup', () => { if (sentuh && !sentuh.geser) sprintTap = Math.max(sprintTap, 0.9); sentuh = null; });
addEventListener('pointercancel', () => { sentuh = null; });
// ---------------- suara ----------------
let AC = null; function bunyi(f, dur = .08, tipe = 'square', vol = .05) { try { AC = AC || new AudioContext(); const o = AC.createOscillator(), g = AC.createGain(); o.type = tipe; o.frequency.value = f; g.gain.value = vol; g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + dur); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + dur); } catch (e) {} }

// ---------------- logika lari ----------------
function ambilAir() { if (mode !== 'lari' || P.wsAmbil || !(P.d > WS.buka && P.d < WS.tutup)) return; P.wsAmbil = true; P.stamina = Math.min(100, P.stamina + 35); P.koin += 50; toast('💧 Isotonik! +35% stamina · +50 W'); bunyi(990, .1); setTimeout(() => bunyi(1320, .1), 90); }
function kena(o) {
  if (P.kebal > 0) return;
  if (P.perisai > 0) { P.perisai = 0; P.kebal = 1; toast('🛡️ Perisai menahan benturan'); bunyi(300, .1); o.habis = true; if (o.mesh) o.mesh.visible = false; return; }
  P.nyawa--; P.kebal = 1.6; P.v *= .45; bunyi(140, .25, 'sawtooth', .07); toast(o.jenis === 'lubang' ? 'Aduh, lubang jalan!' : 'Nabrak ' + o.jenis + '!');
  if (P.nyawa <= 0) gagal();
}
function ambil(o) { o.habis = true; if (o.mesh) o.mesh.visible = false;
  if (o.jenis === 'koin') { P.koin += 25; bunyi(1180 + rnd() * 200, .05, 'triangle'); }
  if (o.jenis === 'petir') { P.stamina = Math.min(100, P.stamina + 30); toast('⚡ +30% stamina'); bunyi(800, .12, 'triangle'); }
  if (o.jenis === 'magnet') { P.magnet = 8; toast('🧲 Magnet 8 detik'); bunyi(700, .12, 'triangle'); }
  if (o.jenis === 'perisai') { P.perisai = 8; toast('🛡️ Perisai 8 detik'); bunyi(600, .12, 'triangle'); }
  if (o.jenis === 'hati') { P.nyawa = Math.min(5, P.nyawa + 1); toast('❤️ +1 nyawa'); bunyi(900, .12, 'triangle'); }
}
function gagal() { mode = 'gagal'; D.koin += P.koin; D.tas = {}; D.warm = false; simpanD(); setTimeout(() => { $('gagal').hidden = false; $('kontrol').hidden = true; $('gagalInfo').textContent = `Berhenti di ${(P.d / 1000).toFixed(2).replace('.', ',')} KM. Coba lagi, pelan-pelan jaga stamina.`; }, 700); }
// foto struk: avatar pemain berkalung medali finisher, dirender di studio kecil terpisah
let RF = null;
function fotoMedali(w = 150, h = 180, pr = 2) {
  try {
    RF = RF || new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); RF.setPixelRatio(pr); RF.setSize(w, h, false); RF.outputColorSpace = THREE.SRGBColorSpace;
    const st = new THREE.Scene(); st.add(new THREE.HemisphereLight(0xfff4ff, 0xb8a890, 1.4)); const l = new THREE.DirectionalLight(0xffffff, 1.6); l.position.set(2, 4, 5); st.add(l);
    const a = buatPemain(); a.rotation.y = 0; st.add(a); const b = a.userData.body;
    // medali: pita V + koin emas W
    for (const s of [-1, 1]) { const p = kotak(.16, .62, .04, s < 0 ? 0xe0803a : 0x2c3150, .02); p.position.set(s * .17, .86, .33); p.rotation.z = s * .38; b.add(p); }
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .06, 24), [new THREE.MeshStandardMaterial({ color: 0xf2c14a, metalness: .6, roughness: .3 }), mKoinMuka, mKoinMuka]); m.rotation.x = Math.PI / 2; m.position.set(0, .5, .37); b.add(m);
    pose(a, { armL: -2.9, armR: -2.9, armLz: .35, armRz: -.35 });
    const k = new THREE.PerspectiveCamera(30, w / h, .1, 50); k.position.set(1.2, 2.6, 8.6); k.lookAt(0, 2.05, 0);
    RF.render(st, k); return RF.domElement.toDataURL('image/png');
  } catch (e) { return ''; }
}
function selesai() {
  mode = 'selesai'; $('kontrol').hidden = true; bunyi(880, .15); setTimeout(() => bunyi(1100, .15), 150); setTimeout(() => bunyi(1320, .3), 300);
  const t0 = P.waktu * SKALA_WAKTU; D.koin += P.koin; D.tas = {}; D.warm = false; const baru = !D.rekor || t0 < D.rekor; if (baru) D.rekor = t0; simpanD();
  const t = P.waktu * SKALA_WAKTU, pace = t, kal = Math.round(62 * 1.04 * (60 / 60) * 1 + 0.5) + Math.round(P.koin / 50);
  const rows = [['Pelari', '@' + A.nama], ['BIB', '#0088'], ['Sepatu', sepatuAktif().nama], ['Jam', jamAktif().nama], ['Aksesori', gengsiAktif().nama], ['Rute', 'CFD Kotak Wetan'], ['Jarak', '1,00 KM'], ['Waktu', fmtWaktu(t)], ['Avg pace', fmtWaktu(pace) + ' /km'], ['Elevasi', '+9 m'], ['Kalori', (60 + Math.round(t / 6)) + ' kcal'], ['Koin W', P.koin.toLocaleString('id-ID')], ['Posisi', '#' + peringkat() + ' dari ' + (NPC.length + 1)], ['Isotonik', P.wsAmbil ? 'Diambil ✓' : 'Kelewat'], ['Rekor', baru ? 'BARU! ' + fmtWaktu(t0) : fmtWaktu(D.rekor)]];
  $('struk').querySelector('.baris').innerHTML = rows.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
  const cap = `Finish 1 KM CFD Kotak Wetan di Pelari Kalcer · Dunia Kotak 🏃‍♂️ pace ${fmtWaktu(pace)}/km, posisi #${peringkat()}. Kalcer dulu, PB kemudian. ${URL_KAMPANYE}`;
  $('fotoMedali').src = fotoMedali();
  STRUK = { rows, caption: cap, img: null }; const fb = fotoMedali(230, 276, 2); if (fb) { const im = new Image(); im.onload = () => { STRUK.img = im; }; im.src = fb; }
  setTimeout(() => { $('hud').hidden = true; $('struk').hidden = false; }, 1400);
}

let jamLalu = performance.now(); const tmp = new THREE.Vector3();
function langkah(dt) {
  if (mode === 'lari') {
    P.waktu += dt;
    // draft: dekat di belakang NPC selajur
    P.draft = NPC.some((n) => n.lajur === P.lajur && n.d - P.d > 0.8 && n.d - P.d < 6);
    P.wall = P.stamina < BATAS_WALL;
    sprintTap = Math.max(0, sprintTap - dt); const tahan = sentuh && !sentuh.geser && performance.now() - sentuh.t > 220; P.sprintAktif = (P.sprint || tahan || sprintTap > 0) && P.stamina > 3; $('sprintKilat').classList.toggle('on', P.sprintAktif);
    P.gel = Math.max(0, (P.gel || 0) - dt);
    if (P.bekal.isotonik && !P.isoPakai && P.stamina < 30) { P.isoPakai = true; P.stamina = 100; toast('🧃 Isotonik dari tas: stamina penuh!'); bunyi(990, .1); }
    const bonus = 1 + (sepatuAktif().pace + gengsiAktif().pace) / 100 * .5 + (P.warm ? .12 : 0) + (P.gel > 0 ? .14 : 0) + (P.bekal.bakmi ? .18 : 0);
    let target = V_DASAR * bonus * (P.sprintAktif ? KALI_SPRINT : 1) * (P.wall ? KALI_WALL : 1);
    P.v += (target - P.v) * Math.min(1, dt * 2.2);
    const kuras = KURAS * (P.sprintAktif ? KALI_KURAS_SPRINT : 1) * (P.draft ? 0.85 : 1) * (P.bekal.kopi ? 0.75 : 1) * (1 - jamAktif().hemat / 100) * (1 - gengsiAktif().hemat / 100);
    P.stamina = Math.max(0, Math.min(100, P.stamina - kuras * dt + (P.sprintAktif ? 0 : 0.25 * dt)));
    // tabrak NPC dari belakang: tidak bisa tembus
    for (const n of NPC) if (n.lajur === P.lajur && n.d > P.d && n.d - P.d < 1.1 && P.y < 1) { P.v = Math.min(P.v, n.v * .9); }
    P.d += P.v * dt;
    P.y += P.vy * dt; P.vy -= 34 * dt; if (P.y < 0) { P.y = 0; P.vy = 0; }
    P.x += (LAJUR[P.lajur] - P.x) * Math.min(1, dt * 11);
    P.kebal = Math.max(0, P.kebal - dt); P.magnet = Math.max(0, P.magnet - dt); P.perisai = Math.max(0, P.perisai - dt);
    // objek
    for (const o of OBJ) {
      if (o.habis || o.d < P.d - 3 || o.d > P.d + 2) continue;
      const dekat = Math.abs(o.d - P.d) < 0.9;
      if (o.jenis === 'koin') { if ((dekat && o.lajur === P.lajur) || (P.magnet > 0 && Math.abs(o.d - P.d) < 1.2)) ambil(o); }
      else if (['petir', 'magnet', 'perisai', 'hati'].includes(o.jenis)) { if (dekat && o.lajur === P.lajur && P.y < 2.5) ambil(o); }
      else if (dekat && o.lajur === P.lajur) { if (o.jenis === 'lubang' && sepatuAktif().kebal) { o.habis = true; continue; } const tinggi = o.jenis === 'lubang' ? 0.4 : o.jenis === 'pembatas' ? 1.25 : 1.1; if (P.y < tinggi) { kena(o); o.habis = true; } }
    }
    if (P.d >= WS.tutup && !P.wsAmbil && !P.wsLewat) { P.wsLewat = true; toast('Water station kelewat'); }
    if (P.d > WS.buka && !P.wsInfo) { P.wsInfo = true; toast('💧 DEPAN ADA WATER STATION! Ambil isotonik!', 2200); }
    if (P.wall && !P.wallInfo) { P.wallInfo = true; toast('🧱 THE WALL! Kurangi sprint, cari isotonik', 2200); }
    if (!P.wall) P.wallInfo = false;
    if (P.d >= FINISH) { P.d = FINISH; selesai(); }
    hud();
  }
  for (const n of NPC) n.m.visible = mode !== 'lobi';
  // NPC jalan terus selama lomba (juga setelah finish supaya hidup)
  if (mode === 'lari' || mode === 'selesai' || mode === 'gagal') for (const n of NPC) {
    n.d += n.v * dt * (n.d > FINISH + 20 ? 0 : 1); n.fase += dt * 9;
    if (rnd() < dt * .15) { n.lajur = Math.max(0, Math.min(2, n.lajur + (rnd() < .5 ? -1 : 1))); }
    for (const o of OBJ) if (!o.habis && o.lajur === n.lajur && o.jenis !== 'koin' && o.d - n.d > 0 && o.d - n.d < 4 && ['kerucut', 'pembatas', 'lubang'].includes(o.jenis)) { n.lajur = (n.lajur + 1) % 3; break; }
    n.x += (LAJUR[n.lajur] + (n.fase % 7 > 3.5 ? .4 : -.4) * .5 - n.x) * Math.min(1, dt * 3);
    n.m.position.set(n.x, Math.abs(Math.sin(n.fase)) * .12, -n.d * U);
    const a = Math.sin(n.fase) * .8; pose(n.m, { legL: a, legR: -a, armL: -a, armR: a });
  }
  // objek lintasan: buat mesh dekat, putar koin
  for (const o of OBJ) {
    const jauh = o.d > P.d + 140 || o.d < P.d - 20;
    if (!o.mesh && !jauh && !o.habis) { o.mesh = BUAT[o.jenis](); o.mesh.position.set(LAJUR[o.lajur], o.jenis === 'koin' ? 1.4 : ['petir', 'magnet', 'perisai', 'hati'].includes(o.jenis) ? 1.6 : 0, -o.d * U); sc.add(o.mesh); }
    if (o.mesh && jauh) { sc.remove(o.mesh); o.mesh = null; }
    if (o.mesh && (o.jenis === 'koin' || o.jenis.length < 8 && !['kerucut', 'lubang'].includes(o.jenis) && o.jenis !== 'pembatas')) o.mesh.rotation.y += dt * 3;
    if (o.mesh && o.jenis === 'koin' && P.magnet > 0 && !o.habis && o.d - P.d < 25 && o.d > P.d) { o.mesh.position.lerp(tmp.set(P.x, 1.6 + P.y, -o.d * U), dt * 6); }
  }
  // pemain
  P.fase = (P.fase || 0) + dt * (mode === 'lari' ? 6 + P.v * .9 : 2);
  pemain.position.set(P.x || 0, (P.y || 0) + (mode === 'lari' ? Math.abs(Math.sin(P.fase)) * .14 : 0), -(P.d || 0) * U);
  if (mode === 'lari' || mode === 'hitung' && false) {
    const a = Math.sin(P.fase) * (P.sprintAktif ? 1.1 : .85); const lompatan = P.y > .2;
    pose(pemain, lompatan ? { legL: -.9, legR: .5, armL: -2.4, armR: -2.4, armLz: .3, armRz: -.3 } : { legL: a, legR: -a, armL: -a, armR: a, head: P.wall ? .35 : 0 });
    pemain.userData.body.rotation.x = P.wall ? .35 : P.sprintAktif ? .18 : .06;
    pemain.visible = !(P.kebal > 0 && Math.floor(P.kebal * 12) % 2);
  } else if (mode === 'lobi' && pm.gerak > 0) { pm.gerak = Math.max(0, pm.gerak - dt * 2.4); const fase = (1 - pm.gerak) * Math.PI * 2 * (pm.n % 2 ? 1 : -1); pose(pemain, DRILL[Math.min(2, Math.floor((pm.n - 1) / 8))].pose(fase)); pemain.position.y = Math.sin((1 - pm.gerak) * Math.PI) * .25; pemain.userData.body.rotation.x = 0; pemain.visible = true;
  } else if (mode === 'lobi') { pose(pemain, { armR: -2.6 + Math.sin(performance.now() / 200) * .3, armRz: -.4, headY: Math.sin(performance.now() / 900) * .3 }); pemain.userData.body.rotation.x = 0; pemain.visible = true; }
  else if (mode === 'selesai') { const t = performance.now() / 160; pose(pemain, { armL: -2.8, armR: -2.8, armLz: .3 + Math.sin(t) * .2, armRz: -.3 - Math.sin(t) * .2 }); pemain.userData.body.rotation.x = 0; pemain.visible = true; }
  else { pose(pemain, {}); pemain.userData.body.rotation.x = 0; }
  // penonton bersorak
  const tt = performance.now() / 1000; for (const w of PENONTON) { const s = w.userData.sorak + tt * 5; pose(w, { armR: -2.6 + Math.sin(s) * .4, armRz: -.3, armL: Math.sin(s * .5) > .3 ? -2.6 : 0, armLz: .3 }); }
  // kamera
  const pz = -(P.d || 0) * U;
  if (mode === 'lobi') { const potret = innerWidth < innerHeight; const a = Math.sin(tt * .3) * .35; kam.position.set(Math.sin(a) * 8.5 + (potret ? 0 : 1.5), 3.4, pz - Math.cos(a) * 8.5); kam.lookAt(potret ? 0 : 2.6, potret ? .8 : 2.1, pz); }
  else { const cx = (P.x || 0) * .6; kam.position.lerp(tmp.set(cx, 6.2 + (P.y || 0) * .3, pz + 11), mode === 'gps' || mode === 'hitung' ? 1 : Math.min(1, dt * 6)); kam.lookAt(cx * .8, 2.6, pz - 14); }
  mentari.position.set(25, 50, pz + 30); mentari.target.position.set(0, 0, pz - 15);
  muatDunia(P.d || 0);
}
function ukur() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); kam.aspect = w / h; kam.fov = w < h ? 75 : 58; kam.updateProjectionMatrix(); document.body.classList.toggle('potret', w < h); }
addEventListener('resize', ukur); ukur();
function putar(now) { const dt = Math.min(.05, (now - jamLalu) / 1000); jamLalu = now; if (mode !== 'jeda') langkah(dt); R.render(sc, kam); requestAnimationFrame(putar); }
resetLari(); keLobi(); requestAnimationFrame((t) => { jamLalu = t; putar(t); });
window.__pk = { P, get mode() { return mode; }, set mode(v) { mode = v; }, NPC, OBJ };

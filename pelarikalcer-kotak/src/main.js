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
const URL_KAMPANYE = 'www.willoapparel.com/pelarikalcer';
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
const DEF = { nama: 'SkenaRunner_ID', jenis: 'L', kulit: 3, rambut: 'acak', warnaRambut: 0, kaos: 0 };
const KAOS = [['kaos-willo', '#1d1d22', 'Willo Onyx'], ['kaos-willo', '#2c3150', 'Willo Navy'], ['kaos-willo', '#7a4a2e', 'Willo Cokelat'], ['kaos', '#e0803a', 'Oranye'], ['kaos', '#3aa860', 'Hijau'], ['kaos', '#f4f4f2', 'Putih']];
let A = { ...DEF }; try { Object.assign(A, JSON.parse(localStorage.getItem(SIMPAN) || '{}')); } catch (e) {}
const simpanA = () => { try { localStorage.setItem(SIMPAN, JSON.stringify(A)); } catch (e) {} };
function buatPemain() {
  const k = KAOS[A.kaos] || KAOS[0]; const P = A.jenis === 'P';
  const w = warga({ jenis: A.jenis, kulit: KULIT[A.kulit], ekspresi: 'senang', rambut: { gaya: A.rambut, warna: WARNA_RAMBUT[A.warnaRambut] },
    atasan: { jenis: k[0], warna: k[1] }, bawahan: { jenis: P ? 'celana' : 'pendek', warna: '#1d1d22' }, sepatu: '#e0803a' });
  // nomor dada BIB #0088 di punggung
  const bib = new THREE.Mesh(new THREE.PlaneGeometry(.62, .42), new THREE.MeshStandardMaterial({ map: tekstur(256, 170, (x, W, H) => { x.fillStyle = '#f6f3ee'; x.fillRect(0, 0, W, H); x.fillStyle = '#e0803a'; x.fillRect(0, 0, W, 34); x.fillStyle = '#fff'; x.font = '800 24px Montserrat'; x.textAlign = 'center'; x.fillText('PELARI KALCER', W / 2, 26); x.fillStyle = '#1d1d22'; x.font = '900 92px Montserrat'; x.fillText('0088', W / 2, 140); }) }));
  bib.position.set(0, .62, -.31); bib.rotation.y = Math.PI; w.userData.body.add(bib);
  return w;
}
let pemain = buatPemain(); sc.add(pemain);
function gantiPemain() { const p = pemain.position.clone(), r = pemain.rotation.y; sc.remove(pemain); pemain = buatPemain(); pemain.position.copy(p); pemain.rotation.y = r; sc.add(pemain); simpanA(); }

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
    const n = { m, nama: NAMA_NPC[i], d: 2.5 - Math.floor(i / 3) * 3 - (i % 2) * 1.2, x: LAJUR[i % 3] + (rnd() - .5) * 1.2, lajur: i % 3, v: V_DASAR * (0.86 + rnd() * 0.24), fase: rnd() * 6 }; if (Math.abs(n.x) < 1.6 && n.d > -1.5) n.x = n.lajur === 1 ? 1.6 : n.x; n.m.position.set(n.x, 0, -n.d * U); sc.add(m); NPC.push(n); }
}

// ---------------- keadaan ----------------
let mode = 'lobi'; // lobi | gps | hitung | lari | selesai | gagal
const P = {};
function resetLari() {
  Object.assign(P, { d: 0, x: 0, lajur: 1, y: 0, vy: 0, v: 0, stamina: 100, nyawa: 3, koin: 0, kebal: 0, magnet: 0, perisai: 0, sprint: false, waktu: 0, wsAmbil: false, draft: false, wall: false, fase: 0, maxEl: 0 });
  acak = 7771; isiLintasan(); OBJ.forEach((o) => { if (o.mesh) sc.remove(o.mesh); o.mesh = null; o.habis = false; });
  for (const [r, o] of aktif) sc.remove(o); aktif.clear(); iDepan = 0; acak = 20251107; muatDunia(0);
  buatNPC(); pemain.position.set(0, 0, 0); pemain.rotation.y = Math.PI;
}

// ---------------- UI ----------------
function tampil(id) { ['lobi', 'hud', 'gps', 'struk', 'gagal', 'jeda'].forEach((x) => { $(x).hidden = x !== id && !(id === 'hud' && false); }); if (id) $(id).hidden = false; }
function isiLobi() {
  $('inNama').value = A.nama;
  const bar = (el, items, aktifFn, klik) => { el.innerHTML = ''; items.forEach((it, i) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = it.html; b.setAttribute('aria-pressed', aktifFn(it, i)); if (it.warna) b.style.setProperty('--w', it.warna); b.className = it.warna ? 'swatch' : 'chip'; b.onclick = () => { klik(it, i); isiLobi(); gantiPemain(); }; el.appendChild(b); }); };
  bar($('pilTubuh'), [{ html: 'Laki-laki', v: 'L' }, { html: 'Perempuan', v: 'P' }], (it) => A.jenis === it.v, (it) => { A.jenis = it.v; A.rambut = GAYA_RAMBUT[it.v][0]; });
  bar($('pilKulit'), KULIT.map((c) => ({ html: '', warna: c })), (it, i) => A.kulit === i, (it, i) => { A.kulit = i; });
  bar($('pilRambut'), GAYA_RAMBUT[A.jenis].map((g) => ({ html: g[0].toUpperCase() + g.slice(1), v: g })), (it) => A.rambut === it.v, (it) => { A.rambut = it.v; });
  bar($('pilWarnaRambut'), WARNA_RAMBUT.slice(0, 6).map((c) => ({ html: '', warna: c })), (it, i) => A.warnaRambut === i, (it, i) => { A.warnaRambut = i; });
  bar($('pilKaos'), KAOS.map((k) => ({ html: '', warna: k[1] })), (it, i) => A.kaos === i, (it, i) => { A.kaos = i; });
  $('namaKaos').textContent = (KAOS[A.kaos] || KAOS[0])[2];
}
$('inNama').addEventListener('input', (e) => { A.nama = e.target.value.replace(/[^\w.@]/g, '').slice(0, 16) || DEF.nama; simpanA(); });
$('bMulai').onclick = () => { bunyi(660, .08); mulaiGPS(); };
$('bWS').onclick = () => ambilAir();
$('bLagi').onclick = () => { resetLari(); keLobi(); };
$('bLagi2').onclick = () => { resetLari(); keLobi(); };
$('bJeda').onclick = () => { if (mode === 'lari') { mode = 'jeda'; $('jeda').hidden = false; } };
$('bLanjut').onclick = () => { mode = 'lari'; $('jeda').hidden = true; jamLalu = performance.now(); };
$('bKeluar').onclick = () => { $('jeda').hidden = true; resetLari(); keLobi(); };
$('bSalin').onclick = async () => { const t = $('caption').textContent; try { await navigator.clipboard.writeText(t); $('bSalin').textContent = 'Tersalin ✓'; } catch (e) { const r = document.createRange(); r.selectNodeContents($('caption')); getSelection().removeAllRanges(); getSelection().addRange(r); $('bSalin').textContent = 'Tekan salin'; } };
function keLobi() { mode = 'lobi'; ['hud', 'gps', 'struk', 'gagal', 'jeda'].forEach((x) => $(x).hidden = true); $('lobi').hidden = false; $('kontrol').hidden = true; isiLobi(); }
function mulaiGPS() {
  mode = 'gps'; $('lobi').hidden = true; $('gps').hidden = false; $('gps').classList.remove('kunci'); $('gpsTeks').textContent = 'MENCARI GPS...';
  setTimeout(() => { $('gps').classList.add('kunci'); $('gpsTeks').textContent = 'GPS LOCKED'; bunyi(1320, .12); setTimeout(() => bunyi(1320, .12), 160); }, 1600);
  setTimeout(() => { $('gps').hidden = true; hitungMundur(); }, 2600);
}
function hitungMundur() { mode = 'hitung'; $('hud').hidden = false; $('kontrol').hidden = false; let n = 3; const t = () => { $('toast').textContent = n > 0 ? n : 'GO!'; $('toast').hidden = false; bunyi(n > 0 ? 520 : 880, .1); if (n-- > 0) setTimeout(t, 650); else { setTimeout(() => $('toast').hidden = true, 600); mode = 'lari'; jamLalu = performance.now(); } }; t(); }
let toastT = 0; function toast(s, ms = 1300) { $('toast').textContent = s; $('toast').hidden = false; clearTimeout(toastT); toastT = setTimeout(() => $('toast').hidden = true, ms); }
const fmtWaktu = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function hud() {
  $('hJarak').textContent = (P.d / 1000).toFixed(2).replace('.', ',');
  const pace = P.d > 5 ? (P.waktu * SKALA_WAKTU) / (P.d / 1000) : 0; $('hPace').textContent = pace ? fmtWaktu(pace) : '–:–';
  const st = $('hStamina'); st.style.width = P.stamina + '%'; st.style.background = P.stamina > 55 ? '#3aa860' : P.stamina > BATAS_WALL ? '#f2c14a' : '#e05a3a';
  $('hNyawa').textContent = '❤️'.repeat(Math.max(0, P.nyawa)) + '🤍'.repeat(Math.max(0, 3 - P.nyawa));
  $('hKoin').textContent = P.koin; $('hRank').textContent = '#' + peringkat();
  const b = []; if (P.draft) b.push('🌬️ Drafting −15%'); if (P.magnet > 0) b.push('🧲 ' + Math.ceil(P.magnet) + 's'); if (P.perisai > 0) b.push('🛡️ ' + Math.ceil(P.perisai) + 's'); if (P.wall) b.push('🧱 THE WALL');
  $('hBuff').innerHTML = b.map((x) => `<span>${x}</span>`).join('');
  $('bWS').hidden = !(P.d > WS.buka && P.d < WS.tutup && !P.wsAmbil);
}
const peringkat = () => 1 + NPC.filter((n) => n.d > P.d).length;

// ---------------- kontrol ----------------
function geser(a) { if (mode !== 'lari') return; const l = Math.max(0, Math.min(2, P.lajur + a)); if (l !== P.lajur) { P.lajur = l; bunyi(440, .04); } }
function lompat() { if (mode !== 'lari' || P.y > .05) return; P.vy = 13.5; bunyi(600, .06); }
addEventListener('keydown', (e) => { if (e.repeat) return; if (e.key === 'ArrowLeft' || e.key === 'a') geser(-1); if (e.key === 'ArrowRight' || e.key === 'd') geser(1); if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') { lompat(); e.preventDefault(); } if (e.key === 'Shift') P.sprint = true; if (e.key === 'e') ambilAir(); if (e.key === 'Escape') $('bJeda').click(); });
addEventListener('keyup', (e) => { if (e.key === 'Shift') P.sprint = false; });
let sentuh = null;
kanvas.addEventListener('pointerdown', (e) => { sentuh = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; });
kanvas.addEventListener('pointerup', (e) => { if (!sentuh) return; const dx = e.clientX - sentuh.x, dy = e.clientY - sentuh.y; if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) geser(dx > 0 ? 1 : -1); else if (dy < -30) lompat(); sentuh = null; });
const bS = $('bSprint'); const sOn = (e) => { e.preventDefault(); P.sprint = true; bS.classList.add('on'); }, sOff = () => { P.sprint = false; bS.classList.remove('on'); };
bS.addEventListener('pointerdown', sOn); bS.addEventListener('pointerup', sOff); bS.addEventListener('pointerleave', sOff); bS.addEventListener('pointercancel', sOff);
$('bKiri').onclick = () => geser(-1); $('bKanan').onclick = () => geser(1); $('bLompat').onclick = () => lompat();

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
function gagal() { mode = 'gagal'; setTimeout(() => { $('gagal').hidden = false; $('kontrol').hidden = true; $('gagalInfo').textContent = `Berhenti di ${(P.d / 1000).toFixed(2).replace('.', ',')} KM. Coba lagi, pelan-pelan jaga stamina.`; }, 700); }
function selesai() {
  mode = 'selesai'; $('kontrol').hidden = true; bunyi(880, .15); setTimeout(() => bunyi(1100, .15), 150); setTimeout(() => bunyi(1320, .3), 300);
  const t = P.waktu * SKALA_WAKTU, pace = t, kal = Math.round(62 * 1.04 * (60 / 60) * 1 + 0.5) + Math.round(P.koin / 50);
  const rows = [['Pelari', '@' + A.nama], ['BIB', '#0088'], ['Rute', 'CFD Kotak Wetan'], ['Jarak', '1,00 KM'], ['Waktu', fmtWaktu(t)], ['Avg pace', fmtWaktu(pace) + ' /km'], ['Elevasi', '+9 m'], ['Kalori', (60 + Math.round(t / 6)) + ' kcal'], ['Koin W', P.koin.toLocaleString('id-ID')], ['Posisi', '#' + peringkat() + ' dari ' + (NPC.length + 1)], ['Isotonik', P.wsAmbil ? 'Diambil ✓' : 'Kelewat']];
  $('struk').querySelector('.baris').innerHTML = rows.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
  $('caption').textContent = `Finish 1 KM CFD Kotak Wetan di Pelari Kalcer · Dunia Kotak 🏃‍♂️ pace ${fmtWaktu(pace)}/km, posisi #${peringkat()}. Kalcer dulu, PB kemudian. ${URL_KAMPANYE}`;
  setTimeout(() => { $('hud').hidden = true; $('struk').hidden = false; }, 1400);
}

let jamLalu = performance.now(); const tmp = new THREE.Vector3();
function langkah(dt) {
  if (mode === 'lari') {
    P.waktu += dt;
    // draft: dekat di belakang NPC selajur
    P.draft = NPC.some((n) => n.lajur === P.lajur && n.d - P.d > 0.8 && n.d - P.d < 6);
    P.wall = P.stamina < BATAS_WALL;
    let target = V_DASAR * (P.sprint && P.stamina > 3 ? KALI_SPRINT : 1) * (P.wall ? KALI_WALL : 1);
    P.v += (target - P.v) * Math.min(1, dt * 2.2);
    const kuras = KURAS * (P.sprint ? KALI_KURAS_SPRINT : 1) * (P.draft ? 0.85 : 1);
    P.stamina = Math.max(0, Math.min(100, P.stamina - kuras * dt + (P.sprint ? 0 : 0.25 * dt)));
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
      else if (dekat && o.lajur === P.lajur) { const tinggi = o.jenis === 'lubang' ? 0.4 : o.jenis === 'pembatas' ? 1.25 : 1.1; if (P.y < tinggi) { kena(o); o.habis = true; } }
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
    const a = Math.sin(P.fase) * (P.sprint ? 1.1 : .85); const lompatan = P.y > .2;
    pose(pemain, lompatan ? { legL: -.9, legR: .5, armL: -2.4, armR: -2.4, armLz: .3, armRz: -.3 } : { legL: a, legR: -a, armL: -a, armR: a, head: P.wall ? .35 : 0 });
    pemain.userData.body.rotation.x = P.wall ? .35 : P.sprint ? .18 : .06;
    pemain.visible = !(P.kebal > 0 && Math.floor(P.kebal * 12) % 2);
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

// ===================================================================
// Inti bersama game edukasi PAUD bergaya VOXEL ART 3D.
// File ini digabung ke setiap game oleh edukasi/paud/build.py,
// jadi setiap game tetap SATU file HTML yang berdiri sendiri.
// ===================================================================
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const $ = id => document.getElementById(id);
const acak = (a, b) => a + Math.random() * (b - a);
const acakInt = (a, b) => Math.floor(acak(a, b + 1));
const pilih = arr => arr[Math.floor(Math.random() * arr.length)];
const kocok = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const tegak = () => innerWidth / innerHeight < .85;
const tunggu = ms => new Promise(r => setTimeout(r, ms));
// salinan HTML asli (sebelum game berjalan) untuk tombol 'Unduh HTML' di Mode Guru
const HTML_ASLI = '<!doctype html>\n' + document.documentElement.outerHTML;
const DATA_BAWAAN = JSON.parse(($('data-soal') || {textContent: '{}'}).textContent);
let DATA = DATA_BAWAAN;
try { const simpan = localStorage.getItem('soal:' + location.pathname + ':' + (DATA_BAWAAN.id || '')); if (simpan) DATA = JSON.parse(simpan); } catch (e) {}

// ---------- Voxel: kumpulan kubus kecil -> satu InstancedMesh ----------
const _geo = new Map();
function geoKubus(s, bulat) {
  const k = s + ':' + bulat;
  if (!_geo.has(k)) _geo.set(k, bulat ? new RoundedBoxGeometry(s, s, s, 1, s * .16) : new THREE.BoxGeometry(s, s, s));
  return _geo.get(k);
}
const _mat = new THREE.MeshStandardMaterial({roughness: .78, metalness: 0});
class Vox {
  constructor(s = .1) { this.s = s; this.m = new Map(); }
  k(x, y, z) { return x + ',' + y + ',' + z; }
  set(x, y, z, c) { if (c == null) this.m.delete(this.k(x, y, z)); else this.m.set(this.k(x, y, z), c); return this; }
  get(x, y, z) { return this.m.get(this.k(x, y, z)); }
  box(x0, y0, z0, w, h, d, c) { for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) for (let z = z0; z < z0 + d; z++) this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); return this; }
  // gambar peta 2D (baris atas = y paling tinggi) pada bidang z tetap
  peta(rows, x0, yAtas, z, pal) { rows.forEach((r, i) => [...r].forEach((ch, j) => { if (pal[ch] !== undefined) this.set(x0 + j, yAtas - i, z, pal[ch]); })); return this; }
  // ubah ke mesh; kubus yang tertutup penuh dibuang supaya ringan
  mesh({bulat = true, bayangan = true, mat = _mat} = {}) {
    const list = [];
    for (const [k, c] of this.m) {
      const [x, y, z] = k.split(',').map(Number);
      if (this.m.has(this.k(x + 1, y, z)) && this.m.has(this.k(x - 1, y, z)) && this.m.has(this.k(x, y + 1, z)) && this.m.has(this.k(x, y - 1, z)) && this.m.has(this.k(x, y, z + 1)) && this.m.has(this.k(x, y, z - 1))) continue;
      list.push([x, y, z, c]);
    }
    const im = new THREE.InstancedMesh(geoKubus(this.s, bulat), mat, Math.max(1, list.length));
    const M = new THREE.Matrix4(), C = new THREE.Color();
    list.forEach(([x, y, z, c], i) => {
      M.makeTranslation((x + .5) * this.s, (y + .5) * this.s, (z + .5) * this.s); im.setMatrixAt(i, M);
      C.set(c); im.setColorAt(i, C);
    });
    im.count = list.length; im.castShadow = bayangan; im.receiveShadow = true;
    return im;
  }
}
// warna sedikit acak supaya permukaan voxel tidak datar
function variasi(hex, kadar = .06) { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + acak(-kadar, kadar)))); return '#' + c.getHexString(); }

// ---------- Huruf & angka piksel 5x7 ----------
const FONT = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.', C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '####.|#...#|#...#|#...#|#...#|#...#|####.', E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.###.', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#', I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
  J: '..###|...#.|...#.|...#.|#..#.|#..#.|.##..', K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....', Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..', U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..', W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.', 2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
  3: '####.|....#|....#|.###.|....#|....#|####.', 4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '.###.|#....|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...', 8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  9: '.###.|#...#|#...#|.####|....#|....#|.###.', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..', '/': '....#|...#.|...#.|..#..|.#...|.#...|#....',
};
// teks voxel berdiri, titik tengah bawah di (0,0,0)
function teksVoxel(teks, warna, s = .16, tebal = 2) {
  const v = new Vox(s); const ch = [...String(teks).toUpperCase()]; const lebar = ch.length * 6 - 1;
  ch.forEach((c, i) => { const g = FONT[c]; if (!g) return; g.split('|').forEach((r, y) => [...r].forEach((p, x) => { if (p === '#') for (let z = 0; z < tebal; z++) v.set(i * 6 + x - Math.floor(lebar / 2), 6 - y, z - Math.floor(tebal / 2), z === tebal - 1 ? warna : variasi(warna, .1)); })); });
  return v.mesh();
}

// ---------- Karakter voxel (kepala kotak, wajah piksel) ----------
// opsi: kulit, rambut, baju, celana, sepatu, wajah (peta 10x10), topi(fn), aksen(fn)
const WAJAH_DASAR = [
  '..........',
  '..........',
  '.hhh..hhh.',
  '..........',
  '.wE....wE.',
  '.EE....EE.',
  '..........',
  '.b..mm..b.',
  '...mmmm...',
  '..........',
];
function buatKarakter(o = {}) {
  const k = Object.assign({kulit: '#f2c29b', rambut: '#4a2c1a', baju: '#3b82f6', celana: '#334155', sepatu: '#1f2937', mata: '#1b1b1b', mulut: '#8a3b2e', pipi: '#f4a0a0', wajah: WAJAH_DASAR, poni: true}, o);
  const g = new THREE.Group();
  // kepala 10x10x9, pusat bawah di (0,0,0) badan atas
  const kp = new Vox(.1);
  kp.box(-5, 0, -4, 10, 10, 9, () => variasi(k.kulit, .025));
  // rambut: atas, belakang, samping
  kp.box(-5, 9, -4, 10, 1, 9, () => variasi(k.rambut, .05));
  kp.box(-5, 10, -4, 10, 1, 8, () => variasi(k.rambut, .05));
  kp.box(-5, 3, -4, 10, 6, 2, () => variasi(k.rambut, .05));
  kp.box(-5, 5, -4, 1, 4, 7, () => variasi(k.rambut, .05)); kp.box(4, 5, -4, 1, 4, 7, () => variasi(k.rambut, .05));
  if (k.poni) { kp.box(-5, 8, 4, 10, 1, 1, k.rambut); kp.box(-5, 7, 4, 4, 1, 1, k.rambut); kp.box(3, 7, 4, 2, 1, 1, k.rambut); kp.box(-4, 8, 5, 6, 1, 1, k.rambut); }
  if (k.rambutPanjang) { kp.box(-6, 1, -4, 1, 9, 8, () => variasi(k.rambut, .05)); kp.box(5, 1, -4, 1, 9, 8, () => variasi(k.rambut, .05)); kp.box(-5, 0, -5, 10, 10, 1, () => variasi(k.rambut, .05)); }
  const pal = {h: k.rambut, E: k.mata, w: '#ffffff', m: k.mulut, b: k.pipi, g: k.kacamata || '#2b1a12'};
  k.wajah.forEach((r, i) => [...r].forEach((ch, j) => { if (pal[ch]) kp.set(-5 + j, 9 - i, 4, pal[ch]); }));
  kp.box(-1, 4, 5, 2, 1, 1, variasi(k.kulit, .04)); // hidung
  kp.box(-6, 4, 0, 1, 2, 2, k.kulit); kp.box(5, 4, 0, 1, 2, 2, k.kulit); // telinga
  if (k.topi) k.topi(kp, k);
  const kepala = new THREE.Group(); kepala.add(kp.mesh()); kepala.position.y = 1.3;
  // badan 8x8x5
  const bd = new Vox(.1); bd.box(-4, 0, -2, 8, 8, 5, () => variasi(k.baju, .03));
  bd.box(-2, 7, 2, 4, 1, 1, k.kulit); // leher depan
  if (k.aksen) k.aksen(bd, k);
  const badan = new THREE.Group(); badan.add(bd.mesh()); badan.position.y = .5;
  const lengan = s => { const v = new Vox(.1); v.box(0, -6, -1, 3, 6, 3, () => variasi(k.baju, .03)); v.box(0, -8, -1, 3, 2, 3, k.kulit); const gg = new THREE.Group(); const m = v.mesh(); m.position.x = s < 0 ? -.3 : 0; gg.add(m); gg.position.set(s * .4 + (s < 0 ? 0 : 0), 1.25, 0); return gg; };
  const kaki = s => { const v = new Vox(.1); v.box(0, -4, -1, 3, 4, 3, () => variasi(k.celana, .03)); v.box(0, -5, -1, 3, 1, 4, k.sepatu); const gg = new THREE.Group(); const m = v.mesh(); m.position.x = s < 0 ? -.3 : 0; gg.add(m); gg.position.set(s * .05, .5, 0); return gg; };
  const lKiri = lengan(-1), lKanan = lengan(1), kKiri = kaki(-1), kKanan = kaki(1);
  lKiri.position.x = -.4; lKanan.position.x = .4; kKiri.position.x = -.05; kKanan.position.x = .05;
  const tubuh = new THREE.Group(); tubuh.add(kepala, badan, lKiri, lKanan, kKiri, kKanan);
  g.add(tubuh);
  g.userData = {kepala, badan, lKiri, lKanan, kKiri, kKanan, tubuh, mode: 'diam', t: 0, tMode: 0};
  return g;
}
// hewan peliharaan/maskot sederhana dibuat di game masing-masing; animasi umum:
function setMode(k, mode, lama = 0) { k.userData.mode = mode; k.userData.tMode = 0; k.userData.sampai = lama; }
function animasiKarakter(k, dt) {
  const u = k.userData; u.t += dt; u.tMode += dt; const t = u.t;
  if (u.sampai && u.tMode > u.sampai) { u.mode = 'diam'; u.sampai = 0; }
  const {kepala, lKiri, lKanan, kKiri, kKanan, tubuh} = u;
  let ay = 0, lk = 0, lr = 0, kk = 0, kr = 0, kz = 0, ky = 0, tz = 0;
  if (u.mode === 'jalan') { const w = Math.sin(t * 12); lk = w * .7; lr = -w * .7; kk = -w * .6; kr = w * .6; ay = Math.abs(Math.sin(t * 12)) * .08; }
  else if (u.mode === 'senang') { const j = Math.abs(Math.sin(u.tMode * 7)); ay = j * .55; lk = -2.6 + Math.sin(t * 14) * .3; lr = -2.6 - Math.sin(t * 14) * .3; kz = Math.sin(t * 10) * .1; }
  else if (u.mode === 'geleng') { ky = Math.sin(u.tMode * 14) * .35 * Math.max(0, 1 - u.tMode / 1.2); lk = .2; lr = .2; }
  else if (u.mode === 'tunjuk') { lr = -1.6; ky = .15; }
  else if (u.mode === 'lambai') { lr = -2.7 + Math.sin(t * 9) * .4; ay = Math.sin(t * 2) * .02; }
  else { ay = Math.sin(t * 2.2) * .025; lk = Math.sin(t * 2.2) * .05; lr = -lk; kz = Math.sin(t * 1.1) * .04; }
  const L = (o, prop, v, f = .25) => { o.rotation[prop] += (v - o.rotation[prop]) * Math.min(1, f * dt * 60); };
  L(lKiri, 'x', lk); L(lKanan, 'x', lr); L(kKiri, 'x', kk); L(kKanan, 'x', kr);
  L(kepala, 'z', kz); L(kepala, 'y', ky);
  tubuh.position.y += (ay - tubuh.position.y) * Math.min(1, .35 * dt * 60);
}
// jalan ke titik (x,z); selesai -> resolve
function jalanKe(k, x, z, kec = 3.2) {
  return new Promise(res => { k.userData.tujuan = {x, z, kec, res}; setMode(k, 'jalan'); });
}
function gerakKarakter(k, dt) {
  const u = k.userData, tj = u.tujuan; if (!tj) return;
  const dx = tj.x - k.position.x, dz = tj.z - k.position.z, d = Math.hypot(dx, dz);
  const arah = Math.atan2(dx, dz); let da = arah - k.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); k.rotation.y += da * Math.min(1, dt * 10);
  if (d < .06) { u.tujuan = null; setMode(k, 'diam'); tj.res(); return; }
  const l = Math.min(d, tj.kec * dt); k.position.x += dx / d * l; k.position.z += dz / d * l;
}
function hadapKamera(k) { k.userData.hadap = 0; }

// ---------- Panggung: renderer, kamera atas tetap, cahaya ----------
const P = {};
function siapPanggung({langit = '#bfe6ff', tanahWarna = '#7cc96b', kabut = null, lebarArea = 10, dalamArea = 8, lebarTegak = 6.2, dalamTegak = 8.4, sudut = 46} = {}) {
  const R = new THREE.WebGLRenderer({canvas: $('layar'), antialias: true, preserveDrawingBuffer: true});
  R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
  const sc = new THREE.Scene(); sc.background = new THREE.Color(langit);
  if (kabut) sc.fog = new THREE.Fog(kabut, 26, 60);
  const cam = new THREE.PerspectiveCamera(34, 1, .1, 200);
  sc.add(new THREE.HemisphereLight('#ffffff', tanahWarna, 1.25));
  const mt = new THREE.DirectionalLight('#fff4e0', 2.1); mt.position.set(6, 14, 8); mt.castShadow = true;
  mt.shadow.mapSize.set(2048, 2048); const sh = mt.shadow.camera; sh.left = -12; sh.right = 12; sh.top = 12; sh.bottom = -12; sh.near = 1; sh.far = 40; mt.shadow.bias = -.0004; mt.shadow.radius = 4;
  sc.add(mt);
  Object.assign(P, {R, sc, cam, mt, lebarArea, dalamArea, lebarTegak, dalamTegak, sudut, fokus: new THREE.Vector3(0, 0, 0)});
  const ukur = () => {
    const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h;
    // kamera atas TETAP: jarak menyesuaikan lebar layar supaya area main selalu muat (HP tegak/rebah)
    const fovV = THREE.MathUtils.degToRad(cam.fov), fovH = 2 * Math.atan(Math.tan(fovV / 2) * cam.aspect);
    const lw = tegak() ? P.lebarTegak : P.lebarArea, ld = tegak() ? P.dalamTegak : P.dalamArea;
    const butuhH = (lw / 2) / Math.tan(fovH / 2), butuhV = (ld / 2) / Math.tan(fovV / 2) * (tegak() ? .9 : .8);
    const d = Math.max(butuhH, butuhV) + 1;
    const sud = THREE.MathUtils.degToRad(P.sudut); // sudut menunduk tetap
    cam.position.set(P.fokus.x, P.fokus.y + Math.sin(sud) * d, P.fokus.z + Math.cos(sud) * d);
    cam.lookAt(P.fokus.x, P.fokus.y + .6, P.fokus.z + (tegak() ? 1.1 : 1.0)); cam.updateProjectionMatrix();
  };
  addEventListener('resize', ukur); ukur(); P.ukur = ukur; pasangKetuk();
  return P;
}
// tanah kotak-kotak voxel besar
function tanahVoxel(w, d, warna, {tinggi = 1, s = .5, y = -.5, pinggir = null} = {}) {
  const v = new Vox(s); const hw = Math.ceil(w / s / 2), hd = Math.ceil(d / s / 2);
  for (let x = -hw; x < hw; x++) for (let z = -hd; z < hd; z++) {
    const c = Array.isArray(warna) ? warna[(x + z + 1000) % warna.length] : warna;
    v.set(x, 0, z, variasi(c, .02));
    if (pinggir && (x === -hw || x === hw - 1 || z === -hd || z === hd - 1)) v.set(x, -1, z, pinggir);
  }
  const m = v.mesh({bulat: false}); m.position.y = y - s + .0; m.castShadow = false; return m;
}
function pohonVoxel(tinggi = 6, daun = '#4caf50', batang = '#8b5a2b', s = .2) {
  const v = new Vox(s);
  v.box(-1, 0, -1, 2, tinggi, 2, () => variasi(batang, .05));
  const r = 3; for (let x = -r - 1; x <= r; x++) for (let y = 0; y <= 2 * r; y++) for (let z = -r - 1; z <= r; z++) {
    const dx = x + .5, dy = y - r, dz = z + .5; if (dx * dx + dy * dy * 1.2 + dz * dz <= r * r + 2 + Math.random() * 2) v.set(x, tinggi + y - 1, z, variasi(daun, .08));
  }
  return v.mesh({bulat: true});
}
function bungaVoxel(warna = '#ff6fa3', s = .07) {
  const v = new Vox(s); v.box(0, 0, 0, 1, 4, 1, '#3f9b3f'); v.set(1, 1, 0, '#4fb34f');
  v.set(0, 5, 0, '#ffd23f'); [[1, 5, 0], [-1, 5, 0], [0, 6, 0], [0, 4, 0], [0, 5, 1], [0, 5, -1]].forEach(p => v.set(...p, warna));
  return v.mesh();
}
function batuVoxel(s = .15, warna = '#9aa3ad') { const v = new Vox(s); v.box(-2, 0, -1, 4, 2, 3, () => variasi(warna, .06)); v.box(-1, 2, -1, 2, 1, 2, () => variasi(warna, .06)); return v.mesh(); }
function awanVoxel(s = .35) { const v = new Vox(s); v.box(-3, 0, -1, 6, 1, 2, '#ffffff'); v.box(-2, 1, -1, 3, 1, 2, '#ffffff'); v.box(1, 1, -1, 1, 1, 1, '#f3f7ff'); return v.mesh({bayangan: false}); }

// ---------- Ketuk objek 3D ----------
const _ray = new THREE.Raycaster(), _p = new THREE.Vector2();
const bisaKetuk = [];
function daftarKetuk(obj, fn) { obj.userData.ketuk = fn; bisaKetuk.push(obj); }
function hapusKetuk(obj) { const i = bisaKetuk.indexOf(obj); if (i >= 0) bisaKetuk.splice(i, 1); }
function objekDi(e) {
  const r = P.R.domElement.getBoundingClientRect();
  _p.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  _ray.setFromCamera(_p, P.cam);
  const hit = _ray.intersectObjects(bisaKetuk, true)[0]; if (!hit) return null;
  let o = hit.object; while (o && !o.userData.ketuk) o = o.parent; return o ? {o, titik: hit.point} : null;
}
function titikDiBidang(e, y = 0) {
  const r = P.R.domElement.getBoundingClientRect();
  _p.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  _ray.setFromCamera(_p, P.cam); const pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), v = new THREE.Vector3();
  return _ray.ray.intersectPlane(pl, v) ? v : null;
}
let kunci = false; // true selama animasi supaya anak tidak mengetuk dobel
function pasangKetuk() {
  const c = P.R.domElement; let awal = null; const sr = () => P.seret;
  c.addEventListener('pointerdown', e => {
    if (kunci) return; awal = {x: e.clientX, y: e.clientY, hit: objekDi(e)};
    const seret = sr(); if (seret && awal.hit) seret.mulai && seret.mulai(awal.hit.o, e);
  });
  c.addEventListener('pointermove', e => { const seret = sr(); if (awal && seret && seret.gerak) seret.gerak(e); });
  c.addEventListener('pointerup', e => {
    if (!awal) return; const seret = sr(); const pindah = Math.hypot(e.clientX - awal.x, e.clientY - awal.y), h = awal.hit; awal = null;
    if (seret && seret.lepas && seret.lepas(e, pindah)) return;
    if (pindah < 18 && h && !kunci) h.o.userData.ketuk(h.o, h.titik);
  });
}
// kursor tangan di laptop
addEventListener('pointermove', e => { if (!P.R) return; P.R.domElement.style.cursor = objekDi(e) ? 'pointer' : 'default'; });

// ---------- Suara: pembaca soal (TTS) + efek ----------
let suaraID = null, AC = null;
function siapSuara() {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (e) {}
  const pilihSuara = () => { const vs = speechSynthesis.getVoices(); suaraID = vs.find(v => /id[-_]ID/i.test(v.lang) && /female|wanita|gadis|google/i.test(v.name)) || vs.find(v => /^id/i.test(v.lang)) || null; };
  if ('speechSynthesis' in window) { pilihSuara(); speechSynthesis.onvoiceschanged = pilihSuara; }
}
let teksTerakhir = '';
function ucap(teks, {tampil = true, cepat = .92} = {}) {
  teks = teks.charAt(0).toUpperCase() + teks.slice(1);
  teksTerakhir = teks; if (tampil) tulisGelembung(teks);
  return new Promise(res => {
    if (!('speechSynthesis' in window) || !SUARA_ON || !speechSynthesis.getVoices().length) { setTimeout(res, Math.min(3500, 400 + teks.length * 45)); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(teks.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, '')); u.lang = 'id-ID'; if (suaraID) u.voice = suaraID; u.rate = cepat; u.pitch = 1.15;
    let selesai = false; const done = () => { if (!selesai) { selesai = true; res(); } };
    u.onend = done; u.onerror = done; setTimeout(done, 1500 + teks.length * 110);
    speechSynthesis.speak(u);
  });
}
let SUARA_ON = true;
function nada(f, t0, lama, {tipe = 'triangle', vol = .18, ke = null} = {}) {
  if (!AC || !SUARA_ON) return; const o = AC.createOscillator(), g = AC.createGain(); o.type = tipe; o.frequency.setValueAtTime(f, AC.currentTime + t0);
  if (ke) o.frequency.exponentialRampToValueAtTime(ke, AC.currentTime + t0 + lama);
  g.gain.setValueAtTime(0, AC.currentTime + t0); g.gain.linearRampToValueAtTime(vol, AC.currentTime + t0 + .015); g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + t0 + lama);
  o.connect(g).connect(AC.destination); o.start(AC.currentTime + t0); o.stop(AC.currentTime + t0 + lama + .05);
}
const efek = {
  benar() { [523, 659, 784, 1046].forEach((f, i) => nada(f, i * .08, .25)); },
  salah() { nada(330, 0, .18, {tipe: 'sine', vol: .16}); nada(262, .16, .28, {tipe: 'sine', vol: .16}); },
  pop() { nada(600, 0, .12, {tipe: 'sine', vol: .2, ke: 1200}); },
  langkah() { nada(180, 0, .06, {tipe: 'sine', vol: .05}); },
  menang() { [523, 523, 659, 784, 659, 784, 1046].forEach((f, i) => nada(f, i * .13, .3, {tipe: 'square', vol: .07})); },
  hitung(i) { nada(440 + i * 40, 0, .18, {tipe: 'sine', vol: .16}); },
};

// ---------- Partikel kubus (konfeti) ----------
const partikel = [];
const _gp = new THREE.BoxGeometry(.12, .12, .12);
function konfeti(pos, warna = ['#ff5a5f', '#ffd23f', '#3ec1d3', '#7bd389', '#a78bfa', '#ff9f1c'], n = 36) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(_gp, new THREE.MeshStandardMaterial({color: pilih(warna), roughness: .6})); m.position.copy(pos);
    m.userData = {v: new THREE.Vector3(acak(-3, 3), acak(4, 8), acak(-3, 3)), r: new THREE.Vector3(acak(-8, 8), acak(-8, 8), 0), umur: acak(1, 1.6)};
    P.sc.add(m); partikel.push(m);
  }
}
function updatePartikel(dt) {
  for (let i = partikel.length - 1; i >= 0; i--) {
    const m = partikel[i], u = m.userData; u.umur -= dt; u.v.y -= 14 * dt; m.position.addScaledVector(u.v, dt); m.rotation.x += u.r.x * dt; m.rotation.y += u.r.y * dt;
    if (m.position.y < 0) { m.position.y = 0; u.v.multiplyScalar(.4); u.v.y = Math.abs(u.v.y); }
    if (u.umur < .3) m.scale.setScalar(Math.max(.01, u.umur / .3));
    if (u.umur <= 0) { P.sc.remove(m); m.material.dispose(); partikel.splice(i, 1); }
  }
}

// ---------- Animasi kecil (tween) ----------
const tween = [];
function animasi(lama, fn, mudah = t => 1 - Math.pow(1 - t, 3)) { return new Promise(res => tween.push({t: 0, lama, fn, mudah, res})); }
function updateTween(dt) { for (let i = tween.length - 1; i >= 0; i--) { const w = tween[i]; w.t += dt; const p = Math.min(1, w.t / w.lama); w.fn(w.mudah(p), p); if (p >= 1) { tween.splice(i, 1); w.res(); } } }
const lompat = (o, tinggi = .6, lama = .45) => { const y0 = o.position.y; return animasi(lama, (e, p) => { o.position.y = y0 + Math.sin(p * Math.PI) * tinggi; }, t => t); };
const goyang = (o, lama = .5) => { const r0 = o.rotation.z; return animasi(lama, (e, p) => { o.rotation.z = r0 + Math.sin(p * Math.PI * 6) * .25 * (1 - p); }, t => t).then(() => { o.rotation.z = r0; }); };
const terbangKe = (o, ke, lama = .55, tinggi = 1.4) => { const a = o.position.clone(); return animasi(lama, e => { o.position.lerpVectors(a, ke, e); o.position.y += Math.sin(e * Math.PI) * tinggi; }); };

// ---------- UI: gelembung soal, bintang, layar mulai/selesai ----------
function tulisGelembung(teks) { const g = $('gelembung'); if (!g) return; g.textContent = teks; g.classList.remove('muncul'); void g.offsetWidth; g.classList.add('muncul'); }
function aturBintang(n, total) { const b = $('bintang'); if (!b) return; b.innerHTML = Array.from({length: total}, (_, i) => `<span class="${i < n ? 'isi' : ''}">★</span>`).join(''); }
function pilihanUI(daftar, fn) {
  const w = $('pilihan'); w.innerHTML = ''; w.hidden = !daftar;
  if (!daftar) return;
  daftar.forEach(d => { const b = document.createElement('button'); b.className = 'pil'; b.innerHTML = d.html; b.onclick = () => { if (!kunci) fn(d, b); }; w.appendChild(b); });
}
async function layarMulai(judul, ajakan, fnMulai) {
  $('mulaiJudul').textContent = judul; $('mulaiAjak').textContent = ajakan;
  $('bMulai').onclick = async () => { siapSuara(); $('layarMulai').hidden = true; fnMulai(); };
}
function layarSelesai(bintang, total, fnUlang) {
  $('selesaiBintang').innerHTML = '★'.repeat(3);
  $('layarSelesai').hidden = false; efek.menang();
  $('bUlang').onclick = () => { $('layarSelesai').hidden = true; fnUlang(); };
}
$('bDengar') && ($('bDengar').onclick = () => { if (teksTerakhir) ucap(teksTerakhir); if (window.__ulangSuara) window.__ulangSuara(); });
$('bSuara') && ($('bSuara').onclick = () => { SUARA_ON = !SUARA_ON; $('bSuara').textContent = SUARA_ON ? '🔈' : '🔇'; if (!SUARA_ON) speechSynthesis.cancel(); });

// ---------- Putaran utama ----------
const pembaru = [];
let _tLalu = performance.now();
function loop() {
  const t = performance.now(), dt = Math.min(.05, (t - _tLalu) / 1000); _tLalu = t;
  updateTween(dt); updatePartikel(dt); pembaru.forEach(f => f(dt, t / 1000));
  P.R.render(P.sc, P.cam); requestAnimationFrame(loop);
}
const PUJIAN = ['Hebat!', 'Pintar!', 'Betul sekali!', 'Keren!', 'Wah, kamu jago!', 'Mantap!'];
const SEMANGAT = ['Hampir! Coba lagi ya.', 'Tidak apa-apa, coba lagi ya.', 'Ayo coba sekali lagi!'];

// ===================================================================
// MODE GURU: ubah soal, tempel dari Excel, simpan, unduh HTML baru
// Setiap game mengisi GURU = {kolom:[{k,label,contoh}], pengaturan:[{k,label,tipe,min,max}]}
// ===================================================================
const GURU = {kolom: [], pengaturan: [], terapkan: () => {}};
function bukaGerbangGuru() {
  const a = acakInt(3, 9), b = acakInt(3, 9);
  $('guruGerbang').hidden = false; $('gTanya').textContent = `Untuk guru/orang tua: berapa ${a} + ${b}?`; $('gJawab').value = '';
  $('gMasuk').onclick = () => { if (+$('gJawab').value === a + b) { $('guruGerbang').hidden = true; bukaGuru(); } else { $('gJawab').value = ''; $('gJawab').placeholder = 'Belum tepat'; } };
  $('gBatal').onclick = () => { $('guruGerbang').hidden = true; };
  setTimeout(() => $('gJawab').focus(), 50);
}
let _draf = null;
function bukaGuru() {
  _draf = JSON.parse(JSON.stringify(DATA));
  $('panelGuru').hidden = false; gambarGuru();
}
function gambarGuru() {
  const d = _draf;
  $('guruJudul').value = d.judul || '';
  $('guruAtur').innerHTML = GURU.pengaturan.map(p => p.tipe === 'pilih'
    ? `<label>${p.label}<select data-k="${p.k}">${p.opsi.map(o => `<option value="${o[0]}" ${String(d[p.k]) === String(o[0]) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>`
    : `<label>${p.label}<input type="number" data-k="${p.k}" min="${p.min}" max="${p.max}" value="${d[p.k] ?? ''}"></label>`).join('');
  const kol = GURU.kolom;
  $('guruTabel').innerHTML = `<tr><th>#</th>${kol.map(c => `<th>${c.label}</th>`).join('')}<th></th></tr>` +
    d.soal.map((r, i) => `<tr><td>${i + 1}</td>${kol.map(c => `<td><input data-i="${i}" data-c="${c.k}" value="${String(r[c.k] ?? '').replace(/"/g, '&quot;')}" placeholder="${c.contoh || ''}"></td>`).join('')}<td><button class="gHapus" data-i="${i}" title="Hapus">✕</button></td></tr>`).join('');
  $('guruTabel').querySelectorAll('input').forEach(el => el.oninput = () => { d.soal[+el.dataset.i][el.dataset.c] = el.value; });
  $('guruTabel').querySelectorAll('.gHapus').forEach(el => el.onclick = () => { d.soal.splice(+el.dataset.i, 1); gambarGuru(); });
  $('guruAtur').querySelectorAll('[data-k]').forEach(el => el.onchange = () => { d[el.dataset.k] = el.type === 'number' ? +el.value : el.value; });
  $('guruKolomInfo').textContent = 'Urutan kolom Excel: ' + kol.map(c => c.label).join(' | ');
}
function bacaDraf() { _draf.judul = $('guruJudul').value.trim() || _draf.judul; const kol = GURU.kolom; _draf.soal = _draf.soal.filter(r => kol.some(c => String(r[c.k] ?? '').trim())); return _draf; }
function pasangGuru() {
  if (!$('bGuru')) return;
  $('bGuru').onclick = bukaGerbangGuru;
  $('guruTambah').onclick = () => { _draf.soal.push(Object.fromEntries(GURU.kolom.map(c => [c.k, '']))); gambarGuru(); const t = $('guruTabel'); t.parentElement.scrollTop = t.scrollHeight; };
  $('guruTempel').onclick = () => {
    const baris = $('guruExcel').value.split(/\r?\n/).map(r => r.split(/\t|;/).map(s => s.trim())).filter(r => r.some(Boolean));
    if (!baris.length) return;
    // lewati baris judul kolom bila ada
    if (baris[0][0] && GURU.kolom[0] && baris[0][0].toLowerCase() === GURU.kolom[0].label.toLowerCase()) baris.shift();
    const ganti = $('guruGanti').checked; if (ganti) _draf.soal = [];
    baris.forEach(r => _draf.soal.push(Object.fromEntries(GURU.kolom.map((c, i) => [c.k, r[i] || '']))));
    $('guruExcel').value = ''; gambarGuru();
  };
  $('guruFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; $('guruExcel').value = await f.text(); e.target.value = ''; };
  $('guruSimpan').onclick = () => {
    const d = bacaDraf(); if (!d.soal.length) { alert('Isi minimal satu soal.'); return; }
    DATA = d; try { localStorage.setItem('soal:' + location.pathname + ':' + (DATA_BAWAAN.id || ''), JSON.stringify(d)); } catch (e) {}
    $('panelGuru').hidden = true; GURU.terapkan(); };
  $('guruUnduh').onclick = () => {
    const d = bacaDraf(); const json = JSON.stringify(d, null, 1).replace(/</g, '\\u003c');
    const html = HTML_ASLI.replace(/(<script type="application\/json" id="data-soal">)[\s\S]*?(<\/script>)/, (m, a, b) => a + '\n' + json + '\n' + b);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], {type: 'text/html'}));
    a.download = (d.judul || 'game').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  $('guruBawaan').onclick = () => { if (!confirm('Kembalikan soal ke bawaan?')) return; _draf = JSON.parse(JSON.stringify(DATA_BAWAAN)); try { localStorage.removeItem('soal:' + location.pathname + ':' + (DATA_BAWAAN.id || '')); } catch (e) {} gambarGuru(); };
  $('guruTutup').onclick = () => { $('panelGuru').hidden = true; };
}

// ---------- Bantuan putaran ----------
// letak pilihan: satu baris di layar lebar, 2 kolom di HP tegak
function posisiPilihan(n, {jarak = 2.6, z = -1.2, baris2 = 2.3} = {}) {
  const pos = []; if (!tegak()) z -= .5;
  if (!tegak() || n <= 3) { const j = tegak() ? Math.min(jarak, 4.6 / Math.max(1, n - 1)) : jarak; for (let i = 0; i < n; i++) pos.push({x: (i - (n - 1) / 2) * j, z}); }
  else { const kol = 2; for (let i = 0; i < n; i++) { const r = Math.floor(i / kol), c = i % kol, isi = Math.min(kol, n - r * kol); pos.push({x: (c - (isi - 1) / 2) * jarak * .85, z: z - .8 + r * baris2}); } }
  return pos;
}
const objRonde = [];
function tambahRonde(o) { P.sc.add(o); objRonde.push(o); return o; }
function bersihRonde() { objRonde.forEach(o => { P.sc.remove(o); hapusKetuk(o); }); objRonde.length = 0; pilihanUI(null); $('kartu').hidden = true; }
const muncul = (o, lama = .4) => { const s = o.scale.x || 1; o.scale.setScalar(.01); return animasi(lama, e => o.scale.setScalar(Math.max(.01, s * e))); };
function alasBatu(r = 4, warna = '#b8c0c8', s = .15) { const v = new Vox(s); for (let x = -r; x < r; x++) for (let z = -r; z < r; z++) if ((x + .5) ** 2 + (z + .5) ** 2 <= r * r) { v.set(x, 0, z, variasi(warna, .05)); if ((x + .5) ** 2 + (z + .5) ** 2 <= (r - 1) ** 2) v.set(x, 1, z, variasi(warna, .04)); } return v.mesh(); }

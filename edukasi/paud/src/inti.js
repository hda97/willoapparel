// ===================================================================
// Inti bersama game edukasi PAUD bergaya VOXEL ART 3D.
// File ini digabung ke setiap game oleh edukasi/paud/build.py,
// jadi setiap game tetap SATU file HTML yang berdiri sendiri.
// ===================================================================
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// ASET ASLI DUNIA KOTAK (sama persis dengan game mabar): avatar warga & kucing
import {warga, KULIT, WARNA_RAMBUT} from '../../public/duniakotak/mabar/js/aset/avatar.js';
import {kucingMesh} from '../../public/duniakotak/mabar/js/aset/kucing.js';

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

const _gk = {};
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
// huruf/angka dari font 5x7, piksel digabung jadi goresan kotak besar membulat (gaya Dunia Kotak)
function teksVoxel(teks, warna, s = .16, tebal = 2) {
  const g = new THREE.Group(); const ch = [...String(teks).toUpperCase()]; const lebar = ch.length * 6 - 1, d = tebal * s;
  const mat = new THREE.MeshStandardMaterial({color: warna, roughness: .55});
  ch.forEach((c, i) => { const f = FONT[c]; if (!f) return; const R = f.split('|').map(r => [...r].map(p => p === '#')); const H = R.length, ada = (x, y) => y >= 0 && y < H && !!R[y][x], dipakai = new Set();
    for (let y = 0; y < H; y++) for (let x = 0; x < R[y].length; x++) { if (!R[y][x] || dipakai.has(x + ',' + y)) continue;
      let x0 = x, x1 = x; while (ada(x0 - 1, y)) x0--; while (ada(x1 + 1, y)) x1++;
      let y0 = y, y1 = y; while (ada(x, y0 - 1)) y0--; while (ada(x, y1 + 1)) y1++;
      const datar = x1 - x0 >= y1 - y0; const [a0, a1, b0, b1] = datar ? [x0, x1, y, y] : [x, x, y0, y1];
      for (let xx = a0; xx <= a1; xx++) for (let yy = b0; yy <= b1; yy++) dipakai.add(xx + ',' + yy);
      const w = (a1 - a0 + 1) * s, h = (b1 - b0 + 1) * s; const m = new THREE.Mesh(_gk[[w, h, d, 'h'].join()] || (_gk[[w, h, d, 'h'].join()] = new RoundedBoxGeometry(w, h, d, 2, s * .22)), mat);
      m.position.set((i * 6 + (a0 + a1) / 2 - Math.floor(lebar / 2) + .5) * s, (6 - (b0 + b1) / 2 + .5) * s, (Math.floor(tebal / 2) ? 0 : .5 * s)); m.castShadow = true; m.receiveShadow = true; g.add(m); }
  });
  return g;
}

// ---------- Karakter voxel (kepala kotak, wajah piksel) ----------
// opsi: kulit, rambut, baju, celana, sepatu, wajah (peta 10x10), topi(fn), aksen(fn)
// kotak besar membulat gaya Dunia Kotak (sama dengan aset/avatar.js)
function kotak(w, h, d, c, rad = .06, m = {}) {
  const k = [w, h, d, rad].join(); const g = _gk[k] || (_gk[k] = new RoundedBoxGeometry(w, h, d, 2, Math.min(rad, w / 2 - .001, h / 2 - .001, d / 2 - .001)));
  const o = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: c, roughness: .8, ...m})); o.castShadow = o.receiveShadow = true; return o;
}
// tempel kotak membulat ke induk p (pusat x,y,z)
function tambah(p, w, h, d, x, y, z, c, r = .04) { const m = kotak(w, h, d, c, r); m.position.set(x, y, z); p.add(m); return m; }
// sepasang mata kotak hitam + kilau putih (gaya wajah Dunia Kotak)
function mataK(p, x, y, z, s = .1) { [-x, x].forEach(xx => { tambah(p, s, s * 1.25, .04, xx, y, z, '#1b1b1b', .015); tambah(p, s * .4, s * .4, .02, xx + s * .15, y + s * .25, z + .025, '#ffffff', .005); }); }
// pet topi dibalik ke belakang supaya wajah tidak tertutup dari kamera drone
function topiTerbalik(k) { k.userData.kepala.children.forEach(c => { if (c.position.z > .6 && c.position.y > .9) c.position.z = -c.position.z; }); }
const SKALA_WARGA = .62;
// buatKarakter: avatar warga Dunia Kotak. opsi = opsi warga() (jenis, kulit, rambut, atasan, bawahan, topi, kacamata, hijab)
function buatKarakter(o = {}) {
  const g = new THREE.Group(), tubuh = new THREE.Group(); g.add(tubuh);
  const w = warga(o); w.scale.setScalar(SKALA_WARGA); w.traverse(m => { if (m.isMesh) m.castShadow = true; }); tubuh.add(w);
  const u = w.userData;
  g.userData = {kepala: u.head, badan: u.body, lKiri: u.armL, lKanan: u.armR, kKiri: u.legL, kKanan: u.legR, tubuh, mode: 'diam', t: 0, tMode: 0, istirahat: -.42};
  return g;
}
// kucing Dunia Kotak (aset/kucing.js); model asli menghadap +x, diputar supaya menghadap +z seperti avatar
function buatKucing(warna = 'krem', skala = .9) {
  const g = new THREE.Group(), tubuh = new THREE.Group(); g.add(tubuh);
  const k = kucingMesh(warna, {skala}); k.rotation.y = -Math.PI / 2; tubuh.add(k);
  g.userData = {kucing: k, kepala: k.userData.head, ekor: k.userData.tail, tubuh, mode: 'diam', t: 0, tMode: 0, istirahat: -.5};
  return g;
}
// hewan peliharaan/maskot sederhana dibuat di game masing-masing; animasi umum:
function setMode(k, mode, lama = 0) { k.userData.mode = mode; k.userData.tMode = 0; k.userData.sampai = lama; }
function animasiKarakter(k, dt) {
  const u = k.userData; u.t += dt; u.tMode += dt; const t = u.t;
  if (u.sampai && u.tMode > u.sampai) { u.mode = 'diam'; u.sampai = 0; }
  // saat diam & tidak berjalan, badan serong ke depan (wajah terlihat dari kamera drone)
  if (u.hadapDepan && !u.tujuan) { let da = u.istirahat - k.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); k.rotation.y += da * Math.min(1, dt * 5); }
  if (u.kucing) {
    let ay = 0; if (u.mode === 'jalan') ay = Math.abs(Math.sin(t * 14)) * .12; else if (u.mode === 'senang') ay = Math.abs(Math.sin(u.tMode * 7)) * .6; else ay = Math.sin(t * 2) * .02;
    u.tubuh.position.y += (ay - u.tubuh.position.y) * Math.min(1, .35 * dt * 60);
    u.ekor.rotation.x = Math.sin(t * (u.mode === 'senang' ? 12 : 3)) * .35;
    u.kepala.rotation.z = u.mode === 'geleng' ? 0 : Math.sin(t * 1.5) * .06; u.kepala.rotation.x = u.mode === 'geleng' ? Math.sin(u.tMode * 14) * .3 * Math.max(0, 1 - u.tMode / 1.2) : 0;
    return;
  }
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
  u.tLangkah = (u.tLangkah || 0) + dt; if (u.tLangkah > .26) { u.tLangkah = 0; efek.langkah(); }
}
function hadapDepan(k, sudut) { k.userData.hadapDepan = true; if (sudut != null) k.userData.istirahat = sudut; }

// ---------- Panggung: renderer, kamera atas tetap, cahaya ----------
const P = {};
function gradasi(warna) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); const b = new THREE.Color(warna);
  g.addColorStop(0, '#' + b.clone().offsetHSL(0, .05, -.12).getHexString()); g.addColorStop(.7, warna); g.addColorStop(1, '#ffffff'); x.fillStyle = g; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function siapPanggung({langit = '#bfe6ff', tanahWarna = '#7cc96b', kabut = null, lebarArea = 10, dalamArea = 8, lebarTegak = 6.2, dalamTegak = 8.4, sudut = 46} = {}) {
  const R = new THREE.WebGLRenderer({canvas: $('layar'), antialias: true, preserveDrawingBuffer: true});
  R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.2;
  const sc = new THREE.Scene(); sc.background = gradasi(langit);
  sc.fog = new THREE.Fog(kabut || langit, 34, 80);
  const cam = new THREE.PerspectiveCamera(38, 1, .1, 200);
  sc.add(new THREE.HemisphereLight(0xffffff, 0xa8c8a0, 1.3));
  const mt = new THREE.DirectionalLight(0xfff4e8, 2.4); mt.position.set(8, 18, 11); mt.castShadow = true;
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
  P.drone = {d: cam.position.distanceTo(new THREE.Vector3(0, 0, 0)), tz: 0, tx: 0};
  return P;
}
// ---------- Kamera drone: soal & panel tidak menutupi karakter ----------
const _v3 = new THREE.Vector3(), _bx = new THREE.Box3();
function batasUI() {
  const atas = Math.max(0, ...['bintang', 'bSuara'].map(id => { const e = $(id); return e ? e.getBoundingClientRect().bottom : 0; })) + 8;
  let bawah = innerHeight; ['gelembung', 'kartu', 'pilihan'].forEach(id => { const e = $(id); if (!e || e.hidden) return; const r = e.getBoundingClientRect(); if (r.height && !(innerWidth > 700 && r.right < innerWidth * .3)) bawah = Math.min(bawah, r.top); });
  return {atas, bawah: bawah - 10, kiri: innerWidth > 700 && $('kartu') && !$('kartu').hidden ? $('kartu').getBoundingClientRect().right + 10 : 8};
}
function bingkaiDrone(dt) {
  const objs = [P.tokoh, ...objRonde].filter(Boolean); if (!objs.length || !P.drone) return;
  const b = batasUI(); let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
  for (const o of objs) {
    _bx.setFromObject(o); if (_bx.isEmpty()) continue;
    for (const [x, y, z] of [[_bx.min.x, _bx.min.y, _bx.max.z], [_bx.max.x, _bx.min.y, _bx.max.z], [_bx.min.x, _bx.max.y, _bx.min.z], [_bx.max.x, _bx.max.y, _bx.min.z]]) {
      _v3.set(x, Math.max(0, y), z).project(P.cam); const sx = (_v3.x + 1) / 2 * innerWidth, sy = (1 - _v3.y) / 2 * innerHeight;
      y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); x0 = Math.min(x0, sx); x1 = Math.max(x1, sx);
    }
  }
  if (!isFinite(y0)) return;
  const tinggi = b.bawah - b.atas, lebar = innerWidth - b.kiri - 8;
  const isi = Math.max((y1 - y0) / Math.max(60, tinggi), (x1 - x0) / Math.max(60, lebar));
  const D = P.drone, k = Math.min(1, dt * 2.2);
  // zoom: isi ideal 82% ruang kosong; geser: pusat isi ke pusat ruang kosong
  if (isi > .9 || isi < .7) D.d *= 1 + (isi - .82) * k * .6;
  D.d = Math.max(8, Math.min(40, D.d));
  const dy = ((y0 + y1) / 2 - (b.atas + b.bawah) / 2) / innerHeight, dx = ((x0 + x1) / 2 - (b.kiri + innerWidth - 8) / 2) / innerWidth;
  if (Math.abs(dy) > .012) D.tz += dy * D.d * .9 * k;
  if (Math.abs(dx) > .012) D.tx += dx * D.d * .9 * k;
  D.tz = Math.max(-6, Math.min(8, D.tz)); D.tx = Math.max(-5, Math.min(5, D.tx));
  const sud = THREE.MathUtils.degToRad(P.sudut);
  P.cam.position.set(D.tx, Math.sin(sud) * D.d, D.tz + Math.cos(sud) * D.d); P.cam.lookAt(D.tx, 0, D.tz);
}
// tanah halus bertekstur (seperti tanah Dunia Kotak: satu bidang, bukan ribuan kubus)
function tanahVoxel(w, d, warna, {y = 0} = {}) {
  const ws = Array.isArray(warna) ? warna : [warna, warna];
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = ws[0]; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { x.fillStyle = variasi(ws[i % ws.length], .05); x.globalAlpha = .5; const s = acak(6, 22); x.fillRect(acak(0, 512), acak(0, 512), s, s * acak(.4, 1)); }
  x.globalAlpha = 1; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 8, d / 8);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.4, d * 2.4), new THREE.MeshStandardMaterial({map: t, roughness: .95})); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true;
  t.repeat.set(w * 2.4 / 8, d * 2.4 / 8); return m;
}
// lempeng datar (jalan, petak tanah, karpet) kotak membulat rendah
function lempeng(w, d, warna, y = .02, rad = .08) { const m = kotak(w, .08, d, warna, rad, {roughness: .95}); m.position.y = y; m.castShadow = false; return m; }
// pohon gaya Dunia Kotak: batang tumpukan kubus + tajuk kubus besar + kubus kecil di atas
function pohonVoxel(tinggi = 6, daun = '#4caf50', batang = '#8b5a2b', s = 1) {
  const g = new THREE.Group(); const c = (tinggi / 6) * 2.4 * s, th = c * .5;
  for (let t = c * .18; t < th + .01; t += c * .18) { const b = kotak(c * .2, c * .2, c * .2, variasi(batang, .03), .04); b.position.y = t; g.add(b); }
  const d1 = kotak(c, c, c, variasi(daun, .04), .12); d1.position.y = th + c / 2; g.add(d1);
  const d2 = kotak(c * .62, c * .62, c * .62, variasi(daun, .08), .1); d2.position.set(acak(-.1, .1) * c, th + c * 1.15, acak(-.1, .1) * c); g.add(d2);
  if (Math.random() < .5) { const d3 = kotak(c * .5, c * .5, c * .5, variasi(daun, .06), .08); d3.position.set(c * .5, th + c * .35, 0); g.add(d3); }
  return g;
}
function bungaVoxel(warna = '#ff6fa3', s = .07) {
  const v = new Vox(s); v.box(0, 0, 0, 1, 4, 1, '#3f9b3f'); v.set(1, 1, 0, '#4fb34f');
  v.set(0, 5, 0, '#ffd23f'); [[1, 5, 0], [-1, 5, 0], [0, 6, 0], [0, 4, 0], [0, 5, 1], [0, 5, -1]].forEach(p => v.set(...p, warna));
  return v.mesh();
}
function batuVoxel(s = 1, warna = '#9aa3ad') { const g = new THREE.Group(); const a = kotak(.7 * s, .4 * s, .55 * s, variasi(warna, .04), .12); a.position.y = .2 * s; g.add(a); const b = kotak(.4 * s, .3 * s, .35 * s, variasi(warna, .06), .1); b.position.set(.12 * s, .5 * s, 0); g.add(b); return g; }
function awanVoxel(s = 1) { const g = new THREE.Group(); [[0, 0, 2.2, .7], [-.7, .45, 1.2, .6], [.5, .5, 1.1, .7]].forEach(([x, y, w, h]) => { const b = kotak(w * s, h * s, .9 * s, '#ffffff', .2, {roughness: 1}); b.castShadow = false; b.position.set(x * s, y * s, 0); g.add(b); }); return g; }

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
    redamMusik(true); const done2 = done; u.onend = () => { redamMusik(false); done2(); }; u.onerror = u.onend; setTimeout(() => { redamMusik(false); done(); }, 1500 + teks.length * 110);
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
  langkah() { nada(acak(150, 200), 0, .07, {tipe: 'sine', vol: .07, ke: 90}); },
  menang() { [523, 523, 659, 784, 659, 784, 1046].forEach((f, i) => nada(f, i * .13, .3, {tipe: 'square', vol: .07})); },
  hitung(i) { nada(440 + i * 40, 0, .18, {tipe: 'sine', vol: .16}); },
  ketuk() { nada(880, 0, .05, {tipe: 'sine', vol: .12}); },
  muncul() { nada(520, 0, .1, {tipe: 'sine', vol: .08, ke: 900}); },
  bintang() { [1318, 1568, 2093].forEach((f, i) => nada(f, i * .06, .35, {tipe: 'sine', vol: .08})); },
  kilau() { [2093, 2637, 3136, 2637].forEach((f, i) => nada(f, i * .05, .18, {tipe: 'sine', vol: .05})); },
  wus() {
    if (!AC || !SUARA_ON) return; const n = AC.createBuffer(1, AC.sampleRate * .4, AC.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(), t = AC.currentTime; s.buffer = n; f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2600, t + .35); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .1); g.gain.linearRampToValueAtTime(0, t + .38);
    s.connect(f).connect(g).connect(AC.destination); s.start(t);
  },
};


// ---------- Musik latar (disintesis, tanpa file; beda per game) ----------
// Game memanggil aturMusik({bpm, nada, skala, alat, progresi, benih}). Melodi dibuat dari benih tetap,
// jadi tiap game punya lagu sendiri yang selalu sama.
let MUSIK = null, MUSIK_ON = true, mGain = null, mTimer = null, mNext = 0, mStep = 0, mMelodi = [];
const VOL_MUSIK = .55;
function aturMusik(cfg) {
  MUSIK = Object.assign({bpm: 110, nada: 60, skala: [0, 2, 4, 5, 7, 9, 11], alat: 'marimba', progresi: [0, 4, 5, 3], benih: 7, drum: true}, cfg);
  let x = MUSIK.benih * 9301 + 49297; const r = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  // 4 birama x 16 langkah; nada mengikuti akord birama, ritme campuran not 1/8 dan istirahat
  mMelodi = []; let deg = 2;
  for (let bar = 0; bar < 4; bar++) {
    const ak = MUSIK.progresi[bar], nadaAkord = [ak, ak + 2, ak + 4];
    for (let s = 0; s < 16; s++) {
      const kuat = s % 4 === 0, main = kuat ? r() < .9 : s % 2 === 0 ? r() < .55 : r() < .18;
      if (!main) { mMelodi.push(null); continue; }
      if (kuat) deg = pilihDekat(nadaAkord, deg, r); else deg += r() < .5 ? 1 : -1;
      deg = Math.max(0, Math.min(9, deg)); mMelodi.push(deg);
    }
  }
  mMelodi[63] = null; mMelodi[60] = MUSIK.progresi[0] + 7 > 9 ? MUSIK.progresi[0] : MUSIK.progresi[0] + 7;
}
function pilihDekat(daftar, dari, r) { const c = []; daftar.forEach(d => [d, d + 7].forEach(v => c.push(v))); c.sort((a, b) => Math.abs(a - dari) - Math.abs(b - dari)); return c[r() < .7 ? 0 : 1]; }
const frek = (deg, okt = 0) => { const sk = MUSIK.skala, o = Math.floor(deg / 7); return 440 * Math.pow(2, (MUSIK.nada + sk[((deg % 7) + 7) % 7] + 12 * (o + okt) - 69) / 12); };
function bunyiAlat(f, t, lama, alat, vol, tujuan) {
  const o = AC.createOscillator(), g = AC.createGain();
  const part = {marimba: ['sine', 4, .3], pluck: ['triangle', 2, .25], kotakmusik: ['sine', 3, .45], xilofon: ['triangle', 3.98, .2]}[alat] || ['sine', 2, .2];
  o.type = part[0]; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0008, t + lama);
  o.connect(g).connect(tujuan); o.start(t); o.stop(t + lama + .02);
  const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.type = 'sine'; o2.frequency.value = f * part[1];
  g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(vol * part[2], t + .005); g2.gain.exponentialRampToValueAtTime(.0008, t + lama * .35);
  o2.connect(g2).connect(tujuan); o2.start(t); o2.stop(t + lama + .02);
}
let _hat = null;
function bunyiHat(t, vol, tujuan) {
  if (!_hat) { _hat = AC.createBuffer(1, AC.sampleRate * .05, AC.sampleRate); const d = _hat.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); }
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = _hat; f.type = 'highpass'; f.frequency.value = 7000; g.gain.value = vol;
  s.connect(f).connect(g).connect(tujuan); s.start(t);
}
function bunyiKick(t, vol, tujuan) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(g).connect(tujuan); o.start(t); o.stop(t + .18); }
function langkahMusik(i, t) {
  const sp = 60 / MUSIK.bpm / 2, bar = Math.floor(i / 16) % 4, s = i % 16, ak = MUSIK.progresi[bar];
  const m = mMelodi[i % 64]; if (m != null) bunyiAlat(frek(m, 1), t, sp * (MUSIK.alat === 'kotakmusik' ? 3 : 1.8), MUSIK.alat, .16, mGain);
  if (s % 4 === 0) bunyiAlat(frek(ak, -1), t, sp * 3.5, 'pluck', .17, mGain);
  if (s === 6 || s === 14) bunyiAlat(frek(ak + 4, -1), t, sp * 1.5, 'pluck', .1, mGain);
  if (s % 8 === 4) { bunyiAlat(frek(ak + 2), t, sp * 2, MUSIK.alat, .06, mGain); bunyiAlat(frek(ak + 4), t, sp * 2, MUSIK.alat, .06, mGain); }
  if (MUSIK.drum) { if (s % 2 === 1) bunyiHat(t, s % 4 === 3 ? .07 : .04, mGain); if (s === 0 || s === 8) bunyiKick(t, .22, mGain); }
}
function mulaiMusik() {
  if (!AC || !MUSIK || mTimer) return;
  mGain = AC.createGain(); mGain.gain.value = 0; mGain.connect(AC.destination); aturVolMusik(1.5);
  mNext = AC.currentTime + .15; mStep = 0;
  mTimer = setInterval(() => { const sp = 60 / MUSIK.bpm / 2; while (mNext < AC.currentTime + .25) { langkahMusik(mStep, mNext); mNext += sp; mStep++; } }, 60);
}
let _redam = false;
function aturVolMusik(lama = .3) { if (!mGain) return; const v = !SUARA_ON || !MUSIK_ON ? 0 : _redam ? VOL_MUSIK * .3 : VOL_MUSIK; mGain.gain.cancelScheduledValues(AC.currentTime); mGain.gain.setValueAtTime(mGain.gain.value, AC.currentTime); mGain.gain.linearRampToValueAtTime(v * .32, AC.currentTime + lama); }
function redamMusik(on) { _redam = on; aturVolMusik(on ? .15 : .6); }
document.addEventListener('visibilitychange', () => { if (!AC) return; if (document.hidden) AC.suspend(); else AC.resume(); });

// ---------- Partikel kubus (konfeti) ----------
const partikel = [];
const _gp = new THREE.BoxGeometry(.12, .12, .12);
function konfeti(pos, warna = ['#ff5a5f', '#ffd23f', '#3ec1d3', '#7bd389', '#a78bfa', '#ff9f1c'], n = 36) {
  efek.kilau();
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
const terbangKe = (o, ke, lama = .55, tinggi = 1.4) => { const a = o.position.clone(); efek.wus(); return animasi(lama, e => { o.position.lerpVectors(a, ke, e); o.position.y += Math.sin(e * Math.PI) * tinggi; }); };

// ---------- UI: gelembung soal, bintang, layar mulai/selesai ----------
function tulisGelembung(teks) { const g = $('gelembung'); if (!g) return; g.textContent = teks; g.classList.remove('muncul'); void g.offsetWidth; g.classList.add('muncul'); }
let _bintangLalu = 0;
function aturBintang(n, total) { const b = $('bintang'); if (!b) return; if (n > _bintangLalu) setTimeout(() => efek.bintang(), 250); _bintangLalu = n; b.innerHTML = Array.from({length: total}, (_, i) => `<span class="${i < n ? 'isi' : ''}">★</span>`).join(''); }
function pilihanUI(daftar, fn) {
  const w = $('pilihan'); w.innerHTML = ''; w.hidden = !daftar;
  if (!daftar) return;
  daftar.forEach(d => { const b = document.createElement('button'); b.className = 'pil'; b.innerHTML = d.html; b.onclick = () => { if (!kunci) { efek.ketuk(); fn(d, b); } }; w.appendChild(b); });
}
async function layarMulai(judul, ajakan, fnMulai) {
  $('mulaiJudul').textContent = judul; $('mulaiAjak').textContent = ajakan;
  $('bMulai').onclick = async () => { siapSuara(); mulaiMusik(); efek.ketuk(); $('layarMulai').hidden = true; fnMulai(); };
}
function layarSelesai(bintang, total, fnUlang) {
  $('selesaiBintang').innerHTML = '★'.repeat(3);
  $('layarSelesai').hidden = false; efek.menang();
  $('bUlang').onclick = () => { $('layarSelesai').hidden = true; fnUlang(); };
}
$('bDengar') && ($('bDengar').onclick = () => { if (teksTerakhir) ucap(teksTerakhir); if (window.__ulangSuara) window.__ulangSuara(); });
// tombol suara: semua nyala -> musik mati (efek & suara pembaca tetap) -> semua mati
function tulisTombolSuara() { const b = $('bSuara'); if (!b) return; b.textContent = !SUARA_ON ? '🔇' : MUSIK_ON ? '🎵' : '🔈'; b.title = !SUARA_ON ? 'Semua suara mati' : MUSIK_ON ? 'Musik & suara nyala' : 'Musik mati'; }
$('bSuara') && ($('bSuara').onclick = () => {
  if (SUARA_ON && MUSIK_ON) MUSIK_ON = false; else if (SUARA_ON) SUARA_ON = false; else { SUARA_ON = true; MUSIK_ON = true; }
  if (!SUARA_ON) speechSynthesis.cancel(); aturVolMusik(); tulisTombolSuara();
  try { localStorage.setItem('suara:paud', JSON.stringify([SUARA_ON, MUSIK_ON])); } catch (e) {}
});
try { const sv = JSON.parse(localStorage.getItem('suara:paud') || 'null'); if (sv) { SUARA_ON = sv[0]; MUSIK_ON = sv[1]; } } catch (e) {}
tulisTombolSuara();

// ---------- Putaran utama ----------
const pembaru = [];
let _tLalu = performance.now();
function loop() {
  const t = performance.now(), dt = Math.min(.05, (t - _tLalu) / 1000); _tLalu = t;
  updateTween(dt); updatePartikel(dt); pembaru.forEach(f => f(dt, t / 1000)); bingkaiDrone(dt);
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
let _tMuncul = 0;
const muncul = (o, lama = .4) => { const s = o.scale.x || 1; const sk = performance.now(); if (sk - _tMuncul > 90) { _tMuncul = sk; efek.muncul(); } o.scale.setScalar(.01); return animasi(lama, e => o.scale.setScalar(Math.max(.01, s * e))); };
function alasBatu(r = 4, warna = '#b8c0c8', s = .15) {
  const g = new THREE.Group(); const rr = r * s; const a = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr * 1.04, .16, 28), new THREE.MeshStandardMaterial({color: warna, roughness: .85})); a.position.y = .08; a.castShadow = a.receiveShadow = true; g.add(a);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(rr * .82, rr * .86, .12, 28), new THREE.MeshStandardMaterial({color: variasi(warna, .05), roughness: .85})); b.position.y = .2; b.receiveShadow = true; g.add(b); return g;
  /* lama: */ const v = new Vox(s); for (let x = -r; x < r; x++) for (let z = -r; z < r; z++) if ((x + .5) ** 2 + (z + .5) ** 2 <= r * r) { v.set(x, 0, z, variasi(warna, .05)); if ((x + .5) ** 2 + (z + .5) ** 2 <= (r - 1) ** 2) v.set(x, 1, z, variasi(warna, .04)); } return v.mesh(); }

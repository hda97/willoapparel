// Tanaman Sawah Wetan (Huda 18 Nov 2026): bentuk 11 tanaman low-poly, dipakai bersama oleh mini-game /duniakotak/sawah/
// dan sawah di dunia desa (Kotak Wetan) supaya tanaman warga terlihat sama di dua tempat.
// 3 InstancedMesh (daun, batang, buah) diisi ulang tiap keadaan berubah → hanya 3 draw call, ringan untuk HP.
import * as THREE from 'three';
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SKL = new THREE.Vector3(), C = new THREE.Color(), E = new THREE.Euler();
let T = {x: 0, y: 0, z: 0, k: 1}, IM = null;
function taruh(im, i, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) { E.set(rx, ry, rz); Q.setFromEuler(E); M4.compose(V.set(T.x + x * T.k, T.y + y * T.k, T.z + z * T.k), Q, SKL.set(sx * T.k, sy * T.k, sz * T.k)); im.setMatrixAt(i, M4); }
const daun = (x, y, z, sx, sy, sz, c, ry = 0, rx = 0, rz = 0) => { const m = IM.daun; if (IM.nD >= IM.maks[0]) return; taruh(m, IM.nD, x, y, z, sx, sy, sz, ry, rx, rz); m.setColorAt(IM.nD++, C.set(c)); };
const batang = (x, y0, z, h, r, c) => { const m = IM.batang; if (IM.nB >= IM.maks[1]) return; taruh(m, IM.nB, x, y0 + h / 2, z, r * 2, h, r * 2); m.setColorAt(IM.nB++, C.set(c)); };
const buah = (x, y, z, sx, sy, sz, c, ry = 0) => { const m = IM.buah; if (IM.nF >= IM.maks[2]) return; taruh(m, IM.nF, x, y, z, sx, sy, sz, ry); m.setColorAt(IM.nF++, C.set(c)); };
export const acak = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const HIJAU = [0x4caf50, 0x3f9a3a, 0x5cbf4a];
// Bentuk tiap tanaman (satuan mini-game: petak 6×6, tanaman tertinggi ±3). (x,z) = titik tanam, f = 0..1 tumbuh, siap = bisa dipanen, s = benih acak.
// Bentuk tiap tanaman. f = 0..1 tumbuh, siap = sudah bisa dipanen. (x,z) = titik tanam, s = benih acak.
const BENTUK = {
  sawi: (x, z, f, siap, s) => { const k = .35 + .65 * f; for (let i = 0; i < 4; i++) daun(x, .35 + .25 * k, z, .38 * k, .7 * k, .9 * k, i % 2 ? 0x8fd45a : 0x6cc04a, i * Math.PI / 2 + s, -.5); },
  kangkung: (x, z, f, siap, s) => { const k = .35 + .65 * f; for (let i = 0; i < 5; i++) { const a = i * 1.26 + s; daun(x + Math.cos(a) * .25 * k, .3 + .45 * k, z + Math.sin(a) * .25 * k, .16 * k, .9 * k, .3 * k, 0x4cb04a, a, .35); } },
  wortel: (x, z, f, siap, s) => { const k = .3 + .7 * f; for (let i = 0; i < 3; i++) daun(x, .3 + .5 * k, z, .12, 1.1 * k, .4 * k, 0x5cbf4a, i * 1.05 + s, .25);
    if (siap) buah(x, .3, z, .5, .55, .5, 0xf08a24); },
  tomat: (x, z, f, siap, s) => { const h = .3 + 1.5 * f; batang(x, .2, z, h, .07, 0x3f8a3a); for (let i = 0; i < 3; i++) daun(x, .3 + h * (.4 + i * .22), z, .9 * f + .2, .1, .4, HIJAU[i % 3], i * 2.1 + s);
    if (f > .6) for (let i = 0; i < 4; i++) { const a = i * 1.6 + s; buah(x + Math.cos(a) * .35, .4 + h * (.35 + (i % 2) * .25), z + Math.sin(a) * .35, .42, .4, .42, siap ? 0xe0402a : 0x8fcf5a); } },
  cabai: (x, z, f, siap, s) => { const h = .3 + 1.2 * f; batang(x, .2, z, h, .06, 0x3f8a3a); for (let i = 0; i < 3; i++) daun(x, .3 + h * (.45 + i * .2), z, .7 * f + .2, .08, .32, HIJAU[(i + 1) % 3], i * 2.3 + s);
    if (f > .55) for (let i = 0; i < 5; i++) { const a = i * 1.3 + s; buah(x + Math.cos(a) * .3, .35 + h * (.4 + (i % 3) * .15), z + Math.sin(a) * .3, .15, .55, .15, siap ? 0xd8251c : 0x5aa83a, 0); } },
  terong: (x, z, f, siap, s) => { const h = .3 + 1.3 * f; batang(x, .2, z, h, .07, 0x4a6a3a); for (let i = 0; i < 3; i++) daun(x, .3 + h * (.45 + i * .2), z, 1 * f + .2, .1, .5, 0x4a9a3a, i * 2 + s);
    if (f > .6) for (let i = 0; i < 3; i++) { const a = i * 2.1 + s; buah(x + Math.cos(a) * .38, .3 + h * .35, z + Math.sin(a) * .38, .32, .75, .32, siap ? 0x6a2a8a : 0x9a7ab0); } },
  jagung: (x, z, f, siap, s) => { const h = .4 + 2.6 * f; batang(x, .2, z, h, .1, siap ? 0x9aa84a : 0x5aa83a); for (let i = 0; i < 4; i++) daun(x, .4 + h * (.25 + i * .18), z, 1.1 * f + .2, .08, .28, siap ? 0xa8b85a : 0x58b04a, i * 1.7 + s, 0, .35);
    if (f > .5) buah(x + .22, .3 + h * .55, z, .28, .7, .28, siap ? 0xf2c43a : 0x9ad06a); if (siap) daun(x, .3 + h, z, .12, .5, .12, 0xd8c070); },
  padi: (x, z, f, siap, s) => { const h = .35 + 1.2 * f, c = siap ? 0xe8c25a : f > .7 ? 0x9ac84a : 0x5cc04a;
    for (let i = 0; i < 4; i++) daun(x + (i % 2 - .5) * .22, .25 + h / 2, z + ((i >> 1) - .5) * .22, .08, h, .08, c, s + i, (i % 2 - .5) * .3, ((i >> 1) - .5) * .3);
    if (siap) buah(x, .25 + h, z, .3, .22, .3, 0xd8a83a); },
  kacang: (x, z, f, siap, s) => { const k = .35 + .65 * f; buah(x, .3 + .35 * k, z, 1.1 * k, .8 * k, 1.1 * k, siap ? 0x9ab84a : 0x4caf50, s); if (siap) for (let i = 0; i < 3; i++) buah(x + (i - 1) * .35, .35, z + .45, .2, .14, .14, 0xc8a070); },
  semangka: (x, z, f, siap, s) => { const k = .3 + .7 * f; for (let i = 0; i < 4; i++) { const a = i * 1.57 + s; daun(x + Math.cos(a) * .55 * k, .3, z + Math.sin(a) * .55 * k, .7 * k, .1, .5 * k, 0x3f9a3a, a); }
    if (f > .45) buah(x + .1, .3 + .45 * f, z, 1.25 * f, .95 * f, .9 * f, siap ? 0x2f7a2a : 0x6ab04a, s); },
  matahari: (x, z, f, siap, s) => { const h = .4 + 2.8 * f; batang(x, .2, z, h, .09, 0x4a9a3a); daun(x, .4 + h * .4, z, .9 * f + .2, .08, .45, 0x4caf50, s); daun(x, .4 + h * .65, z, .8 * f + .2, .08, .4, 0x58b04a, s + 1.6);
    if (f > .5) { const r = siap ? 1 : .5; buah(x, .3 + h, z + .15, 1.05 * r, 1.05 * r, .25, siap ? 0xffc81e : 0x6ab04a); if (siap) buah(x, .3 + h, z + .3, .5, .5, .12, 0x6a3a1a); } },
};
// Buat kebun: pasang 3 InstancedMesh ke `induk`. isi(petak) dengan petak = [{x, z, b, f, siap, kunci}] (x,z pusat petak di dunia),
// uk = lebar petak (satuan bentuk), k = skala bentuk → dunia, y = tinggi tanah.
export function buatKebun(induk, {maks = [7000, 2600, 3000], bayangan = true} = {}) {
  const mk = (geo, n) => { const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({roughness: .8, flatShading: true}), n); m.castShadow = bayangan; m.setColorAt(0, C.set(0xffffff)); m.count = 0; m.frustumCulled = false; induk.add(m); return m; };
  const K = {daun: mk(new THREE.BoxGeometry(1, 1, 1), maks[0]), batang: mk(new THREE.CylinderGeometry(.5, .5, 1, 5), maks[1]), buah: mk(new THREE.IcosahedronGeometry(.5, 0), maks[2]), maks, nD: 0, nB: 0, nF: 0};
  K.isi = (daftar, {uk = 6, k = 1, y = 0, ukZ = uk} = {}) => {
    IM = K; K.nD = K.nB = K.nF = 0;
    for (const p of daftar) { const fn = BENTUK[p.b]; if (!fn) continue; const padat = p.b === 'padi', nx = padat ? 5 : 3, nz = padat ? 5 : 3;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const s = acak(p.kunci * 31 + i * 7 + j);
        T = {x: p.x + (i - (nx - 1) / 2) * (uk / (nx + .2)) * k, y, z: p.z + (j - (nz - 1) / 2) * (ukZ / (nz + .2)) * k, k}; fn(0, 0, Math.max(.08, p.f), p.siap, s * 6.28); } }
    for (const n of ['daun', 'batang', 'buah']) { const m = K[n]; m.count = n === 'daun' ? K.nD : n === 'batang' ? K.nB : K.nF; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    IM = null;
  };
  return K;
}

// Koleksi Langka Dunia Kotak (Huda 21 Nov 2026: "pemain bisa flexing antar warga pamer item rare").
// Model 3D item langka (ikan raksasa dari Mancing Kotak + kepiting langka), etalase pajangan di teras rumah warga,
// dan ikon piksel 10x10 khas Dunia Kotak untuk panel Koleksi. Daftar item HARUS sama dengan LANGKA di worker.js.
import * as THREE from 'three';
import {ikanMesh} from '../../mancing/model.js?v=20261120lv';

// t: 1 = Langka (perak), 2 = Legenda (emas). f = data ikan untuk ikanMesh (warna badan/perut & panjang dasar sama dengan mancing.js)
export const LANGKA = {
  kepiting: {nama: 'Kepiting langka', t: 1, asal: 'Mancing di sungai desa (peluang 3%)'},
  patin: {nama: 'Patin Raksasa', t: 2, asal: 'Mancing Kotak · Danau Tlaga · umpan Lv 2+', f: {warna: 0x8a96a6, perut: 0xf0f2f4, pj: 2.6}},
  tapah: {nama: 'Tapah Raksasa', t: 2, asal: 'Mancing Kotak · Sungai Wetan · umpan Lv 3+', f: {warna: 0x5a5a62, perut: 0xc8c8d0, pj: 2.9}},
  kerapu: {nama: 'Kerapu Raksasa', t: 2, asal: 'Mancing Kotak · Laut Segara · umpan Lv 4+', f: {warna: 0x6a5a3a, perut: 0xd8c098, pj: 3.2}},
  layaran: {nama: 'Ikan Layaran', t: 2, asal: 'Mancing Kotak · Laut Segara · umpan Lv 4+', f: {warna: 0x1a3a7a, perut: 0xe0eaf4, pj: 3.3}},
};
export const TINGKAT = {1: {nama: 'Langka', warna: 0xc8d2e0, css: '#9fb0c8'}, 2: {nama: 'Legenda', warna: 0xffc928, css: '#e8a810'}};
export const kgTeks = g => g ? (g / 1000).toFixed(1).replace('.', ',') + ' kg' : '';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .8, flatShading: true, ...o});
const kotak = (w, h, d, c, x = 0, y = 0, z = 0, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); m.position.set(x, y, z); return m; };

function kepitingMesh() {
  const g = new THREE.Group(), M = 0xe0502a, T = 0xb83a1e;
  g.add(kotak(.62, .22, .46, M, 0, .16, 0), kotak(.5, .06, .38, T, 0, .3, 0));
  for (const sx of [-1, 1]) {
    g.add(kotak(.04, .14, .04, T, sx * .12, .34, .2), kotak(.08, .08, .08, 0xffffff, sx * .12, .43, .2), kotak(.04, .04, .03, 0x1a1a1a, sx * .12, .44, .245));   // mata bertangkai
    g.add(kotak(.24, .07, .07, M, sx * .38, .18, .2), kotak(.2, .16, .16, M, sx * .52, .22, .32), kotak(.08, .1, .1, T, sx * .58, .22, .44));   // capit
    for (let i = 0; i < 3; i++) { const k = kotak(.3, .05, .05, T, sx * .42, .1, -.12 + i * .1); k.rotation.z = sx * -.45; g.add(k); }   // kaki
  }
  return g;
}

// Model item langka, panjang dinormalkan ke `pj` satuan, menghadap +X (sisi badan terlihat dari depan kavling).
export function modelLangka(k, pj = 1, g = 0) {
  const d = LANGKA[k]; if (!d) return new THREE.Group();
  let m;
  if (d.f) { m = ikanMesh({nama: d.nama, g: g || 20000, ...d.f}); m.rotation.y = Math.PI / 2; }
  else m = kepitingMesh();
  const w = new THREE.Group(); w.add(m); w.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(w), s = pj / Math.max(.01, b.max.x - b.min.x, b.max.z - b.min.z);
  m.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  w.scale.setScalar(s); w.userData.tinggi = (b.max.y - b.min.y) * s;
  return w;
}

// Etalase pajangan teras (satuan kavling, dipasang di depan rumah). isi = [[k, seri, g], ...] maks 3, urut slot.
// Kayu + kaca bening + alas tiap slot + plakat warna tingkat (perak Langka / emas Legenda). Kosong → null (rumah tanpa koleksi tetap bersih).
export const ETALASE = {lebar: 1.5, dalam: .5};
export function etalaseMesh(isi) {
  isi = (isi || []).filter(x => LANGKA[x[0]]).slice(0, 3); if (!isi.length) return null;
  const G = new THREE.Group(), W = ETALASE.lebar, D = ETALASE.dalam, KAYU = 0x8a5a32, GELAP = 0x5a3a20, H0 = .36, H1 = .7;
  G.add(kotak(W, H0, D, KAYU, 0, H0 / 2, 0), kotak(W + .06, .05, D + .06, GELAP, 0, H0 + .025, 0));   // lemari bawah + papan atas
  for (const x of [-W / 4, W / 4]) G.add(kotak(.02, H0 - .12, .01, GELAP, x, H0 / 2, D / 2 + .005));   // garis pintu lemari
  for (const x of [-W / 2 + .03, W / 2 - .03]) for (const z of [-D / 2 + .03, D / 2 - .03]) G.add(kotak(.05, H1, .05, GELAP, x, H0 + .05 + H1 / 2, z));   // tiang kaca
  G.add(kotak(W + .06, .06, D + .06, GELAP, 0, H0 + .05 + H1 + .03, 0));   // atap etalase
  const kaca = new THREE.Mesh(new THREE.BoxGeometry(W - .06, H1, D - .06), new THREE.MeshStandardMaterial({color: 0xcfeeff, transparent: true, opacity: .18, roughness: .05, metalness: .1, depthWrite: false}));
  kaca.position.y = H0 + .05 + H1 / 2; kaca.userData.jangan = true; G.add(kaca);
  const lebarSlot = W / 3;
  isi.forEach(([k, seri, g], i) => {
    const d = LANGKA[k], x = -W / 2 + lebarSlot * (i + .5), tg = TINGKAT[d.t] || TINGKAT[1];
    G.add(kotak(lebarSlot * .7, .06, D * .55, 0xf4efe4, x, H0 + .08, 0));   // alas
    G.add(kotak(lebarSlot * .4, .07, .02, tg.warna, x, H0 + .14, D / 2 - .05, {metalness: .5, roughness: .35, emissive: d.t === 2 ? 0x6a4a00 : 0x30343a, emissiveIntensity: .35}));   // plakat
    const m = modelLangka(k, lebarSlot * .95, g); m.position.set(x, H0 + .11, -.02);
    if (m.userData.tinggi > H1 * .85) m.scale.multiplyScalar(H1 * .85 / m.userData.tinggi);
    G.add(m);
  });
  return G;
}

// Ikon piksel 10x10 khas Dunia Kotak (tanpa emoji) untuk panel Koleksi Langka.
const PIKSEL = {
  ikan: ['..........', '.....#....', '....###...', '#..######.', '##########', '########o#', '#..######.', '....###...', '.....#....', '..........'],
  kepiting: ['..o....o..', '..#....#..', '##.####.##', '#.######.#', '..######..', '.########.', '#.######.#', '.#.#..#.#.', '#..#..#..#', '..........'],
};
export function ikonLangka(k, uk = 30) {
  const d = LANGKA[k]; if (!d) return '';
  const p = PIKSEL[k === 'kepiting' ? 'kepiting' : 'ikan'], c = d.f ? '#' + d.f.warna.toString(16).padStart(6, '0') : '#e0502a', tepi = TINGKAT[d.t].css;
  let r = '';
  p.forEach((baris, y) => { for (let x = 0; x < 10; x++) { const ch = baris[x]; if (ch === '#') r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`; else if (ch === 'o') r += `<rect x="${x}" y="${y}" width="1" height="1" fill="#1a1a1a"/>`; } });
  return `<svg class="lkIkon" viewBox="-1 -1 12 12" width="${uk}" height="${uk}" shape-rendering="crispEdges" aria-hidden="true"><rect x="-1" y="-1" width="12" height="12" rx="1.5" fill="#fffaf0" stroke="${tepi}" stroke-width=".8"/>${r}</svg>`;
}

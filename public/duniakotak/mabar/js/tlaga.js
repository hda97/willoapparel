// DUSUN 4 · KOTAK TLAGA untuk game: dusun tepi danau dari denah BAKU (desa-kotak/denah-dusun-BAKU-2026-11-02/kode/dusun-lain.js, tlaga()).
// Denah baku = rumah mengelilingi danau. Mesin game hanya mengenal rumah yang menghadap utara/selatan (sama seperti Wetan/Kulon/Curug),
// jadi cincin rumah disusun sebagai deret jalan lurus di utara & selatan danau: dua jalan tepi danau (Jl. Nila & Jl. Mujair) menghadap air,
// lalu deret di belakangnya. Fasum disebar satu per deret (aturan Huda 6 Nov 2026). Sungai masuk dari utara (sisi barat), lewat danau,
// keluar ke timur. Dermaga + perahu di tepi selatan danau. Dibuka 8 Nov 2026 saat Kotak Curug penuh (warga No. 661+).
// Kavling lokal 1–200 = warga No. 661–860. Deret k (0..9) = RT k+1 = kavling 20k+1 … 20k+20, nomor 1–20 dari barat ke timur.
import {THREE, rnd, reseed} from './lib.js';
import {aturTipis, lot2, LOT_D, VS, V3, fasum2, vTree, box, hutan, hutanPts, nameTex} from './desa.js';
import * as F from './aset/fasum.js';

export const JALAN_TLAGA = ['Nila','Mujair','Gurami','Lele','Patin','Bawal','Tawes','Nilem','Wader','Betok'];
export const AWAL_TLAGA = 660;   // warga No. 661 = kavling 1 Kotak Tlaga
const NK = 22, SP = 11, L = NK * SP;                   // 22 petak per deret: 20 rumah + 1 lahan fasum (2 petak)
const JZ = [-108, -69, -30, 30, 69, 108];              // jalan lurus (utara → selatan); -30 & 30 = jalan tepi danau
const RX = 100, RZ = 24;                               // danau elips di tengah
const XS = L / 2 + 9;                                  // jalan penghubung barat/timur
const XR = -(L / 2 + 30);                              // sungai masuk (utara, sisi barat)
const TX = L / 2 + 42, TZ = 96;                        // terminal bus & gapura (tenggara)
// urutan deret = RT: [jalan, sisi (-1 utara jalan, 1 selatan jalan), petak awal lahan fasum, aset, nama]; aset null = lahan kosong voting
const DERET = [[2, -1, 4, 'masjid', '🕌 Masjid'], [3, 1, 14, 'warung', '🛒 Warung Desa'], [1, 1, 16, 'sekolah', '🏫 SD Kotak Tlaga'], [4, -1, 3, 'gereja', '⛪ Gereja'],
  [1, -1, 8, null], [4, 1, 11, 'katedral', '⛪ Gereja Katolik'], [0, 1, 2, 'pura', '🛕 Pura'], [5, -1, 17, 'vihara', '☸️ Vihara'], [0, -1, 13, 'klenteng', '🏮 Klenteng'], [5, 1, 6, null]];

export function tlaga(sc, o = {}) {
  aturTipis(.02);
  reseed(500 + 'tlaga'.length);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x9ab890, 1.25));
  const d = new THREE.DirectionalLight(0xfff2d8, 2.4); d.castShadow = true; d.shadow.mapSize.set(o.sm || 2048, o.sm || 2048);
  const R0 = o.shadowR || 70; Object.assign(d.shadow.camera, {left: -R0, right: R0, top: R0, bottom: -R0, far: 300, near: 1}); d.shadow.bias = -.0015; d.shadow.normalBias = 1.5;
  sc.add(d); sc.add(d.target);
  const G = new THREE.Group(); G.scale.setScalar(VS); sc.add(G);
  const mat = (c, r = .9) => new THREE.MeshStandardMaterial({color: c, roughness: r});
  const slab = (x, y, z, w, h, dd, c, ry = 0, r = .9) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat(c, r)); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; m.castShadow = h > .6; G.add(m); return m; };
  const road = (x, z, w, dd) => slab(x, .08, z, w, .16, dd, 0xd8c49c);
  const water = (x, z, w, dd) => slab(x, -.02, z, w, .3, dd, 0x3f9be0, 0, .6);
  const tree = (x, z, s = 1) => vTree(G, x, z, s);
  const fas = [];
  const fasum = (x, z, w, dd) => { const k = G.children.length; fasum2(G, x, z, w, dd); const g = G.children[k]; fas.push({p: V3(x * VS, 0, z * VS), g}); return g; };

  // ---- tanah, danau, jalan ----
  slab(0, -.06, 0, 1200, .1, 1200, 0x5f9e44);
  const elips = (rx, rz, y, h, c, r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, h, 96), mat(c, r)); m.scale.set(rx, 1, rz); m.position.y = y; m.receiveShadow = true; G.add(m); return m; };
  elips(RX + 3, RZ + 3, -.02, .2, 0xc8b080);              // pasir tepi danau
  elips(RX, RZ, .1, .3, 0x3a92d8, .6);                     // air danau
  JZ.forEach(z => road(0, z, L + 14, 4));
  [-1, 1].forEach(sd => road(sd * XS, (JZ[0] + JZ[5]) / 2, 4, JZ[5] - JZ[0] + 4));
  road((XS + TX) / 2, JZ[5], TX - XS, 4); road(TX, (TZ + 12 + 300) / 2, 8, 300 - TZ - 12);   // ke terminal, lalu jalan keluar dusun ke selatan
  // sungai masuk dari utara (sisi barat) → belok ke danau; keluar dari ujung timur danau ke timur
  water(XR, (-420 + 0) / 2 - 3, 12, 420); water((XR + -RX) / 2, 0, -RX - XR + 6, 12); water((RX + 420) / 2, 0, 420 - RX + 6, 12);
  [-1, 1].forEach(sd => slab(sd * XS, .3, 0, 6, .4, 15, 0x9a6a3a));   // jembatan jalan penghubung
  // dermaga + perahu di tepi selatan
  slab(-40, .3, RZ - 6, 4, .4, 16, 0x9a6a3a);
  [[-55, 6, .4], [-28, -2, -.6], [-46, -10, 1.2], [20, 8, .2]].forEach(([x, z, r]) => { const b = box(3, 1, 7, 0xc8553d, .3); b.position.set(x, .45, z); b.rotation.y = r; b.castShadow = true; G.add(b); });
  // taman & pohon di ujung danau
  for (let k = 0; k < 40; k++) { const sd = k % 2 ? 1 : -1, x = sd * (RX + 6 + rnd() * (L / 2 - RX - 4)), z = (rnd() - .5) * 44; if (Math.abs(z) < 8) continue; tree(x, z, .8 + rnd() * .5); }

  // ---- deret rumah & fasum tersebar ----
  const LOTS = [], gF = new THREE.Group(); sc.add(gF); const bangunan = [], lahanKosong = [];
  DERET.forEach(([j, sd, s0, k, nama]) => {
    const z = JZ[j];
    for (let i = 0; i < NK; i++) { if (i === s0 || i === s0 + 1) continue; LOTS.push({n: LOTS.length + 1, cx: -L / 2 + SP / 2 + i * SP, cz: z + sd * 7, rot: sd > 0 ? Math.PI : 0}); }
    const x = -L / 2 + SP * (s0 + 1), fz = z + sd * 10.6; fasum(x, fz, 21, 17.4);
    const f = G.children[G.children.length - 1];
    if (!k) { lahanKosong.push({x, z: fz}); return; }
    f.children.slice(1).forEach(c => f.remove(c));
    const m = F[k](); m.scale.setScalar(VS); if (sd > 0) m.rotation.y = Math.PI; m.position.set(x * VS, 0, fz * VS); gF.add(m);
    bangunan.push({position: new THREE.Vector3(m.position.x, 0, m.position.z), nama, ...F.pisahFasum(m)});
  });
  // pepohonan di antara deret yang saling membelakangi
  [[-49.5], [49.5], [-88.5], [88.5]].forEach(([z]) => { for (let x = -L / 2 + 8; x < L / 2 - 4; x += 16 + rnd() * 10) if (!o.hemat || rnd() < .5) tree(x, z + (rnd() - .5) * 3, .7 + rnd() * .4); });
  const tm = fasum(TX, TZ, 30, 24); tm.children.slice(1).forEach(c => tm.remove(c));
  bangunan.push({position: V3(0, 0, 0), nama: '🛶 Danau Tlaga', tinggi: 3 * VS, rect: null});
  bangunan.push({position: V3(TX * VS, 0, TZ * VS), nama: '🚌 Terminal & Gapura Kotak Tlaga', tinggi: 3 * VS, rect: null});
  hutan(G, hutanPts({x0: XR - 22, x1: TX + 30, z0: JZ[0] - 26, z1: TZ + 34, W: o.hemat ? 120 : 240, st: 8,
    skip: (x, z) => (Math.abs(x - XR) < 16 && z < 0) || (Math.abs(z) < 16 && x > 0) || (z > 0 && Math.abs(x - TX) < 14)}));

  // ---- kavling bertahap: warga No. 661+ ----
  const info = {lots: {}, G, light: d, grupFasum: gF, bangunan, dusun: 'tlaga'};
  const nm = o.names || {};
  const roofs2 = [0xc8553d, 0x3a7ad8, 0x3aa860, 0xe0a020, 0x9a5ad8, 0xd84a8a, 0x2a9a9a, 0xe06a2a];
  const bl = l => {
    const no = AWAL_TLAGA + l.n, isi = o.isFilled ? o.isFilled(no) : !!nm[no];
    const g = lot2(G, l.cx, l.cz, l.rot, {lh: .02, n: no, filled: isi, fh: .32, roof: roofs2[(no * 5) % roofs2.length], crop: ['wortel', 'gandum', 'jagung', 'tomat'][no % 4], fruit: [0xff3a3a, 0xffa020, 0xffe040][no % 3]});
    if (isi) { const st = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.15, .45), [0, 1, 2, 3, 4, 5].map(k => new THREE.MeshStandardMaterial({color: k === 4 ? 0xffffff : 0x9a9a9a, roughness: .9, map: k === 4 ? nameTex(nm[no] || '', no) : null}))); st.position.set(.2, .58, LOT_D / 2 - .5); st.castShadow = true; g.add(st); }
    return g;
  };
  LOTS.forEach(l => {
    const no = AWAL_TLAGA + l.n, hd = LOT_D / 2, dir = l.rot ? -1 : 1;
    info.lots[no] = {c: V3(l.cx * VS, 0, l.cz * VS), gate: V3((l.cx - 2 * dir) * VS, 0, (l.cz + hd * dir) * VS), stone: V3((l.cx - 2 * dir) * VS, 0, (l.cz + (hd - 1.3) * dir) * VS), dir, lokal: l.n};
  });
  info.buildLot = no => { const l = LOTS[no - AWAL_TLAGA - 1]; return l ? bl(l) : null; };
  info.batas = {x0: (XR - 12) * VS, x1: (TX + 22) * VS, z0: (JZ[0] - 16) * VS, z1: (TZ + 26) * VS};
  info.spawn = V3(TX * VS, 0, (TZ - 14) * VS);
  // air: danau elips + sungai masuk/keluar; avatar tidak berjalan di atas air kecuali jembatan/dermaga
  const diDanau = (lx, lz, m = 0) => (lx / (RX + m)) ** 2 + (lz / (RZ + m)) ** 2 < 1;
  const diSungai = (lx, lz) => (Math.abs(lx - XR) < 6 && lz < 6) || (Math.abs(lz) < 6 && (lx < -RX + 2 || lx > RX - 2) && lx > XR - 6);
  const diJembatan = (lx, lz) => (Math.abs(Math.abs(lx) - XS) < 3.5 && Math.abs(lz) < 7.5) || (Math.abs(lx + 40) < 2 && lz > RZ - 14 && lz < RZ + 3);
  info.air = (x, z) => { const lx = x / VS, lz = z / VS; return (diDanau(lx, lz, -1) || diSungai(lx, lz)) && !diJembatan(lx, lz); };
  info.dekatAir = (x, z) => { const lx = x / VS, lz = z / VS; return diDanau(lx, lz, 8) || (Math.abs(lx - XR) < 14 && lz < 12) || (Math.abs(lz) < 14 && Math.abs(lx) > RX - 4); };
  info.arahAir = (x, z) => { const lx = x / VS, lz = z / VS;
    if (Math.abs(lx) <= RX) return V3(x, 0, 0);
    if (lx < 0 && Math.abs(lx - XR) < Math.abs(lz)) return V3(XR * VS, 0, z);
    return V3(x, 0, 0); };
  const xs = [-XS, -L / 4, 0, L / 4, XS].map(v => v * VS), zs = JZ.map(v => v * VS);
  info.jalur = {xs, zs, bolehNaik: () => false};
  const wr = DERET[1], wx = -L / 2 + SP * (wr[2] + 1), lk = lahanKosong[0];
  info.tempatNPC = {warung: V3((wx + 5) * VS, 0, (JZ[3] + 1.5) * VS), balai: V3(-40 * VS, 0, (JZ[3] - 1.5) * VS), sungai: V3(-60 * VS, 0, (RZ + 2) * VS), sawah: V3(-XS * VS, 0, -50 * VS), main: V3(lk.x * VS, 0, lk.z * VS)};
  return info;
}

// DUSUN 4 · KOTAK TLAGA untuk game: dusun tepi danau dari denah BAKU (desa-kotak/denah-dusun-BAKU-2026-11-02/kode/dusun-lain.js, tlaga()):
// danau di tengah dusun, rumah mengelilingi danau, jalan lingkar tepi danau, dermaga + perahu, sungai masuk dari utara & keluar ke timur,
// terminal & gapura di selatan, hutan pembatas di sekeliling. Dibuka 8 Nov 2026 saat Kotak Curug penuh (warga No. 661+).
// Menurut kunci denah game (Huda 6 Nov 2026: "ubah denah, nomor rumah tetap", fasum disebar merata): kavling di game menghadap jalan
// lurus (utara/selatan) seperti dusun lain, tersusun melingkari danau; fasum wajib disebar di 10 lahan (8 gedung + 2 kosong untuk voting).
// Kavling lokal 1–200 = warga No. 661–860. Jalan j (0 = dekat gapura, 6 = paling utara): RT naik dari selatan ke utara.
import {THREE, rnd, reseed} from './lib.js';
import {aturTipis, lot2, LOT_D, VS, V3, fasum2, vTree, box, hutan, hutanPts, nameTex} from './desa.js';
import * as F from './aset/fasum.js';

export const JALAN_TLAGA = ['Nila','Mujair','Gurami','Lele','Patin','Bawal','Tawes','Nilem','Wader','Betok'];
export const AWAL_TLAGA = 660;   // warga No. 661 = kavling 1 Kotak Tlaga
const NC = 24, SP = 11, W = NC * SP, P = 40, NJ = 7;      // 24 petak per sisi jalan, 7 jalan, jarak antarjalan 40
const AX = 90, AZ = 48, ZC = -3.5 * P;                     // danau elips, pusat di antara jalan 3 & 4
const MG = 8;                                             // tepi pasir + jalan lingkar danau
const XS = W / 2 + 8;                                     // jalan tepi kiri/kanan (penghubung antarjalan)
const ZT = 30;                                            // terminal & gapura di selatan
const BANDARA = {x: -32, z: 96};                           // pusat kawasan bandara (lokal), di luar hutan selatan
const ZU = -(NJ - 1) * P;                                 // jalan paling utara
// lahan fasum (2 petak, satu sisi jalan): [jalan, sisi (-1 utara jalan, 1 selatan jalan), petak awal, aset, nama]; aset null = kosong untuk voting
const FASUM = [[0, 1, 16, 'warung', '🛒 Warung Desa'], [0, -1, 4, 'sekolah', '🏫 SD Kotak Tlaga'], [1, 1, 10, 'masjid', '🕌 Masjid'], [1, -1, 19, null],
  [2, -1, 1, 'gereja', '⛪ Gereja'], [3, 1, 21, 'katedral', '⛪ Gereja Katolik'], [4, -1, 0, 'pura', '🛕 Pura'], [5, 1, 20, 'vihara', '☸️ Vihara'],
  [5, -1, 5, 'klenteng', '🏮 Klenteng'], [6, -1, 15, null]];

// air (tidak bisa diinjak, satuan lokal): danau elips, sungai masuk (utara, x≈0), sungai keluar (timur, z≈ZC); jembatan di jalan
const diDanau = (x, z, m = 0) => (x / (AX + m)) ** 2 + ((z - ZC) / (AZ + m)) ** 2 < 1;
const sungaiU = (x, z) => Math.abs(x) < 5.5 && z < ZC - AZ + 2;
const sungaiT = (x, z) => Math.abs(z - ZC) < 5.5 && x > AX - 2;
const jembatanU = z => { for (let j = 0; j < NJ; j++) if (Math.abs(z + j * P) < 3) return true; return false; };
const jembatanT = x => Math.abs(x - XS) < 3.5;
const DERMAGA = {x0: 16, x1: 22, z0: ZC + AZ - 22, z1: ZC + AZ + 4};

export function tlaga(sc, o = {}) {
  aturTipis(.02);   // bedeng kebun & tanah kavling tipis seperti Kotak Wetan
  reseed(500 + 'tlaga'.length);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x9ab890, 1.25));
  const d = new THREE.DirectionalLight(0xfff2d8, 2.4); d.castShadow = true; d.shadow.mapSize.set(o.sm || 2048, o.sm || 2048);
  const R0 = o.shadowR || 70; Object.assign(d.shadow.camera, {left: -R0, right: R0, top: R0, bottom: -R0, far: 300, near: 1}); d.shadow.bias = -.0015; d.shadow.normalBias = 1.5;
  sc.add(d); sc.add(d.target);
  const G = new THREE.Group(); G.scale.setScalar(VS); sc.add(G);
  const mat = (c, r = .9) => new THREE.MeshStandardMaterial({color: c, roughness: r});
  const slab = (x, y, z, w, h, dd, c, ry = 0, r = .9) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat(c, r)); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; m.castShadow = h > .6; G.add(m); return m; };
  const road = (x, z, w, dd, y = 0, ry = 0) => slab(x, y + .08, z, w, .16, dd, 0xd8c49c, ry);
  const water = (x, z, w, dd, y = -.02, c = 0x3f9be0) => slab(x, y, z, w, .3, dd, c, 0, .25);
  const tree = (x, z, s = 1) => vTree(G, x, z, s);
  const fas = [];
  const fasum = (x, z, w, dd) => { const k = G.children.length; fasum2(G, x, z, w, dd); const g = G.children[k]; fas.push({p: V3(x * VS, 0, z * VS), g}); return g; };
  const elips = (rx, rz, h, y, c, r = .9) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rz, rz, h, 96), mat(c, r)); m.scale.x = rx / rz; m.position.set(0, y, ZC); m.receiveShadow = true; G.add(m); return m; };

  // ---- tanah, danau, jalan lingkar (dari tlaga() di denah BAKU) ----
  slab(0, -.06, ZC, W + 900, .1, 1200, 0x5f9e44);
  elips(AX + MG + 1, AZ + MG + 1, .2, -.1, 0x6fae50);           // rumput tepi
  elips(AX + 3, AZ + 3, .22, -.05, 0xc8b080);                  // pasir tepi danau
  elips(AX, AZ, .4, .02, 0x3a92d8, .2);                         // DANAU
  { const n = 120; for (let k = 0; k < n; k++) { const a = k / n * 2 * Math.PI, a2 = (k + 1) / n * 2 * Math.PI, rx = AX + 5.5, rz = AZ + 5.5;
    const x1 = Math.cos(a) * rx, z1 = ZC + Math.sin(a) * rz, x2 = Math.cos(a2) * rx, z2 = ZC + Math.sin(a2) * rz;
    road((x1 + x2) / 2, (z1 + z2) / 2, 4.2, Math.hypot(x2 - x1, z2 - z1) + .6, 0, Math.atan2(x2 - x1, z2 - z1)); } }
  // dermaga + perahu
  slab((DERMAGA.x0 + DERMAGA.x1) / 2, .32, (DERMAGA.z0 + DERMAGA.z1) / 2, DERMAGA.x1 - DERMAGA.x0, .4, DERMAGA.z1 - DERMAGA.z0, 0x9a6a3a);
  [[-2, 7], [3, 5], [9, 10]].forEach(([dx, dz]) => slab((DERMAGA.x0 + DERMAGA.x1) / 2 + (dx > 0 ? 3.6 : -3.6), .1, DERMAGA.z0 + dz, .5, 1.2, .5, 0x6a4426));
  const perahu = (x, z, ry, c) => { const g = new THREE.Group(); const b = box(3, .9, 7, c, .3); b.position.y = .45; g.add(b); const ds = box(2.4, .3, 6.2, 0x8a5a2a, .1); ds.position.y = .8; g.add(ds);
    g.position.set(x, .1, z); g.rotation.y = ry; g.traverse(m => { if (m.isMesh) m.castShadow = true; }); G.add(g); };
  perahu(DERMAGA.x0 - 3, DERMAGA.z0 + 6, .1, 0xc8553d); perahu(DERMAGA.x1 + 3.4, DERMAGA.z0 + 9, -.15, 0x3a7ad8); perahu(-30, ZC + 8, 1.2, 0xe0a020); perahu(40, ZC - 18, 2.3, 0x2a9a9a);
  { const g = new THREE.Group(); [[0, 0], [5, 0], [0, 5], [5, 5]].forEach(([a, b]) => { const t = box(.3, 3, .3, 0x8a6a3a, .05); t.position.set(a - 2.5, 0, b - 2.5); g.add(t); });
    const lt = box(6, .3, 6, 0xc8a070, .05); lt.position.y = .6; g.add(lt); g.position.set(-55, 0, ZC - 6); G.add(g); }   // keramba ikan
  // sungai masuk dari utara (x≈0) & keluar ke timur (z≈ZC), sampai menembus hutan; jembatan di tiap jalan
  water(0, (ZC - AZ + 2 + ZU - 400) / 2, 11, (ZC - AZ + 2) - (ZU - 400));
  water((AX - 2 + W / 2 + 400) / 2, ZC, (W / 2 + 400) - (AX - 2), 11);
  for (let j = 0; j < NJ; j++) if (-j * P < ZC - AZ) slab(0, .3, -j * P, 15, .4, 5, 0x9a6a3a);
  slab(XS, .3, ZC, 6, .4, 15, 0x9a6a3a);

  // ---- jalan: 7 jalan lurus (terputus di danau), jalan tepi kiri/kanan, jalan ke terminal ----
  for (let j = 0; j < NJ; j++) {
    const z = -j * P, dz = Math.abs(z - ZC);
    if (dz < AZ + MG) { const xi = (AX + 5.5) * Math.sqrt(Math.max(0, 1 - (dz / (AZ + 5.5)) ** 2)); [-1, 1].forEach(sd => road(sd * (XS + xi) / 2, z, XS - xi + 4, 4)); }
    else road(0, z, 2 * XS + 4, 4);
  }
  [-1, 1].forEach(sd => road(sd * XS, ZU / 2 + 2, 4, -ZU + 8));
  fasum(0, ZT, 40, 22); road(0, ZT / 2 - 2, 8, ZT - 6); road(0, ZT + 11 + 170, 8, 340);

  // ---- petak: tiap jalan, tiap kolom, sisi utara (rot 0) lalu sisi selatan (rot π); petak di air/jalan dilewati ----
  const fasPetak = new Map(); FASUM.forEach((f, k) => { fasPetak.set(`${f[0]},${f[1]},${f[2]}`, k); fasPetak.set(`${f[0]},${f[1]},${f[2] + 1}`, k); });
  const kena = (x, z) => diDanau(Math.max(x - 5, Math.min(0, x + 5)), Math.max(z - 4.5, Math.min(ZC, z + 4.5)), MG) || sungaiU(x - 5, z) || sungaiU(x + 5, z) || sungaiU(x, z) || sungaiT(x, z - 4.5) || sungaiT(x, z + 4.5);
  const LOTS = [], sisa = [];
  for (let j = 0; j < NJ; j++) for (let i = 0; i < NC; i++) {
    const x = -W / 2 + SP / 2 + i * SP;
    for (const sd of [-1, 1]) {
      const z = -j * P + sd * 7;
      if (fasPetak.has(`${j},${sd},${i}`)) continue;
      if (kena(x, z) || (j === 0 && sd > 0 && Math.abs(x) < 10)) continue;
      (LOTS.length < 200 ? LOTS : sisa).push({n: LOTS.length + 1, cx: x, cz: z, y: 0, rot: sd < 0 ? 0 : Math.PI});
    }
  }
  // petak lebih (tidak dipakai rumah) = kebun pohon
  sisa.forEach(l => { tree(l.cx - 2, l.cz, 1.1); tree(l.cx + 2.5, l.cz + 1.5, .9); });
  // pohon peneduh di tepi danau
  for (let k = 0; k < 26; k++) { const a = rnd() * Math.PI * 2, rx = AX + MG - .5, rz = AZ + MG - .5, x = Math.cos(a) * rx, z = ZC + Math.sin(a) * rz;
    if (Math.abs(x) < 10 || (x > AX - 10 && Math.abs(z - ZC) < 10) || (Math.abs(x - 19) < 8 && z > ZC + AZ - 4)) continue; tree(x, z, .9 + rnd() * .4); }
  // hutan pembatas (celah: jalan gapura di selatan, sungai di utara & timur)
  const hx0 = -XS - 10, hx1 = XS + 10, hz0 = ZU - 22, hz1 = ZT + 18;
  hutan(G, hutanPts({x0: hx0, x1: hx1, z0: hz0, z1: hz1, W: o.hemat ? 120 : 240, st: 8,
    skip: (x, z) => (z > hz1 - 4 && Math.abs(x) < 16) || (Math.abs(x - BANDARA.x) < 44 && Math.abs(z - BANDARA.z) < 48) || (z < hz0 + 4 && Math.abs(x) < 16) || (x > hx1 - 4 && Math.abs(z - ZC) < 16)}));

  // ---- fasum TERSEBAR (Huda 6 Nov 2026), menghadap jalan; lahan tanpa aset = kosong untuk voting ----
  const gF = new THREE.Group(); sc.add(gF); const bangunan = [], lahanKosong = [];
  for (const [j, sd, s0, k, nama] of FASUM) {
    const x = -W / 2 + SP * (s0 + 1), z = -j * P + sd * 10.6, f = fasum(x, z, 21, 17.4);
    if (!k) { lahanKosong.push({x, z, y: 0, g: f}); continue; }
    f.children.slice(1).forEach(c => f.remove(c));
    const m = F[k](); m.scale.setScalar(VS); if (sd > 0) m.rotation.y = Math.PI; m.position.set(x * VS, 0, z * VS); gF.add(m);
    bangunan.push({position: new THREE.Vector3(m.position.x, 0, m.position.z), nama, ...F.pisahFasum(m)});
  }
  // KAWASAN BANDARA (Huda 11 Nov 2026: "Bandara dengan 5 terminal", ditaruh di kawasan baru di luar Tlaga): lahan besar ±5 kali
  // lahan fasum di selatan hutan, sebelah barat jalan gapura. lahanKosong[2]; aset F.bandaraBesar diputar −90° (gedung menghadap jalan).
  { const f = fasum(BANDARA.x, BANDARA.z, 46, 66); lahanKosong.push({x: BANDARA.x, z: BANDARA.z, y: 0, g: f, ry: -Math.PI / 2, besar: 3.2});
    road(BANDARA.x + 26, BANDARA.z, 4, 66); road((BANDARA.x + 26 + 0) / 2, BANDARA.z, -BANDARA.x - 26, 4); }
  bangunan.push({position: V3(0, 0, (ZC - 4) * VS), nama: '🛶 Danau Tlaga', tinggi: 4 * VS, rect: null});
  bangunan.push({position: V3(19 * VS, 0, (DERMAGA.z0 + 4) * VS), nama: '⚓ Dermaga', tinggi: 3 * VS, rect: null});
  bangunan.push({position: V3(0, 0, ZT * VS), nama: '🚌 Terminal & Gapura Kotak Tlaga', tinggi: 3 * VS, rect: null});

  // ---- kavling bertahap: warga No. 661+ ----
  const info = {lots: {}, G, light: d, grupFasum: gF, bangunan, lahanKosong, dusun: 'tlaga'};
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
  info.batas = {x0: -(XS + 4) * VS, x1: (XS + 4) * VS, z0: (ZU - 14) * VS, z1: (BANDARA.z + 36) * VS};   // sampai kawasan bandara
  info.spawn = V3(0, 0, (ZT - 14) * VS);
  // air tidak bisa diinjak (kecuali dermaga & jembatan) — dipakai bebas() dan navigasi di game.js
  info.air = (x, z) => {
    const lx = x / VS, lz = z / VS;
    if (lx > DERMAGA.x0 && lx < DERMAGA.x1 && lz > DERMAGA.z0 && lz < DERMAGA.z1) return false;
    if (diDanau(lx, lz, 1)) return true;
    if (sungaiU(lx, lz)) return !jembatanU(lz);
    if (sungaiT(lx, lz)) return !jembatanT(lx);
    return false;
  };
  info.dekatAir = (x, z) => { const lx = x / VS, lz = z / VS; return diDanau(lx, lz, 9) || (Math.abs(lx) < 12 && lz < ZC - AZ) || (Math.abs(lz - ZC) < 12 && lx > AX); };
  info.arahAir = (x, z) => { const lx = x / VS, lz = z / VS;
    if (diDanau(lx, lz, 12)) return V3(0, 0, ZC * VS);
    return Math.abs(lx) < 12 ? V3(0, 0, z) : V3(x, 0, ZC * VS); };   // mancing menghadap danau/sungai (Huda 6 Nov: semua dusun bisa mancing)
  // jalur NPC: jalan lurus yang tidak memotong danau + jalan tepi kiri/kanan sebagai penghubung
  const zs = []; for (let j = 0; j < NJ; j++) if (Math.abs(-j * P - ZC) > AZ + MG) zs.push(-j * P * VS);
  const xs = [-XS, -W / 4, 0, W / 4, XS].map(v => v * VS);
  info.jalur = {xs, zs, bolehNaik: i => i === 0 || i === xs.length - 1};
  const wr = FASUM[0], wx = -W / 2 + SP * (wr[2] + 1), lk = lahanKosong[0];
  info.tempatNPC = {warung: V3((wx + 5) * VS, 0, 1.2 * VS), balai: V3(0, 0, (ZT - 8) * VS), sungai: V3(-36 * VS, 0, (ZC + AZ + 3.5) * VS), sawah: V3(-70 * VS, 0, (ZC + AZ + 6) * VS), main: V3(lk.x * VS, 0, lk.z * VS)};
  info.danau = {x: 0, z: ZC * VS, rx: AX * VS, rz: AZ * VS};
  return info;
}

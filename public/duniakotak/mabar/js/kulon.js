// DUSUN 2 · KOTAK KULON untuk game: denah BAKU (desa-kotak/denah-dusun-BAKU-2026-11-02/kode/dusun-lain.js, kulon()) — tidak diubah,
// hanya ditambah: kavling dibangun bertahap, bangunan fasum di puncak bukit, dan fungsi tinggi pijakan (teras + tanjakan).
// Kavling lokal 1–200 = warga No. 261–460 (RT 01 Jl. Teh di kaki bukit … RT 10 Jl. Kunyit di atas).
import {THREE, rnd, reseed} from './lib.js';
import {lot2, LOT_W, LOT_D, VS, V3, fasum2, vTree, box, hutan, hutanPts, nameTex} from './desa.js';
import * as F from './aset/fasum.js';

export const JALAN_KULON = ['Teh','Kopi','Cengkeh','Kayu Manis','Pala','Lada','Vanili','Kakao','Jahe','Kunyit'];
export const AWAL_KULON = 260;   // warga No. 261 = kavling 1 Kotak Kulon
const N = 20, SP = 11, L = N * SP, STEP = 2.6, DEP = 17;
const yt = 10 * STEP, zt = -10 * DEP - 26;

export function kulon(sc, o = {}) {
  reseed(506);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x9ab890, 1.25));
  const d = new THREE.DirectionalLight(0xfff2d8, 2.4); d.castShadow = true; d.shadow.mapSize.set(o.sm || 2048, o.sm || 2048);
  const R0 = o.shadowR || 70; Object.assign(d.shadow.camera, {left: -R0, right: R0, top: R0, bottom: -R0, far: 300, near: 1}); d.shadow.bias = -.0015; d.shadow.normalBias = 1.5;
  sc.add(d); sc.add(d.target);
  const G = new THREE.Group(); G.scale.setScalar(VS); sc.add(G);
  const mat = (c, r = .9) => new THREE.MeshStandardMaterial({color: c, roughness: r});
  const slab = (x, y, z, w, h, dd, c, ry = 0, r = .9) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat(c, r)); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; m.castShadow = h > .6; G.add(m); return m; };
  const road = (x, z, w, dd, y = 0) => slab(x, y + .08, z, w, .16, dd, 0xd8c49c);
  const fas = [];
  const fasum = (x, z, w, dd, y = 0) => { const k = G.children.length; fasum2(G, x, z, w, dd); const g = G.children[k]; g.position.y = y; fas.push({p: V3(x * VS, y * VS, z * VS), g}); return g; };
  const tree = (x, z, s = 1, y = 0) => { const k = G.children.length; vTree(G, x, z, s); G.children[k].position.y += y; };
  const water = (x, z, w, dd) => slab(x, -.1, z, w, .3, dd, 0x3f9be0, 0, .25);

  // ---- persis kulon() di denah BAKU ----
  slab(0, -.06, -60, L + 900, .1, 1200, 0x5a9a40);
  water(0, 40, L + 900, 14); slab(0, .1, 32, L + 900, .3, 2, 0xb8a57a); slab(0, .1, 48, L + 900, .3, 2, 0xb8a57a);
  fasum(0, 18, 60, 18, 0); road(0, 4.5, L + 40, 8);
  const LOTS = [];
  for (let j = 0; j < 10; j++) {
    const y = j * STEP, z = -j * DEP, xo = (j % 2 ? 3 : -3);
    if (j > 0) slab(xo, y / 2, z - 6, L + 12, y, DEP + .2, 0x8aa860);
    road(xo, z + .5, L + 12, 4, y);
    for (let i = 0; i < N; i++) LOTS.push({n: LOTS.length + 1, cx: xo - L / 2 + SP / 2 + i * SP, cz: z - 6.5, y, rot: 0});
    slab(xo, y + STEP / 2, z - 11.6, L + 12, STEP, 1.2, 0x9a8a6a);
    for (let k = 0; k < 2; k++) slab(xo, y + STEP + .45, z - 12.6 - k * 1.3, L, .9, 1, new THREE.Color().setHSL(.3, .5, .31 + k * .03));
    if (j < 9) [-1, 1].forEach(sd => { const r = slab(sd * (L / 2 + 9), y + STEP / 2 + .1, z - 8, 6, .3, Math.hypot(DEP, STEP) + 1, 0xd8c49c); r.rotation.x = Math.atan2(STEP, DEP); });
  }
  [-1, 1].forEach(sd => {
    for (let j = 0; j < 10; j++) for (let k = 0; k < 6; k++) slab(sd * (L / 2 + 66), j * STEP + .5, -j * DEP - 2 - k * 2.2, 88, 1, 1.1, new THREE.Color().setHSL(.29, .5, .3 + (k % 2) * .03));
    for (let j = 0; j < 10; j++) slab(sd * (L / 2 + 66), j * STEP / 2, -j * DEP - 6, 90, j * STEP + .1, DEP, 0x6aa848);
  });
  slab(0, yt / 2, zt, L + 30, yt, 52, 0xa98a5c);
  { const z9 = -9 * DEP + .5, ze = zt + 26; const r = slab(0, (9 * STEP + yt) / 2 + .1, (z9 + ze) / 2, 8, .3, Math.hypot(z9 - ze, yt - 9 * STEP) + 2, 0xd8c49c); r.rotation.x = Math.atan2(yt - 9 * STEP, z9 - ze);
    [-1, 1].forEach(sd => { const q = slab(sd * (L / 2 + 9), (9 * STEP + yt) / 2 + .1, (z9 + ze) / 2, 6, .3, Math.hypot(z9 - ze, yt - 9 * STEP) + 2, 0xd8c49c); q.rotation.x = Math.atan2(yt - 9 * STEP, z9 - ze); }); }
  road(0, 200, 8, 300); road(0, 29.5, 8, 5); slab(0, .5, 40, 10, .5, 18, 0x9a6a3a);
  const atas = []; for (let i = 0; i < 5; i++) atas.push(fasum(-88 + i * 44, zt, 42, 40, yt));
  const tw = new THREE.Group(); [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(([a, b]) => { const p = box(.4, 10, .4, 0x6a4426, .04); p.position.set(a, 5, b); tw.add(p); });
  const fl = box(5, .4, 5, 0x8a5a2a, .04); fl.position.y = 10; tw.add(fl); const rf = box(6, 1.4, 6, 0xc8553d, .2); rf.position.y = 12.4; tw.add(rf); tw.position.set(L / 2 + 6, yt, zt); G.add(tw);
  for (let i = 0; i < 14; i++) tree(-L / 2 - 20 - rnd() * 60, zt - 30 - rnd() * 30, 1.4, yt * .6);
  hutan(G, hutanPts({x0: -L / 2 - 118, x1: L / 2 + 118, z0: zt - 32, z1: 56, W: o.hemat ? 120 : 240, st: 8, skip: (x, z) => (z > 26 && z < 62) || (z >= 62 && Math.abs(x) < 20), yf: (x, z) => z < zt + 26 ? yt : Math.max(0, Math.min(9, Math.round(-(z - 4) / DEP))) * STEP}));

  // ---- tambahan game: bangunan fasum di puncak bukit (dua per lahan), lahan ke-5 tetap kosong untuk voting ----
  const PASANG = [[0, 'sekolah', '🏫 SD Kotak Kulon', 'warung', '🛒 Warung Desa'], [1, 'masjid', '🕌 Masjid', 'gereja', '⛪ Gereja'], [2, 'katedral', '⛪ Gereja Katolik', 'pura', '🛕 Pura'], [3, 'vihara', '☸️ Vihara', 'klenteng', '🏮 Klenteng']];
  const gF = new THREE.Group(); sc.add(gF); const bangunan = [];
  for (const [i, k1, n1, k2, n2] of PASANG) {
    const f = atas[i]; f.children.slice(1).forEach(c => f.remove(c));
    [[k1, n1, -10.5], [k2, n2, 10.5]].forEach(([k, nama, dx]) => {
      const m = F[k](); m.scale.setScalar(VS); m.position.set((-88 + i * 44 + dx) * VS, yt * VS, (zt + 4) * VS); gF.add(m);
      // pintu terbuka + ruang dalam (6 Nov 2026): tabrakan per dinding, bagian atas dipisah (game.js)
      bangunan.push({position: new THREE.Vector3(m.position.x, m.position.y, m.position.z), nama, ...F.pisahFasum(m)});
    });
  }
  bangunan.push({position: V3((L / 2 + 6) * VS, yt * VS, zt * VS), nama: '🔭 Gardu Pandang', tinggi: 15 * VS, rect: null});
  bangunan.push({position: V3(0, 0, 18 * VS), nama: '🚌 Terminal & Gapura Kotak Kulon', tinggi: 3 * VS, rect: null});

  // ---- kavling bertahap: warga No. 261+ ----
  const info = {lots: {}, G, light: d, grupFasum: gF, bangunan, dusun: 'kulon'};
  const nm = o.names || {};
  const bl = l => {
    const no = AWAL_KULON + l.n, isi = o.isFilled ? o.isFilled(no) : !!nm[no];
    const roofs2 = [0xc8553d, 0x3a7ad8, 0x3aa860, 0xe0a020, 0x9a5ad8, 0xd84a8a, 0x2a9a9a, 0xe06a2a];
    const g = lot2(G, l.cx, l.cz, l.rot, {lh: .02, n: no, filled: isi, fh: .32, roof: roofs2[(no * 5) % roofs2.length], crop: ['wortel', 'gandum', 'jagung', 'tomat'][no % 4], fruit: [0xff3a3a, 0xffa020, 0xffe040][no % 3]});
    g.position.y = l.y;
    if (isi) { const st = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.15, .45), [0, 1, 2, 3, 4, 5].map(k => new THREE.MeshStandardMaterial({color: k === 4 ? 0xffffff : 0x9a9a9a, roughness: .9, map: k === 4 ? nameTex(nm[no] || '', no) : null}))); st.position.set(.2, .58, LOT_D / 2 - .5); st.castShadow = true; g.add(st); }
    return g;
  };
  LOTS.forEach(l => {
    const no = AWAL_KULON + l.n, hd = LOT_D / 2;
    info.lots[no] = {c: V3(l.cx * VS, l.y * VS, l.cz * VS), gate: V3((l.cx - 2) * VS, l.y * VS, (l.cz + hd) * VS), stone: V3((l.cx - 2) * VS, l.y * VS, (l.cz + hd - 1.3) * VS), dir: 1, lokal: l.n};
  });
  info.buildLot = no => { const l = LOTS[no - AWAL_KULON - 1]; return l ? bl(l) : null; };
  // batas jalan kaki: teras + tanjakan, kaki bukit sampai tepi sungai
  info.batas = {x0: -(L / 2 + 12) * VS, x1: (L / 2 + 12) * VS, z0: (zt - 24) * VS, z1: 30 * VS};
  info.spawn = V3(6 * VS, 0, 3 * VS);
  // tinggi pijakan (satuan dunia). Teras j: z ∈ (z_j − 11, z_{j−1} − 11]; tanjakan di ujung teras dan di tengah menuju puncak.
  info.tanah = (x, z) => {
    const lx = x / VS, lz = z / VS;
    if (Math.abs(Math.abs(lx) - (L / 2 + 9)) < 3.2) {          // tanjakan samping
      for (let j = 0; j < 10; j++) { const z0 = -j * DEP + .6, z1 = -j * DEP - 16.6; if (lz <= z0 && lz >= z1) return (j * STEP + (z0 - lz) / (z0 - z1) * STEP) * VS; }
    }
    if (Math.abs(lx) < 4.2 || Math.abs(Math.abs(lx) - (L / 2 + 9)) < 3.2) {   // tanjakan ke puncak
      const z0 = -9 * DEP + .5, z1 = zt + 26; if (lz <= z0 && lz >= z1) return (9 * STEP + (z0 - lz) / (z0 - z1) * (yt - 9 * STEP)) * VS;
    }
    if (lz < -9 * DEP - 11) return Math.abs(lx) < L / 2 + 15 ? yt * VS : 9 * STEP * VS;
    const j = Math.max(0, Math.min(9, Math.ceil((-lz - 11) / DEP)));
    return j * STEP * VS;
  };
  info.dekatAir = (x, z) => z > 27 * VS;   // tepi sungai di kaki bukit
  // jalur NPC: jalan teras (tanjakan hanya di ujung kiri/kanan)
  const xs = [-(L / 2 + 9), -L / 4, 0, L / 4, L / 2 + 9].map(v => v * VS), zs = []; for (let j = 0; j < 10; j++) zs.push((-j * DEP + .5) * VS);
  info.jalur = {xs, zs, bolehNaik: i => i === 0 || i === xs.length - 1};
  info.tempatNPC = {warung: V3(-8 * VS, 0, 16 * VS), balai: V3(78 * VS, yt * VS, (zt + 16) * VS), sungai: V3(-30 * VS, 0, 29 * VS), sawah: V3(-60 * VS, STEP * VS, -12.8 * VS), main: V3(88 * VS, yt * VS, zt * VS)};
  return info;
}

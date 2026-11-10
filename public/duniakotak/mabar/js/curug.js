// DUSUN 3 · KOTAK CURUG untuk game: lereng gunung dari denah BAKU (desa-kotak/denah-dusun-BAKU-2026-11-02/kode/dusun-lain.js, ardi()).
// 6 Nov 2026 Huda membuka kunci denah: fasum disebar ke tiap teras (sisi depan & belakang jalan, selang-seling), bukan di kaki gunung lagi.
// Tambahan game: kavling dibangun bertahap dan fungsi tinggi pijakan (teras + tikungan tanjakan).
// Kavling lokal 1–200 = warga No. 461–660. Teras j (0 = kaki gunung): kavling 40j+1 … 40j+40, RT 2j+1 & 2j+2. Dibuka 6 Nov 2026 saat Kulon penuh.
import {THREE, rnd, reseed} from './lib.js';
import {aturTipis, lot2, LOT_W, LOT_D, VS, V3, fasum2, box, hutan, hutanPts, nameTex} from './desa.js';
import * as F from './aset/fasum.js';

export const JALAN_CURUG = ['Pinus','Cemara','Jati','Mahoni','Damar','Rasamala','Puspa','Pakis','Edelweis','Akasia'];
export const AWAL_CURUG = 460;   // warga No. 461 = kavling 1 Kotak Curug
// Teras 22 petak (20 rumah + 1 lahan fasum 2 petak di tiap sisi jalan), diperdalam (DEP 32 → 39) supaya gedung fasum muat.
const N = 20, NK = N + 2, SP = 11, L = NK * SP, STEP = 6, DEP = 39;
const yb = 5 * STEP, zb = -4.5 * DEP - 36;   // asli (DEP 32): −180
const dF = DEP / 2 - 16, ZR = 13.25 + dF;     // kaki gunung digeser keluar teras 0 (jalan kaki gunung z = ZR)
// [teras, sisi (-1 belakang jalan, 1 depan jalan), petak awal (0..20), aset, nama]; aset null = lahan kosong untuk voting
const FASUM_TERAS = [[0, 1, 15, 'warung', '🛒 Warung Desa'], [0, -1, 4, 'sekolah', '🏫 SD Kotak Curug'], [1, 1, 8, 'masjid', '🕌 Masjid'], [1, -1, 17, null],
  [2, 1, 2, 'gereja', '⛪ Gereja'], [2, -1, 10, 'katedral', '⛪ Gereja Katolik'], [3, 1, 13, 'pura', '🛕 Pura'], [3, -1, 3, null], [4, 1, 6, 'vihara', '☸️ Vihara'], [4, -1, 14, 'klenteng', '🏮 Klenteng']];

export function curug(sc, o = {}) {
  aturTipis(.02);   // bedeng kebun & tanah kavling tipis seperti Kotak Wetan
  reseed(500 + 'ardi'.length);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x9ab890, 1.25));
  const d = new THREE.DirectionalLight(0xfff2d8, 2.4); d.castShadow = true; d.shadow.mapSize.set(o.sm || 2048, o.sm || 2048);
  const R0 = o.shadowR || 70; Object.assign(d.shadow.camera, {left: -R0, right: R0, top: R0, bottom: -R0, far: 300, near: 1}); d.shadow.bias = -.0015; d.shadow.normalBias = 1.5;
  sc.add(d); sc.add(d.target);
  const G = new THREE.Group(); G.scale.setScalar(VS); sc.add(G);
  const mat = (c, r = .9) => new THREE.MeshStandardMaterial({color: c, roughness: r});
  const slab = (x, y, z, w, h, dd, c, ry = 0, r = .9) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat(c, r)); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; m.castShadow = h > .6; G.add(m); return m; };
  const road = (x, z, w, dd, y = 0, ry = 0) => slab(x, y + .08, z, w, .16, dd, 0xd8c49c, ry);
  const fas = [];
  const fasum = (x, z, w, dd, y = 0) => { const k = G.children.length; fasum2(G, x, z, w, dd); const g = G.children[k]; g.position.y = y; fas.push({p: V3(x * VS, y * VS, z * VS), g}); return g; };
  const pine = (x, z, s = 1, y = 0) => { const g = new THREE.Group(); const t = box(.5, 1.6, .5, 0x6a4426, .04); t.position.y = .8; g.add(t); [[3, 1.6], [2.3, 2.8], [1.5, 3.9], [.8, 4.8]].forEach(([w, h], i) => { const c = box(w, 1.2, w, new THREE.Color().setHSL(.36, .5, .22 + i * .03), .12); c.position.y = h; g.add(c); }); g.scale.setScalar(s); g.position.set(x, y, z); g.traverse(m => { if (m.isMesh) m.castShadow = true; }); G.add(g); };
  const water = (x, z, w, dd, y = -.1, c = 0x3f9be0) => slab(x, y, z, w, .3, dd, c, 0, .25);
  const terjun = m => { m.material.emissive = new THREE.Color(0x5a9ad0); m.material.emissiveIntensity = .45; m.receiveShadow = false; m.castShadow = false; };

  // ---- dari ardi() di denah BAKU (ukuran teras mengikuti DEP/NK baru) ----
  slab(0, -.06, -90, L + 900, .1, 1200, 0x4f8a3e);
  fasum(195, 30 + dF, 40, 30, 0); road((-L / 2 - 11 + 215) / 2, ZR, L / 2 + 11 + 215, 3); [-1, 1].forEach(sd => road(sd * (L / 2 + 9), ZR / 2, 4, ZR)); road(195, (44 + dF + 350) / 2, 8, 350 - 44 - dF); slab(L / 2 + 40, .4, ZR, 14, .4, 5, 0x9a6a3a);
  const LOTS = [], lahan = [];
  for (let j = 0; j < 5; j++) {
    const y = j * STEP, z = -j * DEP;
    slab(0, y / 2, z, L + 28, y + .1, DEP + .2, 0x6b8a52); [-1, 1].forEach(sd => slab(sd * (L / 2 + 100), y / 2, z, 172, y + .1, DEP + .2, 0x4f8a3e));
    road(0, z, L + 14, 4, y);
    const sB = FASUM_TERAS.find(f => f[0] === j && f[1] === -1)[2], sD = FASUM_TERAS.find(f => f[0] === j && f[1] === 1)[2];
    for (let i = 0; i < NK; i++) { const x = -L / 2 + SP / 2 + i * SP; if (i !== sB && i !== sB + 1) LOTS.push({n: LOTS.length + 1, cx: x, cz: z - 7, y, rot: 0}); if (i !== sD && i !== sD + 1) LOTS.push({n: LOTS.length + 1, cx: x, cz: z + 7, y, rot: Math.PI}); }
    if (j < 4) { const sd = j % 2 ? -1 : 1; const cx = sd * (L / 2 + 7), cz = z - DEP / 2; for (let a = 0; a <= 24; a++) { const t = -Math.PI / 2 + a / 24 * Math.PI; const x = cx + sd * Math.cos(t) * DEP / 2, zz = cz + Math.sin(t) * DEP / 2; const up = zz <= z - DEP / 2; const base = up ? y + STEP : y; const h = up ? y + STEP : y + STEP * (1 - (zz - (z - DEP / 2)) / (DEP / 2)); if (h - base > .2) slab(x, (base + h) / 2, zz, 6.2, h - base, 6.2, 0xa98a5c); road(x, zz, 6, 6, h); } }
    for (let k = 0; k < (j < 4 ? 18 : 0); k++) pine(-L / 2 + rnd() * L, z - DEP / 2 + (rnd() - .5) * 3, 1.1 + rnd() * .5, y + STEP * .5);
  }
  for (let k = 0; k < 160; k++) { const sd = rnd() < .5 ? -1 : 1; const x = sd * (L / 2 + 30 + rnd() * 110), z = 40 - rnd() * 200; if ((sd > 0 && z > -12) || (sd > 0 && Math.abs(x - L / 2 - 40) < 12) || (sd > 0 && z > zb && z < zb + 30)) continue; if (o.hemat && k % 2) continue; pine(x, z, 1.3 + rnd() * .9, Math.max(0, -z / DEP) * STEP * .9); }
  [[0, 24, 170, 40], [0, 48, 120, 30], [-10, 70, 70, 22], [-6, 88, 34, 16]].forEach(([x, h, w, dd], i) => slab(x, (yb + h) / 2, zb - 30 - i * 18, w * 2.4, yb + h, dd + 30, new THREE.Color().setHSL(.31 - i * .03, .4, .17 + i * .035)));
  for (let k = 0; k < 90; k++) { const i = Math.floor(rnd() * 3); const w = [170, 120, 70][i] * 2.4, h = [24, 48, 70][i]; const px = (rnd() - .5) * w * .95, pz = zb - 30 - i * 18 + (rnd() - .5) * 20 + 12; if (o.hemat && k % 2) continue; pine(px, pz, 1.3, yb + h); }
  slab(0, yb / 2, zb + 15, L + 40, yb, 38, 0x4f8a3e);
  [[yb + 36, zb - 17.3, 24], [yb + 12, zb + 5.7, 24]].forEach(([y, z, h]) => terjun(slab(30, y, z, 12, h, 1.2, 0x9ad4ff, 0, .2))); water(30, zb - 6.5, 12, 23, yb + 24.1); water(30, zb - 27, 16, 18, yb + 48.1);
  water(30, zb + 13, 36, 18.6, yb + .1); water((48 + L / 2 + 45) / 2, zb + 14, L / 2 + 45 - 48, 8, yb + .1); water(L / 2 + 40, zb + 21, 10, 22, yb + .1);
  for (let j = 5; j >= 0; j--) { water(L / 2 + 40, -j * DEP, 10, DEP, j * STEP + .05); if (j < 5) terjun(slab(L / 2 + 40, j * STEP + STEP / 2 + .1, -j * DEP - DEP / 2 + .7, 10, STEP + .3, 1.4, 0x9ad4ff, 0, .2)); } water(L / 2 + 40, 316, 10, 600, .05);
  { const y4 = 4 * STEP, z4 = -4 * DEP, ze = zb + 34; const r = slab(L / 2 + 9, (y4 + yb) / 2 + .1, (z4 + ze) / 2, 5, .3, Math.hypot(z4 - ze, yb - y4) + 2, 0xd8c49c); r.rotation.x = Math.atan2(yb - y4, z4 - ze); road((L / 2 + 11 + 12) / 2, ze - 3, L / 2 + 11 - 12, 4, yb); slab(30, yb + .2, zb + 27, 10, .4, 10.5, 0x9a6a3a); }
  hutan(G, hutanPts({x0: -L / 2 - 190, x1: L / 2 + 190, z0: zb - 90, z1: 52 + dF, W: o.hemat ? 120 : 240, st: 8, skip: (x, z) => (z > 52 + dF && (Math.abs(x - 195) < 20 || Math.abs(x - L / 2 - 40) < 18)), yf: (x, z) => Math.max(0, Math.min(5, Math.round(-z / DEP))) * STEP}));

  // ---- tambahan game: fasum TERSEBAR di teras (Huda 6 Nov 2026), menghadap jalan teras; lahan tanpa aset = kosong untuk voting ----
  const gF = new THREE.Group(); sc.add(gF); const bangunan = [], lahanKosong = [];
  for (const [j, sd, s0, k, nama] of FASUM_TERAS) {
    const x = -L / 2 + SP * (s0 + 1), z = -j * DEP + sd * 10.6, y = j * STEP, f = fasum(x, z, 21, 17.4, y);
    if (!k) { lahanKosong.push({x, z, y, g: f}); continue; }
    f.children.slice(1).forEach(c => f.remove(c));
    const m = F[k](); m.scale.setScalar(VS); if (sd > 0) m.rotation.y = Math.PI; m.position.set(x * VS, y * VS, z * VS); gF.add(m);
    bangunan.push({position: new THREE.Vector3(m.position.x, m.position.y, m.position.z), nama, ...F.pisahFasum(m)});
  }
  // Sirkuit Reli Kotak (Huda 10 Nov 2026): game mobil reli punya lahan sendiri (bukan lahan voting) di depan kaki gunung,
  // sebelah kiri balai, gerbangnya menghadap jalan kaki gunung. Warga di dalam area dapat tombol 🏁 Reli → /duniakotak/reli/.
  { const x = -72, z = ZR + 11.6, f = fasum(x, z, 21, 17.4, 0); f.children.slice(1).forEach(c => f.remove(c)); road(x, ZR + 2, 5, 3);
    const m = F.sirkuitReli(); m.scale.setScalar(VS); m.rotation.y = Math.PI; m.position.set(x * VS, 0, z * VS); gF.add(m);
    bangunan.push({position: new THREE.Vector3(m.position.x, 0, m.position.z), nama: '🏁 Sirkuit Reli Kotak', ...F.pisahFasum(m)}); }
  bangunan.push({position: V3(30 * VS, yb * VS, (zb + 20) * VS), nama: '💦 Air Terjun Curug', tinggi: 14 * VS, rect: null});
  bangunan.push({position: V3(195 * VS, 0, (30 + dF) * VS), nama: '🚌 Terminal & Gapura Kotak Curug', tinggi: 3 * VS, rect: null});

  // ---- kavling bertahap: warga No. 461+ ----
  const info = {lots: {}, G, light: d, grupFasum: gF, bangunan, lahanKosong, dusun: 'curug'};
  const nm = o.names || {};
  const roofs2 = [0xc8553d, 0x3a7ad8, 0x3aa860, 0xe0a020, 0x9a5ad8, 0xd84a8a, 0x2a9a9a, 0xe06a2a];
  const bl = l => {
    const no = AWAL_CURUG + l.n, isi = o.isFilled ? o.isFilled(no) : !!nm[no];
    const g = lot2(G, l.cx, l.cz, l.rot, {lh: .02, n: no, filled: isi, fh: .32, roof: roofs2[(no * 5) % roofs2.length], crop: ['wortel', 'gandum', 'jagung', 'tomat'][no % 4], fruit: [0xff3a3a, 0xffa020, 0xffe040][no % 3]});
    g.position.y = l.y;
    if (isi) { const st = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.15, .45), [0, 1, 2, 3, 4, 5].map(k => new THREE.MeshStandardMaterial({color: k === 4 ? 0xffffff : 0x9a9a9a, roughness: .9, map: k === 4 ? nameTex(nm[no] || '', no) : null}))); st.position.set(.2, .58, LOT_D / 2 - .5); st.castShadow = true; g.add(st); }
    return g;
  };
  LOTS.forEach(l => {
    const no = AWAL_CURUG + l.n, hd = LOT_D / 2, dir = l.rot ? -1 : 1;
    info.lots[no] = {c: V3(l.cx * VS, l.y * VS, l.cz * VS), gate: V3((l.cx - 2 * dir) * VS, l.y * VS, (l.cz + hd * dir) * VS), stone: V3((l.cx - 2 * dir) * VS, l.y * VS, (l.cz + (hd - 1.3) * dir) * VS), dir, lokal: l.n};
  });
  info.buildLot = no => { const l = LOTS[no - AWAL_CURUG - 1]; return l ? bl(l) : null; };
  info.batas = {x0: -(L / 2 + 7 + DEP / 2 + 6) * VS, x1: 214 * VS, z0: -(4.5 * DEP - 1) * VS, z1: (46 + dF) * VS};
  info.spawn = V3(0, 0, ZR * VS);
  // tinggi pijakan (satuan dunia): teras j di z ∈ [−DEP·j−DEP/2, −DEP·j+DEP/2]; tikungan tanjakan setengah lingkaran di ujung teras (bergantian kanan/kiri)
  info.tanah = (x, z) => {
    const lx = x / VS, lz = z / VS;
    if (lz > DEP / 2) return 0;
    for (let j = 0; j < 4; j++) {
      const sd = j % 2 ? -1 : 1, cx = sd * (L / 2 + 7), z0 = -j * DEP, cz = z0 - DEP / 2, r = Math.hypot(lx - cx, lz - cz);
      if (sd * (lx - cx) > -1 && Math.abs(r - DEP / 2) < 3.4 && lz <= z0 + 3 && lz >= z0 - DEP - 3) {
        const y = j * STEP; return (lz <= cz ? y + STEP : y + STEP * (1 - (Math.min(z0, lz) - cz) / (DEP / 2))) * VS;
      }
    }
    const j = Math.max(0, Math.min(4, Math.round(-lz / DEP)));
    return j * STEP * VS;
  };
  info.dekatAir = (x, z) => Math.abs(x / VS - (L / 2 + 40)) < 12;   // tepi sungai di sisi kanan
  info.arahAir = (x, z) => V3((L / 2 + 40) * VS, 0, z);   // mancing menghadap sungai (Huda 6 Nov: semua dusun bisa mancing)
  const xs = [-(L / 2 + 7), -L / 4, 0, L / 4, L / 2 + 7].map(v => v * VS), zs = [ZR * VS]; for (let j = 0; j < 5; j++) zs.push(-j * DEP * VS);
  info.jalur = {xs, zs, bolehNaik: () => false};
  const wr = FASUM_TERAS[0], wx = -L / 2 + SP * (wr[2] + 1), lk = lahanKosong[0];
  info.tempatNPC = {warung: V3((wx + 5) * VS, 0, 1.2 * VS), balai: V3(0, 0, (ZR + 5) * VS), sungai: V3((L / 2 + 31) * VS, 0, 4 * VS), sawah: V3(-60 * VS, STEP * VS, -DEP * VS), main: V3(lk.x * VS, lk.y * VS, lk.z * VS)};
  return info;
}

// DUSUN 5 · KOTAK SEGARA untuk game: dusun dengan peradaban paling maju (Huda 8 Nov 2026). Semua warga tinggal di apartemen,
// jadi desa cukup 5 dusun tapi warganya tidak terbatas. Rancangan: https://claude.ai/artifact/QoukFuxZb1BBXfobfL9PmN
// Letak di denah desa gabungan: timur Tlaga, TELUK di utara (pantai + Jl. Pesisir + dermaga), sungai di barat, terminal di selatan.
// 1 menara = 20 lantai hunian (Lt. 2–21) × 10 unit = 200 unit, Lt. 1 = lobi. Menara baru berdiri otomatis sesuai jumlah warga;
// menara 1–4 di baris depan (plaza di tengah), menara 5+ menyusun baris baru ke selatan (6 per baris).
// Alamat: urutan = No − 860; menara = ceil(urutan/200); lantai = floor(sisa/10) + 2; unit = sisa % 10 + 1. No. 861 = Menara 1 Unit 02-01.
// Lantai hunian TIDAK ada di dalam badan menara: tiap lantai punya petak sendiri jauh di luar dusun (dimuat satu lantai sekaligus,
// lift = layar muat) supaya HP ringan dan warga hanya terlihat oleh warga di lantai yang sama.
import {THREE, rnd, reseed} from './lib.js';
import {aturTipis, VS, V3, fasum2, vTree, box} from './desa.js';
import * as F from './aset/fasum.js';

export const AWAL_SEGARA = 860;
export const UNIT_LANTAI = 10, LANTAI_HUNI = 20, UNIT_MENARA = UNIT_LANTAI * LANTAI_HUNI;
const pad = v => String(v).padStart(2, '0');
export const unitDari = no => { const u = no - AWAL_SEGARA; if (u < 1) return null; const i = (u - 1) % UNIT_MENARA;
  return {t: Math.ceil(u / UNIT_MENARA), f: Math.floor(i / UNIT_LANTAI) + 2, k: i % UNIT_LANTAI + 1}; };
export const kodeUnit = no => { const a = unitDari(no); return a ? `Menara ${a.t} · Unit ${pad(a.f)}-${pad(a.k)}` : ''; };
export const noDari = (t, f, k) => AWAL_SEGARA + (t - 1) * UNIT_MENARA + (f - 2) * UNIT_LANTAI + k;

// ---- ukuran (satuan kavling, dikali VS di dunia) ----
const TW = 16, TD = 14, FH = 2.4, TH = (LANTAI_HUNI + 1) * FH;     // badan menara
const ZP = -30, ZS = -46, ZPL = 8, ZSEL = 36, XL = 112, XR = -110;  // Jl. Pesisir, garis laut utara, Jl. Plaza, Jl. Selatan, laut timur, sungai barat
const KOL2 = [-90, -62, -34, 34, 62, 90];
const slot = k => k <= 4 ? {x: [-80, -54, 54, 80][k - 1], z: -12} : {x: KOL2[(k - 5) % 6], z: 52 + Math.floor((k - 5) / 6) * 26};
const DERMAGA = {x0: -3, x1: 3, z0: ZS - 18, z1: ZS + 1};
// lahan fasum (sebaris di selatan Jl. Plaza, menghadap utara): [aset, nama]; null = kosong untuk voting
const FASUM = [['warung', '🛒 Warung Desa'], ['sekolah', '🏫 SD Kotak Segara'], ['masjid', '🕌 Masjid'], [null], ['gereja', '⛪ Gereja'],
  ['katedral', '⛪ Gereja Katolik'], ['pura', '🛕 Pura'], [null], ['vihara', '☸️ Vihara'], ['klenteng', '🏮 Klenteng']];

// lantai hunian: petak jauh di utara-timur (di luar batas dusun)
const FO = (t, f) => ({x: 600 + f * 200, z: -600 - t * 200});
const UX = k => -20 + ((k - 1) % 5) * 10, UZ = 7.1, RW = 4.9, RD = 3.92;    // pusat unit, setengah lebar/dalam ruangan (interior rumah × 2)
const LX = 32, LZ = 11.2;                                                  // setengah lantai yang bisa diinjak

function kanvas(w, h, gambar) { const c = document.createElement('canvas'); c.width = w; c.height = h; gambar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const papan = (teks, w = 512, h = 128, bg = '#101826', fg = '#5ff4ff', font = 900) => kanvas(w, h, (x) => {
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.font = `${font} ${Math.round(h * .5)}px Montserrat,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = fg; x.shadowBlur = h * .15; x.fillStyle = fg; x.fillText(teks, w / 2, h / 2 + h * .03); });

export function segara(sc, o = {}) {
  aturTipis(.02);
  reseed(500 + 'segara'.length);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x9ab0c0, 1.25));
  const d = new THREE.DirectionalLight(0xfff2d8, 2.4); d.castShadow = true; d.shadow.mapSize.set(o.sm || 2048, o.sm || 2048);
  const R0 = o.shadowR || 70; Object.assign(d.shadow.camera, {left: -R0, right: R0, top: R0, bottom: -R0, far: 300, near: 1}); d.shadow.bias = -.0015; d.shadow.normalBias = 1.5;
  sc.add(d); sc.add(d.target);
  const G = new THREE.Group(); G.scale.setScalar(VS); sc.add(G);
  const mat = (c, r = .9) => new THREE.MeshStandardMaterial({color: c, roughness: r});
  const neon = c => new THREE.MeshBasicMaterial({color: c});
  const slab = (x, y, z, w, h, dd, c, r = .9, par = G) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), typeof c === 'number' ? mat(c, r) : c); m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = h > .6; par.add(m); return m; };
  const aspal = (x, z, w, dd) => { slab(x, .06, z, w, .12, dd, 0x4a5058);
    if (w > dd) for (let a = x - w / 2 + 2; a < x + w / 2 - 2; a += 6) slab(a, .125, z, 2.6, .01, .25, 0xf4f4f4); else for (let a = z - dd / 2 + 2; a < z + dd / 2 - 2; a += 6) slab(x, .125, a, .25, .01, 2.6, 0xf4f4f4); };
  const tree = (x, z, s = 1) => vTree(G, x, z, s);
  const nm = o.names || {}, isi = o.isFilled || (n => !!nm[n]);

  // ---- jumlah warga Segara → jumlah menara (menara baru berdiri sendiri, tak terbatas) ----
  let maks = AWAL_SEGARA; for (const k of Object.keys(nm)) if (+k > maks) maks = +k; if (o.maksNo > maks) maks = o.maksNo;
  const nWarga = maks - AWAL_SEGARA, nMenara = Math.max(1, Math.ceil(nWarga / UNIT_MENARA));
  const sisaMenara = nWarga - (nMenara - 1) * UNIT_MENARA, proyekBaru = nWarga > 0 && sisaMenara >= UNIT_MENARA * .9;   // menara terakhir ≥ 90% → menara berikut mulai dibangun
  const sl = slot(nMenara + (proyekBaru ? 1 : 0)), ZT = Math.max(48, nMenara + (proyekBaru ? 1 : 0) >= 5 ? sl.z + 22 : 48);

  // ---- tanah kota, pantai utara & timur, laut, sungai barat ----
  slab(0, -.08, 0, 1400, .1, 1400, 0x6fae50);
  slab((XR + XL) / 2, -.02, (ZS + ZT + 14) / 2, XL - XR, .06, ZT + 14 - ZS, 0xc9cdd1);                    // paving kota
  slab((XR + XL) / 2, .0, ZS + 5, XL - XR + 10, .08, 10, 0xe2cf9a);                                     // pasir utara
  slab(XL - 4, .0, (ZS + ZT) / 2, 8, .08, ZT - ZS + 10, 0xe2cf9a);                                       // pasir timur
  slab(0, -.04, ZS - 200, 1400, .3, 400, 0x2f8fd0, .6);                                                 // TELUK (utara)
  slab(XL + 200, -.04, 0, 400, .3, 1400, 0x2f8fd0, .6);                                                 // laut timur
  slab(XR - 6, -.03, 0, 11, .3, 1400, 0x3f9be0, .25);                                                    // sungai barat
  // ombak tipis di garis pantai
  for (let x = XR; x < XL; x += 7) slab(x + rnd() * 3, .02, ZS - 1.2 - rnd(), 3 + rnd() * 3, .05, .5, 0xe8f6ff, .3);
  // dermaga + perahu
  slab(0, .32, (DERMAGA.z0 + DERMAGA.z1) / 2, DERMAGA.x1 - DERMAGA.x0, .4, DERMAGA.z1 - DERMAGA.z0, 0x8a6a4a);
  const perahu = (x, z, ry, c) => { const g = new THREE.Group(); const b = box(3, .9, 7, c, .3); b.position.y = .45; g.add(b); const ds = box(2.4, .3, 6.2, 0xe8e8e8, .1); ds.position.y = .8; g.add(ds);
    g.position.set(x, .1, z); g.rotation.y = ry; G.add(g); };
  perahu(-6.5, ZS - 9, .1, 0x2f6fd8); perahu(6.8, ZS - 13, -.15, 0xe0333a); perahu(-34, ZS - 20, 1.3, 0xf2c14a); perahu(40, ZS - 26, 2.2, 0x2a9a9a);

  // ---- jalan: Jl. Pesisir (utara), Jl. Plaza, Jl. Selatan, jalan tengah ke terminal, jalan tiap baris menara ----
  aspal((XR + XL - 8) / 2, ZP, XL - XR - 8, 6);
  aspal((XR + XL - 8) / 2, ZPL, XL - XR - 8, 4);
  aspal((XR + XL - 8) / 2, ZSEL, XL - XR - 8, 5);
  aspal(0, (ZPL + ZT) / 2, 6, ZT - ZPL);
  aspal(XR + 3, (ZP + ZT) / 2, 4, ZT - ZP);
  for (let z = 52 + 26; z <= sl.z; z += 26) aspal((XR + XL - 8) / 2, z - 13, XL - XR - 8, 4);
  // lampu jalan NEON (biru toska & merah muda bergantian) di sepanjang Jl. Pesisir
  for (let x = XR + 8, i = 0; x < XL - 8; x += 14, i++) for (const sd of [-1, 1]) {
    const z = ZP + sd * 4.2; slab(x, 1.6, z, .22, 3.2, .22, 0x2a3038); slab(x, 3.25, z - sd * .5, .25, .14, 1.2, 0x2a3038);
    slab(x, 3.12, z - sd * .9, .5, .1, .4, neon(i % 2 ? 0xff4fa8 : 0x3ef0ff)); }

  // ---- PLAZA: paving motif, videotron, kolam air mancur, bangku, palem ----
  slab(0, .07, -12, 72, .1, 34, 0xe8e2d4);
  for (let x = -34; x <= 34; x += 6) for (let z = -27; z <= 3; z += 6) if ((x + z) % 12 === 0) slab(x, .125, z, 2.6, .01, 2.6, 0xd2cab8);
  slab(0, .35, -14, 12, .5, 12, 0xbfc8d0); slab(0, .45, -14, 10.6, .4, 10.6, 0x3aa0e0, .2); slab(0, 1.6, -14, .8, 2.4, .8, 0xdfe6ec); slab(0, 2.9, -14, 2.6, .2, 2.6, 0x8fd8ff, .2);
  const vt = new THREE.Group(); vt.position.set(0, 0, 2); G.add(vt);                                 // VIDEOTRON menghadap utara (plaza)
  slab(-6.4, 4, 0, .5, 8, .5, 0x2a3038, .6, vt); slab(6.4, 4, 0, .5, 8, .5, 0x2a3038, .6, vt); slab(0, 6, 0, 13.6, 5.2, .6, 0x1a2028, .6, vt);
  const layar = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 4.6), new THREE.MeshBasicMaterial({map: kanvas(1024, 368, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#152a5c'); g.addColorStop(1, '#6a1f6e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.fillStyle = '#5ff4ff'; x.font = '900 46px Montserrat,sans-serif'; x.fillText('SELAMAT DATANG DI', w / 2, 110);
    x.fillStyle = '#ffffff'; x.font = '900 96px Montserrat,sans-serif'; x.fillText('KOTAK SEGARA', w / 2, 210);
    x.fillStyle = '#ff9ad0'; x.font = '700 38px Montserrat,sans-serif'; x.fillText('Kota menara di tepi teluk · ' + nMenara + ' menara · ' + nWarga + ' warga', w / 2, 290); })}));
  layar.position.set(0, 6, -.32); layar.rotation.y = Math.PI; vt.add(layar);
  [[-24, -22], [24, -22], [-24, -2], [24, -2]].forEach(([x, z]) => { slab(x, .45, z, 3.4, .2, 1, 0xa0703c); slab(x - 1.4, .22, z, .3, .44, .8, 0x3a3f46); slab(x + 1.4, .22, z, .3, .44, .8, 0x3a3f46); });
  [[-33, -27], [33, -27], [-33, 2], [33, 2], [-14, -27], [14, -27]].forEach(([x, z]) => tree(x, z, .9));

  // ---- MENARA apartemen ----
  const bangunan = [], menara = [];
  const kacaLobi = mat(0x1d2f45, .15);
  const buatMenara = t => {
    const {x, z} = slot(t), g = new THREE.Group(); g.position.set(x, 0, z); G.add(g);
    // tekstur jendela: 10 unit × 20 lantai, jendela menyala = unit berpenghuni (lobi kaca di lantai 1)
    const nyala = []; for (let f = 2; f <= LANTAI_HUNI + 1; f++) for (let k = 1; k <= UNIT_LANTAI; k++) { const n = noDari(t, f, k); nyala.push(n <= maks && isi(n) ? (rnd() < .5 ? '#ffd36b' : '#ffe9a8') : null); }
    const jendela = (c, w, h, malam) => { c.fillStyle = malam ? '#000' : '#d7e0e8'; c.fillRect(0, 0, w, h); const rh = h / (LANTAI_HUNI + 1), cw = w / UNIT_LANTAI; let i = 0;
      for (let f = 2; f <= LANTAI_HUNI + 1; f++) for (let k = 1; k <= UNIT_LANTAI; k++) { const y = h - f * rh, col = nyala[i++];
        if (malam && !col) continue; c.fillStyle = col || '#3a5068'; c.fillRect((k - 1) * cw + cw * .14, y + rh * .2, cw * .72, rh * .58); }
      if (!malam) { c.fillStyle = '#1d2f45'; c.fillRect(0, h - rh, w, rh); } };
    const tex = kanvas(256, 512, (c, w, h) => jendela(c, w, h, false)), texM = kanvas(256, 512, (c, w, h) => jendela(c, w, h, true));
    // jendela unit berpenghuni menyala (emissive) supaya menara terlihat hidup, terutama malam hari
    const sisi = new THREE.MeshStandardMaterial({map: tex, emissiveMap: texM, emissive: 0xffffff, emissiveIntensity: .55, roughness: .45, metalness: .1}), atap = mat(0x5a646e, .7);
    const bd = new THREE.Mesh(new THREE.BoxGeometry(TW, TH, TD), [sisi, sisi, atap, atap, sisi, sisi]); bd.position.y = TH / 2; bd.castShadow = true; bd.receiveShadow = true; g.add(bd);
    // garis neon vertikal di sudut depan + mahkota atap
    [-1, 1].forEach(s => slab(s * (TW / 2 + .06), TH / 2, -TD / 2 - .06, .18, TH - 2, .18, neon(t % 2 ? 0xff4fa8 : 0x3ef0ff), .9, g));
    slab(0, TH + .4, 0, TW + .4, .8, TD + .4, 0x2a3038, .6, g);
    // atap: taman kecil + landasan taksi drone (Tahap 3)
    const lp = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, .2, 32), mat(0x2a3038, .7)); lp.position.set(2.5, TH + .9, 0); g.add(lp);
    const lr = new THREE.Mesh(new THREE.TorusGeometry(3.4, .12, 6, 40), neon(0xffd36b)); lr.rotation.x = Math.PI / 2; lr.position.set(2.5, TH + 1.02, 0); g.add(lr);
    slab(-5, TH + 1.1, 0, 4, .6, 10, 0x5fae4f, .9, g);
    // lobi: kanopi, pintu kaca, papan nama neon "MENARA t"
    slab(0, 3.4, -TD / 2 - 1.6, 9, .3, 3.2, 0xeef2f5, .5, g); slab(-4.2, 1.7, -TD / 2 - 3, .25, 3.4, .25, 0x9aa4ae, .5, g); slab(4.2, 1.7, -TD / 2 - 3, .25, 3.4, .25, 0x9aa4ae, .5, g);
    slab(0, 1.5, -TD / 2 - .05, 4.4, 3, .1, kacaLobi, .9, g); slab(0, 1.5, -TD / 2 - .12, .1, 3, .06, 0xc8d0d8, .5, g);
    const pn = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.6), new THREE.MeshBasicMaterial({map: papan('MENARA ' + t)})); pn.position.set(0, 4.6, -TD / 2 - .08); pn.rotation.y = Math.PI; g.add(pn);
    slab(0, .1, -TD / 2 - 4.5, 6, .12, 5, 0xd8d2c4, .9, g);   // keset/teras lobi
    const rect = [(x - TW / 2) * VS, (x + TW / 2) * VS, (z - TD / 2) * VS, (z + TD / 2) * VS];
    bangunan.push({position: V3(x * VS, 0, z * VS), nama: '🏙️ Menara ' + t, tinggi: (TH + 2) * VS, rect});
    menara.push({t, x, z, pintu: V3(x * VS, 0, (z - TD / 2 - 8) * VS)});
  };
  for (let t = 1; t <= nMenara; t++) buatMenara(t);
  // menara berikutnya dibangun gotong royong saat menara terakhir hampir penuh (aset proyek yang sama dengan fasum voting)
  const gF = new THREE.Group(); sc.add(gF);
  if (proyekBaru) { const s = slot(nMenara + 1), m = F.proyek('PEMBANGUNAN MENARA ' + (nMenara + 1), 1); m.scale.setScalar(VS); m.rotation.y = Math.PI; m.position.set(s.x * VS, 0, s.z * VS); gF.add(m);
    bangunan.push({position: V3(s.x * VS, 0, s.z * VS), nama: '🚧 Menara ' + (nMenara + 1) + ' (dibangun)', ...F.pisahFasum(m)}); }

  // ---- fasum TERSEBAR sebaris di selatan Jl. Plaza (menghadap utara); 2 lahan kosong untuk voting ----
  const fas = [], lahanKosong = [];
  FASUM.forEach(([k, nama], i) => {
    const x = (i < 5 ? -1 : 1) * (14 + 21.3 * (i < 5 ? 4 - i : i - 5)), z = 20.6, kk = G.children.length; fasum2(G, x, z, 21, 17.4); const f = G.children[kk]; fas.push({p: V3(x * VS, 0, z * VS), g: f});
    if (!k) { lahanKosong.push({x, z, y: 0}); return; }
    f.children.slice(1).forEach(c => f.remove(c));
    const m = F[k](); m.scale.setScalar(VS); m.rotation.y = Math.PI; m.position.set(x * VS, 0, z * VS); gF.add(m);
    bangunan.push({position: V3(x * VS, 0, z * VS), nama, ...F.pisahFasum(m)});
  });
  // terminal & gapura di selatan (menyambung ke Jl. Raya Dunia Kotak)
  { const k = G.children.length; fasum2(G, 0, ZT, 30, 16); G.children[k].children.slice(1).forEach(c => G.children[k].remove(c)); }
  const gp = new THREE.Group(); gp.position.set(0, 0, ZT - 9); G.add(gp);
  slab(-6, 3, 0, 1, 6, 1, 0x2a3038, .6, gp); slab(6, 3, 0, 1, 6, 1, 0x2a3038, .6, gp); slab(0, 6.4, 0, 13.4, 1.4, 1.2, 0x1a2028, .6, gp);
  const gpn = new THREE.Mesh(new THREE.PlaneGeometry(12.6, 1.2), new THREE.MeshBasicMaterial({map: papan('KOTAK SEGARA', 1024, 96)})); gpn.position.set(0, 6.4, -.62); gpn.rotation.y = Math.PI; gp.add(gpn);
  bangunan.push({position: V3(0, 0, ZT * VS), nama: '🚌 Terminal & Gapura Kotak Segara', tinggi: 4 * VS, rect: null});
  bangunan.push({position: V3(0, 0, -14 * VS), nama: '📺 Plaza Segara', tinggi: 4 * VS, rect: [-6 * VS, 6 * VS, -20 * VS, -8 * VS]});
  bangunan.push({position: V3(0, 0, (ZS - 8) * VS), nama: '⚓ Dermaga Teluk', tinggi: 3 * VS, rect: null});
  // pohon peneduh di tepi pantai & selatan
  for (let x = XR + 6; x < XL - 10; x += 9) if (Math.abs(x) > 8) tree(x + rnd() * 2, ZS + 8 + rnd() * 2, .8 + rnd() * .3);
  for (let x = XR + 6; x < XL - 6; x += 8) if (Math.abs(x) > 18) tree(x, ZT + 10 + rnd() * 3, .9);

  // ================= LANTAI HUNIAN (dimuat satu per satu) =================
  const info = {lots: {}, G, light: d, grupFasum: gF, bangunan, dusun: 'segara', fas, nMenara, maks};
  for (let n = AWAL_SEGARA + 1; n <= maks; n++) {
    const {t, f, k} = unitDari(n), O = FO(t, f), dir = k <= 5 ? 1 : -1, cx = O.x + UX(k), cz = O.z - dir * UZ;
    info.lots[n] = {c: V3(cx * VS, 0, cz * VS), gate: V3(cx * VS, 0, (cz + dir * (RD + 1)) * VS), stone: V3(cx * VS, 0, (cz + dir * (RD + .5)) * VS), dir, lokal: n - AWAL_SEGARA, unit: {t, f, k}};
  }
  info.buildLot = () => null;
  info.batasLuar = {x0: (XR + 1) * VS, x1: (XL - 1) * VS, z0: (DERMAGA.z0 - 1) * VS, z1: (ZT + 8) * VS};
  info.batas = info.batasLuar;
  info.spawn = V3(0, 0, (ZT - 14) * VS);
  info.air = (x, z) => { const lx = x / VS, lz = z / VS; if (lz < -400) return false;   // lantai hunian
    if (lx > DERMAGA.x0 && lx < DERMAGA.x1 && lz > DERMAGA.z0 && lz < DERMAGA.z1) return false;
    return lz < ZS - 1 || lx > XL - .5; };
  info.dekatAir = (x, z) => { const lz = z / VS, lx = x / VS; return lz > -400 && (lz < ZS + 6 || lx > XL - 7 || (Math.abs(lx) < 6 && lz < ZS + 2)); };
  info.arahAir = (x, z) => x / VS > XL - 7 ? V3(x + 20, 0, z) : V3(x, 0, z - 20);
  const xs = [XR + 3, -40, 0, 40, XL - 12].map(v => v * VS), zs = [ZP, ZPL, ZSEL].map(v => v * VS);
  info.jalur = {xs, zs, bolehNaik: i => i === 0 || i === 2};
  info.tempatNPC = {warung: V3(-99 * VS, 0, (ZPL + 3) * VS), balai: V3(0, 0, -4 * VS), sungai: V3(-4 * VS, 0, (ZS + 3) * VS), sawah: V3(30 * VS, 0, -4 * VS), main: V3(lahanKosong[0].x * VS, 0, (ZPL + 3) * VS)};

  // ---- gedung: lift, lantai, pintu lobi ----
  const lantai = {g: null, z: null, rects: []};
  const zona = (x, z) => { const lz = z / VS; if (lz > -400) return null; const lx = x / VS;
    return {t: Math.max(1, Math.round((-lz - 600) / 200)), f: Math.max(2, Math.round((lx - 600) / 200))}; };
  const bangunLantai = ({t, f}) => {
    const O = FO(t, f), L = new THREE.Group(); L.position.set(O.x * VS, 0, O.z * VS); L.scale.setScalar(VS); sc.add(L);
    const s = (x, y, z, w, h, dd, c, r = .8) => slab(x, y, z, w, h, dd, c, r, L);
    s(0, -.25, 0, 2 * LX + 2, .5, 30, 0xd9dde2);                                        // pelat lantai
    s(0, .02, 0, 2 * LX - 12, .04, 6, 0x7d8fa6);                                         // karpet koridor
    [-3.1, 3.1].forEach(z => s(0, .05, z, 2 * LX - 12, .03, .18, neon(0x3ef0ff)));        // lis neon koridor
    // lift kaca (barat) dengan nomor lantai
    s(-LX + 2.6, 2.2, 0, 5, 4.4, 7, 0x9aa4ae, .4); s(-LX + 5.15, 1.7, 0, .1, 3.4, 3, 0x1d2f45, .15); s(-LX + 5.2, 3.6, 0, .1, .2, 3.4, neon(0xff4fa8));
    const nl = new THREE.Mesh(new THREE.PlaneGeometry(3, 1), new THREE.MeshBasicMaterial({map: papan('Lt. ' + f)})); nl.position.set(-LX + 5.22, 4.2, 0); nl.rotation.y = Math.PI / 2; L.add(nl);
    // ruang santai + jendela kota (timur)
    s(LX - 3, .3, -2, 3, .6, 1.2, 0x2a9a5a); s(LX - 3, .3, 2, 3, .6, 1.2, 0x2a9a5a); s(LX - 1.2, .5, 0, .8, 1, .8, 0xb0603a); s(LX - 1.2, 1.3, 0, 1.2, 1, 1.2, 0x3f9a3a);
    // pagar kaca di tepi lantai
    const kaca = new THREE.MeshStandardMaterial({color: 0xbfe6ff, transparent: true, opacity: .35, roughness: .1});
    [-15, 15].forEach(z => s(0, .6, z, 2 * LX + 2, 1.2, .1, kaca)); [-LX - 1, LX + 1].forEach(x => s(x, .6, 0, .1, 1.2, 30, kaca));
    // cangkang unit kosong (unit berpenghuni dibangun game.js dari interior rumah) + papan nomor/nama di pintu
    const rects = [[(O.x - LX - 1) * VS, (O.x - LX + 5.1) * VS, (O.z - 3.5) * VS, (O.z + 3.5) * VS]];   // badan lift
    for (let k = 1; k <= UNIT_LANTAI; k++) {
      const n = noDari(t, f, k), dir = k <= 5 ? 1 : -1, ux = UX(k), uz = -dir * UZ, ada = n <= maks && isi(n);
      const W = (x0, x1, z0, z1) => { rects.push([(O.x + ux + x0) * VS, (O.x + ux + x1) * VS, (O.z + uz + Math.min(dir * z0, dir * z1)) * VS, (O.z + uz + Math.max(dir * z0, dir * z1)) * VS]);
        if (!ada) s(ux + (x0 + x1) / 2, .75, uz + dir * (z0 + z1) / 2, x1 - x0, 1.5, Math.abs(z1 - z0), 0xf1dcb4); };
      W(-RW, RW, -RD - .06, -RD + .06); W(-RW - .06, -RW + .06, -RD, RD); W(RW - .06, RW + .06, -RD, RD); W(-RW, -1.11, RD - .06, RD + .06); W(1.11, RW, RD - .06, RD + .06);
      if (!ada) s(ux, .03, uz, 2 * RW, .06, 2 * RD, 0xc8b8a0);
      // balkon kaca di belakang unit (menghadap kota)
      s(ux, .02, uz - dir * (RD + 1.6), 2 * RW, .04, 3, 0xb8c4cc); s(ux, .5, uz - dir * (RD + 3.1), 2 * RW, 1, .08, kaca);
      const pp = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .82), new THREE.MeshBasicMaterial({map: kanvas(384, 132, (c, w, h) => {
        c.fillStyle = '#101826'; c.fillRect(0, 0, w, h); c.textAlign = 'center'; c.fillStyle = '#5ff4ff'; c.font = '900 50px Montserrat,sans-serif'; c.fillText(pad(f) + '-' + pad(k), w / 2, 56);
        c.fillStyle = ada ? '#ffffff' : '#7f93a8'; c.font = '700 34px Montserrat,sans-serif'; c.fillText(ada ? String(nm[n] || 'warga').slice(0, 18) : n <= maks ? 'kosong' : 'tersedia', w / 2, 108); })}));
      pp.position.set(ux + dir * 3, 1.05, uz + dir * (RD + .1)); if (dir < 0) pp.rotation.y = Math.PI; L.add(pp);
    }
    // pemandangan kota di bawah: laut + siluet menara lain (tertutup kabut, murah)
    s(0, -40, 0, 900, .5, 900, 0x2f86c8, .3);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + .3, r = 52 + (i % 3) * 9; s(Math.cos(a) * r, -18, Math.sin(a) * r, 12, 44 + (i % 4) * 6, 12, 0x8fa7bd, .6); }
    lantai.rects = rects; return L;
  };
  const buang = g => { g.traverse(m => { if (m.isMesh) { m.geometry.dispose(); [].concat(m.material).forEach(x => { if (x.map) x.map.dispose(); x.dispose(); }); } }); g.parent && g.parent.remove(g); };
  info.gedung = {
    get rects() { return lantai.rects; },
    zona,
    kunci: z => z ? z.t + ',' + z.f : 'luar',
    menara,
    // pindah ke lantai (zona {t,f}) atau ke luar (null): bangun lantai baru, buang lantai lama, ganti batas gerak
    masuk(z) {
      if (lantai.g) { buang(lantai.g); lantai.g = null; lantai.rects = []; }
      lantai.z = z;
      if (!z) { info.batas = info.batasLuar; return; }
      lantai.g = bangunLantai(z); const O = FO(z.t, z.f);
      info.batas = {x0: (O.x - LX) * VS, x1: (O.x + LX) * VS, z0: (O.z - LZ) * VS, z1: (O.z + LZ) * VS};
    },
    // titik keluar lift di tiap lantai / titik depan pintu lobi di luar
    lift: (t, f) => f <= 1 ? (menara[t - 1] || menara[0]).pintu.clone() : V3((FO(t, f).x - LX + 7.5) * VS, 0, FO(t, f).z * VS),
    // dekat pintu lift (lantai) atau pintu lobi (luar) → {t, f}
    dekatLift(x, z) {
      const zn = zona(x, z);
      if (zn) { const O = FO(zn.t, zn.f), lx = x / VS - O.x, lz = z / VS - O.z; return lx < -LX + 10 && Math.abs(lz) < 3.4 ? zn : null; }
      for (const m of menara) if (Math.abs(x - m.pintu.x) < 6 * VS && z > m.pintu.z - 4 * VS && z < m.pintu.z + 4 * VS) return {t: m.t, f: 1};
      return null;
    },
    huni: (t, f) => { const a = []; for (let k = 1; k <= UNIT_LANTAI; k++) { const n = noDari(t, f, k); if (n <= maks && isi(n)) a.push(n); } return a; },
  };
  return info;
}

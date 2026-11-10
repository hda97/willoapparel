// LALU LINTAS DESA (Huda 11 Nov 2026: "Bangunkan lalu lintasnya juga di semua dusun", "NPC keliling menaiki mobil dan mobil fasum
// juga setelah rambu lalu lintas dipasang", "NPC juga ada yang naik sepeda dan motor").
// - Rambu: lampu lalu lintas di tiap perempatan/pertigaan, zebra cross di tiap mulut simpang, rambu batas kecepatan 30 & dilarang parkir.
//   Semua bagian diam digabung per material (sedikit draw call); lampu menyala bergantian lewat material bersama.
// - Kendaraan NPC: warga desa naik mobil, motor & sepeda, plus mobil patroli & ambulans keliling. Lajur KIRI (seperti di Indonesia),
//   berhenti saat lampu merah, berhenti bila ada warga/kendaraan di depan (tidak pernah menabrak), putar balik di ujung jalan buntu.
// Jaringan jalan = I.jalur (garis jalan NPC tiap dusun) atau vroads/hroads Kotak Wetan (gang tepi tidak dilewati mobil).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const M = 4.12 / 1.7;   // 1 meter dalam satuan dunia (avatar 1,7 m)
// [model, warna, kec (×KEC jalan kaki), seragam pengemudi]
const ARMADA = [
  ['sedan', 0x2f6fd8, 1.5], ['motor', 0xb8252c, 1.7], ['sepeda', 0x2f9a54, .95], ['patroli', 0, 1.5, 'polisi'], ['hatch', 0xf2b62a, 1.6],
  ['motor', 0x2a2b33, 1.7], ['ambulans', 0, 1.35, 'medis'], ['jip', 0xeeeee8, 1.45], ['sepeda', 0xf2b62a, .95], ['sedan', 0xd8402a, 1.5],
  ['motor', 0x2f6fd8, 1.7], ['gt', 0xb8252c, 1.75],
];
// [tinggi pinggul (m), kursi z (m) atau null = kursi model, kaki, tangan]
const DUDUK = {sepeda: [1.06, -.24, -.55, -1.2], motor: [.93, -.38, -.85, -1.25], sedan: [.42, null, -1.45, -1.15], patroli: [.42, null, -1.45, -1.15],
  ambulans: [.6, null, -1.45, -1.15], hatch: [.42, null, -1.45, -1.15], jip: [.8, null, -1.4, -1.15], gt: [.36, null, -1.5, -1.1]};
const PANJANG = {sepeda: 1.8, motor: 2.1, sedan: 4.4, patroli: 4.4, ambulans: 5.2, hatch: 4.0, jip: 4.3, gt: 4.3};
const KULIT = ['#f2c7a0', '#e0aa7e', '#c98e5e', '#8a5a3a'], BAJU = ['#3a7bd5', '#d0442f', '#2a9a5a', '#f2c14e', '#8a5ad8', '#1d1d22', '#f4f4f4', '#e06a9a'];
const RAMBUT = ['pendek', 'belah', 'cepak', 'panjang', 'kuncir'];

function teksBulat(teks, cincin, isi, warnaTeks, coret) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = cincin; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.fillStyle = isi; x.beginPath(); x.arc(64, 64, 48, 0, 7); x.fill();
  x.fillStyle = warnaTeks; x.font = '900 58px Montserrat, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(teks, 64, 68);
  if (coret) { x.strokeStyle = cincin; x.lineWidth = 13; x.beginPath(); x.moveTo(30, 30); x.lineTo(98, 98); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2; return t;
}

export function buatLaluLintas({sc, I, VS, tanah, warga, pose, siapAv, buatMobil, hemat, KEC = 15}) {
  // ---------- jaringan jalan ----------
  let xs, zs, rwX, rwZ, bolehNaik;
  if (I.jalur) { xs = I.jalur.xs; zs = I.jalur.zs; rwX = xs.map(() => 2 * VS); rwZ = zs.map(() => 2 * VS); bolehNaik = I.jalur.bolehNaik; }
  else if (I.vroads && I.hroads) {
    const v = I.vroads.filter(([a, b]) => b - a >= 3.5), h = I.hroads.filter(([a, b]) => b - a >= 3.5);   // gang tepi (2) terlalu sempit untuk mobil
    xs = v.map(([a, b]) => ((a + b) / 2 + I.ox) * VS); rwX = v.map(([a, b]) => (b - a) / 2 * VS);
    zs = h.map(([a, b]) => ((a + b) / 2 + I.oz) * VS); rwZ = h.map(([a, b]) => (b - a) / 2 * VS); bolehNaik = () => true;
  } else return null;
  if (xs.length < 2 || !zs.length) return null;
  const NI = xs.length, NJ = zs.length, id = (i, j) => j * NI + i;
  const tetangga = Array.from({length: NI * NJ}, () => []);
  for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
    if (i + 1 < NI) { tetangga[id(i, j)].push(id(i + 1, j)); tetangga[id(i + 1, j)].push(id(i, j)); }
    if (j + 1 < NJ && bolehNaik(i)) { tetangga[id(i, j)].push(id(i, j + 1)); tetangga[id(i, j + 1)].push(id(i, j)); }
  }
  const nx = k => xs[k % NI], nz = k => zs[(k / NI) | 0];
  const simpang = new Set(); for (let k = 0; k < NI * NJ; k++) if (tetangga[k].length >= 3) simpang.add(k);
  const g = new THREE.Group(); g.name = 'laluLintas'; sc.add(g);
  const y0 = (x, z) => tanah(x, z);

  // ---------- rambu (digabung) ----------
  const geo = {tiang: [], kotak: [], zebra: [], hm: [], hk: [], hh: [], vm: [], vk: [], vh: [], r30: [], rP: []};
  const kotak = (arr, w, h, d, x, y, z, ry = 0) => { const b = new THREE.BoxGeometry(w, h, d); if (ry) b.rotateY(ry); b.translate(x, y, z); arr.push(b); };
  const lampu = (arr, x, y, z, ry) => { const c = new THREE.CylinderGeometry(.13 * M, .13 * M, .06 * M, 10); c.rotateX(Math.PI / 2); c.rotateY(ry); c.translate(x, y, z); arr.push(c); };
  const bidang = (arr, s, x, y, z, ry) => { const p = new THREE.CircleGeometry(s, 20); p.rotateY(ry); p.translate(x, y, z); arr.push(p); };
  for (const k of simpang) {
    const i = k % NI, j = (k / NI) | 0, x = xs[i], z = zs[j], ax = rwX[i], az = rwZ[j];
    // tiang lampu di pojok kiri-depan simpang, kepala lampu menghadap empat arah
    const px = x - ax - .9 * M, pz = z + az + .9 * M, py = y0(px, pz), H = 3.4 * M;
    kotak(geo.tiang, .16 * M, H, .16 * M, px, py + H / 2, pz); kotak(geo.tiang, .5 * M, .14 * M, .5 * M, px, py + .07 * M, pz);
    kotak(geo.kotak, .42 * M, 1.15 * M, .42 * M, px, py + H - .2 * M, pz);
    const ly = [py + H + .15 * M, py + H - .2 * M, py + H - .55 * M];   // merah, kuning, hijau
    [[0, 1], [Math.PI, -1]].forEach(([ry, s]) => { const zz = pz + s * .22 * M; lampu(geo.vm, px, ly[0], zz, ry); lampu(geo.vk, px, ly[1], zz, ry); lampu(geo.vh, px, ly[2], zz, ry); });
    [[Math.PI / 2, 1], [-Math.PI / 2, -1]].forEach(([ry, s]) => { const xx = px + s * .22 * M; lampu(geo.hm, xx, ly[0], pz, ry); lampu(geo.hk, xx, ly[1], pz, ry); lampu(geo.hh, xx, ly[2], pz, ry); });
    // zebra cross di mulut simpang yang punya jalan
    for (const n of tetangga[k]) {
      const vert = n % NI === i, s = vert ? Math.sign(nz(n) - z) : Math.sign(nx(n) - x), lebar = vert ? ax : az, d0 = (vert ? az : ax) + 1.4 * M;
      for (let q = -lebar + .35 * M; q <= lebar - .35 * M; q += .9 * M) {
        if (vert) kotak(geo.zebra, .5 * M, .04, 2.2 * M, x + q, y0(x + q, z + s * d0) + .06, z + s * d0);
        else kotak(geo.zebra, 2.2 * M, .04, .5 * M, x + s * d0, y0(x + s * d0, z + q) + .06, z + q);
      }
    }
  }
  // rambu batas kecepatan 30 & dilarang parkir di tepi kiri sebagian ruas jalan
  let nRambu = 0;
  for (let k = 0; k < NI * NJ; k++) for (const n of tetangga[k]) { if (n < k) continue; nRambu++; if (nRambu % 3) continue;
    const vert = n % NI === k % NI, mx = (nx(k) + nx(n)) / 2, mz = (nz(k) + nz(n)) / 2, rw = vert ? rwX[k % NI] : rwZ[(k / NI) | 0];
    const px = vert ? mx + rw + .7 * M : mx, pz = vert ? mz : mz + rw + .7 * M, py = y0(px, pz), H = 2.3 * M, ry = vert ? -Math.PI / 2 : 0;
    kotak(geo.tiang, .07 * M, H, .07 * M, px, py + H / 2, pz);
    const off = .045 * M, fx = vert ? -off : 0, fz = vert ? 0 : -off;   // muka rambu menghadap jalan
    bidang((nRambu / 3) % 2 ? geo.r30 : geo.rP, .32 * M, px + fx, py + H + .1 * M, pz + fz, ry + Math.PI);
    bidang((nRambu / 3) % 2 ? geo.r30 : geo.rP, .32 * M, px - fx, py + H + .1 * M, pz - fz, ry);
  }
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .55, ...o});
  const nyala = c => new THREE.MeshStandardMaterial({color: c, emissive: c, emissiveIntensity: 0, roughness: .3});
  const LM = {hm: nyala(0xff3020), hk: nyala(0xffc020), hh: nyala(0x30e060), vm: nyala(0xff3020), vk: nyala(0xffc020), vh: nyala(0x30e060)};
  const MAT = {tiang: mat(0x4a4f58, {metalness: .4}), kotak: mat(0x1d1e24), zebra: mat(0xf4f4f0, {roughness: .9}), ...LM,
    r30: new THREE.MeshStandardMaterial({map: teksBulat('30', '#d8222a', '#ffffff', '#111111'), roughness: .6, side: THREE.DoubleSide}),
    rP: new THREE.MeshStandardMaterial({map: teksBulat('P', '#d8222a', '#2f5fd0', '#ffffff', true), roughness: .6, side: THREE.DoubleSide})};
  for (const [n, arr] of Object.entries(geo)) if (arr.length) { const m = new THREE.Mesh(mergeGeometries(arr), MAT[n]); m.receiveShadow = n === 'zebra'; m.castShadow = n === 'tiang' && !hemat; g.add(m); arr.forEach(b => b.dispose()); }
  // fase lampu (detik): 0–7 jalan mendatar hijau, 7–8 kuning, 8–15 jalan tegak hijau, 15–16 kuning
  const SIKLUS = 16; let fase = -1;
  const boleh = (t, vert) => { const f = t % SIKLUS; return vert ? f >= 8 && f < 15 : f < 7; };
  function aturLampu(t) { const f = Math.floor(t % SIKLUS); if (f === fase) return; fase = f;
    const hH = f < 7, hK = f === 7, vH = f >= 8 && f < 15, vK = f === 15;
    LM.hh.emissiveIntensity = hH ? 2.2 : 0; LM.hk.emissiveIntensity = hK ? 2.2 : 0; LM.hm.emissiveIntensity = !hH && !hK ? 2.2 : 0;
    LM.vh.emissiveIntensity = vH ? 2.2 : 0; LM.vk.emissiveIntensity = vK ? 2.2 : 0; LM.vm.emissiveIntensity = !vH && !vK ? 2.2 : 0; }

  // ---------- kendaraan NPC ----------
  let biji = 71; const acak = () => { biji = (biji * 16807) % 2147483647; return (biji - 1) / 2147483646; };
  const pilih = a => a[Math.floor(acak() * a.length)];
  const N = Math.min(ARMADA.length, Math.max(3, Math.round((hemat ? .35 : .6) * (NI * NJ) ** .75)));
  const ruas = []; for (let k = 0; k < NI * NJ; k++) for (const n of tetangga[k]) ruas.push([k, n]);
  const armada = [];
  function pengemudi(seragam) {
    const av = {jenis: acak() < .5 ? 'L' : 'P', kulit: pilih(KULIT), rambut: {gaya: pilih(RAMBUT), warna: '#1a1410'},
      atasan: {jenis: seragam ? 'seragam' : 'kaos', warna: seragam === 'polisi' ? '#8a6a3a' : seragam === 'medis' ? '#f4f4f4' : pilih(BAJU)}, bawahan: {jenis: 'panjang', warna: seragam === 'polisi' ? '#5a4628' : '#2a3550'}};
    try { return warga(siapAv ? siapAv(av) : av); } catch (e) { return null; }
  }
  for (let q = 0; q < N && ruas.length; q++) {
    const [model, warna, kec, seragam] = ARMADA[q], v = buatMobil(model, warna || 0xffffff, 100 + q * 37), u = v.userData, D = DUDUK[model];
    const o = new THREE.Group(); o.add(v); v.scale.setScalar(M);
    const sopir = pengemudi(seragam);
    if (sopir) { const angkat = D[0] * M - 1.37; sopir.children.forEach(c => { c.position.y += angkat; }); sopir.position.set(u.kursi.x * M, 0, (D[1] != null ? D[1] : u.kursi.z) * M);
      pose(sopir, {legL: D[2], legR: D[2], armL: D[3], armR: D[3], armLz: .12, armRz: -.12}); o.add(sopir); }
    o.traverse(m => { if (m.isMesh) m.castShadow = !hemat; });
    const r = ruas[Math.floor((q + .5) / N * ruas.length)];
    const c = {o, v, model, a: r[0], b: r[1], s: acak() * 10, kec: kec * KEC, laju: 0, pj: PANJANG[model] * M, dua: model === 'motor' || model === 'sepeda', ph: acak() * 9};
    armada.push(c); g.add(o); letak(c, 1);
  }
  function panjangRuas(c) { return Math.hypot(nx(c.b) - nx(c.a), nz(c.b) - nz(c.a)); }
  function lajur(c) { const vert = c.a % NI === c.b % NI, rw = vert ? rwX[c.a % NI] : rwZ[(c.a / NI) | 0]; return Math.min(rw * .5, (c.dua ? .9 : 1.6) * M) + (c.dua ? rw * .25 : 0); }
  const _d = new THREE.Vector3();
  function letak(c, langsung) {
    const ax = nx(c.a), az = nz(c.a), L = panjangRuas(c) || 1, dx = (nx(c.b) - ax) / L, dz = (nz(c.b) - az) / L, ln = lajur(c);
    const x = ax + dx * c.s + dz * ln, z = az + dz * c.s - dx * ln;   // lajur kiri: normal kiri (dz, -dx)
    const ry = Math.atan2(dx, dz), o = c.o;
    if (langsung) { o.position.set(x, tanah(x, z, 0), z); o.rotation.y = ry; }
    else { const a = Math.min(1, c.dt * 7); o.position.x += (x - o.position.x) * a; o.position.z += (z - o.position.z) * a;
      let dr = ry - o.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); o.rotation.y += dr * Math.min(1, c.dt * 6); }
    // roda selalu menapak permukaan jalan (Huda 11 Nov: "jangan terlihat tenggelam di jalan"): tinggi diambil langsung (tanpa
    // tunda) dari titik tengah, roda depan & roda belakang; di tanjakan bodi ikut miring mengikuti jalan.
    const hx = Math.sin(o.rotation.y), hz = Math.cos(o.rotation.y), sb = c.pj * .38, px = o.position.x, pz = o.position.z, ref = o.position.y;
    const yT = tanah(px, pz, ref), yD = tanah(px + hx * sb, pz + hz * sb, ref), yB = tanah(px - hx * sb, pz - hz * sb, ref);
    o.position.y = Math.max(yT, (yD + yB) / 2); o.rotation.x = -Math.atan2(yD - yB, 2 * sb) * .9; o.rotation.order = 'YXZ';
  }
  function halangan(c, ox, oz, jauh) {   // ada benda di depan pada lajur sendiri?
    const L = panjangRuas(c) || 1, dx = (nx(c.b) - nx(c.a)) / L, dz = (nz(c.b) - nz(c.a)) / L, p = c.o.position;
    const rx = ox - p.x, rz = oz - p.z, maju = rx * dx + rz * dz, samping = Math.abs(rx * dz - rz * dx);
    return maju > 0 && maju < jauh && samping < 1.6 * M;
  }
  function update(dt, me, t, lain = []) {
    if (!armada.length && !simpang.size) return;
    aturLampu(t);
    for (const c of armada) {
      c.dt = dt; const L = panjangRuas(c), sisa = L - c.s, vert = c.a % NI === c.b % NI;
      let target = c.kec;
      // lampu merah: berhenti di garis stop (sebelum zebra cross)
      if (simpang.has(c.b) && !boleh(t, vert)) { const garis = (vert ? rwZ[(c.b / NI) | 0] : rwX[c.b % NI]) + 2.6 * M + c.pj / 2;
        if (sisa > garis - .5 * M && sisa - c.kec * .6 < garis) target = 0; }
      // jangan menabrak warga atau kendaraan lain
      const jauh = c.pj / 2 + 3 * M;
      if (me && halangan(c, me.position.x, me.position.z, jauh + 1.5 * M)) target = 0;
      if (target) for (const p of lain) if (halangan(c, p.x, p.z, jauh)) { target = 0; break; }
      if (target) for (const d of armada) if (d !== c && halangan(c, d.o.position.x, d.o.position.z, c.pj / 2 + d.pj / 2 + 1.5 * M)) { target = 0; break; }
      c.laju += (target - c.laju) * Math.min(1, dt * (target ? 1.8 : 5));
      const jarak = c.laju * dt; c.s += jarak;
      if (c.s >= L) {   // sampai simpang: belok acak (tidak balik arah kecuali jalan buntu)
        const pil = tetangga[c.b].filter(n => n !== c.a), b = pil.length ? pilih(pil) : c.a;
        c.a = c.b; c.b = b; c.s = Math.max(0, c.s - L);
      }
      letak(c);
      for (const r of c.v.userData.roda) r.putar.rotation.x += jarak / (c.v.userData.jari * M);
      if (me) c.o.visible = Math.abs(c.o.position.x - me.position.x) + Math.abs(c.o.position.z - me.position.z) < 520;
    }
  }
  return {update, armada, grup: g, jumlahSimpang: simpang.size};
}

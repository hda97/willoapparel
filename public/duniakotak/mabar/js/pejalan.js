// PEJALAN KAKI DESA (Huda 21 Nov 2026: "Saya mau NPC Dunia Kotak seperti NPC GTA").
// Warga figuran tanpa nama yang membuat desa terasa ramai, dengan perilaku ala game open world (perilakunya saja, tanpa aset/merek game lain):
// - jalan kaki di tepi jalan (trotoar), jumlahnya ikut jam: pagi & sore ramai, malam sepi; selalu muncul di sekitar pemain
// - nyebrang lewat zebra cross saat lampu merah untuk mobil (kendaraan NPC ikut berhenti untuk mereka)
// - menoleh, melambai & menyapa saat didekati; minggir saat kamu lewat; kaget & meloncat menghindar saat kamu ngebut ke arahnya
// - keserempet kendaraanmu: terhuyung, jatuh terduduk, bangun sambil ngomel (tanpa luka, denda, atau kalah)
// - ngobrol berdua/bertiga di pinggir jalan, duduk di bangku, keluar-masuk rumah warga
// - musim hujan: buka payung
// - diketuk: berhenti dan mengajak ngobrol singkat
// RINGAN DI HP: semua figuran digambar dengan 8 InstancedMesh (bukan avatar penuh), warna per figuran lewat atribut instance.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const M = 4.12 / 1.7;          // 1 meter dalam satuan dunia (avatar 1,7 m)
const OFF = .3 * M;            // jarak trotoar dari tepi jalan
const KULIT = ['#f2c7a0', '#e0aa7e', '#c98e5e', '#a86e44', '#8a5a3a'];
const BAJU = ['#3a7bd5', '#d0442f', '#2a9a5a', '#f2c14e', '#8a5ad8', '#1d1d22', '#f4f4f4', '#e06a9a', '#2fa6b8', '#c88a3a', '#7a2a2a', '#5a7a3a'];
const CELANA = ['#2f3a52', '#1d1d22', '#5a4628', '#3a5a3a', '#6a5a48', '#4a4a52', '#2a3550', '#7a6a58'];
const RAMBUT = ['#1a1410', '#0b0b0e', '#3a2416', '#2a1a10', '#6a6a70'];
const HIJAB = ['#6a8fb0', '#2f7a4a', '#e06a9a', '#c8b89a', '#1d1d22', '#8a5ad8', '#d0442f', '#f2c14e'];
const PAYUNG = [0xd0442f, 0x3a7bd5, 0xf2c14e, 0x2a9a5a, 0x1d1d22, 0xe06a9a, 0x8a5ad8];

const SAPA = {
  pagi: ['Pagi, {p}!', 'Monggo, {p}!', 'Sugeng enjing!', 'Mau ke mana pagi-pagi, {p}?', 'Udaranya seger, ya!'],
  siang: ['Monggo, {p}!', 'Panas, ya, {p}!', 'Mari, {p}!', 'Sudah makan siang, {p}?', 'Halo, {p}!'],
  sore: ['Sore, {p}!', 'Monggo, {p}!', 'Jalan-jalan sore, {p}?', 'Mampir, {p}!', 'Sugeng sonten!'],
  malam: ['Malam, {p}!', 'Monggo, {p}!', 'Hati-hati, sudah gelap', 'Mau ronda, {p}?', 'Belum tidur, {p}?'],
};
const OBROLAN = [
  'Katanya bandara di Tlaga sebentar lagi jadi. Nanti kita bisa naik pesawat, {p}!',
  'Sudah kasih bintang di Voting Fasum minggu ini? Aku pilih stasiun kereta.',
  'Kemarin aku mancing di sungai dapat lele segede lengan. Sumpah!',
  'Sawah Wetan lagi ramai. Cabai tetangga sudah merah semua.',
  'Hari Sabtu malam ada Pasar Malam di stadion. Jangan lupa jajan sate!',
  'Aku lagi nabung koin buat beli motor di Dealer Curug.',
  'Rumahmu yang mana, {p}? Nanti kukasih ❤️ buat Lomba Rumah Terindah.',
  'Kalau ada rumah penuh rumput, rawat saja. Dapat koin, lho.',
  'Hati-hati nyetir, {p}. Tadi ada yang ngebut, aku sampai loncat!',
  'Lagi cari Mas Bayu tukang pos. Paketku belum datang.',
  'Desa makin ramai, ya. Dulu cuma beberapa rumah.',
  'Aku mau ke warung beli gula. Mari, {p}!',
  'Mancing Kotak sekarang ada ikan raksasa. Aku belum pernah dapat.',
  'Anakku jago Pelari Kalcer. Rekornya sudah di papan, lho!',
  'Nanti malam ronda giliran Pak Slamet. Aman desa kita.',
];
const KAGET = ['Eh, pelan-pelan!', 'Astaga, kaget aku!', 'Waduh, hampir!', 'Eits! Hati-hati, {p}!', 'Wee, ngebut amat!'];
const NGOMEL = ['Aduh! Nyetir lihat-lihat, dong!', 'Aduh pantatku… 😣', 'SIM-nya beli di mana, {p}?!', 'Untung nggak apa-apa. Pelan-pelan!', 'Ya ampun, bajuku kotor!', 'Tadi itu lampu kuning, tahu!'];
const PERMISI = ['Monggo, lewat dulu', 'Permisi, {p}…', 'Eh, maaf'];
const KLAKSON = ['Tin tin! Minggir dulu, ya!', 'Permisi, mau lewat!', 'Tiiin! Jalannya ketutup, {p}!'];
const DIALOG = [
  ['Harga cabai naik lagi, Bu.', 'Iya, untung aku tanam sendiri di sawah.', 'Bagi dong kalau panen!'],
  ['Sudah lihat bandara di Tlaga?', 'Belum. Katanya sudah setengah jadi.', 'Nanti kita foto di sana, ya!'],
  ['Semalam ada yang dapat ikan raksasa.', 'Ah, paling cuma cerita.', 'Beneran! Ada fotonya di Album.'],
  ['Voting minggu ini pilih apa?', 'Kantor polisi, biar aman.', 'Aku stasiun kereta, ah.'],
  ['Mau ke Pasar Malam Sabtu?', 'Mau dong, lempar gelang!', 'Aku ikut, mau beli dawet.'],
  ['Motormu baru, ya?', 'Iya, beli di Dealer Curug.', 'Wah, nanti boncengan!'],
  ['Rumah nomor sebelah rapi banget.', 'Katanya juara Lomba Rumah.', 'Pantes, bunganya banyak.'],
  ['Kok hujan terus, ya?', 'Namanya juga musim hujan.', 'Untung bawa payung.'],
  ['Anakmu sudah pulang sekolah?', 'Belum, masih belajar sama Bu Rina.', 'Pinter-pinter, ya.'],
  ['Tadi aku lihat warga baru pindahan.', 'Wah, desa makin ramai.', 'Nanti kita sapa, yuk.'],
];

// ---------- geometri figuran (proporsi = avatar warga js/aset/avatar.js) ----------
// slot warna per titik: 0 baju, 1 celana, 2 kulit, 3 rambut/hijab, 4 hitam (sepatu, mata)
function kotak(arr, w, h, d, x, y, z, slot) {
  const b = new THREE.BoxGeometry(w, h, d); b.translate(x, y, z); b.deleteAttribute('uv');
  b.setAttribute('slot', new THREE.BufferAttribute(new Float32Array(b.attributes.position.count).fill(slot), 1)); arr.push(b);
}
function gabung(arr) { const g = mergeGeometries(arr); arr.forEach(b => b.dispose()); return g; }
function geoKaki() { const a = []; kotak(a, .48, 1.0, .5, 0, -.5, 0, 1); kotak(a, .5, .27, .58, 0, -1.115, .03, 4); return gabung(a); }
function geoLengan() { const a = []; kotak(a, .47, .5, .5, 0, -.25, 0, 0); kotak(a, .4, .56, .42, 0, -.78, 0, 2); return gabung(a); }
function geoBadan() { const a = []; kotak(a, 1.1, 1.2, .6, 0, .6, 0, 0); kotak(a, 1.12, .2, .62, 0, .08, 0, 1); return gabung(a); }
function wajah(a) { kotak(a, .95, .95, .95, 0, .55, 0, 2); kotak(a, .13, .17, .03, -.21, .6, .48, 4); kotak(a, .13, .17, .03, .21, .6, .48, 4); kotak(a, .24, .05, .03, 0, .34, .48, 4); }
function geoKepala() { const a = []; wajah(a); kotak(a, 1.01, .3, 1.01, 0, 1.0, 0, 3); kotak(a, 1.01, .6, .2, 0, .76, -.42, 3); kotak(a, 1.01, .14, .12, 0, .92, .45, 3); kotak(a, .12, .35, .9, -.47, .82, -.05, 3); kotak(a, .12, .35, .9, .47, .82, -.05, 3); return gabung(a); }
function geoHijab() { const a = []; wajah(a); kotak(a, 1.08, .28, 1.08, 0, 1.0, 0, 3); kotak(a, .1, 1.0, 1.08, -.53, .52, 0, 3); kotak(a, .1, 1.0, 1.08, .53, .52, 0, 3); kotak(a, 1.08, 1.0, .1, 0, .52, -.53, 3); kotak(a, 1.08, .16, .1, 0, .95, .51, 3); kotak(a, 1.25, .45, 1.1, 0, .02, 0, 3); return gabung(a); }
function geoPayung() {
  const kain = new THREE.ConeGeometry(2.1, .75, 8, 1, true); kain.translate(0, .37, 0);
  const tongkat = new THREE.CylinderGeometry(.05, .05, 2.9, 5); tongkat.translate(0, -1.1, 0);
  const pucuk = new THREE.CylinderGeometry(.06, .06, .3, 5); pucuk.translate(0, .85, 0);
  [kain, tongkat, pucuk].forEach(g => { g.deleteAttribute('uv'); });
  return mergeGeometries([kain.toNonIndexed(), tongkat.toNonIndexed(), pucuk.toNonIndexed()]);
}

function bahanFiguran() {
  const b = new THREE.MeshStandardMaterial({roughness: .8});
  b.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float slot; attribute vec3 cA; attribute vec3 cB; attribute vec3 cK; attribute vec3 cR; varying vec3 vWarna;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWarna = slot < .5 ? cA : slot < 1.5 ? cB : slot < 2.5 ? cK : slot < 3.5 ? cR : vec3(.035);');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWarna;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vWarna;');
  };
  b.customProgramCacheKey = () => 'pejalanDK1';
  return b;
}

export function buatPejalan({sc, jaringan, VS, tanah, padat, hemat, KEC = 15, I = {}, hujan = () => false, panggil = () => 'Kak', efek = () => {}}) {
  if (!jaringan) return null;
  const {xs, zs, rwX, rwZ, tetangga, NI, NJ, simpang, nx, nz} = jaringan;
  const id = (i, j) => j * NI + i, ada = (k, n) => tetangga[k].includes(n);
  let biji = 913; const acak = () => { biji = (biji * 16807) % 2147483647; return (biji - 1) / 2147483646; };
  const pilih = a => a[Math.floor(acak() * a.length)];
  const N = hemat ? 16 : 28;

  // ---------- mesh instanced ----------
  const bahan = bahanFiguran();
  const warna = ['cA', 'cB', 'cK', 'cR'].map(n => [n, new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3)]);
  const bagian = {};
  for (const [nama, geo] of [['kakiL', geoKaki()], ['kakiR', geoKaki()], ['lenganL', geoLengan()], ['lenganR', geoLengan()], ['badan', geoBadan()], ['kepala', geoKepala()], ['hijab', geoHijab()]]) {
    for (const [n, a] of warna) geo.setAttribute(n, a);
    const m = new THREE.InstancedMesh(geo, bahan, N); m.frustumCulled = false; m.castShadow = !hemat; m.receiveShadow = false; m.name = 'pejalan-' + nama;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bagian[nama] = m; sc.add(m);
  }
  const mPayung = new THREE.InstancedMesh(geoPayung(), new THREE.MeshStandardMaterial({roughness: .6, side: THREE.DoubleSide}), N);
  mPayung.frustumCulled = false; mPayung.castShadow = false; mPayung.instanceMatrix.setUsage(THREE.DynamicDrawUsage); sc.add(mPayung);
  const NOL = new THREE.Matrix4().makeScale(0, 0, 0);
  const _c = new THREE.Color();
  function warnai(i, p) {
    const isi = (k, hex) => { _c.setStyle(hex); warna[k][1].setXYZ(i, _c.r, _c.g, _c.b); };
    isi(0, p.baju); isi(1, p.celana); isi(2, p.kulit); isi(3, p.rambut);
    for (const [, a] of warna) a.needsUpdate = true;
    mPayung.setColorAt(i, _c.setHex(p.warnaPayung)); mPayung.instanceColor.needsUpdate = true;
  }

  // ---------- jaringan trotoar ----------
  const pojok = (k, sx, sz) => ({x: nx(k) + sx * (rwX[k % NI] + OFF), z: nz(k) + sz * (rwZ[(k / NI) | 0] + OFF)});
  const kunci = (k, sx, sz) => k * 4 + (sx > 0 ? 1 : 0) + (sz > 0 ? 2 : 0);
  // daftar ruas trotoar (dua sisi tiap ruas jalan), dipakai untuk memunculkan figuran
  const ruas = [];
  for (let k = 0; k < NI * NJ; k++) for (const n of tetangga[k]) { if (n < k) continue;
    if (n % NI !== k % NI) { const sx = Math.sign(nx(n) - nx(k)); for (const s of [-1, 1]) ruas.push({a: [k, sx, s], b: [n, -sx, s]}); }
    else { const sz = Math.sign(nz(n) - nz(k)); for (const s of [-1, 1]) ruas.push({a: [k, s, sz], b: [n, s, -sz]}); }
  }
  for (const r of ruas) { const A = pojok(...r.a), B = pojok(...r.b); r.ax = A.x; r.az = A.z; r.bx = B.x; r.bz = B.z; }
  // garis bebas benda keras & tidak menurun tajam (sungai/tebing)? hasil disimpan 8 detik (kavling dibangun bertahap)
  const cache = new Map();
  function bebasGaris(ax, az, bx, bz, jalan) {
    const kk = (ax * 7 + az * 13 + bx * 17 + bz * 19).toFixed(1); const c = cache.get(kk), now = performance.now();
    if (c && now - c.t < 8000) return c.ok;
    const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 1.6)), ux = (bx - ax) / (L || 1), uz = (bz - az) / (L || 1);
    let ok = true, yl = tanah(ax, az, 0), y0 = yl;
    for (let q = 0; q <= n && ok; q++) {
      const x = ax + (bx - ax) * q / n, z = az + (bz - az) * q / n, y = tanah(x, z, yl);
      if (Math.abs(y - yl) > 1.3 || (!jalan && Math.abs(y - y0) > 6)) ok = false;
      else for (const s of [-.5, 0, .5]) if (padat(x - uz * s, z + ux * s, y)) { ok = false; break; }
      yl = y;
    }
    cache.set(kk, {ok, t: now}); if (cache.size > 3000) cache.clear();
    return ok;
  }
  const bebasJalur = (p0, pts, jalan) => { let a = p0; for (const b of pts) { if (!bebasGaris(a.x, a.z, b.x, b.z, jalan)) return false; a = b; } return true; };

  // ---------- bangku & gerbang rumah ----------
  let bangku = [], tBangku = 0;
  function kumpulBangku() {
    const daftar = [], v = new THREE.Vector3(), q = new THREE.Quaternion(), f = new THREE.Vector3(), s = new THREE.Vector3();
    sc.traverse(o => { if (!o.userData.bangku || !o.parent) return; o.getWorldPosition(v); o.getWorldQuaternion(q); o.getWorldScale(s); f.set(0, 0, 1).applyQuaternion(q);
      const lama = bangku.find(b => Math.abs(b.x - v.x) < .1 && Math.abs(b.z - v.z) < .1);
      daftar.push(lama || {x: v.x, y: v.y, z: v.z, fx: f.x, fz: f.z, rx: f.z, rz: -f.x, w: o.userData.bangku * s.x, isi: [null, null]}); });
    bangku = daftar;
  }
  const gerbang = Object.values(I.lots || {}).filter(L => L && L.gate).map(L => ({x: L.gate.x, z: L.gate.z, ix: L.gate.x, iz: L.gate.z - L.dir * 1.3 * VS}));

  // ---------- data figuran ----------
  const P = [];
  for (let i = 0; i < N; i++) P.push({i, aktif: false, pos: new THREE.Vector3(), y: 0, yaw: 0, wp: [], mode: 'jalan', t: 0, ph: acak() * 6, cepat: 1,
    ox: 0, oz: 0, tox: 0, toz: 0, kembali: 0, gel: null, cool: 0, sapaT: 0, kag: 0, headY: 0, kecil: false, s: 1, hijab: false, payung: false, nyebrang: false});
  function dandani(p) {
    p.kecil = acak() < .15; p.s = p.kecil ? .72 : .94 + acak() * .1; p.hijab = !p.kecil && acak() < .35;
    p.kulit = pilih(KULIT); p.baju = pilih(BAJU); p.celana = pilih(CELANA); p.rambut = p.hijab ? pilih(HIJAB) : pilih(RAMBUT);
    if (p.kecil && acak() < .6) { p.baju = '#f4f4f4'; p.celana = '#c8202a'; }   // anak sekolah
    p.warnaPayung = pilih(PAYUNG); p.cepat = (p.kecil ? 1.15 : .85) + acak() * .3; p.payung = false; warnai(p.i, p);
  }
  const kelompok = [];
  let me = null, vx = 0, vz = 0, px0 = null, pz0 = 0, naik = false, jamKini = 12;

  function lepas(p) { p.aktif = false; p.wp.length = 0; p.mode = 'jalan'; p.gel = null; p.nyebrang = false; if (p.duduk) { p.duduk.b.isi[p.duduk.k] = null; p.duduk = null; } if (p.grup) { const g = p.grup; g.anggota = g.anggota.filter(x => x !== p); p.grup = null; } }
  function taruh(p, x, z) { p.pos.set(x, 0, z); p.y = tanah(x, z, 0); p.pos.y = p.y; p.ox = p.oz = p.tox = p.toz = 0; p.aktif = true; p.mode = 'jalan'; p.t = 0; p.headY = 0; dandani(p); p.payung = hujan() && !p.kecil && acak() < .75; }
  const jauhDari = (x, z) => me ? Math.hypot(x - me.position.x, z - me.position.z) : 0;

  function munculkan(p, r0, r1) {
    // 30%: keluar dari gerbang rumah warga
    if (gerbang.length && acak() < .3) { for (let c = 0; c < 6; c++) { const g = pilih(gerbang), d = jauhDari(g.x, g.z); if (d < r0 * .6 || d > r1) continue;
      let best = null, bd = 1e9; for (const r of ruas) { const t = proyeksi(r, g.x, g.z); if (t.d < bd) { bd = t.d; best = {r, ...t}; } }
      if (!best || bd > 2.6 * VS) continue;
      const tuju = acak() < .5 ? best.r.a : best.r.b, B = pojok(...tuju);
      if (!bebasJalur({x: g.ix, z: g.iz}, [g, {x: best.x, z: best.z}], false) || !bebasGaris(best.x, best.z, B.x, B.z, false)) continue;
      taruh(p, g.ix, g.iz); p.yaw = Math.atan2(g.x - g.ix, g.z - g.iz); p.ke = tuju; p.dari = tuju === best.r.a ? best.r.b : best.r.a;
      p.wp.push(g, {x: best.x, z: best.z}, {x: B.x, z: B.z}); return true; } }
    for (let c = 0; c < 30; c++) {
      const r = pilih(ruas), t = .05 + acak() * .9, x = r.ax + (r.bx - r.ax) * t, z = r.az + (r.bz - r.az) * t, d = jauhDari(x, z);
      if (d < r0 || d > r1 || !bebasGaris(r.ax, r.az, r.bx, r.bz, false)) continue;
      // 30%: muncul langsung sebagai kelompok yang sedang ngobrol
      if (acak() < .3 && kelompok.length < (hemat ? 1 : 2)) { const lain = P.filter(q => q !== p && !q.aktif); if (lain.length) { buatKelompok(r, [p, ...lain.slice(0, acak() < .35 ? 2 : 1)], t); return true; } }
      // kebanyakan berjalan MENUJU pemain supaya sekitar pemain selalu ramai
      const da = jauhDari(r.ax, r.az), db = jauhDari(r.bx, r.bz), maju = acak() < .75 ? db < da : da < db;
      taruh(p, x, z); p.ke = maju ? r.b : r.a; p.dari = maju ? r.a : r.b; const B = pojok(...p.ke); p.wp.push({x: B.x, z: B.z}); p.yaw = Math.atan2(B.x - x, B.z - z);
      return true;
    }
    return false;
  }
  function proyeksi(r, x, z) {
    const dx = r.bx - r.ax, dz = r.bz - r.az, L2 = dx * dx + dz * dz || 1, t = Math.max(.05, Math.min(.95, ((x - r.ax) * dx + (z - r.az) * dz) / L2));
    const qx = r.ax + dx * t, qz = r.az + dz * t; return {x: qx, z: qz, d: Math.hypot(x - qx, z - qz)};
  }
  function buatKelompok(r, anggota, t = .5) {
    const cx = r.ax + (r.bx - r.ax) * t, cz = r.az + (r.bz - r.az) * t, L = Math.hypot(r.bx - r.ax, r.bz - r.az) || 1;
    const ux = (r.bx - r.ax) / L, uz = (r.bz - r.az) / L;
    // sisi luar trotoar (menjauhi tengah jalan)
    const k = r.a[0], ox = Math.sign(cx - nx(k)) * (Math.abs(uz) > .5 ? 1 : 0), oz = Math.sign(cz - nz(k)) * (Math.abs(ux) > .5 ? 1 : 0);
    const titik = [[cx - ux * .8 * M, cz - uz * .8 * M], [cx + ux * .8 * M, cz + uz * .8 * M], [cx + ox * .8 * M, cz + oz * .8 * M]];
    const g = {anggota: [], dialog: pilih(DIALOG), ke: 0, t: 0, sampai: 25 + acak() * 25, cx, cz, r};
    anggota.forEach((p, q) => { const [x, z] = titik[q]; if (q === 2 && padat(x, z, tanah(x, z, 0))) return;
      taruh(p, x, z); p.mode = 'ngobrol'; p.grup = g; p.yaw = Math.atan2(cx - x, cz - z); p.wp.length = 0; g.anggota.push(p); });
    kelompok.push(g);
  }
  function bubarkan(g) {
    g.anggota.forEach((p, q) => { p.grup = null; p.mode = 'jalan'; const ke = q % 2 ? g.r.a : g.r.b; p.ke = ke; p.dari = q % 2 ? g.r.b : g.r.a; const B = pojok(...ke); p.wp.length = 0; p.wp.push({x: B.x, z: B.z}); });
    g.anggota = []; kelompok.splice(kelompok.indexOf(g), 1);
  }
  const ucap = (p, teks, lama = 3200) => { p.gel = {m: teks.replace('{p}', panggil()), sampai: performance.now() + lama}; };

  // ---------- rencana di tiap pojok simpang ----------
  function syaratNyebrang(k, vert, cx, cz) {
    if (simpang.has(k)) return () => { const f = (performance.now() / 1000) % 16; return vert ? f < 5.5 : f >= 8 && f < 13.5; };   // jalan tegak merah / jalan mendatar merah
    return () => !armada.some(c => Math.abs(c.o.position.x - cx) + Math.abs(c.o.position.z - cz) < 26);
  }
  function rencana(p) {
    const [k, sx, sz] = p.ke, i = k % NI, j = (k / NI) | 0, x0 = nx(k), z0 = nz(k), ax = rwX[i], az = rwZ[j], A = pojok(k, sx, sz);
    const opsi = [], dari = p.dari ? kunci(...p.dari) : -1;
    const nH = i + sx >= 0 && i + sx < NI && ada(k, id(i + sx, j)) ? id(i + sx, j) : -1, nV = j + sz >= 0 && j + sz < NJ && ada(k, id(i, j + sz)) ? id(i, j + sz) : -1;
    if (nH >= 0) { const B = pojok(nH, -sx, sz); opsi.push({w: 1, ke: [nH, -sx, sz], wp: [B]}); }
    if (nV >= 0) { const B = pojok(nV, sx, -sz); opsi.push({w: 1, ke: [nV, sx, -sz], wp: [B]}); }
    // pindah sisi jalan tegak (sx -> -sx)
    { const C = pojok(k, -sx, sz);
      if (nV >= 0) { const zz = z0 + sz * (az + 1.4 * M), a = {x: x0 + sx * (ax + OFF), z: zz}, b = {x: x0 - sx * (ax + OFF), z: zz};
        opsi.push({w: .35, nyeb: 1, ke: [k, -sx, sz], wp: [a, {...b, nyebrang: 1, syarat: syaratNyebrang(k, true, x0, zz), hadap: [b.x, b.z]}, C]}); }
      else opsi.push({w: .5, ke: [k, -sx, sz], wp: [C]}); }
    // pindah sisi jalan mendatar (sz -> -sz)
    { const C = pojok(k, sx, -sz);
      if (nH >= 0) { const xx = x0 + sx * (ax + 1.4 * M), a = {x: xx, z: z0 + sz * (az + OFF)}, b = {x: xx, z: z0 - sz * (az + OFF)};
        opsi.push({w: .35, nyeb: 1, ke: [k, sx, -sz], wp: [a, {...b, nyebrang: 1, syarat: syaratNyebrang(k, false, xx, z0), hadap: [b.x, b.z]}, C]}); }
      else opsi.push({w: .5, ke: [k, sx, -sz], wp: [C]}); }
    let cocok = opsi.filter(o => kunci(...o.ke) !== dari && bebasJalur(A, o.wp, !!o.nyeb));
    if (!cocok.length) cocok = opsi.filter(o => bebasJalur(A, o.wp, !!o.nyeb));
    if (!cocok.length) { lepas(p); return; }
    let tot = cocok.reduce((s, o) => s + o.w, 0), r = acak() * tot, o = cocok[0];
    for (const c of cocok) { r -= c.w; if (r <= 0) { o = c; break; } }
    p.dari = p.ke; p.ke = o.ke;
    for (const w of o.wp) p.wp.push(w);
    // syarat nyebrang diperiksa saat tiba di titik tunggu (sebelum titik seberang)
    for (let q = 0; q < p.wp.length; q++) if (p.wp[q].syarat && q > 0) { p.wp[q - 1] = {...p.wp[q - 1], tunggu: p.wp[q].syarat, hadap: p.wp[q].hadap}; }
  }

  // ---------- pose & matriks ----------
  const _r = new THREE.Matrix4(), _b = new THREE.Matrix4(), _o = new THREE.Matrix4(), _t = new THREE.Matrix4(), _q = new THREE.Matrix4();
  function anggota(m, i, induk, x, y, z, rx, rz = 0, ry = 0) {
    _o.copy(induk).multiply(_t.makeTranslation(x, y, z)).multiply(_q.makeRotationX(rx));
    if (ry) _o.multiply(_q.makeRotationY(ry)); if (rz) _o.multiply(_q.makeRotationZ(rz));
    m.setMatrixAt(i, _o);
  }
  function gambar(p, ps) {
    const i = p.i, s = p.s;
    _r.makeTranslation(p.pos.x + p.ox, p.y + (ps.dy || 0) * s, p.pos.z + p.oz).multiply(_q.makeRotationY(p.yaw));
    if (ps.tilt) _r.multiply(_q.makeRotationX(ps.tilt));
    _r.multiply(_t.makeScale(s, s, s));
    anggota(bagian.kakiL, i, _r, -.27, 1.37, 0, ps.legL || 0, ps.legLz || 0); anggota(bagian.kakiR, i, _r, .27, 1.37, 0, ps.legR || 0, ps.legRz || 0);
    _b.copy(_r).multiply(_t.makeTranslation(0, 1.37, 0)); if (ps.lean) _b.multiply(_q.makeRotationX(ps.lean)); if (ps.goyang) _b.multiply(_q.makeRotationZ(ps.goyang));
    bagian.badan.setMatrixAt(i, _b);
    anggota(bagian.lenganL, i, _b, -.79, 1.1, 0, ps.armL || 0, ps.armLz != null ? ps.armLz : .08); anggota(bagian.lenganR, i, _b, .79, 1.1, 0, ps.armR || 0, ps.armRz != null ? ps.armRz : -.08);
    anggota(p.hijab ? bagian.hijab : bagian.kepala, i, _b, 0, 1.2, 0, ps.head || 0, 0, ps.headY || 0);
    (p.hijab ? bagian.kepala : bagian.hijab).setMatrixAt(i, NOL);
    if (p.payung && ps.payung !== false) { _o.copy(_b).multiply(_t.makeTranslation(.75, 3.4, .85)); mPayung.setMatrixAt(i, _o); } else mPayung.setMatrixAt(i, NOL);
  }
  function sembunyi(i) { for (const m of Object.values(bagian)) m.setMatrixAt(i, NOL); mPayung.setMatrixAt(i, NOL); }
  const hadapi = (p, x, z, a) => { let dr = Math.atan2(x - p.pos.x, z - p.pos.z) - p.yaw; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); p.yaw += dr * Math.min(1, a); };

  // ---------- reaksi terhadap pemain ----------
  function reaksi(p, dt, now) {
    if (!me || p.mode === 'jatuh' || p.mode === 'duduk') return;
    const rx = p.pos.x + p.ox - me.position.x, rz = p.pos.z + p.oz - me.position.z, d = Math.hypot(rx, rz), sp = Math.hypot(vx, vz);
    p.dekat = d;
    if (d > 26) return;
    // keserempet kendaraan pemain: jatuh terduduk lalu bangun ngomel
    if (naik && sp > 1.3 * KEC && d < 1.35 * M && now > p.cool) {
      p.mode = 'jatuh'; p.t = 0; p.cool = now + 6000;
      const l = sp || 1, gx = vx / l * 1.4 * M, gz = vz / l * 1.4 * M; if (!padat(p.pos.x + p.ox + gx, p.pos.z + p.oz + gz, p.y)) { p.tox = p.ox + gx; p.toz = p.oz + gz; } p.yaw = Math.atan2(-vx, -vz);
      if (p.grup) { const g = p.grup; g.anggota = g.anggota.filter(x => x !== p); p.grup = null; }
      ucap(p, pilih(['Aduh!', 'Waaa!', 'Eh eh eh!']), 1200); efek('serempet', p.pos); return;
    }
    // pemain mendekat cepat: kaget & meloncat menghindar; pemain jalan biasa: minggir sopan
    if (sp > .45 * KEC && now > p.kag && p.mode !== 'ngobrol') {
      const ttc = (rx * vx + rz * vz) / (sp * sp);
      if (ttc > 0 && ttc < (sp > 1.3 * KEC ? .75 : .5)) {
        const cx = rx - vx * ttc, cz = rz - vz * ttc, dekat = Math.hypot(cx, cz);
        if (dekat < 1.7 * M) {
          let s = Math.sign(rx * vz - rz * vx) || 1; const nxv = vz / sp * s, nzv = -vx / sp * s, jauh = (sp > 1.3 * KEC ? 1.9 : 1.1) * M;
          // jangan meloncat ke benda keras
          if (padat(p.pos.x + nxv * jauh, p.pos.z + nzv * jauh, p.y)) s = -s;
          p.tox = s * vz / sp * jauh; p.toz = -s * vx / sp * jauh; p.kembali = now + 2600; p.kag = now + 2200;
          if (sp > 1.3 * KEC) { p.mode = 'kaget'; p.t = 0; if (acak() < .75) ucap(p, pilih(KAGET)); }
          else if (acak() < .35) ucap(p, pilih(PERMISI), 2200);
          return;
        }
      }
    }
    // didekati pelan: menoleh, sesekali melambai & menyapa
    if (sp < .4 * KEC && d < 4.5 * M && now > p.sapaT && p.mode === 'jalan') {
      p.sapaT = now + 25000 + acak() * 15000;
      if (acak() < .55 && now > sapaGlobal) { sapaGlobal = now + 3500; p.mode = 'sapa'; p.t = 0; const j = jamKini; ucap(p, pilih(SAPA[j < 10.5 ? 'pagi' : j < 15 ? 'siang' : j < 18.5 ? 'sore' : 'malam'])); }
    }
  }
  let sapaGlobal = 0;

  // ---------- ketuk figuran: ngobrol singkat ----------
  const _v = new THREE.Vector3();
  function ketuk(cx, cy, cam) {
    let best = null, bd = 46;
    for (const p of P) { if (!p.aktif || p.dekat == null || p.dekat > 90 || p.mode === 'jatuh') continue;
      _v.set(p.pos.x + p.ox, p.y + 2.6 * p.s, p.pos.z + p.oz).project(cam); if (_v.z > 1) continue;
      const sx = (_v.x + 1) / 2 * innerWidth, sy = (1 - _v.y) / 2 * innerHeight, d = Math.hypot(sx - cx, sy - cy); if (d < bd) { bd = d; best = p; } }
    if (!best) return false;
    const p = best; if (p.mode === 'duduk' || p.mode === 'ngobrol') { ucap(p, pilih(OBROLAN), 5000); p.lihat = performance.now() + 5000; return true; }
    p.mode = 'diketuk'; p.t = 0; ucap(p, pilih(OBROLAN), 5000); efek('ketuk', p.pos); return true;
  }

  // ---------- klakson kendaraan NPC saat dihalangi pemain ----------
  let armada = [];
  const klakson = new Map();
  function cekKlakson(now) {
    for (const c of armada) {
      const k = klakson.get(c) || {t: 0, cool: 0, gel: null}; klakson.set(c, k);
      if (c.dihalangi) { k.t += 1; if (k.t > 70 && now > k.cool) { k.cool = now + 9000; k.gel = {m: pilih(KLAKSON).replace('{p}', panggil()), sampai: now + 2600}; } } else k.t = 0;
    }
  }

  // ---------- update tiap frame ----------
  let mulai = false, nGambar = 0;
  function update(dt, pemain, jam, daftarArmada, dipakai) {
    me = pemain; jamKini = jam; armada = daftarArmada || []; naik = !!dipakai;
    const now = performance.now();
    if (px0 != null && dt > 0) { const ix = (me.position.x - px0) / dt, iz = (me.position.z - pz0) / dt; if (Math.hypot(ix, iz) < 200) { vx += (ix - vx) * Math.min(1, dt * 10); vz += (iz - vz) * Math.min(1, dt * 10); } }
    px0 = me.position.x; pz0 = me.position.z;
    if (now - tBangku > (bangku.length ? 20000 : 4000)) { tBangku = now; kumpulBangku(); }
    cekKlakson(now);
    // jumlah figuran ikut jam (WIB)
    const f = jam < 5 ? .15 : jam < 6 ? .4 : jam < 9 ? 1 : jam < 11 ? .75 : jam < 15 ? .6 : jam < 18 ? 1 : jam < 20 ? .8 : jam < 22 ? .45 : .25;
    const target = Math.max(2, Math.round(N * f)); let aktif = P.filter(p => p.aktif).length, muncul = 0;
    const awal = !mulai; mulai = true;
    for (const p of P) {
      if (!p.aktif) { if (aktif < target && muncul < (awal ? N : 2)) { if (munculkan(p, awal ? 8 : 60, awal ? 110 : 140)) { aktif++; muncul++; } } continue; }
      const d = jauhDari(p.pos.x, p.pos.z);
      if (d > 160 || (aktif > target && d > 100 && !p.grup)) { lepas(p); aktif--; continue; }
      if (p.kecil && (jam < 6 || jam > 19)) { if (d > 60) { lepas(p); aktif--; continue; } }
      langkah(p, dt, now);
    }
    // kelompok ngobrol: bergantian bicara bila pemain dekat
    for (const g of [...kelompok]) {
      g.t += dt; if (!g.anggota.length) { kelompok.splice(kelompok.indexOf(g), 1); continue; }
      if (g.t > g.sampai || g.anggota.length < 2) { bubarkan(g); continue; }
      const d = jauhDari(g.cx, g.cz); if (d < 75 && g.t - (g.tBicara || -9) > 3.3) { g.tBicara = g.t; const p = g.anggota[g.ke % g.anggota.length]; ucap(p, g.dialog[g.ke % g.dialog.length], 3000); p.bicara = now + 3000; g.ke++; }
    }
    // gambar
    nGambar = 0;
    for (const p of P) {
      if (!p.aktif || (p.dekat != null ? p.dekat : jauhDari(p.pos.x, p.pos.z)) > 190) { sembunyi(p.i); continue; }
      gambar(p, poseDari(p, now)); nGambar++;
    }
    for (const m of Object.values(bagian)) m.instanceMatrix.needsUpdate = true;
    mPayung.instanceMatrix.needsUpdate = true;
  }
  function langkah(p, dt, now) {
    p.dekat = jauhDari(p.pos.x + p.ox, p.pos.z + p.oz);
    reaksi(p, dt, now);
    // geser samping (menghindar) kembali pelan ke trotoar
    if (p.kembali && now > p.kembali) { p.tox = 0; p.toz = 0; p.kembali = 0; }
    const a = Math.min(1, dt * (p.mode === 'kaget' || p.mode === 'jatuh' ? 9 : 2.5)); p.ox += (p.tox - p.ox) * a; p.oz += (p.toz - p.oz) * a;
    p.nyebrang = (p.wp[0] && p.wp[0].nyebrang) || Math.hypot(p.ox, p.oz) > .6 * M;
    p.t += dt; p.ph += dt;
    if (p.mode === 'jatuh') { if (p.t > 3.2) { p.mode = 'jalan'; p.tox = p.toz = 0; } if (p.t > .9 && !p.ngomel) { p.ngomel = 1; ucap(p, pilih(NGOMEL), 3000); } if (p.t > 3.2) p.ngomel = 0; return; }
    if (p.mode === 'kaget') { if (p.t > .9) p.mode = 'jalan'; return; }
    if (p.mode === 'sapa') { hadapi(p, me.position.x, me.position.z, dt * 6); if (p.t > 1.6) p.mode = 'jalan'; return; }
    if (p.mode === 'diketuk') { hadapi(p, me.position.x, me.position.z, dt * 6); if (p.t > 4.5 || p.dekat > 40) p.mode = 'jalan'; return; }
    if (p.mode === 'ngobrol') { if (p.grup) { const g = p.grup; if (p.lihat > now) hadapi(p, me.position.x, me.position.z, dt * 5); else hadapi(p, g.cx, g.cz, dt * 4); } return; }
    if (p.mode === 'duduk') { const D = p.duduk; if (p.lihat > now) p.headY = Math.max(-1, Math.min(1, Math.atan2(me.position.x - p.pos.x, me.position.z - p.pos.z) - p.yaw));
      if (p.t > D.lama) { D.b.isi[D.k] = null; p.mode = 'jalan'; p.duduk = null; p.y = tanah(D.dx, D.dz, p.y); p.pos.set(D.dx, p.y, D.dz); } return; }
    // jalan menuju titik berikut
    if (!p.wp.length) { rencana(p); if (!p.aktif) return; if (!p.wp.length) { lepas(p); return; } }
    const w = p.wp[0];
    const dx = w.x - p.pos.x, dz = w.z - p.pos.z, l = Math.hypot(dx, dz);
    if (l < .25) {
      if (w.tunggu && !w.tunggu()) { p.diam = true; p.tungguT = (p.tungguT || 0) + dt; if (w.hadap) hadapi(p, w.hadap[0], w.hadap[1], dt * 5); if (p.tungguT > 22) { p.tungguT = 0; p.wp.length = 0; } return; }
      p.tungguT = 0; p.wp.shift();
      if (w.hilang) { lepas(p); return; }
      if (w.tiba) w.tiba();
      return;
    }
    p.diam = false;
    let sp = KEC * .38 * p.cepat * (p.payung ? 1.12 : 1) * (w.nyebrang ? 1.25 : 1) * dt;
    // pemain berdiri di depan: melambat & geser ke samping (tidak menembus)
    if (me && p.dekat < 2.2 * M) { const hx = dx / l, hz = dz / l, rx = me.position.x - p.pos.x, rz = me.position.z - p.pos.z, maju = rx * hx + rz * hz, samping = rx * hz - rz * hx;
      if (maju > 0 && maju < 2 * M && Math.abs(samping) < 1.1 * M) { const s = samping > 0 ? -1 : 1, j = 1.2 * M; if (!padat(p.pos.x + hz * s * j, p.pos.z - hx * s * j, p.y)) { p.tox = hz * s * j; p.toz = -hx * s * j; p.kembali = now + 1800; } sp *= .6; } }
    const m = Math.min(l, sp); p.pos.x += dx / l * m; p.pos.z += dz / l * m; p.y = tanah(p.pos.x, p.pos.z, p.y); p.pos.y = p.y;
    hadapi(p, w.x, w.z, dt * 7);
    p.ph += m * .55 / p.s;
    // kepala menoleh ke pemain yang dekat
    const tY = me && p.dekat < 5 * M ? Math.max(-1, Math.min(1, (() => { let r = Math.atan2(me.position.x - p.pos.x, me.position.z - p.pos.z) - p.yaw; return Math.atan2(Math.sin(r), Math.cos(r)); })())) : 0;
    p.headY += (tY - p.headY) * Math.min(1, dt * 4);
    // sesekali mampir duduk di bangku dekat jalan, atau masuk ke rumah warga
    if (!w.nyebrang && !w.tunggu && (p.cekT = (p.cekT || 0) + dt) > 1.3) { p.cekT = 0; mampir(p, now); }
  }
  function mampir(p, now) {
    if (p.dekat < 9) return;
    if (bangku.length && acak() < .35) for (const b of bangku) {
      const fx = b.x + b.fx * 1.1 * M, fz = b.z + b.fz * 1.1 * M; if (Math.hypot(fx - p.pos.x, fz - p.pos.z) > 8 * M) continue;
      const k = b.isi[0] ? (b.isi[1] ? -1 : 1) : 0; if (k < 0 || (b.pakai || 0) > now) continue;
      const off = (k ? 1 : -1) * Math.min(.3 * b.w, 1.1 * M), sx = b.x + b.rx * off, sz = b.z + b.rz * off, ax = sx + b.fx * 1.1 * M, az = sz + b.fz * 1.1 * M;
      if (!bebasGaris(p.pos.x, p.pos.z, ax, az, false)) continue;
      b.isi[k] = p; b.pakai = now + 4000;
      p.wp.unshift({x: ax, z: az}, {x: sx + b.fx * .5 * M, z: sz + b.fz * .5 * M, duduk: 1});
      p.wp[1].tiba = () => { p.mode = 'duduk'; p.t = 0; p.duduk = {b, k, lama: 12 + acak() * 18, dx: ax, dz: az}; p.pos.set(sx + b.fx * .12 * M, b.y, sz + b.fz * .12 * M); p.y = b.y; p.yaw = Math.atan2(b.fx, b.fz); p.headY = 0; };
      return;
    }
    if (gerbang.length && acak() < .1) for (const g of gerbang) {
      if (Math.hypot(g.x - p.pos.x, g.z - p.pos.z) > 4 * M) continue;
      if (!bebasJalur(p.pos, [g, {x: g.ix, z: g.iz}], false)) continue;
      p.wp.unshift({x: g.x, z: g.z}, {x: g.ix, z: g.iz, hilang: 1}); return;
    }
  }

  function poseDari(p, now) {
    const t = p.t, ph = p.ph;
    if (p.mode === 'jatuh') {
      // 0–.3 terhuyung ke belakang, .3–.55 jatuh terduduk, s.d. 2.6 duduk ngomel (kepala geleng, tangan menunjuk), 2.6–3.2 bangun
      if (t < .3) { const k = t / .3; return {lean: -.5 * k, armL: -2.6 * k, armR: -2.6 * k, armLz: .5 * k, armRz: -.5 * k, legL: .3 * k, legR: -.2 * k, payung: false}; }
      if (t < 2.6) { const k = Math.min(1, (t - .3) / .25), g = t > .9 ? Math.sin(t * 9) * .35 : 0;
        return {dy: -1.12 * k, legL: -1.5 * k, legR: -1.35 * k, lean: -.5 + .3 * k, armL: .6 * k, armR: t > 1.1 ? -1.6 + Math.sin(t * 12) * .25 : .6 * k, armLz: .3, armRz: -.3, headY: g, payung: false}; }
      const k = 1 - Math.min(1, (t - 2.6) / .6); return {dy: -1.12 * k, legL: -1.5 * k, legR: -1.35 * k, lean: -.2 * k + .25 * (1 - k) * k * 4, armL: .3 * k, armR: .3 * k};
    }
    if (p.mode === 'kaget') { const k = Math.sin(Math.min(1, t / .9) * Math.PI); return {dy: k * .55, armL: -2.9 * k, armR: -2.9 * k, armLz: .6 * k, armRz: -.6 * k, legL: -.6 * k, legR: .2 * k, lean: -.25 * k, payung: k < .3}; }
    if (p.mode === 'sapa') { const k = Math.min(1, t * 4) * Math.min(1, (1.6 - t) * 4); return {armR: -2.9 * k, armRz: -.25 * k + Math.sin(t * 14) * .3 * k, headY: p.headY * .3}; }
    if (p.mode === 'diketuk') return {armR: p.payung ? -1.25 : -1.1 + Math.sin(t * 5) * .5, armL: -.3, head: Math.sin(t * 3) * .08};
    if (p.mode === 'ngobrol') { const b = p.bicara > now; return {armR: b ? -1.2 + Math.sin(ph * 6) * .45 : -.15, armL: b ? -.8 + Math.sin(ph * 5 + 1) * .3 : (p.i % 3 ? -.15 : -.5), armLz: p.i % 3 ? .08 : .9, head: b ? Math.sin(ph * 4) * .1 : 0, headY: p.lihat > now ? .6 : 0}; }
    if (p.mode === 'duduk') return {dy: -1.12 + .02, legL: -1.5, legR: -1.5, armL: -.55, armR: -.55, headY: p.headY, head: .05};
    if (p.diam || !p.wp.length) return {armR: p.payung ? -1.25 : -.1, armRz: p.payung ? -.05 : -.08, headY: p.headY, head: Math.sin(ph * .7) * .05};
    const a = Math.sin(p.ph * 3.2) * (p.wp[0] && p.wp[0].nyebrang ? .8 : .62);
    return {legL: a, legR: -a, armL: -a * .8, armR: p.payung ? -1.25 : a * .8, armRz: p.payung ? -.05 : -.08, headY: p.headY};
  }


  // ---------- gelembung obrolan (maks 3 terdekat, supaya layar HP tidak penuh) ----------
  const _g = [];
  function gelembung() {
    const now = performance.now(); _g.length = 0;
    for (const p of P) if (p.aktif && p.gel && p.gel.sampai > now && p.dekat < 90) _g.push({position: _gpos(p), h: p.mode === 'duduk' || (p.mode === 'jatuh' && p.t > .3 && p.t < 2.6) ? 5.2 * p.s : 6.6 * p.s, m: p.gel.m, d: p.dekat});
    _g.sort((a, b) => a.d - b.d); if (_g.length > 3) _g.length = 3;
    for (const [c, k] of klakson) if (k.gel && k.gel.sampai > now && me && Math.hypot(c.o.position.x - me.position.x, c.o.position.z - me.position.z) < 80) _g.push({position: c.o.position, h: 6.2, m: k.gel.m});
    return _g;
  }
  const _gp = []; function _gpos(p) { const v = _gp[p.i] || (_gp[p.i] = new THREE.Vector3()); return v.set(p.pos.x + p.ox, p.y, p.pos.z + p.oz); }
  // posisi figuran yang sedang di badan jalan (nyebrang / menghindar): kendaraan NPC berhenti untuk mereka
  const _h = [];
  function diJalan() { _h.length = 0; for (const p of P) if (p.aktif && (p.nyebrang || p.mode === 'jatuh')) _h.push(_gpos(p)); return _h; }
  // bangku terdekat (untuk tombol 💃 Gerak → Duduk)
  function bangkuDekat(x, z, maks = 2.6 * M) { let best = null, bd = maks; for (const b of bangku) { const d = Math.hypot(b.x - x, b.z - z); if (d < bd) { bd = d; best = b; } } return best; }

  return {_uji: () => { const d = r => jauhDari((r.ax + r.bx) / 2, (r.az + r.bz) / 2); return {ruas: ruas.length, ok: ruas.filter(r => bebasGaris(r.ax, r.az, r.bx, r.bz, false)).length, dekat: ruas.filter(r => d(r) < 120).length, dekatOk: ruas.filter(r => d(r) < 120 && bebasGaris(r.ax, r.az, r.bx, r.bz, false)).length, bangku: bangku.length, gerbang: gerbang.length, pjg: Math.round(ruas.reduce((s, r) => s + Math.hypot(r.bx - r.ax, r.bz - r.az), 0) / ruas.length)}; }, update, ketuk, gelembung, diJalan, bangkuDekat, P, jumlah: () => P.filter(p => p.aktif).length};
}

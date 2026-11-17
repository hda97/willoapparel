// Sawah Wetan (Huda 18 Nov 2026: "Tambahkan juga game berkebun menanam apa saja di lahan sawah Desa Wetan, sekarang lahannya
// dijual, warga bisa beli petak dan menanam apa saja").
// Sawah di seberang sungai Dusun Kotak Wetan dibagi 80 petak (10 kolom × 8 baris). Warga membeli petak pakai koin (maks 2),
// lalu menanam bibit apa saja (11 tanaman, 30 menit s.d. 24 jam, waktu nyata). Panen = koin langsung. Siapa saja boleh MENYIRAM
// tanaman yang belum disiram (tumbuh lebih cepat); menyiram sawah tetangga dapat koin kecil → warga saling bantu.
// Sawah v2 (Huda 18 Nov 2026 "Game play sawah kurang menarik"): ulat/gulma/burung datang di 3 tahap tumbuh → ketuk untuk mengusir
// (bonus panen; mengusir di petak tetangga dapat koin), panen pakai mini-game ketepatan + peluang Panen Raya ×2, Level Petani membuka
// tanaman baru, dan 3 pesanan warga tiap hari. Tetap santai: gangguan yang dibiarkan tidak merusak tanaman, hanya bonusnya hilang. Hemat API (paket gratis Cloudflare): lihat sawah = 1 GET publik ber-cache,
// tiap aksi = 1 POST. Masuk dari tombol 🌾 Sawah di Kotak Wetan (seperti 🏁 Reli di Curug). Tamu boleh melihat saja.
import '../mabar/js/putar.js'; // HP tegak -> tampil mendatar, sama seperti game desa
import * as THREE from 'three';
import {warga} from '../mabar/js/aset/avatar.js';
import {buatKebun} from '../mabar/js/tanamanSawah.js?v=20261118a';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const baca = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const simpan = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let AKUN = null; { const w = baca('dk_warga'); if (w && w.kunci) AKUN = {no: w.no, kunci: w.kunci, ig: w.ig}; }
const LOKAL = Object.assign({av: null}, baca('dk_sawah') || {});

// ---------- data dari server ----------
let D = null, SAYA = null, SELISIH = 0, PILIH = -1, MODE = 'info';   // MODE: info | bibit
const kini = () => Date.now() + SELISIH;
const KOLOM = 10, BARIS = 8, UK = 6, CELAH = 1.3, LANGKAH = UK + CELAH;
const PX = c => (c - (KOLOM - 1) / 2) * LANGKAH, PZ = r => ((BARIS - 1) / 2 - r) * LANGKAH;   // baris 0 = paling depan (dekat kamera)
const petakDi = p => D && D.petak.find(x => x.p === p);
const durasi = ms => { const m = Math.max(0, Math.ceil(ms / 60e3)); if (m < 60) return m + ' mnt'; const j = Math.floor(m / 60), s = m % 60; return j + ' jam' + (s ? ' ' + s + ' mnt' : ''); };
const lamaTn = t => t.menit < 60 ? t.menit + 'm' : (t.menit / 60) + 'j';
function terima(j) {
  if (!j) return; if (j.kini) SELISIH = j.kini - Date.now();
  if (j.petak) D = j;
  if (j.saya) { SAYA = j.saya; if (j.saya.avatar && JSON.stringify(j.saya.avatar) !== JSON.stringify(LOKAL.av)) { LOKAL.av = j.saya.avatar; simpan('dk_sawah', LOKAL); pasangAvatar(); } }
  bangunTanaman(); tulisAtas(); tulisPanel();
}
async function api(op, data = {}) {
  try {
    if (!op) { const r = await fetch('/duniakotak/api/sawah'); return await r.json(); }
    const r = await fetch('/duniakotak/api/sawah', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({kunci: AKUN.kunci, op, ...data})});
    const j = await r.json(); if (r.status === 401) AKUN = null; return j;
  } catch (e) { return {galat: 'Sinyal putus. Coba lagi sebentar.'}; }
}

// ---------- suara kecil (WebAudio, tanpa file) ----------
let AC = null;
function bunyi(fr = 660, d = .08, tipe = 'square', v = .05) {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain(); o.type = tipe; o.frequency.value = fr;
    g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d);
    o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d + .02); } catch (e) {}
}
const nada = (...f) => f.forEach((x, i) => setTimeout(() => bunyi(x, .1, 'triangle', .06), i * 90));
function toast(t, ms = 3000) { const d = document.createElement('div'); d.className = 'kaca'; d.textContent = t; d.style.animationDuration = ms + 'ms'; $('toast').appendChild(d); setTimeout(() => d.remove(), ms); }

// =====================================================================
// 1. ADEGAN: sawah 10×8 petak, pematang, saluran irigasi, sungai & rumah Kotak Wetan di kejauhan
// =====================================================================
const R = new THREE.WebGLRenderer({canvas: $('kanvas'), antialias: true, powerPreference: 'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputColorSpace = THREE.SRGBColorSpace;
const sc = new THREE.Scene(); sc.background = new THREE.Color(0xa8d8f2); sc.fog = new THREE.Fog(0xa8d8f2, 140, 260);
const cam = new THREE.PerspectiveCamera(38, 1, 1, 600);
sc.add(new THREE.HemisphereLight(0xffffff, 0x6a8a4a, 1.25));
const MATAHARI = new THREE.DirectionalLight(0xfff0d0, 2.0); MATAHARI.position.set(-40, 70, 45); MATAHARI.castShadow = true;
MATAHARI.shadow.mapSize.set(1024, 1024); Object.assign(MATAHARI.shadow.camera, {left: -50, right: 50, top: 45, bottom: -45, near: 10, far: 200}); sc.add(MATAHARI);
const mat = c => new THREE.MeshStandardMaterial({color: c, roughness: .9, flatShading: true});
const kotak = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
const LW = KOLOM * LANGKAH, LD = BARIS * LANGKAH;
// rumput luas + pematang (tanah sedikit lebih tinggi dari petak)
const rumput = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat(0x6aa84a)); rumput.rotation.x = -Math.PI / 2; rumput.position.y = -.05; rumput.receiveShadow = true; sc.add(rumput);
sc.add(Object.assign(kotak(LW + 3, .3, LD + 3, 0x8fb85a, 0, .1, 0), {castShadow: false}));
// saluran irigasi di depan & samping kiri sawah + sungai di belakang
const AIR = new THREE.MeshStandardMaterial({color: 0x4aa6e8, roughness: .25, metalness: .05});
const air = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, .2, d), AIR); m.position.set(x, .06, z); m.receiveShadow = true; sc.add(m); return m; };
air(LW + 8, 2.2, 0, LD / 2 + 3.2); air(2.2, LD + 8, -LW / 2 - 3.2, 0);
air(400, 16, 0, -LD / 2 - 16); sc.add(kotak(400, .35, 2, 0xb8a57a, 0, .05, -LD / 2 - 7), kotak(400, .35, 2, 0xb8a57a, 0, .05, -LD / 2 - 25));
// jembatan kayu ke desa
sc.add(kotak(6, .6, 20, 0x9a6a3a, -LW / 2 + 10, .35, -LD / 2 - 16));
// rumah-rumah Kotak Wetan di seberang sungai (siluet sederhana) + pohon
const ATAP = [0xc8553d, 0x3a7ad8, 0x3aa860, 0xe0a020, 0x9a5ad8, 0xd84a8a];
for (let i = 0; i < 14; i++) {
  const x = -95 + i * 15 + (i % 3) * 2, z = -LD / 2 - 44 - (i % 2) * 9, g = new THREE.Group();
  g.add(kotak(8, 5, 7, 0xf2ead8, 0, 2.5, 0)); const at = new THREE.Mesh(new THREE.ConeGeometry(6.4, 3.4, 4), mat(ATAP[i % ATAP.length])); at.position.y = 6.7; at.rotation.y = Math.PI / 4; at.castShadow = true; g.add(at);
  g.position.set(x, 0, z); sc.add(g);
}
const DAUN_P = mat(0x3f8a3a), BTG_P = mat(0x7a5a3a);
function pohon(x, z, s = 1) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(.35 * s, .45 * s, 3 * s, 6), BTG_P); b.position.y = 1.5 * s; g.add(b);
  const d = new THREE.Mesh(new THREE.IcosahedronGeometry(2.3 * s, 0), DAUN_P); d.position.y = 4.2 * s; d.castShadow = true; g.add(d); g.position.set(x, 0, z); sc.add(g); }
for (let i = 0; i < 9; i++) { pohon(LW / 2 + 9 + (i % 2) * 5, -LD / 2 + i * 8, .9 + (i % 3) * .15); pohon(-LW / 2 - 10 - (i % 2) * 5, -LD / 2 + 4 + i * 8, .8 + (i % 2) * .2); }
for (let i = 0; i < 12; i++) pohon(-100 + i * 18, -LD / 2 - 64 - (i % 2) * 6, 1.3);
// gubuk sawah (tempat istirahat petani) di pojok kanan depan
{ const g = new THREE.Group(); [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]].forEach(([a, b]) => g.add(kotak(.3, 2.6, .3, 0x7a5a3a, a, 1.3, b)));
  g.add(kotak(3.8, .25, 3, 0x9a6a3a, 0, 1, 0)); const at = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.6, 4), mat(0xd8b860)); at.position.y = 3.3; at.rotation.y = Math.PI / 4; at.castShadow = true; g.add(at);
  g.position.set(LW / 2 + 6, 0, LD / 2 + 7); sc.add(g); }

// petak: tanah (warna menurut keadaan), papan DIJUAL, bendera milikku, bingkai pilihan
const TANAH = new THREE.InstancedMesh(new THREE.BoxGeometry(UK, .3, UK), new THREE.MeshStandardMaterial({roughness: .95}), KOLOM * BARIS);
TANAH.receiveShadow = true; sc.add(TANAH);
const W_KOSONG = new THREE.Color(0xc9a46a), W_MILIK = new THREE.Color(0x7a5434), W_BASAH = new THREE.Color(0x5e4028), W_SAYA = new THREE.Color(0x6e4a2c);
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SKL = new THREE.Vector3(), C = new THREE.Color();
const E = new THREE.Euler();
function taruh(im, i, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) { E.set(rx, ry, rz); Q.setFromEuler(E); M4.compose(V.set(x, y, z), Q, SKL.set(sx, sy, sz)); im.setMatrixAt(i, M4); }
const TIANG = new THREE.InstancedMesh(new THREE.BoxGeometry(.18, 1.6, .18), mat(0x7a5a3a), KOLOM * BARIS);
const PAPAN = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, .8, .1), mat(0xf2c14a), KOLOM * BARIS);
const BENDERA = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, .65, .06), mat(0xe0803a), KOLOM * BARIS);
for (const m of [TIANG, PAPAN, BENDERA]) { m.castShadow = true; sc.add(m); }
const BINGKAI = new THREE.Group(); { const k = 0xffe066, t = .35, L = UK + .7;
  BINGKAI.add(kotak(L, .2, t, k, 0, .32, L / 2), kotak(L, .2, t, k, 0, .32, -L / 2), kotak(t, .2, L, k, L / 2, .32, 0), kotak(t, .2, L, k, -L / 2, .32, 0));
  BINGKAI.traverse(o => { if (o.material) { o.material = new THREE.MeshBasicMaterial({color: k}); o.castShadow = false; } }); BINGKAI.visible = false; sc.add(BINGKAI); }
// penanda melayang: ⭐ siap panen (petakku) & 💧 belum disiram (boleh dibantu siapa saja)
const BINTANG = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.55, 0), new THREE.MeshBasicMaterial({color: 0xffd23a}), KOLOM * BARIS);
const TETES = new THREE.InstancedMesh(new THREE.SphereGeometry(.38, 8, 6), new THREE.MeshBasicMaterial({color: 0x56b8ff}), KOLOM * BARIS);
BINTANG.count = TETES.count = 0; BINTANG.frustumCulled = TETES.frustumCulled = false; sc.add(BINTANG, TETES);
// gangguan: 0 ulat (hijau, menggeliat), 1 gulma (rumpun gelap, bergoyang), 2 burung pipit (cokelat, melompat). Maks 3 per petak.
const GG_IKON = ['🐛', '🌿', '🐦'], GG_NAMA = ['ulat', 'gulma', 'burung'], GG_OFS = [[-1.7, -1.5], [1.6, .3], [-.4, 1.8]];
const GG = [
  new THREE.InstancedMesh(new THREE.CapsuleGeometry(.42, 1.3, 2, 6).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({color: 0xc8f03a, roughness: .5, emissive: 0x2a3a00}), KOLOM * BARIS * 3),
  new THREE.InstancedMesh(new THREE.ConeGeometry(.8, 2.2, 5), new THREE.MeshStandardMaterial({color: 0x24501f, roughness: .9, flatShading: true}), KOLOM * BARIS * 3),
  new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, .85, .8), new THREE.MeshStandardMaterial({color: 0x6a3f1e, roughness: .8, flatShading: true}), KOLOM * BARIS * 3)];
GG.forEach(m => { m.count = 0; m.castShadow = true; m.frustumCulled = false; m.userData.l = []; sc.add(m); });   // posisi berubah tiap bingkai → jangan dipotong bola batas lama
// cincin merah kecil di bawah tiap gangguan → mudah dilihat & diketuk
const CINCIN = new THREE.InstancedMesh(new THREE.TorusGeometry(1.05, .17, 6, 20).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xff3a2a}), KOLOM * BARIS * 3);
CINCIN.count = 0; CINCIN.frustumCulled = false; sc.add(CINCIN);
// tanda seru merah melayang di atas tiap gangguan (terlihat dari jauh)
const SERU = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.42, 0), new THREE.MeshBasicMaterial({color: 0xff3a2a}), KOLOM * BARIS * 3);
SERU.count = 0; SERU.frustumCulled = false; sc.add(SERU);
let GG_AKTIF = [];   // [{p, i, jenis, x, z}]
const jenisGG = (pt, i) => (pt.p * 7 + i + (pt.t % 3)) % 3;
function gangguanAktif(pt, t = kini()) { const out = []; if (!pt || !pt.b || !D.ganggu) return out;
  D.ganggu.tahap.forEach((f, i) => { if (!((pt.g || 0) & (1 << i)) && t >= pt.t + f * (pt.siap - pt.t)) out.push(i); }); return out; }
const bonusGG = tn => Math.max(1, Math.round(tn.jual * ((D.ganggu && D.ganggu.bagian) || .1)));
const jmlBit = g => (g & 1) + ((g >> 1) & 1) + ((g >> 2) & 1);

// =====================================================================
// 2. TANAMAN: 3 InstancedMesh (daun, batang, buah) diisi ulang tiap keadaan berubah → ringan untuk HP (3 draw call)
// =====================================================================
const KEBUN = buatKebun(sc);
function tahap(pt, t = kini()) { if (!pt || !pt.b) return null; const tot = Math.max(1, pt.siap - pt.t); return {f: Math.min(1, Math.max(0, (t - pt.t) / tot)), siap: t >= pt.siap, sisa: Math.max(0, pt.siap - t)}; }
function bangunTanaman() {
  if (!D) return; const t = kini(); let nT = 0, nS = 0; const tanam = [];
  const milik = new Map(D.petak.map(x => [x.p, x]));
  for (let p = 0; p < KOLOM * BARIS; p++) {
    const c = p % KOLOM, r = Math.floor(p / KOLOM), x = PX(c), z = PZ(r), pt = milik.get(p), saya = SAYA && pt && pt.no === SAYA.no;
    taruh(TANAH, p, x, .2, z); TANAH.setColorAt(p, !pt ? W_KOSONG : saya ? W_SAYA : pt.b ? W_BASAH : W_MILIK);
    // papan DIJUAL di petak kosong, bendera oranye di petakku
    if (!pt) { taruh(TIANG, p, x + UK / 2 - .5, 1, z + UK / 2 - .5); taruh(PAPAN, p, x + UK / 2 - .5, 1.65, z + UK / 2 - .45); }
    else { taruh(TIANG, p, 0, -9, 0, .01, .01, .01); taruh(PAPAN, p, 0, -9, 0, .01, .01, .01); }
    if (saya) taruh(BENDERA, p, x - UK / 2 + .55 + .55, 1.45, z + UK / 2 - .5); else taruh(BENDERA, p, 0, -9, 0, .01, .01, .01);
    if (saya) taruh(TIANG, p, x - UK / 2 + .5, 1, z + UK / 2 - .5);
    const th = tahap(pt, t);
    if (th) tanam.push({x, z, b: pt.b, f: th.f, siap: th.siap, kunci: p});
    if (th && th.siap && saya) BINTANG.userData[nT++] = [x, z];
    if (th && !th.siap && !pt.s) TETES.userData[nS++] = [x, z];
  }
  BINTANG.count = nT; TETES.count = nS; KEBUN.isi(tanam, {uk: UK, k: 1, y: 0});
  GG_AKTIF = []; for (const pt of D.petak) for (const i of gangguanAktif(pt, t)) { const c = pt.p % KOLOM, r = Math.floor(pt.p / KOLOM);
    GG_AKTIF.push({p: pt.p, i, jenis: jenisGG(pt, i), x: PX(c) + GG_OFS[i][0], z: PZ(r) + GG_OFS[i][1]}); }
  GG.forEach(m => m.userData.l = []); GG_AKTIF.forEach(g => GG[g.jenis].userData.l.push(g)); GG.forEach(m => m.count = m.userData.l.length); CINCIN.count = SERU.count = GG_AKTIF.length;
  for (const m of [TANAH, TIANG, PAPAN, BENDERA]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  if (PILIH >= 0) { BINGKAI.visible = true; BINGKAI.position.set(PX(PILIH % KOLOM), 0, PZ(Math.floor(PILIH / KOLOM))); } else BINGKAI.visible = false;
}

// =====================================================================
// 3. AVATAR WARGA: berdiri di pematang dekat petak yang dipilih, melompat kecil saat tanam/siram/panen
// =====================================================================
const TOKOH = new THREE.Group(); sc.add(TOKOH);
function pasangAvatar() { TOKOH.clear(); if (!AKUN) return;
  try { const o = warga(LOKAL.av || {}); const b = new THREE.Box3().setFromObject(o), h = b.max.y - b.min.y || 1, k = 3.4 / h;
    o.scale.setScalar(k); o.position.y = -b.min.y * k; o.traverse(m => { if (m.isMesh) m.castShadow = true; }); TOKOH.add(o); } catch (e) {} }
pasangAvatar(); TOKOH.position.set(LW / 2 + 3, .25, LD / 2 + 4.5); TOKOH.rotation.y = -Math.PI / 4;
const TUJU = TOKOH.position.clone(); let LONCAT = 0;
function avatarKe(p) { const x = PX(p % KOLOM), z = PZ(Math.floor(p / KOLOM)); TUJU.set(x + UK / 2 + CELAH / 2, .25, z + UK / 2 + CELAH / 2); }
// partikel: tetes air, daun, koin
const PART = []; const PGEO = new THREE.BoxGeometry(.3, .3, .3);
function semprot(p, warna, n = 14, naik = 6) { const x = PX(p % KOLOM), z = PZ(Math.floor(p / KOLOM));
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(PGEO, new THREE.MeshBasicMaterial({color: warna})); m.position.set(x + (Math.random() - .5) * UK * .8, 1 + Math.random(), z + (Math.random() - .5) * UK * .8);
    m.userData.v = new THREE.Vector3((Math.random() - .5) * 3, naik * (.6 + Math.random() * .6), (Math.random() - .5) * 3); m.userData.t = 1.1; sc.add(m); PART.push(m); } }

// =====================================================================
// 4. KAMERA: seluruh sawah muat di area kiri (panel di kanan), tanpa geser
// =====================================================================
function ukur() {
  const W = innerWidth, H = innerHeight; R.setSize(W, H, false); cam.aspect = W / H; cam.clearViewOffset();
  const pw = Math.min(286, W * .41) + 18, top = Math.min(78, H * .2), aw = W - pw - 10, ah = H - top - 6;
  const arah = new THREE.Vector3(0, .95, .78).normalize(), titik = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0, 3]) titik.push(new THREE.Vector3(sx * (LW / 2 + 1), y, sz * (LD / 2 + 1) + (sz > 0 ? 3 : 0)));
  let bb = null;
  for (let d = 30; d < 400; d += 2) {
    cam.position.copy(arah).multiplyScalar(d); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of titik) { const q = p.clone().project(cam), px = (q.x + 1) / 2 * W, py = (1 - q.y) / 2 * H; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
    bb = {x0, x1, y0, y1}; if (x1 - x0 <= aw * .97 && y1 - y0 <= ah * .97) break;
  }
  const ox = (bb.x0 + bb.x1) / 2 - (8 + aw / 2), oy = (bb.y0 + bb.y1) / 2 - (top + ah / 2);
  cam.setViewOffset(W, H, ox, oy, W, H); cam.updateProjectionMatrix();
}
addEventListener('resize', ukur); ukur();

// ketuk petak: raycast ke bidang tanah
const RAY = new THREE.Raycaster(), BIDANG = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.3), TITIK = new THREE.Vector2(), HIT = new THREE.Vector3();
let turun = null;
$('kanvas').addEventListener('pointerdown', e => { turun = {x: e.clientX, y: e.clientY}; });
$('kanvas').addEventListener('pointerup', e => {
  if (!turun || Math.hypot(e.clientX - turun.x, e.clientY - turun.y) > 12) return; turun = null;
  let dekat = null, jd = 40; for (const g of GG_AKTIF) { const q = V.set(g.x, 1.5, g.z).project(cam), sx = (q.x + 1) / 2 * innerWidth, sy = (1 - q.y) / 2 * innerHeight, d = Math.hypot(sx - e.clientX, sy - e.clientY); if (d < jd) { jd = d; dekat = g; } }
  if (dekat) return usir(dekat);
  TITIK.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); RAY.setFromCamera(TITIK, cam);
  if (!RAY.ray.intersectPlane(BIDANG, HIT)) return;
  const c = Math.round(HIT.x / LANGKAH + (KOLOM - 1) / 2), r = Math.round((BARIS - 1) / 2 - HIT.z / LANGKAH);
  if (c < 0 || c >= KOLOM || r < 0 || r >= BARIS) { pilih(-1); return; }
  pilih(r * KOLOM + c);
});
async function usir(g) {
  if (!AKUN) return toast(`${GG_IKON[g.jenis]} Masuk sebagai warga dulu untuk mengusir ${GG_NAMA[g.jenis]}.`);
  if (PILIH !== g.p) { PILIH = g.p; MODE = 'info'; avatarKe(g.p); }
  const pt = petakDi(g.p), saya = SAYA && pt && pt.no === SAYA.no, tn = pt && D.tanaman[pt.b];
  aksi('usir', {p: g.p, i: g.i}, j => { LONCAT = .4; semprot(g.p, [0x9ae03a, 0x2f6a2a, 0x8a5a32][g.jenis], 12, 6); nada(988, 1175);
    toast(j.usir && j.usir.dapat ? `${GG_IKON[g.jenis]} ${GG_NAMA[g.jenis][0].toUpperCase() + GG_NAMA[g.jenis].slice(1)} tetangga diusir! Kamu +${j.usir.dapat} 🪙` : saya ? `${GG_IKON[g.jenis]} ${GG_NAMA[g.jenis][0].toUpperCase() + GG_NAMA[g.jenis].slice(1)} pergi! Panen nanti +${tn ? bonusGG(tn) : 1} 🪙` : `${GG_IKON[g.jenis]} Diusir! Tetangga senang.`, 2200); });
}
function pilih(p) { PILIH = p; MODE = 'info'; bunyi(p >= 0 ? 760 : 420, .05); if (p >= 0 && AKUN) avatarKe(p); bangunTanaman(); tulisPanel(); }

// =====================================================================
// 5. PANEL & AKSI
// =====================================================================
function tulisAtas() {
  $('cKoin').textContent = '🪙 ' + (SAYA ? SAYA.koin : AKUN ? '…' : 'tamu');
  $('cPetak').textContent = '🌾 ' + (SAYA ? SAYA.punya : 0) + '/' + (D ? D.maks : 2) + ' petak';
  const L = D && D.level, lv = SAYA ? SAYA.lv || 1 : 1; $('cLv').hidden = !SAYA;
  if (SAYA && L) $('cLv').textContent = '👨‍🌾 Lv ' + lv + (L[lv] ? ' · ' + SAYA.xp + '/' + L[lv] + ' XP' : ' · MAKS');
  $('cJual').textContent = '🏷️ ' + (D ? D.jumlah - D.petak.length : '–') + ' dijual';
}
const petakku = () => SAYA && D ? D.petak.filter(x => x.no === SAYA.no) : [];
function tulisPanel() {
  const P = $('panel'); if (!D) { P.innerHTML = '<p class="ket">Memuat sawah…</p>'; return; }
  const kembali = `<a class="tombol" href="/duniakotak/mabar/?dusun=wetan&amp;ke=sawah">← Desa</a>`;
  if (PILIH < 0) {
    const pk = petakku();
    P.innerHTML = `<div class="pAtas"><h2>🌾 Sawah Wetan</h2>${kembali}</div>
      <p class="ket">${AKUN ? '👆 <b>Ketuk petak</b>. Papan kuning = dijual.' : 'Beli petak, tanam, panen jadi koin. <b>Masuk sebagai warga</b> dulu.'} Usir <b>🐛🌿🐦</b> yang datang (petak tetangga juga, dapat koin).</p>
      ${pk.length ? `<div class="mini">${pk.map(x => { const th = tahap(x), ng = gangguanAktif(x).length; return `<button data-pk="${x.p}">${x.b ? D.tanaman[x.b].ikon : '🟫'} Petak ${x.p + 1}${th && th.siap ? ' ⭐' : ''}${ng ? ' ❗' : ''}</button>`; }).join('')}</div>` : ''}
      ${SAYA && SAYA.pesanan ? `<p class="ket">📦 <b>Pesanan warga hari ini</b> (panen untuk mengirim)</p><div class="pesan">${SAYA.pesanan.map(o => { const t = D.tanaman[o.b] || {}; return `<span class="${o.d >= o.n ? 'ok' : ''}"><i>${t.ikon || '❔'}</i><b>${o.d >= o.n ? '✓ Terkirim' : o.d + '/' + o.n + ' ' + esc(t.nama || '')}</b><small>+${o.h} 🪙</small></span>`; }).join('')}</div>` : ''}
      <div class="legenda"><span><em style="background:#f2c14a"></em>Dijual</span><span><em style="background:#e0803a"></em>Petakku</span><span>⭐ Siap panen</span><span>💧 Butuh disiram</span></div>
      <div class="bawah">${AKUN ? `<p class="ket">📋 Misi harian: ${MISI_SAWAH_T} kegiatan di sawah · 💧/🐛 tetangga +${D.siram.koin} 🪙</p>` : '<a class="utama tombol" href="/duniakotak/">Daftar / Masuk warga</a>'}</div>`;
    return;
  }
  const pt = petakDi(PILIH), saya = SAYA && pt && pt.no === SAYA.no, th = tahap(pt), tn = pt && pt.b ? D.tanaman[pt.b] : null;
  const judul = `<div class="pAtas"><h2>Petak ${PILIH + 1}</h2><button id="bTutup">✕</button></div>`;
  if (MODE === 'bibit' && saya && !pt.b) {
    P.innerHTML = `${judul}<p class="ket">Pilih bibit · koinmu <b>${SAYA.koin} 🪙</b></p>
      <div class="bibit">${Object.entries(D.tanaman).map(([id, t]) => { const kunci = (t.lv || 1) > (SAYA.lv || 1); return `<button data-bibit="${id}" class="${kunci || SAYA.koin < t.bibit ? 'mahal' : ''}" aria-label="${esc(t.nama)}${kunci ? ', terkunci sampai level ' + t.lv : ', bibit ' + t.bibit + ' koin, ' + lamaTn(t) + ', panen ' + t.jual + ' koin'}"><i>${kunci ? '🔒' : t.ikon}</i><b>${esc(t.nama)}</b><small>${kunci ? 'Level ' + t.lv : t.bibit + '🪙·' + lamaTn(t) + '→' + t.jual + '🪙'}</small></button>`; }).join('')}</div>
      <div class="bawah"><button class="kedua" id="bBatal">Batal</button></div>`;
    return;
  }
  if (MODE === 'panen' && saya && tn && th.siap) {
    const ng = jmlBit(pt.g || 0);
    P.innerHTML = `${judul}<div class="besar"><i>${tn.ikon}</i><div><b>Panen ${esc(tn.nama)}!</b><small>Tekan saat jarum di zona emas</small></div></div>
      <div class="timing"><em class="z1"></em><em class="z2"></em><i id="jarum"></i></div>
      <p class="ket">Kuning = bagus <b>+${Math.round(tn.jual * D.panenQ[1])} 🪙</b> · emas = sempurna <b>+${Math.round(tn.jual * D.panenQ[2])} 🪙</b>${ng ? ` · gangguan diusir +${ng * bonusGG(tn)} 🪙` : ''} · peluang ✨ Panen Raya ×2</p>
      <div class="bawah"><button class="utama" id="bTarik">🧺 PANEN SEKARANG!</button></div>`;
    JARUM_T0 = performance.now(); return;
  }
  let isi = '', tombol = '';
  if (!pt) {
    const harga = SAYA ? SAYA.hargaBerikut : D.harga[0];
    isi = `<div class="besar"><i>🏷️</i><div><b>Dijual</b><small>${SAYA && !harga ? 'Kamu sudah punya ' + D.maks + ' petak' : (harga || D.harga[0]) + ' 🪙 · milik selamanya selama dirawat'}</small></div></div>
      <p class="ket">Petak ke-1 ${D.harga[0]} 🪙, ke-2 ${D.harga[1]} 🪙 (maks ${D.maks} per warga). Petak yang tidak ditanam/dipanen ${D.terlantarHari} hari kembali dijual desa.</p>`;
    tombol = !AKUN ? `<a class="utama tombol" href="/duniakotak/">Masuk warga untuk membeli</a>` : harga ? `<button class="utama" id="bBeli" ${SAYA && SAYA.koin < harga ? 'disabled' : ''}>🏷️ BELI PETAK · ${harga} 🪙</button>${SAYA && SAYA.koin < harga ? `<p class="ket">Koinmu ${SAYA.koin} 🪙. Cari koin dari kebun rumah, mancing, misi, lari & reli.</p>` : ''}` : '';
  } else {
    const pemilik = saya ? 'Petakmu' : `Milik ${esc(pt.u ? '@' + pt.u : 'warga No. ' + pt.no)}`;
    if (!tn) isi = `<div class="besar"><i>🟫</i><div><b>${pemilik}</b><small>Tanah siap ditanami</small></div></div>`;
    else isi = `<div class="besar"><i>${tn.ikon}</i><div><b>${esc(tn.nama)} · ${pemilik}</b><small id="sisa">${th.siap ? 'Siap panen! ⭐' : 'Panen ' + durasi(th.sisa) + ' lagi'}</small></div></div>
      <div class="bar"><i id="barI" style="width:${Math.round(th.f * 100)}%"></i></div>
      <p class="ket">${pt.s ? '💧 Sudah disiram.' : th.siap ? '' : '💧 Belum disiram. Siram supaya ' + Math.round(D.siram.bagian * 100) + '% lebih cepat.'} ${saya ? 'Hasil: <b>' + tn.jual + ' 🪙</b>' + (jmlBit(pt.g || 0) ? ' + ' + jmlBit(pt.g || 0) * bonusGG(tn) + ' 🪙 bonus' : '') : ''}</p>
      <p class="ket">${GG_IKON.map((ik, i) => { const g = D.ganggu ? pt.t + D.ganggu.tahap[i] * (pt.siap - pt.t) : 0, ok = (pt.g || 0) & (1 << i); return ok ? '✅' : kini() >= g ? '<b>' + GG_IKON[jenisGG(pt, i)] + '❗</b>' : '·'; }).join(' ')} gangguan diusir ${jmlBit(pt.g || 0)}/3${saya ? ' (tiap usir +' + bonusGG(tn) + ' 🪙 panen)' : ''}</p>`;
    if (saya) {
      if (!tn) tombol = `<button class="utama hijau" id="bTanam">🌱 TANAM BIBIT</button><button class="kedua" id="bLepas">Lepas petak (tanpa uang kembali)</button>`;
      else if (th.siap) tombol = `<button class="utama" id="bPanen">🧺 PANEN · ${tn.jual}+ 🪙</button>`;
      else if (!pt.s) tombol = `<button class="utama biru" id="bSiram">💧 SIRAM</button>`;
    } else if (AKUN && tn && !th.siap && !pt.s) tombol = `<button class="utama biru" id="bSiram">💧 SIRAMKAN TETANGGA${SAYA && SAYA.siramHari < D.siram.hari ? ' · +' + D.siram.koin + ' 🪙' : ''}</button>`;
    const ga = gangguanAktif(pt); if (AKUN && ga.length) tombol = `<button class="utama hijau" id="bUsir">${GG_IKON[jenisGG(pt, ga[0])]} USIR ${GG_NAMA[jenisGG(pt, ga[0])].toUpperCase()}${!saya && SAYA && SAYA.siramHari < D.siram.hari ? ' · +' + D.siram.koin + ' 🪙' : ''}</button>` + tombol;
  }
  P.innerHTML = `${judul}${isi}<div class="bawah">${tombol}</div>`;
}
// Misi harian 🌾 Sawah (Huda 18 Nov 2026 "Jadikan misi harian"): tiap beli/tanam/siram/panen yang berhasil = 1 langkah.
// Progres disimpan di dk_misi (format sama dengan misi harian di game desa), target MISI_SAWAH_T, lalu diklaim ke server.
const MISI_SAWAH_T = 2;
async function misiSawah() {
  if (!AKUN) return; const hari = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  let l = baca('dk_misi'); if (!l || l.t !== hari || l.no !== AKUN.no) l = {t: hari, no: AKUN.no, p: {}}; l.p = l.p || {};
  l.p.sawah = (+l.p.sawah || 0) + 1; simpan('dk_misi', l);
  if (l.p.sawah < MISI_SAWAH_T) { if (l.p.sawah === 1) setTimeout(() => toast(`📋 Misi harian Sawah: ${l.p.sawah}/${MISI_SAWAH_T}. Satu kegiatan lagi!`), 1200); return; }
  if (l.p.sawah > MISI_SAWAH_T + 3) return;   // sudah diklaim sebelumnya
  try { const r = await fetch('/duniakotak/api/misi', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({kunci: AKUN.kunci, id: 'sawah'})});
    const j = await r.json(); if (j && j.dapat) { if (SAYA) { SAYA.koin = j.koin; tulisAtas(); } setTimeout(() => { toast(`✅ Misi harian selesai: Rawat Sawah Wetan. +${j.dapat} 🪙`, 3500); nada(784, 988, 1318); }, 1200); } } catch (e) {}
}
let SIBUK = false;
async function aksi(op, data, lalu) {
  if (SIBUK || !AKUN) return; SIBUK = true; bunyi(600, .04);
  const j = await api(op, {p: PILIH, ...data}); SIBUK = false;
  if (j.galat) toast(j.galat, 3500); else { if (lalu) lalu(j); if (op !== 'lepas') misiSawah(); }
  terima(j);
}
$('panel').addEventListener('click', e => {
  const b = e.target.closest('button,[data-pk]'); if (!b) return;
  if (b.dataset.pk) return pilih(+b.dataset.pk);
  if (b.id === 'bTutup') return pilih(-1);
  if (b.id === 'bBatal') { MODE = 'info'; return tulisPanel(); }
  if (b.dataset.bibit && (D.tanaman[b.dataset.bibit].lv || 1) > (SAYA.lv || 1)) { const t = D.tanaman[b.dataset.bibit]; return toast(`🔒 ${t.nama} terbuka di Level Petani ${t.lv}. Panen terus untuk dapat XP!`); }
  if (b.id === 'bTanam') { MODE = 'bibit'; bunyi(700, .04); return tulisPanel(); }
  if (b.dataset.bibit) { const t = D.tanaman[b.dataset.bibit]; if (SAYA && SAYA.koin < t.bibit) return toast(`Koinmu kurang untuk bibit ${t.nama} (${t.bibit} 🪙).`);
    return aksi('tanam', {b: b.dataset.bibit}, () => { MODE = 'info'; LONCAT = .5; semprot(PILIH, 0x6cc04a, 12, 4); nada(523, 659, 784); toast(`🌱 ${t.nama} ditanam! Panen ${durasi(t.menit * 60e3)} lagi.`); }); }
  if (b.id === 'bBeli') return aksi('beli', {}, j => { LONCAT = .5; semprot(PILIH, 0xf2c14a, 18); nada(523, 659, 784, 1046); toast(`🎉 Petak ${PILIH + 1} jadi milikmu! Sekarang tanam bibit.`); });
  if (b.id === 'bSiram') return aksi('siram', {}, j => { LONCAT = .4; semprot(PILIH, 0x56b8ff, 20, 5); nada(880, 988); toast(j.siram && j.siram.dapat ? `💧 Disiram! Tetangga senang, kamu +${j.siram.dapat} 🪙` : `💧 Disiram! Tumbuh ${durasi(j.siram.cepat * 60e3)} lebih cepat.`); });
  if (b.id === 'bUsir') { const pt = petakDi(PILIH), ga = gangguanAktif(pt); if (ga.length) return usir({p: PILIH, i: ga[0], jenis: jenisGG(pt, ga[0])}); return; }
  if (b.id === 'bPanen') { MODE = 'panen'; bunyi(700, .04); return tulisPanel(); }
  if (b.id === 'bTarik') { const pos = posJarum(), dz = Math.abs(pos - .5), q = dz <= .07 ? 2 : dz <= .17 ? 1 : 0; JARUM_T0 = -1; b.disabled = true;
    return aksi('panen', {q}, j => { MODE = 'info'; const pn = j.panen, r = pn.rinci || {}, tn = D.tanaman[pn.b];
      LONCAT = .6; semprot(PILIH, 0xffd23a, r.raya ? 40 : 22, r.raya ? 10 : 7); nada(659, 784, 988, 1318);
      toast(`${['🧺 Panen', '👍 Panen bagus', '🎯 PANEN SEMPURNA'][q]} ${tn.ikon} ${tn.nama}! +${pn.dapat} 🪙`, 3200);
      if (r.raya) setTimeout(() => { toast(`✨ PANEN RAYA! Hasil ${tn.nama} dobel +${r.raya} 🪙`, 3500); nada(784, 988, 1318, 1568); semprot(PILIH, 0xfff07a, 30, 11); }, 500);
      if (pn.pesanan) setTimeout(() => { toast(`📦 Pesanan ${D.tanaman[pn.pesanan.b].ikon} terkirim! +${pn.pesanan.h} 🪙`, 3200); nada(659, 880, 1046); }, r.raya ? 1500 : 700);
      if (pn.naik) setTimeout(() => { toast(`🎉 Naik ke Level Petani ${pn.naik}!${pn.buka && pn.buka.length ? ' Bibit baru: ' + pn.buka.map(k => D.tanaman[k].ikon + ' ' + D.tanaman[k].nama).join(', ') : ''}`, 4500); nada(523, 659, 784, 1046, 1318); }, 2200);
    }).then(() => { if (MODE === 'panen') { MODE = 'info'; tulisPanel(); } }); }
  if (b.id === 'bLepas') { if (!confirm(`Lepas Petak ${PILIH + 1}? Koin tidak kembali dan petak dijual lagi ke warga lain.`)) return; return aksi('lepas', {}, () => toast('Petak dilepas.')); }
});

// =====================================================================
// 6. JALAN: animasi, hitung mundur, segarkan data tetangga tiap 30 dtk
// =====================================================================
// jarum panen bolak-balik (makin lama sedikit makin cepat supaya tidak membosankan)
let JARUM_T0 = -1; const posJarum = () => { const d = (performance.now() - JARUM_T0) / 1000, f = d * (.75 + Math.min(.5, d * .05)); return 1 - Math.abs((f % 2) - 1); };
const jam = new THREE.Clock(); let tBangun = 0, tDetik = 0;
function loop() {
  requestAnimationFrame(loop); const dt = Math.min(.05, jam.getDelta()), t = jam.elapsedTime;
  // avatar berjalan ke tujuan
  const d = TUJU.clone().sub(TOKOH.position); d.y = 0; const jauh = d.length();
  if (jauh > .1) { TOKOH.position.addScaledVector(d.normalize(), Math.min(jauh, 14 * dt)); TOKOH.rotation.y = Math.atan2(d.x, d.z); }
  else if (PILIH >= 0) { const x = PX(PILIH % KOLOM), z = PZ(Math.floor(PILIH / KOLOM)); TOKOH.rotation.y = Math.atan2(x - TOKOH.position.x, z - TOKOH.position.z); }
  if (LONCAT > 0) LONCAT = Math.max(0, LONCAT - dt); TOKOH.position.y = .25 + (LONCAT > 0 ? Math.abs(Math.sin(LONCAT * 12)) * .6 : jauh > .1 ? Math.abs(Math.sin(t * 14)) * .15 : 0);
  // penanda melayang
  for (let i = 0; i < BINTANG.count; i++) { const [x, z] = BINTANG.userData[i]; taruh(BINTANG, i, x, 3.2 + Math.sin(t * 3 + i) * .25, z, 1, 1, 1, t * 2); }
  for (let i = 0; i < TETES.count; i++) { const [x, z] = TETES.userData[i]; taruh(TETES, i, x + 2, 2.6 + Math.sin(t * 2.5 + i) * .2, z - 2, .8, 1.15, .8); }
  BINTANG.instanceMatrix.needsUpdate = TETES.instanceMatrix.needsUpdate = true;
  let nc = 0; GG.forEach((m, jenis) => { m.userData.l.forEach((g, k) => { const s = t * 3 + g.p + g.i * 2;
    if (jenis === 0) taruh(m, k, g.x + Math.sin(s) * .25, .85, g.z, 1 + Math.sin(s * 2) * .15, 1, 1, Math.sin(s * .7) * .6);
    else if (jenis === 1) taruh(m, k, g.x, 1.4, g.z, 1, 1 + Math.sin(s) * .08, 1, 0, Math.sin(s * 1.3) * .15, Math.cos(s) * .15);
    else taruh(m, k, g.x, .9 + Math.abs(Math.sin(s * 1.6)) * .9, g.z, 1, 1, 1, s * .4);
    taruh(SERU, nc, g.x, 3.4 + Math.sin(t * 4 + k) * .25, g.z, .8, 1.5, .8, t * 2);
    taruh(CINCIN, nc++, g.x, .42, g.z, 1 + Math.sin(t * 5 + k) * .12, 1, 1 + Math.sin(t * 5 + k) * .12); }); m.instanceMatrix.needsUpdate = true; });
  CINCIN.instanceMatrix.needsUpdate = SERU.instanceMatrix.needsUpdate = true;
  if (JARUM_T0 > 0 && $('jarum')) $('jarum').style.left = (posJarum() * 100).toFixed(1) + '%';
  for (let i = PART.length - 1; i >= 0; i--) { const m = PART[i]; m.userData.t -= dt; m.userData.v.y -= 16 * dt; m.position.addScaledVector(m.userData.v, dt); m.rotation.x += dt * 5;
    if (m.userData.t <= 0) { sc.remove(m); m.material.dispose(); PART.splice(i, 1); } }
  // tanaman tumbuh: bangun ulang tiap 5 dtk, hitung mundur panel tiap 1 dtk
  tBangun += dt; tDetik += dt;
  if (tBangun > 5 && D) { tBangun = 0; const pt = petakDi(PILIH), sblm = tahap(pt); bangunTanaman(); const ssd = tahap(pt); if (sblm && ssd && sblm.siap !== ssd.siap) tulisPanel(); }
  if (tDetik > 1 && D && PILIH >= 0) { tDetik = 0; const th = tahap(petakDi(PILIH)); if (th && $('sisa')) { if (th.siap && !/Siap/.test($('sisa').textContent)) tulisPanel(); else { $('sisa').textContent = th.siap ? 'Siap panen! ⭐' : 'Panen ' + durasi(th.sisa) + ' lagi'; $('barI').style.width = Math.round(th.f * 100) + '%'; } } }
  R.render(sc, cam);
}
async function segar() { if (document.hidden || SIBUK) return; const j = await api(); if (j && j.petak) { const s = SAYA; terima(j); SAYA = s; tulisAtas(); } }
(async () => {
  const j = AKUN ? await api('saya') : await api();
  if (j && j.petak) terima(j); else { toast((j && j.galat) || 'Sawah belum bisa dimuat. Coba lagi.', 5000); }
  if (!D) D = {kini: Date.now(), jumlah: 80, kolom: 10, harga: [100, 200], maks: 2, siram: {bagian: .25, koin: 2, hari: 10}, terlantarHari: 7, tanaman: {}, petak: []};
  bangunTanaman(); tulisAtas(); tulisPanel(); $('muat').hidden = true;
  const ke = +new URLSearchParams(location.search).get('petak'); if (ke >= 1 && ke <= 80) pilih(ke - 1);
  else { const pk = petakku(); if (pk.length) pilih(pk[0].p); }
  setInterval(segar, 30000);
})();
loop();
window.__sawah = {D: () => D, SAYA: () => SAYA, pilih, terima, GG: () => GG_AKTIF, usir};

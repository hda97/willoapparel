// Tukang Kotak "Angkut & Bangun" (Huda 10 Nov 2026): warga ikut MEMBANGUN fasum pemenang voting. Masuk dari lahan proyek 🚧
// di desa (tombol 🔨 Bangun), seperti gapura Pelari Kalcer. Gaya santai tanpa kalah: jalan pakai joystick, ambil bata/kayu/semen
// dari tumpukan (menumpuk di punggung), bawa ke titik setor di gerbang proyek → tiap bahan terbang ke bangunan dan bagian fasum
// yang ASLI muncul satu per satu. Tiap TK_BAHAN bahan yang disetor warga = 1 sesi di server: fasum jadi lebih cepat + koin + poin Piala
// (aturan & batas di worker.js TK_*). Tamu boleh main sebagai latihan (tanpa hadiah, tidak mempercepat).
import '../mabar/js/putar.js'; // HP tegak -> tampil mendatar, sama seperti game desa
import * as THREE from 'three';
import * as F from '../mabar/js/aset/fasum.js';
import {warga, pose} from '../mabar/js/aset/avatar.js';

const $ = id => document.getElementById(id);
const VS = 5;            // skala fasum di game desa
const TK_BAHAN = 20;     // bahan per sesi (samakan dengan worker.js TK_BAHAN)
const MUAT = 8;          // kapasitas angkut di punggung
const u = new URLSearchParams(location.search);
const DUSUN = /^(wetan|kulon|curug|tlaga|segara)$/.test(u.get('dusun') || '') ? u.get('dusun') : 'wetan';
for (const a of [$('bDesa'), $('bDesa2')]) a.href = '/duniakotak/mabar/?dusun=' + DUSUN;
let AKUN = null; try { const w = JSON.parse(localStorage.getItem('dk_warga') || 'null'); if (w && w.kunci) AKUN = {no: w.no, kunci: w.kunci}; } catch (e) {}
let INFO = null;
const NAMA_DUSUN = {wetan: 'Kotak Wetan', kulon: 'Kotak Kulon', curug: 'Kotak Curug', tlaga: 'Kotak Tlaga', segara: 'Kotak Segara'};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const dusunNo = no => no > 860 ? 'segara' : no > 660 ? 'tlaga' : no > 460 ? 'curug' : no > 260 ? 'kulon' : 'wetan';

// ---------- suara kecil (WebAudio, tanpa file) ----------
let AC = null;
function bunyi(f = 660, d = .08, tipe = 'square', v = .05) {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain();
    o.type = tipe; o.frequency.value = f; g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d);
    o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d + .02); } catch (e) {}
}

// ---------- API ----------
async function apiB(op, data = {}) {
  try {
    if (!AKUN) { const r = await fetch('/duniakotak/api/bangun'); return await r.json(); }
    const r = await fetch('/duniakotak/api/bangun', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({kunci: AKUN.kunci, op, ...data})});
    const j = await r.json(); if (r.status === 401 && op === 'info') AKUN = null; return j;
  } catch (e) { return {galat: 'Sinyal putus. Coba lagi sebentar.'}; }
}

// ---------- 3D dasar ----------
const R = new THREE.WebGLRenderer({canvas: $('kanvas'), antialias: true});
R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputColorSpace = THREE.SRGBColorSpace;
const sc = new THREE.Scene(); sc.background = new THREE.Color(0xbfe4ff); sc.fog = new THREE.Fog(0xbfe4ff, 170, 340);
const cam = new THREE.PerspectiveCamera(45, 1, .5, 600);
sc.add(new THREE.HemisphereLight(0xffffff, 0x6a8a5a, 1.15));
const mat = new THREE.DirectionalLight(0xfff2dc, 1.6); mat.position.set(-60, 110, 70); mat.castShadow = true;
mat.shadow.mapSize.set(1024, 1024); Object.assign(mat.shadow.camera, {left: -85, right: 85, top: 85, bottom: -85, near: 10, far: 320}); sc.add(mat);
const kotak = (w, h, d, c, x = 0, y = 0, z = 0, m = {}) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({color: c, roughness: .85, ...m})); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
{ const t = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({color: 0x7cc46a, roughness: 1})); t.rotation.x = -Math.PI / 2; t.receiveShadow = true; sc.add(t);
  const jl = new THREE.Mesh(new THREE.PlaneGeometry(700, 14), new THREE.MeshStandardMaterial({color: 0xcfc2a2, roughness: 1})); jl.rotation.x = -Math.PI / 2; jl.position.set(0, .03, 86); jl.receiveShadow = true; sc.add(jl);
  const hl = new THREE.Mesh(new THREE.PlaneGeometry(76, 34), new THREE.MeshStandardMaterial({color: 0xc8ab80, roughness: 1})); hl.rotation.x = -Math.PI / 2; hl.position.set(0, .04, 61); hl.receiveShadow = true; sc.add(hl);
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, r = 96 + (i % 3) * 14, x = Math.cos(a) * r, z = Math.sin(a) * r * .8 - 6; if (z > 50 && Math.abs(x) < 70) continue;
    const s = .8 + (i * 37 % 10) / 20; sc.add(kotak(1.6 * s, 6 * s, 1.6 * s, 0x7a4a2a, x, 3 * s, z)); sc.add(kotak(7 * s, 6 * s, 7 * s, i % 2 ? 0x4f9a4a : 0x3f8a3e, x, 8 * s, z)); } }
// pagar seng proyek (kiri, kanan, belakang) + tanah lahan
{ const g = new THREE.Group(), SENG = [0x2f6fb8, 0xd8d8d0]; let k = 0;
  const t = new THREE.Mesh(new THREE.PlaneGeometry(19 * VS, 17 * VS), new THREE.MeshStandardMaterial({color: 0xb89c78, roughness: 1})); t.rotation.x = -Math.PI / 2; t.position.y = .05; t.receiveShadow = true; g.add(t);
  // sisi depan tanpa seng supaya bangunan yang sedang tumbuh terlihat jelas dari halaman kerja
  for (let x = -9; x <= 9.01; x += 2) { g.add(kotak(1.9 * VS, 2.2 * VS, .5, SENG[k++ % 2], x * VS, 1.1 * VS, -8.6 * VS)); }
  for (let z = -7.6; z <= 7.61; z += 1.9) { g.add(kotak(.5, 2.2 * VS, 1.9 * VS, SENG[k++ % 2], -9.6 * VS, 1.1 * VS, z * VS)); g.add(kotak(.5, 2.2 * VS, 1.9 * VS, SENG[k++ % 2], 9.6 * VS, 1.1 * VS, z * VS)); }
  sc.add(g); }

// ---------- bangunan fasum yang tumbuh bagian demi bagian ----------
let BANG = null;   // {g, bagian: [{m, c, s}], tampak: n, pop: []}
const tahapDari = a => Math.max(0, Math.min(1, (Date.now() - a.mulai) / (a.sampai - a.mulai)));
function pasangBangunan(info) {
  if (BANG) sc.remove(BANG.g);
  const a = info && info.aktif, buat = (a && F[a.aset]) || F.tamanKota;
  const g = buat(); g.scale.setScalar(VS); g.updateMatrixWorld(true); sc.add(g);
  // bagian = anak langsung grup aset, urut dari bawah ke atas (lantai dulu, atap terakhir), lalu dari belakang ke depan
  const bb = new THREE.Box3(), bagian = [...g.children].map(m => { bb.setFromObject(m); return {m, y: Math.round(bb.min.y * 2) / 2, z: bb.min.z, c: bb.getCenter(new THREE.Vector3())}; })
    .sort((p, q) => p.y - q.y || p.z - q.z);
  for (const b of bagian) { b.m.visible = false; b.s = b.m.scale.clone(); }
  BANG = {g, bagian, tampak: 0, pop: []};
  const awal = a ? Math.floor(tahapDari(a) * bagian.length * .9) : bagian.length;   // bagian yang sudah jadi menurut jadwal server
  for (let i = 0; i < awal; i++) bagian[i].m.visible = true;
  BANG.tampak = awal;
}
// satu bagian berikutnya muncul (pop + debu). Disisakan 1 bagian terakhir: peresmian tetap mengikuti jadwal server.
function munculBagian() {
  if (!BANG || BANG.tampak >= BANG.bagian.length - 1) return null;
  const b = BANG.bagian[BANG.tampak++]; b.m.visible = true; b.m.scale.setScalar(.001); BANG.pop.push({b, t: 0}); debu(b.c); return b;
}
const DEBU = [];
function debu(p) { for (let i = 0; i < 5; i++) { const m = kotak(1.2, 1.2, 1.2, 0xe8dcc0, p.x + (Math.random() - .5) * 4, Math.max(1, p.y), p.z + (Math.random() - .5) * 4, {transparent: true, opacity: .8}); m.castShadow = false; sc.add(m); DEBU.push({m, t: 0, v: new THREE.Vector3((Math.random() - .5) * 6, 4 + Math.random() * 3, (Math.random() - .5) * 6)}); } }

// ---------- halaman kerja: tumpukan bahan & titik setor ----------
const BAHAN = [
  {id: 'bata', nama: 'Bata', w: 0xb84a32, x: -26, z: 66},
  {id: 'kayu', nama: 'Kayu', w: 0xc89060, x: 26, z: 66},
  {id: 'semen', nama: 'Semen', w: 0xd8d2c2, x: 0, z: 76},
];
for (const b of BAHAN) {
  const g = new THREE.Group(); g.position.set(b.x, 0, b.z);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (let l = 0; l < 3 - (i + j) % 2; l++) g.add(kotak(2.4, 1.1, 1.6, b.w, (i - 1.5) * 2.6, .55 + l * 1.12, (j - 1) * 1.8));
  g.add(kotak(10.8, .3, 6.4, 0x8a6a40, 0, .15, 0)); sc.add(g); b.g = g;
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d'); x.fillStyle = '#2c3150'; x.fillRect(0, 0, 256, 96);
  x.fillStyle = '#fff'; x.font = '900 46px Montserrat, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(b.nama.toUpperCase(), 128, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.4), new THREE.MeshBasicMaterial({map: t})); p.position.set(b.x, 6.2, b.z + 3.4); sc.add(p);
  sc.add(kotak(.3, 5, .3, 0x6a4a2a, b.x - 2.6, 2.5, b.z + 3.3), kotak(.3, 5, .3, 0x6a4a2a, b.x + 2.6, 2.5, b.z + 3.3));
}
const SETOR = {x: 0, z: 48};
const cincin = new THREE.Mesh(new THREE.RingGeometry(4.2, 5.4, 40), new THREE.MeshBasicMaterial({color: 0xf2c14a, transparent: true, opacity: .85, side: THREE.DoubleSide}));
cincin.rotation.x = -Math.PI / 2; cincin.position.set(SETOR.x, .12, SETOR.z); sc.add(cincin);
const cakram = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), new THREE.MeshBasicMaterial({color: 0xf2c14a, transparent: true, opacity: .25})); cakram.rotation.x = -Math.PI / 2; cakram.position.set(SETOR.x, .1, SETOR.z); sc.add(cakram);
// panah penunjuk arah tujuan berikutnya (memantul)
const panah = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.6, 4), new THREE.MeshBasicMaterial({color: 0xf2c14a})); panah.rotation.x = Math.PI; sc.add(panah); panah.visible = false;

// ---------- avatar + perlengkapan tukang ----------
function siapAvatar(av) {
  const o = warga(av || {}); o.traverse(m => { if (m.isMesh) m.castShadow = true; });
  const d = o.userData;
  if (d.head) { const h = new THREE.Group(); h.add(kotak(1.16, .34, 1.16, 0xf2c230, 0, 1.16, 0), kotak(1, .07, .45, 0xf2c230, 0, 1, .72)); d.head.add(h); }
  if (d.body) d.body.add(kotak(1.18, .95, .76, 0xff7a1a, 0, .62, 0));
  return o;
}
const SAYA = {o: siapAvatar(null), x: 0, z: 62, arah: Math.PI, ph: 0, bawa: [], ambilT: 0, setorT: 0};
sc.add(SAYA.o);
function gantiAvatar(av) { sc.remove(SAYA.o); SAYA.o = siapAvatar(av); sc.add(SAYA.o); }
// tumpukan bahan di punggung (ikut avatar)
const punggung = new THREE.Group(); sc.add(punggung);
function susunPunggung() {
  punggung.clear();
  SAYA.bawa.forEach((b, i) => { const m = kotak(1.6, .7, 1.1, BAHAN.find(x => x.id === b).w, 0, 2.6 + i * .74, -1.1); m.rotation.y = (i % 2) * .12; punggung.add(m); });
}
// tukang NPC (gotong royong): mondar-mandir dari tumpukan ke titik setor sambil memanggul bahan
const NPC = [0, 1, 2].map(i => {
  const AV = [{jenis: 'L', kulit: '#c98c5e', rambut: {gaya: 'cepak', warna: '#0b0b0e'}, atasan: {jenis: 'kaos', warna: '#3a7bd5'}},
    {jenis: 'P', kulit: '#e0aa7e', rambut: {gaya: 'kuncir', warna: '#3a2416'}, atasan: {jenis: 'kaos', warna: '#2a9a5a'}, bawahan: {jenis: 'celana', warna: '#2f3a52'}},
    {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'acak', warna: '#0b0b0e'}, atasan: {jenis: 'kemeja', warna: '#d0442f'}}][i];
  const o = siapAvatar(AV); sc.add(o); const b = BAHAN[i]; const beban = kotak(1.6, 2.2, 1.1, b.w); sc.add(beban);
  return {o, b, beban, t: i * .33};
});

// ---------- kamera ----------
const KAM = {pos: new THREE.Vector3(70, 62, 140), lihat: new THREE.Vector3(0, 6, 20), tPos: new THREE.Vector3(70, 62, 140), tLihat: new THREE.Vector3(0, 6, 20)};
function ukur() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', ukur); ukur();

// ---------- kontrol: joystick (HP) + WASD/panah (laptop) ----------
const STIK = {x: 0, y: 0, id: null}, KEY = {};
{ const el = $('stik'), kn = el.querySelector('i');
  const gerak = e => { const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, maks = r.width / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy); if (d > maks) { dx *= maks / d; dy *= maks / d; }
    STIK.x = dx / maks; STIK.y = dy / maks; kn.style.transform = `translate(${dx}px,${dy}px)`; };
  el.addEventListener('pointerdown', e => { STIK.id = e.pointerId; el.setPointerCapture?.(e.pointerId); gerak(e); });
  el.addEventListener('pointermove', e => { if (e.pointerId === STIK.id) gerak(e); });
  const lepas = e => { if (e.pointerId !== STIK.id) return; STIK.id = null; STIK.x = STIK.y = 0; kn.style.transform = ''; };
  el.addEventListener('pointerup', lepas); el.addEventListener('pointercancel', lepas); }
addEventListener('keydown', e => { KEY[e.code] = true; }); addEventListener('keyup', e => { KEY[e.code] = false; });

// ---------- status kerja ----------
let MAIN = false, TERBANG = [];
const KERJA = {setor: 0, sesiBahan: 0, sesi: 0, koin: 0, maju: 0, piala: 0, sibuk: false};
function kabar(teks) { const d = document.createElement('div'); d.className = 'kaca'; d.innerHTML = teks; $('kabar').appendChild(d); setTimeout(() => d.remove(), 2700); }
function tulisHud() {
  const a = INFO && INFO.aktif, n = BANG ? BANG.bagian.length : 1, p = BANG ? BANG.tampak / n : 0;
  $('hNama').textContent = '🚧 ' + (a ? a.nama.replace(/^\S+ /, '') : 'Latihan');
  $('hPersen').textContent = Math.round(p * 100) + '%'; $('hBar').style.width = (p * 100).toFixed(1) + '%';
  const sisa = TK_BAHAN - KERJA.sesiBahan;
  $('hSesi').innerHTML = AKUN && a ? `Setor <b>${sisa}</b> bahan lagi → fasum ⚡ 20 menit lebih cepat + 🪙` : 'Latihan: masuk sebagai warga supaya kerjamu tercatat';
  $('tAngka').textContent = `${SAYA.bawa.length}/${MUAT}`; $('tas').classList.toggle('penuh', SAYA.bawa.length >= MUAT);
}
function petunjuk() {
  const t = SAYA.bawa.length >= MUAT ? '🎒 Penuh! Bawa ke lingkaran kuning di gerbang proyek' : SAYA.bawa.length ? 'Ambil lagi atau setor ke lingkaran kuning ⬆️' : 'Jalan ke tumpukan bata, kayu, atau semen';
  if ($('petunjuk').textContent !== t) $('petunjuk').textContent = t;
}

// sesi server: tiap TK_BAHAN bahan disetor = 1 sesi tercatat (mempercepat fasum, koin, poin Piala)
async function catatSesi() {
  if (!AKUN || !(INFO && INFO.aktif) || KERJA.sibuk) return;
  KERJA.sibuk = true;
  const r = await apiB('selesai', {skor: 100});
  if (r.galat) kabar('⚠️ ' + esc(r.galat));
  else {
    const nm = (r.aktif?.nama || INFO.aktif.nama).replace(/^\S+ /, '');
    KERJA.sesi++;
    if (r.maju) { KERJA.maju += r.maju; kabar(`⚡ ${esc(nm)} jadi ${Math.round(r.maju / 60e3)} menit lebih cepat!`); }
    if (r.dapat) { KERJA.koin += r.dapat; setTimeout(() => kabar(`+${r.dapat} 🪙 koin`), 400); }
    if (r.piala) { KERJA.piala += r.piala.dapat; setTimeout(() => kabar(`🏆 +${r.piala.dapat} poin Piala ${NAMA_DUSUN[r.piala.d] || ''}`), 800); }
    if (!r.aktif) setTimeout(() => kabar(`🎉 ${esc(nm)} JADI! Terima kasih, tukang!`), 1200);
    INFO = r; bunyi(660, .1); setTimeout(() => bunyi(990, .16), 120);
  }
  if (INFO && INFO.aktif) await apiB('mulai');
  KERJA.sibuk = false;
}

// ---------- loop ----------
let tLalu = performance.now();
function loop(t) {
  const dt = Math.min(.05, (t - tLalu) / 1000); tLalu = t;
  if (MAIN) langkah(dt, t);
  else { const a = Math.sin(t / 14000) * .5, sempit = innerWidth < 700; KAM.tPos.set(Math.sin(a) * 140 - (sempit ? 0 : 30), 66, Math.cos(a) * 140 + 30); KAM.tLihat.set(sempit ? 0 : -24, 4, 16);
    SAYA.o.position.set(SAYA.x, 0, SAYA.z); SAYA.o.rotation.y = SAYA.arah; pose(SAYA.o, {armR: Math.sin(t / 300) * .3, armL: -Math.sin(t / 300) * .2}); }
  // NPC gotong royong
  for (const n of NPC) {
    n.t += dt / 7; const f = n.t % 1, pergi = f < .5, s = pergi ? f * 2 : (f - .5) * 2, k = s * s * (3 - 2 * s);
    const ax = n.b.x + 4, az = n.b.z - 3, bx = SETOR.x + (n.b.x > 0 ? 3 : n.b.x < 0 ? -3 : 0), bz = SETOR.z + 2;
    const x = pergi ? ax + (bx - ax) * k : bx + (ax - bx) * k, z = pergi ? az + (bz - az) * k : bz + (az - bz) * k;
    n.o.position.set(x, 0, z); n.o.rotation.y = Math.atan2(pergi ? bx - ax : ax - bx, pergi ? bz - az : az - bz);
    const ph = t / 110; pose(n.o, {legL: Math.sin(ph) * .6, legR: -Math.sin(ph) * .6, armL: pergi ? -2.6 : -Math.sin(ph) * .5, armR: pergi ? -2.6 : Math.sin(ph) * .5});
    n.beban.visible = pergi; n.beban.position.set(x, 5.6, z); n.beban.rotation.y = n.o.rotation.y;
  }
  // bahan terbang ke bangunan
  TERBANG = TERBANG.filter(f => {
    f.t += dt / .55; const k = Math.min(1, f.t);
    f.m.position.lerpVectors(f.a, f.b, k); f.m.position.y += Math.sin(k * Math.PI) * 14; f.m.rotation.x += dt * 8; f.m.rotation.z += dt * 6;
    if (k >= 1) { sc.remove(f.m); const b = munculBagian(); bunyi(520 + Math.random() * 300, .07, 'triangle', .06); if (!b) debu(f.b); tulisHud(); return false; }
    return true; });
  // pop bagian bangunan + debu
  if (BANG) BANG.pop = BANG.pop.filter(p => { p.t += dt / .35; const k = Math.min(1, p.t), s = k < .7 ? k / .7 * 1.15 : 1.15 - (k - .7) / .3 * .15; p.b.m.scale.copy(p.b.s).multiplyScalar(Math.max(.001, s)); return k < 1; });
  for (const d of DEBU) { d.t += dt; d.m.position.addScaledVector(d.v, dt); d.v.y -= dt * 6; d.m.material.opacity = Math.max(0, .8 - d.t * 1.2); d.m.scale.setScalar(1 + d.t * 1.5); }
  for (let i = DEBU.length - 1; i >= 0; i--) if (DEBU[i].t > .7) { sc.remove(DEBU[i].m); DEBU.splice(i, 1); }
  cincin.material.opacity = .55 + Math.sin(t / 200) * .3; cincin.scale.setScalar(1 + Math.sin(t / 300) * .04);
  KAM.pos.lerp(KAM.tPos, 1 - Math.pow(.015, dt)); KAM.lihat.lerp(KAM.tLihat, 1 - Math.pow(.015, dt)); cam.position.copy(KAM.pos); cam.lookAt(KAM.lihat);
  R.render(sc, cam); requestAnimationFrame(loop);
}
function langkah(dt, t) {
  let mx = STIK.x, mz = STIK.y;
  if (KEY.KeyA || KEY.ArrowLeft) mx -= 1; if (KEY.KeyD || KEY.ArrowRight) mx += 1; if (KEY.KeyW || KEY.ArrowUp) mz -= 1; if (KEY.KeyS || KEY.ArrowDown) mz += 1;
  const d = Math.hypot(mx, mz), lari = d > .1;
  if (lari) { const v = 18 * Math.min(1, d) * (SAYA.bawa.length >= MUAT ? .85 : 1); SAYA.x += mx / Math.max(1, d) * v * dt; SAYA.z += mz / Math.max(1, d) * v * dt; SAYA.arah = Math.atan2(mx, mz); }
  SAYA.x = Math.max(-36, Math.min(36, SAYA.x)); SAYA.z = Math.max(46, Math.min(80, SAYA.z));
  SAYA.ph += dt * (lari ? 11 : 0);
  const o = SAYA.o; o.position.set(SAYA.x, 0, SAYA.z); o.rotation.y = SAYA.arah;
  const bawa = SAYA.bawa.length > 0;
  pose(o, {legL: lari ? Math.sin(SAYA.ph) * .7 : 0, legR: lari ? -Math.sin(SAYA.ph) * .7 : 0, armL: bawa ? -2.7 : lari ? -Math.sin(SAYA.ph) * .6 : 0, armR: bawa ? -2.7 : lari ? Math.sin(SAYA.ph) * .6 : 0});
  punggung.position.set(SAYA.x, 0, SAYA.z); punggung.rotation.y = SAYA.arah;
  // ambil bahan di dekat tumpukan
  const dekat = BAHAN.find(b => Math.hypot(SAYA.x - b.x, SAYA.z - (b.z - 3)) < 8);
  SAYA.ambilT -= dt;
  if (dekat && SAYA.bawa.length < MUAT && SAYA.ambilT <= 0) { SAYA.ambilT = .16; SAYA.bawa.push(dekat.id); susunPunggung(); bunyi(300 + SAYA.bawa.length * 60, .05, 'triangle', .05); tulisHud();
    if (SAYA.bawa.length === MUAT) kabar('🎒 Penuh! Bawa ke gerbang proyek'); }
  // setor di lingkaran kuning: bahan satu per satu terbang ke bagian bangunan berikutnya
  SAYA.setorT -= dt;
  if (Math.hypot(SAYA.x - SETOR.x, SAYA.z - SETOR.z) < 5.6 && SAYA.bawa.length && SAYA.setorT <= 0) {
    SAYA.setorT = .13; const id = SAYA.bawa.pop(); susunPunggung();
    const m = kotak(1.6, .7, 1.1, BAHAN.find(x => x.id === id).w); const a = new THREE.Vector3(SAYA.x, 2.6 + SAYA.bawa.length * .74, SAYA.z);
    const target = BANG && BANG.bagian[Math.min(BANG.bagian.length - 1, BANG.tampak + TERBANG.length)]; const b = target ? target.c.clone() : new THREE.Vector3(0, 4, 20);
    m.position.copy(a); sc.add(m); TERBANG.push({m, a, b, t: 0});
    KERJA.setor++; KERJA.sesiBahan++;
    if (KERJA.sesiBahan >= TK_BAHAN) { KERJA.sesiBahan = 0; catatSesi(); }
    tulisHud();
  }
  // panah: ke tumpukan terdekat bila kosong, ke lingkaran setor bila membawa bahan
  const tuju = SAYA.bawa.length >= MUAT || (SAYA.bawa.length && !dekat) ? SETOR : BAHAN.reduce((p, b) => Math.hypot(b.x - SAYA.x, b.z - SAYA.z) < Math.hypot(p.x - SAYA.x, p.z - SAYA.z) ? b : p);
  panah.visible = true; panah.position.set(tuju.x, 9 + Math.sin(t / 180) * 1.2, tuju.z - (tuju === SETOR ? 0 : 3));
  petunjuk();
  // kamera di belakang avatar, menghadap bangunan
  KAM.tPos.set(SAYA.x * .6, 25, SAYA.z + 30); KAM.tLihat.set(SAYA.x * .45, 5, SAYA.z - 16);
}
requestAnimationFrame(loop);

// ---------- format ----------
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tglWib = t => { const d = new Date(t + 7 * 3600e3); return `${HARI[d.getUTCDay()]} ${d.getUTCDate()} ${BLN[d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')} WIB`; };
const lama = ms => { const m = Math.round(ms / 60e3), h = Math.floor(m / 1440), j = Math.floor(m % 1440 / 60), mn = m % 60; return [h && h + ' hari', j && j + ' jam', (!h && mn) && mn + ' menit'].filter(Boolean).join(' ') || '0 menit'; };

// ---------- lobi ----------
function tulisLobi() {
  const d = INFO || {}, a = d.aktif, s = d.saya, at = d.aturan || {};
  $('lNama').textContent = a ? a.nama.replace(/^\S+ /, '') : 'fasum';
  if (!a) {
    $('lStatus').innerHTML = `<b>🎉 Semua fasum sudah jadi!</b><p class="kecil">Proyek berikutnya dimulai begitu voting fasum ditutup. Taruh ⭐ bintangmu di menu ⚙ Atur → Voting di desa.</p>`;
    $('bMulai').textContent = '🔨 MAIN LATIHAN';
  } else {
    const kini = Date.now(), p = tahapDari(a);
    $('lStatus').innerHTML = `<div class="bar"><span style="width:${(p * 100).toFixed(1)}%"></span><em>${Math.round(p * 100)}% · jadi ${lama(a.sampai - kini)} lagi</em></div>
      <p class="kecil">📍 ${NAMA_DUSUN[a.dusun] || 'Dunia Kotak'} · jadi <b style="color:#fff">${tglWib(a.sampai)}</b></p>
      ${a.maju > 0 ? `<div class="cepat">⚡ ${lama(a.maju)} lebih cepat berkat ${a.tukang} tukang</div>` : '<div class="cepat">⚡ Belum ada yang ikut kerja. Ayo jadi tukang pertama!</div>'}`;
    $('bMulai').textContent = AKUN ? '🔨 MULAI KERJA' : '🔨 MAIN LATIHAN';
  }
  $('bMulai').disabled = false;
  const ms = at.maju ? Math.round(at.maju / 60e3) : 20;
  $('lAturan').innerHTML = AKUN && s
    ? `Angkut bata, kayu, semen ke gerbang proyek. Tiap <b>${TK_BAHAN} bahan</b> = fasum <b>${ms} menit lebih cepat</b>${s.sisaMaju ? '' : ' (jatah hari ini habis)'} + koin & poin Piala ${NAMA_DUSUN[dusunNo(s.no)] || ''} (sisa <b>${s.sisaKoin}/${at.sesiKoin || 3}</b> hari ini).`
    : `Kamu main sebagai tamu, jadi ini latihan. <a href="/duniakotak/mabar/" style="color:var(--kuning)">Masuk sebagai warga</a> supaya kerjamu mempercepat fasum dan dapat koin.`;
  const top = a?.top || [];
  $('lTop').innerHTML = top.length ? top.map((x, i) => `<div class="${s && x.no === s.no ? 'saya' : ''}"><span>${i + 1}</span><b>@${esc(x.u)}</b><em>${x.sesi * TK_BAHAN} bahan</em></div>`).join('') : '<div><b>Belum ada tukang. Jadilah yang pertama!</b></div>';
  if (s) { $('dompet').hidden = false; $('dompet').textContent = `🪙 ${s.koin} · 💎 ${s.permata}`; }
}
async function muat() {
  INFO = await apiB('info');
  if (INFO.saya?.avatar) gantiAvatar(INFO.saya.avatar);
  pasangBangunan(INFO); tulisLobi();
}

// ---------- mulai / selesai kerja ----------
function mulaiKerja() {
  if (MAIN) return; MAIN = true; bunyi(660, .08);
  Object.assign(KERJA, {setor: 0, sesiBahan: 0, sesi: 0, koin: 0, maju: 0, piala: 0});
  SAYA.x = 0; SAYA.z = 62; SAYA.arah = Math.PI; SAYA.bawa = []; susunPunggung();
  for (const id of ['lobi', 'dompet', 'hasil']) $(id).hidden = true;
  for (const id of ['kabur', 'hud', 'tas', 'stik', 'petunjuk']) $(id).hidden = false;
  tulisHud(); petunjuk();
  if (AKUN && INFO?.aktif) apiB('mulai');
}
function selesaiKerja() {
  if (!MAIN) return; MAIN = false; panah.visible = false;
  for (const id of ['kabur', 'hud', 'tas', 'stik', 'petunjuk']) $(id).hidden = true;
  const sisa = TK_BAHAN - KERJA.sesiBahan;
  $('hsJudul').textContent = KERJA.setor >= 40 ? 'Tukang jempolan! 🏆' : KERJA.setor ? 'Kerja bagus, tukang! 💪' : 'Istirahat dulu ya 🙂';
  $('hsRinci').innerHTML = `<div class="baris besar"><span>📦 Bahan disetor</span><b>${KERJA.setor}</b></div>`
    + (AKUN && INFO?.aktif ? `<div class="baris"><span>⚡ Fasum lebih cepat</span><b>${Math.round(KERJA.maju / 60e3)} menit</b></div><div class="baris"><span>🪙 Koin</span><b>+${KERJA.koin}</b></div><div class="baris"><span>🏆 Poin Piala dusun</span><b>+${KERJA.piala}</b></div>` : '');
  $('hsHadiah').innerHTML = AKUN && INFO?.aktif
    ? (KERJA.sesiBahan ? `<p class="kecil">Kurang ${sisa} bahan lagi untuk ⚡ 20 menit berikutnya. Lanjut?</p>` : '<p class="kecil">Terima kasih sudah gotong royong! 🙏</p>')
    : `<p class="kecil">Ini latihan. <a href="/duniakotak/mabar/" style="color:var(--kuning)">Masuk sebagai warga</a> supaya kerjamu tercatat dan dapat koin.</p>`;
  $('hasil').hidden = false;
}

// ---------- tombol ----------
$('bMulai').onclick = mulaiKerja;
$('bLagi').onclick = () => { $('hasil').hidden = true; mulaiKerja(); };
$('kabur').onclick = e => { e.stopPropagation(); selesaiKerja(); };
$('hasil').addEventListener('click', e => { if (e.target === $('hasil')) { $('hasil').hidden = true; $('lobi').hidden = false; muat(); } });
muat();
window.__tk = {INFO: () => INFO, mulai: mulaiKerja, selesai: selesaiKerja, saya: SAYA, KERJA, BANG: () => BANG, stik: (x, y) => { STIK.x = x; STIK.y = y; }};

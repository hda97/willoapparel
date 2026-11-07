// Pelari Kalcer 3D — Willo Apparel Official Edition (Master Bundle)
// Lobi race expo (avatar, gear, 6 map, 6 booth, ranking, chat, ABC drills) -> GPS -> lari 1 KM -> Race Receipt.
import * as THREE from 'three';
import qrcode from 'qrcode-generator';
import { HAIRSTYLES, HAIR_COLORS, SKIN_TONES, GEAR_TABS, GEAR_CATALOG, GAMBAR_GEAR, MAPS, EXPO_BOOTHS, LEADERBOARD_DATA, CHAT_AWAL, CHAT_BANK, NAMA_NPC } from './data.js';
import { ASET, $, mulberry, kanvasTex, sprite, RASIO, fmt, esc } from './util.js';
import { JARAK_FINISH, LAJUR, KECEPATAN_DASAR, KECEPATAN_MAKS, KALI_SPRINT, KALI_WALL, BATAS_WALL, KURAS_DASAR, KALI_KURAS_SPRINT, SKALA_WAKTU, WS_MULAI, WS_JENDELA, TOTAL_PELARI, URL_KAMPANYE, W } from './konst.js';
import { bangunDunia, texLubang } from './dunia.js';
import { buatPelari, papanNama, mat } from './pelari.js';

document.querySelectorAll('img[data-aset]').forEach((im) => { im.src = ASET[im.dataset.aset] || ''; });

// ---------------- simpanan ----------------
const KUNCI = 'pelarikalcer:v2';
const AWAL = {
  coins: 2850, username: 'SkenaRunner_ID', bib: '#0088', gender: 'male', hairstyleId: 'comma', hairColorHex: '#18181A', skinToneHex: '#CC9670',
  jerseyId: 'boxy_charcoal', bottomId: 'split_onyx', shoeId: 'daily_oat', watchId: 'willo_sport', prestigeId: 'sunglasses_matte', pacerFlag: '',
  ownedGear: { jersey_basic: 1, boxy_charcoal: 1, split_onyx: 1, shoe_starter: 1, daily_oat: 1, watch_basic: 1, willo_sport: 1, none: 1, sunglasses_matte: 1 },
  activeMapId: 'jakarta', activeBuff: null, warmup: 0, bonusHeart: 0, rpcHari: '', terbaik: {}, hasilTerakhir: null, suara: true,
};
let S = JSON.parse(JSON.stringify(AWAL));
try { const s = JSON.parse(localStorage.getItem(KUNCI) || 'null'); if (s && typeof s === 'object') S = { ...S, ...s, ownedGear: { ...AWAL.ownedGear, ...(s.ownedGear || {}) }, terbaik: { ...(s.terbaik || {}) } }; } catch (e) { /* tanpa storage */ }
const tulis = () => { try { localStorage.setItem(KUNCI, JSON.stringify(S)); } catch (e) { /* abaikan */ } };
const SLOT = { jersey: 'jerseyId', bottom: 'bottomId', shoe: 'shoeId', watch: 'watchId', prestige: 'prestigeId' };
const cari = (slot, id) => GEAR_CATALOG[slot].find((g) => g.id === id);
for (const [slot, kunci] of Object.entries(SLOT)) { if (!cari(slot, S[kunci]) || !S.ownedGear[S[kunci]]) S[kunci] = AWAL[kunci]; }
if (!MAPS.find((m) => m.id === S.activeMapId)) S.activeMapId = 'jakarta';
if (!HAIRSTYLES.find((h) => h.id === S.hairstyleId)) S.hairstyleId = 'comma';
if (!Number.isFinite(S.coins)) S.coins = AWAL.coins;
const peta = () => MAPS.find((m) => m.id === S.activeMapId);
const gear = (slot) => cari(slot, S[SLOT[slot]]);
const level = (id) => S.ownedGear[id] || 0;

function hitungStat() {
  const j = gear('jersey'), b = gear('bottom'), s = gear('shoe'), w = gear('watch'), p = gear('prestige');
  const buff = S.activeBuff || { pace: 0, stamina: 0 };
  const paceBonus = j.paceBonus + b.paceBonus + s.paceBonus + p.paceBonus + (level(j.id) + level(s.id) - 2) * 3 + buff.pace;
  const staminaSave = Math.min(75, j.staminaSave + b.staminaSave + (w.staminaSave || 0) + p.staminaSave + buff.stamina);
  return { paceBonus, staminaSave, trailProof: !!s.trailProof, coinBonus: j.coinBonus || 0, gpsTime: w.gpsTime, j, b, s, w, p };
}
const kecepatanDasar = (st, warm, m = peta()) => Math.min(KECEPATAN_MAKS, KECEPATAN_DASAR * (1 + st.paceBonus / 100 + (warm ? 0.12 : 0))) * (m.category === 'trail' ? 0.88 : 1);
const paceDari = (v) => (1000 / v) * SKALA_WAKTU;
function tierDari(pb) { return pb < 30 ? '1. Basic Jogger' : pb < 60 ? '2. Silver Pacer' : pb < 90 ? '3. Gold Sub-4' : pb < 120 ? '4. Sage Elite' : '5. Titanium Ultra'; }
const pendek = (n) => n.replace(/\s*\(.*\)\s*/, '').replace(/^Willo\s+/, '');
const hariIni = () => new Date().toISOString().slice(0, 10);

// ---------------- audio ----------------
let ac = null;
function audio() { if (!S.suara) return null; if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
function nada(f1, f2, dur, tipe = 'sine', vol = 0.15, tunda = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + tunda; const o = a.createOscillator(); const g = a.createGain();
  o.type = tipe; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  koin: () => nada(1300, 1900, 0.09, 'sine', 0.07), geser: () => nada(500, 760, 0.06, 'sine', 0.05), lompat: () => nada(300, 620, 0.16, 'triangle', 0.1),
  tabrak: () => nada(160, 50, 0.3, 'sawtooth', 0.16), power: () => { nada(500, 1000, 0.12, 'square', 0.05); nada(750, 1500, 0.14, 'square', 0.05, 0.09); },
  bip: (t = 0) => nada(1760, 1760, 0.09, 'square', 0.06, t), peluit: () => { for (let i = 0; i < 6; i++) nada(2600 + (i % 2) * 300, 2600 + (i % 2) * 300, 0.06, 'sine', 0.08, i * 0.06); },
  minum: () => { nada(400, 900, 0.2, 'sine', 0.12); nada(900, 1400, 0.15, 'sine', 0.08, 0.15); }, drill: () => nada(880, 1100, 0.05, 'triangle', 0.06),
  beli: () => { nada(700, 1400, 0.1, 'sine', 0.08); nada(1400, 2100, 0.12, 'sine', 0.06, 0.08); }, gagal: () => nada(300, 150, 0.2, 'triangle', 0.1),
};

// ---------------- renderer & scene ----------------
const kanvas = $('layar');
const renderer = new THREE.WebGLRenderer({ canvas: kanvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const kamera = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 460);
scene.add(new THREE.HemisphereLight(0xeef0ea, 0x5d5446, 1.55));
const matahari = new THREE.DirectionalLight(0xfff0dc, 1.7); matahari.position.set(-30, 50, 20); scene.add(matahari);
const isi = new THREE.DirectionalLight(0xf3ede2, 0.75); isi.position.set(15, 18, -30); scene.add(isi);
function ukur() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.fov = w / h < 1 ? 80 : 62; kamera.updateProjectionMatrix();
}
window.addEventListener('resize', ukur); ukur();

let dunia = null;
function gantiDunia() {
  if (dunia) dunia.buang();
  dunia = bangunDunia(scene, peta());
  scene.background = dunia.langit; scene.fog = dunia.kabut;
}

// ---------------- avatar pemain ----------------
const cfgSaya = () => ({ gender: S.gender, hairstyle: S.hairstyleId, hair: S.hairColorHex, skin: S.skinToneHex, jersey: gear('jersey'), bottom: gear('bottom'), shoe: gear('shoe'), watch: gear('watch'), prestige: gear('prestige'), pacer: S.pacerFlag, bib: S.bib });
let avatar = null;
const zonaTap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2, 10), new THREE.MeshBasicMaterial({ visible: false }));
zonaTap.position.y = 1;
function pasangAvatar() {
  if (avatar) scene.remove(avatar);
  avatar = buatPelari(cfgSaya()); scene.add(avatar);
  avatar.add(zonaTap);
  letakLobi();
}
function letakLobi() { if (!avatar || !dunia) return; avatar.position.set(0, dunia.tinggi(-8) + 0.24, 8); avatar.rotation.set(0, 0, 0); avatar.visible = true; }

// ---------------- keadaan lari ----------------
const P = { d: 0, x: 0, lajur: 1, y: 0, vy: 0, kecepatan: 0, vDasar: 10, stamina: 100, nyawa: 3, koin: 0, kebal: 0, burst: 0, sprintKey: false,
  magnet: 0, perisai: 0, gel: 0, waktu: 0, selesai: false, ws: 'belum', lambat: 0, drafting: false, pacerDraft: false, tabrakan: 0, st: null, kebalTrailInfo: false, rank: TOTAL_PELARI };
let mode = 'lobi'; // lobi | gps | main | jeda | hasil
let entitas = [], peloton = [], goyang = 0;
const trek = new THREE.Group(); scene.add(trek);

function kosongkanTrek() {
  for (const n of peloton) if (n.label) n.label.material.map.dispose();
  trek.clear(); entitas = []; peloton = [];
}
const materialPembatas = (() => {
  const t = kanvasTex(128, 32, (g, w, h) => { g.fillStyle = W.krem; g.fillRect(0, 0, w, h); for (let x = -32; x < w; x += 32) { g.fillStyle = W.onyx; g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, 0); g.lineTo(x + 32, 0); g.lineTo(x + 16, h); g.fill(); } });
  return new THREE.MeshLambertMaterial({ map: t });
})();
const matLubang = new THREE.MeshBasicMaterial({ map: texLubang, transparent: true, depthWrite: false });
const geoLubang = new THREE.PlaneGeometry(1.7, 1.5);
const geoPapan = new THREE.BoxGeometry(1.9, 0.32, 0.08), geoKaki = new THREE.BoxGeometry(0.08, 0.62, 0.08);
const geoAkar = new THREE.CylinderGeometry(0.12, 0.16, 2.0, 7), geoBenjol = new THREE.SphereGeometry(0.16, 7, 5);

const UK_PICKUP = { koin: 0.62, petir: 0.8, magnet: 0.8, perisai: 0.8, hati: 0.75, gel: 0.8 };
const NAMA_SPRITE = { koin: 'item_coin_w', petir: 'item_lightning', magnet: 'magnet', perisai: 'perisai', hati: 'hati', gel: 'item_gel' };
const RINTANGAN = { kerucut: 0.75, lubang: 0.25, pembatas: 0.75, batu: 0.7, akar: 0.32 };

function bangunLintasan(seed) {
  kosongkanTrek();
  const r = mulberry(seed); const m = peta(); const trail = m.category === 'trail';
  const taruh = (o, x, d, y = 0) => { o.position.set(x, dunia.tinggi(d) + y, -d); trek.add(o); return o; };
  const tambah = (jenis, lajur, d, data = {}) => {
    let obj;
    if (jenis === 'kerucut') obj = sprite('kerucut', 0.95);
    else if (jenis === 'batu') obj = sprite('batu', 0.85, { warna: m.id === 'bromo' ? 0xb7b0a7 : 0xffffff });
    else if (jenis === 'lubang') { obj = new THREE.Mesh(geoLubang, matLubang); obj.rotation.x = -Math.PI / 2; }
    else if (jenis === 'akar') {
      obj = new THREE.Group(); const mA = mat('#5a4334');
      const a = new THREE.Mesh(geoAkar, mA); a.rotation.z = Math.PI / 2 + 0.12; a.position.y = 0.12; obj.add(a);
      for (const bx of [-0.6, 0.2, 0.75]) { const b = new THREE.Mesh(geoBenjol, mA); b.position.set(bx, 0.12, 0); b.scale.set(1, 0.7, 1); obj.add(b); }
    } else if (jenis === 'pembatas') {
      obj = new THREE.Group(); const p = new THREE.Mesh(geoPapan, materialPembatas); p.position.y = 0.62; obj.add(p);
      for (const sx of [-0.8, 0.8]) { const k = new THREE.Mesh(geoKaki, mat('#cfc8bb')); k.position.set(sx, 0.31, 0); obj.add(k); }
    } else obj = sprite(NAMA_SPRITE[jenis], UK_PICKUP[jenis]);
    const rintangan = jenis in RINTANGAN;
    const yT = jenis === 'lubang' ? 0.025 : (rintangan ? 0 : 0.55 + (data.yLebih || 0));
    taruh(obj, LAJUR[lajur], d, yT);
    entitas.push({ jenis, lajur, d, obj, yDasar: yT, aktif: true, rintangan });
  };
  const jenisRintangan = trail ? ['batu', 'akar', 'batu'] : ['kerucut', 'lubang', 'pembatas'];
  let d = 45, hitung = 0;
  while (d < JARAK_FINISH - 30) {
    if (d > WS_MULAI + 15 && d < WS_JENDELA[1] + 40) { const l = Math.floor(r() * 3); for (let i = 0; i < 6; i++) tambah('koin', l, d + i * 2.4); d += 22; continue; }
    hitung++;
    const p = r(); const bebas = [0, 1, 2].sort(() => r() - 0.5);
    if (p < 0.3) { tambah(jenisRintangan[0], bebas[0], d); if (r() < 0.45) tambah(jenisRintangan[0], bebas[1], d); for (let i = 0; i < 5; i++) tambah('koin', bebas[2], d - 4 + i * 2.2); }
    else if (p < 0.48) { tambah(jenisRintangan[1], bebas[0], d); for (let i = -2; i <= 2; i++) tambah('koin', bebas[0], d + i * 1.6, { yLebih: (1 - (i * i) / 5) * 1.4 }); }
    else if (p < 0.64) { tambah(jenisRintangan[2], bebas[0], d); if (r() < 0.35) tambah(jenisRintangan[0], bebas[1], d + 6); }
    else { const l = bebas[0]; for (let i = 0; i < 7; i++) tambah('koin', l, d + i * 2.3); }
    if (hitung % 9 === 4) tambah('petir', bebas[2], d + 9);
    if (hitung === 7 || hitung === 30) tambah('magnet', bebas[1], d + 10);
    if (hitung === 15 || hitung === 38) tambah('perisai', bebas[2], d + 10);
    if (hitung === 24) tambah('hati', bebas[1], d + 11);
    if (hitung === 11 || hitung === 34) tambah('gel', bebas[1], d + 12);
    d += 17 + r() * 9;
  }
  // peloton NPC + 2 pacer
  const fRambut = ['ponytail_visor', 'boxer_braids', 'wavy_bob', 'high_bun', 'bubble_pony', 'sport_hijab'], mRambut = ['taper_headband', 'comma', 'mullet', 'curly', 'buzz', 'manbun'];
  const pilih = (a) => a[Math.floor(r() * a.length)];
  const faktor = trail ? 0.88 : 1;
  const nama = [...NAMA_NPC].sort(() => r() - 0.5);
  const buat = (i, nd, v, pacer) => {
    const fem = r() < 0.45;
    const bottoms = GEAR_CATALOG.bottom.filter((b) => (fem ? true : b.type === 'shorts' || b.type === 'tights'));
    const cfg = { gender: fem ? 'female' : 'male', hairstyle: pilih(fem ? fRambut : mRambut), hair: pilih(HAIR_COLORS).hex, skin: pilih(SKIN_TONES).hex,
      jersey: pilih(GEAR_CATALOG.jersey), bottom: pilih(bottoms), shoe: pilih(GEAR_CATALOG.shoe), watch: pilih(GEAR_CATALOG.watch), prestige: pilih(GEAR_CATALOG.prestige),
      pacer, bib: '#' + String(100 + Math.floor(r() * 9800)).padStart(4, '0') };
    const obj = buatPelari(cfg); obj.scale.setScalar(0.96 + r() * 0.08); trek.add(obj);
    const label = papanNama(pacer ? `PACER ${pacer}` : nama[i % nama.length], pacer ? W.onyx : W.krem, pacer ? 'rgba(239,236,230,.92)' : 'rgba(20,22,24,.72)');
    obj.add(label);
    const n = { obj, label, d: nd, lajur: Math.floor(r() * 3), x: 0, v, y: 0, vy: 0, pacer: !!pacer, nama: nama[i % nama.length] };
    n.x = LAJUR[n.lajur]; peloton.push(n);
  };
  for (let i = 0; i < 22; i++) { const nd = 14 + i * 40 + r() * 16; if (nd > JARAK_FINISH - 60) break; buat(i, nd, (9.2 + r() * 3.4) * faktor); }
  buat(30, 6, (1000 * SKALA_WAKTU / 270) * faktor, '4:30');
  buat(31, 3, (1000 * SKALA_WAKTU / 300) * faktor, '5:00');
}

// ---------------- efek angin, cincin lompat ----------------
const angin = [];
const geoAngin = new THREE.PlaneGeometry(0.025, 1.8); geoAngin.rotateX(-Math.PI / 2);
for (let i = 0; i < 34; i++) {
  const m = new THREE.MeshBasicMaterial({ color: i < 22 ? W.krem : W.sage, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const o = new THREE.Mesh(geoAngin, m); o.userData.sage = i >= 22; o.visible = false; scene.add(o); angin.push(o);
}
function aturUlangAngin(o, dekat) { o.position.set((Math.random() - 0.5) * 9, 0.3 + Math.random() * 2.8, -P.d - (dekat ? Math.random() * 25 : 18 + Math.random() * 10)); o.position.y += dunia.tinggi(P.d); }
const cincin = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 28), new THREE.MeshBasicMaterial({ color: W.krem, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
cincin.rotation.x = -Math.PI / 2; scene.add(cincin); let cincinT = 0;
function letupCincin() { cincinT = 0.45; cincin.position.set(P.x, dunia.tinggi(P.d) + 0.05, -P.d); }

// ---------------- HUD ----------------
let toastT = 0;
function toast(teks, warna = W.krem, lama = 1.1) { const t = $('toast'); t.textContent = teks; t.style.color = warna; t.style.opacity = 1; toastT = lama; }
function gambarNyawa() {
  const el = $('nyawa'); el.innerHTML = '';
  for (let i = 0; i < Math.max(3, P.nyawa); i++) { const im = document.createElement('img'); im.src = ASET.hati; im.alt = ''; if (i >= P.nyawa) im.className = 'mati'; el.appendChild(im); }
  el.setAttribute('aria-label', `Nyawa ${P.nyawa}`);
}
const warnaStamina = (p) => (p > 55 ? W.sage : p > BATAS_WALL ? W.tembaga : W.terakota);
let hudT = 0;
function perbaruiHUD(dt) {
  hudT -= dt; if (hudT > 0) return; hudT = 0.1;
  const km = Math.min(P.d, JARAK_FINISH) / 1000;
  $('jarak').innerHTML = `${km.toFixed(2)} <em>/ 1.0K</em>`;
  const tL = P.waktu * SKALA_WAKTU;
  $('pace').innerHTML = `${P.d > 30 ? fmt(tL / (P.d / 1000)) : '--:--'} <em>/km</em>`;
  const st = Math.max(0, P.stamina); const isi = $('stIsi'); isi.style.width = st + '%'; isi.style.backgroundColor = warnaStamina(st);
  $('koin').textContent = P.koin;
  if (P.d > 30) { const pc = tL / (P.d / 1000); const f = 1 / (1 + Math.exp(-(pc - 330) / 40)); P.rank = Math.max(1, Math.min(TOTAL_PELARI, Math.round(TOTAL_PELARI * f * (1 - km * 0.15)))); }
  $('rank').textContent = P.d > 30 ? `#${P.rank.toLocaleString('id-ID')}` : '#--';
  const b = [];
  if (P.magnet > 0) b.push(['magnet', `${Math.ceil(P.magnet)}s`]);
  if (P.perisai > 0) b.push(['perisai', `${Math.ceil(P.perisai)}s`]);
  if (P.gel > 0) b.push(['item_gel', `+14% ${Math.ceil(P.gel)}s`]);
  if (P.buff) b.push(['item_kopi', `+${P.buff.pace}%`]);
  if (P.warm) b.push(['item_lightning', 'WARM-UP +12%']);
  const html = b.map(([n, t]) => `<span class="buff kaca"><img src="${ASET[n]}" alt="">${t}</span>`).join('');
  if ($('buff').dataset.h !== html) { $('buff').innerHTML = html; $('buff').dataset.h = html; }
}

// mini chat simulasi
let chatT = 4;
const SESI_CHAT = CHAT_AWAL.map((c) => ({ ...c }));
function chatMasuk(user, text) {
  const el = $('miniChat'); const d = document.createElement('div'); d.innerHTML = `<b>${esc(user)}</b> ${esc(text)}`; el.appendChild(d);
  while (el.children.length > 3) el.firstChild.remove();
  setTimeout(() => d.remove(), 8000);
}

// ---------------- input saat lari ----------------
function geser(arah) {
  if (mode !== 'main' || P.selesai) return;
  const l = Math.max(0, Math.min(2, P.lajur + arah)); if (l !== P.lajur) { P.lajur = l; sfx.geser(); }
}
function lompat() { if (mode !== 'main' || P.selesai) return; if (P.y <= 0.001) { P.vy = 7.4; sfx.lompat(); letupCincin(); } }
function ambilIsotonik() {
  if (mode !== 'main' || P.ws !== 'aktif') return;
  if (P.d < WS_JENDELA[0] - 25) { toast('Tunggu meja minum di depan…', W.krem, 0.9); return; }
  if (P.d >= WS_JENDELA[0] && P.d <= WS_JENDELA[1]) {
    P.ws = 'dapat'; P.stamina = Math.min(100, P.stamina + 35); P.koin += 30; sfx.minum(); toast('ISOTONIK! +35% STAMINA · +30 W', W.sage, 1.6);
  } else { P.ws = 'lewat'; toast('Kecepetan! Botolnya jatuh', W.terakota); sfx.gagal(); }
  $('qte').hidden = true;
}
const tekan = new Map();
function riak(x, y) { const i = document.createElement('i'); i.style.left = x + 'px'; i.style.top = y + 'px'; $('riak').appendChild(i); setTimeout(() => i.remove(), 520); }
kanvas.addEventListener('pointerdown', (e) => {
  audio();
  if (mode === 'lobi') { tapAvatar(e); return; }
  if (mode !== 'main') return;
  tekan.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), geser: false });
  try { kanvas.setPointerCapture(e.pointerId); } catch (er) { /* */ }
  riak(e.clientX, e.clientY);
});
kanvas.addEventListener('pointermove', (e) => {
  const t = tekan.get(e.pointerId); if (!t || mode !== 'main') return;
  const dx = e.clientX - t.x, dy = e.clientY - t.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 34) return;
  if (Math.abs(dx) > Math.abs(dy)) geser(dx > 0 ? 1 : -1); else if (dy < 0) lompat();
  t.geser = true; t.x = e.clientX; t.y = e.clientY;
});
function lepas(e) {
  const t = tekan.get(e.pointerId); if (!t) return; tekan.delete(e.pointerId);
  if (mode !== 'main' || t.geser || performance.now() - t.t > 220) return;
  if (P.ws === 'aktif' && P.d >= WS_JENDELA[0] && P.d <= WS_JENDELA[1]) ambilIsotonik();
  else if (P.stamina > 0) P.burst = 1.4;
}
for (const ev of ['pointerup', 'pointercancel']) kanvas.addEventListener(ev, lepas);
const sprintTahan = () => { const now = performance.now(); for (const t of tekan.values()) if (!t.geser && now - t.t > 220) return true; return false; };
$('bAmbil').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); audio(); ambilIsotonik(); });
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT')) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { const m = [...document.querySelectorAll('.modal')].find((x) => !x.hidden && x.id.startsWith('m') && x.id !== 'mJeda'); if (m) { tutup(m.id); return; } }
  if (mode !== 'main' && mode !== 'jeda') return;
  if (k === 'arrowleft' || k === 'a') geser(-1);
  else if (k === 'arrowright' || k === 'd') geser(1);
  else if (k === 'arrowup' || k === 'w' || k === ' ') { e.preventDefault(); lompat(); }
  else if (k === 'shift') P.sprintKey = true;
  else if (k === 'e' || k === 'enter') ambilIsotonik();
  else if (k === 'escape' || k === 'p') jeda(mode === 'main');
});
window.addEventListener('keyup', (e) => { if (e.key === 'Shift') P.sprintKey = false; });
window.addEventListener('blur', () => { P.sprintKey = false; tekan.clear(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'main') jeda(true); });
window.addEventListener('resize', () => { if (mode === 'main' && window.innerWidth < window.innerHeight && window.innerWidth <= 700) jeda(true); });

// ---------------- modal ----------------
const laciBuka = () => document.body.classList.toggle('laciBuka', !$('mRambut').hidden || !$('mGear').hidden);
function buka(id) { $(id).hidden = false; laciBuka(); }
function tutup(id) { $(id).hidden = true; laciBuka(); perbaruiLobi(); }
document.querySelectorAll('.modal').forEach((m) => {
  m.addEventListener('click', (e) => { if (e.target === m && m.id.startsWith('m') && m.id !== 'mJeda') tutup(m.id); });
  m.querySelectorAll('[data-tutup]').forEach((b) => { b.onclick = () => tutup(m.id); });
});
const tutupSemua = () => { document.querySelectorAll('.modal').forEach((m) => { m.hidden = true; }); laciBuka(); };

// ---------------- lobi ----------------
function perbaruiLobi() {
  const st = hitungStat(); const m = peta();
  $('namaLobi').textContent = S.username; $('inisial').textContent = S.username.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'PK';
  $('bibLobi').textContent = S.bib; $('tierLobi').textContent = tierDari(st.paceBonus).replace(/^\d\.\s*/, '');
  $('saldo').textContent = S.coins.toLocaleString('id-ID'); $('petaLobi').textContent = m.shortName; $('nPetaTeks').textContent = m.shortName;
  $('gpsLobi').textContent = st.gpsTime ? `${st.gpsTime}s` : 'instan';
  $('bSuara').textContent = S.suara ? '🔊' : '🔇';
  const v = kecepatanDasar(st, S.warmup > 0);
  const pb = S.terbaik[m.id];
  $('statLobi').innerHTML = `
    <span>Pace bonus</span><b>+${st.paceBonus}%</b><div class="mbar"><i style="width:${Math.min(100, st.paceBonus / 1.6)}%"></i></div>
    <span>Hemat stamina</span><b>${st.staminaSave}%</b><div class="mbar"><i style="width:${st.staminaSave / 0.75}%"></i></div>
    <span>Estimasi pace</span><b>${fmt(paceDari(v))}/km</b>
    <span>Rute</span><b>${esc(m.shortName)} · +${m.gain}m</b>
    <span>Kebal batu/akar</span><b>${st.trailProof ? 'YA' : 'TIDAK'}</b>
    <span>PB rute ini</span><b>${pb ? fmt(pb) : '--:--'}</b>
    ${S.activeBuff ? '<span>Buff kopi</span><b>+18% · hemat 25%</b>' : ''}${S.bonusHeart ? '<span>Recovery</span><b>+1 nyawa</b>' : ''}`;
  const siap = S.warmup > 0;
  if (!drill.aktif) {
    $('drillNama').textContent = siap ? 'Warm-Up Boost siap ✓' : 'High Knees';
    $('drillInfo').textContent = siap ? '+12% pace untuk lari berikutnya. Tekan MULAI LARI.' : 'Ketuk tombol atau avatar mengikuti ritme. Selesaikan 3 gerakan untuk Warm-Up Boost +12% pace.';
    $('drillBar').style.width = siap ? '100%' : '0';
    $('bDrill').textContent = siap ? '✓ SUDAH PEMANASAN' : '⚡ MULAI DRILL'; $('bDrill').disabled = siap;
  }
}
$('bSuara').onclick = () => { S.suara = !S.suara; tulis(); perbaruiLobi(); if (S.suara) sfx.bip(); };
$('bProfil').onclick = () => { gambarRambut(); buka('mRambut'); };
$('nRambut').onclick = () => { gambarRambut(); buka('mRambut'); };
$('nGear').onclick = () => { gambarGear(); buka('mGear'); };
$('nPeta').onclick = () => { gambarPeta(); buka('mPeta'); };
$('nBooth').onclick = () => { $('boothInfo').textContent = ''; gambarBooth(); buka('mBooth'); };
$('nRank').onclick = () => { gambarRank(); buka('mRank'); };
$('bChat').onclick = () => { gambarChat(); buka('mChat'); };

// --- ABC drills ---
const DRILL = [{ nama: 'High Knees', pose: 'high' }, { nama: 'Butt Kicks', pose: 'kick' }, { nama: 'A-Skip', pose: 'skip' }];
const drill = { aktif: false, idx: 0, isi: 0, tAkhir: 0, gerak: 0 };
function mulaiDrill() {
  if (S.warmup > 0) return;
  Object.assign(drill, { aktif: true, idx: 0, isi: 0, tAkhir: 0, gerak: 0 });
  $('bDrill').textContent = 'KETUK!'; $('bDrill').classList.add('aktif');
  $('drillNama').textContent = `1/3 · ${DRILL[0].nama}`; $('drillInfo').textContent = 'Ketuk berirama (tidak terlalu cepat, tidak terlalu lambat).';
}
function ketukDrill() {
  if (!drill.aktif) { mulaiDrill(); return; }
  const now = performance.now(); const sela = now - drill.tAkhir; drill.tAkhir = now; drill.gerak = 0.6;
  const pas = sela >= 220 && sela <= 900;
  drill.isi = Math.min(100, drill.isi + (pas ? 12 : 4)); sfx.drill();
  $('drillBar').style.width = drill.isi + '%';
  $('drillInfo').textContent = pas ? 'Ritme pas! +12%' : 'Atur ritme… +4%';
  if (drill.isi >= 100) {
    drill.idx++; drill.isi = 0;
    if (drill.idx >= DRILL.length) {
      drill.aktif = false; S.warmup = 1; tulis(); sfx.power(); $('bDrill').classList.remove('aktif'); perbaruiLobi();
      toast('WARM-UP BOOST +12% PACE ✓', W.sage, 1.8);
    } else { $('drillNama').textContent = `${drill.idx + 1}/3 · ${DRILL[drill.idx].nama}`; $('drillBar').style.width = '0'; sfx.power(); }
  }
}
$('bDrill').onclick = (e) => { e.preventDefault(); audio(); ketukDrill(); };
const raycaster = new THREE.Raycaster(); const ptr = new THREE.Vector2();
function tapAvatar(e) {
  if (!avatar) return;
  ptr.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ptr, kamera);
  if (raycaster.intersectObject(zonaTap, false).length) { riak(e.clientX, e.clientY); if (S.warmup > 0) toast('Sudah pemanasan, gas lari!', W.sage); else ketukDrill(); }
}

// --- rambut & kulit ---
function gambarRambut() {
  $('nama').value = S.username;
  const pil = (el, item, aktif, isi, fn) => {
    $(el).innerHTML = item.map((x, i) => isi(x, i, aktif(x))).join('');
    $(el).querySelectorAll('button').forEach((b, i) => { b.onclick = () => { fn(item[i]); tulis(); pasangAvatar(); gambarRambut(); }; });
  };
  pil('pilGender', [{ id: 'male', n: 'Pria', d: 'Bahu lebih lebar' }, { id: 'female', n: 'Wanita', d: 'Siluet ramping' }], (x) => x.id === S.gender,
    (x, i, a) => `<button aria-pressed="${a}"><b>${x.n}</b><small>${x.d}</small></button>`, (x) => { S.gender = x.id; });
  pil('pilRambut', HAIRSTYLES, (x) => x.id === S.hairstyleId, (x, i, a) => `<button aria-pressed="${a}"><b>${esc(x.name)}</b><small>${esc(x.desc)}</small></button>`, (x) => { S.hairstyleId = x.id; });
  pil('pilWarna', HAIR_COLORS, (x) => x.hex === S.hairColorHex, (x, i, a) => `<button aria-pressed="${a}"><i style="background:${x.hex}"></i>${esc(x.name)}</button>`, (x) => { S.hairColorHex = x.hex; });
  pil('pilKulit', SKIN_TONES, (x) => x.hex === S.skinToneHex, (x, i, a) => `<button aria-pressed="${a}"><i style="background:${x.hex}"></i>${esc(x.name)}</button>`, (x) => { S.skinToneHex = x.hex; });
}
$('nama').addEventListener('input', () => {
  S.username = $('nama').value.replace(/[<>]/g, '').trim().slice(0, 18) || 'SkenaRunner_ID'; tulis(); perbaruiLobi();
});

// --- gear ---
let tabGear = 'jersey';
const biayaUpgrade = (g) => Math.max(250, g.costW + level(g.id) * 250);
function gambarGear() {
  $('tabGear').innerHTML = GEAR_TABS.map((t) => `<button aria-pressed="${t.id === tabGear}" data-t="${t.id}">${esc(t.nama)}</button>`).join('');
  $('tabGear').querySelectorAll('button').forEach((b) => { b.onclick = () => { tabGear = b.dataset.t; gambarGear(); }; });
  const pakai = S[SLOT[tabGear]];
  $('gridGear').innerHTML = GEAR_CATALOG[tabGear].map((g) => {
    const punya = level(g.id) > 0, dipakai = g.id === pakai, lv = level(g.id);
    const bisaUp = punya && (tabGear === 'jersey' || tabGear === 'shoe') && lv < 5;
    const lenc = [];
    if (g.paceBonus) lenc.push(`<span>+${g.paceBonus}% pace</span>`);
    if (g.staminaSave) lenc.push(`<span>hemat ${g.staminaSave}%</span>`);
    if (g.gpsTime != null) lenc.push(`<span>GPS ${g.gpsTime ? g.gpsTime + 's' : 'instan'}</span>`);
    if (g.trailProof) lenc.push('<span class="hijau">KEBAL BATU & AKAR</span>');
    if (g.coinBonus) lenc.push(`<span class="hijau">KOIN +${g.coinBonus}%</span>`);
    let aksi;
    if (!punya) aksi = `<button class="btn utama" data-beli="${g.id}" ${S.coins < g.costW ? 'disabled' : ''}><img src="${ASET.item_coin_w}" alt="">${g.costW.toLocaleString('id-ID')}</button>`;
    else aksi = `<button class="btn ${dipakai ? '' : 'utama'}" data-pakai="${g.id}" ${dipakai ? 'disabled' : ''}>${dipakai ? 'DIPAKAI ✓' : 'PAKAI'}</button>`;
    if (bisaUp) aksi += `<button class="btn" data-up="${g.id}" ${S.coins < biayaUpgrade(g) ? 'disabled' : ''} title="Upgrade +3% pace">Lv${lv}→${lv + 1} · ${biayaUpgrade(g)}</button>`;
    return `<div class="kartu ${dipakai ? 'pakai' : ''}"><div class="gbr" style="background-image:url(${ASET[g.id] || ASET[GAMBAR_GEAR[g.id]] || ''})"></div>
      <div class="kecil-atas"><span>${esc(g.tier)}</span><span>${punya && (tabGear === 'jersey' || tabGear === 'shoe') ? 'Lv' + lv : ''}</span></div>
      <b>${esc(g.name)}</b><p>${esc(g.desc)}</p><div class="lencana">${lenc.join('')}</div><div class="aksi">${aksi}</div></div>`;
  }).join('');
  const grid = $('gridGear');
  grid.querySelectorAll('[data-beli]').forEach((b) => { b.onclick = () => { const g = cari(tabGear, b.dataset.beli); if (S.coins < g.costW) return; S.coins -= g.costW; S.ownedGear[g.id] = 1; S[SLOT[tabGear]] = g.id; sfx.beli(); simpanGear(); }; });
  grid.querySelectorAll('[data-pakai]').forEach((b) => { b.onclick = () => { S[SLOT[tabGear]] = b.dataset.pakai; sfx.geser(); simpanGear(); }; });
  grid.querySelectorAll('[data-up]').forEach((b) => { b.onclick = () => { const g = cari(tabGear, b.dataset.up); const c = biayaUpgrade(g); if (S.coins < c || level(g.id) >= 5) return; S.coins -= c; S.ownedGear[g.id] = level(g.id) + 1; sfx.beli(); simpanGear(); }; });
  const st = hitungStat();
  $('saldoGear').textContent = S.coins.toLocaleString('id-ID');
  $('statGear').textContent = `+${st.paceBonus}% pace · hemat ${st.staminaSave}% · ${tierDari(st.paceBonus)}`;
}
function simpanGear() { tulis(); pasangAvatar(); gambarGear(); perbaruiLobi(); }

// --- peta ---
let tabPeta = 'semua';
function gambarPeta() {
  const tabs = [['semua', 'Semua Rute'], ['road', '🏙️ Road Marathon'], ['trail', '⛰️ Mountain Trail']];
  $('tabPeta').innerHTML = tabs.map(([id, n]) => `<button aria-pressed="${id === tabPeta}" data-t="${id}">${n}</button>`).join('');
  $('tabPeta').querySelectorAll('button').forEach((b) => { b.onclick = () => { tabPeta = b.dataset.t; gambarPeta(); }; });
  const st = hitungStat();
  $('gridPeta').innerHTML = MAPS.filter((m) => tabPeta === 'semua' || m.category === tabPeta).map((m) => {
    const aktif = m.id === S.activeMapId; const pb = S.terbaik[m.id];
    const peringatan = m.category === 'trail' && !st.trailProof ? '<span style="background:var(--terakota)">sepatu belum kebal batu</span>' : '';
    return `<div class="kartu ${aktif ? 'pakai' : ''}"><div class="gbr" style="background-image:url(${ASET[m.id]})"></div>
      <div class="kecil-atas"><span>${m.category === 'trail' ? 'MOUNTAIN TRAIL' : 'ROAD'} · +${m.gain.toLocaleString('id-ID')}m</span><span>${esc(m.grade)}</span></div>
      <b>${esc(m.name)}</b><p>${esc(m.landmarkDesc)}</p><p>Saran: ${esc(m.recGear)}</p>
      <div class="lencana"><span>stamina ×${m.staminaDrainMult}</span><span>PB ${pb ? fmt(pb) : '--:--'}</span>${peringatan}</div>
      <div class="aksi"><button class="btn ${aktif ? '' : 'utama'}" data-peta="${m.id}" ${aktif ? 'disabled' : ''}>${aktif ? 'RUTE AKTIF ✓' : 'PILIH RUTE'}</button></div></div>`;
  }).join('');
  $('gridPeta').querySelectorAll('[data-peta]').forEach((b) => { b.onclick = () => { S.activeMapId = b.dataset.peta; tulis(); gantiDunia(); letakLobi(); sfx.beli(); tutup('mPeta'); toast(`Rute: ${peta().shortName}`, W.krem, 1.4); }; });
}

// --- booth ---
function gambarBooth() {
  $('gridBooth').innerHTML = EXPO_BOOTHS.map((b) => `<div class="kartu"><div class="gbr" style="background-image:url(${ASET[b.id]})"></div>
    <b>${esc(b.name)}</b><div class="kecil-atas"><span>${esc(b.subtitle)}</span></div><p>${esc(b.desc)}</p>
    <div class="aksi"><button class="btn utama" data-aksi="${b.action}">${esc(b.btnText)}</button></div></div>`).join('');
  $('gridBooth').querySelectorAll('[data-aksi]').forEach((b) => { b.onclick = () => aksiBooth(b.dataset.aksi); });
}
function aksiBooth(a) {
  const info = (t) => { $('boothInfo').textContent = t; perbaruiLobi(); };
  if (a === 'open_shop') { tutup('mBooth'); gambarGear(); buka('mGear'); return; }
  if (a === 'claim_rpc') {
    S.bib = '#' + String(Math.floor(1 + Math.random() * 9998)).padStart(4, '0');
    if (S.rpcHari !== hariIni()) { S.rpcHari = hariIni(); S.coins += 400; sfx.beli(); info(`Race pack diklaim: +400 W. BIB baru ${S.bib}.`); }
    else { sfx.geser(); info(`BIB diganti ke ${S.bib}. Bonus tote bag sudah diklaim hari ini, besok bisa lagi.`); }
    tulis(); pasangAvatar(); return;
  }
  if (a === 'buy_buff') {
    if (S.activeBuff) { info('Buff kopi & bakmi sudah aktif untuk lari berikutnya.'); return; }
    if (S.coins < 200) { sfx.gagal(); info('Koin W kurang. Finish lari dulu untuk tambah koin.'); return; }
    S.coins -= 200; S.activeBuff = { pace: 18, stamina: 25 }; tulis(); sfx.beli(); info('Kopi Skena + Bakmi Carbo-Load: +18% pace & hemat stamina 25% di lari berikutnya.'); return;
  }
  if (a === 'open_receipt') {
    if (!S.hasilTerakhir) { info('Belum ada struk. Selesaikan satu lari dulu.'); return; }
    tutup('mBooth'); tampilkanHasil(S.hasilTerakhir); return;
  }
  if (a === 'do_recovery') { S.bonusHeart = 1; S.warmup = 1; tulis(); sfx.power(); info('Recovery penuh: +1 cadangan nyawa dan Warm-Up Boost siap.'); return; }
  if (a === 'toggle_pacer') {
    S.pacerFlag = S.pacerFlag === '' ? '4:30' : S.pacerFlag === '4:30' ? '5:00' : ''; tulis(); pasangAvatar(); sfx.geser();
    info(S.pacerFlag ? `Bendera pacer ${S.pacerFlag} terpasang di punggung.` : 'Bendera pacer dilepas.');
  }
}

// --- ranking ---
function gambarRank() {
  const m = peta(); const pb = S.terbaik[m.id];
  const baris = LEADERBOARD_DATA.map((x) => ({ ...x, detik: x.pace.split(':').reduce((a, v) => a * 60 + +v, 0) }));
  if (pb) baris.push({ name: S.username, crew: 'KAMU', tier: tierDari(hitungStat().paceBonus), pace: fmt(pb), detik: pb, saya: true, map: m.id });
  baris.sort((a, b) => a.detik - b.detik);
  const namaPeta = (id) => (MAPS.find((x) => x.id === id) || {}).shortName || '';
  $('listRank').innerHTML = baris.map((x, i) => `<div class="rk ${x.saya ? 'saya' : ''}"><span class="no">${i + 1}</span>
    <span><b>${esc(x.name)}</b><small>${esc(x.crew)} · ${esc(x.tier)} · ${esc(namaPeta(x.map))}</small></span><span class="pace">${x.pace}<small>/km</small></span></div>`).join('')
    + (pb ? '' : `<div class="kecil" style="margin-top:6px">Kamu belum punya catatan di ${esc(m.shortName)}. Finish sekali untuk masuk papan.</div>`);
}

// --- chat ---
const LABEL_CH = { publik: 'PUBLIK', pacer: 'PACER', crew: 'CREW' };
function gambarChat() {
  $('listChat').innerHTML = SESI_CHAT.map((c) => `<div><i>${LABEL_CH[c.ch] || 'PUBLIK'}</i><b>${esc(c.user)}</b> ${esc(c.text)}</div>`).join('');
  const isi = $('listChat').parentElement; isi.scrollTop = isi.scrollHeight;
}
$('formChat').addEventListener('submit', (e) => {
  e.preventDefault(); const t = $('isiChat').value.trim().slice(0, 80); if (!t) return;
  SESI_CHAT.push({ user: S.username, ch: 'publik', text: t }); $('isiChat').value = ''; gambarChat();
  setTimeout(() => { SESI_CHAT.push({ user: NAMA_NPC[Math.floor(Math.random() * NAMA_NPC.length)], ch: 'publik', text: CHAT_BANK[Math.floor(Math.random() * CHAT_BANK.length)] }); if (!$('mChat').hidden) gambarChat(); }, 1500);
});

// ---------------- alur ----------------
const tampil = (id, on) => { $(id).hidden = !on; };
function aturMain(on) {
  for (const id of ['hud', 'miniChat']) tampil(id, on);
  tampil('lobi', !on && mode === 'lobi');
  document.body.classList.toggle('main', on);
}
function bersihkanEfek() {
  for (const id of ['qte', 'tembokTeks', 'draft', 'petunjukSwipe']) tampil(id, false);
  $('tembok').style.opacity = 0; toastT = 0; $('toast').style.opacity = 0; $('miniChat').innerHTML = '';
  for (const o of angin) { o.visible = false; o.material.opacity = 0; } cincin.material.opacity = 0;
}
function keLobi() {
  tGps.forEach(clearTimeout); tGps = [];
  mode = 'lobi'; tutupSemua(); bersihkanEfek(); aturMain(false); tampil('lobi', true);
  kosongkanTrek(); P.d = 0; letakLobi(); perbaruiLobi();
}
let tGps = [];
function mulai() {
  if (mode === 'main' || mode === 'gps') return;
  audio(); tutupSemua(); bersihkanEfek(); tampil('lobi', false); drill.aktif = false; $('bDrill').classList.remove('aktif');
  const m = peta(); const st = hitungStat();
  bangunLintasan(Math.floor(Math.random() * 1e9));
  Object.assign(P, { d: 0, x: 0, lajur: 1, y: 0, vy: 0, kecepatan: 0, stamina: 100, nyawa: 3 + (S.bonusHeart ? 1 : 0), koin: 0, kebal: 0, burst: 0, sprintKey: false,
    magnet: 0, perisai: 0, gel: 0, waktu: 0, selesai: false, ws: 'belum', lambat: 0, drafting: false, pacerDraft: false, tabrakan: 0, st, kebalTrailInfo: false, rank: TOTAL_PELARI,
    warm: S.warmup > 0, buff: S.activeBuff, vDasar: kecepatanDasar(st, S.warmup > 0, m), map: m, jarakAngin: 0 });
  // bekal sekali pakai habis saat lari dimulai
  S.warmup = 0; S.bonusHeart = 0; S.activeBuff = null; tulis();
  tekan.clear();
  avatar.position.set(0, dunia.tinggi(0), 0); avatar.rotation.set(0, 0, 0); avatar.visible = true;
  $('hudPeta').innerHTML = `${esc(m.shortName.toUpperCase())}<small>+${m.gain.toLocaleString('id-ID')}m D+ · ${m.category === 'trail' ? 'TRAIL' : 'ROAD'}</small>`;
  gambarNyawa(); hudT = 0;
  // ritual GPS: lama kunci mengikuti jam yang dipakai
  mode = 'gps'; tampil('gps', true); $('gps').classList.remove('kunci'); $('jam').classList.remove('kunci');
  $('gpsTeks').textContent = 'MENCARI GPS...'; $('gpsSub').textContent = `${pendek(st.w.name)} · kunci ${st.gpsTime ? st.gpsTime + ' detik' : 'instan'}`;
  tGps.forEach(clearTimeout); tGps = [];
  const lama = Math.max(0.35, st.gpsTime) * 1000;
  for (let t = 0; t < lama - 200; t += 600) tGps.push(setTimeout(() => { if (mode === 'gps') sfx.bip(); }, t));
  tGps.push(setTimeout(() => {
    if (mode !== 'gps') return;
    $('gps').classList.add('kunci'); $('jam').classList.add('kunci'); $('gpsTeks').textContent = 'GPS LOCKED'; sfx.bip(0); sfx.bip(0.12);
    tGps.push(setTimeout(() => {
      if (mode !== 'gps') return;
      sfx.peluit(); tampil('gps', false); mode = 'main'; aturMain(true); toast('GO!', W.krem, 0.8);
      tampil('petunjukSwipe', true); $('petunjukSwipe').style.opacity = 1;
      tGps.push(setTimeout(() => { $('petunjukSwipe').style.opacity = 0; }, 4200));
      tGps.push(setTimeout(() => { tampil('petunjukSwipe', false); }, 4900));
      let tunda = 900;
      const umum = (t, w) => { tGps.push(setTimeout(() => { if (mode === 'main') toast(t, w, 1.4); }, tunda)); tunda += 1500; };
      if (P.warm) umum('WARM-UP BOOST +12% PACE', W.sage);
      if (P.buff) umum('KOPI + BAKMI: +18% PACE', W.tembaga);
      if (m.category === 'trail' && !st.trailProof) umum('Trail! Lompati batu & akar', W.terakota);
      if (m.category === 'trail' && st.trailProof) umum('TRAIL GRIP: kebal batu & akar', W.sage);
    }, 900));
  }, lama));
}
$('bMulai').onclick = mulai;
$('bUlang').onclick = () => { tampil('hasil', false); mode = 'lobi'; mulai(); };
$('bLobi').onclick = keLobi;
$('bJeda').onclick = () => jeda(true);
$('bLanjut').onclick = () => jeda(false);
$('bKeluar').onclick = keLobi;
function jeda(on) {
  if (on && mode === 'main') { mode = 'jeda'; tekan.clear(); P.sprintKey = false; tampil('mJeda', true); }
  else if (!on && mode === 'jeda') { mode = 'main'; tampil('mJeda', false); jam.getDelta(); }
}

// ---------------- simulasi ----------------
function tabrak(e) {
  if (P.kebal > 0) return;
  if ((e.jenis === 'batu' || e.jenis === 'akar') && P.st.trailProof) {
    if (!P.kebalTrailInfo) { P.kebalTrailInfo = true; toast('TRAIL GRIP: lewat aman', W.sage); }
    return;
  }
  if (P.perisai > 0) { e.aktif = false; e.obj.visible = false; P.perisai = 0; toast('PERISAI MENAHAN!', W.krem); sfx.power(); return; }
  P.nyawa--; P.tabrakan++; P.kebal = 1.3; P.lambat = 0.8; goyang = 0.35; sfx.tabrak();
  const k = $('kilat'); k.style.opacity = 0.45; setTimeout(() => { k.style.opacity = 0; }, 120);
  gambarNyawa();
  toast({ lubang: 'KESANDUNG LUBANG!', pembatas: 'NABRAK PEMBATAS!', kerucut: 'NABRAK KERUCUT!', batu: 'KESANDUNG BATU!', akar: 'TERSANGKUT AKAR!' }[e.jenis] || 'AWAS!', W.terakota);
  if (P.nyawa <= 0) selesai(false);
}
function ambil(e) {
  e.aktif = false; e.obj.visible = false;
  switch (e.jenis) {
    case 'koin': P.koin += Math.round(5 * (1 + P.st.coinBonus / 100)); sfx.koin(); break;
    case 'petir': P.stamina = Math.min(100, P.stamina + 30); sfx.power(); toast('+30% STAMINA', W.sage); break;
    case 'magnet': P.magnet = 8; sfx.power(); toast('MAGNET 8 DETIK', W.krem); break;
    case 'perisai': P.perisai = 8; sfx.power(); toast('PERISAI 8 DETIK', W.krem); break;
    case 'hati': P.nyawa++; gambarNyawa(); sfx.power(); toast('+1 NYAWA', W.terakota); break;
    case 'gel': P.gel = 6; sfx.power(); toast('ENERGY GEL +14% · 6 DETIK', W.tembaga); break;
    default: break;
  }
}
const nDekat = (n) => Math.abs(n.d - P.d) < 90;
function langkah(dt) {
  const p = P; const m = p.map;
  p.waktu += dt;
  // drafting & blokir
  p.drafting = false; p.pacerDraft = false; let blokir = null;
  for (const n of peloton) {
    if (Math.abs(n.x - p.x) > 0.9) continue;
    const gap = n.d - p.d;
    if (gap > 0.6 && gap < 6.5) { p.drafting = true; if (n.pacer) p.pacerDraft = true; }
    if (gap > -0.3 && gap < 0.9 && p.y < 0.5 && n.y < 0.5) blokir = n;
  }
  const sprint = (p.burst > 0 || p.sprintKey || sprintTahan()) && p.stamina > 0 && !p.selesai;
  p.burst = Math.max(0, p.burst - dt);
  const hemat = 1 - p.st.staminaSave / 100;
  const kuras = KURAS_DASAR * m.staminaDrainMult * hemat * (sprint ? KALI_KURAS_SPRINT : 1) * (p.pacerDraft ? 0.8 : p.drafting ? 0.85 : 1);
  if (!p.selesai) p.stamina = Math.max(0, p.stamina - kuras * dt);
  const wall = p.stamina < BATAS_WALL && !p.selesai;
  let target = p.vDasar * (p.gel > 0 ? 1.14 : 1);
  if (sprint) target *= KALI_SPRINT;
  if (wall) target *= KALI_WALL;
  if (p.lambat > 0) { target *= 0.5; p.lambat -= dt; }
  if (p.selesai) target = 0;
  if (blokir && !p.selesai) { target = Math.min(target, blokir.v); if (!p.blokirToast) { toast(blokir.pacer ? 'Di belakang pacer: hemat stamina 20%' : 'Salip! Pindah lajur', W.krem, 0.9); p.blokirToast = 2.5; } }
  if (p.blokirToast) p.blokirToast = Math.max(0, p.blokirToast - dt);
  p.kecepatan += (target - p.kecepatan) * Math.min(1, dt * (p.selesai ? 1.5 : 2.5));
  p.d += p.kecepatan * dt;
  p.x += (LAJUR[p.lajur] - p.x) * Math.min(1, dt * 12);
  if (p.y > 0 || p.vy > 0) { p.vy -= 20 * dt; p.y = Math.max(0, p.y + p.vy * dt); if (p.y === 0) { p.vy = 0; letupCincin(); } }
  p.kebal = Math.max(0, p.kebal - dt); p.magnet = Math.max(0, p.magnet - dt); p.perisai = Math.max(0, p.perisai - dt); p.gel = Math.max(0, p.gel - dt);
  // tumbukan
  for (const e of entitas) {
    if (!e.aktif) continue;
    const dz = e.d - p.d; if (dz < -2 || dz > 40) continue;
    if (e.jenis === 'koin' && p.magnet > 0 && dz < 16) {
      e.obj.position.x += (p.x - e.obj.position.x) * Math.min(1, dt * 8);
      e.obj.position.z += (-p.d - e.obj.position.z) * Math.min(1, dt * 8);
      e.obj.position.y += (dunia.tinggi(p.d) + p.y + 0.8 - e.obj.position.y) * Math.min(1, dt * 8);
      if (Math.abs(e.obj.position.z + p.d) < 1.2 && Math.abs(e.obj.position.x - p.x) < 1.2) ambil(e);
      continue;
    }
    if (Math.abs(dz) > 0.7 || Math.abs(LAJUR[e.lajur] - p.x) > 1.0) continue;
    if (e.rintangan) { if (p.y < RINTANGAN[e.jenis]) tabrak(e); }
    else if (Math.abs(p.y + 0.9 - (e.yDasar + 0.3)) < 1.25) ambil(e);
    if (mode !== 'main') return;
  }
  // water station QTE
  if (p.ws === 'belum' && p.d >= WS_MULAI) { p.ws = 'aktif'; tampil('qte', true); nada(900, 900, 0.1, 'sine', 0.08); nada(1200, 1200, 0.1, 'sine', 0.08, 0.12); }
  if (p.ws === 'aktif') {
    $('bAmbil').classList.toggle('siap', p.d >= WS_JENDELA[0] && p.d <= WS_JENDELA[1]);
    if (p.d > WS_JENDELA[1]) { p.ws = 'lewat'; tampil('qte', false); toast('Water station kelewat', W.terakota); }
  }
  // NPC
  for (const n of peloton) {
    let v = n.v;
    // NPC menyesuaikan diri di belakang NPC lain (pindah lajur kalau terhalang)
    for (const o of peloton) { if (o !== n && o.lajur === n.lajur && o.d - n.d > 0 && o.d - n.d < 1.4 && o.v < n.v) { const l = [0, 1, 2].find((q) => q !== n.lajur && !peloton.some((z) => z !== n && z.lajur === q && Math.abs(z.d - n.d) < 2)); if (l != null) n.lajur = l; else v = o.v; break; } }
    n.d += v * dt; n.x += (LAJUR[n.lajur] - n.x) * Math.min(1, dt * 6);
    if (n.y <= 0) for (const e of entitas) { if (e.rintangan && e.lajur === n.lajur && e.d - n.d > 0.4 && e.d - n.d < 1.7) { n.vy = 6.6; break; } }
    if (n.y > 0 || n.vy > 0) { n.vy -= 20 * dt; n.y = Math.max(0, n.y + n.vy * dt); if (n.y === 0) n.vy = 0; }
    const dekat = nDekat(n) && n.d - p.d > -3.5; n.obj.visible = dekat && n.d < JARAK_FINISH + 40;
    if (n.obj.visible) {
      n.obj.position.set(n.x, dunia.tinggi(n.d) + n.y, -n.d); n.obj.userData.animasi(dt, n.d > JARAK_FINISH + 25 ? 0 : v, { udara: n.y > 0.05 });
      n.label.visible = n.d - p.d > 2.5 && n.d - p.d < (n.pacer ? 70 : 30);
    }
    if (n.d > JARAK_FINISH + 25) n.v *= 0.97;
  }
  // chat simulasi
  chatT -= dt; if (chatT <= 0) { chatT = 7 + Math.random() * 6; const n = peloton[Math.floor(Math.random() * peloton.length)]; if (n) chatMasuk(n.pacer ? 'Pacer' : n.nama, CHAT_BANK[Math.floor(Math.random() * CHAT_BANK.length)]); }
  // HUD keadaan
  $('tembok').style.opacity = wall ? 1 : 0; $('tembokTeks').hidden = !wall || p.selesai;
  $('draft').hidden = !p.drafting || wall || p.selesai;
  $('draft').textContent = p.pacerDraft ? 'PACER DRAFTING · hemat 20%' : 'DRAFTING · hemat 15%';
  if (!p.selesai && p.d >= JARAK_FINISH) { p.selesai = true; tekan.clear(); p.sprintKey = false; sfx.peluit(); toast('FINISH!', W.krem, 1.6); tGps.push(setTimeout(() => selesai(true), 1500)); }
  // pemain
  avatar.position.set(p.x, dunia.tinggi(p.d) + p.y, -p.d);
  avatar.userData.bay.position.y = 0.02 - p.y;
  avatar.rotation.z = (p.x - LAJUR[p.lajur]) * 0.12;
  avatar.visible = !(p.kebal > 0 && Math.floor(p.kebal * 12) % 2 === 0);
  avatar.userData.animasi(dt, p.kecepatan, { udara: p.y > 0.05, wall, sprint });
  // angin
  const kuat = Math.max(0, Math.min(1, (p.kecepatan - 9) / 8)) * (p.selesai ? 0 : 1);
  for (const o of angin) {
    o.visible = kuat > 0.02 && (!o.userData.sage || p.drafting);
    if (!o.visible) continue;
    o.position.z += p.kecepatan * dt * 1.7;
    if (o.position.z > -p.d + 4 || o.position.z < -p.d - 40) aturUlangAngin(o, false);
    o.material.opacity = kuat * (o.userData.sage ? 0.5 : 0.3) * (sprint ? 1.4 : 1);
  }
}

const jam = new THREE.Clock();
let waktuDunia = 0, geserLobi = 0;
const vKam = new THREE.Vector3();
function kameraIkut(dt) {
  const ty = dunia.tinggi(P.d);
  vKam.set(P.x * 0.6, ty + 2.35 + P.y * 0.35, -P.d + 4.4);
  kamera.position.lerp(vKam, Math.min(1, dt * 6));
  if (goyang > 0) { goyang -= dt; kamera.position.x += (Math.random() - 0.5) * 0.25; kamera.position.y += (Math.random() - 0.5) * 0.2; }
  kamera.lookAt(P.x * 0.3, dunia.tinggi(P.d + 10) + 1.15, -P.d - 10);
  const fovT = (kamera.aspect < 1 ? 80 : 62) + (mode === 'main' && (P.burst > 0 || P.sprintKey || sprintTahan()) ? 7 : 0);
  if (Math.abs(kamera.fov - fovT) > 0.05) { kamera.fov += (fovT - kamera.fov) * Math.min(1, dt * 4); kamera.updateProjectionMatrix(); }
}
function putar() {
  requestAnimationFrame(putar);
  const dt = Math.min(0.05, jam.getDelta()); waktuDunia += dt;
  if (mode === 'main') langkah(dt);
  if (mode === 'lobi') {
    drill.gerak = Math.max(0, drill.gerak - dt);
    const pose = drill.aktif && drill.gerak > 0 ? DRILL[drill.idx].pose : null;
    avatar.userData.animasi(dt, 0, { drill: pose });
    if (!pose) avatar.rotation.y = Math.sin(waktuDunia * 0.5) * 0.5; else avatar.rotation.y *= 0.9;
    const a = waktuDunia * 0.2; const y0 = dunia.tinggi(-8);
    const lebar = kamera.aspect > 1.2;
    const laci = !$('mRambut').hidden || !$('mGear').hidden;
    geserLobi += ((laci && lebar ? 2.1 : 0) - geserLobi) * Math.min(1, dt * 6);
    kamera.position.set(geserLobi * 0.75 + Math.sin(a) * 0.2, y0 + 1.35, 8 - (lebar ? 2.45 + geserLobi * 0.35 : 3.6));
    kamera.lookAt(geserLobi * 0.75, y0 + 1.12, 8);
  } else if (mode === 'gps') { avatar.userData.animasi(dt, 0, {}); kameraIkut(dt); }
  else if (mode === 'main') kameraIkut(dt);
  for (const e of entitas) {
    if (!e.aktif || e.rintangan) continue; const dz = e.d - P.d; if (dz > 120 || dz < -5) continue;
    const base = UK_PICKUP[e.jenis]; const r = RASIO[NAMA_SPRITE[e.jenis]] || 1;
    if (e.jenis === 'koin') e.obj.scale.x = base * r * Math.abs(Math.cos(waktuDunia * 4 + e.d)) + 0.04;
    if (P.magnet <= 0 || e.jenis !== 'koin') e.obj.position.y = dunia.tinggi(e.d) + e.yDasar + Math.sin(waktuDunia * 3 + e.d) * 0.08;
  }
  if (cincinT > 0) { cincinT -= dt; const k = 1 - cincinT / 0.45; cincin.scale.setScalar(1 + k * 2.2); cincin.material.opacity = (1 - k) * 0.6; }
  dunia.ikut(mode === 'lobi' ? 0 : P.d, waktuDunia);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0; }
  if (mode === 'main') perbaruiHUD(dt);
  renderer.render(scene, kamera);
}

// ---------------- selesai & Race Receipt ----------------
let strukURL = '', captionTeks = '';
function selesai(finish) {
  if (mode !== 'main') return;
  mode = 'hasil'; tekan.clear(); bersihkanEfek(); aturMain(false);
  const m = P.map; const st = P.st;
  const bonus = finish ? 200 : 0; const dapat = P.koin + bonus;
  S.coins += dapat;
  const tL = P.waktu * SKALA_WAKTU; const jarakKm = Math.min(P.d, JARAK_FINISH) / 1000;
  const pace = jarakKm > 0.02 ? tL / jarakKm : 0;
  const pbLama = S.terbaik[m.id]; const pbBaru = finish && (!pbLama || tL < pbLama);
  if (pbBaru) S.terbaik[m.id] = tL;
  const tgl = new Date();
  const data = {
    finish, pbBaru, nama: S.username, bib: S.bib, peta: m.name, petaPendek: m.shortName, kategori: m.category, jarakKm, waktu: fmt(tL), pace: pace ? fmt(pace) : '--:--',
    kalori: Math.round(65 * jarakKm * (S.gender === 'female' ? 0.9 : 1) * (m.category === 'trail' ? 1.4 : 1)), elev: Math.round(dunia.elevasiNaik(Math.min(P.d, JARAK_FINISH))),
    koin: dapat, bonus, tabrakan: P.tabrakan, ws: P.ws === 'dapat', rank: finish ? P.rank : null,
    gear: { jersey: pendek(st.j.name), bottom: pendek(st.b.name), shoe: pendek(st.s.name), watch: pendek(st.w.name) },
    buff: [P.warm ? 'WARM-UP' : '', P.buff ? 'KOPI+BAKMI' : ''].filter(Boolean).join(' + '),
    tanggal: tgl.toISOString(),
  };
  S.hasilTerakhir = data; tulis();
  tampilkanHasil(data);
}
function tampilkanHasil(data) {
  const c = buatStruk(data);
  try { strukURL = c.toDataURL('image/png'); } catch (e) { strukURL = ''; }
  $('struk').src = strukURL;
  $('hasilJudul').textContent = data.finish ? (data.pbBaru ? 'PB BARU!' : 'FINISH!') : 'DNF';
  $('hasilInfo').textContent = data.finish
    ? `${data.waktu} untuk 1 KM di ${data.petaPendek}, pace ${data.pace}/km. +${data.koin} Koin W (termasuk bonus finish ${data.bonus}).`
    : `Nyawa habis di KM ${data.jarakKm.toFixed(2)}. +${data.koin} Koin W tetap masuk dompet. Coba lagi!`;
  const url = URL_KAMPANYE.replace('https://', '');
  captionTeks = data.finish
    ? `Baru finish 1 KM di Pelari Kalcer 3D, rute ${data.petaPendek}! ⏱ ${data.waktu} · pace ${data.pace}/km · +${data.elev} m\nLari bareng skena di ${url}\n#PelariKalcer #WilloApparel`
    : `DNF di KM ${data.jarakKm.toFixed(2)} rute ${data.petaPendek} 😮‍💨 Besok balas dendam! Main Pelari Kalcer 3D di ${url}\n#PelariKalcer #WilloApparel`;
  $('hasilCatatan').textContent = 'Tahan gambar struk untuk menyimpan di HP.';
  mode = 'hasil'; tampil('lobi', false); tampil('hasil', true);
}
function buatStruk(d) {
  const Wd = 540, H = 1084; const c = document.createElement('canvas'); c.width = Wd; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#F7F4EE'; g.beginPath(); g.moveTo(0, 12);
  for (let x = 0; x <= Wd; x += 18) g.lineTo(x, x % 36 ? 0 : 12);
  g.lineTo(Wd, H - 12); for (let x = Wd; x >= 0; x -= 18) g.lineTo(x, x % 36 ? H : H - 12); g.closePath(); g.fill();
  const mono = (s, w = 500) => `${w} ${s}px "JetBrains Mono", Menlo, monospace`;
  g.fillStyle = W.onyx; let y = 60;
  const tengah = (t, f, yy) => { g.font = f; g.textAlign = 'center'; g.fillText(t, Wd / 2, yy); };
  const garis = () => { g.font = mono(16); g.textAlign = 'center'; g.fillText('- - - - - - - - - - - - - - - - - - - - -', Wd / 2, y); y += 26; };
  const baris = (k, v, tebal) => { g.font = mono(18, tebal ? 700 : 500); g.textAlign = 'left'; g.fillText(k, 40, y); g.textAlign = 'right'; g.fillText(String(v).slice(0, 26), Wd - 40, y); y += 29; };
  tengah('WILLO — APPAREL', 'italic 800 46px "Barlow Condensed", Arial Narrow, sans-serif', y); y += 28;
  tengah(d.finish ? 'PELARI KALCER 3D · RACE RECEIPT' : 'PELARI KALCER 3D · DNF', mono(16, 700), y); y += 24;
  const tgl = new Date(d.tanggal || Date.now()); const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][tgl.getDay()];
  tengah(`${hari}, ${tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · ${tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`, mono(14), y); y += 22;
  tengah(d.petaPendek.toUpperCase() + (d.kategori === 'trail' ? ' · MOUNTAIN TRAIL' : ' · ROAD'), mono(14), y); y += 30;
  garis();
  baris('PELARI', d.nama.toUpperCase().slice(0, 18), true);
  baris('BIB', d.bib);
  baris('JERSEY', d.gear.jersey.toUpperCase());
  baris('BAWAHAN', d.gear.bottom.toUpperCase());
  baris('SEPATU', d.gear.shoe.toUpperCase());
  baris('JAM GPS', d.gear.watch.toUpperCase());
  if (d.buff) baris('BUFF', d.buff);
  garis();
  baris('JARAK', d.jarakKm.toFixed(2) + ' KM', true);
  baris('WAKTU TEMPUH', d.waktu, true);
  baris('AVG PACE', d.pace + ' /km', true);
  baris('ELEVATION GAIN', '+' + d.elev + ' m');
  baris('KALORI', d.kalori + ' kcal');
  baris('WATER STATION', d.ws ? 'ISOTONIK OK' : 'TERLEWAT');
  if (d.rank) baris('PERINGKAT', `#${d.rank.toLocaleString('id-ID')} / ${TOTAL_PELARI.toLocaleString('id-ID')}`);
  baris('KOIN W', '+' + d.koin);
  garis();
  const warna = d.finish ? '#5F6F5E' : W.terakota;
  g.save(); g.translate(Wd / 2, y + 30); g.rotate(-0.05); g.strokeStyle = warna; g.lineWidth = 4; g.strokeRect(-160, -34, 320, 62);
  g.fillStyle = warna; g.font = 'italic 800 42px "Barlow Condensed", Arial Narrow, sans-serif'; g.textAlign = 'center'; g.fillText(d.finish ? (d.pbBaru ? 'FINISHER 1K · PB' : 'FINISHER 1K') : 'DID NOT FINISH', 0, 13);
  g.restore(); y += 92;
  const qr = qrcode(0, 'M'); qr.addData(URL_KAMPANYE); qr.make();
  const n = qr.getModuleCount(); const uk = 140; const sel = uk / n; const qx = 40, qy = y;
  g.fillStyle = '#fff'; g.fillRect(qx - 6, qy - 6, uk + 12, uk + 12); g.fillStyle = W.onyx;
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect(qx + k * sel, qy + r * sel, Math.ceil(sel), Math.ceil(sel));
  g.textAlign = 'left'; g.font = mono(15, 700); g.fillText('GABUNG KOMUNITAS', 204, qy + 26);
  g.font = mono(14); g.fillText('Daftar & lari bareng di', 204, qy + 52);
  g.font = mono(15, 700); g.fillText('willoapparel.com', 204, qy + 78); g.fillText('/pelarikalcer', 204, qy + 99);
  g.font = mono(13); g.fillStyle = '#6b6862'; g.fillText('Kolaborasi resmi Willo Apparel', 204, qy + 128);
  y = qy + uk + 30;
  g.fillStyle = W.onyx; const rb = mulberry(d.waktu.length * 31 + (d.koin || 0));
  for (let x = 60; x < Wd - 60;) { const lb = 1 + Math.floor(rb() * 4); g.fillRect(x, y, lb, 44); x += lb + 1 + Math.floor(rb() * 4); }
  y += 72;
  tengah('TERIMA KASIH SUDAH LARI!', mono(16, 700), y); y += 22;
  tengah('#PelariKalcer  #WilloApparel', mono(14), y);
  return c;
}
$('bUnduh').onclick = () => {
  if (!strukURL) return;
  try { const a = document.createElement('a'); a.href = strukURL; a.download = `race-receipt-pelari-kalcer-${Date.now()}.png`; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { /* */ }
  $('hasilCatatan').textContent = 'Kalau unduhan tidak mulai, tahan gambar struk lalu pilih Simpan Gambar.';
};
$('bCaption').onclick = () => {
  const done = () => { $('hasilCatatan').textContent = 'Caption tersalin. Tempel di Instagram Story, Reels, atau TikTok.'; };
  const gagal = () => { $('hasilCatatan').textContent = captionTeks; };
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(captionTeks).then(done).catch(gagal); else gagal(); } catch (e) { gagal(); }
};

// ---------------- mulai ----------------
gantiDunia();
pasangAvatar();
perbaruiLobi();
putar();
window.__pk = { P, S, get mode() { return mode; }, peloton: () => peloton, entitas: () => entitas, mulai, keLobi, kamera, get avatar() { return avatar; }, raycaster };

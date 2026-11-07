// Legenda Pulau Angka: PROTOTIPE adventure RPG Matematika SD (fase A/B/C).
// Pemain bebas menjelajah (joystick / WASD / ketuk tanah), bicara dengan warga,
// menjalankan misi bercerita, dan mengalahkan monster dengan MENJAWAB SOAL.
// Jawaban benar = serangan, jawab cepat = kritis, 3 benar beruntun = Jurus.
// Naik level, kumpulkan Rupiah, belanja di warung dengan uang pas, kalahkan Raja Galat.
// Soal tetap dari Mode Guru (kolom sama dengan Petualang Hitung).
import {rumahMesh, warungMesh} from '../../public/duniakotak/mabar/js/aset/rumah.js';

GURU.kolom = [
  {k: 'fase', label: 'Fase (A/B/C)', contoh: 'A'},
  {k: 'jenis', label: 'Jenis (jembatan/gerbang/kasir/pecahan/luas/keliling)', contoh: 'gerbang'},
  {k: 'soal', label: 'Soal', contoh: '7 + 5'},
  {k: 'jawaban', label: 'Jawaban (boleh kosong bila soal hitungan)', contoh: ''},
];
GURU.pengaturan = [];
GURU.terapkan = () => { siapkanSoal(); };
pasangGuru();
Object.assign(FONT, {'!': '..#..|..#..|..#..|..#..|..#..|.....|..#..'});
const MUSIK_JELAJAH = {bpm: 116, nada: 60, alat: 'marimba', progresi: [0, 5, 3, 4], benih: 77};
const MUSIK_TARUNG = {bpm: 148, nada: 57, skala: [0, 2, 3, 5, 7, 8, 10], alat: 'xilofon', progresi: [0, 5, 6, 4], benih: 13};
aturMusik(MUSIK_JELAJAH);

siapPanggung({langit: '#bfe9ff', sudut: 44, yaw: YAW_ISO, fov: 30});
P.drone = null; // kamera diatur sendiri: mengikuti pahlawan
P.sc.background = gradasi('#9fd8ff');
P.sc.fog = new THREE.Fog('#d3efff', 38, 85);
{ const sh = P.mt.shadow.camera; sh.left = sh.bottom = -16; sh.right = sh.top = 16; sh.far = 70; sh.updateProjectionMatrix(); P.sc.add(P.mt.target); }

// ===================================================================
// DUNIA: Desa Joglo (selatan) -> Padang -> Sungai -> Hutan Candi -> Benteng Raja Galat (utara)
// ===================================================================
const BATAS = {x0: -17, x1: 17, z0: -44, z1: 27};
const tabrak = []; // penghalang lingkaran {x,z,r}
const halang = (x, z, r) => tabrak.push({x, z, r});
const SUNGAI = {z0: -8.6, z1: -5.4};
const DUNIA = {jembatan: 0, gerbang: false};

P.sc.add(tanahVoxel(50, 80, ['#8fd16a', '#86c962', '#93d46f']));
// lantai hutan lebih gelap & lantai benteng ungu
{ const h = lempeng(40, 21, '#5f9e45', .01, .1); h.position.z = -19.5; h.receiveShadow = true; P.sc.add(h); }
{ const b = lempeng(26, 13, '#8e83a8', .02, .1); b.position.z = -37.5; b.receiveShadow = true; P.sc.add(b);
  for (let i = 0; i < 60; i++) { const t = kotak(acak(.8, 1.6), .05, acak(.8, 1.6), variasi('#9d93b6', .05), .05); t.position.set(acak(-12, 12), .07, acak(-43, -32)); t.castShadow = false; P.sc.add(t); } }
// jalan setapak utama
function jalur(x0, z0, x1, z1, w = '#e9d3a5') { const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / .9); for (let i = 0; i <= n; i++) { const t = i / n; const b = kotak(.8, .06, .8, variasi(w, .04), .08, {roughness: .95}); b.position.set(x0 + (x1 - x0) * t + acak(-.1, .1), .04, z0 + (z1 - z0) * t + acak(-.1, .1)); b.rotation.y = acak(-.3, .3); b.castShadow = false; P.sc.add(b); } }
jalur(0, 24, 0, -4); jalur(0, -10, 0, -29, '#c9b48a'); jalur(-8, 16, 8, 16); jalur(0, 12, 7, 9);
// sungai
const sungai = lempeng(80, SUNGAI.z1 - SUNGAI.z0, '#4dabf7', .035, .05); sungai.position.z = (SUNGAI.z0 + SUNGAI.z1) / 2; sungai.material.roughness = .2; P.sc.add(sungai);
[SUNGAI.z0, SUNGAI.z1].forEach(z => { const t = lempeng(80, .4, '#c9a46b', .05, .05); t.position.z = z; P.sc.add(t); });
const riak = []; for (let i = 0; i < 30; i++) { const r = kotak(acak(.3, .8), .03, .08, '#d0ebff', .015); r.position.set(acak(-24, 24), .09, acak(SUNGAI.z0 + .4, SUNGAI.z1 - .4)); r.castShadow = false; P.sc.add(r); riak.push(r); }
// jembatan (dibangun bertahap lewat misi Pak Tukang)
const papanJembatan = [];
{ const n = 9; for (let i = 0; i < n; i++) { const z = SUNGAI.z1 + .4 - i * ((SUNGAI.z1 - SUNGAI.z0 + .8) / (n - 1)); const g = new THREE.Group(); tambah(g, 2.4, .14, .36, 0, .22, 0, variasi('#b07a48', .05), .03); if (i % 2 === 0) [-1, 1].forEach(s => tambah(g, .14, .55, .14, s * 1.15, .45, 0, '#8a5a32', .03)); g.position.set(0, 0, z); g.visible = false; P.sc.add(g); papanJembatan.push(g); } }
// tiang patah sisa jembatan lama
[-1, 1].forEach(s => [SUNGAI.z1 + .3, SUNGAI.z0 - .3].forEach(z => { const t = kotak(.2, .5, .2, '#6b4423', .03); t.position.set(s * 1.3, .25, z); t.rotation.z = s * .2; P.sc.add(t); }));

// --- DESA ---
// Balai desa joglo (atap bersusun khas Jawa)
function joglo(w = 5, warna = '#7a4a2e') {
  const g = new THREE.Group(); tambah(g, w + .6, .3, w + .6, 0, .15, 0, '#d6c3a0', .05);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => tambah(g, .22, 2.2, .22, a * (w / 2 - .2), 1.4, b * (w / 2 - .2), '#8a5a32', .04));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => tambah(g, .22, 2.6, .22, a * .7, 1.6, b * .7, '#6b4423', .04));
  [[w + 1.4, .35, 2.5], [w * .72, .45, 2.85], [w * .46, .7, 3.4], [w * .22, .5, 3.95]].forEach(([s, h, y], i) => tambah(g, s, h, s, 0, y, 0, variasi(warna, .04), .1));
  return g;
}
const balai = joglo(5); balai.position.set(-7, 0, 13); P.sc.add(balai); bisaPudar(balai, 3); halang(-7, 13, 3.4);
{ const t = teksVoxel('BALAI', '#ffd43b', .06, 1); t.position.set(-7, 4.4, 15); t.rotation.y = YAW_ISO; P.sc.add(t); }
const warung = warungMesh({nama: 'WARUNG BU SARI', warna: '#e8590c'}); warung.scale.setScalar(.62); warung.position.set(7, 0, 13); warung.rotation.y = -Math.PI / 2 + .3; P.sc.add(warung); halang(7.4, 13, 2.3);
const tokoKue = rumahMesh('kecil', {dinding: 'merahMuda', atap: 'ungu', pintu: 'putih'}); tokoKue.scale.setScalar(.55); tokoKue.position.set(8, 0, 21); P.sc.add(tokoKue); halang(8, 21, 2.2); bisaPudar(tokoKue, 2);
[[-9, 22, 'duaLantai', 'kuning', 'merah'], [-13, 17, 'kecil', 'biru', 'abu'], [13, 18, 'kecil', 'hijau', 'cokelat'], [-3, 25, 'kecil', 'putih', 'oranye'], [4, 25.5, 'duaLantai', 'krem', 'hijau']].forEach(([x, z, b, d, a]) => {
  const r = rumahMesh(b, {dinding: d, atap: a}); r.scale.setScalar(.5); r.position.set(x, 0, z); r.rotation.y = x < 0 ? .4 : -.4; P.sc.add(r); halang(x, z, 2.1); bisaPudar(r, 2.4); });
// air mancur penyembuh di alun-alun
const AIR = {x: 0, z: 16};
{ const g = alasBatu(10, '#cfd4da'); g.position.set(AIR.x, 0, AIR.z); P.sc.add(g); const k = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .25, 24), new THREE.MeshStandardMaterial({color: '#74c0fc', roughness: .1, transparent: true, opacity: .85})); k.position.set(AIR.x, .38, AIR.z); P.sc.add(k);
  tambah(P.sc, .35, 1.2, .35, AIR.x, .8, AIR.z, '#adb5bd', .06); halang(AIR.x, AIR.z, 1.6); }
const percik = []; for (let i = 0; i < 10; i++) { const p = kotak(.1, .1, .1, '#a5d8ff', .02); p.castShadow = false; p.userData.f = Math.random(); P.sc.add(p); percik.push(p); }
// gapura candi bentar di pintu hutan
function candiBentar(x, z) { const g = new THREE.Group(); [-1, 1].forEach(s => { [[1.4, 1, 0], [1.2, 1, 1], [1, .9, 2], [.7, .8, 2.85], [.4, .6, 3.55]].forEach(([w, h, y]) => tambah(g, w, h, 1.1, s * 1.6, y * .95 + h / 2, 0, variasi('#b5532e', .05), .05)); }); g.position.set(x, 0, z); return g; }
P.sc.add(candiBentar(0, -10.2)); halang(-1.6, -10.2, .8); halang(1.6, -10.2, .8);
// stupa candi di hutan
function stupa(s = 1) { const g = new THREE.Group(); tambah(g, 2.4 * s, .4 * s, 2.4 * s, 0, .2 * s, 0, '#8d939b', .05); tambah(g, 1.9 * s, .4 * s, 1.9 * s, 0, .6 * s, 0, '#9aa1a9', .05);
  const b = new THREE.Mesh(new THREE.SphereGeometry(.85 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({color: '#a5abb3', roughness: .85})); b.position.y = .8 * s; b.castShadow = true; g.add(b);
  tambah(g, .3 * s, .9 * s, .3 * s, 0, 1.9 * s, 0, '#8d939b', .05); return g; }
[[-8, -17], [8.5, -21], [-6, -26]].forEach(([x, z]) => { const s = stupa(1); s.position.set(x, 0, z); P.sc.add(s); halang(x, z, 1.4); });
// benteng Raja Galat
const pintuBenteng = [];
{ const W = '#5f3dc4', W2 = '#7048e8';
  for (let x = -13; x <= 13; x += 1.3) { if (Math.abs(x) < 1.8) continue; tambah(P.sc, 1.3, 2.4, 1, x, 1.2, -30.5, variasi(W, .04), .06); if (Math.round(x / 1.3) % 2 === 0) tambah(P.sc, .9, .5, 1, x, 2.65, -30.5, W2, .05); }
  [-1, 1].forEach(s => { tambah(P.sc, 2, 4, 2, s * 2.6, 2, -30.5, W, .1); tambah(P.sc, 2.3, .6, 2.3, s * 2.6, 4.2, -30.5, W2, .1); });
  [-1, 1].forEach(s => { const p = kotak(1.6, 2.6, .3, '#3b2a6b', .05); p.position.set(s * .8, 1.3, -30.5); P.sc.add(p); pintuBenteng.push(p); });
  const t = teksVoxel('?', '#ffd43b', .09, 1); t.position.set(0, 3.2, -29.9); P.sc.add(t);
  [-1, 1].forEach(s => { tambah(P.sc, 2.5, 6, 2.5, s * 9, 3, -40, W, .1); tambah(P.sc, 2.8, .7, 2.8, s * 9, 6.3, -40, W2, .1); halang(s * 9, -40, 1.8); });
  tambah(P.sc, 6, .6, 3, 0, .3, -40.5, '#4c3a8a', .06); }
// pohon tepi & hutan
function pohon(x, z, gelap) { const p = pohonVoxel(acak(4.6, 6.8), gelap ? pilih(['#2b8a3e', '#2f9e44', '#237032']) : pilih(['#43a047', '#4caf50', '#66bb6a'])); p.position.set(x, 0, z); P.sc.add(p); halang(x, z, .75); bisaPudar(p, 1.8); }
for (let z = 26; z > -30; z -= 2.6) { pohon(-16 + acak(-.4, .4), z, z < -9); pohon(16 + acak(-.4, .4), z, z < -9); }
[[-12, 8], [12, 7], [-11, 2], [11.5, 0], [-6, 4], [7, 3.5], [-14, -2], [14, -3]].forEach(([x, z]) => pohon(x, z));
for (let i = 0; i < 46; i++) { const x = acak(-14, 14), z = acak(-28.5, -11.5); if (Math.abs(x) < 3.2) continue; if (tabrak.some(t => Math.hypot(t.x - x, t.z - z) < t.r + 1.2)) continue; pohon(x, z, true); }
for (let i = 0; i < 70; i++) { const x = acak(-15, 15), z = acak(-4, 25); if (Math.abs(x) < 1.4) continue; if (tabrak.some(t => Math.hypot(t.x - x, t.z - z) < t.r + .3)) continue; const b = bungaVoxel(pilih(['#ff6fa3', '#ffd43b', '#ffffff', '#b197fc', '#ff922b'])); b.position.set(x, 0, z); P.sc.add(b); }
[[-9, -3], [9.5, 5], [-3, 6.5], [5, -2]].forEach(([x, z]) => { const b = batuVoxel(acak(.9, 1.4)); b.position.set(x, 0, z); P.sc.add(b); halang(x, z, .6); });
const awan = [awanVoxel(1.4), awanVoxel(1.1), awanVoxel(1.6), awanVoxel(1.2)]; awan.forEach((a, i) => { a.position.set(-14 + i * 9, 10 + i % 2, 10 - i * 12); P.sc.add(a); });
// papan petunjuk
function papan(teks, x, z) { const g = new THREE.Group(); tambah(g, .14, 1.4, .14, 0, .7, 0, '#8a5a32', .03); tambah(g, 2.2, .7, .12, 0, 1.4, 0, '#c98a4a', .05); const t = teksVoxel(teks, '#fff', .055, 1); t.position.set(0, 1.25, .08); g.add(t); g.position.set(x, 0, z); g.rotation.y = YAW_ISO; P.sc.add(g); halang(x, z, .4); }
papan('HUTAN', -2.4, -3.2); papan('DESA', 2.2, 9.5);

// ===================================================================
// PAHLAWAN
// ===================================================================
const HERO = [
  {id: 'dimas', nama: 'Dimas', ikon: '👦', w: '#e03131', o: {jenis: 'L', kulit: KULIT[2], rambut: {gaya: 'belah', warna: '#1a1a1a'}, atasan: {jenis: 'seragam', warna: '#ffffff'}, bawahan: {jenis: 'pendek', warna: '#c92a2a'}, sepatu: '#212529'}, ransel: '#f59f00'},
  {id: 'sari', nama: 'Sari', ikon: '🧕', w: '#1c7ed6', o: {jenis: 'P', kulit: KULIT[1], rambut: {gaya: 'hijab', warna: '#000'}, hijab: '#ffffff', atasan: {jenis: 'seragam', warna: '#ffffff'}, bawahan: {jenis: 'rok', warna: '#c92a2a'}}, ransel: '#1c7ed6'},
  {id: 'bayu', nama: 'Bayu', ikon: '🧒', w: '#2f9e44', o: {jenis: 'L', kulit: KULIT[3], rambut: {gaya: 'keriting', warna: '#3a2416'}, atasan: {jenis: 'batik', warna: '#2f9e44'}, bawahan: {jenis: 'celana', warna: '#343a40'}}, ransel: '#e03131'},
  {id: 'nina', nama: 'Nina', ikon: '👧', w: '#ae3ec9', o: {jenis: 'P', kulit: KULIT[0], rambut: {gaya: 'kuncir', warna: '#6a4026'}, atasan: {jenis: 'kaos', warna: '#ae3ec9'}, bawahan: {jenis: 'celana', warna: '#1971c2'}}, ransel: '#fab005'},
];
let heroDef = HERO[0], hero = null;
function pasangHero(def) {
  if (hero) P.sc.remove(hero);
  heroDef = def; hero = buatKarakter(def.o);
  const b = hero.userData.badan; tambah(b, .95, 1.0, .42, 0, .65, -.5, def.ransel, .12); tambah(b, .7, .38, .14, 0, .45, -.75, variasi(def.ransel, .1), .06);
  // pedang kayu di punggung
  const ped = new THREE.Group(); tambah(ped, .12, 1.3, .06, 0, .9, 0, '#d9b98c', .02); tambah(ped, .45, .1, .1, 0, .3, 0, '#8a5a32', .02); ped.position.set(.35, .3, -.78); ped.rotation.z = -.5; b.add(ped); hero.userData.pedang = ped;
  hero.position.set(0, 0, 19); hero.rotation.y = Math.PI; P.sc.add(hero); P.tokoh = hero; P.pusat = hero.position;
  $('hIkon').textContent = def.ikon; $('hNama').textContent = def.nama;
}

// ===================================================================
// STATUS, LEVEL, SIMPAN
// ===================================================================
let S = null, FASE_NOW = 'A';
const statusBaru = () => ({hero: heroDef.id, lv: 1, xp: 0, hp: 50, uang: 3000, jamu: 1, perisai: false, keris: false, Q: 0, slime: 0, jembatan: 0, golem: false, raja: false, koki: false,
  st: {benar: 0, jawab: 0, kalah: 0, monster: 0, combo: 0, mulai: Date.now(), detik: 0}});
const maxHp = () => 50 + (S.lv - 1) * 12;
const serang = () => 10 + (S.lv - 1) * 3 + (S.keris ? 6 : 2);
const tahan = () => (S.perisai ? 3 : 0);
const xpPerlu = () => 20 + (S.lv - 1) * 25;
const kunciSave = () => 'rpg:' + location.pathname + ':' + (DATA_BAWAAN.id || '') + ':' + FASE_NOW;
function simpan() { if (!S) return; try { localStorage.setItem(kunciSave(), JSON.stringify(S)); } catch (e) {} }
function muat() { try { return JSON.parse(localStorage.getItem(kunciSave()) || 'null'); } catch (e) { return null; } }
function tulisHud() {
  if (!S) return; const hp = Math.max(0, S.hp), m = maxHp();
  $('hLv').textContent = 'Lv ' + S.lv; $('hHp').style.width = (hp / m * 100) + '%'; $('hHpT').textContent = `❤ ${hp}/${m}`;
  $('hHp').parentElement.classList.toggle('rendah', hp / m < .3);
  $('hXp').style.width = Math.min(100, S.xp / xpPerlu() * 100) + '%'; $('hUang').textContent = '💰 ' + rupiah(S.uang); $('jamuN').textContent = S.jamu;
}
function tambahUang(n) { S.uang += n; tulisHud(); const c = $('hUang'); c.classList.remove('naik'); void c.offsetWidth; c.classList.add('naik'); }
async function tambahXp(n) {
  S.xp += n; teksTerbang('+' + n + ' XP', hero.position, 'hijau', 2.6);
  while (S.xp >= xpPerlu()) { S.xp -= xpPerlu(); S.lv++; S.hp = maxHp(); banner(`LEVEL ${S.lv}!`, `❤ ${maxHp()}  ⚔ ${serang()}`); efek.menang(); konfeti(hero.position.clone().setY(2), undefined, 80); setMode(hero, 'senang', 2); await tunggu(1200); }
  tulisHud();
}
function banner(teks, kecil = '') { const b = document.createElement('div'); b.className = 'banner'; b.innerHTML = teks + (kecil ? `<small>${kecil}</small>` : ''); document.body.appendChild(b); setTimeout(() => b.remove(), 2300); }
const _pv = new THREE.Vector3();
function keLayar(pos, naik = 0) { _pv.copy(pos); _pv.y += naik; _pv.project(P.cam); return {x: (_pv.x + 1) / 2 * innerWidth, y: (1 - _pv.y) / 2 * innerHeight}; }
function teksTerbang(teks, pos, kelas = '', naik = 2) { const p = keLayar(pos, naik); const d = document.createElement('div'); d.className = 'angkaTerbang ' + kelas; d.textContent = teks; d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; $('lapisTeks').appendChild(d); setTimeout(() => d.remove(), 1200); }

// ===================================================================
// SOAL: dari Mode Guru, diubah jadi soal pilihan ganda untuk pertarungan
// ===================================================================
const JENIS = ['jembatan', 'gerbang', 'kasir', 'pecahan', 'luas', 'keliling'];
function soalSah(f) {
  return (DATA.soal || []).map(s => ({fase: String(s.fase || 'A').trim().toUpperCase().charAt(0), jenis: String(s.jenis || 'gerbang').trim().toLowerCase(), soal: String(s.soal ?? '').trim(), jawaban: String(s.jawaban ?? '').trim()}))
    .filter(s => s.soal && (!f || s.fase === f)).map(s => ({...s, jenis: JENIS.includes(s.jenis) ? s.jenis : 'gerbang'}));
}
const opsiAngka = j => pengecoh(j, 4).map(v => ({t: fmt(v), b: sama(v, j)}));
function ubahSoal(s) {
  const jaw = bacaAngka(s.jawaban);
  if (s.jenis === 'kasir') {
    const m = s.soal.match(/^(.*?)\s*(?:rp\.?\s*)?([\d.,]+)\s*$/i); if (m) { const harga = bacaAngka(m[2]), nama = m[1].trim() || 'barang';
      const bayar = [1000, 2000, 5000, 10000, 20000, 50000, 100000].find(u => u > harga) || harga * 2;
      const kembali = bayar - harga; return {jenis: s.jenis, teks: `Harga ${nama.toLowerCase()} ${rupiah(harga)}. Kamu bayar ${rupiah(bayar)}. Kembaliannya?`, ucap: `Harga ${nama} ${harga} rupiah. Kamu bayar ${bayar} rupiah. Berapa kembaliannya?`, opsi: pengecoh(kembali, 4).map(v => ({t: rupiah(v), b: sama(v, kembali)})), jaw: rupiah(kembali)}; }
  }
  if (s.jenis === 'pecahan') {
    const m = s.soal.match(/(\d+)\s*\/\s*(\d+)/); if (m) { const a = +m[1], b = +m[2];
      if (isFinite(jaw) && jaw > 0 && (jaw * a) % b === 0) { const j = jaw * a / b; return {jenis: s.jenis, teks: `Kue dipotong ${jaw} sama besar. Ambil ${a}/${b} bagian. Berapa potong?`, ucap: `Kue dipotong ${jaw} sama besar. Ambil ${a} per ${b} bagian. Berapa potong?`, opsi: opsiAngka(j), jaw: fmt(j)}; }
      const benar = `${a}/${b}`; const set = new Set([benar, `${b - a || 1}/${b}`, `${b}/${a}`, `${a}/${b + 1}`, `${a + 1}/${b}`]); const ops = kocok([...set].slice(0, 4));
      if (!ops.includes(benar)) ops[0] = benar;
      return {jenis: s.jenis, teks: `Kue dipotong ${b} sama besar. Kamu makan ${a} potong. Pecahannya?`, ucap: `Kue dipotong ${b} sama besar. Kamu makan ${a} potong. Berapa pecahannya?`, opsi: kocok(ops).map(t => ({t, b: t === benar})), jaw: benar}; }
  }
  if (s.jenis === 'luas' || s.jenis === 'keliling') {
    const m = s.soal.match(/(\d+[.,]?\d*)\s*[x×*]\s*(\d+[.,]?\d*)/i); if (m) { const p = bacaAngka(m[1]), l = bacaAngka(m[2]); const luas = s.jenis === 'luas';
      const j = isFinite(jaw) ? jaw : luas ? p * l : 2 * (p + l);
      return {jenis: s.jenis, teks: `${luas ? 'Luas' : 'Keliling'} sawah panjang ${fmt(p)} m, lebar ${fmt(l)} m?`, ucap: `Sawah panjangnya ${p} meter, lebarnya ${l} meter. Berapa ${luas ? 'luasnya' : 'kelilingnya'}?`, opsi: pengecoh(j, 4).map(v => ({t: fmt(v) + (luas ? ' m²' : ' m'), b: sama(v, j)})), jaw: fmt(j) + (luas ? ' m²' : ' m')}; }
  }
  const v = isFinite(jaw) && s.jawaban !== '' ? jaw : hitungEkspresi(s.soal);
  if (isFinite(v)) { const ekspr = !isNaN(hitungEkspresi(s.soal)) && s.jawaban === ''; const teks = ekspr ? tampilSoal(s.soal) + ' = ?' : s.soal;
    return {jenis: s.jenis, teks, ucap: ekspr ? ucapAngka(tampilSoal(s.soal)) + ' sama dengan berapa?' : s.soal, opsi: opsiAngka(v), jaw: fmt(v)}; }
  if (s.jawaban) { const benar = s.jawaban; return {jenis: s.jenis, teks: s.soal, ucap: s.soal, opsi: [{t: benar, b: true}], jaw: benar}; }
  return null;
}
// cadangan bila guru belum mengisi soal fase ini
function soalAcak() {
  const f = FASE_NOW; let a, b, op;
  if (f === 'A') { op = pilih(['+', '-']); a = acakInt(3, 15); b = acakInt(1, op === '-' ? a : 10); }
  else if (f === 'B') { op = pilih(['×', ':', '+']); if (op === ':') { b = acakInt(2, 9); a = b * acakInt(2, 9); } else if (op === '×') { a = acakInt(2, 9); b = acakInt(2, 9); } else { a = acakInt(50, 400); b = acakInt(20, 300); } }
  else { op = pilih(['×', ':', '-']); if (op === ':') { b = acakInt(3, 12); a = b * acakInt(6, 15); } else if (op === '×') { a = acakInt(11, 25); b = acakInt(3, 9); } else { a = acakInt(500, 2000); b = acakInt(100, 499); } }
  return ubahSoal({jenis: 'gerbang', soal: `${a} ${op} ${b}`, jawaban: ''});
}
let ANTRE = [], POOL = [];
function siapkanSoal() { POOL = soalSah(FASE_NOW).map(ubahSoal).filter(Boolean); ANTRE = []; }
function ambilSoal(suka) {
  if (!POOL.length) return soalAcak();
  if (!ANTRE.length) ANTRE = kocok(POOL);
  if (suka) { const i = ANTRE.findIndex(q => suka.includes(q.jenis)); if (i >= 0) return ANTRE.splice(i, 1)[0]; }
  return ANTRE.pop();
}
function catatJawab(benar) {
  S.st.jawab++; if (benar) S.st.benar++;
  if (CONTOH && S.st.jawab >= CONTOH_SOAL) setTimeout(() => ajakanBeli('soal'), 1600);
}

// ===================================================================
// MONSTER
// ===================================================================
function kilatkan(o, warna = '#ff2222', lama = 180) { const mats = []; o.traverse(m => { if (m.isMesh && m.material && m.material.emissive) mats.push(m.material); }); mats.forEach(m => m.emissive.set(warna)); setTimeout(() => mats.forEach(m => m.emissive.set('#000000')), lama); }
function mataMonster(g, x, y, z, s = .14, warna = '#1b1b1b') { [-x, x].forEach(xx => { tambah(g, s, s * 1.3, .05, xx, y, z, warna, .02); tambah(g, s * .4, s * .4, .03, xx + s * .15, y + s * .3, z + .03, '#ffffff', .01); }); }
const JENIS_MONSTER = {
  slime: {nama: 'Slime Galat', hp: 30, atk: 6, xp: 12, uang: 1000, buat() { const g = new THREE.Group(); const w = pilih(['#69db7c', '#4dabf7', '#ffa94d']); const b = tambah(g, .95, .75, .95, 0, .38, 0, w, .32); b.material.transparent = true; b.material.opacity = .92; tambah(g, .35, .18, .1, -.18, .6, .44, '#ffffff', .05).material.opacity = .6; mataMonster(g, .2, .45, .49); tambah(g, .22, .06, .04, 0, .26, .49, '#1b1b1b', .02); g.userData.badan = b; return g; }},
  jamur: {nama: 'Jamur Ngawur', hp: 38, atk: 8, xp: 20, uang: 2000, buat() { const g = new THREE.Group(); tambah(g, .5, .6, .5, 0, .3, 0, '#f8f0e3', .1); const t = tambah(g, 1.2, .55, 1.2, 0, .85, 0, '#e03131', .25); [[-.3, .3], [.3, -.2], [0, .4], [.35, .3], [-.25, -.3]].forEach(([x, z]) => tambah(g, .2, .1, .2, x, 1.13, z, '#ffffff', .04)); mataMonster(g, .12, .38, .26, .1); g.userData.badan = t; return g; }},
  kelelawar: {nama: 'Kelelawar Kali', hp: 34, atk: 9, xp: 20, uang: 2000, terbang: true, buat() { const g = new THREE.Group(); const b = tambah(g, .6, .55, .5, 0, 1.3, 0, '#6741d9', .15); [-1, 1].forEach(s => tambah(b, .12, .22, .1, s * .18, .34, 0, '#6741d9', .03)); mataMonster(b, .13, .05, .26, .1, '#ffd43b');
    const sk = [-1, 1].map(s => { const p = new THREE.Group(); tambah(p, .8, .06, .45, s * .4, 0, 0, '#5f3dc4', .03); p.position.set(s * .25, .05, 0); b.add(p); return p; }); g.userData.sayap = sk; g.userData.badan = b; b.position.y = 1.3; b.children.forEach(() => {}); return g; }},
  golem: {nama: 'Golem Batu', hp: 90, atk: 11, xp: 70, uang: 6000, boss: true, buat() { const g = new THREE.Group(); const B = '#868e96'; tambah(g, 1.6, 1.4, 1.1, 0, 1.6, 0, B, .2); tambah(g, 1, .8, .9, 0, 2.7, .05, variasi(B, .05), .18); [-1, 1].forEach(s => { tambah(g, .55, 1.3, .6, s * 1.1, 1.5, 0, variasi(B, .06), .15); tambah(g, .6, .9, .6, s * .45, .45, 0, variasi(B, .06), .15); });
    mataMonster(g, .22, 2.75, .5, .16, '#ff922b'); tambah(g, .5, .45, .1, 0, 1.7, .56, '#5c940d', .05); g.userData.badan = g.children[0]; return g; }},
  raja: {nama: 'Raja Galat', hp: 170, atk: 13, xp: 150, uang: 15000, boss: true, buat() { const g = new THREE.Group(); tambah(g, 1.7, 1.8, 1.3, 0, 1.4, 0, '#5f3dc4', .3); tambah(g, 2, .3, 1.5, 0, .55, 0, '#3b2a6b', .1);
    const k = tambah(g, 1.3, 1.1, 1.1, 0, 2.85, 0, '#9775fa', .25); mataMonster(g, .28, 2.95, .56, .2, '#ff2222'); tambah(g, .6, .1, .05, 0, 2.6, .56, '#1b1b1b', .02);
    for (let i = 0; i < 5; i++) tambah(g, .22, .4, .22, (i - 2) * .27, 3.6, 0, '#fcc419', .04); tambah(g, 1.4, .2, 1.2, 0, 3.4, 0, '#fab005', .05);
    tambah(g, 1.9, 2, .12, 0, 1.6, -.72, '#c92a2a', .04); const tong = new THREE.Group(); tambah(tong, .12, 2.2, .12, 0, 0, 0, '#fab005', .03); const q = teksVoxel('?', '#ff6b6b', .06, 1); q.position.y = 1.1; tong.add(q); tong.position.set(1.2, 1.6, .4); g.add(tong);
    g.userData.badan = k; return g; }},
};
const monster = [];
function buatMonster(jenis, x, z, r = 3) {
  const J = JENIS_MONSTER[jenis]; const mesh = J.buat(); mesh.position.set(x, 0, z); if (J.boss) mesh.scale.setScalar(jenis === 'raja' ? 1.5 : 1.25); P.sc.add(mesh);
  const m = {jenis, J, mesh, x0: x, z0: z, r, hp: J.hp, hidup: true, tuju: null, tunggu: acak(0, 2), muncul: 0, t: acak(0, 6)}; monster.push(m); return m;
}
[[-5, 2], [4, 0], [-2, -2.5], [8, 4], [-9, 5.5]].forEach(([x, z]) => buatMonster('slime', x, z, 2.5));
[[-8, -14], [6, -15], [-10, -22], [9, -25], [4, -19]].forEach(([x, z], i) => buatMonster(i % 2 ? 'kelelawar' : 'jamur', x, z, 2.5));
const golem = buatMonster('golem', 0, -27.6, 0);
const raja = buatMonster('raja', 0, -38, 0);
function updateMonster(dt, t) {
  for (const m of monster) {
    const o = m.mesh; m.t += dt;
    if (!m.hidup) { if (!m.J.boss && (m.muncul -= dt) <= 0) { m.hidup = true; m.hp = m.J.hp; o.visible = true; o.position.set(m.x0, 0, m.z0); muncul(o, .5); } continue; }
    const b = o.userData.badan;
    if (m.jenis === 'slime') { const s = Math.abs(Math.sin(m.t * 4)); b.scale.set(1 + (1 - s) * .12, .85 + s * .25, 1 + (1 - s) * .12); }
    if (m.jenis === 'kelelawar') { o.userData.sayap.forEach((p, i) => p.rotation.z = Math.sin(m.t * 18) * .6 * (i ? -1 : 1)); b.position.y = 1.3 + Math.sin(m.t * 3) * .2; }
    if (m.jenis === 'jamur') b.rotation.z = Math.sin(m.t * 3) * .08;
    if (m.J.boss) { o.position.y = Math.abs(Math.sin(m.t * 1.6)) * .1; o.rotation.y = Math.atan2(hero.position.x - o.position.x, hero.position.z - o.position.z); continue; }
    if (MODE !== 'jelajah') continue;
    const dh = Math.hypot(hero.position.x - o.position.x, hero.position.z - o.position.z);
    let tx, tz, kec;
    if (dh < 4.5 && kebal <= 0) { tx = hero.position.x; tz = hero.position.z; kec = 1.7; }
    else { if (!m.tuju || (m.tunggu -= dt) <= 0) { m.tuju = {x: m.x0 + acak(-m.r, m.r), z: m.z0 + acak(-m.r, m.r)}; m.tunggu = acak(2, 4); } tx = m.tuju.x; tz = m.tuju.z; kec = .8; }
    const dx = tx - o.position.x, dz = tz - o.position.z, d = Math.hypot(dx, dz);
    if (d > .1) { const nx = o.position.x + dx / d * kec * dt, nz = o.position.z + dz / d * kec * dt; if (bebas(nx, nz, .4)) { o.position.x = nx; o.position.z = nz; } o.rotation.y += (Math.atan2(dx, dz) - o.rotation.y) * Math.min(1, dt * 4); }
    if (dh < 1.15 && kebal <= 0) { mulaiTarung(m); return; }
  }
}

// ===================================================================
// NPC & MISI
// ===================================================================
const npc = [];
function buatNpc(id, nama, o, x, z, hadap, fn) {
  const k = buatKarakter(o); k.position.set(x, 0, z); hadapDepan(k, hadap); P.sc.add(k); halang(x, z, .5);
  const tanda = teksVoxel('!', '#ffd43b', .07, 2); tanda.visible = false; P.sc.add(tanda);
  const n = {id, nama, k, x, z, fn, tanda}; npc.push(n);
  daftarKetuk(k, () => { if (MODE === 'jelajah') jalanKeNpc(n); });
  return n;
}
const lurah = buatNpc('lurah', 'Pak Lurah', {jenis: 'L', kulit: KULIT[3], rambut: {gaya: 'cepak', warna: '#8a8a90'}, atasan: {jenis: 'batik', warna: '#a0522d'}, bawahan: {jenis: 'celana', warna: '#343a40'}, kacamata: true}, -3.4, 17.4, .6, bicaraLurah);
const busari = buatNpc('sari', 'Bu Sari', {jenis: 'P', kulit: KULIT[2], rambut: {gaya: 'hijab', warna: '#000'}, hijab: '#f783ac', atasan: {jenis: 'kaos', warna: '#fff'}, bawahan: {jenis: 'rok-panjang', warna: '#495057'}}, 5.4, 14.2, -.6, bicaraSari);
const koki = buatNpc('koki', 'Bu Ratna', {jenis: 'P', kulit: KULIT[1], rambut: {gaya: 'bob', warna: '#3a2416'}, atasan: {jenis: 'kemeja', warna: '#ffffff'}, bawahan: {jenis: 'rok', warna: '#e64980'}}, 6.4, 19, -.4, bicaraKoki);
const tukang = buatNpc('tukang', 'Pak Tukang', {jenis: 'L', kulit: KULIT[4], rambut: {gaya: 'acak', warna: '#1a1a1a'}, atasan: {jenis: 'kaos', warna: '#f08c00'}, bawahan: {jenis: 'celana', warna: '#5c3d2e'}, topi: '#fab005'}, 2.4, -3.8, -.4, bicaraTukang);
const mbah = buatNpc('mbah', 'Mbah Wiryo', {jenis: 'L', kulit: KULIT[3], rambut: {gaya: 'cepak', warna: '#dee2e6'}, atasan: {jenis: 'batik', warna: '#5c3d2e'}, bawahan: {jenis: 'celana', warna: '#212529'}}, -2.6, -23, .4, bicaraMbah);
// tukang membawa palu
{ const p = new THREE.Group(); tambah(p, .08, .6, .08, 0, 0, 0, '#8a5a32', .02); tambah(p, .3, .15, .15, 0, .3, 0, '#495057', .03); p.position.set(0, .2, .2); tukang.k.userData.lKanan.add(p); }

const MISI = [
  {t: 'Temui Pak Lurah di Balai Desa', tuju: () => lurah},
  {t: () => `Kalahkan Slime Galat di padang (${S.slime}/3)`, tuju: () => ({x: 0, z: 2})},
  {t: 'Lapor ke Pak Lurah', tuju: () => lurah},
  {t: () => `Bantu Pak Tukang membangun jembatan (${S.jembatan}/3)`, tuju: () => tukang},
  {t: 'Masuk Hutan Candi, temui Mbah Wiryo', tuju: () => mbah},
  {t: 'Kalahkan Golem Batu penjaga benteng', tuju: () => golem.mesh.position},
  {t: 'Kalahkan Raja Galat!', tuju: () => raja.mesh.position},
  {t: 'Pulau Angka aman! Jelajahi & naik level', tuju: () => null},
];
function teksMisi() { const m = MISI[S.Q]; return typeof m.t === 'function' ? m.t() : m.t; }
function tulisMisi(baru) { $('misiT').textContent = teksMisi(); if (baru) { const e = $('misi'); e.classList.remove('baru'); void e.offsetWidth; e.classList.add('baru'); efek.kilau(); } }
function aturMisi(q) { S.Q = q; tulisMisi(true); simpan(); }
function tujuanMisi() { const t = MISI[S.Q].tuju(); if (!t) return null; return t.k ? t.k.position : t; }
function npcPunyaMisi(n) {
  if (!S) return false;
  return (n === lurah && (S.Q === 0 || S.Q === 2)) || (n === tukang && S.Q === 3) || (n === mbah && S.Q === 4) || (n === koki && !S.koki) || n === busari;
}

// ---------- dialog ----------
let _dlgRes = null;
function dialog(nama, teks, pilihan) {
  return new Promise(res => {
    $('dialog').hidden = false; $('dNama').textContent = nama; $('dTeks').textContent = teks;
    const dp = $('dPilih'); dp.innerHTML = ''; $('dLanjut').hidden = !!pilihan;
    if (pilihan) pilihan.forEach((p, i) => { const b = document.createElement('button'); b.textContent = p; if (!i) b.className = 'utama'; b.onclick = e => { e.stopPropagation(); efek.ketuk(); try { speechSynthesis.cancel(); } catch (x) {} $('dialog').hidden = true; res(i); }; dp.appendChild(b); });
    _dlgRes = pilihan ? null : () => { try { speechSynthesis.cancel(); } catch (x) {} $('dialog').hidden = true; res(); };
    ucap(teks, {tampil: false});
  });
}
$('dialog').onclick = () => { if (_dlgRes) { const r = _dlgRes; _dlgRes = null; efek.ketuk(); r(); } };
addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && _dlgRes && !$('dialog').hidden) { e.preventDefault(); $('dialog').onclick(); } });
async function percakapan(nama, baris) { for (const b of baris) await dialog(nama, b); }

// soal di luar pertarungan (misi warga): coba lagi sampai benar, pilihan salah dicoret
async function soalMisi(judul, suka) {
  const q = ambilSoal(suka);
  return new Promise(res => {
    tampilSoal3(q, judul, false);
    let salahSekali = false;
    jawabSoal = async (o, el) => {
      if (o.b) { el.classList.add('benar'); efek.benar(); catatJawab(!salahSekali); jawabSoal = null; await tunggu(700); $('tarung').hidden = true; res(true); }
      else { el.classList.add('salah'); el.disabled = true; efek.salah(); salahSekali = true; }
    };
  });
}

async function bicaraLurah() {
  if (S.Q === 0) {
    await percakapan('Pak Lurah', [`Syukurlah kamu datang, ${heroDef.nama}!`, 'Raja Galat mencuri Kristal Angka dari menara desa. Sejak itu, monster galat bermunculan dan hitungan semua orang jadi kacau!', 'Monster itu hanya kalah oleh jawaban hitungan yang benar. Jawab soalnya untuk menyerang!', 'Coba dulu di padang utara desa. Kalahkan 3 Slime Galat ya!']);
    aturMisi(1);
  } else if (S.Q === 2) {
    await percakapan('Pak Lurah', ['Luar biasa! Para slime sudah kabur.', 'Ini Keris Angka peninggalan leluhur. Seranganmu jadi lebih kuat!', 'Benteng Raja Galat ada di seberang sungai, di balik Hutan Candi. Tapi jembatannya rusak. Temui Pak Tukang di tepi sungai.']);
    if (!S.keris) { S.keris = true; banner('⚔ Keris Angka!', 'Serangan +4'); efek.bintang(); }
    tambahUang(5000); teksTerbang('+Rp5.000', hero.position, 'hijau', 2.2); aturMisi(3);
  } else if (S.Q === 1) await dialog('Pak Lurah', `Slime Galat ada di padang utara. Baru ${S.slime} dari 3. Semangat!`);
  else if (S.Q >= 7) await dialog('Pak Lurah', 'Pulau Angka aman berkat kamu! Monster yang tersisa masih bisa jadi latihan naik level.');
  else await dialog('Pak Lurah', 'Hati-hati di jalan. Kalau terluka, minum air mancur ajaib di alun-alun ya!');
}
async function bicaraSari() {
  const p = await dialog('Bu Sari', 'Selamat datang di warung! Mau belanja perbekalan? Bayar pakai uang pas ya.', ['🛒 Belanja', 'Nanti saja']);
  if (p === 0) await bukaToko();
}
async function bicaraKoki() {
  if (S.koki) { await dialog('Bu Ratna', 'Jamu tadi manjur kan? Hati-hati melawan Raja Galat!'); return; }
  const p = await dialog('Bu Ratna', 'Aduh, gara-gara Raja Galat aku lupa cara membagi kue. Mau bantu jawab 2 soal? Nanti kuberi jamu sehat.', ['Mau bantu!', 'Nanti dulu']);
  if (p) return;
  for (let i = 0; i < 2; i++) await soalMisi(`🍰 Bantu Bu Ratna (${i + 1}/2)`, ['pecahan', 'kasir']);
  S.koki = true; S.jamu += 2; tulisHud(); efek.bintang(); banner('🧪 +2 Jamu Sehat'); await tambahXp(15); simpan();
  await dialog('Bu Ratna', 'Terima kasih! Ini 2 botol jamu sehat. Minum saat darahmu tinggal sedikit ya.');
}
async function bicaraTukang() {
  if (S.Q < 3) { await dialog('Pak Tukang', 'Jembatan ini rusak diterjang monster. Temui Pak Lurah dulu ya.'); return; }
  if (S.Q > 3) { await dialog('Pak Tukang', 'Jembatannya kokoh! Hutan Candi ada di seberang.'); return; }
  await dialog('Pak Tukang', 'Untuk menyambung jembatan, kita harus menghitung kayu dengan tepat. Bantu aku 3 kali ya!');
  while (S.jembatan < 3) {
    await soalMisi(`🌉 Bangun jembatan (${S.jembatan + 1}/3)`, ['jembatan', 'luas', 'keliling']);
    S.jembatan++; await bangunJembatan(S.jembatan); tulisMisi(); simpan();
  }
  await tambahXp(30);
  await dialog('Pak Tukang', 'Jembatan jadi! Di seberang ada Hutan Candi. Mbah Wiryo tahu jalan ke benteng.'); aturMisi(4);
}
async function bicaraMbah() {
  if (S.Q < 4) { await dialog('Mbah Wiryo', 'Hutan ini berbahaya, cu.'); return; }
  if (S.Q === 4) { await percakapan('Mbah Wiryo', ['Kamu pemberani, cu. Gerbang benteng dijaga Golem Batu.', 'Golem itu kuat. Jawab dengan cepat supaya seranganmu kritis, dan kumpulkan 3 jawaban benar beruntun untuk Jurus Kilat!', 'Kalau perlu, latihan dulu melawan jamur dan kelelawar di hutan supaya naik level.']); aturMisi(5); return; }
  await dialog('Mbah Wiryo', S.Q >= 7 ? 'Kristal Angka sudah kembali. Terima kasih, cu.' : 'Semangat, cu! Benteng Raja Galat ada di utara.');
}
async function bangunJembatan(n) {
  const per = Math.ceil(papanJembatan.length / 3); const awal = (n - 1) * per;
  for (let i = awal; i < Math.min(papanJembatan.length, n * per); i++) { papanJembatan[i].visible = true; muncul(papanJembatan[i], .3); efek.hitung(i); await tunggu(120); }
  DUNIA.jembatan = n;
}
function terapkanDunia() {
  papanJembatan.forEach((p, i) => { p.visible = i < Math.ceil(papanJembatan.length / 3) * S.jembatan; }); DUNIA.jembatan = S.jembatan;
  DUNIA.gerbang = S.golem; pintuBenteng.forEach((p, i) => { p.position.x = (i ? 1 : -1) * (S.golem ? 2.2 : .8); });
  golem.hidup = !S.golem; golem.mesh.visible = !S.golem; golem.hp = golem.J.hp;
  raja.hidup = !S.raja; raja.mesh.visible = !S.raja; raja.hp = raja.J.hp;
}

// ===================================================================
// GERAK & TABRAKAN
// ===================================================================
function bebas(x, z, r = .35) {
  if (x < BATAS.x0 || x > BATAS.x1 || z < BATAS.z0 || z > BATAS.z1) return false;
  if (z > SUNGAI.z0 - .2 && z < SUNGAI.z1 + .2 && !(DUNIA.jembatan >= 3 && Math.abs(x) < 1.05)) return false;
  if (z > -31.2 && z < -29.8 && !(DUNIA.gerbang && Math.abs(x) < 1.4)) return false;
  for (const t of tabrak) if (Math.hypot(t.x - x, t.z - z) < t.r + r) return false;
  return true;
}
let MODE = 'menu', kebal = 0;
const kunciTombol = {};
addEventListener('keydown', e => { kunciTombol[e.key.toLowerCase()] = true; if ((e.key === 'e' || e.key === 'E') && MODE === 'jelajah' && npcDekat) bicara(npcDekat); });
addEventListener('keyup', e => { kunciTombol[e.key.toLowerCase()] = false; });
const joy = {x: 0, y: 0, aktif: false};
{ const el = $('joy'), bola = $('joyBola'); let id = null;
  const set = e => { const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = e.clientX - cx, dy = e.clientY - cy; const m = r.width / 2 - 14, d = Math.hypot(dx, dy); if (d > m) { dx *= m / d; dy *= m / d; } joy.x = dx / m; joy.y = -dy / m; bola.style.transform = `translate(${dx}px,${dy}px)`; };
  el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); joy.aktif = true; tujuJalan = null; set(e); });
  el.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); });
  const lepas = e => { if (e.pointerId !== id) return; id = null; joy.aktif = false; joy.x = joy.y = 0; bola.style.transform = ''; };
  el.addEventListener('pointerup', lepas); el.addEventListener('pointercancel', lepas); }
// ketuk tanah = jalan ke situ
let tujuJalan = null, setibaNpc = null;
{ const c = P.R.domElement; let a = null;
  c.addEventListener('pointerdown', e => { a = {x: e.clientX, y: e.clientY}; });
  c.addEventListener('pointerup', e => { if (!a || MODE !== 'jelajah') return; const pindah = Math.hypot(e.clientX - a.x, e.clientY - a.y); a = null; if (pindah > 18 || objekDi(e)) return; const p = titikDiBidang(e); if (p) { tujuJalan = {x: p.x, z: p.z}; setibaNpc = null; } }); }
function jalanKeNpc(n) { const dx = hero.position.x - n.x, dz = hero.position.z - n.z, d = Math.hypot(dx, dz) || 1; tujuJalan = {x: n.x + dx / d * 1.3, z: n.z + dz / d * 1.3}; setibaNpc = n; }
let npcDekat = null;
async function bicara(n) {
  if (MODE !== 'jelajah') return; MODE = 'dialog'; tujuJalan = null; setibaNpc = null; setMode(hero, 'diam'); $('bAksi').hidden = true; $('joy').hidden = true;
  hero.rotation.y = Math.atan2(n.x - hero.position.x, n.z - hero.position.z);
  n.k.userData.hadapDepan = false; n.k.rotation.y = Math.atan2(hero.position.x - n.x, hero.position.z - n.z); setMode(n.k, 'lambai', 1.2);
  try { await n.fn(); } finally { n.k.userData.hadapDepan = true; if (MODE === 'dialog') { MODE = 'jelajah'; $('joy').hidden = false; } simpan(); }
}
$('bAksi').onclick = () => { if (npcDekat) bicara(npcDekat); };
const _arah = new THREE.Vector2();
let tSembuh = 0;
function updateHero(dt) {
  if (!hero) return; kebal -= dt;
  if (MODE !== 'jelajah') { gerakKarakter(hero, dt); return; }
  let ix = joy.x, iy = joy.y;
  if (kunciTombol['arrowleft'] || kunciTombol['a']) ix -= 1; if (kunciTombol['arrowright'] || kunciTombol['d']) ix += 1;
  if (kunciTombol['arrowup'] || kunciTombol['w']) iy += 1; if (kunciTombol['arrowdown'] || kunciTombol['s']) iy -= 1;
  const cy = Math.cos(P.yaw), sy = Math.sin(P.yaw);
  let wx = 0, wz = 0, kuat = 0;
  if (ix || iy) { tujuJalan = null; setibaNpc = null; _arah.set(ix, iy); kuat = Math.min(1, _arah.length()); _arah.normalize(); wx = _arah.x * cy - _arah.y * sy; wz = -_arah.x * sy - _arah.y * cy; }
  else if (tujuJalan) { const dx = tujuJalan.x - hero.position.x, dz = tujuJalan.z - hero.position.z, d = Math.hypot(dx, dz); if (d < .15) { tujuJalan = null; if (setibaNpc) { const n = setibaNpc; setibaNpc = null; bicara(n); return; } } else { wx = dx / d; wz = dz / d; kuat = 1; } }
  if (kuat > .1) {
    const v = 4.6 * kuat * dt, nx = hero.position.x + wx * v, nz = hero.position.z + wz * v;
    if (bebas(nx, nz)) { hero.position.x = nx; hero.position.z = nz; } else if (bebas(nx, hero.position.z)) hero.position.x = nx; else if (bebas(hero.position.x, nz)) hero.position.z = nz; else if (tujuJalan && !setibaNpc) tujuJalan = null;
    let da = Math.atan2(wx, wz) - hero.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); hero.rotation.y += da * Math.min(1, dt * 12);
    if (hero.userData.mode !== 'jalan') setMode(hero, 'jalan');
    hero.userData.tLangkah = (hero.userData.tLangkah || 0) + dt; if (hero.userData.tLangkah > .28) { hero.userData.tLangkah = 0; efek.langkah(); }
  } else if (hero.userData.mode === 'jalan') setMode(hero, 'diam');
  // NPC terdekat
  npcDekat = null; let dMin = 2.2; for (const n of npc) { const d = Math.hypot(n.x - hero.position.x, n.z - hero.position.z); if (d < dMin) { dMin = d; npcDekat = n; } }
  $('bAksi').hidden = !npcDekat; if (npcDekat) $('bAksi').innerHTML = (npcDekat === busari ? '🛒' : '💬') + `<small>${npcDekat === busari ? 'Belanja' : 'Bicara'}</small>`;
  // air mancur penyembuh
  if (Math.hypot(hero.position.x - AIR.x, hero.position.z - AIR.z) < 2.6 && S.hp < maxHp()) { tSembuh -= dt; if (tSembuh <= 0) { tSembuh = .5; const n = Math.min(maxHp() - S.hp, Math.ceil(maxHp() * .2)); S.hp += n; teksTerbang('+' + n + ' ❤', hero.position, 'hijau', 2.2); efek.kilau(); tulisHud(); } }
  // masuk area boss
  if (S.Q === 6 && raja.hidup && Math.hypot(hero.position.x - raja.mesh.position.x, hero.position.z - raja.mesh.position.z) < 5.5) mulaiTarung(raja);
  else if (golem.hidup && S.Q >= 4 && Math.hypot(hero.position.x - golem.mesh.position.x, hero.position.z - golem.mesh.position.z) < 3.4 && kebal <= 0) mulaiTarung(golem);
}
// tanda ! di atas warga & panah kompas ke tujuan misi
function updateTanda(t) {
  for (const n of npc) { const ada = npcPunyaMisi(n) && n !== busari; n.tanda.visible = ada && MODE === 'jelajah'; if (ada) { n.tanda.position.set(n.x, 2.1 + Math.sin(t * 3) * .12, n.z); n.tanda.rotation.y = t * 1.5; } }
  const k = $('kompas'); const tj = S && MODE === 'jelajah' ? tujuanMisi() : null;
  if (!tj || Math.hypot(tj.x - hero.position.x, tj.z - hero.position.z) < 4) { k.hidden = true; return; }
  const a = keLayar(hero.position, 1), b = keLayar(new THREE.Vector3(tj.x, 0, tj.z), 1); const sud = Math.atan2(b.y - a.y, b.x - a.x);
  k.hidden = false; const r = 70 + Math.sin(t * 5) * 6; k.style.left = (a.x + Math.cos(sud) * r - 17) + 'px'; k.style.top = (a.y + Math.sin(sud) * r - 20) + 'px'; k.style.transform = `rotate(${sud}rad)`;
}

// ===================================================================
// PERTARUNGAN (giliran, jawab soal untuk menyerang)
// ===================================================================
let jawabSoal = null, lawan = null, combo = 0, jurusSiap = false, jurusAktif = false, tSoal = 0, tKritis = 0, kabur = false;
function tampilSoal3(q, judulMonster, tarung) {
  $('tarung').hidden = false; $('tMonster').hidden = !tarung; $('tAksi').hidden = !tarung; $('tWaktu').hidden = !tarung;
  if (!tarung) { $('tMonster').hidden = false; $('tmNama').textContent = judulMonster; $('tmLv').textContent = ''; $('tmHp').parentElement.hidden = true; }
  else $('tmHp').parentElement.hidden = false;
  const tt = $('tTanya'); tt.textContent = q.teks; tt.classList.toggle('panjang', q.teks.length > 22);
  const w = $('tOpsi'); w.innerHTML = '';
  q.opsi.forEach(o => { const b = document.createElement('button'); b.textContent = o.t; b.onclick = () => { if (jawabSoal && !b.disabled) { efek.ketuk(); jawabSoal(o, b); } }; w.appendChild(b); });
  w.style.gridTemplateColumns = q.opsi.length === 1 ? '1fr' : '1fr 1fr';
  if (q.opsi.length === 1) { w.innerHTML = ''; const inp = document.createElement('button'); inp.textContent = 'Lihat jawaban: ' + q.jaw; inp.onclick = () => jawabSoal && jawabSoal({b: true}, inp); w.appendChild(inp); }
  window.__q = q; window.__ulangSuara = () => ucap(q.ucap, {tampil: false}); ucap(q.ucap, {tampil: false});
}
function tulisLawan() { const m = lawan; $('tmNama').textContent = m.J.nama; $('tmLv').textContent = m.J.boss ? '👑 BOS' : ''; $('tmHp').style.width = Math.max(0, m.hp / m.J.hp * 100) + '%'; $('tmHpT').textContent = `${Math.max(0, m.hp)}/${m.J.hp}`; }
function tulisJurus() { const b = $('bJurus'); b.disabled = !jurusSiap || jurusAktif; b.classList.toggle('aktif', jurusAktif); $('jurusIsi').textContent = jurusAktif ? 'AKTIF' : jurusSiap ? 'SIAP' : `${Math.min(3, combo)}/3`; $('bJamuT').disabled = S.jamu <= 0 || S.hp >= maxHp(); $('jamuN').textContent = S.jamu; $('bKabur').disabled = lawan && lawan.J.boss; }
$('bJurus').onclick = () => { if (jurusSiap && !jurusAktif) { jurusAktif = true; efek.kilau(); tulisJurus(); banner('⚡ JURUS KILAT', 'Jawab benar = serangan 3x!'); } };
$('bJamuT').onclick = () => { if (S.jamu > 0 && S.hp < maxHp()) { minumJamu(); tulisJurus(); } };
$('bKabur').onclick = () => { if (lawan && !lawan.J.boss) { kabur = true; if (jawabSoal) jawabSoal(null, null); } };
function minumJamu() { S.jamu--; const n = Math.min(35, maxHp() - S.hp); S.hp += n; teksTerbang('+' + n + ' ❤', hero.position, 'hijau', 2.2); efek.kilau(); tulisHud(); simpan(); }
const fokusKam = new THREE.Vector3(), fokusTuju = new THREE.Vector3();
let jarakKam = 18, jarakTuju = 18, kamManual = false;
async function mulaiTarung(m) {
  if (MODE !== 'jelajah' || !m.hidup) return;
  MODE = 'tarung'; document.body.classList.add('tarung'); lawan = m; kabur = false; combo = 0; jurusSiap = false; jurusAktif = false; tujuJalan = null; setibaNpc = null;
  $('joy').hidden = true; $('bAksi').hidden = true; $('kompas').hidden = true; setMode(hero, 'diam');
  aturMusik(MUSIK_TARUNG); efek.wus();
  // pahlawan & monster berhadapan
  // pahlawan di kiri-bawah layar, monster di kanan-atas: keduanya terlihat utuh
  const o = m.mesh, cy0 = Math.cos(P.yaw), sy0 = Math.sin(P.yaw);
  const kanan = {x: cy0, z: -sy0}, atas = {x: -sy0, z: -cy0}; const ax = kanan.x * .82 + atas.x * .57, az = kanan.z * .82 + atas.z * .57;
  const jarak = m.J.boss ? (m.jenis === 'raja' ? 4.4 : 3.4) : 2.4; let hx = o.position.x - ax * jarak, hz = o.position.z - az * jarak;
  if (!bebas(hx, hz, .1)) { const dx = hero.position.x - o.position.x, dz = hero.position.z - o.position.z, d = Math.hypot(dx, dz) || 1; hx = o.position.x + dx / d * jarak; hz = o.position.z + dz / d * jarak; if (!bebas(hx, hz, .1)) { hx = hero.position.x; hz = hero.position.z; } }
  hero.position.set(hx, 0, hz); hero.rotation.y = Math.atan2(o.position.x - hx, o.position.z - hz); o.rotation.y = Math.atan2(hx - o.position.x, hz - o.position.z);
  hero.userData.posTarung = hero.position.clone();
  aturFokusTarung(hx, hz, o.position);
  banner(m.J.boss ? '👑 ' + m.J.nama : '⚔ ' + m.J.nama, m.J.boss ? 'Pertarungan bos!' : 'muncul!');
  if (m === golem) await dialog('Golem Batu', 'GRRR... TIDAK ADA YANG BOLEH LEWAT... KECUALI YANG PANDAI BERHITUNG!');
  if (m === raja) await percakapan('Raja Galat', ['Hahaha! Jadi kamu yang mengalahkan Golem-ku?', 'Dengan Kristal Angka ini, semua hitungan di pulau akan SALAH selamanya!', 'Coba kalahkan aku kalau berani!']);
  await tunggu(400);
  tulisLawan(); tulisHud();
  while (m.hp > 0 && S.hp > 0 && !kabur) {
    const q = ambilSoal(); tampilSoal3(q, m.J.nama, true); tulisJurus();
    tSoal = 0; tKritis = m.J.boss ? 7 : 8; $('tWaktu').classList.remove('lewat');
    const hasil = await new Promise(res => { jawabSoal = (o2, el) => { jawabSoal = null; res({o: o2, el}); }; });
    if (kabur) break;
    const benar = hasil.o.b; catatJawab(benar);
    $('tOpsi').querySelectorAll('button').forEach(b => { b.disabled = true; const op = q.opsi.find(x => x.t === b.textContent); if (op && op.b) b.classList.add('benar'); });
    if (benar) {
      hasil.el && hasil.el.classList.add('benar'); efek.benar(); combo++; S.st.combo = Math.max(S.st.combo, combo); if (combo >= 3 && !jurusAktif) jurusSiap = true;
      const kritis = tSoal <= tKritis; let dmg = serang() + acakInt(0, 3); if (kritis) dmg = Math.round(dmg * 1.8); const jurus = jurusAktif; if (jurus) { dmg *= 3; jurusAktif = false; jurusSiap = false; combo = 0; }
      await seranganHero(dmg, kritis, jurus);
    } else {
      hasil.el && hasil.el.classList.add('salah'); efek.salah(); combo = 0; jurusSiap = jurusAktif ? jurusSiap : false;
      teksTerbang('Jawaban: ' + q.jaw, hero.position, '', 3.2);
      await tunggu(600); await seranganMonster(m);
    }
    tulisJurus(); await tunggu(500);
  }
  $('tarung').hidden = true; jawabSoal = null; window.__ulangSuara = null;
  if (kabur) { teksTerbang('Kabur!', hero.position, '', 2.4); await selesaiTarung(2.5); return; }
  if (m.hp <= 0) await menang(m); else await kalah(m);
}
// geser fokus kamera supaya pahlawan & monster tidak tertutup panel soal
function aturFokusTarung(hx, hz, op) {
  const cy = Math.cos(P.yaw), sy = Math.sin(P.yaw), lebar = innerWidth > 700 && innerWidth / innerHeight >= 1;
  const bos = lawan && lawan.J.boss; jarakTuju = (bos ? (lawan.jenis === 'raja' ? 20 : 15) : 11) * (tegak() ? 1.25 : 1);
  const geserKanan = lebar ? jarakTuju * .2 : 0, geserBawah = lebar ? jarakTuju * .05 : jarakTuju * .13;
  fokusTuju.set((hx + op.x) / 2 + cy * geserKanan + sy * geserBawah, 0, (hz + op.z) / 2 - sy * geserKanan + cy * geserBawah);
}
async function seranganHero(dmg, kritis, jurus) {
  const o = lawan.mesh, a = hero.userData.posTarung.clone(), ke = a.clone().lerp(o.position, .55);
  setMode(hero, 'tunjuk'); await animasi(.18, e => hero.position.lerpVectors(a, ke, e));
  if (jurus) { konfeti(o.position.clone().setY(1.6), ['#ffd43b', '#fab005', '#ffffff', '#7048e8'], 90); efek.menang(); }
  kilatkan(o, jurus ? '#ffd43b' : '#ffffff'); goyang(o, .4); efek.pop(); lawan.hp -= dmg; tulisLawan();
  teksTerbang((jurus ? '⚡ ' : kritis ? 'KRITIS! ' : '') + dmg, o.position, jurus ? 'besar' : kritis ? 'kritis' : '', lawan.J.boss ? 4 : 2);
  await animasi(.25, e => hero.position.lerpVectors(ke, a, e)); setMode(hero, 'diam');
  if (lawan === raja && lawan.hp > 0 && lawan.hp < lawan.J.hp / 2 && !lawan.marah) { lawan.marah = true; await tunggu(300); banner('😡 Raja Galat marah!', 'Serangannya makin kuat'); }
}
async function seranganMonster(m) {
  const o = m.mesh, a = o.position.clone(), ke = a.clone().lerp(hero.position, .45);
  await animasi(.2, e => o.position.lerpVectors(a, ke, e));
  const dmg = Math.max(1, m.J.atk + (m.marah ? 4 : 0) + acakInt(-1, 2) - tahan()); S.hp = Math.max(0, S.hp - dmg);
  kilatkan(hero, '#ff0000'); setMode(hero, 'geleng', .8); teksTerbang('-' + dmg, hero.position, 'sakit', 2.4); efek.salah(); tulisHud();
  await animasi(.25, e => o.position.lerpVectors(ke, a, e)); o.position.y = 0;
}
async function menang(m) {
  const o = m.mesh; efek.menang(); konfeti(o.position.clone().setY(1.5), undefined, m.J.boss ? 120 : 50);
  await animasi(.5, e => { o.scale.setScalar((m.J.boss ? (m.jenis === 'raja' ? 1.5 : 1.25) : 1) * (1 - e)); o.rotation.y += .3; });
  o.visible = false; o.scale.setScalar(m.J.boss ? (m.jenis === 'raja' ? 1.5 : 1.25) : 1); m.hidup = false; m.muncul = 25; S.st.monster++;
  tambahUang(m.J.uang); teksTerbang('+' + rupiah(m.J.uang), o.position, 'kritis', 1.5); setMode(hero, 'senang', 1.6);
  await tambahXp(m.J.xp);
  if (m.jenis === 'slime' && S.Q === 1) { S.slime++; tulisMisi(); if (S.slime >= 3) aturMisi(2); }
  if (m === golem) { S.golem = true; await selesaiTarung(0, true); MODE = 'dialog'; await bukaGerbang(); await dialog('Mbah Wiryo (dari jauh)', 'Gerbang benteng terbuka! Raja Galat menunggu di dalam. Jangan lupa minum jamu kalau darahmu sedikit!'); aturMisi(6); MODE = 'jelajah'; $('joy').hidden = false; return; }
  if (m === raja) { S.raja = true; await selesaiTarung(0, true); MODE = 'dialog'; await akhirCerita(); return; }
  await selesaiTarung(1.5);
}
async function kalah(m) {
  S.st.kalah++; setMode(hero, 'geleng', 1.2); await tunggu(600);
  await dialog(heroDef.nama, 'Aduh... aku pingsan. Tapi aku tidak menyerah!');
  m.hp = m.J.hp; m.marah = false; aturMusik(MUSIK_JELAJAH);
  hero.position.set(0, 0, 18.5); S.hp = maxHp(); tulisHud();
  MODE = 'dialog'; await dialog('Pak Lurah', 'Kamu kami bawa pulang ke desa dan sudah sembuh. Latihan lawan monster kecil dulu supaya naik level, lalu coba lagi!');
  await selesaiTarung(3);
}
async function selesaiTarung(kebalDetik, tahanMode) {
  lawan = null; document.body.classList.remove('tarung'); jarakTuju = tegak() ? 27 : 18; aturMusik(MUSIK_JELAJAH); kebal = kebalDetik; simpan();
  if (!tahanMode) { MODE = 'jelajah'; $('joy').hidden = false; }
}
async function bukaGerbang() {
  kamManual = true; fokusTuju.set(0, 0, -29); efek.wus();
  await animasi(1.4, e => pintuBenteng.forEach((p, i) => { p.position.x = (i ? 1 : -1) * (.8 + 1.4 * e); }));
  DUNIA.gerbang = true; efek.bintang(); await tunggu(500); kamManual = false;
}
async function akhirCerita() {
  const k = new THREE.Group(); const kr = new THREE.Mesh(new THREE.OctahedronGeometry(.7), new THREE.MeshStandardMaterial({color: '#74c0fc', emissive: '#1971c2', emissiveIntensity: .6, roughness: .1})); k.add(kr);
  k.position.copy(raja.mesh.position).setY(1.5); P.sc.add(k); efek.kilau();
  await animasi(1.2, e => { k.position.y = 1.5 + e * 1.5; k.rotation.y = e * 8; });
  await terbangKe(k, hero.position.clone().setY(2.6), .8, 1); konfeti(hero.position.clone().setY(2.5), undefined, 140); efek.menang(); setMode(hero, 'senang', 3);
  await percakapan(heroDef.nama, ['Kristal Angka berhasil kurebut kembali!']);
  P.sc.remove(k); aturMisi(7); simpan();
  bukaKartu(true);
}

// ===================================================================
// WARUNG: bayar dengan uang pas
// ===================================================================
const BARANG = [
  {id: 'jamu', ikon: '🧪', nama: 'Jamu Sehat', ket: 'Memulihkan 35 ❤', harga: () => 2500},
  {id: 'perisai', ikon: '🛡️', nama: 'Perisai Rotan', ket: 'Serangan monster berkurang 3', harga: () => 7500, sekali: true},
  {id: 'esdawet', ikon: '🥤', nama: 'Es Dawet', ket: 'Darah langsung penuh', harga: () => 4000},
];
const UANG_PECAH = [{n: 500, w: '#ced4da'}, {n: 1000, w: '#d8f5a2'}, {n: 2000, w: '#a5d8ff'}, {n: 5000, w: '#ffd8a8'}, {n: 10000, w: '#d0bfff'}];
function bukaToko() {
  return new Promise(res => {
    const gambar = () => {
      $('tokoUang').textContent = rupiah(S.uang); $('tokoBayar').hidden = true; $('tokoDaftar').hidden = false;
      $('tokoDaftar').innerHTML = BARANG.map(b => { const punya = b.sekali && S[b.id]; return `<div class="barang"><b>${b.ikon}</b><div><strong>${b.nama}</strong><br>${b.ket}<br><span style="color:#e8590c;font-weight:800">${rupiah(b.harga())}</span></div><button data-id="${b.id}" ${punya || S.uang < b.harga() ? 'disabled' : ''}>${punya ? 'Sudah punya' : 'Beli'}</button></div>`; }).join('');
      $('tokoDaftar').querySelectorAll('button').forEach(el => el.onclick = () => bayar(BARANG.find(b => b.id === el.dataset.id)));
    };
    const bayar = b => {
      efek.ketuk(); let dibayar = 0; const harga = b.harga();
      $('tokoDaftar').hidden = true; $('tokoBayar').hidden = false; $('tokoHarga').innerHTML = `${b.ikon} ${b.nama}: <b>${rupiah(harga)}</b><br><small>Ketuk uang sampai jumlahnya PAS</small>`;
      const tulis = () => { $('tokoDibayar').innerHTML = `Dibayar: <b>${rupiah(dibayar)}</b>`; $('bTokoOk').disabled = dibayar !== harga; };
      $('tokoUangan').innerHTML = UANG_PECAH.map(u => `<button data-n="${u.n}" style="background:${u.w}">${rupiah(u.n)}</button>`).join('');
      $('tokoUangan').querySelectorAll('button').forEach(el => el.onclick = () => { dibayar += +el.dataset.n; efek.hitung(dibayar / 500 % 12); if (dibayar > harga) { efek.salah(); $('tokoDibayar').innerHTML = `Kelebihan! ${rupiah(dibayar)} lebih dari ${rupiah(harga)}`; dibayar = 0; $('bTokoOk').disabled = true; return; } tulis(); });
      $('bTokoUlang').onclick = () => { dibayar = 0; tulis(); };
      $('bTokoOk').onclick = () => { if (dibayar !== harga) return; S.uang -= harga; catatJawab(true); efek.benar();
        if (b.id === 'jamu') S.jamu++; else if (b.id === 'perisai') S.perisai = true; else if (b.id === 'esdawet') { S.hp = maxHp(); }
        tulisHud(); simpan(); banner(b.ikon + ' ' + b.nama, 'Uang pas, terima kasih!'); gambar(); };
      tulis();
    };
    $('bTokoTutup').onclick = () => { $('layarToko').hidden = true; res(); };
    gambar(); $('layarToko').hidden = false;
  });
}

// ===================================================================
// TAS & KARTU PETUALANG (bisa disimpan sebagai gambar)
// ===================================================================
function bukaTas() {
  if (MODE !== 'jelajah') return; MODE = 'menu';
  $('tasIsi').innerHTML = `${heroDef.ikon} ${heroDef.nama} · Level ${S.lv}<br>❤ ${S.hp}/${maxHp()} · ⚔ Serangan ${serang()} · 🛡 Tahan ${tahan()}<br>💰 ${rupiah(S.uang)} · 🧪 Jamu ×${S.jamu}<br>${S.keris ? '⚔ Keris Angka' : '🗡 Pedang Kayu'}${S.perisai ? ' · 🛡 Perisai Rotan' : ''}<br>✅ Soal benar ${S.st.benar}/${S.st.jawab} · 👾 Monster ${S.st.monster}`;
  $('bTasJamu').disabled = !S.jamu || S.hp >= maxHp(); $('layarTas').hidden = false;
}
$('bTasJamu').onclick = () => { minumJamu(); $('layarTas').hidden = true; MODE = 'jelajah'; };
$('bTasTutup').onclick = () => { $('layarTas').hidden = true; MODE = 'jelajah'; };
$('bTasKartu').onclick = () => { $('layarTas').hidden = true; bukaKartu(false); };
$('bTasFase').onclick = () => { $('layarTas').hidden = true; simpan(); keMenuFase(); };
function gambarKartu() {
  const c = $('kartuKanvas'), x = c.getContext('2d'), W = c.width, H = c.height;
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5f3dc4'); g.addColorStop(1, '#1f2a5a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = '#fffaf0'; x.beginPath(); x.roundRect(40, 40, W - 80, H - 80, 28); x.fill();
  x.textAlign = 'center'; x.fillStyle = '#7048e8'; x.font = '800 30px "Baloo 2", sans-serif'; x.fillText('🧾 KARTU PETUALANG', W / 2, 100);
  x.fillStyle = '#212529'; x.font = '800 46px "Baloo 2", sans-serif'; x.fillText('LEGENDA PULAU ANGKA', W / 2, 152);
  x.font = '90px sans-serif'; x.fillText(heroDef.ikon, W / 2, 262);
  x.font = '800 44px "Baloo 2", sans-serif'; x.fillText(heroDef.nama + '  ·  Level ' + S.lv, W / 2, 330);
  x.font = '700 24px "Baloo 2", sans-serif'; x.fillStyle = '#868e96'; x.fillText(FASE[FASE_NOW].nama + ' (' + FASE[FASE_NOW].kelas + ')  ·  ' + new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}), W / 2, 368);
  x.setLineDash([10, 8]); x.strokeStyle = '#ced4da'; x.lineWidth = 3; x.beginPath(); x.moveTo(70, 395); x.lineTo(W - 70, 395); x.stroke(); x.setLineDash([]);
  const akurasi = S.st.jawab ? Math.round(S.st.benar / S.st.jawab * 100) : 0; const mnt = Math.max(1, Math.round((S.st.detik) / 60));
  const baris = [['✅ Soal benar', `${S.st.benar} / ${S.st.jawab}`], ['🎯 Ketepatan', akurasi + '%'], ['⚡ Combo terbaik', S.st.combo + 'x'], ['👾 Monster dikalahkan', S.st.monster], ['💰 Rupiah terkumpul', rupiah(S.uang)], ['⏱ Lama bermain', mnt + ' menit'], ['📜 Misi', S.raja ? 'Raja Galat kalah! 👑' : teksMisi()]];
  x.textAlign = 'left'; baris.forEach(([a, b], i) => { const y = 445 + i * 56; x.fillStyle = '#495057'; x.font = '700 27px "Baloo 2", sans-serif'; x.fillText(a, 80, y); x.textAlign = 'right'; x.fillStyle = '#212529'; x.font = '800 27px "Baloo 2", sans-serif'; x.fillText(String(b).slice(0, 26), W - 80, y); x.textAlign = 'left'; });
  const bt = akurasi >= 85 ? 3 : akurasi >= 60 ? 2 : 1; x.textAlign = 'center'; x.font = '64px sans-serif'; x.fillStyle = '#fab005'; x.fillText('★'.repeat(bt) + '☆'.repeat(3 - bt), W / 2, 870);
  x.fillStyle = '#e8590c'; x.font = '800 22px "Baloo 2", sans-serif'; x.fillText('Supported by www.willoapparel.com', W / 2, 905);
}
function bukaKartu(tamat) {
  MODE = 'menu'; $('kartuJudul').textContent = tamat ? '🏆 Pulau Angka Selamat!' : '🧾 Kartu Petualang'; gambarKartu(); $('layarKartu').hidden = false; if (tamat) efek.menang();
}
$('bKartuUnduh').onclick = () => { const a = document.createElement('a'); a.href = $('kartuKanvas').toDataURL('image/png'); a.download = `kartu-petualang-${heroDef.nama.toLowerCase()}.png`; a.click(); };
$('bKartuTutup').onclick = () => { $('layarKartu').hidden = true; MODE = 'jelajah'; $('joy').hidden = false; };

// ===================================================================
// MENU: fase -> lanjut / pahlawan -> main
// ===================================================================
document.querySelector('.atas').insertBefore($('bTas'), $('bGuru'));
$('bTas').onclick = bukaTas;
function keMenuFase() {
  MODE = 'menu'; $('hud').hidden = true; $('joy').hidden = true; $('bAksi').hidden = true; $('bTas').hidden = true; $('kompas').hidden = true;
  const j = {}; soalSah().forEach(s => { j[s.fase] = (j[s.fase] || 0) + 1; }); ['A', 'B', 'C'].forEach(f => { j[f] = j[f] || 10; });
  pilihFase(j, f => { FASE_NOW = f; siapkanSoal(); const sv = muat();
    if (sv) { $('lanjutInfo').textContent = `${(HERO.find(h => h.id === sv.hero) || HERO[0]).nama} · Level ${sv.lv} · ${MISI[sv.Q] ? (typeof MISI[sv.Q].t === 'string' ? MISI[sv.Q].t : 'misi berjalan') : ''}`; $('layarLanjut').hidden = false;
      $('bLanjut').onclick = () => { $('layarLanjut').hidden = true; mulaiMain(sv); }; $('bBaru').onclick = () => { $('layarLanjut').hidden = true; pilihHero(); }; }
    else pilihHero(); });
}
function pilihHero() {
  $('heroDaftar').innerHTML = HERO.map((h, i) => `<button class="heroK" data-i="${i}" style="--w:${h.w}"><b>${h.ikon}</b><span>${h.nama}</span></button>`).join('');
  $('layarHero').hidden = false;
  $('heroDaftar').querySelectorAll('.heroK').forEach(el => el.onclick = () => { efek.ketuk(); $('layarHero').hidden = true; heroDef = HERO[+el.dataset.i]; mulaiMain(null); });
}
async function mulaiMain(sv) {
  if (sv) heroDef = HERO.find(h => h.id === sv.hero) || HERO[0];
  pasangHero(heroDef); S = sv || statusBaru(); S.hero = heroDef.id; if (S.hp <= 0) S.hp = maxHp();
  terapkanDunia(); tulisHud(); tulisMisi(); simpan();
  fokusKam.copy(hero.position); jarakKam = jarakTuju = tegak() ? 27 : 18;
  $('hud').hidden = false; $('bTas').hidden = false; MODE = 'dialog';
  if (!sv) await percakapan('Pencerita', ['Pulau Angka dulu damai dan semua orang pandai berhitung.', 'Suatu malam, Raja Galat mencuri Kristal Angka. Monster galat pun bermunculan!', `${heroDef.nama}, hanya kamu yang bisa menyelamatkan pulau. Gerakkan dengan joystick atau ketuk tanah. Ikuti panah kuning!`]);
  MODE = 'jelajah'; $('joy').hidden = false;
}

// ===================================================================
// PUTARAN
// ===================================================================
pembaru.push((dt, t) => {
  if (hero) { updateHero(dt); animasiKarakter(hero, dt); }
  npc.forEach(n => animasiKarakter(n.k, dt));
  if (hero) updateMonster(dt, t);
  if (S && MODE !== 'menu') S.st.detik += dt;
  updatePudar(dt); if (S) updateTanda(t);
  // saat bertarung, pohon/rumah di sekitar arena dibuat tembus pandang
  if (lawan) for (const o of _pudar) { const dx = o.position.x - fokusTuju.x, dz = o.position.z - fokusTuju.z; if (Math.hypot(dx, dz) < 4.5 + (o.userData.rPudar || 2)) { o.userData.op = .16; o.userData.mats.forEach(x => { x.opacity = .16; x.depthWrite = false; }); } }
  // kamera mengikuti
  if (hero) { if (MODE === 'jelajah' || MODE === 'dialog' || MODE === 'menu') { if (!lawan && !kamManual) fokusTuju.copy(hero.position); } }
  fokusKam.lerp(fokusTuju, Math.min(1, dt * 4)); jarakKam += (jarakTuju - jarakKam) * Math.min(1, dt * 3);
  const sud = THREE.MathUtils.degToRad(P.sudut), cy = Math.cos(P.yaw), sy = Math.sin(P.yaw);
  P.cam.position.set(fokusKam.x + sy * Math.cos(sud) * jarakKam, fokusKam.y + Math.sin(sud) * jarakKam, fokusKam.z + cy * Math.cos(sud) * jarakKam); P.cam.lookAt(fokusKam.x, fokusKam.y + .8, fokusKam.z);
  P.mt.position.set(fokusKam.x + 10, 22, fokusKam.z + 14); P.mt.target.position.copy(fokusKam);
  // waktu kritis
  if (MODE === 'tarung' && jawabSoal) { tSoal += dt; const sisa = Math.max(0, 1 - tSoal / tKritis); $('tWaktu').firstElementChild.style.width = sisa * 100 + '%'; if (!sisa) $('tWaktu').classList.add('lewat'); }
  awan.forEach(a => { a.position.x += dt * .35; if (a.position.x > 26) a.position.x = -26; });
  riak.forEach((r, i) => { r.position.x += dt * .6; if (r.position.x > 24) r.position.x = -24; });
  percik.forEach(p => { p.userData.f = (p.userData.f + dt * .9) % 1; const f = p.userData.f, a = p.id * 2.4; p.position.set(AIR.x + Math.cos(a) * f * .8, 1.4 + Math.sin(f * Math.PI) * .7 - f * .9, AIR.z + Math.sin(a) * f * .8); });
});
addEventListener('resize', () => { if (!lawan) jarakTuju = tegak() ? 27 : 18; });

// tampilan menu: kamera melayang di atas desa
{ pasangHero(HERO[0]); fokusKam.set(0, 0, 14); fokusTuju.set(0, 0, 14); jarakKam = jarakTuju = 24; setMode(hero, 'lambai'); }
loop();
layarMulai(DATA.judul || 'Legenda Pulau Angka', 'Kalahkan Raja Galat dengan kekuatan hitungan!', keMenuFase);
if (location.hash === '#uji') window.__uji = {get S() { return S; }, get MODE() { return MODE; }, hero: () => hero, monster, npc, mulaiTarung, bicara, jawab: i => { const b = $('tOpsi').querySelectorAll('button')[i]; b && b.click(); }, benar: () => { const bs = [...$('tOpsi').querySelectorAll('button')]; const q = bs.find(b => b.classList.contains('benar')); return bs; }, tp: (x, z) => hero.position.set(x, 0, z), P};

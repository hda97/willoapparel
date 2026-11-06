// Petualang Angka: Tupi si tupai memetik buah di kebun.
// Jenis soal: masukkan (taruh N buah ke keranjang), berapa (hitung buah), banding (mana lebih banyak), sedikit (mana lebih sedikit).
GURU.kolom = [
  {k: 'jenis', label: 'Jenis (masukkan/berapa/banding/sedikit)', contoh: 'berapa'},
  {k: 'angka', label: 'Angka', contoh: '5'},
  {k: 'angka2', label: 'Angka ke-2 (banding)', contoh: '3'},
  {k: 'buah', label: 'Buah (apel/jeruk/stroberi/pisang)', contoh: 'apel'},
];
GURU.pengaturan = [{k: 'urutan', label: 'Urutan soal', tipe: 'pilih', opsi: [['berurutan', 'Berurutan'], ['acak', 'Acak']]}];
GURU.terapkan = () => mulaiMain();
pasangGuru();

const KATA = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas', 'dua puluh'];
const sebut = n => KATA[n] || String(n);

siapPanggung({langit: '#ffe9c7', tanahWarna: '#a8d672', lebarArea: 10, dalamArea: 11, lebarTegak: 6.6, dalamTegak: 9.2});
P.sc.background = new THREE.Color('#cdeefd');
P.sc.add(tanahVoxel(36, 28, ['#a5d76e', '#9fd168']));
// petak tanah kebun
{ const v = new Vox(.5); for (let x = -11; x < 11; x++) for (let z = -8; z < 0; z++) v.set(x, 0, z, variasi((x + z) % 2 ? '#b98a5a' : '#b3845a', .03)); const m = v.mesh({bulat: false}); m.position.y = -.47; m.castShadow = false; P.sc.add(m); }

// ---------- model buah voxel ----------
function bola(v, r, warna, cy = 0) { for (let x = -r; x <= r; x++) for (let y = -r; y <= r; y++) for (let z = -r; z <= r; z++) if (x * x + y * y + z * z <= r * r + r * .6) v.set(x, y + cy, z, variasi(warna, .05)); }
const BUAH = {
  apel: () => { const v = new Vox(.075); bola(v, 3, '#e03131', 3); v.set(0, 6, 0, '#6b4423'); v.set(0, 7, 0, '#6b4423'); v.set(1, 7, 0, '#51cf66'); v.set(2, 7, 0, '#40c057'); v.set(-1, 4, 3, '#ff8787'); return v; },
  jeruk: () => { const v = new Vox(.075); bola(v, 3, '#fd7e14', 3); v.set(0, 6, 0, '#2f9e44'); v.set(1, 6, 0, '#40c057'); v.set(-1, 4, 3, '#ffc078'); return v; },
  stroberi: () => { const v = new Vox(.075); for (let y = 0; y < 6; y++) { const r = Math.min(3, Math.floor(y * .7) + 1); for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) if (x * x + z * z <= r * r) v.set(x, y, z, (x + y + z) % 3 === 0 && (x * x + z * z) >= (r - 1) * (r - 1) ? '#ffe066' : variasi('#e8364f', .05)); } v.box(-2, 6, -2, 5, 1, 5, '#2f9e44'); v.set(0, 7, 0, '#2b8a3e'); return v; },
  pisang: () => { const v = new Vox(.075); for (let i = -4; i <= 4; i++) { const y = Math.round(i * i / 5); v.box(i, y + 1, -1, 1, 2, 2, variasi('#ffd43b', .04)); } v.set(-5, 5, 0, '#5c3d1e'); v.set(5, 5, 0, '#5c3d1e'); return v; },
};
const NAMA_BUAH = {apel: 'apel', jeruk: 'jeruk', stroberi: 'stroberi', pisang: 'pisang'};
function buatBuah(jenis, skala = 1.35) { const g = new THREE.Group(); const m = (BUAH[jenis] || BUAH.apel)().mesh(); m.scale.setScalar(skala); g.add(m); g.userData.jenis = jenis; return g; }

// pohon buah di belakang
[[-6.5, -6.6], [-2.2, -7.2], [2.4, -7], [6.6, -6.4], [-9.5, -2], [9.5, -1.5]].forEach(([x, z], i) => {
  const p = new THREE.Group(); p.add(pohonVoxel(5, pilih(['#43a047', '#4caf50', '#388e3c']), '#8b5a2b'));
  for (let k = 0; k < 6; k++) { const b = buatBuah(['apel', 'jeruk', 'apel', 'pisang'][i % 4], .8); b.position.set(acak(-.6, .6), acak(1.3, 2.1), .65); p.add(b); }
  p.position.set(x, 0, z); P.sc.add(p);
});
// pagar kayu
{ const v = new Vox(.12); for (let x = -80; x < 80; x++) { if (x % 6 === 0) v.box(x, 0, 0, 1, 7, 1, '#a0703e'); } v.box(-80, 4, 0, 160, 1, 1, '#b8834a'); v.box(-80, 2, 0, 160, 1, 1, '#b8834a'); const m = v.mesh(); m.position.set(0, 0, -9.3); P.sc.add(m); }
const awan = [awanVoxel(), awanVoxel()]; awan.forEach((a, i) => { a.position.set(-8 + i * 12, 7.5, -12); P.sc.add(a); });

// keranjang anyaman
function buatKeranjang(warna = '#b5763c') {
  const v = new Vox(.1); const r = 7;
  for (let y = 0; y < 6; y++) for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) { const d = x * x + z * z; const rr = y === 0 ? r - 1 : r; if (d <= rr * rr && (y === 0 || d >= (rr - 1) * (rr - 1))) v.set(x, y, z, (x + y) % 2 ? warna : '#8f5a2a'); }
  for (let a = 0; a <= 12; a++) { const t = a / 12 * Math.PI; v.set(Math.round(Math.cos(t) * 6), 6 + Math.round(Math.sin(t) * 5), 0, '#8f5a2a'); }
  return v.mesh();
}
// ---------- Tupi si tupai ----------
function buatTupai() {
  const C = '#c8742f', T = '#e0955a', K = '#f6e2c0';
  const g = new THREE.Group();
  const kp = new Vox(.1); kp.box(-4, 0, -3, 8, 7, 7, () => variasi(C, .03));
  kp.box(-2, 0, 4, 4, 3, 1, K); kp.box(-1, 2, 5, 2, 1, 1, '#3b2314');
  kp.set(-3, 4, 4, '#ffffff'); kp.set(-2, 4, 4, '#1b1b1b'); kp.set(-3, 3, 4, '#1b1b1b'); kp.set(-2, 3, 4, '#1b1b1b');
  kp.set(1, 4, 4, '#ffffff'); kp.set(2, 4, 4, '#1b1b1b'); kp.set(1, 3, 4, '#1b1b1b'); kp.set(2, 3, 4, '#1b1b1b');
  kp.set(-4, 2, 4, '#f4a0a0'); kp.set(3, 2, 4, '#f4a0a0');
  kp.box(-4, 7, -1, 2, 2, 2, C); kp.set(-4, 9, 0, T); kp.box(2, 7, -1, 2, 2, 2, C); kp.set(3, 9, 0, T);
  const kepala = new THREE.Group(); kepala.add(kp.mesh()); kepala.position.y = .95;
  const bd = new Vox(.1); bd.box(-3, 0, -3, 6, 7, 6, () => variasi(C, .03)); bd.box(-2, 1, 2, 4, 5, 1, K);
  const badan = new THREE.Group(); badan.add(bd.mesh()); badan.position.y = .25;
  const ek = new Vox(.1); [[0, 0, 4, 3], [0, 2, 3, 4], [0, 5, 3, 5], [0, 9, 4, 3], [0, 11, 3, 2]].forEach(([, y, w, h], i) => null);
  ek.box(-2, 0, -5, 4, 3, 2, T); ek.box(-2, 2, -8, 4, 4, 3, T); ek.box(-2, 5, -9, 4, 5, 3, T); ek.box(-2, 9, -8, 4, 3, 3, T); ek.box(-2, 11, -6, 4, 2, 3, '#eab07a');
  const ekor = new THREE.Group(); ekor.add(ek.mesh()); ekor.position.y = .3;
  const kaki = () => { const v = new Vox(.1); v.box(0, -2, -1, 2, 2, 3, '#a85d24'); const gg = new THREE.Group(); gg.add(v.mesh()); gg.position.y = .25; return gg; };
  const lengan = () => { const v = new Vox(.1); v.box(0, -3, -1, 2, 3, 2, '#a85d24'); const gg = new THREE.Group(); gg.add(v.mesh()); gg.position.y = .85; return gg; };
  const lKiri = lengan(), lKanan = lengan(), kKiri = kaki(), kKanan = kaki();
  lKiri.position.x = -.5; lKanan.position.x = .3; kKiri.position.x = -.3; kKanan.position.x = .1;
  const tubuh = new THREE.Group(); tubuh.add(kepala, badan, ekor, lKiri, lKanan, kKiri, kKanan); g.add(tubuh); g.scale.setScalar(1.25);
  g.userData = {kepala, badan, lKiri, lKanan, kKiri, kKanan, tubuh, ekor, mode: 'diam', t: 0, tMode: 0};
  return g;
}
const tupi = buatTupai(); P.sc.add(tupi);
const posTupi = () => tegak() ? {x: -1.6, z: 2.4} : {x: -2.6, z: 1.6};
tupi.position.set(posTupi().x, 0, posTupi().z);
pembaru.push((dt, t) => { gerakKarakter(tupi, dt); animasiKarakter(tupi, dt); tupi.userData.ekor.rotation.x = Math.sin(t * 3) * .12; awan.forEach(a => { a.position.x += dt * .3; if (a.position.x > 16) a.position.x = -16; }); });

// ---------- data soal ----------
const soalSah = () => (DATA.soal || []).map(s => ({jenis: String(s.jenis || 'berapa').trim().toLowerCase(), angka: Math.max(1, Math.min(20, parseInt(s.angka) || 1)), angka2: Math.max(1, Math.min(20, parseInt(s.angka2) || 1)), buah: BUAH[String(s.buah || '').trim().toLowerCase()] ? String(s.buah).trim().toLowerCase() : 'apel'}));
let urut = [], idx = 0, skor = 0, N = 0;
function mulaiMain() { urut = soalSah(); if (DATA.urutan === 'acak') urut = kocok(urut); N = urut.length; idx = 0; skor = 0; aturBintang(0, N); if (!N) { tulisGelembung('Belum ada soal. Buka Mode Guru.'); return; } putaran(); }
async function putaran() {
  bersihRonde(); kunci = true; P.seret = null; window.__ulangSuara = null;
  if (idx >= N) { setMode(tupi, 'senang', 3); konfeti(new THREE.Vector3(0, 2, 0), undefined, 80); await ucap('Hore! Tupi senang sekali, semua buah sudah dihitung!'); layarSelesai(skor, N, mulaiMain); return; }
  const p = posTupi(); await jalanKe(tupi, p.x, p.z); tupi.rotation.y = 0;
  const q = urut[idx];
  if (q.jenis === 'masukkan') return rondeMasukkan(q);
  if (q.jenis === 'banding' || q.jenis === 'sedikit') return rondeBanding(q);
  return rondeBerapa(q);
}
async function benar(teks, pos) { efek.benar(); setMode(tupi, 'senang', 1.8); konfeti(pos || new THREE.Vector3(0, 1.5, 0)); skor++; aturBintang(skor, N); await ucap(teks); idx++; putaran(); }
// angka voxel melayang
function papanAngka(n, warna = '#e8590c') { const t = teksVoxel(String(n), warna, .16, 2); t.rotation.x = -.35; return t; }

// --- 1. Masukkan N buah ke keranjang (ketuk atau seret) ---
async function rondeMasukkan(q) {
  const kr = tambahRonde(buatKeranjang()); const posK = tegak() ? {x: 1.2, z: 2.3} : {x: 0, z: 1.6}; kr.position.set(posK.x, 0, posK.z);
  let isi = 0, papan = null; const segarPapan = () => { if (papan) kr.remove(papan); papan = papanAngka(isi + '/' + q.angka.toString().replace(/.*/, q.angka), '#e8590c'); kr.remove(papan); papan = papanAngka(String(isi), isi === q.angka ? '#2f9e44' : '#e8590c'); papan.position.set(0, 1.25, 0); kr.add(papan); };
  segarPapan();
  const total = Math.min(20, q.angka + acakInt(2, 3)); const buah = [];
  const lebar = tegak() ? 5.6 : 8.4, kol = tegak() ? 4 : 6;
  for (let i = 0; i < total; i++) {
    const b = buatBuah(q.buah); const c = i % kol, r = Math.floor(i / kol);
    b.position.set((c - (kol - 1) / 2) * (lebar / kol) + acak(-.15, .15), 0, -1.2 - r * 1.05 + acak(-.12, .12)); b.userData.asal = b.position.clone();
    tambahRonde(b); muncul(b); buah.push(b); daftarKetuk(b, o => masuk(o));
  }
  const kePos = () => new THREE.Vector3(posK.x + acak(-.3, .3), .45 + Math.min(isi, 8) * .03, posK.z + acak(-.25, .25));
  const masuk = async (o) => {
    if (o.userData.masuk) return; o.userData.masuk = true; hapusKetuk(o); kunci = true;
    await terbangKe(o, kePos(), .45, 1.2); isi++; efek.hitung(isi); segarPapan(); lompat(kr, .15, .25);
    ucap(sebut(isi), {tampil: false, cepat: 1.05});
    if (isi === q.angka) { P.seret = null; buah.forEach(b => hapusKetuk(b)); await tunggu(500); await benar(`${pilih(PUJIAN)} Ada ${sebut(q.angka)} ${NAMA_BUAH[q.buah]} di keranjang!`, kr.position.clone().setY(1.4)); }
    else kunci = false;
  };
  // seret buah ke keranjang
  let pegang = null;
  P.seret = {
    mulai: o => { if (o.userData.asal && !o.userData.masuk) pegang = o; },
    gerak: e => { if (!pegang) return; const t = titikDiBidang(e, .6); if (t) pegang.position.set(t.x, .6, t.z); },
    lepas: (e, pindah) => { if (!pegang || pindah < 18) { pegang = null; return false; } const o = pegang; pegang = null;
      if (o.position.distanceTo(new THREE.Vector3(posK.x, .6, posK.z)) < 1.4) masuk(o); else animasi(.3, (k) => o.position.lerp(o.userData.asal, k)); return true; },
  };
  await ucap(`Ayo masukkan ${sebut(q.angka)} ${NAMA_BUAH[q.buah]} ke keranjang!`); kunci = false;
  window.__ulangSuara = null;
}

// --- 2. Ada berapa buah? ---
async function rondeBerapa(q) {
  const kol = 5, lebar = tegak() ? 5 : 6.5; const buah = [];
  for (let i = 0; i < q.angka; i++) {
    const b = buatBuah(q.buah); const c = i % kol, r = Math.floor(i / kol), baris = Math.ceil(q.angka / kol);
    b.position.set((c - (kol - 1) / 2) * (lebar / kol), 0, -1 - (baris - 1 - r) * 1.05 + (tegak() ? 0 : 0)); tambahRonde(b); muncul(b); buah.push(b);
    let sudah = false; daftarKetuk(b, o => { if (sudah) return; sudah = true; hitung++; efek.hitung(hitung); lompat(o, .5, .4); ucap(sebut(hitung), {tampil: false, cepat: 1.05}); const t = papanAngka(hitung, '#1c7ed6'); t.scale.setScalar(.55); t.position.set(0, 1, 0); o.add(t); });
  }
  let hitung = 0;
  const pil = new Set([q.angka]); while (pil.size < 3) { const d = q.angka + pilih([-2, -1, 1, 2]); if (d >= 1 && d <= 20) pil.add(d); }
  pilihanUI(kocok([...pil]).map(n => ({html: String(n), n})), async (d, btn) => {
    if (d.n === q.angka) { kunci = true; btn.classList.add('benar'); await benar(`${pilih(PUJIAN)} Ada ${sebut(q.angka)} ${NAMA_BUAH[q.buah]}!`); }
    else { btn.classList.remove('salah'); void btn.offsetWidth; btn.classList.add('salah'); efek.salah(); setMode(tupi, 'geleng', 1.2); kunci = true; await ucap(`Bukan ${sebut(d.n)}. Ketuk buahnya satu per satu sambil menghitung, ya!`); kunci = false; }
  });
  await ucap(`Ada berapa ${NAMA_BUAH[q.buah]}? Ayo hitung!`); kunci = false;
}

// --- 3. Mana yang lebih banyak / lebih sedikit? ---
async function rondeBanding(q) {
  const sedikit = q.jenis === 'sedikit'; let a = q.angka, b = q.angka2; if (a === b) b = a + 1;
  const jarak = tegak() ? 1.55 : 2.6;
  const piring = [a, b].map((n, i) => {
    const g = new THREE.Group(); const v = new Vox(.12); for (let x = -9; x < 9; x++) for (let z = -7; z < 7; z++) if ((x + .5) ** 2 / 81 + (z + .5) ** 2 / 49 <= 1) v.set(x, 0, z, (x + .5) ** 2 / 81 + (z + .5) ** 2 / 49 > .7 ? '#74c0fc' : '#e7f5ff');
    g.add(v.mesh()); const kol = Math.min(4, Math.ceil(Math.sqrt(n * 1.4)));
    for (let k = 0; k < n; k++) { const f = buatBuah(q.buah, 1); const c = k % kol, r = Math.floor(k / kol); f.position.set((c - (kol - 1) / 2) * .48, .12, (r - (Math.ceil(n / kol) - 1) / 2) * .45); g.add(f); }
    g.position.set((i ? 1 : -1) * jarak, 0, -.9); g.userData.n = n; tambahRonde(g); muncul(g);
    daftarKetuk(g, o => jawab(o)); return g;
  });
  const benarN = sedikit ? Math.min(a, b) : Math.max(a, b);
  const jawab = async (o) => {
    kunci = true; await jalanKe(tupi, o.position.x * .6, o.position.z + 2); tupi.rotation.y = Math.PI; setMode(tupi, 'tunjuk', .6);
    if (o.userData.n === benarN) { lompat(o, .3, .4); await benar(`${pilih(PUJIAN)} ${sebut(o.userData.n)} lebih ${sedikit ? 'sedikit' : 'banyak'} dari ${sebut(o.userData.n === a ? b : a)}.`, o.position.clone().setY(1.2)); }
    else { efek.salah(); setMode(tupi, 'geleng', 1.2); goyang(o); await ucap(`Coba hitung lagi. Piring ini ada ${sebut(o.userData.n)}. ${pilih(SEMANGAT)}`); kunci = false; }
  };
  await ucap(`Piring mana yang ${NAMA_BUAH[q.buah]}nya lebih ${sedikit ? 'sedikit' : 'banyak'}?`); kunci = false;
}

aturBintang(0, soalSah().length); tulisGelembung('Ketuk Main untuk mulai');
setMode(tupi, 'lambai'); loop();
layarMulai(DATA.judul || 'Petualang Angka', 'Bantu Tupi si tupai memetik buah!', mulaiMain);

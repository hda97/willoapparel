// Petualang Angka: Kiko si kucing memetik buah di kebun.
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
aturMusik({bpm: 124, nada: 65, alat: 'pluck', progresi: [0, 3, 4, 0], benih: 23});

const KATA = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas', 'dua puluh'];
const sebut = n => KATA[n] || String(n);

siapPanggung({langit: '#ffe9c7', tanahWarna: '#a8d672', lebarArea: 10, dalamArea: 11, lebarTegak: 6.6, dalamTegak: 9.2});
P.sc.background = new THREE.Color('#cdeefd');
P.sc.add(tanahVoxel(36, 28, ['#a5d76e', '#9fd168']));
// petak tanah kebun
{ const m = lempeng(22, 8, '#b98a5a', .03, .1); m.position.z = -4; P.sc.add(m); }

// ---------- model buah voxel ----------
const BUAH = {
  apel: () => { const g = new THREE.Group(); tambah(g, .5, .46, .5, 0, .23, 0, '#e03131', .17); tambah(g, .05, .14, .05, 0, .52, 0, '#6b4423', .02); tambah(g, .16, .04, .09, .09, .55, 0, '#40c057', .02).rotation.z = .4; tambah(g, .1, .1, .03, -.12, .32, .25, '#ff8787', .02); return g; },
  jeruk: () => { const g = new THREE.Group(); tambah(g, .5, .48, .5, 0, .24, 0, '#fd7e14', .2); tambah(g, .14, .04, .08, .05, .5, 0, '#2f9e44', .02); tambah(g, .1, .1, .03, -.12, .32, .25, '#ffc078', .02); return g; },
  stroberi: () => { const g = new THREE.Group(); tambah(g, .3, .2, .3, 0, .1, 0, '#e8364f', .08); tambah(g, .44, .26, .44, 0, .3, 0, '#e8364f', .1); [[-.1, .3], [.08, .36], [.1, .2], [-.04, .14], [0, .4]].forEach(([x, y]) => tambah(g, .035, .035, .02, x, y, y < .22 ? .155 : .225, '#ffe066', .008)); tambah(g, .4, .05, .4, 0, .45, 0, '#2f9e44', .02); tambah(g, .05, .1, .05, 0, .52, 0, '#2b8a3e', .02); return g; },
  pisang: () => { const g = new THREE.Group(); for (let i = -2; i <= 2; i++) tambah(g, .16, .15, .17, i * .13, .1 + i * i * .03, 0, '#ffd43b', .06); tambah(g, .05, .05, .05, -.34, .27, 0, '#5c3d1e', .01); tambah(g, .05, .05, .05, .34, .27, 0, '#5c3d1e', .01); return g; },
};
const NAMA_BUAH = {apel: 'apel', jeruk: 'jeruk', stroberi: 'stroberi', pisang: 'pisang'};
function buatBuah(jenis, skala = 1.35) { const g = new THREE.Group(); const m = (BUAH[jenis] || BUAH.apel)(); m.scale.setScalar(skala); g.add(m); g.userData.jenis = jenis; return g; }

// pohon buah di belakang
[[-6.5, -6.6], [-2.2, -7.2], [2.4, -7], [6.6, -6.4], [-9.5, -2], [9.5, -1.5]].forEach(([x, z], i) => {
  const p = new THREE.Group(); p.add(pohonVoxel(5, pilih(['#43a047', '#4caf50', '#388e3c']), '#8b5a2b'));
  for (let k = 0; k < 6; k++) { const b = buatBuah(['apel', 'jeruk', 'apel', 'pisang'][i % 4], .8); b.position.set(acak(-.6, .6), acak(1.3, 2.1), .65); p.add(b); }
  p.position.set(x, 0, z); P.sc.add(p);
});
// pagar kayu
{ const g = new THREE.Group(); for (let x = -9.6; x <= 9.6; x += .72) tambah(g, .12, .84, .12, x, .42, 0, '#a0703e', .03); tambah(g, 19.4, .1, .08, 0, .54, .07, '#b8834a', .03); tambah(g, 19.4, .1, .08, 0, .3, .07, '#b8834a', .03); g.position.z = -9.3; P.sc.add(g); }
const awan = [awanVoxel(), awanVoxel()]; awan.forEach((a, i) => { a.position.set(-8 + i * 12, 7.5, -12); P.sc.add(a); });

// keranjang anyaman
function buatKeranjang(warna = '#b5763c') {
  const g = new THREE.Group(), W = 1.3, H = .55, D = 1.0, t = .1;
  tambah(g, W, t, D, 0, t / 2, 0, '#8f5a2a', .04); [-1, 1].forEach(s => { tambah(g, W, H, t, 0, H / 2, s * (D / 2 - t / 2), warna, .04); tambah(g, t, H, D, s * (W / 2 - t / 2), H / 2, 0, warna, .04); });
  [.16, .36].forEach(y => [-1, 1].forEach(s => tambah(g, W + .01, .05, .02, 0, y, s * (D / 2 + .005), '#8f5a2a', .01)));
  [-1, 1].forEach(s => tambah(g, .08, .45, .08, s * .58, H + .2, 0, '#8f5a2a', .03)); tambah(g, 1.24, .08, .08, 0, H + .43, 0, '#8f5a2a', .03);
  return g;
}
// ---------- Kiko si kucing (aset kucing Dunia Kotak, bulu krem) ----------
const tupi = buatKucing('krem', .62); P.sc.add(tupi); hadapDepan(tupi); P.tokoh = tupi;
const posTupi = () => tegak() ? {x: -1.6, z: 2.4} : {x: -2.6, z: 1.6};
tupi.position.set(posTupi().x, 0, posTupi().z);
pembaru.push((dt, t) => { gerakKarakter(tupi, dt); animasiKarakter(tupi, dt); awan.forEach(a => { a.position.x += dt * .3; if (a.position.x > 16) a.position.x = -16; }); });

// ---------- data soal ----------
const soalSah = () => (DATA.soal || []).map(s => ({jenis: String(s.jenis || 'berapa').trim().toLowerCase(), angka: Math.max(1, Math.min(20, parseInt(s.angka) || 1)), angka2: Math.max(1, Math.min(20, parseInt(s.angka2) || 1)), buah: BUAH[String(s.buah || '').trim().toLowerCase()] ? String(s.buah).trim().toLowerCase() : 'apel'}));
let urut = [], idx = 0, skor = 0, N = 0;
function mulaiMain() { urut = soalSah(); if (DATA.urutan === 'acak') urut = kocok(urut); N = urut.length; idx = 0; skor = 0; aturBintang(0, N); if (!N) { tulisGelembung('Belum ada soal. Buka Mode Guru.'); return; } putaran(); }
async function putaran() {
  bersihRonde(); kunci = true; P.seret = null; window.__ulangSuara = null;
  if (idx >= N) { setMode(tupi, 'senang', 3); konfeti(new THREE.Vector3(0, 2, 0), undefined, 80); await ucap('Hore! Kiko senang sekali, semua buah sudah dihitung!'); layarSelesai(skor, N, mulaiMain); return; }
  const p = posTupi(); await jalanKe(tupi, p.x, p.z);
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
    const g = new THREE.Group(); tambah(g, 2.1, .1, 1.6, 0, .05, 0, '#74c0fc', .05); tambah(g, 1.8, .1, 1.3, 0, .07, 0, '#e7f5ff', .05); const kol = Math.min(4, Math.ceil(Math.sqrt(n * 1.4)));
    for (let k = 0; k < n; k++) { const f = buatBuah(q.buah, 1); const c = k % kol, r = Math.floor(k / kol); f.position.set((c - (kol - 1) / 2) * .48, .12, (r - (Math.ceil(n / kol) - 1) / 2) * .45); g.add(f); }
    g.position.set((i ? 1 : -1) * jarak, 0, -.9); g.userData.n = n; tambahRonde(g); muncul(g);
    daftarKetuk(g, o => jawab(o)); return g;
  });
  const benarN = sedikit ? Math.min(a, b) : Math.max(a, b);
  const jawab = async (o) => {
    kunci = true; await jalanKe(tupi, o.position.x * .6, o.position.z + 2); setMode(tupi, 'tunjuk', .6);
    if (o.userData.n === benarN) { lompat(o, .3, .4); await benar(`${pilih(PUJIAN)} ${sebut(o.userData.n)} lebih ${sedikit ? 'sedikit' : 'banyak'} dari ${sebut(o.userData.n === a ? b : a)}.`, o.position.clone().setY(1.2)); }
    else { efek.salah(); setMode(tupi, 'geleng', 1.2); goyang(o); await ucap(`Coba hitung lagi. Piring ini ada ${sebut(o.userData.n)}. ${pilih(SEMANGAT)}`); kunci = false; }
  };
  await ucap(`Piring mana yang ${NAMA_BUAH[q.buah]}nya lebih ${sedikit ? 'sedikit' : 'banyak'}?`); kunci = false;
}

aturBintang(0, soalSah().length); tulisGelembung('Ketuk Main untuk mulai');
setMode(tupi, 'lambai'); loop();
layarMulai(DATA.judul || 'Petualang Angka', 'Bantu Kiko si kucing memetik buah!', mulaiMain);

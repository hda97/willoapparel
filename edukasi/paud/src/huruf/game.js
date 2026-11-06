// Petualang Huruf: Bima mencari huruf di taman.
// Jenis soal: "cari" (cari huruf awal dari gambar) dan "tebak" (lihat huruf, pilih gambar).
GURU.kolom = [{k: 'huruf', label: 'Huruf', contoh: 'B'}, {k: 'kata', label: 'Kata', contoh: 'Bola'}, {k: 'gambar', label: 'Gambar (emoji)', contoh: '⚽'}];
GURU.pengaturan = [
  {k: 'putaran', label: 'Soal per main', min: 3, max: 30},
  {k: 'pilihan', label: 'Banyak pilihan', min: 2, max: 4},
  {k: 'jenis', label: 'Jenis soal', tipe: 'pilih', opsi: [['campur', 'Campur'], ['cari', 'Cari huruf'], ['tebak', 'Tebak gambar']]},
];
GURU.terapkan = () => mulaiMain();
pasangGuru();
aturMusik({bpm: 112, nada: 60, alat: 'marimba', progresi: [0, 4, 5, 3], benih: 11});

siapPanggung({langit: '#bde8ff', tanahWarna: '#7cc96b', lebarArea: 9.6, dalamArea: 10});
P.sc.add(tanahVoxel(36, 28, ['#8ad471', '#84cf6b']));
// jalan setapak
{ const m = lempeng(28, 2, '#e8d3a3', .03, .1); m.position.z = 2; P.sc.add(m); }
// hiasan taman
[[-7.5, -5.5], [7.2, -5], [-9, 1], [9, 2.5], [-4.5, -7], [4, -7.5]].forEach(([x, z], i) => { const p = pohonVoxel(5 + (i % 3), pilih(['#4caf50', '#66bb6a', '#43a047']), '#8b5a2b'); p.position.set(x, 0, z); P.sc.add(p); });
for (let i = 0; i < 40; i++) { const b = bungaVoxel(pilih(['#ff6fa3', '#ffd23f', '#a78bfa', '#ff8a5b', '#ffffff'])); const x = acak(-12, 12), z = acak(-8, 7); if (Math.abs(x) < 5 && z > -3.5 && z < 4.5) continue; b.position.set(x, 0, z); b.rotation.y = acak(0, 6); P.sc.add(b); }
[[-6, 4.5], [6.5, 5], [-8, -2.5]].forEach(([x, z]) => { const b = batuVoxel(); b.position.set(x, 0, z); P.sc.add(b); });
const awan = [awanVoxel(), awanVoxel(), awanVoxel()]; awan.forEach((a, i) => { a.position.set(-10 + i * 9, 7 + i, -9 - i * 2); P.sc.add(a); });
// papan nama ABC
{ const g = new THREE.Group(); tambah(g, .24, 1.4, .24, 0, .7, 0, '#8b5a2b', .05); tambah(g, 2.9, .84, .14, 0, 1.4, -.04, '#f5deb3', .08); const t = teksVoxel('ABC', '#e03131', .1, 1); t.position.set(0, 1.18, .04); g.add(t); g.position.set(-3.5, 0, -6.2); g.rotation.x = -.15; P.sc.add(g); }

// Bima: avatar warga Dunia Kotak, topi merah dibalik, kaos kuning
const bima = buatKarakter({
  jenis: 'L', kulit: KULIT[1], rambut: {gaya: 'cepak', warna: WARNA_RAMBUT[1]},
  atasan: {jenis: 'kaos', warna: '#ffcc33'}, bawahan: {jenis: 'celana', warna: '#2f5aa8'}, sepatu: '#e03131', topi: '#e03131',
});
topiTerbalik(bima); hadapDepan(bima); P.tokoh = bima;
const RUMAH = {x: 0, z: 2.2};
const rumah = () => ({x: 0, z: tegak() ? 3.1 : 3.7});
bima.position.set(rumah().x, 0, rumah().z); P.sc.add(bima);
pembaru.push((dt, t) => { gerakKarakter(bima, dt); animasiKarakter(bima, dt); awan.forEach((a, i) => { a.position.x += dt * (.3 + i * .1); if (a.position.x > 16) a.position.x = -16; }); });

const WARNA_HURUF = ['#e03131', '#1c7ed6', '#f08c00', '#7048e8', '#2f9e44', '#d6336c'];
const soalSah = () => (DATA.soal || []).map(s => ({huruf: String(s.huruf || s.kata || '').trim().charAt(0).toUpperCase(), kata: String(s.kata || '').trim(), gambar: String(s.gambar || '').trim()})).filter(s => FONT[s.huruf] && s.kata);
let urut = [], idx = 0, skor = 0, N = 10;
function kataHTML(kata) { return `<b>${kata.charAt(0).toUpperCase()}</b>${kata.slice(1).toLowerCase()}`; }

function mulaiMain() {
  const s = soalSah(); if (!s.length) { tulisGelembung('Belum ada soal. Buka Mode Guru untuk menambah.'); return; }
  N = Math.max(1, +DATA.putaran || 10); urut = []; while (urut.length < N) urut.push(...kocok(s)); urut.length = N;
  idx = 0; skor = 0; aturBintang(0, N); putaran();
}
function jenisRonde() { const j = DATA.jenis || 'campur'; return j === 'campur' ? (idx % 3 === 2 ? 'tebak' : 'cari') : j; }

async function putaran() {
  bersihRonde(); kunci = true;
  if (idx >= N) { setMode(bima, 'senang', 3); konfeti(new THREE.Vector3(0, 2, 0), undefined, 80); await ucap('Hore! Kamu hebat, semua huruf sudah ketemu!'); layarSelesai(skor, N, mulaiMain); return; }
  { const r = rumah(); await jalanKe(bima, r.x, r.z); }
  const q = urut[idx]; return jenisRonde() === 'tebak' ? rondeTebak(q) : rondeCari(q);
}

// --- Cari huruf: lihat gambar, ketuk huruf awalnya ---
async function rondeCari(q) {
  const n = Math.min(4, Math.max(2, +DATA.pilihan || 3));
  const lain = kocok(Object.keys(FONT).filter(h => isNaN(h) && h !== q.huruf)).slice(0, n - 1);
  const huruf = kocok([q.huruf, ...lain]), pos = posisiPilihan(n, {jarak: 2.7, z: -1.3});
  $('kartu').innerHTML = `${q.gambar}<span class="kata">${kataHTML(q.kata)}</span>`; $('kartu').hidden = false;
  huruf.forEach((h, i) => {
    const g = new THREE.Group(); g.add(alasBatu(4)); const t = teksVoxel(h, WARNA_HURUF[(i + idx) % WARNA_HURUF.length], .2, 2); t.position.y = .3; t.rotation.x = -.45; g.add(t);
    g.position.set(pos[i].x, 0, pos[i].z); g.userData.huruf = h; g.userData.t = t; tambahRonde(g); muncul(g);
    daftarKetuk(g, o => jawabCari(o, q));
  });
  window.__ulangSuara = null;
  await ucap(`${q.kata}. ${q.kata} dimulai dengan huruf ${q.huruf}. Ayo cari huruf ${q.huruf}!`);
  kunci = false;
}
async function jawabCari(o, q) {
  kunci = true; efek.pop();
  await jalanKe(bima, o.position.x, o.position.z + 1.1); setMode(bima, 'tunjuk', .6);
  if (o.userData.huruf === q.huruf) {
    efek.benar(); setMode(bima, 'senang', 1.6); konfeti(o.position.clone().setY(1.5));
    const t = o.userData.t; animasi(.8, (e, p) => { t.rotation.y = p * Math.PI * 2; t.position.y = .3 + Math.sin(p * Math.PI) * 1.2; }, x => x);
    skor++; aturBintang(skor, N);
    await ucap(`${pilih(PUJIAN)} ${q.huruf}, ${q.kata}!`); idx++; putaran();
  } else {
    efek.salah(); setMode(bima, 'geleng', 1.2); goyang(o.userData.t);
    await ucap(`Itu huruf ${o.userData.huruf}. ${pilih(SEMANGAT)} Cari huruf ${q.huruf}.`); kunci = false;
  }
}

// --- Tebak gambar: lihat huruf besar, pilih gambar yang dimulai huruf itu ---
async function rondeTebak(q) {
  const n = Math.min(4, Math.max(2, +DATA.pilihan || 3));
  const lain = kocok(soalSah().filter(s => s.huruf !== q.huruf)).filter((s, i, a) => a.findIndex(x => x.huruf === s.huruf) === i).slice(0, n - 1);
  const g = new THREE.Group(); g.add(alasBatu(6, '#c9b8a6')); const t = teksVoxel(q.huruf, pilih(WARNA_HURUF), .3, 3); t.position.y = .3; t.rotation.x = -.4; g.add(t);
  g.position.set(0, 0, -1.4); tambahRonde(g); muncul(g);
  pembaru.push(function putar(dt) { if (!g.parent) { pembaru.splice(pembaru.indexOf(putar), 1); return; } t.rotation.y = Math.sin(performance.now() / 700) * .25; });
  await jalanKe(bima, 1.8, .4); bima.rotation.y = Math.PI * .85; setMode(bima, 'tunjuk', 1.5);
  pilihanUI(kocok([q, ...lain]).map(s => ({html: s.gambar, s})), async (d, btn) => {
    kunci = true;
    if (d.s.huruf === q.huruf) {
      btn.classList.add('benar'); efek.benar(); setMode(bima, 'senang', 1.6); konfeti(new THREE.Vector3(0, 1.8, -1.4));
      skor++; aturBintang(skor, N); await ucap(`${pilih(PUJIAN)} ${d.s.kata} dimulai huruf ${q.huruf}!`); idx++; putaran();
    } else {
      btn.classList.remove('salah'); void btn.offsetWidth; btn.classList.add('salah'); efek.salah(); setMode(bima, 'geleng', 1.2);
      await ucap(`Itu ${d.s.kata}, dimulai huruf ${d.s.huruf}. ${pilih(SEMANGAT)}`); kunci = false;
    }
  });
  await ucap(`Ini huruf ${q.huruf}. Gambar mana yang dimulai huruf ${q.huruf}?`); kunci = false;
}

aturBintang(0, +DATA.putaran || 10); tulisGelembung('Ketuk Main untuk mulai');
setMode(bima, 'lambai'); loop();
layarMulai(DATA.judul || 'Petualang Huruf', 'Bantu Bima mencari huruf di taman!', mulaiMain);

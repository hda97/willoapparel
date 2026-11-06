// Petualang Hitung SD: Dimas menjelajahi Pulau Angka (kamera isometrik).
// Fase A (kelas 1-2), B (kelas 3-4), C (kelas 5-6). Lima pos tantangan:
//  jembatan  : pilih batu bernomor yang benar untuk menyeberang (operasi hitung)
//  gerbang   : ketik jawaban di papan angka untuk membuka gerbang (hitung / soal cerita)
//  kasir     : bayar belanjaan dengan uang pas (koin & uang kertas)
//  pecahan   : ambil potongan kue sesuai pecahan
//  luas / keliling : hitung luas atau keliling petak sawah
import {rumahMesh, warungMesh} from '../../public/duniakotak/mabar/js/aset/rumah.js';

GURU.kolom = [
  {k: 'fase', label: 'Fase (A/B/C)', contoh: 'A'},
  {k: 'jenis', label: 'Jenis (jembatan/gerbang/kasir/pecahan/luas/keliling)', contoh: 'jembatan'},
  {k: 'soal', label: 'Soal', contoh: '7 + 5'},
  {k: 'jawaban', label: 'Jawaban (boleh kosong bila soal hitungan)', contoh: ''},
];
GURU.pengaturan = [{k: 'urutan', label: 'Urutan soal', tipe: 'pilih', opsi: [['berurutan', 'Berurutan'], ['acak', 'Acak']]}];
GURU.terapkan = () => { bersihRonde(); tutupPapan(); keFase(); };
pasangGuru();
aturMusik({bpm: 132, nada: 62, alat: 'xilofon', progresi: [0, 5, 3, 4], benih: 41});

const KELIP = '#ffd43b';
siapPanggung({langit: '#bfe9ff', lebarArea: 12, dalamArea: 10, lebarTegak: 7, dalamTegak: 9, sudut: 40, yaw: YAW_ISO, fov: 30, dMin: 15, dMax: 46, batasX: 5, batasZ: [-5, 5]});
P.sc.background = gradasi('#a5dcff');
P.sc.fog = new THREE.Fog('#cfeeff', 45, 110);
P.pusat = new THREE.Vector3(0, 0, 3);
const pusatTuju = P.pusat.clone();
const sh = P.mt.shadow.camera; sh.left = sh.bottom = -22; sh.right = sh.top = 22; sh.far = 60; sh.updateProjectionMatrix(); P.mt.position.set(10, 22, 14);

// ---------- Pulau Angka ----------
P.sc.add(tanahVoxel(60, 60, ['#8fd16a', '#86c962', '#93d46f']));
// sungai (seberang utara)
const sungai = lempeng(80, 2.8, '#4dabf7', .035, .05); sungai.position.z = -8; sungai.material.roughness = .25; P.sc.add(sungai);
[-1, 1].forEach(s => { const t = lempeng(80, .35, '#c9a46b', .05, .05); t.position.z = -8 + s * 1.55; P.sc.add(t); });
const riak = []; for (let i = 0; i < 26; i++) { const r = kotak(acak(.3, .7), .03, .08, '#d0ebff', .015); r.position.set(acak(-22, 22), .09, -8 + acak(-1, 1)); r.castShadow = false; P.sc.add(r); riak.push(r); }
// jembatan kayu tetap (jauh) + seberang
{ const g = new THREE.Group(); for (let z = -1.6; z <= 1.6; z += .4) tambah(g, 1.6, .12, .34, 0, .3, z, '#b07a48', .03); [-1, 1].forEach(s => { tambah(g, .1, .5, 3.4, s * .78, .55, 0, '#8a5a32', .03); }); g.position.set(-16, 0, -8); P.sc.add(g); }
// jalan setapak antar pos
function jalur(x0, z0, x1, z1) { const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / .9); for (let i = 0; i <= n; i++) { const t = i / n; const b = kotak(.7, .06, .7, variasi('#e9d3a5', .04), .08, {roughness: .95}); b.position.set(x0 + (x1 - x0) * t + acak(-.08, .08), .03, z0 + (z1 - z0) * t + acak(-.08, .08)); b.rotation.y = acak(-.3, .3); b.castShadow = false; P.sc.add(b); } }
jalur(0, 4, -6, -4.6); jalur(0, 4, 6, -1.6); jalur(0, 4, -6.5, 6.6); jalur(0, 4, 6.5, 6.6); jalur(0, 4, 3.6, 1.8);
// alun-alun awal
{ const a = alasBatu(9, '#e3d6b8'); a.position.set(0, 0, 4.6); P.sc.add(a); }
// rumah warga & pohon di pinggir
[[-13, 1, 'kecil', 'kuning', 'merah', .55], [-12, 11, 'duaLantai', 'biru', 'abu', .5], [13, 0, 'kecil', 'hijau', 'cokelat', .55], [12.5, 11, 'duaLantai', 'merahMuda', 'ungu', .5], [0, 14, 'kecil', 'putih', 'biru', .55]].forEach(([x, z, b, d, a, s]) => {
  const r = rumahMesh(b, {dinding: d, atap: a}); r.scale.setScalar(s); r.position.set(x, 0, z); r.rotation.y = Math.atan2(-x, -z + 4) * .5 + (z > 10 ? Math.PI * .1 : 0); P.sc.add(r); bisaPudar(r, 3.2); });
[[-10, -4], [-3, -4.5], [3, -4.4], [11, -5], [-15, 6], [15, 6], [-9, 13], [9, 14], [-4, 12], [5, 12.5], [-18, -2], [18, -3], [-6, 18], [6, 18]].forEach(([x, z]) => { const p = pohonVoxel(acak(4.5, 6.5), pilih(['#43a047', '#4caf50', '#66bb6a', '#2e7d32'])); p.position.set(x, 0, z); P.sc.add(p); bisaPudar(p, 2); });
for (let i = 0; i < 40; i++) { const x = acak(-16, 16), z = acak(-5, 16); if (Math.abs(x) < 9 && z > -3 && z < 9) continue; const b = bungaVoxel(pilih(['#ff6fa3', '#ffd43b', '#ffffff', '#b197fc', '#ff922b'])); b.position.set(x, 0, z); P.sc.add(b); }
[[-9, -3.5], [9.5, 8], [-2, 9.8]].forEach(([x, z]) => { const b = batuVoxel(acak(.8, 1.3)); b.position.set(x, 0, z); P.sc.add(b); });
const awan = [awanVoxel(1.4), awanVoxel(1.1), awanVoxel(1.6)]; awan.forEach((a, i) => { a.position.set(-14 + i * 12, 9 + i, -16 + i * 3); P.sc.add(a); });
// papan nama pulau
{ const g = new THREE.Group(); tambah(g, .16, 1.5, .16, -1.2, .75, 0, '#8a5a32', .03); tambah(g, .16, 1.5, .16, 1.2, .75, 0, '#8a5a32', .03); tambah(g, 2.9, .9, .14, 0, 1.5, 0, '#c98a4a', .06);
  const t = teksVoxel('PULAU', '#fff', .07, 1); t.position.set(0, 1.42, .1); g.add(t); g.position.set(-3, 0, 7); g.rotation.y = YAW_ISO; P.sc.add(g); }

// ---------- Pos tantangan ----------
const POS = {
  jembatan: {x: -6, z: -5.2, pusat: [-6, -6.4]},
  gerbang: {x: 6, z: -1.6, pusat: [6, -3]},
  kasir: {x: -6.5, z: 6.9, pusat: [-6.8, 5.4]},
  pecahan: {x: 6.5, z: 6.9, pusat: [6.8, 5.4]},
  sawah: {x: 1.2, z: 3.4, pusat: [0, 0]},
  awal: {x: 0, z: 4.4, pusat: [0, 3.4]},
};
// gerbang batu
const gerbang = new THREE.Group(); const pintuG = [];
{ const B = '#a7adb5'; [-1, 1].forEach(s => { for (let y = 0; y < 5; y++) tambah(gerbang, .7, .5, .7, s * 1.5, .25 + y * .5, 0, variasi(B, .05), .06); tambah(gerbang, 3.6, .2, 1.1, 0, 0, 0, '#8d939b', .04).position.y = .02; });
  tambah(gerbang, 3.9, .6, .9, 0, 2.75, 0, '#8d939b', .08); tambah(gerbang, 1.8, .7, .16, 0, 3.4, .1, '#c98a4a', .06);
  [-1, 1].forEach(s => { const p = new THREE.Group(); tambah(p, 1.15, 2.2, .14, -s * .58, 1.12, 0, '#9c6b3e', .04); [-.75, .4, 1.6].forEach(y => tambah(p, 1.15, .1, .18, -s * .58, y + .4, .01, '#6b4423', .02)); p.position.x = s * 1.15; gerbang.add(p); pintuG.push(p); });
  [-1, 1].forEach(s => { for (let x = 2.3; x < 6; x += .9) tambah(gerbang, .9, .9 - (x > 4.5 ? .3 : 0), .7, s * x, .4, 0, variasi('#a7adb5', .06), .08); });
  gerbang.position.set(6, 0, -3.4); P.sc.add(gerbang); }
// warung kasir (aset warung Dunia Kotak)
const warung = warungMesh({nama: 'TOKO PULAU', warna: '#1c7ed6'}); warung.scale.setScalar(.62); warung.position.set(-6.8, 0, 3.6); P.sc.add(warung);
const penjual = buatKarakter({jenis: 'P', kulit: KULIT[2], rambut: {gaya: 'hijab', warna: '#000'}, hijab: '#f783ac', atasan: {jenis: 'kaos', warna: '#fff'}});
penjual.position.set(-7.6, 0, 4.7); hadapDepan(penjual, YAW_ISO * .6); P.sc.add(penjual);
// meja bayar di depan warung
{ const g = new THREE.Group(); tambah(g, 1.6, .12, 1.2, 0, .8, 0, '#e9c46a', .05); tambah(g, 1.3, .7, .9, 0, .4, 0, '#c98a4a', .05); g.position.set(-5.4, 0, 5.8); g.rotation.y = YAW_ISO; P.sc.add(g); }
// toko kue
const tokoKue = rumahMesh('kecil', {dinding: 'merahMuda', atap: 'ungu', pintu: 'putih'}); tokoKue.scale.setScalar(.6); tokoKue.position.set(7.2, 0, 2.6); P.sc.add(tokoKue); bisaPudar(tokoKue, 1.6);
const koki = buatKarakter({jenis: 'L', kulit: KULIT[3], rambut: {gaya: 'cepak', warna: '#3a2416'}, atasan: {jenis: 'kemeja', warna: '#ffffff'}, bawahan: {jenis: 'celana', warna: '#495057'}, topi: '#ffffff'});
koki.position.set(8.3, 0, 4.9); hadapDepan(koki, YAW_ISO * .4); P.sc.add(koki);
const meja = new THREE.Group(); tambah(meja, 3.4, .14, 1.6, 0, .78, 0, '#c98a4a', .05); [[-1.5, -.65], [1.5, -.65], [-1.5, .65], [1.5, .65]].forEach(([x, z]) => tambah(meja, .14, .76, .14, x, .38, z, '#8a5a32', .03)); meja.position.set(6.8, 0, 5.2); P.sc.add(meja);
// pagar sawah
{ const g = new THREE.Group(); for (let i = -4; i <= 4; i++) { tambah(g, .12, .6, .12, i * .9, .3, -3.1, '#a0703e', .03); } tambah(g, 7.4, .08, .06, 0, .45, -3.1, '#b8834a', .02); P.sc.add(g); }

// ---------- Dimas (seragam SD merah putih + ransel) ----------
const dimas = buatKarakter({jenis: 'L', kulit: KULIT[2], rambut: {gaya: 'belah', warna: '#1a1a1a'}, atasan: {jenis: 'seragam', warna: '#ffffff'}, bawahan: {jenis: 'pendek', warna: '#c92a2a'}, sepatu: '#212529'});
{ const b = dimas.userData.badan; tambah(b, .95, 1.0, .42, 0, .65, -.5, '#f59f00', .12); tambah(b, .7, .38, .14, 0, .45, -.75, '#e67700', .06); [-1, 1].forEach(s => tambah(b, .12, 1.0, .08, s * .36, .68, .32, '#e67700', .03)); }
P.sc.add(dimas); hadapDepan(dimas, YAW_ISO - .35); P.tokoh = dimas; dimas.position.set(POS.awal.x, 0, POS.awal.z);
pembaru.push((dt, t) => {
  gerakKarakter(dimas, dt); animasiKarakter(dimas, dt); animasiKarakter(penjual, dt); animasiKarakter(koki, dt);
  P.pusat.lerp(pusatTuju, Math.min(1, dt * 1.6)); updatePudar(dt);
  awan.forEach(a => { a.position.x += dt * .35; if (a.position.x > 26) a.position.x = -26; });
  riak.forEach((r, i) => { r.position.x += dt * .6; if (r.position.x > 22) r.position.x = -22; r.material.opacity = 1; r.position.y = .09 + Math.sin(t * 2 + i) * .01; });
});
async function keStasiun(nama) {
  const p = POS[nama]; pusatTuju.set(p.pusat[0], 0, p.pusat[1]);
  if (Math.hypot(dimas.position.x - p.x, dimas.position.z - p.z) > .1) { await jalanKe(dimas, p.x, p.z, 5.2); }
}

// ---------- data soal ----------
const JENIS = ['jembatan', 'gerbang', 'kasir', 'pecahan', 'luas', 'keliling'];
function soalSah(f) {
  return (DATA.soal || []).map(s => ({fase: String(s.fase || 'A').trim().toUpperCase().charAt(0), jenis: String(s.jenis || 'gerbang').trim().toLowerCase(), soal: String(s.soal ?? '').trim(), jawaban: String(s.jawaban ?? '').trim()}))
    .filter(s => s.soal && (!f || s.fase === f)).map(s => ({...s, jenis: JENIS.includes(s.jenis) ? s.jenis : 'gerbang'}));
}
let urut = [], idx = 0, skor = 0, N = 0, faseNow = 'A';
function keFase() {
  bersihRonde(); tutupPapan(); window.__ulangSuara = null; tulisGelembung('Pilih fase untuk mulai.'); P.seret = null;
  const j = {}; soalSah().forEach(s => { j[s.fase] = (j[s.fase] || 0) + 1; });
  pusatTuju.set(POS.awal.pusat[0], 0, POS.awal.pusat[1]); jalanKe(dimas, POS.awal.x, POS.awal.z, 5.2); setMode(dimas, 'lambai');
  pilihFase(j, mainFase);
}
function mainFase(f) {
  faseNow = f; urut = soalSah(f); if (DATA.urutan === 'acak') urut = kocok(urut); N = urut.length; idx = 0; skor = 0;
  aturNyawa(3); aturBintang(0, N); putaran();
}
async function putaran() {
  bersihRonde(); tutupPapan(); kunci = true; P.seret = null; window.__ulangSuara = null;
  if (idx >= N) {
    const bt = Math.max(1, NYAWA); simpanBintangFase(faseNow, bt);
    await keStasiun('awal'); setMode(dimas, 'senang', 3); konfeti(dimas.position.clone().setY(2), undefined, 90);
    await ucap(`Hebat! ${FASE[faseNow].nama} selesai dengan ${bt} bintang!`);
    layarSelesai(skor, N, keFase); $('selesaiBintang').innerHTML = '★'.repeat(bt) + '<span style="color:#dee2e6;text-shadow:none">' + '★'.repeat(3 - bt) + '</span>';
    return;
  }
  const q = urut[idx];
  const st = q.jenis === 'luas' || q.jenis === 'keliling' ? 'sawah' : q.jenis;
  tulisGelembung(['Ayo ke pos berikutnya!', 'Jalan terus, Dimas!', 'Tantangan baru menunggu!'][idx % 3]);
  await keStasiun(st);
  ({jembatan: rondeJembatan, gerbang: rondeGerbang, kasir: rondeKasir, pecahan: rondePecahan, luas: rondeSawah, keliling: rondeSawah})[q.jenis](q);
}
async function benar(teks, pos) {
  kunci = true; tutupPapan(); efek.benar(); setMode(dimas, 'senang', 1.8); konfeti(pos || dimas.position.clone().setY(2)); skor++; aturBintang(skor, N);
  await ucap(teks); idx++; putaran();
}
// salah: nyawa berkurang; true bila masih boleh mencoba
async function salah(teks) {
  kunci = true; efek.salah(); setMode(dimas, 'geleng', 1.2);
  if (kurangNyawa() <= 0) { await ucap('Yah, nyawamu habis.'); tutupPapan(); bersihRonde(); $('layarKalah').hidden = false;
    $('bCobaLagi').onclick = () => { $('layarKalah').hidden = true; mainFase(faseNow); };
    $('bKeFase').onclick = () => { $('layarKalah').hidden = true; keFase(); }; return false; }
  await ucap(teks); kunci = false; return true;
}
// jawaban: kolom jawaban, atau dihitung dari soal
function jawabanDari(q) { const j = bacaAngka(q.jawaban); return isFinite(j) ? j : hitungEkspresi(q.soal); }
const lokal = (st, x, z) => { const p = POS[st].pusat; return new THREE.Vector3(p[0] + x, 0, p[1] + z); };
function label3D(teks, warna, s = .12) { const t = teksVoxel(teks, warna, s, 2); t.rotation.order = 'YXZ'; t.rotation.y = YAW_ISO; t.rotation.x = -.35; return t; }

// --- 1. Jembatan batu angka ---
async function rondeJembatan(q) {
  const jaw = jawabanDari(q); if (!isFinite(jaw)) { idx++; return putaran(); }
  const tampil = tampilSoal(q.soal) + ' = ?';
  kartuSoal(tampil); window.__ulangSuara = null;
  const nilai = pengecoh(jaw, 3);
  nilai.forEach((v, i) => {
    const g = new THREE.Group(); tambah(g, 1.25, .5, 1.1, 0, .12, 0, variasi('#868e96', .05), .16); tambah(g, .9, .2, .8, .05, .45, -.05, variasi('#adb5bd', .04), .1);
    const t = label3D(fmt(v).replace('.', ''), '#ff922b', fmt(v).length > 4 ? .07 : .1); t.position.set(0, .7, 0); g.add(t);
    g.position.copy(lokal('jembatan', (i - 1) * 1.9, -1.6)); g.userData.v = v; g.userData.y0 = 0; tambahRonde(g); muncul(g);
    daftarKetuk(g, async o => {
      if (kunci) return; kunci = true;
      if (sama(o.userData.v, jaw)) {
        const asal = dimas.position.clone(); dimas.userData.hadapDepan = false; dimas.rotation.y = Math.atan2(o.position.x - asal.x, o.position.z - asal.z);
        setMode(dimas, 'jalan'); await terbangKe(dimas, o.position.clone().setY(.55), .6, 1.4); setMode(dimas, 'senang', 1.4);
        efek.benar(); konfeti(o.position.clone().setY(2)); await tunggu(900); setMode(dimas, 'jalan'); await terbangKe(dimas, asal, .5, 1); dimas.userData.hadapDepan = true;
        await benar(`${pilih(PUJIAN)} ${ucapAngka(tampilSoal(q.soal))} sama dengan ${fmt(jaw)}.`, o.position.clone().setY(2));
      } else {
        hapusKetuk(o); const y = o.position.y; animasi(.8, e => { o.position.y = y - e * 1; });
        konfeti(o.position.clone().setY(.3), ['#a5d8ff', '#d0ebff', '#74c0fc', '#ffffff'], 18);
        await salah(`Batu ${fmt(o.userData.v)} tenggelam! ${pilih(SEMANGAT)}`);
      }
    });
  });
  await ucap(`Pilih batu yang benar untuk menyeberang. ${ucapAngka(tampil)}`); kunci = false;
}

// --- 2. Gerbang: ketik jawaban ---
async function rondeGerbang(q) {
  const jaw = jawabanDari(q); if (!isFinite(jaw)) { idx++; return putaran(); }
  const ekspresi = isFinite(hitungEkspresi(q.soal)) && !q.jawaban;
  const tampil = ekspresi ? tampilSoal(q.soal) + ' = ?' : q.soal;
  kartuSoal(ekspresi ? tampil : `<small>${q.soal.replace(/</g, '&lt;')}</small>`);
  const papan = label3D('?', '#ffd43b', .09); papan.position.copy(gerbang.position).add(new THREE.Vector3(0, 3.1, .3)); tambahRonde(papan);
  const kunciG = new THREE.Group(); tambah(kunciG, .5, .5, .2, 0, 0, 0, '#fab005', .08); tambah(kunciG, .1, .2, .05, 0, -.02, .1, '#1b1b1b', .02);
  kunciG.position.copy(gerbang.position).add(new THREE.Vector3(0, 1.3, .2)); tambahRonde(kunciG); muncul(kunciG);
  await ucap(ekspresi ? `Gerbang terkunci! Ketik jawabannya. ${ucapAngka(tampil)}` : `Gerbang terkunci! ${q.soal}`); kunci = false;
  while (true) {
    const v = await papanAngka({desimal: !Number.isInteger(jaw)});
    if (sama(v, jaw)) {
      kunci = true; tutupPapan(); P.sc.remove(kunciG);
      await animasi(.8, e => { pintuG[0].rotation.y = -e * 1.9; pintuG[1].rotation.y = e * 1.9; });
      setMode(dimas, 'jalan'); await jalanKe(dimas, gerbang.position.x, gerbang.position.z - .2, 4); await benar(`${pilih(PUJIAN)} Jawabannya ${fmt(jaw)}. Gerbang terbuka!`, gerbang.position.clone().setY(3));
      pintuG[0].rotation.y = pintuG[1].rotation.y = 0; return;
    }
    goyang(kunciG); if (!(await salah(`${fmt(v)} belum tepat. ${pilih(SEMANGAT)}`))) return; papanAngka.ulang();
  }
}

// --- 3. Kasir: bayar dengan uang pas ---
const UANG = [
  {n: 100000, w: '#e03131', k: false}, {n: 50000, w: '#1c7ed6', k: false}, {n: 20000, w: '#37b24d', k: false}, {n: 10000, w: '#9c36b5', k: false},
  {n: 5000, w: '#a9773a', k: false}, {n: 2000, w: '#868e96', k: false}, {n: 1000, w: '#ced4da', k: true}, {n: 500, w: '#fab005', k: true},
];
function teksTekstur(teks, latar, warnaT = '#fff', w = 256, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = latar; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = warnaT; x.font = `900 ${Math.round(h * .42)}px "Baloo 2", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(teks, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const singkat = n => n >= 1000 ? (n / 1000) + 'rb' : String(n);
function buatUang(u) {
  const g = new THREE.Group();
  if (u.k) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .08, 24), [new THREE.MeshStandardMaterial({color: u.w, roughness: .35, metalness: .5}), new THREE.MeshStandardMaterial({map: teksTekstur(singkat(u.n), u.w, '#5c3d00', 128, 128), roughness: .4, metalness: .3}), new THREE.MeshStandardMaterial({color: u.w})]); m.position.y = .06; m.castShadow = true; g.add(m); }
  else { const top = new THREE.MeshStandardMaterial({map: teksTekstur(singkat(u.n), u.w), roughness: .7}), sisi = new THREE.MeshStandardMaterial({color: u.w, roughness: .7});
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.1, .05, .55), [sisi, sisi, top, sisi, sisi, sisi]); m.position.y = .04; m.castShadow = true; g.add(m); }
  g.userData.n = u.n; return g;
}
const BARANG = {
  roti: g => { tambah(g, .7, .32, .4, 0, .16, 0, '#e8a35a', .14); tambah(g, .6, .1, .32, 0, .34, 0, '#b8692a', .05); },
  susu: g => { tambah(g, .36, .6, .36, 0, .3, 0, '#ffffff', .04); tambah(g, .37, .2, .37, 0, .42, 0, '#4dabf7', .03); tambah(g, .26, .12, .26, 0, .66, 0, '#e9ecef', .03); },
  buku: g => { tambah(g, .6, .1, .8, 0, .05, 0, '#e03131', .03); tambah(g, .56, .08, .76, .01, .13, 0, '#fff', .02); tambah(g, .6, .1, .8, 0, .21, 0, '#1c7ed6', .03); },
  pensil: g => { tambah(g, .9, .1, .1, 0, .06, 0, '#fcc419', .03); tambah(g, .14, .08, .08, .5, .06, 0, '#f1c38e', .02); tambah(g, .1, .1, .1, -.48, .06, 0, '#ff8787', .03); },
  tas: g => { tambah(g, .7, .7, .35, 0, .35, 0, '#7048e8', .12); tambah(g, .5, .3, .1, 0, .3, .2, '#5f3dc4', .05); tambah(g, .4, .1, .1, 0, .78, 0, '#5f3dc4', .03); },
  es: g => { tambah(g, .3, .45, .3, 0, .22, 0, '#ffa94d', .1); tambah(g, .38, .3, .38, 0, .55, 0, '#ff8cc6', .15); },
  bola: g => { tambah(g, .55, .55, .55, 0, .28, 0, '#fff', .26); tambah(g, .2, .2, .05, 0, .3, .27, '#1b1b1b', .04); },
};
function barangDari(nama) { const k = Object.keys(BARANG).find(b => nama.toLowerCase().includes(b)); const g = new THREE.Group(); (BARANG[k] || (g2 => tambah(g2, .6, .5, .5, 0, .25, 0, '#ffa94d', .08)))(g); return g; }
async function rondeKasir(q) {
  // format soal: "Roti 7.000" atau "7000"
  const m = q.soal.match(/^(.*?)(rp\.?\s*)?([\d.,]+)\s*$/i); const harga = bacaAngka(m ? m[3] : q.soal);
  const nama = (m && m[1].trim()) || pilih(['Roti', 'Susu', 'Buku', 'Pensil']); if (!isFinite(harga) || harga <= 0) { idx++; return putaran(); }
  const brg = barangDari(nama); brg.scale.setScalar(1.3); brg.position.copy(lokal('kasir', -.3, .3)).setY(1.15); brg.rotation.y = YAW_ISO; tambahRonde(brg); muncul(brg);
  let bayar = 0; const diMeja = [];
  const tulis = () => kartuSoal(`${nama} ${rupiah(harga)}<span class="uang">Uangmu di meja: ${rupiah(bayar)}</span>`);
  tulis();
  const pakai = UANG.filter(u => u.n <= Math.max(harga, 10000) && (u.n >= 500)).slice(0, 6).reverse();
  const tempatMeja = () => lokal('kasir', 1.4 + (diMeja.length % 3) * .3 - .3, .4 + Math.floor(diMeja.length / 3) * .25 - .2).setY(.9 + diMeja.length * .02);
  const dompet = [];
  const isiDompet = () => { pakai.forEach((u, i) => { const o = buatUang(u); const c = i % 3, r = Math.floor(i / 3); o.position.copy(lokal('kasir', -1.4 + c * 1.3, 2.6 + r * .9)); o.rotation.y = UANG.find(u => u.n === o.userData.n).k ? YAW_ISO + Math.PI / 2 : YAW_ISO; o.userData.asal = o.position.clone(); tambahRonde(o); muncul(o); dompet.push(o); daftarKetuk(o, ambil); }); };
  const ambil = async o => {
    if (kunci) return;
    if (!o.userData.diMeja) {
      // salin uang ke meja; uang di dompet tetap (persediaan tak terbatas)
      const c = buatUang(UANG.find(u => u.n === o.userData.n)); c.position.copy(o.position); c.rotation.copy(o.rotation); c.userData.diMeja = true; tambahRonde(c); daftarKetuk(c, ambil);
      const ke = tempatMeja(); diMeja.push(c); bayar += c.userData.n; efek.pop(); tulis(); await terbangKe(c, ke, .4, .9);
    } else {
      diMeja.splice(diMeja.indexOf(o), 1); bayar -= o.userData.n; hapusKetuk(o); efek.wus(); P.sc.remove(o); objRonde.splice(objRonde.indexOf(o), 1);
      diMeja.forEach((d, i) => { d.position.copy(lokal('kasir', 1.4 + (i % 3) * .3 - .3, .4 + Math.floor(i / 3) * .25 - .2).setY(.9 + i * .02)); });
    }
    tulis(); if (kunci) return;
    if (sama(bayar, harga)) { kunci = true; setMode(penjual, 'senang', 1.5); await benar(`${pilih(PUJIAN)} Uangnya pas ${rupiah(harga)}. Terima kasih!`, brg.position.clone().setY(2)); }
    else if (bayar > harga) { await salah(`Uangnya kelebihan ${rupiah(bayar - harga)}. Ketuk uang di meja untuk mengambil kembali.`); }
  };
  isiDompet(); setMode(penjual, 'lambai', 2);
  await ucap(`Harga ${nama} ${rupiah(harga).replace('Rp', '')} rupiah. Ketuk uang untuk membayar dengan uang pas!`); kunci = false;
}

// --- 4. Pecahan: ambil potongan kue ---
async function rondePecahan(q) {
  const m = q.soal.match(/(\d+)\s*\/\s*(\d+)/); if (!m) { idx++; return putaran(); }
  const a = +m[1], b = Math.max(1, +m[2]); let potong = parseInt(q.jawaban) || b; if (potong % b) potong = b; potong = Math.min(12, potong);
  const perlu = Math.round(a * potong / b); if (perlu > potong) { idx++; return putaran(); }
  kartuSoal(`Ambil ${a}/${b} kue<small>Kue dipotong ${potong} bagian sama besar</small>`);
  const kol = potong <= 6 ? potong : Math.ceil(potong / 2), baris = Math.ceil(potong / kol), lw = Math.min(.5, 3 / kol);
  const kue = []; let dipilih = 0;
  const alas = new THREE.Group(); tambah(alas, kol * lw + .4, .06, baris * .62 + .4, 0, .03, 0, '#ffffff', .03); alas.position.copy(lokal('pecahan', 0, -.2)).setY(.86); tambahRonde(alas);
  for (let i = 0; i < potong; i++) {
    const c = i % kol, r = Math.floor(i / kol); const g = new THREE.Group();
    tambah(g, lw - .04, .16, .56, 0, .08, 0, '#a0522d', .03); tambah(g, lw - .04, .1, .56, 0, .21, 0, '#fff3bf', .03); tambah(g, lw - .04, .14, .56, 0, .33, 0, '#a0522d', .03);
    const top = tambah(g, lw - .04, .08, .56, 0, .44, 0, '#fff', .03); g.userData.top = top;
    g.position.copy(lokal('pecahan', (c - (kol - 1) / 2) * lw, -.2 + (r - (baris - 1) / 2) * .62)).setY(.92); g.userData.y0 = .92; tambahRonde(g); kue.push(g);
    daftarKetuk(g, o => { if (kunci) return; o.userData.pilih = !o.userData.pilih; dipilih += o.userData.pilih ? 1 : -1; o.userData.top.material.color.set(o.userData.pilih ? '#ff6b9a' : '#ffffff'); o.position.y = o.userData.y0 + (o.userData.pilih ? .25 : 0); efek.hitung(dipilih); pilihanTulis(); });
  }
  const pilihanTulis = () => pilihanUI([{html: `✔ Selesai (${dipilih}/${potong})`}], async () => {
    if (dipilih === perlu) { setMode(koki, 'senang', 1.5); await benar(`${pilih(PUJIAN)} ${perlu} dari ${potong} potong sama dengan ${a} per ${b}.`, alas.position.clone().setY(2)); }
    else { if (await salah(dipilih < perlu ? `Masih kurang. ${a} per ${b} dari ${potong} potong itu berapa potong?` : `Kebanyakan! Coba kurangi potongannya.`)) pilihanTulis(); }
  });
  pilihanTulis(); $('pilihan').querySelector('.pil').style.fontSize = '24px';
  await ucap(`Pak koki memotong kue menjadi ${potong} bagian. Ketuk potongan untuk mengambil ${a} per ${b} kue!`); kunci = false;
}

// --- 5. Sawah: luas atau keliling ---
async function rondeSawah(q) {
  const m = q.soal.match(/(\d+)\s*[x×*]\s*(\d+)/i); if (!m) { idx++; return putaran(); }
  const p = Math.min(16, +m[1]), l = Math.min(12, +m[2]); const luas = q.jenis === 'luas';
  const jaw = isFinite(bacaAngka(q.jawaban)) ? bacaAngka(q.jawaban) : luas ? p * l : 2 * (p + l);
  const s = Math.min(.6, 6.4 / p, 4.6 / l);
  kartuSoal(`${luas ? 'Luas' : 'Keliling'} sawah = ?<small>Panjang ${p} m, lebar ${l} m (1 petak = 1 m × 1 m)</small>`);
  let dihitung = 0;
  for (let i = 0; i < p; i++) for (let j = 0; j < l; j++) {
    const t = kotak(s * .92, .1, s * .92, variasi((i + j) % 2 ? '#74b816' : '#82c91e', .03), .03, {roughness: .9}); t.position.copy(lokal('sawah', (i - (p - 1) / 2) * s, (j - (l - 1) / 2) * s)).setY(.06); tambahRonde(t);
    if (luas) daftarKetuk(t, o => { if (o.userData.h || kunci) return; o.userData.h = true; o.material.color.set('#fcc419'); o.position.y = .12; dihitung++; efek.hitung(dihitung % 12); tulisGelembung(`Petak dihitung: ${dihitung}`); });
  }
  if (!luas) {
    const tepi = []; const W = p * s, D = l * s; const c = POS.sawah.pusat;
    for (let i = 0; i <= p; i++) [-1, 1].forEach(z => tepi.push([c[0] - W / 2 + i * s, c[1] + z * D / 2]));
    for (let j = 1; j < l; j++) [-1, 1].forEach(x => tepi.push([c[0] + x * W / 2, c[1] - D / 2 + j * s]));
    tepi.forEach(([x, z]) => { const o = kotak(.1, .5, .1, '#a0703e', .02); o.position.set(x, .25, z); tambahRonde(o); });
    [[0, -D / 2, W, .05], [0, D / 2, W, .05], [-W / 2, 0, .05, D], [W / 2, 0, .05, D]].forEach(([x, z, w, d]) => { const o = kotak(w, .06, d, '#ffd43b', .02); o.position.set(c[0] + x, .4, c[1] + z); tambahRonde(o); });
  }
  const lp = label3D(p + 'M', '#ffffff', .08); lp.position.copy(lokal('sawah', 0, l * s / 2 + .6)).setY(.2); tambahRonde(lp);
  const ll = label3D(l + 'M', '#ffffff', .08); ll.position.copy(lokal('sawah', p * s / 2 + .7, 0)).setY(.2); tambahRonde(ll);
  await ucap(luas ? `Sawah Pak Tani panjangnya ${p} meter dan lebarnya ${l} meter. Berapa meter persegi luasnya?` : `Pak Tani mau memagari sawah. Panjang ${p} meter, lebar ${l} meter. Berapa meter kelilingnya?`); kunci = false;
  while (true) {
    const v = await papanAngka({satuan: luas ? 'm²' : 'm'});
    if (sama(v, jaw)) { await benar(luas ? `${pilih(PUJIAN)} ${p} kali ${l} sama dengan ${jaw} meter persegi.` : `${pilih(PUJIAN)} Dua kali, ${p} tambah ${l}, sama dengan ${jaw} meter.`, lokal('sawah', 0, 0).setY(1.5)); return; }
    if (!(await salah(luas ? `${fmt(v)} belum tepat. Ingat, luas sama dengan panjang kali lebar.` : `${fmt(v)} belum tepat. Keliling sama dengan jumlah semua sisi.`))) return; papanAngka.ulang();
  }
}

aturNyawa(3); aturBintang(0, 0); tulisGelembung('Ketuk Main untuk mulai');
setMode(dimas, 'lambai'); loop();
layarMulai(DATA.judul || 'Petualang Hitung', 'Jelajahi Pulau Angka bersama Dimas!', keFase);
if (location.hash === '#uji') window.__uji = {P, objRonde, tembak: (x, y) => { const r = objekDi({clientX: x, clientY: y}); return r ? String(r.o.userData.n) + ' ' + r.o.position.y.toFixed(2) : 'kosong ' + bisaKetuk.length; }, get kunci() { return kunci; }, get urut() { return urut; }, get idx() { return idx; }};

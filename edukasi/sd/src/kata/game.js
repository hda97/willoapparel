// Petualang Kata SD (Bahasa Indonesia): Sari menjelajahi Kampung Kata (kamera isometrik).
// Pos: Jembatan Suku Kata (susun), Pohon Kata (pilih), Perpustakaan (bacaan), Pasar Kata (kelompok).
import {rumahMesh, warungMesh} from '../../public/duniakotak/mabar/js/aset/rumah.js';

aturMusik({bpm: 118, nada: 65, alat: 'xilofon', progresi: [0, 3, 4, 0], benih: 17});
siapPanggung({langit: '#ffe8cc', lebarArea: 12, dalamArea: 10, lebarTegak: 7, dalamTegak: 9, sudut: 40, yaw: YAW_ISO, fov: 30, dMin: 15, dMax: 62, batasX: 5, batasZ: [-5, 5]});
P.sc.background = gradasi('#ffd8a8'); P.sc.fog = new THREE.Fog('#ffe8cc', 45, 110);
{ const sh = P.mt.shadow.camera; sh.left = sh.bottom = -22; sh.right = sh.top = 22; sh.far = 60; sh.updateProjectionMatrix(); P.mt.position.set(10, 22, 14); }

// ---------- Kampung Kata ----------
P.sc.add(tanahVoxel(60, 60, ['#a9d86e', '#9fd065', '#b2dd78']));
const sungai = lempeng(80, 2.8, '#66c2ff', .035, .05); sungai.position.z = -8.6; P.sc.add(sungai);
[-1, 1].forEach(s => { const t = lempeng(80, .35, '#d9b77e', .05, .05); t.position.z = -8.6 + s * 1.55; P.sc.add(t); });
const riak = []; for (let i = 0; i < 24; i++) { const r = kotak(acak(.3, .7), .03, .08, '#e7f5ff', .015); r.position.set(acak(-22, 22), .09, -8.6 + acak(-1, 1)); r.castShadow = false; P.sc.add(r); riak.push(r); }
function jalur(x0, z0, x1, z1, w = '#f1dcb0') { const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / .9); for (let i = 0; i <= n; i++) { const t = i / n; const b = kotak(.7, .06, .7, variasi(w, .04), .08, {roughness: .95}); b.position.set(x0 + (x1 - x0) * t + acak(-.08, .08), .03, z0 + (z1 - z0) * t + acak(-.08, .08)); b.rotation.y = acak(-.3, .3); b.castShadow = false; P.sc.add(b); } }
jalur(0, 4, -4.2, -4.6); jalur(0, 4, 7.8, -1.2); jalur(0, 4, -5, 7.2); jalur(0, 4, 8.6, 7.2);
{ const a = alasBatu(9, '#ead9b8'); a.position.set(0, 0, 4.6); P.sc.add(a); }
// batu pijakan di sungai (pos susun)
for (let i = -2; i <= 2; i++) { const b = batuVoxel(1.1, '#b0b8c1'); b.position.set(-6 + i * 1.4, 0, -8.6 + (i % 2) * .4); P.sc.add(b); }
// Pohon Kata: pohon besar dengan daun huruf
const pohonKata = new THREE.Group();
{ tambah(pohonKata, 1.1, 4.2, 1.1, 0, 2.1, 0, '#8b5a2b', .1); [[0, 5, 0, 4.2], [-1.6, 4.3, .4, 2.4], [1.6, 4.4, -.3, 2.6], [0, 6.4, -.4, 2.8]].forEach(([x, y, z, s]) => tambah(pohonKata, s, s * .8, s, x, y, z, variasi('#40a060', .05), .3));
  'ABCDEFGHIJ'.split('').forEach((h, i) => { const t = teksVoxel(h, ['#ff6b6b', '#ffd43b', '#4dabf7', '#ffffff', '#f783ac'][i % 5], .07, 1); t.position.set(Math.cos(i * 1.7) * 2, 4 + (i % 4) * .7, Math.sin(i * 1.7) * 1.6 + 1); t.rotation.y = YAW_ISO; pohonKata.add(t); }); }
pohonKata.position.set(4.2, 0, -6.4); P.sc.add(pohonKata); bisaPudar(pohonKata, 2.4);
// Perpustakaan
const perpus = rumahMesh('duaLantai', {dinding: 'putih', atap: 'merah'}); perpus.scale.setScalar(.6); perpus.position.set(9.4, 0, 3.6); perpus.rotation.y = -.3; P.sc.add(perpus); bisaPudar(perpus, 3);
{ const g = new THREE.Group(); tambah(g, 3.2, .7, .14, 0, 0, 0, '#c92a2a', .05); const t = teksVoxel('PERPUSTAKAAN', '#fff', .045, 1); t.position.set(0, -.05, .09); g.add(t); g.position.set(8.1, 2.9, 5.6); g.rotation.y = YAW_ISO; P.sc.add(g); }
// rak buku di depan perpus
const rak = new THREE.Group(); tambah(rak, 2.4, 1.6, .5, 0, .8, 0, '#8a5a32', .04);
for (let y = 0; y < 3; y++) for (let i = 0; i < 9; i++) tambah(rak, .2, .42, .38, -1 + i * .25, .32 + y * .5, .05, pilih(['#e03131', '#1c7ed6', '#2f9e44', '#f08c00', '#ae3ec9', '#fab005']), .02);
rak.position.set(9.4, 0, 6.8); rak.rotation.y = YAW_ISO - .2; P.sc.add(rak);
// Pasar Kata
const warung = warungMesh({nama: 'PASAR KATA', warna: '#e8590c'}); warung.scale.setScalar(.62); warung.position.set(-8.2, 0, 3.2); P.sc.add(warung);
const pedagang = buatKarakter({jenis: 'L', kulit: KULIT[3], rambut: {gaya: 'cepak', warna: '#2b1d12'}, atasan: {jenis: 'batik', warna: '#a5512a'}, bawahan: {jenis: 'celana', warna: '#343a40'}, topi: '#495057'});
pedagang.position.set(-9.2, 0, 4.6); hadapDepan(pedagang, YAW_ISO * .6); P.sc.add(pedagang);
const pustakawan = buatKarakter({jenis: 'P', kulit: KULIT[1], rambut: {gaya: 'hijab', warna: '#000'}, hijab: '#74c0fc', atasan: {jenis: 'kemeja', warna: '#ffffff'}, bawahan: {jenis: 'rok', warna: '#1c7ed6'}, kacamata: true});
pustakawan.position.set(10.6, 0, 5.4); hadapDepan(pustakawan, YAW_ISO * .3); P.sc.add(pustakawan);
// rumah & pohon & bunga
[[-13, 0, 'kecil', 'kuning', 'cokelat', .55], [-12, 11, 'duaLantai', 'hijau', 'merah', .5], [13.5, -2, 'kecil', 'biru', 'abu', .55], [3, 14, 'kecil', 'merahMuda', 'ungu', .55], [-4, 14.5, 'kecil', 'putih', 'biru', .55]].forEach(([x, z, b, d, a, s]) => {
  const r = rumahMesh(b, {dinding: d, atap: a}); r.scale.setScalar(s); r.position.set(x, 0, z); r.rotation.y = Math.atan2(-x, -z + 4) * .5; P.sc.add(r); bisaPudar(r, 3.2); });
[[-10, -4.5], [-1, -5], [3.5, -5.2], [14, 5], [-15, 6], [-9, 13], [9, 13.5], [-18, -2], [18, -4], [-6, 18], [6, 18]].forEach(([x, z]) => { const p = pohonVoxel(acak(4.5, 6.5), pilih(['#43a047', '#66bb6a', '#f59f00', '#e8590c'])); p.position.set(x, 0, z); P.sc.add(p); bisaPudar(p, 2); });
for (let i = 0; i < 40; i++) { const x = acak(-16, 16), z = acak(-5, 16); if (Math.abs(x) < 10 && z > -3 && z < 9) continue; const b = bungaVoxel(pilih(['#ff6fa3', '#ffd43b', '#ffffff', '#b197fc'])); b.position.set(x, 0, z); P.sc.add(b); }
const awan = [awanVoxel(1.4), awanVoxel(1.1), awanVoxel(1.6)]; awan.forEach((a, i) => { a.position.set(-14 + i * 12, 9 + i, -16 + i * 3); P.sc.add(a); });
{ const g = new THREE.Group(); tambah(g, .16, 1.5, .16, -1.3, .75, 0, '#8a5a32', .03); tambah(g, .16, 1.5, .16, 1.3, .75, 0, '#8a5a32', .03); tambah(g, 3.1, .9, .14, 0, 1.5, 0, '#e8590c', .06);
  const t = teksVoxel('KAMPUNG KATA', '#fff', .04, 1); t.position.set(0, 1.45, .1); g.add(t); g.position.set(3.4, 0, 7.8); g.rotation.y = YAW_ISO; P.sc.add(g); }
pembaru.push((dt, t) => { awan.forEach(a => { a.position.x += dt * .35; if (a.position.x > 26) a.position.x = -26; }); riak.forEach((r, i) => { r.position.x += dt * .6; if (r.position.x > 22) r.position.x = -22; }); });

// ---------- Sari (seragam SD, rok merah, hijab putih, ransel biru) ----------
const sari = buatKarakter({jenis: 'P', kulit: KULIT[2], rambut: {gaya: 'hijab', warna: '#000'}, hijab: '#ffffff', atasan: {jenis: 'seragam', warna: '#ffffff'}, bawahan: {jenis: 'rok', warna: '#c92a2a'}, sepatu: '#212529'});
{ const b = sari.userData.badan; tambah(b, .95, 1.0, .42, 0, .65, -.5, '#1c7ed6', .12); tambah(b, .7, .38, .14, 0, .45, -.75, '#1864ab', .06); [-1, 1].forEach(s => tambah(b, .12, 1.0, .08, s * .36, .68, .32, '#1864ab', .03)); }
P.sc.add(sari);

const POS = {
  jembatan: {pusat: [-6, -6.2], jarak: 1.75, ajak: q => (/[|\s]/.test(q.soal.trim()) ? 'Susun kata-kata menjadi kalimat yang benar!' : `Susun suku kata menjadi kata yang benar!${q.jawaban ? ' Petunjuknya, ' + q.jawaban : ''}`)},
  pohon: {pusat: [6, -2.6], jarak: 2.2, ajak: q => q.soal},
  perpus: {pusat: [7.2, 5.6], sisi: 0, x: 5.4, z: 7.6, saatBaca: () => setMode(pustakawan, 'lambai', 2)},
  pasar: {pusat: [-6.4, 5.6], ajak: q => `Bantu Pak pedagang! ${q.jawaban || 'Masukkan setiap kata ke keranjang yang tepat.'}`},
  awal: {pusat: [0, 3.4], x: 0, z: 4.4},
};
PT.saatBenar = q => { if (q.jenis === 'kelompok') setMode(pedagang, 'senang', 1.5); if (q.jenis === 'bacaan') setMode(pustakawan, 'senang', 1.5); };
mulaiPetualang({tokoh: sari, POS, stasiun: {susun: 'jembatan', pilih: 'pohon', bacaan: 'perpus', kelompok: 'pasar'}, judul: 'Petualang Kata', ajakan: 'Jelajahi Kampung Kata bersama Sari!', npc: [pedagang, pustakawan], jalan: ['Ayo ke pos berikutnya!', 'Jalan terus, Sari!', 'Tantangan kata menunggu!']});

// English Explorer SD (Bahasa Inggris): Nina menjelajahi English Harbor (kamera isometrik).
// Pos: Fruit Market (pilih), Spelling Pier (susun), Toy Shop (kelompok), Harbor Cafe (bacaan/percakapan).
import {rumahMesh, warungMesh} from '../../public/duniakotak/mabar/js/aset/rumah.js';

aturMusik({bpm: 126, nada: 67, alat: 'xilofon', progresi: [0, 5, 3, 4], benih: 29});
siapPanggung({langit: '#d0ebff', lebarArea: 12, dalamArea: 10, lebarTegak: 7, dalamTegak: 9, sudut: 40, yaw: YAW_ISO, fov: 30, dMin: 15, dMax: 62, batasX: 5, batasZ: [-5, 5]});
P.sc.background = gradasi('#a5d8ff'); P.sc.fog = new THREE.Fog('#d0ebff', 45, 110);
{ const sh = P.mt.shadow.camera; sh.left = sh.bottom = -22; sh.right = sh.top = 22; sh.far = 60; sh.updateProjectionMatrix(); P.mt.position.set(10, 22, 14); }
PT.bahasaKata = 'en-US';

// ---------- English Harbor ----------
P.sc.add(tanahVoxel(60, 60, ['#9bd47a', '#92cc70', '#a5d985']));
const laut = lempeng(90, 14, '#339af0', .04, .05); laut.position.z = -15.2; laut.material.roughness = .2; P.sc.add(laut);
const pasir = lempeng(90, 2.4, '#f6e3b4', .05, .05); pasir.position.z = -7.4; P.sc.add(pasir);
const ombak = []; for (let i = 0; i < 30; i++) { const r = kotak(acak(.4, 1), .03, .1, '#e7f5ff', .015); r.position.set(acak(-24, 24), .1, acak(-20, -9)); r.castShadow = false; P.sc.add(r); ombak.push(r); }
function jalur(x0, z0, x1, z1, w = '#dee2e6') { const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / .9); for (let i = 0; i <= n; i++) { const t = i / n; const b = kotak(.7, .06, .7, variasi(w, .04), .08, {roughness: .95}); b.position.set(x0 + (x1 - x0) * t + acak(-.08, .08), .03, z0 + (z1 - z0) * t + acak(-.08, .08)); b.rotation.y = acak(-.3, .3); b.castShadow = false; P.sc.add(b); } }
jalur(0, 4, -4.2, -4.6); jalur(0, 4, 7.6, -1.2); jalur(0, 4, -5, 7.2); jalur(0, 4, 5.6, 7.4);
{ const a = alasBatu(9, '#e9ecef'); a.position.set(0, 0, 4.6); P.sc.add(a); }
// dermaga kayu (Spelling Pier)
const dermaga = new THREE.Group(); for (let x = -4.5; x <= 4.5; x += .5) tambah(dermaga, .46, .14, 3.2, x, .3, 0, variasi('#b07a48', .05), .03);
[-4.6, -1.5, 1.5, 4.6].forEach(x => [-1.5, 1.5].forEach(z => tambah(dermaga, .22, 1, .22, x, -.1, z, '#7a4a26', .04)));
dermaga.position.set(-6.6, 0, -7.4); P.sc.add(dermaga);
const perahu = new THREE.Group(); tambah(perahu, 3, .6, 1.2, 0, .3, 0, '#e03131', .2); tambah(perahu, 2.6, .12, 1, 0, .62, 0, '#fff', .04); tambah(perahu, .12, 2.4, .12, 0, 1.8, 0, '#7a4a26', .03);
{ const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1.3, 0); s.lineTo(0, 1.9); s.lineTo(0, 0); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, {depth: .04, bevelEnabled: false}), new THREE.MeshStandardMaterial({color: '#fff', side: THREE.DoubleSide})); m.position.set(.08, .9, 0); perahu.add(m); }
perahu.position.set(-1.6, 0, -11); perahu.rotation.y = .3; P.sc.add(perahu);
// mercusuar
const mercu = new THREE.Group(); for (let y = 0; y < 7; y++) tambah(mercu, 1.4 - y * .08, 1, 1.4 - y * .08, 0, .5 + y, 0, y % 2 ? '#e03131' : '#ffffff', .1); tambah(mercu, 1.2, .8, 1.2, 0, 7.4, 0, '#ffe066', .1); tambah(mercu, 1.5, .4, 1.5, 0, 8, 0, '#495057', .1);
mercu.position.set(-15, 0, -8); P.sc.add(mercu);
// Fruit Market
const pasar = warungMesh({nama: 'FRUIT MARKET', warna: '#f08c00'}); pasar.scale.setScalar(.62); pasar.position.set(8.6, 0, -4.8); pasar.rotation.y = -.4; P.sc.add(pasar); bisaPudar(pasar, 2.6);
const penjual = buatKarakter({jenis: 'L', kulit: KULIT[1], rambut: {gaya: 'keriting', warna: '#7a4a2a'}, atasan: {jenis: 'kaos', warna: '#f08c00'}, bawahan: {jenis: 'celana', warna: '#343a40'}});
penjual.position.set(9.8, 0, -2.2); hadapDepan(penjual, YAW_ISO * .5); P.sc.add(penjual);
// Toy Shop
const toko = rumahMesh('kecil', {dinding: 'kuning', atap: 'biru', pintu: 'putih'}); toko.scale.setScalar(.6); toko.position.set(-9.2, 0, 3); toko.rotation.y = .5; P.sc.add(toko); bisaPudar(toko, 2.4);
{ const g = new THREE.Group(); tambah(g, 2.6, .7, .14, 0, 0, 0, '#1c7ed6', .05); const t = teksVoxel('TOY SHOP', '#fff', .05, 1); t.position.set(0, -.05, .09); g.add(t); g.position.set(-7.6, 2.6, 4.6); g.rotation.y = YAW_ISO; P.sc.add(g); }
// Harbor Cafe
const kafe = rumahMesh('duaLantai', {dinding: 'merahMuda', atap: 'merah'}); kafe.scale.setScalar(.58); kafe.position.set(9.8, 0, 3.6); kafe.rotation.y = -.3; P.sc.add(kafe); bisaPudar(kafe, 3);
{ const g = new THREE.Group(); tambah(g, 2.4, .7, .14, 0, 0, 0, '#ae3ec9', .05); const t = teksVoxel('CAFE', '#fff', .06, 1); t.position.set(0, -.05, .09); g.add(t); g.position.set(8.4, 2.9, 5.6); g.rotation.y = YAW_ISO; P.sc.add(g); }
[[8, 8], [10.4, 7.6]].forEach(([x, z]) => { const g = new THREE.Group(); tambah(g, 1, .1, 1, 0, .75, 0, '#fff', .04); tambah(g, .12, .75, .12, 0, .37, 0, '#868e96', .02); tambah(g, .1, 1.8, .1, 0, 1.6, 0, '#868e96', .02); tambah(g, 1.8, .1, 1.8, 0, 2.5, 0, '#f783ac', .3); g.position.set(x, 0, z); P.sc.add(g); });
const pelayan = buatKarakter({jenis: 'P', kulit: KULIT[3], rambut: {gaya: 'bob', warna: '#2b1d12'}, atasan: {jenis: 'kemeja', warna: '#ffffff'}, bawahan: {jenis: 'rok', warna: '#ae3ec9'}});
pelayan.position.set(10.6, 0, 5.6); hadapDepan(pelayan, YAW_ISO * .3); P.sc.add(pelayan);
// rumah, pohon kelapa, bunga
[[-13, 6, 'kecil', 'biru', 'merah', .55], [-11, 12, 'duaLantai', 'putih', 'biru', .5], [13.5, 10, 'kecil', 'hijau', 'cokelat', .55], [2, 14, 'kecil', 'kuning', 'merah', .55], [-4, 15, 'kecil', 'merahMuda', 'ungu', .55]].forEach(([x, z, b, d, a, s]) => {
  const r = rumahMesh(b, {dinding: d, atap: a}); r.scale.setScalar(s); r.position.set(x, 0, z); r.rotation.y = Math.atan2(-x, -z + 4) * .5; P.sc.add(r); bisaPudar(r, 3.2); });
function kelapa(x, z) { const g = new THREE.Group(); for (let i = 0; i < 6; i++) tambah(g, .4, .8, .4, Math.sin(i * .5) * .2, .4 + i * .8, 0, '#a0703e', .08); for (let i = 0; i < 6; i++) { const d = kotak(2.2, .14, .5, '#2f9e44', .06); d.position.set(Math.cos(i * 1.05) * 1, 5, Math.sin(i * 1.05) * 1); d.rotation.y = -i * 1.05; d.rotation.z = -.35; g.add(d); } g.position.set(x, 0, z); P.sc.add(g); bisaPudar(g, 2); }
[[-10, -6], [2.4, -6.4], [13, -6.6], [-3, -6.8], [15, 4], [-16, 2], [9, 13], [-8, 17], [6, 17]].forEach(([x, z]) => kelapa(x, z));
for (let i = 0; i < 40; i++) { const x = acak(-16, 16), z = acak(-4, 16); if (Math.abs(x) < 10.5 && z > -3 && z < 9) continue; const b = bungaVoxel(pilih(['#ff6fa3', '#ffd43b', '#ffffff', '#74c0fc'])); b.position.set(x, 0, z); P.sc.add(b); }
const awan = [awanVoxel(1.4), awanVoxel(1.1), awanVoxel(1.6)]; awan.forEach((a, i) => { a.position.set(-14 + i * 12, 9 + i, -18 + i * 3); P.sc.add(a); });
{ const g = new THREE.Group(); tambah(g, .16, 1.5, .16, -1.3, .75, 0, '#8a5a32', .03); tambah(g, .16, 1.5, .16, 1.3, .75, 0, '#8a5a32', .03); tambah(g, 3.1, .9, .14, 0, 1.5, 0, '#1c7ed6', .06);
  const t = teksVoxel('ENGLISH HARBOR', '#fff', .036, 1); t.position.set(0, 1.45, .1); g.add(t); g.position.set(3.4, 0, 7.8); g.rotation.y = YAW_ISO; P.sc.add(g); }
pembaru.push((dt, t) => { awan.forEach(a => { a.position.x += dt * .35; if (a.position.x > 26) a.position.x = -26; }); ombak.forEach((r, i) => { r.position.x += dt * .5; if (r.position.x > 24) r.position.x = -24; });
  perahu.position.y = Math.sin(t * 1.4) * .08; perahu.rotation.z = Math.sin(t * 1.1) * .04; });

// ---------- Nina (seragam SD, rambut kuncir, ransel ungu) ----------
const nina = buatKarakter({jenis: 'P', kulit: KULIT[1], rambut: {gaya: 'kuncir', warna: '#2b1d12'}, atasan: {jenis: 'seragam', warna: '#ffffff'}, bawahan: {jenis: 'rok', warna: '#c92a2a'}, sepatu: '#212529'});
{ const b = nina.userData.badan; tambah(b, .95, 1.0, .42, 0, .65, -.5, '#7048e8', .12); tambah(b, .7, .38, .14, 0, .45, -.75, '#5f3dc4', .06); [-1, 1].forEach(s => tambah(b, .12, 1.0, .08, s * .36, .68, .32, '#5f3dc4', .03)); }
P.sc.add(nina);

const tanpaEmoji = s => s.replace(/[\p{Extended_Pictographic}‍️]/gu, '').trim();
const kotakMainan = (nama, i) => { const g = keranjangPT(nama, i); g.children[0].material = new THREE.MeshStandardMaterial({color: ['#ff8787', '#74c0fc', '#8ce99a'][i % 3], roughness: .6}); return g; };
const POS = {
  pier: {pusat: [-6.6, -6.6], jarak: 1.55, sambung: null,
    bicara: async q => { const huruf = !/[|\s]/.test(q.soal.trim()); await ucap(huruf ? `Susun huruf menjadi kata bahasa Inggris!${q.jawaban ? ' ' + q.jawaban : ''}` : `Susun kata menjadi kalimat bahasa Inggris!${q.jawaban ? ' ' + q.jawaban : ''}`); }},
  pasar: {pusat: [6, -2.4], jarak: 2.4, bicara: async q => { const t = tanpaEmoji(q.soal); if (t) await ucapBahasa(t); else await ucap('Apa bahasa Inggrisnya?', {tampil: false}); }},
  kafe: {pusat: [7.4, 5.8], sisi: 0, x: 5.4, z: 7.6, ikon: '💬', saatBaca: () => setMode(pelayan, 'lambai', 2)},
  toko: {pusat: [-6.4, 5.8], buatKeranjang: kotakMainan, bicara: async (q, kel) => { await ucap(`${(q.jawaban || 'Masukkan ke kotak yang tepat').replace(/[.!?]?$/, '.')}`); await ucapBahasa(kel.map(k => k.nama).join(', or ')); }},
  awal: {pusat: [0, 3.4], x: 0, z: 4.4},
};
PT.saatBenar = q => { if (q.jenis === 'pilih') setMode(penjual, 'senang', 1.5); if (q.jenis === 'bacaan') setMode(pelayan, 'senang', 1.5); };
mulaiPetualang({tokoh: nina, POS, stasiun: {susun: 'pier', pilih: 'pasar', bacaan: 'kafe', kelompok: 'toko'}, judul: 'English Explorer', ajakan: 'Jelajahi English Harbor bersama Nina!', bahasaKata: 'en-US', npc: [penjual, pelayan], jalan: ["Let's go!", 'Ayo ke pos berikutnya!', 'Next challenge!']});

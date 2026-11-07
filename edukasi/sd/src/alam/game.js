// Penjelajah Alam SD (IPAS): Bayu si pramuka menjelajahi Lembah Alam (kamera isometrik).
// Pos: Kebun (pilih), Kolam Siklus (susun), Pos Daur Ulang (kelompok), Menara Pengamat (bacaan).
import {rumahMesh} from '../../public/duniakotak/mabar/js/aset/rumah.js';
import {tanamanMesh} from '../../public/duniakotak/mabar/js/aset/tanaman.js';

aturMusik({bpm: 104, nada: 60, alat: 'xilofon', progresi: [0, 4, 5, 3], benih: 73});
siapPanggung({langit: '#d3f9d8', lebarArea: 12, dalamArea: 10, lebarTegak: 7, dalamTegak: 9, sudut: 40, yaw: YAW_ISO, fov: 30, dMin: 15, dMax: 62, batasX: 5, batasZ: [-5, 5]});
P.sc.background = gradasi('#b2f2bb'); P.sc.fog = new THREE.Fog('#d3f9d8', 45, 110);
{ const sh = P.mt.shadow.camera; sh.left = sh.bottom = -22; sh.right = sh.top = 22; sh.far = 60; sh.updateProjectionMatrix(); P.mt.position.set(10, 22, 14); }

// ---------- Lembah Alam ----------
P.sc.add(tanahVoxel(60, 60, ['#7bc96f', '#71c165', '#86d17a']));
function jalur(x0, z0, x1, z1, w = '#d8c3a5') { const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / .9); for (let i = 0; i <= n; i++) { const t = i / n; const b = kotak(.7, .06, .7, variasi(w, .05), .08, {roughness: .95}); b.position.set(x0 + (x1 - x0) * t + acak(-.1, .1), .03, z0 + (z1 - z0) * t + acak(-.1, .1)); b.rotation.y = acak(-.3, .3); b.castShadow = false; P.sc.add(b); } }
jalur(0, 4, -4.2, -4.6); jalur(0, 4, 7.6, -1.2); jalur(0, 4, -5, 7.2); jalur(0, 4, 5.6, 7.4);
{ const a = alasBatu(9, '#d9cdb2'); a.position.set(0, 0, 4.6); P.sc.add(a); }
// kolam dengan daun teratai
const kolam = new THREE.Group();
{ const air = kotak(9, .1, 5, '#4dabf7', .4, {roughness: .2}); air.position.y = .04; air.castShadow = false; kolam.add(air);
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; const b = kotak(.7, .3, .7, variasi('#adb5bd', .06), .12); b.position.set(Math.cos(a) * 4.7, .15, Math.sin(a) * 2.7); kolam.add(b); }
  for (let i = 0; i < 7; i++) { const d = kotak(.8, .05, .8, '#51cf66', .35); d.position.set(acak(-3.5, 3.5), .1, acak(-1.8, 1.8)); kolam.add(d); if (i % 2) { const bg = kotak(.25, .2, .25, '#f783ac', .1); bg.position.copy(d.position).setY(.22); kolam.add(bg); } } }
kolam.position.set(-7, 0, -7.6); kolam.rotation.y = .2; P.sc.add(kolam);
const katak = new THREE.Group(); tambah(katak, .5, .3, .45, 0, .15, 0, '#40c057', .12); mataK(katak, .12, .34, .1, .09); katak.position.set(-9.4, .1, -6.4); P.sc.add(katak);
// kebun tanaman
const kebun = new THREE.Group();
[['tomat', -1.8, 0], ['jagung', 0, -.4], ['matahari', 1.8, 0], ['cabai', -.9, -2], ['tomat', .9, -2]].forEach(([n, x, z]) => { const t = tanamanMesh(n, {tahap: 3}); t.scale.setScalar(.06); t.position.set(x, 0, z); kebun.add(t); });
for (let x = -2.6; x <= 2.6; x += .65) { tambah(kebun, .1, .6, .1, x, .3, 1, '#a0703e', .02); } tambah(kebun, 5.4, .08, .06, 0, .45, 1, '#b8834a', .02);
kebun.position.set(8.4, 0, -4.8); kebun.rotation.y = YAW_ISO; P.sc.add(kebun);
const petani = buatKarakter({jenis: 'L', kulit: KULIT[4], rambut: {gaya: 'cepak', warna: '#222'}, atasan: {jenis: 'kaos', warna: '#2f9e44'}, bawahan: {jenis: 'celana', warna: '#5c4a3a'}, topi: '#e9c46a'});
petani.position.set(9.6, 0, -2.2); hadapDepan(petani, YAW_ISO * .5); P.sc.add(petani);
// menara pengamat
const menara = new THREE.Group();
{ [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => tambah(menara, .22, 4, .22, x, 2, z, '#8a5a32', .03));
  tambah(menara, 2.8, .2, 2.8, 0, 4, 0, '#a0703e', .04); [-1, 1].forEach(s => { tambah(menara, 2.8, .5, .1, 0, 4.35, s * 1.35, '#8a5a32', .02); tambah(menara, .1, .5, 2.8, s * 1.35, 4.35, 0, '#8a5a32', .02); });
  const atap = kotak(3.2, .3, 3.2, '#2f9e44', .1); atap.position.y = 5.8; menara.add(atap); [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(([x, z]) => tambah(menara, .12, 1.5, .12, x, 5, z, '#8a5a32', .02));
  for (let y = .4; y < 4; y += .45) tambah(menara, .9, .08, .14, 0, y, 1.2, '#b8834a', .02); }
menara.position.set(10, 0, 4.4); P.sc.add(menara); bisaPudar(menara, 2.4);
const ranger = buatKarakter({jenis: 'P', kulit: KULIT[2], rambut: {gaya: 'kuncir', warna: '#2b1d12'}, atasan: {jenis: 'kemeja', warna: '#5c940d'}, bawahan: {jenis: 'celana', warna: '#495057'}, topi: '#5c940d'});
ranger.position.set(9.2, 0, 7); hadapDepan(ranger, YAW_ISO * .3); P.sc.add(ranger);
// pos daur ulang (papan)
{ const g = new THREE.Group(); tambah(g, .16, 1.8, .16, -1.4, .9, 0, '#8a5a32', .03); tambah(g, .16, 1.8, .16, 1.4, .9, 0, '#8a5a32', .03); tambah(g, 3.3, .8, .14, 0, 1.8, 0, '#2b8a3e', .06);
  const t = teksVoxel('DAUR ULANG', '#fff', .045, 1); t.position.set(0, 1.75, .1); g.add(t); g.position.set(-8.4, 0, 3.2); g.rotation.y = YAW_ISO; P.sc.add(g); }
// hutan & bunga
[[-11, -2], [-3, -4.8], [2.6, -5.4], [13.5, -1], [-15, 5], [14, 9], [-9, 12], [9, 13.5], [-4, 13], [3, 14], [-18, -3], [18, -5], [-6, 18], [6, 18], [-13, 9], [15, 3]].forEach(([x, z]) => { const p = pohonVoxel(acak(5, 7.5), pilih(['#2b8a3e', '#37b24d', '#2f9e44', '#40c057'])); p.position.set(x, 0, z); P.sc.add(p); bisaPudar(p, 2); });
for (let i = 0; i < 50; i++) { const x = acak(-17, 17), z = acak(-5, 17); if (Math.abs(x) < 10.5 && z > -3 && z < 9) continue; const b = bungaVoxel(pilih(['#ff6fa3', '#ffd43b', '#ffffff', '#ff922b'])); b.position.set(x, 0, z); P.sc.add(b); }
[[-9.5, 9.5], [12, -3.5], [-1.5, 10]].forEach(([x, z]) => { const b = batuVoxel(acak(.8, 1.4)); b.position.set(x, 0, z); P.sc.add(b); });
const tenda = new THREE.Group(); { const s = new THREE.Shape(); s.moveTo(-1.3, 0); s.lineTo(1.3, 0); s.lineTo(0, 1.8); s.lineTo(-1.3, 0); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, {depth: 2.4, bevelEnabled: false}), new THREE.MeshStandardMaterial({color: '#f08c00', roughness: .8})); m.position.z = -1.2; m.castShadow = true; tenda.add(m); }
tenda.position.set(-13, 0, 1.5); tenda.rotation.y = .6; P.sc.add(tenda);
const kupu = []; for (let i = 0; i < 5; i++) { const k = new THREE.Group(); [-1, 1].forEach(s => tambah(k, .18, .02, .22, s * .1, 0, 0, pilih(['#ffd43b', '#f783ac', '#74c0fc']), .02)); k.position.set(acak(-8, 8), acak(1, 2.4), acak(-3, 8)); P.sc.add(k); kupu.push(k); }
const awan = [awanVoxel(1.4), awanVoxel(1.1), awanVoxel(1.6)]; awan.forEach((a, i) => { a.position.set(-14 + i * 12, 9 + i, -16 + i * 3); P.sc.add(a); });
{ const g = new THREE.Group(); tambah(g, .16, 1.5, .16, -1.3, .75, 0, '#8a5a32', .03); tambah(g, .16, 1.5, .16, 1.3, .75, 0, '#8a5a32', .03); tambah(g, 3.1, .9, .14, 0, 1.5, 0, '#2b8a3e', .06);
  const t = teksVoxel('LEMBAH ALAM', '#fff', .042, 1); t.position.set(0, 1.45, .1); g.add(t); g.position.set(3.4, 0, 7.8); g.rotation.y = YAW_ISO; P.sc.add(g); }
pembaru.push((dt, t) => { awan.forEach(a => { a.position.x += dt * .35; if (a.position.x > 26) a.position.x = -26; });
  kupu.forEach((k, i) => { k.position.x += Math.sin(t * .5 + i) * dt * .8; k.position.y = 1.6 + Math.sin(t * 2 + i) * .4; k.children.forEach((w, j) => w.rotation.z = (j ? -1 : 1) * Math.sin(t * 14 + i) * .7); });
  katak.position.y = .1 + Math.max(0, Math.sin(t * 2.2)) * .25; });

// ---------- Bayu (seragam pramuka + teropong) ----------
const bayu = buatKarakter({jenis: 'L', kulit: KULIT[3], rambut: {gaya: 'belah', warna: '#1a1a1a'}, atasan: {jenis: 'kemeja', warna: '#c8a165'}, bawahan: {jenis: 'pendek', warna: '#6b4f2a'}, sepatu: '#212529'});
{ const b = bayu.userData.badan; [-1, 1].forEach(s => tambah(b, .2, .3, .2, s * .13, .95, .32, '#343a40', .05)); tambah(b, .1, .1, .1, 0, 1.12, .3, '#c92a2a', .02); tambah(b, .9, .95, .4, 0, .65, -.5, '#2b8a3e', .12); }
P.sc.add(bayu);

// tong sampah untuk pos daur ulang
function tong(nama, i) {
  const g = new THREE.Group(); const w = ['#2f9e44', '#f08c00', '#1c7ed6'][i % 3];
  tambah(g, 1.4, 1.4, 1.2, 0, .7, 0, w, .14); tambah(g, 1.55, .18, 1.35, 0, 1.45, 0, variasi(w, .1), .06); tambah(g, .5, .1, .2, 0, 1.6, 0, '#343a40', .03);
  const p = papan(nama, {lebar: 2.2, tinggi: .95, tiang: 0, tepi: w}); p.position.y = 1.75; p.userData.muka.rotation.y = 0; g.add(p); g.rotation.y = YAW_ISO; g.userData.muka = p.userData.muka; return g;
}
const daun = t => { const g = papan(t, {lebar: 1.5, tinggi: 1.0, tiang: .1, tepi: '#69db7c', kayu: '#2b8a3e'}); const d = kotak(1.2, .08, 1.2, '#51cf66', .4); d.position.y = .08; g.add(d); return g; };
const POS = {
  kolam: {pusat: [-6.4, -6.4], jarak: 1.8, buatKeping: daun, ajak: q => `Susun urutan yang benar!${q.jawaban ? ' ' + q.jawaban : ''}`},
  kebun: {pusat: [6, -2.4], jarak: 2.4},
  menara: {pusat: [7.4, 5.8], sisi: 0, x: 5.4, z: 7.6, ikon: '🔭', saatBaca: () => setMode(ranger, 'lambai', 2)},
  daur: {pusat: [-6.4, 5.8], buatKeranjang: tong, ajak: q => `${(q.jawaban || 'Kelompokkan dengan benar').replace(/[.!?]?$/, '.')} Ketuk tong yang tepat!`},
  awal: {pusat: [0, 3.4], x: 0, z: 4.4},
};
PT.saatBenar = q => { if (q.jenis === 'pilih') setMode(petani, 'senang', 1.5); if (q.jenis === 'bacaan') setMode(ranger, 'senang', 1.5); };
mulaiPetualang({tokoh: bayu, POS, stasiun: {susun: 'kolam', pilih: 'kebun', bacaan: 'menara', kelompok: 'daur'}, judul: 'Penjelajah Alam', ajakan: 'Jelajahi Lembah Alam bersama Bayu!', npc: [petani, ranger], jalan: ['Ayo jelajahi pos berikutnya!', 'Jalan terus, Bayu!', 'Alam menunggu untuk dijelajahi!']});

// Pelangi Bentuk: main warna dan bentuk bersama Lala di ruang bermain.
// Jenis soal: warna (ketuk warna), bentuk (ketuk bentuk), sortir-warna / sortir-bentuk (masukkan ke kotak yang sama).
const WARNA = {merah: '#e03131', kuning: '#fcc419', biru: '#1c7ed6', hijau: '#37b24d', oranye: '#f76707', ungu: '#7048e8', 'merah muda': '#f06595'};
const BENTUK = ['lingkaran', 'persegi', 'segitiga', 'bintang', 'hati'];
GURU.kolom = [
  {k: 'jenis', label: 'Jenis (warna/bentuk/sortir-warna/sortir-bentuk)', contoh: 'warna'},
  {k: 'target', label: 'Jawaban (' + Object.keys(WARNA).join(', ') + ' / ' + BENTUK.join(', ') + ')', contoh: 'biru'},
];
GURU.pengaturan = [
  {k: 'pilihan', label: 'Banyak pilihan', min: 2, max: 4},
  {k: 'urutan', label: 'Urutan soal', tipe: 'pilih', opsi: [['berurutan', 'Berurutan'], ['acak', 'Acak']]},
];
GURU.terapkan = () => mulaiMain();
pasangGuru();
aturMusik({bpm: 96, nada: 67, alat: 'kotakmusik', progresi: [0, 5, 3, 4], benih: 5, drum: false});

siapPanggung({langit: '#efe6ff', tanahWarna: '#e9d5b5', lebarArea: 10, dalamArea: 10, lebarTegak: 6.6, dalamTegak: 9.2});
// lantai papan kayu
P.sc.add(tanahVoxel(36, 28, ['#e8c99b', '#dfbd8c']));
// karpet pelangi
{ const pel = ['#ff8787', '#ffc078', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc']; pel.forEach((c, i) => { const r = 5.5 * (1 - i / 6); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .04, 48), new THREE.MeshStandardMaterial({color: c, roughness: .95})); m.scale.z = 13 / 22; m.position.set(0, .02 + i * .006, .2); m.receiveShadow = true; P.sc.add(m); }); }
// dinding belakang + pelangi voxel
{ const g = new THREE.Group(); tambah(g, 24, 7.8, .3, 0, 3.7, 0, '#f8f0ff', .1); const pel = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'];
  pel.forEach((c, i) => { const r = 6.6 - i * .6; const m = new THREE.Mesh(new THREE.RingGeometry(r - .6, r, 48, 1, 0, Math.PI), new THREE.MeshStandardMaterial({color: c, roughness: .9})); m.position.set(0, .4, .16 + i * .002); g.add(m); });
  g.position.set(0, 0, -9); P.sc.add(g); }
// mainan hiasan: balok susun & bola
function balokMainan(w) { const g = new THREE.Group(); tambah(g, .5, .5, .5, 0, .25, 0, w, .08); return g; }
[[-7, -6, '#e03131'], [-6.4, -6, '#fcc419'], [-6.7, -6, '#1c7ed6', .5], [7, -5.5, '#37b24d'], [6.4, -6.2, '#7048e8'], [-8, 3, '#f76707'], [8.2, 3.5, '#f06595']].forEach(([x, z, c, y]) => { const b = balokMainan(c); b.position.set(x, y || 0, z); b.rotation.y = acak(-.4, .4); P.sc.add(b); });

// ---------- bentuk voxel ----------
function diDalam(bentuk, u, v) {
  if (bentuk === 'lingkaran') return u * u + v * v <= .95;
  if (bentuk === 'persegi') return Math.abs(u) <= .82 && Math.abs(v) <= .82;
  if (bentuk === 'segitiga') return v >= -.85 && v <= .9 && Math.abs(u) <= (.9 - v) * .55;
  if (bentuk === 'hati') { const x = u * 1.15, y = v * 1.2 + .25; return Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y <= 0; }
  if (bentuk === 'bintang') { const a = Math.atan2(u, v), r = Math.hypot(u, v); const k = Math.PI / 5; const t = ((a % (2 * k)) + 2 * k) % (2 * k); const f = Math.abs(t - k) / k; return r <= .42 + .58 * Math.pow(f, 1.6); }
  return false;
}
// garis luar tiap bentuk (lebar ±.78, tinggi 0..1.56) -> diekstrusi jadi balok mainan membulat
function garisBentuk(bentuk, sk = .78) {
  const s = new THREE.Shape(), cy = sk;
  if (bentuk === 'lingkaran') s.absarc(0, cy, sk * .95, 0, Math.PI * 2, false);
  else if (bentuk === 'persegi') { const a = sk * .8, r = .12; s.moveTo(-a + r, cy - a); s.lineTo(a - r, cy - a); s.quadraticCurveTo(a, cy - a, a, cy - a + r); s.lineTo(a, cy + a - r); s.quadraticCurveTo(a, cy + a, a - r, cy + a); s.lineTo(-a + r, cy + a); s.quadraticCurveTo(-a, cy + a, -a, cy + a - r); s.lineTo(-a, cy - a + r); s.quadraticCurveTo(-a, cy - a, -a + r, cy - a); }
  else if (bentuk === 'segitiga') { s.moveTo(-sk * .95, cy - sk * .82); s.lineTo(sk * .95, cy - sk * .82); s.lineTo(0, cy + sk * .9); s.closePath(); }
  else if (bentuk === 'bintang') { for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? sk * .42 : sk; const x = Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); } s.closePath(); }
  else if (bentuk === 'hati') { const k = sk * .95, y0 = cy - k * .8; s.moveTo(0, y0); s.bezierCurveTo(k * .6, y0 + k * .5, k * 1.1, y0 + k * .9, k * .95, y0 + k * 1.3); s.bezierCurveTo(k * .8, y0 + k * 1.75, k * .2, y0 + k * 1.8, 0, y0 + k * 1.35); s.bezierCurveTo(-k * .2, y0 + k * 1.8, -k * .8, y0 + k * 1.75, -k * .95, y0 + k * 1.3); s.bezierCurveTo(-k * 1.1, y0 + k * .9, -k * .6, y0 + k * .5, 0, y0); }
  return s;
}
function bentukVoxel(bentuk, warna, {tebal = .26} = {}) {
  const geo = new THREE.ExtrudeGeometry(garisBentuk(bentuk), {depth: tebal, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 3, curveSegments: 24}); geo.translate(0, 0, -tebal / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color: warna, roughness: .6})); m.castShadow = m.receiveShadow = true; return m;
}
function bendaBentuk(bentuk, warna) { const g = new THREE.Group(); const m = bentukVoxel(bentuk, warna); m.rotation.x = -.38; m.position.y = .25; g.add(m); g.add(alasBatu(5, '#ffffff', .13)); g.userData = {bentuk, warna, m}; return g; }
function kotakMainan(warnaKotak, ikonBentuk) {
  const g = new THREE.Group(), W = 1.68, H = 1.08, D = 1.2, t = .1;
  tambah(g, W, t, D, 0, t / 2, 0, variasi(warnaKotak, .03), .04);
  tambah(g, W, H, t, 0, H / 2, -D / 2 + t / 2, warnaKotak, .04); tambah(g, W, H * .75, t, 0, H * .375, D / 2 - t / 2, variasi(warnaKotak, .04), .04);
  [-1, 1].forEach(sx => tambah(g, t, H, D, sx * (W / 2 - t / 2), H / 2, 0, variasi(warnaKotak, .04), .04));
  if (ikonBentuk) { const m = new THREE.Mesh(new THREE.ShapeGeometry(garisBentuk(ikonBentuk, .26), 16), new THREE.MeshStandardMaterial({color: '#ffffff', roughness: .7})); m.position.set(0, .1, D / 2 + .005); g.add(m); }
  return g;
}

// Lala: avatar warga Dunia Kotak, rambut kuncir, kaos ungu, rok pink
const lala = buatKarakter({
  jenis: 'P', kulit: KULIT[2], rambut: {gaya: 'kuncir', warna: WARNA_RAMBUT[1]},
  atasan: {jenis: 'kaos', warna: '#9c6cf0'}, bawahan: {jenis: 'rok', warna: '#f06595'}, sepatu: '#ffffff',
});
hadapDepan(lala); P.tokoh = lala;
const posLala = () => tegak() ? {x: 0, z: 3.1} : {x: 0, z: 3.7};
lala.position.set(posLala().x, 0, posLala().z); P.sc.add(lala);
pembaru.push(dt => { gerakKarakter(lala, dt); animasiKarakter(lala, dt); });

const soalSah = () => (DATA.soal || []).map(s => ({jenis: String(s.jenis || '').trim().toLowerCase(), target: String(s.target || '').trim().toLowerCase()})).filter(s => (/warna/.test(s.jenis) && WARNA[s.target]) || (/bentuk/.test(s.jenis) && BENTUK.includes(s.target)));
let urut = [], idx = 0, skor = 0, N = 0;
function mulaiMain() { urut = soalSah(); if (DATA.urutan === 'acak') urut = kocok(urut); N = urut.length; idx = 0; skor = 0; aturBintang(0, N); if (!N) { tulisGelembung('Belum ada soal. Buka Mode Guru.'); return; } putaran(); }
const nPil = () => Math.min(4, Math.max(2, +DATA.pilihan || 3));
async function putaran() {
  bersihRonde(); kunci = true;
  if (idx >= N) { setMode(lala, 'senang', 3); konfeti(new THREE.Vector3(0, 2, 0), undefined, 90); await ucap('Hore! Kamu jago warna dan bentuk!'); layarSelesai(skor, N, mulaiMain); return; }
  const p = posLala(); await jalanKe(lala, p.x, p.z);
  const q = urut[idx]; return q.jenis.startsWith('sortir') ? rondeSortir(q) : rondeKetuk(q);
}
async function benar(teks, pos) { efek.benar(); setMode(lala, 'senang', 1.8); konfeti(pos || new THREE.Vector3(0, 1.5, 0)); skor++; aturBintang(skor, N); await ucap(teks); idx++; putaran(); }
const kataBenda = (b) => `${b.bentuk} ${Object.keys(WARNA).find(k => WARNA[k] === b.warna)}`;

// --- Ketuk warna / bentuk ---
async function rondeKetuk(q) {
  const n = nPil(), modeWarna = q.jenis === 'warna';
  const warnaLain = kocok(Object.keys(WARNA).filter(w => w !== q.target)), bentukLain = kocok(BENTUK.filter(b => b !== q.target));
  const benda = [];
  for (let i = 0; i < n; i++) {
    const tgt = i === 0;
    const w = modeWarna ? (tgt ? q.target : warnaLain[i - 1]) : pilih(Object.keys(WARNA));
    const b = modeWarna ? pilih(BENTUK) : (tgt ? q.target : bentukLain[i - 1]);
    benda.push({bentuk: b, warna: WARNA[w], tgt});
  }
  const pos = posisiPilihan(n, {jarak: 2.6, z: -1.4});
  kocok(benda).forEach((d, i) => { const g = bendaBentuk(d.bentuk, d.warna); g.position.set(pos[i].x, 0, pos[i].z); g.userData.tgt = d.tgt; tambahRonde(g); muncul(g); daftarKetuk(g, o => jawab(o)); });
  const jawab = async o => {
    kunci = true; efek.pop(); await jalanKe(lala, o.position.x, o.position.z + 1.2); setMode(lala, 'tunjuk', .6);
    if (o.userData.tgt) { animasi(.7, (e, p) => { o.userData.m.rotation.y = p * Math.PI * 2; }, x => x); lompat(o, .5, .5); await benar(`${pilih(PUJIAN)} Ini ${modeWarna ? 'warna ' + q.target : q.target}!`, o.position.clone().setY(1.4)); }
    else { efek.salah(); setMode(lala, 'geleng', 1.2); goyang(o.userData.m); await ucap(`Itu ${modeWarna ? 'warna ' + Object.keys(WARNA).find(k => WARNA[k] === o.userData.warna) : o.userData.bentuk}. ${pilih(SEMANGAT)}`); kunci = false; }
  };
  await ucap(modeWarna ? `Ketuk yang berwarna ${q.target}!` : `Mana bentuk ${q.target}? Ketuk ya!`); kunci = false;
}

// --- Sortir: masukkan benda ke kotak yang warnanya / bentuknya sama ---
async function rondeSortir(q) {
  const n = nPil(), modeWarna = q.jenis === 'sortir-warna';
  const opsi = modeWarna ? [q.target, ...kocok(Object.keys(WARNA).filter(w => w !== q.target)).slice(0, n - 1)] : [q.target, ...kocok(BENTUK.filter(b => b !== q.target)).slice(0, n - 1)];
  const warnaBenda = modeWarna ? WARNA[q.target] : WARNA[pilih(Object.keys(WARNA))];
  const benda = bendaBentuk(modeWarna ? pilih(BENTUK) : q.target, warnaBenda); benda.remove(benda.children[1]);
  benda.position.set(0, 0, .9); tambahRonde(benda); muncul(benda);
  const terbang = (dt) => { if (!benda.parent) return pembaru.splice(pembaru.indexOf(terbang), 1); if (!benda.userData.diam) benda.position.y = .5 + Math.sin(performance.now() / 400) * .15; };
  pembaru.push(terbang);
  const pos = posisiPilihan(n, {jarak: 2.8, z: -1.6});
  kocok(opsi).forEach((o, i) => {
    const k = modeWarna ? kotakMainan(WARNA[o]) : kotakMainan('#ced4da', o);
    const g = new THREE.Group(); g.add(k); g.position.set(pos[i].x, 0, pos[i].z); g.userData.o = o; tambahRonde(g); muncul(g);
    daftarKetuk(g, gg => jawab(gg));
  });
  const jawab = async g => {
    kunci = true;
    if (g.userData.o === q.target) {
      benda.userData.diam = true; await terbangKe(benda, new THREE.Vector3(g.position.x, .5, g.position.z), .6, 1.6); lompat(g, .25, .3);
      await benar(`${pilih(PUJIAN)} Masuk ke kotak ${modeWarna ? q.target : q.target}!`, g.position.clone().setY(1.3));
    } else { efek.salah(); goyang(g); setMode(lala, 'geleng', 1.2); await ucap(`Bukan kotak itu. Cari kotak ${modeWarna ? 'warna ' + q.target : 'bergambar ' + q.target}. ${pilih(SEMANGAT)}`); kunci = false; }
  };
  await ucap(modeWarna ? `Ini warna ${q.target}. Masukkan ke kotak yang warnanya sama!` : `Ini bentuk ${q.target}. Masukkan ke kotak yang gambarnya sama!`); kunci = false;
}

aturBintang(0, soalSah().length); tulisGelembung('Ketuk Main untuk mulai');
setMode(lala, 'lambai'); loop();
layarMulai(DATA.judul || 'Pelangi Bentuk', 'Main warna dan bentuk bersama Lala!', mulaiMain);

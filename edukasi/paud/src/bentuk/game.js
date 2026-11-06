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

siapPanggung({langit: '#efe6ff', tanahWarna: '#e9d5b5', lebarArea: 10, dalamArea: 10, lebarTegak: 6.6, dalamTegak: 9.2});
// lantai papan kayu
{ const v = new Vox(.5); for (let x = -18; x < 18; x++) for (let z = -14; z < 14; z++) v.set(x, 0, z, variasi(Math.floor((z + 100) / 1) % 2 ? '#e8c99b' : '#dfbd8c', .02)); const m = v.mesh({bulat: false}); m.position.y = -.5; m.castShadow = false; P.sc.add(m); }
// karpet pelangi
{ const v = new Vox(.25); const pel = ['#ff8787', '#ffc078', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc']; for (let x = -22; x < 22; x++) for (let z = -13; z < 13; z++) { const d = Math.hypot(x / 22, z / 13); if (d <= 1) v.set(x, 0, z, variasi(pel[Math.min(5, Math.floor(d * 6))], .02)); } const m = v.mesh({bulat: false}); m.position.set(0, -.2, .2); m.castShadow = false; P.sc.add(m); }
// dinding belakang + pelangi voxel
{ const v = new Vox(.3); for (let x = -40; x < 40; x++) for (let y = 0; y < 26; y++) v.set(x, y, 0, variasi('#f8f0ff', .015)); const pel = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'];
  for (let x = -22; x <= 22; x++) for (let y = 0; y <= 22; y++) { const r = Math.hypot(x, y); const i = Math.floor((22 - r) / 2); if (r <= 22 && i >= 0 && i < 6) v.set(x, y + 2, 1, pel[i]); }
  const m = v.mesh({bulat: false}); m.position.set(0, -.2, -9); P.sc.add(m); }
// mainan hiasan: balok susun & bola
function balokMainan(w) { const v = new Vox(.25); v.box(0, 0, 0, 2, 2, 2, w); return v.mesh(); }
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
function bentukVoxel(bentuk, warna, {n = 13, s = .12, tebal = 3} = {}) {
  const v = new Vox(s);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const u = (i + .5) / n * 2 - 1, w = (j + .5) / n * 2 - 1; if (!diDalam(bentuk, u, w)) continue; for (let z = 0; z < tebal; z++) v.set(i - Math.floor(n / 2), j, z - 1, z === tebal - 1 ? variasi(warna, .03) : variasi(warna, .08)); }
  return v.mesh();
}
function bendaBentuk(bentuk, warna) { const g = new THREE.Group(); const m = bentukVoxel(bentuk, warna); m.rotation.x = -.38; m.position.y = .25; g.add(m); g.add(alasBatu(5, '#ffffff', .13)); g.userData = {bentuk, warna, m}; return g; }
function kotakMainan(warnaKotak, ikonBentuk) {
  const v = new Vox(.12); const W = 14, H = 9, D = 10;
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) { const tepi = x === 0 || x === W - 1 || z === 0 || z === D - 1 || y === 0; if (tepi) v.set(x - W / 2, y, z - D / 2, variasi(warnaKotak, .04)); }
  if (ikonBentuk) for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) { const u = (i + .5) / 9 * 2 - 1, w = (j + .5) / 7 * 2 - 1; if (diDalam(ikonBentuk, u, w)) v.set(i - 4, j + 1, D / 2, '#ffffff'); }
  return v.mesh();
}

// Lala: anak perempuan rambut panjang, baju ungu, baret pelukis
const lala = buatKarakter({
  kulit: '#e8b48a', rambut: '#2b1a12', baju: '#9c6cf0', celana: '#f06595', sepatu: '#ffffff', rambutPanjang: true,
  topi: v => { v.box(-6, 10, -5, 12, 1, 11, () => variasi('#e03131', .04)); v.box(-4, 11, -3, 8, 1, 7, '#e03131'); v.set(0, 12, 0, '#c92a2a'); },
  aksen: v => { [['#ff6b6b', 5], ['#ffd43b', 4], ['#69db7c', 3], ['#4dabf7', 2]].forEach(([c, y]) => v.box(-4, y, 2, 8, 1, 1, c)); },
});
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
  const p = posLala(); await jalanKe(lala, p.x, p.z); lala.rotation.y = 0;
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
    kunci = true; efek.pop(); await jalanKe(lala, o.position.x, o.position.z + 1.2); lala.rotation.y = Math.PI; setMode(lala, 'tunjuk', .6);
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

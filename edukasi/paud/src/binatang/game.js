// Kebun Binatang Suara: Dodo si penjaga kebun binatang mengajak menebak hewan.
// Jenis soal: suara (dengar suara, tebak hewan), makanan (pilih makanan hewan), nama (ketuk hewan yang disebut).
const HEWAN_ADA = ['kucing', 'anjing', 'sapi', 'kambing', 'ayam', 'bebek', 'kelinci', 'monyet', 'gajah', 'singa'];
const MAKANAN_ADA = ['ikan', 'tulang', 'rumput', 'jagung', 'wortel', 'pisang', 'tebu', 'daging'];
GURU.kolom = [
  {k: 'jenis', label: 'Jenis (suara/makanan/nama)', contoh: 'suara'},
  {k: 'hewan', label: 'Hewan (' + HEWAN_ADA.join(', ') + ')', contoh: 'kucing'},
];
GURU.pengaturan = [
  {k: 'pilihan', label: 'Banyak pilihan', min: 2, max: 4},
  {k: 'urutan', label: 'Urutan soal', tipe: 'pilih', opsi: [['berurutan', 'Berurutan'], ['acak', 'Acak']]},
];
GURU.terapkan = () => mulaiMain();
pasangGuru();
aturMusik({bpm: 108, nada: 62, alat: 'xilofon', progresi: [0, 3, 0, 4], benih: 42});
const infoHewan = h => (DATA.hewan || []).find(x => x.hewan === h) || {hewan: h, suara: '', makanan: ''};

siapPanggung({langit: '#d6f0ff', tanahWarna: '#b5d98a', lebarArea: 11.6, dalamArea: 10, lebarTegak: 6.8, dalamTegak: 9.4});
P.sc.add(tanahVoxel(36, 28, ['#a9d67b', '#a3d175']));
{ const m = lempeng(32, 1.6, '#ecd9a8', .03, .1); m.position.z = .8; P.sc.add(m); }
[[-8, -6], [8, -6.5], [-9.5, 2], [9.5, 3], [-3, -8], [3.5, -8.2]].forEach(([x, z], i) => { const p = pohonVoxel(6, pilih(['#2f9e44', '#40c057', '#37b24d']), '#7a4b25'); p.position.set(x, 0, z); P.sc.add(p); });
for (let i = 0; i < 26; i++) { const b = bungaVoxel(pilih(['#ffd43b', '#ffffff', '#ff8787'])); const x = acak(-12, 12), z = acak(-8, 7); if (Math.abs(x) < 5.5 && z > -4 && z < 4.5) continue; b.position.set(x, 0, z); P.sc.add(b); }
// gapura kebun binatang
{ const g = new THREE.Group(); [-1.95, 1.95].forEach(x => tambah(g, .32, 2.4, .32, x, 1.2, 0, '#8b5a2b', .06)); tambah(g, 4.6, .78, .44, 0, 2.75, 0, '#f2c14e', .1); const t = teksVoxel('ZOO', '#2f9e44', .11, 1); t.position.set(0, 2.5, .3); g.add(t); g.position.set(0, 0, -7.8); P.sc.add(g); }

// ---------- model hewan kotak besar (gaya Dunia Kotak) ----------
// empat kaki: badan, 4 kaki, kepala (grup kp, depan wajah di z = hd/2)
function q4({bw, bh, bd, lh, hw, hh, hd, c, kaki = c, lw = Math.min(bw, bd) * .28}) {
  const g = new THREE.Group(); tambah(g, bw, bh, bd, 0, lh + bh / 2, 0, c, .08);
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => tambah(g, lw, lh + .06, lw, sx * (bw / 2 - lw / 2 - .02), (lh + .06) / 2, sz * (bd / 2 - lw / 2 - .03), kaki, .04)));
  const kp = new THREE.Group(); kp.position.set(0, lh + bh * .75 + hh * .25, bd / 2 + hd * .3); g.add(kp); tambah(kp, hw, hh, hd, 0, 0, 0, c, .08);
  return {g, kp};
}
const MODEL = {
  kucing() { const g = new THREE.Group(); const k = kucingMesh('abu', {skala: .42}); k.rotation.y = -Math.PI / 2; g.add(k); return g; },
  anjing() { const {g, kp} = q4({bw: .7, bh: .6, bd: 1.0, lh: .4, hw: .7, hh: .66, hd: .6, c: '#b4703c', kaki: '#9c5f30'});
    [-1, 1].forEach(s => tambah(kp, .14, .45, .3, s * .41, -.04, -.05, '#6f3f1d')); tambah(kp, .4, .28, .22, 0, -.16, .38, '#e9c39b'); tambah(kp, .16, .1, .06, 0, -.06, .5, '#1b1b1b', .02); mataK(kp, .16, .12, .31);
    tambah(g, .12, .12, .36, 0, .98, -.62, '#b4703c').rotation.x = -.6; return g; },
  sapi() { const {g, kp} = q4({bw: 1.0, bh: .8, bd: 1.4, lh: .5, hw: .8, hh: .8, hd: .6, c: '#f8f9fa', kaki: '#e9ecef'});
    tambah(g, 1.02, .34, .36, 0, .95, -.32, '#212529', .06); tambah(g, 1.02, .3, .28, 0, 1.12, .32, '#212529', .06); tambah(g, .4, .82, .3, .2, .92, -.02, '#212529', .06).scale.set(1, 1, 1);
    tambah(kp, .6, .28, .14, 0, -.22, .33, '#ffc9c9'); [-1, 1].forEach(s => { tambah(kp, .07, .07, .03, s * .13, -.2, .41, '#c92a2a', .01); tambah(kp, .08, .2, .08, s * .3, .48, -.1, '#e9ecef', .03); tambah(kp, .22, .1, .14, s * .5, .22, -.1, '#f8f9fa', .03); });
    mataK(kp, .2, .12, .31); tambah(g, .06, .5, .06, 0, .95, -.73, '#212529', .02); return g; },
  kambing() { const {g, kp} = q4({bw: .7, bh: .6, bd: 1.0, lh: .5, hw: .6, hh: .66, hd: .5, c: '#f1e3c8', kaki: '#d9c7a5'});
    tambah(kp, .16, .26, .1, 0, -.42, .2, '#e3d1ad'); [-1, 1].forEach(s => { tambah(kp, .08, .32, .08, s * .17, .44, -.12, '#868e96', .03).rotation.x = -.5; tambah(kp, .22, .08, .12, s * .38, .12, 0, '#e3d1ad', .03); });
    mataK(kp, .15, .1, .26); tambah(kp, .14, .06, .03, 0, -.14, .26, '#212529', .01); return g; },
  ayam() { const g = new THREE.Group(); tambah(g, .6, .6, .7, 0, .62, 0, '#ffffff', .1); [-1, 1].forEach(s => { tambah(g, .08, .34, .08, s * .12, .17, .05, '#f59f00', .02); tambah(g, .06, .34, .44, s * .32, .64, 0, '#f1f3f5', .03); });
    tambah(g, .4, .5, .4, 0, 1.06, .3, '#ffffff', .08); tambah(g, .12, .2, .3, 0, 1.38, .3, '#e03131', .04); tambah(g, .16, .1, .18, 0, 1.04, .56, '#fab005', .03); tambah(g, .1, .16, .06, 0, .88, .5, '#e03131', .03);
    mataK(g, .1, 1.14, .505, .08); tambah(g, .3, .5, .22, 0, .98, -.42, '#495057', .06).rotation.x = -.3; return g; },
  bebek() { const g = new THREE.Group(); tambah(g, .6, .5, .8, 0, .45, 0, '#ffe066', .1); [-1, 1].forEach(s => { tambah(g, .08, .22, .08, s * .13, .1, .08, '#f76707', .02); tambah(g, .06, .3, .5, s * .32, .48, -.02, '#fcc419', .03); });
    tambah(g, .42, .46, .42, 0, .92, .3, '#ffe066', .08); tambah(g, .34, .08, .26, 0, .84, .6, '#f76707', .03); mataK(g, .1, 1.0, .515, .08); tambah(g, .22, .2, .2, 0, .64, -.46, '#fcc419', .05); return g; },
  kelinci() { const g = new THREE.Group(); tambah(g, .6, .55, .6, 0, .3, 0, '#ffffff', .12); tambah(g, .58, .52, .5, 0, .74, .22, '#ffffff', .1);
    [-1, 1].forEach(s => { tambah(g, .12, .6, .12, s * .14, 1.26, .16, '#ffffff', .05); tambah(g, .07, .45, .03, s * .14, 1.26, .225, '#ffc9c9', .01); tambah(g, .14, .1, .22, s * .15, .05, .3, '#f1f3f5', .03); });
    mataK(g, .13, .8, .475, .09); tambah(g, .08, .06, .04, 0, .68, .48, '#f783ac', .01); tambah(g, .2, .2, .14, 0, .32, -.34, '#f1f3f5', .08); return g; },
  monyet() { const g = new THREE.Group(); [-1, 1].forEach(s => { tambah(g, .2, .32, .25, s * .15, .16, 0, '#7a4a1f'); tambah(g, .18, .58, .2, s * .4, .68, 0, '#7a4a1f'); tambah(g, .18, .28, .18, s * .47, 1.32, 0, '#e0ac69'); });
    tambah(g, .6, .65, .5, 0, .62, 0, '#8d5524', .1); tambah(g, .4, .4, .06, 0, .6, .26, '#e0ac69', .03); tambah(g, .8, .7, .6, 0, 1.28, 0, '#8d5524', .12); tambah(g, .6, .5, .06, 0, 1.24, .31, '#e0ac69', .04);
    mataK(g, .13, 1.34, .345, .09); tambah(g, .2, .05, .03, 0, 1.1, .35, '#5c3317', .01); tambah(g, .14, .14, .5, 0, .5, -.4, '#7a4a1f'); tambah(g, .14, .5, .14, 0, .75, -.62, '#7a4a1f'); return g; },
  gajah() { const {g, kp} = q4({bw: 1.2, bh: 1.0, bd: 1.5, lh: .6, hw: 1.0, hh: 1.0, hd: .6, c: '#8f9aa5', kaki: '#7d8791', lw: .36});
    [-1, 1].forEach(s => { tambah(kp, .12, .9, .7, s * .56, 0, -.1, '#a5b0ba', .05).rotation.y = s * .35; tambah(kp, .08, .08, .32, s * .24, -.38, .42, '#ffffff', .03); });
    tambah(kp, .3, .42, .3, 0, -.36, .38, '#8f9aa5', .06); tambah(kp, .26, .36, .26, 0, -.72, .44, '#8f9aa5', .06); tambah(kp, .24, .2, .3, 0, -.9, .54, '#8f9aa5', .06);
    mataK(kp, .28, .15, .31, .11); tambah(g, .07, .6, .07, 0, 1.0, -.78, '#6c757d', .02); return g; },
  singa() { const {g, kp} = q4({bw: .8, bh: .6, bd: 1.2, lh: .5, hw: .6, hh: .6, hd: .5, c: '#f2b84b', kaki: '#e0a33a'});
    tambah(kp, 1.0, 1.0, .36, 0, .02, -.2, '#a0522d', .12); tambah(kp, .36, .2, .1, 0, -.15, .28, '#f8d48a', .04); tambah(kp, .14, .08, .05, 0, -.05, .33, '#5c3317', .02); mataK(kp, .14, .1, .26);
    tambah(g, .08, .08, .6, 0, .92, -.8, '#f2b84b', .02).rotation.x = -.5; tambah(g, .18, .18, .18, 0, .78, -1.08, '#8b4513', .06); return g; },
};
const SKALA = {kucing: 1, anjing: 1, sapi: .95, kambing: 1, ayam: 1.1, bebek: 1.15, kelinci: 1.1, monyet: 1, gajah: .85, singa: 1};
function buatHewan(h) { const g = new THREE.Group(); const m = (MODEL[h] || MODEL.kucing)(); g.add(m); g.scale.setScalar(SKALA[h] || 1); g.userData.h = h; g.userData.m = m; return g; }
function siluet(g, on) { g.traverse(o => { if (!o.isMesh || !o.material) return; const m = o.material; if (!o.userData.asli) o.userData.asli = {c: m.color.clone(), map: m.map}; if (on) { m.color.set('#161616'); m.map = null; } else { m.color.copy(o.userData.asli.c); m.map = o.userData.asli.map; } m.needsUpdate = true; }); }
// makanan voxel
const MAKANAN = {
  ikan: () => { const g = new THREE.Group(); tambah(g, .5, .32, .16, 0, .2, 0, '#4dabf7', .08); tambah(g, .14, .3, .1, -.32, .2, 0, '#228be6', .03); tambah(g, .2, .08, .1, 0, .38, 0, '#339af0', .03); tambah(g, .06, .06, .03, .15, .24, .085, '#1b1b1b', .01); return g; },
  tulang: () => { const g = new THREE.Group(); tambah(g, .5, .12, .12, 0, .12, 0, '#f8f9fa', .05); [-1, 1].forEach(sx => [-1, 1].forEach(sz => tambah(g, .14, .14, .14, sx * .28, .12, sz * .07, '#f1f3f5', .06))); return g; },
  rumput: () => { const v = new Vox(.08); for (let i = 0; i < 9; i++) { const x = acakInt(-4, 4), z = acakInt(-2, 2), h = acakInt(3, 7); v.box(x, 0, z, 1, h, 1, variasi('#51cf66', .1)); } return v.mesh(); },
  jagung: () => { const g = new THREE.Group(); tambah(g, .22, .6, .22, 0, .32, 0, '#ffd43b', .08); [-1, 1].forEach(s => tambah(g, .08, .4, .18, s * .14, .2, 0, '#69db7c', .03)); tambah(g, .06, .14, .06, 0, .68, 0, '#c99a2e', .02); return g; },
  wortel: () => { const g = new THREE.Group(); [[.26, .2, .5], [.2, .2, .32], [.13, .18, .15], [.06, .1, .03]].forEach(([w, h, y]) => tambah(g, w, h, w, 0, y, 0, '#fd7e14', .04)); [-.06, 0, .06].forEach((x, i) => tambah(g, .05, .26 - i % 2 * .06, .05, x, .72, 0, '#40c057', .02)); return g; },
  pisang: () => { const g = new THREE.Group(); for (let i = -2; i <= 2; i++) tambah(g, .14, .13, .15, i * .12, .1 + i * i * .028, 0, '#ffd43b', .05); tambah(g, .05, .05, .05, -.3, .25, 0, '#5c3d1e', .01); return g; },
  tebu: () => { const g = new THREE.Group(); tambah(g, .16, .96, .16, 0, .48, 0, '#94d82d', .04); [.24, .48, .72].forEach(y => tambah(g, .18, .03, .18, 0, y, 0, '#5c940d', .01)); tambah(g, .2, .06, .06, .14, .86, 0, '#40c057', .02); tambah(g, .2, .06, .06, -.14, .9, 0, '#40c057', .02); return g; },
  daging: () => { const g = new THREE.Group(); tambah(g, .45, .3, .32, 0, .17, 0, '#c92a2a', .1); tambah(g, .47, .07, .34, 0, .3, 0, '#e8590c', .03); tambah(g, .3, .1, .1, .34, .17, 0, '#f8f9fa', .04); tambah(g, .12, .18, .16, .52, .17, 0, '#f8f9fa', .05); return g; },
};
function buatMakanan(m) { const g = new THREE.Group(); g.add((MAKANAN[m] || MAKANAN.rumput)()); g.scale.setScalar(1.6); g.userData.mk = m; return g; }
function kandang() { const g = new THREE.Group(), W = 2.16, D = 1.8; g.add(lempeng(W, D, '#e9d8a6', .02, .06));
  for (let x = -W / 2 + .05; x <= W / 2; x += .36) { tambah(g, .1, .56, .1, x, .28, -D / 2 + .05, '#9c6b3c', .03); tambah(g, .1, .3, .1, x, .15, D / 2 - .05, '#9c6b3c', .03); }
  for (let z = -D / 2 + .41; z < D / 2 - .1; z += .36) [-1, 1].forEach(s => tambah(g, .1, .56, .1, s * (W / 2 - .05), .28, z, '#9c6b3c', .03));
  tambah(g, W, .07, .07, 0, .5, -D / 2 + .05, '#b8834a', .02); [-1, 1].forEach(s => tambah(g, .07, .07, D, s * (W / 2 - .05), .5, 0, '#b8834a', .02)); tambah(g, W, .06, .06, 0, .27, D / 2 - .05, '#b8834a', .02);
  return g; }

// ---------- suara hewan sintetis ----------
let _bising = null;
function bising(lama) { if (!AC) return null; if (!_bising) { const b = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; _bising = b; } const s = AC.createBufferSource(); s.buffer = _bising; return s; }
function nadaF(f, t0, lama, {tipe = 'sawtooth', vol = .15, ke, lp = 2000, vib = 0, trem = 0, lewat} = {}) {
  if (!AC || !SUARA_ON) return; const T = AC.currentTime + t0; const o = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
  o.type = tipe; o.frequency.setValueAtTime(f, T); if (lewat) o.frequency.linearRampToValueAtTime(lewat, T + lama * .45); if (ke) o.frequency.linearRampToValueAtTime(ke, T + lama);
  fl.type = 'lowpass'; fl.frequency.value = lp; g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(vol, T + .04); g.gain.setValueAtTime(vol, T + lama * .7); g.gain.linearRampToValueAtTime(0, T + lama);
  if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = vib; lg.gain.value = f * .03; l.connect(lg).connect(o.frequency); l.start(T); l.stop(T + lama); }
  if (trem) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = trem; lg.gain.value = vol * .8; l.connect(lg).connect(g.gain); l.start(T); l.stop(T + lama); }
  o.connect(fl).connect(g).connect(AC.destination); o.start(T); o.stop(T + lama + .05);
}
const SUARA_HEWAN = {
  kucing: () => { nadaF(620, 0, .55, {tipe: 'triangle', lewat: 900, ke: 520, vib: 6, vol: .2}); nadaF(640, .75, .6, {tipe: 'triangle', lewat: 920, ke: 500, vib: 6, vol: .2}); },
  anjing: () => { [0, .32].forEach(t => nadaF(420, t, .16, {ke: 240, lp: 1400, vol: .22})); },
  sapi: () => { nadaF(150, 0, 1.3, {lewat: 175, ke: 120, lp: 700, vol: .25}); },
  kambing: () => { nadaF(420, 0, .9, {lp: 1800, trem: 13, ke: 380, vol: .2}); },
  ayam: () => { [[520, 0, .14], [600, .17, .14], [680, .34, .16], [980, .54, .5]].forEach(([f, t, l]) => nadaF(f, t, l, {tipe: 'square', lp: 2500, vol: .1, ke: f * (l > .3 ? .8 : 1.05)})); },
  bebek: () => { [0, .25, .5].forEach(t => nadaF(470, t, .17, {tipe: 'square', lp: 1300, vol: .14, ke: 380})); },
  kelinci: () => { nadaF(1200, 0, .08, {tipe: 'sine', vol: .1}); nadaF(1300, .15, .08, {tipe: 'sine', vol: .1}); },
  monyet: () => { nadaF(700, 0, .3, {tipe: 'triangle', ke: 1100, vol: .18}); nadaF(900, .4, .2, {tipe: 'triangle', ke: 1300, vol: .18}); nadaF(900, .65, .2, {tipe: 'triangle', ke: 1300, vol: .18}); },
  gajah: () => { nadaF(330, 0, 1.1, {lewat: 620, ke: 420, lp: 3000, vib: 9, vol: .16}); },
  singa: () => { nadaF(95, 0, 1.3, {lewat: 120, ke: 70, lp: 500, vol: .3, trem: 22}); const n = bising(); if (n) { const g = AC.createGain(), fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 400; g.gain.setValueAtTime(.0, AC.currentTime); g.gain.linearRampToValueAtTime(.18, AC.currentTime + .2); g.gain.linearRampToValueAtTime(0, AC.currentTime + 1.2); n.connect(fl).connect(g).connect(AC.destination); n.start(); n.stop(AC.currentTime + 1.3); } },
};
const bunyiHewan = h => { try { (SUARA_HEWAN[h] || (() => {}))(); } catch (e) {} };

// Dodo: avatar warga Dunia Kotak, penjaga kebun binatang bertopi khaki
const dodo = buatKarakter({
  jenis: 'L', kulit: KULIT[3], rambut: {gaya: 'cepak', warna: WARNA_RAMBUT[0]},
  atasan: {jenis: 'kemeja', warna: '#5c940d'}, bawahan: {jenis: 'pendek', warna: '#c9a66b'}, sepatu: '#5c3d1e', topi: '#d8c08a',
});
topiTerbalik(dodo); hadapDepan(dodo); P.tokoh = dodo;
const posDodo = () => tegak() ? {x: 0, z: 3.3} : {x: 0, z: 3.7};
dodo.position.set(posDodo().x, 0, posDodo().z); P.sc.add(dodo);
pembaru.push(dt => { gerakKarakter(dodo, dt); animasiKarakter(dodo, dt); });

const soalSah = () => (DATA.soal || []).map(s => ({jenis: String(s.jenis || 'suara').trim().toLowerCase(), hewan: String(s.hewan || '').trim().toLowerCase()})).filter(s => MODEL[s.hewan] && (s.jenis !== 'suara' || infoHewan(s.hewan).suara) && (s.jenis !== 'makanan' || MAKANAN[infoHewan(s.hewan).makanan]));
let urut = [], idx = 0, skor = 0, N = 0;
function mulaiMain() { urut = soalSah(); if (DATA.urutan === 'acak') urut = kocok(urut); N = urut.length; idx = 0; skor = 0; aturBintang(0, N); if (!N) { tulisGelembung('Belum ada soal. Buka Mode Guru.'); return; } putaran(); }
const nPil = () => Math.min(4, Math.max(2, +DATA.pilihan || 3));
async function putaran() {
  bersihRonde(); kunci = true; window.__ulangSuara = null;
  if (idx >= N) { setMode(dodo, 'senang', 3); konfeti(new THREE.Vector3(0, 2, 0), undefined, 90); await ucap('Hore! Kamu sahabat semua hewan!'); layarSelesai(skor, N, mulaiMain); return; }
  const p = posDodo(); await jalanKe(dodo, p.x, p.z);
  const q = urut[idx]; return q.jenis === 'makanan' ? rondeMakanan(q) : rondeHewan(q);
}
async function benar(teks, pos) { efek.benar(); setMode(dodo, 'senang', 1.8); konfeti(pos || new THREE.Vector3(0, 1.5, 0)); skor++; aturBintang(skor, N); await ucap(teks); idx++; putaran(); }
function hewanDiKandang(h, x, z) { const g = new THREE.Group(); g.add(kandang()); const a = buatHewan(h); a.rotation.y = x < -.1 ? .5 : x > .1 ? -.5 : 0; g.add(a); g.position.set(x, 0, z); g.userData.h = h; g.userData.a = a; return g; }

// --- suara / nama: pilih hewan ---
async function rondeHewan(q) {
  const n = nPil(), modeSuara = q.jenis === 'suara';
  const lain = kocok(HEWAN_ADA.filter(h => h !== q.hewan && (!modeSuara || infoHewan(h).suara))).slice(0, n - 1);
  const pos = posisiPilihan(n, {jarak: 2.75, z: -1.3});
  const kd = kocok([q.hewan, ...lain]).map((h, i) => { const g = hewanDiKandang(h, pos[i].x, pos[i].z); if (modeSuara) { siluet(g.userData.a, true); const t = teksVoxel('?', '#ffd43b', .11, 2); t.position.set(0, 2.2, 0); t.rotation.x = -.4; g.add(t); g.userData.tanya = t; } tambahRonde(g); muncul(g); daftarKetuk(g, o => jawab(o)); return g; });
  const info = infoHewan(q.hewan);
  const tanya = async () => { if (modeSuara) { bunyiHewan(q.hewan); await tunggu(1300); await ucap(`Suara apa ini? ${info.suara}!`); } else await ucap(`Mana ${q.hewan}? Ketuk ${q.hewan}, ya!`); };
  window.__ulangSuara = modeSuara ? () => bunyiHewan(q.hewan) : null;
  const jawab = async o => {
    kunci = true; efek.pop(); await jalanKe(dodo, o.position.x, o.position.z + 1.6); setMode(dodo, 'tunjuk', .6);
    const a = o.userData.a;
    if (o.userData.h === q.hewan) { if (modeSuara) { siluet(a, false); o.remove(o.userData.tanya); } bunyiHewan(q.hewan); lompat(a, .5, .5); await benar(`${pilih(PUJIAN)} Itu ${q.hewan}${info.suara ? ', ' + info.suara : ''}!`, o.position.clone().setY(1.6)); }
    else { efek.salah(); setMode(dodo, 'geleng', 1.2); goyang(a); if (modeSuara) { siluet(a, false); await ucap(`Ini ${o.userData.h}. Bukan suara ${o.userData.h}. Dengar lagi, ya!`); siluet(a, true); bunyiHewan(q.hewan); } else await ucap(`Itu ${o.userData.h}. ${pilih(SEMANGAT)} Cari ${q.hewan}.`); kunci = false; }
  };
  await tanya(); kunci = false;
}

// --- makanan: beri makan hewan ---
async function rondeMakanan(q) {
  const n = nPil(), info = infoHewan(q.hewan);
  const g = hewanDiKandang(q.hewan, 0, -2.3); g.userData.a.rotation.y = 0; tambahRonde(g); muncul(g);
  const lain = kocok(MAKANAN_ADA.filter(m => m !== info.makanan)).slice(0, n - 1);
  const jarak = tegak() ? Math.min(2, 5 / Math.max(1, n - 1)) : 2.4;
  kocok([info.makanan, ...lain]).forEach((m, i) => { const f = buatMakanan(m); f.position.set((i - (n - 1) / 2) * jarak, 0, .2); f.userData.asal = f.position.clone(); tambahRonde(f); muncul(f); daftarKetuk(f, o => jawab(o)); });
  const jawab = async o => {
    kunci = true;
    if (o.userData.mk === info.makanan) {
      await terbangKe(o, new THREE.Vector3(0, .3, -1.5), .6, 1.4); const a = g.userData.a; bunyiHewan(q.hewan);
      await animasi(1, (e, p) => { a.rotation.x = Math.sin(p * Math.PI * 6) * .12; o.scale.setScalar(1.6 * (1 - p)); }, x => x); a.rotation.x = 0;
      await benar(`${pilih(PUJIAN)} ${q.hewan} suka makan ${info.makanan}. Nyam nyam!`, new THREE.Vector3(0, 1.8, -2.3));
    } else { efek.salah(); goyang(o); setMode(dodo, 'geleng', 1.2); await ucap(`${q.hewan} tidak makan ${o.userData.mk}. ${pilih(SEMANGAT)}`); kunci = false; }
  };
  await ucap(`${q.hewan} lapar! Apa makanan ${q.hewan}?`); kunci = false;
}

aturBintang(0, soalSah().length); tulisGelembung('Ketuk Main untuk mulai');
setMode(dodo, 'lambai'); loop();
layarMulai(DATA.judul || 'Kebun Binatang Suara', 'Tebak suara hewan bersama Dodo!', mulaiMain);

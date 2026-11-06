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
const infoHewan = h => (DATA.hewan || []).find(x => x.hewan === h) || {hewan: h, suara: '', makanan: ''};

siapPanggung({langit: '#d6f0ff', tanahWarna: '#b5d98a', lebarArea: 11.6, dalamArea: 10, lebarTegak: 6.8, dalamTegak: 9.4});
P.sc.add(tanahVoxel(36, 28, ['#a9d67b', '#a3d175']));
{ const v = new Vox(.5); for (let x = -16; x < 16; x++) for (let z = 0; z < 3; z++) v.set(x, 0, z, variasi('#ecd9a8', .03)); const m = v.mesh({bulat: false}); m.position.y = -.48; m.castShadow = false; P.sc.add(m); }
[[-8, -6], [8, -6.5], [-9.5, 2], [9.5, 3], [-3, -8], [3.5, -8.2]].forEach(([x, z], i) => { const p = pohonVoxel(6, pilih(['#2f9e44', '#40c057', '#37b24d']), '#7a4b25'); p.position.set(x, 0, z); P.sc.add(p); });
for (let i = 0; i < 26; i++) { const b = bungaVoxel(pilih(['#ffd43b', '#ffffff', '#ff8787'])); const x = acak(-12, 12), z = acak(-8, 7); if (Math.abs(x) < 5.5 && z > -4 && z < 4.5) continue; b.position.set(x, 0, z); P.sc.add(b); }
// gapura kebun binatang
{ const g = new THREE.Group(); const v = new Vox(.15); v.box(-14, 0, 0, 2, 16, 2, '#8b5a2b'); v.box(12, 0, 0, 2, 16, 2, '#8b5a2b'); v.box(-15, 16, -1, 30, 5, 3, '#f2c14e'); g.add(v.mesh()); const t = teksVoxel('ZOO', '#2f9e44', .11, 1); t.position.set(0, 2.5, .3); g.add(t); g.position.set(0, 0, -7.8); P.sc.add(g); }

// ---------- model hewan voxel ----------
function quad(v, {bw, bh, bd, lh, hw, hh, hd, hy, c, c2, kaki}) {
  v.box(-bw / 2, lh, -bd / 2, bw, bh, bd, () => variasi(c, .03));
  const lk = kaki || c; [[-bw / 2, -bd / 2], [bw / 2 - 2, -bd / 2], [-bw / 2, bd / 2 - 2], [bw / 2 - 2, bd / 2 - 2]].forEach(([x, z]) => v.box(x, 0, z, 2, lh, 2, lk));
  const fz = bd / 2 + hd - 1; v.box(-hw / 2, hy, bd / 2 - 1, hw, hh, hd, () => variasi(c, .03));
  return {fz, top: hy + hh};
}
function mata(v, x, y, z, warna = '#1b1b1b') { v.set(x, y, z, warna); v.set(x, y + 1, z, warna); v.set(-x - 1, y, z, warna); v.set(-x - 1, y + 1, z, warna); v.set(x, y + 1, z, '#ffffff'); v.set(-x - 1, y + 1, z, '#ffffff'); }
const MODEL = {
  kucing() { const v = new Vox(.1); const f = quad(v, {bw: 6, bh: 5, bd: 9, lh: 3, hw: 7, hh: 6, hd: 5, hy: 6, c: '#adb5bd'}); for (let z = -4; z < 4; z += 2) v.box(-3, 8, z, 6, 1, 1, '#6c757d'); v.box(-3, 12, f.fz - 2, 2, 2, 1, '#adb5bd'); v.box(1, 12, f.fz - 2, 2, 2, 1, '#adb5bd'); mata(v, 1, 9, f.fz); v.set(0, 8, f.fz, '#f783ac'); v.set(-1, 8, f.fz, '#f783ac'); v.box(-1, 8, -6, 2, 2, 2, '#adb5bd'); v.box(-1, 10, -7, 2, 4, 2, '#868e96'); return v; },
  anjing() { const v = new Vox(.1); const f = quad(v, {bw: 7, bh: 6, bd: 10, lh: 4, hw: 7, hh: 7, hd: 6, hy: 8, c: '#b4703c', kaki: '#9c5f30'}); v.box(-5, 10, f.fz - 3, 1, 5, 3, '#6f3f1d'); v.box(4, 10, f.fz - 3, 1, 5, 3, '#6f3f1d'); v.box(-2, 8, f.fz + 1, 4, 3, 2, '#e9c39b'); v.box(-1, 10, f.fz + 3, 2, 1, 1, '#1b1b1b'); mata(v, 1, 12, f.fz); v.set(0, 8, f.fz + 3, '#f06595'); v.box(-1, 10, -7, 2, 2, 3, '#b4703c'); return v; },
  sapi() { const v = new Vox(.1); const f = quad(v, {bw: 10, bh: 8, bd: 14, lh: 5, hw: 8, hh: 8, hd: 6, hy: 10, c: '#f8f9fa', kaki: '#f1f3f5'}); [[-5, 8, -3], [2, 10, 1], [-3, 11, 4], [4, 7, -5]].forEach(([x, y, z]) => v.box(x, y, z, 3, 3, 3, '#212529')); v.box(-3, 10, f.fz + 1, 6, 3, 1, '#ffc9c9'); v.set(-2, 11, f.fz + 2, '#c92a2a'); v.set(1, 11, f.fz + 2, '#c92a2a'); mata(v, 2, 14, f.fz); v.box(-5, 18, f.fz - 3, 1, 2, 1, '#e9ecef'); v.box(4, 18, f.fz - 3, 1, 2, 1, '#e9ecef'); v.box(-6, 15, f.fz - 3, 2, 1, 2, '#f8f9fa'); v.box(4, 15, f.fz - 3, 2, 1, 2, '#f8f9fa'); v.box(-1, 8, -8, 1, 6, 1, '#212529'); return v; },
  kambing() { const v = new Vox(.1); const f = quad(v, {bw: 7, bh: 6, bd: 10, lh: 5, hw: 6, hh: 7, hd: 5, hy: 9, c: '#f1e3c8', kaki: '#d9c7a5'}); v.box(-1, 7, f.fz - 1, 2, 3, 1, '#e3d1ad'); mata(v, 1, 13, f.fz); v.box(-3, 16, f.fz - 3, 1, 3, 1, '#868e96'); v.box(2, 16, f.fz - 3, 1, 3, 1, '#868e96'); v.box(-3, 18, f.fz - 5, 1, 1, 2, '#868e96'); v.box(2, 18, f.fz - 5, 1, 1, 2, '#868e96'); v.set(-1, 10, f.fz + 1, '#212529'); v.set(0, 10, f.fz + 1, '#212529'); return v; },
  ayam() { const v = new Vox(.1); v.box(-3, 3, -3, 6, 6, 7, () => variasi('#ffffff', .02)); v.box(-1, 0, 0, 1, 3, 1, '#f59f00'); v.box(1, 0, 0, 1, 3, 1, '#f59f00'); v.box(-2, 8, 2, 4, 5, 4, '#ffffff'); v.box(-1, 13, 2, 2, 2, 3, '#e03131'); v.box(-1, 10, 6, 2, 1, 2, '#fab005'); v.box(-1, 8, 5, 2, 2, 1, '#e03131'); mata(v, 1, 11, 5); v.box(-2, 7, -6, 4, 6, 3, '#495057'); v.box(-1, 10, -7, 2, 4, 1, '#2f9e44'); return v; },
  bebek() { const v = new Vox(.1); v.box(-3, 2, -4, 6, 5, 8, () => variasi('#ffe066', .03)); v.box(-1, 0, 0, 1, 2, 1, '#f76707'); v.box(1, 0, 0, 1, 2, 1, '#f76707'); v.box(-2, 6, 2, 4, 5, 4, '#ffe066'); v.box(-2, 8, 6, 4, 1, 3, '#f76707'); mata(v, 1, 9, 5); v.box(-1, 5, -6, 2, 3, 2, '#fcc419'); return v; },
  kelinci() { const v = new Vox(.1); v.box(-3, 0, -3, 6, 6, 6, () => variasi('#ffffff', .02)); v.box(-3, 5, 1, 6, 6, 5, '#ffffff'); v.box(-2, 11, 2, 1, 6, 2, '#ffffff'); v.box(1, 11, 2, 1, 6, 2, '#ffffff'); v.box(-2, 12, 4, 1, 4, 1, '#ffc9c9'); v.box(1, 12, 4, 1, 4, 1, '#ffc9c9'); mata(v, 1, 8, 5, '#c2255c'); v.set(0, 7, 6, '#f783ac'); v.set(-1, 7, 6, '#f783ac'); v.box(-1, 2, -5, 2, 2, 2, '#f1f3f5'); return v; },
  monyet() { const v = new Vox(.1); v.box(-3, 3, -2, 6, 7, 5, () => variasi('#8d5524', .03)); v.box(-2, 4, 3, 4, 4, 1, '#e0ac69'); v.box(-3, 0, -1, 2, 3, 3, '#7a4a1f'); v.box(1, 0, -1, 2, 3, 3, '#7a4a1f'); v.box(-5, 4, -1, 2, 6, 2, '#7a4a1f'); v.box(3, 4, -1, 2, 6, 2, '#7a4a1f'); v.box(-4, 10, -2, 8, 7, 6, () => variasi('#8d5524', .03)); v.box(-3, 10, 4, 6, 5, 1, '#e0ac69'); v.box(-6, 13, 0, 2, 3, 2, '#e0ac69'); v.box(4, 13, 0, 2, 3, 2, '#e0ac69'); mata(v, 1, 13, 5); v.box(-1, 11, 5, 2, 1, 1, '#5c3317'); v.box(-1, 5, -4, 2, 2, 2, '#7a4a1f'); v.box(-1, 7, -6, 2, 6, 2, '#7a4a1f'); return v; },
  gajah() { const v = new Vox(.1); const f = quad(v, {bw: 12, bh: 10, bd: 15, lh: 6, hw: 10, hh: 10, hd: 6, hy: 11, c: '#8f9aa5', kaki: '#7d8791'}); v.box(-9, 11, f.fz - 4, 3, 9, 6, '#a5b0ba'); v.box(6, 11, f.fz - 4, 3, 9, 6, '#a5b0ba'); v.box(-2, 6, f.fz + 1, 4, 7, 2, '#8f9aa5'); v.box(-1, 3, f.fz + 2, 3, 4, 2, '#8f9aa5'); v.box(-1, 3, f.fz + 4, 3, 2, 1, '#8f9aa5'); v.box(-4, 9, f.fz + 1, 1, 3, 1, '#ffffff'); v.box(3, 9, f.fz + 1, 1, 3, 1, '#ffffff'); mata(v, 3, 16, f.fz); v.box(-1, 9, -9, 1, 6, 1, '#6c757d'); return v; },
  singa() { const v = new Vox(.1); const f = quad(v, {bw: 8, bh: 6, bd: 12, lh: 5, hw: 7, hh: 7, hd: 5, hy: 9, c: '#f2b84b', kaki: '#e0a33a'}); v.box(-6, 7, f.fz - 5, 12, 12, 4, () => variasi('#a0522d', .06)); v.box(-5, 18, f.fz - 4, 10, 2, 3, '#8b4513'); v.box(-3, 9, f.fz - 1, 6, 7, 2, '#f2b84b'); v.box(-2, 10, f.fz + 1, 4, 2, 1, '#f8d48a'); v.set(-1, 12, f.fz + 1, '#5c3317'); v.set(0, 12, f.fz + 1, '#5c3317'); mata(v, 1, 13, f.fz + 1); v.box(-1, 9, -8, 1, 1, 3, '#f2b84b'); v.box(-1, 9, -10, 1, 3, 1, '#8b4513'); return v; },
};
const SKALA = {kucing: 1, anjing: 1, sapi: .95, kambing: 1, ayam: 1.1, bebek: 1.15, kelinci: 1.1, monyet: 1, gajah: .85, singa: 1};
function buatHewan(h) { const g = new THREE.Group(); const m = (MODEL[h] || MODEL.kucing)().mesh(); g.add(m); g.scale.setScalar(SKALA[h] || 1); g.userData.h = h; g.userData.m = m; return g; }
function siluet(g, on) { g.traverse(o => { if (!o.isInstancedMesh) return; const a = o.instanceColor.array; if (!o.userData.asli) o.userData.asli = a.slice(); if (on) a.fill(.05); else a.set(o.userData.asli); o.instanceColor.needsUpdate = true; }); }
// makanan voxel
const MAKANAN = {
  ikan: () => { const v = new Vox(.08); v.box(-4, 0, -1, 7, 4, 2, '#4dabf7'); v.box(-3, 4, -1, 5, 1, 2, '#339af0'); v.box(-3, -1, -1, 5, 1, 2, '#339af0'); v.box(3, 0, -1, 1, 4, 2, '#339af0'); v.box(4, -1, -1, 2, 6, 2, '#228be6'); v.set(-3, 2, 1, '#1b1b1b'); return v; },
  tulang: () => { const v = new Vox(.08); v.box(-4, 1, -1, 8, 2, 2, '#f8f9fa'); [[-6, 0], [-6, 2], [4, 0], [4, 2]].forEach(([x, y]) => v.box(x, y, -1, 2, 2, 2, '#f1f3f5')); return v; },
  rumput: () => { const v = new Vox(.08); for (let i = 0; i < 9; i++) { const x = acakInt(-4, 4), z = acakInt(-2, 2), h = acakInt(3, 7); v.box(x, 0, z, 1, h, 1, variasi('#51cf66', .1)); } return v; },
  jagung: () => { const v = new Vox(.08); v.box(-1, 0, -1, 3, 8, 3, () => variasi('#ffd43b', .06)); v.box(-2, 0, -1, 1, 5, 2, '#69db7c'); v.box(2, 0, 0, 1, 5, 2, '#69db7c'); v.box(0, 8, 0, 1, 2, 1, '#c99a2e'); return v; },
  wortel: () => { const v = new Vox(.08); for (let y = 0; y < 8; y++) { const r = y < 3 ? 0 : 1; v.box(-r, y, -r, 1 + 2 * r, 1, 1 + 2 * r, variasi('#fd7e14', .05)); } v.box(-1, 8, 0, 1, 3, 1, '#40c057'); v.box(1, 8, 0, 1, 2, 1, '#51cf66'); v.box(0, 8, 0, 1, 4, 1, '#2f9e44'); return v; },
  pisang: () => { const v = new Vox(.08); for (let i = -4; i <= 4; i++) v.box(i, Math.round(i * i / 5) + 1, -1, 1, 2, 2, variasi('#ffd43b', .04)); v.set(-5, 5, 0, '#5c3d1e'); return v; },
  tebu: () => { const v = new Vox(.08); v.box(-1, 0, -1, 2, 12, 2, (x, y) => y % 4 === 0 ? '#5c940d' : variasi('#94d82d', .05)); v.box(1, 10, 0, 2, 1, 1, '#40c057'); v.box(-3, 11, 0, 2, 1, 1, '#40c057'); return v; },
  daging: () => { const v = new Vox(.08); v.box(-3, 0, -2, 6, 4, 4, () => variasi('#e8590c', .05)); v.box(-2, 1, -1, 4, 3, 3, '#c92a2a'); v.box(3, 1, -1, 4, 2, 2, '#f8f9fa'); v.box(6, 0, -1, 2, 4, 2, '#f8f9fa'); return v; },
};
function buatMakanan(m) { const g = new THREE.Group(); g.add((MAKANAN[m] || MAKANAN.rumput)().mesh()); g.scale.setScalar(1.6); g.userData.mk = m; return g; }
function kandang() { const v = new Vox(.12); const W = 18, D = 15; for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { v.set(x - W / 2, 0, z - D / 2, variasi('#e9d8a6', .04)); const tepi = x === 0 || x === W - 1 || z === 0 || z === D - 1; if (tepi && (x + z) % 3 === 0) v.box(x - W / 2, 1, z - D / 2, 1, 5, 1, '#9c6b3c'); if (tepi) v.set(x - W / 2, 4, z - D / 2, '#b8834a'); } const m = v.mesh(); m.position.y = -.1; return m; }

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

// Dodo: penjaga kebun binatang bertopi safari
const dodo = buatKarakter({
  kulit: '#c68642', rambut: '#1b1b1b', baju: '#5c940d', celana: '#c9a66b', sepatu: '#5c3d1e',
  topi: v => { v.box(-6, 10, -5, 12, 1, 11, () => variasi('#d8c08a', .03)); v.box(-4, 11, -3, 8, 2, 7, '#e3cc94'); v.box(-4, 11, -3, 8, 1, 7, '#8b6b3a'); },
  aksen: v => { v.box(-3, 5, 2, 2, 2, 1, '#94d82d'); v.box(1, 5, 2, 2, 2, 1, '#94d82d'); v.set(0, 7, 2, '#ffd43b'); },
});
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
  const p = posDodo(); await jalanKe(dodo, p.x, p.z); dodo.rotation.y = 0;
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
    kunci = true; efek.pop(); await jalanKe(dodo, o.position.x, o.position.z + 1.6); dodo.rotation.y = Math.PI; setMode(dodo, 'tunjuk', .6);
    const a = o.userData.a;
    if (o.userData.h === q.hewan) { if (modeSuara) { siluet(a, false); o.remove(o.userData.tanya); } bunyiHewan(q.hewan); lompat(a, .5, .5); await benar(`${pilih(PUJIAN)} Itu ${q.hewan}${info.suara ? ', ' + info.suara : ''}!`, o.position.clone().setY(1.6)); }
    else { efek.salah(); setMode(dodo, 'geleng', 1.2); goyang(a); if (modeSuara) { siluet(a, false); await ucap(`Ini ${o.userData.h}. Bukan ${o.userData.h}. Dengar lagi, ya!`); siluet(a, true); bunyiHewan(q.hewan); } else await ucap(`Itu ${o.userData.h}. ${pilih(SEMANGAT)} Cari ${q.hewan}.`); kunci = false; }
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

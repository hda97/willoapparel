// Suara Dunia Kotak (Huda 14 Nov 2026): "setiap dusun ada backsong masing-masing suasana" + "suara kendaraan juga".
// SEMUA bunyi di file ini disintesis langsung dengan Web Audio (oscillator + derau), lagunya digubah sendiri untuk game ini:
// tanpa file musik, tanpa lagu berhak cipta, tanpa unduhan (lebih ringan dari musik.mp3 lama 922 KB).
//   Wetan  🌧️ hujan di sawah   : gamelan lembut (bonang + gong) pentatonis, gerimis tipis
//   Kulon  🌸 semi di bukit teh : suling riang + petikan, kicau burung
//   Curug  ❄️ salju di gunung   : kotak musik / lonceng pelan, angin dingin
//   Tlaga  🍂 gugur, Taman Hiburan: waltz akordeon ala komidi putar, desir daun
//   Segara ☀️ panas, kota teluk : steel drum & marimba tropis, ombak
// Dusun berganti = halaman dimuat ulang, jadi lagu otomatis ikut dusun tujuan.

const frek = m => 440 * Math.pow(2, (m - 69) / 12);
const NAMA = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
const midi = s => { const r = /^([A-G])(#|b)?(-?\d)$/.exec(s); return r ? NAMA[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0) + (+r[3] + 1) * 12 : null; };
// notasi melodi: per birama, ketukan seperdelapan dipisah spasi. "E5" = nada, "-" = tahan nada sebelumnya, "." = diam
function urai(birama) {
  return birama.map(b => { const t = b.trim().split(/\s+/), out = [];
    t.forEach((x, i) => { if (x === '-') { if (out.length) out[out.length - 1].p++; } else if (x !== '.') out.push({i, n: midi(x), p: 1}); });
    return out; });
}
const akor = s => s.split(' ').map(midi);

// ---------------------------------------------------------------- lagu per dusun
const LAGU = {
  wetan: {keras: 1.58, bpm: 74, ketuk: 8, gema: [.405, .32, .22], suasana: 'hujan',
    akor: ['A3 C4 E4', 'F3 A3 C4 E4', 'C4 E4 G4', 'G3 B3 D4', 'A3 C4 E4', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4'].map(akor),
    melodi: urai(['E5 - D5 C5 A4 - - .', 'C5 - D5 E5 G5 - E5 .', 'D5 - C5 D5 E5 - - .', 'D5 C5 A4 - G4 - - .',
      'A4 - C5 D5 E5 - G5 E5', 'D5 - E5 D5 C5 - - .', 'D5 - - C5 D5 E5 D5 C5', 'A4 - - - - - . .']),
    lead: 'bonang', iring: 'gamelan'},
  kulon: {keras: 1.66, bpm: 96, ketuk: 8, gema: [.31, .25, .16], suasana: 'burung',
    akor: ['D4 F#4 A4', 'C#4 E4 A4', 'B3 D4 F#4', 'B3 D4 G4', 'D4 F#4 A4', 'C#4 E4 A4', 'B3 D4 G4', 'C#4 E4 A4'].map(akor),
    melodi: urai(['F#5 - A5 - B5 A5 F#5 -', 'E5 - - . C#5 D5 E5 .', 'F#5 - D5 - B4 - D5 .', 'G5 - F#5 - E5 - - .',
      'F#5 - A5 - D6 - B5 A5', 'A5 - E5 - F#5 G5 A5 .', 'B5 - A5 G5 F#5 - E5 -', 'E5 - - - . . . .']),
    lead: 'suling', iring: 'petik'},
  curug: {keras: 2.04, bpm: 64, ketuk: 8, gema: [.47, .42, .34], suasana: 'angin',
    akor: ['F3 A3 C4 E4', 'C3 E3 G3 B3', 'A2 C3 E3 G3', 'G2 B2 D3 G3', 'F3 A3 C4 E4', 'C3 E3 G3', 'D3 F3 A3 C4', 'G2 B2 D3 F3'].map(akor),
    melodi: urai(['A5 . C6 . E6 - D6 .', 'C6 - G5 - E5 - . .', 'A5 . C6 . E6 - G6 .', 'D6 - B5 - G5 - . .',
      'A5 . C6 . F6 - E6 .', 'D6 - C6 - G5 - E5 .', 'F5 . A5 . D6 - C6 .', 'B5 - - - D6 . . .']),
    lead: 'lonceng', iring: 'salju'},
  tlaga: {keras: 2.6, bpm: 118, ketuk: 6, gema: [.38, .26, .17], suasana: 'daun',
    akor: ['C3 E4 G4', 'A2 C4 E4', 'D3 F4 A4', 'G2 B3 F4', 'C3 E4 G4', 'A2 C4 E4', 'F2 A3 C4', 'G2 B3 D4'].map(akor),
    melodi: urai(['G5 - - E5 - C5', 'E5 - - A4 - -', 'F5 - E5 D5 - A4', 'B4 - - D5 - G5',
      'G5 - - E5 - C5', 'C6 - B5 A5 - E5', 'F5 - G5 A5 - F5', 'D5 - - B4 - -']),
    lead: 'akordeon', iring: 'waltz'},
  segara: {keras: 2.16, bpm: 112, ketuk: 8, gema: [.268, .22, .14], suasana: 'ombak',
    akor: ['G3 B3 D4', 'C4 E4 G4', 'D4 F#4 A4', 'G3 B3 D4', 'E3 G3 B3', 'C4 E4 G4', 'D4 F#4 A4', 'D4 F#4 C5'].map(akor),
    melodi: urai(['B4 . D5 G5 . D5 E5 .', 'E5 . G5 C6 . B5 A5 .', 'A5 . F#5 D5 . E5 F#5 .', 'G5 - - . D5 . B4 .',
      'B4 . E5 G5 . B5 A5 G5', 'E5 . G5 - E5 C5 . .', 'D5 . F#5 A5 . C6 B5 A5', 'F#5 - . D5 E5 F#5 A5 .']),
    lead: 'steeldrum', iring: 'tropis'},
};
export const DUSUN_LAGU = Object.keys(LAGU);

let derauBuf = null;
function derau(c) {
  if (!derauBuf || derauBuf.sampleRate !== c.sampleRate) { derauBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = derauBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  return derauBuf;
}

// ---------------------------------------------------------------- musik latar
export function buatMusik(c, keluar, dusun) {
  const L = LAGU[dusun] || LAGU.wetan;
  const bus = c.createGain(); bus.gain.value = L.keras; bus.connect(keluar);   // keras: disamakan antardusun
  // gema (pengganti reverb, murah untuk HP): satu delay berumpan balik + filter
  const [dt, fb, basah] = L.gema, dl = c.createDelay(1), dfb = c.createGain(), dlp = c.createBiquadFilter(), dwet = c.createGain();
  dl.delayTime.value = dt; dfb.gain.value = fb; dlp.type = 'lowpass'; dlp.frequency.value = 2400; dwet.gain.value = basah;
  dl.connect(dlp).connect(dfb).connect(dl); dlp.connect(dwet).connect(bus);
  const kirim = c.createGain(); kirim.gain.value = 1; kirim.connect(bus); kirim.connect(dl);

  function osc(t, f, tipe, a, d, v, tujuan = kirim, s = 0, lepas = .05) {   // nada dasar dengan amplop A-D(-S)
    const o = c.createOscillator(), g = c.createGain(); o.type = tipe; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); o.connect(g).connect(tujuan); o.start(t);
    if (s) { g.gain.setTargetAtTime(v * s, t + a, d / 3); g.gain.setTargetAtTime(0, t + d, lepas); o.stop(t + d + lepas * 6); }
    else { g.gain.exponentialRampToValueAtTime(.0001, t + a + d); o.stop(t + a + d + .05); }
    return o;
  }
  function desah(t, dur, tipe, f, q, v, tujuan = kirim) {
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = derau(c);
    fl.type = tipe; fl.frequency.value = f; fl.Q.value = q; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl).connect(g).connect(tujuan); s.start(t, Math.random() * 1.5); s.stop(t + dur + .05);
  }
  // ---- alat musik (semua sintetis) ----
  const ALAT = {
    bonang: (t, f, d) => { osc(t, f, 'sine', .004, 1.3, .16); osc(t, f * 2.76, 'sine', .002, .35, .05); osc(t, f * 5.4, 'sine', .001, .12, .015); },
    gong: (t, f) => { const o = osc(t, f, 'sine', .02, 4.5, .2); o.frequency.setValueAtTime(f * 1.012, t); o.frequency.linearRampToValueAtTime(f, t + 1.5); osc(t, f * 2.01, 'sine', .02, 2.5, .05); },
    suling: (t, f, d) => { const o = osc(t, f, 'triangle', .05, d, .1, kirim, .85, .08), lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .008, t + .25); lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + d + .5);
      osc(t, f * 2, 'sine', .05, d, .018, kirim, .7, .08); desah(t, .08, 'bandpass', f * 2, 2, .02); },
    petik: (t, f) => { osc(t, f, 'triangle', .003, .32, .07); osc(t, f * 2, 'sine', .002, .12, .02); },
    lonceng: (t, f, d) => { osc(t, f, 'sine', .002, 2.4, .1); osc(t, f * 4, 'sine', .001, .5, .03); osc(t, f * 2.98, 'sine', .001, .9, .02); },
    akordeon: (t, f, d) => { for (const k of [1, 1.004]) { const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = f * k; fl.type = 'lowpass'; fl.frequency.value = 1700; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.035, t + .04);
      g.gain.setTargetAtTime(.028, t + .04, .1); g.gain.setTargetAtTime(0, t + d, .05); o.connect(fl).connect(g).connect(kirim); o.start(t); o.stop(t + d + .35); } },
    steeldrum: (t, f) => { osc(t, f, 'sine', .003, .55, .13); osc(t, f * 2, 'sine', .003, .3, .05); osc(t, f * 3.01, 'sine', .002, .15, .03); osc(t, f * .5, 'sine', .004, .25, .03); },
    marimba: (t, f) => { osc(t, f, 'sine', .002, .32, .1); osc(t, f * 3.93, 'sine', .001, .04, .04); },
    bas: (t, f, d, v = .14) => { osc(t, f, 'triangle', .01, d, v, bus, .6, .06); },
    pad: (t, fs, d, v = .022) => { fs.forEach(f => { for (const k of [.998, 1.003]) { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f * k;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + d * .35); g.gain.linearRampToValueAtTime(0, t + d + .4); o.connect(g).connect(kirim); o.start(t); o.stop(t + d + .45); } }); },
    shaker: (t, v) => desah(t, .05, 'highpass', 7000, .7, v),
    kick: (t, v = .22) => { const o = osc(t, 110, 'sine', .002, .22, v, bus); o.frequency.exponentialRampToValueAtTime(42, t + .18); },
  };

  // ---- suasana alam (pelan, satu sumber derau loop) ----
  let alam = null;
  function mulaiAlam() {
    const t = c.currentTime, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    s.buffer = derau(c); s.loop = true; fl.Q.value = .7; lfo.connect(lg).connect(g.gain);
    const S = {hujan: ['lowpass', 2600, .03, .08, .008], burung: ['bandpass', 900, .006, .1, .003], angin: ['bandpass', 520, .03, .07, .022],
      daun: ['bandpass', 2400, .012, .13, .008], ombak: ['lowpass', 900, .05, .09, .04]}[L.suasana];
    fl.type = S[0]; fl.frequency.value = S[1]; g.gain.value = S[2]; lfo.frequency.value = S[3]; lg.gain.value = S[4];
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(S[2], t + 3);
    s.connect(fl).connect(g).connect(bus); s.start(); lfo.start();
    alam = {s, lfo, g};
  }
  function kicau(t) { const f = 2600 + Math.random() * 1400; for (let i = 0; i < 2 + (Math.random() * 3 | 0); i++) { const o = osc(t + i * .11, f, 'sine', .005, .07, .025); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + i * .11 + .06); } }
  function tetes(t) { const f = 1800 + Math.random() * 1600, o = osc(t, f, 'sine', .001, .05, .02); o.frequency.exponentialRampToValueAtTime(f * .55, t + .05); }

  // ---- penjadwal: nada dijadwalkan ±0,6 dtk di depan (aman walau HP sempat tersendat) ----
  const langkah = 60 / L.bpm / 2;   // seperdelapan
  let tNext = 0, ke = 0, timer = null, jalan = false;
  function mainkan(t, step) {
    const nb = L.akor.length, b = Math.floor(step / L.ketuk) % nb, i = step % L.ketuk, putaran = Math.floor(step / (L.ketuk * nb));
    const ak = L.akor[b], dBar = langkah * L.ketuk, akar = frek(ak[0] - (L.iring === 'waltz' ? 0 : 12));
    // melodi istirahat tiap putaran ke-3 (biar tidak bosan): hanya iringan
    if (putaran % 3 !== 2) for (const n of L.melodi[b]) if (n.i === i && n.n) ALAT[L.lead](t, frek(n.n), n.p * langkah);
    const fs = ak.map(frek);
    switch (L.iring) {
      case 'gamelan':
        if (i === 0) { ALAT.pad(t, fs, dBar, .016); if (b % 4 === 0) ALAT.gong(t, frek(ak[0] - 24)); }
        if (i % 2 === 1) ALAT.bonang(t, fs[(i >> 1) % fs.length] * 2, langkah);   // bonang penerus (imbal)
        if (i === 4) ALAT.bas(t, akar, dBar / 2, .09);
        if (Math.random() < .25) tetes(t + Math.random() * langkah);
        break;
      case 'petik':
        if (i === 0) { ALAT.pad(t, fs, dBar, .012); ALAT.bas(t, akar, langkah * 3, .12); }
        if (i === 4) ALAT.bas(t, frek(ak[0] - 12 + 7), langkah * 3, .1);
        ALAT.petik(t, fs[[0, 1, 2, 1, 0, 1, 2, 1][i]] * 2);
        if (i % 2 === 1) ALAT.shaker(t, .012);
        if (Math.random() < .04) kicau(t);
        break;
      case 'salju':
        if (i === 0) { ALAT.pad(t, fs, dBar, .02); ALAT.bas(t, akar, dBar * .8, .08); }
        if (i === 2 || i === 6) ALAT.lonceng(t, fs[(b + i) % fs.length] * 2, langkah, .5);
        break;
      case 'waltz':   // oom-pah-pah
        if (i === 0) ALAT.bas(t, akar, langkah * 1.6, .15);
        if (i === 2 || i === 4) ALAT.akordeon(t, fs[1], langkah * .7), ALAT.akordeon(t, fs[2], langkah * .7);
        if (i === 0 && b % 2 === 0) ALAT.marimba(t + langkah * 5, fs[2] * 2);
        break;
      case 'tropis':
        if (i === 0) ALAT.kick(t, .16); if (i === 4) ALAT.kick(t, .12);
        if ([0, 3, 4, 6].includes(i)) ALAT.bas(t, i === 4 ? frek(ak[0] - 12 + 7) : i === 6 ? akar * 2 : akar, langkah * .9, .12);
        ALAT.shaker(t, i % 2 ? .03 : .014);
        if (i === 2 || i === 5 || i === 7) ALAT.marimba(t, fs[(i + b) % fs.length] * 2);
        break;
    }
  }
  function jadwal() {
    if (!jalan || c.state !== 'running') return;
    if (tNext < c.currentTime - .2) tNext = c.currentTime + .08;   // habis tertahan (tab ditinggal): mulai lagi rapi
    while (tNext < c.currentTime + .6) { try { mainkan(tNext, ke); } catch (e) {} tNext += langkah; ke++; }
  }
  return {
    mulai() {
      if (jalan) return; jalan = true; tNext = c.currentTime + .15;
      bus.gain.cancelScheduledValues(c.currentTime); bus.gain.setValueAtTime(L.keras, c.currentTime);
      if (!alam) mulaiAlam();
      jadwal(); timer = setInterval(jadwal, 150);
    },
    henti() {
      if (!jalan) return; jalan = false; clearInterval(timer); timer = null;
      if (alam) { try { alam.s.stop(); alam.lfo.stop(); } catch (e) {} alam = null; }
    },
    // untuk rekaman (OfflineAudioContext): jadwalkan semua nada sampai detik ke-`sampai` sekaligus
    isi(sampai) { jalan = true; tNext = .1; ke = 0; if (!alam) mulaiAlam(); while (tNext < sampai) { mainkan(tNext, ke); tNext += langkah; ke++; } jalan = false; },
    get jalan() { return jalan; },
    dusun: L === LAGU[dusun] ? dusun : 'wetan',
  };
}

// ---------------------------------------------------------------- suara kendaraan
// Mesin mobil/motor NPC terdekat (maks 3 sekaligus), mesin kendaraan sendiri, sirene ambulans, klakson saat jalannya
// dihalangi pemain, bel sepeda. Keras-pelan menurut jarak, kiri-kanan menurut letak di layar. Semua lewat jalur EFEK.
const M = 4.12 / 1.7;   // 1 meter dalam satuan dunia
const DENGAR = 32 * M, DENGAR_SIRENE = 70 * M;
const JENIS = {   // [frekuensi dasar, tambahan saat ngebut, filter, filter tambahan, bentuk, keras]
  sedan: [34, 34, 260, 420, 'sawtooth', .07], hatch: [38, 40, 300, 520, 'sawtooth', .07], jip: [30, 28, 220, 360, 'sawtooth', .085],
  patroli: [36, 36, 280, 450, 'sawtooth', .07], ambulans: [32, 30, 250, 400, 'sawtooth', .075], gt: [48, 62, 380, 900, 'sawtooth', .075],
  motor: [62, 85, 900, 1300, 'square', .035], bus: [26, 22, 200, 300, 'sawtooth', .1],
};
export function buatSuaraKendaraan(c, keluar) {
  function suaraMesin() {
    const o = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = 40; o2.frequency.value = 20; fl.type = 'lowpass'; fl.frequency.value = 300; fl.Q.value = 2.5; g.gain.value = 0;
    const g2 = c.createGain(); g2.gain.value = .5; o.connect(fl); o2.connect(g2).connect(fl); fl.connect(g); if (p) { g.connect(p).connect(keluar); } else g.connect(keluar);
    o.start(); o2.start(); return {o, o2, fl, g, p, id: null};
  }
  const suara = [], LIMIT = 3; let saya = null, sirene = null, wkt = 0;
  const pernahDekat = new WeakSet(); const klaksonT = new WeakMap();
  const lembut = (prm, v, tau = .12) => prm.setTargetAtTime(v, c.currentTime, tau);
  function atur(v, j, laju, keras, pan) {
    const J = JENIS[j] || JENIS.sedan, f = J[0] + J[1] * laju;
    if (v.o.type !== J[4]) v.o.type = J[4];
    lembut(v.o.frequency, f); lembut(v.o2.frequency, f / 2); lembut(v.fl.frequency, J[2] + J[3] * laju); lembut(v.g.gain, J[5] * keras);
    if (v.p) lembut(v.p.pan, Math.max(-.85, Math.min(.85, pan)));
  }
  function klakson(pan, keras, tipe = 'mobil') {
    const t = c.currentTime, fs = tipe === 'motor' ? [520, 650] : [392, 494];
    const p = c.createStereoPanner ? c.createStereoPanner() : null; if (p) { p.pan.value = pan; p.connect(keluar); }
    [0, .22].forEach(tt => fs.forEach(f => { const o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(); o.type = 'square'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 1500;
      g.gain.setValueAtTime(0, t + tt); g.gain.linearRampToValueAtTime(.05 * keras, t + tt + .01); g.gain.setValueAtTime(.05 * keras, t + tt + .14); g.gain.linearRampToValueAtTime(0, t + tt + .17);
      o.connect(fl).connect(g).connect(p || keluar); o.start(t + tt); o.stop(t + tt + .2); }));
  }
  function bel(pan, keras) {
    const t = c.currentTime, p = c.createStereoPanner ? c.createStereoPanner() : null; if (p) { p.pan.value = pan; p.connect(keluar); }
    [0, .13, .5, .63].forEach(tt => [1, 2.7].forEach((k, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = 2350 * k;
      g.gain.setValueAtTime(0, t + tt); g.gain.linearRampToValueAtTime((i ? .015 : .05) * keras, t + tt + .004); g.gain.exponentialRampToValueAtTime(.0001, t + tt + .35);
      o.connect(g).connect(p || keluar); o.start(t + tt); o.stop(t + tt + .4); }));
  }
  function bunyiSirene() {
    const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), fl = c.createBiquadFilter(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    o.type = 'triangle'; o.frequency.value = 860; lfo.type = 'square'; lfo.frequency.value = 1.4; lg.gain.value = 105;   // dua nada naik-turun 965 / 755 Hz
    fl.type = 'bandpass'; fl.frequency.value = 900; fl.Q.value = .8; g.gain.value = 0;
    lfo.connect(lg).connect(o.frequency); o.connect(fl).connect(g); if (p) g.connect(p).connect(keluar); else g.connect(keluar);
    o.start(); lfo.start(); return {o, lfo, g, p};
  }
  // daftar: [{obj, jenis, laju 0..1, dihalangi}], kamera untuk menghitung jarak & kiri-kanan, sendiri: {jenis, laju} atau null
  function update(dt, daftar, cam, sendiri, aktif) {
    wkt += dt; if (wkt < .1) return; wkt = 0;
    if (!aktif || c.state !== 'running') { suara.forEach(v => lembut(v.g.gain, 0, .05)); if (saya) lembut(saya.g.gain, 0, .05); if (sirene) lembut(sirene.g.gain, 0, .05); return; }
    const ref = cam.position, inv = cam.matrixWorldInverse, e = inv.elements;
    const layar = o => { const p = o.position; const x = e[0] * p.x + e[4] * p.y + e[8] * p.z + e[12], z = e[2] * p.x + e[6] * p.y + e[10] * p.z + e[14]; return x / Math.max(8, Math.hypot(x, z)); };
    const fokus = sendiri && sendiri.obj ? sendiri.obj.position : ref;
    const dekat = [];
    let amb = null, dAmb = 1e9;
    for (const k of daftar) {
      if (!k.obj.visible) continue;
      const d = Math.hypot(k.obj.position.x - fokus.x, k.obj.position.z - fokus.z);
      if (k.jenis === 'ambulans' && d < dAmb) { dAmb = d; amb = k; }
      if (d > DENGAR) { pernahDekat.delete(k.obj); continue; }
      if (k.jenis === 'sepeda') { if (d < 9 * M && !pernahDekat.has(k.obj)) { pernahDekat.add(k.obj); if (Math.random() < .4) bel(layar(k.obj), 1 - d / (9 * M)); } continue; }
      pernahDekat.add(k.obj);
      if (k.dihalangi && d < 14 * M) { const tk = klaksonT.get(k.obj) || 0; if (performance.now() - tk > 5000) { klaksonT.set(k.obj, performance.now()); klakson(layar(k.obj), 1, k.jenis === 'motor' ? 'motor' : 'mobil'); } }
      dekat.push([d, k]);
    }
    dekat.sort((a, b) => a[0] - b[0]);
    const pakai = dekat.slice(0, LIMIT);
    while (suara.length < pakai.length) suara.push(suaraMesin());
    suara.forEach((v, i) => { const x = pakai[i]; if (!x) { lembut(v.g.gain, 0, .2); return; }
      const [d, k] = x, keras = Math.pow(1 - d / DENGAR, 2); atur(v, k.jenis, k.laju, keras, layar(k.obj)); });
    // sirene ambulans
    if (amb && dAmb < DENGAR_SIRENE) { if (!sirene) sirene = bunyiSirene(); lembut(sirene.g.gain, .045 * Math.pow(1 - dAmb / DENGAR_SIRENE, 2), .3); if (sirene.p) lembut(sirene.p.pan, Math.max(-.8, Math.min(.8, layar(amb.obj)))); }
    else if (sirene) lembut(sirene.g.gain, 0, .3);
    // kendaraan sendiri: paling keras, di tengah
    if (sendiri && JENIS[sendiri.jenis]) { if (!saya) saya = suaraMesin(); atur(saya, sendiri.jenis, sendiri.laju, 1.25, 0); }
    else if (saya) lembut(saya.g.gain, 0, .15);
  }
  // bus antardusun berangkat: bel "ting-ting", pintu angin "pssh", mesin menderu menjauh
  function busBerangkat() {
    const t = c.currentTime;
    [0, .28].forEach(tt => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = 1560; g.gain.setValueAtTime(0, t + tt); g.gain.linearRampToValueAtTime(.06, t + tt + .005); g.gain.exponentialRampToValueAtTime(.0001, t + tt + .6); o.connect(g).connect(keluar); o.start(t + tt); o.stop(t + tt + .65); });
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = derau(c); fl.type = 'highpass'; fl.frequency.value = 2500;
    g.gain.setValueAtTime(0, t + .55); g.gain.linearRampToValueAtTime(.09, t + .6); g.gain.exponentialRampToValueAtTime(.0001, t + 1.05); s.connect(fl).connect(g).connect(keluar); s.start(t + .55); s.stop(t + 1.1);
    const o = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), gm = c.createGain(); o.type = 'sawtooth'; o2.type = 'square'; lp.type = 'lowpass'; lp.Q.value = 3;
    o.frequency.setValueAtTime(24, t + .9); o.frequency.linearRampToValueAtTime(52, t + 2.1); o2.frequency.setValueAtTime(12, t + .9); o2.frequency.linearRampToValueAtTime(26, t + 2.1);
    lp.frequency.setValueAtTime(180, t + .9); lp.frequency.linearRampToValueAtTime(520, t + 2.1);
    gm.gain.setValueAtTime(0, t + .9); gm.gain.linearRampToValueAtTime(.13, t + 1.15); gm.gain.linearRampToValueAtTime(.09, t + 2); gm.gain.linearRampToValueAtTime(0, t + 2.3);
    o.connect(lp); o2.connect(lp); lp.connect(gm).connect(keluar); o.start(t + .9); o2.start(t + .9); o.stop(t + 2.4); o2.stop(t + 2.4);
  }
  return {update, busBerangkat, klakson: () => klakson(0, 1)};
}

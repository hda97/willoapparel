// GERAKAN WARGA (Huda 21 Nov 2026: "warga bisa duduk dan gerakan lainnya, bisa baring, bisa joget-joget, banyak gerakan disertai musik,
// tombol pop up pilihan gulir bulat bagian skill" + "tombol jangan emot standar, bikin ikon khas Dunia Kotak").
// - Tombol "Gerak" di deret skill membuka RODA bulat yang bisa diputar (geser jari / roda mouse); ketuk gerakan untuk mulai.
// - Ikon semua gerakan digambar sendiri (SVG tokoh kepala kotak), bukan emoji.
// - Joget punya musik sendiri (disintesis, tanpa file), musik desa dipelankan selama joget.
// - Warga lain melihat gerakanmu (pesan {t:'e', e:'g_<id>'}); berhenti otomatis saat kamu bergerak, lompat, atau naik kendaraan.
// - Duduk di dekat bangku = duduk di bangku itu; di tempat lain = duduk lesehan.

// ---------- ikon SVG khas Dunia Kotak (tokoh kepala kotak) ----------
const GARIS = '#17212e', PUTIH = '#ffffff', KUNING = '#ffd84a', BIRU = '#7cc8ff', KAYU = '#c8894a';
const r = (x, y, w, h, f = PUTIH, rx = 1.6) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" stroke="${GARIS}" stroke-width="1.6"/>`;
const tungkai = (x, y, pj, sudut, l = 4.4, f = PUTIH) => `<rect x="${x - l / 2}" y="${y}" width="${l}" height="${pj}" rx="1.8" fill="${f}" stroke="${GARIS}" stroke-width="1.6" transform="rotate(${sudut} ${x} ${y})"/>`;
const kepala = (x, y, s = 12, mata = 'buka') => r(x, y, s, s, PUTIH, 2.6) + (mata === 'tutup'
  ? `<path d="M${x + 2.6} ${y + s * .55}h2.6M${x + s - 5.2} ${y + s * .55}h2.6" stroke="${GARIS}" stroke-width="1.5" stroke-linecap="round"/>`
  : `<rect x="${x + 2.8}" y="${y + s * .42}" width="2" height="2.6" fill="${GARIS}"/><rect x="${x + s - 4.8}" y="${y + s * .42}" width="2" height="2.6" fill="${GARIS}"/>`);
const not = (x, y) => `<path d="M${x} ${y}v-7.5l5-1.5v7" fill="none" stroke="${GARIS}" stroke-width="1.4"/><rect x="${x - 2.6}" y="${y - 1.6}" width="3.2" height="3.2" rx=".8" fill="${KUNING}" stroke="${GARIS}" stroke-width="1.2"/><rect x="${x + 2.4}" y="${y - 3.1}" width="3.2" height="3.2" rx=".8" fill="${KUNING}" stroke="${GARIS}" stroke-width="1.2"/>`;
const kilau = (x, y, s = 3) => `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="${KUNING}" stroke="${GARIS}" stroke-width="1.1" transform="rotate(45 ${x} ${y})"/>`;
// tokoh berdiri tampak depan: lengan/kaki dalam derajat (0 = lurus ke bawah, positif = ke luar badan)
function berdiri({aL = 8, aR = 8, kL = 3, kR = 3, miring = 0, mata, dx = 0, dy = 0} = {}) {
  return `<g transform="translate(${dx} ${dy}) rotate(${miring} 24 30)">` + tungkai(21.3, 29, 13, kL) + tungkai(26.7, 29, 13, -kR) + tungkai(18.6, 17.5, 11.5, aL) + tungkai(29.4, 17.5, 11.5, -aR) + r(18.5, 16, 11, 13.5) + kepala(18, 4, 12, mata) + '</g>';
}
const svg = isi => `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">${isi}</svg>`;
export const IKON = {
  duduk: svg(r(9, 33, 30, 4, KAYU, 1) + r(11, 37, 3.5, 7, KAYU, 1) + r(33.5, 37, 3.5, 7, KAYU, 1) + r(9, 21, 3.5, 12, KAYU, 1) + tungkai(24, 31.5, 12, -90) + tungkai(35.5, 29.5, 13, 0) + tungkai(20, 18.5, 11, 18) + r(15.5, 17, 10, 15) + kepala(14.5, 4.5, 12)),
  baring: svg(r(3, 37, 42, 3.5, '#9be37f', 1) + r(3, 29.5, 9, 7, BIRU, 2) + tungkai(30, 31.5, 13, -90) + tungkai(16, 29.5, 12, 90) + r(15, 27, 15, 9.5) + `<g transform="rotate(-90 9.5 30)">${kepala(3.5, 24, 12)}</g>` + kilau(38, 18) + kilau(31, 12, 2.4)),
  tidur: svg(r(3, 37, 42, 3.5, '#9be37f', 1) + r(3, 29.5, 9, 7, BIRU, 2) + tungkai(30, 31.5, 13, -90) + r(15, 27, 15, 9.5) + `<g transform="rotate(-90 9.5 30)">${kepala(3.5, 24, 12, 'tutup')}</g>` + `<path d="M24 8h7l-7 8h7M34 3h5l-5 6h5" fill="none" stroke="${GARIS}" stroke-width="2" stroke-linejoin="round"/>`),
  joget: svg(berdiri({aL: 130, aR: 55, kL: 18, kR: -6, miring: 8}) + not(39, 14) + not(6, 22)),
  robot: svg(berdiri({aL: 90, aR: 180, kL: 0, kR: 0}) + `<path d="M17 19.5h-8M31 20v-9" stroke="none"/>` + kilau(8, 8) + kilau(41, 34) + kilau(6, 40, 2.4)),
  goyang: svg(berdiri({aL: 150, aR: 150, kL: 12, kR: 12, miring: -8}) + not(40, 40) + kilau(7, 12)),
  senam: svg(berdiri({aL: 160, aR: 160, kL: 22, kR: 22}) + `<path d="M5 44h8M35 44h8" stroke="${GARIS}" stroke-width="1.8" stroke-linecap="round"/>`),
  tepuk: svg(berdiri({aL: -28, aR: -28}) + `<path d="M24 37l0 5M19 38.5l-2.5 3.5M29 38.5l2.5 3.5" stroke="${KUNING}" stroke-width="2.4" stroke-linecap="round"/>`),
  lambai: svg(berdiri({aL: 8, aR: 160}) + `<path d="M38 6q5 4 3 10M41 3q6 6 3 14" fill="none" stroke="${KUNING}" stroke-width="2.2" stroke-linecap="round"/>`),
  hormat: svg(berdiri({aL: 4, aR: 135}) + `<rect x="27" y="5.5" width="6" height="3" rx="1" fill="${KUNING}" stroke="${GARIS}" stroke-width="1.2"/>`),
  pushup: svg(r(3, 41, 42, 3, '#9be37f', 1) + `<g transform="rotate(-14 24 30)">` + tungkai(13, 30, 15, -90) + r(15, 25.5, 15, 9) + tungkai(27, 33, 9, 0) + kepala(30, 23, 11) + '</g>' + kilau(40, 10) + kilau(34, 6, 2.2)),
  mikir: svg(berdiri({aL: -20, aR: -150}) + `<path d="M36 6q0-4 4-4t4 4q0 3-4 4v3" fill="none" stroke="${GARIS}" stroke-width="2"/><rect x="38.8" y="15" width="2.6" height="2.6" fill="${KUNING}" stroke="${GARIS}" stroke-width="1"/>`),
  ketawa: svg(berdiri({aL: -20, aR: -20, miring: -10, mata: 'tutup'}) + `<path d="M36 8l4-3M38 13l5-1M8 9L4 6" stroke="${KUNING}" stroke-width="2.4" stroke-linecap="round"/>`),
  nangis: svg(berdiri({aL: -150, aR: -150, miring: 6, mata: 'tutup'}) + `<path d="M15 20q-1.5 3 0 4.5q1.5-1.5 0-4.5zM34 22q-1.5 3 0 4.5q1.5-1.5 0-4.5z" fill="${BIRU}" stroke="${GARIS}" stroke-width="1"/>`),
};

// ---------- daftar gerakan: pose tiap saat t (detik) untuk avatar warga (js/aset/avatar.js) ----------
// legL/legR/armL/armR = rotasi x anggota, armLz/armRz/legLz/legRz = rotasi z, bodyX/bodyZ = badan, dy = turun/naik (satuan avatar),
// rotX = seluruh tubuh direbahkan (sumbu kaki), gel = gelembung sesekali
const W = bpm => bpm / 60 * Math.PI;   // 1 putaran sin = 2 ketukan
export const GERAK = [
  {id: 'duduk', nama: 'Duduk', pose: t => ({dy: -1.12, legL: -1.5, legR: -1.5, armL: .45, armR: .45, armLz: .3, armRz: -.3, bodyX: -.22, headY: Math.sin(t * .5) * .3})},
  {id: 'baring', nama: 'Rebahan', pose: t => ({rotX: -Math.PI / 2, dy: .34, armL: -2.95, armR: -2.95, armLz: .35, armRz: -.35, legR: -.25 - Math.sin(t * .8) * .1, head: -.15})},
  {id: 'tidur', nama: 'Tidur', gel: ['Zzz…', 'Zzzz…', 'Hrr… zzz'], pose: t => ({rotX: -Math.PI / 2, dy: .34, armL: -.1, armR: -.1, bodyX: Math.sin(t * 1.4) * .02, head: -.1})},
  {id: 'joget', nama: 'Koplo', musik: 'koplo', pose: t => { const w = W(128) * t, s = Math.sin(w);
    return {bodyZ: s * .2, dy: Math.abs(Math.sin(w)) * .14, armR: -2.4 + Math.sin(w * 2) * .3, armRz: -.55, armL: -1 - s * .45, armLz: .95, legL: s * .3, legR: -s * .3, headY: Math.sin(w / 2) * .35}; }},
  {id: 'robot', nama: 'Robot', musik: 'robot', pose: t => { const k = Math.floor(t * 120 / 60) % 4;
    const P = [{armL: -1.57, armLz: 0, armR: 0, armRz: -1.57, headY: .6}, {armL: 0, armLz: 1.57, armR: -1.57, armRz: 0, headY: -.6}, {armL: -3.05, armR: -3.05, armLz: .1, armRz: -.1, headY: 0}, {armL: -1.57, armR: -1.57, armLz: 0, armRz: 0, head: .25}];
    return {...P[k], dy: k % 2 ? -.08 : 0, legL: k === 1 ? -.35 : 0, legR: k === 3 ? -.35 : 0}; }},
  {id: 'goyang', nama: 'Goyang', musik: 'pop', pose: t => { const w = W(110) * t, s = Math.sin(w);
    return {armLz: 1.5 + s * .9, armRz: -1.5 + s * .9, armL: -.4, armR: -.4, bodyZ: -s * .16, dy: Math.abs(Math.cos(w)) * .18, legL: Math.max(0, s) * -.5, legR: Math.max(0, -s) * -.5, head: .05, headY: s * .25}; }},
  {id: 'senam', nama: 'Senam', musik: 'senam', pose: t => { const w = W(136) * t, k = (1 - Math.cos(w)) / 2;
    return {armLz: .1 + 2.85 * k, armRz: -.1 - 2.85 * k, legLz: -.36 * k, legRz: .36 * k, dy: Math.abs(Math.sin(w)) * .45}; }},
  {id: 'tepuk', nama: 'Tepuk', tepuk: 1, pose: t => { const c = (Math.cos(t * 2 * Math.PI * 2.2) + 1) / 2; return {armL: -1.35, armR: -1.35, armLz: -.05 - .32 * c, armRz: .05 + .32 * c, head: -.08}; }},
  {id: 'lambai', nama: 'Melambai', pose: t => ({armR: -2.9, armRz: -.25 + Math.sin(t * 10) * .4, headY: .15, head: -.05})},
  {id: 'hormat', nama: 'Hormat', pose: () => ({armR: -2.45, armRz: .72, bodyX: -.04, head: -.06})},
  {id: 'pushup', nama: 'Push Up', pose: t => { const k = (Math.sin(t * 3.2) + 1) / 2, rx = .95 + k * .22; return {rotX: rx, armL: -rx, armR: -rx, armLz: .12, armRz: -.12, head: -.5}; }},
  {id: 'mikir', nama: 'Mikir', gel: ['Hmm…', 'Hmmm…', 'Kira-kira…'], pose: t => ({armR: -2.05, armRz: .55, armL: -.85, armLz: -.45, head: .15 + Math.sin(t * .7) * .05, headY: .25})},
  {id: 'ketawa', nama: 'Ketawa', gel: ['Wkwkwk', 'Hahaha!', 'Wkwk 🤣'], pose: t => ({bodyX: -.28 + Math.sin(t * 16) * .06, armL: -.65, armR: -.65, armLz: -.3, armRz: .3, head: -.3, dy: Math.abs(Math.sin(t * 8)) * .06})},
  {id: 'nangis', nama: 'Nangis', gel: ['Huhuhu…', 'Hiks…', 'Huaaa'], pose: t => ({armL: -2.3, armR: -2.3, armLz: -.5, armRz: .5, head: .28, bodyX: .14 + Math.sin(t * 9) * .03})},
];
const PETA = Object.fromEntries(GERAK.map(g => [g.id, g]));

// ---------- terapkan ke avatar mana saja (pemain sendiri & warga lain) ----------
// pulihkan() dipanggil SEBELUM posisi avatar diperbarui tiap frame, terapkan() SESUDAHNYA (geser naik/turun tidak menumpuk).
export function pulihkan(obj) {
  const u = obj.userData; if (!u._g) return;
  obj.position.y -= u._g.dy; obj.rotation.x = 0; obj.rotation.z = 0; u._g = null;
  if (u.body) u.body.rotation.set(0, 0, 0); if (u.legL) { u.legL.rotation.z = 0; u.legR.rotation.z = 0; }
}
export function terapkan(obj, st, dt, bangkuDekat) {
  const g = PETA[st.id], u = obj.userData; if (!g || !u.legL || u.naik || u.nebeng) return;
  st.t = (st.t || 0) + dt;
  const p = g.pose(st.t); let dy = (p.dy || 0), yaw = null;
  if (g.id === 'duduk' && bangkuDekat) { const b = bangkuDekat(obj.position.x, obj.position.z, 2.2); if (b) { dy = b.y + .25 - 1.37 - obj.position.y; yaw = Math.atan2(b.fx, b.fz); } }
  obj.rotation.order = 'YXZ'; obj.rotation.x = p.rotX || 0; if (yaw != null) obj.rotation.y = yaw;
  obj.position.y += dy; u._g = {dy};
  u.legL.rotation.x = p.legL || 0; u.legR.rotation.x = p.legR || 0; u.legL.rotation.z = p.legLz || 0; u.legR.rotation.z = p.legRz || 0;
  u.armL.rotation.x = p.armL || 0; u.armR.rotation.x = p.armR || 0; u.armL.rotation.z = p.armLz != null ? p.armLz : .08; u.armR.rotation.z = p.armRz != null ? p.armRz : -.08;
  u.head.rotation.x = p.head || 0; u.head.rotation.y = p.headY || 0;
  if (u.body) u.body.rotation.set(p.bodyX || 0, 0, p.bodyZ || 0);
  if (g.gel && obj.visible && st.t - (st.gelT || -3) > 5.5) { st.gelT = st.t; u.gel = {m: g.gel[Math.floor(Math.random() * g.gel.length)], sampai: performance.now() + 2600}; }
}

// ---------- musik joget (disintesis) ----------
function buatMusikJoget(c, keluar, gaya) {
  const bpm = {koplo: 128, robot: 120, pop: 110, senam: 136}[gaya] || 120, st = 60 / bpm / 4;
  const derau = c.createBuffer(1, c.sampleRate * .5, c.sampleRate), dd = derau.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
  const nada = (t, f0, f1, dur, tipe, v, filt) => { const o = c.createOscillator(), g = c.createGain(); o.type = tipe; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * .7);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .006); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    let n = o; if (filt) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filt; o.connect(fl); n = fl; } n.connect(g).connect(keluar); o.start(t); o.stop(t + dur + .02); };
  const desis = (t, dur, frek, tipe, v) => { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = derau; f.type = tipe; f.frequency.value = frek; f.Q.value = 1.2;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0005, t + dur); s.connect(f).connect(g).connect(keluar); s.start(t, Math.random() * .3); s.stop(t + dur + .02); };
  const kick = (t, v = .9) => nada(t, 150, 42, .26, 'sine', v);
  const snare = (t, v = .45) => { desis(t, .16, 1900, 'bandpass', v); nada(t, 230, 180, .08, 'triangle', v * .4); };
  const hat = (t, v = .16) => desis(t, .045, 7500, 'highpass', v);
  const tak = (t, v = .5) => { nada(t, 560, 320, .07, 'sine', v); desis(t, .04, 3200, 'bandpass', v * .4); };
  const dung = (t, v = .7) => nada(t, 165, 88, .3, 'sine', v);
  const clap = (t, v = .4) => { desis(t, .1, 1500, 'bandpass', v); desis(t + .012, .12, 1300, 'bandpass', v * .8); };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  // progresi 4 birama (nada dasar MIDI)
  const AKOR = {koplo: [45, 41, 43, 40], robot: [38, 38, 41, 36], pop: [48, 43, 45, 41], senam: [43, 48, 45, 50]}[gaya] || [45, 41, 43, 40];
  const MEL = {koplo: [69, -1, 72, 74, 76, -1, 74, 72, 69, -1, 67, 69, 72, -1, -1, -1], robot: [62, 62, 74, 62, 65, 62, 72, 62, 62, 62, 74, 62, 69, 67, 65, 62],
    pop: [72, -1, 76, -1, 79, 77, 76, -1, 74, -1, 72, -1, 74, 76, -1, -1], senam: [67, -1, 71, -1, 74, -1, 79, -1, 76, -1, 74, -1, 71, -1, 72, -1]}[gaya];
  function mainkan(t, ke) {
    const s = ke % 16, bar = Math.floor(ke / 16) % 4, akar = AKOR[bar], m = MEL[(s + (bar === 3 ? 4 : 0)) % 16];
    if (gaya === 'koplo') {
      if ([0, 6, 8, 11, 14].includes(s)) dung(t); if ([3, 4, 10, 12, 15].includes(s)) tak(t, s === 12 ? .6 : .42);
      if (s % 4 === 2) hat(t, .14); if ([0, 3, 8, 11].includes(s)) nada(t, hz(akar), hz(akar), st * 2.6, 'triangle', .32, 900);
      if (m > 0 && s % 2 === 0) { const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(); o.type = 'sine'; o.frequency.value = hz(m + (bar === 1 ? -2 : 0)); lfo.frequency.value = 5.5; lg.gain.value = 6; lfo.connect(lg).connect(o.frequency);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.13, t + .04); g.gain.exponentialRampToValueAtTime(.0005, t + st * 3.6); o.connect(g).connect(keluar); o.start(t); lfo.start(t); o.stop(t + st * 3.7); lfo.stop(t + st * 3.7); }
    } else if (gaya === 'robot') {
      if (s % 4 === 0) kick(t); if (s === 4 || s === 12) snare(t, .35); hat(t, s % 2 ? .18 : .08);
      nada(t, hz(akar + [0, 12, 7, 12][s % 4]), hz(akar + [0, 12, 7, 12][s % 4]), st * .9, 'sawtooth', .12, 1400);
      if (m > 0 && s % 4 === 2) nada(t, hz(m + 12), hz(m + 12), st * .8, 'square', .05, 3000);
    } else {
      if (s === 0 || s === 8 || (gaya === 'pop' && s === 10) || (gaya === 'senam' && s % 4 === 0)) kick(t); if (s === 4 || s === 12) { snare(t, .38); if (gaya === 'senam') clap(t, .3); }
      if (s % 2 === 0) hat(t, s % 4 === 2 ? .16 : .09);
      if ([0, 3, 6, 8, 11, 14].includes(s)) nada(t, hz(akar), hz(akar), st * 1.8, 'triangle', .3, 800);
      if (s % 4 === 2) for (const iv of [12, 16, 19]) nada(t, hz(akar + iv), hz(akar + iv), st * 1.6, 'triangle', .045, 2500);
      if (m > 0) nada(t, hz(m), hz(m), st * 1.7, 'square', .045, 2200);
    }
  }
  let jalan = true, tNext = c.currentTime + .08, ke = 0;
  const timer = setInterval(() => { if (!jalan || c.state !== 'running') return; if (tNext < c.currentTime - .2) tNext = c.currentTime + .05; while (tNext < c.currentTime + .4) { try { mainkan(tNext, ke); } catch (e) {} tNext += st; ke++; } }, 100);
  return {henti() { jalan = false; clearInterval(timer); }, tepuk: () => clap(c.currentTime, .45)};
}

// ---------- roda pilihan + kendali gerakan pemain ----------
export function buatGerak({tombol, avatar, audio, kirim, bangkuDekat, bisa, toast, bunyi = () => {}, saatMusik = () => {}}) {
  let kini = null, musik = null, tepukLalu = 0;
  { const ik = tombol.querySelector('i'); if (ik && !ik.innerHTML.trim()) ik.innerHTML = IKON.joget; }
  // roda
  const roda = document.createElement('div'); roda.id = 'rodaGerak'; roda.className = 'rodaGerak'; roda.hidden = true;
  roda.innerHTML = `<div class="rodaWadah"><div class="rodaCincin"></div><button class="rodaTengah" type="button"><b></b><small>Ketuk untuk mulai</small></button></div>
    <div class="rodaBawah"><button class="rodaHenti" type="button" hidden>⏹ Berhenti</button><span>Putar roda · ketuk gerakan</span><button class="rodaTutup" type="button" aria-label="Tutup">✕</button></div>`;
  document.body.appendChild(roda);
  const wadah = roda.querySelector('.rodaWadah'), cincin = roda.querySelector('.rodaCincin'), tengah = roda.querySelector('.rodaTengah'), henti = roda.querySelector('.rodaHenti');
  const item = GERAK.map(g => { const b = document.createElement('button'); b.type = 'button'; b.className = 'rodaItem'; b.dataset.g = g.id; b.innerHTML = `<i>${IKON[g.id]}</i><span>${g.nama}</span>`; cincin.appendChild(b); return b; });
  let putar = 0, laju = 0, atas = 0;
  function tata() {
    const n = item.length, S = wadah.clientWidth || 300, R = S * .4;
    let best = 0, bd = 9;
    item.forEach((b, i) => { const a = putar + i / n * Math.PI * 2 - Math.PI / 2; b.style.transform = `translate(${(S / 2 + Math.cos(a) * R) | 0}px,${(S / 2 + Math.sin(a) * R) | 0}px) translate(-50%,-50%)`;
      let d = Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2)); d = Math.abs(d); if (d < bd) { bd = d; best = i; } });
    if (best !== atas || !tengah.dataset.g) { item[atas]?.classList.remove('atas'); atas = best; item[atas].classList.add('atas'); const g = GERAK[atas]; tengah.dataset.g = g.id; tengah.querySelector('b').innerHTML = `<i>${IKON[g.id]}</i>${g.nama}`; }
  }
  let geser = null;
  const sudut = e => { const r = wadah.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2); };
  wadah.addEventListener('pointerdown', e => { e.stopPropagation(); geser = {a: sudut(e), jauh: 0, x: e.clientX, y: e.clientY, t: performance.now(), el: e.target.closest('.rodaItem, .rodaTengah')}; laju = 0; wadah.setPointerCapture(e.pointerId); });
  wadah.addEventListener('pointermove', e => { if (!geser) return; const a = sudut(e); let d = a - geser.a; d = Math.atan2(Math.sin(d), Math.cos(d)); geser.a = a; geser.jauh = Math.max(geser.jauh, Math.hypot(e.clientX - geser.x, e.clientY - geser.y));
    if (geser.jauh > 6) { putar += d; const now = performance.now(); laju = d / Math.max(.008, (now - geser.t) / 1000); geser.t = now; tata(); } });
  wadah.addEventListener('pointerup', e => { if (!geser) return; const g = geser; geser = null; if (g.jauh > 6) { meluncur(); return; } if (g.el) mulai(g.el.dataset.g); });
  wadah.addEventListener('wheel', e => { e.preventDefault(); putar -= e.deltaY * .004; tata(); }, {passive: false});
  function meluncur() { if (Math.abs(laju) < .3 || roda.hidden) return; putar += laju / 60; laju *= .92; tata(); requestAnimationFrame(meluncur); }
  roda.addEventListener('pointerdown', e => { if (e.target === roda) tutup(); });
  roda.querySelector('.rodaTutup').onclick = () => tutup();
  henti.onclick = () => { berhenti(); tutup(); };
  function buka() { if (!bisa()) return; roda.hidden = false; henti.hidden = !kini; tata(); bunyi('buka'); }
  function tutup() { roda.hidden = true; }
  tombol.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); roda.hidden ? buka() : tutup(); });
  addEventListener('resize', () => { if (!roda.hidden) tata(); });

  function mulai(idG) {
    const g = PETA[idG]; if (!g || !bisa()) return; tutup();
    berhenti(true);
    const me = avatar(); kini = {id: g.id, t: 0, x: me.position.x, z: me.position.z};
    // duduk dekat bangku: pindah ke tempat duduk bangku itu (nanti dikembalikan ke depan bangku saat berdiri)
    if (g.id === 'duduk') { const b = bangkuDekat(me.position.x, me.position.z); if (b) { kini.depan = {x: me.position.x, z: me.position.z}; me.position.x = b.x + b.fx * .3; me.position.z = b.z + b.fz * .3; } }
    tombol.classList.add('siap'); kirim('g_' + g.id); bunyi('emosi');
    if (g.musik) { const A = audio(); if (A) { try { musik = buatMusikJoget(A.ctx, A.keluar, g.musik); saatMusik(true); } catch (e) { musik = null; } } }
    if (g.id === 'duduk' && !kini.depan) toast && toast('Tip: dekati bangku taman lalu pilih Duduk untuk duduk di bangku.', 2600);
  }
  function berhenti(diam) {
    if (!kini) return; const me = avatar(); pulihkan(me);
    if (kini.depan) { me.position.x = kini.depan.x; me.position.z = kini.depan.z; }
    kini = null; tombol.classList.remove('siap');
    if (musik) { musik.henti(); musik = null; saatMusik(false); }
    if (!diam) kirim('g_');
  }
  return {
    buka, tutup, mulai, berhenti, aktif: () => kini && kini.id,
    // pemain sendiri, dipanggil tiap frame sesudah posisi diperbarui
    update(dt) { if (!kini) return; const me = avatar(); if (me.userData.naik || me.userData.nebeng) { berhenti(); return; } terapkan(me, kini, dt, bangkuDekat);
      if (PETA[kini.id].tepuk && musik == null) { const A = audio(); if (A && kini.t - tepukLalu > 1 / 2.2) { tepukLalu = kini.t; try { const c = A.ctx, s = c.createBufferSource(), b = c.createBuffer(1, c.sampleRate * .12, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; const g = c.createGain(); g.gain.value = .5; s.buffer = b; s.connect(f).connect(g).connect(A.keluar); s.start(); } catch (e) {} } }
      if (kini.t < tepukLalu) tepukLalu = 0;
    },
    pulihkan, terapkan: (obj, st, dt) => terapkan(obj, st, dt, bangkuDekat), ada: id => !!PETA[id],
  };
}

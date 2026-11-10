// ASET MOBIL DUNIA KOTAK (desain ulang 11 Nov 2026, Huda: "desainkan ulang desain mobil di Dunia Kotak, harus yang keren detailnya").
// Tiga model ORIGINAL (bukan merek/mobil asli), tetap gaya kotak bersudut bulat Dunia Kotak + garis tepi kartun:
//   hatch = Hatch Reli   : hatchback reli 80-an, kap bergaris, scoop atap, 4 lampu reli, sayap belakang, roll cage.
//   gt    = Kotak GT     : coupe sport ceper, splitter, lubang udara samping, sayap leher angsa, difuser, lampu LED.
//   jip   = Jip Garuk    : 4x4 tinggi, bull bar + winch, light bar & rak atap (jeriken, papan pasir), snorkel, ban cadangan.
// Detail: kaca gelap berbingkai, pilar, garis pintu & gagang, spion, pelek palang + bibir krom, dinding ban, stiker samping
// bernomor warga, plat DK, lampu rem menyala, knalpot (api saat ganti gigi), penahan lumpur.
// RINGAN DI HP: semua bagian diam digabung per bahan (mergeGeometries) -> ±15 draw call untuk bodi + 3 per ban,
// padahal bagiannya ±150 kotak. Hadap +z (depan), ban di y = jari-jari.
// Pakai: import {buatMobil, MODEL_MOBIL} from '.../aset/mobil.js'; const m = buatMobil('gt', 0xb8252c, 123);
// m.userData = {bodi, roda:[{piv, putar, depan}], lampuRem, api, supir, kursi:{x, z, atap, tinggi}, jari}
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const MODEL_MOBIL = [
  {id: 'hatch', nama: 'Hatch Reli', ikon: '🚗'},
  {id: 'gt', nama: 'Kotak GT', ikon: '🏎️'},
  {id: 'jip', nama: 'Jip Garuk', ikon: '🚙'},
];

const PI = Math.PI, GC = {}, MC = {}, TC = {};
// kotak bersudut bulat 1 lapis (108 segitiga); bagian kecil/tipis cukup kotak biasa (12 segitiga) supaya ringan di HP
const kb = (w, h, d, r) => { const k = [w, h, d, r].join(); return GC[k] || (GC[k] = r >= .03 && Math.min(w, h, d) >= .07 ? new RoundedBoxGeometry(w, h, d, 1, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)) : new THREE.BoxGeometry(w, h, d)); };
const tb = (r1, r2, h, n = 16) => { const k = 'c' + [r1, r2, h, n].join(); return GC[k] || (GC[k] = new THREE.CylinderGeometry(r1, r2, h, n)); };
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); return MC[k] || (MC[k] = new THREE.MeshStandardMaterial({color: c, roughness: .6, ...o})); };
const GARIS = new THREE.MeshBasicMaterial({color: 0x15161c, side: THREE.BackSide});   // garis tepi hitam gaya kartun (inverted hull)
const KACA = new THREE.MeshStandardMaterial({color: 0x2e4a6a, roughness: .08, metalness: .5, transparent: true, opacity: .8});
const HITAM = mat(0x1d1e24, {roughness: .75}), KARBON = mat(0x26272e, {roughness: .45, metalness: .25}), KROM = mat(0xdfe3ea, {roughness: .22, metalness: .85});
const KARET = mat(0x18191d, {roughness: .95}), ABU = mat(0x5b5e66, {roughness: .5, metalness: .4});
const LAMPU = mat(0xfff6d8, {emissive: 0xfff0c0, emissiveIntensity: .55, roughness: .2}), REKLAMA = mat(0xffd36a, {emissive: 0xffc840, emissiveIntensity: .5, roughness: .25});
const SEN = mat(0xf2a23a, {emissive: 0x8a4a00, emissiveIntensity: .6}), MUNDUR = mat(0xf4f4f0, {emissive: 0x606060, emissiveIntensity: .3});

function kanvas(k, w, h, lukis) { if (TC[k]) return TC[k]; const c = document.createElement('canvas'); c.width = w; c.height = h; lukis(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return TC[k] = t; }
const FONT = s => `900 ${s}px Montserrat, system-ui, sans-serif`;
const decal = (t, o = {}) => new THREE.MeshStandardMaterial({map: t, transparent: true, roughness: .5, polygonOffset: true, polygonOffsetFactor: -2, ...o});
function teksTex(isi, latar, warna, w = 512, h = 64) { return kanvas('t' + isi + latar + warna + w, w, h, (g) => {
  g.fillStyle = latar; g.fillRect(0, 0, w, h); g.fillStyle = warna; g.textAlign = 'center'; g.textBaseline = 'middle';
  let u = h * .64; g.font = FONT(u); while (g.measureText(isi).width > w * .92 && u > 8) { u -= 2; g.font = FONT(u); } g.fillText(isi, w / 2, h / 2 + 2); }); }
function platTex(teks) { return kanvas('p' + teks, 256, 64, g => { g.fillStyle = '#1b1c21'; g.fillRect(0, 0, 256, 64); g.strokeStyle = '#f4f4f0'; g.lineWidth = 4; g.strokeRect(6, 6, 244, 52);
  g.fillStyle = '#f4f4f0'; g.font = FONT(38); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(teks, 128, 34); }); }
// stiker samping: garis miring 3 warna + bulatan nomor warga + "WILLO" (dibaca benar di kedua sisi)
function stikerTex(no, aksen, cermin) { return kanvas(['s', no, aksen, cermin].join(), 512, 128, (g, w, h) => {
  if (cermin) { g.translate(w, 0); g.scale(-1, 1); }
  const garis = (x, lebar, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, h); g.lineTo(x + lebar, h); g.lineTo(x + lebar + 70, 0); g.lineTo(x + 70, 0); g.fill(); };
  garis(24, 30, aksen); garis(62, 14, '#1b1c21'); garis(84, 30, aksen);
  if (cermin) { g.setTransform(1, 0, 0, 1, 0, 0); }
  const cx = cermin ? w - 290 : 290; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, 64, 54, 0, 7); g.fill(); g.lineWidth = 7; g.strokeStyle = '#1b1c21'; g.stroke();
  g.fillStyle = '#1b1c21'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT(String(no).length > 2 ? 46 : 60); g.fillText(String(no), cx, 68);
  g.font = FONT(30); g.fillStyle = aksen; g.fillText('WILLO', cermin ? 110 : w - 110, 66); }); }
const kisiTex = () => kanvas('kisi', 128, 32, (g, w, h) => { g.fillStyle = '#111216'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3c44'; for (let x = 4; x < w; x += 10) for (let y = 3; y < h; y += 8) g.fillRect(x + (y % 16 ? 5 : 0), y, 6, 3); });
const tapakTex = () => kanvas('tapak', 64, 256, (g, w, h) => { g.fillStyle = '#1b1c21'; g.fillRect(0, 0, w, h); g.fillStyle = '#2c2d33'; for (let y = 0; y < h; y += 16) { g.fillRect(4, y, 24, 7); g.fillRect(36, y + 8, 24, 7); } });

// warna aksen (garis balap) yang kontras dengan cat
function kontras(warna) { const c = new THREE.Color(warna); const l = .2126 * c.r + .7152 * c.g + .0722 * c.b; return l > .45 ? 0x1d1e24 : 0xf6f6f2; }
function aksenStiker(warna) { const c = new THREE.Color(warna), hsl = {}; c.getHSL(hsl); return hsl.h > .1 && hsl.h < .2 && hsl.s > .5 ? '#2f6fd8' : '#f2c14a'; }   // mobil kuning -> stiker biru

function garisTepi(m, t = .04) { const o = new THREE.Mesh(m.geometry, GARIS); o.position.copy(m.position); o.rotation.copy(m.rotation);
  m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox, s = new THREE.Vector3(); b.getSize(s);
  o.scale.set(1 + 2 * t / Math.max(s.x, .01), 1 + 2 * t / Math.max(s.y, .01), 1 + 2 * t / Math.max(s.z, .01)); o.scale.multiply(m.scale); return o; }

// pembuat bagian: p(grup)(w,h,d, bahan, x,y,z, {r, rx, ry, rz, garis})
function pembuat(g) {
  const tepi = [];
  const p = (w, h, d, m, x, y, z, o = {}) => { const me = new THREE.Mesh(kb(w, h, d, o.r ?? .05), m); me.position.set(x, y, z); me.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0); g.add(me); if (o.garis) tepi.push(garisTepi(me, o.t)); return me; };
  p.silinder = (r, h, m, x, y, z, o = {}) => { const me = new THREE.Mesh(tb(r, o.r2 ?? r, h, o.n || 14), m); me.position.set(x, y, z); me.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0); g.add(me); return me; };
  p.bidang = (w, h, m, x, y, z, ry = 0, rx = 0) => { const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); me.position.set(x, y, z); me.rotation.set(rx, ry, 0, 'YXZ'); g.add(me); return me; };
  p.selesai = () => tepi.forEach(o => g.add(o));
  return p;
}

// gabungkan semua mesh diam dalam grup per bahan -> sedikit draw call (bagian ber-userData.jaga tidak disentuh)
function gabung(grup) {
  grup.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(grup.matrixWorld).invert(), per = new Map(), m4 = new THREE.Matrix4();
  const kumpul = o => { for (const c of [...o.children]) { if (c.userData.jaga) continue; kumpul(c);
    if (c.isMesh) { let gm = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); for (const a of Object.keys(gm.attributes)) if (!['position', 'normal', 'uv'].includes(a)) gm.deleteAttribute(a);
      if (!gm.attributes.uv) gm.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(gm.attributes.position.count * 2), 2));
      gm.applyMatrix4(m4.multiplyMatrices(inv, c.matrixWorld)); (per.get(c.material) || per.set(c.material, []).get(c.material)).push(gm); c.parent.remove(c); } } };
  kumpul(grup);
  for (const [m, list] of per) { const me = new THREE.Mesh(mergeGeometries(list, false), m); list.forEach(x => x.dispose());
    me.castShadow = m !== GARIS && !m.transparent; me.receiveShadow = m !== GARIS; grup.add(me); }
}

// ---------- BAN: dinding ban, tapak, pelek palang, bibir krom, dop. gaya: 'palang' | 'bintang' | 'baja' ----------
function buatBan(r, lebar, gaya, velg, kasar) {
  const putar = new THREE.Group(), p = pembuat(putar), tapak = mat(0xffffff, {map: tapakTex(), roughness: .95});
  p.silinder(r, lebar, tapak, 0, 0, 0, {rz: PI / 2, n: 20});
  for (const s of [-1, 1]) {
    const dinding = new THREE.Mesh(new THREE.TorusGeometry(r * .8, r * .15, 6, 20), KARET); dinding.rotation.y = PI / 2; dinding.position.x = s * (lebar / 2 - .02); putar.add(dinding);
    p.silinder(r * .64, .03, mat(0x2a2b31, {roughness: .5, metalness: .4}), s * (lebar / 2 - .005), 0, 0, {rz: PI / 2, n: 16});   // dalam pelek
    const bibir = new THREE.Mesh(new THREE.TorusGeometry(r * .63, .022, 5, 18), KROM); bibir.rotation.y = PI / 2; bibir.position.x = s * (lebar / 2 + .005); putar.add(bibir);
    const n = gaya === 'bintang' ? 6 : 5, mv = mat(velg, {roughness: .3, metalness: .7});
    for (let i = 0; i < n; i++) { const a = i * 2 * PI / n;
      if (gaya === 'baja') p(.04, r * .28, r * .2, mv, s * (lebar / 2 + .01), Math.cos(a) * r * .4, Math.sin(a) * r * .4, {rx: a, r: .01});
      else p(.04, r * .58, gaya === 'bintang' ? .05 : .08, mv, s * (lebar / 2 + .012), Math.cos(a) * r * .3, Math.sin(a) * r * .3, {rx: a, r: .015}); }
    if (gaya === 'baja') p.silinder(r * .5, .04, mv, s * (lebar / 2 + .006), 0, 0, {rz: PI / 2, n: 16});
    p.silinder(r * .14, .06, KROM, s * (lebar / 2 + .03), 0, 0, {rz: PI / 2, n: 10});   // dop tengah
  }
  if (kasar) for (let i = 0; i < 14; i++) { const a = i * 2 * PI / 14; for (const s of [-1, 1]) p(.13, .07, .2, KARET, s * (lebar / 2 - .08), Math.cos(a) * (r + .015), Math.sin(a) * (r + .015), {rx: a, r: .02}); }   // kembang ban garuk
  gabung(putar); return putar;
}

function pasangBan(mobil, bodi, d) {
  const roda = [];
  for (const [x, z, depan] of [[-d.bx, d.bz, 1], [d.bx, d.bz, 1], [-d.bx, -d.bzb, 0], [d.bx, -d.bzb, 0]]) {
    const piv = new THREE.Group(); piv.position.set(x, d.jari, z); const putar = buatBan(d.jari, d.lebar, d.velgGaya, d.velg, d.kasar); piv.add(putar);
    // kaliper rem (diam, tidak ikut berputar) mengintip dari balik pelek
    const kal = new THREE.Mesh(kb(.06, d.jari * .36, d.jari * .3, .02), mat(d.kaliper || 0xd8322a, {roughness: .4})); kal.position.set(Math.sign(x) * (d.lebar / 2 - .05), d.jari * .28, -d.jari * .18); piv.add(kal);
    mobil.add(piv); roda.push({piv, putar, depan});
  }
  return roda;
}

function apiKnalpot(bodi, x, y, z) { const api = new THREE.Mesh(new THREE.ConeGeometry(.15, .7, 8), new THREE.MeshBasicMaterial({color: 0xffa020, transparent: true, opacity: .9}));
  api.rotation.x = -PI / 2; api.position.set(x, y, z); api.visible = false; api.userData.jaga = true; bodi.add(api); return api; }

// ===================================================================== MODEL =====================================================================
function hatch(bodi, cat, aksen, no, lampuRem) {
  const p = pembuat(bodi), A = mat(aksen, {roughness: .45}), ak = aksenStiker(cat.color.getHex());
  // badan bawah, kap, gembungan kap & kisi ventilasi
  p(1.8, .58, 3.94, cat, 0, .76, 0, {r: .12, garis: 1});
  p(1.72, .14, 1.32, cat, 0, 1.08, 1.28, {r: .06, garis: 1, rx: .04});
  p(.74, .08, .7, cat, 0, 1.17, 1.18, {r: .04}); p(.5, .03, .08, HITAM, 0, 1.2, 1.52, {r: .01});
  [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) p(.3, .02, .05, HITAM, s * .52, 1.155, 1.08 + i * .13, {r: .01}); });
  // kabin: kaca gelap, pilar warna bodi, atap, scoop atap, antena
  p(1.56, .52, 2.02, KACA, 0, 1.32, -.6, {r: .07});
  const kd = p(1.5, .56, .06, KACA, 0, 1.31, .5, {r: .02, rx: -.52}); p(1.56, .06, .08, cat, 0, 1.56, .38, {r: .02, rx: -.52});
  p(1.62, .1, 1.78, cat, 0, 1.62, -.62, {r: .05, garis: 1});
  [-1, 1].forEach(s => { p(.1, .58, .1, cat, s * .76, 1.32, .44, {rx: -.52, r: .03}); p(.08, .5, .14, cat, s * .79, 1.33, -.36, {r: .02}); p(.1, .52, .34, cat, s * .78, 1.32, -1.48, {r: .03});
    p(.02, .05, 1.88, HITAM, s * .795, 1.07, -.56, {r: .005}); });   // pilar A/B/C + karet bawah kaca
  p(.52, .13, .42, cat, 0, 1.72, -.12, {r: .05, garis: 1, t: .025}); p(.36, .07, .03, HITAM, 0, 1.72, .1, {r: .01});
  p.silinder(.012, .5, HITAM, -.6, 1.92, -1.3, {n: 5, rz: .25});
  // roll cage putih terlihat dari kaca
  [-.2, -1.1].forEach(z => { p(1.3, .05, .05, mat(0xe8e8ee), 0, 1.52, z, {r: .01}); [-1, 1].forEach(s => p(.05, .44, .05, mat(0xe8e8ee), s * .63, 1.3, z, {r: .01})); });
  // garis balap kembar: kap & atap
  [-.2, .2].forEach(x => { p(.16, .012, 1.3, A, x, 1.153, 1.3, {r: 0, rx: .04}); p(.16, .012, 1.76, A, x, 1.676, -.62, {r: 0}); });
  // kaca belakang miring + bingkai
  p(1.46, .5, .06, KACA, 0, 1.3, -1.72, {r: .02, rx: .62});
  // spakbor lebar, side skirt, garis pintu, gagang, spion
  for (const [x, z] of [[-.92, 1.25], [.92, 1.25], [-.92, -1.25], [.92, -1.25]]) { p(.2, .34, 1.12, cat, x, .92, z, {r: .08, garis: 1, t: .03}); p(.06, .06, 1.0, HITAM, x * 1.08, .76, z, {r: .02}); }
  [-1, 1].forEach(s => { p(.1, .14, 1.42, HITAM, s * .9, .5, 0, {r: .04});
    p(.012, .5, .02, HITAM, s * .903, .8, .66, {r: 0}); p(.012, .5, .02, HITAM, s * .903, .8, -.62, {r: 0}); p(.012, .02, 1.26, HITAM, s * .903, 1.05, .02, {r: 0});
    p(.03, .04, .16, KROM, s * .91, .98, .22, {r: .01});
    p(.04, .04, .12, HITAM, s * .86, 1.1, .5, {r: .01}); p(.1, .14, .2, cat, s * .95, 1.16, .48, {r: .04, garis: 1, t: .02}); p(.01, .1, .15, KACA, s * 1.003, 1.16, .48, {r: 0}); });
  // stiker samping bernomor
  [-1, 1].forEach(s => p.bidang(1.4, .35, decal(stikerTex((no || 7) % 1000, ak, s < 0)), s * .904, .76, .02, s * PI / 2));
  // depan: bumper, kisi, lampu, sen, 4 lampu reli bulat di batang, pengait derek merah
  p(1.88, .26, .26, KARBON, 0, .52, 1.98, {r: .08, garis: 1, t: .025}); p(1.4, .06, .14, HITAM, 0, .38, 2.06, {r: .02});
  p.bidang(1.0, .2, mat(0xffffff, {map: kisiTex(), roughness: .6}), 0, .84, 1.975);
  [-1, 1].forEach(s => { p(.38, .17, .07, KROM, s * .62, .86, 1.96, {r: .03}); p(.32, .12, .03, LAMPU, s * .62, .86, 1.995, {r: .02}); p(.12, .09, .04, SEN, s * .83, .66, 2.09, {r: .02});
    p(.08, .1, .1, mat(0xd8322a), s * .5, .38, 2.12, {r: .02}); });
  p(1.42, .05, .05, HITAM, 0, .64, 2.12, {r: .01});
  [-.54, -.18, .18, .54].forEach(x => { p.silinder(.125, .1, HITAM, x, .64, 2.16, {rx: PI / 2, n: 14}); p.silinder(.1, .02, REKLAMA, x, .64, 2.215, {rx: PI / 2, n: 14});
    const c = new THREE.Mesh(new THREE.TorusGeometry(.11, .016, 5, 14), KROM); c.position.set(x, .64, 2.215); bodi.add(c); });
  const strip = p.bidang(1.5, .13, mat(0xffffff, {map: teksTex('WILLOAPPAREL.COM', '#f2c14a', '#1d1e24')}), 0, 1.5, .405, 0, -.52);
  // belakang: bumper, lampu belakang (rem menyala), lampu mundur, sen, panel tulisan, plat, knalpot ganda, penahan lumpur, derek
  p(1.88, .28, .24, KARBON, 0, .52, -1.98, {r: .08, garis: 1, t: .025});
  [-1, 1].forEach(s => { p(.48, .2, .06, KROM, s * .6, .88, -1.96, {r: .03}); p(.3, .15, .03, lampuRem, s * .66, .88, -1.995, {r: .02}); p(.12, .15, .03, SEN, s * .41, .88, -1.995, {r: .02});
    p(.12, .08, .03, MUNDUR, s * .3, .56, -2.11, {r: .02}); p(.36, .34, .03, mat(0xe0803a, {roughness: .7}), s * .95, .42, -1.78, {r: .02}); });
  p.bidang(.78, .15, mat(0xffffff, {map: teksTex('RELI KOTAK 4WD', '#1d1e24', '#f4f2ff', 256, 48)}), 0, .88, -1.977, PI);
  p.bidang(.62, .16, mat(0xffffff, {map: platTex('DK ' + (no || 'TAMU'))}), 0, .58, -2.112, PI);
  [-.55, -.38].forEach(x => p.silinder(.055, .24, KROM, x, .38, -2.06, {rx: PI / 2, n: 10}));
  const derek = new THREE.Mesh(new THREE.TorusGeometry(.07, .025, 6, 12), mat(0xd8322a)); derek.position.set(.45, .36, -2.12); bodi.add(derek);
  // sayap belakang: dudukan, sayap, pelat ujung
  [-.55, .55].forEach(x => p(.08, .26, .14, HITAM, x, 1.75, -1.62, {r: .02}));
  p(1.86, .06, .44, cat, 0, 1.88, -1.66, {r: .03, garis: 1, t: .025, rx: -.06}); [-1, 1].forEach(s => p(.04, .24, .5, HITAM, s * .94, 1.86, -1.66, {r: .015}));
  p.selesai();
  return {api: apiKnalpot(bodi, -.47, .38, -2.5), kursi: {x: .36, z: -.35, atap: 1.6, tinggi: 1.22}};
}

function gt(bodi, cat, aksen, no, lampuRem) {
  const p = pembuat(bodi), A = mat(aksen, {roughness: .45}), ak = aksenStiker(cat.color.getHex());
  // badan ceper lebar + moncong
  p(1.9, .46, 4.1, cat, 0, .64, -.05, {r: .14, garis: 1});
  p(1.82, .14, 1.55, cat, 0, .9, 1.2, {r: .07, garis: 1, rx: .07});
  p(1.84, .22, .5, cat, 0, .66, 2.02, {r: .1, garis: 1});
  [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) p(.42, .015, .05, HITAM, s * .46, .975, 1.12 + i * .1, {r: 0, rx: .07}); });   // lubang angin kap
  // kabin rendah membulat + atap + kaca belakang fastback
  p(1.48, .4, 1.5, KACA, 0, 1.07, -.42, {r: .1});
  p(1.42, .52, .06, KACA, 0, 1.03, .5, {r: .02, rx: -1.0});
  p(1.46, .07, 1.06, cat, 0, 1.29, -.46, {r: .03});
  p(1.42, .56, .06, KACA, 0, 1.06, -1.3, {r: .02, rx: 1.05});
  [-1, 1].forEach(s => { p(.07, .5, .09, cat, s * .72, 1.04, .5, {rx: -1.0, r: .03}); p(.07, .06, 1.5, HITAM, s * .74, .88, -.42, {r: 0});
    p(.1, .2, .62, cat, s * .7, .99, -1.25, {r: .04, rx: .38}); });   // pilar A, karet bawah kaca, pilar C landai
  p(1.84, .16, 1.0, cat, 0, .92, -1.62, {r: .07, garis: 1});   // dek belakang
  // garis balap kembar memanjang
  [-.18, .18].forEach(x => { p(.14, .012, 1.5, A, x, .97, 1.2, {r: 0, rx: .07}); p(.14, .012, 1.04, A, x, 1.328, -.46, {r: 0}); p(.14, .012, .96, A, x, 1.003, -1.62, {r: 0}); });
  // spakbor gembung, lubang udara samping, side skirt karbon, spion, gagang
  for (const [x, z] of [[-.95, 1.35], [.95, 1.35], [-.95, -1.35], [.95, -1.35]]) p(.24, .3, 1.16, cat, x, .74, z, {r: .1, garis: 1, t: .03});
  [-1, 1].forEach(s => { p(.04, .22, .52, HITAM, s * .955, .7, -.62, {r: .02}); for (let i = 0; i < 3; i++) p(.05, .02, .48, KARBON, s * .96, .63 + i * .07, -.62, {r: 0});
    p(.12, .07, 2.0, KARBON, s * .93, .4, 0, {r: .03}); p(.012, .02, 1.0, HITAM, s * .953, .88, .1, {r: 0}); p(.03, .035, .14, KROM, s * .955, .82, -.1, {r: .01});
    p(.04, .04, .1, HITAM, s * .78, .96, .5, {r: .01}); p(.1, .1, .18, cat, s * .84, 1.0, .5, {r: .04, garis: 1, t: .02}); });
  [-1, 1].forEach(s => p.bidang(1.3, .32, decal(stikerTex((no || 7) % 1000, ak, s < 0)), s * .953, .66, .25, s * PI / 2));
  // depan: splitter, lampu LED tipis, DRL, kisi lebar, lubang rem
  p(1.96, .04, .4, KARBON, 0, .4, 2.1, {r: .015});
  p.bidang(1.0, .16, mat(0xffffff, {map: kisiTex(), roughness: .6}), 0, .6, 2.275);
  [-1, 1].forEach(s => { p(.46, .07, .06, KARBON, s * .6, .8, 2.24, {r: .02, ry: s * .2}); p(.4, .035, .03, LAMPU, s * .6, .8, 2.27, {r: .01, ry: s * .2});
    p(.26, .025, .03, LAMPU, s * .66, .72, 2.255, {r: .01, ry: s * .2}); p(.22, .12, .04, HITAM, s * .74, .53, 2.24, {r: .03}); });
  const strip = p.bidang(1.4, .12, mat(0xffffff, {map: teksTex('WILLOAPPAREL.COM', '#f2c14a', '#1d1e24')}), 0, 1.22, .565, 0, -.95);
  // belakang: lampu bar penuh (rem), difuser bersirip, knalpot 4, plat
  p(1.84, .3, .2, KARBON, 0, .58, -2.06, {r: .08, garis: 1, t: .025});
  p(1.64, .08, .05, mat(0x5a1010, {roughness: .3}), 0, .88, -2.12, {r: .02}); p(1.6, .055, .03, lampuRem, 0, .88, -2.145, {r: .01});
  [-1, 1].forEach(s => p(.16, .1, .03, SEN, s * .72, .78, -2.13, {r: .02}));
  p(1.5, .14, .3, KARBON, 0, .38, -2.0, {r: .03}); for (let i = 0; i < 5; i++) p(.03, .16, .3, HITAM, -.5 + i * .25, .38, -2.06, {r: 0});
  [-.66, -.5, .5, .66].forEach(x => p.silinder(.05, .2, KROM, x, .4, -2.13, {rx: PI / 2, n: 10}));
  p.bidang(.6, .15, mat(0xffffff, {map: platTex('DK ' + (no || 'TAMU'))}), 0, .62, -2.163, PI);
  // sayap leher angsa
  [-.5, .5].forEach(x => { p(.06, .4, .1, KARBON, x, 1.18, -1.92, {r: .02, rx: -.3}); });
  p(1.94, .05, .48, KARBON, 0, 1.4, -1.98, {r: .02, rx: -.08, garis: 1, t: .02}); p(1.9, .015, .12, A, 0, 1.43, -1.82, {r: 0, rx: -.08});
  [-1, 1].forEach(s => p(.04, .22, .56, cat, s * .98, 1.38, -1.98, {r: .015}));
  p.selesai();
  return {api: apiKnalpot(bodi, -.58, .4, -2.55), kursi: {x: .34, z: -.42, atap: 1.3, tinggi: 1.0}};
}

function jip(bodi, cat, aksen, no, lampuRem) {
  const p = pembuat(bodi), ak = aksenStiker(cat.color.getHex()), LAMPU_BAR = mat(0xffffff, {emissive: 0xfff4d0, emissiveIntensity: .7, roughness: .2});
  // sasis + bodi tinggi kotak
  p(1.4, .22, 3.5, HITAM, 0, .62, 0, {r: .04});
  p(1.84, .66, 3.7, cat, 0, 1.08, 0, {r: .1, garis: 1});
  p(1.8, .1, 1.22, cat, 0, 1.45, 1.22, {r: .04, garis: 1}); p(.9, .02, .5, HITAM, 0, 1.505, 1.25, {r: .01});
  // kabin: kaca, pilar, atap
  p(1.7, .6, 2.15, KACA, 0, 1.78, -.6, {r: .05});
  p(1.82, .1, 2.3, cat, 0, 2.12, -.6, {r: .04, garis: 1});
  [-1, 1].forEach(s => { [.44, -.38, -1.62].forEach((z, i) => p(.08, .62, i ? .14 : .1, cat, s * .87, 1.78, z, {r: .02})); p(.02, .05, 2.1, HITAM, s * .86, 1.5, -.6, {r: 0}); });
  p(1.72, .08, .1, cat, 0, 2.06, .48, {r: .02}); p(1.72, .08, .1, cat, 0, 1.5, .48, {r: .02});
  // spakbor plastik hitam, pijakan samping, garis pintu, gagang, spion
  for (const [x, z] of [[-.98, 1.3], [.98, 1.3], [-.98, -1.3], [.98, -1.3]]) p(.26, .14, 1.24, HITAM, x, 1.1, z, {r: .05, garis: 1, t: .02});
  [-1, 1].forEach(s => { p(.24, .06, 1.6, KARBON, s * 1.0, .62, 0, {r: .02}); p(.05, .12, .1, HITAM, s * .96, .68, .55, {r: .01}); p(.05, .12, .1, HITAM, s * .96, .68, -.55, {r: .01});
    p(.012, .62, .02, HITAM, s * .923, 1.06, -.42, {r: 0}); p(.03, .04, .16, KROM, s * .93, 1.27, .1, {r: .01}); p(.03, .04, .16, KROM, s * .93, 1.27, -.86, {r: .01});
    p(.04, .04, .14, HITAM, s * .92, 1.58, .4, {r: .01}); p(.1, .18, .14, HITAM, s * .99, 1.62, .4, {r: .03}); });
  [-1, 1].forEach(s => p.bidang(1.3, .32, decal(stikerTex((no || 7) % 1000, ak, s < 0)), s * .922, .98, 0, s * PI / 2));
  // snorkel kanan
  p(.14, .9, .14, HITAM, .98, 1.75, .62, {r: .05}); p(.16, .14, .3, HITAM, .98, 2.22, .66, {r: .05});
  // depan: kisi palang, lampu bulat, sen, bumper baja, bull bar + winch
  p(1.3, .4, .04, HITAM, 0, 1.18, 1.87, {r: .02}); for (let i = 0; i < 4; i++) p(1.1, .04, .05, KROM, 0, 1.04 + i * .09, 1.9, {r: .01});
  [-1, 1].forEach(s => { p.silinder(.15, .06, KROM, s * .68, 1.18, 1.88, {rx: PI / 2, n: 14}); p.silinder(.12, .02, LAMPU, s * .68, 1.18, 1.915, {rx: PI / 2, n: 14});
    p(.12, .08, .04, SEN, s * .72, .95, 1.88, {r: .02}); });
  p(1.9, .24, .3, KARBON, 0, .74, 1.98, {r: .04, garis: 1, t: .02});
  p(.5, .18, .22, HITAM, 0, .76, 2.16, {r: .03}); p.silinder(.07, .36, ABU, 0, .76, 2.2, {rz: PI / 2, n: 10}); p(.1, .06, .06, mat(0xd8322a), 0, .7, 2.3, {r: .01});
  [-.52, .52].forEach(x => p.silinder(.04, .7, ABU, x, 1.02, 2.17, {n: 8}));
  p.silinder(.04, 1.12, ABU, 0, 1.36, 2.17, {rz: PI / 2, n: 8}); [-1, 1].forEach(s => p.silinder(.04, .4, ABU, s * .56, 1.3, 2.07, {rx: PI / 2 + .9, n: 8}));
  // light bar & rak atap (jeriken, papan pasir oranye, terpal)
  p(1.5, .13, .16, HITAM, 0, 2.25, .38, {r: .03}); for (let i = 0; i < 6; i++) p(.18, .08, .03, LAMPU_BAR, -.6 + i * .24, 2.25, .465, {r: .015});
  [-1, 1].forEach(s => p(.05, .08, 2.0, ABU, s * .8, 2.26, -.68, {r: .02})); for (let i = 0; i < 4; i++) p(1.64, .05, .05, ABU, 0, 2.27, .2 - i * .6, {r: .01});
  p(.38, .32, .2, mat(0xc8321e, {roughness: .5}), -.42, 2.44, -1.4, {r: .04, garis: 1, t: .02}); p(.38, .32, .2, mat(0x3a7a3a, {roughness: .5}), -.42, 2.44, -1.15, {r: .04, garis: 1, t: .02});
  [.28, .5].forEach(x => p(.18, .05, 1.6, mat(0xf07a1a, {roughness: .6}), x, 2.32 + (x - .28) * .3, -.6, {r: .02}));
  p(.6, .22, .4, mat(0x4f6a3a, {roughness: .9}), -.4, 2.4, -.35, {r: .08});
  // belakang: lampu tegak, plat, ban cadangan, tangga, penahan lumpur, knalpot
  p(1.84, .22, .26, KARBON, 0, .74, -1.94, {r: .04, garis: 1, t: .02});
  [-1, 1].forEach(s => { p(.14, .42, .06, KROM, s * .82, 1.15, -1.86, {r: .03}); p(.1, .2, .03, lampuRem, s * .82, 1.22, -1.895, {r: .02}); p(.1, .1, .03, SEN, s * .82, 1.04, -1.895, {r: .02});
    p(.34, .34, .03, mat(0xe0803a, {roughness: .7}), s * .98, .55, -1.72, {r: .02}); });
  p.bidang(.6, .15, mat(0xffffff, {map: platTex('DK ' + (no || 'TAMU'))}), 0, .82, -2.075, PI);
  const cad = new THREE.Group(); cad.position.set(.2, 1.4, -2.05); cad.rotation.y = PI / 2; bodi.add(cad);
  { const q = pembuat(cad); q.silinder(.42, .26, KARET, 0, 0, 0, {rz: PI / 2, n: 18}); q.silinder(.26, .28, mat(0xd8dbe0, {metalness: .6, roughness: .3}), 0, 0, 0, {rz: PI / 2, n: 14});
    q.bidang(.4, .14, mat(0xffffff, {map: teksTex('DUNIA KOTAK', '#1d1e24', '#f2c14a', 256, 48)}), .145, 0, 0, PI / 2); }
  [-.72, -.44].forEach(x => p.silinder(.022, .7, ABU, x, 1.62, -1.9, {n: 6})); for (let i = 0; i < 4; i++) p.silinder(.018, .28, ABU, -.58, 1.36 + i * .17, -1.9, {rz: PI / 2, n: 6});   // tangga ke atap
  p.silinder(.06, .22, KROM, -.58, .5, -1.98, {rx: PI / 2, n: 10});
  p.selesai();
  return {api: apiKnalpot(bodi, -.58, .5, -2.4), kursi: {x: .38, z: -.32, atap: 2.08, tinggi: 1.28}};
}

const SPEK = {
  hatch: {f: hatch, jari: .4, lebar: .34, bx: .92, bz: 1.25, bzb: 1.25, velgGaya: 'palang', velg: 0xd8dbe0, kaliper: 0xd8322a},
  gt: {f: gt, jari: .4, lebar: .38, bx: .95, bz: 1.35, bzb: 1.35, velgGaya: 'bintang', velg: 0xd4a838, kaliper: 0xf2c14a},
  jip: {f: jip, jari: .5, lebar: .44, bx: .98, bz: 1.3, bzb: 1.3, velgGaya: 'baja', velg: 0xeeeeea, kaliper: 0x5b5e66, kasar: 1},
};

export function buatMobil(model, warna, no) {
  const d = SPEK[model] || SPEK.hatch, mobil = new THREE.Group(), bodi = new THREE.Group(); mobil.add(bodi);   // bodi oleng; ban tetap di tanah
  const cat = new THREE.MeshStandardMaterial({color: warna, roughness: .32, metalness: .18});   // cat mengilap
  const lampuRem = new THREE.MeshStandardMaterial({color: 0x8a1010, emissive: 0xff2a1a, emissiveIntensity: .5, roughness: .3});
  const {api, kursi} = d.f(bodi, cat, kontras(warna), no, lampuRem);
  const roda = pasangBan(mobil, bodi, d);
  gabung(bodi);
  const supir = new THREE.Group(); supir.userData.jaga = true; bodi.add(supir);
  mobil.userData = {bodi, roda, lampuRem, api, supir, kursi, jari: d.jari, model: SPEK[model] ? model : 'hatch'};
  return mobil;
}

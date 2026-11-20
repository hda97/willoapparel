// Model 3D Mancing Kotak: ikan per jenis (bentuk badan, sirip, ekor, corak berbeda) & perahu (sampan, jukung bercadik, kapal nelayan).
// Gaya low-poly datar seperti desa Dunia Kotak. Semua bentuk umum ikan Nusantara, tanpa merek/karakter berhak cipta.
import * as THREE from 'three';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .7, flatShading: true, ...o});
const kotak = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); return m; };
const gelap = (c, k) => new THREE.Color(c).multiplyScalar(k);

// sirip = kipas segitiga datar di bidang YZ (x = 0), titik [z, y]; pusat kipas = titik pertama
function sirip(titik, warna, x = 0) {
  const p = []; const [c, ...r] = titik;
  for (let i = 0; i < r.length - 1; i++) p.push(x, c[1], c[0], x, r[i][1], r[i][0], x, r[i + 1][1], r[i + 1][0]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals();
  return new THREE.Mesh(g, mat(warna, {side: THREE.DoubleSide, roughness: .6}));
}

// badan = lathe (profil jari-jari dari ekor ke kepala) diputar ke sumbu Z, kepala di +Z; diwarnai punggung→perut + corak
function badan(prof, L, w, h, warna, perut, pola) {
  const pts = prof.map(([t, r]) => new THREE.Vector2(Math.max(.001, r), (t - .5) * L));
  const g = new THREE.LatheGeometry(pts, 9); g.rotateX(Math.PI / 2); g.scale(w, h, 1);
  const pos = g.attributes.position, col = [], cA = new THREE.Color(warna), cB = new THREE.Color(perut), cG = gelap(warna, .55), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / h, z = pos.getZ(i) / L;
    tmp.copy(cB).lerp(cA, THREE.MathUtils.smoothstep(y, -.25, .2));
    if (pola === 'belang' && y > -.2 && Math.sin(z * 34) > .55) tmp.lerp(cG, .55);
    if (pola === 'bintik' && y > -.25 && Math.sin(z * 61 + i * 1.7) * Math.cos(i * 2.3) > .45) tmp.lerp(cG, .6);
    if (pola === 'garis' && Math.abs(y - .05) < .12) tmp.lerp(new THREE.Color(0xf2c14a), .7);
    col.push(tmp.r, tmp.g, tmp.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .45, metalness: .08, flatShading: true}));
}

function mata(g, x, y, z, r) {
  for (const s of [-1, 1]) {
    const putih = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat(0xffffff, {flatShading: false, roughness: .3})); putih.position.set(s * x, y, z);
    const hitam = new THREE.Mesh(new THREE.SphereGeometry(r * .58, 8, 6), mat(0x15161c, {flatShading: false, roughness: .2})); hitam.position.set(s * (x + r * .5), y + r * .1, z + r * .25);
    const kilau = new THREE.Mesh(new THREE.SphereGeometry(r * .2, 6, 4), new THREE.MeshBasicMaterial({color: 0xffffff})); kilau.position.set(s * (x + r * .85), y + r * .35, z + r * .35);
    g.add(putih, hitam, kilau);
  }
}

// profil badan: [posisi 0 = ekor .. 1 = moncong, jari-jari 0..1]
const PROF = {
  pipih: [[0, .1], [.12, .2], [.3, .62], [.5, .95], [.68, 1], [.84, .82], [.95, .48], [1, 0]],          // nila, gurami, mas (badan tinggi)
  ramping: [[0, .1], [.12, .22], [.35, .7], [.6, 1], [.8, .9], [.93, .55], [1, 0]],                       // wader, layang, tongkol
  panjang: [[0, .12], [.15, .45], [.4, .85], [.7, 1], [.88, .95], [.97, .6], [1, 0]],                      // lele, gabus, baung (kepala lebar)
  belut: [[0, .05], [.1, .55], [.3, .9], [.6, 1], [.9, .95], [.98, .55], [1, 0]],
};
// jenis ikan: badan, panjang L, lebar w, tinggi h, ekor (garpu|bulat|lancip), punggung (tinggi|panjang|duri), kumis, corak
const JENIS = {
  'Nila': {b: 'pipih', w: .16, h: .3, ekor: 'bulat', pg: 'panjang', pola: 'belang'},
  'Mujair': {b: 'pipih', w: .15, h: .27, ekor: 'bulat', pg: 'panjang'},
  'Lele': {b: 'panjang', w: .17, h: .14, ekor: 'bulat', pg: 'rendah', kumis: 4, L: 1.25},
  'Gurami': {b: 'pipih', w: .14, h: .36, ekor: 'bulat', pg: 'panjang', pola: 'belang'},
  'Ikan Mas': {b: 'pipih', w: .17, h: .3, ekor: 'garpu', pg: 'tinggi', kumis: 2},
  'Patin': {b: 'ramping', w: .15, h: .2, ekor: 'garpu', pg: 'tinggi', kumis: 2, L: 1.2},
  'Wader': {b: 'ramping', w: .1, h: .17, ekor: 'garpu', pg: 'tinggi', pola: 'garis'},
  'Nilem': {b: 'ramping', w: .12, h: .21, ekor: 'garpu', pg: 'tinggi'},
  'Betok': {b: 'pipih', w: .15, h: .27, ekor: 'bulat', pg: 'duri'},
  'Belut': {b: 'belut', w: .08, h: .085, ekor: 'lancip', pg: 'tidak', L: 1.6},
  'Gabus': {b: 'panjang', w: .15, h: .15, ekor: 'bulat', pg: 'rendah', pola: 'bintik', L: 1.2},
  'Baung': {b: 'panjang', w: .15, h: .16, ekor: 'garpu', pg: 'tinggi', kumis: 4, L: 1.15},
  'Ikan Layang': {b: 'ramping', w: .11, h: .17, ekor: 'garpu', pg: 'tinggi', pola: 'garis'},
  'Baronang': {b: 'pipih', w: .12, h: .34, ekor: 'lancip', pg: 'duri', pola: 'bintik'},
  'Tongkol': {b: 'ramping', w: .2, h: .25, ekor: 'garpu', pg: 'tinggi', pola: 'belang'},
  'Kakap Merah': {b: 'pipih', w: .17, h: .3, ekor: 'lancip', pg: 'duri'},
  'Kerapu': {b: 'pipih', w: .2, h: .27, ekor: 'bulat', pg: 'duri', pola: 'bintik'},
  'Tenggiri': {b: 'ramping', w: .12, h: .16, ekor: 'garpu', pg: 'tinggi', pola: 'bintik', L: 1.35},
  // ikan baru (Huda 20 Nov 2026: level ikan & ikan raksasa per habitat)
  'Tawes': {b: 'pipih', w: .13, h: .28, ekor: 'garpu', pg: 'tinggi'},
  'Betutu': {b: 'panjang', w: .16, h: .15, ekor: 'bulat', pg: 'rendah', pola: 'bintik'},
  'Toman': {b: 'panjang', w: .16, h: .16, ekor: 'bulat', pg: 'rendah', pola: 'belang', L: 1.3},
  'Patin Raksasa': {b: 'ramping', w: .17, h: .22, ekor: 'garpu', pg: 'tinggi', kumis: 2, L: 1.3},
  'Jelawat': {b: 'ramping', w: .14, h: .22, ekor: 'garpu', pg: 'tinggi'},
  'Hampala': {b: 'ramping', w: .14, h: .24, ekor: 'garpu', pg: 'tinggi', pola: 'belang'},
  'Belida': {b: 'pipih', w: .1, h: .3, ekor: 'lancip', pg: 'tidak', pola: 'bintik', L: 1.3},
  'Tapah Raksasa': {b: 'panjang', w: .17, h: .16, ekor: 'bulat', pg: 'rendah', kumis: 4, L: 1.4},
  'Barakuda': {b: 'ramping', w: .1, h: .13, ekor: 'garpu', pg: 'tinggi', pola: 'belang', L: 1.5},
  'Kuwe Rambe': {b: 'pipih', w: .16, h: .32, ekor: 'garpu', pg: 'tinggi'},
  'Tuna Sirip Kuning': {b: 'ramping', w: .22, h: .27, ekor: 'garpu', pg: 'tinggi', pola: 'garis', L: 1.25},
  'Kerapu Raksasa': {b: 'pipih', w: .24, h: .28, ekor: 'bulat', pg: 'duri', pola: 'bintik', L: 1.15},
  'Ikan Layaran': {b: 'ramping', w: .12, h: .17, ekor: 'garpu', pg: 'layar', paruh: 1, L: 1.5},
};

// f: {nama, warna, perut, pj, g}. Badan sejajar sumbu Z, kepala di +Z. userData.ekor = grup ekor yang bisa dikibaskan.
export function ikanMesh(f) {
  const g = new THREE.Group(), s = f.pj * (.55 + Math.min(1.4, f.g / 2500) * .5);
  if (!f.g) return sampah(f, s);
  if (f.nama === 'Cumi') return cumi(f, s);
  const j = JENIS[f.nama] || JENIS['Nila'], L = 1.1 * (j.L || 1), w = j.w * 1.6, h = j.h * 1.6, sirC = gelap(f.warna, .8).getHex();
  g.add(badan(PROF[j.b], L, w, h, f.warna, f.perut, j.pola));
  const zE = -L / 2, ek = new THREE.Group(); ek.position.z = zE + .02;
  const eh = Math.max(h * 1.05, .18);
  if (j.ekor === 'garpu') ek.add(sirip([[.04, 0], [-.3, eh], [-.2, eh * .65], [-.13, 0], [-.2, -eh * .65], [-.3, -eh], [.04, 0]], sirC));
  else if (j.ekor === 'bulat') ek.add(sirip([[.04, 0], [-.12, eh * .8], [-.24, eh * .7], [-.3, 0], [-.24, -eh * .7], [-.12, -eh * .8], [.04, 0]], sirC));
  else if (j.ekor === 'lancip') ek.add(sirip([[.04, 0], [-.26, eh * .9], [-.2, 0], [-.26, -eh * .9], [.04, 0]], sirC));
  else ek.add(sirip([[.04, 0], [-.05, h * .9], [-.22, 0], [-.05, -h * .9], [.04, 0]], sirC));
  g.add(ek); g.userData.ekor = ek;
  // sirip punggung
  const top = h * .92;
  if (j.pg === 'tinggi') g.add(sirip([[0, top * .8], [-.08 * L, top * .8], [.02 * L, top + h * .55], [.14 * L, top * .85]], sirC));
  else if (j.pg === 'panjang') g.add(sirip([[-.05 * L, top * .8], [-.32 * L, top * .55], [-.25 * L, top + h * .3], [.05 * L, top + h * .45], [.22 * L, top * .9]], sirC));
  else if (j.pg === 'rendah') g.add(sirip([[-.1 * L, top * .7], [-.42 * L, top * .25], [-.38 * L, top + h * .25], [.1 * L, top + h * .25], [.18 * L, top * .85]], sirC));
  else if (j.pg === 'layar') g.add(sirip([[-.3 * L, top * .8], [-.36 * L, top + h * .2], [-.2 * L, top + h * 1.6], [.05 * L, top + h * 2.1], [.3 * L, top + h * 1.2], [.34 * L, top * .9]], sirC));   // sirip layar tinggi
  else if (j.pg === 'duri') { const p = [[-.05 * L, top * .8], [-.3 * L, top * .55]]; for (let k = 0; k <= 6; k++) p.push([-.26 * L + k * .07 * L, top + h * (k % 2 ? .18 : .42)]); p.push([.2 * L, top * .9]); g.add(sirip(p, sirC)); }
  // sirip perut & dada (kiri-kanan, sedikit miring keluar)
  if (j.b !== 'belut') {
    g.add(sirip([[-.12 * L, -h * .8], [-.22 * L, -h * .85], [-.18 * L, -h * 1.3], [-.05 * L, -h * .9]], sirC));
    for (const sx of [-1, 1]) { const d = sirip([[0, 0], [-.04, -.03], [-.16, -.1], [-.1, .02]], sirC); d.position.set(sx * w * .7, -h * .25, .22 * L); d.rotation.y = sx * .5; g.add(d); }
  }
  // mata, mulut, kumis
  const zM = L / 2 - (j.b === 'pipih' ? .18 : .14) * L * .9;
  mata(g, w * .62, h * .28, zM, Math.max(.035, Math.min(.06, h * .2)));
  g.add(kotak(w * .7, .025, .04, 0x3a2224, 0, -h * .12, L / 2 - .015));
  if (j.paruh) { const p = new THREE.Mesh(new THREE.ConeGeometry(h * .18, L * .4, 6), mat(gelap(f.warna, .7))); p.rotation.x = Math.PI / 2; p.position.set(0, h * .05, L / 2 + L * .18); g.add(p); }   // moncong runcing
  if (j.kumis) for (let k = 0; k < j.kumis; k++) { const sx = k % 2 ? 1 : -1, ats = k < 2, pj = ats ? .34 : .2;   // kumis: dari sudut mulut melengkung ke samping-belakang
    const km = new THREE.Group(); km.position.set(sx * w * .35, -h * (ats ? .08 : .3), L / 2 - .03);
    const b = kotak(pj, .016, .016, 0x2a2624, sx * pj / 2, 0, 0); km.add(b); km.rotation.set(0, sx * (ats ? .55 : .8), sx * (ats ? -.25 : -.55)); g.add(km); }
  g.scale.setScalar(s);
  return g;
}

function cumi(f, s) {
  const g = new THREE.Group(), L = 1;
  g.add(badan([[0, 0], [.08, .45], [.3, .85], [.7, 1], [.95, .95], [1, .7]], L, .2, .2, f.warna, f.perut, 'bintik'));
  for (const sx of [-1, 1]) { const sg = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -.12, sx * .24, 0, -.4, 0, 0, -.5], 3)); sg.computeVertexNormals();
    g.add(new THREE.Mesh(sg, mat(f.warna, {side: THREE.DoubleSide}))); }   // sirip cumi kiri-kanan
  const kp = new THREE.Mesh(new THREE.SphereGeometry(.17, 8, 6), mat(f.perut)); kp.scale.set(1, .9, .9); kp.position.z = .56; g.add(kp);
  mata(g, .14, .03, .58, .055);
  const ek = new THREE.Group(); ek.position.z = .66;
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, pj = k < 2 ? .7 : .42, t = new THREE.Mesh(new THREE.CylinderGeometry(.012, .035, pj, 5), mat(f.warna));
    t.rotation.x = Math.PI / 2; t.position.set(Math.cos(a) * .08, Math.sin(a) * .08, pj / 2); ek.add(t); }
  g.add(ek); g.userData.ekor = ek; g.scale.setScalar(s); return g;
}

function sampah(f, s) {
  const g = new THREE.Group();
  if (f.nama.startsWith('Sepatu')) {
    g.add(kotak(.36, .08, .95, 0xe8e0d0, 0, -.18, 0), kotak(.32, .26, .6, f.warna, 0, -.02, -.15), kotak(.3, .18, .4, f.warna, 0, -.06, .25), kotak(.3, .12, .12, 0xe8e0d0, 0, -.08, .44));
    for (let k = 0; k < 3; k++) g.add(kotak(.34, .03, .04, 0xffffff, 0, .12 - k * .02, .05 + k * .09));
    g.add(kotak(.2, .2, .04, 0x5a8a3a, .08, .2, -.3));   // lumut nyangkut
  } else if (f.nama.startsWith('Kaleng')) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .6, 10), mat(f.warna, {metalness: .6, roughness: .35})); c.rotation.x = Math.PI / 2; g.add(c);
    const lb = new THREE.Mesh(new THREE.CylinderGeometry(.205, .205, .32, 10), mat(f.perut)); lb.rotation.x = Math.PI / 2; g.add(lb);
  } else {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .6, 8), mat(f.warna, {transparent: true, opacity: .75, roughness: .1})); b.rotation.x = Math.PI / 2; g.add(b);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(.065, .16, .18, 8), b.material); l.rotation.x = Math.PI / 2; l.position.z = .38; g.add(l);
    const tp = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .07, 8), mat(0x3a7bd5)); tp.rotation.x = Math.PI / 2; tp.position.z = .5; g.add(tp);
  }
  g.scale.setScalar(s); return g;
}

// ---- perahu ----
// lambung = bentuk tampak atas (runcing di haluan & buritan) diekstrusi ke atas, dasar dipersempit, ujung-ujung dinaikkan
function lambung(pj, lb, tg, warna, list) {
  const sh = new THREE.Shape(), n = 14;
  for (let i = 0; i <= n; i++) { const t = i / n * Math.PI; const x = Math.sin(t) ** .7 * lb / 2, z = Math.cos(t) * pj / 2; i ? sh.lineTo(x, z) : sh.moveTo(x, z); }
  for (let i = n - 1; i > 0; i--) { const t = i / n * Math.PI; sh.lineTo(-(Math.sin(t) ** .7) * lb / 2, Math.cos(t) * pj / 2); }
  const g = new THREE.ExtrudeGeometry(sh, {depth: tg, bevelEnabled: false, steps: 2}); g.rotateX(-Math.PI / 2);   // ekstrusi ke +Y
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / tg, z = p.getZ(i) / (pj / 2);
    const sempit = .45 + .55 * y; p.setX(i, p.getX(i) * sempit); p.setZ(i, p.getZ(i) * (.86 + .14 * y)); p.setY(i, p.getY(i) + y * tg * .9 * Math.abs(z) ** 3); }
  g.computeVertexNormals();
  // tanpa tutup atas & bawah (grup 0) supaya bagian dalam perahu terlihat; dinding dua sisi, bagian dalam kayu
  const m = new THREE.Mesh(g, [new THREE.MeshBasicMaterial({visible: false}), mat(warna, {side: THREE.DoubleSide})]); m.castShadow = true;
  const g2 = g.clone(); g2.scale(1.03, .16, 1.01); g2.translate(0, tg * .78, 0);
  const s = new THREE.Mesh(g2, [new THREE.MeshBasicMaterial({visible: false}), mat(list, {side: THREE.DoubleSide})]); return [m, s];
}

// jenis: 'sampan' (perahu dayung danau/sungai) | 'jukung' (perahu bercadik) | 'kapal' (kapal nelayan bermotor berkabin)
export function perahu(jenis = 'sampan', warna = 0xc8553d, list = 0xf4f0e6) {
  const g = new THREE.Group(), kayu = 0x9a6a3a, kayuG = 0x6a4426;
  if (jenis === 'kapal') {
    const [m, s] = lambung(9, 3.2, 1.5, warna, list); m.position.y = s.position.y = -.5; g.add(m, s);
    g.add(kotak(2.6, .12, 7.2, kayu, 0, .62, -.1));                                                // dek
    g.add(kotak(2, 1.6, 2.2, 0xf4f4f0, 0, 1.45, -1.6), kotak(2.3, .16, 2.6, 0x3a7ad8, 0, 2.3, -1.6));   // kabin & atap
    for (const sx of [-1, 1]) g.add(kotak(.06, .6, 1.4, 0x9ad0f0, sx * 1.01, 1.7, -1.6));
    g.add(kotak(1.2, .6, .06, 0x9ad0f0, 0, 1.7, -.49));
    const tiang = kotak(.12, 3.2, .12, kayuG, 0, 2.2, 1.6); g.add(tiang);
    const bd = sirip([[0, 0], [0, .7], [-.9, .35]], 0xe0503a); bd.rotation.y = Math.PI / 2; bd.position.set(0, 3.1, 1.6); g.add(bd);   // bendera
    for (let k = 0; k < 3; k++) g.add(kotak(.5, .5, .5, [0x3a7bd5, 0xf2c14a, 0x3aa860][k], -.7 + k * .7, .9, 2.4));   // kotak ikan
    g.add(kotak(.5, .7, .5, 0x2a2c34, 0, .9, -3.6));   // mesin tempel
    const ban = new THREE.Mesh(new THREE.TorusGeometry(.3, .09, 6, 10), mat(0xff7a2a)); ban.position.set(1.62, .9, .6); ban.rotation.y = Math.PI / 2; g.add(ban);
  } else if (jenis === 'jukung') {
    const [m, s] = lambung(6.5, 1.1, .9, warna, list); m.position.y = s.position.y = -.35; g.add(m, s);
    g.add(kotak(.8, .08, 4.6, kayu, 0, .3, 0));
    for (const z of [-1.2, 1.2]) g.add(kotak(5, .12, .14, 0xd8c08a, 0, .62, z));                       // lengan cadik (bambu)
    for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 4.6, 6), mat(0xd8c08a)); c.rotation.x = Math.PI / 2; c.position.set(sx * 2.45, .08, 0); g.add(c);
      for (const z of [-1.2, 1.2]) g.add(kotak(.08, .55, .08, 0xd8c08a, sx * 2.45, .35, z)); }
    g.add(kotak(.1, 2.6, .1, kayuG, 0, 1.6, .9));
    const lyr = sirip([[0, 0], [0, 2.2], [-1.4, .2]], 0xf4ecd8); lyr.position.set(0, .6, .9); g.add(lyr);   // layar
    const hh = sirip([[0, 0], [0, .3], [.4, .5]], list); hh.position.set(0, .55, 3.1); g.add(hh);   // hiasan haluan
  } else {
    const [m, s] = lambung(5, 1.6, .75, warna, list); m.position.y = s.position.y = -.3; g.add(m, s);
    g.add(kotak(1.0, .06, 3.6, kayu, 0, -.12, 0), kotak(.6, .06, 4.2, kayu, 0, -.2, 0));
    for (const z of [-1, .2, 1.2]) g.add(kotak(1.35, .1, .4, kayu, 0, .42, z));                      // bangku
    const dy = new THREE.Group(); dy.add(kotak(.07, .07, 2.2, kayuG, 0, 0, 0), kotak(.05, .3, .5, kayuG, 0, 0, -1.2)); dy.position.set(.55, .55, .1); dy.rotation.set(-.1, .15, -.2); g.add(dy);   // dayung
    g.add(kotak(.4, .25, .3, 0x3a7ad8, -.3, .3, -1.6));   // ember kecil
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

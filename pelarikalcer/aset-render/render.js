// Studio render aset GDD (rambut, turnaround, sepatu 3 sudut, item, jam 4 strap) dari model 3D prosedural.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buatPelari } from '../src/pelari.js';
import { GEAR_CATALOG, SKIN_TONES, HAIR_COLORS } from '../src/data.js';
import { W } from '../src/konst.js';

const R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(R.domElement);
const pmrem = new THREE.PMREMGenerator(R); const ENV = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const g = (id, kat) => GEAR_CATALOG[kat].find((x) => x.id === id);

function studio(bg) {
  const sc = new THREE.Scene(); sc.environment = ENV; sc.environmentIntensity = 0.55;
  if (bg) sc.background = new THREE.Color(bg);
  sc.add(new THREE.HemisphereLight(0xfffaf0, 0x8a8278, 1.3));
  const k = new THREE.DirectionalLight(0xffffff, 2.2); k.position.set(-3, 5, -4); sc.add(k);
  const f = new THREE.DirectionalLight(0xfff0e0, 0.9); f.position.set(4, 2, 3); sc.add(f);
  return sc;
}
// kamera ortografis yang pas memeluk objek dari arah tertentu
function foto(obj, { arah, atas = [0, 1, 0], w = 512, h = 512, pad = 0.08, bg = null, fokus = null }) {
  const sc = studio(bg); sc.add(obj); obj.updateMatrixWorld(true);
  const box = fokus || new THREE.Box3().setFromObject(obj);
  const pusat = box.getCenter(new THREE.Vector3());
  const d = new THREE.Vector3(...arah).normalize();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  cam.up.set(...atas); cam.position.copy(pusat).addScaledVector(d, 20); cam.lookAt(pusat); cam.updateMatrixWorld(true);
  const inv = cam.matrixWorldInverse; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < 8; i++) { const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(inv); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; let hw = (x1 - x0) / 2, hh = (y1 - y0) / 2;
  const asp = w / h; if (hw / hh > asp) hh = hw / asp; else hw = hh * asp; hw *= 1 + pad * 2; hh *= 1 + pad * 2;
  Object.assign(cam, { left: cx - hw, right: cx + hw, top: cy + hh, bottom: cy - hh }); cam.updateProjectionMatrix();
  R.setSize(w, h, false); R.setClearColor(0x000000, 0); R.render(sc, cam);
  sc.remove(obj); return R.domElement.toDataURL('image/png');
}
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
const kanvas = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// ---------------- PELARI ----------------
function pelari(o) {
  const P = buatPelari({ gender: o.gender, hairstyle: o.hair, hair: o.hairHex || HAIR_COLORS[1].hex, skin: o.skin || SKIN_TONES[2].hex,
    jersey: g(o.jersey, 'jersey'), bottom: g(o.bottom, 'bottom'), shoe: g(o.shoe, 'shoe'), watch: g(o.watch, 'watch'), prestige: g(o.prestige || 'none', 'prestige'), bib: '#0088' });
  P.traverse((m) => { if (m.isMesh && m.geometry.type === 'CircleGeometry' && m.material.transparent) m.visible = false; });
  return P;
}
function rambut(o) {
  const p = pelari(o); p.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(p); const t = b.max.y; // fokus kepala & bahu
  const f = new THREE.Box3(new THREE.Vector3(-0.26, t - 0.42, -0.2), new THREE.Vector3(0.26, t + 0.02, 0.2));
  return foto(p, { arah: [-0.45, 0.12, -1], w: 320, h: 320, pad: 0.02, bg: '#d9d9d9', fokus: f });
}

// ---------------- SEPATU ----------------
function profilSepatu() { // sisi samping (x = panjang, y = tinggi), ujung depan di x+
  const s = new THREE.Shape();
  s.moveTo(-0.14, 0.0); s.lineTo(0.13, 0.0); s.quadraticCurveTo(0.168, 0.002, 0.166, 0.022);
  s.quadraticCurveTo(0.158, 0.046, 0.1, 0.052); s.quadraticCurveTo(0.02, 0.062, -0.04, 0.085);
  s.quadraticCurveTo(-0.07, 0.096, -0.1, 0.092); s.quadraticCurveTo(-0.128, 0.1, -0.142, 0.085);
  s.quadraticCurveTo(-0.15, 0.04, -0.14, 0.0);
  return s;
}
function telapak(lebar = 1) { // bentuk sol dari atas (x panjang, y lebar)
  const s = new THREE.Shape(); const L = 0.05 * lebar;
  s.moveTo(-0.14, 0); s.bezierCurveTo(-0.14, -L * 0.95, -0.06, -L * 0.8, 0.0, -L * 0.85);
  s.bezierCurveTo(0.08, -L * 1.1, 0.17, -L * 1.0, 0.172, 0); s.bezierCurveTo(0.17, L * 0.9, 0.09, L * 1.05, 0.03, L * 0.82);
  s.bezierCurveTo(-0.03, L * 0.7, -0.14, L * 0.95, -0.14, 0); return s;
}
function texSol(dasar, aksen, trail) {
  return kanvas(512, 256, (x, w, h) => {
    x.fillStyle = dasar; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,.35)';
    if (trail) { for (let i = 0; i < 11; i++) for (let j = 0; j < 4; j++) { x.save(); x.translate(30 + i * 44, 40 + j * 58); x.rotate(j % 2 ? .5 : -.5); x.fillRect(-14, -9, 28, 18); x.restore(); } }
    else { for (let i = 0; i < 26; i++) { x.fillRect(16 + i * 19, 20, 7, h - 40); } x.fillStyle = aksen; x.globalAlpha = .55; x.fillRect(w * 0.42, h * 0.3, w * 0.12, h * 0.4); x.globalAlpha = 1; }
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12);
  });
}
function sepatu(s) {
  const G = new THREE.Group(); const trail = !!s.trailProof && s.id !== 'nyx_hyperfoam';
  const tebal = s.id === 'nyx_hyperfoam' ? 0.04 : s.id === 'solomate_carbon' ? 0.035 : s.id === 'shoe_starter' ? 0.022 : 0.028;
  // midsole: telapak diekstrusi ke atas
  const mid = new THREE.Mesh(new THREE.ExtrudeGeometry(telapak(1.04), { depth: tebal, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 3, curveSegments: 24 }), M(s.sole, { roughness: 0.6 }));
  mid.rotation.x = -Math.PI / 2; mid.position.y = 0.006; G.add(mid);
  // outsole dengan pola
  const out = new THREE.Mesh(new THREE.ShapeGeometry(telapak(1.0), 24), new THREE.MeshStandardMaterial({ map: texSol(trail ? '#4a4540' : '#55514c', s.color, trail), roughness: 0.9 }));
  out.rotation.x = Math.PI / 2; out.position.y = -0.001;
  const uv = out.geometry.attributes.uv; const pos = out.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 0.14) / 0.312, (pos.getY(i) + 0.055) / 0.11);
  G.add(out);
  // upper: profil samping diekstrusi selebar kaki, lalu dipersempit di ujung
  const up = new THREE.ExtrudeGeometry(profilSepatu(), { depth: 0.07, bevelEnabled: true, bevelSize: 0.016, bevelThickness: 0.016, bevelSegments: 5, curveSegments: 20 });
  up.translate(0, 0, -0.035); const p = up.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const lebar = x > 0.08 ? 1 - (x - 0.08) * 5.5 : x > -0.02 ? 0.86 + (x + 0.02) * 1.4 : 0.86 - Math.max(0, -x - 0.1) * 1.5; const k = lebar * (1 - Math.max(0, y - 0.045) * 4.5); p.setZ(i, p.getZ(i) * Math.max(0.35, k)); }
  up.computeVertexNormals();
  const mUp = new THREE.MeshStandardMaterial({ map: texUpper(s), roughness: 0.82 });
  const upper = new THREE.Mesh(up, mUp); upper.position.y = tebal + 0.004; G.add(upper);
  const uvu = up.attributes.uv; for (let i = 0; i < uvu.count; i++) uvu.setXY(i, (p.getX(i) + 0.16) / 0.35, (p.getY(i) + 0.02) / 0.13);
  // lubang kaki (kerah)
  const kr = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 10), M('#2a2624', { roughness: .95 })); kr.scale.set(1.5, 0.25, 0.9); kr.position.set(-0.1, tebal + 0.094, 0); G.add(kr);
  // tali sepatu
  for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.006, 0.05, 2, 0.003), M(s.id === 'solomate_carbon' ? '#EFECE6' : s.id === 'nyx_hyperfoam' ? '#C5A890' : '#f2efe8')); t.position.set(0.075 - i * 0.022, tebal + 0.07 + i * 0.0075, 0); t.rotation.z = 0.32; G.add(t); }
  // lidah
  const li = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.012, 0.045, 2, 0.005), M(s.color)); li.position.set(-0.04, tebal + 0.11, 0); li.rotation.z = 0.45; G.add(li);
  // tab tumit generik (bukan garis merek lain)
  const tab = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.05, 0.03, 2, 0.006), M(s.sole)); tab.position.set(-0.158, tebal + 0.085, 0); G.add(tab);
  if (s.id === 'solomate_carbon' || s.id === 'nyx_hyperfoam') { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.002), M('#1a1a1a', { metalness: .4, roughness: .3 })); for (const z of [-0.05, 0.05]) { const c = pl.clone(); c.position.set(0.03, tebal * 0.55, z); G.add(c); } }
  return G;
}
function texUpper(s) {
  return kanvas(512, 256, (x, w, h) => {
    x.fillStyle = s.color; x.fillRect(0, 0, w, h);
    // mesh berpori
    x.fillStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < w; i += 7) for (let j = 0; j < h; j += 7) if ((i + j) % 14 === 0) x.fillRect(i, j, 3, 3);
    // panel tumit & ujung kaki (overlay)
    x.fillStyle = s.sole; x.globalAlpha = .9; x.beginPath(); x.moveTo(0, h); x.lineTo(0, h * 0.25); x.quadraticCurveTo(w * 0.12, h * 0.45, w * 0.18, h); x.fill();
    x.globalAlpha = .35; x.beginPath(); x.moveTo(w * 0.82, h); x.quadraticCurveTo(w * 0.84, h * 0.55, w, h * 0.6); x.lineTo(w, h); x.fill(); x.globalAlpha = 1;
    // logo W kecil di samping (tipografi, bukan garis)
    x.fillStyle = s.id === 'solomate_carbon' ? '#C8E04A' : s.id === 'nyx_hyperfoam' ? '#B87333' : 'rgba(30,32,34,.75)';
    x.font = '900 38px Arial, sans-serif'; x.textAlign = 'center'; x.fillText('W', w * 0.46, h * 0.72);
  });
}

// ---------------- ITEM ----------------
function pisang() {
  const G = new THREE.Group(); const mK = M('#E8C547', { roughness: .55 }), mU = M('#4a3a1e');
  for (let i = 0; i < 3; i++) {
    const kurva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.09, 0.0, 0), new THREE.Vector3(0, -0.06, 0), new THREE.Vector3(0.1, 0.03, 0));
    const tb = new THREE.TubeGeometry(kurva, 30, 0.026, 12); const p = tb.attributes.position;
    const b = new THREE.Mesh(tb, mK); b.rotation.y = (i - 1) * 0.35; b.position.set(0, i * 0.012, (i - 1) * 0.02); G.add(b);
    const uj = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), mU); uj.position.set(0.1, 0.03, 0); b.add(uj);
  }
  const tg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.04, 8), M('#7a6a2e')); tg.position.set(-0.105, 0.012, 0); tg.rotation.z = 1.2; G.add(tg);
  return G;
}
function lootBox() {
  const G = new THREE.Group(); const kayu = M('#2a2522', { roughness: .6 }), cu = M('#C5A890', { metalness: .75, roughness: .3 });
  const badan = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.28, 0.34, 3, 0.03), kayu); badan.position.y = 0.14; G.add(badan);
  const tutup = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 24, 1, false, 0, Math.PI), kayu); tutup.rotation.z = Math.PI / 2; tutup.position.y = 0.28; tutup.scale.set(1, 1, 1); G.add(tutup);
  for (const x of [-0.18, 0, 0.18]) { const ba = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.29, 0.355, 2, 0.008), cu); ba.position.set(x, 0.145, 0); G.add(ba);
    const bt = new THREE.Mesh(new THREE.TorusGeometry(0.171, 0.012, 6, 24, Math.PI), cu); bt.rotation.y = Math.PI / 2; bt.position.set(x, 0.28, 0); G.add(bt); }
  const kunci = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.1, 0.03, 2, 0.01), cu); kunci.position.set(0, 0.25, 0.175); G.add(kunci);
  const emb = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.075), new THREE.MeshStandardMaterial({ transparent: true, map: kanvas(128, 128, (x) => { x.fillStyle = '#2a2522'; x.font = '900 100px Arial'; x.textAlign = 'center'; x.fillText('W', 64, 102); }) }));
  emb.position.set(0, 0.25, 0.191); G.add(emb);
  return G;
}
function handuk() {
  const G = new THREE.Group();
  const t = kanvas(512, 64, (x, w, h) => { x.fillStyle = '#DFD8C8'; x.fillRect(0, 0, w, h); x.fillStyle = '#A46358'; for (let i = 0; i < w; i += 64) x.fillRect(i, 0, 26, h); x.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < w; i += 3) x.fillRect(i, 0, 1, h); });
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: .95, side: THREE.DoubleSide });
  const kurva = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.13, -0.32, 0.06), new THREE.Vector3(-0.13, -0.05, 0.03), new THREE.Vector3(-0.1, 0.06, -0.05), new THREE.Vector3(0, 0.09, -0.11), new THREE.Vector3(0.1, 0.06, -0.05), new THREE.Vector3(0.13, -0.05, 0.03), new THREE.Vector3(0.13, -0.32, 0.06)]);
  const pita = new THREE.Shape(); pita.moveTo(-0.006, -0.05); pita.lineTo(0.006, -0.05); pita.lineTo(0.006, 0.05); pita.lineTo(-0.006, 0.05); pita.lineTo(-0.006, -0.05);
  const tb = new THREE.ExtrudeGeometry(pita, { steps: 120, extrudePath: kurva, bevelEnabled: false });
  const pp = tb.attributes.position; const uv2 = new Float32Array(pp.count * 2); for (let i = 0; i < pp.count; i++) { uv2[i * 2] = (pp.getY(i) + 0.35) * 2.5; uv2[i * 2 + 1] = pp.getX(i) * 4; } tb.setAttribute('uv', new THREE.BufferAttribute(uv2, 2));
  const mesh = new THREE.Mesh(tb, m); G.add(mesh);
  const pin = (x) => { const e = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.012, 0.075, 2, 0.004), M('#DFD8C8')); e.position.set(x, -0.33, 0.06); G.add(e); };
  pin(-0.13); pin(0.13);
  return G;
}
function ransel() {
  const G = new THREE.Group(); const kain = M('#A46358', { roughness: .85 }), gelap = M('#1E2022');
  const b = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.42, 0.14, 4, 0.06), kain); b.position.y = 0.21; G.add(b);
  const k = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.16, 0.05, 3, 0.03), M('#8a4f46')); k.position.set(0, 0.13, 0.075); G.add(k);
  const z = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.008, 0.01), gelap); z.position.set(0, 0.215, 0.098); G.add(z);
  for (const x of [-0.08, 0.08]) { const t = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.4, 0.02, 2, 0.008), gelap); t.position.set(x, 0.21, -0.08); G.add(t); }
  const pt = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.035), new THREE.MeshStandardMaterial({ transparent: true, map: kanvas(256, 90, (x) => { x.fillStyle = '#EFECE6'; x.font = '900 60px Arial'; x.textAlign = 'center'; x.fillText('WILLO', 128, 68); }) }));
  pt.position.set(0, 0.33, 0.071); G.add(pt);
  const tali = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 16), gelap); tali.position.set(0, 0.43, 0); G.add(tali);
  return G;
}
function jam(strap, nama) {
  const G = new THREE.Group();
  const layar = kanvas(512, 512, (x, w) => {
    x.fillStyle = '#0d0e10'; x.beginPath(); x.arc(256, 256, 256, 0, 7); x.fill();
    x.strokeStyle = '#4fbf6a'; x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 236, -1.4, 4.2); x.stroke();
    x.fillStyle = '#f2efe8'; x.textAlign = 'center'; x.font = '700 120px Arial'; x.fillText('10:08', 256, 230);
    x.font = '500 40px Arial'; x.fillStyle = '#bdb6aa'; x.fillText('Kamis, 17 Agu', 256, 290);
    x.fillStyle = '#C46A4E'; x.font = '70px Arial'; x.fillText('🏃', 256, 375);
    x.fillStyle = '#f2efe8'; x.font = '600 42px Arial'; x.fillText('8420', 256, 440);
  });
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.024, 0.012, 48), M('#3a3a3c', { metalness: .8, roughness: .35 })); bezel.rotation.x = Math.PI / 2; G.add(bezel);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.0195, 48), new THREE.MeshStandardMaterial({ map: layar, roughness: .2, emissive: 0xffffff, emissiveMap: layar, emissiveIntensity: .5 })); face.position.z = 0.0061; G.add(face);
  const mS = M(strap, { roughness: .7 });
  for (const s of [-1, 1]) { const t = new THREE.Mesh(new RoundedBoxGeometry(0.022, 0.06, 0.005, 2, 0.002), mS); t.position.set(0, s * 0.048, -0.002); G.add(t); for (let i = 0; i < 3; i++) if (s < 0) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.006, 6), M('#000')); h.rotation.x = Math.PI / 2; h.position.set(0, -0.045 - i * 0.008, 0.0005); G.add(h); } }
  const tom = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.004, 10), M('#555', { metalness: .8 })); tom.rotation.z = Math.PI / 2; tom.position.set(0.025, 0.006, 0); G.add(tom);
  return G;
}

// ---------------- DAFTAR SHOT ----------------
const sudut = { samping: { arah: [0, 0.02, 1] }, atas: { arah: [0, 1, 0.0001], atas: [0, 0, -1] }, sol: { arah: [0, -1, 0.0001], atas: [0, 0, 1] } };
const turn = { depan: [0, 0.05, -1], belakang: [0, 0.05, 1], samping: [1, 0.03, 0], atas: [0.0001, 1, 0], bawah: [0.0001, -1, 0] };
const PRIA = { gender: 'male', hair: 'taper_headband', jersey: 'singlet_onyx', bottom: 'split_onyx', shoe: 'solomate_carbon', watch: 'willo_sport', skin: SKIN_TONES[3].hex, hairHex: HAIR_COLORS[0].hex };
const WANITA = { gender: 'female', hair: 'ponytail_visor', jersey: 'aero_sage', bottom: 'skort_pleated_onyx', shoe: 'nyx_hyperfoam', watch: 'coro_pro', prestige: 'waist_bag', skin: SKIN_TONES[1].hex, hairHex: HAIR_COLORS[1].hex };
function buatDaftar() {
  const L = [];
  for (const [id, gender] of [['buzz', 'male'], ['curly', 'male'], ['manbun', 'male'], ['ponytail_visor', 'female'], ['boxer_braids', 'female']]) L.push(['rambut_' + id, () => rambut({ ...(gender === 'male' ? PRIA : WANITA), hair: id, jersey: 'jersey_basic', prestige: 'none' })]);
  for (const [n, o] of [['pria', PRIA], ['wanita', WANITA]]) for (const [s, a] of Object.entries(turn)) L.push([`turnaround_${n}_${s}`, () => foto(pelari(o), { arah: a, atas: s === 'atas' || s === 'bawah' ? [0, 0, -1] : [0, 1, 0], w: 360, h: s === 'atas' || s === 'bawah' ? 360 : 640, pad: 0.04 })]);
  for (const s of GEAR_CATALOG.shoe) for (const [n, o] of Object.entries(sudut)) L.push([`${s.id}_${n}`, () => foto(sepatu(s), { ...o, w: 512, h: n === 'samping' ? 300 : 256, pad: 0.05 })]);
  L.push(['item_pisang', () => foto(pisang(), { arah: [0.2, 0.3, 1], w: 256, h: 256, pad: 0.1 })]);
  L.push(['item_lootbox', () => foto(lootBox(), { arah: [0.6, 0.5, 1], w: 256, h: 256, pad: 0.08 })]);
  L.push(['handuk_leher', () => foto(handuk(), { arah: [0.35, 0.45, 1], w: 256, h: 256, pad: 0.08 })]);
  L.push(['ransel_lari', () => foto(ransel(), { arah: [0.55, 0.25, 1], w: 256, h: 256, pad: 0.08 })]);
  for (const [n, c] of [['onyx', '#1E2022'], ['bone', '#E9E4DA'], ['clay', '#A46358'], ['olive', '#4A5844']]) L.push([`jam_strap_${n}`, () => foto(jam(c, n), { arah: [0.15, 0.1, 1], w: 220, h: 340, pad: 0.06 })]);
  return L;
}
const PETA = new Map();
window.daftarSiap = () => { PETA.clear(); const L = buatDaftar(); L.forEach(([n, f]) => PETA.set(n, f)); return L.map((x) => x[0]); };
window.ambil = (nama) => PETA.get(nama)();

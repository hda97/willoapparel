// MUSIM TIAP DUSUN (Huda 14 Nov 2026: "Saya mau ada 5 musim yang berbeda di setiap dusun").
// Tiap dusun punya musim tetapnya sendiri, jadi main ke dusun lain = pindah suasana:
//   Wetan = Musim Hujan (sawah hijau segar, gerimis), Kulon = Musim Semi (bunga sakura di bukit teh),
//   Curug = Musim Salju (lereng gunung bersalju), Tlaga = Musim Gugur (daun oranye di tepi danau),
//   Segara = Musim Panas (pantai cerah, langit biru tua).
// Cara kerja (ringan untuk HP): warna alam (rumput, daun, sawah) diubah SEKALI sebelum dunia dipanggang (bakeGroup),
// jadi tidak menambah draw call. Partikel cuaca = 1 objek (1 draw call), jumlahnya dikurangi di mode hemat.
// Rumah warga (dinding/atap pilihan warga), fasum, avatar & kendaraan TIDAK ikut diubah warnanya.
import * as THREE from 'three';

export const MUSIM = {
  wetan:  {id: 'hujan',  nama: 'Musim Hujan', ik: '🌧️', langit: 0xa9c4d8, malam: 0x161f33, cahaya: .82, kabut: .85, partikel: 'hujan'},
  kulon:  {id: 'semi',   nama: 'Musim Semi',  ik: '🌸', langit: 0xd4e6ff, malam: 0x221c40, cahaya: 1,   kabut: 1,   partikel: 'kelopak'},
  curug:  {id: 'salju',  nama: 'Musim Salju', ik: '❄️', langit: 0xd6e2ee, malam: 0x1b2440, cahaya: .95, kabut: .8,  partikel: 'salju'},
  tlaga:  {id: 'gugur',  nama: 'Musim Gugur', ik: '🍂', langit: 0xf3dcc0, malam: 0x241a30, cahaya: .95, kabut: .95, partikel: 'daun'},
  segara: {id: 'panas',  nama: 'Musim Panas', ik: '☀️', langit: 0x8cc8f5, malam: 0x14224a, cahaya: 1.12, kabut: 1.1, partikel: null},
};
// ?musim=salju (pratinjau) memaksa musim tertentu di dusun mana pun
export function musimDusun(di) {
  const u = new URLSearchParams(location.search).get('musim');
  const paksa = u && Object.values(MUSIM).find(m => m.id === u);
  return paksa || MUSIM[di] || null;
}

// ---------- warna ----------
const HSL = {h: 0, s: 0, l: 0}, SRGB = THREE.SRGBColorSpace;
// pilihan acak tapi tetap: warna asli yang sama selalu jadi warna musim yang sama (vertex satu kotak tidak belang)
const acak = c => { const x = Math.sin(c.r * 127.1 + c.g * 311.7 + c.b * 74.7) * 43758.5453; return x - Math.floor(x); };
const hijau = () => HSL.h > .16 && HSL.h < .47 && HSL.s > .16 && HSL.l > .06 && HSL.l < .82;
// datar = hamparan tanah/rumput (lantai besar, halaman): tidak dijadikan bunga/daun, cukup warna tanah musim itu
function ubahWarna(id, c, datar) {
  c.getHSL(HSL, SRGB); if (!hijau()) return false;
  const {h, s, l} = HSL, k = acak(c);
  if (datar && id === 'semi') c.setHSL(h - .01, Math.min(1, s * 1.1), Math.min(.7, l * 1.08 + .03), SRGB);
  else if (datar && id === 'gugur') c.setHSL(.1 + (k - .5) * .03, .5, Math.min(.62, .44 + (l - .32) * .5), SRGB);
  else if (id === 'hujan') c.setHSL(h + .01, Math.min(1, s * 1.08), l * .9, SRGB);
  else if (id === 'panas') c.setHSL(h - .025, Math.min(1, s * 1.12), Math.min(.75, l * 1.1 + .02), SRGB);
  else if (id === 'semi') {
    if (k < .38) c.setHSL(.93 + k * .1, .62, Math.min(.86, .68 + l * .35), SRGB);           // sakura merah muda
    else if (k < .43) c.setHSL(.13, .8, .7, SRGB);                                          // bunga kuning
    else c.setHSL(h - .01, Math.min(1, s * 1.1), Math.min(.7, l * 1.08 + .03), SRGB);     // hijau muda
  } else if (id === 'salju') {
    if (k < .82) c.setHSL(.58, .22, Math.min(.96, .8 + (l - .2) * .55), SRGB);             // tertutup salju
    else c.setHSL(.4, s * .35, l * .85, SRGB);                                              // daun cemara yang masih terlihat
  } else if (id === 'gugur') {
    const P = [[.075, .82, .5], [.02, .7, .44], [.12, .82, .54], [.055, .75, .4], [.16, .5, .45]];
    const p = P[Math.floor(k * P.length)]; c.setHSL(p[0], p[1], Math.min(.7, p[2] + (l - .32) * .6), SRGB);
  } else return false;
  return true;
}
// ubah warna alam satu kelompok (dipanggil SEBELUM pecahInstanced/bakeGroup). Lewati anak dengan userData.tanpaMusim.
export function musimkan(root, M) {
  if (!M || !root) return;
  const klon = new Map(), C = new THREE.Color();
  const lewati = o => { for (let p = o; p && p !== root.parent; p = p.parent) if (p.userData && p.userData.tanpaMusim) return true; return false; };
  const B = new THREE.Box3(), U = new THREE.Vector3(), M4 = new THREE.Matrix4(), P = new THREE.Vector3(), Q = new THREE.Quaternion();
  const pipih = (x, y, z) => y < .3 * Math.max(x, z) && Math.max(x, z) > 4;
  root.updateMatrixWorld(true);
  root.traverse(m => {
    if (!m.isMesh || m.userData.musim || lewati(m)) return;
    m.userData.musim = 1;
    const mt = m.material; if (Array.isArray(mt) || !mt || !mt.color) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    if (m.isInstancedMesh && m.instanceColor) {
      m.geometry.boundingBox.getSize(P);
      for (let i = 0; i < m.count; i++) { m.getColorAt(i, C); m.getMatrixAt(i, M4); M4.decompose(new THREE.Vector3(), Q, U); U.multiply(P);
        if (ubahWarna(M.id, C, pipih(U.x, U.y, U.z))) m.setColorAt(i, C); }
      m.instanceColor.needsUpdate = true;
      return;
    }
    B.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); B.getSize(U); const datar = pipih(U.x, U.y, U.z);
    if (mt.vertexColors && m.geometry.attributes.color) {
      const a = m.geometry.attributes.color;
      for (let i = 0; i < a.count; i++) { C.setRGB(a.getX(i), a.getY(i), a.getZ(i)); if (ubahWarna(M.id, C, datar)) a.setXYZ(i, C.r, C.g, C.b); }
      a.needsUpdate = true;
    }
    C.copy(mt.color);
    if (!mt.map && ubahWarna(M.id, C, datar)) {
      const kk = mt.uuid + (datar ? 'd' : '');
      if (!klon.has(kk)) { const b = mt.clone(); b.color.copy(C); klon.set(kk, b); }
      m.material = klon.get(kk);
    }
  });
}

// ---------- partikel cuaca (1 draw call, ikut pemain) ----------
function tekstur(jenis) {
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  if (jenis === 'salju') { const g = x.createRadialGradient(16, 16, 0, 16, 16, 15); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); }
  else if (jenis === 'kelopak') { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(16, 16, 13, 8, .6, 0, 7); x.fill(); }
  else { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(16, 2); x.quadraticCurveTo(30, 16, 16, 30); x.quadraticCurveTo(2, 16, 16, 2); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = SRGB; return t;
}
export function buatCuaca(sc, M, hemat) {
  if (!M || !M.partikel) return null;
  const jenis = M.partikel, R = 110, TINGGI = 70;
  const N = jenis === 'hujan' ? (hemat ? 420 : 800) : jenis === 'salju' ? (hemat ? 380 : 700) : (hemat ? 160 : 280);
  const pos = new Float32Array(N * (jenis === 'hujan' ? 6 : 3)), v = new Float32Array(N * 3), fase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = (Math.random() * 2 - 1) * R, y = Math.random() * TINGGI, z = (Math.random() * 2 - 1) * R;
    if (jenis === 'hujan') { pos.set([x, y, z, x - .5, y + 4.5, z], i * 6); v.set([0, -95 - Math.random() * 30, 0], i * 3); }
    else { pos.set([x, y, z], i * 3); v.set([0, jenis === 'salju' ? -(5 + Math.random() * 5) : -(4 + Math.random() * 3), 0], i * 3); }
    fase[i] = Math.random() * 6.28;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  let obj;
  if (jenis === 'hujan') obj = new THREE.LineSegments(g, new THREE.LineBasicMaterial({color: 0xcfe0f0, transparent: true, opacity: .45, depthWrite: false}));
  else {
    if (jenis !== 'salju') {   // kelopak sakura / daun gugur: tiap partikel beda warna
      const col = new Float32Array(N * 3), cc = new THREE.Color(), P = jenis === 'kelopak' ? [0xffc3d8, 0xffa8c8, 0xfff0f5, 0xff8fb8] : [0xe8742a, 0xd2462a, 0xf2b234, 0xb8562a];
      for (let i = 0; i < N; i++) { cc.setHex(P[i % P.length]); col.set([cc.r, cc.g, cc.b], i * 3); }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    obj = new THREE.Points(g, new THREE.PointsMaterial({size: jenis === 'salju' ? 1.9 : 3.2, map: tekstur(jenis), transparent: true, alphaTest: .25, depthWrite: false, vertexColors: jenis !== 'salju', color: 0xffffff, sizeAttenuation: true}));
  }
  obj.frustumCulled = false; obj.renderOrder = 5; obj.userData.jangan = true; sc.add(obj);
  let px = 0, pz = 0, t = 0;
  const per = jenis === 'hujan' ? 6 : 3;
  return {
    obj,
    // dipanggil tiap frame: x,y,z = posisi pemain (partikel yang keluar kotak dipindah ke sisi seberang)
    update(dt, x, y, z) {
      t += dt; obj.position.set(0, 0, 0);
      const a = g.attributes.position.array;
      for (let i = 0; i < N; i++) {
        const o = i * per; let dx = v[i * 3 + 1] * dt;
        let sx = 0, sz = 0;
        if (jenis !== 'hujan') { sx = Math.sin(t * 1.3 + fase[i]) * (jenis === 'salju' ? 1.2 : 3.2) * dt + (jenis === 'salju' ? 0 : 2.2 * dt); sz = Math.cos(t * .9 + fase[i]) * (jenis === 'salju' ? 1 : 2) * dt; }
        a[o] += sx; a[o + 1] += dx; a[o + 2] += sz;
        // bungkus ke kotak di sekitar pemain
        let ox = 0, oz = 0, oy = 0;
        if (a[o] - x > R) ox = -2 * R; else if (a[o] - x < -R) ox = 2 * R;
        if (a[o + 2] - z > R) oz = -2 * R; else if (a[o + 2] - z < -R) oz = 2 * R;
        if (a[o + 1] < y - 4) oy = TINGGI;
        if (ox || oz || oy) { a[o] += ox; a[o + 1] += oy; a[o + 2] += oz; if (per === 6) { a[o + 3] += ox; a[o + 4] += oy; a[o + 5] += oz; } }
        if (per === 6) { a[o + 3] = a[o] - .5; a[o + 4] = a[o + 1] + 4.5; a[o + 5] = a[o + 2]; }
      }
      // pindah dusun/teleport jauh: sebar ulang di sekitar pemain
      if (Math.abs(x - px) > R || Math.abs(z - pz) > R) for (let i = 0; i < N; i++) { const o = i * per, nx = x + (Math.random() * 2 - 1) * R, nz = z + (Math.random() * 2 - 1) * R, ny = y + Math.random() * TINGGI; a[o] = nx; a[o + 1] = ny; a[o + 2] = nz; if (per === 6) { a[o + 3] = nx - .5; a[o + 4] = ny + 4.5; a[o + 5] = nz; } }
      px = x; pz = z;
      g.attributes.position.needsUpdate = true;
    },
  };
}

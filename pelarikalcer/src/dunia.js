// Dunia 3D per map (6 rute Master Bundle): permukaan jalan, elevasi, lingkungan, landmark, gerbang, area expo lobi.
import * as THREE from 'three';
import { kanvasTex, bintik, mulberry, sprite, texAset, saatRasio } from './util.js';
import { JARAK_FINISH, AWAL_DUNIA, PANJANG_DUNIA, WS_JENDELA, W } from './konst.js';
import { EXPO_BOOTHS } from './data.js';

// ---------------- tekstur permukaan (dibuat sekali, dibagi) ----------------
const TEX = {};
function tex(nama) {
  if (TEX[nama]) return TEX[nama];
  const r = mulberry(nama.length * 97 + 13);
  const isi = (dasar, titik, n = 3000, uk = 2) => (g, w, h) => { g.fillStyle = dasar; g.fillRect(0, 0, w, h); bintik(g, w, h, n, titik, uk, r); };
  const pola = {
    aspal: (g, w, h) => {
      isi('#3d4044', ['#36393d', '#46494d', '#313336', '#4d5054'], 5000)(g, w, h);
      g.fillStyle = '#e4e0d6'; g.fillRect(w * 0.025, 0, 5, h); g.fillRect(w * 0.975 - 5, 0, 5, h);
      for (const u of [0.347, 0.653]) g.fillRect(w * u - 3, h * 0.08, 6, h * 0.42);
    },
    paving: (g, w, h) => {
      g.fillStyle = '#8f877c'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? -8 : 0; x < w; x += 32) { g.fillStyle = ['#9b9286', '#a39a8d', '#958c80'][Math.floor(r() * 3)]; g.fillRect(x + 1, y + 1, 30, 14); }
      g.fillStyle = '#d8d1c3'; g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
    },
    pasirJalan: (g, w, h) => { isi('#cbbfa8', ['#c2b59d', '#d6cbb5', '#bcae95'], 4000)(g, w, h); g.fillStyle = '#e9e2d3'; g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h); },
    tanahMerah: (g, w, h) => { isi('#7a4b36', ['#6c4130', '#86563f', '#5e392a', '#9a6a4f'], 5000, 3)(g, w, h); bintik(g, w, h, 140, ['#b8ac99', '#8a8d91'], 5, r); },
    pasirVulkanik: (g, w, h) => isi('#4a4846', ['#403e3c', '#575451', '#3a3836', '#5f5b57'], 6000, 2)(g, w, h),
    kerikil: (g, w, h) => { isi('#7d7a74', ['#6f6c66', '#8b8881', '#9a968e', '#5f5c57'], 6000, 3)(g, w, h); },
    trotoar: (g, w, h) => {
      g.fillStyle = '#b4ab9e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9c9386'; g.lineWidth = 2;
      for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < w + 32; x += 32) g.strokeRect(x, y, 32, 32);
    },
    rumput: (g, w, h) => isi('#667f4f', ['#718b59', '#5b7346', '#7a925f'], 2400)(g, w, h),
    rumputGelap: (g, w, h) => isi('#4d5f40', ['#56693f', '#44553a', '#5d7048'], 2400)(g, w, h),
    sawah: (g, w, h) => { g.fillStyle = '#7d9460'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { g.fillStyle = x % 16 ? '#8aa06a' : '#6c8452'; g.fillRect(x, 0, 4, h); } g.fillStyle = '#9a8a6a'; g.fillRect(0, h / 2, w, 3); },
    teh: (g, w, h) => { g.fillStyle = '#3f5236'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 12) { g.fillStyle = '#5a7048'; g.fillRect(0, y, w, 8); } bintik(g, w, h, 900, ['#6b8457', '#4e6440'], 2, r); },
    sabana: (g, w, h) => isi('#a59a63', ['#b2a66d', '#958b58', '#8a8f5a', '#bdb07a'], 3000, 3)(g, w, h),
    pasirPantai: (g, w, h) => isi('#d9cdb4', ['#e3d8c0', '#cfc2a7', '#c8b99c'], 3000)(g, w, h),
    laut: (g, w, h) => { g.fillStyle = '#4f7f86'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(232,226,213,.35)'; g.fillRect(r() * w, r() * h, 10 + r() * 16, 2); } },
  }[nama];
  TEX[nama] = kanvasTex(256, 256, pola, true);
  return TEX[nama];
}
const texLubang = kanvasTex(128, 128, (g, w, h) => {
  g.translate(w / 2, h / 2); g.beginPath();
  for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2; const r = 50 + Math.sin(i * 2.3) * 8; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8); }
  g.closePath(); g.fillStyle = '#1b1c1e'; g.fill(); g.strokeStyle = '#5c5a55'; g.lineWidth = 5; g.stroke();
  g.fillStyle = '#0d0d0e'; g.beginPath(); g.ellipse(0, 4, 30, 20, 0, 0, Math.PI * 2); g.fill();
});
export { texLubang };
function texGedung(tint, r) {
  return kanvasTex(128, 256, (g, w, h) => {
    g.fillStyle = tint; g.fillRect(0, 0, w, h);
    for (let y = 6; y < h - 4; y += 12) for (let x = 6; x < w - 4; x += 14) { g.fillStyle = r() < 0.15 ? '#e9dcc0' : (r() < 0.5 ? '#8e9ea8' : '#6f7f8a'); g.fillRect(x, y, 9, 8); }
  }, true);
}
export function texSpanduk(teks, bg, fg, sub) {
  const gambar = (g, w, h) => {
    g.fillStyle = bg === 'kotak' ? '#fff' : bg; g.fillRect(0, 0, w, h);
    if (bg === 'kotak') { for (let x = 0; x < w; x += 40) for (let y = 0; y < h; y += 40) { g.fillStyle = ((x + y) / 40) % 2 ? W.onyx : W.krem; g.fillRect(x, y, 40, 40); } g.fillStyle = 'rgba(30,32,34,.85)'; g.fillRect(140, 20, w - 280, h - 40); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `italic 800 ${sub ? 84 : 100}px "Barlow Condensed", Arial Narrow, sans-serif`; g.fillText(teks, w / 2, sub ? 64 : h / 2 + 4);
    if (sub) { g.font = '600 32px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText(sub, w / 2, 128); }
  };
  const t = kanvasTex(1024, 160, gambar);
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => { gambar(t.image.getContext('2d'), 1024, 160); t.needsUpdate = true; });
  return t;
}
function texLangit(atas, bawah) {
  return kanvasTex(4, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, atas); gr.addColorStop(0.7, bawah); gr.addColorStop(1, bawah); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); });
}
const texDaunKelapa = kanvasTex(128, 128, (g, w, h) => {
  g.translate(w / 2, h / 2); g.strokeStyle = '#5d7146'; g.lineCap = 'round';
  for (let i = 0; i < 9; i++) { g.save(); g.rotate(i / 9 * Math.PI * 2); g.lineWidth = 7; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(26, -10, 58, 14); g.stroke(); g.restore(); }
});
const texAsap = kanvasTex(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(220,214,204,.85)'); gr.addColorStop(1, 'rgba(220,214,204,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
});

// ---------------- pembangun dunia ----------------
export function bangunDunia(scene, m) {
  const grup = new THREE.Group(); scene.add(grup);
  const trail = m.category === 'trail';
  const amp = trail ? Math.min(55, 18 + m.gain / 50) : Math.min(m.gain, 40);
  const tinggi = trail
    ? (d) => { const t = Math.max(0, Math.min(d, JARAK_FINISH)) / JARAK_FINISH; return amp * t + Math.sin(t * Math.PI * 6) * 1.6; }
    : (d) => (d <= 0 || d >= JARAK_FINISH ? 0 : amp * Math.sin(Math.PI * d / JARAK_FINISH) ** 2);
  const elevasiNaik = (d) => {
    const t = Math.max(0, Math.min(d, JARAK_FINISH)) / JARAK_FINISH;
    return trail ? m.gain * t : (t <= 0.5 ? m.gain * Math.sin(Math.PI * t) ** 2 : m.gain);
  };
  const acak = mulberry(m.id.length * 131 + 7);
  const jauh = []; // objek yang ikut pemain (landmark & gunung di kejauhan)
  const milik = []; // material/tekstur milik dunia ini (dibuang saat ganti map)

  const taruh = (obj, x, d, y = 0) => { obj.position.set(x, tinggi(d) + y, -d); grup.add(obj); return obj; };
  function strip(x, lebar, yOff, namaTex, ux, uy, warna) {
    const seg = 200; const g = new THREE.PlaneGeometry(lebar, PANJANG_DUNIA, 1, seg); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const z = pos.getZ(i) - PANJANG_DUNIA / 2 - AWAL_DUNIA; pos.setZ(i, z); pos.setY(i, tinggi(-z) + yOff); pos.setX(i, pos.getX(i) + x); }
    g.computeVertexNormals();
    const t = tex(namaTex).clone(); t.needsUpdate = true; t.repeat.set(ux, uy); milik.push(t);
    const mt = new THREE.MeshLambertMaterial({ map: t, color: warna || 0xffffff }); milik.push(mt);
    const ms = new THREE.Mesh(g, mt); grup.add(ms); return ms;
  }
  const lam = (c) => { const mt = new THREE.MeshLambertMaterial({ color: c }); milik.push(mt); return mt; };
  const gunung = (x, dist, r, t, warna, seg = 7) => {
    const mt = new THREE.MeshBasicMaterial({ color: warna, fog: false }); milik.push(mt);
    const o = new THREE.Mesh(new THREE.ConeGeometry(r, t, seg), mt); o.position.y = t / 2 - 4; grup.add(o); jauh.push({ obj: o, x, dist, y: t / 2 - 6 }); return o;
  };
  const kabutWarna = (hex, k = 0.45) => new THREE.Color(hex).lerp(new THREE.Color(m.sky[1]), k);

  // ---------- permukaan per map ----------
  const permukaan = {
    jakarta: ['aspal', 'trotoar', 'rumput'], jogja: ['aspal', 'paving', 'sawah'], bali: ['pasirJalan', 'pasirPantai', 'rumput'],
    lawu: ['tanahMerah', 'rumputGelap', 'teh'], bromo: ['pasirVulkanik', 'pasirVulkanik', 'pasirVulkanik'], dieng_rinjani: ['kerikil', 'sabana', 'sabana'],
  }[m.id] || ['aspal', 'trotoar', 'rumput'];
  strip(0, 7.2, 0, permukaan[0], 1, PANJANG_DUNIA / 8);
  if (m.id === 'bali') {
    strip(-4.9, 2.6, 0.02, 'pasirPantai', 2, PANJANG_DUNIA / 3);
    strip(-22, 32, -0.05, 'pasirPantai', 8, PANJANG_DUNIA / 6);
    const laut = strip(-118, 160, -0.6, 'laut', 20, PANJANG_DUNIA / 10); laut.userData.laut = true;
    strip(4.9, 2.6, 0.06, 'trotoar', 2, PANJANG_DUNIA / 2.6);
    strip(36, 60, 0.02, 'rumput', 12, PANJANG_DUNIA / 5);
  } else {
    const yT = m.id === 'jakarta' || m.id === 'jogja' ? 0.14 : 0.02;
    strip(-4.9, 2.6, yT, permukaan[1], 2, PANJANG_DUNIA / 2.6, m.id === 'bromo' ? 0xd0ccc6 : null);
    strip(4.9, 2.6, yT, permukaan[1], 2, PANJANG_DUNIA / 2.6, m.id === 'bromo' ? 0xd0ccc6 : null);
    strip(-36, 60, 0.0, permukaan[2], 12, PANJANG_DUNIA / 5, m.id === 'bromo' ? 0xb9b4ad : null);
    strip(36, 60, 0.0, permukaan[2], 12, PANJANG_DUNIA / 5, m.id === 'bromo' ? 0xb9b4ad : null);
  }
  const AKHIR = AWAL_DUNIA + PANJANG_DUNIA;

  // ---------- lingkungan ----------
  if (m.id === 'jakarta') {
    const tints = ['#7d8a93', '#a39d92', '#c2b8a6', '#69767f', '#8e969b', '#b2a999'].map((c) => texGedung(c, acak));
    milik.push(...tints);
    for (const sx of [-1, 1]) {
      let d = AWAL_DUNIA;
      while (d < AKHIR + 120) {
        const lb = 14 + acak() * 14, tg = 22 + acak() * 70, dl = 14 + acak() * 10;
        const t = tints[Math.floor(acak() * tints.length)].clone(); t.needsUpdate = true; t.repeat.set(Math.round(lb / 6), Math.round(tg / 12)); milik.push(t);
        const mt = new THREE.MeshLambertMaterial({ map: t }); milik.push(mt);
        taruh(new THREE.Mesh(new THREE.BoxGeometry(dl, tg, lb), mt), sx * (20 + dl / 2 + acak() * 8), d + lb / 2, tg / 2 - 0.5);
        d += lb + 4 + acak() * 10;
      }
    }
    for (let d = AWAL_DUNIA + 4; d < AKHIR; d += 13) for (const sx of [-1, 1]) taruh(sprite('pohon', 5.2 + acak() * 1.5), sx * (8 + acak() * 3), d + acak() * 4);
    for (let d = AWAL_DUNIA + 10; d < AKHIR; d += 30) for (const sx of [-1, 1]) taruh(sprite('lampu', 5.4), sx * 4.6, d);
    for (let d = 60; d < JARAK_FINISH; d += 140 + acak() * 60) taruh(sprite('angkot', 2.3), (acak() < 0.5 ? -1 : 1) * 7.4, d);
    for (let d = 90; d < JARAK_FINISH; d += 120 + acak() * 70) taruh(sprite('gerobak', 2.1), (acak() < 0.5 ? -1 : 1) * 5.5, d);
    for (let d = 40; d < JARAK_FINISH; d += 80 + acak() * 40) taruh(sprite('bangku', 0.95), (acak() < 0.5 ? -1 : 1) * 5.6, d);
    for (let d = 120; d < JARAK_FINISH; d += 160 + acak() * 50) taruh(sprite('sepeda', 1.1), (acak() < 0.5 ? -1 : 1) * 6.3, d);
    for (const d of [150, 420, 780]) taruh(sprite('rambu', 3.6), 4.5, d);
    const mon = sprite('monas', 150, { fog: false, warna: kabutWarna('#ffffff', 0.2) }); grup.add(mon); jauh.push({ obj: mon, x: -6, dist: 420, y: -2 });
  } else if (m.id === 'jogja') {
    for (let d = AWAL_DUNIA + 6; d < AKHIR; d += 18) for (const sx of [-1, 1]) if (acak() < 0.8) taruh(sprite('pohon', 6 + acak() * 2.5), sx * (8.5 + acak() * 5), d + acak() * 6);
    for (let d = 20; d < AKHIR; d += 42 + acak() * 25) taruh(sprite('joglo', 5.5 + acak() * 1.5), (acak() < 0.5 ? -1 : 1) * (15 + acak() * 6), d);
    for (let d = 70; d < JARAK_FINISH; d += 130 + acak() * 60) taruh(sprite('gerobak', 2.1), (acak() < 0.5 ? -1 : 1) * 5.4, d);
    for (let d = 110; d < JARAK_FINISH; d += 170 + acak() * 60) taruh(sprite('sepeda', 1.1), (acak() < 0.5 ? -1 : 1) * 6.2, d);
    gunung(-180, 380, 140, 120, kabutWarna('#5f6f74', 0.35)); gunung(150, 400, 120, 95, kabutWarna('#66767a', 0.4)); gunung(320, 420, 110, 80, kabutWarna('#6e7c7f', 0.45));
    const bor = sprite('borobudur', 46, { fog: false, warna: kabutWarna('#ffffff', 0.15) }); grup.add(bor); jauh.push({ obj: bor, x: 60, dist: 300, y: -1 });
  } else if (m.id === 'bali') {
    const mBatang = lam('#7a6450'); const gBatang = new THREE.CylinderGeometry(0.16, 0.24, 7, 6);
    const mDaun = new THREE.MeshLambertMaterial({ map: texDaunKelapa, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }); milik.push(mDaun);
    const gDaun = new THREE.PlaneGeometry(5, 5); gDaun.rotateX(-Math.PI / 2);
    for (let d = AWAL_DUNIA; d < AKHIR; d += 16) for (const sx of [-1, 1]) {
      if (acak() < 0.3) continue;
      const g = new THREE.Group(); const b = new THREE.Mesh(gBatang, mBatang); b.position.y = 3.5; b.rotation.z = (acak() - 0.5) * 0.25; g.add(b);
      const dn = new THREE.Mesh(gDaun, mDaun); dn.position.y = 7; dn.rotation.y = acak() * 3; g.add(dn);
      taruh(g, sx * (sx < 0 ? 7 + acak() * 9 : 7 + acak() * 14), d + acak() * 6);
    }
    const mPerahu = lam('#e2d8c4'), mCadik = lam('#3b2f2a');
    for (let i = 0; i < 9; i++) {
      const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 6), mPerahu));
      for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5, 6), mCadik); c.rotation.x = Math.PI / 2; c.position.set(sx * 2.2, 0, 0); g.add(c); }
      taruh(g, -42 - acak() * 40, 40 + i * 120 + acak() * 50, -0.3);
    }
    for (const d of [150, 420, 760]) taruh(sprite('baligate', 9.5), 0, d);
    for (let d = 30; d < JARAK_FINISH; d += 160 + acak() * 50) taruh(sprite('bangku', 0.95), 5.6, d);
    gunung(220, 420, 170, 140, kabutWarna('#5c6e74', 0.35), 9);
  } else {
    // ---------- trail: pinus instanced, penanda pita Willo, gunung ----------
    const nPinus = m.id === 'lawu' ? 520 : m.id === 'dieng_rinjani' ? 160 : 0;
    if (nPinus) {
      const gB = new THREE.CylinderGeometry(0.14, 0.2, 2.2, 5); gB.translate(0, 1.1, 0);
      const gD = new THREE.ConeGeometry(1.5, 5.5, 7); gD.translate(0, 4.6, 0);
      const iB = new THREE.InstancedMesh(gB, lam('#4a3a2e'), nPinus), iD = new THREE.InstancedMesh(gD, lam(m.id === 'lawu' ? '#33452f' : '#41553a'), nPinus);
      const mx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
      for (let i = 0; i < nPinus; i++) {
        const sx = acak() < 0.5 ? -1 : 1; const x = sx * (7.5 + acak() ** 1.6 * 55); const d = AWAL_DUNIA + acak() * PANJANG_DUNIA; const s = 0.7 + acak() * 0.7;
        ps.set(x, tinggi(d) - 0.1, -d); sc.set(s, s * (0.9 + acak() * 0.4), s); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), acak() * 6); mx.compose(ps, q, sc);
        iB.setMatrixAt(i, mx); iD.setMatrixAt(i, mx);
      }
      grup.add(iB, iD);
    }
    if (m.id === 'bromo') {
      for (let d = AWAL_DUNIA; d < AKHIR; d += 9) if (acak() < 0.6) taruh(sprite('batu', 0.6 + acak() * 1.4, { warna: 0xb0aaa2 }), (acak() < 0.5 ? -1 : 1) * (5 + acak() * 30), d);
      const kal = gunung(0, 420, 260, 70, kabutWarna('#5a554f', 0.3), 14); kal.scale.set(1.6, 1, 1);
      gunung(-90, 330, 70, 65, kabutWarna('#6b645d', 0.25), 9);
      gunung(70, 300, 55, 40, kabutWarna('#7a7066', 0.25), 9);
      const asap = new THREE.Sprite(new THREE.SpriteMaterial({ map: texAsap, transparent: true, fog: false, depthWrite: false, opacity: 0.8 })); milik.push(asap.material);
      asap.scale.set(70, 60, 1); grup.add(asap); jauh.push({ obj: asap, x: 70, dist: 300, y: 50, asap: true });
    } else if (m.id === 'lawu') {
      gunung(-60, 390, 230, 190, kabutWarna('#3e4c42', 0.3), 8); gunung(160, 420, 160, 120, kabutWarna('#4c5a50', 0.4), 8);
      for (let d = AWAL_DUNIA; d < AKHIR; d += 11) if (acak() < 0.4) taruh(sprite('batu', 0.5 + acak() * 0.8, { warna: 0x9a8c80 }), (acak() < 0.5 ? -1 : 1) * (4.6 + acak() * 3), d);
    } else {
      // Dieng & Rinjani: bukit hijau + gunung tinggi + kabut
      const mBukit = lam('#6f7d55');
      for (let i = 0; i < 26; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(10 + acak() * 14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mBukit);
        b.scale.y = 0.35 + acak() * 0.3; const d = AWAL_DUNIA + acak() * PANJANG_DUNIA; taruh(b, (acak() < 0.5 ? -1 : 1) * (30 + acak() * 40), d, -1);
      }
      gunung(40, 400, 210, 230, kabutWarna('#4a5560', 0.3), 8); gunung(-150, 360, 120, 110, kabutWarna('#58636b', 0.4), 8);
      for (let d = AWAL_DUNIA; d < AKHIR; d += 14) if (acak() < 0.35) taruh(sprite('batu', 0.5 + acak() * 0.9, { warna: 0xa49c90 }), (acak() < 0.5 ? -1 : 1) * (4.8 + acak() * 4), d);
    }
    // pita penanda trail Willo
    const mTiang = lam('#5a4a3c'), mPita = new THREE.MeshLambertMaterial({ color: W.tembaga, side: THREE.DoubleSide }); milik.push(mPita);
    for (let d = 20; d < JARAK_FINISH; d += 38) {
      const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 5), mTiang); t.position.y = 0.75; g.add(t);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.14), mPita); p.position.set(0.25, 1.35, 0); g.add(p);
      taruh(g, (Math.floor(d / 38) % 2 ? 1 : -1) * 4.3, d);
    }
  }

  // ---------- gerbang, spanduk sponsor, water station ----------
  function gerbang(d, t, warna, lb = 9.6) {
    const g = new THREE.Group(); const mt = lam(warna);
    for (const sx of [-1, 1]) { const tg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.2, 0.35), mt); tg.position.set(sx * lb / 2, 2.6, 0); g.add(tg); }
    const mS = new THREE.MeshBasicMaterial({ map: t }); milik.push(mS, t);
    const sp = new THREE.Mesh(new THREE.BoxGeometry(lb + 0.4, 1.5, 0.25), [mt, mt, mt, mt, mS, mS]); sp.position.y = 5; g.add(sp);
    return taruh(g, 0, d);
  }
  const lokasi = m.shortName.toUpperCase();
  gerbang(0, texSpanduk('START', W.onyx, W.krem, `${lokasi} · PELARI KALCER × WILLO`), W.onyx);
  gerbang(WS_JENDELA[0] - 14, texSpanduk('WATER STATION', W.pinus, W.krem, 'ISOTONIK GRATIS · KM 0.5'), W.pinus);
  gerbang(JARAK_FINISH, texSpanduk('FINISH', 'kotak', W.krem), W.onyx);
  taruh(sprite('finish', 2.6), -4.3, JARAK_FINISH); taruh(sprite('finish', 2.6), 4.3, JARAK_FINISH);
  const mMeja = lam(W.pinus);
  for (let d = WS_JENDELA[0]; d <= WS_JENDELA[1]; d += 9) for (const sx of [-1, 1]) {
    taruh(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 3), mMeja), sx * 4.6, d, 0.4);
    for (let k = -1; k <= 1; k++) taruh(sprite('item_isotonic', 0.45), sx * 4.6, d + k * 0.9, 0.8);
  }
  const tSponsor = texSpanduk('WILLO APPAREL', W.onyx, W.krem, 'PELARI KALCER 3D · WILLOAPPAREL.COM'); milik.push(tSponsor);
  const mSponsor = new THREE.MeshBasicMaterial({ map: tSponsor }); milik.push(mSponsor);
  const gSponsor = new THREE.PlaneGeometry(4.2, 0.66);
  for (let d = 70; d < JARAK_FINISH; d += 110) for (const sx of [-1, 1]) {
    const p = new THREE.Mesh(gSponsor, mSponsor); p.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; taruh(p, sx * 3.95, d + sx * 6, 0.5);
  }

  // ---------- area expo lobi (di belakang garis start) ----------
  const mPodium = lam(W.onyx), mCincin = lam(W.tembaga);
  taruh(new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.24, 28), mPodium), 0, -8, 0.12);
  taruh(new THREE.Mesh(new THREE.TorusGeometry(1.07, 0.035, 6, 36), mCincin), 0, -8, 0.24).rotation.x = Math.PI / 2;
  EXPO_BOOTHS.forEach((b, i) => {
    const a = (i - 2.5) * 0.36; const R = 15;
    const s = sprite(b.id, 3.4); taruh(s, Math.sin(a) * R, -8 - Math.cos(a) * R * 0.75 - 6);
  });

  // ---------- langit, kabut, cahaya ----------
  const langit = texLangit(m.sky[0], m.sky[1]); milik.push(langit);
  return {
    grup, tinggi, elevasiNaik, trail, langit, kabut: new THREE.Fog(m.sky[1], m.fog[0], m.fog[1]),
    ikut(pd, t) {
      for (const j of jauh) {
        j.obj.position.set(j.x, tinggi(pd) + j.y, -pd - j.dist);
        if (j.asap) j.obj.material.opacity = 0.55 + Math.sin(t * 0.6) * 0.2;
      }
    },
    buang() {
      scene.remove(grup);
      grup.traverse((o) => { if (o.geometry && !o.isSprite) o.geometry.dispose(); });
      for (const x of milik) x.dispose();
    },
  };
}
export { texAset, saatRasio };

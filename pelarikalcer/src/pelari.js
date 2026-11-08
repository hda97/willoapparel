// Pelari 3D low-poly prosedural: tubuh, 12 gaya rambut, jersey/bawahan/sepatu/jam/aksesori dari katalog gear.
// Hadap -z (depan), punggung +z (kamera lari di belakang). Material & geometri dibagi pakai cache agar ringan.
import * as THREE from 'three';
import { kanvasTex } from './util.js';
import { W } from './konst.js';

const cMat = new Map();
export function mat(c, dua = false) {
  const hex = new THREE.Color(c).getHex(); const k = hex + (dua ? 'd' : '');
  if (!cMat.has(k)) cMat.set(k, new THREE.MeshLambertMaterial({ color: hex, side: dua ? THREE.DoubleSide : THREE.FrontSide }));
  return cMat.get(k);
}
const cGeo = new Map();
function geo(jenis, ...a) {
  const k = jenis + a.join(',');
  if (!cGeo.has(k)) {
    const G = { torus: THREE.TorusGeometry, box: THREE.BoxGeometry, cap: THREE.CapsuleGeometry, cyl: THREE.CylinderGeometry, sph: THREE.SphereGeometry, cone: THREE.ConeGeometry, circle: THREE.CircleGeometry, plane: THREE.PlaneGeometry }[jenis];
    cGeo.set(k, new G(...a));
  }
  return cGeo.get(k);
}
const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };

// ---------- tekstur jersey (punggung: WILLO APPAREL + BIB, dada: PELARI KALCER) ----------
const cTex = new Map();
function texJersey(sisi, warna, aksen, bib) {
  const k = [sisi, warna, aksen, bib].join('|');
  if (cTex.has(k)) return cTex.get(k);
  const gambar = (g, w, h) => {
    g.fillStyle = warna; g.fillRect(0, 0, w, h);
    g.fillStyle = aksen; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (sisi === 'belakang') {
      g.font = 'italic 800 58px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('WILLO', w / 2, h * 0.2);
      g.font = '600 22px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('A P P A R E L', w / 2, h * 0.36);
      g.fillStyle = W.krem; g.fillRect(w * 0.2, h * 0.47, w * 0.6, h * 0.3);
      g.strokeStyle = W.onyx; g.lineWidth = 3; g.strokeRect(w * 0.2 + 5, h * 0.47 + 5, w * 0.6 - 10, h * 0.3 - 10);
      g.fillStyle = W.onyx; g.font = '700 44px "JetBrains Mono", Menlo, monospace'; g.fillText(bib, w / 2, h * 0.625);
      g.fillStyle = aksen; g.fillRect(0, h * 0.9, w, h * 0.03);
    } else {
      g.font = 'italic 800 34px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('PELARI', w / 2, h * 0.3); g.fillText('KALCER', w / 2, h * 0.44);
      g.font = '600 15px "JetBrains Mono", Menlo, monospace'; g.fillText('WILLO APPAREL', w / 2, h * 0.58);
      g.fillRect(0, h * 0.9, w, h * 0.03);
    }
  };
  const t = kanvasTex(256, 256, gambar);
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => { gambar(t.image.getContext('2d'), 256, 256); t.needsUpdate = true; });
  cTex.set(k, t);
  return t;
}


// tekstur melingkar untuk torso lathe: u=0/1 dada (depan), u=0.5 punggung
function texJerseyLingkar(warna, aksen, bib) {
  const k = ['lingkar', warna, aksen, bib].join('|');
  if (cTex.has(k)) return cTex.get(k);
  const gambar = (g, w, h) => {
    g.fillStyle = warna; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = aksen;
    // punggung (tengah kanvas); tinggi kanvas = seluruh torso dari bawah (y bawah) ke leher (y atas)
    g.font = 'italic 800 60px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('WILLO', w / 2, h * 0.2);
    g.font = '600 20px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('A P P A R E L', w / 2, h * 0.31);
    g.fillStyle = W.krem; g.fillRect(w / 2 - 62, h * 0.38, 124, h * 0.2);
    g.strokeStyle = W.onyx; g.lineWidth = 3; g.strokeRect(w / 2 - 57, h * 0.38 + 5, 114, h * 0.2 - 10);
    g.fillStyle = W.onyx; g.font = '700 38px "JetBrains Mono", Menlo, monospace'; g.fillText(bib, w / 2, h * 0.48);
    // dada (tepi kiri & kanan kanvas bertemu di depan)
    g.fillStyle = aksen; g.font = 'italic 800 32px "Barlow Condensed", Arial Narrow, sans-serif';
    for (const x of [0, w]) { g.fillText('PELARI', x, h * 0.26); g.fillText('KALCER', x, h * 0.37); }
    g.fillRect(0, h * 0.9, w, h * 0.025);
  };
  const t = kanvasTex(512, 256, gambar);
  t.flipY = true;
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => { gambar(t.image.getContext('2d'), 512, 256); t.needsUpdate = true; });
  cTex.set(k, t); return t;
}

function texBendera(teks) {
  return kanvasTex(256, 128, (g, w, h) => {
    g.fillStyle = W.krem; g.fillRect(0, 0, w, h);
    g.fillStyle = W.onyx; g.fillRect(0, 0, w, 30);
    g.fillStyle = W.krem; g.font = '700 22px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PACER', w / 2, 16);
    g.fillStyle = W.onyx; g.font = 'italic 800 78px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText(teks, w / 2, 82);
  });
}

// ---------- rambut ----------
function topi(kepala, m, theta = 0.62, r = 0.166) {
  const c = mesh(geo('sph', r, 16, 12, 0, Math.PI * 2, 0, Math.PI * theta), m, 0, 0.075, 0.02);
  c.scale.set(0.9, 1.08, 1.0); c.rotation.x = 0.28; kepala.add(c); return c;
}
function pasangRambut(kepala, gaya, warna, ayun) {
  const mR = mat(warna), mRd = mat(warna, true);
  const ekor = (x, y, z, dasar = 0.3) => { const g = new THREE.Group(); g.position.set(x, y, z); g.userData.dasar = dasar; g.rotation.x = dasar; kepala.add(g); ayun.push(g); return g; };
  switch (gaya) {
    case 'taper_headband': topi(kepala, mR, 0.56); kepala.add(mesh(geo('cyl', 0.162, 0.162, 0.045, 20, 1, true), mat(W.onyx, true), 0, 0.11, 0)); break;
    case 'comma': {
      topi(kepala, mR);
      for (const sx of [-1, 1]) { const p = mesh(geo('sph', 0.07, 10, 8), mR, sx * 0.055, 0.165, -0.115); p.scale.set(1.25, 0.5, 0.8); p.rotation.z = sx * 0.4; kepala.add(p); }
      break;
    }
    case 'mullet': { topi(kepala, mR); const g = ekor(0, 0.12, 0.12, 0.15); g.add(mesh(geo('box', 0.24, 0.24, 0.05), mR, 0, -0.12, 0)); break; }
    case 'curly': {
      topi(kepala, mR, 0.55);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, el = i % 2 ? 0.55 : 0.95; const r = 0.15;
        const z = Math.cos(a) * Math.cos(el) * r; if (z < -0.08 && el < 0.9) continue;
        kepala.add(mesh(geo('sph', 0.058, 8, 6), mR, Math.sin(a) * Math.cos(el) * r, 0.07 + Math.sin(el) * r, z + 0.02));
      }
      kepala.add(mesh(geo('sph', 0.07, 8, 6), mR, 0, 0.23, 0.02));
      break;
    }
    case 'buzz': topi(kepala, mR, 0.5, 0.163); break;
    case 'manbun': topi(kepala, mR); kepala.add(mesh(geo('sph', 0.065, 10, 8), mR, 0, 0.18, 0.14)); break;
    case 'ponytail_visor': {
      topi(kepala, mR);
      kepala.add(mesh(geo('cyl', 0.164, 0.164, 0.055, 20, 1, true), mat(W.krem, true), 0, 0.12, 0));
      const brim = mesh(geo('cyl', 0.16, 0.16, 0.012, 20, 1, false, Math.PI * 0.5, Math.PI), mat(W.krem), 0, 0.1, -0.12); brim.scale.set(1, 1, 1.4); kepala.add(brim);
      const g = ekor(0, 0.17, 0.13, 0.35); g.add(mesh(geo('cap', 0.055, 0.22, 4, 8), mR, 0, -0.14, 0));
      break;
    }
    case 'boxer_braids': {
      topi(kepala, mR);
      for (const sx of [-1, 1]) { const g = ekor(sx * 0.085, 0.05, 0.1, 0.2); for (let i = 0; i < 5; i++) g.add(mesh(geo('sph', 0.042 - i * 0.004, 8, 6), mR, 0, -0.05 * i, 0)); }
      break;
    }
    case 'wavy_bob': {
      topi(kepala, mR, 0.62, 0.165);
      kepala.add(mesh(geo('cyl', 0.178, 0.2, 0.2, 18, 1, true, Math.PI + 0.95, Math.PI * 2 - 1.9), mRd, 0, 0.03, 0.01));
      break;
    }
    case 'high_bun': topi(kepala, mR); kepala.add(mesh(geo('sph', 0.078, 10, 8), mR, 0, 0.245, 0.05)); break;
    case 'bubble_pony': {
      topi(kepala, mR); const g = ekor(0, 0.17, 0.13, 0.3);
      [[0.062, -0.07], [0.055, -0.17], [0.045, -0.26]].forEach(([r, y]) => g.add(mesh(geo('sph', r, 10, 8), mR, 0, y, 0)));
      break;
    }
    case 'sport_hijab': {
      const h = mesh(geo('sph', 0.172, 18, 12, Math.PI * 1.5 + 0.55, Math.PI * 2 - 1.1, 0, Math.PI * 0.78), mRd, 0, 0.06, 0.005);
      h.scale.set(0.96, 1.1, 1.03); kepala.add(h);
      kepala.add(mesh(geo('cyl', 0.14, 0.24, 0.2, 18, 1, true), mRd, 0, -0.13, 0.01));
      return true;
    }
    default: topi(kepala, mR);
  }
  return false;
}

// ---------- bentuk halus (lathe) ----------
const cLathe = new Map();
function lathe(kunci, titik, seg = 22, skalaZ = 1, lipit = 0) {
  if (cLathe.has(kunci)) return cLathe.get(kunci);
  const g = new THREE.LatheGeometry(titik.map(([r, y]) => new THREE.Vector2(r, y)), seg, Math.PI);
  const p = g.attributes.position;
  const yMin = Math.min(...titik.map((t) => t[1])), yMax = Math.max(...titik.map((t) => t[1]));
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), z = p.getZ(i);
    if (lipit) { const a = Math.atan2(x, z); const f = (yMax - p.getY(i)) / (yMax - yMin); const k = 1 + lipit * f * (Math.abs(Math.sin(a * 9)) - 0.5); x *= k; z *= k; }
    p.setXYZ(i, x, p.getY(i), z * skalaZ);
  }
  g.computeVertexNormals(); cLathe.set(kunci, g); return g;
}
const tirus = (r1, r2, t, seg = 14, buka = false) => geo('cyl', r1, r2, t, seg, 1, buka);
const HIP = 0.94;

// profil torso (radius, tinggi) — dipakai LatheGeometry lalu dipipihkan depan-belakang
function profilTorso(gaya, fem) {
  if (gaya === 'boxy') return [[0, -0.12], [0.188, -0.12], [0.19, 0.05], [0.19, 0.25], [0.198, 0.42], [0.2, 0.5], [0.165, 0.565], [0.07, 0.6], [0, 0.6]];
  if (gaya === 'tunic') return [[0, -0.34], [0.2, -0.34], [0.175, -0.15], [0.15, 0.05], (fem ? [0.13, 0.2] : [0.148, 0.2]), [0.152, 0.34], [0.158, 0.44], [0.15, 0.52], [0.12, 0.57], [0.06, 0.6], [0, 0.6]];
  if (gaya === 'jacket') return [[0, -0.1], [0.165, -0.1], [0.162, 0.05], (fem ? [0.14, 0.2] : [0.158, 0.2]), [0.17, 0.35], [0.182, 0.46], [0.18, 0.53], [0.14, 0.58], [0.07, 0.62], [0, 0.62]];
  if (fem) return [[0, -0.07], [0.148, -0.07], [0.148, 0.04], [0.124, 0.19], [0.143, 0.32], [0.152, 0.41], [0.146, 0.49], [0.125, 0.55], [0.06, 0.59], [0, 0.59]];
  const s = gaya === 'singlet' ? 0.97 : 1;
  return [[0, -0.07], [0.152 * s, -0.07], [0.154 * s, 0.04], [0.146 * s, 0.18], [0.158 * s, 0.32], [0.175 * s, 0.44], [0.176 * s, 0.51], [0.145 * s, 0.565], [0.065, 0.6], [0, 0.6]];
}

// ---------- pelari ----------
export function buatPelari(cfg) {
  const fem = cfg.gender === 'female';
  const J = cfg.jersey, B = cfg.bottom, Sh = cfg.shoe, Wt = cfg.watch, Pr = cfg.prestige || {};
  const mKulit = mat(cfg.skin), mJ = mat(J.color), mJd = mat(J.color, true), mB = mat(B.color), mBd = mat(B.color, true), mBa = mat(B.accent || W.onyx);
  const mHitam = mat(W.onyx), mKrem = mat(W.krem), mLegging = mat('#23272B');
  const lenganPanjang = ['long', 'tunic', 'jacket'].includes(J.style);
  const root = new THREE.Group();
  const pinggul = new THREE.Group(); pinggul.position.y = HIP; root.add(pinggul);
  const badan = new THREE.Group(); pinggul.add(badan);
  // torso dengan tekstur jersey (punggung WILLO APPAREL + BIB, dada PELARI KALCER)
  const mTorso = new THREE.MeshLambertMaterial({ map: texJerseyLingkar(J.color, J.accent, cfg.bib || '#0088'), side: THREE.DoubleSide });
  badan.add(mesh(lathe('t' + J.style + fem, profilTorso(J.style, fem), 24, 0.66), mTorso, 0, 0, 0));
  const bahuX = J.style === 'boxy' ? 0.2 : fem ? 0.155 : 0.178;
  if (J.style === 'jacket' || J.id === 'trail_halfzip') {
    badan.add(mesh(geo('box', 0.014, 0.3, 0.01), mat(J.accent), 0, 0.42, -0.122));
    badan.add(mesh(tirus(0.07, 0.085, 0.07, 16, true), mJd, 0, 0.6, 0));
  }
  if (J.style === 'singlet') for (const sx of [-1, 1]) { const t = mesh(geo('torus', 0.07, 0.012, 6, 16), mat(J.accent), sx * 0.15, 0.49, 0); t.rotation.y = Math.PI / 2; t.scale.set(1, 1.3, 1); badan.add(t); }
  // bawahan
  let rok = null;
  if (B.type === 'skort' || B.type === 'skirt_legging') {
    rok = mesh(lathe('rok' + B.type, [[0.15, 0.06], [0.16, 0.0], [0.2, -0.12], [0.235, -0.22], [0.238, -0.235]], 28, 0.78, B.type === 'skort' ? 0.14 : 0), mBd, 0, 0, 0);
    pinggul.add(rok);
    pinggul.add(mesh(lathe('ikat', [[0.152, 0.075], [0.155, 0.03]], 24, 0.72), mat(B.accent || W.onyx, true), 0, 0, 0));
  } else if (B.type !== 'tights' || true) {
    badan.add(mesh(lathe('celana', [[0, 0.07], [0.152, 0.07], [0.158, 0.0], [0.162, -0.08], [0.15, -0.13], [0, -0.13]], 22, 0.72), mB, 0, 0, 0));
  }
  // kepala (koordinat lama, diperkecil agar proporsi realistis)
  const kepala = new THREE.Group(); kepala.position.y = 0.66; kepala.scale.setScalar(0.74); badan.add(kepala);
  kepala.add(mesh(tirus(0.06, 0.072, 0.17, 12), mKulit, 0, -0.1, 0.005));
  const muka = mesh(geo('sph', 0.15, 24, 18), mKulit, 0, 0.065, 0); muka.scale.set(0.86, 1.08, 0.96); kepala.add(muka);
  const rahang = mesh(geo('sph', 0.12, 20, 14), mKulit, 0, -0.005, -0.03); rahang.scale.set(0.86, 0.85, 0.92); kepala.add(rahang);
  const mPutihMata = mat('#F4F1EA'), mIris = mat('#2B1F18'), mAlis = mat(cfg.hair);
  for (const sx of [-1, 1]) {
    const pm = mesh(geo('sph', 0.024, 10, 8), mPutihMata, sx * 0.05, 0.075, -0.124); pm.scale.set(1.2, 0.8, 0.5); kepala.add(pm);
    kepala.add(mesh(geo('sph', 0.013, 8, 6), mIris, sx * 0.05, 0.075, -0.134));
    const al = mesh(geo('box', 0.05, 0.011, 0.012), mAlis, sx * 0.052, 0.112, -0.132); al.rotation.z = -sx * 0.12; kepala.add(al);
    const tl = mesh(geo('sph', 0.032, 8, 6), mKulit, sx * 0.13, 0.06, 0.005); tl.scale.set(0.45, 1, 0.75); kepala.add(tl);
  }
  const hidung = mesh(geo('sph', 0.022, 8, 6), mKulit, 0, 0.04, -0.142); hidung.scale.set(0.8, 1.1, 1.1); kepala.add(hidung);
  kepala.add(mesh(geo('box', 0.042, 0.008, 0.01), mat('#8C4E46'), 0, 0.0, -0.133));
  const ayun = [];
  const hijab = pasangRambut(kepala, cfg.hairstyle, cfg.hair, ayun);
  if (Pr.hasGlasses) {
    for (const sx of [-1, 1]) {
      const l = mesh(geo('sph', 0.034, 12, 8), mat('#2E2622'), sx * 0.052, 0.075, -0.138); l.scale.set(1.25, 0.8, 0.35); kepala.add(l);
      kepala.add(mesh(geo('box', 0.008, 0.01, 0.14), mat('#3B2F2A'), sx * 0.124, 0.085, -0.07));
    }
    kepala.add(mesh(geo('box', 0.03, 0.008, 0.01), mat('#3B2F2A'), 0, 0.08, -0.145));
  }
  if (Pr.hasPoles && !hijab) kepala.add(mesh(geo('box', 0.035, 0.05, 0.035), mHitam, 0.13, 0.05, -0.01));
  // lengan
  function lengan(sx) {
    const bahu = new THREE.Group(); bahu.position.set(sx * bahuX, 0.5, 0); badan.add(bahu);
    const mAtas = lenganPanjang ? mJ : mKulit;
    bahu.add(mesh(geo('sph', 0.056, 12, 10), J.style === 'singlet' ? mKulit : mJ, 0, 0, 0));
    bahu.add(mesh(tirus(0.05, 0.04, 0.27), mAtas, 0, -0.14, 0));
    if (J.style === 'short') bahu.add(mesh(tirus(0.066, 0.06, 0.14, 14, true), mJd, 0, -0.05, 0));
    if (J.style === 'boxy') bahu.add(mesh(tirus(0.074, 0.072, 0.21, 14, true), mJd, 0, -0.085, 0));
    const siku = new THREE.Group(); siku.position.y = -0.28; bahu.add(siku);
    siku.add(mesh(geo('sph', 0.042, 10, 8), mAtas, 0, 0, 0));
    siku.add(mesh(tirus(0.04, 0.03, 0.24), lenganPanjang ? mJ : mKulit, 0, -0.12, 0));
    if (lenganPanjang) siku.add(mesh(tirus(0.033, 0.033, 0.03), mat(J.accent), 0, -0.235, 0));
    const tangan = mesh(geo('sph', 0.038, 10, 8), mKulit, 0, -0.27, -0.005); tangan.scale.set(0.8, 1.25, 0.7); siku.add(tangan);
    if (sx < 0) {
      siku.add(mesh(tirus(0.036, 0.036, 0.04, 14), mat(Wt.color), 0, -0.2, 0));
      const layar = mesh(geo('cyl', 0.026, 0.026, 0.01, 14), mat('#101113'), 0, -0.2, -0.036); layar.rotation.x = Math.PI / 2; siku.add(layar);
    }
    if (Pr.hasPoles) { const t = mesh(geo('cyl', 0.01, 0.01, 1.15, 6), mat(W.taupe), 0, -0.55, 0.12); t.rotation.x = 0.35; siku.add(t); }
    return { bahu, siku };
  }
  function kaki(sx) {
    const pangkal = new THREE.Group(); pangkal.position.set(sx * 0.085, -0.06, 0); pinggul.add(pangkal);
    const legging = B.type === 'skirt_legging';
    const mPaha = legging ? mLegging : B.type === 'tights' ? mB : mKulit;
    pangkal.add(mesh(geo('sph', 0.078, 12, 10), mPaha, 0, 0, 0));
    pangkal.add(mesh(tirus(0.078, 0.054, 0.43, 16), mPaha, 0, -0.215, 0));
    if (B.type === 'shorts') { pangkal.add(mesh(tirus(0.094, 0.09, 0.17, 16, true), mBd, 0, -0.06, 0)); pangkal.add(mesh(tirus(0.091, 0.091, 0.018, 16, true), mat(B.accent || W.onyx, true), 0, -0.14, 0)); }
    if (B.type === 'tights') pangkal.add(mesh(tirus(0.056, 0.056, 0.02, 16, true), mat(B.accent || W.onyx, true), 0, -0.4, 0));
    const lutut = new THREE.Group(); lutut.position.y = -0.43; pangkal.add(lutut);
    const mBetis = legging || (fem && J.style === 'tunic') ? mLegging : mKulit;
    lutut.add(mesh(geo('sph', 0.054, 10, 8), mBetis, 0, 0, 0));
    lutut.add(mesh(lathe('betis', [[0, 0], [0.052, 0], [0.059, -0.1], [0.05, -0.21], [0.036, -0.35], [0.032, -0.41], [0, -0.41]], 16, 0.9), mBetis, 0, 0, 0.004));
    if (!legging) lutut.add(mesh(tirus(0.037, 0.035, 0.1, 12), mKrem, 0, -0.36, 0));
    const sepatu = new THREE.Group(); sepatu.position.set(0, -0.43, -0.035); lutut.add(sepatu);
    const atas = mesh(geo('sph', 0.06, 16, 10), mat(Sh.color), 0, 0.022, -0.005); atas.scale.set(0.9, 0.62, 2.1); sepatu.add(atas);
    sepatu.add(mesh(geo('box', 0.105, 0.032, 0.27), mat(Sh.sole), 0, -0.018, -0.005));
    sepatu.add(mesh(geo('box', 0.07, 0.05, 0.025), mat(Sh.sole), 0, 0.03, 0.12)); // tab tumit Willo
    return { pangkal, lutut };
  }
  const lk = lengan(-1), lka = lengan(1), kk = kaki(-1), kka = kaki(1);
  // aksesori
  if (Pr.hasVest) {
    const mV = mat(W.pinus);
    badan.add(mesh(geo('box', 0.2, 0.26, 0.025), mV, 0, 0.36, -0.118));
    for (const sx of [-1, 1]) {
      const tali = mesh(geo('box', 0.05, 0.02, 0.25), mV, sx * 0.08, 0.55, 0); badan.add(tali);
      badan.add(mesh(geo('cyl', 0.03, 0.03, 0.13, 10), mKrem, sx * 0.06, 0.4, -0.14));
    }
    badan.add(mesh(geo('box', 0.2, 0.11, 0.03), mV, 0, 0.2, 0.118));
  }
  if (Pr.hasWaistBag) {
    badan.add(mesh(geo('box', 0.19, 0.065, 0.045), mat(W.onyx), 0, 0.03, -0.118));
    badan.add(mesh(geo('box', 0.13, 0.007, 0.004), mKrem, 0, 0.045, -0.142));
  }
  if (cfg.pacer) {
    const g = new THREE.Group(); g.position.set(0, 0.4, 0.13); badan.add(g);
    g.add(mesh(geo('cyl', 0.01, 0.01, 1.0, 6), mHitam, 0, 0.5, 0));
    const f = mesh(geo('plane', 0.46, 0.23), new THREE.MeshLambertMaterial({ map: texBendera(cfg.pacer), side: THREE.DoubleSide }), 0.24, 0.86, 0);
    f.rotation.y = Math.PI; g.add(f);
  }
  const bay = mesh(geo('circle', 0.4, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.26, depthWrite: false }), 0, 0.02, 0);
  bay.rotation.x = -Math.PI / 2; root.add(bay);
  root.userData = { pinggul, badan, kepala, lk, lka, kk, kka, bay, rok, ayun, fase: Math.random() * 6 };

  root.userData.animasi = (dt, laju, k = {}) => {
    const u = root.userData;
    if (k.drill) {
      u.fase += dt * 8.5; const f = u.fase, s = Math.sin(f);
      const A = Math.max(0, s), Bq = Math.max(0, -s);
      if (k.drill === 'high') {
        kk.pangkal.rotation.x = A * 1.55; kk.lutut.rotation.x = -A * 1.7; kka.pangkal.rotation.x = Bq * 1.55; kka.lutut.rotation.x = -Bq * 1.7;
        pinggul.position.y = HIP + Math.abs(s) * 0.05;
      } else if (k.drill === 'kick') {
        kk.pangkal.rotation.x = -0.15 * A; kk.lutut.rotation.x = -A * 2.3; kka.pangkal.rotation.x = -0.15 * Bq; kka.lutut.rotation.x = -Bq * 2.3;
        pinggul.position.y = HIP - 0.02 + Math.abs(s) * 0.06;
      } else {
        kk.pangkal.rotation.x = A * 1.25; kk.lutut.rotation.x = -A * 1.5; kka.pangkal.rotation.x = Bq * 1.25 - 0.1; kka.lutut.rotation.x = -Bq * 1.5;
        pinggul.position.y = HIP + 0.02 + Math.abs(s) * 0.12;
      }
      lk.bahu.rotation.x = -s * 0.9; lka.bahu.rotation.x = s * 0.9; lk.siku.rotation.x = 1.45; lka.siku.rotation.x = 1.45;
      lk.bahu.rotation.z = -0.08; lka.bahu.rotation.z = 0.08;
      badan.rotation.x = -0.06; kepala.rotation.x = 0;
      for (const a of ayun) a.rotation.x = a.userData.dasar + Math.sin(f * 2) * 0.3;
      if (rok) rok.rotation.z = Math.sin(f) * 0.07;
      return;
    }
    u.fase += dt * laju * 1.05;
    const f = u.fase; const amp = k.wall ? 0.55 : (k.sprint ? 1.05 : 0.85);
    if (k.udara) {
      kk.pangkal.rotation.x = 0.95; kk.lutut.rotation.x = -1.45; kka.pangkal.rotation.x = -0.35; kka.lutut.rotation.x = -0.9;
      lk.bahu.rotation.x = 0.9; lka.bahu.rotation.x = -0.6; pinggul.position.y = HIP;
    } else if (laju < 0.1) {
      for (const q of [kk, kka]) { q.pangkal.rotation.x *= 0.8; q.lutut.rotation.x *= 0.8; }
      for (const l of [lk, lka]) { l.bahu.rotation.x *= 0.8; l.siku.rotation.x = 0.12; }
      lk.bahu.rotation.z = -0.1; lka.bahu.rotation.z = 0.1; pinggul.position.y = HIP + Math.sin(performance.now() / 900) * 0.004; badan.rotation.x *= 0.85; kepala.rotation.x = 0;
      for (const a of ayun) a.rotation.x = a.userData.dasar + Math.sin(performance.now() / 700) * 0.04;
      if (rok) rok.rotation.z = 0;
      return;
    } else {
      const s = Math.sin(f), c = Math.cos(f);
      kk.pangkal.rotation.x = s * amp; kka.pangkal.rotation.x = -s * amp;
      kk.lutut.rotation.x = -(Math.max(0, -c) * 1.5 * amp + 0.15); kka.lutut.rotation.x = -(Math.max(0, c) * 1.5 * amp + 0.15);
      lk.bahu.rotation.x = -s * amp * 0.9; lka.bahu.rotation.x = s * amp * 0.9;
      pinggul.position.y = HIP - 0.04 + Math.abs(c) * 0.07;
    }
    lk.siku.rotation.x = 1.45; lka.siku.rotation.x = 1.45;
    lk.bahu.rotation.z = -0.08; lka.bahu.rotation.z = 0.08;
    const condong = k.wall ? 0.4 : (k.sprint ? 0.2 : 0.1);
    badan.rotation.x += (-condong - badan.rotation.x) * Math.min(1, dt * 6);
    kepala.rotation.x = k.wall ? -0.3 : -0.04;
    for (const a of ayun) a.rotation.x = a.userData.dasar + 0.25 + Math.sin(f * 2) * 0.22 * (k.sprint ? 1.3 : 1);
    if (rok) { rok.rotation.z = Math.sin(f) * 0.07; rok.scale.set(1 + Math.abs(Math.sin(f)) * 0.06, 1, 1 + Math.abs(Math.cos(f)) * 0.05); }
  };
  return root;
}


// papan nama di atas kepala NPC
export function papanNama(teks, warna = W.krem, latar = 'rgba(20,22,24,.72)') {
  const t = kanvasTex(256, 56, (g, w, h) => {
    g.font = '700 26px "Barlow Condensed", Arial Narrow, sans-serif'; const lb = Math.min(w - 4, g.measureText(teks).width + 28);
    g.fillStyle = latar; g.beginPath(); if (g.roundRect) g.roundRect((w - lb) / 2, 6, lb, h - 12, 20); else g.rect((w - lb) / 2, 6, lb, h - 12); g.fill();
    g.fillStyle = warna; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(teks, w / 2, h / 2 + 1);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(1.7, 0.37, 1); s.position.y = 2.15; return s;
}

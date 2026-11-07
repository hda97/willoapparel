// Utilitas bersama: aset gambar, tekstur kanvas, sprite, angka acak berbenih.
import * as THREE from 'three';

export const ASET = window.ASET || {};
export const $ = (id) => document.getElementById(id);

export function mulberry(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function kanvasTex(w, h, gambar, ulang) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; gambar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (ulang) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
export function bintik(g, w, h, n, warna, ukuran = 2, acak = Math.random) {
  for (let i = 0; i < n; i++) { g.fillStyle = warna[i % warna.length]; g.fillRect(acak() * w, acak() * h, ukuran, ukuran); }
}

// rasio lebar/tinggi tiap gambar (dimuat sekali)
export const RASIO = {};
const tunggu = {};
for (const k of Object.keys(ASET)) {
  const im = new Image();
  im.onload = () => { RASIO[k] = im.width / im.height; (tunggu[k] || []).forEach((f) => f(RASIO[k])); delete tunggu[k]; };
  im.src = ASET[k];
}
export function saatRasio(nama, f) { if (RASIO[nama]) f(RASIO[nama]); else (tunggu[nama] = tunggu[nama] || []).push(f); }

const cacheTex = {};
export function texAset(nama) {
  if (!cacheTex[nama]) {
    const t = new THREE.TextureLoader().load(ASET[nama] || ''); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; cacheTex[nama] = t;
  }
  return cacheTex[nama];
}
const cacheMatSprite = {};
// sprite berdiri (titik pangkal di bawah tengah); material dibagi per nama agar hemat
export function sprite(nama, tinggiM, opsi = {}) {
  const kunci = nama + (opsi.fog === false ? ':nf' : '') + (opsi.warna || '');
  if (!cacheMatSprite[kunci]) {
    cacheMatSprite[kunci] = new THREE.SpriteMaterial({ map: texAset(nama), transparent: true, alphaTest: 0.08, fog: opsi.fog !== false, color: opsi.warna || 0xffffff });
  }
  const s = new THREE.Sprite(cacheMatSprite[kunci]); s.center.set(0.5, 0);
  s.userData.tinggiM = tinggiM;
  s.scale.set(tinggiM, tinggiM, 1);
  saatRasio(nama, (r) => s.scale.set(tinggiM * r, tinggiM, 1));
  return s;
}

export const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// model 3D GLB buatan Sand3D (aset3d/*.glb, disisipkan build.py sebagai window.ASET3D)
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const MODEL = {};
export async function muatModel() {
  const src = window.ASET3D || {}; const loader = new GLTFLoader();
  await Promise.all(Object.entries(src).map(async ([k, uri]) => {
    try {
      const buf = await (await fetch(uri)).arrayBuffer();
      const gl = await loader.parseAsync(buf, '');
      gl.scene.traverse((o) => { if (o.isMesh) { o.userData.bersama = true; if (o.material) o.material.envMapIntensity = 0; } });
      MODEL[k] = gl.scene;
    } catch (e) { /* model gagal dimuat: pakai gambar datar */ }
  }));
}
export const adaModel = (nama) => !!MODEL[nama];
export function model(nama, skala = 1) { const m = MODEL[nama]; if (!m) return null; const c = m.clone(true); c.scale.setScalar(skala); return c; }

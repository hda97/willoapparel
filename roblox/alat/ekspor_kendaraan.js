// Ekspor model kendaraan game web (public/duniakotak/mabar/js/aset/mobil.js) jadi daftar Part Roblox.
// Pakai: (dari folder public) npx http-server -p 8766 -s &  lalu  node roblox/alat/ekspor_kendaraan.js > roblox/src/ModelKendaraan.lua
// Tiap bagian: { ukuran x,y,z, letak x,y,z, 9 angka arah (kolom = sumbu X,Y,Z Part), warna, bendera } dalam stud.
// Warna "w" = cat badan, "a" = warna aksen (kontras cat). Bendera: 1 silinder, 2 kaca, 4 lampu (Neon), 8 sirene merah, 16 sirene biru, 32 ban (berputar).
// Kendaraan web menghadap +z, Roblox -Z: semua diputar 180 derajat di sumbu Y. 1 meter = 4,12/1,7 x 1,25 stud.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const p = await b.newPage();
  p.on('pageerror', e => console.error('ERR ' + e));
  p.on('console', m => console.error('LOG ' + m.text()));
  await p.route('**/mabar/js/aset/mobil.js*', async r => { const resp = await r.fetch(); let s = await resp.text();
    if (!s.includes('function gabung(grup) {')) throw new Error('gabung'); s = s.replace('function gabung(grup) {', 'function gabung(grup) { return;');
    s += '\nexport const __uji = {SPEK, KACA, LAMPU, SEN, MUNDUR, REKLAMA, SIR_M, SIR_B, GARIS, KARET, kontras};';
    r.fulfill({body: s, contentType: 'application/javascript'}); });
  await p.route('**/ekspor.html', r => r.fulfill({contentType: 'text/html', body: `<!doctype html><html><head>
<script type="importmap">{"imports":{"three":"/duniakotak/three/0.169.0/three.module.min.js","three/addons/":"/duniakotak/three/0.169.0/jsm/"}}</script></head><body>
<script type="module">
import * as THREE from 'three';
import {buatMobil, __uji as U} from '/duniakotak/mabar/js/aset/mobil.js';
const CAT = 0x123457, M = 4.12 / 1.7 * 1.25, F = new THREE.Matrix4().makeRotationY(Math.PI);
const AKSEN = U.kontras(CAT);
const r2 = v => Math.round(v * 100) / 100, r3 = v => Math.round(v * 1000) / 1000;
const avg = new Map();
function rataTex(map) { if (avg.has(map)) return avg.get(map); let c = null; try { const im = map.image; if (im && im.width) { const cv = document.createElement('canvas'); cv.width = cv.height = 16; const x = cv.getContext('2d'); x.drawImage(im, 0, 0, 16, 16); const d = x.getImageData(0, 0, 16, 16).data; let r = 0, g = 0, bb = 0, n = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; bb += d[i+2]; n++; } c = new THREE.Color().setRGB(r/n/255, g/n/255, bb/n/255, THREE.SRGBColorSpace); } } catch (e) {} avg.set(map, c); return c; }
const hex = c => c.getHexString();
const hasil = {};
for (const model of Object.keys(U.SPEK)) {
  const mob = buatMobil(model, CAT, 7); mob.updateMatrixWorld(true);
  const ban = new Set(); for (const rd of mob.userData.roda) rd.putar.traverse(o => ban.add(o));
  const L = [];
  mob.traverse(o => {
    if (!o.isMesh) return; let v = true; for (let q = o; q; q = q.parent) if (!q.visible) v = false; if (!v) return;
    const mt = Array.isArray(o.material) ? o.material[0] : o.material;
    if (mt === U.GARIS || mt.side === THREE.BackSide) return;
    const gm = o.geometry, pr = gm.parameters || {}, t = gm.type;
    let size, shape = 0, putarSumbu = null;   // ukuran lokal geometri (sebelum skala)
    if (t === 'BoxGeometry' || t === 'RoundedBoxGeometry') { gm.computeBoundingBox(); const s = new THREE.Vector3(); gm.boundingBox.getSize(s); size = [s.x, s.y, s.z]; }
    else if (t === 'CylinderGeometry' || t === 'ConeGeometry') { const r = t === 'ConeGeometry' ? pr.radius * .6 : Math.max(pr.radiusTop, pr.radiusBottom) * (pr.radiusTop !== pr.radiusBottom ? .85 : 1); size = [2 * r, pr.height, 2 * r]; shape = 1; }
    else if (t === 'TorusGeometry') { size = [2 * (pr.radius + pr.tube), 2 * (pr.radius + pr.tube), 2 * pr.tube]; shape = 2; }
    else if (t === 'PlaneGeometry') size = [pr.width, pr.height, .01];
    else if (t === 'CircleGeometry') { size = [2 * pr.radius, 2 * pr.radius, .01]; }
    else { gm.computeBoundingBox(); const s = new THREE.Vector3(); gm.boundingBox.getSize(s); size = [s.x, s.y, s.z]; }
    const W = new THREE.Matrix4().multiplyMatrices(F, o.matrixWorld), e = W.elements;
    let ax = [new THREE.Vector3(e[0], e[1], e[2]), new THREE.Vector3(e[4], e[5], e[6]), new THREE.Vector3(e[8], e[9], e[10])];
    let s = size.map((z, i) => z * ax[i].length()); ax = ax.map(a => a.normalize());
    gm.computeBoundingBox(); const pos = gm.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(W);
    let flag = 0;
    if (shape === 1) { ax = [ax[1], ax[0], ax[2].clone().negate()]; s = [s[1], s[0], s[2]]; flag |= 1; }        // silinder: sumbu Y three -> sumbu X Roblox
    if (shape === 2) { ax = [ax[2], ax[0], ax[1]]; s = [s[2], s[0], s[1]]; flag |= 1; }                          // torus: sumbu Z three -> sumbu X Roblox
    let w;
    const c0 = mt.color ? mt.color.clone() : new THREE.Color(1, 1, 1);
    if (mt.map) { const a = rataTex(mt.map); if (a) c0.multiply(a); }
    if (mt.color && mt.color.getHex() === CAT && !mt.map) w = 'w'; else if (mt.color && mt.color.getHex() === AKSEN && !mt.map && mt.roughness === .45) w = 'a'; else w = hex(c0);
    if (mt === U.KACA || mt.transparent && mt.opacity < .95) flag |= 2;
    if (mt === U.LAMPU || mt === U.SEN || mt === U.MUNDUR || mt === U.REKLAMA || (mt.emissive && mt.emissive.getHex() && mt.emissiveIntensity >= .3)) flag |= 4;
    if (mt === U.SIR_M) flag |= 8; if (mt === U.SIR_B) flag |= 16;
    if (ban.has(o)) flag |= 32;
    if (Math.max(...s) < .012) return;
    L.push([...s.map(z => r2(Math.max(z * M, .05))), ...pos.toArray().map(z => r2(z * M)), ...ax.flatMap(a => a.toArray()).map(r3), w, flag]);
  });
  const k = mob.userData.kursi || {};
  hasil[model] = {bagian: L, jari: r2(mob.userData.jari * M), kursi: [r2(-(k.x || 0) * M), r2((k.tinggi || 1) * M), r2(-(k.z || 0) * M)]};
}
window.__hasil = hasil; document.title = 'ok';
</script></body></html>`}));
  await p.goto('http://localhost:8766/ekspor.html');
  await p.waitForFunction(() => document.title === 'ok', null, {timeout: 60000});
  const h = await p.evaluate(() => window.__hasil);
  await b.close();
  const q = s => typeof s === 'string' ? JSON.stringify(s) : String(s);
  let out = `--[[\n  ModelKendaraan (ModuleScript, ReplicatedStorage.DK_ModelKendaraan) - bentuk kendaraan SAMA dengan game web\n  (public/duniakotak/mabar/js/aset/mobil.js), dibuat otomatis oleh roblox/alat/ekspor_kendaraan.js. Jangan diubah tangan.\n\n  Tiap bagian: { ukuran x,y,z, letak x,y,z (stud, tanah = 0, depan = -Z), 9 angka arah (kolom sumbu X,Y,Z), warna, bendera }.\n  Warna "w" = cat badan, "a" = aksen (kontras cat). Bendera: 1 silinder, 2 kaca, 4 lampu, 8 sirene merah, 16 sirene biru, 32 ban.\n  M.buat(jenis, warnaCat) -> Model (semua Part Anchored, CanCollide mati, PrimaryPart "Akar" di tanah tengah).\n]]\nlocal M = {}\nM.DATA = {\n`;
  for (const [m, d] of Object.entries(h)) {
    out += `\t${m} = { jari = ${d.jari}, kursi = { ${d.kursi.join(', ')} }, bagian = {\n`;
    for (const r of d.bagian) out += `\t\t{ ${r.map(q).join(', ')} },\n`;
    out += `\t} },\n`;
    console.error(m, d.bagian.length, 'bagian');
  }
  out += `}\n`;
  out += require('fs').readFileSync(__dirname + '/ModelKendaraan.ekor.lua', 'utf8');
  process.stdout.write(out);
})();

// ===================================================================
// BERSAMA untuk game arena (Lab Ajaib, English Quest, Coding Quest):
// tokoh murid/tim, jalan ke tujuan, asap, papan teks, kamera orbit.
// Game mengisi objek M (ent, camPos, mode) lalu memanggil fungsi di sini.
// ===================================================================
const M = {ent: new Map(), camPos: new THREE.Vector3(0, 12, 26), mode: 'judul', cam: {th: 0, y: 2, d: 26, ty: 2, td: 26, tinggi: .5, tx: 0, x: 0, tz: 0, z: 0}};

function rupaTim(t, k) { const r = [{j: 'L', k: 1, g: 'cepak', w: 0}, {j: 'P', k: 2, g: 'hijab', w: 0}, {j: 'P', k: 0, g: 'kuncir', w: 1}, {j: 'L', k: 3, g: 'keriting', w: 0}, {j: 'P', k: 3, g: 'panjang', w: 0}, {j: 'L', k: 0, g: 'belah', w: 1}]; return r[(t * 2 + k) % r.length]; }
function hapusEnt(p) { const g = M.ent.get(p.id); if (g) { P.sc.remove(g); M.ent.delete(p.id); } p.obj = null; }
// satu murid (HP) atau satu tim (layar: 3 avatar)
function buatEnt(p, {skala = .4, labelY = 2.55} = {}) {
  hapusEnt(p);
  const g = new THREE.Group(); const warnaTim = p.tim >= 0 ? TIM[p.tim].warna : null; const avatar = [];
  if (SESI && SESI.mode === 'layar') {
    [[0, 0], [-.7, .55], [.7, .55]].forEach(([x, z], k) => { const s = buatSiswa(rupaTim(p.tim, k), warnaTim, skala * 1.05); s.position.set(x, 0, z); g.add(s); avatar.push(s); });
  } else { const s = buatSiswa(p.rupa || rupaAcak(), warnaTim, skala); g.add(s); avatar.push(s); }
  const lb = labelNama(p.nama, warnaTim || 'rgba(255,255,255,.93)', warnaTim ? '#fff' : '#1d2b44'); lb.position.y = labelY; lb.scale.multiplyScalar(SESI && SESI.mode === 'layar' ? 2 : 1.35); g.add(lb);
  g.userData = {avatar, label: lb, target: new THREE.Vector3(), jalan: false, terbang: false, arah: null};
  if (PEMAIN.size > 30) ringanTokoh(g);
  P.sc.add(g); M.ent.set(p.id, g); p.obj = g; return g;
}
function majuEnt(dt, laju = 4.2) {
  M.ent.forEach(g => { const u = g.userData; if (u.terbang) { u.avatar.forEach(a => animTokoh(a, dt)); return; }
    const d = new THREE.Vector3().subVectors(u.target, g.position); d.y = 0; const jarak = d.length();
    if (Math.abs(u.target.y - g.position.y) > .01) g.position.y += (u.target.y - g.position.y) * Math.min(1, dt * 10);
    if (jarak > .05) { const v = Math.min(jarak, dt * laju); g.position.addScaledVector(d.normalize(), v); const arah = Math.atan2(d.x, d.z); u.avatar.forEach(a => { a.rotation.y = arah; if (a.userData.mode !== 'jalan') setMode(a, 'jalan'); }); u.jalan = true; }
    else if (u.jalan) { u.jalan = false; u.avatar.forEach(a => { setMode(a, 'diam'); a.rotation.y = u.arah ?? Math.atan2(M.camPos.x - g.position.x, M.camPos.z - g.position.z); }); }
    u.avatar.forEach(a => animTokoh(a, dt));
  });
}
// susun daftar entitas dalam kotak (cx, cz) selebar w x d
function susunKotak(daftar, cx, cz, w, d, y = 0, jarakMaks = 1.2) {
  const n = daftar.length; if (!n) return; const kol = Math.max(1, Math.ceil(Math.sqrt(n * w / d))), bar = Math.ceil(n / kol);
  const jx = Math.min(jarakMaks, w / Math.max(1, kol)), jz = Math.min(jarakMaks, d / Math.max(1, bar));
  daftar.forEach((g, i) => { const r = Math.floor(i / kol), c = i % kol; g.userData.target.set(cx + (c - (kol - 1) / 2) * jx, y, cz + (r - (bar - 1) / 2) * jz); });
}
// kamera orbit lembut ke titik (tx, ty, tz)
function gerakKamera(dt, {sway = .15, laju = 2} = {}) {
  const c = M.cam; const k = Math.min(1, dt * laju);
  c.y += (c.ty - c.y) * k; c.d += (c.td - c.d) * k; c.x += (c.tx - c.x) * k; c.z += (c.tz - c.z) * k;
  const th = c.th + Math.sin(performance.now() / 9000) * sway;
  M.camPos.set(c.x + Math.sin(th) * c.d, c.y + c.d * c.tinggi, c.z + Math.cos(th) * c.d);
  P.cam.position.copy(M.camPos); P.cam.lookAt(c.x, c.y, c.z); ikutCahaya(c.x, c.y, c.z);
}
// papan nama kayu
function papanNama(teks, w = 7, h = 1.4, bg = '#1d2b44', fg = '#ffd43b') {
  const c = document.createElement('canvas'); c.width = 1000; c.height = Math.round(1000 * h / w); const x = c.getContext('2d');
  x.fillStyle = bg; x.beginPath(); x.roundRect(0, 0, c.width, c.height, 40); x.fill(); x.fillStyle = fg; x.font = `800 ${Math.round(c.height * .6)}px 'Baloo 2', Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(teks, c.width / 2, c.height * .54, c.width - 60);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: t, transparent: true}));
}
function hurufLantai(h, ukuran = 1.6, warna = 'rgba(255,255,255,.92)') { const t = new THREE.Mesh(new THREE.PlaneGeometry(ukuran, ukuran), new THREE.MeshBasicMaterial({map: teksKanvas(h, null, warna, {ukuran: 90}), transparent: true})); t.rotation.x = -Math.PI / 2; return t; }
// asap/kepulan: kubus lembut naik lalu pudar
const _asap = []; const _ga = new THREE.BoxGeometry(.5, .5, .5);
function asap(pos, warna = '#9aa5b1', n = 12, sebar = 1) {
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(_ga, new THREE.MeshStandardMaterial({color: warna, transparent: true, opacity: .85, roughness: 1})); m.position.copy(pos).add(new THREE.Vector3(acak(-sebar, sebar), acak(0, .5), acak(-sebar, sebar)));
    m.userData = {v: acak(1.2, 2.6), umur: acak(1, 1.8), u0: 0, s: acak(.5, 1.1)}; m.scale.setScalar(m.userData.s); P.sc.add(m); _asap.push(m); }
}
function updateAsap(dt) {
  for (let i = _asap.length - 1; i >= 0; i--) { const m = _asap[i], u = m.userData; u.u0 += dt; m.position.y += u.v * dt; m.scale.setScalar(u.s * (1 + u.u0 * .8)); m.material.opacity = Math.max(0, .85 * (1 - u.u0 / u.umur));
    if (u.u0 >= u.umur) { P.sc.remove(m); m.material.dispose(); _asap.splice(i, 1); } }
}
// hook umum yang sama untuk semua game arena
function pasangHookUmum({aturPosisi, siapkanDunia, hiasan = 8}) {
  GAME.siapkan = () => { siapkanDunia(); for (let i = 0; i < hiasan; i++) { const s = buatSiswa(rupaAcak(), null, .36); P.sc.add(s); (M.hias = M.hias || []).push(s); } GAME.letakHias && GAME.letakHias(M.hias); };
  GAME.layarJudul = () => { M.mode = 'judul'; };
  GAME.keMenu = () => { M.mode = 'judul'; PEMAIN.forEach(p => hapusEnt(p)); M.ent.forEach(g => P.sc.remove(g)); M.ent.clear(); (M.hias || []).forEach(s => { s.visible = true; }); GAME.reset && GAME.reset(); };
  GAME.siapLobi = () => { M.mode = 'lobi'; (M.hias || []).forEach(s => { s.visible = false; }); M.ent.forEach(g => P.sc.remove(g)); M.ent.clear(); PEMAIN.forEach(p => buatEnt(p, GAME.ukuranTokoh)); aturPosisi(); M.ent.forEach(g => g.position.copy(g.userData.target)); };
  GAME.pemainBaru = p => { if (M.mode === 'lobi' || M.mode === 'main') { const g = buatEnt(p, GAME.ukuranTokoh); aturPosisi(); g.position.copy(g.userData.target); if (M.mode === 'lobi') g.position.y = 6; } };
  GAME.pemainBerubah = p => { if (M.ent.has(p.id)) { const lama = M.ent.get(p.id).position.clone(); buatEnt(p, GAME.ukuranTokoh).position.copy(lama); aturPosisi(); } };
  GAME.pemainHilang = p => { hapusEnt(p); aturPosisi(); };
  GAME.soalBaru = () => { aturPosisi(); };
  GAME.pilihJawaban = () => { aturPosisi(); };
}

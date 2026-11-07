// MENARA HITUNG (Matematika SMP): panjat menara bersama.
// Tiap lantai terbagi 4 petak warna A-D. Jawaban benar naik satu lantai, petak yang salah runtuh dan
// avatarnya jatuh satu lantai. Bisa kelompok di satu layar (2-4 tim) atau satu kelas lewat HP.
Object.assign(GAME, {
  id: 'menara-hitung', judul: 'Menara Hitung',
  ajak: 'Jawab soal Matematika, naik lantai demi lantai, dan jadilah yang pertama di puncak!',
  bantuan: `<ol><li>Soal muncul di layar bersama 4 pilihan: <b>A</b> merah, <b>B</b> biru, <b>C</b> kuning, <b>D</b> hijau.</li>
    <li>Pilih jawaban. Avatar berlari ke petak warna yang sama di lantainya.</li>
    <li>Waktu habis atau semua sudah menjawab: <b>benar naik 1 lantai</b>, petak yang <b>salah runtuh</b> dan avatarnya turun 1 lantai. Yang tidak menjawab tetap di tempat.</li>
    <li>Poin: benar 500, ditambah bonus kecepatan.</li>
    <li><b>Kelompok di layar ini:</b> tiap tim menekan tombol warnanya, atau tombol keyboard (Tim Merah 1 2 3 4, Biru Q W E R, Kuning A S D F, Hijau Z X C V).</li>
    <li><b>Satu kelas lewat HP:</b> murid scan QR di layar, lalu menjawab di HP.</li></ol>`,
  labelJumlah: 'Jumlah soal (= tinggi menara)',
  musik: {bpm: 116, nada: 62, alat: 'marimba', progresi: [0, 5, 3, 4], benih: 21},
});

const TH = 3.2, LEBAR = 12, PETAK = 5.6;
const POS_PETAK = {A: [-2.95, -2.95], B: [2.95, -2.95], C: [-2.95, 2.95], D: [2.95, 2.95]};
const WARNA_PETAK = {A: '#e8453c', B: '#2f80ed', C: '#f2a20c', D: '#27ae60'};
const M = {menara: null, lantai: [], petak: [], tinggi: 10, ent: new Map(), cam: {th: .6, y: 4, d: 30, ty: 4, td: 30}, mode: 'judul', podium: null};

// ---------- dunia ----------
function bangunMenara(n) {
  if (M.menara) { P.sc.remove(M.menara); }
  const g = new THREE.Group(); M.menara = g; M.tinggi = n; M.lantai = []; M.petak = []; M.lapis = [];
  for (let i = 0; i <= n; i++) {
    const y = i * TH, puncak = i === n;
    const lt = di(kotak(LEBAR + .6, .4, LEBAR + .6, puncak ? '#f6c344' : i % 2 ? '#ead7ae' : '#f3e4c2', .1), 0, y - .2, 0); g.add(lt); M.lantai.push(lt); const lapis = [lt]; M.lapis.push(lapis);
    if (i < n) {
      const pk = {};
      Object.entries(POS_PETAK).forEach(([h, [x, z]]) => {
        const p = new THREE.Group(); p.position.set(x, y + .02, z);
        const b = kotak(PETAK, .14, PETAK, WARNA_PETAK[h], .06); b.position.y = .07; p.add(b);
        const t = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({map: teksKanvas(h, null, 'rgba(255,255,255,.92)', {ukuran: 90}), transparent: true}));
        t.rotation.x = -Math.PI / 2; t.position.y = .15; p.add(t); p.userData = {h, y0: p.position.y, b}; g.add(p); pk[h] = p; lapis.push(b, t);
      });
      M.petak.push(pk);
      // tiang & pagar sudut
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(di(kotak(.55, TH - .4, .55, '#c98a4b', .08), sx * (LEBAR / 2 + .05), y + TH / 2, sz * (LEBAR / 2 + .05))));
      // nomor lantai di dua sisi depan
      const nomor = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({map: teksKanvas(String(i + 1), '#1d4ed8', '#fff', {ukuran: i + 1 >= 10 ? 70 : 90})}));
      nomor.position.set(-LEBAR / 2 - .45, y + 1.4, LEBAR / 2 + .45); nomor.rotation.y = 0; g.add(nomor);
    } else {
      // puncak: atap bertingkat + bendera + podium
      const pod = new THREE.Group(); pod.position.y = y; g.add(pod);
      [[0, 1.5, '#ffd43b', '1'], [-2.6, 1.0, '#ced4da', '2'], [2.6, .6, '#e8a25a', '3']].forEach(([x, h, c, nm]) => {
        const b = di(kotak(2.4, h, 2.4, c, .1), x, h / 2, -1.5); pod.add(b);
        const t = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({map: teksKanvas(nm, null, '#1d2b44'), transparent: true})); t.position.set(x, h / 2, -.29); pod.add(t);
      });
      M.podium = pod;
      g.add(di(kotak(.18, 4, .18, '#555', .03), 4.6, y + 2, -4.6)); g.add(di(kotak(2, 1.2, .08, '#e8590c', .03), 5.6, y + 3.4, -4.6));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(di(kotak(.7, .7, .7, '#f59f00', .1), sx * (LEBAR / 2), y + .35, sz * (LEBAR / 2))));
    }
  }
  // papan nama di kaki menara
  const papan = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.4), new THREE.MeshBasicMaterial({map: (() => { const c = document.createElement('canvas'); c.width = 1000; c.height = 200; const x = c.getContext('2d');
    x.fillStyle = '#1d2b44'; x.beginPath(); x.roundRect(0, 0, 1000, 200, 40); x.fill(); x.fillStyle = '#ffd43b'; x.font = "800 120px 'Baloo 2', Arial"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('MENARA HITUNG', 500, 108);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })()}));
  papan.position.set(-LEBAR / 2 - 3, 1.6, LEBAR / 2 + 1); papan.rotation.y = -.6; g.add(papan); g.add(di(kotak(.25, 1.4, .25, '#8b5a2b', .04), -LEBAR / 2 - 3 - 2.8 * Math.cos(.6), .7, LEBAR / 2 + 1 + 2.8 * Math.sin(.6) - .1)); g.add(di(kotak(.25, 1.4, .25, '#8b5a2b', .04), -LEBAR / 2 - 3 + 2.8 * Math.cos(.6), .7, LEBAR / 2 + 1 - 2.8 * Math.sin(.6) - .1));
  P.sc.add(g);
}
function siapkanDunia() {
  siapPanggung({langit: '#a9dcff', bayangan: 34});
  P.sc.add(tanah('#7cc96b', 260));
  for (let i = 0; i < 70; i++) { const a = acak(0, Math.PI * 2), r = acak(17, 60); const t = pohon(acak(.9, 1.5)); t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); t.rotation.y = acak(0, 6); P.sc.add(t); }
  for (let i = 0; i < 14; i++) { const w = awan(acak(1.5, 3)); w.position.set(acak(-80, 80), acak(30, 70), acak(-80, -20)); P.sc.add(w); }
  bangunMenara(10);
}

// ---------- entitas: satu murid (HP) atau satu tim (layar, 3 avatar) ----------
function buatEnt(p) {
  hapusEnt(p);
  const g = new THREE.Group(); const warnaTim = p.tim >= 0 ? TIM[p.tim].warna : null; const avatar = [];
  if (SESI && SESI.mode === 'layar') {
    [[0, 0], [-.7, .55], [.7, .55]].forEach(([x, z], k) => { const s = buatSiswa(rupaTim(p.tim, k), warnaTim, .42); s.position.set(x, 0, z); g.add(s); avatar.push(s); });
  } else { const s = buatSiswa(p.rupa || rupaAcak(), warnaTim, .4); g.add(s); avatar.push(s); }
  const lb = labelNama(p.nama, warnaTim || 'rgba(255,255,255,.93)', warnaTim ? '#fff' : '#1d2b44'); lb.position.y = 2.55; lb.scale.multiplyScalar(SESI && SESI.mode === 'layar' ? 2 : 1.35); g.add(lb);
  g.userData = {avatar, label: lb, target: new THREE.Vector3(), jalan: false, terbang: false};
  if (PEMAIN.size > 30) ringanTokoh(g); // kelas besar: tanpa bayangan tokoh supaya laptop sekolah tetap lancar
  P.sc.add(g); M.ent.set(p.id, g); p.obj = g;
  aturPosisi(); g.position.copy(g.userData.target); return g;
}
function rupaTim(t, k) { const r = [{j: 'L', k: 1, g: 'cepak', w: 0}, {j: 'P', k: 2, g: 'hijab', w: 0}, {j: 'P', k: 0, g: 'kuncir', w: 1}, {j: 'L', k: 3, g: 'keriting', w: 0}, {j: 'P', k: 3, g: 'panjang', w: 0}, {j: 'L', k: 0, g: 'belah', w: 1}]; return r[(t * 2 + k) % r.length]; }
function hapusEnt(p) { const g = M.ent.get(p.id); if (g) { P.sc.remove(g); M.ent.delete(p.id); } p.obj = null; }
// hitung posisi tujuan semua entitas: per lantai, per petak (bila sudah menjawab) atau tersebar
function aturPosisi() {
  const per = new Map();
  PEMAIN.forEach(p => { const g = M.ent.get(p.id); if (!g) return; const j = SESI && SESI.no >= 0 && (SESI.fase === 'soal' || SESI.fase === 'buka') ? p.jawab[SESI.no] : null;
    const kunci = `${p.lantai}|${j ? j.h : '-'}`; if (!per.has(kunci)) per.set(kunci, []); per.get(kunci).push([p, g, j]); });
  const layar = SESI && SESI.mode === 'layar';
  per.forEach((daftar, kunci) => {
    const [lt, h] = kunci.split('|'); const y = (+lt) * TH + (h !== '-' ? .16 : 0);
    if (h !== '-') {
      const [cx, cz] = POS_PETAK[h]; const n = daftar.length, kol = Math.ceil(Math.sqrt(n)), jarak = layar ? 2.4 : Math.min(1.05, (PETAK - .8) / Math.max(1, kol - 1 || 1));
      daftar.forEach(([p, g], i) => { const r = Math.floor(i / kol), c = i % kol; g.userData.target.set(cx + (c - (kol - 1) / 2) * jarak, y, cz + (r - (Math.ceil(n / kol) - 1) / 2) * jarak); });
    } else {
      const n = daftar.length, kol = Math.ceil(Math.sqrt(n * 1.2)), jarak = layar ? 4.2 : Math.min(1.15, (LEBAR - 1.5) / Math.max(1, kol - 1 || 1));
      daftar.forEach(([p, g], i) => { const r = Math.floor(i / kol), c = i % kol; g.userData.target.set((c - (kol - 1) / 2) * jarak, y, (r - (Math.ceil(n / kol) - 1) / 2) * jarak + (layar ? 0 : .3)); });
    }
  });
  if (M.mode === 'lobi') { // di lobi: berkumpul di halaman depan menara
    const daftar = [...PEMAIN.values()].filter(p => M.ent.get(p.id)); const kol = Math.max(6, Math.ceil(Math.sqrt(daftar.length * 2.2)));
    daftar.forEach((p, i) => { const r = Math.floor(i / kol), c = i % kol; M.ent.get(p.id).userData.target.set((c - (kol - 1) / 2) * 1.35, 0, LEBAR / 2 + 3.6 + r * 1.35); });
  }
}
function majuEnt(dt) {
  M.ent.forEach(g => { const u = g.userData; if (u.terbang) { u.avatar.forEach(a => animTokoh(a, dt)); return; }
    const d = new THREE.Vector3().subVectors(u.target, g.position); d.y = 0; const jarak = d.length();
    if (Math.abs(u.target.y - g.position.y) > .01) g.position.y += (u.target.y - g.position.y) * Math.min(1, dt * 10);
    if (jarak > .05) { const v = Math.min(jarak, dt * 4.2); g.position.addScaledVector(d.normalize(), v); const arah = Math.atan2(d.x, d.z); u.avatar.forEach(a => { a.rotation.y = arah; if (a.userData.mode !== 'jalan') setMode(a, 'jalan'); }); u.jalan = true; }
    else if (u.jalan) { u.jalan = false; u.avatar.forEach(a => { setMode(a, 'diam'); a.rotation.y = Math.atan2(M.camPos.x - g.position.x, M.camPos.z - g.position.z); }); }
    u.avatar.forEach(a => animTokoh(a, dt));
  });
}

// ---------- kamera ----------
M.camPos = new THREE.Vector3(20, 10, 20);
function aturKamera(dt) {
  const c = M.cam;
  if (M.mode === 'main') {
    let lo = Infinity, hi = -Infinity; PEMAIN.forEach(p => { lo = Math.min(lo, p.lantai); hi = Math.max(hi, p.lantai); });
    if (!isFinite(lo)) { lo = 0; hi = 0; }
    c.ty = (lo + hi) / 2 * TH + .8; c.td = Math.max(17, ((hi - lo) * TH + 3) / .3 + 6) * Math.max(1, 1.25 / P.cam.aspect); c.th = .12 + Math.sin(performance.now() / 9000) * .18;
  } else if (M.mode === 'lobi') { c.ty = 2.4; c.td = 24; c.th += (0.0 - c.th) * Math.min(1, dt) + dt * 0; }
  else if (M.mode === 'podium') { c.ty = M.tinggi * TH + 1.6; c.td = 12; c.th += (.25 - c.th) * Math.min(1, dt * 2); }
  else { c.ty = M.tinggi * TH * .45; c.td = M.tinggi * TH * 1.35 + 20; c.th += dt * .06; }
  c.y += (c.ty - c.y) * Math.min(1, dt * 2); c.d += (c.td - c.d) * Math.min(1, dt * 2);
  const tinggiCam = M.mode === 'lobi' ? 6 : M.mode === 'podium' ? 2.6 : M.mode === 'main' ? c.d * .45 : c.d * .42;
  M.camPos.set(Math.sin(c.th) * c.d, c.y + tinggiCam, Math.cos(c.th) * c.d);
  const geser = M.mode === 'podium' ? 3.2 : 0; P.cam.position.copy(M.camPos); P.cam.position.x += geser; P.cam.lookAt(geser, c.y, M.mode === 'lobi' ? 4 : 0); ikutCahaya(0, c.y, 0);
}

// ---------- kait dari inti ----------
GAME.siapkan = () => { siapkanDunia(); for (let i = 0; i < 8; i++) { const s = buatSiswa(rupaAcak(), null, .32); s.position.set(acak(-5, 5), Math.floor(acak(0, 6)) * TH, acak(-5, 5)); s.rotation.y = acak(0, 6); P.sc.add(s); (M.hias = M.hias || []).push(s); } };
GAME.layarJudul = () => { M.mode = 'judul'; };
GAME.keMenu = () => { M.mode = 'judul'; PEMAIN.forEach(p => hapusEnt(p)); M.ent.forEach(g => P.sc.remove(g)); M.ent.clear(); (M.hias || []).forEach(s => { s.visible = true; }); if (M.tinggi !== 10) bangunMenara(10); };
GAME.siapLobi = () => { M.mode = 'lobi'; (M.hias || []).forEach(s => { s.visible = false; }); M.ent.forEach(g => P.sc.remove(g)); M.ent.clear(); PEMAIN.forEach(p => buatEnt(p)); aturPosisi(); };
GAME.pemainBaru = p => { if (M.mode === 'lobi' || M.mode === 'main') { const g = buatEnt(p); if (M.mode === 'lobi') { g.position.y = 6; } } };
GAME.pemainBerubah = p => { if (M.ent.has(p.id)) buatEnt(p); };
GAME.pemainHilang = p => { hapusEnt(p); aturPosisi(); };
GAME.mulai = (mode, n) => {
  M.mode = 'main'; (M.hias || []).forEach(s => { s.visible = false; }); bangunMenara(n);
  M.ent.forEach(g => P.sc.remove(g)); M.ent.clear(); PEMAIN.forEach(p => buatEnt(p)); aturPosisi(); M.ent.forEach(g => g.position.copy(g.userData.target));
};
GAME.soalBaru = () => { aturPosisi(); };
GAME.pilihJawaban = () => { aturPosisi(); };
GAME.bukaJawaban = async (kunci, hasil) => {
  aturPosisi(); await tunggu(.9);
  // petak salah runtuh (semua lantai)
  efek.runtuh();
  const runtuh = []; M.petak.forEach(pk => Object.values(pk).forEach(p => { if (p.userData.h !== kunci) runtuh.push(p); }));
  const cepat = new Set(); // entitas yang ikut jatuh
  hasil.forEach(({p, j, benar}) => { if (j && !benar && p.lantai > 0) cepat.add(p.id); });
  await animasi(.55, e => { runtuh.forEach(p => { p.position.y = p.userData.y0 - e * 1.4; p.rotation.z = e * .5 * (p.userData.h < 'C' ? 1 : -1); p.rotation.x = e * .25; });
    hasil.forEach(({p, j, benar}) => { if (j && !benar) { const g = M.ent.get(p.id); if (!g) return; g.userData.terbang = true; g.position.y = g.userData.target.y - e * (p.lantai > 0 ? TH : .5); g.userData.avatar.forEach(a => setMode(a, 'jatuh')); } }); }, t => t * t);
  // yang benar melompat naik
  efek.naik();
  hasil.forEach(({p, j, benar}) => { const g = M.ent.get(p.id); if (!g) return;
    if (benar) { p.lantai = Math.min(M.tinggi, p.lantai + 1); g.userData.avatar.forEach(a => setMode(a, 'senang', 1.6)); }
    else if (j) { p.lantai = Math.max(0, p.lantai - 1); g.userData.avatar.forEach(a => setMode(a, 'geleng', 1.2)); }
  });
  const awalY = new Map(); hasil.forEach(({p}) => { const g = M.ent.get(p.id); if (g) awalY.set(p.id, g.position.y); });
  await animasi(.8, (e, raw) => { hasil.forEach(({p, j, benar}) => { const g = M.ent.get(p.id); if (!g) return; if (benar) { g.userData.terbang = true; g.position.y = awalY.get(p.id) + e * TH + Math.sin(raw * Math.PI) * 1.4; } }); });
  hasil.forEach(({p, benar}) => { if (benar) { const g = M.ent.get(p.id); if (g) konfeti(g.position.clone().add(new THREE.Vector3(0, 1.5, 0)), SESI.mode === 'layar' ? 30 : 6); } });
  efek.benar();
  // petak kembali, semua ke posisi tersebar di lantai barunya
  await animasi(.5, e => runtuh.forEach(p => { p.position.y = p.userData.y0 - (1 - e) * 1.4; p.rotation.z *= (1 - e); p.rotation.x *= (1 - e); }));
  M.ent.forEach(g => { g.userData.terbang = false; });
  SESI.fase = 'hasil'; aturPosisi();
  await tunggu(.4);
};
GAME.podium = async (urut, st) => {
  M.mode = 'podium';
  const juara = st ? st.slice(0, 3).map(t => [...PEMAIN.values()].filter(p => p.tim === t.i).sort((a, b) => b.poin - a.poin)[0]).filter(Boolean) : urut.slice(0, 3);
  const tempat = [[0, 1.5], [-2.6, 1.0], [2.6, .6]];
  juara.forEach((p, i) => { const g = M.ent.get(p.id); if (!g) return; g.userData.terbang = true; g.position.set(tempat[i][0], M.tinggi * TH + tempat[i][1], -1.5); g.userData.target.copy(g.position);
    g.userData.avatar.forEach(a => { a.rotation.y = 0; setMode(a, 'senang', 99); }); if (st) g.userData.label.material.map = labelNama(st[i].nama, st[i].warna, '#fff').material.map; });
  await tunggu(.6); konfeti(new THREE.Vector3(0, M.tinggi * TH + 4, -1.5), 90); efek.kilau();
  await tunggu(2.4);
};
// lantai di atas murid dibuat seperti kaca supaya murid di bawahnya tetap terlihat
function aturKaca(dt) {
  if (!M.lapis) return; let lo = Infinity, hi = -Infinity;
  if (M.mode === 'main') PEMAIN.forEach(p => { lo = Math.min(lo, p.lantai); hi = Math.max(hi, p.lantai); });
  M.lapis.forEach((ls, i) => {
    const target = (i > lo && i <= hi + 1 && i < M.tinggi) ? .28 : 1;
    ls.forEach(m => { const mt = m.material; const a0 = mt.userData.a0 ?? (mt.userData.a0 = mt.opacity);
      const cur = mt.userData.f ?? 1, f = cur + (target - cur) * Math.min(1, dt * 3); mt.userData.f = f;
      mt.transparent = f < .999 || m.geometry.type === 'PlaneGeometry'; mt.opacity = a0 * f; mt.depthWrite = f > .9; m.castShadow = f > .9; });
  });
}
GAME.update = dt => { aturKaca(dt); if (M.ent.size) majuEnt(dt); (M.hias || []).forEach(s => s.visible && animTokoh(s, dt)); aturKamera(dt); };
jalankan();

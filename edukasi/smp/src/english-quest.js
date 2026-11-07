// ENGLISH QUEST (Bahasa Inggris SMP): balapan jalan kota.
// Jalan dibagi 4 lajur warna A-D. Murid/tim pindah ke lajur jawabannya.
// Jawaban benar berlari maju satu blok menuju toko roti di garis finis; yang salah tersandung di tempat.
// Bisa kelompok di satu layar (2-4 tim) atau satu kelas lewat HP.
Object.assign(GAME, {
  id: 'english-quest', judul: 'English Quest',
  ajak: 'Pilih jawaban bahasa Inggris yang tepat, lari menyusuri kota, dan sampai duluan di garis finis!',
  labelJumlah: 'Jumlah soal (= panjang jalan)',
  ukuranTokoh: {skala: .45, labelY: 2.8},
  bantuan: `<ol><li>Soal bahasa Inggris muncul dengan 4 pilihan: <b>A</b> merah, <b>B</b> biru, <b>C</b> kuning, <b>D</b> hijau.</li>
    <li>Pilih jawaban. Avatar pindah ke lajur jalan warna yang sama.</li>
    <li>Saat jawaban dibuka, <b>jawaban benar berlari maju 1 blok</b>. Jawaban salah tersandung dan tetap di tempat.</li>
    <li>Poin: benar 500, ditambah bonus kecepatan. Siapa paling dekat ke garis finis paling unggul.</li>
    <li><b>Kelompok di layar ini:</b> tiap tim menekan tombol warnanya, atau keyboard (Tim Merah 1 2 3 4, Biru Q W E R, Kuning A S D F, Hijau Z X C V).</li>
    <li><b>Satu kelas lewat HP:</b> murid scan QR di layar, lalu menjawab di HP.</li></ol>`,
  musik: {bpm: 124, nada: 64, alat: 'marimba', progresi: [0, 4, 5, 3], benih: 45},
  teksMaju: p => `Blok ${p.lantai} dari ${SESI ? SESI.soal.length : '?'} 🏃`,
});

const WH = {A: '#e8453c', B: '#2f80ed', C: '#f2a20c', D: '#27ae60'};
const LAJUR = {A: -4.5, B: -1.5, C: 1.5, D: 4.5}, LW = 3, BLOK = 4.4;
Object.assign(M, {jalan: null, panjang: 10, finis: 0, podium: null});
const xBlok = i => i * BLOK + BLOK / 2;

// ---------- dunia ----------
const TOKO = [['BAKERY', '#f08c00'], ['LIBRARY', '#5c7cfa'], ['SCHOOL', '#e03131'], ['MARKET', '#2f9e44'], ['HOSPITAL', '#f1f3f5'], ['POST OFFICE', '#e8590c'],
  ['MUSEUM', '#adb5bd'], ['CAFE', '#9c36b5'], ['BUS STOP', '#1c7ed6'], ['ZOO', '#66a80f'], ['BANK', '#495057'], ['PARK', '#40c057']];
function rumahToko(nama, warna, lebar = 5) {
  const g = new THREE.Group(); const tinggi = acak(3.6, 5.2);
  g.add(di(kotak(lebar, tinggi, 4, warna, .06), 0, tinggi / 2, 0)); g.add(di(kotak(lebar + .4, .5, 4.4, variasi('#8d6e63', .05), .06), 0, tinggi + .25, 0));
  g.add(di(kotak(1.2, 2, .1, '#5c3d2e', .03), 0, 1, 2.02));
  [-1, 1].forEach(s => g.add(di(kotak(1, 1, .1, '#d0ebff', .03), s * (lebar / 2 - 1), 2.2, 2.02)));
  const p = papanNama(nama, lebar - .6, .8, '#1d2b44', '#ffffff'); p.position.set(0, tinggi - .6, 2.06); g.add(p); return g;
}
function bangunJalan(n) {
  if (M.jalan) P.sc.remove(M.jalan);
  const g = new THREE.Group(); M.jalan = g; M.panjang = n; const L = (n + 1) * BLOK + 6; M.finis = (n) * BLOK + BLOK / 2;
  g.add(di(kotak(L + 8, .1, 14, '#495057', .02), L / 2 - 4, .05, 0));
  Object.entries(LAJUR).forEach(([h, z]) => { const s = kotak(L, .04, LW - .25, WH[h], .02, {transparent: true, opacity: .55}); s.position.set(L / 2 - 2, .12, z); s.castShadow = false; g.add(s); });
  for (let i = 0; i <= n; i++) { const x = i * BLOK; g.add(di(kotak(.18, .05, 12, '#f8f9fa', .02), x, .15, 0));
    if (i < n) { Object.entries(LAJUR).forEach(([h, z]) => { const t = hurufLantai(h, 1.1); t.position.set(xBlok(i), .16, z); g.add(t); });
      const nb = papanNama(String(i + 1), 1, .6, '#f8f9fa', '#1d2b44'); nb.rotation.x = -Math.PI / 2; nb.position.set(xBlok(i), .17, 6.6); g.add(nb); } }
  // trotoar
  [-7.6, 7.6].forEach(z => g.add(di(kotak(L + 8, .3, 1.4, '#ced4da', .03), L / 2 - 4, .15, z)));
  // toko di sisi belakang
  for (let x = -6, i = 0; x < L + 8; x += 6, i++) { const [nm, w] = TOKO[i % TOKO.length]; const r = rumahToko(nm, variasi(w, .04)); r.position.set(x, 0, -11); g.add(r); }
  // lampu jalan & pohon di sisi depan (rendah, tidak menghalangi kamera)
  for (let x = -4; x < L + 6; x += 8) { g.add(di(kotak(.15, 3, .15, '#343a40', .03), x, 1.5, 8.6)); const l = di(kotak(.6, .3, .6, '#fff3bf', .08, {emissive: '#ffd43b', emissiveIntensity: .4}), x, 3.1, 8.6); g.add(l); const tr = pohon(.8); tr.position.set(x + 4, 0, 9.6); g.add(tr); }
  // gerbang finis
  const gf = new THREE.Group(); gf.position.set(n * BLOK, 0, 0); g.add(gf);
  [-7.6, 7.6].forEach(z => { gf.add(di(kotak(.3, 3.4, .3, '#f8f9fa', .06), 0, 1.7, z)); gf.add(di(kotak(1.4, .9, .08, '#e03131', .03), .7, 3, z)); });
  const fb = papanNama('FINISH', 4, 1, '#e03131', '#ffffff'); fb.position.set(0, 4.2, -7.6); gf.add(fb);
  for (let i = 0; i < 24; i++) g.add(di(kotak(.5, .06, .5, (i + Math.floor(i / 12)) % 2 ? '#212529' : '#f8f9fa', .01), n * BLOK + Math.floor(i / 12) * .5, .17, -5.75 + (i % 12)));
  // garis start
  const st = papanNama('START', 3, .8, '#1d2b44', '#ffd43b'); st.position.set(0, 2.6, -7.6); g.add(st); g.add(di(kotak(.15, 2.2, .15, '#343a40', .03), 0, 1.1, -7.6));
  P.sc.add(g);
}
function siapkanDunia() {
  siapPanggung({langit: '#bfe3ff', bayangan: 40});
  P.sc.add(tanah('#86c96b', 320));
  for (let i = 0; i < 40; i++) { const t = pohon(acak(1, 1.6)); t.position.set(acak(-60, 120), 0, acak(-60, -18)); P.sc.add(t); }
  for (let i = 0; i < 12; i++) { const w = awan(acak(1.5, 3)); w.position.set(acak(-40, 120), acak(25, 50), acak(-90, -40)); P.sc.add(w); }
  bangunJalan(10);
}

// ---------- posisi ----------
function jawabanKini(p) { return SESI && SESI.no >= 0 && SESI.fase !== 'mulai' && SESI.fase !== 'akhir' ? p.jawab[SESI.no] : null; }
function aturPosisi() {
  const layar = SESI && SESI.mode === 'layar'; const per = new Map();
  PEMAIN.forEach(p => { const g = M.ent.get(p.id); if (!g) return; const j = M.mode === 'main' ? jawabanKini(p) : null; const k = `${M.mode === 'lobi' ? 0 : p.lantai}|${j ? j.h : '-'}`; if (!per.has(k)) per.set(k, []); per.get(k).push(g); });
  per.forEach((daftar, k) => { const [b, h] = k.split('|'); const x = xBlok(+b);
    if (h === '-') susunKotak(daftar, x, 0, BLOK - .6, 11, .1, layar ? 2.6 : 1.1);
    else susunKotak(daftar, x, LAJUR[h], BLOK - .6, LW - .6, .1, layar ? 2.4 : .95); });
  M.ent.forEach(g => { g.userData.arah = 0; });
}

// ---------- kamera ----------
function aturKamera(dt) {
  const c = M.cam, a = P.cam.aspect;
  if (M.mode === 'main' || M.mode === 'lobi') {
    let lo = Infinity, hi = -Infinity; PEMAIN.forEach(p => { const b = M.mode === 'lobi' ? 0 : p.lantai; lo = Math.min(lo, b); hi = Math.max(hi, b); }); if (!isFinite(lo)) { lo = hi = 0; }
    const lebar = (hi - lo) * BLOK + BLOK * 2.6, perluD = Math.max(lebar / (2 * Math.tan(18 * Math.PI / 180) * a), 15 / (2 * Math.tan(18 * Math.PI / 180)));
    Object.assign(c, {tx: (xBlok(lo) + xBlok(hi)) / 2, ty: .5, tz: .6, td: perluD * 1.02, tinggi: .7, th: 0});
  } else if (M.mode === 'podium') Object.assign(c, {tx: M.finis + 5.5 + 2.2, ty: 2.2, tz: 0, td: 13.5 * Math.max(1, 1.45 / a), tinggi: .22, th: 0});
  else { c.th = .25; Object.assign(c, {tx: 14 + Math.sin(performance.now() / 7000) * 12, ty: 1, tz: 0, td: 26, tinggi: .5}); }
  gerakKamera(dt, {sway: M.mode === 'judul' ? 0 : .06});
}

// ---------- kait ----------
pasangHookUmum({aturPosisi, siapkanDunia, hiasan: 10});
GAME.letakHias = hias => hias.forEach((s, i) => { s.position.set(acak(2, 40), .1, pilih(Object.values(LAJUR))); s.rotation.y = Math.PI / 2; s.userData.lari = acak(2, 3.5); });
GAME.reset = () => { if (M.panjang !== 10) bangunJalan(10); if (M.podium) { P.sc.remove(M.podium); M.podium = null; } };
GAME.mulai = (mode, n) => {
  M.mode = 'main'; (M.hias || []).forEach(s => { s.visible = false; }); if (M.podium) { P.sc.remove(M.podium); M.podium = null; }
  bangunJalan(n); M.ent.forEach(g => P.sc.remove(g)); M.ent.clear(); PEMAIN.forEach(p => buatEnt(p, GAME.ukuranTokoh)); aturPosisi(); M.ent.forEach(g => g.position.copy(g.userData.target));
};
GAME.bukaJawaban = async (kunci, hasil) => {
  aturPosisi(); await tunggu(.9); efek.gong();
  // lajur benar menyala
  const sorot = kotak(M.panjang * BLOK + 4, .06, LW - .2, '#fff3bf', .02, {emissive: WH[kunci], emissiveIntensity: .9, transparent: true, opacity: .7}); sorot.position.set((M.panjang * BLOK) / 2, .18, LAJUR[kunci]); sorot.castShadow = false; M.jalan.add(sorot);
  await tunggu(.5);
  hasil.forEach(({p, j, benar}) => { const g = M.ent.get(p.id); if (!g) return;
    if (benar) { p.lantai = Math.min(M.panjang, p.lantai + 1); g.userData.avatar.forEach(a => setMode(a, 'senang', 1.2)); }
    else if (j) { g.userData.avatar.forEach(a => setMode(a, 'jatuh', .8)); asap(g.position.clone().add(new THREE.Vector3(0, .2, 0)), '#ced4da', 5, .4); } });
  efek.naik(); aturPosisi(); // yang benar berlari maju
  await tunggu(1.4);
  hasil.forEach(({p, benar}) => { if (benar) { const g = M.ent.get(p.id); if (g) konfeti(g.position.clone().add(new THREE.Vector3(0, 1.5, 0)), SESI.mode === 'layar' ? 24 : 4); } });
  efek.benar(); await tunggu(.5); M.jalan.remove(sorot);
};
GAME.soalBaru = () => { aturPosisi(); };
GAME.podium = async (urut, st) => {
  M.mode = 'podium';
  const px = M.finis + 5.5;
  if (!M.podium) { const pod = new THREE.Group(); pod.position.set(px, 0, 0); P.sc.add(pod); M.podium = pod;
    [[0, 1.5, '#ffd43b', '1'], [-2.6, 1.0, '#ced4da', '2'], [2.6, .6, '#e8a25a', '3']].forEach(([x, h, c, nm]) => { pod.add(di(kotak(2.4, h, 2.4, c, .1), x, h / 2, 0)); const t = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({map: teksKanvas(nm, null, '#1d2b44'), transparent: true})); t.position.set(x, h / 2, 1.21); pod.add(t); });
    const tr = rumahToko('BAKERY', '#f08c00', 8); tr.position.set(0, 0, -5); pod.add(tr); }
  const juara = st ? st.slice(0, 3).map(t => [...PEMAIN.values()].filter(p => p.tim === t.i).sort((a, b) => b.poin - a.poin)[0]).filter(Boolean) : urut.slice(0, 3);
  const tempat = [[0, 1.5], [-2.6, 1.0], [2.6, .6]];
  M.ent.forEach((g, id) => { if (!juara.some(p => p.id === id)) g.visible = false; });
  juara.forEach((p, i) => { const g = M.ent.get(p.id); if (!g) return; g.visible = true; g.userData.terbang = true; g.position.set(px + tempat[i][0], tempat[i][1], 0); g.userData.target.copy(g.position);
    g.userData.avatar.forEach(a => { a.rotation.y = 0; setMode(a, 'senang', 99); }); if (st) g.userData.label.material.map = labelNama(st[i].nama, st[i].warna, '#fff').material.map; });
  await tunggu(.6); konfeti(new THREE.Vector3(px, 4, 0), 90); efek.kilau(); await tunggu(2.4);
};
GAME.update = (dt) => {
  updateAsap(dt);
  if (M.ent.size) majuEnt(dt, 6);
  (M.hias || []).forEach(s => { if (!s.visible) return; s.position.x += s.userData.lari * dt; if (s.position.x > 46) s.position.x = 0; if (s.userData.mode !== 'jalan') setMode(s, 'jalan'); animTokoh(s, dt); });
  aturKamera(dt);
};
jalankan();

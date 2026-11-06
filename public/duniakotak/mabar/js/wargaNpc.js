// WARGA OFFLINE JADI NPC (Huda 6 Nov 2026): warga yang sedang tidak main tetap terlihat di desa sebagai NPC
// (avatar & username mereka sendiri, berlabel 💤 offline supaya jujur: bukan orangnya yang menggerakkan).
// - Biasa: mondar-mandir pelan di depan rumahnya sendiri, sesekali berhenti.
// - Ada pembangunan fasum hasil voting: sebagian ikut GOTONG ROYONG di lahan proyek (melingkar, mengayun palu/cangkul).
// - Begitu warga itu online, NPC-nya disembunyikan dan avatar aslinya yang bergerak (dikendalikan pemain).
// Tidak ada obrolan/gelembung dari NPC ini (tidak boleh berbicara atas nama warga asli).
import * as THREE from 'three';

// ---- perlengkapan TUKANG saat gotong royong (Huda 6 Nov 2026): helm proyek + alat di tangan kanan ----
const mat = c => new THREE.MeshStandardMaterial({color: c, roughness: .7});
const kotak = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); m.castShadow = true; return m; };
function alat(jenis) {
  const g = new THREE.Group(); g.position.set(0, -1.25, .05);   // di genggaman (ujung lengan)
  if (jenis === 'palu') { g.add(kotak(.12, .12, 1.1, 0x8a5a2a, 0, 0, .45), kotak(.5, .28, .28, 0x55585e, 0, 0, .95)); }
  else if (jenis === 'gergaji') { g.add(kotak(.2, .35, .3, 0xd04a2a, 0, 0, .15), kotak(.05, .42, 1.5, 0xc8ccd2, 0, -.05, 1.0)); }
  else if (jenis === 'cangkul') { g.add(kotak(.12, .12, 1.9, 0x8a5a2a, 0, 0, .7), kotak(.6, .5, .08, 0x6a6e74, 0, -.25, 1.6)); }
  else if (jenis === 'kayu') { g.position.set(0, -1.15, .1); g.add(kotak(.35, .25, 3.2, 0xc89060, 0, .1, .2)); }
  g.userData.alat = 1; return g;
}
function pakaiTukang(obj, jenis) {
  const u = obj.userData; if (u.tukang === jenis) return; lepasTukang(obj);
  const helm = new THREE.Group(); helm.add(kotak(1.16, .34, 1.16, 0xf2c230, 0, 1.16, 0), kotak(1.0, .07, .45, 0xf2c230, 0, 1.0, .72)); helm.userData.alat = 1;
  u.head.add(helm); const a = alat(jenis); u.armR.add(a);
  const rompi = kotak(1.18, .95, .76, 0xff7a1a, 0, .62, 0); rompi.userData.alat = 1; u.body.add(rompi);   // rompi proyek oranye
  u.tukang = jenis; u.perl = [helm, a, rompi];
}
function lepasTukang(obj) { const u = obj.userData; (u.perl || []).forEach(m => m.parent?.remove(m)); u.perl = null; u.tukang = null; }
const PERAN = ['palu', 'gergaji', 'kayu', 'palu', 'cangkul', 'kayu', 'gergaji', 'palu'];

export function buatWargaNPC({sc, I, VS, warga, pose, siapAv, tinggi, bayangan}) {
  const daftar = [];   // {no, u, obj, mode, ...}
  let proyek = null;   // {x, z} pusat lahan pembangunan, atau null
  let biji = 7; const acak = () => { biji = (biji * 16807) % 2147483647; return (biji - 1) / 2147483646; };
  const MAKS_TAMPIL = 12, MAKS_GOTONG = 16;
  // Berdiri DI ATAS lantai fasum/fondasi, bukan tenggelam (Huda 6 Nov 2026, aturan sama seperti NPC fasum PR #91):
  // naik bertahap dari tanah ke permukaan pijakan tertinggi yang terjangkau langkah.
  const pijak = (x, z) => { let y = tinggi(x, z); for (let i = 0; i < 4; i++) { const y2 = tinggi(x, z, y); if (y2 <= y) break; y = y2; } return y; };

  function isi(list) {
    for (const w of list) {
      const L = I.lots[w.no]; if (!L || daftar.some(d => d.no === w.no)) continue;
      let obj; try { obj = warga(siapAv(w.av)); } catch (e) { continue; }
      obj.traverse(m => { if (m.isMesh) { m.castShadow = bayangan; m.receiveShadow = false; } });
      obj.visible = false; sc.add(obj);
      // titik depan rumah (jalan di depan gerbang); mondar-mandir di sekitar sini
      const rumah = new THREE.Vector3(L.gate.x, 0, L.gate.z + L.dir * 1.2 * VS);
      const n = {no: w.no, u: w.u, obj, rumah, dir: L.dir, ph: acak() * 6, tunggu: acak() * 3, tuju: null, jauh: 1e9, gotong: -1};
      obj.position.copy(rumah); obj.position.y = pijak(rumah.x, rumah.z);
      obj.rotation.y = L.dir === 1 ? 0 : Math.PI;
      daftar.push(n);
    }
    aturGotong();
  }
  // pilih siapa yang ikut gotong royong (yang paling baru main lebih dulu, sesuai urutan dari server)
  function aturGotong() {
    let k = 0;
    for (const n of daftar) {
      if (proyek && k < MAKS_GOTONG) {
        const peran = PERAN[k % PERAN.length], i = k++;
        n.gotong = i; n.peran = peran; pakaiTukang(n.obj, peran);
        // titik kerja di lahan proyek (satuan aset fasum × VS, pusat lahan = proyek): tepi fondasi & perancah
        const L = (x, z) => new THREE.Vector3(proyek.x + x * VS, 0, proyek.z + z * VS);
        if (peran === 'kayu') {
          // pengangkut: mondar-mandir dari tumpukan kayu/bata ke perancah
          n.rute = [L(-3.6 + (i % 3) * .8, 4.6), L(-4 + (i * 2.3) % 8, 1.2)]; n.ri = i % 2; n.titik = n.rute[n.ri].clone();
        } else {
          const tepi = [[-5.8, -6.8], [-2.5, 1.3], [2.5, 1.3], [5.8, -6.8], [-6, -1], [6, -1], [0, -7], [-3.5, -7], [3.5, -7], [4.6, 3.6], [-6.5, 3.4]];
          const [x, z] = tepi[i % tepi.length]; n.titik = L(x, z); n.rute = null;
          n.hadap = peran === 'gergaji' ? L(x + 1, z) : L(0, -2.4);
          if (peran === 'gergaji' && !n.kuda) {   // kuda-kuda + papan yang sedang digergaji
            const kd = new THREE.Group(); kd.add(kotak(.25, 1.6, .25, 0x7a5a3a, -1, .8, 0), kotak(.25, 1.6, .25, 0x7a5a3a, 1, .8, 0), kotak(3.4, .22, .7, 0xc89060, 0, 1.7, 0));
            kd.scale.setScalar(.85); kd.position.copy(L(x + .75, z)); kd.position.y = pijak(kd.position.x, kd.position.z); kd.rotation.y = Math.PI / 2; sc.add(kd); n.kuda = kd;
          }
        }
        n.obj.position.copy(n.titik); n.obj.position.y = pijak(n.titik.x, n.titik.z);
      } else if (n.gotong >= 0 || n.obj.userData.tukang) { n.gotong = -1; lepasTukang(n.obj); if (n.kuda) { sc.remove(n.kuda); n.kuda = null; } n.obj.position.copy(n.rumah); n.obj.position.y = pijak(n.rumah.x, n.rumah.z); n.tuju = null; }
    }
  }
  function setProyek(p) {
    const baru = p ? {x: p.x, z: p.z} : null;
    if ((proyek && baru && proyek.x === baru.x && proyek.z === baru.z) || (!proyek && !baru)) return;
    proyek = baru; aturGotong();
  }
  const hadapi = (o, x, z, a) => { let dr = Math.atan2(x - o.position.x, z - o.position.z) - o.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); o.rotation.y += dr * a; };
  let tUrut = 0;
  // online: Set nomor warga yang sedang main (avatar asli tampil), sayaNo: nomor pemain ini
  function update(dt, me, online, sayaNo, kec) {
    tUrut -= dt;
    if (tUrut <= 0) {
      tUrut = .8;
      for (const n of daftar) n.jauh = Math.hypot(n.obj.position.x - me.position.x, n.obj.position.z - me.position.z);
      const calon = daftar.filter(n => !online.has(n.no) && n.no !== sayaNo && n.jauh < 140).sort((a, b) => a.jauh - b.jauh).slice(0, MAKS_TAMPIL);
      const tampil = new Set(calon); for (const n of daftar) { n.obj.visible = tampil.has(n); if (n.kuda) n.kuda.visible = n.jauh < 140; }
    }
    for (const n of daftar) {
      const o = n.obj; if (!o.visible) continue;
      n.ph += dt;
      if (n.gotong >= 0) {
        if (n.rute) {
          // tukang angkut kayu: jalan bolak-balik, berhenti sebentar di tiap ujung
          if (n.tunggu > 0) { n.tunggu -= dt; pose(o, {armR: -.5, armRz: -.2, armL: -.5}); continue; }
          const t = n.rute[n.ri], dx = t.x - o.position.x, dz = t.z - o.position.z, l = Math.hypot(dx, dz), sp = kec * .32 * dt;
          if (l <= sp) { n.ri = 1 - n.ri; n.tunggu = 1.5 + acak() * 2; } else { o.position.x += dx / l * sp; o.position.z += dz / l * sp; hadapi(o, t.x, t.z, Math.min(1, dt * 8)); }
          o.position.y = pijak(o.position.x, o.position.z);
          const a = Math.sin(n.ph * 8) * .55; pose(o, {legL: a, legR: -a, armR: -.5, armRz: -.2, armL: -.5});   // kedua tangan menahan kayu di depan
          continue;
        }
        hadapi(o, n.hadap.x, n.hadap.z, Math.min(1, dt * 6));
        const a = Math.sin(n.ph * 6 + n.gotong);
        if (n.peran === 'palu') pose(o, {armR: -1.6 - Math.max(0, a) * 1.2, armL: -.9, head: .3});              // ketok-ketok palu
        else if (n.peran === 'gergaji') pose(o, {armR: -1.25 + a * .35, armL: -1.1, head: .35});                 // menggergaji maju-mundur
        else pose(o, {armL: -1.9 + a * .9, armR: -1.9 + a * .9, head: .25});                                     // mencangkul
        continue;
      }
      // mondar-mandir di depan rumah sendiri
      if (n.tunggu > 0) { n.tunggu -= dt; pose(o, {head: Math.sin(n.ph * .6) * .25}); continue; }
      if (!n.tuju) { const g = (acak() * 2 - 1) * 2.6 * VS; n.tuju = new THREE.Vector3(n.rumah.x + g, 0, n.rumah.z + (acak() - .5) * .6 * VS); }
      const dx = n.tuju.x - o.position.x, dz = n.tuju.z - o.position.z, l = Math.hypot(dx, dz), s = kec * .3 * dt;
      if (l <= s) { o.position.x = n.tuju.x; o.position.z = n.tuju.z; n.tuju = null; n.tunggu = 2 + acak() * 5; if (acak() < .5) o.rotation.y = n.dir === 1 ? Math.PI : 0; }
      else { o.position.x += dx / l * s; o.position.z += dz / l * s; hadapi(o, n.tuju.x, n.tuju.z, Math.min(1, dt * 8)); }
      o.position.y = pijak(o.position.x, o.position.z);
      const a = Math.sin(n.ph * 8) * .6; pose(o, {legL: a, legR: -a, armL: -a * .7, armR: a * .7});
    }
  }
  return {daftar, isi, update, setProyek, proyek: () => proyek};
}

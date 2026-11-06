// WARGA OFFLINE JADI NPC (Huda 6 Nov 2026): warga yang sedang tidak main tetap terlihat di desa sebagai NPC
// (avatar & username mereka sendiri, berlabel 💤 offline supaya jujur: bukan orangnya yang menggerakkan).
// - Biasa: mondar-mandir pelan di depan rumahnya sendiri, sesekali berhenti.
// - Ada pembangunan fasum hasil voting: sebagian ikut GOTONG ROYONG di lahan proyek (melingkar, mengayun palu/cangkul).
// - Begitu warga itu online, NPC-nya disembunyikan dan avatar aslinya yang bergerak (dikendalikan pemain).
// Tidak ada obrolan/gelembung dari NPC ini (tidak boleh berbicara atas nama warga asli).
import * as THREE from 'three';

export function buatWargaNPC({sc, I, VS, warga, pose, siapAv, tinggi, bayangan}) {
  const daftar = [];   // {no, u, obj, mode, ...}
  let proyek = null;   // {x, z} pusat lahan pembangunan, atau null
  let biji = 7; const acak = () => { biji = (biji * 16807) % 2147483647; return (biji - 1) / 2147483646; };
  const MAKS_TAMPIL = 12, MAKS_GOTONG = 16;

  function isi(list) {
    for (const w of list) {
      const L = I.lots[w.no]; if (!L || daftar.some(d => d.no === w.no)) continue;
      let obj; try { obj = warga(siapAv(w.av)); } catch (e) { continue; }
      obj.traverse(m => { if (m.isMesh) { m.castShadow = bayangan; m.receiveShadow = false; } });
      obj.visible = false; sc.add(obj);
      // titik depan rumah (jalan di depan gerbang); mondar-mandir di sekitar sini
      const rumah = new THREE.Vector3(L.gate.x, 0, L.gate.z + L.dir * 1.2 * VS);
      const n = {no: w.no, u: w.u, obj, rumah, dir: L.dir, ph: acak() * 6, tunggu: acak() * 3, tuju: null, jauh: 1e9, gotong: -1};
      obj.position.copy(rumah); obj.position.y = tinggi(rumah.x, rumah.z);
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
        const sudut = (k / Math.min(MAKS_GOTONG, daftar.length)) * Math.PI * 2, r = (4.2 + (k % 2) * 1.6) * VS;
        n.gotong = k++; n.titik = new THREE.Vector3(proyek.x + Math.cos(sudut) * r, 0, proyek.z + Math.sin(sudut) * r);
        n.obj.position.copy(n.titik); n.obj.position.y = tinggi(n.titik.x, n.titik.z);
        n.obj.rotation.y = Math.atan2(proyek.x - n.titik.x, proyek.z - n.titik.z);
      } else if (n.gotong >= 0) { n.gotong = -1; n.obj.position.copy(n.rumah); n.obj.position.y = tinggi(n.rumah.x, n.rumah.z); n.tuju = null; }
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
      const tampil = new Set(calon); for (const n of daftar) n.obj.visible = tampil.has(n);
    }
    for (const n of daftar) {
      const o = n.obj; if (!o.visible) continue;
      n.ph += dt;
      if (n.gotong >= 0) {
        // gotong royong: menghadap lahan proyek, mengayun palu/cangkul bergantian
        hadapi(o, proyek.x, proyek.z, Math.min(1, dt * 6));
        const a = Math.sin(n.ph * 5 + n.gotong);
        if (n.gotong % 3 === 0) pose(o, {armL: -1.8 + a * .8, armR: -1.8 + a * .8, head: .25});         // mencangkul
        else if (n.gotong % 3 === 1) pose(o, {armR: -2.4 + Math.max(0, a) * 1.6, armL: -.6, head: .15}); // memalu
        else pose(o, {armL: -1.2, armR: -1.2, head: Math.sin(n.ph * .7) * .2});                           // mengangkat bahan
        continue;
      }
      // mondar-mandir di depan rumah sendiri
      if (n.tunggu > 0) { n.tunggu -= dt; pose(o, {head: Math.sin(n.ph * .6) * .25}); continue; }
      if (!n.tuju) { const g = (acak() * 2 - 1) * 2.6 * VS; n.tuju = new THREE.Vector3(n.rumah.x + g, 0, n.rumah.z + (acak() - .5) * .6 * VS); }
      const dx = n.tuju.x - o.position.x, dz = n.tuju.z - o.position.z, l = Math.hypot(dx, dz), s = kec * .3 * dt;
      if (l <= s) { o.position.x = n.tuju.x; o.position.z = n.tuju.z; n.tuju = null; n.tunggu = 2 + acak() * 5; if (acak() < .5) o.rotation.y = n.dir === 1 ? Math.PI : 0; }
      else { o.position.x += dx / l * s; o.position.z += dz / l * s; hadapi(o, n.tuju.x, n.tuju.z, Math.min(1, dt * 8)); }
      o.position.y = tinggi(o.position.x, o.position.z, o.position.y);
      const a = Math.sin(n.ph * 8) * .6; pose(o, {legL: a, legR: -a, armL: -a * .7, armR: a * .7});
    }
  }
  return {daftar, isi, update, setProyek, proyek: () => proyek};
}

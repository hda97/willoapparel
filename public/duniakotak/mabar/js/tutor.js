// Tutorial Raka (Huda 13 Nov 2026: "Tutorial ada suaranya raka ada animasinya raka").
// Kartu singkat beberapa langkah: Raka 3D (avatar warga No. 1) bicara dengan suara rekaman (aset/raka/tutor-N.mp3),
// mengangguk saat bicara, melambai / menunjuk tombol yang sedang dijelaskan (cincin sorot). Bisa dilewati, dibuka lagi dari ⚙️ Atur.
import * as THREE from 'three';
import {warga, pose} from './aset/avatar.js';
import {raka, pose as rpose} from './lib.js';

let R = null;   // {r, sc, cam, obj, av}
function siapkan(av) {
  const kanvas = document.getElementById('tutorRaka');
  if (!R) {
    const r = new THREE.WebGLRenderer({canvas: kanvas, alpha: true, antialias: true});
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.setSize(132, 168, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(3, 6, 8); sc.add(sun);
    const cam = new THREE.PerspectiveCamera(30, 132 / 168, .1, 100); cam.position.set(0, 3.0, 10.5); cam.lookAt(0, 2.55, 0);
    R = {r, sc, cam, obj: null, av: null};
  }
  const kunci = av ? JSON.stringify(av) : 'npc';
  if (!R.obj || R.av !== kunci) {
    if (R.obj) R.sc.remove(R.obj);
    let o = null, np = false;
    try { if (av) o = warga(av); } catch (e) { o = null; }
    if (!o) { o = raka('senang'); np = true; }
    o.userData.np = np; R.obj = o; R.av = kunci; R.sc.add(o);
  }
}
const posekan = (o, p) => (o.userData.np ? rpose : pose)(o, p);

// opsi: {langkah: [{teks, suara, gaya: 'lambai'|'tunjuk'|'jelas', sorot: () => Element|null}], av, suara: () => bool,
//        labelAkhir, akhir(selesai: bool), redam(bool)}
export function bukaTutor(opsi) {
  const L = opsi.langkah, el = document.getElementById('tutor'), ring = document.getElementById('tutorSorot');
  const $ = id => document.getElementById(id);
  siapkan(opsi.av);
  let i = 0, audio = null, bicaraSampai = 0, hidup = true, raf = 0;
  const t0 = performance.now();
  const henti = () => { if (audio) { audio.pause(); audio = null; } };
  const putar = () => {
    henti(); const s = L[i];
    bicaraSampai = performance.now() + Math.max(2500, s.teks.length * 60);   // tanpa suara: tetap "bicara" sesuai panjang teks
    if (!s.suara || (opsi.suara && !opsi.suara())) return;
    audio = new Audio(s.suara); audio.volume = 1;
    audio.onplaying = () => { bicaraSampai = performance.now() + (audio.duration || 8) * 1000; };
    audio.onended = () => { bicaraSampai = 0; };
    audio.play().catch(() => {});
    const n = L[i + 1]; if (n && n.suara) { const a = new Audio(); a.preload = 'auto'; a.src = n.suara; }
  };
  const tampil = () => {
    const s = L[i];
    $('tutorTeks').textContent = s.teks;
    $('tutorNo').textContent = `${i + 1}/${L.length}`;
    $('tutorTitik').innerHTML = L.map((_, k) => `<i class="${k === i ? 'on' : k < i ? 'lewat' : ''}"></i>`).join('');
    $('tutorLanjut').textContent = i === L.length - 1 ? opsi.labelAkhir || 'Siap main!' : 'Lanjut ▶';
    $('tutorLewati').hidden = i === L.length - 1;
    $('tutorKembali').hidden = i === 0;
    putar();
  };
  const tutup = selesai => {
    if (!hidup) return; hidup = false; henti(); cancelAnimationFrame(raf);
    el.hidden = true; ring.hidden = true; opsi.redam && opsi.redam(false);
    opsi.akhir && opsi.akhir(selesai);
  };
  $('tutorLanjut').onclick = () => { if (i >= L.length - 1) return tutup(true); i++; tampil(); };
  $('tutorKembali').onclick = () => { if (i > 0) { i--; tampil(); } };
  $('tutorLewati').onclick = () => tutup(false);
  $('tutorUlang').onclick = () => putar();
  el.hidden = false; opsi.redam && opsi.redam(true); tampil();

  const kartu = el.getBoundingClientRect.bind(el);
  const loop = () => {
    if (!hidup) return; raf = requestAnimationFrame(loop);
    const t = (performance.now() - t0) / 1000, s = L[i], o = R.obj, bicara = performance.now() < bicaraSampai || (audio && !audio.paused && !audio.ended);
    el.classList.toggle('bicara', !!bicara);
    // sorot tombol yang dijelaskan
    let tg = null; try { tg = s.sorot ? s.sorot() : null; } catch (e) {}
    const rc = tg && tg.getClientRects().length ? tg.getBoundingClientRect() : null;
    let arah = 0;
    if (rc && rc.width > 0) {
      const k = 6; ring.hidden = false;
      Object.assign(ring.style, {left: rc.left - k + 'px', top: rc.top - k + 'px', width: rc.width + 2 * k + 'px', height: rc.height + 2 * k + 'px'});
      const kr = kartu(), cx = kr.left + 66;   // posisi Raka di kiri kartu
      arah = (rc.left + rc.width / 2) < cx ? -1 : 1;
      el.dataset.arah = rc.top + rc.height / 2 < kr.top ? 'atas' : 'samping';
    } else ring.hidden = true;
    // gerak Raka
    const angguk = bicara ? Math.sin(t * 9) * .09 : Math.sin(t * 1.6) * .03;
    o.position.y = bicara ? Math.abs(Math.sin(t * 9)) * .05 : Math.sin(t * 2) * .02;
    const gaya = s.gaya || (rc ? 'tunjuk' : 'jelas');
    o.rotation.y = gaya === 'tunjuk' && arah ? arah * .22 + Math.sin(t * 1.3) * .04 : Math.sin(t * .9) * .12;
    const p = {head: angguk, headY: gaya === 'tunjuk' ? 0 : Math.sin(t * 1.3) * .15};
    if (gaya === 'lambai') Object.assign(p, {armR: -.25, armRz: 2.55 + Math.sin(t * 8) * .35, armL: Math.sin(t * 2) * .05});
    else if (gaya === 'tunjuk') {   // tangan di sisi tombol menunjuk serong ke atas, tangan lain ikut bergerak saat bicara
      const naik = el.dataset.arah === 'atas' ? 2.15 : 1.6, gr = bicara ? Math.sin(t * 6) * .12 : 0, kanan = arah >= 0;
      Object.assign(p, kanan ? {armR: -.35, armRz: naik + Math.sin(t * 3) * .06, armL: -.3 + gr, armLz: .15} : {armL: -.35, armLz: -naik - Math.sin(t * 3) * .06, armR: -.3 + gr, armRz: -.15});
    }
    else Object.assign(p, {armR: bicara ? -.55 + Math.sin(t * 5) * .25 : -.1, armRz: -.25, armL: bicara ? -.5 + Math.sin(t * 5 + 1.7) * .25 : -.1, armLz: .25});
    posekan(o, p);
    R.r.render(R.sc, R.cam);
  };
  loop();
  return {tutup: () => tutup(false)};
}

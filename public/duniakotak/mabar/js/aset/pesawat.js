// ASET PESAWAT DUNIA KOTAK (desain ulang 11 Nov 2026, Huda: "desain ulang ... pesawat"). Jet regional ORIGINAL "Kotak Air"
// (bukan pesawat/maskapai asli), gaya kotak membulat Dunia Kotak + garis tepi kartun, sama seperti aset mobil.js.
// UKURAN NYATA dalam meter (Huda: semua kendaraan proporsional dengan avatar 1,7 m): panjang 30 m, bentang sayap 24 m,
// tinggi ekor 9,5 m, badan Ø 3,2 m. Di aset fasum dikali SKALA_FASUM (1 m = 0,485 satuan fasum).
// Detail: hidung bulat + kaca kokpit, deret jendela kabin, pintu depan/belakang, sayap menyapu ke belakang + winglet berwarna,
// 2 mesin turbofan (bibir krom, kipas, spinner), sirip tegak berlogo kubus, stabilisator, roda pendarat (hidung + 2 utama),
// lampu navigasi merah (kiri) / hijau (kanan), lampu suar merah, tulisan KOTAK AIR + registrasi PK-DK.
// Hadap +x (hidung), sayap sepanjang z, roda di y = 0. Bagian diam digabung per bahan (ringan di HP).
// Pakai: import {buatPesawat} from './pesawat.js'; const j = buatPesawat(0x2f6fb8, 1); j.scale.setScalar(SKALA_FASUM);
import * as THREE from 'three';
import {ALAT} from './mobil.js?v=20261111amb';
const {pembuat, gabung, garisTepi, mat, kanvas, teksTex, KACA, HITAM, KROM, KARET, ABU, GARIS} = ALAT;
const PI = Math.PI, PUTIH = mat(0xf6f7f9, {roughness: .35, metalness: .1}), PERUT = mat(0xc9ced6, {roughness: .45, metalness: .2});
const KUNING = mat(0xf2c14a, {roughness: .4}), KOKPIT = mat(0x2c4a66, {roughness: .08, metalness: .7, polygonOffset: true, polygonOffsetFactor: -4}), BINGKAI = mat(0x161c24, {roughness: .5, polygonOffset: true, polygonOffsetFactor: -2}), JENDELA = mat(0x26313d, {roughness: .15, metalness: .4});
const MERAH = mat(0xff2a2a, {emissive: 0xff2a2a, emissiveIntensity: 1}), HIJAU = mat(0x2aff6a, {emissive: 0x2aff6a, emissiveIntensity: 1}), STROBO = mat(0xffffff, {emissive: 0xffffff, emissiveIntensity: .8});

// pelat berbentuk (sayap/sirip): titik [u, v] di bidang, tebal t, ditaruh dengan fungsi atur(mesh)
function pelat(g, titik, t, m, atur, garis) {
  const s = new THREE.Shape(); titik.forEach(([u, v], i) => i ? s.lineTo(u, v) : s.moveTo(u, v)); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {depth: t, bevelEnabled: true, bevelThickness: t * .35, bevelSize: Math.min(.12, t * .4), bevelSegments: 1}); geo.translate(0, 0, -t / 2);
  const me = new THREE.Mesh(geo, m); atur(me); g.add(me); if (garis) g.add(garisTepi(me, .05)); return me;
}
function logoTex(warna) { return kanvas('logoKA' + warna, 128, 128, (g) => {   // kubus Dunia Kotak putih isometrik
  const f = (pts, w) => { g.fillStyle = w; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill(); };
  f([[64, 18], [104, 40], [64, 62], [24, 40]], '#ffffff'); f([[24, 46], [61, 67], [61, 110], [24, 88]], '#e8eef6'); f([[67, 67], [104, 46], [104, 88], [67, 110]], '#c9d6e6'); }); }

export function buatPesawat(warna = 0x2f6fb8, no = 1) {
  const pesawat = new THREE.Group(), g = new THREE.Group(); pesawat.add(g);
  const p = pembuat(g), W = mat(warna, {roughness: .35, metalness: .15}), Y = 3.3, R = 1.6;
  // ---- badan: tabung, hidung bulat, ekor meruncing naik ----
  const badan = p.silinder(R, 22, PUTIH, 0, Y, 0, {rz: PI / 2, n: 24}); g.add(garisTepi(badan, .06));
  const hidung = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 14, 0, PI * 2, 0, PI / 2), PUTIH); hidung.scale.set(1, 2.1, 1); hidung.rotation.z = -PI / 2; hidung.position.set(11, Y, 0); g.add(hidung); g.add(garisTepi(hidung, .06));
  const ekor = new THREE.Mesh(new THREE.CylinderGeometry(R, .4, 6, 24), PUTIH); ekor.rotation.z = -PI / 2 - .12; ekor.position.set(-13.9, Y + .36, 0); g.add(ekor); g.add(garisTepi(ekor, .06));
  p.silinder(.36, .6, ABU, -17.0, Y + .72, 0, {rz: PI / 2, n: 12});                                            // APU di ujung ekor
  // perut abu & garis warna (cheatline) + aksen kuning
  const perut = p.silinder(R * 1.004, 22, PERUT, 0, Y, 0, {rz: PI / 2, n: 24}); perut.scale.set(1, 1, 1); perut.geometry = new THREE.CylinderGeometry(R * 1.004, R * 1.004, 22, 24, 1, true, PI * .72, PI * .56); perut.rotation.set(0, 0, PI / 2);
  [-1, 1].forEach(s => { p(22.4, .34, .05, W, -.2, Y - .42, s * (R - .02), {r: .02}); p(22.4, .08, .05, KUNING, -.2, Y - .18, s * (R - .01), {r: 0});
    // jendela kabin
    for (let i = 0; i < 24; i++) p(.3, .42, .08, JENDELA, -9.2 + i * .78, Y + .42, s * (R - .07), {r: .12});
    // pintu depan & belakang (garis + gagang)
    [[8.6, 1], [-9.9, 1]].forEach(([x]) => { p(1.0, 1.9, .04, mat(0xe6e9ee, {roughness: .4}), x, Y - .05, s * (R - .015), {r: .1}); p(.9, .04, .05, HITAM, x, Y + .9, s * (R - .005), {r: 0});
      p(.04, 1.84, .05, HITAM, x - .5, Y - .05, s * (R - .005), {r: 0}); p(.04, 1.84, .05, HITAM, x + .5, Y - .05, s * (R - .005), {r: 0}); p(.3, .3, .06, JENDELA, x, Y + .5, s * (R - .01), {r: .1}); });
    // tulisan
    p.bidang(5.6, .95, mat(0xffffff, {map: teksTex('KOTAK AIR', '#00000000', '#' + new THREE.Color(warna).getHexString(), 512, 96), transparent: true, polygonOffset: true, polygonOffsetFactor: -2}), 2.2, Y + 1.12, s * (R - .2), s > 0 ? 0 : PI, s * -.2);
    p.bidang(2.2, .42, mat(0xffffff, {map: teksTex('PK-DK' + no, '#00000000', '#26313d', 256, 56), transparent: true, polygonOffset: true, polygonOffsetFactor: -2}), -11.6, Y + .1, s * (R - .14), s > 0 ? 0 : PI);
  });
  // kaca kokpit (desain ulang 11 Nov 2026 atas permintaan Huda): kaca menempel mengikuti lengkung hidung.
  // Bingkai gelap melingkar + 6 panel kaca (2 depan, 2 samping, 2 samping belakang) dipisah tiang tipis.
  // Potongan bola satuan yang sama dengan hidung (theta diukur dari ujung hidung, phi 0 = atas).
  const kulitHidung = (m, f, ph0, ph1, th0, th1) => { const k = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 8, ph0, ph1 - ph0, th0, th1 - th0), m);
    k.scale.set(f, 2.1 * f, f); k.rotation.z = -PI / 2; k.position.set(11, Y, 0); g.add(k); return k; };
  kulitHidung(BINGKAI, 1.006, -1.42, 1.42, .78, 1.2);
  [[.03, .36, .84, 1.12], [.42, .86, .86, 1.15], [.92, 1.34, .9, 1.16]].forEach(([a0, a1, t0, t1]) => [-1, 1].forEach(s => kulitHidung(KOKPIT, 1.012, s > 0 ? a0 : -a1, s > 0 ? a1 : -a0, t0, t1)));
  // ---- sayap rendah menyapu (pelat di bidang x-z), winglet, flap ----
  [-1, 1].forEach(s => {
    pelat(g, [[3.2, 0], [-2.2, 0], [-6.4, s * 10.6], [-4.6, s * 10.6]], .45, PUTIH, me => { me.rotation.x = PI / 2 - s * .06; me.position.set(0, Y - 1.05, s * 1.2); }, true);
    p(1.6, .12, 8.6, ABU, -4.2, Y - .9, s * 5.8, {r: .04, ry: s * -.38});                      // flap
    pelat(g, [[0, 0], [-1.7, 0], [-2.4, 1.8], [-1.6, 1.8]], .16, W, me => { me.position.set(-4.6, Y - .52, s * 11.75); }, true);   // winglet
    p(.18, .14, .14, s < 0 ? MERAH : HIJAU, -4.7, Y - .5, s * 11.9, {r: .05});
    // mesin turbofan + pylon
    const z = s * 4.4;
    p(2.4, .9, .35, PUTIH, -.2, Y - 1.75, z, {r: .1});
    const nac = p.silinder(.95, 3.6, W, 1.2, Y - 2.4, z, {rz: PI / 2, n: 20}); g.add(garisTepi(nac, .05));
    p.silinder(.98, .3, KROM, 3.05, Y - 2.4, z, {rz: PI / 2, n: 20}); p.silinder(.82, .1, HITAM, 3.1, Y - 2.4, z, {rz: PI / 2, n: 20});
    const kipas = new THREE.Mesh(new THREE.CircleGeometry(.8, 16), mat(0x3a3e46, {roughness: .5, metalness: .6})); kipas.rotation.y = PI / 2; kipas.position.set(3.0, Y - 2.4, z); g.add(kipas);
    const sp = new THREE.Mesh(new THREE.ConeGeometry(.3, .55, 12), KROM); sp.rotation.z = -PI / 2; sp.position.set(3.2, Y - 2.4, z); g.add(sp);
    p.silinder(.6, .7, ABU, -.95, Y - 2.4, z, {rz: PI / 2, r2: .45, n: 16});
  });
  // ---- ekor: sirip tegak berwarna + logo, stabilisator ----
  pelat(g, [[-9.6, 0], [-15.2, 0], [-17.2, 6.2], [-14.8, 6.2]], .32, W, me => { me.position.set(0, Y + 1.1, 0); }, true);
  [-1, 1].forEach(s => p.bidang(2.1, 2.1, mat(0xffffff, {map: logoTex(warna), transparent: true, polygonOffset: true, polygonOffsetFactor: -2}), -14.4, Y + 4.2, s * .32, s > 0 ? 0 : PI));
  p(.3, .3, .3, MERAH, -16.2, Y + 7.35, 0, {r: .1});
  [-1, 1].forEach(s => pelat(g, [[0, 0], [-2.8, 0], [-4.2, s * 5], [-2.8, s * 5]], .22, PUTIH, me => { me.rotation.x = PI / 2; me.position.set(-12.6, Y + .95, s * .3); }, true));
  // ---- roda pendarat: hidung + 2 utama ----
  const roda = (x, z, n) => { p.silinder(.1, Y - 1.4, ABU, x, (Y - 1.4) / 2 + .4, z, {n: 8});
    for (let k = 0; k < n; k++) { const zz = z + (k - (n - 1) / 2) * .62; p.silinder(.5, .36, KARET, x, .5, zz, {rx: PI / 2, n: 16}); p.silinder(.26, .38, ABU, x, .5, zz, {rx: PI / 2, n: 12}); } };
  roda(10.6, 0, 2); roda(-1.6, -2.3, 2); roda(-1.6, 2.3, 2);
  p(1.6, .5, 1.1, PERUT, -1.6, Y - 1.45, 0, {r: .2});                                        // rumah roda
  // lampu suar & strobo
  p(.24, .18, .24, MERAH, 1, Y + R + .05, 0, {r: .08}); p(.24, .18, .24, MERAH, 1, Y - R - .05, 0, {r: .08});
  p(.2, .14, .2, STROBO, -17.2, Y + .7, 0, {r: .06});
  p.selesai(); gabung(g);
  pesawat.userData = {panjang: 32, bentang: 24, model: 'pesawat'};
  return pesawat;
}

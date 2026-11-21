// SUARA PEJALAN KAKI (Huda 21 Nov 2026: "Bisa engga ya NPC ngomong beneran, engga cuma teks di atas kepala").
// Kalimat warga direkam sekali dengan Gemini TTS (Bahasa Indonesia, logat berbagai daerah: Jawa, Sunda, Betawi, Batak,
// Minang, Madura, Bali, Makassar, Jawa Timuran, Ambon), digabung jadi satu mp3 per jenis suara (L laki-laki, P perempuan,
// A anak) + peta JSON {kalimat: [mulai, durasi]} di suara-npc/.
// RINGAN: file baru diunduh saat warga pertama kali bicara di dekatmu, satu jenis suara sekali saja.
// Suara datang dari arah warga (kiri/kanan) dan makin pelan kalau makin jauh. Maksimal 2 warga bersuara bersamaan.
const M = 4.12 / 1.7;
const JAUH = 30 * M, PENUH = 5 * M, MAKS = 2;

export function buatSuaraNPC({ctx, out, boleh = () => true, dasar = 'suara-npc/', versi = ''}) {
  const kel = {};      // g → {peta, buf, janji}
  const main = new Set();

  function muat(g) {
    if (kel[g]) return kel[g];
    const k = kel[g] = {peta: null, buf: null};
    const c = ctx(); if (!c) { delete kel[g]; return null; }
    k.janji = Promise.all([
      fetch(`${dasar}${g}.json${versi}`).then(r => r.ok ? r.json() : null),
      fetch(`${dasar}${g}.mp3${versi}`).then(r => r.ok ? r.arrayBuffer() : null).then(a => a && new Promise((ok, no) => c.decodeAudioData(a, ok, no))),
    ]).then(([p, b]) => { k.peta = p; k.buf = b; }).catch(() => { k.gagal = true; });
    return k;
  }

  // teks: kalimat persis seperti di gelembung; g: 'L' | 'P' | 'A'; pos: Vector3 warga; dengar: posisi pemain; cam: kamera (arah kiri/kanan)
  function bicara(teks, g, pos, dengar, cam) {
    try {
      if (!boleh() || !g || !pos || !dengar || !cam) return false;
      const c = ctx(); if (!c || c.state !== 'running') return false;
      const d = Math.hypot(pos.x - dengar.x, pos.z - dengar.z), dx = pos.x - cam.position.x, dz = pos.z - cam.position.z;
      if (d > JAUH) return false;
      const k = muat(g); if (!k || k.gagal) return false;
      if (!k.buf || !k.peta) return false;          // masih diunduh: kali ini gelembung saja
      const s = k.peta[teks]; if (!s) return false;
      if (main.size >= MAKS) return false;
      // arah: proyeksikan ke sumbu kanan kamera (kolom pertama matriks kamera)
      const e = cam.matrixWorld.elements, kanan = (dx * e[0] + dz * e[2]) / (Math.hypot(e[0], e[2]) || 1);
      const v = d <= PENUH ? 1 : Math.pow(1 - (d - PENUH) / (JAUH - PENUH), 1.6);
      const src = c.createBufferSource(), gn = c.createGain();
      src.buffer = k.buf; src.playbackRate.value = .97 + Math.random() * .06;
      gn.gain.value = .9 * v;
      let ujung = gn;
      if (c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = Math.max(-.8, Math.min(.8, kanan / (12 * M))); gn.connect(pn); ujung = pn; }
      src.connect(gn); ujung.connect(out());
      src.start(c.currentTime + .02, s[0], s[1]);
      main.add(src); src.onended = () => main.delete(src);
      return true;
    } catch (e) { return false; }
  }
  // muat duluan (dipanggil setelah masuk desa, saat HP santai)
  function siapkan(gs = ['L', 'P', 'A']) { gs.forEach(g => muat(g)); }
  function diam() { for (const s of main) { try { s.stop(); } catch (e) {} } main.clear(); }
  return {bicara, siapkan, diam, _kel: kel};
}

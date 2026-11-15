// Pekerja latar untuk alat JPG ke Vektor: menjiplak gambar di luar halaman supaya HP tidak macet.
// Pustaka: imagetracerjs 1.2.6 (Unlicense / domain publik), disimpan di folder ini.
importScripts('imagetracer.js');
self.onmessage = function (e) {
  var d = e.data;
  try {
    var td = ImageTracer.imagedataToTracedata(d.img, d.opsi);
    var hapus = 0;
    for (var k = 0; k < td.palette.length; k++) {
      var p = td.palette[k];
      // Bagian tembus pandang (PNG) selalu dibuang; latar putih dibuang kalau diminta.
      if (p.a < 128 || (d.hapusPutih && p.r >= d.ambang && p.g >= d.ambang && p.b >= d.ambang)) { td.layers[k] = []; hapus++; }
    }
    var svg = ImageTracer.getsvgstring(td, d.opsi);
    var warna = [];
    for (var i = 0; i < td.palette.length; i++) {
      if (td.layers[i] && td.layers[i].length) {
        var c = td.palette[i];
        warna.push({ r: c.r, g: c.g, b: c.b, a: c.a, n: td.layers[i].length });
      }
    }
    self.postMessage({ ok: true, svg: svg, warna: warna, hapus: hapus });
  } catch (err) {
    self.postMessage({ ok: false, pesan: String(err && err.message || err) });
  }
};

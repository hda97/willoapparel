// Pekerja latar untuk alat JPG ke Vektor: menjiplak gambar di luar halaman supaya HP tidak macet.
// Pustaka jiplak: imagetracerjs 1.2.6 (Unlicense / domain publik), disimpan di folder ini.
// Sebelum dijiplak, gambar dirapikan dulu di sini:
//   1) dihaluskan sedikit (buang kotak-kotak & bintik JPG),
//   2) warnanya dipilih dengan k-means di ruang warna Lab (warna yang dipilih mirip yang dilihat mata),
//   3) tiap piksel "ikut suara terbanyak" tetangganya (tepi tidak bergerigi, bintik hilang).
// Hasilnya bidang warna rata yang bisa dijiplak jadi bentuk mulus.
importScripts('imagetracer.js');

function lab(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  var x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  var y = (r * 0.2126 + g * 0.7152 + b * 0.0722);
  var z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  x = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

// Blur kotak 2 kali (mendekati Gaussian), hanya RGB.
function haluskan(px, w, h, r) {
  if (r <= 0) return;
  var tmp = new Float32Array(w * h * 3), src = new Float32Array(w * h * 3), i, x, y, c;
  for (i = 0; i < w * h; i++) { src[i*3] = px[i*4]; src[i*3+1] = px[i*4+1]; src[i*3+2] = px[i*4+2]; }
  for (var ulang = 0; ulang < 2; ulang++) {
    for (y = 0; y < h; y++) for (c = 0; c < 3; c++) {
      var s = 0, n = 0;
      for (x = -r; x <= r; x++) if (x >= 0 && x < w) { s += src[(y*w+x)*3+c]; n++; }
      for (x = 0; x < w; x++) {
        tmp[(y*w+x)*3+c] = s / n;
        var keluar = x - r, masuk = x + r + 1;
        if (keluar >= 0) { s -= src[(y*w+keluar)*3+c]; n--; }
        if (masuk < w) { s += src[(y*w+masuk)*3+c]; n++; }
      }
    }
    for (x = 0; x < w; x++) for (c = 0; c < 3; c++) {
      var s2 = 0, n2 = 0;
      for (y = -r; y <= r; y++) if (y >= 0 && y < h) { s2 += tmp[(y*w+x)*3+c]; n2++; }
      for (y = 0; y < h; y++) {
        src[(y*w+x)*3+c] = s2 / n2;
        var k1 = y - r, k2 = y + r + 1;
        if (k1 >= 0) { s2 -= tmp[(k1*w+x)*3+c]; n2--; }
        if (k2 < h) { s2 += tmp[(k2*w+x)*3+c]; n2++; }
      }
    }
  }
  for (i = 0; i < w * h; i++) { px[i*4] = src[i*3]; px[i*4+1] = src[i*3+1]; px[i*4+2] = src[i*3+2]; }
}

// k-means di ruang Lab dengan awal k-means++ (acak tetap, jadi hasil selalu sama untuk gambar yang sama).
function pilihWarna(px, w, h, k, gabung) {
  var acak = 12345; function rnd() { acak = (acak * 1103515245 + 12345) & 0x7fffffff; return acak / 0x7fffffff; }
  var total = w * h, langkah = Math.max(1, Math.floor(total / 40000)), sampel = [];
  // Warna dipilih dari bidang rata saja. Piksel di tepi (campuran dua warna) tidak ikut, supaya tidak
  // muncul warna "pinggiran" (abu-abu di antara biru & kuning) yang jadi garis kotor di hasil.
  var tepi = [];
  for (var i = 0; i < total; i += langkah) {
    if (px[i*4+3] < 128) continue;
    var x0 = i % w, y0 = (i / w) | 0, beda = 0;
    for (var q = 0; q < 4; q++) {
      var nx = x0 + (q === 0 ? 1 : q === 1 ? -1 : 0), ny = y0 + (q === 2 ? 1 : q === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      var o2 = (ny * w + nx) * 4;
      beda = Math.max(beda, Math.abs(px[i*4]-px[o2]) + Math.abs(px[i*4+1]-px[o2+1]) + Math.abs(px[i*4+2]-px[o2+2]));
    }
    var c0 = lab(px[i*4], px[i*4+1], px[i*4+2]);
    if (beda <= 24) sampel.push(c0); else tepi.push(c0);
  }
  if (sampel.length < 2000) sampel = sampel.concat(tepi);
  if (!sampel.length) return [];
  k = Math.min(k, sampel.length);
  var pusat = [sampel[Math.floor(rnd() * sampel.length)].slice()], jarak = new Float64Array(sampel.length);
  function d2(a, b) { var x = a[0]-b[0], y = a[1]-b[1], z = a[2]-b[2]; return x*x + y*y + z*z; }
  for (i = 0; i < sampel.length; i++) jarak[i] = d2(sampel[i], pusat[0]);
  while (pusat.length < k) {
    var jum = 0; for (i = 0; i < sampel.length; i++) jum += jarak[i];
    if (jum === 0) break;
    var t = rnd() * jum, pilih = 0;
    for (i = 0; i < sampel.length; i++) { t -= jarak[i]; if (t <= 0) { pilih = i; break; } }
    pusat.push(sampel[pilih].slice());
    for (i = 0; i < sampel.length; i++) { var dd = d2(sampel[i], pusat[pusat.length-1]); if (dd < jarak[i]) jarak[i] = dd; }
  }
  for (var it = 0; it < 14; it++) {
    var sum = pusat.map(function () { return [0, 0, 0, 0]; });
    for (i = 0; i < sampel.length; i++) {
      var best = 0, bd = Infinity;
      for (var j = 0; j < pusat.length; j++) { var dj = d2(sampel[i], pusat[j]); if (dj < bd) { bd = dj; best = j; } }
      var sm = sum[best]; sm[0] += sampel[i][0]; sm[1] += sampel[i][1]; sm[2] += sampel[i][2]; sm[3]++;
    }
    for (j = 0; j < pusat.length; j++) if (sum[j][3]) pusat[j] = [sum[j][0]/sum[j][3], sum[j][1]/sum[j][3], sum[j][2]/sum[j][3]];
  }
  // Gabungkan warna kembar (beda tipis yang mata hampir tak bisa bedakan), supaya bidang rata tidak pecah
  // jadi belang-belang. Jadi "Jumlah warna" = batas paling banyak.
  var n = sum.map(function (x) { return x[3]; }), batas = gabung * gabung;
  for (;;) {
    var bi = -1, bj = -1, bdist = batas;
    for (i = 0; i < pusat.length; i++) if (n[i]) for (j = i + 1; j < pusat.length; j++) if (n[j]) {
      var dd2 = d2(pusat[i], pusat[j]); if (dd2 < bdist) { bdist = dd2; bi = i; bj = j; } }
    if (bi < 0) break;
    var t2 = n[bi] + n[bj];
    pusat[bi] = [0, 1, 2].map(function (c) { return (pusat[bi][c] * n[bi] + pusat[bj][c] * n[bj]) / t2; });
    n[bi] = t2; n[bj] = 0;
  }
  return pusat.filter(function (_, ix) { return n[ix] > 0; });
}

self.onmessage = function (e) {
  var d = e.data;
  try {
    var w = d.img.width, h = d.img.height, px = d.img.data, total = w * h, i, j;
    haluskan(px, w, h, d.halus);

    // Palet: tetap (mode 1 warna) atau dari k-means.
    var palLab, palRgb;
    if (d.palTetap) {
      palRgb = d.palTetap; palLab = palRgb.map(function (c) { return lab(c.r, c.g, c.b); });
    } else {
      palLab = pilihWarna(px, w, h, d.jumlahWarna, d.gabung);
      palRgb = null;
    }
    var K = palLab.length, TEMBUS = K;
    var label = new Int16Array(total), simpan = new Map();
    var jumlahR = new Float64Array(K), jumlahG = new Float64Array(K), jumlahB = new Float64Array(K), banyak = new Float64Array(K + 1);
    for (i = 0; i < total; i++) {
      var o = i * 4;
      if (px[o+3] < 128) { label[i] = TEMBUS; continue; }
      var kunci = (px[o] >> 1) << 14 | (px[o+1] >> 1) << 7 | (px[o+2] >> 1), l = simpan.get(kunci);
      if (l === undefined) {
        var c = lab(px[o], px[o+1], px[o+2]), bd = Infinity; l = 0;
        for (j = 0; j < K; j++) { var x = c[0]-palLab[j][0], y = c[1]-palLab[j][1], z = c[2]-palLab[j][2], dd = x*x+y*y+z*z; if (dd < bd) { bd = dd; l = j; } }
        simpan.set(kunci, l);
      }
      label[i] = l;
    }

    // Piksel tepi (campuran dua warna) hanya boleh ikut warna bidang rata di dekatnya, jadi tidak muncul
    // garis putih/abu tipis di antara dua warna.
    var rata = new Uint8Array(total);
    for (var yq = 0; yq < h; yq++) for (var xq = 0; xq < w; xq++) {
      var iq = yq * w + xq, oq = iq * 4, bedaq = 0;
      if (xq + 1 < w) bedaq = Math.max(bedaq, Math.abs(px[oq]-px[oq+4]) + Math.abs(px[oq+1]-px[oq+5]) + Math.abs(px[oq+2]-px[oq+6]));
      if (xq > 0) bedaq = Math.max(bedaq, Math.abs(px[oq]-px[oq-4]) + Math.abs(px[oq+1]-px[oq-3]) + Math.abs(px[oq+2]-px[oq-2]));
      if (yq + 1 < h) { var ob = oq + w * 4; bedaq = Math.max(bedaq, Math.abs(px[oq]-px[ob]) + Math.abs(px[oq+1]-px[ob+1]) + Math.abs(px[oq+2]-px[ob+2])); }
      if (yq > 0) { var oa = oq - w * 4; bedaq = Math.max(bedaq, Math.abs(px[oq]-px[oa]) + Math.abs(px[oq+1]-px[oa+1]) + Math.abs(px[oq+2]-px[oa+2])); }
      rata[iq] = bedaq <= 24 ? 1 : 0;
    }
    var label2 = label.slice(), calon = new Uint8Array(K + 1);
    for (var ye = 0; ye < h; ye++) for (var xe = 0; xe < w; xe++) {
      var ie = ye * w + xe; if (rata[ie] || label[ie] === TEMBUS) continue;
      var adaCalon = false;
      for (var dy2 = -3; dy2 <= 3; dy2++) { var yy2 = ye + dy2; if (yy2 < 0 || yy2 >= h) continue;
        for (var dx2 = -3; dx2 <= 3; dx2++) { var xx2 = xe + dx2; if (xx2 < 0 || xx2 >= w) continue;
          var i2 = yy2 * w + xx2; if (rata[i2]) { calon[label[i2]] = 1; adaCalon = true; } } }
      if (adaCalon && !calon[label[ie]]) {
        var oe = ie * 4, ce = lab(px[oe], px[oe+1], px[oe+2]), bde = Infinity, pilihE = label[ie];
        for (j = 0; j < K; j++) if (calon[j]) { var x3 = ce[0]-palLab[j][0], y3 = ce[1]-palLab[j][1], z3 = ce[2]-palLab[j][2], d3 = x3*x3+y3*y3+z3*z3; if (d3 < bde) { bde = d3; pilihE = j; } }
        label2[ie] = pilihE;
      }
      if (adaCalon) calon.fill(0);
    }
    label = label2;

    // Suara terbanyak 3x3: bintik & gerigi hilang, garis tetap.
    var hasil = new Int16Array(total), hit = new Int32Array(K + 1);
    for (var pass = 0; pass < d.rapikan; pass++) {
      for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
        var idx = yy * w + xx, sendiri = label[idx], terbanyak = sendiri, maks = 0, daftar = [];
        for (var dy = -1; dy <= 1; dy++) { var ny = yy + dy; if (ny < 0 || ny >= h) continue;
          for (var dx = -1; dx <= 1; dx++) { var nx = xx + dx; if (nx < 0 || nx >= w) continue;
            var lb = label[ny * w + nx]; if (hit[lb] === 0) daftar.push(lb); hit[lb]++; } }
        for (j = 0; j < daftar.length; j++) { if (hit[daftar[j]] > maks) { maks = hit[daftar[j]]; terbanyak = daftar[j]; } }
        hasil[idx] = ((maks >= 5 && hit[sendiri] < maks) || hit[sendiri] <= 2) ? terbanyak : sendiri; // juga buang serpihan setebal 1 piksel
        for (j = 0; j < daftar.length; j++) hit[daftar[j]] = 0;
      }
      var tukar = label; label = hasil; hasil = tukar;
    }

    // Warna akhir tiap kelompok = rata-rata warna aslinya (lebih setia dari pusat Lab).
    for (i = 0; i < total; i++) { var lb2 = label[i]; banyak[lb2]++; if (lb2 < K) { jumlahR[lb2] += px[i*4]; jumlahG[lb2] += px[i*4+1]; jumlahB[lb2] += px[i*4+2]; } }
    var pal = [];
    for (j = 0; j < K; j++) {
      if (palRgb) pal.push({ r: palRgb[j].r, g: palRgb[j].g, b: palRgb[j].b, a: 255, n: banyak[j], asal: j });
      else if (banyak[j]) pal.push({ r: Math.round(jumlahR[j]/banyak[j]), g: Math.round(jumlahG[j]/banyak[j]), b: Math.round(jumlahB[j]/banyak[j]), a: 255, n: banyak[j], asal: j });
    }
    // Urutkan dari bidang terbesar: digambar duluan, detail kecil di atasnya (tanpa celah putih).
    pal.sort(function (a, b) { return b.n - a.n; });
    var peta = new Int16Array(K + 1).fill(-1);
    pal.forEach(function (p, ix) { peta[p.asal] = ix; });
    var adaTembus = banyak[TEMBUS] > 0;
    if (adaTembus) { peta[TEMBUS] = pal.length; pal.push({ r: 0, g: 0, b: 0, a: 0, n: banyak[TEMBUS], asal: TEMBUS }); }

    // Gambar rata untuk dijiplak: tiap piksel tepat salah satu warna palet.
    var datar = new Uint8ClampedArray(total * 4);
    for (i = 0; i < total; i++) { var p = pal[peta[label[i]]]; datar[i*4] = p.r; datar[i*4+1] = p.g; datar[i*4+2] = p.b; datar[i*4+3] = p.a; }

    var opsi = d.opsi;
    opsi.pal = pal.map(function (p) { return { r: p.r, g: p.g, b: p.b, a: p.a }; });
    opsi.numberofcolors = pal.length; opsi.colorquantcycles = 1; opsi.blurradius = 0; opsi.mincolorratio = 0;
    var td = ImageTracer.imagedataToTracedata({ width: w, height: h, data: datar }, opsi);

    var hapus = 0;
    for (var k = 0; k < td.palette.length; k++) {
      var q = td.palette[k];
      if (q.a < 128 || (d.hapusPutih && q.r >= d.ambang && q.g >= d.ambang && q.b >= d.ambang)) { td.layers[k] = []; hapus++; }
    }
    var svg = ImageTracer.getsvgstring(td, opsi);
    var warna = [];
    for (i = 0; i < td.palette.length; i++) if (td.layers[i] && td.layers[i].length) { var cc = td.palette[i]; warna.push({ r: cc.r, g: cc.g, b: cc.b, a: cc.a, n: pal[i].n }); }
    self.postMessage({ ok: true, svg: svg, warna: warna, hapus: hapus });
  } catch (err) {
    self.postMessage({ ok: false, pesan: String(err && err.message || err) });
  }
};

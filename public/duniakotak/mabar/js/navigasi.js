// Navigasi ala peta HP (Huda, 6 Nov 2026): pilih tujuan di peta → rute lewat jalan + garis petunjuk.
// Grid jalan-kaki statis per dusun (dibuat sekali, ringan): sel 2 satuan dunia.
//  - blok  : persegi rumah/dinding fasum (diperlebar sesuai margin tabrakan), sungai di luar jembatan
//  - murah : badan jalan (biaya 1; tempat lain biaya dasar)
//  - mahal : pekarangan kavling (biaya 4x) supaya rute memilih jalan, kecuali kavling tujuan
//  - tinggi: undakan teras Curug; beda tinggi > 3,2 antarsel = dinding (lewat tanjakan)
export function buatNav({batas, sel = 2, blok = [], mahal = [], murah = [], dasar = 1, dilarang = null, tinggi = null}) {
  const x0 = batas.x0, z0 = batas.z0, W = Math.ceil((batas.x1 - x0) / sel) + 1, H = Math.ceil((batas.z1 - z0) / sel) + 1, N = W * H;
  const jalan = new Uint8Array(N).fill(1), biaya = new Uint8Array(N).fill(dasar), h = tinggi ? new Float32Array(N) : null;
  const kx = x => Math.round((x - x0) / sel), kz = z => Math.round((z - z0) / sel);
  const isi = (r, arr, v) => { const a = Math.max(0, Math.ceil((r[0] - x0) / sel)), b = Math.min(W - 1, Math.floor((r[1] - x0) / sel)), c = Math.max(0, Math.ceil((r[2] - z0) / sel)), d = Math.min(H - 1, Math.floor((r[3] - z0) / sel));
    for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) { const k = j * W + i; if (v === 0 || v === 1) arr[k] = v; else arr[k] = Math.max(arr[k], v); } };
  for (const r of murah) isi(r, biaya, 1);
  for (const r of mahal) isi(r, biaya, 4);
  for (const r of blok) isi(r, jalan, 0);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, x = x0 + i * sel, z = z0 + j * sel;
    if (dilarang && jalan[k] && dilarang(x, z)) jalan[k] = 0; if (h) h[k] = tinggi(x, z); }
  const bisa = (a, b) => !h || Math.abs(h[a] - h[b]) <= 3.2;
  const dekatJalan = k0 => {   // sel bisa-dilewati terdekat (spiral)
    if (jalan[k0]) return k0; const i0 = k0 % W, j0 = (k0 / W) | 0;
    for (let r = 1; r < 40; r++) { let best = -1, bd = 1e9;
      for (let j = j0 - r; j <= j0 + r; j++) for (let i = i0 - r; i <= i0 + r; i++) { if (i < 0 || j < 0 || i >= W || j >= H) continue; if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r) continue; const k = j * W + i; if (!jalan[k]) continue; const d = (i - i0) ** 2 + (j - j0) ** 2; if (d < bd) { bd = d; best = k; } }
      if (best >= 0) return best; }
    return -1; };
  const g = new Float32Array(N), asal = new Int32Array(N), tutup = new Uint8Array(N);
  // garis lurus antar dua sel: semua sel dilewati, biaya tidak naik, tinggi tidak melompat
  function lurus(a, b, maks) { const ai = a % W, aj = (a / W) | 0, bi = b % W, bj = (b / W) | 0, n = Math.ceil(Math.max(Math.abs(bi - ai), Math.abs(bj - aj)) * 2); let prev = a;
    for (let s = 1; s <= n; s++) { const t = s / n, k = Math.round(aj + (bj - aj) * t) * W + Math.round(ai + (bi - ai) * t); if (!jalan[k] || biaya[k] > maks || !bisa(prev, k)) return false; prev = k; } return true; }
  function cari(ax, az, bx, bz, kecuali) {
    const ki = (x, z) => Math.min(H - 1, Math.max(0, kz(z))) * W + Math.min(W - 1, Math.max(0, kx(x)));
    const s = dekatJalan(ki(ax, az)), t = dekatJalan(ki(bx, bz)); if (s < 0 || t < 0) return null;
    const bebasBiaya = new Set(); if (kecuali) for (const r of kecuali) { const a = Math.max(0, Math.ceil((r[0] - x0) / sel)), b = Math.min(W - 1, Math.floor((r[1] - x0) / sel)), c = Math.max(0, Math.ceil((r[2] - z0) / sel)), d = Math.min(H - 1, Math.floor((r[3] - z0) / sel)); for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) bebasBiaya.add(j * W + i); }
    const by = k => bebasBiaya.has(k) ? 1 : biaya[k];
    g.fill(Infinity); tutup.fill(0); g[s] = 0; asal[s] = -1;
    const ti = t % W, tj = (t / W) | 0, hr = k => { const dx = Math.abs(k % W - ti), dz = Math.abs(((k / W) | 0) - tj); return Math.max(dx, dz) + .4142 * Math.min(dx, dz); };
    const heap = [[hr(s), s]], push = it => { heap.push(it); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } },
      pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    let ok = false, n = 0;
    while (heap.length) { const [, k] = pop(); if (tutup[k]) continue; tutup[k] = 1; if (k === t) { ok = true; break; } if (++n > N) break;
      const i = k % W, j = (k / W) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
        const nk = nj * W + ni; if (!jalan[nk] || tutup[nk] || !bisa(k, nk)) continue;
        if (di && dj && (!jalan[j * W + ni] || !jalan[nj * W + i])) continue;   // jangan potong sudut dinding
        const ng = g[k] + (di && dj ? 1.4142 : 1) * (by(k) + by(nk)) / 2; if (ng < g[nk]) { g[nk] = ng; asal[nk] = k; push([ng + hr(nk), nk]); } } }
    if (!ok) return null;
    const sel2 = []; for (let k = t; k >= 0; k = asal[k]) sel2.push(k); sel2.reverse();
    // rapikan: tarik lurus selama tidak menembus dinding / pekarangan
    const rapi = [sel2[0]]; let a = 0;
    while (a < sel2.length - 1) { let b = Math.min(sel2.length - 1, a + 60); const maks = Math.max(by(sel2[a]), 1);
      while (b > a + 1 && !lurus(sel2[a], sel2[b], Math.max(maks, by(sel2[b])) )) b--; rapi.push(sel2[b]); a = b; }
    const titik = rapi.map(k => [x0 + (k % W) * sel, z0 + ((k / W) | 0) * sel]);
    titik[0] = [ax, az]; if (jalan[ki(bx, bz)]) titik[titik.length - 1] = [bx, bz];
    return titik;
  }
  return {cari, W, H, sel};
}
// titik rute dipecah tiap ±2 satuan (untuk garis 3D & melacak kemajuan)
export function pecahRute(t, langkah = 2) {
  const out = [t[0]]; for (let i = 1; i < t.length; i++) { const [ax, az] = t[i - 1], [bx, bz] = t[i], d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / langkah)); for (let s = 1; s <= n; s++) out.push([ax + (bx - ax) * s / n, az + (bz - az) * s / n]); }
  return out;
}

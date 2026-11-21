// Ikon tombol HUD khas Dunia Kotak (Huda 21 Nov 2026: "Cek iconnya" + aturan "tombol jangan emot standar, bikin ikon khas Dunia Kotak").
// Semua digambar sendiri: kotak membulat bergaris tebal gelap, warna cerah, gaya sama dengan ikon roda Gerak (js/gerak.js).
// Emoji di index.html tetap ada sebagai cadangan kalau modul ini gagal dimuat.
const G = '#17212e', PUTIH = '#ffffff', KUNING = '#ffd84a', EMAS = '#f0b429', BIRU = '#7cc8ff', MERAH = '#ff6b5a', HIJAU = '#7ed957',
  KAYU = '#c8894a', ABU = '#b8c4d0', BAJA = '#5a6878', KULIT = '#f4c99a';
const SW = 2.4;
const b = (x, y, w, h, f = PUTIH, rx = 2, t = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" stroke="${G}" stroke-width="${SW}"${t ? ` transform="${t}"` : ''}/>`;
const p = (d, f = PUTIH) => `<path d="${d}" fill="${f}" stroke="${G}" stroke-width="${SW}" stroke-linejoin="round"/>`;
const gs = (d, c = G, w = SW) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const kt = (x, y, w, h, f = G) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
const bl = (cx, cy, r, f) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" stroke="${G}" stroke-width="${SW}"/>`;
// tokoh kepala kotak (sama dengan gerak.js): sudut lengan/kaki dalam derajat, positif = ke luar badan
const tungkai = (x, y, pj, s, f = PUTIH) => `<rect x="${x - 2.3}" y="${y}" width="4.6" height="${pj}" rx="1.9" fill="${f}" stroke="${G}" stroke-width="${SW}" transform="rotate(${s} ${x} ${y})"/>`;
const tokoh = ({aL = 8, aR = 8, kL = 3, kR = 3, miring = 0, dx = 0, dy = 0, baju = PUTIH}) => `<g transform="translate(${dx} ${dy}) rotate(${miring} 24 30)">`
  + tungkai(21.3, 29, 12, kL) + tungkai(26.7, 29, 12, -kR) + tungkai(18.6, 17.5, 11, aL, baju) + tungkai(29.4, 17.5, 11, -aR, baju)
  + b(18.5, 16, 11, 13.5, baju, 1.6) + b(18, 4, 12, 12, PUTIH, 2.6) + kt(20.8, 9, 2, 2.6) + kt(25.2, 9, 2, 2.6) + '</g>';
const svg = isi => `<svg viewBox="0 0 48 48" aria-hidden="true">${isi}</svg>`;

const piala = p('M13 12H7v5c0 6 4 9 8 9', 'none') + p('M35 12h6v5c0 6-4 9-8 9', 'none') + p('M13 6h22v13c0 7-5 11-11 11s-11-4-11-11z', KUNING)
  + b(21, 29, 6, 6, EMAS, 1) + b(14, 35, 20, 8, KAYU, 2) + kt(20, 11, 3, 9, PUTIH);
const mobil = b(4, 22, 40, 13, MERAH, 4) + p('M12 23l5-10h14l6 10z', MERAH) + b(18.5, 15.5, 5.5, 6, BIRU, 1) + b(26, 15.5, 5.5, 6, BIRU, 1)
  + b(9, 30, 10, 10, G, 5) + b(29, 30, 10, 10, G, 5) + kt(12.5, 33.5, 3, 3, ABU) + kt(32.5, 33.5, 3, 3, ABU) + kt(38, 25, 4, 3, KUNING);
const TERANG = '#e8eef5';   // garis lepas (tanpa isi) di atas tombol gelap
const lari = svg(tokoh({aL: 55, aR: -45, kL: 40, kR: -30, miring: 14, dx: 3}) + gs('M3 18h8M2 26h7M4 34h6', TERANG));

export const IKON = {
  rumah: svg(b(30, 8, 6, 10, KAYU, 1) + b(10, 21, 28, 21, PUTIH, 1.5) + p('M5 23L24 7l19 16z', MERAH) + b(20, 30, 8, 12, KAYU, 1) + b(13, 26, 5, 5, BIRU, .8) + b(30, 26, 5, 5, BIRU, .8)),
  kamera: svg(b(13, 10, 11, 8, BAJA, 2) + b(4, 15, 40, 26, BAJA, 5) + b(15, 18.5, 18, 18, '#2a3644', 5) + b(19.5, 23, 9, 9, BIRU, 2.5) + kt(21.5, 25, 2.5, 2.5, PUTIH) + b(35, 19, 5, 4, KUNING, 1)),
  misi: svg(b(8, 7, 32, 37, KAYU, 3) + b(12, 12, 24, 28, PUTIH, 1.5) + b(18, 4, 12, 7, ABU, 2) + gs('M16 20l2.5 2.5 4.5-4.5M16 31l2.5 2.5 4.5-4.5', '#2f9e44', 3) + gs('M27 21h5M27 32h5')),
  peringkat: svg(piala),
  dukung: svg(p('M6 35L7 13l10 10 7-15 7 15 10-10 1 22z', KUNING) + b(5, 33, 38, 8, EMAS, 2) + b(10.5, 35, 5, 4, MERAH, 1) + b(21.5, 35, 5, 4, BIRU, 1) + b(32.5, 35, 5, 4, MERAH, 1) + kt(14, 20, 3, 8, PUTIH)),
  game: svg(p('M11 14h26c6 0 8 5 8 11l-1 9c-.6 4.5-5.5 5.5-8.5 2.5L31 32H17l-4.5 4.5C9.5 39.5 4.6 38.5 4 34l-1-9c0-6 2-11 8-11z', BAJA)
    + gs('M11 24h9M15.5 19.5v9', PUTIH, 3.4) + b(30, 18, 5, 5, MERAH, 2.5) + b(36, 23, 5, 5, KUNING, 2.5)),
  dusun: svg(b(10, 38, 7, 6, G, 1.5) + b(31, 38, 7, 6, G, 1.5) + b(8, 5, 32, 34, KUNING, 5) + b(12, 9, 24, 14, BIRU, 2) + b(12, 28, 6, 4, PUTIH, 1) + b(30, 28, 6, 4, PUTIH, 1) + b(10, 36, 28, 4, ABU, 1.5) + kt(14, 12, 3, 8, PUTIH)),
  atur: svg([0, 45, 90, 135, 180, 225, 270, 315].map(s => b(20, 3, 8, 10, ABU, 1.5, `rotate(${s} 24 24)`)).join('') + bl(24, 24, 14, ABU) + b(18.5, 18.5, 11, 11, PUTIH, 3)),
  chat: svg(p('M5 9h38v24H21l-10 8v-8H5z', PUTIH) + b(13, 19, 4.5, 4.5, G, 1) + b(21.75, 19, 4.5, 4.5, G, 1) + b(30.5, 19, 4.5, 4.5, G, 1)),
  lompat: svg(tokoh({aL: 150, aR: 150, kL: 22, kR: 22, dy: -2}) + gs('M12 44h8M28 44h8', TERANG) + gs('M5 21l4-4 4 4M5 30l4-4 4 4', KUNING, 2.8) + gs('M35 21l4-4 4 4M35 30l4-4 4 4', KUNING, 2.8)),
  lari, jog: lari,
  reli: svg(b(8, 4, 4.5, 40, KAYU, 1.5) + b(12, 6, 30, 21, PUTIH, 1.5) + [0, 1, 2].map(r => [0, 1, 2, 3].map(c => (r + c) % 2 ? '' : kt(12 + c * 7.5, 6 + r * 7, 7.5, 7)).join('')).join('') + b(12, 6, 30, 21, 'none', 1.5)),
  lomba: svg(piala),
  sawah: svg(gs('M24 40V12M15 40c1-9 0-16-4-22M33 40c-1-9 0-16 4-22', '#4f8a1e', 3) + b(21, 6, 6, 9, KUNING, 3) + b(8, 13, 6, 9, KUNING, 3, 'rotate(-20 11 17)') + b(34, 13, 6, 9, KUNING, 3, 'rotate(20 37 17)') + b(5, 38, 38, 6, KAYU, 2)),
  bangun: svg(`<g transform="rotate(40 24 24)">` + b(21, 16, 6, 29, KAYU, 2) + b(11, 5, 26, 11, ABU, 2) + kt(14, 8, 8, 2.5, PUTIH) + '</g>'),
  tendang: svg(bl(24, 24, 18, PUTIH) + b(18.5, 18.5, 11, 11, G, 2, 'rotate(45 24 24)') + kt(22, 6.5, 4, 4) + kt(6.5, 22, 4, 4) + kt(37.5, 22, 4, 4) + kt(22, 37.5, 4, 4)),
  ambil: svg(b(11, 10, 6, 16, KULIT, 3) + b(17.5, 6, 6, 18, KULIT, 3) + b(24, 7, 6, 17, KULIT, 3) + b(30.5, 11, 6, 14, KULIT, 3) + b(35, 19, 6, 13, KULIT, 3, 'rotate(35 38 25)') + b(11, 21, 26, 22, KULIT, 6)),
  mancing: svg(gs('M7 43L37 6', G, 6.6) + gs('M7 43L37 6', KAYU, 3.4) + gs('M37 6c4 8 4 16 3 22', TERANG, 1.6) + b(36.5, 23, 7, 7, MERAH, 3.5) + gs('M40 31v5a3 3 0 0 1-6 0', TERANG, 2) + b(9, 31, 9, 9, ABU, 3)),
  makan: svg(p('M6 24c6-9 18-12 29-6l8-7v26l-8-7c-11 6-23 3-29-6z', BIRU) + p('M19 15l6-6 4 7z', BIRU) + kt(12, 20, 4, 4) + gs('M23 17v14M28 18v12', G, 1.8)),
  tanam: svg(gs('M24 36V19', '#2f7d32', 3.4) + p('M24 24c-2-8-10-10-16-8 1 7 8 10 16 8z', HIJAU) + p('M24 20c2-9 10-11 16-9-1 7-8 11-16 9z', HIJAU) + b(5, 34, 38, 10, KAYU, 3) + kt(12, 38, 4, 2.5, '#a06a34') + kt(30, 39, 4, 2.5, '#a06a34')),
  panen: svg(b(11, 9, 10, 10, MERAH, 3) + b(21, 6, 10, 10, KUNING, 3) + b(29, 10, 9, 9, HIJAU, 3) + p('M4 17h40l-4 26H8z', KAYU) + gs('M6 26h36M7 34h34', G, 1.8) + gs('M17 17l-1 26M31 17l1 26', G, 1.8)),
  jual: svg(p('M16 12l-4-7h24l-4 7z', '#e0b060') + p('M15 16h18c6 6 10 12 10 18 0 6-4 9-19 9S5 40 5 34c0-6 4-12 10-18z', '#e0b060') + b(16, 11, 16, 6, KAYU, 2) + bl(24, 30, 7, KUNING) + kt(22.5, 28.5, 3, 3)),
  pasar: svg(b(6, 20, 36, 23, PUTIH, 1) + kt(11, 21, 4.5, 21, MERAH) + kt(21.75, 21, 4.5, 21, MERAH) + kt(32.5, 21, 4.5, 21, MERAH) + b(6, 20, 36, 23, 'none', 1) + p('M3 21L24 6l21 15z', MERAH) + p('M19 43V31h10v12', G) + b(22.8, 1.5, 2.4, 6, G, 1)),
  kafe: svg(gs('M3 8h7l6 26h24', TERANG, 3.4) + p('M12 13h32l-4 16H16z', BIRU) + gs('M22 13l1 16M32 13l-1 16', G, 1.8) + b(15, 36, 8, 8, BAJA, 4) + b(32, 36, 8, 8, BAJA, 4)),
  wahana: svg(gs('M24 21L13 44M24 21l11 23', ABU, 3.4) + `<circle cx="24" cy="21" r="15" fill="none" stroke="${TERANG}" stroke-width="2.6"/>` + gs('M24 6v30M9 21h30M13.4 10.4l21.2 21.2M34.6 10.4L13.4 31.6', ABU, 1.6)
    + [[24, 6, MERAH], [39, 21, KUNING], [24, 36, BIRU], [9, 21, HIJAU], [34.6, 10.4, BIRU], [34.6, 31.6, MERAH], [13.4, 31.6, KUNING], [13.4, 10.4, MERAH]].map(([x, y, f]) => b(x - 3, y - 3, 6, 6, f, 1.5)).join('') + b(9, 41, 30, 4, KAYU, 1.5)),
  willo: svg(p('M16 7L5 14l4 9 5-3v22h20V20l5 3 4-9-11-7c-1 4-4 6-8 6s-7-2-8-6z', KUNING) + gs('M18 25l2.5 8 3.5-6 3.5 6 2.5-8', G, 2.4)),
  dealer: svg(mobil), naik: svg(mobil), nebeng: svg(mobil + b(19, 2, 10, 10, PUTIH, 2.5) + kt(21.4, 6, 1.8, 2.4) + kt(24.8, 6, 1.8, 2.4)),
  turun: svg(p('M24 43L9 27h9V6h12v21h9z', KUNING)),
  suka: svg(p('M24 42L7 25c-6-6-4-16 4-18 6-1 10 2 13 7 3-5 7-8 13-7 8 2 10 12 4 18z', MERAH) + kt(12, 13, 4, 6, PUTIH)),
  rawat: svg(b(22, 3, 4.5, 26, KAYU, 2) + b(16, 27, 16.5, 6, MERAH, 1.5) + p('M15 33h18.5l6 11H9z', KUNING) + gs('M19 36l-2 7M24.25 36v7M29.5 36l2 7', G, 1.6)),
  kerja: svg(p('M17 14V9h14v5', 'none') + b(5, 14, 38, 27, '#a0663a', 3) + gs('M5 26h38', G, 2) + b(20.5, 22.5, 7, 7, KUNING, 1.5)),
  lift: svg(b(7, 4, 34, 40, ABU, 3) + b(17, 7, 14, 7, G, 1.5) + gs('M21 12l3-3 3 3', KUNING, 1.8) + b(11, 17, 12.5, 27, '#e4eaf0', 1) + b(24.5, 17, 12.5, 27, '#e4eaf0', 1)),
  koin: svg(bl(24, 24, 19, EMAS) + b(14, 14, 20, 20, KUNING, 5) + kt(18, 18, 4, 8, PUTIH)),
  permata: svg(p('M12 7h24l9 13-21 23L3 20z', BIRU) + gs('M3 20h42M12 7l6 13 6-13 6 13 6-13M18 20l6 23 6-23', G, 1.6) + kt(14, 11, 3, 6, PUTIH)),
};

// id tombol HUD -> ikon. Tombol yang tidak terdaftar (mis. Gerak, sudah SVG sendiri) dibiarkan.
const PETA = {
  bRumah: 'rumah', bKamera: 'kamera', bMisi: 'misi', bPeringkat: 'peringkat', bDukung: 'dukung', bGame: 'game', bDusun: 'dusun', bAtur: 'atur', bBukaChat: 'chat',
  sLompat: 'lompat', sLari: 'lari', sReli: 'reli', sLomba: 'lomba', sSawah: 'sawah', sBangun: 'bangun', sTendang: 'tendang', sAmbil: 'ambil', sMancing: 'mancing',
  sMakan: 'makan', sTanam: 'tanam', sPanen: 'panen', sJual: 'jual', sPasar: 'pasar', sKafe: 'kafe', sWahana: 'wahana', sJog: 'jog', sWillo: 'willo',
  sDealer: 'dealer', sNaik: 'naik', sNebeng: 'nebeng', sTurun: 'turun', sSuka: 'suka', sRawat: 'rawat', sKerja: 'kerja', sLift: 'lift',
};
export function pasangIkonHUD(doc = document) {
  for (const [id, k] of Object.entries(PETA)) {
    const i = doc.getElementById(id)?.querySelector('i');
    if (i && IKON[k]) { i.className = 'ikDK'; i.innerHTML = IKON[k]; }
  }
}
export const angkaDompet = (k, n) => `${IKON[k]}<b>${n}</b>`;

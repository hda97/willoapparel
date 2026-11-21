// CUACA HARIAN TIAP DUSUN (Huda 21 Nov 2026: "Saya mau cuaca dusun berubah setiap hari").
// Musim tiap dusun tetap (js/musim.js: warna alam dipanggang sekali), cuaca di atasnya berganti tiap hari.
// Cuaca dihitung dari tanggal WIB + nama dusun, jadi SAMA untuk semua warga tanpa server, dan ganti sendiri jam 00.00 WIB.
// Pilihan cuaca mengikuti musimnya (Curug tidak hujan deras, Wetan tidak bersalju). Yang berubah hanya:
// jumlah & arah partikel (tetap 1 draw call), warna langit, terang cahaya, jarak kabut, dan kilat sesekali saat hujan petir.
// Pratinjau: ?cuaca=badai (id cuaca dari daftar di bawah) memaksa cuaca tertentu.

// p = partikel (null = tanpa partikel), n = kali jumlah partikel, angin = dorongan ke samping,
// cahaya/kabut = pengali terhadap musim, mendung = langit ke abu-abu (0..1), cerah = langit ke biru bersih (0..1), w = bobot peluang
const MENU = {
  hujan: [
    {id: 'deras',   nama: 'Hujan Deras',   ik: 'hujan',   p: 'hujan', n: 1.3, cahaya: .86, kabut: .78, mendung: .35, w: 3},
    {id: 'gerimis', nama: 'Gerimis',       ik: 'gerimis', p: 'hujan', n: .4, tipis: 1, cahaya: .95, kabut: .92, mendung: .18, w: 3},
    {id: 'badai',   nama: 'Hujan Petir',   ik: 'badai',   p: 'hujan', n: 1.5, angin: 1, cahaya: .74, kabut: .66, mendung: .5, kilat: 1, w: 1},
    {id: 'mendung', nama: 'Mendung',       ik: 'mendung', p: null, cahaya: .9, kabut: .92, mendung: .32, w: 2},
    {id: 'terang',  nama: 'Cerah Berawan', ik: 'berawan', p: null, cahaya: 1.14, kabut: 1.2, cerah: .45, w: 1},
  ],
  semi: [
    {id: 'cerah',   nama: 'Cerah',         ik: 'cerah',   p: 'kelopak', n: 1, cahaya: 1.03, cerah: .2, w: 3},
    {id: 'angin',   nama: 'Berangin',      ik: 'angin',   p: 'kelopak', n: 1.8, angin: 2.4, w: 2},
    {id: 'berawan', nama: 'Berawan',       ik: 'berawan', p: 'kelopak', n: .6, cahaya: .92, mendung: .16, w: 2},
    {id: 'gerimis', nama: 'Gerimis',       ik: 'gerimis', p: 'hujan', n: .35, tipis: 1, cahaya: .88, kabut: .9, mendung: .26, w: 1},
  ],
  salju: [
    {id: 'lebat',   nama: 'Salju Lebat',   ik: 'salju',   p: 'salju', n: 1.5, angin: .7, cahaya: .9, kabut: .62, mendung: .26, w: 2},
    {id: 'tipis',   nama: 'Salju Tipis',   ik: 'salju',   p: 'salju', n: .5, w: 3},
    {id: 'dingin',  nama: 'Cerah Dingin',  ik: 'cerah',   p: null, cahaya: 1.08, kabut: 1.25, cerah: .5, w: 2},
    {id: 'kabut',   nama: 'Berkabut',      ik: 'kabut',   p: 'salju', n: .3, kabut: .45, mendung: .22, w: 1},
  ],
  gugur: [
    {id: 'angin',   nama: 'Berangin',      ik: 'angin',   p: 'daun', n: 1.8, angin: 2.4, w: 2},
    {id: 'cerah',   nama: 'Cerah',         ik: 'cerah',   p: 'daun', n: 1, cahaya: 1.03, cerah: .2, w: 3},
    {id: 'kabut',   nama: 'Berkabut',      ik: 'kabut',   p: 'daun', n: .5, kabut: .5, mendung: .2, w: 2},
    {id: 'gerimis', nama: 'Gerimis',       ik: 'gerimis', p: 'hujan', n: .4, tipis: 1, cahaya: .88, kabut: .9, mendung: .26, w: 1},
  ],
  panas: [
    {id: 'terik',   nama: 'Cerah Terik',   ik: 'cerah',   p: null, cahaya: 1.06, cerah: .3, w: 3},
    {id: 'berawan', nama: 'Berawan',       ik: 'berawan', p: null, cahaya: .92, mendung: .16, w: 2},
    {id: 'badai',   nama: 'Hujan Petir',   ik: 'badai',   p: 'hujan', n: 1.1, angin: 1, cahaya: .76, kabut: .7, mendung: .45, kilat: 1, w: 1},
  ],
};

// tanggal WIB "2026-11-21" (cuaca ganti jam 00.00 WIB)
export const kunciHari = (ms = Date.now()) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10);
// acak tetap dari teks (FNV-1a + pengaduk), 0..1
function acak(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// cuaca dusun `di` (musim `idMusim`) pada tanggal `tgl` (default hari ini WIB)
export function cuacaHari(di, idMusim, tgl = kunciHari()) {
  const daftar = MENU[idMusim]; if (!daftar) return null;
  const u = typeof location !== 'undefined' && new URLSearchParams(location.search).get('cuaca');
  let c = u && Object.values(MENU).flat().find(x => x.id === u);
  if (!c) {
    const tot = daftar.reduce((s, x) => s + x.w, 0); let r = acak(tgl + '|' + di) * tot;
    c = daftar.find(x => (r -= x.w) < 0) || daftar[0];
  }
  return {...c, tgl};
}

// warna langit siang & malam setelah cuaca (mendung = abu-abu, cerah = biru bersih)
const campur = (a, b, t) => { const k = (x, s) => (x >> s) & 255, m = s => Math.round(k(a, s) + (k(b, s) - k(a, s)) * t) << s; return m(16) | m(8) | m(0); };
export function warnaLangit(M, C) {
  let langit = M ? M.langit : 0xbfe4ff, malam = M ? M.malam : 0x1a2448;
  if (C && C.mendung) { langit = campur(langit, 0x8f99a5, C.mendung); malam = campur(malam, 0x14171f, C.mendung * .7); }
  if (C && C.cerah) langit = campur(langit, 0x7cc0f6, C.cerah);
  return {langit, malam};
}

// ---------- ikon piksel 12x12 khas Dunia Kotak (bukan emoji) ----------
const PAL = {K: '#2a2218', Y: '#f2c14a', O: '#e8742a', W: '#ffffff', w: '#dfe6ee', g: '#9aa6b4', d: '#5f6b7a', D: '#434c58', B: '#5ab4ff', L: '#ffe14a'};
const AWAN = ['....www.....', '..wwWWwww...', '.wWWWWWWww..', 'wWWWWWWWWWw.', 'wwwwwwwwwwww', '.gggggggggg.'];
const AWAN_GELAP = ['....ggg.....', '..ggwwggg...', '.gwwwwwwgg..', 'gwwwwggggwg.', 'gggggggggggg', '.dddddddddd.'];
const IKON = {
  cerah:   ['.....Y......', '..Y..Y..Y...', '...YYYYY....', '..YYOOOYY...', 'YYYOYYYOYYY.', '..YOYYYYOY..', '..YYOOOYY...', '...YYYYY....', '..Y..Y..Y...', '.....Y......', '............', '............'],
  berawan: ['.....Y......', '..Y.YYY.Y...', '...YYOYY....', '..YYOYYYY...', '.Y.YYwww.Y..', '...YwWWWw...', '..wwWWWWWww.', '.wWWWWWWWWWw', '.wwwwwwwwwww', '..gggggggg..', '............', '............'],
  mendung: ['............', '............', ...AWAN, '..gggggggg..', '............', '............', '............'],
  gerimis: [...AWAN, '............', '..B.....B...', '.....B......', '.B......B...', '....B.....B.', '............'],
  hujan:   [...AWAN, '.B..B..B..B.', 'B..B..B..B..', '.B..B..B..B.', 'B..B..B..B..', '.B..B..B..B.', '............'],
  badai:   [...AWAN_GELAP, '.....LL.....', '....LL......', '...LLLLL....', '.....LL.....', '....LL......', '...L........'],
  salju:   [...AWAN, '.W....W.....', '...W....W...', 'W....W....W.', '..W....W....', '.....W....W.', '.W..........'],
  kabut:   ['............', 'wwwwwwww....', '............', '..wwwwwwwwww', '............', 'wwwwwwwww...', '............', '...wwwwwwwww', '............', 'wwwwwwwwwww.', '............', '............'],
  angin:   ['............', 'wwwwwwwww...', '.........w..', 'wwwwwwwwww..', '............', '..wwwwwwwww.', '...........w', 'wwwww......w', '.....w...ww.', '......ww....', '............', '............'],
};
export function svgCuaca(ik, cls = 'ikCu') {
  const g = IKON[ik] || IKON.cerah; let r = '';
  g.forEach((baris, y) => { for (let x = 0; x < baris.length; x++) { const w = PAL[baris[x]]; if (w) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${w}"/>`; } });
  return `<svg class="${cls}" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}

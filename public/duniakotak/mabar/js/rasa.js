// Getar HP untuk semua game Dunia Kotak (Huda 20 Nov 2026: "tambahkan getar saat main game … dan getar ini ke mini game yang lain").
// Satu tempat untuk pola getar + saklar nyala/mati yang diingat di HP (localStorage dk_getar: '0' = mati).
// Catatan: iPhone (Safari & browser di iOS) tidak punya fitur getar untuk situs web, jadi di iPhone getar diam saja tanpa galat.
// Saklar suara memakai kunci yang sama dengan desa (dk_suara: 'semua' | 'efek' | 'senyap').
const baca = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const tulis = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

export const bisaGetar = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
export const getarNyala = () => baca('dk_getar') !== '0';
export function aturGetar(on) { tulis('dk_getar', on ? '1' : '0'); if (on) getar('klik'); }

// suara efek nyala kecuali warga memilih "senyap" (di desa atau di lobi mini game)
export const suaraNyala = () => { const s = baca('dk_suara'); return s !== 'senyap' && s !== '"senyap"'; };
export function aturSuara(on) { tulis('dk_suara', on ? 'semua' : 'senyap'); }

// pola getar (milidetik: getar, jeda, getar, …). Dibuat pendek supaya terasa "tuk" dan tidak mengganggu.
export const POLA = {
  klik: 12,                         // tombol / ambil barang
  tuk: 25,                          // kejadian kecil (gerbang, tugas selesai)
  sambar: [60, 40, 90],             // ikan menyambar umpan
  lawan: [35, 30, 35],              // ikan menyentak
  tegang: 18,                       // denyut senar tegang (diulang)
  kendor: [80, 50, 40],             // senar kendor
  tabrak: 70,                       // nyerempet / menabrak
  dapat: [50, 40, 50, 40, 140],     // dapat ikan / panen / finish
  besar: [60, 40, 60, 40, 60, 40, 220], // ikan besar / rekor baru
  gagal: [40, 60, 40],
};

let akhir = 0;
export function getar(pola = 'tuk') {
  if (!bisaGetar || !getarNyala()) return;
  try {
    const p = typeof pola === 'string' ? POLA[pola] ?? 25 : pola;
    const now = performance.now(); if (typeof p === 'number' && p < 30 && now - akhir < 60) return; // denyut kecil jangan menumpuk
    akhir = now; navigator.vibrate(p);
  } catch (e) {}
}

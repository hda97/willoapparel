// Ikon tombol HUD gaya KOTAK 3D seperti isi game (Huda 21 Nov 2026: ikon SVG datar "jelek", pilih "Kotak 3D seperti isi game").
// Semua ikon = model kotak-kotak 3D (three.js) yang difoto miring, digabung jadi satu lembar sprite ikon-kotak.png (8 x 5 sel, 96 px).
// Emoji di index.html tetap ada sebagai cadangan kalau modul ini gagal dimuat.
// Membuat ulang sprite: model & skrip render ada di tools/ikon-kotak/ (node render.js lalu susun.py).
const KOLOM = 8, BARIS = 5, URL = '/duniakotak/mabar/ikon-kotak.png?v=20261121a';
const POS = {ambil: [0, 0], atur: [1, 0], bangun: [2, 0], chat: [3, 0], dukung: [4, 0], dusun: [5, 0], game: [6, 0], gerak: [7, 0], jual: [0, 1], kafe: [1, 1],
  kamera: [2, 1], kerja: [3, 1], koin: [4, 1], lari: [5, 1], lift: [6, 1], lompat: [7, 1], makan: [0, 2], mancing: [1, 2], misi: [2, 2], nebeng: [3, 2], panen: [4, 2],
  pasar: [5, 2], peringkat: [6, 2], permata: [7, 2], rawat: [0, 3], reli: [1, 3], rumah: [2, 3], sawah: [3, 3], suka: [4, 3], tanam: [5, 3], tendang: [6, 3], turun: [7, 3],
  wahana: [0, 4], willo: [1, 4], mobil: [2, 4]};
Object.assign(POS, {lomba: POS.peringkat, jog: POS.lari, naik: POS.mobil, dealer: POS.mobil});
const sel = ([c, r]) => `<i class="ik3" aria-hidden="true" style="background-image:url(${URL});background-position:${c / (KOLOM - 1) * 100}% ${r / (BARIS - 1) * 100}%"></i>`;
export const IKON = Object.fromEntries(Object.entries(POS).map(([k, p]) => [k, sel(p)]));

// id tombol HUD -> ikon
const PETA = {
  bRumah: 'rumah', bKamera: 'kamera', bMisi: 'misi', bPeringkat: 'peringkat', bDukung: 'dukung', bGame: 'game', bDusun: 'dusun', bAtur: 'atur', bBukaChat: 'chat',
  sLompat: 'lompat', sGerak: 'gerak', sLari: 'lari', sReli: 'reli', sLomba: 'lomba', sSawah: 'sawah', sBangun: 'bangun', sTendang: 'tendang', sAmbil: 'ambil', sMancing: 'mancing',
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

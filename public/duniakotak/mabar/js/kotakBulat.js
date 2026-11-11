// Kotak bulat (RoundedBoxGeometry) versi ringan untuk HP — 8 Nov 2026.
// Semua aset game (rumah, fasum, avatar, kucing, tanaman) memakai kotak bersudut bulat. Versi aslinya membuat
// sudut bulat 3 lapis (588 segitiga per kotak). Di HP sudutnya dibuat 1 lapis (108 segitiga): bentuk, ukuran,
// warna, dan jari-jari sudut tetap sama, hanya lengkungan sudutnya lebih sederhana. Di komputer tidak berubah.
// Dipasang lewat importmap di index.html: 'three/addons/geometries/RoundedBoxGeometry.js' -> file ini.
import {RoundedBoxGeometry as Asli} from '/duniakotak/three/0.169.0/jsm/geometries/RoundedBoxGeometry.js';

const ua = navigator.userAgent || '';
export const HP = /Android|iPhone|iPad|iPod|Mobile|Instagram|FBAN|FBAV|TikTok|musical_ly|BytedanceWebview/i.test(ua)
  || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))
  || (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 8) <= 4;

export class RoundedBoxGeometry extends Asli {
  constructor(w = 1, h = 1, d = 1, lapis = 2, r = .1) { super(w, h, d, HP ? Math.min(lapis, 1) : lapis, r); }
  // clone() bawaan three.js membangun ulang kotak bulat dari nol (lambat sekali saat desa digabung per warna);
  // cukup buat kotak polos murah lalu salin isinya.
  clone() { return new Asli(1, 1, 1, 0, 0).copy(this); }
}

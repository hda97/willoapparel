import { Platform } from 'react-native';

// Baca teks struk langsung di HP (Google ML Kit, offline, gratis). Foto tidak dikirim ke mana pun.
export async function bacaTeksGambar(uri) {
  if (Platform.OS === 'web') throw new Error('Scan struk hanya jalan di aplikasi Android/iOS. Pakai "Tempel teks" di web.');
  const TextRecognition = require('@react-native-ml-kit/text-recognition').default;
  const hasil = await TextRecognition.recognize(uri);
  // Susun ulang per baris berdasarkan posisi vertikal, supaya nama item & harga yang sejajar jadi satu baris.
  const baris = [];
  for (const blok of hasil.blocks || []) {
    for (const l of blok.lines || []) {
      const f = l.frame || {};
      baris.push({ teks: l.text, y: (f.top || 0) + (f.height || 0) / 2, x: f.left || 0, h: f.height || 20 });
    }
  }
  if (!baris.length) return hasil.text || '';
  baris.sort((a, b) => a.y - b.y);
  const grup = [];
  for (const b of baris) {
    const g = grup[grup.length - 1];
    if (g && Math.abs(g.y - b.y) < Math.min(g.h, b.h) * 0.6) { g.isi.push(b); }
    else grup.push({ y: b.y, h: b.h, isi: [b] });
  }
  return grup.map((g) => g.isi.sort((a, b) => a.x - b.x).map((x) => x.teks).join('   ')).join('\n');
}

// Catatan pengeluaran pribadi: gabungan catatan manual + "bagian saya" dari tiap tagihan patungan.
import { hitungTagihan } from './hitung.js';

export const KATEGORI = [
  { id: 'makan', nama: 'Makan & Minum', ikon: '🍜', warna: '#F97316' },
  { id: 'transport', nama: 'Transportasi', ikon: '🛵', warna: '#0EA5E9' },
  { id: 'belanja', nama: 'Belanja', ikon: '🛒', warna: '#10B981' },
  { id: 'kos', nama: 'Kos & Tagihan', ikon: '🏠', warna: '#6C63FF' },
  { id: 'hiburan', nama: 'Hiburan', ikon: '🎬', warna: '#EC4899' },
  { id: 'kesehatan', nama: 'Kesehatan', ikon: '💊', warna: '#EF4444' },
  { id: 'pendidikan', nama: 'Pendidikan', ikon: '📚', warna: '#EAB308' },
  { id: 'lain', nama: 'Lainnya', ikon: '📦', warna: '#64748B' },
];
export const kategoriById = (id) => KATEGORI.find((k) => k.id === id) || KATEGORI[KATEGORI.length - 1];

export const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function bacaTanggal(s) {
  const m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? { h: +m[1], b: +m[2], t: +m[3] } : null;
}
export const kunciBulan = (t, b) => `${t}-${String(b).padStart(2, '0')}`;
export function geserBulan(t, b, n) {
  const x = t * 12 + (b - 1) + n;
  return { t: Math.floor(x / 12), b: (x % 12) + 1 };
}

// Orang "saya" di sebuah tagihan: yang ditandai, atau yang namanya sama dengan nama di pengaturan, atau orang pertama.
export function idSaya(tg, namaSaya) {
  if (tg.saya && tg.orang.some((o) => o.id === tg.saya)) return tg.saya;
  const n = (namaSaya || '').trim().toLowerCase();
  const cocok = n && tg.orang.find((o) => o.nama.trim().toLowerCase() === n);
  return cocok ? cocok.id : tg.orang[0]?.id;
}

export function daftarPengeluaran(data) {
  const hasil = [];
  for (const p of data.pengeluaran || []) {
    hasil.push({ ...p, nominal: Number(p.nominal) || 0, sumber: 'manual' });
  }
  for (const tg of data.tagihan || []) {
    const saya = idSaya(tg, data.pengaturan?.namaSaya);
    const h = hitungTagihan(tg);
    const bagian = h.perOrang.find((p) => p.id === saya);
    if (!bagian || bagian.totalBulat <= 0) continue;
    hasil.push({
      id: 'tg-' + tg.id, tagihanId: tg.id, tanggal: tg.tanggal, judul: tg.judul || 'Patungan',
      kategori: tg.kategori || 'makan', nominal: bagian.totalBulat, sumber: 'tagihan',
      catatan: `Bagian saya dari ${formatSingkat(h.total)} · ${tg.orang.length} orang`,
    });
  }
  return hasil.sort((a, b) => urut(b) - urut(a));
}

function urut(p) {
  const d = bacaTanggal(p.tanggal);
  return (d ? d.t * 10000 + d.b * 100 + d.h : 0) * 1e13 + (p.dibuat || 0);
}
function formatSingkat(n) {
  return 'Rp' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function filterBulan(daftar, t, b) {
  return daftar.filter((p) => { const d = bacaTanggal(p.tanggal); return d && d.t === t && d.b === b; });
}

export function rekapBulan(daftar, t, b) {
  const isi = filterBulan(daftar, t, b);
  const total = isi.reduce((a, p) => a + p.nominal, 0);
  const per = {};
  for (const p of isi) per[p.kategori] = (per[p.kategori] || 0) + p.nominal;
  const perKategori = KATEGORI.filter((k) => per[k.id]).map((k) => ({ ...k, total: per[k.id], persen: total ? per[k.id] / total * 100 : 0 }))
    .sort((a, b2) => b2.total - a.total);
  const hari = new Date(t, b, 0).getDate();
  return { isi, total, perKategori, jumlah: isi.length, rataHarian: total / hari };
}

export function trenBulanan(daftar, t, b, n = 6) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const x = geserBulan(t, b, -i);
    out.push({ ...x, label: BULAN[x.b - 1].slice(0, 3), total: filterBulan(daftar, x.t, x.b).reduce((a, p) => a + p.nominal, 0) });
  }
  return out;
}

// Teman yang paling sering patungan bersama di bulan itu.
export function temanBulan(data, t, b) {
  const m = {};
  for (const tg of data.tagihan || []) {
    const d = bacaTanggal(tg.tanggal);
    if (!d || d.t !== t || d.b !== b) continue;
    const saya = idSaya(tg, data.pengaturan?.namaSaya);
    const h = hitungTagihan(tg);
    for (const p of h.perOrang) {
      if (p.id === saya) continue;
      const k = p.nama.trim().toLowerCase();
      m[k] = m[k] || { nama: p.nama, kali: 0, total: 0 };
      m[k].kali += 1;
      m[k].total += p.totalBulat;
    }
  }
  return Object.values(m).sort((a, b2) => b2.kali - a.kali || b2.total - a.total);
}

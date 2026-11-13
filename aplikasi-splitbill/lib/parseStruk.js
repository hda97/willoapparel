// Mengubah teks struk (hasil OCR atau tempelan) menjadi daftar item + biaya tambahan.
import { parseAngka } from './hitung.js';

const HARGA_RE = /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{3,7})(?:[.,]\d{2})?\s*-?\s*$/i;
const KUNCI = {
  subtotal: /\b(sub\s*-?\s*total|subtotal|sub ttl|jumlah)\b/i,
  total: /\b(grand\s*total|total|ttl|jumlah\s*bayar|tagihan)\b/i,
  pajak: /\b(ppn|pajak|tax|pb\s*1|pb1|vat|resto\s*tax)\b/i,
  service: /\b(service|servis|svc|srv|layanan)\b/i,
  diskon: /\b(diskon|disc|discount|potongan|promo|voucher|hemat)\b/i,
  ongkir: /\b(ongkir|ongkos\s*kirim|delivery|biaya\s*kirim|antar)\b/i,
};
const ABAIKAN = /\b(tunai|cash|kembali|kembalian|change|bayar|debit|kredit|credit|qris|ovo|gopay|dana|shopeepay|kartu|card|npwp|telp|tel\.?|phone|kasir|cashier|meja|table|tanggal|date|jam|time|no\.?\s*(nota|struk|bill|order|trx)|order\s*#|bill\s*#|terima\s*kasih|thank|www\.|\.com|instagram|wifi|password|item\(s\)|qty\s*:?\s*\d+\s*$|pax|guest|tamu|struk|receipt|invoice|alamat|jl\.|jalan|kab\.|kota)\b/i;

function bersihNama(s) {
  return s
    .replace(/(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{3,7})(?:[.,]\d{2})?\s*-?\s*$/i, '')
    .replace(/[|*#_~=]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function ambilQty(nama, harga) {
  let qty = 1;
  let n = nama;
  // "2 x 15.000" / "2x @15.000" di akhir nama
  let m = n.match(/(\d{1,2})\s*[xX×]\s*@?\s*(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{3,7})?\s*$/);
  if (m) {
    qty = parseInt(m[1], 10);
    n = n.slice(0, m.index).trim();
    return { nama: n, qty, harga: harga / qty };
  }
  // "@15.000" di akhir -> harga satuan
  m = n.match(/@\s*(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{3,7})\s*$/);
  if (m) {
    const satuan = parseAngka(m[1]);
    n = n.slice(0, m.index).trim();
    const q = satuan ? Math.round(harga / satuan) : 1;
    const m2 = n.match(/^(\d{1,2})\s*[xX×]?\s+/);
    if (m2) n = n.slice(m2[0].length);
    return { nama: n, qty: q || 1, harga: satuan || harga };
  }
  // "2 Nasi Goreng" / "2x Nasi Goreng" di awal
  m = n.match(/^(\d{1,2})\s*[xX×]?\s+(?=\D)/);
  if (m) {
    qty = parseInt(m[1], 10) || 1;
    n = n.slice(m[0].length);
    return { nama: n, qty, harga: harga / qty };
  }
  return { nama: n, qty: 1, harga };
}

export function parseStruk(teks) {
  const baris = String(teks || '')
    .split(/\r?\n/)
    .map((b) => b.replace(/\t/g, ' ').trim())
    .filter(Boolean);
  const hasil = { items: [], subtotal: 0, total: 0, pajak: 0, service: 0, diskon: 0, ongkir: 0 };
  const namaTanpaHarga = [];
  const hargaTanpaNama = [];
  let selesaiItem = false;

  for (const b of baris) {
    const mHarga = b.match(HARGA_RE);
    const harga = mHarga ? parseAngka(mHarga[0]) : 0;
    const nama = bersihNama(b);
    const hurufCukup = (nama.match(/[a-z]/gi) || []).length >= 2;

    let jenis = null;
    for (const k of ['subtotal', 'pajak', 'service', 'diskon', 'ongkir', 'total']) {
      if (KUNCI[k].test(b)) { jenis = k; break; }
    }
    if (jenis) {
      if (harga) {
        if (jenis === 'total') { if (!hasil.total) hasil.total = harga; }
        else hasil[jenis] = (jenis === 'subtotal' ? 0 : hasil[jenis]) + harga;
      }
      if (jenis === 'subtotal' || jenis === 'total') selesaiItem = true;
      continue;
    }
    if (ABAIKAN.test(b)) continue;
    if (selesaiItem) continue;

    if (harga && hurufCukup) {
      const q = ambilQty(nama, harga);
      if (q.nama && (q.nama.match(/[a-z]/gi) || []).length >= 2) hasil.items.push({ nama: rapikan(q.nama), harga: Math.round(q.harga), qty: q.qty });
    } else if (harga && !hurufCukup) {
      // baris harga saja (struk berkolom: nama dan harga terbaca terpisah)
      const qtyM = b.match(/^(\d{1,2})\s*[xX×]/);
      hargaTanpaNama.push({ harga, qty: qtyM ? parseInt(qtyM[1], 10) : 1 });
    } else if (hurufCukup && nama.length <= 40) {
      namaTanpaHarga.push(nama);
    }
  }

  // Pasangkan nama & harga yang terbaca terpisah, kalau jumlahnya cocok
  if (!hasil.items.length && namaTanpaHarga.length && hargaTanpaNama.length) {
    const jml = Math.min(namaTanpaHarga.length, hargaTanpaNama.length);
    const offset = namaTanpaHarga.length - jml; // nama paling atas biasanya nama toko
    for (let i = 0; i < jml; i++) {
      const h = hargaTanpaNama[i];
      const q = ambilQty(namaTanpaHarga[offset + i], h.harga);
      const qty = h.qty > 1 ? h.qty : q.qty;
      hasil.items.push({ nama: rapikan(q.nama), harga: Math.round(h.harga / qty), qty });
    }
  }

  const sub = hasil.items.reduce((a, it) => a + it.harga * it.qty, 0);
  const dasar = hasil.subtotal || sub;
  hasil.servicePersen = dasar && hasil.service ? bulat1(hasil.service / dasar * 100) : 0;
  hasil.pajakPersen = dasar && hasil.pajak ? bulat1(hasil.pajak / (dasar + hasil.service) * 100) : 0;
  hasil.cocok = hasil.subtotal ? Math.abs(hasil.subtotal - sub) < 1 : null;
  return hasil;
}

function bulat1(x) { return Math.round(x * 10) / 10; }
function rapikan(s) {
  const t = s.replace(/^[^a-z0-9]+/i, '').trim();
  if (t === t.toUpperCase()) return t.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return t;
}

// Menyusun data tagihan menjadi baris-baris tabel untuk file Excel. Fungsi murni (bisa diuji di Node).
import { statusTagihan } from './hitung.js';
import { KATEGORI, kategoriById, bacaTanggal, BULAN } from './pengeluaran.js';

const r = (n) => Math.round(Number(n) || 0);

function urutTanggal(tg) {
  const m = String(tg.tanggal || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? Number(m[3]) * 10000 + Number(m[2]) * 100 + Number(m[1]) : 0;
}

export function susunEkspor(daftarTagihan) {
  const daftar = [...daftarTagihan].sort((a, b) => urutTanggal(a) - urutTanggal(b) || (a.dibuat || 0) - (b.dibuat || 0));
  const ringkasan = [['Tanggal', 'Judul', 'Cara bagi', 'Jumlah orang', 'Subtotal', 'Service', 'Pajak', 'Diskon', 'Ongkir', 'Total', 'Dibayar dulu oleh', 'Sudah bayar', 'Belum kembali', 'Status']];
  const perOrang = [['Tanggal', 'Judul', 'Nama', 'Bagian item', 'Service', 'Pajak', 'Diskon', 'Ongkir', 'Harus bayar', 'Status']];
  const item = [['Tanggal', 'Judul', 'Item', 'Qty', 'Harga satuan', 'Jumlah', 'Dibagi ke']];
  const teman = {}; // rekap per orang dari semua tagihan
  const jumlah = { subtotal: 0, service: 0, pajak: 0, diskon: 0, ongkir: 0, total: 0, sisa: 0 };

  for (const tg of daftar) {
    const s = statusTagihan(tg);
    const nama = Object.fromEntries(tg.orang.map((o) => [o.id, o.nama]));
    const lunas = tg.lunas || {};
    ringkasan.push([
      tg.tanggal || '', tg.judul || 'Patungan', tg.mode === 'rata' ? 'Bagi rata' : 'Sesuai pesanan', tg.orang.length,
      r(s.subtotal), r(s.service), r(s.pajak), r(s.diskon), r(s.ongkir), r(s.total),
      nama[tg.penalang] || '-', `${s.sudahLunas}/${s.jumlahWajib}`, r(s.sisa), s.selesai ? 'Lunas' : 'Belum lunas',
    ]);
    for (const k of Object.keys(jumlah)) jumlah[k] += r(s[k]);
    for (const p of s.perOrang) {
      perOrang.push([
        tg.tanggal || '', tg.judul || 'Patungan', p.nama, r(p.subtotal), r(p.service), r(p.pajak), r(p.diskon), r(p.ongkir), r(p.totalBulat),
        p.id === tg.penalang ? 'Bayar dulu' : lunas[p.id] ? 'Lunas' : 'Belum bayar',
      ]);
      const k = p.nama.trim().toLowerCase();
      const t = (teman[k] = teman[k] || { nama: p.nama, n: 0, bagian: 0, talangan: 0, sudah: 0, belum: 0 });
      t.n += 1;
      t.bagian += r(p.totalBulat);
      if (p.id === tg.penalang) t.talangan += r(s.total);
      else if (lunas[p.id]) t.sudah += r(p.totalBulat);
      else t.belum += r(p.totalBulat);
    }
    for (const it of tg.item || []) {
      const ikut = (it.ikut && it.ikut.length ? it.ikut.map((id) => nama[id]).filter(Boolean) : null);
      item.push([
        tg.tanggal || '', tg.judul || 'Patungan', it.nama || 'Item', Number(it.qty) || 1, r(it.harga), r((Number(it.harga) || 0) * (Number(it.qty) || 1)),
        tg.mode === 'rata' || !ikut ? 'Semua' : ikut.join(', '),
      ]);
    }
  }
  ringkasan.push([]);
  ringkasan.push(['', 'TOTAL', '', '', jumlah.subtotal, jumlah.service, jumlah.pajak, jumlah.diskon, jumlah.ongkir, jumlah.total, '', '', jumlah.sisa, '']);
  const rekapTeman = [['Nama', 'Ikut tagihan', 'Total bagian', 'Pernah bayar dulu', 'Sudah dibayar', 'Belum dibayar']];
  const urutTeman = Object.values(teman).sort((a, b) => b.belum - a.belum || b.bagian - a.bagian);
  for (const t of urutTeman) rekapTeman.push([t.nama, t.n, t.bagian, t.talangan, t.sudah, t.belum]);
  rekapTeman.push([]);
  rekapTeman.push(['TOTAL', urutTeman.reduce((a, t) => a + t.n, 0), urutTeman.reduce((a, t) => a + t.bagian, 0), urutTeman.reduce((a, t) => a + t.talangan, 0), urutTeman.reduce((a, t) => a + t.sudah, 0), urutTeman.reduce((a, t) => a + t.belum, 0)]);
  return { ringkasan, perOrang, item, rekapTeman, jumlahTagihan: daftar.length, total: jumlah.total, sisa: jumlah.sisa };
}

export function namaFileEkspor(judul) {
  const d = new Date();
  const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dasar = judul ? String(judul).replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) : 'catatan-pengeluaran';
  return `splitbill-${dasar || 'tagihan'}-${tgl}.xlsx`;
}

// Lembar "Pengeluaran Saya" + "Rekap Bulanan" (bulan × kategori).
export function susunPengeluaran(daftar) {
  const urut = [...daftar].sort((a, b) => urutTanggal(a) - urutTanggal(b));
  const baris = [['Tanggal', 'Keterangan', 'Kategori', 'Sumber', 'Catatan', 'Nominal']];
  let total = 0;
  const perBulan = {};
  for (const p of urut) {
    const k = kategoriById(p.kategori);
    baris.push([p.tanggal || '', p.judul || k.nama, `${k.ikon} ${k.nama}`, p.sumber === 'tagihan' ? 'Patungan' : 'Catatan', p.catatan || '', r(p.nominal)]);
    total += r(p.nominal);
    const d = bacaTanggal(p.tanggal);
    if (d) {
      const kb = d.t * 100 + d.b;
      perBulan[kb] = perBulan[kb] || {};
      perBulan[kb][k.id] = (perBulan[kb][k.id] || 0) + r(p.nominal);
    }
  }
  baris.push([]);
  baris.push(['', 'TOTAL', '', '', '', total]);
  const rekap = [['Bulan', ...KATEGORI.map((k) => `${k.ikon} ${k.nama}`), 'Total']];
  const jumlahKol = KATEGORI.map(() => 0);
  for (const kb of Object.keys(perBulan).map(Number).sort()) {
    const nilai = KATEGORI.map((k, i) => { const v = perBulan[kb][k.id] || 0; jumlahKol[i] += v; return v; });
    rekap.push([`${BULAN[(kb % 100) - 1]} ${Math.floor(kb / 100)}`, ...nilai, nilai.reduce((a, v) => a + v, 0)]);
  }
  rekap.push([]);
  rekap.push(['TOTAL', ...jumlahKol, jumlahKol.reduce((a, v) => a + v, 0)]);
  return { pengeluaran: baris, rekapBulanan: rekap, totalPengeluaran: total, jumlahCatatan: urut.length };
}

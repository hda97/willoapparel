// node test/ekspor.mjs <keluar.xlsx> : buat contoh file Excel dari data contoh
import { buatWorkbook, XLSX } from '../lib/bukuExcel.js';
const O = [{ id: 'a', nama: 'Huda' }, { id: 'b', nama: 'Rina' }, { id: 'c', nama: 'Dimas' }, { id: 'd', nama: 'Sari' }];
const data = [
  { id: 't1', judul: 'Makan malam Warung Bu Sri', tanggal: '12/11/2026', mode: 'item', penalang: 'a', pembulatan: 500, servicePersen: 5, pajakPersen: 10, lunas: { b: true }, orang: O.slice(0, 3),
    item: [{ nama: 'Nasi Goreng Spesial', harga: 25000, qty: 2, ikut: ['a', 'b'] }, { nama: 'Es Teh Manis', harga: 5000, qty: 3, ikut: [] }, { nama: 'Ayam Bakar', harga: 28000, qty: 1, ikut: ['c'] }] },
  { id: 't2', judul: 'Kopi sore', tanggal: '10/11/2026', mode: 'rata', penalang: 'b', lunas: { a: true, c: true }, orang: O.slice(0, 3), item: [{ nama: 'Kopi susu', harga: 18000, qty: 3 }] },
  { id: 't3', judul: 'Belanja bulanan kos', tanggal: '11/11/2026', mode: 'item', penalang: 'a', ongkir: 10000, diskon: 15000, lunas: {}, orang: O,
    item: [{ nama: 'Beras 5 kg', harga: 72000, qty: 1 }, { nama: 'Galon', harga: 20000, qty: 2 }, { nama: 'Sabun cuci', harga: 18500, qty: 1, ikut: ['a', 'd'] }, { nama: 'Mi instan', harga: 3500, qty: 10, ikut: ['b', 'c', 'd'] }] },
];
const wb = buatWorkbook(data, { tanggal: '12 November 2026' });
XLSX.writeFile(wb, process.argv[2] || 'contoh.xlsx');
console.log('ok', wb.SheetNames);

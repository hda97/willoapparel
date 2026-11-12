import test from 'node:test';
import assert from 'node:assert/strict';
import { hitungTagihan, parseAngka, formatRp, bulatkan, statusTagihan, pesanPerOrang, nomorWA } from '../lib/hitung.js';
import { parseStruk } from '../lib/parseStruk.js';

const O = [{ id: 'a', nama: 'Huda' }, { id: 'b', nama: 'Rina' }, { id: 'c', nama: 'Dimas' }];

test('parseAngka', () => {
  assert.equal(parseAngka('25.000'), 25000);
  assert.equal(parseAngka('Rp 1.250.000,00'), 1250000);
  assert.equal(parseAngka('25,000'), 25000);
  assert.equal(parseAngka('18000'), 18000);
  assert.equal(formatRp(1234567), 'Rp1.234.567');
  assert.equal(bulatkan(10101, 500), 10500);
});

test('bagi per item dengan service, pajak, diskon, ongkir', () => {
  const t = { orang: O, mode: 'item', servicePersen: 5, pajakPersen: 10, diskon: 11550, ongkir: 9000,
    item: [
      { id: 1, nama: 'Nasi Goreng', harga: 30000, qty: 2, ikut: ['a', 'b'] },
      { id: 2, nama: 'Es Teh', harga: 5000, qty: 3, ikut: [] },
      { id: 3, nama: 'Sate', harga: 25000, qty: 1, ikut: ['c'] },
    ] };
  const h = hitungTagihan(t);
  assert.equal(h.subtotal, 100000);
  assert.equal(h.service, 5000);
  assert.equal(h.pajak, 10500);
  assert.equal(Math.round(h.total), 100000 + 5000 + 10500 - 11550 + 9000);
  const jumlah = h.perOrang.reduce((a, p) => a + p.total, 0);
  assert.ok(Math.abs(jumlah - h.total) < 0.01);
  assert.equal(h.perOrang[0].subtotal, 35000);
  assert.equal(h.perOrang[2].subtotal, 30000);
});

test('bagi rata + pembulatan + status lunas', () => {
  const t = { orang: O, mode: 'rata', pembulatan: 1000, penalang: 'a', lunas: { b: true }, item: [{ id: 1, nama: 'Pizza', harga: 100000, qty: 1 }] };
  const s = statusTagihan(t);
  assert.equal(s.perOrang[0].totalBulat, 34000);
  assert.equal(s.jumlahWajib, 2);
  assert.equal(s.sudahLunas, 1);
  assert.equal(s.sisa, 34000);
  assert.match(pesanPerOrang(t, s.perOrang[1], { pembayaran: [{ jenis: 'BCA', nomor: '123', atasNama: 'Huda' }] }), /Total kamu: Rp34.000/);
});

test('nomor WA', () => {
  assert.equal(nomorWA('0858-1690-0722'), '6285816900722');
  assert.equal(nomorWA('+62 812 1'), '628121');
});

test('parse struk restoran', () => {
  const teks = `WARUNG BU SRI\nJl. Raya Ngawi 12\nKasir: Ani   12/11/2026\n2 Nasi Goreng Spesial   50.000\nEs Teh Manis 3 x 5.000   15.000\nAYAM BAKAR             28.000\nKerupuk @2.000  6.000\nSubtotal              99.000\nService 5%             4.950\nPB1 10%               10.395\nTOTAL                114.345\nTunai                150.000\nKembali               35.655\nTerima kasih`;
  const h = parseStruk(teks);
  assert.equal(h.items.length, 4);
  assert.deepEqual(h.items[0], { nama: 'Nasi Goreng Spesial', harga: 25000, qty: 2 });
  assert.deepEqual(h.items[1], { nama: 'Es Teh Manis', harga: 5000, qty: 3 });
  assert.deepEqual(h.items[2], { nama: 'Ayam Bakar', harga: 28000, qty: 1 });
  assert.deepEqual(h.items[3], { nama: 'Kerupuk', harga: 2000, qty: 3 });
  assert.equal(h.subtotal, 99000);
  assert.equal(h.servicePersen, 5);
  assert.equal(h.pajakPersen, 10);
  assert.equal(h.total, 114345);
  assert.equal(h.cocok, true);
});

test('parse struk berkolom (nama & harga terpisah)', () => {
  const teks = `Kopi Susu\nRoti Bakar\nMie Rebus\n18.000\n22.000\n15.000\nTotal 55.000`;
  const h = parseStruk(teks);
  assert.equal(h.items.length, 3);
  assert.equal(h.items[1].nama, 'Roti Bakar');
  assert.equal(h.items[1].harga, 22000);
});

// Membuat workbook Excel yang rapi & berwarna (header ungu, baris belang, status berwarna, baris total).
import XLSX from 'xlsx-js-style';
import { susunEkspor } from './ekspor.js';
import { formatRp } from './hitung.js';

const W = {
  ungu: '6C63FF', unguTua: '4B44CC', unguMuda: 'ECEBFF', belang: 'F7F6FF', garis: 'D9D7F5', abu: '6B6B80', putih: 'FFFFFF', teks: '1B1B2F',
  hijau: 'DCFCE7', hijauTeks: '166534', kuning: 'FEF3C7', kuningTeks: '92400E', lila: 'E9E7FF',
};
const FONT = 'Calibri';
const tepi = (warna = W.garis, gaya = 'thin') => ({ top: { style: gaya, color: { rgb: warna } }, bottom: { style: gaya, color: { rgb: warna } }, left: { style: gaya, color: { rgb: warna } }, right: { style: gaya, color: { rgb: warna } } });
const RP = '"Rp"#,##0;[Red]-"Rp"#,##0;"-"';

// kolom: [judul kolom, lebar, jenis] jenis: 'rp' | 'angka' | 'teks' | 'status' | 'tengah'
const LEMBAR = [
  { nama: 'Ringkasan', kunci: 'ringkasan', judul: 'Ringkasan Tagihan', kolom: [12, 32, 15, 8, 14, 12, 12, 12, 12, 15, 17, 11, 15, 13],
    jenis: ['tengah', 'teks', 'teks', 'tengah', 'rp', 'rp', 'rp', 'rp', 'rp', 'rp', 'teks', 'tengah', 'rp', 'status'] },
  { nama: 'Per Teman', kunci: 'rekapTeman', judul: 'Rekap per Teman (siapa masih utang)', kolom: [20, 13, 16, 18, 16, 16],
    jenis: ['teks', 'tengah', 'rp', 'rp', 'rp', 'rpMerah'] },
  { nama: 'Per Orang', kunci: 'perOrang', judul: 'Rincian per Orang per Tagihan', kolom: [12, 32, 18, 14, 12, 12, 12, 12, 15, 13],
    jenis: ['tengah', 'teks', 'teks', 'rp', 'rp', 'rp', 'rp', 'rp', 'rp', 'status'] },
  { nama: 'Item', kunci: 'item', judul: 'Daftar Item Belanja', kolom: [12, 32, 28, 7, 15, 15, 28],
    jenis: ['tengah', 'teks', 'teks', 'tengah', 'rp', 'rp', 'teks'] },
];

function gayaStatus(v) {
  if (v === 'Lunas') return { fill: W.hijau, font: W.hijauTeks, teks: '✔ Lunas' };
  if (v === 'Belum lunas' || v === 'Belum bayar') return { fill: W.kuning, font: W.kuningTeks, teks: '⏳ ' + v };
  if (v === 'Bayar dulu') return { fill: W.lila, font: W.unguTua, teks: '💳 Bayar dulu' };
  return null;
}

export function buatWorkbook(daftarTagihan, opsi = {}) {
  const d = susunEkspor(daftarTagihan);
  const tglEkspor = opsi.tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const wb = XLSX.utils.book_new();

  for (const L of LEMBAR) {
    const data = d[L.kunci];
    const header = data[0];
    const isi = data.slice(1);
    const nKol = header.length;
    const sub = `${opsi.judul ? opsi.judul + ' · ' : ''}Diekspor ${tglEkspor} · ${d.jumlahTagihan} tagihan · total ${formatRp(d.total)} · belum kembali ${formatRp(d.sisa)}`;
    const aoa = [['🧾  Catatan Pengeluaran · ' + L.judul], [sub], [], header, ...isi];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const AWAL = 4; // baris data pertama (0-based) setelah judul, subjudul, kosong, header

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: nKol - 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: nKol - 1 } }];
    ws['!cols'] = L.kolom.map((w) => ({ wch: w }));
    ws['!rows'] = [{ hpt: 32 }, { hpt: 18 }, { hpt: 6 }, { hpt: 32 }];

    const sel = (r, c) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      return ws[ref];
    };
    // Judul & subjudul
    for (let c = 0; c < nKol; c++) {
      sel(0, c).s = { fill: { fgColor: { rgb: W.ungu } }, font: { name: FONT, sz: 15, bold: true, color: { rgb: W.putih } }, alignment: { vertical: 'center', horizontal: 'left', indent: 1 } };
      sel(1, c).s = { fill: { fgColor: { rgb: W.unguMuda } }, font: { name: FONT, sz: 10, italic: true, color: { rgb: W.unguTua } }, alignment: { vertical: 'center', horizontal: 'left', indent: 1 } };
    }
    // Header kolom
    for (let c = 0; c < nKol; c++) {
      sel(3, c).s = { fill: { fgColor: { rgb: W.unguTua } }, font: { name: FONT, sz: 11, bold: true, color: { rgb: W.putih } }, alignment: { vertical: 'center', horizontal: 'center', wrapText: true }, border: tepi(W.unguTua) };
    }
    // Isi
    isi.forEach((baris, i) => {
      const r = AWAL + i;
      const kosong = baris.length === 0;
      const total = !kosong && baris.some((v) => v === 'TOTAL');
      if (kosong) return;
      for (let c = 0; c < nKol; c++) {
        const s = sel(r, c);
        const jenis = L.jenis[c];
        const st = { font: { name: FONT, sz: 11, color: { rgb: W.teks } }, alignment: { vertical: 'center' }, border: tepi() };
        st.fill = { fgColor: { rgb: i % 2 ? W.belang : W.putih } };
        if (jenis === 'rp' || jenis === 'rpMerah') {
          s.z = RP; st.alignment.horizontal = 'right';
          if (jenis === 'rpMerah' && Number(s.v) > 0 && !total) st.font = { ...st.font, bold: true, color: { rgb: 'B91C1C' } };
        }
        if (jenis === 'tengah') st.alignment.horizontal = 'center';
        if (jenis === 'teks') st.alignment.indent = 1;
        if (jenis === 'status') {
          const g = gayaStatus(s.v);
          if (g) { s.v = g.teks; st.fill = { fgColor: { rgb: g.fill } }; st.font = { ...st.font, bold: true, color: { rgb: g.font } }; st.alignment.horizontal = 'center'; }
        }
        if (total) {
          st.fill = { fgColor: { rgb: W.unguMuda } };
          st.font = { ...st.font, bold: true, sz: 12, color: { rgb: W.unguTua } };
          st.border = { ...tepi(), top: { style: 'medium', color: { rgb: W.ungu } }, bottom: { style: 'medium', color: { rgb: W.ungu } } };
        }
        s.s = st;
      }
      ws['!rows'][r] = { hpt: total ? 24 : 20 };
    });
    const terakhirData = AWAL + isi.filter((b) => b.length && !b.includes('TOTAL')).length - 1;
    if (terakhirData >= AWAL) ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 3, c: 0 }, e: { r: terakhirData, c: nKol - 1 } }) };
    XLSX.utils.book_append_sheet(wb, ws, L.nama);
  }
  wb.Props = { Title: 'Catatan Pengeluaran Splitbill Cerdas', Author: 'Splitbill Cerdas' };
  return wb;
}

export { XLSX };

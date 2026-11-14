import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { buatWorkbook, XLSX } from '../lib/bukuExcel';
import { namaFileEkspor } from '../lib/ekspor';
import { excelTerkunci } from './coba';

// Buat file .xlsx lalu buka menu bagikan (simpan ke Drive/Files, kirim WA, buka di Excel/Sheets).
export async function eksporExcel(daftarTagihan, judul, opsi = {}) {
  if (excelTerkunci()) throw new Error('Ekspor Excel ada di versi Pro. Buka menu Atur → Buka Pro.');
  const wb = buatWorkbook(daftarTagihan, { judul, pengeluaran: opsi.pengeluaran });
  const nama = namaFileEkspor(judul);
  if (Platform.OS === 'web') {
    XLSX.writeFile(wb, nama);
    return;
  }
  const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = FileSystem.cacheDirectory + nama;
  await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Fitur bagikan file tidak tersedia di HP ini.');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Simpan / kirim file Excel',
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });
}

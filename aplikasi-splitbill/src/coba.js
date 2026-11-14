import { Platform, Alert, Linking } from 'react-native';

// Versi coba gratis di browser (willoapparel.com/splitbill/coba/).
// Aplikasi Android tetap penuh; batas di bawah HANYA berlaku di web sampai kode Pro dimasukkan.
export const WEB = Platform.OS === 'web';
export const BATAS_TAGIHAN = 3;
export const LINK_BELI = 'https://lynk.id/splitbillcerdas';

// SHA-256 dari 'splitbill-cerdas:' + KODE. Kode aslinya tidak ditulis di sini.
// Tambah baris baru kalau mau ganti/menambah kode (kode lama tetap berlaku).
const HASH_KODE = ['c0b9931669adf5290414d1da32028c1811feb2f5a399207320fe74f054368a18'];

export const normalKode = (k) => String(k || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^SBC(.{4})(.{4})$/, 'SBC-$1-$2');

export async function cekKode(kode) {
  const k = normalKode(kode);
  if (!k || typeof crypto === 'undefined' || !crypto.subtle) return false;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('splitbill-cerdas:' + k));
  const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return HASH_KODE.includes(hex);
}

// Status Pro untuk modul tanpa akses data (mis. ekspor Excel).
let statusPro = false;
export const setStatusPro = (v) => { statusPro = v; };
export const excelTerkunci = () => WEB && !statusPro;

export const terkunci = (data) => WEB && !data.pengaturan.pro;
export const penuh = (data) => terkunci(data) && data.tagihan.length >= BATAS_TAGIHAN;

export function bukaBeli() {
  if (WEB && typeof window !== 'undefined') window.open(LINK_BELI, '_blank', 'noopener');
  else Linking.openURL(LINK_BELI);
}

// react-native-web tidak menampilkan Alert sama sekali, jadi pakai dialog bawaan browser.
if (WEB && typeof window !== 'undefined') {
  Alert.alert = (judul, pesan, tombol) => {
    const teks = [judul, pesan].filter(Boolean).join('\n\n');
    if (!tombol || tombol.length < 2) {
      window.alert(teks);
      tombol?.[0]?.onPress?.();
      return;
    }
    const batal = tombol.find((b) => b.style === 'cancel');
    const lanjut = tombol.find((b) => b !== batal) || tombol[tombol.length - 1];
    if (window.confirm(teks)) lanjut.onPress?.();
    else batal?.onPress?.();
  };
}

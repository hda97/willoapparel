import AsyncStorage from '@react-native-async-storage/async-storage';

const KUNCI = 'splitbill-cerdas:v2';

export const PENGATURAN_AWAL = {
  namaSaya: '',
  tema: 'sistem', // 'sistem' | 'terang' | 'gelap'
  pembulatan: 0,
  pajakDefault: 0,
  serviceDefault: 0,
  pembayaran: [{ jenis: 'QRIS / E-wallet', nomor: '', atasNama: '' }, { jenis: 'Bank', nomor: '', atasNama: '' }],
};

export async function muat() {
  try {
    const s = await AsyncStorage.getItem(KUNCI);
    if (!s) return { tagihan: [], teman: [], pengaturan: PENGATURAN_AWAL };
    const d = JSON.parse(s);
    return {
      tagihan: Array.isArray(d.tagihan) ? d.tagihan : [],
      teman: Array.isArray(d.teman) ? d.teman : [],
      pengaturan: { ...PENGATURAN_AWAL, ...(d.pengaturan || {}) },
    };
  } catch (e) {
    return { tagihan: [], teman: [], pengaturan: PENGATURAN_AWAL };
  }
}

let timer = null;
export function simpan(data) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    AsyncStorage.setItem(KUNCI, JSON.stringify(data)).catch(() => {});
  }, 250);
}

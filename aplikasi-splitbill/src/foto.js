import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Salin foto struk ke folder aplikasi supaya tetap ada walau foto aslinya dihapus dari galeri.
export async function simpanFotoStruk(uri) {
  if (!uri || Platform.OS === 'web') return uri;
  const folder = FileSystem.documentDirectory + 'struk/';
  try {
    await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
  } catch (e) {}
  const tujuan = folder + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + '.jpg';
  await FileSystem.copyAsync({ from: uri, to: tujuan });
  return tujuan;
}

export async function hapusFotoStruk(uri) {
  if (!uri || Platform.OS === 'web' || !uri.startsWith(FileSystem.documentDirectory || '@@')) return;
  try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch (e) {}
}

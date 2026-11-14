import React, { useMemo, useState } from 'react';
import { ScrollView, View, Image, ActivityIndicator, Pressable, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTema } from '../tema';
import { Kartu, Judul, Teks, Tombol, Input, Header, Baris } from '../ui';
import { bacaTeksGambar } from '../ocr';
import { parseStruk } from '../../lib/parseStruk';
import { formatRp } from '../../lib/hitung';
import { simpanFotoStruk } from '../foto';
import { WEB } from '../coba';

export default function Scan({ tutup, ganti }) {
  const t = useTema();
  const [foto, setFoto] = useState(null);
  const [teks, setTeks] = useState('');
  const [proses, setProses] = useState(false);
  const [lihatTeks, setLihatTeks] = useState(WEB);
  const [buang, setBuang] = useState({});
  const hasil = useMemo(() => (teks ? parseStruk(teks) : null), [teks]);

  const ambil = async (dariKamera) => {
    try {
      const izin = dariKamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!izin.granted) return Alert.alert('Izin ditolak', dariKamera ? 'Izinkan kamera untuk scan struk.' : 'Izinkan akses foto untuk memilih struk.');
      const opsi = { mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 };
      const r = dariKamera ? await ImagePicker.launchCameraAsync(opsi) : await ImagePicker.launchImageLibraryAsync(opsi);
      if (r.canceled) return;
      const uri = r.assets[0].uri;
      setFoto(uri);
      setProses(true);
      setBuang({});
      const hasilTeks = await bacaTeksGambar(uri);
      setTeks(hasilTeks);
      if (!parseStruk(hasilTeks).items.length) setLihatTeks(true);
    } catch (e) {
      Alert.alert('Gagal membaca struk', String(e.message || e));
    } finally {
      setProses(false);
    }
  };

  const lanjut = async () => {
    const items = hasil ? hasil.items.filter((_, i) => !buang[i]) : [];
    let fotoSimpan = null;
    try { fotoSimpan = foto ? await simpanFotoStruk(foto) : null; } catch (e) {}
    ganti('editor', { draft: { foto: fotoSimpan, items, servicePersen: hasil?.servicePersen || 0, pajakPersen: hasil?.pajakPersen || 0, diskon: hasil?.diskon || 0, ongkir: hasil?.ongkir || 0 } });
  };

  const jumlahItem = hasil ? hasil.items.filter((_, i) => !buang[i]).reduce((a, it) => a + it.harga * it.qty, 0) : 0;

  return (
    <View style={{ flex: 1 }}>
      <Header judul={WEB ? "Tempel Struk" : "Scan Struk"} onKembali={tutup} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {WEB ? (
          <Kartu style={{ backgroundColor: t.utamaLembut }}>
            <Judul>📷 Scan foto struk ada di aplikasi Android</Judul>
            <Teks pudar ukuran={13}>Di versi web, tempel atau ketik isi struk di bawah. Item, pajak, dan service tetap terbaca otomatis.</Teks>
          </Kartu>
        ) : (
        <Kartu>
          <Judul>📷 Foto struk</Judul>
          <Teks pudar ukuran={13} style={{ marginBottom: 12 }}>
            Teks dibaca langsung di HP kamu (offline). Foto tidak dikirim ke mana pun. Tips: struk lurus, terang, dan potong bagian di luar struk.
          </Teks>
          <Baris>
            <Tombol ikon="📷" judul="Kamera" onPress={() => ambil(true)} style={{ flex: 1, marginRight: 8 }} />
            <Tombol ikon="🖼" judul="Galeri" jenis="lembut" onPress={() => ambil(false)} style={{ flex: 1 }} />
          </Baris>
          {foto && <Image source={{ uri: foto }} style={{ width: '100%', height: 220, borderRadius: 12, marginTop: 12, backgroundColor: t.input }} resizeMode="contain" />}
          {proses && (
            <Baris style={{ marginTop: 12 }}>
              <ActivityIndicator color={t.utama} />
              <Teks pudar style={{ marginLeft: 8 }}>Membaca teks struk...</Teks>
            </Baris>
          )}
        </Kartu>
        )}

        <Kartu>
          <Pressable onPress={() => setLihatTeks((v) => !v)}>
            <Baris style={{ justifyContent: 'space-between' }}>
              <Judul style={{ marginBottom: 0 }}>📝 Teks struk</Judul>
              <Teks warna={t.utama} tebal>{lihatTeks ? 'Tutup' : teks ? 'Koreksi' : 'Tempel teks'}</Teks>
            </Baris>
          </Pressable>
          {lihatTeks && (
            <View style={{ marginTop: 10 }}>
              <Teks pudar ukuran={12} style={{ marginBottom: 6 }}>Satu item per baris, harga di ujung. Contoh: "2 Nasi Goreng 50.000"</Teks>
              <Input value={teks} onChangeText={setTeks} multiline placeholder={'Nasi Goreng 25.000\nEs Teh 3 x 5.000  15.000\nService 5%  2.000\nPB1 10%  4.200'} />
            </View>
          )}
        </Kartu>

        {hasil && (
          <Kartu>
            <Judul>✅ Hasil ({hasil.items.length} item)</Judul>
            {hasil.items.length === 0 ? (
              <Teks pudar>Belum ada item yang terbaca. Koreksi teks di atas, atau lanjut lalu isi manual.</Teks>
            ) : (
              hasil.items.map((it, i) => (
                <Pressable key={i} onPress={() => setBuang((b) => ({ ...b, [i]: !b[i] }))}>
                  <Baris style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: t.garis, opacity: buang[i] ? 0.4 : 1 }}>
                    <Teks style={{ marginRight: 10 }}>{buang[i] ? '⬜' : '☑️'}</Teks>
                    <Teks style={{ flex: 1, textDecorationLine: buang[i] ? 'line-through' : 'none' }}>{it.qty > 1 ? it.qty + '× ' : ''}{it.nama}</Teks>
                    <Teks tebal>{formatRp(it.harga * it.qty)}</Teks>
                  </Baris>
                </Pressable>
              ))
            )}
            <View style={{ marginTop: 10 }}>
              {hasil.servicePersen ? <Teks pudar ukuran={13}>Service terbaca: {hasil.servicePersen}%</Teks> : null}
              {hasil.pajakPersen ? <Teks pudar ukuran={13}>Pajak terbaca: {hasil.pajakPersen}%</Teks> : null}
              {hasil.diskon ? <Teks pudar ukuran={13}>Diskon terbaca: {formatRp(hasil.diskon)}</Teks> : null}
              {hasil.subtotal ? (
                <Teks ukuran={13} tebal warna={Math.abs(hasil.subtotal - jumlahItem) < 1 ? t.hijau : t.kuning} style={{ marginTop: 4 }}>
                  {Math.abs(hasil.subtotal - jumlahItem) < 1
                    ? `Cocok dengan subtotal struk (${formatRp(hasil.subtotal)}) 👍`
                    : `Subtotal struk ${formatRp(hasil.subtotal)}, item terbaca ${formatRp(jumlahItem)}. Cek lagi ya.`}
                </Teks>
              ) : null}
            </View>
            <Teks pudar ukuran={12} style={{ marginTop: 8 }}>Ketuk item untuk membuang baris yang salah baca.</Teks>
          </Kartu>
        )}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: t.kartu, borderTopWidth: 1, borderColor: t.garis }}>
        <Tombol ikon="➡️" judul={hasil && hasil.items.length ? `Lanjut bagi tagihan · ${formatRp(jumlahItem)}` : 'Lanjut isi manual'} onPress={lanjut} disabled={proses} />
      </View>
    </View>
  );
}

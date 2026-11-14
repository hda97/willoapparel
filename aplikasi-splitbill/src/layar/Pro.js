import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTema } from '../tema';
import { Kartu, Judul, Teks, Tombol, Input, Header } from '../ui';
import { BATAS_TAGIHAN, bukaBeli, cekKode } from '../coba';

const UNTUNG = [
  ['♾️', 'Tagihan tanpa batas', `Versi coba cuma ${BATAS_TAGIHAN} tagihan`],
  ['📷', 'Scan struk otomatis', 'Foto struk, item & harga langsung terbaca (aplikasi Android)'],
  ['📊', 'Ekspor Excel berwarna', 'Rekap per teman, per bulan, dan pengeluaranmu'],
  ['🔒', 'Sekali bayar, tanpa iklan', 'Tanpa langganan, tanpa akun, data di HP sendiri'],
];

export default function Pro({ tutup, aksi, param }) {
  const t = useTema();
  const [kode, setKode] = useState('');
  const [pesan, setPesan] = useState('');
  const [cek, setCek] = useState(false);

  const aktifkan = async () => {
    setCek(true);
    const ok = await cekKode(kode).catch(() => false);
    setCek(false);
    if (!ok) return setPesan('Kode belum cocok. Cek lagi huruf & angkanya, atau chat penjual.');
    aksi.setPengaturan({ pro: true });
    setPesan('');
    tutup();
  };

  return (
    <View style={{ flex: 1 }}>
      <Header judul="Splitbill Cerdas Pro" onKembali={tutup} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: t.utama, borderRadius: 20, padding: 20, marginBottom: 14 }}>
          <Teks warna="#fff" tebal ukuran={22}>
            {param.alasan === 'penuh' ? `Jatah coba ${BATAS_TAGIHAN} tagihan sudah habis 🙌` : 'Buka semua fitur'}
          </Teks>
          <Teks warna="#ffffffdd" style={{ marginTop: 6 }}>
            Tagihan yang sudah kamu buat tetap aman. Buka Pro supaya bisa terus bikin tagihan baru.
          </Teks>
        </View>

        <Kartu>
          {UNTUNG.map(([ikon, judul, ket]) => (
            <View key={judul} style={{ flexDirection: 'row', marginBottom: 12 }}>
              <Teks ukuran={22} style={{ width: 36 }}>{ikon}</Teks>
              <View style={{ flex: 1 }}>
                <Teks tebal>{judul}</Teks>
                <Teks pudar ukuran={13}>{ket}</Teks>
              </View>
            </View>
          ))}
          <Tombol ikon="🛒" judul="Beli Pro · Rp29rb sekali bayar" onPress={bukaBeli} style={{ marginTop: 4 }} />
          <Teks pudar ukuran={12} style={{ marginTop: 8, textAlign: 'center' }}>
            Dapat aplikasi Android + kode Pro untuk versi web (bisa di iPhone).
          </Teks>
        </Kartu>

        <Kartu>
          <Judul>🔑 Sudah beli? Masukkan kode</Judul>
          <Input value={kode} onChangeText={(v) => { setKode(v); setPesan(''); }} placeholder="SBC-XXXX-XXXX" autoCapitalize="characters" />
          {pesan ? <Teks warna={t.merah} ukuran={13} style={{ marginTop: 6 }}>{pesan}</Teks> : null}
          <Tombol judul={cek ? 'Mengecek...' : 'Aktifkan Pro'} jenis="hijau" onPress={aktifkan} disabled={cek || !kode.trim()} style={{ marginTop: 10 }} />
        </Kartu>
      </ScrollView>
    </View>
  );
}

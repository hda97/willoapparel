import React from 'react';
import { ScrollView, View, Alert } from 'react-native';
import Constants from 'expo-constants';
import { eksporExcel } from '../excel';
import { Kartu, Judul, Teks, Tombol, Input, Segmen, Baris } from '../ui';

export default function Pengaturan({ data, aksi }) {
  const p = data.pengaturan;
  const ubahBayar = (i, isi) => aksi.setPengaturan({ pembayaran: p.pembayaran.map((b, j) => (j === i ? { ...b, ...isi } : b)) });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Kartu>
        <Judul>🙋 Profil</Judul>
        <Input label="Nama kamu" value={p.namaSaya} onChangeText={(v) => aksi.setPengaturan({ namaSaya: v })} placeholder="mis. Huda" />
        <Teks pudar ukuran={12} style={{ marginTop: 6 }}>Dipakai sebagai orang pertama di tiap tagihan baru.</Teks>
      </Kartu>

      <Kartu>
        <Judul>💳 Info pembayaran</Judul>
        <Teks pudar ukuran={12} style={{ marginBottom: 10 }}>Ikut dikirim di pesan WA, jadi teman langsung tahu harus transfer ke mana.</Teks>
        {p.pembayaran.map((b, i) => (
          <View key={i} style={{ marginBottom: 12 }}>
            <Input label={`Metode ${i + 1}`} value={b.jenis} onChangeText={(v) => ubahBayar(i, { jenis: v })} placeholder="mis. BCA / DANA / GoPay" />
            <Baris style={{ marginTop: 8 }}>
              <Input value={b.nomor} onChangeText={(v) => ubahBayar(i, { nomor: v })} placeholder="Nomor" keyboardType="number-pad" style={{ flex: 1, marginRight: 8 }} />
              <Input value={b.atasNama} onChangeText={(v) => ubahBayar(i, { atasNama: v })} placeholder="Atas nama" style={{ flex: 1 }} />
            </Baris>
          </View>
        ))}
        <Baris>
          <Tombol kecil jenis="lembut" judul="+ Metode" onPress={() => aksi.setPengaturan({ pembayaran: [...p.pembayaran, { jenis: '', nomor: '', atasNama: '' }] })} style={{ marginRight: 8 }} />
          {p.pembayaran.length > 1 && <Tombol kecil jenis="garis" judul="− Hapus terakhir" onPress={() => aksi.setPengaturan({ pembayaran: p.pembayaran.slice(0, -1) })} />}
        </Baris>
      </Kartu>

      <Kartu>
        <Judul>🧮 Bawaan tagihan baru</Judul>
        <Baris>
          <Input label="Service %" value={p.serviceDefault ? String(p.serviceDefault) : ''} onChangeText={(v) => aksi.setPengaturan({ serviceDefault: parseFloat(v.replace(',', '.')) || 0 })} keyboardType="decimal-pad" placeholder="0" style={{ flex: 1, marginRight: 8 }} />
          <Input label="Pajak %" value={p.pajakDefault ? String(p.pajakDefault) : ''} onChangeText={(v) => aksi.setPengaturan({ pajakDefault: parseFloat(v.replace(',', '.')) || 0 })} keyboardType="decimal-pad" placeholder="0" style={{ flex: 1 }} />
        </Baris>
        <Teks pudar ukuran={12} style={{ marginTop: 12, marginBottom: 6 }}>PEMBULATAN</Teks>
        <Segmen nilai={p.pembulatan || 0} onUbah={(v) => aksi.setPengaturan({ pembulatan: v })} pilihan={[{ nilai: 0, label: 'Pas' }, { nilai: 100, label: '100' }, { nilai: 500, label: '500' }, { nilai: 1000, label: '1.000' }]} />
      </Kartu>

      <Kartu>
        <Judul>🎨 Tampilan</Judul>
        <Segmen nilai={p.tema} onUbah={(v) => aksi.setPengaturan({ tema: v })} pilihan={[{ nilai: 'sistem', label: 'Ikut HP' }, { nilai: 'terang', label: 'Terang' }, { nilai: 'gelap', label: 'Gelap' }]} />
      </Kartu>

      <Kartu>
        <Judul>🗂 Data</Judul>
        <Teks pudar ukuran={13} style={{ marginBottom: 10 }}>Semua data tersimpan di HP ini saja, tanpa akun dan tanpa server.</Teks>
        <Tombol
          ikon="📊"
          judul={`Ekspor semua ke Excel (${data.tagihan.length})`}
          disabled={!data.tagihan.length}
          onPress={() => eksporExcel(data.tagihan).catch((e) => Alert.alert('Gagal ekspor', String(e.message || e)))}
          style={{ marginBottom: 6 }}
        />
        <Teks pudar ukuran={12} style={{ marginBottom: 12 }}>File .xlsx berisi 4 lembar: Ringkasan, Per Teman, Per Orang, dan Item. Bisa disimpan ke Drive/Files, dikirim lewat WA, atau dibuka di Excel/Google Sheets.</Teks>
        <Tombol
          jenis="bahaya"
          judul={`Hapus semua tagihan (${data.tagihan.length})`}
          disabled={!data.tagihan.length}
          onPress={() => Alert.alert('Hapus semua tagihan?', 'Tidak bisa dibatalkan. Daftar teman tetap ada.', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: aksi.hapusSemua },
          ])}
        />
      </Kartu>

      <Teks pudar ukuran={12} style={{ textAlign: 'center', marginTop: 8 }}>Splitbill Cerdas v{Constants.expoConfig?.version || '2.0.0'}</Teks>
    </ScrollView>
  );
}

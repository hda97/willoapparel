import React, { useState } from 'react';
import { ScrollView, View, Alert, Pressable } from 'react-native';
import { useTema } from '../tema';
import { Kartu, Judul, Teks, Tombol, Input, Header, Baris } from '../ui';
import { formatRp, parseAngka, uid } from '../../lib/hitung';
import { KATEGORI } from '../../lib/pengeluaran';

const hariIni = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const kemarin = () => {
  const d = new Date(Date.now() - 864e5);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function CatatPengeluaran({ data, aksi, tutup, param }) {
  const t = useTema();
  const lama = param.id && (data.pengeluaran || []).find((x) => x.id === param.id);
  const [p, setP] = useState(lama || { id: uid(), tanggal: hariIni(), judul: '', nominal: 0, kategori: 'makan', catatan: '', dibuat: Date.now() });
  const ubah = (x) => setP((s) => ({ ...s, ...x }));

  const simpan = () => {
    if (!(p.nominal > 0)) return Alert.alert('Nominal kosong', 'Isi jumlah uang yang keluar dulu.');
    aksi.simpanPengeluaran({ ...p, judul: p.judul.trim() });
    tutup();
  };
  const hapus = () => Alert.alert('Hapus catatan?', p.judul || formatRp(p.nominal), [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: () => { aksi.hapusPengeluaran(p.id); tutup(); } },
  ]);

  return (
    <View style={{ flex: 1 }}>
      <Header judul={lama ? 'Edit Catatan' : 'Catat Pengeluaran'} onKembali={tutup}
        kanan={lama ? <Pressable onPress={hapus} hitSlop={8}><Teks warna={t.merah} tebal>Hapus</Teks></Pressable> : null} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Kartu>
          <Teks pudar ukuran={12} tebal>JUMLAH</Teks>
          <Input
            value={p.nominal ? p.nominal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
            onChangeText={(v) => ubah({ nominal: parseAngka(v) })}
            placeholder="Rp0"
            keyboardType="number-pad"
            autoFocus={!lama}
            inputStyle={{ fontSize: 28, fontWeight: '800', color: t.utama }}
            style={{ marginTop: 6 }}
          />
          <Baris style={{ marginTop: 8, flexWrap: 'wrap' }}>
            {[10000, 20000, 50000, 100000].map((n) => (
              <Tombol key={n} kecil jenis="lembut" judul={'+' + (n / 1000) + 'rb'} onPress={() => ubah({ nominal: (p.nominal || 0) + n })} style={{ marginRight: 6, marginBottom: 6 }} />
            ))}
          </Baris>
        </Kartu>

        <Kartu>
          <Judul>Kategori</Judul>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            {KATEGORI.map((k) => {
              const on = p.kategori === k.id;
              return (
                <Pressable key={k.id} onPress={() => ubah({ kategori: k.id })} style={{ width: '25%', padding: 4 }}>
                  <View style={{ alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: on ? k.warna : 'transparent', backgroundColor: on ? k.warna + '1A' : t.input }}>
                    <Teks ukuran={22}>{k.ikon}</Teks>
                    <Teks ukuran={10.5} tebal={on} style={{ marginTop: 3, textAlign: 'center' }} numberOfLines={1}>{k.nama.split(' ')[0]}</Teks>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Kartu>

        <Kartu>
          <Input label="Keterangan" value={p.judul} onChangeText={(v) => ubah({ judul: v })} placeholder="mis. Bensin, Pulsa, Sarapan" />
          <Input label="Tanggal" value={p.tanggal} onChangeText={(v) => ubah({ tanggal: v })} style={{ marginTop: 12 }} />
          <Baris style={{ marginTop: 8 }}>
            <Tombol kecil jenis={p.tanggal === hariIni() ? 'utama' : 'garis'} judul="Hari ini" onPress={() => ubah({ tanggal: hariIni() })} style={{ marginRight: 6 }} />
            <Tombol kecil jenis={p.tanggal === kemarin() ? 'utama' : 'garis'} judul="Kemarin" onPress={() => ubah({ tanggal: kemarin() })} />
          </Baris>
          <Input label="Catatan (opsional)" value={p.catatan} onChangeText={(v) => ubah({ catatan: v })} placeholder="mis. bayar pakai DANA" style={{ marginTop: 12 }} />
        </Kartu>
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: t.kartu, borderTopWidth: 1, borderColor: t.garis }}>
        <Tombol ikon="💾" judul={`Simpan · ${formatRp(p.nominal)}`} onPress={simpan} />
      </View>
    </View>
  );
}

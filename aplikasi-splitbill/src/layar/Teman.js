import React, { useMemo, useState } from 'react';
import { ScrollView, View, Pressable, Alert } from 'react-native';
import { useTema } from '../tema';
import { Kartu, Judul, Teks, Tombol, Input, Baris, Avatar, Kosong } from '../ui';
import { statusTagihan, formatRp, uid } from '../../lib/hitung';

export default function Teman({ data, aksi }) {
  const t = useTema();
  const [nama, setNama] = useState('');
  const [wa, setWa] = useState('');
  const [edit, setEdit] = useState(null);

  // Total utang tiap teman yang belum lunas, dari semua tagihan.
  const utang = useMemo(() => {
    const m = {};
    for (const tg of data.tagihan) {
      const s = statusTagihan(tg);
      for (const p of s.perOrang) {
        if (p.id === tg.penalang || (tg.lunas || {})[p.id]) continue;
        const k = p.nama.toLowerCase();
        m[k] = (m[k] || 0) + p.totalBulat;
      }
    }
    return m;
  }, [data.tagihan]);

  const tambah = () => {
    const n = nama.trim();
    if (!n) return;
    if (data.teman.some((f) => f.nama.toLowerCase() === n.toLowerCase())) return Alert.alert('Sudah ada', `${n} sudah ada di daftar.`);
    aksi.setTeman([...data.teman, { id: uid(), nama: n, wa: wa.trim() }]);
    setNama(''); setWa('');
  };
  const hapus = (f) => Alert.alert('Hapus teman?', f.nama, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: () => aksi.setTeman(data.teman.filter((x) => x.id !== f.id)) },
  ]);
  const urut = [...data.teman].sort((a, b) => (utang[b.nama.toLowerCase()] || 0) - (utang[a.nama.toLowerCase()] || 0) || a.nama.localeCompare(b.nama));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Kartu>
        <Judul>➕ Tambah teman</Judul>
        <Input value={nama} onChangeText={setNama} placeholder="Nama" />
        <Input value={wa} onChangeText={setWa} placeholder="No. WhatsApp (opsional, mis. 0812...)" keyboardType="phone-pad" style={{ marginTop: 8 }} />
        <Tombol judul="Simpan teman" onPress={tambah} style={{ marginTop: 10 }} />
        <Teks pudar ukuran={12} style={{ marginTop: 8 }}>Kalau nomor WA diisi, tombol "Tagih via WA" langsung membuka chat orangnya.</Teks>
      </Kartu>

      {urut.length === 0 ? (
        <Kosong ikon="👥" judul="Belum ada teman" teks="Teman yang ikut patungan juga tersimpan otomatis saat kamu menyimpan tagihan." />
      ) : urut.map((f) => {
        const u = utang[f.nama.toLowerCase()] || 0;
        return (
          <Kartu key={f.id}>
            {edit && edit.id === f.id ? (
              <View>
                <Input value={edit.nama} onChangeText={(v) => setEdit({ ...edit, nama: v })} placeholder="Nama" />
                <Input value={edit.wa} onChangeText={(v) => setEdit({ ...edit, wa: v })} placeholder="No. WhatsApp" keyboardType="phone-pad" style={{ marginTop: 8 }} />
                <Baris style={{ marginTop: 10 }}>
                  <Tombol kecil judul="Simpan" onPress={() => { aksi.setTeman(data.teman.map((x) => (x.id === f.id ? { ...edit, nama: edit.nama.trim() || f.nama } : x))); setEdit(null); }} style={{ flex: 1, marginRight: 8 }} />
                  <Tombol kecil judul="Batal" jenis="garis" onPress={() => setEdit(null)} style={{ flex: 1, marginRight: 8 }} />
                  <Tombol kecil judul="Hapus" jenis="bahaya" onPress={() => hapus(f)} style={{ flex: 1 }} />
                </Baris>
              </View>
            ) : (
              <Pressable onPress={() => setEdit({ ...f })}>
                <Baris>
                  <Avatar nama={f.nama} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Teks tebal>{f.nama}</Teks>
                    <Teks pudar ukuran={12} numberOfLines={1}>{f.wa || "Belum ada nomor WA"}</Teks>
                  </View>
                  <Teks tebal warna={u ? t.kuning : t.hijau} ukuran={13} style={{ marginLeft: 8 }}>{u ? `utang ${formatRp(u)}` : 'beres ✓'}</Teks>
                </Baris>
              </Pressable>
            )}
          </Kartu>
        );
      })}
    </ScrollView>
  );
}

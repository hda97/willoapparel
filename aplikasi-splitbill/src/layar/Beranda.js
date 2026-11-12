import React, { useMemo, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useTema } from '../tema';
import { Kartu, Teks, Tombol, Input, Kosong, Baris, Segmen } from '../ui';
import { statusTagihan, formatRp } from '../../lib/hitung';

export default function Beranda({ data, buka }) {
  const t = useTema();
  const [cari, setCari] = useState('');
  const [filter, setFilter] = useState('semua');

  const daftar = useMemo(() => data.tagihan.map((x) => ({ x, s: statusTagihan(x) })), [data.tagihan]);
  const piutang = daftar.reduce((a, d) => a + d.s.sisa, 0);
  const belum = daftar.filter((d) => !d.s.selesai && d.s.jumlahWajib > 0).length;

  const q = cari.trim().toLowerCase();
  const tampil = daftar.filter(({ x, s }) => {
    if (filter === 'belum' && s.selesai) return false;
    if (filter === 'lunas' && !s.selesai) return false;
    if (!q) return true;
    return (x.judul || '').toLowerCase().includes(q) || x.orang.some((o) => o.nama.toLowerCase().includes(q));
  });

  const sapa = data.pengaturan.namaSaya ? `Halo, ${data.pengaturan.namaSaya}!` : 'Halo!';

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: t.utama, borderRadius: 20, padding: 20, marginBottom: 14 }}>
        <Teks warna="#ffffffcc" tebal>{sapa}</Teks>
        <Teks warna="#ffffffcc" style={{ marginTop: 12 }}>Uang kamu yang belum kembali</Teks>
        <Teks warna="#fff" tebal ukuran={30} style={{ marginTop: 2 }}>{formatRp(piutang)}</Teks>
        <Teks warna="#ffffffcc" style={{ marginTop: 4 }}>
          {belum ? `${belum} tagihan masih ditunggu` : data.tagihan.length ? 'Semua tagihan sudah lunas 🎉' : 'Belum ada tagihan'}
        </Teks>
      </View>

      <Baris style={{ marginBottom: 16 }}>
        <Tombol ikon="📷" judul="Scan Struk" onPress={() => buka('scan')} style={{ flex: 1, marginRight: 8 }} />
        <Tombol ikon="✏️" judul="Buat Manual" jenis="lembut" onPress={() => buka('editor', {})} style={{ flex: 1 }} />
      </Baris>

      {data.tagihan.length > 0 && (
        <>
          <Input value={cari} onChangeText={setCari} placeholder="🔍  Cari tagihan atau nama teman..." style={{ marginBottom: 10 }} />
          <View style={{ marginBottom: 12 }}>
            <Segmen
              nilai={filter}
              onUbah={setFilter}
              pilihan={[{ nilai: 'semua', label: 'Semua' }, { nilai: 'belum', label: 'Belum lunas' }, { nilai: 'lunas', label: 'Lunas' }]}
            />
          </View>
        </>
      )}

      {data.tagihan.length === 0 ? (
        <Kosong ikon="🧾" judul="Belum ada tagihan" teks="Scan struk belanja atau buat tagihan manual. Teman yang kamu tambahkan akan tersimpan otomatis." />
      ) : tampil.length === 0 ? (
        <Kosong ikon="🔍" judul="Tidak ketemu" teks="Coba kata lain atau ganti filter." />
      ) : (
        tampil.map(({ x, s }) => (
          <Pressable key={x.id} onPress={() => buka('detail', { id: x.id })}>
            <Kartu>
              <Baris>
                <View style={{ flex: 1 }}>
                  <Teks tebal ukuran={16} numberOfLines={1}>{x.judul || 'Patungan'}</Teks>
                  <Teks pudar ukuran={13} style={{ marginTop: 2 }} numberOfLines={1}>
                    {x.tanggal} · {x.orang.length} orang · {x.mode === 'rata' ? 'bagi rata' : 'per item'}
                  </Teks>
                </View>
                <Teks tebal ukuran={16}>{formatRp(s.total)}</Teks>
              </Baris>
              {s.jumlahWajib > 0 && (
                <View style={{ marginTop: 12 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: t.input, overflow: 'hidden' }}>
                    <View style={{ width: `${(s.sudahLunas / s.jumlahWajib) * 100}%`, height: 6, backgroundColor: s.selesai ? t.hijau : t.utama }} />
                  </View>
                  <Baris style={{ marginTop: 6, justifyContent: 'space-between' }}>
                    <Teks ukuran={12} warna={s.selesai ? t.hijau : t.teksPudar} tebal={s.selesai}>
                      {s.selesai ? '✅ Lunas semua' : `${s.sudahLunas}/${s.jumlahWajib} sudah bayar`}
                    </Teks>
                    {!s.selesai && <Teks ukuran={12} pudar>sisa {formatRp(s.sisa)}</Teks>}
                  </Baris>
                </View>
              )}
            </Kartu>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

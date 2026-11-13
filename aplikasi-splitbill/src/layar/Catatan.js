import React, { useMemo, useState } from 'react';
import { ScrollView, View, Pressable, Alert, useWindowDimensions } from 'react-native';
import { useTema } from '../tema';
import { Kartu, Judul, Teks, Tombol, Baris, Kosong, Avatar } from '../ui';
import { Donat, Batang, singkatRp } from '../grafik';
import { formatRp } from '../../lib/hitung';
import { daftarPengeluaran, rekapBulan, trenBulanan, temanBulan, geserBulan, kategoriById, BULAN, bacaTanggal } from '../../lib/pengeluaran';
import { eksporExcel } from '../excel';

export default function Catatan({ data, buka }) {
  const t = useTema();
  const { width } = useWindowDimensions();
  const kini = new Date();
  const [bln, setBln] = useState({ t: kini.getFullYear(), b: kini.getMonth() + 1 });
  const [katAktif, setKatAktif] = useState(null);

  const semua = useMemo(() => daftarPengeluaran(data), [data.pengeluaran, data.tagihan, data.pengaturan.namaSaya]);
  const r = useMemo(() => rekapBulan(semua, bln.t, bln.b), [semua, bln]);
  const lalu = geserBulan(bln.t, bln.b, -1);
  const rLalu = useMemo(() => rekapBulan(semua, lalu.t, lalu.b), [semua, bln]);
  const tren = useMemo(() => trenBulanan(semua, bln.t, bln.b, 6), [semua, bln]);
  const teman = useMemo(() => temanBulan(data, bln.t, bln.b).slice(0, 5), [data.tagihan, bln]);
  const isi = katAktif ? r.isi.filter((p) => p.kategori === katAktif) : r.isi;
  const bulanIni = bln.t === kini.getFullYear() && bln.b === kini.getMonth() + 1;
  const selisih = rLalu.total ? ((r.total - rLalu.total) / rLalu.total) * 100 : null;

  // kelompokkan per tanggal
  const grup = [];
  for (const p of isi) {
    const g = grup[grup.length - 1];
    if (g && g.tanggal === p.tanggal) g.isi.push(p); else grup.push({ tanggal: p.tanggal, isi: [p] });
  }

  const tagihanBulan = data.tagihan.filter((x) => { const d = bacaTanggal(x.tanggal); return d && d.t === bln.t && d.b === bln.b; });
  const ekspor = () => eksporExcel(tagihanBulan, `${BULAN[bln.b - 1]} ${bln.t}`, { pengeluaran: r.isi })
    .catch((e) => Alert.alert('Gagal ekspor', String(e.message || e)));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Baris style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <Pressable hitSlop={12} onPress={() => setBln(geserBulan(bln.t, bln.b, -1))}><Teks ukuran={24} tebal warna={t.utama}>‹</Teks></Pressable>
          <Teks tebal ukuran={17}>{BULAN[bln.b - 1]} {bln.t}</Teks>
          <Pressable hitSlop={12} disabled={bulanIni} onPress={() => setBln(geserBulan(bln.t, bln.b, 1))}><Teks ukuran={24} tebal warna={bulanIni ? t.garis : t.utama}>›</Teks></Pressable>
        </Baris>

        <Kartu>
          <Baris>
            <Donat
              data={r.perKategori}
              ukuran={150}
              tengah={<View style={{ alignItems: 'center' }}><Teks pudar ukuran={11}>Total</Teks><Teks tebal ukuran={15}>{singkatRp(r.total)}</Teks></View>}
            />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Teks pudar ukuran={12}>Pengeluaran bulan ini</Teks>
              <Teks tebal ukuran={22}>{formatRp(r.total)}</Teks>
              {selisih !== null && (
                <Teks ukuran={12} tebal warna={selisih > 0 ? t.merah : t.hijau} style={{ marginTop: 2 }}>
                  {selisih > 0 ? '▲' : '▼'} {Math.abs(selisih).toFixed(Math.abs(selisih) < 10 ? 1 : 0).replace(".", ",")}% dari {BULAN[lalu.b - 1]}
                </Teks>
              )}
              <Teks pudar ukuran={12} style={{ marginTop: 6 }}>{r.jumlah} catatan · rata-rata {formatRp(r.rataHarian)}/hari</Teks>
            </View>
          </Baris>
          {r.perKategori.length > 0 && (
            <View style={{ marginTop: 14 }}>
              {r.perKategori.map((k) => (
                <Pressable key={k.id} onPress={() => setKatAktif(katAktif === k.id ? null : k.id)}>
                  <View style={{ marginBottom: 9, opacity: katAktif && katAktif !== k.id ? 0.4 : 1 }}>
                    <Baris style={{ justifyContent: 'space-between' }}>
                      <Teks ukuran={13}>{k.ikon} {k.nama}</Teks>
                      <Teks ukuran={13} tebal>{formatRp(k.total)} <Teks ukuran={12} pudar>· {k.persen.toFixed(0)}%</Teks></Teks>
                    </Baris>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: t.input, marginTop: 4, overflow: 'hidden' }}>
                      <View style={{ width: `${k.persen}%`, height: 6, backgroundColor: k.warna }} />
                    </View>
                  </View>
                </Pressable>
              ))}
              <Teks pudar ukuran={11}>Ketuk kategori untuk menyaring daftar di bawah.</Teks>
            </View>
          )}
        </Kartu>

        <Kartu>
          <Judul>📈 Tren 6 bulan</Judul>
          <Batang data={tren} aktif={tren.length - 1} lebar={width - 66} formatAngka={singkatRp} />
        </Kartu>

        {teman.length > 0 && (
          <Kartu>
            <Judul>🤝 Paling sering patungan</Judul>
            {teman.map((f, i) => (
              <Baris key={f.nama} style={{ marginBottom: 8 }}>
                <Teks pudar style={{ width: 20 }}>{i + 1}.</Teks>
                <Avatar nama={f.nama} ukuran={28} />
                <Teks style={{ flex: 1, marginLeft: 8 }} tebal>{f.nama}</Teks>
                <Teks pudar ukuran={13}>{f.kali}× · {formatRp(f.total)}</Teks>
              </Baris>
            ))}
          </Kartu>
        )}

        <Baris style={{ justifyContent: 'space-between', marginTop: 4, marginBottom: 8 }}>
          <Teks tebal ukuran={16}>{katAktif ? `${kategoriById(katAktif).ikon} ${kategoriById(katAktif).nama}` : 'Semua catatan'}</Teks>
          {r.isi.length > 0 && <Tombol kecil jenis="garis" ikon="📊" judul="Excel" onPress={ekspor} />}
        </Baris>
        {isi.length === 0 ? (
          <Kosong ikon="💸" judul="Belum ada catatan" teks="Catat pengeluaranmu, atau buat tagihan patungan. Bagianmu otomatis masuk ke sini." />
        ) : grup.map((g) => (
          <View key={g.tanggal} style={{ marginBottom: 8 }}>
            <Teks pudar ukuran={12} tebal style={{ marginBottom: 6 }}>{g.tanggal} · {formatRp(g.isi.reduce((a, p) => a + p.nominal, 0))}</Teks>
            <Kartu style={{ paddingVertical: 4, marginBottom: 0 }}>
              {g.isi.map((p, i) => {
                const k = kategoriById(p.kategori);
                return (
                  <Pressable key={p.id} onPress={() => (p.sumber === 'tagihan' ? buka('detail', { id: p.tagihanId }) : buka('catat', { id: p.id }))}>
                    <Baris style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: t.garis }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: k.warna + '22', alignItems: 'center', justifyContent: 'center' }}>
                        <Teks ukuran={18}>{k.ikon}</Teks>
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Teks tebal numberOfLines={1}>{p.judul || k.nama}</Teks>
                        <Teks pudar ukuran={12} numberOfLines={1}>{p.sumber === 'tagihan' ? '🧾 ' + p.catatan : (p.catatan || k.nama)}</Teks>
                      </View>
                      <Teks tebal>{formatRp(p.nominal)}</Teks>
                    </Baris>
                  </Pressable>
                );
              })}
            </Kartu>
          </View>
        ))}
      </ScrollView>
      <Pressable
        onPress={() => buka('catat', {})}
        style={{ position: 'absolute', right: 18, bottom: 18, backgroundColor: t.utama, borderRadius: 28, paddingHorizontal: 20, height: 52, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}
      >
        <Teks warna="#fff" tebal ukuran={15}>＋ Catat</Teks>
      </Pressable>
    </View>
  );
}

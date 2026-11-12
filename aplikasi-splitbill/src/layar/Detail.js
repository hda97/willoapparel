import React, { useState } from 'react';
import { ScrollView, View, Pressable, Alert, Linking, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTema } from '../tema';
import { Kartu, Teks, Tombol, Header, Baris, Avatar, Kosong } from '../ui';
import { statusTagihan, formatRp, pesanPerOrang, pesanRingkasan, nomorWA } from '../../lib/hitung';

async function kirimWA(teks, no) {
  const pesan = encodeURIComponent(teks);
  const nomor = nomorWA(no);
  const url = nomor ? `https://wa.me/${nomor}?text=${pesan}` : `whatsapp://send?text=${pesan}`;
  try {
    await Linking.openURL(url);
  } catch (e) {
    await Share.share({ message: teks });
  }
}

export default function Detail({ data, aksi, buka, tutup, param }) {
  const t = useTema();
  const tg = data.tagihan.find((x) => x.id === param.id);
  const [buka1, setBuka1] = useState(null);
  if (!tg) return (<View style={{ flex: 1 }}><Header judul="Tagihan" onKembali={tutup} /><Kosong ikon="🤔" judul="Tagihan tidak ditemukan" /></View>);
  const s = statusTagihan(tg);
  const lunas = tg.lunas || {};
  const waTeman = (o) => o.wa || (data.teman.find((f) => f.id === o.id || f.nama.toLowerCase() === o.nama.toLowerCase()) || {}).wa;

  const hapus = () => Alert.alert('Hapus tagihan?', `"${tg.judul}" akan dihapus permanen.`, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: () => { aksi.hapusTagihan(tg.id); tutup(); } },
  ]);
  const salin = async (teks) => { await Clipboard.setStringAsync(teks); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); Alert.alert('Tersalin', 'Teks tagihan sudah disalin.'); };

  return (
    <View style={{ flex: 1 }}>
      <Header
        judul={tg.judul}
        onKembali={tutup}
        kanan={<>
          <Pressable onPress={() => buka('editor', { id: tg.id })} hitSlop={8} style={{ marginRight: 16 }}><Teks warna={t.utama} tebal>Edit</Teks></Pressable>
          <Pressable onPress={hapus} hitSlop={8}><Teks warna={t.merah} tebal>Hapus</Teks></Pressable>
        </>}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <Kartu>
          <Teks pudar ukuran={13}>{tg.tanggal} · {tg.mode === 'rata' ? 'Bagi rata' : 'Sesuai pesanan'} · {tg.orang.length} orang</Teks>
          <Teks tebal ukuran={30} style={{ marginTop: 4 }}>{formatRp(s.total)}</Teks>
          <View style={{ marginTop: 8 }}>
            <Rinci label="Subtotal" nilai={s.subtotal} />
            {s.service ? <Rinci label={`Service ${tg.servicePersen}%`} nilai={s.service} /> : null}
            {s.pajak ? <Rinci label={`Pajak ${tg.pajakPersen}%`} nilai={s.pajak} /> : null}
            {s.diskon ? <Rinci label="Diskon" nilai={-s.diskon} /> : null}
            {s.ongkir ? <Rinci label="Ongkir" nilai={s.ongkir} /> : null}
          </View>
          {s.selisihBulat ? <Teks pudar ukuran={12} style={{ marginTop: 6 }}>Pembulatan menambah {formatRp(s.selisihBulat)} untuk yang bayar dulu.</Teks> : null}
          {s.jumlahWajib > 0 && (
            <View style={{ marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: s.selesai ? t.hijauLembut : t.kuningLembut }}>
              <Teks tebal warna={s.selesai ? t.hijau : t.kuning}>
                {s.selesai ? '✅ Semua sudah lunas' : `⏳ ${s.sudahLunas}/${s.jumlahWajib} sudah bayar · sisa ${formatRp(s.sisa)}`}
              </Teks>
            </View>
          )}
        </Kartu>

        {s.perOrang.map((p) => {
          const penalang = p.id === tg.penalang;
          const sudah = penalang || lunas[p.id];
          const o = tg.orang.find((x) => x.id === p.id) || {};
          return (
            <Kartu key={p.id} style={sudah && !penalang ? { borderColor: t.hijau } : null}>
              <Pressable onPress={() => setBuka1(buka1 === p.id ? null : p.id)}>
                <Baris>
                  <Avatar nama={p.nama} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Teks tebal ukuran={16}>{p.nama}</Teks>
                    <Teks ukuran={12} warna={penalang ? t.utama : sudah ? t.hijau : t.teksPudar} tebal>
                      {penalang ? '💳 Bayar dulu ke kasir' : sudah ? '✅ Lunas' : '⏳ Belum bayar'}
                    </Teks>
                  </View>
                  <Teks tebal ukuran={17}>{formatRp(p.totalBulat)}</Teks>
                </Baris>
              </Pressable>
              {buka1 === p.id && (
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: t.garis }}>
                  {tg.mode === 'rata'
                    ? <Rinci label="Bagian rata" nilai={p.subtotal} />
                    : p.item.map((it, i) => <Rinci key={i} label={`${it.qty > 1 ? it.qty + '× ' : ''}${it.nama}${it.bagi > 1 ? ' ÷' + it.bagi : ''}`} nilai={it.porsi} />)}
                  {p.service ? <Rinci label="Service" nilai={p.service} /> : null}
                  {p.pajak ? <Rinci label="Pajak" nilai={p.pajak} /> : null}
                  {p.diskon ? <Rinci label="Diskon" nilai={-p.diskon} /> : null}
                  {p.ongkir ? <Rinci label="Ongkir" nilai={p.ongkir} /> : null}
                </View>
              )}
              {!penalang && (
                <Baris style={{ marginTop: 12 }}>
                  <Tombol kecil ikon="💬" judul="Tagih via WA" jenis="hijau" onPress={() => kirimWA(pesanPerOrang(tg, p, data.pengaturan), waTeman(o))} style={{ flex: 1, marginRight: 8 }} />
                  <Tombol
                    kecil
                    judul={lunas[p.id] ? 'Batal lunas' : 'Tandai lunas'}
                    jenis={lunas[p.id] ? 'garis' : 'lembut'}
                    onPress={() => { aksi.setLunas(tg.id, p.id, !lunas[p.id]); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }}
                    style={{ flex: 1 }}
                  />
                </Baris>
              )}
            </Kartu>
          );
        })}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, flexDirection: 'row', backgroundColor: t.kartu, borderTopWidth: 1, borderColor: t.garis }}>
        <Tombol ikon="📤" judul="Bagikan ke grup" onPress={() => kirimWA(pesanRingkasan(tg, data.pengaturan))} style={{ flex: 1, marginRight: 8 }} />
        <Tombol ikon="📋" judul="Salin" jenis="lembut" onPress={() => salin(pesanRingkasan(tg, data.pengaturan))} />
      </View>
    </View>
  );
}

function Rinci({ label, nilai }) {
  return (
    <Baris style={{ justifyContent: 'space-between', marginBottom: 4 }}>
      <Teks pudar ukuran={14} style={{ flex: 1, marginRight: 8 }} numberOfLines={1}>{label}</Teks>
      <Teks ukuran={14}>{formatRp(nilai)}</Teks>
    </Baris>
  );
}

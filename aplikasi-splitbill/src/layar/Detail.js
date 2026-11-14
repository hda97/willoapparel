import React, { useRef, useState } from 'react';
import { ScrollView, View, Pressable, Alert, Linking, Share, Modal, Image } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import StrukGambar from '../StrukGambar';
import { hapusFotoStruk } from '../foto';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTema } from '../tema';
import { Kartu, Teks, Tombol, Header, Baris, Avatar, Kosong } from '../ui';
import { eksporExcel } from '../excel';
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
  const [lihatStruk, setLihatStruk] = useState(false);
  const [lihatFoto, setLihatFoto] = useState(false);
  const refStruk = useRef(null);
  if (!tg) return (<View style={{ flex: 1 }}><Header judul="Tagihan" onKembali={tutup} /><Kosong ikon="🤔" judul="Tagihan tidak ditemukan" /></View>);
  const s = statusTagihan(tg);
  const lunas = tg.lunas || {};
  const waTeman = (o) => o.wa || (data.teman.find((f) => f.id === o.id || f.nama.toLowerCase() === o.nama.toLowerCase()) || {}).wa;

  const hapus = () => Alert.alert('Hapus tagihan?', `"${tg.judul}" akan dihapus permanen.`, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: () => { hapusFotoStruk(tg.foto); aksi.hapusTagihan(tg.id); tutup(); } },
  ]);
  const salin = async (teks) => { await Clipboard.setStringAsync(teks); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); Alert.alert('Tersalin', 'Teks tagihan sudah disalin.'); };

  const kirimGambar = async () => {
    try {
      const uri = await captureRef(refStruk, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Kirim struk tagihan' });
    } catch (e) {
      Alert.alert('Gagal membuat gambar', String(e.message || e));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Modal visible={lihatStruk} transparent animationType="fade" onRequestClose={() => setLihatStruk(false)}>
        <View style={{ flex: 1, backgroundColor: '#000000bb', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 20 }}>
            <View ref={refStruk} collapsable={false} style={{ padding: 12, backgroundColor: '#ECEBFF', borderRadius: 22 }}>
              <StrukGambar tg={tg} pengaturan={data.pengaturan} />
            </View>
            <Baris style={{ marginTop: 16, width: 340 }}>
              <Tombol ikon="📤" judul="Kirim gambar" jenis="hijau" onPress={kirimGambar} style={{ flex: 1, marginRight: 8 }} />
              <Tombol judul="Tutup" jenis="lembut" onPress={() => setLihatStruk(false)} />
            </Baris>
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={lihatFoto} transparent animationType="fade" onRequestClose={() => setLihatFoto(false)}>
        <Pressable onPress={() => setLihatFoto(false)} style={{ flex: 1, backgroundColor: '#000000ee', alignItems: 'center', justifyContent: 'center' }}>
          {tg.foto ? <Image source={{ uri: tg.foto }} style={{ width: '100%', height: '85%' }} resizeMode="contain" /> : null}
          <Teks warna="#fff" style={{ marginTop: 8 }}>Ketuk untuk menutup</Teks>
        </Pressable>
      </Modal>
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
          {tg.foto ? (
            <Pressable onPress={() => setLihatFoto(true)} style={{ marginTop: 12 }}>
              <Baris>
                <Image source={{ uri: tg.foto }} style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: t.input }} />
                <Teks warna={t.utama} tebal style={{ marginLeft: 10 }}>📎 Lihat foto struk</Teks>
              </Baris>
            </Pressable>
          ) : null}
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
        <Tombol ikon="🖼" judul="Gambar" onPress={() => setLihatStruk(true)} style={{ flex: 1, marginRight: 8 }} />
        <Tombol ikon="💬" judul="Teks" jenis="hijau" onPress={() => kirimWA(pesanRingkasan(tg, data.pengaturan))} style={{ flex: 1, marginRight: 8 }} />
        <Tombol judul="📋" jenis="lembut" onPress={() => salin(pesanRingkasan(tg, data.pengaturan))} style={{ marginRight: 8 }} />
        <Tombol judul="📊" jenis="lembut" onPress={() => eksporExcel([tg], tg.judul).catch((e) => Alert.alert('Gagal ekspor', String(e.message || e)))} />
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

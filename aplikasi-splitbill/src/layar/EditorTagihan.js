import React, { useMemo, useState } from 'react';
import { ScrollView, View, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTema } from '../tema';
import { Kartu, Judul, Teks, Tombol, Input, Chip, Segmen, Header, Baris, Avatar } from '../ui';
import { hitungTagihan, formatRp, parseAngka, uid } from '../../lib/hitung';

const hariIni = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

function tagihanBaru(pengaturan, draft) {
  const saya = { id: uid(), nama: pengaturan.namaSaya || 'Saya' };
  return {
    id: uid(),
    judul: draft?.judul || '',
    tanggal: hariIni(),
    orang: [saya],
    penalang: saya.id,
    mode: 'item',
    item: (draft?.items || []).map((it) => ({ id: uid(), nama: it.nama, harga: it.harga, qty: it.qty || 1, ikut: [] })),
    servicePersen: draft?.servicePersen ?? pengaturan.serviceDefault ?? 0,
    pajakPersen: draft?.pajakPersen ?? pengaturan.pajakDefault ?? 0,
    diskon: draft?.diskon || 0,
    ongkir: draft?.ongkir || 0,
    pembulatan: pengaturan.pembulatan || 0,
    lunas: {},
    dibuat: Date.now(),
  };
}

export default function EditorTagihan({ data, aksi, tutup, ganti, param }) {
  const t = useTema();
  const awal = useMemo(() => {
    const ada = param.id && data.tagihan.find((x) => x.id === param.id);
    return ada ? JSON.parse(JSON.stringify(ada)) : tagihanBaru(data.pengaturan, param.draft);
  }, []);
  const [tg, setTg] = useState(awal);
  const [namaBaru, setNamaBaru] = useState('');
  const ubah = (p) => setTg((x) => ({ ...x, ...p }));
  const h = useMemo(() => hitungTagihan(tg), [tg]);

  const tambahOrang = (nama, wa, idLama) => {
    const n = (nama || '').trim();
    if (!n) return;
    if (tg.orang.some((o) => o.nama.toLowerCase() === n.toLowerCase())) return;
    ubah({ orang: [...tg.orang, { id: idLama || uid(), nama: n, wa: wa || '' }] });
    setNamaBaru('');
  };
  const hapusOrang = (id) => {
    const orang = tg.orang.filter((o) => o.id !== id);
    ubah({
      orang,
      penalang: tg.penalang === id ? orang[0]?.id : tg.penalang,
      item: tg.item.map((it) => ({ ...it, ikut: (it.ikut || []).filter((x) => x !== id) })),
    });
  };
  const ubahItem = (id, p) => ubah({ item: tg.item.map((it) => (it.id === id ? { ...it, ...p } : it)) });
  const toggleIkut = (it, oid) => {
    const ikut = it.ikut || [];
    ubahItem(it.id, { ikut: ikut.includes(oid) ? ikut.filter((x) => x !== oid) : [...ikut, oid] });
  };

  const saranTeman = data.teman.filter((f) => !tg.orang.some((o) => o.nama.toLowerCase() === f.nama.toLowerCase()));
  const cocok = namaBaru.trim() ? saranTeman.filter((f) => f.nama.toLowerCase().includes(namaBaru.trim().toLowerCase())) : saranTeman;

  const simpanTagihan = () => {
    if (tg.orang.length < 2) return Alert.alert('Minimal 2 orang', 'Tambahkan teman yang ikut patungan dulu.');
    if (tg.mode === 'item' && !tg.item.some((it) => Number(it.harga) > 0)) return Alert.alert('Belum ada item', 'Tambahkan minimal 1 item dengan harga.');
    if (tg.mode === 'rata' && h.total <= 0) return Alert.alert('Total masih 0', 'Isi item atau total belanja dulu.');
    const bersih = { ...tg, judul: tg.judul.trim() || 'Patungan ' + tg.tanggal, item: tg.item.filter((it) => (it.nama || '').trim() || Number(it.harga) > 0) };
    aksi.simpanTagihan(bersih);
    ganti('detail', { id: bersih.id });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header judul={param.id ? 'Edit Tagihan' : 'Tagihan Baru'} onKembali={tutup} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        <Kartu>
          <Input label="Judul" value={tg.judul} onChangeText={(v) => ubah({ judul: v })} placeholder="mis. Makan malam di Warung Bu Sri" />
          <Input label="Tanggal" value={tg.tanggal} onChangeText={(v) => ubah({ tanggal: v })} style={{ marginTop: 12 }} />
        </Kartu>

        <Kartu>
          <Judul>👥 Siapa saja ikut? ({tg.orang.length})</Judul>
          {tg.orang.map((o) => (
            <Baris key={o.id} style={{ marginBottom: 8 }}>
              <Avatar nama={o.nama} ukuran={32} />
              <Teks style={{ flex: 1, marginLeft: 10 }} tebal>{o.nama}</Teks>
              <Pressable onPress={() => ubah({ penalang: o.id })} style={{ marginRight: 12 }}>
                <Teks ukuran={12} tebal warna={tg.penalang === o.id ? t.hijau : t.teksPudar}>
                  {tg.penalang === o.id ? '💳 Bayar dulu' : 'Bayar dulu?'}
                </Teks>
              </Pressable>
              <Pressable onPress={() => hapusOrang(o.id)} hitSlop={10}><Teks warna={t.merah} tebal>✕</Teks></Pressable>
            </Baris>
          ))}
          <Baris style={{ marginTop: 6 }}>
            <Input
              value={namaBaru}
              onChangeText={setNamaBaru}
              placeholder="Nama teman"
              onSubmitEditing={() => tambahOrang(namaBaru)}
              returnKeyType="done"
              blurOnSubmit={false}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Tombol judul="Tambah" kecil onPress={() => tambahOrang(namaBaru)} />
          </Baris>
          {cocok.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Teks pudar ukuran={12} style={{ marginBottom: 6 }}>Teman tersimpan:</Teks>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {cocok.slice(0, 12).map((f) => <Chip key={f.id} label={'+ ' + f.nama} onPress={() => tambahOrang(f.nama, f.wa, f.id)} />)}
              </View>
            </View>
          )}
        </Kartu>

        <Kartu>
          <Judul>➗ Cara bagi</Judul>
          <Segmen nilai={tg.mode} onUbah={(v) => ubah({ mode: v })} pilihan={[{ nilai: 'item', label: 'Sesuai pesanan' }, { nilai: 'rata', label: 'Bagi rata' }]} />
          <Teks pudar ukuran={12} style={{ marginTop: 8 }}>
            {tg.mode === 'item' ? 'Tiap item dibayar orang yang ikut makan/pakai. Item tanpa pilihan dibagi ke semua.' : 'Total dibagi sama besar ke semua orang.'}
          </Teks>
        </Kartu>

        <Kartu>
          <Judul>🛒 Item ({tg.item.length})</Judul>
          {tg.item.map((it, i) => (
            <View key={it.id} style={{ borderTopWidth: i ? 1 : 0, borderColor: t.garis, paddingTop: i ? 12 : 0, marginBottom: 12 }}>
              <Baris>
                <Input value={it.nama} onChangeText={(v) => ubahItem(it.id, { nama: v })} placeholder="Nama item" style={{ flex: 1, marginRight: 8 }} />
                <Pressable onPress={() => ubah({ item: tg.item.filter((x) => x.id !== it.id) })} hitSlop={10}>
                  <Teks warna={t.merah} tebal>🗑</Teks>
                </Pressable>
              </Baris>
              <Baris style={{ marginTop: 8 }}>
                <Input
                  value={it.harga ? String(it.harga) : ''}
                  onChangeText={(v) => ubahItem(it.id, { harga: parseAngka(v) })}
                  placeholder="Harga satuan"
                  keyboardType="number-pad"
                  style={{ flex: 2, marginRight: 8 }}
                />
                <Baris style={{ flex: 1.3 }}>
                  <Tombol judul="−" kecil jenis="garis" onPress={() => ubahItem(it.id, { qty: Math.max(1, (it.qty || 1) - 1) })} />
                  <Teks tebal style={{ flex: 1, textAlign: 'center' }}>{it.qty || 1}</Teks>
                  <Tombol judul="+" kecil jenis="garis" onPress={() => ubahItem(it.id, { qty: (it.qty || 1) + 1 })} />
                </Baris>
              </Baris>
              <Teks pudar ukuran={12} style={{ marginTop: 6 }}>= {formatRp((it.harga || 0) * (it.qty || 1))}</Teks>
              {tg.mode === 'item' && tg.orang.length > 1 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                  <Chip label="Semua" aktif={!(it.ikut || []).length} onPress={() => ubahItem(it.id, { ikut: [] })} />
                  {tg.orang.map((o) => <Chip key={o.id} label={o.nama} aktif={(it.ikut || []).includes(o.id)} onPress={() => toggleIkut(it, o.id)} />)}
                </View>
              )}
            </View>
          ))}
          <Tombol ikon="＋" judul="Tambah item" jenis="lembut" onPress={() => ubah({ item: [...tg.item, { id: uid(), nama: '', harga: 0, qty: 1, ikut: [] }] })} />
        </Kartu>

        <Kartu>
          <Judul>🧮 Biaya tambahan</Judul>
          <Baris>
            <Input label="Service %" value={tg.servicePersen ? String(tg.servicePersen) : ''} onChangeText={(v) => ubah({ servicePersen: parseFloat(v.replace(',', '.')) || 0 })} keyboardType="decimal-pad" placeholder="0" style={{ flex: 1, marginRight: 8 }} />
            <Input label="Pajak / PB1 %" value={tg.pajakPersen ? String(tg.pajakPersen) : ''} onChangeText={(v) => ubah({ pajakPersen: parseFloat(v.replace(',', '.')) || 0 })} keyboardType="decimal-pad" placeholder="0" style={{ flex: 1 }} />
          </Baris>
          <Baris style={{ marginTop: 12 }}>
            <Input label="Diskon (Rp)" value={tg.diskon ? String(tg.diskon) : ''} onChangeText={(v) => ubah({ diskon: parseAngka(v) })} keyboardType="number-pad" placeholder="0" style={{ flex: 1, marginRight: 8 }} />
            <Input label="Ongkir (Rp)" value={tg.ongkir ? String(tg.ongkir) : ''} onChangeText={(v) => ubah({ ongkir: parseAngka(v) })} keyboardType="number-pad" placeholder="0" style={{ flex: 1 }} />
          </Baris>
          <Teks pudar ukuran={12} style={{ marginTop: 8 }}>Service, pajak, dan diskon dibagi sesuai porsi belanja tiap orang. Ongkir dibagi rata.</Teks>
          <Teks pudar ukuran={12} tebal style={{ marginTop: 12, marginBottom: 6 }}>PEMBULATAN</Teks>
          <Segmen
            nilai={tg.pembulatan || 0}
            onUbah={(v) => ubah({ pembulatan: v })}
            pilihan={[{ nilai: 0, label: 'Pas' }, { nilai: 100, label: '100' }, { nilai: 500, label: '500' }, { nilai: 1000, label: '1.000' }]}
          />
        </Kartu>

        <Kartu>
          <Judul>📊 Pratinjau</Judul>
          {h.perOrang.map((p) => (
            <Baris key={p.id} style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <Teks>{p.nama}{p.id === tg.penalang ? ' 💳' : ''}</Teks>
              <Teks tebal>{formatRp(p.totalBulat)}</Teks>
            </Baris>
          ))}
          <View style={{ borderTopWidth: 1, borderColor: t.garis, marginTop: 6, paddingTop: 8 }}>
            <Baris style={{ justifyContent: 'space-between' }}>
              <Teks tebal>Total</Teks>
              <Teks tebal warna={t.utama}>{formatRp(h.total)}</Teks>
            </Baris>
          </View>
        </Kartu>
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: t.kartu, borderTopWidth: 1, borderColor: t.garis }}>
        <Tombol ikon="💾" judul={`Simpan · ${formatRp(h.total)}`} onPress={simpanTagihan} />
      </View>
    </KeyboardAvoidingView>
  );
}

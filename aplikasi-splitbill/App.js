import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, BackHandler, useColorScheme, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TemaContext, terang, gelap } from './src/tema';
import { muat, simpan } from './src/store';
import Beranda from './src/layar/Beranda';
import EditorTagihan from './src/layar/EditorTagihan';
import Scan from './src/layar/Scan';
import Detail from './src/layar/Detail';
import Teman from './src/layar/Teman';
import Pengaturan from './src/layar/Pengaturan';

const TAB = [
  { id: 'beranda', label: 'Tagihan', ikon: '🧾' },
  { id: 'teman', label: 'Teman', ikon: '👥' },
  { id: 'pengaturan', label: 'Atur', ikon: '⚙️' },
];

export default function App() {
  const sistem = useColorScheme();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('beranda');
  const [tumpukan, setTumpukan] = useState([]); // [{layar, param}]

  useEffect(() => { muat().then(setData); }, []);
  useEffect(() => { if (data) simpan(data); }, [data]);

  const tema = useMemo(() => {
    const p = data?.pengaturan?.tema || 'sistem';
    return p === 'gelap' || (p === 'sistem' && sistem === 'dark') ? gelap : terang;
  }, [data?.pengaturan?.tema, sistem]);

  const buka = useCallback((layar, param) => setTumpukan((s) => [...s, { layar, param }]), []);
  const tutup = useCallback(() => setTumpukan((s) => s.slice(0, -1)), []);
  const ganti = useCallback((layar, param) => setTumpukan((s) => [...s.slice(0, -1), { layar, param }]), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tumpukan.length) { tutup(); return true; }
      if (tab !== 'beranda') { setTab('beranda'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [tumpukan.length, tab, tutup]);

  const aksi = useMemo(() => ({
    simpanTagihan: (t) => setData((d) => {
      const ada = d.tagihan.some((x) => x.id === t.id);
      const baru = { ...t, diubah: Date.now() };
      // Simpan teman baru otomatis supaya tagihan berikutnya tinggal pilih.
      const teman = [...d.teman];
      for (const o of t.orang) {
        if (!teman.some((x) => x.nama.toLowerCase() === o.nama.toLowerCase()) && o.nama.toLowerCase() !== (d.pengaturan.namaSaya || '').toLowerCase()) {
          teman.push({ id: o.id, nama: o.nama, wa: o.wa || '' });
        }
      }
      return { ...d, teman, tagihan: ada ? d.tagihan.map((x) => (x.id === t.id ? baru : x)) : [baru, ...d.tagihan] };
    }),
    hapusTagihan: (id) => setData((d) => ({ ...d, tagihan: d.tagihan.filter((x) => x.id !== id) })),
    setLunas: (id, orangId, nilai) => setData((d) => ({
      ...d,
      tagihan: d.tagihan.map((x) => (x.id === id ? { ...x, lunas: { ...(x.lunas || {}), [orangId]: nilai } } : x)),
    })),
    setTeman: (teman) => setData((d) => ({ ...d, teman })),
    setPengaturan: (p) => setData((d) => ({ ...d, pengaturan: { ...d.pengaturan, ...p } })),
    hapusSemua: () => setData((d) => ({ ...d, tagihan: [] })),
  }), []);

  if (!data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6C63FF' }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const atas = tumpukan[tumpukan.length - 1];
  const umum = { data, aksi, buka, tutup, ganti };
  let isi;
  if (atas) {
    const L = { editor: EditorTagihan, scan: Scan, detail: Detail }[atas.layar];
    isi = <L key={tumpukan.length} {...umum} param={atas.param || {}} />;
  } else {
    isi = tab === 'beranda' ? <Beranda {...umum} /> : tab === 'teman' ? <Teman {...umum} /> : <Pengaturan {...umum} />;
  }

  return (
    <SafeAreaProvider>
      <TemaContext.Provider value={tema}>
        <StatusBar style={tema.gelap ? 'light' : 'dark'} />
        <SafeAreaView style={{ flex: 1, backgroundColor: tema.kartu }} edges={['top', 'bottom']}>
          <View style={{ flex: 1, backgroundColor: tema.latar }}>{isi}</View>
          {!atas && (
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: tema.garis, backgroundColor: tema.kartu }}>
              {TAB.map((x) => (
                <Pressable key={x.id} onPress={() => setTab(x.id)} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 20, opacity: tab === x.id ? 1 : 0.5 }}>{x.ikon}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: tab === x.id ? tema.utama : tema.teksPudar }}>{x.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </SafeAreaView>
      </TemaContext.Provider>
    </SafeAreaProvider>
  );
}

import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTema } from './tema';

export function Kartu({ children, style }) {
  const t = useTema();
  return <View style={[s.kartu, { backgroundColor: t.kartu, borderColor: t.garis }, style]}>{children}</View>;
}

export function Judul({ children, style }) {
  const t = useTema();
  return <Text style={[s.judul, { color: t.teks }, style]}>{children}</Text>;
}

export function Teks({ children, pudar, tebal, ukuran, warna, style, ...p }) {
  const t = useTema();
  return (
    <Text {...p} style={[{ color: warna || (pudar ? t.teksPudar : t.teks), fontSize: ukuran || 15, fontWeight: tebal ? '700' : '400' }, style]}>
      {children}
    </Text>
  );
}

export function Tombol({ judul, onPress, jenis = 'utama', ikon, kecil, style, disabled }) {
  const t = useTema();
  const warna = {
    utama: { bg: t.utama, fg: '#fff', bd: t.utama },
    lembut: { bg: t.utamaLembut, fg: t.utama, bd: t.utamaLembut },
    garis: { bg: 'transparent', fg: t.teks, bd: t.garis },
    hijau: { bg: t.hijau, fg: '#fff', bd: t.hijau },
    bahaya: { bg: t.merahLembut, fg: t.merah, bd: t.merahLembut },
  }[jenis];
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.tombol,
        kecil && s.tombolKecil,
        { backgroundColor: warna.bg, borderColor: warna.bd, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Text style={{ color: warna.fg, fontWeight: '700', fontSize: kecil ? 13 : 15 }}>
        {ikon ? ikon + '  ' : ''}{judul}
      </Text>
    </Pressable>
  );
}

export function Input({ label, style, ...p }) {
  const t = useTema();
  return (
    <View style={style}>
      {label ? <Text style={[s.label, { color: t.teksPudar }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={t.teksPudar}
        {...p}
        style={[s.input, { backgroundColor: t.input, color: t.teks }, p.multiline && { minHeight: 120, textAlignVertical: 'top' }, p.inputStyle]}
      />
    </View>
  );
}

export function Chip({ label, aktif, onPress, warna }) {
  const t = useTema();
  const c = warna || t.utama;
  return (
    <Pressable onPress={onPress} style={[s.chip, { borderColor: aktif ? c : t.garis, backgroundColor: aktif ? c : 'transparent' }]}>
      <Text style={{ color: aktif ? '#fff' : t.teks, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Segmen({ pilihan, nilai, onUbah }) {
  const t = useTema();
  return (
    <View style={[s.segmen, { backgroundColor: t.input }]}>
      {pilihan.map((p) => (
        <Pressable key={String(p.nilai)} onPress={() => onUbah(p.nilai)} style={[s.segmenItem, nilai === p.nilai && { backgroundColor: t.kartu, elevation: 2 }]}>
          <Text style={{ color: nilai === p.nilai ? t.utama : t.teksPudar, fontWeight: '700', fontSize: 13 }}>{p.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Header({ judul, onKembali, kanan }) {
  const t = useTema();
  return (
    <View style={[s.header, { borderColor: t.garis, backgroundColor: t.kartu }]}>
      {onKembali ? (
        <Pressable onPress={onKembali} hitSlop={12} style={s.kembali}>
          <Text style={{ color: t.utama, fontSize: 22, fontWeight: '700' }}>‹</Text>
        </Pressable>
      ) : null}
      <Text numberOfLines={1} style={[s.headerJudul, { color: t.teks }]}>{judul}</Text>
      <View style={{ flexDirection: 'row' }}>{kanan}</View>
    </View>
  );
}

export function Kosong({ ikon, judul, teks }) {
  return (
    <View style={{ alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 44 }}>{ikon}</Text>
      <Teks tebal ukuran={17} style={{ marginTop: 8, textAlign: 'center' }}>{judul}</Teks>
      {teks ? <Teks pudar style={{ marginTop: 4, textAlign: 'center' }}>{teks}</Teks> : null}
    </View>
  );
}

export function Baris({ children, style }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

export const inisial = (nama) => (nama || '?').trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
const WARNA_AVATAR = ['#6C63FF', '#F97316', '#10B981', '#EC4899', '#0EA5E9', '#EAB308', '#8B5CF6', '#EF4444'];
export function Avatar({ nama, ukuran = 36 }) {
  let h = 0;
  for (const c of nama || '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <View style={{ width: ukuran, height: ukuran, borderRadius: ukuran / 2, backgroundColor: WARNA_AVATAR[h % WARNA_AVATAR.length], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: ukuran * 0.38 }}>{inisial(nama)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  kartu: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  judul: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  tombol: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tombolKecil: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  segmen: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segmenItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  kembali: { marginRight: 12, paddingRight: 4 },
  headerJudul: { flex: 1, fontSize: 18, fontWeight: '800' },
});

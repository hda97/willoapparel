import React from 'react';
import { View, Text } from 'react-native';
import { statusTagihan, formatRp } from '../lib/hitung';

// Struk cantik untuk dikirim sebagai gambar. Selalu tema terang supaya jelas di WA.
const U = '#6C63FF';
export default function StrukGambar({ tg, pengaturan }) {
  const s = statusTagihan(tg);
  const lunas = tg.lunas || {};
  const bayar = (pengaturan.pembayaran || []).filter((b) => b && b.nomor);
  const T = ({ children, style }) => <Text style={[{ color: '#1B1B2F', fontSize: 13 }, style]}>{children}</Text>;
  const Garis = () => <View style={{ borderBottomWidth: 1, borderStyle: 'dashed', borderColor: '#CFCDEB', marginVertical: 10 }} />;
  return (
    <View style={{ width: 340, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' }}>
      <View style={{ backgroundColor: U, padding: 16 }}>
        <Text style={{ color: '#ffffffcc', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>🧾 SPLITBILL CERDAS</Text>
        <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 4 }} numberOfLines={2}>{tg.judul}</Text>
        <Text style={{ color: '#ffffffcc', fontSize: 12, marginTop: 2 }}>{tg.tanggal} · {tg.orang.length} orang · {tg.mode === 'rata' ? 'bagi rata' : 'sesuai pesanan'}</Text>
      </View>
      <View style={{ padding: 16 }}>
        {tg.mode !== 'rata' && (tg.item || []).length > 0 && (
          <>
            {(tg.item || []).slice(0, 12).map((it, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
                <T style={{ flex: 1, color: '#55556A' }}>{(it.qty || 1) > 1 ? it.qty + '× ' : ''}{it.nama || 'Item'}</T>
                <T style={{ color: '#55556A' }}>{formatRp((it.harga || 0) * (it.qty || 1))}</T>
              </View>
            ))}
            {(tg.item || []).length > 12 && <T style={{ color: '#8A8AA0', fontSize: 12 }}>+{tg.item.length - 12} item lain</T>}
            <Garis />
          </>
        )}
        {[['Subtotal', s.subtotal], ['Service', s.service], ['Pajak', s.pajak], ['Diskon', -s.diskon], ['Ongkir', s.ongkir]].filter(([, v]) => v).map(([l, v]) => (
          <View key={l} style={{ flexDirection: 'row', marginBottom: 2 }}>
            <T style={{ flex: 1, color: '#6B6B80' }}>{l}</T><T style={{ color: '#6B6B80' }}>{formatRp(v)}</T>
          </View>
        ))}
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <T style={{ flex: 1, fontWeight: '800', fontSize: 16 }}>TOTAL</T>
          <T style={{ fontWeight: '800', fontSize: 16, color: U }}>{formatRp(s.total)}</T>
        </View>
        <Garis />
        <T style={{ fontWeight: '800', marginBottom: 6 }}>Bagian masing-masing</T>
        {s.perOrang.map((p) => {
          const tanda = p.id === tg.penalang ? { t: 'BAYAR DULU', bg: '#ECEBFF', c: U } : lunas[p.id] ? { t: 'LUNAS', bg: '#DCFCE7', c: '#166534' } : { t: 'BELUM', bg: '#FEF3C7', c: '#92400E' };
          return (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <T style={{ flex: 1, fontWeight: '600', fontSize: 14 }}>{p.nama}</T>
              <View style={{ backgroundColor: tanda.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
                <Text style={{ color: tanda.c, fontSize: 9, fontWeight: '800' }}>{tanda.t}</Text>
              </View>
              <T style={{ fontWeight: '800', fontSize: 14 }}>{formatRp(p.totalBulat)}</T>
            </View>
          );
        })}
        {bayar.length > 0 && (
          <View style={{ backgroundColor: '#F6F6FB', borderRadius: 10, padding: 10, marginTop: 8 }}>
            <T style={{ fontWeight: '800', fontSize: 12, marginBottom: 2 }}>💳 Transfer ke</T>
            {bayar.map((b, i) => <T key={i} style={{ fontSize: 12 }}>{b.jenis}: {b.nomor}{b.atasNama ? ' a.n. ' + b.atasNama : ''}</T>)}
          </View>
        )}
        <Text style={{ textAlign: 'center', color: '#A0A0B8', fontSize: 10, marginTop: 12 }}>Dibuat dengan Splitbill Cerdas</Text>
      </View>
    </View>
  );
}

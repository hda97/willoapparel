import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { useTema } from './tema';

// Diagram donat per kategori. data: [{warna, total}]
export function Donat({ data, ukuran = 168, tebal = 26, tengah }) {
  const t = useTema();
  const r = (ukuran - tebal) / 2;
  const keliling = 2 * Math.PI * r;
  const total = data.reduce((a, d) => a + d.total, 0);
  let offset = 0;
  return (
    <View style={{ width: ukuran, height: ukuran, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={ukuran} height={ukuran} style={{ position: 'absolute' }}>
        <Circle cx={ukuran / 2} cy={ukuran / 2} r={r} stroke={t.input} strokeWidth={tebal} fill="none" />
        <G rotation={-90} origin={`${ukuran / 2}, ${ukuran / 2}`}>
          {total > 0 && data.map((d, i) => {
            const panjang = (d.total / total) * keliling;
            const el = (
              <Circle key={i} cx={ukuran / 2} cy={ukuran / 2} r={r} stroke={d.warna} strokeWidth={tebal} fill="none"
                strokeDasharray={`${Math.max(0, panjang - (data.length > 1 ? 2 : 0))} ${keliling}`} strokeDashoffset={-offset} />
            );
            offset += panjang;
            return el;
          })}
        </G>
      </Svg>
      {tengah}
    </View>
  );
}

// Grafik batang tren bulanan. data: [{label, total}], indeks aktif disorot.
export function Batang({ data, aktif, lebar = 320, tinggi = 140, formatAngka }) {
  const t = useTema();
  const maks = Math.max(1, ...data.map((d) => d.total));
  const n = data.length;
  const slot = lebar / n;
  const bw = Math.min(34, slot * 0.56);
  const atas = 18, bawah = 22;
  const area = tinggi - atas - bawah;
  return (
    <Svg width={lebar} height={tinggi}>
      {data.map((d, i) => {
        const h = Math.max(d.total ? 4 : 2, (d.total / maks) * area);
        const x = i * slot + (slot - bw) / 2;
        const y = atas + area - h;
        const on = i === aktif;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={bw} height={h} rx={6} fill={on ? t.utama : t.utamaLembut} />
            {d.total > 0 && (
              <SvgText x={x + bw / 2} y={y - 5} fontSize={9} fontWeight="700" fill={on ? t.utama : t.teksPudar} textAnchor="middle">
                {formatAngka ? formatAngka(d.total) : d.total}
              </SvgText>
            )}
            <SvgText x={x + bw / 2} y={tinggi - 6} fontSize={11} fontWeight={on ? '800' : '500'} fill={on ? t.teks : t.teksPudar} textAnchor="middle">
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export const singkatRp = (n) => (n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + 'jt' : n >= 1e3 ? Math.round(n / 1e3) + 'rb' : String(Math.round(n)));

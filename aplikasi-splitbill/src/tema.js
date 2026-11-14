import React from 'react';

export const UTAMA = '#6C63FF';

export const terang = {
  gelap: false,
  utama: UTAMA,
  utamaLembut: '#ECEBFF',
  latar: '#F6F6FB',
  kartu: '#FFFFFF',
  teks: '#1B1B2F',
  teksPudar: '#6B6B80',
  garis: '#E4E4EE',
  hijau: '#16A34A',
  hijauLembut: '#DCFCE7',
  merah: '#DC2626',
  merahLembut: '#FEE2E2',
  kuning: '#B45309',
  kuningLembut: '#FEF3C7',
  input: '#F1F1F7',
};

export const gelap = {
  gelap: true,
  utama: '#8B84FF',
  utamaLembut: '#2A2850',
  latar: '#0F0F1A',
  kartu: '#1A1A2B',
  teks: '#F2F2F8',
  teksPudar: '#A0A0B8',
  garis: '#2C2C42',
  hijau: '#4ADE80',
  hijauLembut: '#123323',
  merah: '#F87171',
  merahLembut: '#3B1515',
  kuning: '#FBBF24',
  kuningLembut: '#3A2A0A',
  input: '#23233A',
};

export const TemaContext = React.createContext(terang);
export const useTema = () => React.useContext(TemaContext);

#!/usr/bin/env python3
"""Siapkan aset Pelari Kalcer 3D (Willo Apparel Master Bundle) ke pelarikalcer/aset/.

  python3 pelarikalcer/potong_aset.py

1. aset-sumber/bundel/*  : aset siap pakai dari Master Bundle Huda (katalog gear, karakter,
   booth, map, item) -> disalin & diperkecil.
2. aset-sumber/sheet.png : sprite lingkungan (landmark, kerucut, pohon, dll) dipotong dan
   latar gelapnya dihapus. Garuda & bendera TIDAK dipakai (arah seni baru: tanpa atribut negara).
"""
import pathlib
from collections import deque
from PIL import Image, ImageFilter

AKAR = pathlib.Path(__file__).resolve().parent
SUMBER = AKAR / 'aset-sumber'
KELUAR = AKAR / 'aset'
KELUAR.mkdir(exist_ok=True)

# lebar maksimum per kelompok aset bundel
LEBAR_BUNDEL = {'char_': 260, 'booth_': 300, 'item_': 128}
PETA = {'jakarta', 'jogja', 'bali', 'lawu', 'bromo', 'dieng_rinjani'}

# nama: (kotak potong di sheet.png 1312x1199, lebar maks)
POTONG_SHEET = {
    'magnet':   ((1072, 772, 1138, 838), 128),
    'perisai':  ((1152, 770, 1216, 840), 128),
    'hati':     ((1228, 774, 1292, 836), 128),
    'kerucut':  ((1220, 1058, 1286, 1146), 128),
    'pohon':    ((1012, 1048, 1098, 1146), 192),
    'batu':     ((1104, 1068, 1210, 1140), 160),
    'lampu':    ((1130, 922, 1168, 1022), 96),
    'rambu':    ((1202, 934, 1272, 1020), 160),
    'bangku':   ((1012, 958, 1098, 1018), 160),
    'angkot':   ((1196, 640, 1292, 724), 192),
    'gerobak':  ((1100, 620, 1194, 720), 192),
    'sepeda':   ((992, 642, 1094, 716), 192),
    'monas':    ((924, 462, 984, 580), 160),
    'borobudur': ((992, 484, 1112, 580), 240),
    'joglo':    ((1112, 498, 1206, 580), 200),
    'baligate': ((1210, 462, 1296, 580), 180),
    'finish':   ((818, 1074, 872, 1142), 96),
}


def hapus_latar(im, toleransi=34):
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    sudut = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    ref = tuple(sum(c[i] for c in sudut) // 4 for i in range(3))

    def mirip(c):
        return abs(c[0] - ref[0]) + abs(c[1] - ref[1]) + abs(c[2] - ref[2]) < toleransi

    lihat = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    mask = Image.new('L', (w, h), 255)
    mp = mask.load()
    while q:
        x, y = q.popleft()
        i = y * w + x
        if lihat[i]:
            continue
        lihat[i] = 1
        if not mirip(px[x, y]):
            continue
        mp[x, y] = 0
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(mask)
    bbox = mask.point(lambda v: 255 if v > 20 else 0).getbbox()
    return im.crop(bbox) if bbox else im


def kecilkan(im, lebar):
    if im.width > lebar:
        im = im.resize((lebar, round(im.height * lebar / im.width)), Image.LANCZOS)
    return im


# 1. aset bundel
for f in sorted((SUMBER / 'bundel').iterdir()):
    nama = f.stem
    lebar = 220
    for awalan, l in LEBAR_BUNDEL.items():
        if nama.startswith(awalan):
            lebar = l
    if nama in PETA:
        lebar = 560
    im = Image.open(f)
    im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
    kecilkan(im, lebar).save(KELUAR / f'{nama}.png', optimize=True)

# 2. potongan sheet lingkungan
sheet = Image.open(SUMBER / 'sheet.png').convert('RGB')
for nama, (kotak, lebar) in POTONG_SHEET.items():
    kecilkan(hapus_latar(sheet.crop(kotak)), lebar).save(KELUAR / f'{nama}.png', optimize=True)

# 3. jam tangan GPS 10:08 (ritual sebelum lari)
S = 1.288
jam = Image.open(SUMBER / 'jam.jpg').convert('RGB').crop(tuple(int(v * S) for v in (226, 186, 512, 606)))
kecilkan(hapus_latar(jam), 300).save(KELUAR / 'jam.png', optimize=True)

print(len(list(KELUAR.glob('*.png'))), 'aset siap di', KELUAR)

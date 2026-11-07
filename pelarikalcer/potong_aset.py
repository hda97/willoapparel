#!/usr/bin/env python3
"""Potong aset Pelari Kalcer dari gambar sumber (aset-sumber/) jadi PNG transparan.

  python3 pelarikalcer/potong_aset.py

Latar gelap gambar sumber dihapus dengan flood fill dari tepi kotak potong,
lalu hasilnya disimpan ke pelarikalcer/aset/<nama>.png (dipakai build.py).
"""
import pathlib
from collections import deque
from PIL import Image, ImageFilter

AKAR = pathlib.Path(__file__).resolve().parent
SUMBER = AKAR / 'aset-sumber'
KELUAR = AKAR / 'aset'
KELUAR.mkdir(exist_ok=True)

# nama: (file sumber, kotak (x0,y0,x1,y1) piksel asli, lebar maks keluaran, hapus latar?)
S = 1.288  # skala lintasan-item.jpg / jam.jpg / pelari-wanita.jpg (2576 px) dari tampilan 2000 px
POTONG = {
    # pickup & UI (sheet 1312x1199)
    'koin':     ('sheet.png', (918, 772, 982, 836), 128, True),
    'petir':    ('sheet.png', (1000, 768, 1052, 836), 128, True),
    'magnet':   ('sheet.png', (1072, 772, 1138, 838), 128, True),
    'perisai':  ('sheet.png', (1152, 770, 1216, 840), 128, True),
    'hati':     ('sheet.png', (1228, 774, 1292, 836), 128, True),
    'kerucut':  ('sheet.png', (1220, 1058, 1286, 1146), 128, True),
    'pohon':    ('sheet.png', (1012, 1048, 1098, 1146), 192, True),
    'batu':     ('sheet.png', (1104, 1068, 1210, 1140), 160, True),
    'lampu':    ('sheet.png', (1130, 922, 1168, 1022), 96, True),
    'rambu':    ('sheet.png', (1202, 934, 1272, 1020), 160, True),
    'bangku':   ('sheet.png', (1012, 958, 1098, 1018), 160, True),
    'angkot':   ('sheet.png', (1196, 640, 1292, 724), 192, True),
    'gerobak':  ('sheet.png', (1100, 620, 1194, 720), 192, True),
    'bendera':  ('sheet.png', (922, 624, 990, 724), 128, True),
    'sepeda':   ('sheet.png', (992, 642, 1094, 716), 192, True),
    'monas':    ('sheet.png', (924, 462, 984, 580), 160, True),
    'finish':   ('sheet.png', (818, 1074, 872, 1142), 96, True),
    'mahkota':  ('sheet.png', (800, 1010, 852, 1062), 96, True),
    # item koleksi (lintasan-item.jpg resolusi tinggi)
    'botol':    ('lintasan-item.jpg', tuple(int(v * S) for v in (196, 724, 312, 980)), 160, True),
    'gel':      ('lintasan-item.jpg', tuple(int(v * S) for v in (462, 730, 626, 976)), 160, True),
    'pisang':   ('lintasan-item.jpg', tuple(int(v * S) for v in (740, 736, 976, 976)), 160, True),
    'lootbox':  ('lintasan-item.jpg', tuple(int(v * S) for v in (1614, 728, 1852, 984)), 192, True),
    'tile-aspal': ('lintasan-item.jpg', tuple(int(v * S) for v in (52, 140, 312, 428)), 256, True),
    # jam tangan GPS (jam.jpg)
    'jam':      ('jam.jpg', tuple(int(v * S) for v in (226, 186, 512, 606)), 420, True),
    # garuda putih di punggung jersey (pelari-wanita.jpg, tampak belakang)
    'garuda':   ('pelari-wanita.jpg', tuple(int(v * S) for v in (975, 282, 1075, 388)), 256, False),
    # karakter untuk layar pilih (pelari-wanita.jpg & pria)
    'wanita':   ('pelari-wanita.jpg', tuple(int(v * S) for v in (40, 80, 520, 1012)), 300, True),
    'pria':     ('sheet.png', (30, 52, 166, 392), 150, True),
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


for nama, (berkas, kotak, lebar, latar) in POTONG.items():
    im = Image.open(SUMBER / berkas).convert('RGB').crop(kotak)
    if nama == 'garuda':
        # ambil hanya garis putih garuda sebagai decal (alfa = keputihan)
        g = im.convert('L').point(lambda v: max(0, min(255, (v - 150) * 3)))
        im = Image.new('RGBA', im.size, (255, 255, 255, 255)); im.putalpha(g)
    else:
        im = hapus_latar(im) if latar else im.convert('RGBA')
    if im.width > lebar:
        im = im.resize((lebar, round(im.height * lebar / im.width)), Image.LANCZOS)
    im.save(KELUAR / f'{nama}.png', optimize=True)
    print(f'{nama:10s} {im.size}')

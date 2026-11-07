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

# 4. gambar tambahan dari Huda (aset-sumber/huda/*.jpg, latar abu polos) -> latar dihapus
#    nama sumber: (nama keluaran, lebar maks, toleransi latar)
HUDA = {
    'magnet': ('magnet', 160, 30), 'perisai': ('perisai', 160, 30), 'hati': ('hati', 160, 30),
    'kerucut': ('kerucut', 192, 30), 'pembatas': ('pembatas', 256, 30),
    'batu_trail': ('batu', 256, 30), 'akar': ('akar', 320, 30),
    'pohon_pinus': ('pohon_pinus', 256, 30), 'pohon_kelapa': ('pohon_kelapa', 256, 30), 'jukung': ('jukung', 320, 30),
    'bg_jakarta': ('bg_jakarta', 1280, 26), 'bg_jogja': ('bg_jogja', 1280, 26), 'bg_bali': ('bg_bali', 1280, 26),
    'bg_lawu': ('bg_lawu', 1280, 26), 'bg_bromo': ('bg_bromo', 1280, 26), 'bg_rinjani': ('bg_rinjani', 1280, 26),
    'gapura_start': ('gapura_start', 420, 30),
}
DIR_HUDA = SUMBER / 'huda'
BAYANGAN = {'gapura_start', 'magnet', 'perisai', 'hati', 'kerucut', 'pembatas', 'pohon_kelapa', 'jukung'}


def hapus_latar_halus(im, tol, bayangan=False, lembut=False):
    """Hapus latar abu Huda: isi-banjir dari tepi. bayangan=True ikut menghapus bayangan abu netral
    di bawah benda; lembut=True (latar landmark) memberi alfa bertahap supaya kabut tetap tipis."""
    im = im.convert('RGB'); w, h = im.size; px = im.load()
    atas = [px[x, 0] for x in range(0, w, max(1, w // 64))]
    ref = tuple(sorted(c[i] for c in atas)[len(atas) // 2] for i in range(3))
    lum_ref = sum(ref) / 3
    batas = tol * (2.6 if lembut else 1)

    def jarak(c):
        return abs(c[0] - ref[0]) + abs(c[1] - ref[1]) + abs(c[2] - ref[2])

    def latar(c):
        if jarak(c) < batas:
            return True
        if bayangan and max(c) - min(c) < 14 and lum_ref - 95 < sum(c) / 3 <= lum_ref + 8:
            return True
        return False
    lihat = bytearray(w * h); q = deque()
    for x in range(w): q.append((x, 0)); q.append((x, h - 1))
    for y in range(h): q.append((0, y)); q.append((w - 1, y))
    mask = Image.new('L', (w, h), 255); mp = mask.load()
    while q:
        x, y = q.popleft(); i = y * w + x
        if lihat[i]: continue
        lihat[i] = 1
        c = px[x, y]
        if not latar(c): continue
        if lembut:
            d = jarak(c); mp[x, y] = int(max(0, min(1, (d - tol * 0.3) / (batas - tol * 0.3))) ** 1.3 * 255)
        else:
            mp[x, y] = 0
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    if bayangan:
        # kantong latar yang terkurung (lubang pegangan, sela cadik): kunci warna ketat di seluruh gambar
        for y in range(h):
            for x in range(w):
                c = px[x, y]
                if jarak(c) < 16 and max(c) - min(c) < 8: mp[x, y] = 0
    if not lembut:
        mask = mask.filter(ImageFilter.MinFilter(3))
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))
    im = im.convert('RGBA'); im.putalpha(mask)
    bbox = mask.point(lambda v: 255 if v > 24 else 0).getbbox()
    return im.crop(bbox) if bbox else im

# lembar kolase Huda (2048 px, koordinat ditulis dalam skala tampilan 1932 lalu dikali K)
K = 2048 / 1932
LEMBAR = {
    'lembar_road': {
        'tex_aspal': (34, 36, 374, 377), 'tex_trotoar': (416, 36, 755, 377), 'tex_paving': (798, 36, 1135, 377),
        'tex_pasir': (1178, 36, 1516, 377), 'tex_boardwalk': (1558, 36, 1898, 377),
        'angkot': (0, 560, 386, 1120), 'gerobak': (386, 560, 772, 1120), 'gedung': (772, 560, 1150, 1120),
        'halte': (1150, 560, 1545, 1120), 'sepeda': (1545, 560, 1932, 1120),
        'joglo': (0, 1480, 390, 1840), 'beringin': (390, 1480, 775, 1840), 'payung': (1545, 1460, 1932, 1840),
    },
    'lembar_gapura': {
        'gapura_finish': (60, 70, 644, 590), 'gapura_ws': (700, 110, 1288, 590), 'papan_km': (1400, 110, 1840, 590),
        'gapura_candi': (0, 680, 644, 1235), 'gapura_joglo': (700, 680, 1288, 1235), 'gapura_lawu': (1340, 740, 1900, 1235),
        'gapura_bromo': (40, 1355, 700, 1840), 'gapura_rinjani': (720, 1355, 1288, 1845), 'pita': (1380, 1355, 1860, 1840),
    },
    'lembar_pakaian': {
        'jersey_basic': (0, 60, 322, 445), 'everyday_taupe': (322, 60, 644, 445), 'boxy_charcoal': (644, 60, 966, 445),
        'aero_sage': (966, 60, 1288, 445), 'singlet_onyx': (1288, 60, 1610, 445), 'uv_long_oat': (1610, 60, 1932, 445),
        'modest_hijab_set': (0, 525, 322, 915), 'trail_halfzip': (322, 525, 644, 915), 'windbreaker_mist': (644, 525, 966, 915),
        'shorts_basic': (966, 525, 1288, 915), 'split_onyx': (1288, 525, 1610, 915), 'skort_pleated_cream': (1610, 525, 1932, 915),
        'skort_pleated_onyx': (0, 1005, 322, 1400), 'skort_wrap_terracotta': (322, 1005, 644, 1400), 'skirt_legging_modest': (644, 1005, 966, 1400),
        'skort_trail_olive': (1288, 1005, 1610, 1400), 'halftights_espresso': (1610, 1005, 1932, 1400),
    },
    'lembar_aksesori': {
        'watch_basic': (80, 70, 400, 450), 'willo_sport': (540, 70, 900, 450), 'coro_pro': (60, 500, 440, 920),
        'titanium_ultra': (540, 500, 920, 920), 'sunglasses_matte': (1470, 620, 1920, 800), 'waist_bag': (20, 1120, 490, 1280),
        'hydration_vest': (55, 1480, 420, 1905), 'grail_trail_pack': (1060, 1045, 1820, 1910),
    },
    'lembar_trail': {
        'tex_tanah_merah': (23, 21, 316, 314), 'tex_tangga': (342, 21, 634, 314), 'tex_pasir_vulkanik': (661, 21, 953, 314),
        'tex_scree': (979, 21, 1271, 314), 'tex_batu_vulkanik': (1298, 21, 1590, 314), 'tex_sabana': (1616, 21, 1909, 314),
        'cemara': (20, 400, 320, 870), 'kebun_teh': (310, 400, 680, 870), 'rumput_sabana': (680, 400, 970, 870),
        'edelweis': (980, 400, 1270, 870), 'batu_kaldera': (1280, 400, 1610, 870), 'asap_belerang': (1620, 400, 1925, 870),
        'pos_cp': (420, 1130, 800, 1535), 'headlamp': (840, 1130, 1225, 1535),
    },
}
LEBAR_LEMBAR = {'grail_trail_pack': 300, 'gedung': 220, 'beringin': 300, 'pita': 160, 'papan_km': 200}
for lembar, isi in LEMBAR.items():
    src = Image.open(DIR_HUDA / 'lembar' / f'{lembar}.jpg').convert('RGB')
    for nama, kotak in isi.items():
        pot = src.crop(tuple(int(v * K) for v in kotak))
        if nama.startswith('tex_'):
            pot.resize((512, 512), Image.LANCZOS).save(KELUAR / f'{nama}.png', optimize=True)
        else:
            lb = LEBAR_LEMBAR.get(nama, 420 if nama.startswith('gapura') else 256)
            if lembar in ('lembar_pakaian', 'lembar_aksesori'):
                # foto katalog gear: latar abu asli dipertahankan (pakaian terang ikut terhapus bila dikunci warna), dibuat persegi
                w, h = pot.size; sisi = max(w, h); bg = pot.getpixel((2, 2))
                kan = Image.new('RGB', (sisi, sisi), bg); kan.paste(pot, ((sisi - w) // 2, (sisi - h) // 2))
                kan = kan.resize((220, 220), Image.LANCZOS)
                kan.save(KELUAR / f'{nama}.png', optimize=True)
                continue
            kecilkan(hapus_latar_halus(pot, 30, bayangan=True), lb).save(KELUAR / f'{nama}.png', optimize=True)
for f in sorted(DIR_HUDA.glob('*.jpg')):
    im = Image.open(f).convert('RGB')
    if f.stem.startswith('rambut_'):
        # thumbnail gaya rambut: potong persegi bagian kepala, latar tetap (kartu pilihan)
        w, h = im.size
        kecilkan(im.crop((int(w * .14), int(h * .02), int(w * .86), int(h * .74))), 160).save(KELUAR / f'{f.stem}.png', optimize=True)
        continue
    if f.stem == 'jam_gps':
        # jam 10:08 baru: potong bodi jam (rasio 300:464), layar tepat di tengah
        w, h = im.size
        lb = int(w * .36); tg = int(lb * 464 / 300)
        kotak = (w // 2 - lb // 2, h // 2 - tg // 2, w // 2 + lb // 2, h // 2 + tg // 2)
        jam = hapus_latar_halus(im.crop(kotak), 30, bayangan=True)
        kanvas = Image.new('RGBA', (lb, tg), (0, 0, 0, 0)); kanvas.paste(jam, ((lb - jam.width) // 2, (tg - jam.height) // 2))
        kecilkan(kanvas, 300).save(KELUAR / 'jam.png', optimize=True)
        continue
    if f.stem not in HUDA:
        continue
    nama, lebar, tol = HUDA[f.stem]
    hasil = hapus_latar_halus(im, tol, bayangan=f.stem in BAYANGAN, lembut=f.stem.startswith('bg_'))
    kecilkan(hasil, lebar).save(KELUAR / f'{nama}.png', optimize=True)

print(len(list(KELUAR.glob('*.png'))), 'aset siap di', KELUAR)

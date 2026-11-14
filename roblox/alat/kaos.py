"""Membuat gambar templat kaos klasik Roblox (585 x 559 px) untuk kaos WILLO.
Pakai: python3 roblox/alat/kaos.py  -> roblox/aset/kaos-willo/*.png
Susunan templat mengikuti templat baju klasik Roblox: badan (depan, belakang, samping, atas, bawah) dan dua lengan.
Kaos lengan pendek: hanya bagian atas lengan yang diwarnai, sisanya bening supaya kulit avatar terlihat."""
from PIL import Image, ImageDraw, ImageFont
import os

LUAR = os.path.join(os.path.dirname(__file__), "..", "aset", "kaos-willo")
FONT = "/root/.fonts/Montserrat-Black.ttf"
# (x, y, lebar, tinggi)
BADAN = {"depan": (231, 74, 128, 128), "belakang": (427, 74, 128, 128), "kanan": (165, 74, 64, 128), "kiri": (361, 74, 64, 128),
         "atas": (231, 8, 128, 64), "bawah": (231, 204, 128, 64)}
LENGAN_SISI = [(19, 355), (85, 355), (151, 355), (217, 355), (308, 355), (374, 355), (440, 355), (506, 355)]  # tiap sisi 64 x 128
LENGAN_ATAS = [(217, 289), (308, 289)]  # 64 x 64
LENGAN_PENDEK = 52  # tinggi lengan kaos (px dari bahu)

def huruf(ukuran):
    try: return ImageFont.truetype(FONT, ukuran)
    except OSError: return ImageFont.load_default()

def buat(nama, kain, tepi, tinta, besar="W", kecil="WILLO", punggung="WILLO APPAREL"):
    im = Image.new("RGBA", (585, 559), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for x, y, w, h in BADAN.values(): d.rectangle([x, y, x + w - 1, y + h - 1], fill=kain)
    for x, y in LENGAN_ATAS: d.rectangle([x, y, x + 63, y + 63], fill=kain)
    for x, y in LENGAN_SISI:
        d.rectangle([x, y, x + 63, y + LENGAN_PENDEK - 1], fill=kain)
        d.rectangle([x, y + LENGAN_PENDEK - 5, x + 63, y + LENGAN_PENDEK - 1], fill=tepi)  # jahitan ujung lengan
    # kerah dan jahitan bawah
    x, y, w, h = BADAN["depan"]
    d.pieslice([x + 40, y - 20, x + 88, y + 20], 0, 180, fill=tepi)
    d.pieslice([x + 46, y - 20, x + 82, y + 14], 0, 180, fill=(0, 0, 0, 0))
    bx, by, bw, bh = BADAN["belakang"]
    d.rectangle([bx + 44, by, bx + 84, by + 5], fill=tepi)
    for k in ("depan", "belakang", "kanan", "kiri"):
        kx, ky, kw, kh = BADAN[k]
        d.rectangle([kx, ky + kh - 6, kx + kw - 1, ky + kh - 1], fill=tepi)
    # sablon depan: huruf W besar + tulisan WILLO
    f = huruf(64 if len(besar) == 1 else 44); t = besar; l, a, r, b = d.textbbox((0, 0), t, font=f)
    d.text((x + (w - (r - l)) / 2 - l, y + 30 - a), t, font=f, fill=tinta)
    f = huruf(17 if len(kecil) < 8 else 12); t = kecil; l, a, r, b = d.textbbox((0, 0), t, font=f)
    d.text((x + (w - (r - l)) / 2 - l, y + 92 - a), t, font=f, fill=tinta)
    # sablon belakang: tulisan kecil di bawah kerah
    f = huruf(13); t = punggung; l, a, r, b = d.textbbox((0, 0), t, font=f)
    d.text((bx + (bw - (r - l)) / 2 - l, by + 22 - a), t, font=f, fill=tinta)
    os.makedirs(LUAR, exist_ok=True)
    im.save(os.path.join(LUAR, nama + ".png"))

buat("kaos-willo-kuning", (242, 193, 74, 255), (214, 160, 40, 255), (29, 29, 34, 255))
buat("kaos-willo-hitam", (29, 29, 34, 255), (60, 60, 68, 255), (255, 196, 37, 255))
buat("kaos-willo-putih", (246, 246, 246, 255), (205, 205, 210, 255), (47, 111, 216, 255))
buat("kaos-willo-biru", (47, 111, 216, 255), (34, 84, 170, 255), (255, 255, 255, 255))
buat("kaos-dunia-kotak-hijau", (58, 168, 96, 255), (40, 128, 70, 255), (255, 255, 255, 255), "DK", "DUNIA KOTAK", "WARGA KOTAK")
buat("kaos-dunia-kotak-gelap", (29, 29, 34, 255), (60, 60, 68, 255), (140, 196, 106, 255), "DK", "DUNIA KOTAK", "WARGA KOTAK")

"""Rakit map Roblox "Pulau Dunia Kotak" yang meniru tampilan web /duniakotak/pulau/.

Sumber data sama persis dengan versi web:
  public/duniakotak/pulau/data.json   -> heightmap tiap dusun (teras Curug & Kulon)
  public/duniakotak/pulau/<dusun>.jpg -> foto atas tiap dusun (warna tanah, jalan, sungai)
  public/duniakotak/pulau/lots.json   -> letak rumah warga + nama fasum
  public/duniakotak/pulau/rumah.json  -> fasum, menara Segara, rumah Segara
Konstanta pulau (PULAU, DANAU, OFF, jalan raya, sungai, gunung) disalin dari pulau/index.html.

Hasil: roblox/build/DuniaKotakPulau.rbxmx (model Folder "DuniaKotak" + Script game di dalamnya).
Cara pasang di Roblox Studio: hapus folder DuniaKotak lama, lalu Import Roblox Model file ini ke Workspace.
Butuh: numpy, pillow, scipy.
"""
import json
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

DIR = Path(__file__).parent
WEB = DIR.parent / "public" / "duniakotak" / "pulau"
OUT = DIR / "build" / "DuniaKotakPulau.rbxmx"
SKRIP = DIR / "src" / "GamePulau.lua"

S = 0.6                     # 1 satuan web = 0,6 stud
CX, CZ = 1250, 1300          # pusat pulau web -> titik (0,0) Roblox
WARGA_TERDAFTAR = 777        # rumah dengan nomor <= ini sudah berpenghuni (data 12 Nov 2026)
MAKS_KAVLING = 24

OFF = {"curug": (0, 0), "kulon": (1885, 450), "wetan": (411, 1387), "tlaga": (801, 3797), "segara": (2625, 2520)}
NAMA = {"curug": "Kotak Curug", "kulon": "Kotak Kulon", "wetan": "Kotak Wetan", "tlaga": "Kotak Tlaga", "segara": "Kotak Segara"}
NOMOR = {"wetan": "No. 1-260", "kulon": "No. 261-460", "curug": "No. 461-660", "tlaga": "No. 661-860", "segara": "Kota (No. 861+)"}
PULAU = [[-1150, -1700], [0, -1800], [1200, -1800], [2300, -1700], [2900, -1400], [3050, -300], [2950, 800], [3050, 1800], [3600, 2150],
         [3650, 3200], [3500, 3950], [2750, 4400], [1800, 4400], [900, 4500], [-300, 4350], [-1000, 3600], [-1100, 2200], [-1150, 800], [-1200, -500]]
DANAU = [[1400, 900], [2600, 880], [2700, 1500], [2800, 2100], [3400, 2150], [3400, 2230], [1400, 2230], [1350, 1700]]

rnd = random.Random(7)


def X(x): return round((x - CX) * S, 2)
def Z(z): return round((z - CZ) * S, 2)


# ---------------------------------------------------------------- XML
_ref = [0]
def ref():
    _ref[0] += 1
    return f"RBX{_ref[0]}"


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def warna(c):
    if isinstance(c, int):
        r, g, b = (c >> 16) & 255, (c >> 8) & 255, c & 255
    else:
        r, g, b = (int(max(0, min(255, v))) for v in c)
    return 0xFF000000 | (r << 16) | (g << 8) | b


MAT = {"plastik": 256, "halus": 272, "kayu": 512, "papan": 528, "kaca": 1568, "batu": 800, "beton": 816, "pasir": 1296, "neon": 288}


class Item:
    def __init__(self, cls, nama, props="", anak=None):
        self.cls, self.nama, self.props, self.anak = cls, nama, props, anak or []

    def xml(self, out, ind=1):
        p = "  " * ind
        out.append(f'{p}<Item class="{self.cls}" referent="{ref()}"><Properties><string name="Name">{esc(self.nama)}</string>{self.props}</Properties>')
        for a in self.anak:
            a.xml(out, ind + 1)
        out.append(f"{p}</Item>")


def part(nama, cx, cy, cz, sx, sy, sz, col, mat="halus", transp=0.0, tabrak=True, bayang=True, anak=None, bentuk=None):
    sx, sy, sz = max(0.2, round(sx, 2)), max(0.2, round(sy, 2)), max(0.2, round(sz, 2))
    cls = "Part"
    props = (f'<bool name="Anchored">true</bool>'
             f'<CoordinateFrame name="CFrame"><X>{cx:.2f}</X><Y>{cy:.2f}</Y><Z>{cz:.2f}</Z>'
             f'<R00>1</R00><R01>0</R01><R02>0</R02><R10>0</R10><R11>1</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>'
             f'<Color3uint8 name="Color3uint8">{warna(col)}</Color3uint8>'
             f'<Vector3 name="size"><X>{sx}</X><Y>{sy}</Y><Z>{sz}</Z></Vector3>'
             f'<token name="Material">{MAT[mat]}</token>'
             f'<token name="TopSurface">0</token><token name="BottomSurface">0</token>')
    if bentuk is not None:
        props += f'<token name="shape">{bentuk}</token>'
    if transp:
        props += f'<float name="Transparency">{transp}</float>'
    if not tabrak:
        props += '<bool name="CanCollide">false</bool><bool name="CanTouch">false</bool><bool name="CanQuery">false</bool>'
    if not bayang:
        props += '<bool name="CastShadow">false</bool>'
    return Item(cls, nama, props, anak)


def kotak_bawah(nama, x0, x1, z0, z1, ybawah, yatas, col, **kw):
    """Part dari sudut-sudut (sudah dalam stud)."""
    return part(nama, (x0 + x1) / 2, (ybawah + yatas) / 2, (z0 + z1) / 2, x1 - x0, yatas - ybawah, z1 - z0, col, **kw)


def papan_nama(teks, y_off, maks, lebar=220, tinggi=50, warna_teks=(1, 1, 1)):
    tl = Item("TextLabel", "Teks",
              '<UDim2 name="Size"><XS>1</XS><XO>0</XO><YS>1</YS><YO>0</YO></UDim2>'
              '<float name="BackgroundTransparency">1</float><bool name="TextScaled">true</bool>'
              f'<string name="Text">{esc(teks)}</string>'
              f'<Color3 name="TextColor3"><R>{warna_teks[0]}</R><G>{warna_teks[1]}</G><B>{warna_teks[2]}</B></Color3>'
              '<float name="TextStrokeTransparency">0.2</float><token name="Font">4</token>')
    return Item("BillboardGui", "Label",
                f'<UDim2 name="Size"><XS>0</XS><XO>{lebar}</XO><YS>0</YS><YO>{tinggi}</YO></UDim2>'
                f'<Vector3 name="StudsOffset"><X>0</X><Y>{y_off}</Y><Z>0</Z></Vector3>'
                f'<float name="MaxDistance">{maks}</float><float name="LightInfluence">0</float>', [tl])


def penanda(nama, x, y, z, teks, y_off, maks, **kw):
    return part(nama, x, y, z, 1, 1, 1, 0xffffff, transp=1, tabrak=False, bayang=False, anak=[papan_nama(teks, y_off, maks, **kw)])


def dalam(x, z, p):
    c = False
    j = len(p) - 1
    for i in range(len(p)):
        xi, zi = p[i]
        xj, zj = p[j]
        if (zi > z) != (zj > z) and x < (xj - xi) * (z - zi) / (zj - zi) + xi:
            c = not c
        j = i
    return c


def potong_baris(poly, z):
    """Titik potong garis z dengan poligon, berpasangan (genap-ganjil)."""
    xs = []
    n = len(poly)
    for i in range(n):
        (x1, z1), (x2, z2) = poly[i], poly[(i + 1) % n]
        if (z1 > z) != (z2 > z):
            xs.append(x1 + (z - z1) * (x2 - x1) / (z2 - z1))
    xs.sort()
    return list(zip(xs[0::2], xs[1::2]))


def isi_poligon(nama, poly, langkah, ybawah, yatas, col, maks_lebar=2000, **kw):
    """Poligon (satuan web) -> potongan Part horizontal (stud)."""
    hasil = []
    zs = [p[1] for p in poly]
    z = min(zs)
    while z < max(zs):
        zt = min(z + langkah, max(zs))
        for a, b in potong_baris(poly, (z + zt) / 2):
            x0, x1 = X(a), X(b)
            while x1 - x0 > 0.5:
                xe = min(x1, x0 + maks_lebar)
                hasil.append(kotak_bawah(nama, x0, xe, Z(z), Z(zt), ybawah, yatas, col, **kw))
                x0 = xe
        z = zt
    return hasil


# ---------------------------------------------------------------- data web
data = json.loads((WEB / "data.json").read_text())
lots = json.loads((WEB / "lots.json").read_text())
rumah = json.loads((WEB / "rumah.json").read_text())


def tinggi_web(nama, x, z):
    """Tinggi tanah dusun (satuan web) di titik global x,z, atau None di luar dusun."""
    d = data[nama]
    b = d["b"]
    ox, oz = OFF[nama]
    lx, lz = x - ox, z - oz
    if not (b["x0"] <= lx <= b["x1"] and b["z0"] <= lz <= b["z1"]):
        return None
    i = max(0, min(d["nx"] - 1, round((lx - b["x0"]) / d["st"])))
    j = max(0, min(d["nz"] - 1, round((lz - b["z0"]) / d["st"])))
    return d["h"][j * d["nx"] + i]


def tinggi(x, z):
    """Tinggi permukaan (stud) di titik global web."""
    for n in data:
        h = tinggi_web(n, x, z)
        if h is not None:
            return h * S + 0.2
    return 0.0


def palet_tanah():
    sel = {}
    for k, v in data.items():
        im = Image.open(WEB / f"{k}.jpg").convert("RGB").filter(ImageFilter.ModeFilter(7))
        sel[k] = np.asarray(im.resize((v["nx"], v["nz"]), Image.BOX)).astype(float)
    semua = np.concatenate([c.reshape(-1, 3) for c in sel.values()])
    g = np.random.default_rng(1)
    K = 14
    sampel = semua[g.choice(len(semua), 40000, replace=False)]
    pusat = sampel[g.choice(len(sampel), K, replace=False)].copy()
    for _ in range(40):
        lab = ((sampel[:, None] - pusat[None]) ** 2).sum(2).argmin(1)
        for c in range(K):
            if (lab == c).any():
                pusat[c] = sampel[lab == c].mean(0)
    label = {}
    for k, c in sel.items():
        lab = ((c[:, :, None] - pusat[None, None]) ** 2).sum(3).argmin(2)
        label[k] = ndimage.median_filter(lab, size=3)
    return pusat, label


def gabung_persegi(kunci):
    nz, nx = kunci.shape
    pakai = np.zeros_like(kunci, bool)
    for j in range(nz):
        for i in range(nx):
            if pakai[j, i]:
                continue
            k = kunci[j, i]
            w = 1
            while i + w < nx and not pakai[j, i + w] and kunci[j, i + w] == k:
                w += 1
            h = 1
            while j + h < nz and np.all((kunci[j + h, i:i + w] == k) & ~pakai[j + h, i:i + w]):
                h += 1
            pakai[j:j + h, i:i + w] = True
            yield i, j, w, h, k


def tanah_dusun():
    pusat, label = palet_tanah()
    terang = np.clip(pusat * 1.32 + 6, 0, 255)
    # warna biru (air) = palet paling biru
    biru = int(np.argmax(pusat[:, 2] - pusat[:, 0]))
    folder = []
    for k, v in data.items():
        nx, nz, st = v["nx"], v["nz"], v["st"]
        b = v["b"]
        ox, oz = OFF[k]
        h = np.array(v["h"]).reshape(nz, nx)
        lab = label[k]
        bag = []
        for i, j, w, hh, kk in gabung_persegi(h * 100 + lab):
            hw = int(kk // 100)
            c = int(kk % 100)
            x0 = X(b["x0"] + ox + i * st - st / 2)
            x1 = X(b["x0"] + ox + (i + w) * st - st / 2)
            z0 = Z(b["z0"] + oz + j * st - st / 2)
            z1 = Z(b["z0"] + oz + (j + hh) * st - st / 2)
            atas = hw * S + 0.2
            air = c == biru
            if air:
                atas += 0.0
            bag.append(kotak_bawah("Tanah", x0, x1, z0, z1, -3, atas, terang[c], mat="halus", bayang=hw > 0))
        folder.append(Item("Folder", f"Tanah {NAMA[k]}", "", bag))
    return folder


# ---------------------------------------------------------------- isi pulau
def buat():
    akar = []
    # pulau: rumput + tebing batu meruncing
    pulau = isi_poligon("Rumput", PULAU, 34, -6, 0, 0x8cc773, bayang=False)
    batu_w = [0xb8977c, 0xbcb6ac, 0xb0aaa1, 0xc0bab0, 0xa8a299, 0xb6b0a6, 0xa49e95]
    y = -6
    for k in range(6):
        s = 1 - ((k + 1) / 7) ** 1.35 * 0.9
        dlm = (90 if k == 0 else 150 + k * 14) * S
        poly = [[CX + (x - CX) * s, CZ + (z - CZ) * s] for x, z in PULAU]
        pulau += isi_poligon("Tebing", poly, 90, y - dlm, y, batu_w[k], mat="batu", bayang=False)
        y -= dlm
    akar.append(Item("Folder", "Pulau", "", pulau))

    # tanah dusun dari heightmap + foto atas
    akar.append(Item("Folder", "Dusun", "", tanah_dusun()))

    # danau
    dan = isi_poligon("Pasir Danau", [[x + (x - 2300) * .04, z + (z - 1550) * .05] for x, z in DANAU], 40, -1, 0.3, 0xf1e4bf, mat="pasir", bayang=False)
    dan += isi_poligon("Air Danau", DANAU, 40, -0.4, 0.9, 0x6fb6e4, mat="kaca", transp=0.25, tabrak=False, bayang=False)
    akar.append(Item("Folder", "Danau", "", dan))

    # sungai, jalan raya, jembatan
    jalur = []

    def garis(pts, lebar, col, nama, atas, **kw):
        for (ax, az), (bx, bz) in zip(pts, pts[1:]):
            x0, x1 = sorted((ax, bx))
            z0, z1 = sorted((az, bz))
            if ax == bx:
                x0, x1 = ax - lebar / 2, ax + lebar / 2
                z0, z1 = z0 - lebar / 4, z1 + lebar / 4
            else:
                z0, z1 = az - lebar / 2, az + lebar / 2
                x0, x1 = x0 - lebar / 4, x1 + lebar / 4
            jalur.append(kotak_bawah(nama, X(x0), X(x1), Z(z0), Z(z1), atas - 1, atas, col, bayang=False, **kw))

    for pts in ([[801, -1000], [801, 420]], [[801, 2360], [801, 2560]], [[1500, 3107], [1800, 3107], [1800, 2200]],
                [[1800, 3107], [1800, 4405]], [[1235, 650], [2985, 650]], [[3380, 2190], [3608, 2190]]):
        garis(pts, 70 if pts[0][1] != 650 else 55, 0x78bde6, "Sungai", 0.35, tabrak=False, mat="kaca", transp=0.15)
    JL = 0xeadfc3
    for pts in ([[1050, 188], [1150, 188], [1150, 2452]],
                [[411, 2370], [411, 2452], [1650, 2452], [1650, 4200], [801, 4200], [801, 4010]],
                [[1150, 800], [1885, 800], [1885, 540]],
                [[2625, 3725], [2625, 3800], [1650, 3800]]):
        garis(pts, 34, JL, "Jl. Raya Dunia Kotak", 0.5)
    for x, z, v in ((1150, 650, 1), (1885, 650, 1), (1650, 3107, 0), (801, 2452, 0)):
        w, d = (60, 110) if v else (110, 60)
        jalur.append(part("Jembatan", X(x), 0.6, Z(z), w * S, 0.6, d * S, 0xb98f66, mat="papan"))
    # bundaran + tugu di simpang tengah
    jalur.append(part("Bundaran", X(1150), 0.45, Z(2452), 110 * S, 0.9, 110 * S, 0xf6c37a, mat="halus"))
    jalur.append(part("Tugu", X(1150), 9, Z(2452), 10, 18, 10, 0xe39682))
    jalur.append(part("Puncak Tugu", X(1150), 19, Z(2452), 14, 2, 14, 0xffd23a, mat="neon"))
    akar.append(Item("Folder", "Jalan", "", jalur))

    # gunung voxel di utara
    gun = []
    peaks = [[-950, -1050, 260], [-900, -1300, 420], [-600, -1400, 560], [-250, -1250, 480], [100, -1420, 620], [450, -1300, 500],
             [800, -1400, 580], [1150, -1350, 460], [1500, -1450, 380], [1900, -1480, 320], [2300, -1480, 280]]
    for cx, cz, h in peaks:
        n = 6
        for i in range(n):
            t = i / n
            w = (1 - t) * (h * 1.15) + 40
            yy = h * t
            col = 0xeceef2 if i >= n - 2 else 0x7bb067 if i == 0 else (0x9fa3ad, 0xa9adb6)[i % 2]
            gun.append(part("Gunung", X(cx + (rnd.random() - .5) * 20), (yy + h / n / 2) * S, Z(cz + (rnd.random() - .5) * 20),
                            w * S, h / n * S, w * .85 * S, col, mat="batu"))
    gun.append(part("Air Terjun Curug", X(801), 120, Z(-1010), 36, 240, 6, 0xdff2ff, mat="kaca", transp=0.2, tabrak=False))
    akar.append(Item("Folder", "Gunung", "", gun))

    # pohon kotak (seperti hutan di pulau web)
    kotak_dusun = []
    for n, v in data.items():
        b = v["b"]
        ox, oz = OFF[n]
        kotak_dusun.append((b["x0"] + ox, b["x1"] + ox, b["z0"] + oz, b["z1"] + oz))
    pulau97 = [[CX + (a - CX) * .97, CZ + (b - CZ) * .97] for a, b in PULAU]

    def bebas(x, z):
        if not dalam(x, z, pulau97) or dalam(x, z, DANAU):
            return False
        for a, b, c, d in kotak_dusun:
            if a - 30 < x < b + 30 and c - 30 < z < d + 30:
                return False
        if z < -1000 and x < 2600: return False
        if abs(x - 1150) < 45 and z < 2500: return False
        if abs(z - 2452) < 45 and x < 1700: return False
        if abs(x - 1650) < 45 and 2400 < z < 4230: return False
        if abs(z - 4200) < 45 and 760 < x < 1700: return False
        if abs(z - 800) < 45 and 1100 < x < 1930: return False
        if abs(z - 650) < 60 and x > 1200: return False
        if abs(x - 801) < 60 and (-1000 < z < 420 or 2350 < z < 2580): return False
        if abs(z - 3107) < 60 and 1480 < x < 1830: return False
        if abs(x - 1800) < 60 and z > 2190: return False
        if abs(z - 3800) < 45 and 1600 < x < 2670: return False
        if abs(z - 2190) < 60 and x > 3300: return False
        return True

    pts = []
    for _ in range(40000):
        if len(pts) >= 650:
            break
        x, z = -1250 + rnd.random() * 5000, -1850 + rnd.random() * 6400
        if bebas(x, z) and all((p[0] - x) ** 2 + (p[1] - z) ** 2 > 95 ** 2 for p in pts):
            pts.append((x, z, rnd.choice((40, 52, 66)), rnd.choice((0x6fae5e, 0x75b363, 0x6aa95a, 0x7ab868, 0x70b060))))
    phn = []
    for x, z, s, col in pts:
        phn.append(part("Daun", X(x), s * .95 * S, Z(z), s * 1.4 * S, s * .9 * S, s * 1.4 * S, col))
        phn.append(part("Batang", X(x), s * .3 * S, Z(z), s * .26 * S, s * .6 * S, s * .26 * S, 0x8e6a4c, mat="kayu"))
    akar.append(Item("Folder", "Pohon", "", phn))

    # awan di bawah & sekitar pulau
    awan = []
    for _ in range(46):
        a = rnd.random() * math.tau
        r = 2600 + rnd.random() * 2600
        w = 300 + rnd.random() * 500
        awan.append(part("Awan", X(CX + math.cos(a) * r), -80 - rnd.random() * 260, Z(CZ + math.sin(a) * r * 1.2),
                         w * S, (60 + rnd.random() * 120) * S, w * (.6 + rnd.random() * .5) * S, 0xf4f8fc, tabrak=False, bayang=False))
    akar.append(Item("Folder", "Awan", "", awan))

    # rumah warga (lots.json) + kavling kosong
    PASTEL = [0xe8892c, 0x4f8fd6, 0xd95c5c, 0x5fb36b, 0xf2c94c, 0x9b6fd1, 0x3a9e9e, 0xe07fb0]
    def pastel(c, k):
        r, g, b = (c >> 16) & 255, (c >> 8) & 255, c & 255
        return (r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k)
    rmh, kav = [], []

    def rumah_kotak(x, z, col, nama):
        y0 = tinggi(x, z)
        X0, Z0 = X(x), Z(z)
        s, t = 10, 8
        badan = tuple(0xf4 * .65 + v * .35 for v in pastel(col, .55)) if False else pastel(col, .62)
        rmh.append(part(nama, X0, y0 + t / 2, Z0, s, t, s, badan))
        atap = pastel(col, .15)
        for i, (w, hh) in enumerate(((s * 1.3, 2), (s * .9, 2), (s * .5, 2))):
            rmh.append(part("Atap", X0, y0 + t + hh / 2 + i * 2, Z0, w, hh, w, atap))

    kosong = []
    for n, L in lots.items():
        ox, oz = OFF[n]
        for no, (gx, gz, hx, hz) in sorted(L["lots"].items(), key=lambda a: int(a[0])):
            no = int(no)
            x, z = hx + ox, hz + oz
            if no <= WARGA_TERDAFTAR:
                rumah_kotak(x, z, PASTEL[no % len(PASTEL)], f"Rumah No. {no}")
            else:
                kosong.append((no, n, x, z, gx + ox, gz + oz))
    # Segara (kota terkunci di web): rumah dari rumah.json
    d = data["segara"]
    b = d["b"]
    ox, oz = OFF["segara"]
    for u, v, col, *_ in rumah["segara"]["rumah"]:
        x, z = b["x0"] + u * (b["x1"] - b["x0"]) + ox, b["z0"] + v * (b["z1"] - b["z0"]) + oz
        rumah_kotak(x, z, int(col), "Rumah Segara")
    for no, n, x, z, gx, gz in kosong[:MAKS_KAVLING]:
        y0 = tinggi(x, z)
        hd = (gx - x, gz - z)
        L_ = math.hypot(*hd) or 1
        anak = [Item("StringValue", "Dusun", f'<string name="Value">{n.capitalize()}</string>'),
                Item("Vector3Value", "Hadap", f'<Vector3 name="Value"><X>{hd[0] / L_:.3f}</X><Y>0</Y><Z>{hd[1] / L_:.3f}</Z></Vector3>'),
                Item("IntValue", "Nomor", f'<int64 name="Value">{no}</int64>'),
                papan_nama(f"Kavling kosong No. {no}", 4, 120, lebar=200, tinggi=44)]
        kav.append(part(f"Kavling {no}", X(x), y0 + 0.15, Z(z), 12, 0.3, 12, 0xfff3c4, mat="pasir", anak=anak))
    akar.append(Item("Folder", "Rumah", "", rmh))
    akar.append(Item("Folder", "Kavling", "", kav))

    # fasum & menara (rumah.json) + nama fasum (lots.json)
    fas = []
    for n, r in rumah.items():
        d = data[n]
        b = d["b"]
        ox, oz = OFF[n]
        for u, v, w, dd, col in r["fasum"]:
            x, z = b["x0"] + u * (b["x1"] - b["x0"]) + ox, b["z0"] + v * (b["z1"] - b["z0"]) + oz
            y0 = tinggi(x, z)
            if col == "menara":
                t = (90 + rnd.random() * 120) * S
                W = min(w, dd) * .85 * S
                fas.append(part("Menara", X(x), y0 + t / 2, Z(z), W, t, W, 0xcbd6e0, mat="beton"))
                yy = y0 + 10 * S
                while yy < y0 + t - 6:
                    fas.append(part("Jendela", X(x), yy, Z(z), W + 0.9, 1.6, W + 0.9, 0x9fb3c4, mat="kaca"))
                    yy += 22 * S
                fas.append(part("Atap Menara", X(x), y0 + t + 1.8, Z(z), W * .5, 3.6, W * .5, 0xf3ae66))
                continue
            col = int(col)
            t = (24 + rnd.random() * 14) * S
            fas.append(part("Fasum", X(x), y0 + t / 2, Z(z), w * S, t, dd * S, pastel(col, .25)))
            fas.append(part("Atap Fasum", X(x), y0 + t + 1.2, Z(z), w * S * 1.08, 2.4, dd * S * 1.08, pastel(col, .05)))
            fas.append(part("Puncak Fasum", X(x), y0 + t + 4.8, Z(z), w * S * .35, 4.8, dd * S * .35, 0xfdf6ea))
    for n, L in lots.items():
        ox, oz = OFF[n]
        for nama_f, x, z in L.get("fas", []):
            fas.append(penanda("Nama Fasum", X(x + ox), tinggi(x + ox, z + oz) + 2, Z(z + oz), nama_f, 30, 350, lebar=260, tinggi=48))
    akar.append(Item("Folder", "Fasum", "", fas))

    # nama dusun melayang
    lab = []
    for n, v in data.items():
        b = v["b"]
        ox, oz = OFF[n]
        x, z = (b["x0"] + b["x1"]) / 2 + ox, (b["z0"] + b["z1"]) / 2 + oz
        lab.append(penanda("Nama Dusun", X(x), 60, Z(z), f"{NAMA[n]} · {NOMOR[n]}", 40, 4000, lebar=420, tinggi=70))
    akar.append(Item("Folder", "Papan", "", lab))

    # koin di sepanjang Jl. Raya
    koin = []
    rute = [[1050, 188], [1150, 188], [1150, 2452], [1650, 2452], [1650, 4200], [801, 4200]]
    for (ax, az), (bx, bz) in zip(rute, rute[1:]):
        L_ = math.hypot(bx - ax, bz - az)
        k = 0.0
        while k < L_:
            x, z = ax + (bx - ax) * k / L_, az + (bz - az) * k / L_
            koin.append(Item("Part", "Koin",
                             f'<bool name="Anchored">true</bool><bool name="CanCollide">false</bool>'
                             f'<CoordinateFrame name="CFrame"><X>{X(x):.2f}</X><Y>{tinggi(x, z) + 3.5:.2f}</Y><Z>{Z(z):.2f}</Z>'
                             f'<R00>0</R00><R01>-1</R01><R02>0</R02><R10>1</R10><R11>0</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>'
                             f'<Color3uint8 name="Color3uint8">{warna(0xffcc33)}</Color3uint8>'
                             f'<Vector3 name="size"><X>0.4</X><Y>2.6</Y><Z>2.6</Z></Vector3>'
                             f'<token name="Material">{MAT["neon"]}</token><token name="shape">2</token>'))
            k += 70
    akar.append(Item("Folder", "Koin", "", koin))

    # titik muncul di bundaran tengah
    akar.append(Item("SpawnLocation", "Muncul",
                     f'<bool name="Anchored">true</bool><CoordinateFrame name="CFrame"><X>{X(1150) + 40:.2f}</X><Y>0.6</Y><Z>{Z(2452):.2f}</Z>'
                     '<R00>1</R00><R01>0</R01><R02>0</R02><R10>0</R10><R11>1</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>'
                     f'<Vector3 name="size"><X>8</X><Y>1</Y><Z>8</Z></Vector3><Color3uint8 name="Color3uint8">{warna(0xffd23a)}</Color3uint8>'
                     '<float name="Transparency">0.3</float><int name="Duration">0</int>'))
    akar.append(penanda("Selamat Datang", X(1150), 20, Z(2452), "Selamat datang di Desa Dunia Kotak!", 14, 400, lebar=380, tinggi=70))

    # skrip game
    src = SKRIP.read_text(encoding="utf-8")
    akar.append(Item("Script", "GameDuniaKotak", '<ProtectedString name="Source"><![CDATA[' + src.replace("]]>", "]]]]><![CDATA[>") + ']]></ProtectedString>'))
    return Item("Folder", "DuniaKotak", "", akar)


def hitung(it):
    return (1 if it.cls in ("Part", "SpawnLocation") else 0) + sum(hitung(a) for a in it.anak)


def main():
    root = buat()
    out = ['<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" version="4">']
    root.xml(out)
    out.append("</roblox>")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(out), encoding="utf-8")
    print(f"{OUT}: {hitung(root)} part, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()

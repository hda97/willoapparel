#!/usr/bin/env python3
"""Cek gambar kembar/mirip di antara gambar microstock kita.

Pakai:  python3 microstock/cek_kembar.py <folder-baru> [folder-pembanding ...]
Tanpa folder pembanding, gambar di <folder-baru> dibandingkan satu sama lain.

Metode (sama dengan pendekatan hashing di idealo/imagededup, tanpa pustaka berat):
pHash 64 bit (bentuk) + histogram warna. Hanya butuh Pillow dan numpy.
SVG dilewati kecuali ada pratinjau JPG/PNG bernama sama.
Keluar dengan kode 1 bila ada pasangan KEMBAR.
"""
import sys, os, math
import numpy as np
from PIL import Image

EKST = ('.jpg', '.jpeg', '.png')
KEMBAR, MIRIP = 8, 14          # jarak Hamming pHash (0 = identik)

def daftar(folder):
    out = []
    for akar, dirs, files in os.walk(folder):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            n = f.lower()
            if n.endswith(EKST) and not n.startswith(('pratinjau', 'chk', '_')):
                out.append(os.path.join(akar, f))
    return sorted(out)

def _dct(a):
    n = a.shape[0]
    k = np.arange(n)
    m = np.cos(np.pi * (2 * k[None, :] + 1) * k[:, None] / (2 * n))
    return m @ a @ m.T

def sidik(path):
    im = Image.open(path).convert('RGB')
    g = np.asarray(im.convert('L').resize((32, 32), Image.LANCZOS), dtype=float)
    d = _dct(g)[:8, :8]
    bit = (d > np.median(d.flatten()[1:])).flatten()
    h = np.asarray(im.resize((64, 64))).reshape(-1, 3) // 64          # 4 tingkat per kanal
    hist = np.bincount(h[:, 0] * 16 + h[:, 1] * 4 + h[:, 2], minlength=64).astype(float)
    return bit, hist / hist.sum()

def banding(a, b):
    ham = int(np.count_nonzero(a[0] != b[0]))
    warna = float(np.minimum(a[1], b[1]).sum())                      # 1 = warna sama
    return ham, warna

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    baru = daftar(sys.argv[1])
    lama = [p for f in sys.argv[2:] for p in daftar(f)]
    set_baru = {os.path.realpath(p) for p in baru}
    lama = [p for p in lama if os.path.realpath(p) not in set_baru]
    sd = {p: sidik(p) for p in baru + lama}
    hasil = []
    for i, p in enumerate(baru):
        for q in baru[i + 1:] + lama:
            if os.path.basename(p).rsplit('.', 1)[0] == os.path.basename(q).rsplit('.', 1)[0]:
                continue                                              # berkas sama, beda ekstensi/folder
            ham, warna = banding(sd[p], sd[q])
            if ham <= KEMBAR or (ham <= MIRIP and warna > .6):
                hasil.append((ham, warna, p, q))
    hasil.sort()
    print(f'{len(baru)} gambar baru dibandingkan dengan {len(lama)} gambar lama.')
    kembar = 0
    for ham, warna, p, q in hasil:
        label = 'KEMBAR' if ham <= KEMBAR else 'MIRIP '
        kembar += ham <= KEMBAR
        print(f'{label} jarak={ham:2d} warna={warna:.2f}  {os.path.basename(p)}  <->  {q}')
    if not hasil:
        print('Tidak ada pasangan kembar atau mirip.')
    sys.exit(1 if kembar else 0)

if __name__ == '__main__':
    main()

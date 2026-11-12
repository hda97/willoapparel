"""Ubah hasil ekspor adegan game web (ekspor_web.js -> <dusun>.f32 + .meta.json) menjadi berkas teks Part Roblox.
Pakai: python3 ubah.py <folder-ekspor> <dusun> <folder-keluar>
Tiap baris: x y z sx sy sz warna(hex) bendera [9 angka rotasi x1000]; posisi/ukuran dalam 1/100 stud.
Bendera: 1 = tanpa tabrakan, 2 = tembus pandang, 4 = tanpa bayangan, 8 = WedgePart."""
import sys, json, os, collections
import numpy as np

K = 1.25           # 1 satuan web = 1,25 stud (avatar web 4,12 -> 5,2 stud)
KECIL = 0.3        # kotak lebih kecil dari ini (satuan web) digabung jadi voksel
SEL = 0.25         # ukuran voksel gabungan (satuan web)
src, nama, out = sys.argv[1], sys.argv[2], sys.argv[3]
a = np.fromfile(f'{src}/{nama}.f32', dtype=np.float32).reshape(-1, 16).astype(np.float64)
meta = json.load(open(f'{src}/{nama}.meta.json'))
P = a[:, :3]; AX = a[:, 3:6]; AY = a[:, 6:9]; AZ = a[:, 9:12]
col = a[:, 12].astype(np.int64); tipe = a[:, 13].astype(int); bentuk = tipe >> 4
sz = np.stack([np.linalg.norm(AX, axis=1), np.linalg.norm(AY, axis=1), np.linalg.norm(AZ, axis=1)], 1)
bermap = (tipe & 4) > 0; tembus = (tipe & 8) > 0
# buang: bidang bertekstur tembus (label nama), kotak raksasa langit
buang = ((bentuk == 3) & bermap & tembus) | (sz.max(1) > 6000)
mx = sz.max(1)
baris = []

def tulis(p, s, c, f, R=None):
    s = np.maximum(s, 0.05)
    t = f"{round(p[0]*100)} {round(p[1]*100)} {round(p[2]*100)} {round(s[0]*100)} {round(s[1]*100)} {round(s[2]*100)} {c:06x} {f}"
    if R is not None:
        t += ' ' + ' '.join(str(round(v * 1000)) for v in R)
    baris.append((p[0], p[2], t))

def pecah(p, s, c, f):
    # Part Roblox maksimum 2048 stud per sisi
    n = [int(np.ceil(v / 2000)) for v in s]
    for i in range(n[0]):
        for j in range(n[1]):
            for k in range(n[2]):
                q = [p[d] - s[d] / 2 + s[d] / n[d] * (idx + .5) for d, idx in enumerate((i, j, k))]
                tulis(np.array(q), np.array([s[d] / n[d] for d in range(3)]), c, f)

lurusL = []
kecil = (mx < KECIL) & ~buang & (bentuk != 3)
besar = ~kecil & ~buang
st = collections.Counter()
for i in np.nonzero(besar)[0]:
    s = sz[i].copy(); p = P[i] * K; f = 0; c = int(col[i])
    if tembus[i]: f |= 3
    if bentuk[i] == 1:   # kerucut/limas -> 4 lapis mengecil
        w, h, d = s * K
        for l in range(4):
            r = 1 - l / 4 - .125
            tulis(np.array([p[0], p[1] - h / 2 + h * (l + .5) / 4, p[2]]), np.array([w * r * .72, h / 4, d * r * .72]), c, f | 4); st['limas'] += 1
        continue
    if bentuk[i] == 6 and s.max() >= 1:   # prisma segitiga (dinding pelana di bawah genteng) -> 2 WedgePart
        w, h, d = s * K; xh = AX[i] / s[0]; yh = AY[i] / s[1]
        for arah in (1, -1):
            zl = xh * arah; xl = np.cross(yh, zl)
            R = np.stack([xl, yh, zl], 1)
            tulis(p - xh * arah * w / 4, np.array([d, h, w / 2]), c, f | 8, R.flatten()); st['baji'] += 1
        continue
    if bentuk[i] == 3:   # bidang datar
        f |= 1 | 4
    ax = [AX[i], AY[i], AZ[i]]
    R = np.zeros((3, 3)); ok = True
    for d in range(3):
        if s[d] < 1e-6:
            R[:, d] = 0
        else:
            R[:, d] = ax[d] / s[d]
    # sumbu kosong (bidang): isi dengan hasil kali silang
    nol = [d for d in range(3) if s[d] < 1e-6]
    if len(nol) == 1:
        d = nol[0]; R[:, d] = np.cross(R[:, (d + 1) % 3], R[:, (d + 2) % 3])
    elif len(nol) > 1:
        st['buang-garis'] += 1; continue
    if np.linalg.det(R) < 0: R[:, 2] = -R[:, 2]
    s = s * K
    if s.max() < 1.2: f |= 4
    if s.max() < .9: f |= 1
    lurus = all(np.abs(R[:, d]).max() > .9995 for d in range(3))
    if lurus:
        s2 = np.zeros(3)
        for d in range(3): s2[np.abs(R[:, d]).argmax()] = s[d]
        if s2.max() > 2040: pecah(p, s2, c, f); st['pecah'] += 1
        else: lurusL.append((c, f, round(p[0], 2), round(p[2], 2), p[1] - s2[1] / 2, p[1] + s2[1] / 2, s2[0], s2[2]))
        st['lurus'] += 1
    else:
        tulis(p, s, c, f, R.flatten()); st['miring'] += 1   # CFrame.new(x,y,z, R00,R01,R02, R10,...): baris demi baris, kolom = sumbu kotak

# gabung kotak sewarna yang bertumpuk tegak (mis. bilah pagar + tutupnya)
lurusL.sort(key=lambda t: (t[0], t[1] & 2, t[2], t[3], t[4]))
kini = None
def lepas(k):
    c, f, x, z, y0, y1, sx, sz_ = k
    tulis(np.array([x, (y0 + y1) / 2, z]), np.array([sx, y1 - y0, sz_]), c, f)
for t in lurusL:
    if kini and t[0] == kini[0] and (t[1] & 2) == (kini[1] & 2) and t[2] == kini[2] and t[3] == kini[3] and t[4] <= kini[5] + .03 and abs(t[6] - kini[6]) < .13 and abs(t[7] - kini[7]) < .13:
        kini = (kini[0], kini[1] & t[1], kini[2], kini[3], kini[4], max(kini[5], t[5]), max(kini[6], t[6]), max(kini[7], t[7])); st['tumpuk'] += 1
    else:
        if kini: lepas(kini)
        kini = t
if kini: lepas(kini)

# voksel kecil: gabung per warna dalam sel SEL lalu rakit jadi balok
idx = np.nonzero(kecil)[0]
vx = np.floor(P[idx] / SEL).astype(np.int64)
c15 = ((col[idx] >> 20) & 15) << 8 | ((col[idx] >> 12) & 15) << 4 | ((col[idx] >> 4) & 15)
sel = {}
for (x, y, z), c, cf in zip(map(tuple, vx), c15, col[idx]):
    k = (x, y, z)
    if k not in sel: sel[k] = (int(c), int(cf))
# rakit sepanjang x
runs = collections.defaultdict(list)   # (y,z,c) -> [x0,x1]
for (x, y, z) in sorted(sel):
    c, cf = sel[(x, y, z)]
    L = runs[(y, z, c)]
    if L and L[-1][1] == x - 1: L[-1][1] = x
    else: L.append([x, x, cf])
# gabung sepanjang z
lemp = collections.defaultdict(list)   # (y,c,x0,x1) -> [z0,z1]
for (y, z, c), L in sorted(runs.items(), key=lambda t: (t[0][0], t[0][2], t[0][1])):
    for x0, x1, cf in L:
        M = lemp[(y, c, x0, x1)]
        if M and M[-1][1] == z - 1: M[-1][1] = z
        else: M.append([z, z, cf])
# gabung sepanjang y
blok = collections.defaultdict(list)
for (y, c, x0, x1), M in sorted(lemp.items(), key=lambda t: (t[0][1], t[0][2], t[0][3], t[0][0])):
    for z0, z1, cf in M:
        B = blok[(c, x0, x1, z0, z1)]
        if B and B[-1][1] == y - 1: B[-1][1] = y
        else: B.append([y, y, cf])
for (c, x0, x1, z0, z1), B in blok.items():
    for y0, y1, cf in B:
        p = np.array([(x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2, (z0 + z1 + 1) / 2]) * SEL * K
        s = np.array([x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1]) * SEL * K
        tulis(p, s, cf, 1 | 4); st['voksel'] += 1

# urutkan per petak 200 stud supaya tiap berkas = satu wilayah
baris.sort(key=lambda t: (int(t[0] // 250), int(t[1] // 250)))
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.startswith(nama + '-'): os.remove(f'{out}/{f}')
n = 0; buf = []; besar_buf = 0; daftar = []
def simpan():
    global n, buf, besar_buf
    if not buf: return
    open(f'{out}/{nama}-{n:03d}.txt', 'w').write('\n'.join(buf)); daftar.append(len(buf)); n += 1; buf = []; besar_buf = 0
for _, _, t in baris:
    buf.append(t); besar_buf += len(t) + 1
    if besar_buf > 900_000: simpan()
simpan()
info = {'dusun': nama, 'berkas': n, 'part': len(baris), 'skala': K,
        'muncul': [round(v * K, 2) for v in meta['pos']],
        'lots': {k: {'c': [round(x * K, 2) for x in v['c']], 'dir': v['dir']} for k, v in meta['lots'].items()}}
json.dump(info, open(f'{out}/{nama}.json', 'w'))
print(nama, 'part', len(baris), 'berkas', n, dict(st), 'kecil', int(kecil.sum()), 'buang', int(buang.sum()))

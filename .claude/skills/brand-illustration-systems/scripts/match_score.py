#!/usr/bin/env python3
"""Score a vector recreation against its reference, so "retry until it matches" has a number.

  python3 match_score.py recreation.svg reference.png [--palette "#FFF47C,#000000,..."] [--diff diff.png]

Renders the SVG at the reference's size (headless Chrome, via render_png.py), snaps both images to one palette
(given, or the reference's dominant colours), and reports:
  agreement     share of sampled pixels with the same palette colour (and the same, ignoring the field)
  per colour    IoU for each palette colour, worst first: tells you which layer is off
  worst cells   the cells of a 6x6 grid with the most mismatches: tells you where to look next
and writes a diff image: grey = match, red = in the reference but missing, blue = extra in the recreation.

Uses numpy + Pillow when installed (fast, and converts an embedded colour profile to sRGB first); otherwise falls
back to the standard library (slower; warns if the reference carries a colour profile it cannot convert).
"""
import argparse
import os
import struct
import sys
import tempfile
import zlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import raster_check  # noqa: E402
import render_png  # noqa: E402

GRID = 6


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit(f"not a PNG: {path}")
    return struct.unpack(">II", head[16:24])


def hexes(s):
    out = []
    for h in s.split(","):
        h = h.strip().lstrip("#")
        out.append(tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)))
    return out


def load_fast(path, step):
    try:
        import io
        import numpy as np
        from PIL import Image, ImageCms
    except ImportError:
        return None
    im = Image.open(path)
    icc = im.info.get("icc_profile")
    im = im.convert("RGB")
    if icc:
        src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        im = ImageCms.profileToProfile(im, src, ImageCms.createProfile("sRGB"), renderingIntent=0)
    a = np.asarray(im).astype(np.int32)[::step, ::step]
    return a


def load_slow(path, step):
    w, h, px = raster_check.read_png(path)
    return [[px(x, y) for x in range(0, w, step)] for y in range(0, h, step)]


def dominant(img, k):
    from collections import Counter
    q, sums = Counter(), {}
    rows = img.tolist() if hasattr(img, "tolist") else img
    for row in rows[::2]:
        for c in row[::2]:
            key = (c[0] >> 3, c[1] >> 3, c[2] >> 3)
            q[key] += 1
            t = sums.setdefault(key, [0, 0, 0])
            t[0] += c[0]; t[1] += c[1]; t[2] += c[2]
    picked = []
    for key, n in q.most_common():
        c = tuple(round(v / n) for v in sums[key])
        if all(max(abs(c[i] - p[i]) for i in range(3)) > 40 for p in picked):
            picked.append(c)
        if len(picked) == k:
            break
    return picked


def labels(img, pal):
    try:
        import numpy as np
        if isinstance(img, np.ndarray):
            P = np.array(pal)
            return ((img[:, :, None, :] - P[None, None]) ** 2).sum(-1).argmin(-1).tolist()
    except ImportError:
        pass
    return [[min(range(len(pal)), key=lambda i: sum((c[j] - pal[i][j]) ** 2 for j in range(3))) for c in row]
            for row in img]


def write_png(path, rows):
    h, w = len(rows), len(rows[0])
    raw = b"".join(b"\x00" + bytes(v for px in row for v in px) for row in rows)
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
                + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b""))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("svg")
    ap.add_argument("reference")
    ap.add_argument("--palette", help="comma-separated sRGB hexes; default: the reference's dominant colours")
    ap.add_argument("--colors", type=int, default=10, help="palette size when auto-detected")
    ap.add_argument("--step", type=int, default=2, help="sample every Nth pixel")
    ap.add_argument("--diff", help="diff image path (default <svg>-diff.png)")
    a = ap.parse_args()

    w, h = png_size(a.reference)
    tmp = tempfile.mkdtemp(prefix="match-")
    out = render_png.render(a.svg, tmp, w, None, "chrome" if render_png.find_chrome() else None)

    ref = load_fast(a.reference, a.step)
    fast = ref is not None
    if fast:
        rec = load_fast(out, a.step)
    else:
        prof = raster_check.color_profile(a.reference)
        if prof:
            print(f"WARN: reference carries a colour profile ({prof}) and Pillow is not installed; colours are compared "
                  f"raw. Convert it to sRGB first (see raster_check.py).", file=sys.stderr)
        ref, rec = load_slow(a.reference, a.step), load_slow(out, a.step)

    pal = hexes(a.palette) if a.palette else dominant(ref, a.colors)
    R, S = labels(ref, pal), labels(rec, pal)
    H, W = len(R), min(len(R[0]), len(S[0]))
    H = min(H, len(S))
    from collections import Counter
    field = Counter(v for row in R for v in row).most_common(1)[0][0]
    tot = same = fig = fig_same = 0
    inter, union = Counter(), Counter()
    cells = Counter()
    diff = []
    for y in range(H):
        drow = []
        for x in range(W):
            r, s = R[y][x], S[y][x]
            tot += 1; ok = r == s; same += ok
            if r != field or s != field:
                fig += 1; fig_same += ok
            inter[r] += ok
            union[r] += 1
            if not ok:
                union[s] += 1
                cells[(GRID * x // W, GRID * y // H)] += 1
            drow.append((200, 200, 200) if ok else (230, 30, 30) if r != field else (30, 90, 230))
        diff.append(drow)
    print(f"agreement {100 * same / tot:.2f}%   figure (non-field) {100 * fig_same / max(1, fig):.2f}%")
    for i in sorted(union, key=lambda i: inter[i] / union[i]):
        print(f"  #{'%02X%02X%02X' % pal[i]}  IoU {100 * inter[i] / union[i]:5.1f}%"
              f"{'   (field)' if i == field else ''}")
    cw, ch = w / GRID, h / GRID
    print("worst cells (x, y, w, h in reference px):")
    for (cx, cy), n in cells.most_common(5):
        print(f"  {int(cx * cw)} {int(cy * ch)} {int(cw)} {int(ch)}   {100 * n / (tot / GRID ** 2):.1f}% mismatched")
    dpath = a.diff or os.path.splitext(a.svg)[0] + "-diff.png"
    write_png(dpath, diff)
    print("wrote", dpath)


if __name__ == "__main__":
    main()

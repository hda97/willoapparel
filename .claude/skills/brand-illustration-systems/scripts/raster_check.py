#!/usr/bin/env python3
"""Check raster exploration (PNG) for flat-style drift: an uneven background and stray colours.

  python3 raster_check.py image.png [more.png] [--tolerance 6] [--colors 10] [--json]

Image models drift on what flat styles depend on: they add glows and vignettes to a uniform field and smear the
palette. This samples the image border to find the field colour (the
median colour), then finds every field-coloured pixel in the image and reports how solid it is and whether its
brightness shifts across the canvas, plus the dominant colours (quantised).
FAIL when the field shifts between regions (glow, vignette, gradient); WARN when it is noisy rather than one solid
colour, or when many small colour clusters compete. WARN when the PNG carries a colour profile: its raw pixel values
are not sRGB, so hexes sampled from it are wrong (a green read as #4FA968 is #03AC61 in sRGB). Convert first:
  sips --matchTo "/System/Library/ColorSync/Profiles/sRGB Profile.icc" in.png --out in-srgb.png    (macOS)
  or Pillow: ImageCms.profileToProfile(im, embedded_profile, ImageCms.createProfile("sRGB"))

Reads 8-bit, non-interlaced PNG (greyscale, RGB, RGBA, palette). Standard library only.
"""
import argparse
import json
import re
import struct
import sys
import zlib
from collections import Counter


def read_png(path):
    with open(path, "rb") as f:
        data = f.read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    pos, idat, plte = 8, b"", None
    while pos < len(data):
        n, kind = struct.unpack(">I4s", data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + n]
        if kind == b"IHDR":
            w, h, depth, ctype, _, _, interlace = struct.unpack(">IIBBBBB", body)
        elif kind == b"PLTE":
            plte = [tuple(body[i:i + 3]) for i in range(0, len(body), 3)]
        elif kind == b"IDAT":
            idat += body
        elif kind == b"IEND":
            break
        pos += 12 + n
    if depth != 8 or interlace:
        raise ValueError("only 8-bit non-interlaced PNG is supported")
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(idat)
    stride = w * ch
    rows, prev, i = [], bytearray(stride), 0
    for _ in range(h):
        ftype, line = raw[i], bytearray(raw[i + 1:i + 1 + stride])
        i += 1 + stride
        for x in range(stride):
            a = line[x - ch] if x >= ch else 0
            b = prev[x]
            c = prev[x - ch] if x >= ch else 0
            if ftype == 1:
                line[x] = (line[x] + a) & 255
            elif ftype == 2:
                line[x] = (line[x] + b) & 255
            elif ftype == 3:
                line[x] = (line[x] + (a + b) // 2) & 255
            elif ftype == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(line)
        prev = line

    def px(x, y):
        r = rows[y]
        if ctype == 3:
            return plte[r[x]]
        if ch <= 2:
            v = r[x * ch]
            return (v, v, v)
        return tuple(r[x * ch:x * ch + 3])

    return w, h, px


def color_profile(path):
    """Name of an embedded non-sRGB ICC profile (iCCP chunk), or None."""
    with open(path, "rb") as f:
        data = f.read()
    pos = 8
    while pos + 8 <= len(data):
        n, kind = struct.unpack(">I4s", data[pos:pos + 8])
        if kind == b"iCCP":
            body = data[pos + 8:pos + 8 + n]
            name, _, rest = body.partition(b"\x00")
            try:
                icc = zlib.decompress(rest[1:])
            except zlib.error:
                icc = b""
            if b"sRGB" in icc[:4096] or b"s\x00R\x00G\x00B" in icc[:4096]:
                return None
            text = re.search(rb"(?:\x00[ -~]){3,60}", icc[128:])
            return text.group(0).decode("utf-16-be").strip() if text else name.decode("latin-1") or "unnamed"
        if kind in (b"IDAT", b"IEND"):
            return None
        pos += 12 + n
    return None


def check(path, tolerance=6, max_colors=10):
    res = {"file": path, "fail": [], "warn": [], "info": []}
    try:
        prof = color_profile(path)
    except OSError:
        prof = None
    if prof:
        res["warn"].append(f"embedded colour profile '{prof}': raw pixel values are not sRGB, so sampled hexes will be "
                           f"off; convert to sRGB before taking colours from this file")
    try:
        w, h, px = read_png(path)
    except Exception as e:
        res["fail"].append(f"could not read: {e}")
        return res
    step = max(1, min(w, h) // 300)
    band = max(2, min(w, h) // 100)  # the outer 1% sets the field colour
    edge = [px(x, y) for y in list(range(0, band)) + list(range(h - band, h)) for x in range(0, w, step)]
    med = tuple(sorted(c[k] for c in edge)[len(edge) // 2] for k in range(3))
    hexmed = "#%02X%02X%02X" % med
    # every pixel close to the field colour, anywhere in the image, counts as field
    regions, exact, n = {}, 0, 0
    for y in range(0, h, step):
        for x in range(0, w, step):
            c = px(x, y)
            d = max(abs(c[k] - med[k]) for k in range(3))
            if d > 25:
                continue
            n += 1
            exact += d <= 1
            regions.setdefault((3 * x // w, 3 * y // h), []).append(c)
    means = [[sum(c[k] for c in v) / len(v) for k in range(3)] for v in regions.values() if len(v) > 20]
    glow = max(max(m[k] for m in means) - min(m[k] for m in means) for k in range(3)) if means else 0
    solid = exact / max(1, n)
    if glow > tolerance / 2:
        res["fail"].append(f"field {hexmed} shifts up to {glow:.1f} levels per channel between regions of the canvas: glow, vignette "
                           f"or gradient; flatten to one solid fill")
    if solid < 0.95:
        res["warn"].append(f"field {hexmed} is not one solid colour ({solid:.0%} matches): model noise or dither; "
                           f"rebuild as vector or flatten before treating it as the style")
    res["info"].append(f"field {hexmed}, {solid:.0%} solid, regional shift {glow:.1f}")

    q = Counter()
    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b = px(x, y)
            q[(r >> 4, g >> 4, b >> 4)] += 1
    total = sum(q.values())
    major = [(k, n) for k, n in q.most_common() if n / total >= 0.005]
    if len(major) > max_colors * 2:
        res["warn"].append(f"{len(major)} colour clusters above 0.5% coverage: the palette is smeared "
                           f"(anti-aliasing or model noise); a flat style usually needs under {max_colors}")
    top = ", ".join("#%02X%02X%02X %.0f%%" % (k[0] * 17, k[1] * 17, k[2] * 17, 100 * n / total) for k, n in major[:8])
    res["info"].append(f"dominant: {top}")
    return res


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("files", nargs="+")
    ap.add_argument("--tolerance", type=int, default=6, help="max per-channel distance counted as the same field colour")
    ap.add_argument("--colors", type=int, default=10, help="expected palette size")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    results = [check(f, a.tolerance, a.colors) for f in a.files]
    if a.json:
        print(json.dumps(results, indent=2))
    else:
        for r in results:
            status = "FAIL" if r["fail"] else "WARN" if r["warn"] else "PASS"
            print(f"[{status}] {r['file']}")
            for lvl in ("fail", "warn", "info"):
                for m in r[lvl]:
                    print(f"   {lvl:<5} {m}")
    sys.exit(1 if any(r["fail"] for r in results) else 0)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Audit SVG illustration assets for the failures that break a system.

  python3 system_audit.py --family flat assets/*.svg     # human-readable report
  python3 system_audit.py --family 3d assets/*.svg --json

Checks are judged against the rendering family (see references/style-families.md):
  flat, technical, device, pattern   rasters and filters FAIL; gradients WARN; one saturated anchor hue
  editorial                          rasters and filters FAIL; one gradient allowed (the depth plane), more WARN;
                                     up to four saturated hues held to roles; no <pattern> needed (stripes are shapes)
  character                          rasters FAIL; filters and gradients WARN; up to two saturated hues
  line                               rasters and filters WARN (texture is allowed); up to two saturated hues
  3d, collage                        rasters, filters and gradients allowed; up to two (3d) or three (collage) hues
Every family: live <text> WARN; pattern lines heavy or too contrasty (when patterns exist) WARN.
pattern family only: no <pattern> WARN.
Exit code 1 if any file has a FAIL. Standard library only.
"""
import argparse
import colorsys
import json
import re
import sys
import xml.etree.ElementTree as ET

HEX = re.compile(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")


def local(tag):
    return tag.rsplit("}", 1)[-1]


def norm_hex(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return "#" + h.upper()


def rgb(h):
    h = norm_hex(h)[1:]
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def luminance(h):
    def ch(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def paint(el, prop):
    v = el.get(prop)
    style = el.get("style", "")
    m = re.search(rf"{prop}\s*:\s*([^;]+)", style)
    if m:
        v = m.group(1)
    return v.strip() if v else None


def num(v, default=None):
    try:
        return float(re.match(r"[-\d.]+", str(v)).group(0))
    except (AttributeError, TypeError, ValueError):
        return default


def saturated_hues(colors):
    """Cluster strongly saturated mid-lightness colours by hue (30 degree buckets)."""
    hues = []
    for c in colors:
        h, l, s = colorsys.rgb_to_hls(*rgb(c))
        if s >= 0.55 and 0.28 <= l <= 0.72:
            deg = h * 360
            if not any(min(abs(deg - x), 360 - abs(deg - x)) < 30 for x in hues):
                hues.append(deg)
    return hues


PROFILES = {
    #            raster   filter   gradient anchors require_pattern
    "flat":      ("fail", "fail", "warn", 1, False),
    "technical": ("fail", "fail", "warn", 1, False),
    "device":    ("fail", "fail", "warn", 1, False),
    "pattern":   ("fail", "fail", "warn", 1, True),
    "editorial": ("fail", "fail", "many", 4, False),
    "character": ("fail", "warn", "warn", 2, False),
    "line":      ("warn", "warn", None, 2, False),
    "3d":        (None, None, None, 2, False),
    "collage":   (None, None, None, 3, False),
}


def audit(path, family="flat", max_anchor=None):
    raster_lvl, filter_lvl, grad_lvl, anchors, require_pattern = PROFILES[family]
    if max_anchor is not None:
        anchors = max_anchor
    res = {"file": path, "fail": [], "warn": [], "info": []}
    try:
        root = ET.parse(path).getroot()
    except (ET.ParseError, OSError) as e:
        res["fail"].append(f"cannot parse: {e}")
        return res
    els = list(root.iter())
    tags = [local(e.tag) for e in els]
    with open(path, encoding="utf-8", errors="replace") as source:
        raw = source.read()

    def flag(level, msg):
        if level:
            res[level].append(msg)

    if "image" in tags or "data:image/png" in raw or "data:image/jpeg" in raw:
        flag(raster_lvl, f"embedded raster image: a {family} asset should be vector")
    if "filter" in tags or any(e.get("filter") for e in els) or re.search(r"filter\s*:\s*(drop-shadow|blur|url)", raw):
        flag(filter_lvl, f"filter found (drop shadow / blur / lighting): {family} uses construction, not rendering effects")
    n_grad = tags.count("linearGradient") + tags.count("radialGradient")
    if grad_lvl == "many":
        if n_grad > 1:
            res["warn"].append(f"{n_grad} gradients: {family} keeps one, on the plane pushed back for depth")
    elif n_grad:
        flag(grad_lvl, f"gradient found: unusual for the {family} family; keep it only if the direction calls for it")
    if "text" in tags:
        res["warn"].append("live <text>: outline it, or confirm the font ships with the asset")

    colors = {norm_hex(m.group(0)) for m in HEX.finditer(raw)}
    hues = saturated_hues(colors)
    if len(hues) > anchors:
        res["warn"].append(f"{len(hues)} saturated hues (around {', '.join(f'{h:.0f}°' for h in hues)}): "
                           f"{family} allows {anchors}; keep colour roles disciplined")

    patterns = [e for e in els if local(e.tag) == "pattern"]
    if require_pattern and not patterns:
        res["warn"].append("no <pattern>: a pattern-led asset should build its surface from a pattern tile")
    for p in patterns:
        pid = p.get("id", "?")
        h = num(p.get("height"))
        face = None
        for c in p.iter():
            if local(c.tag) == "rect":
                f = paint(c, "fill")
                if f and HEX.fullmatch(f):
                    face = norm_hex(f)
                    break
        strokes = []
        for c in p.iter():
            st, sw = paint(c, "stroke"), num(paint(c, "stroke-width"), 1.0)
            if st and HEX.fullmatch(st) and local(c.tag) in ("path", "line", "polyline", "circle", "ellipse"):
                strokes.append((norm_hex(st), sw))
        if strokes and h:
            gap = h / len(strokes)
            sw = max(w for _, w in strokes)
            if sw / gap > 0.35:
                res["warn"].append(f"pattern '{pid}': stroke {sw:g} with about {gap:g} between lines "
                                   f"({sw / gap:.0%} of the gap); linework this heavy reads as bands")
        if strokes and face:
            cr = contrast(strokes[0][0], face)
            if cr > 2.2:
                res["warn"].append(f"pattern '{pid}': line {strokes[0][0]} on face {face} has contrast {cr:.1f}:1; "
                                   f"use one tone step darker than the face (about 1.2-2:1)")

    res["info"].append(f"family {family}, {len(patterns)} pattern(s)")
    res["info"].append(f"{len(els)} elements, {len(colors)} colours")
    return res


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("files", nargs="+")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--family", choices=sorted(PROFILES), default="flat", help="rendering family (default flat)")
    ap.add_argument("--max-anchor", type=int, help="override the family's allowed saturated hues")
    a = ap.parse_args()
    results = [audit(f, a.family, a.max_anchor) for f in a.files]
    if a.json:
        print(json.dumps(results, indent=2))
    else:
        for r in results:
            status = "FAIL" if r["fail"] else "WARN" if r["warn"] else "PASS"
            print(f"[{status}] {r['file']}")
            for k in ("fail", "warn", "info"):
                for msg in r[k]:
                    print(f"   {k:<4}  {msg}")
    sys.exit(1 if any(r["fail"] for r in results) else 0)


if __name__ == "__main__":
    main()

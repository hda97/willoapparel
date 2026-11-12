#!/usr/bin/env python3
"""Render SVG or HTML files to PNG so you can look at your work.

  python3 render_png.py sheet.html a.svg --out-dir renders [--width 1600] [--height 1200]
  python3 render_png.py --which                      # list available renderers
  python3 render_png.py a.svg --silhouette           # large-shape test: background removed, every shape black
  python3 render_png.py a.svg --grey                 # value test: greyscale

--silhouette and --grey need Chrome and SVG input. Output names get a -silhouette / -grey suffix.

Renderers, best first: headless Chrome/Chromium/Edge (SVG and HTML), rsvg-convert, cairosvg (Python package),
Inkscape (SVG only). SVG size comes from its viewBox unless --width is given; HTML uses --width x --height.
Avoid macOS qlmanage: it crops non-square images. Standard library only.
"""
import argparse
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

CHROME_PATHS = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]
CHROME_NAMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome", "msedge"]


def find_chrome():
    for p in CHROME_PATHS:
        if os.path.exists(p):
            return p
    for n in CHROME_NAMES:
        p = shutil.which(n)
        if p:
            return p
    return None


def has_cairosvg():
    try:
        import cairosvg  # noqa: F401
        return True
    except Exception:
        return False


def renderers():
    out = []
    if find_chrome():
        out.append("chrome")
    if shutil.which("rsvg-convert"):
        out.append("rsvg-convert")
    if has_cairosvg():
        out.append("cairosvg")
    if shutil.which("inkscape"):
        out.append("inkscape")
    return out


def svg_size(path):
    txt = open(path, encoding="utf-8", errors="replace").read(4000)
    m = re.search(r'viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)', txt)
    if m:
        return float(m.group(1)), float(m.group(2))
    w = re.search(r'\swidth="([\d.]+)', txt)
    h = re.search(r'\sheight="([\d.]+)', txt)
    return (float(w.group(1)), float(h.group(1))) if w and h else (1024.0, 1024.0)


def chrome_shot(src, out, w, h, chrome):
    with tempfile.TemporaryDirectory(prefix="render-") as profile:
        cmd = [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
               f"--user-data-dir={profile}", f"--window-size={w},{h}", f"--screenshot={out}",
               "--default-background-color=00000000", "--virtual-time-budget=1500",
               pathlib.Path(src).resolve().as_uri()]
        subprocess.run(cmd, check=True, capture_output=True, timeout=90)


def strip_field(txt, vw, vh):
    """Drop full-canvas background rects so a silhouette shows the shapes, not the field."""
    def full(m):
        tag = m.group(0)
        if re.search(r'\b(x|y)="(?!0(\.0+)?")', tag):
            return tag
        w = re.search(r'\swidth="([\d.]+%?)"', tag)
        h = re.search(r'\sheight="([\d.]+%?)"', tag)
        if not (w and h):
            return tag
        ok = lambda v, d: v.endswith("%") and float(v[:-1]) >= 100 or not v.endswith("%") and float(v) >= d
        return "" if ok(w.group(1), vw) and ok(h.group(1), vh) else tag
    return re.sub(r"<rect\b[^>]*/>", full, txt)


def render(src, out_dir, width, height, which, mode=None):
    os.makedirs(out_dir, exist_ok=True)
    suffix = f"-{mode}" if mode else ""
    out = os.path.join(out_dir, os.path.splitext(os.path.basename(src))[0] + suffix + ".png")
    is_svg = src.lower().endswith(".svg")
    avail = renderers()
    if which:
        avail = [r for r in avail if r == which]
    if not is_svg or mode:
        avail = [r for r in avail if r == "chrome"]
    if mode and not is_svg:
        sys.exit(f"--{mode} needs an SVG: {src}")
    if not avail:
        sys.exit(f"no renderer available for {src}; install Chrome/Chromium, rsvg-convert or cairosvg")
    r = avail[0]
    if is_svg:
        vw, vh = svg_size(src)
        w = int(width or vw)
        h = int(round(w * vh / vw))
    else:
        w, h = int(width or 1440), int(height or 1200)
    if r == "chrome":
        if is_svg:
            temps, img = [], src
            if mode == "silhouette":
                with open(src, encoding="utf-8", errors="replace") as f:
                    txt = strip_field(f.read(), vw, vh)
                with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False, encoding="utf-8") as t:
                    t.write(txt)
                img = t.name
                temps.append(img)
            css = {"silhouette": "filter:brightness(0)", "grey": "filter:grayscale(1)"}.get(mode, "")
            bg = "background:#fff;" if mode == "silhouette" else ""
            # wrap so the SVG scales to exactly w x h with no page margin
            with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as t:
                t.write(f'<!doctype html><html><body style="margin:0;{bg}"><img src="{pathlib.Path(img).resolve().as_uri()}" '
                        f'style="display:block;width:{w}px;height:{h}px;{css}"></body></html>')
                temps.append(t.name)
            try:
                chrome_shot(temps[-1], out, w, h, find_chrome())
            finally:
                for p in temps:
                    os.unlink(p)
        else:
            chrome_shot(src, out, w, h, find_chrome())
    elif r == "rsvg-convert":
        subprocess.run(["rsvg-convert", "-w", str(w), "-h", str(h), "-o", out, src], check=True)
    elif r == "cairosvg":
        import cairosvg
        cairosvg.svg2png(url=src, write_to=out, output_width=w, output_height=h)
    elif r == "inkscape":
        subprocess.run(["inkscape", src, "--export-type=png", f"--export-filename={out}", f"--export-width={w}"], check=True)
    print(f"{out}  {w}x{h}  ({r})")
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("files", nargs="*")
    ap.add_argument("--out-dir", default="renders")
    ap.add_argument("--width", type=int)
    ap.add_argument("--height", type=int, help="HTML only (default 1200)")
    ap.add_argument("--renderer", choices=["chrome", "rsvg-convert", "cairosvg", "inkscape"])
    ap.add_argument("--which", action="store_true", help="list available renderers and exit")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--silhouette", action="store_true", help="large-shape test: field removed, all shapes black")
    g.add_argument("--grey", action="store_true", help="greyscale value test")
    a = ap.parse_args()
    if a.which:
        print(", ".join(renderers()) or "none")
        return
    if not a.files:
        ap.error("give at least one file")
    for f in a.files:
        render(f, a.out_dir, a.width, a.height, a.renderer,
               "silhouette" if a.silhouette else "grey" if a.grey else None)


if __name__ == "__main__":
    main()

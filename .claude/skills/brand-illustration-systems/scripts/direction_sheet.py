#!/usr/bin/env python3
"""Build the three-direction overview sheet shown at the checkpoint.

  python3 direction_sheet.py directions.json -o directions.html

The JSON spec (see references/direction-options.md) lists 2-4 directions. Each has a name, family, source, idea,
looks, meaning chain, motion verb, risk, palette (hex list) and three images: signature (pattern tile, character,
line swatch, material swatch, device states...), spot (the shared product moment) and scene (the shared scene or hero
moment), plus an optional micro image for the 48 px check when the spot is shown in a frame. Images may be SVG, PNG or JPG; paths are relative to the JSON file. The older keys pattern / pictogram /
object are still accepted. Images are embedded as data URIs, so the HTML is self-contained.

Warns when every direction shares one family, unless the spec sets "same_family": true (the user fixed the family).
Standard library only.
"""
import argparse
import base64
import html
import json
import os
import sys

CSS = """
*{box-sizing:border-box}
body{margin:0;background:#F6F4EF;color:#1D1A22;font:15px/1.5 Inter,"Helvetica Neue",Arial,sans-serif}
.wrap{max-width:1560px;margin:0 auto;padding:40px 40px 48px}
header{margin-bottom:26px}
h1{margin:0;font-size:30px;letter-spacing:-.02em}
.tenet{color:#5E5866;max-width:80ch;margin:6px 0 0}
.meta{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#8A8392}
.moments{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.moments span{font-size:12px;background:#fff;border:1px solid #E4E0D8;border-radius:99px;padding:3px 10px;color:#5E5866}
.grid{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:20px}
.col{background:#fff;border:1px solid #E4E0D8;border-radius:18px;overflow:hidden;display:flex;flex-direction:column}
.col.rec{border:2px solid #1D1A22}
.head{padding:18px 20px 14px;border-bottom:1px solid #EEEAE3}
.letter{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#1D1A22;color:#fff;font-weight:700;font-size:13px;margin-right:10px}
.name{font-size:20px;font-weight:750;letter-spacing:-.01em}
.family{display:inline-block;margin-top:8px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:#F1EEE8;color:#3B3542;padding:3px 9px;border-radius:99px}
.source{color:#6E6776;font-size:13px;margin-top:6px}
.badge{float:right;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:#1D1A22;color:#fff;padding:4px 9px;border-radius:99px}
.sig{height:120px;border-bottom:1px solid #EEEAE3;background-position:center;background-repeat:no-repeat;background-size:contain;background-color:#FAF9F6}
.sig.tile{background-repeat:repeat;background-size:auto 100%}
figure{margin:0}
.cap{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8A8392;margin-bottom:8px}
.spot{padding:16px 20px;border-bottom:1px solid #EEEAE3;display:flex;gap:16px;align-items:center}
.spot .main{flex:1;display:flex;justify-content:center}
.spot img.big{display:block;width:auto;height:auto;max-width:100%;max-height:300px}
.micro{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;color:#8A8392;min-width:56px}
.scene{padding:16px 20px;border-bottom:1px solid #EEEAE3}
.scene img{display:block;width:100%;height:auto;border-radius:10px}
.palette{display:flex;height:24px}
.palette i{flex:1}
.text{padding:16px 20px 20px;display:grid;gap:10px}
.text p{margin:0}
.k{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8A8392;font-weight:700}
.grey img,.grey .sig{filter:grayscale(1)}
"""

MIME = {".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
ALIASES = {"signature": "pattern", "spot": "pictogram", "scene": "object"}


def data_uri(path):
    mime = MIME.get(os.path.splitext(path)[1].lower())
    if not mime:
        sys.exit(f"unsupported image type: {path}")
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode("ascii")


def need(d, key, i):
    v = d.get(key) or d.get(ALIASES.get(key, ""))
    if not v:
        sys.exit(f"direction {i + 1} is missing '{key}'")
    return v


def column(d, i, base, recommended, moments):
    esc = lambda s: html.escape(str(s))
    uris = {}
    for key in ("signature", "spot", "scene", "micro"):
        if key == "micro" and not d.get("micro"):
            continue
        p = os.path.join(base, need(d, key, i))
        if not os.path.isfile(p):
            sys.exit(f"direction {i + 1}: file not found for '{key}': {p}")
        uris[key] = data_uri(p)
    family = d.get("family", "")
    tile = " tile" if "pattern" in family.lower() or ("pattern" in d and "signature" not in d) else ""
    swatches = "".join(f'<i style="background:{esc(c)}" title="{esc(c)}"></i>' for c in d.get("palette", []))
    rows = [("Idea", d.get("idea")), ("Looks like", d.get("looks")), ("Meaning chain", d.get("chain")),
            ("Moves like", d.get("motion")), ("Risk", d.get("risk"))]
    text = "".join(f'<p><span class="k">{k}</span>{esc(v)}</p>' for k, v in rows if v)
    micro = "" if d.get("no_micro") else (
        f'<div class="micro"><img src="{uris.get("micro", uris["spot"])}" width="48" height="48" alt="">48 px</div>')
    return f"""
<section class="col{' rec' if recommended else ''}{' grey' if d.get('greyscale') else ''}">
  <div class="head">{'<span class="badge">Recommended</span>' if recommended else ''}
    <div><span class="letter">{"ABCD"[i]}</span><span class="name">{esc(need(d, 'name', i))}</span></div>
    {f'<span class="family">{esc(family)}</span>' if family else ''}
    <div class="source">{esc(d.get('source', ''))}</div>
  </div>
  <div class="sig{tile}" style="background-image:url('{uris['signature']}')" role="img" aria-label="Signature element"></div>
  <figure class="spot"><div class="main"><div><span class="cap">{esc(moments.get('spot', 'Spot moment'))}</span>
    <img class="big" src="{uris['spot']}" alt="Spot illustration"></div></div>{micro}</figure>
  <figure class="scene"><span class="cap">{esc(moments.get('scene', 'Scene moment'))}</span><img src="{uris['scene']}" alt="Scene illustration"></figure>
  <div class="palette">{swatches}</div>
  <div class="text">{text}</div>
</section>"""


def build(spec, base):
    dirs = spec.get("directions") or []
    if not 2 <= len(dirs) <= 4:
        sys.exit(f"expected 2-4 directions, got {len(dirs)} (three is the norm)")
    families = [d.get("family", "").strip().lower() for d in dirs]
    if not spec.get("same_family"):
        if all(families) and len(set(families)) == 1:
            print(f"WARN: all directions share the family '{families[0]}'. Vary the family, or set "
                  f"\"same_family\": true if the user fixed it.", file=sys.stderr)
        elif not all(families):
            print("WARN: some directions have no 'family'; name the rendering family for each.", file=sys.stderr)
    moments = spec.get("moments", {})
    rec = spec.get("recommend")
    cols = "".join(column(d, i, base, i == rec, moments) for i, d in enumerate(dirs))
    brand = html.escape(spec.get("brand", "Directions"))
    tenet = html.escape(spec.get("tenet", ""))
    chips = "".join(f"<span>{html.escape(k.title())}: {html.escape(v)}</span>" for k, v in moments.items())
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{brand}: illustration directions</title><style>{CSS}</style></head>
<body><div class="wrap">
<header><div class="meta">Illustration system · {len(dirs)} directions</div><h1>{brand}</h1><p class="tenet">{tenet}</p>
{f'<div class="moments">{chips}</div>' if chips else ''}</header>
<div class="grid" style="--n:{len(dirs)}">{cols}</div>
</div></body></html>
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("spec", help="directions JSON")
    ap.add_argument("-o", "--out", default="directions.html")
    a = ap.parse_args()
    with open(a.spec, encoding="utf-8") as f:
        spec = json.load(f)
    out = build(spec, os.path.dirname(os.path.abspath(a.spec)))
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"wrote {a.out} ({len(spec['directions'])} directions)")


if __name__ == "__main__":
    main()

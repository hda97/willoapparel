"""Painted storybook scenery for the previews and the browser demo.

The world is painted, the characters are inked: hills, trees, clouds and the meadow are crisp
fills with no outlines, modelled by light from the upper right and laid on a faint paper grain
(no blur: blur made the first version look out of focus). Only props a character
touches (the training dummy) get the same pen line as Ratislav (inkkit), so they sit in his layer.

Every function returns a Pillow RGBA image at `scale` pixels per unit.
"""
import functools
import math
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter
from shapely import affinity
from shapely.geometry import Polygon, box
from shapely.ops import unary_union

import inkkit as I
import svgkit as K

INK = I.LINE
SKY_TOP, SKY_MID, SKY_LOW = (150, 198, 224), (203, 228, 238), (247, 240, 222)
FAR_HILL, NEAR_HILL, MEADOW = "#A8C1D2", "#9FC3A6", "#AFD38F"
PINE, ROUND_TREE, TRUNK = "#5E8B72", "#78A878", "#8C6B54"
GRASS, GRASS_DARK, GRASS_TOP = "#A2CD82", "#7BAE66", "#BEDF9E"
SOIL, SOIL_DARK, PEBBLE = "#E3C496", "#D2AC78", "#C59B68"
PERIOD = 96                  # the ground repeats every 96 px = two walk cycles of scrolling
TILE_H, TILE_LINE = 80, 20   # ground tile: 80 px tall, the walking line 20 px below its top
WOOD, WOOD_SHADE, STRAW, STRAW_SHADE = "#B8844F", "#986A3E", "#F0D9A0", "#D9BD7C"


def _svg(w, h, body):
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">%s</svg>'
            % (w, h, w, h, body))


def _fill(d, colour, opacity=1.0):
    return '<path d="%s" fill="%s"%s/>' % (d, colour, "" if opacity >= 1 else ' fill-opacity="%.2f"' % opacity)


def _layer(w, h, body, scale, blur=0.0):
    im = K.rasterize(_svg(w, h, body), scale)
    return im.filter(ImageFilter.GaussianBlur(blur * scale)) if blur else im


def _blob(cx, cy, r, n=14):
    return K.smooth_closed(K.circle_pts(cx, cy, r, n))


def _mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(round(x + (y - x) * t)) for x, y in zip(a, b))


def _grain(W, H, seed, wrap=False):
    """Soft paper grain, mid-grey 128 = no change. wrap=True makes it repeat horizontally."""
    rnd = random.Random(seed)
    sw, sh = max(2, W // 2), max(2, H // 2)
    small = Image.new("L", (sw, sh))
    small.putdata([max(0, min(255, int(128 + rnd.gauss(0, 26)))) for _ in range(sw * sh)])
    if not wrap:
        return small.resize((W, H), Image.BICUBIC)
    triple = Image.new("L", (3 * sw, sh))
    for k in range(3):
        triple.paste(small, (k * sw, 0))
    return triple.resize((3 * W, H), Image.BICUBIC).crop((W, 0, 2 * W, H))


def _papered(im, seed, wrap=False, amount=0.1):
    rgb, alpha = im.convert("RGB"), im.getchannel("A")
    g = _grain(im.size[0], im.size[1], seed, wrap)
    out = Image.blend(rgb, ImageChops.overlay(rgb, Image.merge("RGB", (g, g, g))), amount).convert("RGBA")
    out.putalpha(alpha)
    return out


def _ridge(x0, x1, base, waves, bottom):
    pts = [(x, base - sum(a * (0.5 + 0.5 * math.sin(x / lam + ph)) for a, lam, ph in waves))
           for x in range(int(x0), int(x1) + 1, 4)]
    return "M%sL%sL%sZ" % ("L".join(K.P(p) for p in pts), K.P((x1, bottom)), K.P((x0, bottom)))


# ------------------------------------------------------------------- sky
# Light comes from the upper right, as on Ratislav: edges facing it get a lighter band, edges turned
# away a darker one. Every shape stays crisp; depth comes from colour and a little valley mist.
FAR_LIGHT, FAR_SHADE, FAR_TREE = "#BCD0DD", "#97B2C6", "#93AEC2"
NEAR_LIGHT, NEAR_SHADE = "#B5D4B5", "#89B494"
MEADOW_LIGHT, MEADOW_SHADE, TUFT = "#C6E3A6", "#9DC781", "#8DBC72"
PINE_SHADE, ROUND_SHADE, ROUND_LIGHT, TRUNK_SHADE = "#4B745F", "#5E9366", "#94C28B", "#6F5442"
CLOUD, CLOUD_SHADE, CLOUD_LIGHT = "#EEF4F8", "#D2E0EA", "#FFFFFF"
PUFFS = ((-22, 5, 13), (-6, -5, 18), (14, -1, 15), (30, 6, 11), (4, 8, 14))


def _shape(geom, colour, opacity=1.0):
    d = I.path_of(geom)
    if not d:
        return ""
    return '<path d="%s" fill="%s" fill-rule="evenodd"%s/>' % (
        d, colour, "" if opacity >= 1 else ' fill-opacity="%.2f"' % opacity)


def _modelled(geom, base, light, shade, light_off, shade_off):
    """Base colour, a darker band where the form turns away from the light and a lighter one where
    it faces it: the shape minus itself shifted, the way `shade_of` shades Ratislav."""
    return (_shape(geom, base) + _shape(geom.difference(affinity.translate(geom, *shade_off)), shade)
            + _shape(geom.difference(affinity.translate(geom, *light_off)), light))


def _wave_fn(base, waves):
    return lambda x: base - sum(a * (0.5 + 0.5 * math.sin(x / lam + ph)) for a, lam, ph in waves)


def _ridge_poly(f, x0, x1, bottom, step=3.0):
    n = int(math.ceil((x1 - x0) / step))
    xs = [x0 + (x1 - x0) * i / n for i in range(n + 1)]
    return Polygon([(x, f(x)) for x in xs] + [(x1, bottom), (x0, bottom)])


def _tri(*pts):
    return "M%sZ" % "L".join(K.P(p) for p in pts)


@functools.lru_cache(maxsize=16)
def sky(w, h, ground, scale, wrap=False):
    """Opaque backdrop: gradient sky, flat-bottomed clouds, two hill ridges with valley mist between
    them, a tree line and the meadow. wrap=True makes the right edge continue into the left one."""
    W, H = int(round(w * scale)), int(round(h * scale))
    col = Image.new("RGB", (1, H))
    for j in range(H):
        y = j / scale
        if y < ground - 150:
            c = _mix(SKY_TOP, SKY_MID, y / max(1.0, ground - 150))
        else:
            c = _mix(SKY_MID, SKY_LOW, (y - (ground - 150)) / 110.0)
        col.putpixel((0, j), c)
    base = col.resize((W, H)).convert("RGBA")
    rnd = random.Random(w * 31 + h * 7 + ground)

    def copies(x, reach):
        return [x + k * w for k in ((-1, 0, 1) if wrap else (0,)) if -reach < x + k * w < w + reach]

    def waves(seed, amps):
        r, out = random.Random(seed), []
        for i, a in enumerate(amps):
            lam, ph = r.uniform(55, 120) * (1 + 0.8 * i), r.uniform(0, 6.3)
            if wrap:                     # a whole number of waves across the width
                lam = w / (2 * math.pi * max(1, round(w / (2 * math.pi * lam))))
            out.append((a, lam, ph))
        return out

    # big flat-bottomed clouds
    body = []
    n_clouds = max(2, int(w / 260))
    for i in range(n_clouds):
        cx = (i + 0.3 + 0.4 * rnd.random()) * w / n_clouds
        cy = rnd.uniform(0.12, 0.42) * max(60.0, ground - 120)
        s = rnd.uniform(0.7, 1.15)
        for X in copies(cx, 60):
            puffs = I.soften(unary_union([I.circle((X + dx * s, cy + dy * s), r * s) for dx, dy, r in PUFFS]), 2.5 * s)
            puffs = puffs.intersection(box(X - 70 * s, cy - 50 * s, X + 70 * s, cy + 14 * s))
            body.append(_modelled(puffs, CLOUD, CLOUD_LIGHT, CLOUD_SHADE, (-2.2 * s, 2.6 * s), (1.2 * s, -4.5 * s)))
    base.alpha_composite(_layer(w, h, "".join(body), scale))

    # far ridge with distant tree tops peeking over it
    f_far = _wave_fn(ground - 62, waves(w + 1, (34, 22, 9)))
    rf, clumps, x = random.Random(w * 3 + 1), [], 0.0 if wrap else -10.0
    while x < (w if wrap else w + 20):
        n = rf.randint(3, 7)                       # a little wood: n tree tops of mixed sizes
        sizes = [rf.uniform(2.4, 4.4) for _ in range(n)]
        for X in copies(x, 60):
            px = X
            for r in sizes:
                clumps.append(I.circle((px, f_far(px) + r * 0.3), r))
                px += r * 1.15
        x += rf.uniform(45, 130)
    body = []
    if clumps:
        body.append(_modelled(unary_union(clumps), FAR_TREE, FAR_LIGHT, FAR_SHADE, (-1.3, 1.2), (1.1, -1.3)))
    body.append(_modelled(_ridge_poly(f_far, -8, w + 8, h + 8), FAR_HILL, FAR_LIGHT, FAR_SHADE, (-7, -1.0), (7, -1.0)))
    base.alpha_composite(_layer(w, h, "".join(body), scale))

    # valley mist: the bottom of the far hills fades towards the warm horizon colour
    a = Image.new("L", (1, H))
    for j in range(H):
        a.putpixel((0, j), int(255 * 0.42 * max(0.0, min(1.0, (j / scale - (ground - 105)) / 70.0))))
    mist = Image.new("RGBA", (W, H), SKY_LOW + (0,))
    mist.putalpha(a.resize((W, H)))
    base.alpha_composite(mist)

    f_near = _wave_fn(ground - 34, waves(w + 2, (20, 13, 6)))
    base.alpha_composite(_layer(w, h, _modelled(_ridge_poly(f_near, -8, w + 8, h + 8), NEAR_HILL, NEAR_LIGHT,
                                                NEAR_SHADE, (-7, -1.0), (7, -1.0)), scale))

    # tree line: pines darker on the side away from the light, round trees with a lit crown
    trees, x = [], 0.0 if wrap else -10.0
    while x < (w if wrap else w + 20):
        kind = rnd.random()
        hy = ground - 26 - rnd.uniform(0, 7)
        if kind < 0.55:
            th = rnd.uniform(22, 38)
            for X in copies(x, 40):
                for fy, fw in ((0.0, 0.5), (0.3, 0.4), (0.58, 0.28)):
                    y0 = hy - th * fy
                    left, apex, right = (X - th * fw, y0), (X, y0 - th * 0.55), (X + th * fw, y0)
                    trees.append(_fill(_tri(left, apex, right), PINE))
                    trees.append(_fill(_tri(left, apex, (X - th * fw * 0.12, y0)), PINE_SHADE))
            x += rnd.uniform(9, 16)
        elif kind < 0.85:
            r = rnd.uniform(8, 13)
            for X in copies(x, 40):
                trees.append(_fill(_tri((X - 1.6, hy + 4), (X - 1.2, hy - r), (X + 1.2, hy - r), (X + 1.6, hy + 4)), TRUNK))
                trees.append(_fill(_tri((X - 1.6, hy + 4), (X - 1.2, hy - r), (X - 0.1, hy - r), (X - 0.2, hy + 4)),
                                   TRUNK_SHADE))
                cy = hy - r - 2
                crown = unary_union([I.circle((X, cy), r), I.circle((X - 0.55 * r, cy + 0.28 * r), 0.62 * r),
                                     I.circle((X + 0.5 * r, cy + 0.22 * r), 0.66 * r)])
                trees.append(_modelled(crown, ROUND_TREE, ROUND_LIGHT, ROUND_SHADE, (-0.3 * r, 0.32 * r),
                                       (0.32 * r, -0.36 * r)))
            x += rnd.uniform(14, 22)
        else:
            x += rnd.uniform(18, 46)
    base.alpha_composite(_layer(w, h, "".join(trees), scale))

    # meadow with a lit rim, a few tufts and tiny far flowers
    f_mead = _wave_fn(ground - 4, waves(w + 3, (9, 5)))
    meadow = _ridge_poly(f_mead, -8, w + 8, h + 8)
    body = [_modelled(meadow, MEADOW, MEADOW_LIGHT, MEADOW_SHADE, (-7, -0.6), (7, -0.6)),
            _shape(meadow.difference(affinity.translate(meadow, 0, 1.4)), MEADOW_LIGHT)]
    rt, x = random.Random(w * 7 + 3), 0.0 if wrap else -10.0
    while x < (w if wrap else w + 20):
        kind, dy = rt.random(), rt.uniform(2.5, 6.0)
        for X in copies(x, 20):
            y = f_mead(X) + dy
            if kind < 0.6:
                for lean, bh in ((-1.6, 3.4), (0.3, 4.6), (1.8, 3.2)):
                    body.append(_fill(_tri((X - 0.7, y), (X + lean, y - bh), (X + 0.7, y)), TUFT))
            else:
                body.append(_fill(_blob(X, y - 1.0, 1.0, 8), ("#FFFFFF", "#F3A9C1", "#F7D46A")[int(kind * 30) % 3]))
        x += rt.uniform(10, 26)
    base.alpha_composite(_layer(w, h, "".join(body), scale))
    return _papered(base, w * 13 + h)


# ---------------------------------------------------------------- ground
@functools.lru_cache(maxsize=8)
def ground_tile(scale):
    """One seamless PERIOD-wide piece of the meadow path: transparent above the walking line
    except grass blades and flowers; grass top, then sandy soil with pebbles below."""
    P, Ht, L = PERIOD, TILE_H, TILE_LINE
    body = []
    for k in (-1, 0, 1):
        o = (k + 1) * P                                  # painted three times so blur wraps
        body.append(_fill("M%s,%sH%sV%sH%sZ" % (K.f2(o - 1), K.f2(L + 5), K.f2(o + P + 1), Ht + 2, K.f2(o - 1)), SOIL))
        body.append(_fill("M%s,%sH%sV%sH%sZ" % (K.f2(o - 1), K.f2(L + 34), K.f2(o + P + 1), Ht + 2, K.f2(o - 1)),
                          SOIL_DARK, 0.7))
        for px, py, r in ((14, 15, 2.6), (39, 27, 1.8), (61, 18, 2.2), (83, 31, 2.8), (27, 43, 2.0), (72, 47, 1.6)):
            body.append(_fill(_blob(o + px, L + py, r, 10), PEBBLE, 0.85))
        grass = [(o + x, L + 6.5 + 1.6 * math.sin(2 * math.pi * x / 24.0) + 1.2 * math.sin(2 * math.pi * x / 32.0))
                 for x in range(0, P + 1, 3)]
        body.append(_fill("M%s,%sL%sL%s,%sZ" % (K.f2(o), K.f2(L - 0.5), "L".join(K.P(p) for p in grass),
                                                 K.f2(o + P), K.f2(L - 0.5)), GRASS))
        body.append(_fill("M%s,%sH%sV%sH%sZ" % (K.f2(o), K.f2(L - 0.5), K.f2(o + P), K.f2(L + 2.2), K.f2(o)),
                          GRASS_TOP, 0.9))
        for bx, bh, lean in ((6, 7, -2), (11, 9, 1.5), (31, 6, 2), (49, 8, -1.5), (54, 6, 2.5), (77, 9, -2),
                             (81, 7, 1), (92, 6, -1)):
            x = o + bx
            body.append(_fill("M%s,%sL%s,%sL%s,%sZ" % (K.f2(x - 1.3), K.f2(L + 1.5), K.f2(x + lean), K.f2(L - bh),
                                                       K.f2(x + 1.3), K.f2(L + 1.5)), GRASS_DARK))
        for fx, fh, petal, centre in ((22, 9, "#FFFFFF", "#F2C24B"), (44, 6, "#F3A9C1", "#E58BA8"),
                                      (68, 10, "#FFFFFF", "#F2C24B"), (88, 5, "#F7D46A", "#E9B640")):
            x = o + fx
            body.append(_fill("M%s,%sL%s,%sL%s,%sL%s,%sZ" % (K.f2(x - 0.6), K.f2(L + 1), K.f2(x - 0.5), K.f2(L - fh),
                                                              K.f2(x + 0.5), K.f2(L - fh), K.f2(x + 0.6), K.f2(L + 1)),
                              GRASS_DARK))
            for a in range(0, 360, 60):
                c = K.add((x, L - fh - 2), K.polar(a, 2.3))
                body.append(_fill(_blob(c[0], c[1], 1.7, 8), petal))
            body.append(_fill(_blob(x, L - fh - 2, 1.4, 8), centre))
    strip = _layer(3 * P, Ht, "".join(body), scale)
    S = scale
    tile = strip.crop((int(round(P * S)), 0, int(round(2 * P * S)), int(round(Ht * S))))
    return _papered(tile, 977, wrap=True, amount=0.06)


def ground_layer(w, h, ground, scroll, scale):
    """The tile repeated across the width, its walking line on `ground`, shifted by `scroll`."""
    tile = ground_tile(scale)
    W, H = int(round(w * scale)), int(round(h * scale))
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    off = scroll % PERIOD
    top = int(round((ground - TILE_LINE) * scale))
    k = -1
    while True:
        x = int(round((k * PERIOD - off) * scale))
        if x >= W:
            break
        over(out, tile, x, top)
        k += 1
    return out


def over(dst, src, x, y):
    """alpha_composite that accepts offsets left of / above the destination (src is cropped)."""
    sx, sy = max(0, -x), max(0, -y)
    if sx >= src.size[0] or sy >= src.size[1] or x >= dst.size[0] or y >= dst.size[1]:
        return
    dst.alpha_composite(src, (max(0, x), max(0, y)), (sx, sy))


# ----------------------------------------------------------- props, fx
def dummy_svg(w, h, x, ground, tilt):
    """Straw training dummy on a post (inked like Ratislav); tilts about the foot of the post."""
    ink = I.Ink(w, h, INK, 2.0, 1.3)
    M = K.Affine.translate(x, ground) @ K.Affine.rotate(tilt)
    ink.part(I.xf_poly(I.Polygon([(-3.6, 0.5), (3.6, 0.5), (3.6, -46), (-3.6, -46)]), M), WOOD, WOOD_SHADE,
             shade_off=(1.4, -1.0))
    ink.part(I.xf_poly(I.tube([(-17, -30), (17, -30)], 7.0, 7.0), M), STRAW, STRAW_SHADE, shade_off=(0.0, -2.0))
    ink.part(I.xf_poly(I.ellipse((0, -59), 17, 19), M), STRAW, STRAW_SHADE, shade_off=(2.0, -2.5))
    ink.line(M.pts([(-15.5, -49.5), (0, -47.5), (15.5, -49.5)]), 1.6, taper=False)
    for ex in (-6.5, 6.5):
        ink.line(M.pts([(ex - 2.6, -65.5), (ex + 2.6, -60.3)]), 1.7)
        ink.line(M.pts([(ex - 2.6, -60.3), (ex + 2.6, -65.5)]), 1.7)
    for sx, sy in ((-17, -30), (17, -30)):
        for a in (-35, 0, 35):
            d = K.polar((180 if sx < 0 else 0) + a, 5.0)
            ink.line(M.pts([(sx, sy), (sx + d[0], sy + d[1])]), 1.1)
    return ink.svg()


def dummy_layer(w, h, x, ground, tilt, scale):
    return K.rasterize(dummy_svg(w, h, x, ground, tilt), scale)


def shadow_layer(w, h, x, ground, k, scale):
    W, H = int(round(w * scale)), int(round(h * scale))
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    rx, ry = 27 * k * scale, 4.5 * k * scale
    cy = (ground + 0.5) * scale
    d.ellipse([x * scale - rx, cy - ry, x * scale + rx, cy + ry], fill=(47, 42, 53, 44))
    return im.filter(ImageFilter.GaussianBlur(1.4 * scale))


def fx_layer(w, h, fxs, scale, markup):
    return K.rasterize(_svg(w, h, "".join(markup(fx) for fx in fxs)), scale)

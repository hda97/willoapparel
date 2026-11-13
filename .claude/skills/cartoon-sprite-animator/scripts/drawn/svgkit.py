"""svgkit - a small toolkit for flat, outlined cartoon characters drawn as SVG.

Generic pieces only (no character lives here):
  * vector maths and 2D affine transforms,
  * smooth shapes (Catmull-Rom through points -> Bezier path),
  * rubber-hose ("noodle") limbs that always keep the same length,
  * tapered strands for tails, scarves, hair,
  * outline groups: several shapes share ONE outer outline of even weight,
  * rasterising with PyMuPDF, sprite strips, GIF previews, QA contact sheets.

A character is a separate module that builds a Canvas from a pose.
Coordinates follow SVG: x to the right, y DOWN, angles in degrees, positive
angle = clockwise on screen. Only Pillow and PyMuPDF (fitz) are needed.
"""
import io
import math

from PIL import Image, ImageDraw


# ------------------------------------------------------------------ maths
def add(a, b):
    return (a[0] + b[0], a[1] + b[1])


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])


def mul(a, s):
    return (a[0] * s, a[1] * s)


def length(a):
    return math.hypot(a[0], a[1])


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def norm(a):
    n = length(a)
    return (a[0] / n, a[1] / n) if n > 1e-9 else (0.0, 0.0)


def perp(a):
    """Rotate a vector by -90 degrees on screen (to its left when y points down)."""
    return (-a[1], a[0])


def rot(a, deg):
    r = math.radians(deg)
    c, s = math.cos(r), math.sin(r)
    return (a[0] * c - a[1] * s, a[0] * s + a[1] * c)


def polar(deg, r=1.0):
    return rot((r, 0.0), deg)


def lerp(a, b, t):
    return a + (b - a) * t


def lerp2(p, q, t):
    return (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def ease_in_out(t):
    return 0.5 - 0.5 * math.cos(math.pi * clamp(t, 0.0, 1.0))


def ease_out(t):
    t = clamp(t, 0.0, 1.0)
    return 1 - (1 - t) ** 2


def ease_in(t):
    t = clamp(t, 0.0, 1.0)
    return t * t


class Affine:
    """2D affine map in SVG order: x' = a*x + c*y + e, y' = b*x + d*y + f.
    (A @ B)(p) == A(B(p)), so read a chain right-to-left: local -> world."""

    __slots__ = ("a", "b", "c", "d", "e", "f")

    def __init__(self, a=1.0, b=0.0, c=0.0, d=1.0, e=0.0, f=0.0):
        self.a, self.b, self.c, self.d, self.e, self.f = a, b, c, d, e, f

    def __matmul__(self, o):
        return Affine(
            self.a * o.a + self.c * o.b,
            self.b * o.a + self.d * o.b,
            self.a * o.c + self.c * o.d,
            self.b * o.c + self.d * o.d,
            self.a * o.e + self.c * o.f + self.e,
            self.b * o.e + self.d * o.f + self.f,
        )

    def __call__(self, p):
        return (self.a * p[0] + self.c * p[1] + self.e, self.b * p[0] + self.d * p[1] + self.f)

    def pts(self, ps):
        return [self(p) for p in ps]

    def vec(self, v):
        """Map a direction (no translation)."""
        return (self.a * v[0] + self.c * v[1], self.b * v[0] + self.d * v[1])

    @staticmethod
    def translate(x, y):
        return Affine(e=x, f=y)

    @staticmethod
    def rotate(deg):
        r = math.radians(deg)
        c, s = math.cos(r), math.sin(r)
        return Affine(c, s, -s, c)

    @staticmethod
    def scale(sx, sy=None):
        return Affine(sx, 0.0, 0.0, sx if sy is None else sy)


# ------------------------------------------------------------- formatting
def f2(x):
    s = "%.2f" % x
    s = s.rstrip("0").rstrip(".")
    return "0" if s in ("-0", "", "-") else s


def P(p):
    return f2(p[0]) + "," + f2(p[1])


# ----------------------------------------------------------------- shapes
def ellipse_pts(cx, cy, rx, ry, deg=0.0, n=36):
    out = []
    for i in range(n):
        t = 2 * math.pi * i / n
        v = rot((rx * math.cos(t), ry * math.sin(t)), deg)
        out.append((cx + v[0], cy + v[1]))
    return out


def circle_pts(cx, cy, r, n=32):
    return ellipse_pts(cx, cy, r, r, 0.0, n)


def smooth_closed(pts):
    """Closed Catmull-Rom curve through pts, written as cubic Beziers."""
    n = len(pts)
    d = ["M" + P(pts[0])]
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append("C" + P(c1) + " " + P(c2) + " " + P(p2))
    return "".join(d) + "Z"


def smooth_open(pts):
    n = len(pts)
    d = ["M" + P(pts[0])]
    for i in range(n - 1):
        p0 = pts[i - 1] if i > 0 else pts[0]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < n else pts[-1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append("C" + P(c1) + " " + P(c2) + " " + P(p2))
    return "".join(d)


def poly(pts, closed=True):
    d = "M" + P(pts[0]) + "".join("L" + P(p) for p in pts[1:])
    return d + ("Z" if closed else "")


def catmull(pts, closed=True, steps=8):
    """Dense points along the same curve smooth_closed/smooth_open draws."""
    n = len(pts)
    out = []
    segs = range(n) if closed else range(n - 1)
    for i in segs:
        p0 = pts[i - 1] if (closed or i > 0) else pts[0]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if (closed or i + 2 < n) else pts[-1]
        for s in range(steps):
            t = s / steps
            t2, t3 = t * t, t * t * t
            out.append(tuple(
                0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t
                       + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2
                       + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)
                for k in (0, 1)))
    if not closed:
        out.append(pts[-1])
    return out


def clip_convex(subject, clip):
    """Sutherland-Hodgman: part of polygon `subject` inside CONVEX polygon `clip`."""
    area = sum(clip[i][0] * clip[(i + 1) % len(clip)][1] - clip[(i + 1) % len(clip)][0] * clip[i][1]
               for i in range(len(clip)))
    sign = 1.0 if area > 0 else -1.0
    out = list(subject)
    for i in range(len(clip)):
        a, b = clip[i], clip[(i + 1) % len(clip)]
        if not out:
            break

        def inside(p):
            return sign * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0

        def cross_pt(p, q):
            den = (p[0] - q[0]) * (a[1] - b[1]) - (p[1] - q[1]) * (a[0] - b[0])
            t = ((p[0] - a[0]) * (a[1] - b[1]) - (p[1] - a[1]) * (a[0] - b[0])) / den
            return (p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]))

        inp, out = out, []
        s = inp[-1]
        for e in inp:
            if inside(e):
                if not inside(s):
                    out.append(cross_pt(s, e))
                out.append(e)
            elif inside(s):
                out.append(cross_pt(s, e))
            s = e
    return out


# ------------------------------------------------------ limbs and strands
def _quad_pt(a, c, b, t):
    u = 1 - t
    return (u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1])


def quad_len(a, c, b, n=24):
    total, prev = 0.0, a
    for i in range(1, n + 1):
        p = _quad_pt(a, c, b, i / n)
        total += dist(prev, p)
        prev = p
    return total


def noodle(start, end, limb_len, bend=1.0):
    """Rubber-hose limb: control point of a quadratic Bezier start->end whose
    arc length equals limb_len, so the limb never changes length between frames.
    bend=+1 bows to the screen-left of the start->end direction, -1 to the right.
    Returns (control_point, stretch) where stretch > 1 means the target was out
    of reach and the limb had to stretch (reported by QA)."""
    d = dist(start, end)
    mid = lerp2(start, end, 0.5)
    if d >= limb_len - 1e-6:
        return mid, d / limb_len
    n = perp(norm(sub(end, start)))
    lo, hi = 0.0, limb_len
    for _ in range(40):
        h = (lo + hi) / 2
        if quad_len(start, add(mid, mul(n, h * bend)), end) < limb_len:
            lo = h
        else:
            hi = h
    return add(mid, mul(n, lo * bend)), 1.0


def strand(base, angle0, total_len, n=28, curl=0.0, wave_amp=0.0, wave_k=1.0, phase=0.0):
    """Centre line of fixed length walked from `base`: starts at angle0, bends by
    `curl` degrees in total, and carries a travelling wave that grows toward the
    tip. Fixed length = tails and scarves never pop between frames."""
    pts, p, ds = [base], base, total_len / n
    for i in range(n):
        s = (i + 0.5) / n
        a = angle0 + curl * s + wave_amp * s * math.sin(2 * math.pi * (wave_k * s - phase))
        p = add(p, polar(a, ds))
        pts.append(p)
    return pts


def ribbon(spine, w0, w1):
    """Closed outline of a tapered ribbon following `spine` (full widths)."""
    left, right, n = [], [], len(spine)
    for i, p in enumerate(spine):
        a, b = spine[max(i - 1, 0)], spine[min(i + 1, n - 1)]
        nn = perp(norm(sub(b, a)))
        w = lerp(w0, w1, i / (n - 1)) / 2
        left.append(add(p, mul(nn, w)))
        right.append(sub(p, mul(nn, w)))
    tip = spine[-1]
    t_dir = norm(sub(spine[-1], spine[-2]))
    cap = add(tip, mul(t_dir, w1 * 0.45))
    return left + [cap] + right[::-1]


# ----------------------------------------------------------------- canvas
class Canvas:
    """Collects SVG elements. All outlines share one weight (`line`)."""

    def __init__(self, w, h, ink="#222222", line=2.75):
        self.w, self.h, self.ink, self.line = w, h, ink, line
        self.parts = []

    def raw(self, s):
        self.parts.append(s)

    def group(self, items, line=None, ink=None, opacity=1.0):
        """Filled shapes sharing ONE outer outline (no lines where they overlap).
        items: [(path_d, fill), ...]. Outline strokes go first at double width,
        fills on top, so exactly `line` px of outline shows outside the shape."""
        lw = self.line if line is None else line
        ink = ink or self.ink
        if opacity < 1:
            self.raw('<g opacity="%s">' % f2(opacity))
        for d, _fill in items:
            self.raw('<path d="%s" fill="%s" stroke="%s" stroke-width="%s" stroke-linejoin="round"/>'
                     % (d, ink, ink, f2(2 * lw)))
        for d, fill in items:
            self.raw('<path d="%s" fill="%s"/>' % (d, fill))
        if opacity < 1:
            self.raw("</g>")

    def shape(self, d, fill, line=None, ink=None, opacity=1.0):
        self.group([(d, fill)], line, ink, opacity)

    def fill(self, d, fill, opacity=1.0):
        op = "" if opacity >= 1 else ' fill-opacity="%s"' % f2(opacity)
        self.raw('<path d="%s" fill="%s"%s/>' % (d, fill, op))

    def stroke(self, d, color=None, width=None, opacity=1.0, cap="round"):
        op = "" if opacity >= 1 else ' stroke-opacity="%s"' % f2(opacity)
        self.raw('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="%s" '
                 'stroke-linejoin="round"%s/>'
                 % (d, color or self.ink, f2(self.line if width is None else width), cap, op))

    def tube(self, a, c, b, width, fill, line=None, ink=None):
        """Outlined rubber-hose tube along the quadratic curve a -c- b."""
        lw = self.line if line is None else line
        d = "M%sQ%s %s" % (P(a), P(c), P(b))
        self.stroke(d, ink or self.ink, width + 2 * lw)
        self.stroke(d, fill, width)

    def svg(self):
        return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">'
                % (self.w, self.h, self.w, self.h)) + "".join(self.parts) + "</svg>"


# ----------------------------------------------------------- rasterising
def rasterize(svg_text, scale=1.0):
    """SVG text -> RGBA Pillow image (transparent background) via PyMuPDF."""
    import fitz  # PyMuPDF

    doc = fitz.open(stream=svg_text.encode("utf-8"), filetype="svg")
    pix = doc[0].get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=True)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")
    doc.close()
    return img


def strip(images, cols=None):
    """Sprite sheet: equal-size frames left-to-right, wrapping after `cols`."""
    w, h = images[0].size
    cols = cols or len(images)
    rows = (len(images) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * w, rows * h), (0, 0, 0, 0))
    for i, im in enumerate(images):
        sheet.alpha_composite(im, ((i % cols) * w, (i // cols) * h))
    return sheet


def save_gif(frames, durations, path):
    """Animated GIF with ONE shared palette (no colour flicker between frames).
    Frames should be opaque (composited on a background) - GIF alpha is 1-bit."""
    rgb = [f.convert("RGB") for f in frames]
    w, h = rgb[0].size
    sample = Image.new("RGB", (w // 2, (h // 2) * len(rgb)))
    for i, f in enumerate(rgb):
        sample.paste(f.resize((w // 2, h // 2)), (0, i * (h // 2)))
    pal = sample.quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in rgb]
    q[0].save(path, save_all=True, append_images=q[1:], duration=list(durations), loop=0,
              optimize=False, disposal=1)


def contact_sheet(images, labels, cols, guide_y=None, bg=(246, 244, 250, 255)):
    """QA board: every frame with its label, a ground guide line and a cell border."""
    w, h = images[0].size
    rows = (len(images) + cols - 1) // cols
    top = 18
    sheet = Image.new("RGBA", (cols * w, rows * (h + top)), bg)
    d = ImageDraw.Draw(sheet)
    for i, im in enumerate(images):
        x, y = (i % cols) * w, (i // cols) * (h + top)
        d.rectangle([x, y + top, x + w - 1, y + top + h - 1], outline=(205, 200, 215))
        if guide_y is not None:
            d.line([(x, y + top + guide_y), (x + w, y + top + guide_y)], fill=(235, 90, 90), width=1)
        sheet.alpha_composite(im, (x, y + top))
        d.text((x + 5, y + 3), labels[i], fill=(70, 60, 85))
    return sheet

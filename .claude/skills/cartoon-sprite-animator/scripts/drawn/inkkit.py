"""Drawn-look renderer for a posed character.

A hand-drawn character has ONE line around its whole silhouette and inner lines only where a
nearer part really passes in front of a farther one. Where a part grows out of another (arm out
of the shoulder, tail out of the rump) there is no line at all. This module does exactly that:

  ink = Ink()
  ink.part(polygon, fill, seams=[(x, y, r)])   # far -> near; returns nothing
  ink.paint(polygon, color)                    # flat detail on top (eye, inner ear), no lines
  ink.line(coords)                             # extra pen line (mouth, whisker), tapers at free ends
  svg = ink.svg(extra)                         # fills, then lines, then the silhouette

Lines of a part are clipped by every part drawn after it, so nothing shows through.
Geometry is shapely; rendering goes through svgkit.rasterize (PyMuPDF).
"""
import math

from shapely import affinity
from shapely.geometry import LineString, MultiLineString, Point, Polygon
from shapely.ops import unary_union

import svgkit as K

LINE = "#2F2A35"


# ------------------------------------------------------------- shape helpers
def circle(c, r):
    return Point(c).buffer(r, quad_segs=16)


def ellipse(c, rx, ry, deg=0.0, n=72):
    return Polygon(K.ellipse_pts(c[0], c[1], rx, ry, deg, n))


def blob(pts, steps=10):
    """Smooth closed shape through control points (Catmull-Rom)."""
    return Polygon(K.catmull(pts, True, steps)).buffer(0)


def soften(geom, r):
    """Round every inside corner with radius r: separate blobs melt into one form."""
    return geom.buffer(r, quad_segs=12).buffer(-r, quad_segs=12)


def tube(spine, w0, w1):
    """Tapered tube with round ends along a list of points."""
    body = Polygon(K.ribbon(spine, w0, w1)).buffer(0)
    return unary_union([body, circle(spine[0], w0 / 2), circle(spine[-1], w1 / 2)])


def bezier(a, c, b, n=24):
    return [K._quad_pt(a, c, b, i / n) for i in range(n + 1)]


def xf_poly(geom, M):
    """Apply an svgkit.Affine to a shapely geometry."""
    return affinity.affine_transform(geom, [M.a, M.c, M.b, M.d, M.e, M.f])


def shade_of(geom, off=(3.0, -4.0)):
    """Crescent along the side facing away from the light (light comes from up-front)."""
    return geom.difference(affinity.translate(geom, off[0], off[1]))


# --------------------------------------------------------------------- lines
def _lines(geom):
    if geom is None or geom.is_empty:
        return []
    if isinstance(geom, LineString):
        return [geom]
    if isinstance(geom, MultiLineString):
        return list(geom.geoms)
    out = []
    for g in getattr(geom, "geoms", []):
        out += _lines(g)
    return out


def _densify(coords, step=0.8):
    out = [coords[0]]
    for a, b in zip(coords, coords[1:]):
        d = K.dist(a, b)
        k = max(1, int(d / step))
        out += [K.lerp2(a, b, i / k) for i in range(1, k + 1)]
    return out


def _smooth01(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def pen_stroke(coords, width, taper0=True, taper1=True, taper_len=7.0):
    """Closed outline of a pen line whose width swells from thin free ends to `width`."""
    pts = _densify(list(coords))
    if len(pts) < 2:
        return None
    acc = [0.0]
    for a, b in zip(pts, pts[1:]):
        acc.append(acc[-1] + K.dist(a, b))
    total = acc[-1]
    if total < 0.6:
        return None
    left, right, half = [], [], []
    for i, p in enumerate(pts):
        f = 1.0
        if taper0:
            f = min(f, _smooth01(acc[i] / taper_len))
        if taper1:
            f = min(f, _smooth01((total - acc[i]) / taper_len))
        h = width * (0.22 + 0.78 * f) / 2
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, len(pts) - 1)]
        n = K.perp(K.norm(K.sub(b, a)))
        left.append(K.add(p, K.mul(n, h)))
        right.append(K.sub(p, K.mul(n, h)))
        half.append(h)

    def cap(c, h, d):
        base = math.degrees(math.atan2(d[1], d[0]))
        return [K.add(c, K.polar(base + a, h)) for a in (-60, -30, 0, 30, 60)]

    d1 = K.norm(K.sub(pts[-1], pts[-2]))
    d0 = K.norm(K.sub(pts[0], pts[1]))
    return left + cap(pts[-1], half[-1], d1) + right[::-1] + cap(pts[0], half[0], d0)


def path_of(geom):
    """SVG path data for a (Multi)Polygon, holes included (use fill-rule evenodd)."""
    polys = [geom] if isinstance(geom, Polygon) else list(getattr(geom, "geoms", []))
    out = []
    for pg in polys:
        if not isinstance(pg, Polygon) or pg.is_empty:
            continue
        for ring in [pg.exterior] + list(pg.interiors):
            c = list(ring.coords)
            out.append("M" + "L".join(K.P(p) for p in c[:-1]) + "Z")
    return "".join(out)


# ---------------------------------------------------------------- the canvas
class Ink:
    def __init__(self, w=256, h=256, line=LINE, w_out=2.6, w_in=1.7, weight=(-0.8, 1.0)):
        self.w, self.h, self.ink, self.w_out, self.w_in = w, h, line, w_out, w_in
        self.weight = weight   # the outline thickens by this offset on the shadow side (None = even)
        self.fills = []        # svg snippets in paint order
        self.lines = []        # [geometry, width, taper]
        self.covered = None    # union of every part so far
        self.parts = []

    def part(self, geom, fill, shade=None, seams=(), lines=True, shade_off=(3.0, -4.0), opacity=1.0):
        geom = geom.buffer(0)
        if geom.is_empty:
            return
        self.fills.append('<path d="%s" fill="%s" fill-rule="evenodd"%s/>'
                          % (path_of(geom), fill, '' if opacity >= 1 else ' fill-opacity="%.2f"' % opacity))
        if shade:
            sh = shade_of(geom, shade_off)
            if not sh.is_empty:
                self.fills.append('<path d="%s" fill="%s" fill-rule="evenodd"/>' % (path_of(sh), shade))
        # lines drawn earlier disappear behind this part
        self.lines = [[l[0].difference(geom), l[1], l[2]] for l in self.lines]
        if lines and self.covered is not None:
            inner = geom.boundary.intersection(self.covered.buffer(-0.5))
            if seams:
                inner = inner.difference(unary_union([circle((x, y), r) for x, y, r in seams]))
            self.lines.append([inner, self.w_in, True])
        self.covered = geom if self.covered is None else self.covered.union(geom)
        self.parts.append(geom)

    def paint(self, geom, color, opacity=1.0):
        geom = geom.buffer(0)
        if not geom.is_empty:
            self.fills.append('<path d="%s" fill="%s"%s/>'
                              % (path_of(geom), color, '' if opacity >= 1 else ' fill-opacity="%.2f"' % opacity))

    def line(self, coords, width=None, taper=True):
        self.lines.append([LineString(coords), width or self.w_in, taper])

    def svg(self, extra="", under=""):
        out = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">'
               % (self.w, self.h, self.w, self.h), under]
        out += self.fills
        sil = self.covered.boundary if self.covered is not None else None
        near_sil = sil.buffer(0.9) if sil is not None else None
        for geom, width, taper in self.lines:
            ta, tb = taper if isinstance(taper, tuple) else (taper, taper)   # (start, end) or both
            for ls in _lines(geom):
                c = list(ls.coords)
                if len(c) < 2:
                    continue
                t0 = ta and not (near_sil is not None and near_sil.contains(Point(c[0])))
                t1 = tb and not (near_sil is not None and near_sil.contains(Point(c[-1])))
                outline = pen_stroke(c, width, t0, t1)
                if outline:
                    out.append('<path d="%s" fill="%s"/>' % (K.poly(outline), self.ink))
        if sil is not None and self.weight:
            rim = affinity.translate(self.covered, *self.weight).difference(self.covered)
            if not rim.is_empty:
                out.append('<path d="%s" fill="%s" fill-rule="evenodd"/>' % (path_of(rim), self.ink))
        if sil is not None:
            for ring in _lines(sil):
                out.append('<path d="M%sZ" fill="none" stroke="%s" stroke-width="%s" stroke-linejoin="round"/>'
                           % ("L".join(K.P(p) for p in list(ring.coords)[:-1]), self.ink, K.f2(self.w_out)))
        out.append(extra)
        out.append("</svg>")
        return "".join(out)

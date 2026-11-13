"""Ratislav in a soft storybook style: one round body that melts into the head, a thin even
ink line around the whole figure, inner lines only where a limb really passes in front, flat
pastel colours with a quiet shadow side.

Same rig contract as v1 (Pose fields, draw_pose -> (svg, info), anchor, foot geometry), so the
animation, QA and export code keep working; only the drawing is new (see inkkit).
"""
import math
from dataclasses import dataclass, field

from shapely.ops import unary_union

import inkkit as I
import svgkit as K
from svgkit import Affine, add, lerp, mul, norm, perp, polar, rot, sub

CELL = 256
GROUND = 236.0
HIP_REST = (118.0, 204.0)
ANCHOR = (118, 236)
LINE = 2.2
LEG_LEN, LEG_W = 29.0, 12.5
ARM_LEN, ARM_W = 29.0, 9.5
HAND_R = 6.0
FOOT_C, FOOT_RX, FOOT_RY = (4.5, 2.6), 9.5, 5.0      # foot ellipse in foot space (origin = ankle)
SOLE = FOOT_C[1] + FOOT_RY                            # ankle height of a flat foot
HEEL_PT, TOE_PT = (-2.0, 6.25), (11.0, 6.25)          # points the foot rocks on (on the sole)
BLADE = 44.0
SWORD_REACH = BLADE + 6.0

PAL = {
    "ink": I.LINE,
    "fur": "#EEEAF2", "fur_shade": "#D2CBDF", "fur_far": "#DCD6E6", "fur_far_shade": "#C3BBD2",
    "pink": "#F3A8B6", "pink_far": "#E595A5", "tail": "#EBBAC4", "tail_shade": "#D69FAB",
    "scarf": "#E0583D", "scarf_shade": "#BC432C", "scarf_far": "#C94A31",
    "eye": "#29242F", "shine": "#FFFFFF", "mouth": "#6A2A3C", "tongue": "#F08A9C", "blush": "#F4A3B4",
    "blade": "#EEF3F7", "blade_shade": "#C6D1DC", "guard": "#EDBE4E", "grip": "#8C5C3C",
    "swoosh": "#FFFFFF", "swoosh_edge": "#9FCBE8", "dust": "#F6EFE3",
}

# torso space: origin at the hip centre, y down; the body is a soft egg
TORSO = [(0, 12), (18, 9), (27, -4), (29, -20), (25, -36), (16, -47), (2, -52),
         (-14, -48), (-24, -36), (-28, -18), (-27, -2), (-18, 9)]
NECK = (2.0, -44.0)
SHOULDER_F, SHOULDER_B = (9.0, -37.0), (-5.0, -38.0)
HIPJ_F, HIPJ_B = (3.0, 0.0), (-3.0, 0.0)
TAIL_ROOT = (-23.0, 0.0)
SCARF_BAND = (-44.0, -35.0)
SCARF_KNOT = (-25.0, -40.0)
NOSE, NOSE_R = (48.6, -18.2), 4.4                     # head space
# whiskers grow from the front of the muzzle below the nose and fan forward, clear of its outline (root, bend, tip)
WHISKERS = (((45.0, -10.9), (54.5, -11.4), (64.0, -12.6)), ((43.4, -8.9), (52.5, -8.0), (61.5, -5.2)))


@dataclass
class Pose:
    """Every control of the rig. Angles in degrees; offsets in sprite pixels."""
    hip: tuple = HIP_REST          # pelvis centre (the root)
    lean: float = 2.0              # torso rotation, + leans forward
    squash: float = 1.0            # torso stretch along its axis (<1 squash, >1 stretch)
    head_tilt: float = 0.0         # extra head rotation, + nods forward
    head_shift: tuple = (0.0, 0.0)
    ear_near: float = 0.0          # + swings the ear back toward the tail
    ear_far: float = 0.0
    hand_f: tuple = (6.0, 25.0)    # near hand, offset from its shoulder
    hand_b: tuple = (-3.0, 25.0)   # far hand, offset from its shoulder
    bend_f: float = 1.0            # elbow side of the rubber-hose arms
    bend_b: float = 1.0
    foot_f: tuple = None           # ankle positions in the cell (None = rest stance)
    foot_b: tuple = None
    toe_f: float = 0.0             # foot rotation, + lifts the heel / points the toes
    toe_b: float = 0.0
    tail_phase: float = 0.0
    tail_curl: float = 0.0
    tail_lift: float = 0.0         # + swings the tail down, - up
    scarf_phase: float = 0.0
    scarf_lift: float = 0.0
    eyes: str = "open"             # open | wide | squint | closed
    mouth: str = "smile"           # smile | grit | open | yell | o
    brow: str = ""                 # "" | angry | up
    sword: float = 40.0            # blade direction: 0 forward, -90 up, +90 down
    arm_behind: bool = False       # near arm, sword and hand pass behind the body (wind-up)
    fx: list = field(default_factory=list)


def torso_xf(p):
    sq = p.squash
    return Affine.translate(*p.hip) @ Affine.rotate(p.lean) @ Affine.scale(1 / math.sqrt(sq), sq)


def joint(p, local):
    """World position of a torso-space point for pose p (used by effects)."""
    return torso_xf(p)(local)


def head_xf(p, T=None):
    T = T or torso_xf(p)
    hc = add(add(T(NECK), rot((3.0, -2.0), p.lean * 0.6)), p.head_shift)
    return Affine.translate(*hc) @ Affine.rotate(p.lean * 0.35 + p.head_tilt)


def _limb(start, end, length, bend, w0, w1, end_r):
    c, s = K.noodle(start, end, length, bend)
    spine = I.bezier(start, c, end, 20)
    return unary_union([I.tube(spine, w0, w1), I.circle(end, end_r)]), c, s


def _foot(ankle, toe):
    F = Affine.translate(*ankle) @ Affine.rotate(toe)
    return I.xf_poly(I.ellipse(FOOT_C, FOOT_RX, FOOT_RY), F)


def _ear(H, base, r, back):
    """Round ear hinged at `base` (head space), tilted `back` degrees toward the tail."""
    c = add(base, rot((0.0, -r * 0.8), -back))
    outer = I.xf_poly(I.ellipse(c, r, r * 1.06, -back), H)
    ic = add(c, rot((1.6, 1.4), -back))
    inner = I.xf_poly(I.ellipse(ic, r * 0.56, r * 0.66, -back), H)
    return outer, inner, H(base)


def _sword_parts(hand, deg):
    u = polar(deg)
    v = perp(u)

    def at(a, b):
        return add(hand, add(mul(u, a), mul(v, b)))

    blade = I.Polygon([at(8.6, 2.8), at(BLADE - 2, 2.6), at(SWORD_REACH, 0), at(BLADE - 2, -2.6), at(8.6, -2.8)])
    guard = I.xf_poly(I.ellipse((0, 0), 1.7, 7.4), Affine.translate(*at(7.6, 0)) @ Affine.rotate(deg))
    grip = I.Polygon([at(-10, 2.0), at(7, 2.0), at(7, -2.0), at(-10, -2.0)])
    pommel = I.circle(at(-11.2, 0), 2.6)
    return blade, guard, grip, pommel, (at(12, 0.5), at(BLADE - 4, 0.35))


def _fist(hand, deg):
    """Mitten fist closed round the grip: a rounded box lying along the sword, two finger creases on the
    curled-finger side and the edge of the thumb on the other. The grip shows on both sides of it."""
    M = Affine.translate(*hand) @ Affine.rotate(deg)
    box = I.xf_poly(I.Polygon([(-2.6, -1.9), (2.4, -1.9), (2.4, 1.6), (-2.6, 1.6)]).buffer(3.6, quad_segs=8), M)
    creases = [M.pts([(x, 1.2), (x + 0.3, 5.0)]) for x in (-2.3, 1.0)]
    thumb = M.pts([(-1.8, -2.0), (1.4, -3.4), (4.4, -2.9)])
    return box, creases, thumb


def draw_pose(p, size=CELL):
    """Pose -> (svg_text, info). info carries the numbers QA checks."""
    C = PAL
    ink = I.Ink(size, size, C["ink"], LINE, 1.35)
    T = torso_xf(p)
    H = head_xf(p, T)
    info = {"stretch": {}, "face": H((38.0, -19.0))}     # face: centre for close-ups
    foot_f = p.foot_f or (p.hip[0] + 12, GROUND - SOLE)
    foot_b = p.foot_b or (p.hip[0] - 9, GROUND - SOLE)

    # 1 tail and the scarf ends, behind everything
    spine = K.strand(T(TAIL_ROOT), 166 + p.lean + p.tail_lift, 78, 30, 70 + p.tail_curl, 9, 1.1, p.tail_phase)
    ink.part(I.tube(spine, 6.6, 1.8), C["tail"], C["tail_shade"])
    knot = T(SCARF_KNOT)
    for a0, ln, ph, col in ((142, 23, 0.0, C["scarf_far"]), (122, 19, 0.3, C["scarf"])):
        sp = K.strand(knot, a0 + p.lean + p.scarf_lift, ln, 12, -24, 14, 1.0, p.scarf_phase + ph)
        ink.part(I.tube(sp, 8.0, 5.2), col)

    # 2 far arm and far leg
    sb = T(SHOULDER_B)
    hb = add(sb, p.hand_b)
    arm_b, _, s = _limb(sb, hb, ARM_LEN, p.bend_b, ARM_W, ARM_W * 0.9, HAND_R)
    info["stretch"]["arm_b"] = s
    ink.part(arm_b, C["fur_far"], C["fur_far_shade"])
    legs = {}
    for name, jt, ankle, toe in (("leg_b", HIPJ_B, foot_b, p.toe_b), ("leg_f", HIPJ_F, foot_f, p.toe_f)):
        hj = T(jt)
        c, s = K.noodle(hj, ankle, LEG_LEN, -1.0)       # -1: knees always bow forward
        info["stretch"][name] = s
        info[name] = {"ankle": ankle, "toe": toe, "ctrl": c, "hip": hj}
        legs[name] = unary_union([I.tube(I.bezier(hj, c, ankle, 20), LEG_W, LEG_W * 0.85), _foot(ankle, toe)])
    ink.part(legs["leg_b"], C["fur_far"], C["fur_far_shade"])
    if p.arm_behind:
        _near_arm(ink, p, T, info)
        _sword_and_hand(ink, p, info)

    # 3 far ear, then the one soft body (torso + head + snout melted together)
    ear_b, ear_b_in, _ = _ear(H, (-19.0, -42.0), 13.5, 24 + p.ear_far)
    ink.part(ear_b, C["fur_far"])
    ink.paint(ear_b_in, C["pink_far"])
    head = unary_union([I.xf_poly(g, H) for g in (I.ellipse((-2, -30), 28, 26), I.ellipse((25, -19), 24, 14.5, 8),
                                                   I.ellipse((8, -12), 20, 13))])
    body = I.soften(unary_union([I.xf_poly(I.blob(TORSO), T), I.xf_poly(I.ellipse((-14, -49), 14, 10), T), head]),
                    10.0)
    ink.part(body, C["fur"], C["fur_shade"])

    # 4 face: blush, eye, mouth, brow, whiskers (pen lines belong to the head layer)
    ink.paint(I.xf_poly(I.ellipse((25, -16.5), 6.0, 3.4), H), C["blush"], 0.45)
    _eye(ink, H, p.eyes)
    _mouth(ink, H, p.mouth, body)
    if p.brow == "angry":
        ink.line(H.pts([(13.5, -44.5), (19, -43), (24.5, -40)]), 1.6)
    elif p.brow == "up":
        ink.line(H.pts([(13.5, -42.5), (19, -45), (24.5, -44.5)]), 1.6)

    # near arm: its root tucks under the scarf, so it is drawn before the band
    if not p.arm_behind:
        _near_arm(ink, p, T, info)

    # 5 scarf: a band that wraps the neck (higher at the nape, lower at the throat); the chin stays in front
    band = I.soften(body.buffer(1.6).intersection(_band_strip(T)), 1.5).difference(head.buffer(-1.0))
    ink.part(band, C["scarf"], C["scarf_shade"], shade_off=(0.0, -3.0))
    ink.part(I.circle(knot, 5.4), C["scarf_far"])

    # 6 nose, then the whiskers below it (thick at the root, thin at the tip), near ear
    ink.part(I.xf_poly(I.circle(NOSE, NOSE_R), H), C["pink"], C["pink_far"], shade_off=(1.4, -1.8))
    for root, bend, tip in WHISKERS:
        ink.line(I.bezier(H(root), H(bend), H(tip), 12), 1.15, taper=(False, True))
    ear_f, ear_f_in, ear_base = _ear(H, (-6.0, -45.0), 15.5, 12 + p.ear_near)
    ink.part(ear_f, C["fur"], C["fur_shade"], seams=[(ear_base[0], ear_base[1], 6.5)], shade_off=(2.0, -3.0))
    ink.paint(ear_f_in, C["pink"])

    # 7 near leg (in front of the belly), sword, hand
    hj = info["leg_f"]["hip"]
    ink.part(legs["leg_f"], C["fur"], C["fur_shade"], seams=[(hj[0], hj[1], LEG_W * 0.8)])
    if not p.arm_behind:
        _sword_and_hand(ink, p, info)

    # 8 effects: the sword trail goes behind the body (it never hides the face), dust in front
    under = "".join(fx_markup(fx) for fx in p.fx if fx["kind"] == "swoosh")
    over = "".join(fx_markup(fx) for fx in p.fx if fx["kind"] != "swoosh")
    return ink.svg(over, under), info


def _near_arm(ink, p, T, info):
    C = PAL
    sf = T(SHOULDER_F)
    hf = add(sf, p.hand_f)
    c, s = K.noodle(sf, hf, ARM_LEN, p.bend_f)
    info["stretch"]["arm_f"] = s
    info["hand_f"], info["shoulder_f"], info["elbow_f"] = hf, sf, c
    arm = I.tube(I.bezier(sf, c, hf, 20), ARM_W, ARM_W * 0.9)
    ink.part(arm, C["fur"], C["fur_shade"], seams=[(hf[0], hf[1], HAND_R + 1)], shade_off=(1.6, -2.2))


def _sword_and_hand(ink, p, info):
    C = PAL
    hf, c = info["hand_f"], info["elbow_f"]
    blade, guard, grip, pommel, fuller = _sword_parts(hf, p.sword)
    ink.part(blade, C["blade"], C["blade_shade"], shade_off=(1.2, -1.6))
    ink.line(list(fuller), 0.9)
    for g, col in ((grip, C["grip"]), (pommel, C["guard"]), (guard, C["guard"])):
        ink.part(g, col)
    box, creases, thumb = _fist(hf, p.sword)
    ink.part(box, C["fur"], C["fur_shade"], shade_off=(1.4, -1.8))
    for crease in creases:
        ink.line(crease, 1.15, taper=(True, False))
    ink.line(thumb, 1.1)


def _band_strip(T):
    """Scarf band in torso space: top edge slopes down toward the throat and sags a little."""
    top, bot = [], []
    for i in range(15):
        x = -45 + i * 7.0
        s = min(1.0, max(0.0, (x + 30) / 60.0))
        y = -48.0 + 5.0 * s + 1.5 * math.sin(math.pi * s)
        top.append((x, y))
        bot.append((x, y + 9.5 + 1.0 * s))
    return I.Polygon(T.pts(top + bot[::-1]))


def _eye(ink, H, state):
    C = PAL
    if state == "closed":
        ink.line(H.pts([(14.5, -32.5), (19.0, -30.0), (23.5, -32.5)]), 1.9)
        return
    if state == "squint":
        ink.paint(I.xf_poly(I.ellipse((19.2, -33.0), 4.9, 2.0, 10), H), C["eye"])
        return
    rx, ry = (5.0, 7.4) if state == "wide" else (4.3, 6.6)
    ink.paint(I.xf_poly(I.ellipse((19.0, -33.0), rx, ry, 8), H), C["eye"])
    ink.paint(I.xf_poly(I.circle((20.6, -35.8), 1.7 if state != "wide" else 2.0), H), C["shine"])


def _mouth(ink, H, state, body):
    """Side-view mouth: a line that starts on the underside of the snout and runs back toward the cheek.
    Open shapes are cut inside the muzzle and get their own thin rim."""
    C = PAL
    if state == "smile":
        ink.line(H.pts([(42.0, -7.0), (38.0, -8.4), (34.5, -9.2), (32.3, -11.2)]), 1.5)
        return
    if state == "grit":
        ink.line(H.pts([(42.0, -7.0), (37.5, -8.6), (33.0, -9.0), (31.8, -7.6)]), 1.5)
        return
    inside = body.buffer(-1.2)
    if state in ("open", "yell"):
        big = 1.22 if state == "yell" else 1.0
        hole = I.xf_poly(I.ellipse((37.0, -6.8), 5.6 * big, 3.8 * big, 10), H).intersection(inside)
        tongue = I.xf_poly(I.ellipse((36.2, -4.4), 3.4 * big, 2.2 * big, 10), H).intersection(hole)
    elif state == "o":
        hole, tongue = I.xf_poly(I.ellipse((38.0, -9.4), 2.3, 2.7), H).intersection(inside), None
    else:
        return
    if hole.is_empty:
        return
    ink.paint(hole, C["mouth"])
    if tongue is not None and not tongue.is_empty:
        ink.paint(tongue, C["tongue"])
    for ring in I._lines(hole.boundary):
        ink.line(list(ring.coords), 1.3, taper=False)


# ---------------------------------------------------------------- effects
def swoosh_fx(p, sweep, alpha=0.95, width=20.0):
    """Sword trail ending exactly at this frame's blade tip, centred on the near shoulder."""
    sf = joint(p, SHOULDER_F)
    tip = add(add(sf, p.hand_f), polar(p.sword, SWORD_REACH))
    d = sub(tip, sf)
    a1 = math.degrees(math.atan2(d[1], d[0]))
    return {"kind": "swoosh", "center": sf, "r": math.hypot(*d), "a0": a1 - sweep, "a1": a1,
            "alpha": alpha, "w": width}


def dust_fx(x, y, scale=1.0, alpha=1.0, side=1):
    return {"kind": "dust", "x": x, "y": y, "s": scale, "alpha": alpha, "side": side}


def fx_markup(fx):
    C = PAL
    if fx["kind"] == "swoosh":
        c, r, w = fx["center"], fx["r"], fx["w"]
        outer, inner, n = [], [], 30
        for i in range(n + 1):
            t = i / n
            a = lerp(fx["a0"], fx["a1"], t)
            th = w * math.sin(min(1.0, t * 1.1) * math.pi / 2) ** 1.5
            outer.append(add(c, polar(a, r)))
            inner.append(add(c, polar(a, r - th)))
        op = fx["alpha"]
        return ('<path d="%s" fill="%s" fill-opacity="%.2f" stroke="%s" stroke-width="1.6" '
                'stroke-opacity="%.2f" stroke-linejoin="round"/>'
                % (K.poly(outer + inner[::-1]), C["swoosh"], op * 0.9, C["swoosh_edge"], op))
    if fx["kind"] == "dust":
        s, side = fx["s"], fx["side"]
        puffs = [(0, -6.5, 7.0), (9, -4.5, 5.6), (16, -2.5, 4.0), (-7, -3.5, 5.2)]
        g = unary_union([I.circle((fx["x"] + dx * s * side, fx["y"] + dy * s), r * s) for dx, dy, r in puffs])
        return ('<g opacity="%.2f"><path d="%s" fill="%s" stroke="%s" stroke-width="1.4" stroke-linejoin="round"/></g>'
                % (fx["alpha"], I.path_of(g), C["dust"], C["ink"]))
    return ""


def draw_fx(cv, fx):
    """v1-compatible hook: add an effect to an svgkit Canvas (used by scene composers)."""
    cv.raw(fx_markup(fx))

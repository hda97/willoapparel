"""Ratislav - an original rat swordsman for a side-scroller (he faces right).

Style rules (the model sheet, written as code):
  * flat colours, one even outline weight (LINE), no gradients or shading,
    only a darker tone for the far-side limbs, ear and scarf tail,
  * rubber-hose arms and legs of fixed length (no elbows or knees drawn),
  * round head + long snout, dot eye with one highlight, big round ears,
    buck teeth, pink nose / hands / feet / tail, whiskers,
  * teal tunic with a darker hem, brown belt, red scarf, short sword held in
    the near (front) hand.

Sprite cell: 256 x 256 px, y grows downward, ground line at y = 236.
Anchor for game engines: the ground point under the hip, ANCHOR = (118, 236).
"""
import math
from dataclasses import dataclass, field

from svgkit import (Affine, Canvas, add, catmull, circle_pts, clip_convex, ellipse_pts, lerp, mul,
                    noodle, norm, perp, polar, poly, ribbon, rot, smooth_closed, smooth_open, strand,
                    sub, P)

CELL = 256
GROUND = 236.0
HIP_REST = (118.0, 175.0)
ANCHOR = (118, 236)
LINE = 2.75

LEG_LEN, LEG_W = 58.0, 10.0
ARM_LEN, ARM_W = 40.0, 8.5
HAND_R = 6.2
SWORD_REACH = 64.0          # grip centre -> blade tip

# Foot space: ankle at (0, 0), toes point +x. A flat foot touches the ground
# with its lowest point SOLE px below the ankle.
FOOT = (5.0, 2.6, 11.5, 5.0)   # ellipse cx, cy, rx, ry
SOLE = 7.6
HEEL_PT = (-2.4, 6.4)          # material point the foot rocks on at heel strike
TOE_PT = (14.96, 5.1)          # ... and rolls over at toe-off

PAL = dict(
    ink="#2B2233",
    fur="#BCB5CE", fur_far="#9D95B3", muzzle="#E6E0EE",
    pink="#F6A2B6", pink_far="#DB849B",
    tunic="#35B39A", tunic_hem="#2A9480",
    belt="#7A4A2B", buckle="#F4C542",
    scarf="#F05A3C", scarf_far="#C9462E",
    blade="#E8EFF5", fuller="#B5C6D6", guard="#F4C542", grip="#6B3E26",
    eye="#231B2B", white="#FFFFFF",
    mouth="#8E2E44", tongue="#F27D93", tooth="#FFF9EA", blush="#F58FA8",
    swoosh="#FFFFFF", swoosh_edge="#62BDE6", dust="#F4ECDD",
)

# Torso (tunic) outline in torso space: origin = hip centre, up is negative y.
TORSO = [(10, -50), (17, -42), (22, -28), (25, -10), (26, 4), (24, 11), (12, 15), (0, 16),
         (-12, 15), (-23, 11), (-25, 2), (-23, -16), (-18, -36), (-10, -48)]
NECK = (0.0, -47.0)
SHOULDER_F, SHOULDER_B = (7.0, -37.0), (-3.0, -37.0)
HIPJ_F, HIPJ_B = (5.0, 2.0), (-4.0, 2.0)
TAIL_ROOT = (-21.0, 5.0)
SCARF_KNOT = (-13.0, -45.0)
HEAD_FROM_NECK = (6.0, -34.0)
HEAD_R = 32.0
TEETH = [[(44.6, 21.0), (48.6, 21.3), (48.4, 29.6), (44.8, 29.2)],
         [(48.6, 21.3), (52.6, 21.0), (52.3, 29.0), (48.4, 29.6)]]


@dataclass
class Pose:
    """Every control of the rig. Angles in degrees; offsets in sprite pixels."""
    hip: tuple = HIP_REST          # pelvis centre (the root)
    lean: float = 4.0              # torso rotation, + leans forward
    squash: float = 1.0            # torso stretch along its axis (<1 squash, >1 stretch)
    head_tilt: float = 0.0         # extra head rotation, + nods forward
    head_shift: tuple = (0.0, 0.0)
    ear_near: float = 0.0          # + swings the ear back toward the tail
    ear_far: float = 0.0
    hand_f: tuple = (8.0, 30.0)    # near hand, offset from its shoulder
    hand_b: tuple = (-4.0, 31.0)   # far hand, offset from its shoulder
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
    sword: float = 30.0            # blade direction: 0 forward, -90 up, +90 down
    fx: list = field(default_factory=list)


def torso_xf(p):
    sq = p.squash
    return Affine.translate(*p.hip) @ Affine.rotate(p.lean) @ Affine.scale(1 / math.sqrt(sq), sq)


def joint(p, local):
    """World position of a torso-space point for pose p (used by effects)."""
    return torso_xf(p)(local)


def draw_pose(p, size=CELL):
    """Pose -> (svg_text, info). info carries the numbers QA checks."""
    C = PAL
    cv = Canvas(size, size, C["ink"], LINE)
    T = torso_xf(p)
    info = {"stretch": {}}
    foot_f = p.foot_f or (p.hip[0] + 13, GROUND - SOLE)
    foot_b = p.foot_b or (p.hip[0] - 12, GROUND - SOLE)

    # 1 tail, behind everything
    spine = strand(T(TAIL_ROOT), 162 + p.lean + p.tail_lift, 92, 30, 78 + p.tail_curl, 9, 1.1, p.tail_phase)
    cv.shape(poly(ribbon(spine, 8.5, 2.4)), C["pink"])

    # 2 far arm
    sb = T(SHOULDER_B)
    hb = add(sb, p.hand_b)
    c, s = noodle(sb, hb, ARM_LEN, p.bend_b)
    info["stretch"]["arm_b"] = s
    cv.tube(sb, c, hb, ARM_W, C["fur_far"])
    cv.shape(smooth_closed(circle_pts(hb[0], hb[1], HAND_R, 20)), C["pink_far"])

    # 3-4 legs, far then near; their tops hide under the tunic
    for name, jt, ankle, toe, fur, pink in (("leg_b", HIPJ_B, foot_b, p.toe_b, C["fur_far"], C["pink_far"]),
                                            ("leg_f", HIPJ_F, foot_f, p.toe_f, C["fur"], C["pink"])):
        hj = T(jt)
        c, s = noodle(hj, ankle, LEG_LEN, -1.0)       # -1: knees always bow forward
        info["stretch"][name] = s
        info[name] = {"ankle": ankle, "toe": toe, "ctrl": c, "hip": hj}
        cv.tube(hj, c, ankle, LEG_W, fur)
        F = Affine.translate(*ankle) @ Affine.rotate(toe)
        cv.shape(smooth_closed(F.pts(ellipse_pts(*FOOT, 0, 28))), pink)

    # 5 scarf tails, behind the torso
    knot = T(SCARF_KNOT)
    for a0, ln, ph, col in ((176, 25, 0.0, C["scarf_far"]), (154, 21, 0.3, C["scarf"])):
        sp = strand(knot, a0 + p.lean + p.scarf_lift, ln, 12, -24, 16, 1.0, p.scarf_phase + ph)
        cv.shape(poly(ribbon(sp, 8.5, 5.5)), col)

    # 6 torso: tunic, hem band, belt, buckle
    torso_local = catmull(TORSO, True, 8)
    cv.shape(poly(T.pts(torso_local)), C["tunic"])
    hem = clip_convex(torso_local, [(-40, 9), (40, 9), (40, 40), (-40, 40)])
    if len(hem) > 2:
        cv.shape(poly(T.pts(hem)), C["tunic_hem"])
    belt = clip_convex(torso_local, [(-40, -14), (40, -14), (40, -5), (-40, -5)])
    if len(belt) > 2:
        cv.shape(poly(T.pts(belt)), C["belt"])
    cv.shape(poly(T.pts([(15, -15.5), (22, -15.5), (22, -3.5), (15, -3.5)])), C["buckle"], line=2.2)

    # 7 scarf band + knot: over the torso, under the chin
    band = [(-13, -53), (0, -54.5), (13, -52.5), (16.5, -47), (13, -41.5), (0, -40.5), (-13, -42), (-16.5, -47.5)]
    cv.shape(smooth_closed(T.pts(band)), C["scarf"])
    cv.shape(smooth_closed(circle_pts(knot[0], knot[1], 5.6, 18)), C["scarf_far"])

    # 8-10 head: far ear, head, near ear
    hc = add(add(T(NECK), rot(HEAD_FROM_NECK, p.lean * 0.6)), p.head_shift)
    H = Affine.translate(*hc) @ Affine.rotate(p.lean * 0.35 + p.head_tilt)
    _ear(cv, H, (-19, -21), 15.0, 25 + p.ear_far, C["fur_far"], C["pink_far"])
    _head(cv, H, p)
    _ear(cv, H, (-6, -27), 17.5, 10 + p.ear_near, C["fur"], C["pink"])

    # 11 near arm, sleeve, sword, hand
    sf = T(SHOULDER_F)
    hf = add(sf, p.hand_f)
    c, s = noodle(sf, hf, ARM_LEN, p.bend_f)
    info["stretch"]["arm_f"] = s
    cv.tube(sf, c, hf, ARM_W, C["fur"])
    sd = norm(sub(c, sf))
    sc = add(sf, mul(sd, 2.5))
    cv.shape(smooth_closed(ellipse_pts(sc[0], sc[1], 9.0, 8.0, math.degrees(math.atan2(sd[1], sd[0])), 22)),
             C["tunic"])
    _sword(cv, hf, p.sword)
    cv.shape(smooth_closed(circle_pts(hf[0], hf[1], HAND_R, 20)), C["pink"])
    info["hand_f"], info["shoulder_f"] = hf, sf

    # 12 effects on top
    for fx in p.fx:
        draw_fx(cv, fx)
    return cv.svg(), info


def _ear(cv, H, base, r, back, fur, inner):
    """Round ear hinged at `base` (head space), tilted `back` degrees toward the tail."""
    centre = add(base, rot((0, -(r - 3)), -back))
    inner_c = add(centre, rot((1.8, 1.4), -back))
    cv.shape(smooth_closed(H.pts(circle_pts(centre[0], centre[1], r, 26))), fur)
    cv.fill(smooth_closed(H.pts(circle_pts(inner_c[0], inner_c[1], r * 0.62, 22))), inner)


def _head(cv, H, p):
    C = PAL
    cranium = smooth_closed(H.pts(circle_pts(0, 0, HEAD_R, 30)))
    snout = smooth_closed(H.pts(ellipse_pts(28, 9, 29, 18, 14, 30)))
    cv.group([(cranium, C["fur"]), (snout, C["fur"])])
    cv.fill(smooth_closed(H.pts(ellipse_pts(37, 14, 18, 10, 14, 26))), C["muzzle"])
    cv.fill(smooth_closed(H.pts(ellipse_pts(20, 12, 6.5, 3.8, 0, 18))), C["blush"], 0.55)
    _eye(cv, H, p.eyes)
    _brow(cv, H, p.brow)
    _mouth(cv, H, p.mouth)
    for a, b, c in (((45, 10), (55, 5), (66, 3)), ((46, 13), (57, 12), (69, 13)), ((45, 16), (55, 19.5), (65, 24))):
        cv.stroke(smooth_open(H.pts([a, b, c])), width=1.3)
    nose = H((55.5, 12.5))
    cv.shape(smooth_closed(circle_pts(nose[0], nose[1], 6.3, 18)), C["pink"])
    hl = H((53.8, 10.2))
    cv.fill(smooth_closed(circle_pts(hl[0], hl[1], 1.8, 10)), C["white"], 0.9)


def _eye(cv, H, state):
    C = PAL
    if state == "closed":
        cv.stroke(smooth_open(H.pts([(8, -6), (13, -2.5), (18.5, -6)])), width=2.4)
        return
    rx = 5.0 if state == "wide" else 4.3
    ry = {"wide": 7.6, "squint": 3.4}.get(state, 6.2)
    cy = -4.5 if state == "squint" else -6.0
    cv.fill(smooth_closed(H.pts(ellipse_pts(13, cy, rx, ry, 0, 20))), C["eye"])
    hr = 2.1 if state == "wide" else 1.7
    cv.fill(smooth_closed(H.pts(circle_pts(14.4, cy - ry * 0.42, hr, 10))), C["white"])


def _brow(cv, H, state):
    if state == "angry":
        cv.stroke(smooth_open(H.pts([(5, -18), (12, -16.5), (20, -12.5)])), width=3.0)
    elif state == "up":
        cv.stroke(smooth_open(H.pts([(6, -16), (12, -19.5), (19, -18)])), width=2.6)


def _mouth(cv, H, state):
    C = PAL
    shapes = {
        "open": [(31, 20.5), (38, 22), (45, 21.5), (44, 29), (38, 33.5), (32.5, 28)],
        "yell": [(29.5, 19.5), (38, 21.5), (47, 21), (46, 32), (38, 38.5), (30.5, 30)],
        "o": [(34, 21), (39.5, 21.5), (41.5, 26.5), (38.5, 31), (34, 28.5)],
    }
    if state in shapes:
        cv.shape(smooth_closed(H.pts(shapes[state])), C["mouth"])
        if state != "o":
            tc = (38, 29.0) if state == "open" else (38, 32.5)
            cv.fill(smooth_closed(H.pts(ellipse_pts(tc[0], tc[1], 4.6, 2.9, 0, 16))), C["tongue"])
    elif state == "grit":
        cv.stroke(smooth_open(H.pts([(31, 23), (38, 23.6), (45, 23)])), width=2.3)
    else:
        cv.stroke(smooth_open(H.pts([(30.5, 20.5), (37.5, 25.5), (45, 22)])), width=2.3)
    for tooth in TEETH:
        cv.shape(poly(H.pts(tooth)), C["tooth"], line=1.6)


def _sword(cv, hand, deg):
    C = PAL
    u = polar(deg)
    v = perp(u)

    def at(a, b):
        return add(hand, add(mul(u, a), mul(v, b)))

    cv.shape(poly([at(10, 4.6), at(52, 4.2), at(SWORD_REACH, 0), at(52, -4.2), at(10, -4.6)]), C["blade"])
    cv.stroke("M%sL%s" % (P(at(14, 0)), P(at(49, 0))), C["fuller"], 1.8)
    cv.shape(smooth_closed([at(6, 10.5), at(11, 10.5), at(11, -10.5), at(6, -10.5)]), C["guard"])
    cv.shape(poly([at(-9, 2.8), at(6, 2.8), at(6, -2.8), at(-9, -2.8)]), C["grip"])
    pm = at(-11, 0)
    cv.shape(smooth_closed(circle_pts(pm[0], pm[1], 3.6, 14)), C["guard"])


# ---------------------------------------------------------------- effects
def swoosh_fx(p, sweep, alpha=0.95, width=22.0):
    """Sword trail ending exactly at this frame's blade tip, centred on the near shoulder."""
    sf = joint(p, SHOULDER_F)
    tip = add(add(sf, p.hand_f), polar(p.sword, SWORD_REACH))
    d = sub(tip, sf)
    a1 = math.degrees(math.atan2(d[1], d[0]))
    return {"kind": "swoosh", "center": sf, "r": math.hypot(*d), "a0": a1 - sweep, "a1": a1,
            "alpha": alpha, "w": width}


def dust_fx(x, y, scale=1.0, alpha=1.0, side=1):
    return {"kind": "dust", "x": x, "y": y, "s": scale, "alpha": alpha, "side": side}


def draw_fx(cv, fx):
    C = PAL
    if fx["kind"] == "swoosh":
        c, r, w = fx["center"], fx["r"], fx["w"]
        outer, inner, n = [], [], 28
        for i in range(n + 1):
            t = i / n
            a = lerp(fx["a0"], fx["a1"], t)
            th = w * math.sin(min(1.0, t * 1.1) * math.pi / 2) ** 1.5
            outer.append(add(c, polar(a, r)))
            inner.append(add(c, polar(a, r - th)))
        d = poly(outer + inner[::-1])
        op = fx["alpha"]
        cv.raw('<path d="%s" fill="%s" fill-opacity="%.2f" stroke="%s" stroke-width="2.2" '
               'stroke-opacity="%.2f" stroke-linejoin="round"/>' % (d, C["swoosh"], op, C["swoosh_edge"], op))
    elif fx["kind"] == "dust":
        s, side = fx["s"], fx["side"]
        puffs = [(0, -6.5, 7.5), (9, -4.5, 6.0), (16, -2.5, 4.2), (-7, -3.5, 5.5)]
        items = [(smooth_closed(circle_pts(fx["x"] + dx * s * side, fx["y"] + dy * s, r * s, 16)), C["dust"])
                 for dx, dy, r in puffs]
        cv.group(items, line=2.0, opacity=fx["alpha"])

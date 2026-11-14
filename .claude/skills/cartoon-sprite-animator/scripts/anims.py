"""Ratislav's animations: a procedural walk cycle and pose-to-pose keys.

Every function returns a list of frames: dict(pose, ms, tag, lift)
  ms   - how long the frame is shown (game engines read it from the JSON),
  tag  - animation / sub-state name (jump_start, jump_rise, ...),
  lift - vertical root offset used ONLY by the preview GIFs; the sprite
         sheets stay in place so a game moves the character with physics.
"""
import math

from ratislav import GROUND, HEEL_PT, HIP_REST, SOLE, TOE_PT, Pose, dust_fx, swoosh_fx
from svgkit import ease_in_out, lerp, rot, sub

HX, HY = HIP_REST
FLAT = GROUND - SOLE          # ankle height of a flat, planted foot


def down(deg, r):
    """Offset of length r hanging from a joint, swung `deg` forward (+) or back (-)."""
    a = math.radians(deg)
    return (r * math.sin(a), r * math.cos(a))


# ------------------------------------------------------------------- walk
WALK_FRAMES = 8
STRIDE = 48.0                 # ground travel of a planted foot during its stance
SPEED = 2 * STRIDE            # ground speed in px per cycle (stance = half a cycle)
WALK_STEP_PX = SPEED / WALK_FRAMES
X0 = 24.0                     # flat-ankle x (relative to the hip) at heel strike
QH, QT = 0.06, 0.30           # heel rock ends / toe roll starts (fraction of a cycle)
HEEL_ON, TOE_OFF, LIFT = -14.0, 32.0, 16.0
FAR_FOOT_DX = -5.0            # far leg joins the hip further back


def stance_ankle(q):
    """Foot planted (q in 0..0.5). Every planted point moves exactly with the
    ground, so the foot cannot slide: heel rock -> flat -> roll over the toes."""
    ax = HX + X0 - SPEED * q
    if q < QH:
        a = HEEL_ON * (1 - q / QH)
        pivot = (ax + HEEL_PT[0], FLAT + HEEL_PT[1])
        return sub(pivot, rot(HEEL_PT, a)), a
    if q > QT:
        a = TOE_OFF * ((q - QT) / (0.5 - QT)) ** 1.3
        pivot = (ax + TOE_PT[0], FLAT + TOE_PT[1])
        return sub(pivot, rot(TOE_PT, a)), a
    return (ax, FLAT), 0.0


def walk_foot(q, dx=0.0):
    """dx shifts the whole footfall line (the far leg plants a little further back)."""
    q %= 1.0
    if q <= 0.5:
        (x, y), a = stance_ankle(q)
        return (x + dx, y), a
    t = (q - 0.5) / 0.5               # swing: lift off behind, arc forward, heel strike in front
    (a0, ang0), (a1, ang1) = stance_ankle(0.5), stance_ankle(0.0)
    x = lerp(a0[0], a1[0], ease_in_out(t))
    y = lerp(a0[1], a1[1], t) - LIFT * math.sin(math.pi * t)
    return (x + dx, y), lerp(ang0, ang1, ease_in_out(t))


def walk_pose(p):
    """p = cycle phase 0..1; p and p+1 give the identical pose (seamless loop)."""
    w2 = math.cos(4 * math.pi * (p - 0.1))        # +1 at the two "down" keys
    ff, af = walk_foot(p)
    fb, ab = walk_foot(p + 0.5, FAR_FOOT_DX)
    arm_f = 8 - 24 * math.cos(2 * math.pi * p)     # near arm swings against the near leg
    arm_b = 6 + 26 * math.cos(2 * math.pi * p)
    return Pose(
        hip=(HX, HY - 1.5 + 3.5 * w2), lean=6 + 1.5 * w2, squash=1 - 0.03 * w2,
        head_tilt=3.0 * math.sin(4 * math.pi * (p - 0.15)),
        ear_near=5 * math.cos(4 * math.pi * (p - 0.2)), ear_far=5 * math.cos(4 * math.pi * (p - 0.25)),
        hand_f=down(arm_f, 33), hand_b=down(arm_b, 32),
        foot_f=ff, toe_f=af, foot_b=fb, toe_b=ab,
        tail_phase=p, tail_lift=3 * math.sin(4 * math.pi * p), scarf_phase=2 * p,
        sword=28 + 0.6 * arm_f)


def walk():
    return [dict(pose=walk_pose(i / WALK_FRAMES), ms=83, tag="walk", lift=0) for i in range(WALK_FRAMES)]


# ------------------------------------------------------------------- idle
IDLE_FRAMES = 8
STANCE_F, STANCE_B = (HX + 16, FLAT), (HX - 13, FLAT)


def idle_pose(i):
    p = i / IDLE_FRAMES
    b = math.sin(2 * math.pi * p)                 # breathing
    twitch = {4: 14, 5: 6}.get(i % IDLE_FRAMES, 0)
    return Pose(
        hip=HIP_REST, lean=3, squash=1 + 0.02 * b,
        ear_near=3 * b + twitch, ear_far=3 * math.sin(2 * math.pi * (p - 0.1)),
        hand_f=down(18 + 2 * b, 31), hand_b=down(-6 - 2 * b, 32),
        foot_f=STANCE_F, foot_b=STANCE_B,
        tail_phase=p, scarf_phase=p, sword=40 + 3 * b,
        eyes="closed" if i % IDLE_FRAMES == 6 else "open")


def idle():
    return [dict(pose=idle_pose(i), ms=150, tag="idle", lift=0) for i in range(IDLE_FRAMES)]


# ------------------------------------------------------------------- jump
def jump():
    def k(ms, tag, lift, **kw):
        return dict(pose=Pose(**kw), ms=ms, tag=tag, lift=lift)

    return [
        k(70, "jump_start", 0, hip=(HX, HY + 6), lean=10, squash=0.95, head_tilt=4, ear_near=6, ear_far=6,
          hand_f=down(-30, 31), hand_b=down(-38, 31), sword=135, foot_f=STANCE_F, foot_b=STANCE_B,
          tail_lift=-4, mouth="grit", brow="angry"),
        k(90, "jump_start", 0, hip=(HX + 2, HY + 17), lean=18, squash=0.86, head_tilt=8, ear_near=14, ear_far=14,
          hand_f=down(-75, 32), hand_b=down(-85, 31), sword=165, foot_f=STANCE_F, foot_b=STANCE_B,
          tail_lift=-10, eyes="squint", mouth="grit", brow="angry"),
        k(60, "jump_start", -16, hip=(HX, HY - 8), lean=2, squash=1.12, head_tilt=-6, ear_near=26, ear_far=24,
          hand_f=(22, 10), hand_b=(-30, -24), sword=10,
          foot_f=(HX + 8, HY - 8 + 54), toe_f=50, foot_b=(HX - 6, HY - 8 + 53), toe_b=46,
          tail_lift=26, scarf_lift=24, eyes="wide", mouth="open"),
        k(70, "jump_rise", -62, hip=(HX, HY - 5), lean=0, squash=1.06, head_tilt=-4, ear_near=16, ear_far=16,
          hand_f=(25, 4), hand_b=(-32, -20), sword=0,
          foot_f=(HX + 14, HY - 5 + 45), toe_f=34, foot_b=(HX, HY - 5 + 48), toe_b=30,
          tail_lift=16, scarf_lift=14, mouth="open"),
        k(80, "jump_rise", -90, hip=(HX, HY - 3), lean=-2, head_tilt=-2, ear_near=2, ear_far=4,
          hand_f=(27, 6), hand_b=(-30, -20), sword=-6,
          foot_f=(HX + 19, HY - 3 + 32), toe_f=12, foot_b=(HX + 5, HY - 3 + 36), toe_b=14,
          tail_lift=4, tail_curl=18, mouth="open"),
        k(130, "jump_apex", -98, hip=(HX, HY - 3), lean=-3, squash=0.98, ear_near=-8, ear_far=-6,
          hand_f=(28, 8), hand_b=(-32, -14), sword=0,
          foot_f=(HX + 21, HY - 3 + 28), toe_f=6, foot_b=(HX + 7, HY - 3 + 32), toe_b=8,
          tail_lift=-6, tail_curl=40, scarf_lift=-8, eyes="wide", mouth="open"),
        k(80, "jump_fall", -52, hip=(HX, HY - 4), lean=2, squash=1.04, head_tilt=3, ear_near=-20, ear_far=-18,
          hand_f=(24, -4), hand_b=(-30, -24), sword=-14,
          foot_f=(HX + 11, HY - 4 + 49), toe_f=-6, foot_b=(HX - 5, HY - 4 + 51), toe_b=-4,
          tail_lift=-22, scarf_lift=-26, eyes="wide", mouth="o"),
        k(90, "jump_land", 0, hip=(HX + 2, HY + 18), lean=14, squash=0.85, head_tilt=7, ear_near=-14, ear_far=-12,
          hand_f=down(52, 26), hand_b=down(-40, 28), sword=22, foot_f=STANCE_F, foot_b=STANCE_B,
          tail_lift=-6, eyes="squint", mouth="grit",
          fx=[dust_fx(HX + 26, GROUND, 1.0, 1.0, 1), dust_fx(HX - 24, GROUND, 0.9, 1.0, -1)]),
        k(110, "jump_land", 0, hip=(HX + 1, HY + 4), lean=6, squash=0.97, head_tilt=1, ear_near=8, ear_far=8,
          hand_f=down(16, 31), hand_b=down(-8, 32), sword=36, foot_f=STANCE_F, foot_b=STANCE_B,
          fx=[dust_fx(HX + 34, GROUND, 1.3, 0.45, 1), dust_fx(HX - 32, GROUND, 1.2, 0.45, -1)]),
    ]


# ----------------------------------------------------------------- attack
def attack():
    ff, fb = STANCE_F, STANCE_B          # same stance as idle: no pop when switching
    frames = []

    def k(ms, sweep=None, alpha=0.95, width=22.0, **kw):
        kw.setdefault("foot_f", ff)
        kw.setdefault("foot_b", fb)
        kw.setdefault("brow", "angry")
        pose = Pose(**kw)
        if sweep:
            pose.fx = [swoosh_fx(pose, sweep, alpha, width)]
        frames.append(dict(pose=pose, ms=ms, tag="attack", lift=0))

    k(80, hip=(HX, HY + 3), lean=6, squash=0.98, hand_f=(12, 24), hand_b=(-8, 26), sword=20, mouth="grit")
    k(70, hip=(HX - 4, HY + 4), lean=-8, squash=1.02, head_tilt=-4, ear_near=10, ear_far=10,
      hand_f=(-14, -30), hand_b=(30, 0), sword=-140, eyes="squint", mouth="grit")
    k(110, hip=(HX - 6, HY + 5), lean=-12, squash=0.97, head_tilt=-6, ear_near=14, ear_far=14,
      hand_f=(-18, -33), hand_b=(31, -3), sword=-162, eyes="squint", mouth="grit", tail_lift=-6)
    k(50, sweep=100, hip=(HX + 4, HY + 4), lean=14, head_tilt=2, ear_near=12, ear_far=14,
      hand_f=(22, -24), hand_b=(-22, 6), sword=-40, eyes="squint", mouth="yell")
    k(60, sweep=150, hip=(HX + 8, HY + 6), lean=22, squash=0.95, head_tilt=5, ear_near=18, ear_far=18,
      hand_f=(28, 10), hand_b=(-30, 2), sword=35, eyes="squint", mouth="yell", tail_lift=8)
    k(110, sweep=70, alpha=0.4, width=14.0, hip=(HX + 8, HY + 7), lean=20, squash=0.95, head_tilt=4,
      ear_near=8, ear_far=10, hand_f=(24, 22), hand_b=(-30, 6), sword=62, mouth="grit")
    k(80, hip=(HX + 4, HY + 5), lean=12, squash=0.98, ear_near=2, hand_f=(16, 22), hand_b=(-14, 20), sword=40,
      mouth="smile", brow="")
    k(80, hip=(HX + 1, HY + 3), lean=7, hand_f=(12, 24), hand_b=(-9, 25), sword=24, mouth="smile", brow="")
    return frames


ANIMATIONS = [("idle", idle), ("walk", walk), ("jump", jump), ("attack", attack)]

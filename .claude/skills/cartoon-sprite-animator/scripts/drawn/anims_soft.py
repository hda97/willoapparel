"""Ratislav's animations for the soft storybook body (shorter legs, arms tucked under the scarf).

Same structure as v1: every function returns a list of frames dict(pose, ms, tag, lift)
  ms   - how long the frame is shown (game engines read it from the JSON),
  tag  - animation / sub-state name (jump_start, jump_rise, ...),
  lift - vertical root offset used ONLY by the preview GIFs; the sprite
         sheets stay in place so a game moves the character with physics.
"""
import math

from ratislav_soft import GROUND, HEEL_PT, HIP_REST, SOLE, TOE_PT, Pose, dust_fx, swoosh_fx
from svgkit import ease_in_out, lerp, rot, sub

HX, HY = HIP_REST
FLAT = GROUND - SOLE          # ankle height of a flat, planted foot
REACH = 25.0                  # relaxed hand distance from the shoulder (arm length is 29)


def down(deg, r=REACH):
    """Offset of length r hanging from a joint, swung `deg` forward (+) or back (-)."""
    a = math.radians(deg)
    return (r * math.sin(a), r * math.cos(a))


# ------------------------------------------------------------------- walk
WALK_FRAMES = 8
STRIDE = 24.0                 # ground travel of a planted foot during its stance
SPEED = 2 * STRIDE            # ground speed in px per cycle (stance = half a cycle)
WALK_STEP_PX = SPEED / WALK_FRAMES
X0 = 13.0                     # flat-ankle x (relative to the hip) at heel strike
QH, QT = 0.06, 0.30           # heel rock ends / toe roll starts (fraction of a cycle)
HEEL_ON, TOE_OFF, LIFT = -14.0, 30.0, 8.0
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
    arm_f = 10 - 24 * math.cos(2 * math.pi * p)    # near arm swings against the near leg
    arm_b = 6 + 24 * math.cos(2 * math.pi * p)
    return Pose(
        hip=(HX, HY - 0.5 + 1.5 * w2), lean=5 + 1.5 * w2, squash=1 - 0.025 * w2,
        head_tilt=2.5 * math.sin(4 * math.pi * (p - 0.15)),
        ear_near=5 * math.cos(4 * math.pi * (p - 0.2)), ear_far=5 * math.cos(4 * math.pi * (p - 0.25)),
        hand_f=down(arm_f), hand_b=down(arm_b),
        foot_f=ff, toe_f=af, foot_b=fb, toe_b=ab,
        tail_phase=p, tail_lift=3 * math.sin(4 * math.pi * p), scarf_phase=2 * p, scarf_lift=8,
        sword=34 + 0.5 * arm_f)


def walk():
    return [dict(pose=walk_pose(i / WALK_FRAMES), ms=83, tag="walk", lift=0) for i in range(WALK_FRAMES)]


# ------------------------------------------------------------------- idle
IDLE_FRAMES = 8
STANCE_F, STANCE_B = (HX + 11, FLAT), (HX - 8, FLAT)


def idle_pose(i):
    p = i / IDLE_FRAMES
    b = math.sin(2 * math.pi * p)                 # breathing
    twitch = {4: 14, 5: 6}.get(i % IDLE_FRAMES, 0)
    return Pose(
        hip=HIP_REST, lean=2, squash=1 + 0.02 * b,
        ear_near=3 * b + twitch, ear_far=3 * math.sin(2 * math.pi * (p - 0.1)),
        hand_f=down(14 + 2 * b), hand_b=down(-6 - 2 * b),
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
        k(70, "jump_start", 0, hip=(HX, HY + 3), lean=10, squash=0.95, head_tilt=4, ear_near=6, ear_far=6,
          hand_f=down(-30, 24), hand_b=down(-38, 24), sword=135, foot_f=STANCE_F, foot_b=STANCE_B,
          tail_lift=-4, scarf_lift=4, mouth="grit", brow="angry"),
        k(90, "jump_start", 0, hip=(HX + 2, HY + 7), lean=18, squash=0.86, head_tilt=8, ear_near=14, ear_far=14,
          hand_f=down(-75, 25), hand_b=down(-85, 24), sword=165, foot_f=STANCE_F, foot_b=STANCE_B,
          tail_lift=-10, scarf_lift=8, eyes="squint", mouth="grit", brow="angry"),
        k(60, "jump_start", -13, hip=(HX, HY - 6), lean=2, squash=1.12, head_tilt=-6, ear_near=26, ear_far=24,
          hand_f=(20, 6), hand_b=(-22, -16), sword=10,
          foot_f=(HX + 6, HY - 6 + 27.5), toe_f=50, foot_b=(HX - 4, HY - 6 + 27), toe_b=46,
          tail_lift=-20, scarf_lift=-22, eyes="wide", mouth="open"),
        k(70, "jump_rise", -50, hip=(HX, HY - 4), lean=0, squash=1.06, head_tilt=-4, ear_near=16, ear_far=16,
          hand_f=(22, 2), hand_b=(-24, -15), sword=0,
          foot_f=(HX + 10, HY - 4 + 22), toe_f=34, foot_b=(HX, HY - 4 + 24), toe_b=30,
          tail_lift=-12, scarf_lift=-14, mouth="open"),
        k(80, "jump_rise", -72, hip=(HX, HY - 3), lean=-2, head_tilt=-2, ear_near=2, ear_far=4,
          hand_f=(23, 4), hand_b=(-24, -14), sword=-6,
          foot_f=(HX + 14, HY - 3 + 16), toe_f=12, foot_b=(HX + 4, HY - 3 + 19), toe_b=14,
          tail_lift=-2, tail_curl=18, scarf_lift=-4, mouth="open"),
        k(130, "jump_apex", -78, hip=(HX, HY - 3), lean=-3, squash=0.98, ear_near=-8, ear_far=-6,
          hand_f=(24, 6), hand_b=(-24, -11), sword=0,
          foot_f=(HX + 15, HY - 3 + 14), toe_f=6, foot_b=(HX + 5, HY - 3 + 17), toe_b=8,
          tail_lift=6, tail_curl=34, scarf_lift=6, eyes="wide", mouth="open"),
        k(80, "jump_fall", -42, hip=(HX, HY - 4), lean=2, squash=1.04, head_tilt=3, ear_near=-20, ear_far=-18,
          hand_f=(21, 6), hand_b=(-21, -18), sword=10,
          foot_f=(HX + 8, HY - 4 + 25), toe_f=-6, foot_b=(HX - 4, HY - 4 + 26), toe_b=-4,
          tail_lift=22, scarf_lift=30, eyes="wide", mouth="o"),
        k(90, "jump_land", 0, hip=(HX + 2, HY + 7), lean=14, squash=0.85, head_tilt=7, ear_near=-14, ear_far=-12,
          hand_f=down(52, 22), hand_b=down(-40, 22), sword=22, foot_f=STANCE_F, foot_b=STANCE_B,
          tail_lift=8, scarf_lift=12, eyes="squint", mouth="grit",
          fx=[dust_fx(HX + 22, GROUND, 0.85, 1.0, 1), dust_fx(HX - 20, GROUND, 0.8, 1.0, -1)]),
        k(110, "jump_land", 0, hip=(HX + 1, HY + 2), lean=6, squash=0.97, head_tilt=1, ear_near=8, ear_far=8,
          hand_f=down(16), hand_b=down(-8), sword=36, foot_f=STANCE_F, foot_b=STANCE_B, scarf_lift=4,
          fx=[dust_fx(HX + 29, GROUND, 1.1, 0.45, 1), dust_fx(HX - 27, GROUND, 1.0, 0.45, -1)]),
    ]


# ----------------------------------------------------------------- attack
def attack():
    ff, fb = STANCE_F, STANCE_B          # same stance as idle: no pop when switching
    frames = []

    def k(ms, sweep=None, alpha=0.95, width=16.0, **kw):
        kw.setdefault("foot_f", ff)
        kw.setdefault("foot_b", fb)
        kw.setdefault("brow", "angry")
        pose = Pose(**kw)
        if sweep:
            pose.fx = [swoosh_fx(pose, sweep, alpha, width)]
        frames.append(dict(pose=pose, ms=ms, tag="attack", lift=0))

    k(80, hip=(HX, HY + 2), lean=6, squash=0.98, hand_f=(10, 22), hand_b=(-7, 23), sword=20, mouth="grit")
    # wind-up: the sword hand goes behind the head, only the blade shows above the ears
    k(70, hip=(HX - 3, HY + 3), lean=-8, squash=1.02, head_tilt=-4, ear_near=10, ear_far=10, arm_behind=True,
      hand_f=(-17, -12), hand_b=(24, 0), sword=-158, eyes="squint", mouth="grit")
    k(110, hip=(HX - 4, HY + 4), lean=-12, squash=0.97, head_tilt=-6, ear_near=14, ear_far=14, arm_behind=True,
      hand_f=(-19, -13), hand_b=(25, -3), sword=-168, eyes="squint", mouth="grit", tail_lift=-6)
    # the strike passes in front of the chest, never across the face
    k(50, sweep=120, hip=(HX + 3, HY + 3), lean=14, head_tilt=2, ear_near=12, ear_far=14,
      hand_f=(22, 2), hand_b=(-19, 5), sword=4, eyes="squint", mouth="yell")
    k(60, sweep=150, hip=(HX + 6, HY + 4), lean=22, squash=0.95, head_tilt=5, ear_near=18, ear_far=18,
      hand_f=(25, 8), hand_b=(-24, 2), sword=35, eyes="squint", mouth="yell", tail_lift=8)
    k(110, sweep=70, alpha=0.4, width=11.0, hip=(HX + 6, HY + 5), lean=20, squash=0.95, head_tilt=4,
      ear_near=8, ear_far=10, hand_f=(20, 17), hand_b=(-24, 5), sword=62, mouth="grit")
    k(80, hip=(HX + 3, HY + 4), lean=12, squash=0.98, ear_near=2, hand_f=(14, 19), hand_b=(-12, 18), sword=40,
      mouth="smile", brow="")
    k(80, hip=(HX + 1, HY + 2), lean=7, hand_f=(10, 22), hand_b=(-8, 22), sword=24, mouth="smile", brow="")
    return frames


ANIMATIONS = [("idle", idle), ("walk", walk), ("jump", jump), ("attack", attack)]

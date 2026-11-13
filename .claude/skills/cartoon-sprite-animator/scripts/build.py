"""Build every deliverable for Ratislav from the rig.

    python3 rig/build.py

Writes into ../out:
  ratislav_atlas.png / .json (+ @2x)  - all frames + Aseprite-style JSON (durations, tags, anchor)
  strips/ratislav_<anim>.png (+ @2x)   - one horizontal strip per animation
  gif/ratislav_<anim>.gif, showreel    - previews in a little scene
  svg/<anim>/*.svg                     - vector source of every frame
  model_sheet.png, rig.json            - character bible and rig manifest
  qa/contact_<anim>.png, qa/report.txt - checks: limb length, foot slide, loop seams
"""
import json
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import anims as A  # noqa: E402
import ratislav as R  # noqa: E402
import svgkit as K  # noqa: E402

OUT = os.path.join(os.path.dirname(HERE), "out")
ATLAS_COLS = 6
SKY, CLOUD, HILL_BACK, HILL_FRONT = "#BDE8F6", "#FFFFFF", "#F2C3DA", "#A9E2B4"
GRASS, GRASS_DARK, SOIL, SOIL_DARK = "#86CF66", "#5FAE4A", "#E3B47D", "#C9955E"


FONT_FILES = {   # first file found wins: macOS, then Windows, then Linux
    True: ("/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf", "C:/Windows/Fonts/arialbd.ttf",
           "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    False: ("/System/Library/Fonts/Avenir Next.ttc", "/System/Library/Fonts/Helvetica.ttc",
            "C:/Windows/Fonts/arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
}


def font(size, bold=False):
    for path in (FONT_FILES[True] if bold else ()) + FONT_FILES[False]:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size)   # Pillow 10.1+ scales its built-in font
    except TypeError:
        return ImageFont.load_default()


# ------------------------------------------------------------ rendering
def render_frames():
    data = []
    for name, fn in A.ANIMATIONS:
        frames = fn()
        for fr in frames:
            fr["svg"], fr["info"] = R.draw_pose(fr["pose"])
            fr["img"] = {1: K.rasterize(fr["svg"], 1.0), 2: K.rasterize(fr["svg"], 2.0)}
        data.append((name, frames))
    return data


def export_sprites(data):
    os.makedirs(os.path.join(OUT, "strips"), exist_ok=True)
    for name, frames in data:
        d = os.path.join(OUT, "svg", name)
        os.makedirs(d, exist_ok=True)
        for i, fr in enumerate(frames):
            with open(os.path.join(d, "ratislav_%s_%02d.svg" % (name, i)), "w") as f:
                f.write(fr["svg"])
        for s, suffix in ((1, ""), (2, "@2x")):
            K.strip([fr["img"][s] for fr in frames]).save(
                os.path.join(OUT, "strips", "ratislav_%s%s.png" % (name, suffix)), optimize=True)
    for s, suffix in ((1, ""), (2, "@2x")):
        cell = R.CELL * s
        flat = [(name, i, fr) for name, frames in data for i, fr in enumerate(frames)]
        image = "ratislav_atlas%s.png" % suffix
        K.strip([fr["img"][s] for _, _, fr in flat], ATLAS_COLS).save(os.path.join(OUT, image), optimize=True)
        meta_frames, tags, idx = {}, [], 0
        for name, frames in data:
            tags.append({"name": name, "from": idx, "to": idx + len(frames) - 1, "direction": "forward"})
            sub_start = idx
            for i, fr in enumerate(frames):
                x, y = (idx % ATLAS_COLS) * cell, (idx // ATLAS_COLS) * cell
                meta_frames["%s_%02d" % (name, i)] = {
                    "frame": {"x": x, "y": y, "w": cell, "h": cell}, "rotated": False, "trimmed": False,
                    "spriteSourceSize": {"x": 0, "y": 0, "w": cell, "h": cell},
                    "sourceSize": {"w": cell, "h": cell}, "duration": fr["ms"]}
                nxt = frames[i + 1]["tag"] if i + 1 < len(frames) else None
                if fr["tag"] != name and nxt != fr["tag"]:
                    tags.append({"name": fr["tag"], "from": sub_start, "to": idx, "direction": "forward"})
                if nxt != fr["tag"]:
                    sub_start = idx + 1
                idx += 1
        rows = (idx + ATLAS_COLS - 1) // ATLAS_COLS
        meta = {"app": "krysak-animace rig (svgkit)", "version": "1.0", "image": image, "format": "RGBA8888",
                "size": {"w": ATLAS_COLS * cell, "h": rows * cell}, "scale": str(s), "frameTags": tags,
                "anchor": {"x": R.ANCHOR[0] * s, "y": R.ANCHOR[1] * s,
                           "note": "ground point under the hip; place this on the floor"},
                "loops": {"idle": True, "walk": True, "jump": False, "attack": False},
                "walk_speed_px_per_s": round(A.SPEED * s / (A.WALK_FRAMES * 0.083), 1)}
        with open(os.path.join(OUT, image.replace(".png", ".json")), "w") as f:
            json.dump({"frames": meta_frames, "meta": meta}, f, indent=1)


# --------------------------------------------------------------- scenes
def _tuft(cv, x, y):
    cv.stroke(K.smooth_open([(x - 6, y - 1), (x - 4, y - 8), (x - 1, y - 1)]), GRASS_DARK, 2.2)
    cv.stroke(K.smooth_open([(x - 1, y - 1), (x + 2, y - 10), (x + 4, y - 1)]), GRASS_DARK, 2.2)


def _flower(cv, x, y, col):
    cv.stroke("M%sL%s" % (K.P((x, y)), K.P((x, y - 9))), GRASS_DARK, 2.0)
    for k in range(5):
        c = K.add((x, y - 11), K.polar(k * 72 - 90, 3.4))
        cv.shape(K.smooth_closed(K.circle_pts(c[0], c[1], 2.6, 10)), col, line=1.3)
    cv.shape(K.smooth_closed(K.circle_pts(x, y - 11, 2.2, 10)), "#FFE27A", line=1.3)


def _dummy(cv, x, ground, tilt):
    """Straw training dummy on a post; tilts away when hit."""
    M = K.Affine.translate(x, ground) @ K.Affine.rotate(tilt)
    cv.shape(K.poly(M.pts([(-4, 0), (4, 0), (4, -46), (-4, -46)])), "#9A6A3F")
    cv.shape(K.poly(M.pts([(-16, -30), (16, -30), (16, -24), (-16, -24)])), "#9A6A3F")
    cv.shape(K.smooth_closed(M.pts(K.ellipse_pts(0, -62, 19, 22, 0, 28))), "#EDD593")
    cv.stroke(K.poly(M.pts([(-18, -52), (18, -52)]), False), "#B8873F", 2.4)
    for ex in (-7, 6):
        cv.stroke(K.poly(M.pts([(ex - 3, -70), (ex + 3, -64)]), False), width=2.2)
        cv.stroke(K.poly(M.pts([(ex - 3, -64), (ex + 3, -70)]), False), width=2.2)


def scene_svg(w, h, ground, scroll=0.0, dummy=None, world_fx=(), shadow=None, layers=("sky", "ground")):
    """The little world behind the previews. The ground pattern repeats every
    96 px, exactly one walk cycle of scrolling, so looping GIFs have no seam."""
    cv = K.Canvas(w, h, R.PAL["ink"], 2.5)
    if "sky" in layers:
        cv.fill("M0,0H%dV%dH0Z" % (w, h), SKY)
        for cx, cy, s in ((0.18, 0.16, 1.0), (0.72, 0.1, 0.8), (0.95, 0.3, 0.6)):
            x, y = cx * w, cy * h
            items = [(K.smooth_closed(K.circle_pts(x + dx * s, y + dy * s, r * s, 18)), CLOUD)
                     for dx, dy, r in ((-16, 4, 12), (0, -4, 16), (17, 3, 12), (4, 8, 11))]
            cv.group(items, line=2.2)
        for hx, ry, col in ((0.15, 70, HILL_BACK), (0.62, 88, HILL_BACK), (0.4, 52, HILL_FRONT),
                            (0.92, 60, HILL_FRONT)):
            cv.shape(K.smooth_closed(K.ellipse_pts(hx * w, ground, ry * 1.35, ry, 0, 40)), col, line=2.2)
    if "ground" in layers:
        cv.shape("M-5,%sH%dV%dH-5Z" % (K.f2(ground), w + 5, h + 5), GRASS, line=2.5)
        cv.shape("M-5,%sH%dV%dH-5Z" % (K.f2(ground + 12), w + 5, h + 5), SOIL, line=2.5)
        period = 96.0
        off = scroll % period
        for k in range(-1, int(w // period) + 2):
            bx = k * period - off
            _tuft(cv, bx + 10, ground + 1)
            _flower(cv, bx + 30, ground + 2, "#FFFFFF")
            _flower(cv, bx + 58, ground + 2, "#F7A8C4")
            _tuft(cv, bx + 74, ground + 1)
            for px, py, r in ((bx + 40, ground + 18, 2.6), (bx + 84, ground + 22, 2.0)):
                cv.fill(K.smooth_closed(K.circle_pts(px, py, r, 10)), SOIL_DARK)
    if dummy:
        _dummy(cv, dummy[0], ground, dummy[1])
    if shadow:
        x, k = shadow
        cv.fill(K.smooth_closed(K.ellipse_pts(x, ground + 1, 30 * k, 5 * k, 0, 24)), "#2B2233", 0.16)
    for fx in world_fx:
        R.draw_fx(cv, fx)
    return cv.svg()


def compose(seq, w, h, ground, char_x, scale, name):
    """seq: list of dict(fr, scroll, dummy, world_fx). Writes gif/<name>.gif."""
    images, durs, bg_cache = [], [], {}
    for item in seq:
        fr = item["fr"]
        lift = fr["lift"]
        k = max(0.4, 1 - abs(lift) / 160.0)
        key = (item.get("scroll", 0.0), item.get("dummy"), lift, len(item.get("world_fx", ())),
               tuple(f.get("alpha", 1) for f in item.get("world_fx", ())))
        if key not in bg_cache:
            svg = scene_svg(w, h, ground, item.get("scroll", 0.0), item.get("dummy"), item.get("world_fx", ()),
                            (char_x + R.HIP_REST[0], k))
            bg_cache[key] = K.rasterize(svg, scale)
        im = bg_cache[key].copy()
        cell = fr["img"][2] if scale > 1 else fr["img"][1]
        if cell.size[0] != int(R.CELL * scale):
            cell = cell.resize((int(R.CELL * scale), int(R.CELL * scale)), Image.LANCZOS)
        im.alpha_composite(cell, (int(char_x * scale), int((ground - R.GROUND + lift) * scale)))
        images.append(im)
        durs.append(fr["ms"])
    os.makedirs(os.path.join(OUT, "gif"), exist_ok=True)
    path = os.path.join(OUT, "gif", "ratislav_%s.gif" % name)
    K.save_gif(images, durs, path)
    return path


def export_gifs(data):
    d = dict(data)
    idle, walk, jump, attack = d["idle"], d["walk"], d["jump"], d["attack"]
    step = A.WALK_STEP_PX
    compose([{"fr": f} for f in idle], 256, 256, R.GROUND, 0, 2, "idle")
    compose([{"fr": f, "scroll": i * step} for i, f in enumerate(walk)], 384, 256, R.GROUND, 74, 2, "walk")
    takeoff = {2: [R.dust_fx(140, 340, 0.8, 1.0, 1), R.dust_fx(96, 340, 0.7, 1.0, -1)],
               3: [R.dust_fx(146, 340, 1.1, 0.5, 1), R.dust_fx(90, 340, 1.0, 0.5, -1)]}
    seq = [{"fr": f} for f in idle[:4]] + [{"fr": f, "world_fx": takeoff.get(i, ())} for i, f in enumerate(jump)]
    compose(seq + [{"fr": f} for f in idle[4:]], 256, 360, 340, 0, 2, "jump")
    hits = {4: 14, 5: 8, 6: -4}                       # dummy tilt when the blade connects
    seq = [{"fr": f, "dummy": (252, hits.get(i, 0))} for i, f in enumerate(attack)]
    seq += [{"fr": f, "dummy": (252, 0)} for f in idle[:4]]
    compose(seq, 320, 256, R.GROUND, 12, 2, "attack")
    # showreel: idle, walk in (the dummy scrolls in with the ground), jump, attack
    walked = 3 * len(walk) * step
    dummy_x = 310
    reel = [{"fr": f, "dummy": (dummy_x + walked, 0)} for f in idle]
    reel += [{"fr": f, "scroll": (i + 1) * step, "dummy": (dummy_x + walked - (i + 1) * step, 0)}
             for i, f in enumerate(walk * 3)]
    rest = {"scroll": walked, "dummy": (dummy_x, 0)}
    reel += [dict(rest, fr=f) for f in idle[:4]]
    reel += [dict(rest, fr=f, world_fx=[R.dust_fx(fx["x"] + 70, 280 + fx["y"] - 340, fx["s"], fx["alpha"],
                                                  fx["side"]) for fx in takeoff.get(i, ())])
             for i, f in enumerate(jump)]
    reel += [dict(rest, fr=f) for f in idle[:4]]
    reel += [dict(rest, fr=f, dummy=(dummy_x, hits.get(i, 0))) for i, f in enumerate(attack)]
    reel += [dict(rest, fr=f) for f in idle[4:]]
    compose(reel, 448, 300, 280, 70, 1.5, "showreel")


# ------------------------------------------------------------------- QA
def _material(leg, local):
    return K.add(leg["ankle"], K.rot(local, leg["toe"]))


def run_qa(data):
    os.makedirs(os.path.join(OUT, "qa"), exist_ok=True)
    lines = ["Ratislav - QA report", "=" * 40]
    ok = True
    for name, frames in data:
        worst = max(max(fr["info"]["stretch"].values()) for fr in frames)
        lines.append("%-7s %2d frames, %4d ms, longest limb = %.3f x its length%s"
                     % (name, len(frames), sum(f["ms"] for f in frames), worst,
                        "  <-- STRETCH" if worst > 1.001 else ""))
        ok &= worst <= 1.001
        labels = ["%d  %s  %d ms" % (i, f["tag"], f["ms"]) for i, f in enumerate(frames)]
        K.contact_sheet([f["img"][1] for f in frames], labels, 5, R.GROUND).save(
            os.path.join(OUT, "qa", "contact_%s.png" % name))
    walk = dict(data)["walk"]
    n, err = len(walk), 0.0
    for i in range(n):
        for leg, off in (("leg_f", 0.0), ("leg_b", 0.5)):
            q1, q2 = (i / n + off) % 1, ((i + 1) / n + off) % 1
            if q1 <= 0.5 and q2 <= 0.5 and q2 > q1:
                pt = R.TOE_PT if q2 > A.QT else R.HEEL_PT
                m1 = _material(walk[i]["info"][leg], pt)
                m2 = _material(walk[(i + 1) % n]["info"][leg], pt)
                err = max(err, abs(m2[0] - m1[0] + A.WALK_STEP_PX) + abs(m2[1] - m1[1]))
    lines.append("walk    planted feet move with the ground (%.0f px/frame): worst error %.3f px%s"
                 % (A.WALK_STEP_PX, err, "" if err < 0.05 else "  <-- SLIDE"))
    ok &= err < 0.05
    seam = R.draw_pose(A.walk_pose(1.0))[0] == R.draw_pose(A.walk_pose(0.0))[0]
    seam &= R.draw_pose(A.idle_pose(A.IDLE_FRAMES))[0] == R.draw_pose(A.idle_pose(0))[0]
    lines.append("loops   walk and idle wrap to their first frame without a seam: %s" % ("yes" if seam else "NO"))
    ok &= seam
    for name, frames in data:
        if name == "walk":
            continue
        moved = 0.0
        for a, b in zip(frames, frames[1:]):
            for leg in ("leg_f", "leg_b"):
                la, lb = a["info"][leg], b["info"][leg]
                if a["lift"] == b["lift"] == 0 and la["toe"] == lb["toe"] == 0 and \
                        abs(la["ankle"][1] - (R.GROUND - R.SOLE)) < 0.01 and \
                        abs(lb["ankle"][1] - (R.GROUND - R.SOLE)) < 0.01:
                    moved = max(moved, K.dist(la["ankle"], lb["ankle"]))
        lines.append("%-7s planted feet between grounded frames move %.2f px%s"
                     % (name, moved, "" if moved < 0.01 else "  <-- SLIDE"))
        ok &= moved < 0.01
    lines.append("knees   always bow forward (rubber-hose bend is fixed per leg: no flips)")
    lines.append("RESULT: %s" % ("PASS" if ok else "CHECK THE LINES MARKED <--"))
    with open(os.path.join(OUT, "qa", "report.txt"), "w") as f:
        f.write("\n".join(lines) + "\n")
    return lines


# ----------------------------------------------------- model sheet / rig
def model_sheet():
    W, H = 1200, 720
    sheet = Image.new("RGBA", (W, H), (247, 244, 251, 255))
    d = ImageDraw.Draw(sheet)
    d.text((40, 28), "RATISLAV", font=font(46, True), fill=(43, 34, 51))
    d.text((44, 84), "original rat swordsman  -  side-scroller view, faces right", font=font(20), fill=(95, 84, 110))
    big = K.rasterize(R.draw_pose(R.Pose(foot_f=A.STANCE_F, foot_b=A.STANCE_B, sword=40))[0], 2.1)
    d.line([(30, 120 + int(R.GROUND * 2.1)), (560, 120 + int(R.GROUND * 2.1))], fill=(200, 190, 215), width=2)
    sheet.alpha_composite(big, (20, 120))
    faces = [("smile", {}), ("grit + angry", {"mouth": "grit", "brow": "angry", "eyes": "squint"}),
             ("open", {"mouth": "open", "eyes": "wide"}), ("yell", {"mouth": "yell", "brow": "angry",
                                                                     "eyes": "squint"}),
             ("o (falling)", {"mouth": "o", "eyes": "wide", "brow": "up"}), ("blink", {"eyes": "closed"})]
    d.text((620, 128), "Expressions", font=font(24, True), fill=(43, 34, 51))
    for i, (label, kw) in enumerate(faces):
        img = K.rasterize(R.draw_pose(R.Pose(**kw))[0], 1.5)
        crop = img.crop((int(70 * 1.5), int(28 * 1.5), int(205 * 1.5), int(150 * 1.5)))
        x, y = 620 + (i % 3) * 190, 170 + (i // 3) * 210
        d.rounded_rectangle([x, y, x + 180, y + 190], 14, fill=(255, 255, 255), outline=(222, 214, 232))
        sheet.alpha_composite(crop.resize((180, 162), Image.LANCZOS), (x, y + 2))
        d.text((x + 12, y + 164), label, font=font(16), fill=(95, 84, 110))
    d.text((620, 588), "Palette", font=font(24, True), fill=(43, 34, 51))
    keys = ["ink", "fur", "fur_far", "pink", "tunic", "tunic_hem", "belt", "buckle", "scarf", "blade"]
    for i, kname in enumerate(keys):
        x = 620 + i * 56
        d.rounded_rectangle([x, 626, x + 46, 672], 10, fill=R.PAL[kname], outline=(43, 34, 51), width=2)
    d.text((40, 690), "cell 256 x 256 px  |  anchor (118, 236) = ground under the hip  |  outline %.2f px  |  "
           "arms %d px, legs %d px (never change length)" % (R.LINE, R.ARM_LEN, R.LEG_LEN),
           font=font(16), fill=(95, 84, 110))
    sheet.save(os.path.join(OUT, "model_sheet.png"), optimize=True)


def rig_manifest():
    manifest = {
        "character": "Ratislav", "view": "side, faces right", "cell": [R.CELL, R.CELL], "ground_y": R.GROUND,
        "anchor": R.ANCHOR, "units": "px, y down, degrees, + = clockwise", "outline_px": R.LINE,
        "hierarchy": {"root/hip": ["tail", "leg_back", "leg_front", "torso"],
                      "torso": ["scarf", "arm_back", "neck/head", "arm_front"],
                      "head": ["ear_far", "ear_near", "eye", "brow", "mouth", "teeth", "nose", "whiskers"],
                      "arm_front": ["sword"]},
        "pivots_torso_space": {"neck": R.NECK, "shoulder_front": R.SHOULDER_F, "shoulder_back": R.SHOULDER_B,
                               "hip_front": R.HIPJ_F, "hip_back": R.HIPJ_B, "tail_root": R.TAIL_ROOT,
                               "scarf_knot": R.SCARF_KNOT},
        "limbs": {"arm_len": R.ARM_LEN, "leg_len": R.LEG_LEN, "type": "rubber-hose quadratic, fixed arc length",
                  "knees": "always bow forward", "elbows": "bow to the left of shoulder->hand"},
        "draw_order": ["tail", "far arm", "far leg", "near leg", "scarf tails", "tunic, hem, belt, buckle",
                       "scarf band, knot", "far ear", "head", "near ear", "near arm, sleeve, sword, hand", "effects"],
        "replacement_sets": {"eyes": ["open", "wide", "squint", "closed"],
                             "mouth": ["smile", "grit", "open", "yell", "o"], "brow": ["", "angry", "up"]},
        "palette": R.PAL,
        "rights": "Original character made in this project; no third-party art. Toolkit: own code; "
                  "rendering: PyMuPDF (AGPL/commercial) and Pillow (MIT-CMU) used locally.",
    }
    with open(os.path.join(OUT, "rig.json"), "w") as f:
        json.dump(manifest, f, indent=1)


def export_web():
    """Art for the browser demo: backdrop (sky, clouds, hills), a ground tile that
    repeats every 96 px (same period as the walk scroll), the dummy and a dust puff."""
    d = os.path.join(OUT, "web")
    os.makedirs(d, exist_ok=True)
    K.rasterize(scene_svg(1400, 400, 340, layers=("sky",)), 2).save(os.path.join(d, "backdrop@2x.png"),
                                                                     optimize=True)
    # one 96-px ground period, grass line 20 px from the top, transparent above it
    K.rasterize(scene_svg(96, 80, 20, layers=("ground",)), 2).save(os.path.join(d, "ground@2x.png"),
                                                                    optimize=True)
    dummy = K.Canvas(80, 110, R.PAL["ink"], 2.5)
    _dummy(dummy, 40, 104, 0)
    K.rasterize(dummy.svg(), 2).save(os.path.join(d, "dummy@2x.png"), optimize=True)
    dust = K.Canvas(80, 40, R.PAL["ink"], 2.5)
    R.draw_fx(dust, R.dust_fx(40, 34, 1.4, 1.0, 1))
    K.rasterize(dust.svg(), 2).save(os.path.join(d, "dust@2x.png"), optimize=True)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    frames = render_frames()
    export_sprites(frames)
    export_gifs(frames)
    model_sheet()
    rig_manifest()
    export_web()
    print("\n".join(run_qa(frames)))

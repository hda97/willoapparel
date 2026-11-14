"""Build every deliverable for the soft storybook Ratislav (v2) from the rig.

    python3 rig/build.py            # everything (several minutes)
    python3 rig/build.py --quick    # frames, sprite sheets and the checks only (about a minute)

Writes into ../out (same layout as v1, so game code and the demo page read it the same way):
  ratislav_atlas.png / .json (+ @2x)  - all frames + Aseprite-style JSON (durations, tags, anchor)
  strips/ratislav_<anim>.png (+ @2x)   - one horizontal strip per animation
  gif/ratislav_<anim>.gif, showreel    - previews in the painted meadow
  svg/<anim>/*.svg                     - vector source of every frame
  model_sheet.png, rig.json            - character bible and rig manifest
  qa/contact_<anim>.png, qa/report.txt - checks: limb length, foot slide, loop seams
  web/*.png                            - backdrop, ground tile, dummy and dust for the browser demo
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import anims_soft as A  # noqa: E402
import ratislav_soft as R  # noqa: E402
import scenery as S  # noqa: E402
import svgkit as K  # noqa: E402

OUT = os.path.join(os.path.dirname(HERE), "out")
ATLAS_COLS = 6
PAPER, INK_RGB, MUTED = (248, 244, 234, 255), (47, 42, 53), (104, 96, 112)


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
        print("rendered", name, len(frames), flush=True)
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
        meta = {"app": "krysak-animace rig v2 (svgkit + inkkit)", "version": "2.0", "image": image,
                "format": "RGBA8888", "size": {"w": ATLAS_COLS * cell, "h": rows * cell}, "scale": str(s),
                "frameTags": tags,
                "anchor": {"x": R.ANCHOR[0] * s, "y": R.ANCHOR[1] * s,
                           "note": "ground point under the hip; place this on the floor"},
                "loops": {"idle": True, "walk": True, "jump": False, "attack": False},
                "walk_speed_px_per_s": round(A.SPEED * s / (A.WALK_FRAMES * 0.083), 1)}
        with open(os.path.join(OUT, image.replace(".png", ".json")), "w") as f:
            json.dump({"frames": meta_frames, "meta": meta}, f, indent=1)


# --------------------------------------------------------------- scenes
def scene(w, h, ground, scale, scroll=0.0, dummy=None, world_fx=(), shadow=None, layers=("sky", "ground")):
    """The painted world behind the previews. The ground repeats every 96 px (two walk cycles of
    scrolling), so looping GIFs have no seam."""
    im = Image.new("RGBA", (int(round(w * scale)), int(round(h * scale))), (0, 0, 0, 0))
    if "sky" in layers:
        im.alpha_composite(S.sky(w, h, ground, scale))
    if "ground" in layers:
        im.alpha_composite(S.ground_layer(w, h, ground, scroll, scale))
    if dummy:
        im.alpha_composite(S.shadow_layer(w, h, dummy[0], ground, 0.65, scale))
        im.alpha_composite(S.dummy_layer(w, h, dummy[0], ground, dummy[1], scale))
    if shadow:
        im.alpha_composite(S.shadow_layer(w, h, shadow[0], ground, shadow[1], scale))
    if world_fx:
        im.alpha_composite(S.fx_layer(w, h, world_fx, scale, R.fx_markup))
    return im


def compose(seq, w, h, ground, char_x, scale, name):
    """seq: list of dict(fr, scroll, dummy, world_fx). Writes gif/<name>.gif."""
    images, durs, bg_cache = [], [], {}
    for item in seq:
        fr = item["fr"]
        lift = fr["lift"]
        k = max(0.4, 1 - abs(lift) / 140.0)
        key = (item.get("scroll", 0.0), item.get("dummy"), lift, tuple(map(str, item.get("world_fx", ()))))
        if key not in bg_cache:
            bg_cache[key] = scene(w, h, ground, scale, item.get("scroll", 0.0), item.get("dummy"),
                                  item.get("world_fx", ()), (char_x + R.HIP_REST[0], k))
        im = bg_cache[key].copy()
        cell = fr["img"][2] if scale > 1 else fr["img"][1]
        if cell.size[0] != int(R.CELL * scale):
            cell = cell.resize((int(R.CELL * scale), int(R.CELL * scale)), Image.LANCZOS)
        S.over(im, cell, int(round(char_x * scale)), int(round((ground - R.GROUND + lift) * scale)))
        images.append(im)
        durs.append(fr["ms"])
    os.makedirs(os.path.join(OUT, "gif"), exist_ok=True)
    path = os.path.join(OUT, "gif", "ratislav_%s.gif" % name)
    K.save_gif(images, durs, path)
    return path


HIT_X = 104           # dummy distance in front of the hip: the blade tip reaches its head on frames 3-4
HITS = {4: 14, 5: 8, 6: -4}                           # dummy tilt when the blade connects


def export_gifs(data):
    d = dict(data)
    idle, walk, jump, attack = d["idle"], d["walk"], d["jump"], d["attack"]
    step = A.WALK_STEP_PX
    hx = R.HIP_REST[0]
    compose([{"fr": f} for f in idle], 220, 190, 170, -10, 2, "idle")
    compose([{"fr": f, "scroll": i * step} for i, f in enumerate(walk * 2)], 320, 190, 170, 50, 2, "walk")

    def takeoff(x0, g):
        return {2: [R.dust_fx(x0 + 20, g, 0.8, 1.0, 1), R.dust_fx(x0 - 20, g, 0.7, 1.0, -1)],
                3: [R.dust_fx(x0 + 26, g, 1.0, 0.5, 1), R.dust_fx(x0 - 26, g, 0.9, 0.5, -1)]}

    off = takeoff(hx - 10, 260)
    seq = [{"fr": f} for f in idle[:4]] + [{"fr": f, "world_fx": off.get(i, ())} for i, f in enumerate(jump)]
    compose(seq + [{"fr": f} for f in idle[4:]], 220, 280, 260, -10, 2, "jump")
    seq = [{"fr": f, "dummy": (hx + HIT_X, HITS.get(i, 0))} for i, f in enumerate(attack)]
    seq += [{"fr": f, "dummy": (hx + HIT_X, 0)} for f in idle[:4]]
    compose(seq, 300, 190, 170, 0, 2, "attack")
    # showreel: idle, walk in (the dummy scrolls in with the ground), jump, attack
    cx, g = 40, 220
    walked = 4 * len(walk) * step
    dummy_x = cx + hx + HIT_X
    reel = [{"fr": f, "dummy": (dummy_x + walked, 0)} for f in idle]
    reel += [{"fr": f, "scroll": (i + 1) * step, "dummy": (dummy_x + walked - (i + 1) * step, 0)}
             for i, f in enumerate(walk * 4)]
    rest = {"scroll": walked, "dummy": (dummy_x, 0)}
    off = takeoff(cx + hx, g)
    reel += [dict(rest, fr=f) for f in idle[:4]]
    reel += [dict(rest, fr=f, world_fx=off.get(i, ())) for i, f in enumerate(jump)]
    reel += [dict(rest, fr=f) for f in idle[:4]]
    reel += [dict(rest, fr=f, dummy=(dummy_x, HITS.get(i, 0))) for i, f in enumerate(attack)]
    reel += [dict(rest, fr=f) for f in idle[4:]]
    compose(reel, 448, 240, g, cx, 1.5, "showreel")


# ------------------------------------------------------------------- QA
def _material(leg, local):
    return K.add(leg["ankle"], K.rot(local, leg["toe"]))


def run_qa(data):
    os.makedirs(os.path.join(OUT, "qa"), exist_ok=True)
    lines = ["Ratislav v2 (soft storybook) - QA report", "=" * 40]
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
    sheet = Image.new("RGBA", (W, H), PAPER)
    d = ImageDraw.Draw(sheet)
    d.text((40, 28), "RATISLAV", font=font(46, True), fill=INK_RGB)
    d.text((44, 84), "original rat swordsman  -  soft storybook style, inked by hand  -  side view, faces right",
           font=font(20), fill=MUTED)
    z = 2.55
    big = K.rasterize(R.draw_pose(R.Pose(foot_f=A.STANCE_F, foot_b=A.STANCE_B, sword=40))[0], z)
    big = big.crop((0, int(66 * z), int(232 * z), int(246 * z)))
    gy = 140 + int((R.GROUND - 66) * z)
    d.line([(30, gy), (580, gy)], fill=(214, 202, 184), width=2)
    sheet.alpha_composite(big, (24, 140))
    faces = [("smile", {}), ("grit + angry", {"mouth": "grit", "brow": "angry", "eyes": "squint"}),
             ("open", {"mouth": "open", "eyes": "wide"}), ("yell", {"mouth": "yell", "brow": "angry",
                                                                     "eyes": "squint"}),
             ("o (falling)", {"mouth": "o", "eyes": "wide", "brow": "up"}), ("blink", {"eyes": "closed"})]
    d.text((620, 128), "Expressions", font=font(24, True), fill=INK_RGB)
    for i, (label, kw) in enumerate(faces):
        img = K.rasterize(R.draw_pose(R.Pose(**kw))[0], 1.6)
        crop = img.crop((int(80 * 1.6), int(78 * 1.6), int(196 * 1.6), int(178 * 1.6)))
        x, y = 620 + (i % 3) * 190, 170 + (i // 3) * 210
        d.rounded_rectangle([x, y, x + 180, y + 190], 14, fill=(255, 253, 248), outline=(226, 216, 200))
        sheet.alpha_composite(crop.resize((180, 155), Image.LANCZOS), (x, y + 4))
        d.text((x + 12, y + 164), label, font=font(16), fill=MUTED)
    d.text((620, 588), "Palette", font=font(24, True), fill=INK_RGB)
    keys = ["ink", "fur", "fur_shade", "pink", "tail", "scarf", "eye", "blush", "blade", "guard"]
    for i, kname in enumerate(keys):
        x = 620 + i * 56
        d.rounded_rectangle([x, 626, x + 46, 672], 10, fill=R.PAL[kname], outline=INK_RGB, width=2)
    d.text((40, 690), "cell 256 x 256 px  |  anchor (118, 236) = ground under the hip  |  one outline %.1f px  |  "
           "arms %d px, legs %d px (never change length)" % (R.LINE, R.ARM_LEN, R.LEG_LEN),
           font=font(16), fill=MUTED)
    sheet.save(os.path.join(OUT, "model_sheet.png"), optimize=True)


def rig_manifest():
    manifest = {
        "character": "Ratislav (v2, soft storybook style)", "view": "side, faces right", "cell": [R.CELL, R.CELL],
        "ground_y": R.GROUND, "anchor": R.ANCHOR, "units": "px, y down, degrees, + = clockwise",
        "outline_px": R.LINE,
        "line_rules": "one even ink line around the whole silhouette (heavier on the shadow side); inner lines "
                      "only where a nearer part passes in front of a farther one; no line where a part grows out "
                      "of another (hip, wrist, ear root); body and head are one melted form",
        "hierarchy": {"root/hip": ["tail", "leg_back", "leg_front", "torso"],
                      "torso": ["scarf", "arm_back", "neck/head", "arm_front"],
                      "head": ["ear_far", "ear_near", "eye", "brow", "mouth", "nose", "whiskers"],
                      "arm_front": ["sword"]},
        "pivots_torso_space": {"neck": R.NECK, "shoulder_front": R.SHOULDER_F, "shoulder_back": R.SHOULDER_B,
                               "hip_front": R.HIPJ_F, "hip_back": R.HIPJ_B, "tail_root": R.TAIL_ROOT,
                               "scarf_knot": R.SCARF_KNOT},
        "limbs": {"arm_len": R.ARM_LEN, "leg_len": R.LEG_LEN, "type": "soft tube on a quadratic, fixed arc length",
                  "knees": "always bow forward", "elbows": "bow to the left of shoulder->hand"},
        "draw_order": ["sword trail (behind)", "tail", "scarf tails", "far arm", "far leg",
                       "[near arm + sword + hand when arm_behind]", "far ear", "body + head (one form)",
                       "blush, eye, mouth, brow", "near arm", "scarf band (chin stays in front), knot",
                       "whiskers", "nose", "near ear", "near leg", "sword", "hand", "dust"],
        "replacement_sets": {"eyes": ["open", "wide", "squint", "closed"],
                             "mouth": ["smile", "grit", "open", "yell", "o"], "brow": ["", "angry", "up"]},
        "palette": R.PAL,
        "rights": "Original character made in this project; no third-party art. Toolkit: own code; "
                  "geometry: shapely (BSD); rendering: PyMuPDF (AGPL/commercial) and Pillow (MIT-CMU), all local.",
    }
    with open(os.path.join(OUT, "rig.json"), "w") as f:
        json.dump(manifest, f, indent=1)


def export_web():
    """Art for the browser demo: painted backdrop, a ground tile that repeats every 96 px,
    the dummy and a dust puff (same sizes and anchors as v1)."""
    d = os.path.join(OUT, "web")
    os.makedirs(d, exist_ok=True)
    S.sky(1400, 400, 340, 2, wrap=True).save(os.path.join(d, "backdrop@2x.png"), optimize=True)
    S.ground_tile(2).save(os.path.join(d, "ground@2x.png"), optimize=True)
    S.dummy_layer(80, 110, 40, 104, 0, 2).save(os.path.join(d, "dummy@2x.png"), optimize=True)
    S.fx_layer(80, 40, [R.dust_fx(40, 34, 1.4, 1.0, 1)], 2, R.fx_markup).save(os.path.join(d, "dust@2x.png"),
                                                                               optimize=True)


if __name__ == "__main__":
    quick = "--quick" in sys.argv[1:]       # the fast loop while fixing poses: no scenery, sheet or GIFs
    os.makedirs(OUT, exist_ok=True)
    frames = render_frames()
    export_sprites(frames)
    if not quick:
        export_web()
        model_sheet()
        rig_manifest()
        export_gifs(frames)
    print("\n".join(run_qa(frames)))

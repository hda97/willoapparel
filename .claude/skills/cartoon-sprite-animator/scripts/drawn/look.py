"""Look closely before judging: close-ups, quick contact sheets and one frame in the scene.

    python3 rig/look.py closeup idle:0 walk:2 attack:4   # 5x crops round the near hand, plus the face
    python3 rig/look.py anim walk attack                 # contact sheet per animation + stretched limbs
    python3 rig/look.py scene attack:4                   # that frame in the painted meadow with the dummy

A frame is written as animation:index (index from 0). Pictures go to ../out/look/ and their paths
are printed: open them and look before saying anything about quality. Faster than a build, so use it
after every change to a pose, a part or the scenery.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from PIL import Image  # noqa: E402

import anims_soft as A  # noqa: E402
import ratislav_soft as R  # noqa: E402
import svgkit as K  # noqa: E402

OUT = os.path.join(os.path.dirname(HERE), "out", "look")
PAPER = (250, 248, 240, 255)
ANIMS = dict(A.ANIMATIONS)


def pose_of(spec):
    name, _, idx = spec.partition(":")
    return ANIMS[name]()[int(idx or 0)]["pose"]


def on_paper(svg, z):
    img = K.rasterize(svg, z)
    bg = Image.new("RGBA", img.size, PAPER)
    bg.alpha_composite(img)
    return bg


def around(img, c, r, z):
    return img.crop((int((c[0] - r) * z), int((c[1] - r) * z), int((c[0] + r) * z), int((c[1] + r) * z)))


def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    img.convert("RGB").save(path)
    print(path)


def closeup(specs, z=5, r=22):
    specs = specs or ["idle:0", "walk:2", "jump:4", "attack:4"]
    tiles, labels = [], []
    for spec in specs:
        svg, info = R.draw_pose(pose_of(spec))
        img = on_paper(svg, z)
        tiles.append(around(img, info["hand_f"], r, z))
        labels.append("%s hand" % spec)
    svg, info = R.draw_pose(pose_of(specs[0]))
    tiles.append(around(on_paper(svg, z), info["face"], r * 1.4, z).resize(tiles[0].size))   # eye to whisker tips
    labels.append("%s face" % specs[0])
    save(K.contact_sheet(tiles, labels, min(4, len(tiles)), bg=PAPER), "closeup.png")


def anim(names):
    for name in names or [n for n, _ in A.ANIMATIONS]:
        imgs, labels, stretched = [], [], []
        for i, fr in enumerate(ANIMS[name]()):
            svg, info = R.draw_pose(fr["pose"])
            stretched += ["%d %s %.3f" % (i, k, v) for k, v in info["stretch"].items() if v > 1.001]
            imgs.append(K.rasterize(svg, 1.0))
            labels.append("%s %d  %d ms" % (name, i, fr["ms"]))
        box = imgs[0].getbbox()
        for img in imgs[1:]:
            b = img.getbbox() or box
            box = (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
        box = (max(0, box[0] - 4), max(0, box[1] - 4), box[2] + 4, R.GROUND + 4)
        crops = [img.crop(box) for img in imgs]
        save(K.contact_sheet(crops, labels, len(crops), guide_y=R.GROUND - box[1], bg=PAPER), "anim_%s.png" % name)
        print("  limbs longer than allowed:", ", ".join(stretched) or "none")


def scene(specs, scale=1.5):
    import build as B   # the build module owns the scene layout
    for spec in specs or ["attack:4"]:
        cx = 40
        img = B.scene(448, 240, 220, scale, 0.0, (cx + 118 + 88, 0), (), (cx + 118, 1.0))
        svg, _ = R.draw_pose(pose_of(spec))
        K_img = K.rasterize(svg, scale)
        B.S.over(img, K_img, int(cx * scale), int((220 - R.GROUND) * scale))
        save(img, "scene_%s.png" % spec.replace(":", "_"))


if __name__ == "__main__":
    cmd, args = (sys.argv[1] if len(sys.argv) > 1 else "closeup"), sys.argv[2:]
    {"closeup": closeup, "anim": anim, "scene": scene}[cmd](args)

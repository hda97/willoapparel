#!/usr/bin/env python
"""Visual scene analysis over the whole source (feeds moment selection).

Usage: python analyze.py <slug>

Produces projects/<slug>/analysis.json:
  {"scene_cuts": [t,...],
   "presence": [{"t","n","max_area","cx":[...]}],   # face presence sampled at 1fps
   "graphics_ratio": float}                          # frac of time with no dominant face
Times in seconds; max_area is largest-face area as a fraction of frame.
"""
import os, re, sys, subprocess
import numpy as np
import config, util, face

PRESENCE_FPS = 1.0
PRESENCE_W = 480
WINDOW_SEC = 120.0


def scene_cuts(src, thr=0.30):
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", src, "-filter_complex",
         f"select='gt(scene,{thr})',showinfo", "-f", "null", "-"],
        capture_output=True, text=True)
    return sorted(float(m) for m in re.findall(r"pts_time:([0-9.]+)", p.stderr))


def presence_timeline(src, dur, ow, oh):
    rows = []
    frame_area = float(PRESENCE_W * int(round(PRESENCE_W * oh / ow)))
    t = 0.0
    while t < dur:
        win = min(WINDOW_SEC, dur - t)
        frames, h = util.sample_frames(src, t, t + win, PRESENCE_FPS, PRESENCE_W)
        fa = float(PRESENCE_W * h)
        for k in range(len(frames)):
            ts = t + k / PRESENCE_FPS
            boxes = face.detect_frame(frames[k])
            cxs = [round((b[0] + b[2] / 2) / PRESENCE_W, 3) for b in boxes]
            max_area = max((b[2] * b[3] / fa for b in boxes), default=0.0)
            rows.append({"t": round(ts, 1), "n": len(boxes),
                         "max_area": round(max_area, 4), "cx": cxs})
        t += win
    return rows


def main(slug, do_scene=True):
    proj = config.project_dir(slug)
    data = util.load_json(os.path.join(proj, "clips.json"))
    src = data["source"]["path"]
    ow, oh, dur = data["source"]["width"], data["source"]["height"], data["source"]["duration"]

    print("[analyze] face-presence timeline...")
    presence = presence_timeline(src, dur, ow, oh)
    graphics = sum(1 for r in presence if r["max_area"] < config.GRAPHICS_FACE_AREA)
    graphics_ratio = round(graphics / max(1, len(presence)), 3)

    cuts = []
    if do_scene:
        print("[analyze] scene-cut detection (decodes full video)...")
        cuts = scene_cuts(src)

    out = {"scene_cuts": [round(c, 2) for c in cuts],
           "presence": presence, "graphics_ratio": graphics_ratio}
    util.save_json(os.path.join(proj, "analysis.json"), out)
    print(f"[analyze] {len(presence)} presence samples, {len(cuts)} scene cuts, "
          f"graphics_ratio={graphics_ratio} -> analysis.json")
    return out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: analyze.py <slug> [--no-scene]")
    main(sys.argv[1], do_scene="--no-scene" not in sys.argv)

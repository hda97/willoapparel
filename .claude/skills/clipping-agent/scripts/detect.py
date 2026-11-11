#!/usr/bin/env python
"""Per-clip face detection -> layout decision + crop plan.

Usage: python detect.py <slug>   (analyzes every clip in clips.json)

For each clip it samples [start,end] at SAMPLE_FPS, detects faces (YuNet/ONNX),
links them into tracks, and decides one of:
  blur  - no dominant face / graphics-heavy: blurred-fill (lose nothing)
  track - one dominant subject: 1080-wide window pans to follow them
  split - two dominant subjects far apart: top/bottom split-screen
  wide  - two subjects close, or >2 that fit: single window on the midpoint
The resulting plan (with crop coords) is stored on the clip as clip["frame"].
Times in the plan are RELATIVE to the clip start.
"""
import os, re, sys, subprocess
import numpy as np
from scipy.ndimage import gaussian_filter1d
import config, util, face

DET_W = 640  # detection sampling width


def _faces_per_frame(src, start, end):
    frames, h = util.sample_frames(src, start, end, config.SAMPLE_FPS, DET_W)
    W = DET_W
    fa = float(W * h)
    per = []
    for fr in frames:
        boxes = face.detect_frame(fr)
        fs = [{"cx": (b[0] + b[2] / 2) / W, "cy": (b[1] + b[3] / 2) / h,
               "area": (b[2] * b[3]) / fa, "score": b[4]} for b in boxes]
        per.append(fs)
    return per


def _build_tracks(per):
    """Greedy nearest-center linking across frames -> list of tracks.
    Each track: {"cx":[...], "area":[...], "frames":[i,...]}."""
    tracks = []
    for i, fs in enumerate(per):
        for f in fs:
            best, bestd = None, config.TRACK_JUMP_FRAC
            for t in tracks:
                if t["frames"][-1] == i:
                    continue
                d = abs(t["cx"][-1] - f["cx"])
                if d < bestd:
                    best, bestd = t, d
            if best is None:
                tracks.append({"cx": [f["cx"]], "cy": [f["cy"]], "area": [f["area"]], "frames": [i]})
            else:
                best["cx"].append(f["cx"]); best["cy"].append(f["cy"])
                best["area"].append(f["area"]); best["frames"].append(i)
    return tracks


def _dominant(tracks, n_frames):
    out = []
    for t in tracks:
        presence = len(t["frames"]) / max(1, n_frames)
        med_area = float(np.median(t["area"]))
        if med_area >= config.MIN_FACE_AREA and presence >= config.MIN_PRESENCE:
            out.append({"cx": float(np.median(t["cx"])), "cy": float(np.median(t["cy"])),
                        "area": med_area, "presence": presence, "raw": t})
    return sorted(out, key=lambda d: d["area"] * d["presence"], reverse=True)


def _scaled_w(meta):
    sw = round(meta["width"] * config.OUT_H / meta["height"])
    return sw - (sw % 2)


def _track_segments(track, n_frames, scaled_w, dur):
    """Smoothed, dead-banded piecewise-constant crop_x segments (clip-relative)."""
    maxx = scaled_w - config.OUT_W
    # dense cx per sampled frame (forward-fill gaps)
    cx = np.full(n_frames, np.nan)
    for k, fi in enumerate(track["frames"]):
        cx[fi] = track["cx"][k]
    # fill nans
    idx = np.arange(n_frames)
    good = ~np.isnan(cx)
    if good.sum() == 0:
        cx[:] = 0.5
    else:
        cx = np.interp(idx, idx[good], cx[good])
    sigma = max(0.5, config.SMOOTH_SIGMA_SEC * config.SAMPLE_FPS)
    cx = gaussian_filter1d(cx, sigma)
    xs = np.clip(cx * scaled_w - config.OUT_W / 2, 0, maxx)
    # merge into segments where movement < deadband
    segs = []
    seg_start, seg_xs = 0, [xs[0]]
    for i in range(1, n_frames):
        if abs(xs[i] - np.median(seg_xs)) > config.DEADBAND_PX:
            t0 = seg_start / config.SAMPLE_FPS
            t1 = i / config.SAMPLE_FPS
            segs.append([round(t0, 3), round(t1, 3), float(round(np.median(seg_xs)))])
            seg_start, seg_xs = i, [xs[i]]
        else:
            seg_xs.append(xs[i])
    segs.append([round(seg_start / config.SAMPLE_FPS, 3), round(dur, 3), float(round(np.median(seg_xs)))])
    segs[-1][1] = round(dur, 3)
    return segs


def _scene_cuts_rel(src, start, end, thr):
    """Clip-relative times of hard camera cuts inside [start,end]."""
    dur = end - start
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-ss", f"{start:.3f}", "-i", src, "-t", f"{dur:.3f}",
         "-an", "-filter_complex", f"select='gt(scene,{thr})',showinfo", "-f", "null", "-"],
        capture_output=True, text=True)
    return sorted(float(t) for t in re.findall(r"pts_time:([0-9.]+)", p.stderr)
                  if 0.35 < float(t) < dur - 0.2)


def _steady_track(src, start, end, per, scaled_w, dur):
    """One static crop_x per camera shot (median of the largest face's center in
    that shot). No per-frame panning -> steady framing that only jumps on a cut."""
    maxx = scaled_w - config.OUT_W
    bounds = [0.0] + _scene_cuts_rel(src, start, end, config.SCENE_THR) + [dur]

    def center(lo, hi):
        xs = [max(fs, key=lambda f: f["area"])["cx"]
              for i, fs in enumerate(per) if fs and lo <= i / config.SAMPLE_FPS < hi]
        return float(np.median(xs)) if xs else 0.5

    segs = []
    for a, b in zip(bounds[:-1], bounds[1:]):
        if b - a < config.MIN_SHOT_SEC and segs:      # fold a too-short shot into the previous
            segs[-1][1] = round(b, 3)
            continue
        x = float(round(np.clip(center(a, b) * scaled_w - config.OUT_W / 2, 0, maxx)))
        segs.append([round(a, 3), round(b, 3), x])
    if not segs:
        x = float(round(np.clip(0.5 * scaled_w - config.OUT_W / 2, 0, maxx)))
        segs = [[0.0, round(dur, 3), x]]
    segs[0][0] = 0.0
    segs[-1][1] = round(dur, 3)
    return segs


def decide(per, meta, dur):
    n = len(per)
    scaled_w = _scaled_w(meta)
    aspect = meta["width"] / meta["height"]
    # already vertical-ish -> blur-fit (cannot crop wider-than-tall)
    if aspect < 1.2:
        return {"layout": "blur"}
    graphics = sum(1 for fs in per if max((f["area"] for f in fs), default=0) < config.GRAPHICS_FACE_AREA)
    if n and graphics / n >= config.GRAPHICS_RATIO:
        return {"layout": "blur"}
    tracks = _build_tracks(per)
    dom = _dominant(tracks, n)
    if not dom:
        return {"layout": "blur"}
    if len(dom) == 1:
        return {"layout": "track", "scaled_w": scaled_w,
                "segments": _track_segments(dom[0]["raw"], n, scaled_w, dur)}
    a, b = dom[0], dom[1]
    gap = abs(a["cx"] - b["cx"])
    if gap > config.FAR_APART_GAP:
        # top/bottom split: 9:8 crop region per subject (full source height), top=left-most
        crop_w = meta["height"] * config.OUT_W / config.OUT_H  # 1080:960 cell -> 9:8
        top, bot = (a, b) if a["cx"] <= b["cx"] else (b, a)
        def cell_x(d):
            return float(round(np.clip(d["cx"] * meta["width"] - crop_w / 2, 0, meta["width"] - crop_w)))
        return {"layout": "split", "crop_w": round(crop_w), "crop_h": meta["height"],
                "top_x": cell_x(top), "bot_x": cell_x(bot)}
    # close together (or >2 that fit) -> single window on the midpoint of dominant faces
    mid = float(np.mean([d["cx"] for d in dom]))
    x = float(round(np.clip(mid * scaled_w - config.OUT_W / 2, 0, scaled_w - config.OUT_W)))
    return {"layout": "wide", "scaled_w": scaled_w, "crop_x": x}


def analyze_clip(slug, clip, src, meta):
    dur = clip["end"] - clip["start"]
    per = _faces_per_frame(src, clip["start"], clip["end"])
    plan = decide(per, meta, dur)
    if plan.get("layout") == "track" and config.STEADY_FRAMING:
        plan["segments"] = _steady_track(src, clip["start"], clip["end"], per, plan["scaled_w"], dur)
    clip["frame"] = plan
    return plan


def main(slug):
    proj = config.project_dir(slug)
    cp = os.path.join(proj, "clips.json")
    data = util.load_json(cp)
    src, meta = data["source"]["path"], data["source"]
    for c in data["clips"]:
        plan = analyze_clip(slug, c, src, meta)
        extra = ""
        if plan["layout"] == "track":
            extra = f" ({len(plan['segments'])} crop segs)"
        elif plan["layout"] in ("wide",):
            extra = f" (x={plan['crop_x']})"
        elif plan["layout"] == "split":
            extra = f" (top_x={plan['top_x']} bot_x={plan['bot_x']})"
        print(f"[detect] clip {c['id']}: layout={plan['layout']}{extra}")
    util.save_json(cp, data)
    return data


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: detect.py <slug>")
    main(sys.argv[1])

#!/usr/bin/env python
"""Render each selected clip to a finished 9:16 mp4.

Usage: python compose.py <slug>

Per clip: trim [start,end] -> reframe filtergraph (track/split/blur/wide) ->
burn karaoke captions -> encode. Output: projects/<slug>/clips/<id>.mp4.
ffmpeg runs with cwd=clips dir so the subtitles filter can use a bare filename
(avoids Windows path-escaping pain).
"""
import os, re, sys
import config, util, reframe, captions, detect, cut


def compose_clip(slug, clip, source, meta, words):
    proj = config.project_dir(slug)
    clips_dir = os.path.join(proj, "clips")
    os.makedirs(clips_dir, exist_ok=True)

    if "frame" not in clip:
        detect.analyze_clip(slug, clip, source, meta)

    start, dur = clip["start"], clip["end"] - clip["start"]
    frame = clip["frame"]

    # jump-cut plan (source seconds) + captions re-timed onto the tightened timeline
    keeps = cut.plan_keeps(source, start, clip["end"], words)
    ow, outdur = cut.remap_words(words, keeps, start, clip["end"])
    hook = clip.get("hook") or clip.get("title", "")
    if re.match(r"^Clip \d+$", hook or ""):          # skip the generic auto title
        hook = ""
    ass_text, _ = captions.build_ass(ow, 0.0, outdur, hook_text=hook)
    with open(os.path.join(clips_dir, f"{clip['id']}.ass"), "w", encoding="utf-8") as f:
        f.write(ass_text)

    ks = cut.keeps_clip_relative(keeps, start)
    n = len(ks)
    strip = config.STRIP_SOURCE_CAPTIONS and frame["layout"] in ("track", "wide")
    parts, labels = [], []

    if strip:
        # v2 path: crop a correct 9:16 window straight from the 4K source, above the
        # burned-in caption band, per shot. Aspect-true (no warp) + sharp (single scale).
        sw, sh = meta["width"], meta["height"]
        hc = int(sh * config.CAPTION_BAND_FRAC); hc -= hc % 2
        wc = int(round(hc * config.OUT_W / config.OUT_H)); wc -= wc % 2
        scaled_w = frame.get("scaled_w") or round(sw * config.OUT_H / sh)
        shots = frame["segments"] if frame["layout"] == "track" else [[0.0, dur, frame["crop_x"]]]

        def xsrc(t):
            xs = shots[0][2]
            for t0, t1, x in shots:
                if t0 <= t < t1:
                    xs = x; break
            cx = (xs + config.OUT_W / 2) / scaled_w          # face-center fraction
            return int(max(0, min(sw - wc, round(cx * sw - wc / 2))))

        for i, (a, b) in enumerate(ks):
            parts.append(f"[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS,"
                         f"crop={wc}:{hc}:{xsrc((a + b) / 2)}:0,"
                         f"scale={config.OUT_W}:{config.OUT_H},fps={config.FPS},setsar=1[v{i}]")
            parts.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS[a{i}]")
            labels.append(f"[v{i}][a{i}]")
    else:
        # full-bleed: reframe once (layout track/split/wide/blur) -> [vout], then jump-cut
        chain, vlbl = reframe.build_filter(frame, dur)
        parts += [chain, f"[{vlbl}]split={n}" + "".join(f"[c{i}]" for i in range(n))]
        for i, (a, b) in enumerate(ks):
            parts.append(f"[c{i}]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{i}]")
            parts.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS[a{i}]")
            labels.append(f"[v{i}][a{i}]")

    parts.append("".join(labels) + f"concat=n={n}:v=1:a=1[vc][ac]")
    parts.append(f"[vc]subtitles={clip['id']}.ass[vf]")
    albl = "ac"
    if config.LOUDNORM:                              # EBU R128 loudness to platform target
        parts.append(f"[ac]loudnorm=I={config.LOUDNORM_I}:TP={config.LOUDNORM_TP}:"
                     f"LRA={config.LOUDNORM_LRA}[aout]")
        albl = "aout"
    fc = ";".join(parts)

    out_mp4 = f"{clip['id']}.mp4"
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
           "-ss", f"{start:.3f}", "-i", source, "-t", f"{dur:.3f}",
           "-filter_complex", fc, "-map", "[vf]", "-map", f"[{albl}]",
           "-r", str(config.FPS), *config.ENCODE_VIDEO, *config.ENCODE_AUDIO,
           "-shortest", out_mp4]
    util.run(cmd, cwd=clips_dir)
    path = os.path.join(clips_dir, out_mp4)
    clip["file"] = path
    clip["status"] = "composed"
    clip["out_duration"] = round(outdur, 2)
    return path


def main(slug):
    proj = config.project_dir(slug)
    cp = os.path.join(proj, "clips.json")
    data = util.load_json(cp)
    source, meta = data["source"]["path"], data["source"]
    words = util.load_json(os.path.join(proj, "words.json"))["words"]
    for c in data["clips"]:
        path = compose_clip(slug, c, source, meta, words)
        m = util.ffprobe_meta(path)
        print(f"[compose] clip {c['id']}: {c['frame']['layout']} -> "
              f"{os.path.basename(path)} {m['width']}x{m['height']} {m['duration']:.1f}s")
    util.save_json(cp, data)
    return data


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: compose.py <slug>")
    main(sys.argv[1])

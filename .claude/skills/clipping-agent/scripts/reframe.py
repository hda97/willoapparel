"""Build the ffmpeg filter_complex for a clip's framing plan.

build_filter(plan, dur) -> (filter_complex_str, out_label)
The graph starts from [0:v] (the already-trimmed clip, t=0..dur) and ends at
[vout]. compose.py appends the caption burn + encode. Patterns reuse the
SyncOnyx make_final.py crop/overlay/vstack approach.
"""
import config

OW, OH, FPS = config.OUT_W, config.OUT_H, config.FPS


def _blur():
    return (
        f"[0:v]split=2[bg][fg];"
        f"[bg]scale={OW}:{OH}:force_original_aspect_ratio=increase,"
        f"crop={OW}:{OH},gblur=sigma=26[bgb];"
        f"[fg]scale={OW}:{OH}:force_original_aspect_ratio=decrease[fgs];"
        f"[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1[vout]"
    )


def _wide(scaled_w, x):
    return f"[0:v]scale=-2:{OH},setsar=1,crop={OW}:{OH}:{int(x)}:0[vout]"


def _track(segments):
    if len(segments) == 1:
        return _wide(None, segments[0][2])
    k = len(segments)
    parts = [f"[0:v]scale=-2:{OH},fps={FPS},setsar=1,split={k}" + "".join(f"[s{i}]" for i in range(k))]
    labels = []
    for i, (t0, t1, x) in enumerate(segments):
        parts.append(f"[s{i}]trim={t0}:{t1},setpts=PTS-STARTPTS,crop={OW}:{OH}:{int(x)}:0[v{i}]")
        labels.append(f"[v{i}]")
    parts.append("".join(labels) + f"concat=n={k}:v=1,setsar=1[vout]")
    return ";".join(parts)


def _split(cw, ch, top_x, bot_x):
    return (
        f"[0:v]split=2[a][b];"
        f"[a]crop={int(cw)}:{int(ch)}:{int(top_x)}:0,scale={OW}:{OH // 2},setsar=1[top];"
        f"[b]crop={int(cw)}:{int(ch)}:{int(bot_x)}:0,scale={OW}:{OH // 2},setsar=1[bot];"
        f"[top][bot]vstack=inputs=2,setsar=1[vout]"
    )


def build_filter(plan, dur):
    layout = plan["layout"]
    if layout == "blur":
        return _blur(), "vout"
    if layout == "wide":
        return _wide(plan.get("scaled_w"), plan["crop_x"]), "vout"
    if layout == "track":
        return _track(plan["segments"]), "vout"
    if layout == "split":
        return _split(plan["crop_w"], plan["crop_h"], plan["top_x"], plan["bot_x"]), "vout"
    raise ValueError(f"unknown layout {layout!r}")

#!/usr/bin/env python
"""Jump-cut planning: remove silences, breaths, and filler words ("um"/"uh") so
clips are rapid-fire, WITHOUT ever crossing a real word's onset.

plan_keeps(source, start, end, words) -> [[src_start, src_end], ...] keep windows
remap_words(words, keeps, start, end)  -> (out_words, out_dur) on the cut timeline

A detected silence is trimmed to [ss+CUT_TAIL, next_word_onset-CUT_LEAD] so the
word that resumes speech (often a soft sentence-opener like "Have"/"They") is
always preserved. Toggle with config.JUMPCUT.
"""
import re, subprocess
import config


def _norm(t):
    return re.sub(r"[^a-z]", "", t.lower())


def _merge(ivs):
    ivs = sorted(ivs)
    out = []
    for s, e in ivs:
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out


def _silences(source, s, e):
    dur = e - s
    cmd = ["ffmpeg", "-hide_banner", "-ss", f"{s:.3f}", "-i", source, "-t", f"{dur:.3f}",
           "-af", f"silencedetect=noise={config.SIL_NOISE}:d={config.SIL_MIN}", "-f", "null", "-"]
    txt = subprocess.run(cmd, capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start:\s*(-?[0-9.]+)", txt)]
    ends = [float(x) for x in re.findall(r"silence_end:\s*([0-9.]+)", txt)]
    out = []
    for i, ss in enumerate(starts):
        ee = ends[i] if i < len(ends) else dur
        out.append([s + max(0.0, ss), s + min(dur, ee)])
    return out


def plan_keeps(source, start, end, words):
    """Return keep windows (source seconds) covering [start,end] minus cuttable
    silence and filler words."""
    if not config.JUMPCUT:
        return [[start, end]]
    onsets = sorted(w["start"] for w in words
                    if start <= w["start"] < end and _norm(w["text"]) not in config.FILLERS)

    def first_onset_ge(x):
        for o in onsets:
            if o >= x:
                return o
        return None

    cuts = []
    for ss, ee in _silences(source, start, end):
        nxt = first_onset_ge(ss - 0.02)
        hi = min(ee, (nxt - config.CUT_LEAD) if nxt is not None else ee)
        lo = ss + config.CUT_TAIL
        if hi - lo > config.MIN_CUT:
            cuts.append([lo, hi])
    for w in words:                                  # excise filler words + trailing gap
        if start <= w["start"] < end and _norm(w["text"]) in config.FILLERS:
            nxt = first_onset_ge(w["end"] - 0.001)
            hi = min(w["end"], (nxt - config.CUT_LEAD) if nxt is not None else w["end"])
            lo = w["start"] - 0.03
            if hi - lo > 0.05:
                cuts.append([lo, hi])
    cuts = _merge(cuts)

    keeps, cur = [], start                           # complement of cuts within [start,end]
    for cs, ce in cuts:
        cs, ce = max(start, cs), min(end, ce)
        if cs > cur:
            keeps.append([cur, cs])
        cur = max(cur, ce)
    if cur < end:
        keeps.append([cur, end])
    keeps = [k for k in keeps if k[1] - k[0] >= config.MIN_KEEP]
    return keeps or [[start, end]]        # never return nothing (near-silent clip safety)


def remap_words(words, keeps, start, end):
    """Map word onsets onto the tightened (cut) output timeline; drop filler and
    any word that fell inside a cut. Returns (out_words, out_duration)."""
    segs, off = [], 0.0
    for s, e in keeps:
        segs.append((s, e, off))
        off += e - s
    outdur = off

    def to_out(t):
        for s, e, o in segs:
            if s <= t < e:
                return o + (t - s)
        return None

    ow = []
    for w in words:
        if not (start <= w["start"] < end) or _norm(w["text"]) in config.FILLERS:
            continue
        ot = to_out(w["start"])
        if ot is not None:
            ow.append({"text": w["text"], "start": round(ot, 3)})
    ow.sort(key=lambda x: x["start"])
    for i, w in enumerate(ow):
        w["end"] = ow[i + 1]["start"] if i + 1 < len(ow) else min(outdur, w["start"] + 0.4)
        if w["end"] <= w["start"]:
            w["end"] = w["start"] + 0.12
    return ow, outdur


def keeps_clip_relative(keeps, start):
    """Keep windows expressed relative to the clip start (for trimming a
    reframed [0..dur] stream)."""
    return [[round(a - start, 3), round(b - start, 3)] for a, b in keeps]

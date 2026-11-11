#!/usr/bin/env python
"""Snap each clip's [start,end] to natural boundaries; enforce 20-60s.

Usage: python boundary_snap.py <slug>

Rules (in priority order, applied to clips.json clips in place):
  1. Never mid-word (hard): edges land on word boundaries.
  2. Prefer a pause/sentence boundary near the requested edge (soft).
  3. Enforce [CLIP_MIN, CLIP_MAX]: extend if short, contract to a pause if long.
"""
import os, sys
import config, util

SENT_END = ".?!"


def _sentence_starts(words):
    return [w["start"] for i, w in enumerate(words)
            if i == 0 or (words[i - 1]["text"][-1:] in SENT_END)]


def _sentence_ends(words):
    return [w["end"] for w in words if w["text"][-1:] in SENT_END]


def _nearest(cands, t, window):
    cands = [c for c in cands if abs(c - t) <= window]
    return min(cands, key=lambda c: abs(c - t)) if cands else None


def snap_start(t, words, pauses, sent_starts, window_sent=2.0, window_pause=1.2):
    s = _nearest(sent_starts, t, window_sent)
    if s is not None:
        return s
    # pause whose END (speech onset) is near t
    pe = _nearest([p[1] for p in pauses], t, window_pause)
    if pe is not None:
        return pe
    # word at/after t (never start inside a word)
    after = [w["start"] for w in words if w["start"] >= t - 0.05]
    return after[0] if after else (words[0]["start"] if words else t)


def snap_end(t, words, pauses, sent_ends, window_sent=2.0, window_pause=1.2):
    e = _nearest(sent_ends, t, window_sent)
    if e is not None:
        return e
    ps = _nearest([p[0] for p in pauses], t, window_pause)
    if ps is not None:
        return ps
    before = [w["end"] for w in words if w["end"] <= t + 0.05]
    return before[-1] if before else (words[-1]["end"] if words else t)


def enforce_length(start, end, words, sent_ends, pauses, lo, hi):
    # too long -> contract end to latest sentence-end/pause <= start+hi
    if end - start > hi:
        limit = start + hi
        cands = [e for e in sent_ends if start + lo <= e <= limit]
        cands += [p[0] for p in pauses if start + lo <= p[0] <= limit]
        if cands:
            end = max(cands)
        else:  # hard word-boundary cut
            wends = [w["end"] for w in words if start + lo <= w["end"] <= limit]
            end = wends[-1] if wends else limit
    # too short -> extend end forward to next sentence-end/word-end (cap hi)
    if end - start < lo:
        limit = start + hi
        cands = [e for e in sent_ends if end < e <= limit]
        cands += [w["end"] for w in words if end < w["end"] <= limit]
        if cands:
            end = min(cands, key=lambda e: abs((e - start) - (lo + hi) / 2))
        # still short -> extend start backward
        if end - start < lo:
            floor = end - hi
            cands = [s for s in _sentence_starts(words) if floor <= s < start]
            cands += [w["start"] for w in words if floor <= w["start"] < start]
            if cands:
                start = min(cands, key=lambda s: abs((end - s) - (lo + hi) / 2))
    return start, end


def snap_clip(start, end, words, pauses, lo=None, hi=None):
    lo = lo or config.CLIP_MIN_SEC
    hi = hi or config.CLIP_MAX_SEC
    if not words:
        return round(start, 3), round(end, 3)
    sent_starts, sent_ends = _sentence_starts(words), _sentence_ends(words)
    s = snap_start(start, words, pauses, sent_starts)
    e = snap_end(end, words, pauses, sent_ends)
    if e <= s:
        e = s + lo
    s, e = enforce_length(s, e, words, sent_ends, pauses, lo, hi)
    dur = words[-1]["end"]
    s = max(0.0, min(s, dur - lo))
    e = min(dur, max(e, s + lo))
    return round(s, 3), round(e, 3)


def main(slug):
    proj = config.project_dir(slug)
    cp = os.path.join(proj, "clips.json")
    data = util.load_json(cp)
    words = util.load_json(os.path.join(proj, "words.json"))["words"]
    speech = util.load_json(os.path.join(proj, "speech.json"), {"pauses": []})
    pauses = speech.get("pauses", [])
    for c in data.get("clips", []):
        rs = c.get("raw_start", c.get("start"))
        re_ = c.get("raw_end", c.get("end"))
        s, e = snap_clip(rs, re_, words, pauses)
        c["raw_start"], c["raw_end"] = rs, re_
        c["start"], c["end"] = s, e
        print(f"[snap] clip {c.get('id','?')}: [{rs:.1f},{re_:.1f}] -> [{s:.1f},{e:.1f}] ({e-s:.1f}s)")
    util.save_json(cp, data)
    return data


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: boundary_snap.py <slug>")
    main(sys.argv[1])

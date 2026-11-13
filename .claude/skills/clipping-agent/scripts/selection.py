#!/usr/bin/env python
"""Set the clip windows to cut.

Usage:
  python selection.py <slug> --picks picks.json    # agent-chosen moments (preferred)
  python selection.py <slug> --auto [--clips N]     # heuristic fallback (testing/degraded)

picks.json is a JSON list of objects:
  [{"start": 12.0, "end": 48.0, "reason": "...", "title": "...",
    "caption": "...", "hashtags": ["#a","#b"]}, ...]

The agent normally authors picks.json by reading words.json + analysis.json and
choosing the most scroll-stopping, self-contained moments. The --auto heuristic
just spreads N windows across the talk so the pipeline can run unattended.
Writes clips into clips.json with raw_start/raw_end; run boundary_snap.py next.
"""
import os, sys, json
import config, util


def from_picks(picks, words):
    clips = []
    for i, p in enumerate(picks, 1):
        clips.append({
            "id": i,
            "raw_start": float(p["start"]),
            "raw_end": float(p["end"]),
            "reason": p.get("reason", ""),
            "title": p.get("title", f"Clip {i}"),
            "hook": p.get("hook", ""),          # short stop-scroll overlay text (optional)
            "judge": p.get("judge"),            # agent 0-100 virality judgment (optional)
            "caption": p.get("caption", ""),
            "hashtags": p.get("hashtags", []),
            "status": "selected",
        })
    return clips


def auto(words, n, speech=None):
    """Content-ranked auto selection: score sentence-aligned candidate windows by
    the clipscore signal model and take the top-n (falls back to even spacing)."""
    if not words:
        return []
    try:
        import score
        wins = score.rank_candidates(words, speech or {"pauses": []}, n)
    except Exception:
        wins = []
    if not wins:                                  # even-spacing fallback
        first, last = words[0]["start"], words[-1]["end"]
        total = max(1.0, last - first)
        lo, hi = config.CLIP_MIN_SEC, config.CLIP_MAX_SEC
        n = max(1, min(n, int(total // lo)))
        slot = total / n
        target = min(hi, max(lo, slot * 0.8))
        wins = [[round(max(first, first + slot * (i + 0.5) - target / 2), 2),
                 round(min(last, first + slot * (i + 0.5) + target / 2), 2)] for i in range(n)]
    clips = []
    for i, (s, e) in enumerate(wins, 1):
        clips.append({
            "id": i, "raw_start": s, "raw_end": e,
            "reason": "auto: top clipscore candidate", "title": f"Clip {i}",
            "hook": "", "judge": None, "caption": "", "hashtags": [], "status": "selected",
        })
    return clips


def main(argv):
    slug = argv[0]
    proj = config.project_dir(slug)
    cp = os.path.join(proj, "clips.json")
    data = util.load_json(cp)
    words = util.load_json(os.path.join(proj, "words.json"))["words"]

    if "--picks" in argv:
        picks_path = argv[argv.index("--picks") + 1]
        picks = util.load_json(picks_path)
        clips = from_picks(picks, words)
    else:
        if "--clips" in argv:
            n = int(argv[argv.index("--clips") + 1])
        else:
            n = config.default_clip_count(data["source"]["duration"])
        speech = util.load_json(os.path.join(proj, "speech.json"), default={"pauses": []})
        clips = auto(words, n, speech)

    data["clips"] = clips
    util.save_json(cp, data)
    for c in clips:
        print(f"[select] clip {c['id']}: [{c['raw_start']:.1f},{c['raw_end']:.1f}]  {c['title']}")
    print(f"[select] {len(clips)} clips -> clips.json")
    return data


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: select.py <slug> (--picks picks.json | --auto [--clips N])")
    main(sys.argv[1:])

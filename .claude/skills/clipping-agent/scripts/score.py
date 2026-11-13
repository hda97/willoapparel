#!/usr/bin/env python
"""ClipScore — rank clips by how likely they are to go viral.

Two ingredients, blended:
  - signal_score(): deterministic, transcript+audio features (hook energy, pace,
    info cues, clean start/payoff, dead-air, length fit) -> 0-100.
  - judge: the agent's 0-100 rubric score authored in picks.json (optional).
final clipscore = SCORE_JUDGE_W*judge + (1-SCORE_JUDGE_W)*signal   (signal-only if no judge)

Usage:
  python score.py <slug>            # annotate clips.json + print the leaderboard
  (also used by selection.py --auto to rank candidate windows)
"""
import os, re, sys, math
import config, util

_NUM = re.compile(r"\b\d+([.,]\d+)?\b|\b(one|two|three|four|five|six|seven|eight|nine|ten"
                  r"|hundred|thousand|million|billion)\b", re.I)
_LIST = re.compile(r"\b(first|second|third|number one|three (things|ways|reasons)|two (things|ways)"
                   r"|step (one|two|1|2)|here('| i)s (why|how|the))\b", re.I)
_CONTRAST = re.compile(r"\b(but|however|instead|actually|the (truth|problem|reality) is|not\b.*\bit's)\b", re.I)
_CURIOSITY = re.compile(r"\b(nobody|no one|secret|nobody tells|the reason|what (nobody|most)|little known"
                        r"|here's the thing|truth is|mistake|stop\b)\b", re.I)
_OPENERS = re.compile(r"^(the|here'?s|why|how|what|stop|never|always|nobody|everybody|everyone|imagine"
                      r"|listen|look|so|if you|most people|the biggest|the number|the easiest|the one)\b", re.I)


def _win(words, start, end):
    return [w for w in words if w["start"] >= start - 0.01 and w["start"] < end]


def _text(ws):
    return " ".join(w["text"] for w in ws)


def _bell(x, ideal, sigma):
    return math.exp(-((x - ideal) ** 2) / (2 * sigma ** 2))


def _silence_ratio(speech, start, end):
    dur = max(0.1, end - start)
    sil = 0.0
    for s, e in speech.get("pauses", []):
        sil += max(0.0, min(e, end) - max(s, start))
    return min(1.0, sil / dur)


def signal_score(words, speech, start, end):
    ws = _win(words, start, end)
    dur = max(0.1, end - start)
    if not ws:
        return 0.0, {}
    txt = _text(ws)

    first = _win(words, start, start + 1.8)
    hook_density = min(1.0, len(first) / 5.0)
    opener = 1.0 if _OPENERS.search((first[0]["text"] if first else "")) else 0.0
    hook_q = 1.0 if ("?" in _text(first) or _NUM.search(_text(first))) else 0.0
    hook = 0.5 * hook_density + 0.3 * opener + 0.2 * hook_q

    wpm = len(ws) / dur * 60.0
    pace = _bell(wpm, config.SCORE_IDEAL_WPM, 55)

    dead = 1.0 - _silence_ratio(speech, start, end)

    cues = sum(bool(rx.search(txt)) for rx in (_NUM, _LIST, _CONTRAST, _CURIOSITY))
    info = min(1.0, cues / 3.0)

    fw = ws[0]["text"]
    clean_start = 1.0 if fw[:1].isupper() else 0.5

    last = ws[-1]["text"].strip()
    payoff = 1.0 if last[-1:] in ".?!" else 0.45

    length_fit = _bell(dur, config.SCORE_IDEAL_SEC, 12)

    parts = {"hook": hook, "info": info, "payoff": payoff, "pace": pace,
             "dead_air": dead, "clean_start": clean_start, "length": length_fit}
    weights = {"hook": 0.30, "info": 0.16, "payoff": 0.14, "pace": 0.12,
               "dead_air": 0.10, "clean_start": 0.08, "length": 0.10}
    score = 100.0 * sum(weights[k] * parts[k] for k in weights)
    return round(score, 1), {k: round(v, 2) for k, v in parts.items()}


def rank_candidates(words, speech, n):
    """Score sentence-aligned candidate windows and return the top-n
    non-overlapping [start,end] pairs (used by --auto)."""
    ends = [i for i, w in enumerate(words) if w["text"].strip()[-1:] in ".?!"]
    starts = [0] + [i + 1 for i in ends if i + 1 < len(words)]
    cands = []
    for si in starts:
        s = words[si]["start"]
        best = None
        for ei in ends:
            if ei < si:
                continue
            e = words[ei]["end"]
            d = e - s
            if d < config.CLIP_MIN_SEC:
                continue
            if d > config.CLIP_MAX_SEC:
                break
            sc, _ = signal_score(words, speech, s, e)
            sc *= _bell(d, config.SCORE_IDEAL_SEC, 12) * 0.4 + 0.6   # nudge toward sweet spot
            if best is None or sc > best[0]:
                best = (sc, s, e)
        if best:
            cands.append(best)
    cands.sort(reverse=True)
    picked = []
    for sc, s, e in cands:
        if all(e <= ps or s >= pe for ps, pe in [(x[1], x[2]) for x in picked]):
            picked.append((sc, s, e))
        if len(picked) >= n:
            break
    return [[round(s, 2), round(e, 2)] for _, s, e in picked]


def annotate(slug):
    proj = config.project_dir(slug)
    data = util.load_json(os.path.join(proj, "clips.json"))
    words = util.load_json(os.path.join(proj, "words.json"))["words"]
    speech = util.load_json(os.path.join(proj, "speech.json"), default={"pauses": []})
    for c in data["clips"]:
        sig, parts = signal_score(words, speech, c["start"], c["end"])
        judge = c.get("judge")
        if judge is not None:
            final = round(config.SCORE_JUDGE_W * judge + (1 - config.SCORE_JUDGE_W) * sig)
        else:
            final = round(sig)
        c["clipscore"] = final
        c["signal_score"] = round(sig)
        c["score_parts"] = parts
    util.save_json(os.path.join(proj, "clips.json"), data)
    return data


def board(slug, annotate_first=True):
    if annotate_first:
        data = annotate(slug)
    else:
        data = util.load_json(os.path.join(config.project_dir(slug), "clips.json"))
    clips = sorted(data["clips"], key=lambda c: c.get("clipscore", 0), reverse=True)
    print(f"\n  CLIPSCORE LEADERBOARD — {slug}   (higher = more likely to pop)\n")
    print(f"  {'#':>2}  {'score':>5}  {'sig/judge':>10}  {'dur':>5}  title")
    print("  " + "-" * 68)
    for rank, c in enumerate(clips, 1):
        jn = c.get("judge")
        sj = f"{c.get('signal_score','?')}/{jn if jn is not None else '-'}"
        dur = c.get("out_duration") or round(c["end"] - c["start"], 1)
        print(f"  {rank:>2}  {c.get('clipscore',0):>5}  {sj:>10}  {dur:>4}s  "
              f"[{c['id']}] {c.get('title','')[:44]}")
    print()
    return clips


def main(slug):
    board(slug)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: score.py <slug>")
    main(sys.argv[1])

#!/usr/bin/env python
"""Per-clip karaoke captions (.ass), adapted from SyncOnyx make_captions.py.

Usage: python captions.py <slug>   (writes clips/<id>.ass for each clip)

Times are clip-relative (the composed clip starts at t=0). Active word is shown
in the accent color; chunks of <=CAP_MAX_WORDS or sentence boundaries, full
coverage. Single bottom-center anchor inside the mobile safe zone (no PiP/CTA).
"""
import os, re, sys
import config, util


def hex2ass(h):
    h = h.lstrip("#")
    return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}".upper()  # ASS is &HAABBGGRR


def _tc(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = t % 60
    return f"{h:d}:{m:02d}:{s:05.2f}"


def _clip_words(words, start, end):
    out = []
    for w in words:
        if w["end"] <= start or w["start"] >= end:
            continue
        out.append({"text": w["text"],
                    "start": round(max(0.0, w["start"] - start), 3),
                    "end": round(min(end, w["end"]) - start, 3)})
    return out


def _is_emph(word):
    lw = word.lower().strip(",.!?;:\"'")
    return bool(re.match(r"^\$?\d", lw)) or lw in config.EMPH_WORDS


def build_ass(words, start, end, hook_text=None, cap_y=None):
    cw = _clip_words(words, start, end)
    dur = end - start
    cap_y = config.CAP_Y if cap_y is None else cap_y
    accent = r"{\1c" + hex2ass(config.CAP_ACCENT_HEX) + "}"
    base = r"{\1c" + hex2ass(config.CAP_BASE_HEX) + "}"
    emph = r"{\1c" + hex2ass(config.CAP_EMPH_HEX) + "}"

    def styled(text, active):
        core = text.strip().strip(",.!?;:\"'")
        if active:                                   # spoken word: accent color + scale pop
            pre = (r"{\fscx%d\fscy%d}" % (config.CAP_POP_SCALE, config.CAP_POP_SCALE)) if config.CAP_POP else ""
            post = r"{\fscx100\fscy100}" if config.CAP_POP else ""
            return pre + accent + core + base + post
        if config.CAP_EMPHASIZE and _is_emph(core):  # numbers / power words: persistent tint
            return emph + core + base
        return core

    chunks, cur = [], []
    for w in cw:
        cur.append(w)
        if w["text"].strip()[-1:] in ".?!" or len(cur) >= config.CAP_MAX_WORDS:
            chunks.append(cur); cur = []
    if cur:
        chunks.append(cur)

    events = []
    for ci, ch in enumerate(chunks):
        nxt = chunks[ci + 1][0]["start"] if ci + 1 < len(chunks) else None
        chunk_end = min(nxt if nxt is not None else ch[-1]["end"] + 0.6, dur)
        for j, w in enumerate(ch):
            s = w["start"]
            e = ch[j + 1]["start"] if j + 1 < len(ch) else chunk_end
            if e <= s:
                e = s + 0.12
            parts = [styled(ww["text"], k == j) for k, ww in enumerate(ch)]
            pos = r"{\an2\pos(%d,%d)}" % (config.OUT_W // 2, cap_y)
            events.append(("Cap", s, e, pos + " ".join(parts)))

    if config.HOOK_OVERLAY and hook_text:            # big stop-scroll card in the first ~2s
        hw = hook_text.strip().split()[:config.HOOK_MAX_WORDS]
        per = max(1, config.HOOK_WORDS_PER_LINE)     # wrap to <=N words/line so it never overflows
        rows = [" ".join(hw[i:i + per]) for i in range(0, len(hw), per)]
        htxt = r"\N".join(rows).upper()
        hline = (r"{\an5\pos(%d,%d)\fad(120,160)}" % (config.OUT_W // 2, config.HOOK_Y)) + htxt
        events.append(("Hook", 0.0, min(config.HOOK_SECONDS, dur), hline))

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {config.OUT_W}
PlayResY: {config.OUT_H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{config.CAP_FONT},{config.CAP_SIZE},{hex2ass(config.CAP_BASE_HEX)},{hex2ass(config.CAP_BASE_HEX)},&H001A1614,&H99000000,-1,0,0,0,100,100,0.6,0,1,{config.CAP_OUTLINE},{config.CAP_SHADOW},2,90,90,360,1
Style: Hook,{config.CAP_FONT},{config.HOOK_SIZE},{hex2ass(config.HOOK_HEX)},{hex2ass(config.HOOK_HEX)},&H00101010,&H90000000,-1,0,0,0,100,100,0.4,0,1,{config.CAP_OUTLINE + 2},{config.CAP_SHADOW},2,80,80,360,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [f"Dialogue: 0,{_tc(s)},{_tc(e)},{style},,0,0,0,,{line}" for style, s, e, line in events]
    return header + "\n".join(lines) + "\n", len(events)


def generate(slug, clip, words):
    proj = config.project_dir(slug)
    ass = os.path.join(proj, "clips", f"{clip['id']}.ass")
    text, n = build_ass(words, clip["start"], clip["end"])
    os.makedirs(os.path.dirname(ass), exist_ok=True)
    with open(ass, "w", encoding="utf-8") as f:
        f.write(text)
    return ass, n


def main(slug):
    proj = config.project_dir(slug)
    data = util.load_json(os.path.join(proj, "clips.json"))
    words = util.load_json(os.path.join(proj, "words.json"))["words"]
    for c in data["clips"]:
        ass, n = generate(slug, c, words)
        print(f"[captions] clip {c['id']}: {n} events -> {os.path.basename(ass)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: captions.py <slug>")
    main(sys.argv[1])

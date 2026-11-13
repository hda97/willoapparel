# 🎬 Clipping Agent — a Claude Code skill

Turn any long-form video (a YouTube link **or** a local file) into short, scroll-stopping
**9:16 vertical clips** — auto-reframed, jump-cut, karaoke-captioned, and **ranked by a
ClipScore** so you know which ones to post first. Then review and publish to socials.

It runs as a [Claude Code](https://claude.com/claude-code) **skill**: you just say
*"clip this &lt;url&gt;"* and the agent drives the whole pipeline. All the ML runs **locally on
CPU via [onnxruntime](https://onnxruntime.ai/)** — **no GPU, no PyTorch, no OpenCV, no cloud
required** for the core pipeline. It's a lightweight stack that runs on basically any machine.

> Built by [Kevin Smith — "Kev the AI Guy"](https://github.com/KevTheAIGuy). MIT licensed —
> clone it, use it, remix it.

---

## What it does

- **Finds the best moments** — transcribes the video (Parakeet-TDT ONNX) and the agent picks
  the most scroll-stopping, self-contained moments (or `--auto` ranks candidates for you).
- **ClipScore** — every clip gets a 0–100 virality score (a deterministic signal model —
  hook energy, pace, dead-air, info cues, clean start/payoff — blended with the agent's
  judgment) and a printed leaderboard so you post the winners first.
- **Smart auto-reframing** to 9:16 (YuNet face detection, ONNX): subject **tracking**,
  top/bottom **split-screen** for two people, **blur-fill** for graphics — steady per-shot
  framing that only re-centers on an actual camera cut (no jitter).
- **Jump-cut tightening** — removes silences, breaths, and "um"/"uh" fillers (word-aware, never
  clips a real word) for rapid-fire pacing, then re-times the captions to the cut.
- **Karaoke captions** — burned-in, word-by-word highlight with an active-word pop + keyword
  emphasis. Optional big hook overlay.
- **Loudness-normalized audio** (EBU R128 ~-14 LUFS) so every clip is consistently loud.
- **Publish** to socials via [Blotato](https://blotato.com/) (agent-driven, with a review gate).
- **Scales the clip count** to the video (~5–10 per 10 min by default; or tell it exactly how many).

Two engines, same review/publish path:
- **local** (default) — free, offline, full control; you/the agent pick moments and a local
  ffmpeg + ONNX engine does the rest.
- **vidIQ fast-lane** (optional) — hand a YouTube link to vidIQ for cloud auto-clipping (costs
  credits; requires the vidIQ MCP).

---

## Requirements

- **[Claude Code](https://claude.com/claude-code)** (this is a skill for it).
- **Python 3.10+** and **[ffmpeg](https://ffmpeg.org/)** on your PATH.
- ~1–2 GB disk for the ONNX models (downloaded once on first run to your Hugging Face cache).
- Internet only for: downloading a YouTube source, the first-run model download, and (optional)
  publishing. The clipping itself is fully local.
- Optional: a [Blotato](https://blotato.com/) account + MCP for publishing; a vidIQ MCP for the
  cloud fast-lane.

CPU-only by design. It deliberately avoids torch / opencv-python / faster-whisper / mediapipe.

---

## Install (into Claude Code)

Clone this repo into your Claude Code **skills** directory as `clipping-agent`:

```bash
# macOS / Linux
git clone https://github.com/KevTheAIGuy/clipping-agent.git ~/.claude/skills/clipping-agent
cd ~/.claude/skills/clipping-agent
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

```powershell
# Windows (PowerShell)
git clone https://github.com/KevTheAIGuy/clipping-agent.git "$env:USERPROFILE\.claude\skills\clipping-agent"
cd "$env:USERPROFILE\.claude\skills\clipping-agent"
python -m venv .venv
.venv\Scripts\python -m pip install --only-binary=:all: -r requirements.txt
```

That's it. Open Claude Code and the `clipping-agent` skill will be available.

---

## Use it

In Claude Code, just say what you want:

```
clip this https://youtu.be/XXXXXXXXXXX
```

or

```
make 8 reels from C:\path\to\my-podcast.mp4
```

The agent will ingest + transcribe the video, pick the best moments, render the vertical clips
with captions, print the **ClipScore leaderboard**, and show you each clip for review before
anything gets published. You stay in control of the moment selection and the final post.

Handy flags (the agent uses these under the hood, or you can ask for them):
- `--strip-captions` — the source **already** has burned-in captions? This crops past them so only
  *your* captions show (no double captions).
- `--no-jumpcut` — keep every pause (disable the rapid-fire cutting).
- `--clips N` — force exactly N clips.

All the knobs (caption style, jump-cut sensitivity, framing thresholds, ClipScore weights, encode
settings) live in [`scripts/config.py`](scripts/config.py).

---

## How it's built

A thin, readable pipeline of small Python modules (`scripts/`) that the Claude Code agent
orchestrates. The **reasoning** (which moments, the review, publishing) is agent-driven; the
**deterministic compute** (download, transcribe, detect, cut, reframe, caption, encode, score)
is plain Python + ffmpeg + onnxruntime. See [`SKILL.md`](SKILL.md) for the full workflow and
[`ROADMAP.md`](ROADMAP.md) for where it's headed (active-speaker detection, diarization, auto
b-roll, and more).

Models used (all ONNX / CPU): **Parakeet-TDT** (ASR + word timestamps), **Silero VAD** (speech),
**YuNet** (faces).

---

## Notes & credits

- This is a personal project shared for the community — provided **as-is** under the MIT license.
- You are responsible for the rights to any video you clip and for complying with each platform's
  terms when you publish. Don't clip or repost content you don't have permission to use.
- Third-party tools/services (ffmpeg, Hugging Face models, Blotato, vidIQ, YouTube) are governed by
  their own licenses and terms.

PRs and forks welcome. If you build something cool with it, tag [@KevTheAIGuy](https://github.com/KevTheAIGuy). 🚀

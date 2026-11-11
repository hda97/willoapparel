---
name: clipping-agent
description: Turn a long-form video (YouTube/web link OR local file) into short vertical 9:16 social clips (20-60s, default 5) with smart auto-reframing (subject tracking, top/bottom split-screen for two people, blur-fill for graphics), burned-in karaoke captions, then review and publish to social media via Blotato. Use when the user wants to clip a long video into shorts/reels, make short-form clips from long-form, find the best/most viral moments of a video, repurpose a podcast/talk/interview/webinar into vertical clips, or says "clip this", "make shorts from this", "turn this into reels", "cut this into clips".
---

# Clipping Agent

Long-form video -> N scroll-stopping 9:16 clips with captions -> review -> post.

Two engines, same review/publish path:
- **local** (default): YOU pick the moments (transcript + visual cues) and a local
  ffmpeg/ONNX engine reframes + captions. Full control, no credits, offline.
- **vidiq** fast-lane: hand a YouTube link to vidIQ, which auto-clips + reframes +
  captions in the cloud. Fast, but costs ~9 credits/source-minute and is less controllable.

Everything ML runs on **onnxruntime (CPU)** — no torch / opencv / faster-whisper /
mediapipe / GPU required. That's the point: a lightweight CPU stack that runs anywhere.
Don't add those heavy deps.

## Setup (one-time)
The skill lives in your Claude Code skills dir (its absolute path is given to the agent
at load time as "Base directory for this skill" — use that as `<skill-dir>`). Create the venv:
```
cd "<skill-dir>"
python -m venv .venv
# Windows:
.venv\Scripts\python -m pip install --only-binary=:all: -r requirements.txt
# macOS / Linux:
.venv/bin/python -m pip install -r requirements.txt
```
Run every script with the venv python and silence the HF symlink warning. Set `PY` to the
venv python for your OS (`<skill-dir>\.venv\Scripts\python.exe` on Windows,
`<skill-dir>/.venv/bin/python` on macOS/Linux):
```
$env:HF_HUB_DISABLE_SYMLINKS_WARNING="1"    # PowerShell (bash: export HF_HUB_DISABLE_SYMLINKS_WARNING=1)
```
First run downloads ONNX models (~once, to your HF cache): Parakeet-TDT int8 (ASR),
Silero VAD, YuNet (faces). Requires `ffmpeg` on PATH.

`<slug>` = a short kebab name for the job. Per-job files land in `projects/<slug>/`.

---

## Workflow A — LOCAL engine (default)

### 1. Ingest + analyze
```
& $PY scripts\orchestrate.py <slug> "<url-or-local-path>" --prep
```
Produces `words.json` (word timings), `speech.json` (pauses), `analysis.json`
(scene cuts + face-presence timeline + graphics_ratio). Add `--no-scene` to skip
scene-cut detection (faster on long sources).

### 2. Pick the moments (this is the real intelligence — YOU do it)
Read `projects/<slug>/words.json` and `projects/<slug>/analysis.json`. Choose the
**most scroll-stopping, self-contained** moments. **How many:** aim for ~5-10 per
10 min of source (~7/10min) — e.g. ~3-5 for a 6-min clip, ~20-35 for a 45-min
podcast — but only include genuinely strong, distinct moments (don't pad to hit a
number). If the user gave an explicit count, use exactly that. A great clip:
- opens with a hook (a question, bold claim, surprising stat, emotional beat) in the first ~2s,
- is a complete thought (don't start mid-sentence or cut off a payoff),
- is 20-60s, and clips don't overlap,
- ideally lands on visually lively spots (use `analysis.json` scene_cuts / high face presence).
Pick slightly generous [start,end] in seconds — `boundary_snap` will tighten edges to
word/sentence/pause boundaries. Then write `projects/<slug>/picks.json`:
```json
[
  {"start": 73.5, "end": 112.0,
   "reason": "hook: 'nobody tells you this about X' + concrete payoff",
   "title": "The thing nobody tells you about X",
   "hook": "Nobody tells you this about X",
   "judge": 84,
   "caption": "The one mistake costing you clients 👀",
   "hashtags": ["#sales", "#smallbusiness"]}
]
```
Write a strong platform caption + 3-6 hashtags per clip (you can also do this after rendering).
- `hook` (optional): a short ≤7-word stop-scroll line burned big in the first ~2s (upper third). Omit to skip.
- `judge` (optional but recommended): YOUR 0-100 virality call for this moment (hook strength, payoff,
  quotability, emotional/counterintuitive charge, shareability). It's blended with a deterministic
  signal score into the **clipscore** (`config.SCORE_JUDGE_W`). Score honestly — it's how clips get ranked.

### 3. Render
```
& $PY scripts\orchestrate.py <slug> --render --picks projects\<slug>\picks.json
```
This runs selection -> boundary_snap -> detect (layout + steady per-shot framing) ->
jump-cut plan -> compose. Output: `projects/<slug>/clips/<id>.mp4` (1080x1920).
Each clip's chosen layout (track/split/blur/wide) is saved in `clips.json` under `frame`,
and its tightened runtime under `out_duration`.

By default the render now:
- **jump-cuts dead air** — removes silences, breaths, and "um"/"uh" fillers (word-aware,
  never crosses a real word onset) so clips are rapid-fire, and re-times captions to the cut.
- **holds steady framing** — the `track` crop stays fixed per camera shot and only re-centers
  when the video actually cuts to another person (no per-frame panning jitter).
- **burns our karaoke captions** on the tightened timeline.

Flags:
- `--strip-captions` — the SOURCE already has burned-in captions (common for re-clipping a
  finished YouTube video). Zoom-crops past the bottom caption band so only OUR captions show.
  Without this, a pre-captioned source will show double captions. Check a source frame first:
  `ffmpeg -ss <t> -i projects\<slug>\source.mp4 -frames:v 1 f.png` and view it.
- `--no-jumpcut` — keep every pause/filler (disable the rapid-fire cutting).
All thresholds (silence sensitivity, filler list, scene threshold, caption band) live in `config.py`.

### 4. Review with the user (required before posting)
The render ends by printing the **ClipScore leaderboard** (also re-runnable any time:
`& $PY scripts\score.py <slug>`). Lead the review with it — rank clips by `clipscore`
(0-100; higher = more likely to pop) so the user sees at a glance which to post first.
Then show each clip: file path, clipscore, chosen layout, tightened duration, caption,
hashtags. (All in `clips.json`: `clipscore`, `signal_score`, `judge`, `score_parts`.)
Let them approve / tweak captions / drop clips. To spot-check framing, extract a
thumbnail: `ffmpeg -ss <t> -i clips\<id>.mp4 -frames:v 1 thumb.png` and view it.

### 5. Publish (agent-driven, via Blotato MCP) — see "Publishing" below.

**Unattended/test shortcut** (heuristic selection, no human picks):
```
& $PY scripts\orchestrate.py <slug> "<source>" --auto --clips 5
```

---

## Workflow B — vidIQ fast-lane (cloud)

Use when the source is a YouTube URL and speed matters, or a local source is too long
for comfortable CPU processing.

1. **Cost gate (MANDATORY):** `& $PY scripts\cost.py <slug> --engine vidiq` (after a
   `--prep` so duration is known, or estimate from the known length). Show the credit
   cost and check `vidiq_balance` (MCP). Get explicit user confirmation before submitting.
2. Submit: MCP `vidiq_generate_clips(videoUrl="<youtube>", prompt="most newsworthy, scroll-stopping moments", clipDuration=<~40>, captionStyle="Loud & Clear")`. For a local file, first host it (Blotato presign upload) and pass `uploadedVideoUrl` + `videoDuration` + `videoFilename`.
3. Poll MCP `vidiq_job_poll(mcpJobId)` until `status=="completed"`; read the clip URLs from `result`.
4. Download into the project: `& $PY scripts\vidiq_clip.py <slug> <clipUrl1> <clipUrl2> ...`
5. Review + Publish exactly as in Workflow A (both engines leave plain mp4s in `clips/`).

---

## Publishing (Blotato MCP — agent-driven)

Only after the user approves. For each approved clip:
1. `blotato_list_accounts` -> pick the target account(s); note `accountId`, `platform`,
   and platform-required fields (TikTok needs `privacyLevel`; YouTube needs `title`+`privacyStatus`; etc.).
2. `blotato_create_presigned_upload_url(filename="<id>.mp4")` -> `{presignedUrl, publicUrl}`.
3. `& $PY scripts\host.py "projects\<slug>\clips\<id>.mp4" "<presignedUrl>" "video/mp4"` (PUT upload).
4. `blotato_create_post(accountId, platform, text="<caption + hashtags>", mediaUrls=["<publicUrl>"], mediaType="reel" where applicable)`. Use `scheduledTime` to schedule.
5. Record the returned post URL/status back into `clips.json` (set the clip `status="posted"`).
Confirm target platforms/accounts with the user before the first post — posting is outward-facing.

---

## Cost & safety gates
- **Local engine = free** (CPU only). Still show the rough time estimate from `cost.py`.
- **vidIQ = paid**: NEVER call `vidiq_generate_clips` without showing `ceil(minutes)*9`
  credits and getting explicit confirmation (check `vidiq_balance` first).
- **Never auto-post**: always review with the user before Blotato `create_post`.

## Layouts (decided per clip by detect.py)
- **track** — one dominant face: a 1080-wide window pans to follow it (smoothed, dead-banded).
- **split** — two dominant faces far apart: top/bottom split-screen, each face framed.
- **wide** — two faces close together (or several that fit): one window on their midpoint.
- **blur** — no dominant face / graphics-heavy / already-vertical source: blurred-fill, loses nothing.

## Tunables
All thresholds live in `scripts/config.py`. Highlights:
- **count**: `DEFAULT_CLIPS_PER_10MIN` (~5-10/10min via `default_clip_count()`); `CLIP_MIN/MAX_SEC`.
- **jump-cut**: `JUMPCUT`, `SIL_NOISE/SIL_MIN`, `CUT_LEAD/TAIL`, `FILLERS`.
- **framing**: `STEADY_FRAMING`, `SCENE_THR`, `MIN_FACE_AREA`, `FAR_APART_GAP`, `STRIP_SOURCE_CAPTIONS`/`CAPTION_BAND_FRAC`.
- **captions**: `CAP_FONT/SIZE/ACCENT_HEX/EMPH_HEX/Y`, `CAP_POP`/`CAP_POP_SCALE`, `CAP_EMPHASIZE`/`EMPH_WORDS`.
- **hook overlay**: `HOOK_OVERLAY`, `HOOK_SIZE/Y/SECONDS/WORDS_PER_LINE`.
- **audio**: `LOUDNORM` + `LOUDNORM_I/TP/LRA` (EBU R128 to ~-14 LUFS).
- **clipscore**: `SCORE_JUDGE_W` (judge vs signal blend), `SCORE_IDEAL_WPM/SEC`.
Edit there, not in the pipeline scripts.

## Files per job (`projects/<slug>/`)
`source.mp4` (or external path) · `audio16k.wav` · `words.json` · `speech.json` ·
`analysis.json` · `picks.json` (you author) · `clips.json` (the spec/state, incl. per-clip
`clipscore`/`signal_score`/`judge`/`score_parts`) · `clips/<id>.mp4` + `clips/<id>.ass`.

## Module map (`scripts/`)
ingest: `download` · `transcribe` · `vad` · `analyze` · `selection` · `boundary_snap`
framing: `detect` · `reframe` · `captions` · `cut` (jump-cut plan) · `compose` (shared detector: `face`)
rank: `score` (clipscore + leaderboard)
publish: `cost` · `host` · `vidiq_clip` · driver: `orchestrate` · shared: `config`, `util`

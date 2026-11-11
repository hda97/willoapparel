# Framing engine — decision tree & ffmpeg patterns

`detect.py` samples each clip at `SAMPLE_FPS` (default 4) using `face.detect_frame`
(YuNet ONNX on CPU), links faces into tracks (greedy nearest-center), and decides a
layout. `reframe.py` turns the decision into an ffmpeg `filter_complex`; `compose.py`
trims, applies it, burns the `.ass` captions, and encodes. Crop math reuses the
SyncOnyx `make_final.py` pattern `scale=-2:1920,crop=1080:1920:X:0`.

## Decision tree (per clip; thresholds in config.py)
- source aspect < 1.2 (already vertical) -> **blur**
- largest face < `GRAPHICS_FACE_AREA` for >= `GRAPHICS_RATIO` of frames -> **blur**
- dominant tracks = median area >= `MIN_FACE_AREA` AND presence >= `MIN_PRESENCE`:
  - 0 -> **blur**
  - 1 -> **track**
  - 2 with center-x gap > `FAR_APART_GAP` -> **split**
  - else (close / >2 that fit) -> **wide**

A "dominant face" is ~>=11% of frame width (`MIN_FACE_AREA=0.012`). Tuned on real
head-and-shoulders shots (a tight head-shot is ~0.05; a wide two-shot face ~0.016).

## ffmpeg filtergraphs (output 1080x1920)
**track** — smoothed crop-x per sampled frame (scipy gaussian) -> dead-banded into
piecewise-constant 1s+ segments -> trim+crop+concat (collapses to a single crop when
near-stationary). Avoids brittle per-frame x= expressions and tracking jitter.
```
[0:v]scale=-2:1920,fps=30,setsar=1,split=K[s0]..[sK-1];
[s0]trim=t0:t1,setpts=PTS-STARTPTS,crop=1080:1920:X0:0[v0]; ... ;
[v0][v1]..concat=n=K:v=1,setsar=1[vout]
```
**split** — 9:8 full-height crop per subject (top = left-most), scaled to 1080x960, vstack:
```
[0:v]split=2[a][b];
[a]crop=CW:CH:TOPX:0,scale=1080:960,setsar=1[top];
[b]crop=CW:CH:BOTX:0,scale=1080:960,setsar=1[bot];
[top][bot]vstack=inputs=2,setsar=1[vout]
```
**blur** — blurred cover-scaled background + foreground fit (loses nothing):
```
[0:v]split=2[bg][fg];
[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=26[bgb];
[fg]scale=1080:1920:force_original_aspect_ratio=decrease[fgs];
[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1[vout]
```
**wide** — single static window on the midpoint: `[0:v]scale=-2:1920,setsar=1,crop=1080:1920:X:0[vout]`

Captions are appended last: `[vout]subtitles=<id>.ass[vf]` (ffmpeg run with cwd=clips dir
so the bare filename resolves on Windows). Encode: libx264 veryfast crf 21, +faststart.

## Validated (Phase 0/2)
ASR+timestamps (Parakeet-TDT int8, ~1s/30s audio), Silero VAD, YuNet (~10-25ms/frame),
and all of blur/track/split rendered correctly on real + synthetic 16:9 sources.

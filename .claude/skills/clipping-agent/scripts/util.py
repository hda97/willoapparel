"""Shared helpers: subprocess, ffprobe, json IO, frame sampling, slugify."""
import json, os, re, subprocess, sys
import numpy as np


def run(cmd, **kw):
    """Run a command, raising with stderr on failure. Returns CompletedProcess."""
    p = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if p.returncode != 0:
        raise RuntimeError(f"command failed ({p.returncode}): {' '.join(map(str, cmd))}\n{p.stderr[-2000:]}")
    return p


def slugify(name):
    s = re.sub(r"[^a-zA-Z0-9]+", "-", str(name).strip().lower()).strip("-")
    return s[:60] or "clip-project"


def load_json(path, default=None):
    if not os.path.exists(path) and default is not None:
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


def ffprobe_meta(path):
    """Return {duration,width,height,fps} for a media file."""
    p = run(["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height,avg_frame_rate:format=duration",
             "-of", "json", path])
    d = json.loads(p.stdout)
    st = (d.get("streams") or [{}])[0]
    num, den = (st.get("avg_frame_rate") or "30/1").split("/")
    fps = float(num) / float(den) if float(den or 0) else 30.0
    return {
        "width": int(st.get("width", 0)),
        "height": int(st.get("height", 0)),
        "fps": round(fps, 3),
        "duration": float(d.get("format", {}).get("duration", 0.0)),
    }


def sample_frames(path, start, end, fps, width):
    """Pipe frames from [start,end] at `fps`, scaled to `width` (height auto, even).
    Returns (frames ndarray [n,H,W,3] uint8, actual_height)."""
    dur = max(0.05, end - start)
    # probe to compute scaled height (keep aspect, even)
    meta = ffprobe_meta(path)
    ow, oh = meta["width"], meta["height"]
    h = int(round(width * oh / ow))
    h -= h % 2
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error",
           "-ss", f"{start:.3f}", "-i", path, "-t", f"{dur:.3f}",
           "-vf", f"fps={fps},scale={width}:{h}",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    fb = width * h * 3
    n = len(raw) // fb
    if n == 0:
        return np.zeros((0, h, width, 3), np.uint8), h
    arr = np.frombuffer(raw[: n * fb], np.uint8).reshape(n, h, width, 3)
    return arr, h


def is_url(s):
    return isinstance(s, str) and re.match(r"^https?://", s.strip()) is not None


def ensure_wav16k(source_path, out_path):
    """Extract 16kHz mono PCM wav (idempotent). Returns out_path."""
    if os.path.exists(out_path):
        return out_path
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", source_path,
         "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", out_path])
    return out_path

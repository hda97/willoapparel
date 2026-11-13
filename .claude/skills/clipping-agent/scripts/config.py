"""Central configuration for the Clipping Agent.

All tunables live here. Scripts in this folder import it directly
(`import config`) because Python puts the running script's dir on sys.path.
"""
import os

# ---- paths ----
SKILL_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(SKILL_ROOT, "scripts")
MODELS_DIR = os.path.join(SKILL_ROOT, "models")
PROJECTS_DIR = os.path.join(SKILL_ROOT, "projects")
VENV_PY = os.path.join(SKILL_ROOT, ".venv", "Scripts", "python.exe")

# ---- models (all ONNX, run on onnxruntime CPU — no torch/GPU) ----
ASR_MODEL = "nemo-parakeet-tdt-0.6b-v2"   # English, emits word/token timestamps
ASR_QUANT = "int8"                         # int8 = small download + fast CPU
ASR_CHUNK_SEC = 120                        # transcribe in silence-snapped windows of this
                                           # length; attention is O(n^2), so a full hour in
                                           # one pass OOMs. ~120s keeps memory tiny + accurate.
ASR_CHUNK_SEARCH_SEC = 8                   # +/- window to hunt for the quietest cut point
VAD_MODEL = "silero"
FACE_REPO = "opencv/face_detection_yunet"
FACE_FILE = "face_detection_yunet_2023mar.onnx"
FACE_INPUT = 640                           # YuNet fixed square input

# ---- clip selection ----
# Default clip COUNT scales with source length: ~5-10 clips per 10 min of video.
# An explicit user-given count always overrides this.
DEFAULT_CLIPS_PER_10MIN = 7
DEFAULT_CLIPS = 5              # floor / fallback when duration is unknown
CLIP_MIN_SEC = 20.0
CLIP_MAX_SEC = 60.0


def default_clip_count(duration_sec):
    """~5-10 clips per 10 min of source (target 7/10min)."""
    return max(1, round((duration_sec / 600.0) * DEFAULT_CLIPS_PER_10MIN))

# ---- jump-cut (silence / breath / filler removal -> rapid-fire pacing) ----
JUMPCUT = True                # remove dead air + fillers, re-time captions to the cut
SIL_NOISE = "-30dB"           # silencedetect: anything quieter than this is "silence"
SIL_MIN = 0.18                # ...that lasts >= this many seconds is a cuttable pause
CUT_LEAD = 0.06               # keep this much BEFORE the next word onset (protect soft openers)
CUT_TAIL = 0.04               # keep this much AFTER speech drops (protect word tails)
MIN_CUT = 0.08                # skip cuts shorter than this once padded (not worth a seam)
MIN_KEEP = 0.10               # drop keep windows shorter than this
FILLERS = {"um", "uh", "umm", "uhh", "er", "erm", "mm", "hmm", "uhm", "mhm", "ums"}

# ---- steady framing (per-shot static crop; only re-centers on a real camera cut) ----
STEADY_FRAMING = True         # track layout holds one face-center per shot (no per-frame pan)
SCENE_THR = 0.4               # ffmpeg scene score for a camera-cut inside a clip
MIN_SHOT_SEC = 0.5            # merge shots shorter than this into the previous one

# ---- source-caption removal (opt-in: only for sources already burned with captions) ----
STRIP_SOURCE_CAPTIONS = False # zoom-crop past a bottom caption band so OUR captions are the only ones
CAPTION_BAND_FRAC = 0.74      # keep the top this fraction of the frame (drops the burned caption band)

# ---- output video ----
OUT_W = 1080
OUT_H = 1920
FPS = 30
# CPU-friendly encode (matches SyncOnyx make_final.py)
ENCODE_VIDEO = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
ENCODE_AUDIO = ["-c:a", "aac", "-b:a", "160k"]

# ---- framing decision thresholds (fractions of source frame) ----
SAMPLE_FPS = 4                # detection sampling rate on the trimmed clip
MIN_FACE_AREA = 0.012         # a "dominant" face covers >= this frac of frame area
                              # (~11% of frame width; medium head-and-shoulders shot)
MIN_PRESENCE = 0.50           # ...and is present in >= this frac of sampled frames
GRAPHICS_FACE_AREA = 0.007    # largest face below this for...
GRAPHICS_RATIO = 0.70         # ...this frac of frames => treat as graphics -> blur-fill
FAR_APART_GAP = 0.45          # two faces whose center-x gap exceeds this => split-screen
FACE_SCORE_THR = 0.6          # YuNet detection score threshold
TRACK_JUMP_FRAC = 0.15        # max center jump (frac of W) to link faces across frames

# ---- tracked-crop smoothing ----
SMOOTH_SIGMA_SEC = 0.8        # gaussian smoothing of crop-x over time
SEGMENT_SEC = 1.0             # quantize tracked crop into static sub-segments of this length
DEADBAND_PX = 24              # ignore crop-x moves smaller than this

# ---- captions (karaoke ASS, adapted from SyncOnyx make_captions.py) ----
# Default look: karaoke with an active-word scale-pop + keyword emphasis.
CAP_FONT = "Arial"            # use a font installed on the box (libass needs it present)
CAP_SIZE = 78
CAP_BASE_HEX = "#FFFFFF"      # normal word color
CAP_ACCENT_HEX = "#FFD400"    # active (spoken) word color
CAP_EMPH_HEX = "#00E0FF"      # persistent emphasis color for numbers / power words
CAP_Y = 1440                  # bottom-center baseline (mobile safe zone, clear of platform UI)
CAP_MAX_WORDS = 3             # words per karaoke chunk
CAP_OUTLINE = 6
CAP_SHADOW = 3
CAP_POP = True                # active word scale-pops (Submagic/Hormozi style)
CAP_POP_SCALE = 116           # active word scaled to this % (hard cut in, no slow fade)
CAP_EMPHASIZE = True          # persistently color numbers + power words for scannability
EMPH_WORDS = {"never", "always", "stop", "everyone", "everybody", "nobody", "secret",
              "free", "million", "thousand", "hundred", "biggest", "number", "one",
              "most", "best", "worst", "first", "why", "how", "money"}

# ---- hook overlay (big stop-scroll text in the first ~2s; separate from captions) ----
HOOK_OVERLAY = False          # OFF by default. Toggle on per taste.
HOOK_SECONDS = 2.2            # how long the hook card holds
HOOK_SIZE = 82
HOOK_Y = 560                  # upper third
HOOK_HEX = "#FFFFFF"
HOOK_ACCENT_HEX = "#FFD400"
HOOK_MAX_WORDS = 6            # keep it glanceable
HOOK_WORDS_PER_LINE = 3      # wrap so a big hook never overflows frame width

# ---- audio polish ----
LOUDNORM = True               # EBU R128 loudness normalize toward platform target
LOUDNORM_I = -14              # integrated LUFS target (TikTok/IG/YouTube ~ -14)
LOUDNORM_TP = -1.5            # true-peak ceiling (dBTP)
LOUDNORM_LRA = 11             # loudness range

# ---- clipscore (virality ranking) ----
# final clipscore = SCORE_JUDGE_W * agent_judge + (1-SCORE_JUDGE_W) * signal_score
# (signal-only when the agent didn't author a judge score in picks.json)
SCORE_JUDGE_W = 0.65
SCORE_IDEAL_WPM = 175         # liveliest talking-head pace
SCORE_IDEAL_SEC = 34         # sweet-spot clip length

# ---- vidIQ fast-lane ----
VIDIQ_CREDITS_PER_MIN = 9

def project_dir(slug):
    d = os.path.join(PROJECTS_DIR, slug)
    return d

def ensure_project(slug):
    d = project_dir(slug)
    os.makedirs(os.path.join(d, "clips"), exist_ok=True)
    os.makedirs(d, exist_ok=True)
    return d

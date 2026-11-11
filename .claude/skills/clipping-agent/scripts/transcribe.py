#!/usr/bin/env python
"""Transcribe the source with word-level timestamps.

Usage: python transcribe.py <slug>

Produces:
  projects/<slug>/audio16k.wav   (16kHz mono)
  projects/<slug>/words.json     {"text": str, "words": [{"text","start","end"}]}

Model: NeMo Parakeet TDT (int8) via onnx-asr -> token timestamps grouped to words.
Whisper is NOT used: it transcribes well but returns empty timestamps here.
"""
import os, sys
import config, util


def tokens_to_words(tokens, timestamps, audio_dur):
    """Group subword tokens into words. A token beginning with a space starts a
    new word; punctuation/continuation tokens attach to the current word.
    Token timestamps are onsets; word end = next word's onset."""
    words = []
    cur_txt, cur_start = "", None
    for tok, ts in zip(tokens, timestamps):
        starts_word = tok.startswith(" ") or tok.startswith("▁")
        clean = tok.replace("▁", " ")
        if starts_word and cur_txt.strip():
            words.append({"text": cur_txt.strip(), "start": cur_start})
            cur_txt, cur_start = "", None
        if cur_start is None:
            cur_start = float(ts)
        cur_txt += clean
    if cur_txt.strip():
        words.append({"text": cur_txt.strip(), "start": cur_start})
    # fill ends from next word's start; last word gets a short tail
    for i, w in enumerate(words):
        if i + 1 < len(words):
            w["end"] = words[i + 1]["start"]
        else:
            w["end"] = min(audio_dur, w["start"] + 0.4)
        if w["end"] <= w["start"]:
            w["end"] = w["start"] + 0.12
        w["start"] = round(w["start"], 3)
        w["end"] = round(w["end"], 3)
    return words


def chunk_bounds(audio, sr, target_sec, search_sec):
    """Split a mono waveform into ~target_sec windows, snapping each cut to the
    quietest 20ms frame within +/- search_sec of the ideal boundary so we never
    slice through the middle of a word. Returns a list of (start, end) sample
    indices covering the whole signal. Chunking is required because Parakeet's
    self-attention is O(n^2) in length: a full hour in one pass OOMs (~80GB)."""
    import numpy as np
    n = len(audio)
    target = int(target_sec * sr)
    search = int(search_sec * sr)
    frame = max(1, int(0.02 * sr))          # 20ms energy frame
    bounds, start = [], 0
    while start < n:
        ideal = start + target
        if ideal >= n:
            bounds.append((start, n))
            break
        lo = max(start + target // 2, ideal - search)
        hi = min(n, ideal + search)
        # per-frame energy across [lo, hi); cut at the quietest frame's center
        seg = audio[lo:hi]
        nf = len(seg) // frame
        if nf > 0:
            e = (seg[: nf * frame].reshape(nf, frame) ** 2).sum(axis=1)
            cut = lo + int(e.argmin()) * frame + frame // 2
        else:
            cut = ideal
        bounds.append((start, cut))
        start = cut
    return bounds


def main(slug):
    import numpy as np
    import onnx_asr
    from onnx_asr.utils import read_wav
    proj = config.project_dir(slug)
    data = util.load_json(os.path.join(proj, "clips.json"))
    source = data["source"]["path"]
    wav = util.ensure_wav16k(source, os.path.join(proj, "audio16k.wav"))
    dur = data["source"]["duration"]

    print(f"[transcribe] loading {config.ASR_MODEL} ({config.ASR_QUANT})...")
    model = onnx_asr.load_model(config.ASR_MODEL, quantization=config.ASR_QUANT).with_timestamps()

    audio, sr = read_wav(wav)               # float32 in [-1,1], shape (n, ch)
    audio = audio[:, 0] if audio.ndim > 1 else audio
    bounds = chunk_bounds(audio, sr, config.ASR_CHUNK_SEC, config.ASR_CHUNK_SEARCH_SEC)

    tokens, stamps, texts = [], [], []
    for i, (s0, s1) in enumerate(bounds):
        off = s0 / sr
        print(f"[transcribe] chunk {i + 1}/{len(bounds)}  {off:6.1f}-{s1 / sr:6.1f}s ...")
        res = model.recognize(np.ascontiguousarray(audio[s0:s1]), sample_rate=sr)
        for tok, ts in zip(res.tokens or [], res.timestamps or []):
            tokens.append(tok)
            stamps.append(float(ts) + off)  # offset chunk-relative -> absolute
        if res.text:
            texts.append(res.text.strip())

    words = tokens_to_words(tokens, stamps, dur)
    out = {"text": " ".join(texts), "words": words}
    util.save_json(os.path.join(proj, "words.json"), out)
    print(f"[transcribe] {len(words)} words, {len(out['text'])} chars -> words.json")
    return out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: transcribe.py <slug>")
    main(sys.argv[1])

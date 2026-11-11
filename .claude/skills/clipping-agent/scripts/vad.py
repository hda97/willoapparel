#!/usr/bin/env python
"""Voice-activity detection -> speech segments + pauses (for boundary snapping).

Usage: python vad.py <slug>

Produces projects/<slug>/speech.json:
  {"duration": float, "speech": [[start,end],...], "pauses": [[start,end],...]}
All times in seconds. Silero VAD via onnx-asr (CPU, ONNX).
"""
import os, sys
import numpy as np
import config, util

SR = 16000


def main(slug, min_silence_ms=300, speech_pad_ms=0, threshold=0.5):
    import onnx_asr
    import soundfile as sf
    proj = config.project_dir(slug)
    data = util.load_json(os.path.join(proj, "clips.json"))
    wav = util.ensure_wav16k(data["source"]["path"], os.path.join(proj, "audio16k.wav"))

    audio, sr = sf.read(wav, dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    dur = len(audio) / SR

    vad = onnx_asr.load_vad(config.VAD_MODEL)
    out = vad.segment_batch(
        audio[None, :], np.array([len(audio)], dtype=np.int64), SR,
        threshold=threshold, min_silence_duration_ms=min_silence_ms, speech_pad_ms=speech_pad_ms,
    )
    segs = [(a / SR, b / SR) for (a, b) in next(iter(out))]

    # pauses = gaps between speech (plus head/tail silence)
    # With speech_pad_ms=0, gaps between segments are true silences (>= min_silence).
    pauses = []
    prev = 0.0
    for s, e in segs:
        if s - prev > 0.05:
            pauses.append([round(prev, 3), round(s, 3)])
        prev = e
    if dur - prev > 0.05:
        pauses.append([round(prev, 3), round(dur, 3)])

    res = {"duration": round(dur, 3),
           "speech": [[round(s, 3), round(e, 3)] for s, e in segs],
           "pauses": pauses}
    util.save_json(os.path.join(proj, "speech.json"), res)
    print(f"[vad] {len(segs)} speech segments, {len(pauses)} pauses, dur={dur:.1f}s -> speech.json")
    return res


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: vad.py <slug>")
    main(sys.argv[1])

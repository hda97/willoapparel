#!/usr/bin/env python
"""Estimate cost for a run and print a confirmation message (the spend gate).

Usage: python cost.py <slug> --engine local|vidiq

local: no paid API — only CPU compute (free); prints a rough time estimate.
vidiq: vidiq_generate_clips charges ceil(source_minutes) * 9 credits on submit.

The agent MUST show this and get explicit user confirmation before running the
vidIQ engine or any paid generation (pattern borrowed from the generate-content
skill's mandatory cost gate).
"""
import math, os, sys
import config, util


def estimate(slug, engine):
    proj = config.project_dir(slug)
    data = util.load_json(os.path.join(proj, "clips.json"))
    dur = data["source"]["duration"]
    n = len(data.get("clips", [])) or config.DEFAULT_CLIPS
    if engine == "vidiq":
        minutes = math.ceil(dur / 60)
        credits = minutes * config.VIDIQ_CREDITS_PER_MIN
        msg = (f"vidIQ fast-lane: {minutes} source-minute(s) x {config.VIDIQ_CREDITS_PER_MIN} "
               f"= ~{credits} credits (charged on submit, refunded if it fails). "
               f"Check balance with the vidiq_balance MCP tool. Proceed?")
        return {"engine": "vidiq", "credits": credits, "minutes": minutes, "message": msg}
    # local
    est_min = round((dur / 60) * 1.0 + n * 0.6, 1)  # transcribe ~RT once + ~render per clip
    msg = (f"Local engine: no credits/API cost (CPU only). "
           f"Rough time ~{est_min} min for a {dur/60:.1f}-min source -> {n} clips.")
    return {"engine": "local", "credits": 0, "est_minutes": est_min, "message": msg}


def main(argv):
    slug = argv[0]
    engine = argv[argv.index("--engine") + 1] if "--engine" in argv else "local"
    est = estimate(slug, engine)
    print(f"[cost] {est['message']}")
    return est


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: cost.py <slug> --engine local|vidiq")
    main(sys.argv[1:])

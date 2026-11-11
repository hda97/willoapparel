#!/usr/bin/env python
"""vidIQ fast-lane: download the clips vidIQ produced into the project.

Usage: python vidiq_clip.py <slug> <clipUrl1> [clipUrl2 ...]

The agent drives the cloud part via MCP:
  1. vidiq_generate_clips(videoUrl=... | uploadedVideoUrl=...) -> mcpJobId
  2. poll vidiq_job_poll(mcpJobId) until "completed" -> result has clip URLs
  3. run this to pull those signed URLs into projects/<slug>/clips/<n>.mp4
Both engines then share the same review -> host -> publish path.
"""
import os, sys
import httpx
import config, util


def download_clips(slug, urls):
    proj = config.ensure_project(slug)
    clips_dir = os.path.join(proj, "clips")
    cp = os.path.join(proj, "clips.json")
    data = util.load_json(cp, {"slug": slug, "clips": []})
    clips = []
    for i, u in enumerate(urls, 1):
        out = os.path.join(clips_dir, f"{i}.mp4")
        with httpx.stream("GET", u, timeout=600, follow_redirects=True) as r:
            r.raise_for_status()
            with open(out, "wb") as f:
                for chunk in r.iter_bytes():
                    f.write(chunk)
        m = util.ffprobe_meta(out)
        clips.append({"id": i, "file": out, "engine": "vidiq",
                      "title": f"Clip {i}", "caption": "", "hashtags": [],
                      "duration": round(m["duration"], 2), "status": "composed"})
        print(f"[vidiq] clip {i}: {m['width']}x{m['height']} {m['duration']:.1f}s -> {out}")
    data["clips"] = clips
    data["engine"] = "vidiq"
    util.save_json(cp, data)
    return data


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("usage: vidiq_clip.py <slug> <url1> [url2 ...]")
    download_clips(sys.argv[1], sys.argv[2:])

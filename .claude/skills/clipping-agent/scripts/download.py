#!/usr/bin/env python
"""Ingest a source video into a project.

Usage: python download.py <slug> <url-or-local-path>

- URL  -> downloaded via yt-dlp to projects/<slug>/source.mp4
- local file -> used in place (path recorded; not copied, to avoid duplicating big files)

Writes source metadata into clips.json.
"""
import os, sys, shutil
import config, util


def main(slug, src):
    proj = config.ensure_project(slug)
    clips_path = os.path.join(proj, "clips.json")
    data = util.load_json(clips_path, {"slug": slug, "clips": []})

    if util.is_url(src):
        out = os.path.join(proj, "source.mp4")
        print(f"[download] yt-dlp {src}")
        util.run([sys.executable, "-m", "yt_dlp",
                  "-f", "bv*+ba/b", "--merge-output-format", "mp4",
                  "--no-playlist", "-o", out, src])
        source_path, source_url = out, src
    else:
        src = os.path.abspath(src)
        if not os.path.exists(src):
            raise SystemExit(f"local file not found: {src}")
        source_path, source_url = src, None
        print(f"[download] using local file in place: {src}")

    meta = util.ffprobe_meta(source_path)
    data["source"] = {"path": source_path, "url": source_url, **meta}
    util.save_json(clips_path, data)
    print(f"[download] {meta['width']}x{meta['height']} {meta['fps']}fps "
          f"{meta['duration']:.1f}s -> {clips_path}")
    return data


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("usage: download.py <slug> <url-or-path>")
    main(sys.argv[1], sys.argv[2])

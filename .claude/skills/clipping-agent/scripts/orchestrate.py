#!/usr/bin/env python
"""Drive the LOCAL clipping pipeline.

Usage:
  orchestrate.py <slug> <source> --prep [--no-scene]
      Ingest + analyze only (download, transcribe, vad, analyze). Stop so the
      agent can read words.json + analysis.json and author picks.json.

  orchestrate.py <slug> --render --picks picks.json
      Selection (from picks) -> boundary snap -> detect -> compose. Produces
      finished clips in projects/<slug>/clips/.

  orchestrate.py <slug> <source> --auto [--clips N] [--no-scene]
      Full unattended run with the heuristic selector (testing / degraded mode).

The vidIQ fast-lane is agent-driven (see SKILL.md): generate+poll via MCP, then
vidiq_clip.py to download. Publishing (Blotato) is also agent-driven.
"""
import sys
import config, download, transcribe, vad, analyze, selection, boundary_snap, detect, compose, score


def prep(slug, source, do_scene=True):
    download.main(slug, source)
    transcribe.main(slug)
    vad.main(slug)
    analyze.main(slug, do_scene=do_scene)
    print(f"\n[orchestrate] prep done. Read projects/{slug}/words.json + analysis.json, "
          f"author picks.json, then: orchestrate.py {slug} --render --picks picks.json")


def render(slug, picks=None, clips_n=None):
    if picks:
        selection.main([slug, "--picks", picks])
    else:
        args = [slug, "--auto"]
        if clips_n:
            args += ["--clips", str(clips_n)]
        selection.main(args)
    boundary_snap.main(slug)
    detect.main(slug)
    data = compose.main(slug)
    score.board(slug)                       # annotate clipscore + print the leaderboard
    print(f"\n[orchestrate] render done. {len(data['clips'])} clips in projects/{slug}/clips/")
    return data


def main(argv):
    slug = argv[0]
    do_scene = "--no-scene" not in argv
    picks = argv[argv.index("--picks") + 1] if "--picks" in argv else None
    clips_n = int(argv[argv.index("--clips") + 1]) if "--clips" in argv else None
    if "--strip-captions" in argv:   # source already has burned-in captions -> hide them
        config.STRIP_SOURCE_CAPTIONS = True
    if "--no-jumpcut" in argv:       # keep pauses/fillers (disable rapid-fire cutting)
        config.JUMPCUT = False

    if "--prep" in argv:
        prep(slug, argv[1], do_scene=do_scene)
    elif "--render" in argv:
        render(slug, picks=picks, clips_n=clips_n)
    elif "--auto" in argv:
        prep(slug, argv[1], do_scene=do_scene)
        render(slug, picks=None, clips_n=clips_n)
    else:
        raise SystemExit("specify --prep, --render, or --auto (see header)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1:])

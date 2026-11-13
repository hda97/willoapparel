# Animation standard for code-drawn game characters

Read this before posing a new animation and again before calling one finished. It condenses the classic
principles of character animation, game-feel practice and the lessons of the Ratislav builds into rules
you can check on rendered frames. Sources are at the end; the wording here is our own.

## The loop (never skip a step)

1. **Brief**: what the move must say (weight, mood, speed), its phases, its frame budget, its loop rule.
2. **Key poses first** (pose to pose): the extremes and the contact/impact pose. Check each key's
   silhouette before adding in-betweens.
3. **Measure**: `python3 rig/build.py --quick` - limb lengths, foot slide, loop seams must PASS.
4. **Look**: `python3 rig/look.py anim <name>`, `closeup <anim:frame ...>`, `scene <anim:frame>`. Open
   every picture. Judge hands, face and feet at 5x, the whole move on the contact sheet, and the move in
   the scene at game size. Thumbnails hide defects; full-size frames decide.
5. **Fix by cause**, not by symptom (stretch, slide, pop, loop hitch, flip, occlusion, prop through the
   face - see SKILL.md step 6), then go back to 3.
6. **Compare**: put the new frames next to the previous version and say what changed. When you add a
   check for a bug, prove the check fails on the bug before trusting it.

## The twelve principles, applied to a code rig

| Principle | What it means for these sprites | How to check |
| --- | --- | --- |
| Squash and stretch | Keep volume: scale x by 1/sqrt(s) when y scales by s (`torso_xf` does this). Squash on landing and wind-up, stretch on take-off and the fastest frame. | Body area looks constant across the jump contact sheet. |
| Anticipation | Every big action starts with a smaller opposite move: crouch before the jump, pull back before the strike. Player attacks keep it short (1-2 frames); enemy attacks show it longer, as a warning. | The frame before the action reads as "about to". |
| Staging | One clear idea per pose; the prop and the face never cover each other. | Fill the silhouette black: the action must still read. |
| Pose to pose / straight ahead | Keys for acting and attacks; procedural (straight-ahead) for walks, tails, scarves, breathing. | Keys exist as named frames in `anims_*.py`. |
| Follow-through and overlap | Nothing stops at once. Drag order: hips -> chest -> head/arms -> hands -> ears, tail, scarf, hair, cloth. Loose parts lag the body by a phase offset and settle after it stops. | Tail and scarf tips are still moving in the frame after the body stops. |
| Slow in, slow out | Space frames tighter near keys and wider in the middle of a move. Never move a character at constant speed (walk travel is the only linear thing, and it must match the planted foot). | Positions of the hand across frames bunch up at the ends. |
| Arcs | Hands, head, tail tip and blade tip travel on curves; hands arc about the shoulder between keys rather than cutting straight across. | Trace one point across frames: it draws a smooth curve, no zigzag. |
| Secondary action | Blinks, ear twitches, breath, a swoosh, dust: they support the main action and never compete with it. | Cover the secondary parts: the main action still reads. |
| Timing | Frame count and duration set weight. Small and light = few, short frames; heavy = more and longer. Holds on the key that matters (the impact) sell it. | Durations per frame are listed on the contact sheet; read them aloud as a rhythm. |
| Exaggeration | Games read at speed and distance: push key poses 20-30% beyond realistic. | At 1x in the scene the pose still reads. |
| Solid drawing | Same proportions in every frame; avoid "twins" (both limbs doing the same thing) and tangents (two lines just touching, which flatten depth). | Contact sheet: heads, bodies and props keep their size; no lines kiss. |
| Appeal | Clear shapes, asymmetry, personality in the idle. | Would someone want to watch the idle loop? |

## Game feel

- **Phases of an attack**: startup (anticipation) -> active (the hit) -> recovery (follow-through and
  settle). Fast startup, readable active frame, recovery at least as long as startup.
- **Hit-stop**: hold the moment of impact longer (2-5 game frames, roughly 35-85 ms at 60 fps) so the hit
  lands. Ratislav strikes on frames 3-4 (50 and 60 ms) and holds the frame right after the hit for 110 ms.
- **Smears and trails**: the fastest frame gets a swoosh drawn under the character, never across the face.
- **Ground truth**: a planted foot moves at exactly the ground speed (`WALK_STEP`); a walk's ground and
  scenery repeat with the travel per loop, or the loop jumps.
- **One shared stance** for every grounded pose, so switching animations never pops.
- **Timings that read well here**: idle 8 x 150 ms; walk 8 x 83 ms; jump 9 keys (start, rise, apex, fall,
  land); attack 8 keys with the hit on frame 4. Start from these and adjust by eye.

## Hands and props

- A hand is always in a pose: a **fist closed round the grip** when holding, relaxed when empty, never
  splayed. The grip shows on both sides of the fist; a pommel sits at the end of the grip, not on the hand.
- The prop leaves the fist across the forearm line, roughly 25-115 degrees from it; a blade continuing
  straight out of the forearm only works for a deliberate thrust.
- Reach into the blow: at contact the hand is well away from the shoulder (about 60% of the arm length or
  more), but the elbow does not lock; keep a slight bend through the middle of the move.
- Follow-through keeps moving: carry the hand past the hip on a bent elbow; never freeze with the arm held
  out and the blade hanging.
- Kinetic chain: hips lead the chest, the chest leads the arm, the arm leads the blade.
- Wind-ups behind a big head: draw the near arm and prop behind the body (`arm_behind`).

## Faces

- Draw order on the muzzle: nose, then whiskers that grow from below it and fan forward without touching
  its outline, tapered root to tip. The mouth is a short line from the underside of the snout. No teeth
  unless the design calls for them.
- Eyes and mouths are states (`Pose.eyes`, `Pose.mouth`), not drawings per frame: the model sheet shows them
  all, so they stay on-model.

## Scenery

- Painted, crisp, no blur; depth from colour (lighter and hazier far away) and a mist gradient between
  layers. Light comes from the same side as on the character.
- Only things the character touches get its ink line; everything else stays painted, so the character
  reads first.

## When you change the art style

Change the palette, line width, shading offsets, shapes and proportions; keep the rig contract (`Pose`,
`draw_pose`, `info`) and the checks. Re-run the whole loop; a new style needs its own close-up review.

## Sources

- Frank Thomas and Ollie Johnston, *The Illusion of Life: Disney Animation* (1981) - the twelve principles.
- Richard Williams, *The Animator's Survival Kit* (2001) - spacing, arcs, walks, overlap.
- `dylantarre/animation-principles` skills (MIT): game-development, animator-traditional,
  follow-through-overlapping - installed as companion skills by the kit.
- `mengto/skills` game-dev-combat-animation (MIT) - arm and hand rules for strikes, review discipline;
  written for 3D skinned meshes, adapted here to 2D.
- `calesthio/generative-media-skills` 2d-character-rig-animation and character-design-continuity (MIT) -
  rig contract, defect classes, character bible.

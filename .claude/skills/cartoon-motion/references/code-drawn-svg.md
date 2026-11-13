# Code-drawn characters and frame-exact animation

Read this when no image generator or rigging editor is available, when the character must be drawn as code (SVG, canvas, a web view), or when you need a frame-exact animated moment with sound for review. It records a workflow that produced an approved result after several rejected rounds. Most of the lessons are about what made the earlier rounds fail.

## Why code-drawn characters usually look bad

Code invites shapes that are easy to compute: ellipses, circles, single-width strokes and symmetric everything. The result reads as an icon or "vibe-coded" clip art, not a character. Specific failures seen in review:

- Stick limbs of one stroke width, ball hands and no joints. There's nothing to pose.
- Everything outlined in the same weight of pure black, so it reads as a napkin sketch.
- Flat fills with no light, or a single gradient.
- Cute-by-default proportions: big round eyes, blush, stubby limbs. Don't add these unless the brief asks for them.
- Construction errors that are obvious at a glance: a limb starting at the edge of the body next to the mouth, legs that don't meet the body, gloves with the thumb on the wrong side.
- Props and costume added to fake "complete". A monocle, cane or band-aid with no reason in the character only adds noise. Remove anything the user didn't ask for if it doesn't serve the personality.

## Design before motion

1. **Brief with numbers.** Put the personality into measurable shape language: height ratio between characters, where the widest point falls, eye size ratio, line of action, limb taper, palette hex values. Every adjective should become a number.
2. **Explore wide, then deep.** Show the user 2–4 genuinely different directions on one sheet, each with a hero pose, 4–6 expressions and a silhouette test at app size. Directions should differ in shape language and references, not only in render style.
3. **Ask for references.** If the user rejects a round, ask which existing characters feel right and pull concrete traits from them. For example, classic ad mascots give you thin black limbs, white gloves and a dapper attitude, and Chuck Jones gives you lanky lines, heavy lids and deadpan looks. Name the traits you're borrowing. Don't copy a protected character.
4. **Polish only the pick.** Once a direction is chosen, spend the effort on finish (below) rather than on more options.
5. **Prove it in motion early.** Animate one short moment with the chosen design before building a model sheet or integrating. Seeing it move is what gets the user's approval.

## Construction rules (check every frame)

- Arms and legs start *inside* the body and are drawn *behind* it, so the joint is hidden and no limb ever appears to come out of a face.
- Hands are drawn as a specific left or right hand. For a raised hand with the palm toward the viewer, the thumb points toward the body's centre line. Parametrise the thumb side (for example `thumb: ±1`, flipping the local y axis) and check it visually on every new pose. Don't trust the math alone.
- Multi-part shapes such as gloves and hands get one outline around the whole silhouette. Draw every part stroked in the outline colour first, then every part filled, so there are no inner seams.
- Feet plant on the ground line. Shoes need an upper, a sole, a toe cap and a highlight; one blob isn't enough.
- Keep every pose clear of the mouth and eyes, and check extremities at motion peaks against the frame edges.

## Finish recipe for flat vector characters

For each surface (body, cap or hair, shoes):

- Base fill from a radial gradient (light → base → mid), lit from the upper left.
- A cel shadow on the far side: a mask built from the body path offset toward the light and blurred slightly (`feGaussianBlur` ≈ 2), so the edge is crisp but not hard.
- Ambient occlusion where parts meet, such as a wide blurred dark stroke under a cap rim.
- A rim light: a blurred light stroke along the shadow edge.
- A highlight streak plus one small specular dot.
- A very light procedural grain (`feTurbulence`, about 15–20% opacity, clipped to the shape) so fills read as a material.
- Inner detail lines tinted to a darker shade of the surface's own colour. Only the outer silhouette uses the dark outline colour, applied with `paint-order="stroke"` so it sits outside the fill.
- Repeating texture is drawn as individual shaded units, such as single scales in offset rows with a highlight arc each, not as a hatch pattern.
- Brows as tapered filled crescents rather than strokes. Eyes get shaded whites, glossy pupils with two catch-lights, and lids in the body colour.

## Rig as data

Keep the character as a pure function: `drawCharacter(pose) → SVG string`. A pose is plain data:

- body: `lean` (degrees about the feet), `sx`/`sy` squash and stretch about the feet, `lift`
- limbs: `{ S, E, W }` shoulder, elbow and wrist (or hip, knee and ankle) points in the character's own space; draw each as a tapered tube through the elbow
- hands: `hand` drawing (`open`, `fist`, `point`…) and `thumb` side
- face: `look [x, y]`, `lid [l, r]`, `brow [[lift, angle], …]`, `mouth` (a named shape or a live `{ open, wide }` for lip sync)
- secondary: `capRot`, `capDx`, `capDy`

Keyframes list only what changes: `[frame, partialPose, easeIntoThisKey]`. Resolve them cumulatively, then tween numbers and arrays; strings such as hand shapes switch at the midpoint. Layer procedural motion on top:

- run cycles blended by speed
- follow-through from velocity (a cap trailing travel and lift)
- breathing
- blinks, with expression changes hidden inside a blink
- syllable lip sync, with one opening per vowel group sized by the vowel and the stressed syllable lifting the brows

## Frame-exact timeline and review

- `renderAt(frame)` draws any frame from the frame number alone: 60 fps, no clocks or timers, seeded randomness only. Support `?f=<frame>` for stills.
- Render stills with Playwright for contact sheets (8–12 key frames at a third of their size, in one image). Review against frame numbers, fix the most consequential defect, and re-render. Expect 2–4 rounds per moment.
- Render all frames as JPEG at 2× scale, then encode: `ffmpeg -framerate 60 -i f%04d.jpg -i score.wav -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -shortest out.mp4`.
- Sound can be synthesized offline with Web Audio's `OfflineAudioContext` (organ stabs, noise whooshes, pitched pops). Land each hit one frame after its picture. Measure loudness with `ffmpeg -af ebur128` and aim for about −16 to −14 LUFS, applying gain and `alimiter`.

### Motion numbers that read well

- Entrances ease out; exits ease in and run 40–50% shorter.
- Damped springs at 0.4–0.6 damping read as playful; 0.8 reads as premium.
- Anticipation is a 10–14 frame squash (sx ≈ 1.12, sy ≈ 0.88) before a jump; land with the same squash, then spring back.
- Speech bubbles hold for at least 0.3 s per word plus 0.5 s.
- Ban linear moves except for constant mechanical motion.

## Handoff

Commit the drawing engine, the choreography, the build script and the render scripts, and keep generated pages and frames out of git. Write down the exact commands to rebuild, render stills, render all frames, make the score and encode. Record which direction the user approved, and every rejection along with its reason, so the next agent doesn't repeat it.

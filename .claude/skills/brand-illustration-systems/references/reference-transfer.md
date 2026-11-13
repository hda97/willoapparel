# Reference transfer: learn a piece by rebuilding it, then apply it to a new subject

Use this when the user shares a single illustration (not a whole system) and asks you to recreate it, explain how it
works, or "do this, but for a laptop / our product / our brand". The reference constrains documented execution
qualities; it does not determine the new subject's metaphor, props, composition, or brand identity. The options you
show are three **subject compositions** constructed for the new brief within those constraints.

The method is an illustrator's apprenticeship, not a description exercise: **measure → rebuild → score → iterate**
until the vector matches, then write down what the match taught you, package it as a kit, and only then draw the new
subject with that kit. Describing a style in adjectives and then drawing "something like it" fails every time: the
rules that make a style read are numeric (angles, periods, radii, which colour owns which pattern) and you only find
them by trying to reproduce the piece and seeing where you miss.

A finished transfer has five parts:

1. a **decomposition** (seven layers, written as rules with numbers);
2. a **recreation** scored against the reference, which proves the rules are complete;
3. a **new project-local kit** holding the measured rules as functions, generated from this supplied reference only;
4. a **new-subject construction**: subject model, thumbnails, skeleton, primitive block, volume/overlap and clean form;
5. a **transfer**: three options for the new subject built with the kit, self-critiqued, presented on one sheet.

**Study, not shipping.** A close recreation of a living illustrator's piece is a study for understanding. Keep it out
of deliverables and public repos, never present it as the brand's or your own original work. If the user wants that
exact look for production, recommend commissioning the illustrator.

## 1. Prepare the reference

- **Convert to sRGB first.** Screenshots and exports often carry a display profile (`raster_check.py` warns on an
  embedded profile). Raw pixel values from such a file are not the colours you see: in the worked example, the green
  read as #4FA968 raw and is #03AC61 in sRGB, and the field read as #FBF38E but is #FFF47C. Convert with
  `sips --matchTo "/System/Library/ColorSync/Profiles/sRGB Profile.icc" in.png --out in-srgb.png` (macOS) or Pillow
  `ImageCms`, then take every hex from the converted file.
- **Build the palette** by snapping pixels to the dominant colours (`match_score.py` does this when you omit
  `--palette`). Expect 8–12 colours in a flat editorial piece; name each by its **role**, not its hue.
- **Work at the reference's pixel size** so your coordinates are its coordinates.

## 2. Decompose in seven layers

Work from the largest decisions to the smallest. Write each layer as rules, not adjectives.

| Layer | What to record | Worked example (flat editorial figure with gifts, 2252 px square) |
|---|---|---|
| 1. Field | Ratio, background, how much the subject fills | Square; one flat yellow #FFF47C; the figure fills about two-thirds |
| 2. Large shapes | The subject as 5–12 primitives, with exaggeration | Arms are rings and quarter-rings, the torso is a striped band, the head is cut by one diagonal, the legs are long ribbons, the cat is a rectangle with a semicircle cut out |
| 3. Palette roles | Each colour's job | Yellow = negative space; black = structure and overlaps; blue = the main patterned plane; pink = calm rest planes; navy = the one shaded plane |
| 4. Pattern owners | Which pattern sits on which role, at what scale | Broad stripes = body and arms; mint dots = the front leg; dots on navy = the back leg; pinstripes = the gift lid; white polka = the pink box; green tapered contours = the hair |
| 5. Depth | How things sit in front of each other | Mostly overlap. Where two shapes overlap, the overlap turns black. **One** gradient, a dark radial on the back leg, pushes it behind |
| 6. Rewards | Small secondary objects and their job | Hearts, snowflake, leaves, gifts and the cat spread colour around the silhouette |
| 7. Rendering | Edges, outlines, projection | Crisp edges, no outlines, frontal flat projection |

Separate three things that are easy to blur: **subject recognition** (what makes the subject readable),
**brand geometry** (the shape language) and **surface pattern** (what fills the planes). A transfer keeps the second
and third and rebuilds the first for the new subject.

The seven layers describe the reference's visible result. They do not replace the drawing process. When constructing
the new subject, follow `constructive-illustration.md`: subject model → composition → skeleton → masses → volume →
clean form, then apply the extracted geometry and surface kit.

## 3. Rebuild and score: the loop

Rebuild the reference as vector, layer by layer, largest shapes first. After each layer, render and score:

```bash
python3 scripts/match_score.py recreation.svg reference-srgb.png --palette "#FFF47C,#0081C7,#000000,..."
```

It reports overall agreement, agreement on figure pixels only (ignoring the field, which inflates the overall number),
IoU for each colour (worst first: this tells you which layer is off) and the worst cells of a 6×6 grid (this tells you
where to look). Open the diff image: red means in the reference but missing from yours, blue means extra in yours.

**Measure, don't eyeball.** When a colour's IoU is low, crop that region of the reference and measure it:

- **Primitives.** Fit circles to curved edges. Arcs that look freehand are usually a ring with a centre and two radii.
  In the worked example, the curled arm is one ring (centre 1100,750; radii 275/140) and the raised arm is a quarter
  ring (radii 343/215). One diagonal, x = 1404 − y/2, cuts the fringe, face and neck in a single line.
- **Stripe periods.** Read the band edges along a scanline. Stripes follow the primitive they sit on: they are
  horizontal on the torso, vertical (59 px) on the straight forearm, and radial on the ring arms (16.2° on the curled
  arm, 11° on the raised arm).
- **Dot lattices.** Find the lattice with FFT autocorrelation, then refine with a regression along chains of
  neighbouring dots. The leg dots sit in fixed-direction columns at 56.45° (step 47.62 px; columns 38.6 px apart; odd
  columns shifted −9.4 px; r ≈ 9). **The grid never bends with the form**, and there is a seam where the fill was
  placed in two patches. A uniform-lattice guess scored a median error of 12 px; per-column phases fitted it to
  sub-pixel accuracy.
- **Contours.** Measure width along the line. The hair contours taper from 6 to 12 px toward the hair's outer edge,
  like a brush, and start on the diagonal edge.
- **Anything you can't model** (drips, ribbon tails, hand outlines): trace the region boundary and simplify it to a
  few smooth points. Use a traced shape as the outline only; the pattern inside still comes from the rules.

**Iterate until the remaining misses are craft, not rules.** The worked example went from 76.6% → 85.1% → 89.6% →
90.25% agreement on figure pixels (96.9% overall). Each jump came from a rule that wasn't in the written
decomposition: the ring construction, the per-column dot model, the sRGB conversion, the overlap-turns-black rule and
the gradient on the back leg. Write each rule back into the decomposition when you find it. That is the point of the
loop. Stop when the misses left are hand-placed details (individual drips, a ribbon curl) rather than missing rules.

## 4. Package the rules as a kit

Turn the measured rules into functions in a new file, with every size as a fraction of canvas width so they work at
any size. Define only the primitives, pattern operations, overlaps, colour roles and depth behaviours demonstrated by
the supplied reference. Do not begin from a previous reference's kit or swap colours into inherited functions: the
purpose of the rebuild is to discover this reference's own rules.

## 5. Transfer roles, not objects

Write a role map before drawing. Every element of the reference has a **role**; find the element of the new subject
that can play it.

Before applying the role map, build the new subject without pattern or rewards. Identify its essential parts, axes,
hinges and contact points; make composition thumbnails; construct its skeleton and primitive silhouette; then resolve
volume and occlusion. The kit styles this construction—it does not invent or correct it.

| Reference element | Its role | Laptop element |
|---|---|---|
| Black hair with green contours | Dark anchor carrying the finest line pattern | Black screen with tapered accent contours |
| Striped arm curling round a counter-shape | Largest patterned plane; makes the main curve | A coiled cable or headband with radial stripes round open space |
| Pink face and hands | Calm planes that rest the eye | A pink window on the screen; hands at the keyboard |
| Dotted leg ribbon | Long sweeping movement | The charging cable as a dotted ribbon |
| Back leg in the navy gradient | The one plane pushed back | The cable run that passes behind the laptop |
| Boots with white cuffs | Terminal shapes ending a movement | A plug with a white collar |
| Gift-lid pinstripes | Busy texture on a small plane | The keyboard deck |
| Gifts, cat, snowflake, hearts | Rewards that spread colour | **New props from the laptop's world:** mug, plant, books, headphones, a notification heart |

Rules:

- **Keep pattern owners stable.** Once a pattern belongs to a role, it keeps that role in every new subject.
- **Replace the rewards by role, not by identity.** Copying the reference's props reads as the old picture with a
  laptop pasted in. Watch for disguised copies too: a book wearing the gift's ribbon cross and knot is still the gift.
- **Keep the projection.** Frontal reference, frontal result. To give the subject energy, lean it in-plane by rotation
  (4–6°); never add perspective.
- **Give it the reference's movement.** The worked example is one big S-curve through about two-thirds of the canvas.
  A subject parked in the middle with props around it is static even when every pattern is right.
- **Keep the silhouette clean.** A pattern ribbon must not cross the subject's key recognition feature (for a laptop:
  the hinge line, the screen edge, the keyboard deck).

**What failed in the worked example's first laptop round**, and its fix:

| Failure | Fix |
|---|---|
| Big flat black masses (screen, keyboard) that read as holes | Black stays an anchor but carries a pattern or contour, or is broken by a calm plane (the pink window) |
| Contours invisible, because they were sized to the canvas | Size contours to the shape they sit on (`contour(..., size=shape_width)`) |
| Static layout: laptop centred, props scattered round it | One big S-curve movement (cable, headband or arms) through two-thirds of the canvas |
| A coil floating on its own, not connected to anything | Every shape joins the movement: the cable leaves the laptop, coils, and ends in the plug |
| No depth | One run passes behind in the deep gradient, as the back leg does |
| A book copied from the gift (ribbon cross and knot) | A pink book with page-edge capsules and a spine band: its own world's details |
| Silhouette test lost the striped shapes | Patterned fills must use the shape's own path as the base, never a full-canvas rect |

## 6. Present the transfer as three options

Build three compositions of the new subject with the kit, all in the same style. They differ in **idea and movement**,
not in style. In the worked example these were a cable coil, headphones over books, and hands at work. For each,
build the same two moments: a **spot** (subject only, no rewards, at product size) and a **scene** (full composition).
Then render the sheet with `direction_sheet.py`, setting `"same_family": true` so it labels them as compositions in
one family rather than three families.

Before showing anything, critique your own sheet against the reference, side by side at the same size, with the
round-one table above as a checklist. Fix what fails and render again. Then present it in the checkpoint format in
SKILL.md, with a recommendation.

## 7. Checks before showing

| Check | How | Pass when |
|---|---|---|
| Match score (recreation) | `match_score.py recreation.svg reference-srgb.png` | Remaining misses are hand-placed details, not missing rules |
| Large-shape test | `render_png.py --silhouette` and `--grey` | The subject is recognisable as a silhouette; the composition works before pattern and colour |
| Pattern-owner test | Compare the role map with the artwork | Every pattern sits on the role it owns in the reference |
| Prop test | List every secondary object | None carried over from the reference, including disguised copies |
| Construction test | Hide pattern, rewards and colour | Structure, contacts, proportions, silhouette and occlusion still work |
| Projection test | Compare horizon and angle | Same projection; any lean is an in-plane rotation |
| Movement test | Trace the main curve across the composition | One continuous movement through about two-thirds of the canvas |
| Flat-field and palette | `raster_check.py` (raster), `system_audit.py --family editorial` (SVG) | No glow or vignette; four saturated hues at most, each in its role; at most one gradient |
| Independence test | Explain each major choice from the new brief | Reference supplies execution qualities, not borrowed subject logic |

## Worked example: what an earlier image-model run got right and wrong

**Right:** the seven-layer decomposition; pattern owners mostly transferred by role (the screen took the hair's
contours, the keyboard took the gift-lid stripes, the cable took the dotted ribbon); a background correction pass after
spotting a glow.

**Wrong:** it never rebuilt the reference, so its rules were adjectives and it couldn't tell what it was missing. The
gift, cat, cake, hearts and snowflakes were copied into the laptop scene, and the laptop slipped into three-quarter
perspective. A striped ribbon crossed the keyboard. The output was raster only (exploration, not a system), and the
image model added a soft glow to a field that is perfectly flat.

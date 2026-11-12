# Production routes and prompts

## Production route by family

| Family | Production source of truth | Agent can build directly |
|---|---|---|
| Flat spot, technical, brand device, pattern-led | Editable SVG/Figma from project-specific tokens and construction rules | Yes: generated or hand-written SVG after direction selection |
| Character-led | Character sheet (construction shapes, ratios, turnaround, expressions) + SVG assets | Yes, for simple primitive-built characters; recommend an illustrator for a signature cast |
| Expressive line | Brush/line spec, figure conventions, reference board + assets | Direction samples only; recommend commissioning an illustrator |
| Soft 3D | Scene kit: camera, lights, materials, bevels (Blender/Spline/C4D) + renders | SVG gradient approximations or labelled image-model exploration for samples; a 3D tool for production |
| Collage | Cut-out and texture rules, licensed asset library | Samples with placeholders; rights must be cleared |

## Proof route for 2D families: parametric vector

Prove the system with editable vector assets generated from definitions written for the selected project's source logic.
Do not begin from a worked-example generator: create tokens, primitives and operations from the chosen direction.

1. **Tokens:** colours by role (anchor, ink, faces, each with a pattern line one step darker).
2. **Pattern tile:** a seamless `<pattern>` built from the source primitives. Record the tile size, line count, amplitude, phase and stroke width.
3. **Construction functions:** one per mode, such as an isometric matrix for scenes, flat icon definitions with a `level` argument for scale tiers, and an extrusion from stacked offset copies for editorial objects.
4. **Motifs at fixed coordinates:** seams, faults and cuts are defined once and reused, never redrawn per object.
5. **Motion:** CSS or SMIL animation inside the SVGs. Make the default (t=0) frame meaningful for static previews, and honour `prefers-reduced-motion`.
6. **Audit and render:** run `scripts/system_audit.py` and `scripts/render_png.py`, then look at every PNG.
7. **Spec page:** an HTML page with tokens, the tile, invariants, every family, motion, and a side-by-side comparison with the reference.

Then render the output and compare it with the reference image by image before you claim success.

## Exploration only: image-generation prompts

The structures below can help explore a direction before construction. Their outputs are mood samples: never present them as the proof family, never slice a storyboard into a GIF, and never declare them validated. Replace bracketed material with the derived system. Generate distinct asset families separately rather than asking one image to contain every use case.

## Shared system block

Repeat this block across the family after completing it:

```text
Brand premise: [tenet and transformation]
Source world: [researched source]
Source behavior: [native process and operations]
Visual invariants: [2–5 rules]
Geometry: [grid, silhouette and corner rules]
Surface: [pattern/material construction and density]
Depth: [projection, extrusion and shadow]
Palette roles: [field, face, structure, depth, signals]
Motion behavior: [native verbs]
Avoid: generic stock-vector style, arbitrary decoration, gradients unless specified, inconsistent perspective, illegible micro-detail, text, watermark
```

## Technical scene

```text
Create a wide technical/spatial illustration that proves how the visual system constructs a product experience. Show [product surface] with [three or more layered components] in [projection]. Use the shared system block. The scene must explain hierarchy and relationships, not merely display a patterned object. Preserve generous negative space and crisp production-ready edges.
```

## Six product pictograms

```text
Create one coherent sheet of six evenly spaced product pictograms on a neutral field. Subjects: [six concepts]. Each symbol must be understandable from silhouette first, then receive the shared brand grammar. Vary the internal construction appropriately while preserving grid, scale, depth, palette roles and invariants. No labels or text. Equal visual weight and generous separation.
```

## Eight editorial covers

```text
Create one coherent sheet of eight editorial/story-cover objects in a 4×2 grid. Subjects: [eight rational, emotional and abstract concepts]. Give every object the same material and depth logic from the shared system block, but vary silhouette and construction. Use a consistent field, object scale and viewing angle. No labels or text.
```

## Motion frames

```text
Show [3–8] sequential frames in a clean storyboard. Animate only the source-native behavior [verb], while base geometry remains stable. The transition must clarify the concept [concept]. Include a reduced-motion endpoint.
```

## Output checks

After generation, inspect:

- Subject count and correct concepts.
- Stable perspective, grid and depth vector.
- Pattern generated from the source logic rather than substituted texture.
- Consistent palette roles.
- Small-size silhouette clarity.
- No unwanted text, logos or watermark.
- Family resemblance across all sets.
- Pattern weight (pattern-led family only): lines are fine and low-contrast inside the silhouette. Thick colour bands are a failure.
- Family fit: the asset obeys its family's construction rules (`style-families.md`).
- Context: spots are shown in a real touchpoint (phone frame, component), not only on a coloured square.
- Colour hierarchy: one anchor hue carries signal, and the faces stay pale.
- Flatness (flat, pattern, technical, device): no lighting, grain or drop shadows unless the family or source demands them.

If a generation drifts, revise one variable at a time and repeat the full shared system block.

## Known failure: pattern weight and mode collapse

An earlier proof run used image generation for every family. The meaning chain was right, but the output had thick
stripes over shapes, one material across all modes, equal-weight colours, inconsistent details, no real scale tiers,
and a sliced-storyboard animation. Its validation checked the prompt rather than the pixels. The lesson is to validate
rendered assets and editable rules, not verbal intent.

## Known failure: pattern anchoring

In a later project, the skill offered three directions (print registration, lens rings, loom
weave) that were all the same family: a patterned object on a coloured square with an offset edge. Only the pattern
content differed. Causes: the sample spec demanded a pattern tile, the overview sheet had a fixed pattern slot, the audit
warned when no `<pattern>` existed, and the only worked example was pattern-led. Fixes: directions are now idea plus
family, the three must differ in family, samples use real touchpoint moments, and the audit checks against the chosen
family.

## Known failure: the drifting field (editorial transfer run)

An image model recreating a flat editorial piece added a soft yellow glow to a background that was perfectly uniform
in the reference. A correction pass removed the glow, but the field was still noisy, not one colour (`raster_check.py`:
about 80% solid against 98% in the original). Flat styles depend on exactly that solidity. Run `raster_check.py` on
every raster exploration, say what it found, and rebuild the chosen direction as vector with a single background fill.


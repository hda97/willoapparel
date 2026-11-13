# Parts, rigs, and runtime selection

Read this for articulation or runtime integration. First inspect the target project's existing animation stack and actual available authoring tools. Verify current official documentation before making compatibility or licensing claims or adding dependencies.

## Choose from the deliverable backwards

- **Existing UI transforms** are often sufficient for blinks, small nods, bobs, tilts, limb rotations and prop movement. They require valid layers and pivots; they cannot reveal an undrawn back side or create convincing extreme turns.
- **Frame or pose animation** suits expressive redraws, strong perspective changes and distinct silhouettes. Budget texture dimensions, frame count, export scale, download/memory cost and transparent edges. Use atlases only when the target engine benefits from them.
- **SVG/vector animation** suits genuinely editable vector art and the target's supported path/transform capabilities. Placing a raster inside SVG does not make it editable vector artwork. Validate masks, clipping and any unsupported exported effects.
- **Rive** can suit vector characters with interactive states when the authoring workflow, supported features and runtime fit the target. Source artwork must be prepared and a rig/state machine actually authored. A PNG and a runtime dependency are not a `.riv` asset.
- **Spine or comparable skeletal tools** can suit raster cutouts, deformable meshes and richer character actions when authoring access, licensing and exports fit the project. Verify editor/export/runtime version compatibility and license requirements from official sources; don't choose it solely because the character has limbs.
- **Lottie or another timeline export** can suit authored vector scenes and short reactions when the exporter and target player support the actual features used. It does not automatically turn a layered image into a rig or provide game-style state control.

These are candidates, not mandatory dependencies. Existing native or engine tooling may be a better fit. Explain the practical tradeoff only when a selection is required; do not install multiple runtimes for evaluation without a concrete need.

## Minimum useful layer handoff

Use the project's format. For a small custom assembly, a table can be enough:

| Part/file | Parent | Rest placement | Pivot | Order | Variant / range |
| --- | --- | --- | --- | --- | --- |
| `arm-left.png` | torso | x/y in shared canvas pixels | x/y in local pixels | in front of torso | rotate within tested range |
| `hand-left-open.png` | arm-left | local x/y | local wrist x/y | in front of arm | mutually exclusive with closed hand |
| `prop.png` | hand-left | local x/y | grip x/y | depends on grasp | visible only for prop action |

Define coordinate origin, units, whether placements are top-left or pivot based, canvas size, scale and angle convention. Names are character-relative, so label a front-facing character's left explicitly. Do not fill a table with guessed values: measure them from the delivered assets or authoring scene.

Split only what moves independently, changes drawing, or needs a different depth order. Common candidates include torso, head, eyes/lids, brows, mouth variants, upper/lower limbs, hands, hair/ears/tail, clothing and props. Treat this as a menu. Rigid head art may be enough; independent eyes and a dozen mouth shapes are unnecessary for a silent nod.

For each moving connection:

1. Inspect each part alone on transparency and contrasting backgrounds. Check that it has clean contours and no fragments of neighboring parts.
2. Reassemble at rest in recorded coordinates. Match the reference's identity and proportions.
3. Exercise the actual planned rotation/deformation range. Check hidden overlap, gaps, duplicate anatomy, line/shading seams and collisions.
4. Test depth changes and hand/prop interaction where applicable. Some actions need alternate drawings or order changes rather than wider rotation.
5. Preview at final display size and scale extremes. Inspect any atlas filtering, pixel halos and clipping in the target renderer.

An alpha bounding box or automated pixel check can reveal blank/cropped exports but cannot certify anatomy, separation quality or a usable rig. Record visual findings as visual findings.

## A small motion contract

Record only what the implementation needs: action/state name, triggering event, duration or timing landmarks, loop behavior, entry/exit pose, interruption policy, prop/variant visibility, and reduced-motion fallback. Reuse existing state names rather than creating a parallel state system.

For example, a success reaction might anticipate briefly, open into a readable happy pose, hold, and settle. Repeated successes should follow the specified restart/queue/coalesce behavior instead of stacking transforms. A speaking action needs the agreed mouth/viseme system and audio timing only when speech is requested.

Verify neutral/rest, each requested action, transitions between actions, repeated/interrupting triggers, reduced motion and resize/background behavior in the supported environment. A playable authoring preview proves different things from an exported file or integrated app; retain that distinction in the handoff.

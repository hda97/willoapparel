# Three direction options

The checkpoint shows three options so the user can steer cheaply before the system is built. They must be different
enough that a person could tell them apart with the names covered.

## What makes a direction

`direction = project idea + rendering family + construction logic (+ optional signature device)`

- **Idea:** a researched metaphor derived from current-project evidence (SKILL.md Phase 3).
- **Family:** one of the eight in `style-families.md`, or a pairing by tier (e.g. flat spots in product + 3D heroes).
- **Signature:** the one ownable element: a pattern, a character, a line quality, a material, a device, a notation.
- **Construction logic:** how the subject moves from skeleton and primitives to branded form in this family.

Two directions with different ideas but the same family often look alike. Generate and research metaphors first, then
pair them with different families so neither the family nor an example invents the idea.

## Choosing the three

| User's answer | How the three differ |
|---|---|
| No direction | Three different families, each with its best-fitting idea. Cover at least one "quiet" family (flat or technical) and one "expressive" family (character, line or 3D) so the user sees range |
| Named a style or supplied reference | Same family, three project-derived metaphors and signatures; analyse only the supplied reference's execution qualities, never its subject or look |
| Named a source | Three translations of its verified operations in different families; do not reduce it to a surface motif |
| Partly (feelings, dislikes) | Three families that all respect the constraints |

At most one direction may be pattern-led unless the user asked for pattern. Before recommending it, verify that the
source itself warrants repetition and that the candidate was derived before any family or example was consulted.

## What each sample contains

Use the same subjects in every direction:

- **Name**, **family**, **idea source**.
- **Idea:** one sentence. **Looks like:** one sentence on line, shape, colour and depth.
- **Signature element:** pattern tile / character head or turnaround / line and brush swatch / material and light
  swatch / device in three states / grid and annotation sample.
- **Spot moment:** the same product moment (from the touchpoint map), ideally inside a phone frame or real component,
  plus a 48 px reduced version if the family produces icons.
- **Scene or hero moment:** the same one in all three.
- **Construction strip:** the same spot as `skeleton → blocked silhouette → branded finish`. This proves the direction
  can construct a subject rather than only decorate one.
- **Palette** (hex), **tone fences met**, **motion verb**, **one honest risk**.

If the user supplied brand guidelines, each sample must use their tokens. If no guidelines exist, use the same labelled
provisional identity across all three so the comparison tests illustration direction rather than three unrelated brands.

## The overview sheet

`scripts/direction_sheet.py` builds one HTML page from JSON (paths relative to the JSON file):

```json
{
  "brand": "<project>",
  "tenet": "<project tenet>",
  "moments": {"spot": "<shared product moment>", "scene": "<shared scene moment>"},
  "recommend": 1,
  "directions": [
    {
      "name": "<direction name>",
      "family": "<rendering family>",
      "source": "<researched source>",
      "evidence": "<project fact → shared behaviour → source>",
      "idea": "<one-sentence metaphor>",
      "looks": "<line, shape, colour and depth>",
      "chain": "<tenet → source logic → visual rule → use>",
      "motion": "<source-native verbs>",
      "risk": "<honest risk>",
      "palette": ["<hex>", "<hex>", "<hex>"],
      "signature": "a/signature.svg",
      "spot": "a/spot.svg",
      "scene": "a/scene.svg"
    }
  ]
}
```

`signature`, `spot` and `scene` may be SVG, PNG or JPG (label raster exploration in `looks`). When `spot` is a phone frame, add `micro` (the bare spot) for the 48 px check, or
`"no_micro": true` for families that never reduce. The older keys `pattern`, `pictogram` and `object` are still
accepted. Add `"greyscale": true` to compare forms without colour.

## Judging the three before you show them

- Cover the names: are the three distinguishable from the spot alone? If not, change a family.
- Does each one fit the touchpoints, especially the sensitive moments?
- Is the recommendation the best fit for the tone fences, not the prettiest or the most familiar?
- Does any direction look like a known brand's system? If so, push it until it doesn't.
- Does the construction strip show a plausible skeleton, proportions, contacts and silhouette? If not, the final is
  hiding a drawing problem.
- Can you name what came from the project and what came from a reference? If the reference supplied the subject,
  props, metaphor and composition, restart from the project brief.
- Run `system_audit.py --family <family>` on every SVG and fix failures.

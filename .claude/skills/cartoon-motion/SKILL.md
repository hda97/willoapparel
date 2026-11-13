---
name: cartoon-motion
description: Create, refine, rig, and animate cartoon characters for screens, using 2D artwork or stylized 3D in Blender, from expressive poses and separate parts to tested runtime motion. Use for characters in apps, websites, games, explainers, and interfaces; not unrelated UI animation.
---

# Cartoon Motion

Turn a character into expressive screen assets or working animation at the level the task needs. Preserve its visual identity. A good pose sheet, a layered character, and an integrated animation are different deliverables: name which one you actually produced.

## Set the finish line

Use the user's brief and existing project to establish:

- Character reference, distinctive proportions, palette, line/shading style, and permissible changes.
- Intended screen role, target size and backgrounds, required emotions/actions, and whether the character speaks or handles props.
- Requested output: concepts/pose sprites, separable art, rig handoff, or functioning animation in the target app.
- Existing authoring/runtime tools, output formats, performance constraints, and available iteration budget.

Ask only for missing choices that would materially change the output; use reasonable stated assumptions for the rest. Inspect existing assets and implementation before proposing a new pipeline. Do not turn a single reaction into a full character system.

## Choose the simplest useful motion

| Need | Suitable starting point | What must be real |
| --- | --- | --- |
| A few distinct reactions | Complete pose/expression sprites, optionally a short frame sequence | Consistent identity, registration, clear expressions, tested transitions |
| Small recurring motions | Separate pieces with transforms in the existing UI/canvas engine | Clean parts, explicit pivots/order, assembled motion test |
| Rich reusable articulation | Layered raster/vector art and a compatible rigging authoring tool | Authored rig, deformation/constraint checks, supported export/runtime |
| Precisely timed authored scene | Existing timeline/vector/frame-animation workflow | Playable export with intended timing and target compatibility |

These can be combined: a simple arm rig may switch hand drawings; a large turn may need another pose rather than deforming one drawing. Do not select a complex rig for motion a pose swap handles well. A runtime library loads animation; installing one does not create a rig.

Read [references/rig-and-runtime.md](references/rig-and-runtime.md) when choosing an authoring pipeline, preparing parts, or integrating motion. For Blender authoring through available MCP, CLI or UI tools, read [references/blender.md](references/blender.md): it covers 2D mesh/cutout, Grease Pencil and stylized 3D construction, deformation, acting and export. Use its geometry/rig workflow for Blender rather than applying raster-part procedures to a 3D model. When the character must be drawn as code (SVG, canvas or a web view), or no image or rigging tool is available, read [references/code-drawn-svg.md](references/code-drawn-svg.md). It covers design exploration, construction rules, a finish recipe that avoids the clip-art look, a data-driven rig, and a frame-exact timeline with contact-sheet review and synthesized sound.

## Use the available art pipeline honestly

Discover the tools actually available in this session. Use the user's chosen art pipeline and its documented capabilities. In Codex, use the available image-generation/editing skill when applicable; in Claude Code, do not assume an equivalent tool exists. With no suitable image tool, work from supplied assets, prepare a precise external-art brief, or use a user-approved alternative. Do not invent tool calls, switch a paid provider silently, or claim to have generated files that do not exist.

Image generation is useful for transparent raster concepts and expressive drawings. Request genuine transparency, inspect the alpha channel, and check the pixels visually; a checkerboard painted into a file is not transparency. Do not promise editable PSD, vector paths, rig files, or other authoring formats unless a tool really creates and verifies them.

Work from the approved reference or latest accepted candidate. Preserve head/body ratio, silhouette, facial landmarks, costume details, and line weight. A collection of different poses is coverage, not repeated refinement of one candidate. Track genuine revision passes by the defect addressed and before/after result; do not inflate the count through exports, crops, or duplicates.

Choose a bounded iteration budget from the user's request. At each pass, inspect the result, identify the most consequential defect, make a targeted correction, and compare again. If the tool repeatedly redraws identity or anatomy instead of fixing the defect, switch to a more controlled available method or report the specific limit. Do not generate endlessly to satisfy an arbitrary pass count.

## Design before you animate

When the character itself is new or rejected, settle the design before building motion. Turn the personality into measurable shape language, then show a few genuinely different directions (hero pose, expressions, silhouette at app size) and let the user pick. If the user rejects a round, ask which existing characters feel right and borrow named traits rather than guessing again. Don't default to cute proportions, and don't add props or costume pieces the character doesn't need. Polish only the chosen direction. Then prove it with one short animated moment before building a model sheet or integrating.

## Make expressions and poses useful

Build the requested emotional/action range with readable differences in brows, eyes, mouth, head angle, body line, and hands. Avoid producing several near-identical smiles under different filenames. Keep the original personality and aesthetic; exaggerated motion should suit the character and context.

Judge poses at the actual display size as well as enlarged. Check silhouette, focal expression, line clarity, contrast, anatomy, limb count, hand/prop contact, and unintended merges. Use a contact sheet to compare identity and coverage. Check real target backgrounds and cropping/safe areas, including extremities at motion peaks. If no target is available, label the chosen preview size as an assumption.

For pose sprites, use a consistent canvas, scale, ground/baseline and anchor, or record explicit offsets so switching poses does not jump. Keep required props separable when they move independently. Do not force separable pieces when a complete sprite is the intended deliverable.

## Separate art when motion requires it

A flattened pose is not a layer source. Cropping visible limbs out of it leaves holes and hidden overlaps unresolved. Generative extraction can rescale, redraw, or fuse anatomy; do not assume separately generated pieces align.

For layered work, derive the minimum part list from the requested motions. Preserve shared coordinates or record exact placement offsets. Complete hidden surfaces at joints, remove baked-in neighboring anatomy, and allow enough clean overlap for the intended range. Draw clean standalone props and unobscured replacement hands where needed. Keep shadows/highlights attached to the surface that owns them unless independent movement calls for separation.

Name parts by character-relative left/right, function and variant. Record canvas dimensions, export scale, anchor/pivot coordinates and units, rest placement, parent, front-to-back order, variant groups, and intended motion limits in a small manifest or handoff table. Use an existing project schema if present; do not invent a framework for one asset set.

Before calling the package animation-ready, assemble it at rest and move each intended joint through representative extremes. Inspect gaps, seams, clipping, detached shadows, broken outlines and prop contact. Check small-size readability again. A neat grid of isolated pieces is insufficient evidence.

## Animate and verify the requested result

For implementation work, wire actual events/states to the requested motions. Give each action a clear start, reaction, and settle; use anticipation, squash/stretch, overshoot, overlap and holds where they improve the performance. Avoid applying all principles mechanically or endlessly floating the whole character.

Preserve readable expressions through motion. Handle looping seams, rapid repeated events, interruption/state changes, and returning to rest. Keep controls and content usable. Respect platform reduced-motion settings with a meaningful still pose or restrained alternative, and pause unnecessary offscreen/background motion where the environment supports it.

Use the target runtime or the closest available preview to verify timing, registration, scaling, clipping and layering. For integration, exercise real triggers and lifecycle behavior; a standalone demo does not verify the app. Report platform/device checks separately from an art preview or successful build. Profile only to the extent warranted by the asset size, runtime and target performance budget.

## Deliver with evidence

Provide the requested assets/source and a compact preview. For layered/rigged work, include the part/pivot/order data and a rest/extreme-pose assembly preview. For working animation, include the authored source/export and the integration paths as applicable, plus a playback capture or reproducible preview.

State what is delivered, which requested states/actions are covered, what was visually or behaviorally checked, and any unresolved defects or tool/platform limits. Distinguish concepts, separated art, assembled art, authored rig, exported animation and app-tested animation. Keep provenance factual: identify supplied references, generated versus edited assets, and known license terms; do not infer commercial clearance from resemblance or generation. Keep private references out of public packages unless publication was authorized.

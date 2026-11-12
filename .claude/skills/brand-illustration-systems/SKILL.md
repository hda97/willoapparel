---
name: brand-illustration-systems
description: Creates, extends, audits, reverse-engineers, or transfers brand illustrations and illustration systems. Starts by understanding the brand or project, its audience, identity, touchpoints, and required subjects; proposes three distinct visual directions when direction is open; then constructs each subject from gesture and structural geometry through volume, detail, brand surface, colour, light, and motion. Use for spot illustrations, icon families, empty states, onboarding art, editorial or campaign imagery, characters, technical scenes, patterns, 3D assets, motion, or recreating a reference and applying its principles to a new subject. References inform execution qualities but never determine the outcome.
---

# Brand Illustration Systems

Act as a senior brand illustrator and system designer. Build illustrations for the project in front of you, not for
the examples in this skill.

The operating sequence is:

`project → brief → direction → subject construction → brand grammar → finish → validation`

An illustration system is an idea expressed through repeatable construction rules and applied by touchpoint. The idea
decides what the work means; the rendering family decides how it is drawn; the construction method makes the subject
correct; the touchpoint decides its density and scale.

**References are evidence, not recipes.** Extract their execution qualities and construction logic only when the user
supplies or requests reference analysis. Do not inherit props, composition, palette, metaphor, or rendering family.

Reply in the user's language. Keep the process visible but light: short explanations, real files, clear choices.

## Pick the mode

| The user wants… | Mode | Start with |
|---|---|---|
| A new illustration or system | **Design** | Phase 1 |
| To understand a reference | **Reverse-engineer** | `references/research-and-translation.md` and `references/reference-systems.md` |
| To recreate one illustration and apply its direction to a new subject | **Transfer** | `references/reference-transfer.md`, then the construction spine below |
| New assets in an existing system | **Extend** | Read the existing spec, confirm subjects and touchpoints, then Phases 6–9 |
| Feedback on illustrations or a direction | **Audit** | `references/system-spec-and-validation.md` and `scripts/system_audit.py` |

**Fast track:** never skip understanding what the project is. If information is sparse, state a provisional project
brief, identity, subject list, and production assumptions, then continue. Label generated brand rules as provisional.

**Direction checkpoint:** when direction is open, show three options and wait after Phase 5. Skip the pause only when
the user explicitly requests a direct build. In Transfer or Extend mode, the visual direction may already be fixed;
offer two or three composition sketches for the requested subject instead.

## Tools in this skill

Dependency-free Python 3 scripts live in `scripts/` next to this file.

| Script | Use it to |
|---|---|
| `direction_sheet.py` | Compare three directions using the same spot and scene moments |
| `system_audit.py` | Audit SVGs by family: `flat|editorial|character|line|3d|pattern|technical|device|collage` |
| `render_png.py` | Render SVG/HTML; use `--silhouette` and `--grey` for form and value tests |
| `raster_check.py` | Check raster explorations for unwanted texture, palette drift, and non-sRGB profiles |
| `match_score.py` | Score a vector recreation against a reference and expose the worst regions |

**Look at the work.** Render after every meaningful change and inspect the image. Never claim a check you did not run.

## Example-isolation contract

In **Design** mode, begin without internal worked examples, repository examples, templates, or prior project metaphors.
Do not inspect them during brand research, metaphor generation, or direction selection. They are not evidence about the
current project.

- Derive every metaphor candidate from a stated fact in the current brief, product, audience, identity, or behaviour.
- Generate the metaphor longlist before selecting a rendering family or researching visual styles.
- Research the real-world source behind each shortlisted metaphor; do not search for “illustration styles like X.”
- Use production templates only after a direction is selected, and only as implementation scaffolding with all visual
  tokens and source logic replaced by the chosen project's rules.
- Use `reference-transfer.md` and its specialised kit only in **Transfer** mode, when the user supplied that reference.

If a candidate cannot be traced to current-project evidence, discard it. Similarity to an internal example is a reason
to re-derive the candidate, not evidence that it fits.

## The construction spine

Use this for every subject in every family. Read `references/constructive-illustration.md` before drawing a complex
person, object, vehicle, scene, or abstract process.

1. **Model the subject.** Identify what it is, what it is doing, its essential parts, axes, joints, contact points,
   functional relationships, and the one read that must survive reduction. Gather subject references for accuracy.
2. **Compose the action.** Set crop, focal hierarchy, negative space, ground line, dominant gesture or movement path,
   and relationship to copy or UI. Make two or three thumbnails when the composition is not already fixed.
3. **Build the skeleton.** Draw only guides: axes, wheels, frame, spine, joints, hinges, bounding boxes, perspective grid,
   or an interaction graph. Lock proportions and contact points before styling.
4. **Block the masses.** Replace guides with circles, polygons, ribbons, cylinders, and silhouette planes. Establish
   overlap and negative shapes. The black silhouette must already read.
5. **Add volume and depth.** Define front/side/top planes, occlusion, foreshortening, folds, extrusion, or spatial
   layers. Depth can be flat overlap, line weight, projection, shading, or true 3D—use only what the family permits.
6. **Refine the form.** Add identity-bearing and functional details, clean paths, consistent corners and terminals,
   then remove detail that does not improve recognition, meaning, or character.
7. **Apply brand grammar.** Map palette roles, pattern owners, line rules, materials, devices, and typography-derived
   geometry onto the constructed form. A pattern follows its owning surface; it does not repair a weak silhouette.
8. **Finish with colour, light, and motion.** Establish value hierarchy first. Add light only if native to the family.
   Motion must explain cause, state, or action and must have a reduced-motion frame.
9. **Reduce and verify.** Test silhouette, grayscale, minimum size, contrast, anatomy/function, contacts, occlusion,
   projection, and production editability. Fix the earliest failed layer rather than decorating over it.

This is a sequence of decisions, not a required visual look. A flat illustration may stop at shape planes; an expressive
line family may keep the skeleton visible; a 3D family turns the same masses into geometry; a pattern-led family earns
its pattern only after the unpatterned form works.

## Design workflow

### Phase 1: Understand the brand or project

Ask at most five questions in one message; use `references/intake.md`. The first thing to establish is:

> **What is the brand or project, who is it for, and what must the illustrations help people understand, feel, or do?**

Then establish, without repeating known information:

- the promise, customer transformation, personality, category, and visual clichés to avoid;
- where the work will live and the emotional temperature of those moments;
- brand guidelines and assets: logo, palette, type, layout, imagery, motion, accessibility, existing illustrations;
- whether the user has a style, source, reference, or rendering family in mind;
- whether they have a specific illustration list or want an aligned set proposed.

Read the product, interface, codebase, or supplied guidelines when available. If no guidelines exist, synthesize a
small provisional identity—colour roles, shape language, line/depth rules, and type relationship—and label it clearly.
If no subject list exists, propose one spanning functional, sensitive, and celebratory moments rather than choosing
arbitrary decorative objects.

### Phase 2: Frame strategy, touchpoints, and subjects

Write one strategic sentence with a verb and productive tension. Add three `X but not Y` tone fences. List category
clichés as off-limits unless transformed.

Map touchpoints by tier and emotional temperature with `references/touchpoints.md`. Choose the smallest required size,
one shared product spot, and one scene/hero proof moment. Confirm the illustration brief:

- **subject** and required action/state;
- **message** the image must carry;
- **placement**, crop, copy/UI relationship, and size;
- **must-show / must-avoid** details;
- **deliverables** and production route.

### Phase 3: Generate and research project-specific metaphors

First generate a closed-book longlist from current-project evidence only:

1. Extract the project's nouns, verbs, tensions, transformations, rituals, mechanisms, relationships and identity
   geometry.
2. Reframe each useful fact as a generative question: what real process behaves this way, what structure organises
   relationships this way, what records change this way, or what action produces the same transformation?
3. Generate 8–12 candidate metaphor territories from at least four different project facts. Attach an evidence chain
   to every candidate: `project fact → shared behaviour → candidate source`.
4. Remove category clichés, unexplained aesthetic preferences, and anything recalled from repository examples.

Only then shortlist 3–5 sources and research them with `references/research-and-translation.md`. Research what each
source means, how it is made, its native geometry or marks, how it changes over time, its provenance and permissions,
and whether its rules work at the required sizes. If the source produces repetition, derive a possible pattern from its
actual repeat unit and operations. Do not force every source to become a pattern.

Score the researched candidates for semantic fit, distinctiveness, generative range, touchpoint range, reduction,
motion, feasibility, accessibility and stewardship. Keep a research ledger with citations and distinguish facts from
inference.

### Phase 4: Turn metaphors into three visual directions

Pair the three strongest researched metaphors with rendering families from `references/style-families.md`. The family
is chosen after the metaphor, so examples of a family cannot generate the idea. Score against tone fences,
touchpoints, smallest size, production capacity, accessibility, and existing equity. Form three genuinely different
directions—each `project evidence + metaphor + rendering family + construction logic`—unless the user fixed the family.
At most one may be pattern-led unless requested.

Each direction must show its evidence chain, research basis, meaning chain, invariants, construction rules, colour
roles, motion behaviour, reduction, and one risk. A supplied reference may constrain execution qualities; it cannot
replace project reasoning.

### Phase 5: Build and show comparable direction samples

For each direction create:

1. a signature element or construction swatch;
2. the same product spot moment;
3. the same scene/hero moment;
4. one small strip showing `skeleton → blocked form → branded finish` for the spot;
5. palette, idea, meaning chain, tone fences met, motion verb, and one honest risk.

Build 2D work as SVG. For 3D, provide real scene sources or label SVG/raster approximations as exploration. Audit,
render, inspect, and silhouette-test all samples. Use `direction_sheet.py` for the overview. Cover names and check that
the directions remain distinct. Present a recommendation and wait for a selection unless the user waived the checkpoint.

### Phase 6: Sketch the selected subjects

For each requested subject, make two or three lean composition options unless composition is already specified. Keep
them at skeleton/block level so decisions are cheap. Show differences in action, crop, hierarchy, and movement—not just
colour. Recommend one, or proceed with the strongest when the user requested uninterrupted execution.

In Transfer mode, first rebuild and score the reference, extract a kit and role map, then use the kit to construct the
new subject. The new compositions must retain execution qualities while replacing the reference's subject logic and
props with roles appropriate to the new brief.

### Phase 7: Construct the chosen illustration

Follow the construction spine in order and retain evidence of the layers. For complex assets, deliver a construction
sheet beside the final: reference/subject model, gesture and skeleton, primitive block, volume/overlap, clean form,
brand surface, final, and reduced state. Describe decisions concretely enough that another designer can reproduce them.

Do not add pattern, texture, lighting, or flourishes before proportion, contacts, silhouette, and overlap are correct.
If a human rides a bicycle, for example, the wheel/frame geometry and the rider's hand–handlebar, foot–pedal, and
pelvis–saddle contacts are resolved before clothes, facial detail, or motion lines.

### Phase 8: Expand into a system

Build only what the touchpoint map needs. A typical system includes:

1. **Micro:** 6–12 icons or reduced illustrations at real size.
2. **Spots:** 6–8 product moments across functional, sensitive, and celebratory states.
3. **Scenes:** 2–3 onboarding or explainer scenes.
4. **Hero:** 1–2 campaign or marketing images.
5. **Motion:** one real animation plus reduced-motion state.
6. **Spec:** strategy, touchpoints, construction spine, family rules, tokens, invariants, subject recipes, examples,
   motion, accessibility, and do/don't.

2D systems require editable vectors and shared tokens. 3D requires camera, light, material, and scene rules plus source
files. Line and character systems require brush, anatomy/figure, expression, and pose guidance. Raster image-model
output may explore a direction but is never the production system by itself.

### Phase 9: Validate and hand over

Use `references/system-spec-and-validation.md`. Audit and render every asset. Confirm:

- subject anatomy/function, proportions, contact points, and occlusion make sense;
- the subject reads at real size, in silhouette, grayscale, and reduced state;
- brand ownership survives without logo and primary colour;
- sensitive moments are restrained and celebratory ones carry the most expression;
- source files are editable and a new designer can construct an unseen asset from the spec;
- references influenced stated qualities only; new props, composition, metaphor, and details arise from the project;
- provenance, permissions, and commissioned contributors are documented.

## Red flags

- Asking for style before understanding what the brand/project is.
- Choosing arbitrary subjects when product moments could prove the system.
- Three directions that differ only in pattern or colour.
- Styling a subject before its structure, contacts, silhouette, and overlaps work.
- Using pattern, gradients, shadows, or detail to rescue weak form.
- Generating metaphors from an internal example, template, familiar trend or rendering family rather than project evidence.
- Researching “illustration styles like…” before researching the shortlisted real-world source.
- Copying reference props, composition, palette, metaphor, or projection without project justification.
- Generic corporate figures, stock poses, or characters/jokes in sensitive moments.
- A raster-only “system,” fake motion made from sliced stills, or untested minimum sizes.
- Imitating a living illustrator's signature style or inventing cultural provenance.

## Honesty and limits

- Distinguish documented facts from observations and inferences; cite sources.
- Do not use sacred, restricted, or identity-bearing forms without informed permission.
- Expressive line and character families may deserve a commissioned illustrator. Say so.
- State when files could not be rendered or inspected.

## Reference map

| Read | When |
|---|---|
| `references/intake.md` | Project-first intake, guidelines, subject brief, and fast-track assumptions |
| `references/constructive-illustration.md` | The universal layer-by-layer drawing method and subject recipes |
| `references/touchpoints.md` | Tiers, emotional temperature, and proof moments |
| `references/style-families.md` | Rendering-family construction, reduction, and failure modes |
| `references/direction-options.md` | Three distinct options and the overview-sheet specification |
| `references/research-and-translation.md` | Source research, provenance, reference analysis, and translation |
| `references/reference-transfer.md` | Measured recreation, rebuild-and-score loop, kit, role map, and new-subject transfer |
| `references/system-spec-and-validation.md` | Production specification, construction gates, proof matrix, and acceptance tests |
| `references/production-prompts.md` | Production routes, exploration prompts, and known failures |
| `references/reference-systems.md` | Reverse-engineer mode only: generic system strategies, never Design-mode ideation |

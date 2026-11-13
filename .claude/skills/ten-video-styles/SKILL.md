---
name: ten-video-styles
description: Make a code-rendered video (Remotion/React + SVG) in one of 10 art styles - Pixel Art, Clay, Paper Cutout, Low Poly, Voxel, Isometric, Neon, Blueprint, Retro VHS, Doodle. Use when the user asks for a video, reel, animation or motion graphic and names one of these styles, or asks "which styles can you make".
---

# 10 Video Styles

Recipes for making the SAME subject look like 10 genuinely different art styles
in a code-rendered video. A style is not a colour change: each one has its own
geometry, texture, motion and font. If a frame from your scene could be mistaken
for flat vector art, the style is not done yet.

## How to use

1. Ask (or infer) three things: the **subject** (e.g. an auto-rickshaw), the
   **style** (one of the 10 below) and the **format** (default 1080x1920, 30 fps).
2. Draw the subject ONCE as plain polygons + circles (lists of points, no curves).
   Every style below re-renders that same point data, so the subject stays
   recognisable across styles.
3. Build the scene with the recipe for the chosen style: background, subject
   treatment, motion, font.
4. Render 1 still per scene and LOOK at it before the full render. Fix, then render.

Prompt formula the user can type:
`[subject] ka video banao, [STYLE] style mein` + mood + camera + purpose.

## Rules for every style

- Subject sits in the middle 60% of the frame; keep text out of the top 220 px
  and bottom 380 px (Reels UI covers them).
- Title uses a font that belongs to the style (listed per style). Load fonts as
  local files; do not rely on system defaults.
- Background must move (scrolling road, parallax, grid) so the subject feels
  like it is travelling even when it stays centred.
- Give all SVG filters unique ids; several styles on one screen share one document.
- Heavy SVG filters break when the scene is scaled down (thumbnails). Provide a
  `mini` mode that drops them.

## The 10 recipes

### 1. Pixel Art - "purane video game jaisa"
- **Look:** chunky square pixels, hard dark outline, bright flat colours.
- **How:** draw the scene normally, then pixelate the whole group with an SVG
  filter: `feFlood` (2x2 px at offset 5,5) -> `feComposite` (12x12) -> `feTile`
  -> `feComposite in=SourceGraphic operator=in` -> `feMorphology dilate radius=5`.
  This gives 12 px cells. Add an 8 px dark stroke to the subject first.
- **Motion:** step time to 10 fps (`floor(frame/3)`), snap positions to the 12 px
  grid, bob by exactly one cell.
- **Extras:** blocky sun and clouds from rects, checker grass, floating coins.
- **Font:** Press Start 2P, white with a hard offset shadow.

### 2. Clay - "haath se bana hua"
- **Look:** soft puffy shapes, light from top-left, matte surface, contact shadows.
- **How:** round every shape (same-colour stroke 14 px, round joins). Per part,
  apply a filter: low-frequency `feTurbulence` + `feDisplacementMap` (scale 12,
  wobbly edges) -> `feGaussianBlur` (7) as a height map -> `feDiffuseLighting`
  multiplied onto the colour + a little `feSpecularLighting` -> fine noise for
  fingerprint texture -> `feDropShadow`.
- **Motion:** stop-motion. Update only every 3rd frame, jitter position 1-3 px
  per step, cycle the turbulence seed (3 values) so edges "boil".
- **Palette:** pastel peach, sage, mustard. **Font:** Fredoka Bold.

### 3. Paper Cutout - "kaagaz ki layers"
- **Look:** flat sheets stacked with shadows between them, rough cut edges, grain.
- **How:** every layer gets `feDisplacementMap` (scale 5) + `feDropShadow`
  (dy 9, blur 5, 38%). Finish with a full-frame noise rect in `multiply` blend.
- **Motion:** 3-4 hill layers scrolling at different speeds (parallax), clouds
  hanging on thin strings and swinging, subject rocks 1-2 degrees like a puppet.
- **Palette:** craft paper: teal, mustard, terracotta, cream. **Font:** Alfa Slab One.

### 4. Low Poly - "kam shapes, clean 3D"
- **Look:** everything made of flat-shaded triangles, no outlines, no gradients.
- **How:** triangulate each polygon as a fan from a slightly jittered centre.
  Shade each triangle differently: a light-direction term plus a small random
  offset. Stroke each triangle with its own fill to hide seams. Build the sky
  as a jittered grid of triangles coloured by height; mountains = two triangles
  each (lit side, dark side).
- **Motion:** smooth; mountain layers scroll with parallax, faceted sun rotates.
- **Font:** Oxanium ExtraBold, uppercase.

### 5. Voxel - "chhote cubes ki duniya"
- **Look:** the subject is built from small cubes, viewed from an isometric angle.
- **How:** describe the subject as a 3D grid of coloured cells (about 14x7x9).
  Project with `sx=(x-y)*u*0.866, sy=(x+y)*u*0.5-z*u`. Draw 3 faces per cube
  (top lightest, left mid, right darkest), skip faces hidden by a neighbour,
  sort by `x+y+z` before drawing.
- **Motion:** ground is a checker of diamond tiles that scrolls along the road
  axis; cube trees scroll past; subject does a small hop.
- **Font:** Bungee with a hard block shadow.

### 6. Isometric - "upar se tirchha view"
- **Look:** a clean miniature city block on a floating slab, smooth boxes (not
  cubes), pastel colours, soft shadow under the slab.
- **How:** same projection as Voxel but with large smooth boxes: buildings with
  window grids on both visible faces, a road, trees, a kiosk, a lamp post. The
  subject is 8-10 boxes and drives along the road.
- **Motion:** buildings rise from the ground with an overshoot, staggered; the
  whole slab floats up and down slowly.
- **Font:** Oxanium, dark text on a light background.

### 7. Neon - "raat wali cyberpunk vibe"
- **Look:** dark night, glowing outline drawing, synthwave grid floor.
- **How:** subject = strokes only (4-5 px) with the fill set to the background
  colour so parts still hide each other. Glow filter = merge of a wide blur
  (14), a tight blur (4) and the sharp source. Floor = lines fanning out from a
  vanishing point + horizontal lines spaced by `p*p` that scroll toward camera.
- **Motion:** sign-style flicker in the first 8 frames, streaking light lines,
  twinkling stars, striped sun on the horizon.
- **Palette:** cyan, magenta, yellow on near-black purple. **Font:** Tilt Neon
  with stacked magenta text-shadows.

### 8. Blueprint - "engineer ka drawing"
- **Look:** blue sheet, fine + major grid, thin white technical line drawing.
- **How:** subject = white 3 px strokes, fill = sheet colour. Draw lines on with
  `pathLength=1` + animated `strokeDasharray`, staggered per part. Then add
  dimension lines with arrowheads and mm values, dash-dot centre lines on the
  wheels, leader lines with labels, and a border frame.
- **Motion:** draw-on first (0.5 s), dimensions extend from their centre, then
  only the wheels turn slowly. Nothing bounces.
- **Font:** Share Tech Mono, uppercase.

### 9. Retro VHS - "nabbe ke dashak ki tape"
- **Look:** 90s home video: colour fringes, soft picture, scanlines, tape noise.
- **How:** one filter on the whole scene: red channel offset +9 px, green+blue
  offset -7 px, `screen` blend, horizontal blur (2.6, 0.6), saturation 1.25.
  On top: scanline pattern, per-frame noise, a tracking band that travels down
  the frame with its content shifted sideways, a torn strip at the bottom edge,
  vignette, and "PLAY" + a running counter as on-screen text.
- **Motion:** 2 px horizontal jitter with an occasional bigger jump.
- **Palette:** sunset purple, pink, orange. **Font:** VT323 with red/cyan shadows.

### 10. Doodle - "copy ke peeche wala sketch"
- **Look:** ballpoint pen on a ruled notebook page with a red margin line.
- **How:** strokes only, fill = paper colour, hatching patterns for shading.
  One `feTurbulence` + `feDisplacementMap` (scale 11) over all pen lines, and
  change the seed every 4 frames so the lines "boil".
- **Motion:** lines draw on quickly, spiral sun turns in steps, stars wobble,
  speed lines behind the subject, a handwritten word like "vroom!".
- **Font:** Caveat Bold.

## Showing styles side by side

When the video compares styles, keep ONE element identical in every scene (for
example a prompt box where only the style word changes) and use hard cuts on the
voiceover beat. That is what makes "only one word changed" visible.

## Before delivering

- [ ] Each scene passes the test: "would someone name this style without the title?"
- [ ] Subject is the same shape and size in every style.
- [ ] Title and caption readable on a phone, inside the safe area.
- [ ] Stills checked for every scene before the full render.

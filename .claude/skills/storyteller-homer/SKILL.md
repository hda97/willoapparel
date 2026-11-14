---
name: storyteller-homer
description: Master skill HOMER for the master-storyteller set. Use when a post should feel like pride, celebration, honour, a legend being sung, homecoming, family or community glory (weddings, Eid, national days, a craft done right, a win). Writes a 15–60 s talking short-video script (animated or live) in the language the brief asks for (examples in Palestinian Arabic), in Homer's style (invocation, fixed epithets, winged-words tip speech, extended simile, guest ritual, ring close). Called by the storyteller conductor with a STORY BRIEF, or standalone with a plain request.
---

# storyteller-homer

Writes one script in Homer's voice for a talking short video (TikTok / Reels). Optional depth, not needed at runtime: `research/1-homer.md` (sources, Style DNA, close readings). How this skill was built and tested: `METHOD.md`.

**Brand layer.** Cast voices, logo, visual taste (for example a required transformation moment), which video types may talk, and banned copy (contact details, prices, offer wording, themes) come from your house rules: `skills/storyteller/house-rules.example.md`, or your own file in its place.

**Language.** Write every spoken line in the language or dialect the brief names, then run the matching voice module (see `.claude/skills/storyteller/VOICE-MODULES.md`). The craft rules work in any language. The examples, signature lines and dialect notes in this file are Arabic, written for the example module `storyteller-voice-palestinian`. For another language, keep the pattern (formula, epithet, retort shape, rhyme) and write fresh lines in that language.

## 0. Arabic example: Palestinian dialect notes and voices (when the brief asks for it)

- All spoken lines: **Palestinian Levantine**, easy for Gulf viewers. House spelling «الي», never «اللي».
- Use: «شو، هيك، كتير، منيح، بدّي، رح، مش، هاد/هاي، إلو، متل، لمّا، حكى»، present with «بـ» («بتحرق، بيتبخّر»)، «فنجان»، «يا ابني / يا بنتي».
- Avoid rare slang: «هسّع، ولك، زلمة، بالمرّة». Avoid Gulf-leaning wording from early tests: «وش، يبه، سوّاها، فنجال، ما يدري، اللي».
- Numbers and minutes in dialect («بالدقيقة عشرة»), never formal ordinals. Check gender and plural on every verb.
- Voices: a calm, unhurried narrator plus a small cast (older man, young woman, older woman). Speeches are lip-synced on screen by the cast. Voice choice per role comes from your house rules.
- The test scripts in the research bible's section 6 use an older, Gulf-leaning dialect. Take their structure, never their wording.

## 1. When to pick Homer

Pick: pride, celebration, legacy, honour before family or community, a craft done the right way, a homecoming, a win told as a song, a product that makes a gathering proud (oud, coffee, abaya for an occasion, wedding visuals).
Do NOT pick: a series cliffhanger (Scheherazade), one sharp lesson under 15 s with a moral (Aesop), business wisdom by parable (Ibn al-Muqaffa'), comedy of a mistake we watch coming (Shakespeare), anything fast, ironic or hype-driven, a twist ending.

## 2. Rules (bible numbering)

- **R1 Invoke, then name the theme.** Line 1 = «غنّي يا ربابة عن…» + theme noun (the smell, the photos, the day) + whose + what it cost or changed.
- **R2 Start in the middle.** Open at the crisis, then fill in one step of the past.
- **R3 Outcome early, suspense on "how".** One pitying aside: «والمسكين ما كان عارف».
- **R4 Fixed epithet, word for word.** Each main person/object gets one 2–4 word tag, used 2–3 times, once where it adds nothing to the moment.
- **R5 Formulas.** Speech opener «وحكى كلام إلو جناحين:» and/or dawn «ولمّا طلع الفجر وردي الأصابع فوق…», repeated exactly.
- **R6 One extended simile per ~15 s.** From another world (herders, falcon, sea, rain, desert). Give it its own detail past the comparison. Never a bare «متل الأسد».
- **R7 Type-scene.** One ritual in fixed ordered steps (dressing, coffee for a guest, baking, kick-off).
- **R8 Xenia.** The guest is served before he is asked anything. A quiet visitor may be a helper in disguise and may leave unseen. (For a Saudi family audience the guest/helper follows the family-code rule in the conductor skill.)
- **R9 The tip is a speech.** A character gives full direct advice, concrete, imperative, grown from the story's turning point, useful to any viewer. The narrator never gives the tip. Real people never get invented words or lip-sync: give the speech to a fictional witness.
- **R10 Everything in the foreground.** Say it out loud; feeling shows in the body (tears, hands, voice). No subtext, no withheld fact, no murky light.
- **R11 Digression with a ring return.** An object opens a fully lit past episode; cut back to the identical frame, ideally on a sound.
- **R12 Catalogue.** 3–5 names, each with one tag and a place or role.
- **R13 Stakes = honour and homecoming.** How the community will remember it. Never money alone.
- **R14 Ring and rite close.** Repeat the opening phrase or epithet; end on a communal rite (coffee, feast, wedding, holiday). No moral sentence. The tip card repeats the R9 speech.
- **R15 Even «و» rhythm.** Chained clauses of equal weight, calm pace, no staccato hype.

**Anti-rules (one breaks the style):** (1) closing moral «والعبرة…» or narrator lecturing; (2) story inside a story to delay, or cliffhanger exit; (3) interior monologue, puns, irony, comic subplot; (4) animals as moral types, allegory of kings; (5) twist on withheld facts, hazy dreamy flashback.

**Fake imitations:** (1) "epic" sound only: trailer voice, booming orchestra, slow-mo, «في عالم…»; (2) myth costume: gods, helmets, thunder. **No deities, ever**; use the rababa and the disguised helper; (3) varied epithets (brave / noble / strong) instead of one repeated tag; (4) one-word similes; (5) "hero's journey" plot template instead of this voice.

## 3. Time maps

| Length | Map |
|---|---|
| **15 s** | 0–3 R1+R3 · 3–6 R2 crisis · 6–11 R5+R9 speech · 11–15 R14 ring with epithet + card. Drop simile, catalogue, type-scene. |
| **30 s** | 0–3 R1+R3 · 3–7 R2 crisis + aside · 7–11 R7 ritual (2–3 inserts) + R4 · 11–15 R6 simile · 15–17 R8 guest served · 17–23 R5+R9 speech · 23–27 R13 result + praise · 27–30 R14 ring + rite + card. |
| **45 s** | 0–3 R1+R3 · 3–8 R2 crisis + aside · 8–15 R7 ritual + R4 · 15–20 R6 simile · 20–25 R12 catalogue or R8 guest · 25–32 R5+R9 speech · 32–40 R13 result + praise + short second simile · 40–45 R14 ring + rite + card. |
| **60 s** | 45 s map + R11 digression (~8 s, lit memory, exact frame return on a sound, after the ritual) + a second full simile in the result beat. Ring close 54–60. |

Screen: rababa bow on one string at 0 s; clean even light; cutaway simile in the same render quality; sparse sound (rababa drone, no whooshes); last shot repeats the first framing.

## 4. Signature lines bank (Arabic examples, Palestinian; adapt the pattern)

1. Opener: «غنّي يا ربابة عن [الريحة الغلط]، الي كانت رح تخرّب ليلة [سعود عريض الكتاف].»
2. Opener (day): «غنّي يا ربابة عن يوم [X]، اليوم الي ما حدا صدّق فيه غيرهم.»
3. In the middle: «ساعة قبل [الزفّة]، والمجلس مليان، و[الدخان طالع مُرّ].»
4. Pity aside: «والمسكين مفكّر العيب بـ[العود]. ما كان عارف.»
5. Epithet patterns: [name + adjective + body part] «سعود عريض الكتاف» · [أم/أبو + gift] «نورة أم إيد الدهب»، «أبو سالم واسع البال» · [object + أبو + detail] «البشت الأسود أبو الخيط الدهبي».
6. Speech formula: «وحكى كلام إلو جناحين:»
7. Dawn formula: «ولمّا طلع الفجر وردي الأصابع فوق [الرياض]،»
8. Tip-speech formula: «يا ابني، [X] منيح، بس [الغلط] بيخرّبه. [أمر 1]، و[أمر 2].»
9. Simile: «متل صقر حرّ بقفص مصدّي: الطير ملك، والقفص بيصغّره.»
10. Simile: «متل نار رعيان بليلة شمال، بتوكل الحطب الأخضر وبتدمّع العيون.»
11. Xenia: «صبّوله القهوة قبل ما يسألوه شو اسمه.»
12. Helper vanishes: «والتفتوا ليشكروه، وما لقوا غير فنجانه على الصينية.»
13. Praise (kleos): «وصار الكل يسأل: [بخور] مين هاد؟»
14. Closer: «هاي كانت ليلة [سعود عريض الكتاف]. [صورة]، و[صورة].»
15. Closer (series of days): «ومن يومها، صارت العيلة تستنّى [X] من [أبو سالم واسع البال].»

## 5. Mix mode: the lendable move

**Lend only the FIXED EPITHET, repeated word for word.** It is cheap, needs no change to the host's structure or pacing, and makes a character memorable (good for series).

How to insert it into another master's script:
1. Give the lead character (or the product) ONE 2–4 word tag in the script's language, e.g. (Palestinian) «هالة أم العين الحلوة»، «أبو سالم واسع البال».
2. Use it exactly 3 times: the first naming, the turn, and the last line. Same words every time, no synonyms.
3. Keep everything else in the host's voice: its opener, rhythm, tip delivery and ending. No «غنّي يا ربابة», no «و» chains, no simile added.
4. In comedy (Shakespeare) the tag may turn ironic at the turn; that is the host's choice, not Homer's.

**Never lend:** the invocation «غنّي يا ربابة» (it takes over the opening and announces Homer), the ring-and-rite close (it fights cliffhangers and morals), telling the outcome early with the pity aside (it kills the host's suspense), the vanishing helper in disguise, and the even «و» cadence. These only work inside a full Homer script.

## 6. Writing steps

1. **Brief.** From the conductor: goal, audience, platform, length, shape (9:16 or 16:9), product, ONE takeaway, feeling, single/series, talking allowed or not, house rules. Standalone call: write a 9-line mini-brief with these fields first; ask at most 2 short questions only if the product or takeaway is missing.
2. **Beats.** Pick the time map. Fill: theme noun and cost; crisis; ritual steps; simile world; guest or catalogue; speaker and tip; result and praise; ring rite. Pick epithets now and lock them.
3. **Script.** Numbered lines, one speaker each: «1. (0:00–0:03) الراوي: …». Speakers named by role or character name. Narration ~2.5 words per second; a speech line 5–7 s.
4. **Tip card.** Copy the imperative sentence(s) of the R9 speech **word for word**. Card on screen in the ring beat, inside the platform safe zone (e.g. x 86–994, y 230–1536 of 1080x1920), never over a face.
5. **Self-check** (section 7). Fix, then hand back: brief (if standalone), script, card, short shot notes, proof list.

## 7. Self-check proof list

Write this under the script, with line numbers:
- Rules hit: R1 L_ · R2 L_ · R3 L_ · R4 L_, L_, L_ · R5 L_ · R6 L_ · R7 L_ · R8 L_ · R9 L_ · R10 L_ · R12/R11 L_ (if used) · R13 L_ · R14 L_ echoes L_ · R15 L_–L_. Target 13+/15 at 45 s.
- Anti-rules 1–5 absent; fake imitations 1–5 absent; no deity.
- ONE takeaway; the card = the spoken tip, word for word; the narrator never says the tip.
- Talking rule: the cast speaks on camera, lip-synced. If your house rules forbid talking for this video type (e.g. a silent fashion film), the silent subject stays silent and the tip speech goes to another cast member in his/her own shot, or you pick another format.
- No real person's face, voice or invented words (news story = fictional witness).
- House-rules checks passed (themes, banned copy, brand marks, visual taste).
- Voice pass: the brief's language, through its voice module (Palestinian example: «الي» only, gender and plural right, no rare slang, no Gulf-leaning test wording).

## 8. Model script: the wedding oud (45 s, 9:16)

Brief: teach how to burn oud right · Gulf families before weddings · Reels/TikTok · 45 s · 9:16 · oud / mabkhara · takeaway: grey the coal, put the oud on foil · pride · single · talking video.

1. (0:00–0:04) الراوي: غنّي يا ربابة عن الريحة الغلط، الي كانت رح تخرّب ليلة سعود عريض الكتاف.
2. (0:04–0:07) الراوي: ساعة قبل الزفّة، والمجلس مليان، والدخان طالع مُرّ.
3. (0:07–0:09) الراوي: والمسكين مفكّر العيب بالعود. ما كان عارف.
4. (0:09–0:14) الراوي: كان لابس الثوب الأبيض، وشدّ البشت الأسود أبو الخيط الدهبي، وحطّ العود الكمبودي على الجمر الأحمر.
5. (0:14–0:19) الراوي: وطلع الدخان أسود وحادّ، متل نار رعيان بليلة شمال، بتوكل الحطب الأخضر وبتدمّع العيون.
6. (0:19–0:22) الراوي: شمّه خاله من حايل، وعمّه من جدة، وجدّته أم ناصر الي ما بيفوتها عطر.
7. (0:22–0:25) الراوي: ودخل شايب غريب. صبّوله القهوة قبل ما يسألوه شو اسمه.
8. (0:25–0:26) الراوي: شرب الفنجان، وحكى كلام إلو جناحين:
9. (0:26–0:32) الشايب: «يا ابني، عودك طيّب، بس الجمرة الحمرا بتحرقه. خلّي الجمرة تشيب برماد أبيض، وحطّ العود فوق ورقة قصدير.»
10. (0:32–0:36) الراوي: وعملها سعود عريض الكتاف. وطلع دخان أزرق رفيع، متل أول مطرة على رمل عطشان.
11. (0:36–0:39) أم ناصر: «هاد بخور بينذكر.» الراوي: وصار الكل يسأل: بخور مين هاد؟
12. (0:39–0:42) الراوي: والتفتوا للشايب ليشكروه، وما لقوا غير فنجانه على الصينية.
13. (0:42–0:45) الراوي: هاي كانت ليلة سعود عريض الكتاف. جمرة بيضا، وعود بيتبخّر، ما بيحترق.

**Tip card (0:42–0:45):** «خلّي الجمرة تشيب برماد أبيض، وحطّ العود فوق ورقة قصدير.»

**Shots** (voices: calm narrator · the stranger = older man, lip-synced · Umm Nasser = older woman, lip-synced)
- 0:00–0:04 Close-up: bow across one rababa string; cut to the brass mabkhara, dark harsh smoke.
- 0:04–0:09 Medium: full majlis in thobes; Saud, broad-shouldered groom, frowning at the burner.
- 0:09–0:14 Three ordered inserts: white thobe; black bisht with gold thread pulled on; oud chip on glowing red coal.
- 0:14–0:19 Cutaway: herders' fire on a windy night, green branches spitting smoke, a herder rubbing his eyes.
- 0:19–0:22 Three faces, name tags in a bottom corner: uncle from Hail, uncle from Jeddah, grandmother Umm Nasser sniffing.
- 0:22–0:26 Wide: an old stranger enters; a young man pours from the dallah; he sips.
- 0:26–0:32 Medium close: the stranger talks, tapping the coal. **Transformation moment (prop changes state):** grey ash creeps across the red ember, then a foil square folds itself into place under the oud chip.
- 0:32–0:36 Saud repeats the steps; thin blue smoke curls. Cutaway: first rain darkening dry sand.
- 0:36–0:39 Umm Nasser speaks; guests lean in toward the smoke.
- 0:39–0:42 **Surprise:** the stranger's seat is empty, his cup alone on the tray.
- 0:42–0:45 Same framing as shot 1: the mabkhara, now with thin blue smoke. Card fades in, safe zone. Brand marks per house rules.

**Proof:** R1 L1 · R2 L2 · R3 L1, L3 · R4 L1, L10, L13 (Saud) · R5 L8 · R6 L5, L10 · R7 L4 · R8 L7, L12 · R9 L9 · R10 L2, L5, L11 · R11 not used · R12 L6 · R13 L11 · R14 L13 echoes L1, rite = the wedding night · R15 L4–L6. 14/15. Anti-rules absent. One takeaway; card = L9's imperatives word for word. No real person, no deity.

## 9. Depth

Full research bible (sources, Style DNA, close readings of Iliad 1, Odyssey 19, Iliad 6, the 4 early tests and the exam): `research/1-homer.md`. The early test shot lists are not included in this repo.

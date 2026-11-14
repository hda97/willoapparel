---
name: storyteller-voice-palestinian
description: Voice module (example) for the storyteller set. Edits a finished script's spoken lines into clean, natural Palestinian Levantine Arabic that Gulf and Saudi viewers follow easily, ready for text-to-speech, without changing the story. Use on every storyteller script whose brief asks for Palestinian Arabic, before the human reviewer.
---

# Voice module: Palestinian Levantine Arabic

This is the example voice module of the set. A voice module turns a master's draft into natural speech in one language or dialect. To add one for another language, see `.claude/skills/storyteller/VOICE-MODULES.md`.

Why this module exists: our blind exams caught dialect slips in every round (the wrong spelling of «الي», formal Fusha numbers, an Egyptian phrase, wrong gender). A separate editing step fixes the dialect without touching the story.

TTS note: we voice these scripts with a text-to-speech engine, using the style prompt "Palestinian Levantine Arabic accent, warm, natural, conversational". Voice choice per role comes from the house rules.

## Change ONLY the dialect
Keep every beat, every line's job, the timing, the master's formulas and the tip meaning. If a formula must stay classical («بلغني…», «اضرب لي مثل…», «وكيف كان ذاك؟»), keep it as a quoted formula and speak the rest in dialect.

## Checklist (line by line)
1. **Spelling:** house spelling «الي», never «اللي». (A house choice; change it in your house rules if you prefer «اللي».)
2. **Palestinian forms:**
   - Present tense with «بـ»: «بحكيلك»، «بتعرف».
   - Future: «رح» / «حـ».
   - «هيك»، «هلّق»، «شو»، «ليش»، «كتير»، «منيح»، «بدّي/بدّك»، «إشي»، «زيّ»، «عشان»، «لسّا»، «هاد/هاي»، «هدول».
   - Negation: «مش / ما … ش» (light).
3. **No Saudi or Gulf slips:** «وش/ايش» → «شو», «ابغى» → «بدّي», «زين» → «منيح», «الحين» → «هلّق», «مره» → «كتير», «يبغى» → «بدّو».
4. **No Egyptian:** «إزّاي، عايز، دلوقتي، كده».
5. **Easy for Gulf viewers:** no rare village slang. If a word may confuse, use the common Levantine word that Gulf viewers know from TV.
6. **Numbers and times:** spoken the dialect way («الساعة تسعة»، «عشر دقايق»). No Fusha ordinals, no tanween.
7. **Gender and number:** match every verb and pronoun to who is spoken to. Content for women speaks to women («جرّبي، بعتيلنا»); general content to men or neutral.
8. **TTS safety:**
   - Short sentences (one breath, ≤ 12 words).
   - Add a vowel mark where the TTS engine may misread a word.
   - No Latin letters inside lines except brand names.
   - Write numbers as words when they are spoken.
9. **Rhyme and rhythm:** if the master needs rhyme (a Shakespeare couplet, a Homer tag), check that it still rhymes when spoken in Palestinian.
10. **Tip card:** the tip line and the card match word for word after the edit.
11. **Pace:** at most 2.5 spoken words per second across all voices.

## Output
- The edited script, same numbering.
- A short change list: line · before → after · why.
- Flag any line where the dialect change might change the meaning, for the writer to confirm.

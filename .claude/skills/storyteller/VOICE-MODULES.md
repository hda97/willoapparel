# Voice modules

The five master skills hold craft: structure, devices, timing. They work in any language. A **voice module** is the step that makes the draft sound like a real person speaking one specific language or dialect. The conductor runs it after the master writes and before the human reviewer reads.

This repo ships one example: `skills/storyteller-voice-palestinian/` (Palestinian Levantine Arabic, for Gulf and Saudi viewers).

## When you need a new one

Any time the brief asks for a language or dialect that has no module yet: Egyptian Arabic, Gulf Arabic, Modern Standard Arabic, Brazilian Portuguese, Mexican Spanish, Nigerian English, plain US English, and so on.

## How to add one

1. Create `skills/storyteller-voice-<language-or-dialect>/SKILL.md` (lowercase, hyphens, e.g. `storyteller-voice-egyptian`, `storyteller-voice-us-english`).
2. Frontmatter:
   ```
   ---
   name: storyteller-voice-<language-or-dialect>
   description: Voice module for the storyteller set. Edits a finished script's spoken lines into natural <language/dialect> for <audience>, ready for TTS, without changing the story. Use on every storyteller script whose brief asks for <language/dialect>, before the human reviewer.
   ---
   ```
3. Copy the section layout of the Palestinian module and fill each part for your language:
   - **Change ONLY the language.** Same rule in every module: keep beats, timing, formulas and the tip meaning.
   - **Spelling choices** the house has fixed (e.g. one spelling of a common word, British vs US spelling).
   - **Natural forms** to use: the everyday grammar and words of the dialect.
   - **Slips to replace:** words from neighbouring dialects or from the formal register that make the line sound wrong to this audience, with their replacements.
   - **Audience ease:** what a viewer from a nearby market will or will not follow.
   - **Numbers and times** the spoken way.
   - **Gender, number, formality** (tu/vous, du/Sie, você/tu, gendered verbs).
   - **TTS safety:** sentence length per breath, marks or spellings that stop the engine misreading.
   - **Rhyme and rhythm:** check the master's rhymes and tags still work when spoken.
   - **Pace:** your words-per-second cap. Words per second differ by language. Time a natural read of a few lines with your TTS voice and set the cap there (our Arabic cap is 2.5).
   - **Tip card:** spoken tip = card, word for word, after the edit.
   - **Output:** edited script with the same numbering, a change list, flagged meaning risks.
4. Give the human reviewer a viewer panel for that audience (see `skills/storyteller-human-reviewer/SKILL.md`, section A).
5. Translate the cultural guidance in the conductor's law 11 for that audience.
6. Test it. Run one real request end to end and log the reviewer score in `skills/storyteller/log.md`. If the reviewer flags lines that "do not sound like a real person", add those patterns to the module.

## What a voice module must never do

- Change a story beat, cut a fingerprint move, or move the tip.
- Rewrite a master's fixed formula into plain speech, unless the formula's own rule allows it.
- Add new jokes, morals or lines.

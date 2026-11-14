---
name: storyteller
description: Story engine (conductor) for short video. Turns any video request ("a post about oud", "an ad for our product", "a phone-tip video", "this video feels boring") into a finished, human-reviewed 15–60 s script + shot list in the language the brief asks for, written in the style of one of 5 masters (Homer, Scheherazade, Aesop, Ibn al-Muqaffa', Shakespeare). Use this for every new story/post script; it calls the other storyteller-* skills in order.
---

# The Storyteller (conductor)

Runs the whole chain: analyzer, master, voice module, human reviewer, shot list, learning log. How the set was built and tested: `METHOD.md` (folder ini).

## Parts (each is its own skill in `skills/`)
| Step | Skill | Who runs it |
|---|---|---|
| 1 | `storyteller-analyzer` | this agent |
| 2 | one master: `storyteller-homer` · `storyteller-scheherazade` · `storyteller-aesop` · `storyteller-muqaffa` · `storyteller-shakespeare` | a subagent on your strongest writing model |
| 3 | the voice module for the brief's language (example: `storyteller-voice-palestinian`; see `VOICE-MODULES.md` (folder ini)) | the same writer or a subagent |
| 4 | `storyteller-human-reviewer` | a FRESH subagent that gets ONLY the script + tip card |
| 5 | `storyteller-shotlist` | this agent or a subagent |
| 6 | learning log | this agent: `skills/storyteller/log.md` |

Brand layer: read your house rules file before step 1 and pass it to every step. Example: `skills/storyteller/house-rules.example.md`. Copy it to `house-rules.md` and make it yours.

## Flow
1. **Analyze.** Run storyteller-analyzer and get the STORY BRIEF. It sets: the language, the master, the runner-up, the mode (single / mix / two options), and up to 2 questions for the requester. If it has questions, ask them first and wait.
2. **Write.** Give the brief to the chosen master skill. Read the skill file and pass its path to the subagent; the subagent must read it first.
   - **Mix mode:** the lead master writes and borrows ONE "lendable move" from the second master's skill (section "Lendable move"). Never more than one borrowed move.
   - **Two options:** the 2 masters write in parallel from the same brief. Each option goes through steps 3–4 on its own.
3. **Voice.** Run the voice module for the brief's language on the script. It may change the wording of the language or dialect only, never the story beats. No module for that language yet? Write one first (see `VOICE-MODULES.md` (folder ini)), or skip this step and say so on the final page.
4. **Review.** Spawn a fresh agent with storyteller-human-reviewer. Give it only the script text + tip card + length + platform + the house rules. Do not give it the brief, the master's name or any self-scores.
   - The WRITER saves `review-input.md` itself: "# Script", the numbered lines exactly as in the final script, "## Tip card". No title, no master name, no notes.
   - Never build it with a word filter. A case-insensitive filter once cut real lines («ground» matched «round»).
   - Before sending, check that the count of numbered lines equals the count in the script.
   - FAIL: send the reviewer's line notes back to the master (step 2), then repeat steps 3–4. Max 2 rewrite rounds; after that, show the requester the best version with its scores.
   - PASS: go on.
5. **Shot list.** Run storyteller-shotlist on the passed script.
6. **Final page.** ONE page for the requester with:
   - the script, the tip card and the shot list
   - one line on why this master (and the borrowed move, in mix mode)
   - the reviewer score (stops x/6 · value · boredom)
   - the talking decision
   - Two options = both scripts on the same page, labelled 1 and 2; the requester picks.
7. **Log.** Add one line to `log.md`: date · request · master (+mix) · reviewer score · rounds · verdict (fill it in when the requester answers) · post id. Fill in views and saves later, when the post has data.

## Short-video laws (from our human-reviewer tests; they override any master's map)
1. The first 2–3 s are a spoken PUNCH: the problem, a boast or a surprise, seen on screen. Never a slow formula or proverb request first.
2. At most ONE inner tale. Stacked tales lose young viewers.
3. The tip lands by about 60% of the runtime. Tip/demo videos start step 1 by 0:15.
4. Count EVERY spoken word in all voices. For Arabic we cap at 2.5 words per second (15 s ≈ 35 · 30 s ≈ 75 · 45 s ≈ 110 · 60 s ≈ 150). Other languages: set the cap in the voice module (words per second differ by language).
5. Say the moral at most twice (tip line + close). Any closing moral line that is not the tip goes on the end card or is cut.
6. A laugh or a warm beat before the end in every video that talks.
7. A series teaser must be CONCRETE: the viewer knows what part 2 is about.
8. A master's rules are a MENU, not a quota. The script must carry the master's 3 fingerprint moves, audible. Use other rules only when they fit the seconds. Never stuff rules to pass a self-check. Dropping a rule at short length is fine; say which one and why.
9. Leave room: silent beats and a laugh count as story, not as wasted seconds.
10. SELL videos (ads, service posts): the takeaway is the buyer's insight that leads to the product or service (e.g. «العباية بتنباع لمّا الناس تشوفها ماشية، مش معلّقة» = "an abaya sells when people see it walking, not hanging"), NEVER a do-it-yourself tip that replaces it. Also say the offer in plain words: what you send, what you get, how long. Prices and offer wording only from the house rules or your live price source.
11. Audience culture first. Example for a Saudi / Gulf family audience: a woman's guest, helper or adviser is a woman or a close family elder (mother, aunt, grandmother, her own father or uncle in a family room). No unrelated man at her door, in her bedroom or alone with her. Homer's guest scene and every "visitor" move follow this. Write the matching guidance for your own audience into the analyzer brief.

## Hard rules (every step)
- Spoken lines in the language and dialect the brief names, run through its voice module.
- One usable takeaway, said by a character AND on a tip card, word for word the same.
- Talking check: decide per video whether it talks (with vs without); some video types may be silent by house rule.
- No real person's face, look-alike, voice or invented words (names in narration as facts are OK).
- House rules apply at every step (visual taste, banned themes, banned copy, contact details, prices).
- Never show the requester a script that has not passed the human reviewer.
- Paid generation is NOT part of this skill. Production happens elsewhere.

## Files
- Bibles (depth, optional): `research/1-homer.md` … `research/5-shakespeare.md`
- How the set was built, with exam results: `METHOD.md`
- Log: `skills/storyteller/log.md`
- Brand layer example: `skills/storyteller/house-rules.example.md`

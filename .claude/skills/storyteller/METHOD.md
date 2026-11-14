# METHOD: how we built a humanized storytelling skill by studying the masters

This is the record of how the master-storyteller set was made, written from our working notes. It covers what we did, the real scores, and what failed. We are a small studio; this was a few days of focused work with Claude agents, not a research project. Read it as a method you can copy, with its weak spots marked.

The short version: **study each master deeply, distil rules, prove the rules with a blind exam, then test the scripts on simulated human viewers who never see the rules.** The exam proves the style is recognisable. The viewer panel proves people would actually watch it. They are different tests, and passing the first did not mean passing the second.

## 1. Enhance the prompt, then plan

The request was short: study five old masters "very very deeply", run tests with modern stories, and come back. Before any agent ran, we rewrote that request into an **enhanced prompt** that fixed the deliverable for each master:

1. **Sources:** primary texts (public-domain translations; the Arabic originals for the two Arabic works) and the main scholarship, each cited with a link or edition. For example: Parry/Lord oral-formula theory and Auerbach's "Odysseus' Scar" for Homer; Mahdi, Irwin and Todorov for the Nights; Perry's collection and Phaedrus for Aesop; the Panchatantra roots, Ibn al-Muqaffa's own preface, de Blois and Kilito for Kalila wa Dimna; Bradley and the five-act build for Shakespeare.
2. **Style DNA:** opening move, hook, structure and pacing, character building, voice and rhythm, signature devices, how tension rises, how the meaning lands, the ending, the relation to the audience, and what the style never does.
3. **Close reading:** 3 short passages (quotes under 15 words), analysed move by move.
4. **Rules:** 12–15 rules a writer can apply, plus 5 anti-rules (what breaks the style) and 5 common fake imitations.
5. **Short-video translation:** how each rule maps to a 15–60 s talking video, and what to drop at that length.
6. **Tests on modern stories:** the same 4 seeds for every master (a groom whose wedding oud smells wrong; a home baker whose product photos look cheap; a grandfather who learns one phone trick; one real news story the agent picks). Each test = a 45 s script, a short shot list, and a self-score against the rules with line numbers.
7. **Exam:** a pastiche paragraph in English, and a "fake test": rewrite a seed in the WRONG style and show how the rules catch it.

It also fixed the pass bar in advance: a separate judge gets all 20 test scripts shuffled and unlabelled, and must name the master for each. **Pass = at least 18/20, and every master at least 3/4.**

A second enhanced prompt then planned the skill set itself. The request named three parts (an analyzer, a standalone skill per master, a human reviewer). The plan added, and marked as additions for approval: a dialect editor, a rules check inside the reviewer, a shot-list handoff, a learning log, mix mode (one borrowed move, off by default because mixes were untested), and two-option mode for big posts. All were approved.

**Lesson:** writing the pass bar before the work stopped us from moving the goalposts later.

## 2. A deep research bible per master

One agent per master wrote a "style bible" from top references, following the structure above. The cleaned bibles are in `research/`:

- `research/1-homer.md`
- `research/2-scheherazade.md`
- `research/3-aesop.md`
- `research/4-ibn-almuqaffa.md`
- `research/5-shakespeare.md`

Each one carries its source list. Long quotations from modern copyrighted translations were paraphrased for this public version.

## 3. Rules distilled into each skill

Each bible's rules, anti-rules, fake imitations, time maps (15 / 30 / 45 / 60 s) and best test became one standalone skill (`skills/storyteller-<master>/SKILL.md`), with:

- a signature lines bank,
- one "lendable move" for mix mode (and a list of moves it must never lend),
- writing steps,
- a self-check proof list that cites line numbers for each rule hit,
- one model script.

The skills keep only what a writer needs at runtime. The bible stays the optional depth.

## 4. Blind exams

### Exam 1 (judge: `exam-judge`, 20 shuffled scripts S01–S20)

The judge used only the 20 unlabelled files and its own knowledge of the five traditions. It did not open any bible or the key.

- **Result: 20/20 correct**, checked against the key. Confidence 5/5 on 17 files and 4/5 on three (S01, S06, S17).
- **But two of those were settled by the grid**, not by the writing: S01 (Shakespeare) and S06 (Aesop) were the only open cell left for their master. The judge called S01 "the weakest of the four" (no verse couplet, and the nephew states the moral, which feels like Aesop). It called S06 a generic story that "could be any brand ad".
- Other problems the judge found:
  - The Scheherazade set had no on-screen tip card at all; the tip lived only in speech.
  - One Homer script put an invented quote in a real coach's mouth, with lip-sync, which broke our own "nobody real speaks" rule.
  - Several tip cards did not match the spoken tip, or gave advice only a football fan could use.
  - Dialect slips: formal (Fusha) ordinals for minutes, a gender error, an Egyptian/Levantine phrase in a then-Saudi script.

We fixed the weak scripts and the rules behind them, then ran a second exam.

### Exam 2 (judge: `exam2-judge`, 20 reshuffled scripts T01–T20)

This time the judge judged each file alone first and used the grid only afterwards.

- **Result: 20/20 correct, and the grid changed no first pick.**
- Confidence 5/5 on 14 files, 4/5 on 5, and 3/5 on one: T05, an Aesop script the judge called the thinnest ("no animal, could pass as a generic modern anecdote").
- Remaining weak spots it named:
  - one Shakespeare script drifting toward an Aesop moral,
  - a Shakespeare ending "more sitcom than Shakespeare",
  - two bare Aesop scripts told apart from Shakespeare only by the absence of asides,
  - small dialect errors (number agreement, a likely wrong word, a hunter who should be a diver).

**What the exams prove:** the five styles are distinct and recognisable from the text alone. **What they do not prove:** that anyone would watch the videos. That is the next test.

## 5. A fresh-agent human reviewer panel

The reviewer (`skills/storyteller-human-reviewer/SKILL.md`) is always a **fresh agent**. It sees only the script, the tip card, the length and the platform. It never sees the brief, the master's name or the writer's self-scores, so it judges like a stranger scrolling.

It reads the script as **6 viewer personas** for the target market: a busy brand owner who hates being sold to, a traditional older shop owner, a 22-year-old who is bored in 2 seconds, a practical parent running a home business, a comedy scroller, and an elegance and gift buyer. For each persona it scores stop (yes/no, which line), understand, feel, value, boredom (with the line where they would swipe) and share.

**Pass thresholds** (set before the tests):

- at least 4 of 6 viewers stop,
- average value ≥ 3.5,
- average boredom ≤ 2,
- no red flag in the human-truth check (fake-sounding, preachy, culturally off),
- every house rule true.

On FAIL, the reviewer's line notes ("L<n>: problem → concrete fix", max 8) go back to the master for a rewrite, up to 2 rounds (we allowed 3 in the first tests).

## 6. What the end-to-end tests taught us

We ran 4 real requests through the whole chain: analyzer, master, dialect editor, fresh reviewer, rewrites.

| Request | Master | Result |
|---|---|---|
| Series part 1 (mix mode) | Ibn al-Muqaffa' + Scheherazade's clock cut | R1 FAIL → **R2 PASS**: 4/6, value 3.67, boredom 2.0 |
| 30 s ad for a fashion service | Homer (vs Ibn al-Muqaffa') | Homer R1 FAIL → **R2 PASS**: 4/6, 3.5, 2.0. The Ibn al-Muqaffa' option failed 3 rounds. |
| Phone-tip video, 3 steps | Ibn al-Muqaffa' (R1), then Aesop | FAIL after 3 rounds; near pass at 5/6, 3.5, 2.33 |
| Oud post, talking version | Shakespeare (vs Ibn al-Muqaffa') | FAIL after 3 rounds; near pass at 5/6, 3.83, 2.17. Ibn al-Muqaffa' also failed 3 rounds. |

**Two of four passed, and both passes were thin.** Every threshold was met with little or no margin.

**The short-video laws came from these reviews.** Scripts that passed the blind exam as perfect examples of a style still bored the panel. The reviewer notes kept repeating the same problems, and each repeated problem became a law in the conductor (`skills/storyteller/SKILL.md`). The links we can trace in the notes:

- **Law 1, punch first:** the phone-tip and series scripts opened with a character asking for a proverb (Ibn al-Muqaffa's classic «اضرب لي مثل», "give me a parable"). The young viewer swiped at once, and the reviewer called it "a writer's line".
- **Law 2, one inner tale:** the first series draft stacked three stories. The reviewer wrote that viewers "lose the thread".
- **Law 3, the tip by about 60%:** in the first phone-tip draft a detour pushed the tip to 0:26, more than half the video.
- **Law 4, count every word:** the first series draft had about 150 spoken words in 45 s (about 3.4 words per second); the fashion ad ran over 3 words per second at both ends.
- **Law 5, one moral:** the first oud draft spoke a second takeaway near the end, which blurred the one-takeaway rule.
- **Law 6, a laugh before the end:** in several drafts the comedy-scroller persona "never gets a smile".
- **Law 11, audience family codes:** the first Homer ad put an unrelated man at a woman's door, a red flag for a Saudi family audience. Homer's guest-ritual move now has to follow the audience's codes.

**Other lessons:**

- **The analyzer over-picked one master.** Ibn al-Muqaffa' fits "advice for shop owners" on paper. He was picked 3 times out of 3 and failed the reviewer 2 times out of 2 (slow hook, stacked tales). The analyzer now has a variety rule and must score all five masters before it picks.
- **Rules are a menu, not a quota (law 8).** Writers stuffed rules into 45 s to pass their own self-check. The exam rewarded that; viewers did not.
- **A tooling bug:** the reviewer input was once built with a case-insensitive word filter, and it silently cut real script lines («ground» matched «round»). The writer now saves the reviewer input itself and checks the line count.
- **The dialect changed mid-project.** The bibles and both exams used Saudi dialect. Then the language rule changed to Palestinian Levantine. The early tests now count as structure proof only, and a separate dialect editor became step 3. That editor is now the example voice module (`skills/storyteller-voice-palestinian/`). The masters are language-agnostic, and other voice modules can be added (`.claude/skills/storyteller/VOICE-MODULES.md`).
- **Polish after a pass was not re-reviewed.** Both passing scripts got small fixes after the PASS (see `examples/`). We have not re-run the panel on those polished versions.
- **The panel is simulated.** Six personas played by one model are a cheap filter, not real audience data. Real post results (views, saves) go into the learning log when we have them. As of this writing we have none.

## 7. The learning log

Every script gets one line in `skills/storyteller/log.md`: date, request, kind, master (and borrowed move), reviewer scores per round, rounds, the requester's verdict, post id, and later the views and saves. The analyzer reads the log before it picks a master: it prefers masters that worked for the same kind of request and avoids repeating one that failed. The log ships with our four test rows as a worked example.

## What we would do differently

- Put the simulated-viewer panel in from the start, next to the blind exam, instead of after it. Style accuracy and watchability pull in different directions at 30 s.
- Write the short-video laws first and let each master's rules bend to them.
- Re-review every polished script, even after a pass.
- Validate the panel against real post data before trusting its thresholds.

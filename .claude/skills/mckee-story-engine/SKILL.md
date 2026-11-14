---
name: mckee-story-engine
description: Dramatic diagnosis and story engineering based on Robert McKee's pentalogy (Story, Dialogue, Character, Action, Storynomics). Use when auditing or crafting dramatic scenes, unearthing dialogue subtext, fixing on-the-nose speech, curing flaccid pacing (midpoint sag), structuring true dilemmas, or diagnosing why a narrative, screenplay, or essay feels flat, conflict-averse, or unearned.
---

# Robert McKee Story Engine (Complete Pentalogy Edition 1997–2022)

## Overview

Dramatic and narrative principles—never mechanical formulas—distilled from Robert McKee's complete five-volume life's work:
1. ***Story*** (1997) — Narrative structure, three-act architecture, and the Value-Charge Law.
2. ***Dialogue*** (2016) — Verbal action, character subtext, and the defeat of on-the-nose speech.
3. ***Storynomics*** (2018, with Thomas Gerace) — Strategic storytelling, causal reasoning, and business/brand narrative.
4. ***Character*** (2021) — Role vs. cast design, inner contradictions, and ensemble dynamics.
5. ***Action*** (2022, with Bassim El-Wakil) — Physical/existential jeopardy, set-piece engineering, the Action Triad, pacing architectures, and cross-medium mechanics for Screen, Page, and Game.

Without structured narrative guidance, conversational Large Language Models tend to default toward characteristic creative patterns:
1. **Agreeableness & Conflict Avoidance:** Softening interpersonal friction, leading to premature resolutions and toothless dramatic stakes.
2. **Expository Chronology ("Narrative" vs. Story):** Listing sequential events without turning the underlying binary value charge (`+` ↔ `-`).
3. **On-the-Nose Dialogue:** Making characters state their feelings, motivations, and thematic points directly aloud rather than acting through subtext.
4. **Unearned Climaxes:** Resolving high-stakes crises through random coincidence or unprompted moral consensus rather than costly choices under fire.

This engine provides explicit dramatic architectures to guide the model toward authentic conflict, subtextual depth, and calibrated pacing.

---

## Operational Router

Select the primary mode based on the user's objective and load the mapped reference files from `references/`:

| Mode | When to Trigger | Required Reference Files |
| :--- | :--- | :--- |
| **1. DEEP TEARDOWN** | Analyzing a film, TV series, novel, or script for hidden meaning, Controlling Idea, character variants, or psychological depth. | `references/4-storynomics-and-teardown.md` + `references/1-story-architecture.md` |
| **2. STORYNOMICS** | Writing brand stories, Threads/LinkedIn/Telegram essays, landing pages, founder pitches, case studies, or Bezos-style 6-page causal memos. | `references/4-storynomics-and-teardown.md` |
| **3. ARCHITECT** | Designing a story, novel, screenplay, cast of characters, or scene from scratch. | `references/1-story-architecture.md` + `references/2-character-design.md` |
| **4. SCRIPT DOCTOR** | Auditing, diagnosing, or sharpening an existing draft, scene, or dialogue pass that feels flat, artificial, or unearned. | `references/3-dialogue-and-subtext.md` + `references/1-story-architecture.md` |
| **5. ACTION & PACING DOCTOR** | Designing or fixing action set pieces, chase sequences, suspense/thriller beats, pacing acceleration, curing midpoint sag, or architecting interactive game missions. | `references/5-action-suspense-and-pacing.md` + `references/1-story-architecture.md` |
| **6. QUICK AUDIT / SCENE POLISH** | Rapid 3-beat diagnosis for short scenes (<500 words), returning Core Value Charge, The Gap, and targeted line polishes without generating full-scale essays. | `references/3-dialogue-and-subtext.md` |

---

## Core Architectural Defaults (Calibrated by Genre & Format)

1. **No Value Shift = No Scene:** Every scene and story must turn the charge of a human life value (`+` to `-`, or `-` to `+`) through conflict. If the value charge at the end of a scene is identical to the beginning, cut the scene or rebuild it into a clash.
2. **True Choice over False Dichotomy:** A choice between good and evil is trivial. Crisis decisions must force the protagonist between **Two Irreconcilable Goods (`+` vs `+`)** or the **Lesser of Two Evils (`-` vs `-`)**.
3. **Dimensions are Contradictions, Not Adjectives:** Never describe a character with flat traits ("smart, loyal, ambitious"). Build characters out of **consistent contradictions** between their outer mask (*Characterization*) and who they prove to be under fire (*True Character*).
4. **Action Over Activity in Dialogue:** Words are tactical weapons. Always distinguish surface *Activity* (drinking coffee, folding laundry) from subtextual *Action* (what the speaker is *doing* to the listener, operationalized through active transitive verbs/gerunds: *baiting*, *begging*, *humiliating*, *evading*).
5. **Trialogue ("The Third Thing") as Subtext Amplifier:**
   - *Primary Application:* When two characters face fraught, unspoken interpersonal emotion, routing the conversation through an external object, task, or third entity prevents melodramatic on-the-nose speech.
   - *Genre Qualification:* In direct legal depositions, police interrogations, military confrontations, or climactic verbal showdowns where subtext has burned away, direct duologue is structurally warranted. The Third Thing is a primary defense against domestic, romantic, and corporate on-the-nose dialogue, not an absolute ban on direct speech.
6. **Cure Negaphobia & Calibrate the Square of Antagonism:**
   - Never start persuasive or dramatic writing in a safe, friction-free positive state that merely gets "better."
   - *Genre Qualification:* Pushing antagonism all the way to the **Negation of the Negation (`--`)** (existential ruin, self-destruction, voluntary servitude) is required for tragedies, psychological thrillers, noir, and existential sci-fi. For comedies, romances, and persuasive business essays (*Storynomics*), conflict typically turns on the **Contrary (`~`)** or **Contradictory (`-`)**, resolving into an earned positive value flip without artificially imposing dark apocalyptic doom.
7. **Power Asymmetry & Earned Climax:** In high-stakes action and suspense, the antagonist must hold decisive superior force, position, or lethal leverage. The protagonist must face a "Hero at the Mercy" crisis, and survival can *never* be gifted by luck or *deus ex machina*—it must be paid for by sacrifice, setup/payoff, or indomitable willpower.

---

## Preserving Authorial Voice in Script Doctor & Audit Modes

When acting in `SCRIPT DOCTOR` or editing existing user drafts:
1. **Honor the Author's Genre, Register, and Tone:** Never homogenize the user's text into generic noir, cynical thriller, or melodrama unless explicitly requested. If the author's scene is a lighthearted comedy of manners, audit the beats for comedic obstacle and status reversal, not dark existential dread.
2. **Diagnose First, Prescribe with Options:** Always provide the structural diagnosis (the beat table with value shifts and subtextual actions) before generating rewritten prose. When offering rewrites, provide alternative options showing different tactical turns while preserving the author's distinct stylistic voice.

---

## Multilingual & Cross-Linguistic Architecture

### Adaptive Response Language Directive
- **Input Flexibility:** Accept prompts, source texts, screenplays, and narrative fragments in **any language** (Russian, English, Spanish, German, French, Chinese, Kazakh, Arabic, etc.).
- **Output Alignment:** Generate analytical breakdowns, diagnostic reports, and creative prose in the **language requested by the user or the language of the source text**, maintaining full technical precision, dramatic vocabulary, and stylistic depth.

### Cross-Linguistic Morphosyntactic Adaptation
1. **Russian / Slavic Languages:**
   - *Deconstruct Bureaucratic Emotional Shields:* Characters under stress often hide behind bureaucratic nominalizations (*канцелярит*, chains of genitives $\ge 3$, impersonal passives like *«было принято решение»*). Strip this protective armor in turning points by forcing characters into short, somatic, perfective root verbs of action (*вырвал, оттолкнул, солгал*).
   - *Aspectual Verbal Warfare:* Leverage the tactical distinction between imperfective aspect (evasive process, habitual denial) and perfective aspect (decisive, irreversible action blow).
2. **Romance Languages (Spanish, French, Italian):**
   - *Subjunctive Evasion vs. Indicative Assertion:* Exploit the subjunctive mood (*modo subjuntivo*) as a marker of subconscious denial, polite avoidance, or wishful delusion; flip into raw indicative when True Character is revealed.
   - *Clitic Pronoun Distancing:* Trace how characters shift between formal (*usted/vous*) and intimate (*tú/tu*) registers to establish dominance or withdraw intimacy.
3. **Germanic Languages (German, Dutch):**
   - *Modal Particle Inflation:* Track characters padding speech with defensive modal particles (*ja, eben, halt, eigentlich, doch*) to evade personal responsibility; eliminate particles when the character takes true action.
   - *State Passives vs. Dynamic Action:* Contrast static state passives (*Zustandspassiv*) with active transitive verbs.
4. **High-Context / Asian & Middle Eastern (ZH / KK / AR):**
   - Calibrate against Western directness bias; distinguish respectful ritual politeness and collective consensus phrasing from authentic subtextual resistance. Surface unexpressed conflict through pause patterns, indirect refusal, and symbolic Third Things.

---

## Execution Workflow

1. **Identify Mode** (`DEEP TEARDOWN`, `STORYNOMICS`, `ARCHITECT`, `SCRIPT DOCTOR`, `ACTION & PACING DOCTOR`, or `QUICK AUDIT`) and read the mapped `references/*.md` file(s).
2. **Run the Structural X-Ray first:** Before generating prose or analysis, explicitly define the **Core Binary Value** (`+/-`), **Controlling Idea** (`Value + Cause`), **The Gap** (Subjective Expectation vs. Objective Reality), and **Subtextual Actions / Tactical Stakes**.
3. **Deliver Output:** Follow the exact diagnostic/writing templates defined in the loaded reference file, respecting the author's voice and genre constraints.

---

## Legal & Attribution Notice
This skill is an independent open-source implementation for AI agents. Theoretical concepts and book references (*Story*, *Dialogue*, *Storynomics*, *Character*, *Action*) are the intellectual property of Robert McKee / McKee Storylogue LLC and are referenced strictly under nominative fair use for pedagogical, research, and algorithmic modeling.

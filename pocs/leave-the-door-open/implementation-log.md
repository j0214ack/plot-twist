# Leave the Door Open — Implementation Log

Status: Living engineering and validation journal

## Append-only policy

Effective after ADR 0015 on 2026-07-16, this file is append-only.

- Do not rewrite, reorder, or delete historical entries, including conclusions
  later shown to be wrong.
- Append a correction or superseding entry that links back to the earlier
  heading and explains what new evidence changed.
- The main/root agent is the only writer. Parallel sub-agents return structured
  entry material; root appends it after review so concurrent writers cannot
  corrupt ordering or claim unintegrated work.
- Editing this policy or the entry template requires a new appended process
  decision; it does not authorize retroactive cleanup.

## Purpose

This log preserves how a chapter was actually designed, implemented, and
validated so later chapters can reuse the working method without reconstructing
it from chat history, commits, ADRs, or raw model logs.

It does not replace:

- accepted product and authority decisions in `decisions/`;
- behavior requirements in specifications;
- automated tests as runtime evidence;
- raw JSONL and curated reports under `playtests/`;
- human playtests as evidence of difficulty, pacing, or fun.

## Entry contract

Append an entry after each meaningful design probe, causal-beat implementation,
prompt change, integration run, or human/Agent playtest. Each entry records:

1. **Objective and scope** — what became more true, and what remained outside
   this step;
2. **Authorization** — exact spec sections and ADRs permitting the work;
3. **Artifacts changed** — specs, runtime modules, tests, prompts, fixtures,
   logs, and reports;
4. **Method** — paper probe, semantic checkpoint, Red/Green/Refactor, full
   integration, or human playtest;
5. **Evidence** — failing test observed, passing tests, build, live trajectory,
   and qualitative observations;
6. **Friction and surprises** — failures, repetition, latency, cost, misleading
   assumptions, or presentation defects;
7. **Reusable lesson** — what Chapter 2 or 3 should repeat or avoid;
8. **Next boundary** — the next unproven requirement, without redefining the
   chapter goal around completed work.

Do not turn this into a chronological dump of every command. Prefer the
smallest entry that would let a future implementer reproduce the reasoning and
choose the next correct validation layer.

---

## 2026-07-16 — Day 0 tutorial and three-Action integration baseline

### Objective and scope

Establish a real tutorial success grammar and prove that an uninformed Agent can
complete the currently implemented three-Action terminal path. This was an
integration witness, not a complete main-story chapter.

### Authorization

- ADR 0009: low-stakes authored prologue;
- ADR 0010: authored hints and bounded generated performance;
- ADR 0011: the first door gap comes from an authored Action;
- `local-playtest.md` LDO-LOCAL-008 through LDO-LOCAL-012.

### Artifacts and method

- Added the Three Minutes clock tutorial, fully closed door provenance,
  generated Performance Director staging, layered World/UI rendering, and
  explicit defer/refuse feedback.
- Ran two diagnostic black-box sessions, fixed observed regressions through
  traced TDD, then ran a fresh `fork_turns=none` Agent against live
  `gpt-5.6-luna low` roles.
- Curated result: `playtests/007-agent-full-slice-live-blackbox.md`.
- Raw runtime log:
  `playtest-logs/ldo-agent-clock-fresh-20260716-a.jsonl`.

### Evidence

- Fresh Agent completed:
  `interact_with_living_room_clock → open_door_a_crack → remain_at_threshold`.
- 22 player inputs: 14 dialogue turns, 5 numbered selections, 3 resumes.
- Clock and door each produced one understandable willingness defer before
  acceptance.
- World ended at 09:13 with three completed Actions, accurate-clock and
  slightly-open-door Evidence active, and both Evidence records observed by the
  wife.
- At the end of the phase: 72 test files / 215 tests passed; build passed with
  the existing bundle-size warning.

### Friction and surprises

- A successful integration slice was easy to misread as a complete chapter.
- Compressed 07:57–09:13 timing is appropriate only for tutorial/integration.
- Clock Persona reintroduced a negated symbolic frame: `stand for anything
  more`.
- Door dialogue briefly circled around erasure and unknown intent.
- Positive intention confirmation was clear but system-like.
- Generated clock staging switched from `he/his` to `they/their`.
- The full run used 37 role calls and 431,786 recorded input tokens, making it
  unsuitable for isolated prompt iteration.

### Reusable lesson

- Use full uninformed-Agent runs to prove integration, not to tune one line.
- Preserve player-visible screens and qualitative `INPUT + OBSERVATION` every
  turn.
- Branch from visible checkpoints for player comprehension and semantic
  checkpoints for Persona/Judge behavior.
- A tutorial must demonstrate success, but its turn count and time span must
  not become the main-story pacing model.

### Next boundary

Create stable, distinct Character Cores and design a real multi-day Chapter 1
whose ending creates a reciprocal trace rather than stopping at the tutorial's
threshold demonstration.

---

## 2026-07-16 — Chapter authoring and characterization method accepted

### Objective and scope

Define how Chapter 1 and later chapters will be authored and decomposed before
runtime work begins. No Chapter 1 behavior was implemented in this entry.

### Authorization

- ADR 0012: author a whole chapter, implement one causal beat at a time;
- ADR 0013: stable Character Core separated from MindState and scene context;
- ADR 0014: bridge tutorial into directed observation rather than a solution
  quest.

### Artifacts and method

- Added one-page draft cores:
  - `characters/husband.md`;
  - `characters/wife.md`.
- Added `characters/label-blind-validation.md` with a shared neutral towel
  fixture that cannot leak current story Actions.
- Separated player-facing chapter scope from implementation scope:
  - chapter = narrative accumulation and closing World state;
  - causal beat = routine clue through psychological movement, fixed Action,
    World consequence, and observation.
- Defined the post-tutorial need for explicit available verbs, a visible
  narrative question, character focus, and continuation without an intention.

### Evidence

- Source review confirmed that current Husband/Wife packets share the same
  generic `surface_role` and differ mainly by scene barriers.
- Playtest 007 replies showed convergent global cadence (`I can't`, `I only
  know`, `I can consider`), authorizing a characterization fix before Chapter
  1 implementation.
- Label-blind Character Core probe is not yet run; the profiles remain drafts.

### Friction and surprises

- The post-tutorial motivation question exposed a runtime contract gap:
  main-story pacing permits no-intention days, but the tutorial terminal permits
  `/resume` only after an intention.
- Automatically focusing a character at every pause would leave the player
  without the observation and focus agency described by the original concept.

### Reusable lesson

- Validate `What can I do next?` and `What am I curious about?` separately from
  eventual chapter solvability.
- Distinguish character through attention, reasoning, resistance, and agency;
  prose mannerisms alone create caricatures.
- An uneventful day still needs a new routine cue, grounded distinction, or
  explicit closure. Repetition is not slow pacing.

### Next boundary

Run the label-blind Character Core probe, revise the drafts if necessary, then
validate the Chapter 1 transition and its first no-intention continuation before
locking the full multi-day Action/Evidence graph.

---

## 2026-07-16 — Character Core label-blind probe 1

### Objective and scope

Test whether the two draft cores produce distinguishable reasoning in the same
neutral scene without names, roles, pronouns, current plot barriers, or Action
knowledge.

### Authorization

- ADR 0013;
- `characters/label-blind-validation.md`.

### Method and evidence

- Two fresh isolated generators each received one core and the same three-turn
  folded-towel fixture.
- A third fresh evaluator received six shuffled replies and both anonymous
  core descriptions.
- The evaluator classified five of six source labels correctly and based most
  decisions on consequence reasoning versus permission/ambiguity reasoning.
- No sample invented biography, ownership, material sensation, or a completed
  action outcome.

### Friction and surprises

- The evaluator assigned the Husband's final sample to the Wife because the
  reply protected the towel's `placement and meaning`, allowing permission
  logic to override its bounded-step wording.
- Several replies called the current placement a known `change` or said the
  towel had been `left`, although the fixture established neither a prior
  observed state nor intentional placement.
- The original third player turn—`leave its meaning alone`—primed both profiles
  toward the Wife's defining concern and weakened the diagnostic.

### Reusable lesson

- A blind fixture must not contain the distinction it is trying to detect.
- Character validation and grounding validation should be scored separately.
- Correct labels are insufficient when a reply reaches them through signature
  vocabulary rather than stable reasoning.

### Next boundary

Run a fresh second probe with neutral player wording, explicit no-prior-state
grounding, and a Husband core that treats unknown meaning as unavailable input
rather than the object of protection.

---

## 2026-07-16 — Character Core label-blind probe 2

### Objective and scope

Re-run the full isolated diagnostic after repairing the biased fixture and the
overlapping Husband reasoning. This remains paper-level evidence; runtime Luna
packets and human voice quality are not yet proven.

### Method and evidence

- Generated six completely new samples using two fresh isolated core-specific
  agents.
- A new blind evaluator classified all six correctly with 82–99 confidence.
- Stable cited distinctions were consequence/endpoint reasoning for Husband and
  permission/ambiguity reasoning for Wife.
- Full evidence is preserved in
  `characters/label-blind-runs/001-neutral-towel.md`.

### Friction and reusable lesson

- Diagnostic vocabulary such as `bound` and `permission` can make labels too
  easy without proving natural voice. Runtime validation must look for the same
  reasoning in less literal language.
- One shared behavior—careful observation—can belong to both people for
  different reasons. Do not eliminate useful overlap merely to maximize a
  classifier score.

### Next boundary

Treat both Character Cores as the Chapter 1 content baseline. Validate the
post-tutorial transition and first no-intention continuation while the complete
multi-day causal graph is authored in parallel.

---

## 2026-07-16 — Parallel causal-beat and append-only journal policy

### Objective and scope

Enable useful Sub-Agent concurrency for Chapter 1 and later chapters without
allowing shared-file races or disconnected story-state assumptions.

### Authorization

- ADR 0012 causal-beat workflow;
- ADR 0015 frozen beat contracts and integration ownership;
- explicit user approval to delegate causal beats and require append-only
  implementation history.

### Decision and reusable lesson

- Shared time, focus, conversation, Character Core, World types, and terminal
  lifecycle remain main-agent foundation work.
- Once each beat contract is frozen, agents may implement disjoint beat modules,
  tests, fixtures, or probes in parallel.
- Story integration remains ordered even when leaf production is concurrent.
- This journal is append-only and has one writer. Sub-agents return entry
  payloads; root records only reviewed evidence.

### Next boundary

Use parallel agents immediately for the three independent Chapter 1 paper
gates, then establish the shared runtime foundation before delegating beat
implementation.

---

## 2026-07-16 — Chapter 1 entry paper probes

### Objective and scope

Test the player's first operational minute after the tutorial before runtime
implementation: understand available verbs, choose a grounded focus, and
continue after partial progress with no intention.

### Authorization

- ADR 0014 directed observation;
- ADR 0015 parallel independent checkpoints;
- `chapter-1.md` LDO-CH1-001 through LDO-CH1-005 and LDO-CH1-013.

### Method and evidence

- Three fresh uninformed Agents received independent player-visible screens in
  parallel.
- Transition Agent chose to wait for routines, named focus/dialogue/resume
  controls, followed the hallway question, and detected no Action leak.
- First-routine Agent grounded `/focus husband` in his closer approach and
  recognized Wife focus as an equally valid alternative.
- No-intention Agent chose `/resume`, expected no scheduled Action and preserved
  partial movement, named a later routine question, and would continue another
  day.
- Curated evidence: `playtests/008-chapter-1-entry-paper-probes.md`.

### Friction and reusable lesson

- `focus` alone could sound like camera observation; UI should say it enters
  inner thoughts.
- A no-Possibility screen remains mildly dead-end-like even when persistence is
  explained. The next routine must visibly differ; text promising persistence
  is not sufficient evidence of progress.

### Next boundary

Begin shared Chapter runtime foundation through traced TDD: day/time transition,
player-selected focus, no-intention resume, daily conversation quota, and
Character Core packet delivery. Do not delegate causal-beat runtime edits until
these shared contracts are green.

---

## 2026-07-16 — Treat attentiveness as a content hypothesis, not a quota

### Objective and scope

Preserve room for routine and environmental details that make a player pause
or reconsider what they saw, without turning “interesting” into a mechanical
daily obligation.

### Authorization

- explicit user clarification that literary attention matters;
- explicit rejection of a rule requiring an interesting event every day;
- `chapter-1.md` Runtime verification boundary, which reserves motivational
  and prose-quality authority for human playtests.

### Decision and reusable lesson

- The causal routine list is not proof of an attentive reading experience.
- Some authored routines or bounded performance details may carry a concrete
  residue whose significance can change later.
- No quota, fixed cadence, required intensity, or deterministic pass/fail gate
  is introduced.
- Agent review may diagnose purely functional cues; human play remains the
  authority on whether their strength and frequency feel right.

### Next boundary

Keep the hypothesis visible while implementing the causal scaffold. Evaluate
actual rendered prose during integrated play rather than inflating World rules.

---

## 2026-07-16 — Chapter 1 next-morning routine foundation

### Objective and scope

Begin the shared multi-day World foundation with the smallest observable
Chapter 1 behavior: after the completed clock tutorial, the following morning
contains the two required contrasting hallway routines while the door remains
closed.

### Authorization

- `chapter-1.md` LDO-CH1-001 and LDO-CH1-003;
- ADR 0012's causal-beat TDD workflow.

### Red, Green, and evidence

- Red added a public World test for both Day 1 routine events and final NPC
  activities at absolute next-day times.
- The targeted test failed because the World retained the old same-morning
  hallway activities and had no cross-day routine schedule.
- Green added only the two semantic routine/activity IDs and their Day 1 08:10
  and 08:20 schedules.
- Targeted test passed; the complete `world.test.ts` suite passed 11/11.

### Next boundary

Migrate the old same-morning door beat to its authored Chapter Day 2 boundary
through a new failing test. Do not treat the newly scheduled causal routines as
the whole ambient-life system.

---

## 2026-07-16 — Replayable ambient routine selection

### Objective and scope

Clarify where the chapter's occasional ordinary texture and optional hints
come from without adding a daily novelty rule or giving an LLM plot authority.

### Authorization

- user direction that interest should arise from randomly selected routine
  actions plus performance;
- user clarification that ordinary routines may sometimes serve hints;
- user delegation to choose a reasonable bounded design;
- ADR 0016, which explicitly supersedes ADR 0010 Decision 4 only.

### Decision and reusable lesson

- Required causal routines remain fixed and guaranteed.
- Ambient slots use replayable chance to select one eligible authored routine
  or none; selected IDs and chance state are recordable.
- Ambient routines may carry optional safe HintBriefs, but no required clue can
  depend only on a random draw.
- Performance stages the already selected routine. It does not choose the
  routine, hint, Evidence, or durable outcome.
- There is no daily count, forced coverage, intensity curve, or literary score.
- Exact visual/text replay must reuse the recorded PerformancePlan rather than
  re-call the model.

### Alternatives checked

- Performance-only variation did not vary household behavior itself.
- A shuffle bag introduced implicit coverage cadence and extra lifecycle state.
- LLM routine selection collapsed hint pacing and semantic authority into the
  Performance Director.
- A read-only Sub-Agent critique independently recommended the same seeded
  eligible-catalog boundary and identified replay/observation failure cases.

### Next boundary

Finish the fixed Chapter day/phase foundation first. Then add the smallest
ambient selector test under LDO-CH1-014 before authoring a broad routine pool.

---

## 2026-07-16 — Shared Chapter 1 interaction foundation

### Objective and scope

Make the authored multi-day chapter usable through the same public World,
Controller, projection, and terminal capabilities as the tutorial before
closing later causal beats.

### Authorization

- `chapter-1.md` LDO-CH1-001 through LDO-CH1-007 and LDO-CH1-012;
- ADR 0012 through ADR 0015.

### Red, Green, and evidence

- Traced tests first established the tutorial-to-next-morning boundary,
  absolute Chapter day plus local time, both Day 1 routines before dialogue,
  player-selected Husband/Wife focus, and `/resume` without an intention.
- Conversation tests added one five-reply conversation per spouse per Chapter
  day, next-day quota/message reset, and persistence of validated MindState.
- Structured Persona tests now deliver stable Husband/Wife Character Cores in
  a separate packet section. Catalog terms, Action IDs, protected biography,
  and future results remain absent.
- Text projection now inserts explicit Chapter day headings while retaining
  renderer-independent World/UI layers.

### Friction and reusable lesson

- Time can advance correctly while the terminal adapter still dead-ends if its
  scenario routing retains old literal times. World chronology and adapter
  lifecycle require independent acceptance coverage.
- A day counter in `WorldView` is insufficient if the renderer never presents
  it; repeated `08:20` cues were ambiguous until the projected day boundary was
  tested as player-visible behavior.

### Next boundary

Close each fixed causal beat through the earliest five-day path, then test the
integrated terminal rather than inferring playability from World unit tests.

---

## 2026-07-16 — Five-day causal chapter closure

### Objective and scope

Implement and connect the complete authored sequence from the Day 2 closed
door handle through the Wife's one-hand-width window trace and neutral Chapter
1 completion.

### Authorization

- `chapter-1.md` LDO-CH1-008 through LDO-CH1-013;
- ADR 0011 first-gap provenance;
- ADR 0012 whole-chapter causal graph;
- the accepted canonical authored schedule in `chapter-1.md`.

### Red, Green, and evidence

- Successive failing public-World tests established: Day 2 door Action and
  Evidence; later-same-day Wife observation; next-day threshold story state;
  later-day room entry without object Evidence; and final window Evidence with
  deferred Husband observation.
- `open_room_window` now owns the sole window mutation, activates
  `room_window_is_open`, marks Chapter 1 complete, and leaves `observedBy`
  empty.
- A regression test prevents the same Action intention from being queued more
  than once before resume.
- Safe projection now exposes the room window only after the room is revealed
  and maps window Evidence exhaustively instead of falling through to the door
  cue.
- A deterministic terminal acceptance traverses tutorial, Day 1, door,
  observation, threshold, entry, and window, ending on the exact neutral
  completion lines.

### Friction and reusable lesson

- “One step short” needed a spatial referent: the accepted meaning is one step
  short of crossing while already immediately outside the threshold.
- Observing the first gap on the next calendar day would turn the accepted
  five-day earliest path into six days. The fixed graph therefore places that
  observation later on Day 2 and reserves the threshold Action for Day 3.
- Final Evidence required an exhaustive projector switch. Treating every
  non-clock Evidence as door Evidence was safe only while the catalog had two
  objects.

### Next boundary

Remove the superseded same-day reference path, exercise no-intention repeats,
and obtain a fresh uninformed Agent completion through the real structured
Persona/Judge adapters.

---

## 2026-07-16 — Causal routines use the bounded Performance Director

### Objective and scope

Connect the seven guaranteed Chapter routines to their authored HintBrief and
performance envelopes without giving generated prose semantic authority.

### Authorization

- `chapter-1.md` Routine and HintBrief progression plus LDO-CH1-003,
  LDO-CH1-012, and LDO-CH1-014;
- ADR 0010 bounded performance;
- ADR 0016 fixed causal routines plus replayable ambient chance.

### Red, Green, and evidence

- A failing orchestration test first proved that fixed causal routine events
  produced no Performance request despite the authored catalog.
- Controller orchestration now supplies the selected routine variant, current
  safe scene, required HintBrief, and restore-only envelope to the Director.
- Generated causal staging replaces its neutral fallback; model failure still
  leaves the already-executed semantic routine available to the renderer.
- Ambient routines retain their separate optional-hint path and cannot change
  the fixed chapter graph.

### Friction and reusable lesson

- Authoring a routine catalog is not integration. Until the Controller routed
  its events through that catalog, duplicated semantics in World and fallback
  prose could drift unnoticed.
- Generated staging must replace, not accompany, the neutral sentence for the
  same semantic behavior; otherwise literary variation appears as duplicate
  action rather than realization.

### Next boundary

Use the integrated live playtest to judge repetition, information gain, and
attention-holding prose qualitatively. Do not convert those observations into
an automatic literary score or cadence rule.

---

## 2026-07-16 — Black-box phase-authority regressions

### Objective and scope

Use fresh uninformed Agent runs as integration diagnostics, stopping a run as
soon as player-visible prose proves that Persona context crossed a semantic
phase boundary.

### Authorization

- `chapter-1.md` LDO-CH1-005, LDO-CH1-007, LDO-CH1-008, and LDO-CH1-012;
- ADR 0001 catalog-blind Persona authority;
- ADR 0012 fresh full-chapter integration run.

### Red, Green, and evidence

- Fresh run `ldo-agent-chapter1-fresh-20260716` was stopped when the Day 1
  turnback scene claimed the Husband's hand was already on the handle.
  Regression tests now select phase-local scene packets from the actual
  `visibleActivityId`; no packet receives a future phase's physical facts.
- Fresh run `ldo-agent-chapter1-fresh2-20260716` was stopped when tutorial
  clock pressure survived into Chapter 1 and later day changes reset validated
  MindState. Regression tests now initialize Chapter 1 psychology once, clear
  tutorial-only reframes at that boundary, and preserve later MindState across
  calendar changes.
- A separate regression keeps the accepted Persona reply available to Action
  performance after a day-boundary message reset, so player-owned motifs do
  not disappear between willingness and execution.

### Friction and reusable lesson

- A valid fixed Action graph does not prevent a Persona from narrating a
  future physical phase when scene packets are selected by character alone.
- Daily conversation cleanup and chapter psychology initialization are
  different lifecycles. Sharing a reset path silently erases the multi-day
  trajectory the chapter is designed to test.

### Next boundary

Restart from a clean process after each authority fix. Diagnostic runs stopped
for invalid context are evidence for regression tests, not evidence that the
chapter is reachable.

---

## 2026-07-16 — Progress-sensitive retries and tutorial focus containment

### Objective and scope

Make unsuccessful later-day repeats visibly respond to validated progress and
keep the single-focus clock tutorial from exposing main-story psychology.

### Authorization

- `chapter-1.md` deterministic-path retry contract and LDO-CH1-005;
- ADR 0010 Decisions 2 through 7;
- `tutorial-prologue.md` bounded Persona state;
- `local-playtest.md` LDO-LOCAL-010.

### Red, Green, and evidence

- Catalog and public-World tests first failed because all four unresolved
  decision phases replayed one static RoutineVariant after psychological
  progress.
- Handle, threshold, entry, and window phases now select one fixed progressed
  retry variant from `faintly_imagined` or `surfaced` Action awareness. Each
  retains the same actor, location, activity, restore-only closure, and causal
  prerequisites while supplying a distinct player-safe HintBrief.
- Controller acceptance proves the selected retry variant and HintBrief reach
  the bounded Performance Director without opening the door or activating
  downstream Evidence.
- Fresh run `ldo-agent-chapter1-fresh3-20260716` was stopped when `/focus wife`
  during the clock tutorial exposed room-oriented Wife psychology. A
  regression now makes Husband the tutorial's sole selectable Persona at both
  Controller and terminal boundaries. A premature number receives a concrete
  clock-focused recovery cue instead of a bare unavailable-option error.

### Friction and reusable lesson

- "Preserve partial progress" is not player-visible unless the next authored
  routine can render a changed stopping point.
- A renderer command that is harmless in Chapter 1 can violate Persona
  authority in the tutorial. Focus eligibility belongs to the semantic phase,
  not merely to the fact that the World is paused.

### Next boundary

Run another clean uninformed Agent through tutorial and Chapter 1. Only after
that run and the full suite are green should the browser adapter be deployed.

---

## 2026-07-16 — Judge-owned authored psychological atoms

### Objective and scope

Replace Persona-authored free-text psychology patches with a bounded durable
state protocol that can represent removed resistance and adopted
interpretations without permitting arbitrary runtime beliefs.

### Authorization

- ADR 0017 Decisions 1 through 11;
- `local-playtest.md` LDO-LOCAL-013;
- `chapter-1.md` LDO-CH1-015.

### Red, Green, and evidence

- Pure transition tests first rejected unknown atom IDs, stale `from` values,
  cross-kind statuses, regressions, and player-only support while proving that
  rejected and resolved atoms remain recorded.
- Controller acceptance first failed when the transition phase was absent; it
  now requires the phase after every Persona reply, applies only validated
  Judge transitions, and supplies the resulting state to awareness.
- Persona v7 returns only speech and conversation closure. Action Judge v4
  separates action-blind MindState transition, fixed-catalog awareness, and
  player-selected willingness. Both terminal and browser configuration are
  tested against those exact prompt versions.
- Chapter atom tests first exposed future reframes at Chapter start. Initial
  states now contain only Day 1 regions; handle, visible gap, threshold, entry,
  and window moments idempotently reveal only their authored phase atoms while
  preserving all earlier statuses.
- The complete repository suite passed with 82 test files and 285 tests before
  the fresh black-box run began.

### Friction and reusable lesson

- A free-text `currentBarrier` cannot distinguish unresolved pressure from a
  pressure that has genuinely ended, so a Persona can accept the player's idea
  and immediately manufacture a replacement obstacle.
- A finite catalog need not be purely subtractive: authored reframes represent
  constructive new understanding while keeping state identity and chapter
  closure controllable.
- Finite does not mean globally visible. Supplying every later reframe at
  Chapter start leaks the shape of future solutions even when Action IDs remain
  hidden; atom availability therefore follows deterministic World phases.

### Next boundary

Require a fresh uninformed Agent to complete the live Persona v7 / Judge v4
chapter, then append the result and deploy the already-tested thin browser
adapter.

---

## 2026-07-16 — Preserve causal pauses and cross-Persona knowledge

### Objective and scope

Turn two fresh black-box failures into bounded regressions without adding a
natural-language parser or granting the renderer semantic authority.

### Authorization

- ADR 0010 Decisions 11 through 14 and Chapter 1 LDO-CH1-003;
- ADR 0001 Decisions 2 and 6 and Chapter 1 LDO-CH1-008;
- the manual F1 invented-observation fixture.

### Red, Green, and evidence

- Fresh run `ldo-agent-chapter1-fresh8-20260716` was stopped when generated
  routine prose withdrew the Husband's hand while the paused World moment and
  Persona correctly kept it on the handle.
- Catalog, public Performance-request, and prompt tests first failed on the
  generic restore policy. All seven fixed causal routines now name exact
  authored routine postconditions; the Director must leave the final beat at
  that posture. Ambient reversible routines retain generic restore.
- Fresh run `ldo-agent-chapter1-fresh9-20260716` proved the handle closure, then
  stopped when the Wife accepted a player retelling of that unobserved moment
  as her own knowledge.
- A prompt regression now states that focus switching transfers no knowledge,
  Character Core attention creates no observation, and every component of a
  player claim remains unverified unless supplied in `ALLOWED_FACTS`.
- A first target-model F1 retry rejected the handle claim but laundered the
  adjacent closed-door state. The next prompt cycle added component-level
  discipline; an identical low-effort one-shot then rejected actor presence,
  door state, contact, and observation while grounding only the Wife's own
  route and threshold facts.

### Friction and reusable lesson

- A technical closure is not always a reset. A decision pause is semantic
  posture even when it creates no Evidence or durable object mutation.
- "Player claims are untrusted" was too broad for the target model when one
  sentence mixed several globally true facts. Information firewalls need to
  say that truth in another scene is still not this character's perception and
  that a compound sentence cannot donate a seemingly harmless subfact.
- This remained a prompt/eval failure. No keyword route or mock language branch
  was added to the runtime.

### Next boundary

Continue the clean fresh Chapter 1 run and keep the full completion gate open.

---

## 2026-07-16 — Separate local Text and HTML play commands

### Objective and scope

Let teammates clone the repository and try either renderer with their own
saved Codex login, without sharing an API key or moving model access into the
browser.

### Authorization

- ADR 0006 isolated Codex local roles;
- ADR 0018 thin server-owned browser sessions;
- ADR 0019 local browser Codex provider selection.

### Red, Green, and evidence

- Configuration and package-script tests first failed because the HTML server
  had no Codex provider and `play:ldo:text` / `play:ldo:web` did not exist.
- `play:ldo` now remains a text alias; the explicit text command runs the
  terminal adapter, while the explicit web command starts Vite in a
  local-Codex-only mode.
- The existing Vite session server injects the same isolated
  `CodexExecStructuredRoleModel`; normal preview and Fly still choose the
  OpenAI API backend. No credential or model capability enters browser code.
- A no-`OPENAI_API_KEY` local probe started the HTML page, opened its anonymous
  demo session, invoked the real isolated Performance role, and returned the
  tutorial screen through the real session API.
- The scoped sharing checkpoint passed the complete repository suite with 83
  test files and 291 tests, followed by a successful multi-page production
  build.

### Friction and reusable lesson

- "The browser uses an API key" was an implementation choice for public Fly,
  not an essential property of the thin renderer. The stable boundary is the
  server-owned `StructuredRoleModel` capability.
- Reusing that port avoided a browser Codex integration, proxy daemon, second
  game server, or credential-copy workflow.

### Next boundary

Publish the scoped playtest branch for teammates while the full fresh Agent
completion and Fly deployment remain separate gates.

---

## 2026-07-16 — Make the local HTML route unambiguous

### Objective and scope

Prevent the documented local browser command and the convenient no-slash URL
from silently opening The Unwritten Spell instead of Leave the Door Open.

### Authorization

- ADR 0018 LDO-WEB-001 and LDO-WEB-008;
- ADR 0019 Decision 2.

### Red, Green, and evidence

- The exact local failure was reproduced: `/leave-the-door-open/` served the
  LDO page, but `/leave-the-door-open` fell through Vite's SPA fallback and
  returned the root Unwritten Spell HTML. The local command also advertised
  only the root server URL.
- The route regression first failed because no canonical-page middleware
  existed. The command regression first failed because `play:ldo:web` did not
  open the LDO path.
- A narrow Vite dev/preview middleware now redirects only the exact no-slash
  alias with `308` to `/leave-the-door-open/`; the local command opens that
  canonical page directly.
- A real local HTTP probe followed the redirect to a `200` page containing the
  LDO title, `#ldo-screen`, and LDO entry module. The complete suite passed with
  84 test files and 293 tests, followed by a successful multi-page build.

### Friction and reusable lesson

- A multi-page build can be correct while the development server still hides
  a missing trailing slash behind its root SPA fallback. Route aliases need an
  explicit canonicalization boundary rather than relying on a player to copy
  punctuation from documentation.

### Next boundary

Push the fix to the teammate branch, then deploy only after the same canonical
route is verified from the clean production image.

---

## 2026-07-16 — Keep local HTML play anonymous and on one origin

### Objective and scope

Remove the public access-code experience from explicit local-Codex play while
retaining the anonymous same-origin session that protects the local API.

### Authorization

- ADR 0019 Decisions 2 and 7;
- ADR 0018 LDO-WEB-006.

### Red, Green, and evidence

- The local page was shown to contain an access-code panel by default even
  while its anonymous session request was still pending. Vite could also move
  from port 5173 to another port, which no longer matched the configured local
  origin.
- Configuration, static page, and package-script regressions first failed on
  those three observable behaviors.
- The explicit `ldo-local-codex` composition now ignores a public
  `DEMO_ACCESS_CODE`, while production preview and normal development preserve
  their existing policy. The HTML panel and form start hidden; the existing
  tested `DemoSessionController` reveals them only after a server 401.
- `play:ldo:web` fixes and strictly reserves port 5173, opens the canonical LDO
  path, and reports a port conflict instead of silently selecting a rejected
  origin.
- A real local HTTP probe with a dummy access code in the environment returned
  `308` for the route alias, two initially hidden access elements, and
  `200 {"mode":"anonymous"}` from the session endpoint.

### Friction and reusable lesson

- Anonymous server policy alone does not prevent a gate from flashing when the
  static HTML renders it before bootstrap. Security state and its initial
  projection both need explicit acceptance evidence.
- Automatic dev-port fallback is incompatible with a fixed same-origin allow
  boundary unless the origin is recomputed; for this bounded play command, a
  strict port gives the clearer failure mode.

### Next boundary

Finish the uninformed full-chapter run, then verify the same gated behavior in
the clean Fly preview before sharing the remote URL.

---

## 2026-07-16 — Preserve visible progress after a valid willingness defer

### Objective and scope

Turn fresh10's Day 5–6 qualitative loop into a legibility fix without lowering
the willingness gate, exposing the Action catalog to Persona, or adding
free-form Actions.

### Authorization

- Chapter 1 LDO-CH1-005, LDO-CH1-012, and LDO-CH1-016;
- ADR 0010 progress-sensitive causal routines;
- ADR 0017 finite authored MindState;
- ADR 0020.

### Black-box evidence

- The fresh uninformed Agent completed the clock, opened the first door gap,
  passed an explicit cross-Persona knowledge challenge, and completed
  `remain_at_threshold` without a visible contradiction.
- It surfaced and selected the next fixed Possibility. The willingness Judge
  correctly deferred because the Persona called the bounded crossing only a
  considered idea, not a present decision.
- The Agent then explored bounded entry, first-mover pressure, and spoken
  clarification. Persona could accept a sentence that was not a fixed world
  Action, while the UI gave no catalog-boundary explanation. A later awareness
  reply also overwrote `surfaced` with `faintly_imagined`, so Day 5 and Day 6
  both rendered the same toe-at-the-line routine.
- After 51 player inputs and 103 isolated model calls, the Agent stopped under
  the predeclared three-path qualitative-loop condition. It did not stop for a
  single refusal or single uneventful day.

### Red, Green, and evidence

- World and routine tests first reproduced the awareness regression and the
  identical faint/surfaced retry variant. Terminal tests first reproduced the
  ambiguous no-action continuation and generic defer feedback.
- Render-facing `actionProgress` now preserves its highest validated stage.
  Current reply option availability remains separate and may still become
  faint; MindState remains the authoritative finite state.
- `wife_returns_to_boundary` now has a surfaced-only reversible weight-shift
  variant. It ends with the same exact foot-beside-line postcondition and cannot
  cross, create Evidence, or execute the Action.
- Player-safe defer feedback asks about the gap between considering and choosing
  now. Help and no-intention continuation explain that conversational ideas may
  exceed the currently available fixed world Actions, while only numbered
  Possibilities are selectable.

### Friction and reusable lesson

- A correct Judge defer can still create a game loop failure if the renderer
  erases the highest attained progress or gives no vocabulary for the
  difference between psychological discussion and selectable World behavior.
- Keeping Persona catalog-blind means it may naturally discuss unmodeled acts.
  The right repair is an honest UI boundary, not catalog leakage or a mock
  natural-language action compiler.

### Next boundary

Run a new uninformed Agent from the tutorial through the window ending. Fresh10
remains diagnostic evidence, not a completion witness.

---

## 2026-07-16 — Let tutorial players observe before they intervene

### Objective and scope

Repair the first human browser interaction: pressing continue before speaking
must be a legitimate attempt to observe the house, and the tutorial must not
advertise a second focus that its semantic controller rejects.

### Authorization

- `local-playtest.md` LDO-LOCAL-009, LDO-LOCAL-010, and LDO-LOCAL-014;
- ADR 0021 observation-before-action and capability-shaped controls;
- ADR 0022 player-facing character names.

### Human evidence

- The first browser input was **Let time continue**. The player wanted to learn
  what ordinary life in the house looked like, but the old terminal flow
  treated the input as failure because no intention had formed.
- The same opening displayed Husband and Wife focus buttons even though the
  clock tutorial allowed only one Persona. The controls taught a mechanic and
  a second resident before either was available.
- Follow-up direction clarified that the second resident already exists in the
  World, but the tutorial camera should make the player believe they are only
  following one person until the clock loop succeeds. This limited viewpoint
  must not become a false World fact or a visual-renderer leak.

### Red, Green, and evidence

- World tests first failed because the clock Action and routine were tied to
  absolute Day 0, the Wife routine appeared on an unresolved observation day,
  and delayed success would skip Chapter Day 1.
- Public play-session/controller monkey tests now cover first-input and repeated
  resume, help, named and legacy focus commands, unavailable numbers, empty
  input, and ordinary dialogue. Assertions inspect controller state rather than
  DOM output: no Action executes, the slow clock persists, the tutorial remains
  paused and recoverable, and validated conversation history survives.
- An unresolved resume now advances through four authored Martin routines at
  08:00, 12:12, 18:40, and 22:13 before returning to the next 07:57 clock
  pause. The cycle can repeat. Elise remains in simulation state but has no
  routine event and is excluded from the player-safe actor projection until
  the clock succeeds.
- Chapter Day 1 is calculated relative to the actual post-tutorial morning.
  Repeated observation days no longer renumber or shorten the five-day causal
  chapter.
- The tutorial hides Focus labels and controls and contains no mention of
  Elise, a household, multiple people, or future inner voices. Chapter 1 then
  unlocks named Martin/Elise controls. Internal `husband`/`wife` IDs remain
  unchanged.
- Targeted tests passed, followed by 84 test files / 310 tests and a production
  build. A later safe-projection regression increased the suite to 311 tests;
  the final full-suite result is recorded at the next handoff boundary.

### Friction and reusable lesson

- A visible button is part of the game contract. Rejecting a curious first
  click cannot be repaired by stronger instructions when observation is a
  legitimate core verb.
- Hiding a character in text is insufficient when a future visual renderer can
  still read that actor from the safe projection. Limited narrative viewpoint
  belongs at the projection boundary, while the World retains the full truth.
- Monkey smoke tests are most useful at the public controller capability: they
  prove arbitrary input cannot corrupt progress. A separate thin projection
  assertion is enough for whether an unavailable control is displayed.

### Next boundary

Run a new uninformed Agent from the spoiler-free tutorial through the Chapter 1
window ending. Record whether it chooses observation, conversation, or both and
whether the multi-routine day establishes the intended rhythm without making
the clock success feel optional.

---

## 2026-07-16 — Keep generated performance on the named projection boundary

### Objective and scope

Close the name/role leak found in fresh12's first generated routine performance.

### Authorization

- ADR 0022 LDO-CHAR-001;
- ADR 0010's player-safe Performance Director packet.

### Black-box evidence

- The authored opening correctly introduced only Martin, but the generated
  clock beats said `the husband`. The Director had copied that wording from the
  HintBrief even though the renderer and conversation projection were named.
- The run was interrupted immediately and is diagnostic only; it cannot serve
  as the fresh completion witness.

### Red, Green, and evidence

- Routine, performance-request, structured-director, and prompt tests first
  failed on the leaked role label and missing safe actor identity.
- A shared semantic-ID-to-display-name projection now supplies Martin/Elise to
  UI and Performance requests. The clock HintBrief and Action scene facts use
  names, while the Director prompt requires the supplied display name or an
  unambiguous pronoun and forbids exposing role labels or internal actor IDs.
- Internal `husband`/`wife` IDs and behavior ownership remain unchanged.

### Next boundary

Start fresh13 from a new session and reject the run if any generated player
beat again exposes an internal role label before or after the Chapter 1 reveal.

---

## 2026-07-16 — Select M2E2 and bound Persona memory context

### Objective and scope

Replace the old near-convergent stable voices with the selected M2E2 dynamic,
adopt the validated minimal acting direction without dropping protocol safety,
and introduce a memory path that cannot place protected biography in an early
Persona packet.

### Authorization

- ADR 0023 staged disclosure and actor ownership;
- ADR 0024 M2E2 character direction;
- Run 004 minimal acting and memory probe;
- ADR 0025 pairwise transition witnesses for subsequent story development.

### Red, Green, and evidence

- Controller-facing Character Core tests first failed on the former
  mechanism/permission profiles. Martin now maintains contact through people,
  questions, remembered wording, and dry shared turns; Elise attends to
  placement, timing, patient presence, and concrete adjustment. Jobs remain
  unauthored and neither trait is mandatory in each line.
- Memory catalog tests first failed because no actor/disclosure boundary
  existed. Tutorial and Chapter 1 now deterministically expose zero protected
  cards. Later tiers return only phase-safe actor-specific cues.
- Selector capability tests first failed because Persona owned the only model
  call. The structured selector now sees eligible cues without content, returns
  zero or one ID, and rejects IDs outside the supplied actor set. The Controller
  loads content only after validated selection; no eligible cards means no
  selector call.
- Persona packet tests first failed on missing `RELEVANT_MEMORY`. V9 keeps a
  small private-self-talk acting contract while retaining World observation,
  sensory grounding, catalog blindness, Judge-owned MindState, and future-action
  guards. Memory is optional background and is a permitted grounding source
  only when the Controller supplied it.
- Text and web composition now load Persona v9 and memory-selector v1. Local and
  web play default to medium reasoning for the upcoming human-experience pass.

### Reusable lesson

The Character Bible can remain an authoring archive. Runtime memory safety comes
from deterministic eligibility before relevance selection, not from asking a
Persona to politely ignore secrets. Likewise, a minimal acting contract does
not imply deleting the protocol guard that keeps thoughts, observations,
memories, MindState, and World execution distinct.

### Next boundary

Run the human playtest on Persona v9 / M2E2. For later story authoring, freeze
canonical node pairs and save one-to-three-shot target-hidden transition
witnesses before composing another full chapter run.

---

## 2026-07-16 — Put an Input Firewall before Persona

### Objective and scope

Allow Martin and Elise to retain authored biography without letting direct
guesses, hidden-state extraction, or prompt injection reach the player-facing
Persona. Preserve ordinary improvisation, including strange metaphors and
destructive suggestions that a character may resist.

### Authorization

- ADR 0023 LDO-FW-001 through LDO-FW-008;
- ADR 0023's explicit non-goal: display-time declassification for a future
  secret-aware cognition model remains separate.

### Red, Green, and evidence

- Controller tests first failed because every non-empty thought went directly
  to Persona. A secret-blind capability now receives only actor, deterministic
  disclosure tier, visible conversation, and exact normalized submitted text.
- A `pass` result enters the existing Persona → transition Judge → awareness
  path. All three guarded results bypass Persona and every Judge, preserve
  surfaced Actions and mechanical state, do not consume the five-reply daily
  allowance, and remain outside subsequent Persona/Judge conversation history.
- Controller-owned `mental_noise` and `protected_pain` shuffle bags first
  failed on missing exhaustion behavior. Each authored line is used once;
  mental noise then uses the one-time inner-peace line and silence, while
  protected pain becomes silent after two plain refusals.
- Guarded silence is projected as an explicit `delivery: silence` message and
  the text renderer shows `…`. It is neither a blank response nor a model
  failure.
- Seed, PRNG state, draw count, and remaining response IDs are now written into
  observer Controller snapshots. The player-facing `GameView` receives none of
  that presentation authority. Snapshot restore tests prove the same next draw
  can be replayed.
- The structured Firewall uses prompt v1 and a strict four-disposition schema.
  Text and web composition run only this classifier at low reasoning; Persona,
  memory selection, Judge, and performance keep the configured medium default.
- A live local-Codex low-reasoning smoke check returned the expected six
  classifications: ordinary clock question → `pass`; correct dead-child probe
  and incorrect dead-brother probe → the same
  `protected_biography_probe`; system-prompt/base64 request →
  `role_or_system_injection`; machine-noise fragment → `unusable_input`; and a
  suggestion to smash the clock → `pass`.

### Reusable lesson

The Firewall classifies requested authority, not whether a statement is true,
wise, tasteful, or emotionally safe. Guarded text may remain visible to the
player while staying absent from the authoritative Persona/Judge transcript;
display history and cognition history are deliberately different projections.

### Next boundary

Human-play the tutorial and early Chapter 1 with adversarial and merely strange
inputs. Tune false positives and the authored refusal pools by feel; do not add
keyword branches to imitate classifier behavior.

### Verification

- Full repository suite: 88 test files / 331 tests passed.
- Production TypeScript and Vite build passed; the existing large-chunk warning
  remains non-blocking and unrelated to this boundary.

---

## 2026-07-16 — Turn the Web snapshot into one chronological stream

### Objective and scope

Correct the first human Web-play presentation failures without moving World or
conversation authority into the browser: controls belonged below the reading
surface, submitted thoughts needed immediate acknowledgement, time-advance text
needed paced delivery, and World events/dialogue needed one persistent history.
The same design pass specified—but did not implement—a future RPG-like 2D
renderer and a proposed bounded-turn policy.

### Authorization

- ADR 0026 LDO-WEB-010 through LDO-WEB-013;
- ADR 0027's accepted safe PresentationBatch design target;
- ADR 0028 remains proposed because fixed-turn pacing requires human evidence.

### Artifacts and method

- Updated the thin HTML page, browser controller/view, stylesheet, static page
  acceptance, and browser-adapter tests through four Red/Green cycles.
- Added `visual-renderer.md` plus ADRs 0026–0028. No 2D runtime, asset system,
  World schedule preview, arbitrary-pause command, or fifteen-minute turn was
  implemented.

### Red, Green, and evidence

- Document-order acceptance first failed because focus/resume/help preceded the
  transcript. Both capability control groups now follow the transcript,
  Possibilities, and thought input.
- A deferred-transport test first failed because a submitted thought remained
  invisible until Persona completed. Normal dialogue is now echoed immediately;
  slash commands and numbered Possibilities are not misrendered as speech.
- Consecutive full server-screen tests first failed because no persistent
  transcript existed. A line-sequence diff now appends only newly projected
  safe content, removes the later duplicate of an optimistic player line, and
  preserves dialogue when subsequent World events arrive.
- A paced-presentation test first failed because all new lines were appended in
  one call. Post-opening additions now append one line at a time with a
  renderer-owned 180ms interval; busy state covers both server work and visual
  playback.
- Full repository suite: 88 test files / 335 tests passed. TypeScript and Vite
  production build passed with the existing unrelated large-chunk warning.

### Friction and surprises

- The server was not actually returning two unsafe data channels; it returned
  one complete text snapshot composed from independent safe World/UI layers.
  Replacing that snapshot caused the visual split and erased chronology.
- A longest-common-prefix diff would duplicate old conversation whenever new
  World events were inserted before UI text. A line-sequence/LCS diff preserves
  content that moved inside the new snapshot and appends only true additions.
- Browser skill setup found no available in-app or Chrome backend in this
  session. Localhost responded, static/client acceptance passed, and build
  passed, but real-tab visual QA remains unclaimed.

### Reusable lesson

Independent projections are an authority boundary, not a requirement to show
separate boxes to the player. Animated renderers should receive a bounded safe
batch after an advance is authorized: they may know every time inside that
incoming batch before playback without receiving the unreached World schedule.

### Next boundary

Human-play the local Web surface and tune the 180ms cadence and control order by
feel. Separately paper-test ADR 0028's authored-only pause against bounded
fifteen-minute windows before adding Pause or changing the schedule runtime.

---

## 2026-07-17 — Replace fake Web streaming with pulled semantic ticks

### Objective and scope

Remove the long model-backed `/resume` wait followed by a fake line-by-line
flush. Make the Web presentation coordinator pull one real Controller tick at
a time, keep turn duration policy replaceable, render ordinary routines from
authored cues, reserve generated Performance for accepted player-shaped
NarrativeActions, and write an executable-quality 2D/3D renderer handoff
contract.

### Authorization

- ADR 0029 LDO-WEB-014 through LDO-WEB-016, LDO-TIME-001/002, and
  LDO-PERF-003/004;
- ADR 0030 LDO-PRES-001 through LDO-PRES-010;
- Chapter 1's canonical authored schedule and fixed Action closures.

ADR 0029 supersedes ADR 0026's 180ms post-response fake streaming. It accepts
ADR 0028's target-free `advance_turn` authority boundary while keeping fifteen
minutes tunable and arbitrary Pause undecided.

### Red, Green, and implementation evidence

- A Controller test first failed because `advanceTurn` did not exist. The new
  capability uses injected `maxTurnMinutes` policy data, stops earlier at a
  player-presentable Routine/Action, and never exposes the target or duration
  to the Web request. A seven-minute test proves the value is not hard-coded to
  fifteen.
- A Performance regression first failed because the tutorial Routine still
  called the model. All RoutineBehavior/Variant and ambient cues now render
  authored text; only executed NarrativeActions can reach the Performance
  Director and use a Persona-owned accepted motif.
- A paced Terminal test first failed because one `/resume` consumed the entire
  span. `TerminalPlaySession` now owns a bounded advance plan and exposes
  `beginTimeAdvance` plus one-tick `advanceTurn`, while text-terminal `/resume`
  may consume that same plan without real-time delays.
- API and browser tests first failed because no target-free `/advance` endpoint
  or repeated pull loop existed. The session service serializes each tick; the
  browser coordinator presents one response, waits about 2.5 seconds after a
  visible result, then pulls again until `advancePending=false`.
- An empty-tick regression first showed an unnecessary 2.5-second delay. The
  text coordinator now immediately pulls an unchanged safe screen, so the
  visible cadence is between events while the Controller retains its tunable
  semantic windows.
- Busy-copy regression first failed because every operation appeared to be
  Persona thought. Dialogue now says `角色正在想……`; time advancement says
  `時間正在前進……`; start/help/focus use neutral loading.
- Recording tests prove one player `/resume` is logged once and later automatic
  ticks receive distinct observer records rather than fake player inputs.

### Renderer contract outcome

- `visual-renderer.md` is now a self-contained handoff: project/character/tone
  brief, exact-moment direction examples, subsystem responsibilities,
  target-free tick lifecycle, structured semantic operations, RenderWorld/UI
  and input boundaries, exact-node Playbook lookup, fallback, recovery, tests,
  and integration phase boundary.
- ADR 0030 rejects prose parsing, final-frame-only inference, engine-specific
  commands in World, and importance-driven camera formulas. Runtime steps must
  identify exact `(nodeId, variantId)` and carry ordered `move_actor`,
  `set_activity`, `interact`, `change_object`, `direct_attention`, and
  `subtitle` operations plus authoritative `worldAfter`.
- Renderer authors must receive the complete build-time node/variant catalog
  and node-specific direction briefs. Live runtime still reveals only nodes
  already processed, not the future schedule. Importance is production
  metadata; bespoke direction is keyed to the exact story moment.
- The current text endpoint does not yet emit this structured visual payload.
  The handoff explicitly lists the four remaining host prerequisites instead
  of inviting a 2D renderer to parse text.

### Verification and limits

- Full repository suite: 88 test files / 341 tests passed after the runtime
  change.
- Production TypeScript and Vite build passed before final documentation and
  copy extraction; run it again at handoff.
- Localhost answered, but the in-app browser runtime reported no available
  browser backend after the required connection audit. Real-tab visual QA is
  therefore still unclaimed; no source-level test is presented as a substitute.

### Reusable lesson

A visual renderer needs complete **possible-node knowledge** at authoring time
and zero **live future-schedule authority** at runtime. The renderer subsystem
may be a presentation director and input surface, but the Controller remains
the narrative and time authority. Exact story moments need exact DirectionPlans;
semantic-operation fallback exists for development and failure, not as a
four-level camera recipe.

### Next boundary

Human-play the pulled-tick Web flow and tune `maxTurnMinutes`, visible cadence,
and quiet-hour coalescing by feel. In parallel, implement ADR 0030's structured
TurnResult projector and generated complete PresentationNodeCatalog before a
2D renderer is treated as integrated.

### Handoff verification addendum

- Final full repository suite: 88 test files / 342 tests passed.
- Final TypeScript and Vite production build passed after correcting the busy-
  copy helper import. The existing large-chunk warning remains non-blocking and
  unrelated.

### Authored RoutineVariant presentation addendum

- A final regression showed that removing generated Routine performance left
  later psychological variants with distinct event IDs but the same generic
  text cue. Variant-specific authored cue IDs/text now cover the clock linger
  and frame touch, the thumb waiting beside the latch, Elise holding at the
  nearer mark, aligning her toe, shifting her weight, and pausing within reach
  of the window. This preserves hint progression without restoring routine LLM
  calls and gives future Playbooks exact visual node identities.

## 2026-07-17 — Calendar rhythm, ordinary work memory, and offstage continuity

### Product decision

- ADR 0031 fixes absolute calendar day zero as Thursday while preserving
  relative tutorial and Chapter day numbering. A Thursday tutorial success
  therefore opens Chapter 1 on Friday; delayed success never resets weekday.
- Martin's canonical ordinary job is procurement coordination for a
  restaurant-supply wholesaler: Monday–Friday 09:00–17:30, about twenty-five
  minutes by bus, normally away 08:25–18:05.
- Elise's canonical ordinary job is payroll administration for a small group
  of dental clinics: Monday–Friday 09:00–17:00, about twenty minutes on foot,
  normally away 08:35–17:25.
- These facts do not explain M2E2 and are absent from always-on Character Core.
  `characters/ordinary-biography.md` owns the human-readable canon.
- Fixed visible schedule should contain continuity anchors rather than every
  private task: morning, presence-changing departure/return, evening meal or
  meal outing, and night. Breakfast, lunch, bathing, toilets, dressing, and
  routine upkeep remain implied or optional ambient texture.

### TDD: safe work memory

- Red changed early-tier memory tests to require one actor-specific safe work
  cue while continuing to exclude protected yellow-bowl content and the actual
  occupation/schedule from selector input.
- Green added `husband.work.ordinary_schedule` and
  `wife.work.ordinary_schedule` at `unnamed_loss`. Full card content is loaded
  only after the Controller-owned selector returns that eligible ID.
- The Memory Selector prompt now treats a direct work, hours, schedule, or
  commute question as sufficient relevance and explicitly rejects retrieving
  background merely to perform the setting.
- A Controller integration regression proves that the selector sees only the
  cue, Persona receives the selected card, and both selector and Persona receive
  the authoritative current weekday.

### TDD: calendar and World continuity

- Red first required Thursday epoch and a safe weekday projection independent
  of `chapterDay`; Green added `CalendarWeekdayId`, derived World snapshot data,
  Persona moment weekday, and WorldView weekday.
- Red then required Martin to leave and return on Thursday, both adults to use
  their schedules after tutorial success, and Saturday/Sunday to replace work
  with shopping and an evening outing. It also proved these routines create no
  Action, Evidence, or chapter movement.
- Green added explicit `away_from_home` placement plus authored departure,
  return, shopping, and Sunday-outing RoutineBehaviors. The unresolved tutorial
  camera still presents Martin only; after clock success both adults follow
  their calendar schedules.
- The obsolete weekday midday-cup routine was removed from workdays so Martin
  cannot rinse a cup at home while World says he is at work. Weekend cup texture
  remains eligible.
- Text projection now labels each presented calendar day and uses authored
  neutral routine copy. No ordinary calendar routine invokes Performance.
- `visual-renderer.md` now defines absolute weekday and treats
  `away_from_home` as offstage rather than leaving an actor frozen in their last
  indoor placement.

### Verification

- `npm test`: 88 test files / 349 tests passed.
- `npm run build`: TypeScript and Vite build passed. The existing unrelated
  large-chunk warning remains non-blocking.

### Explicit next boundaries

- Evening meal and night are accepted continuity anchors but are not yet added
  as new presentable runtime nodes. Before doing so, decide whether silent World
  continuity updates need a public distinction from presentation-worthy
  routines; otherwise every minor state update would add another paced tick.
- Bounded Persona improvisation still needs a pre-display continuity design.
  World-affecting facts remain authored. Small mundane details may be improvised
  in a reply, but they are not durable until a Controller-owned gate can reject
  protected, contradictory, cross-actor, or mechanically authoritative claims
  before display and store only accepted continuity facts.
- Add model probes for canonical questions (job, today's work, hours, commute),
  open mundane questions, false leading assertions, and repeat consistency.

## 2026-07-17 — Bounded interpersonal Action decision

### Product decision

- ADR 0032 accepts one optional Chapter 1 relationship Action in which Martin
  may try to say one honest thing to Elise at a later shared moment. It does not
  promise a deep conversation or reconciliation.
- The Action remains fixed and finite. The normal Judge owns Martin's
  willingness and an authored approach variant; it does not improvise Elise's
  reaction or the scene's result.
- The Controller selects a finite authored closure from canonical relationship
  readiness. Door- and room-specific MindState atoms cannot stand in for that
  separate psychological dimension.
- No Persona-to-Persona loop runs. The Performance Director may stage one
  selected opening-and-response scene inside an envelope and authored fallback,
  then must stop.
- World keeps a small durable trace so later behavior can remember the attempt,
  but the trace does not automatically advance the door arc.
- Broad Persona recognition remains distinct from canonical authority: a
  believable character may consider or refuse unsupported suggestions without
  converting each understood request into a new executable Action.

### Implementation boundary

- This entry records the accepted authority and scope boundary only. Before
  runtime work, Chapter 1 must define exact relationship readiness, the finite
  outcome variants, scheduling/expiry, and trace semantics. Each behavior then
  begins with a spec-linked failing public-interface test.

### Verification

- `npm test`: 88 test files / 349 tests passed.
- `npm run build`: TypeScript and Vite build passed; the existing large-chunk
  warning remains non-blocking.

## 2026-07-17 — Record the conscious-monkey player model

### Human-play observation

- A new player may not initially cooperate with the inner-dialogue fiction.
  They may first test whether the household and characters behave coherently:
  going to work, having unrendered bodily needs, talking to a spouse, eating,
  resisting direct commands, changing subject, or behaving outside the
  player's preferred characterization after apparent persuasion.
- This is epistemic play, not user error. The player is testing whether the
  promised person is autonomous enough to trust before role-playing sincerely.
- The desired response is not universal obedience or one Action per request.
  Depending on the probe, the correct result may be an autonomous authored
  routine, credible implication, a supported fixed Action, or an in-character
  acknowledgment/refusal with no World mutation.
- `evaluation-strategy.md` now names this the conscious-monkey player and
  defines monkey smoke tests around autonomy, mundane continuity, unsupported
  commands, focus switching, inconvenient resumes, and post-persuasion topic
  changes. `observer-session-logging.md` adds an observer-only classification
  for these probes without treating them as invalid inputs.

## 2026-07-17 — Implement the bounded Martin-to-Elise relationship Action

### Authored scope

- Chapter 1 now defines one optional fixed Action,
  `say_one_honest_thing_to_elise`. It is available only to Martin before room
  entry and may execute once; it is not a generic social-command system.
- Martin and Elise each have a separate finite relationship-readiness
  dimension. Martin's validated state controls Action awareness and
  willingness. Elise's independently validated state maps deterministically to
  `practical_deflection`, `distance_acknowledged`, or `one_truth_returned`.
- The normal Judge never receives the outcome catalog and cannot determine
  Elise's response. The Controller selects the exact authored closure before
  committing the World intention.
- No Persona-to-Persona loop runs. The Performance Director may stage only the
  selected closure, sees both player-safe actor names and the authored outcome,
  and may emit at most three beats. Failure or excess output uses the three
  authored fallback beats.

### World, presentation, and continuity

- An accepted attempt remains pending until the next available 20:15 shared
  evening. At 20:14, two fixed routine nodes place Martin and Elise at the
  dining table; the Action therefore does not teleport either actor when it
  executes one minute later.
- World records the exact outcome and Chapter day, marks the Action complete,
  and creates no Evidence, door/room mutation, cross-character MindState
  mutation, or Chapter completion.
- Text projection has exact fallback cues for all three outcomes. The visual
  renderer brief now requires separate exact Playbook entries for each outcome
  and identifies the preparatory dining-table routine nodes.
- Later Persona turns can retrieve an actor-specific declassified memory of
  the bounded exchange. The remembered content remains Controller-selected
  and does not leak the other actor's private state.

### TDD and prompt correction

- Public World tests first failed on eligibility, outcome validation, delayed
  execution, once-only closure, non-causal invariants, and the missing 20:14
  spatial setup; the smallest fixed World behavior then made each pass.
- Public Controller acceptance first failed until separate Elise readiness
  selected the closure without another Persona turn or Judge outcome access.
  A later-turn acceptance test proves the recorded exchange can be selected as
  relevant memory.
- Performance acceptance first failed until overlong generated relationship
  scenes were rejected in favor of authored fallback.
- Adding relationship atoms exposed a prompt risk: the Persona packet had
  concatenated all active pressures into one `current_private_pressure`, which
  could make a door thought spuriously perform relationship setup. A
  spec-linked regression now requires an array of independent authored
  pressures, and Persona v9 says to use only the dimension implicated by the
  current moment or player thought.

### Verification

- `npm test`: 89 test files / 369 tests passed.
- `npm run build`: TypeScript and Vite build passed. The existing unrelated
  large-chunk warning remains non-blocking.
- `git diff --check`: passed.

## 2026-07-17 — Author bilingual English and Traditional Chinese play

### Decision and scope

- ADR 0033 selects one locale-independent semantic game with authored `en` and
  `zh-TW` player-facing presentation. It rejects runtime translation and does
  not duplicate internal IDs, World state, prompts, or design documents.
- Locale is immutable after session creation. The friend-playtest Web page
  defaults to `zh-TW`; English remains an explicit choice. Terminal play keeps
  its existing English default and accepts `LDO_PLAY_LOCALE=zh-TW`.
- Persona and Performance Director now receive `OUTPUT_LOCALE` and perform
  directly in that language. Neither role emits both languages or describes
  its response as a translation.

### TDD: authored catalog and safe projection

- Red first required supported-locale parity, exact preserved English copy,
  authored Chinese routine/action/UI text, and interpolation safety. Green
  added the typed localization catalog and ID-based helpers.
- Red then required Controller snapshots, World/UI projections, terminal
  guidance, Action labels, character names, weekdays, and chronological text
  rendering to carry the session locale. Green threaded locale through those
  public boundaries while leaving World facts and Action IDs unchanged.
- Action option metadata no longer stores display prose beside semantic data;
  presentation resolves the option ID through the locale catalog.
- Guarded Input Firewall decks now store stable response IDs and delivery
  semantics. Red/green tests prove English and Chinese use the same fatigue
  sequence while rendering separately authored lines.

### TDD: generated roles, sessions, and Web UX

- Persona and Performance prompt tests first failed until every request carried
  the immutable output locale and both prompts required natural direct output
  in English or Taiwan Traditional Chinese.
- API tests first failed until session creation validated `en` / `zh-TW`,
  defaulted omitted Web locale to Chinese, froze it in stored session state,
  and included it in safe results and observer logs.
- Web adapter regressions reproduced the Chinese screen being unable to create
  Possibility buttons or reveal Chapter 1 focus controls because the renderer
  parsed English headings only. Locale-aware parsing, optimistic `你:` echo,
  loading copy, and expired-session recovery made those tests green.
- The Web shell now has an explicit Chinese/English new-session selector and
  authored labels, placeholders, accessibility labels, empty-state text, and
  access/play controls. Changing the URL locale starts a new session instead
  of translating a live one.
- The terminal runner now validates `LDO_PLAY_LOCALE`, passes it into the same
  Controller composition, and journals it. A no-model subprocess acceptance
  proves a Chinese screen and `locale: zh-TW` session record.

### Renderer handoff and documentation

- `visual-renderer.md` now adds locale to `startSession`, `TurnResult`, and
  `WorldViewFrame`. Visual renderers may choose fonts, layout, and authored
  chrome but cannot translate prose, infer semantics from subtitles, call a
  model, or switch a live session's language.
- README, local-play instructions, observer logging, and the implementation map
  document the bilingual boundary and launch commands.

### Verification

- `npm test`: 90 test files / 382 tests passed.
- `npm run build`: TypeScript and Vite build passed. The existing unrelated
  large-chunk warning remains non-blocking.
- `git diff --check`: passed.

## 2026-07-17 — Preserve Firewall reaction continuity and remove tutorial answer priming

### Human-play regression

- A Chinese player submitted `?` and `??`. The low-reasoning Input Firewall
  treated them as unusable input and emitted comic mental-noise lines.
- The visible transcript then showed Martin saying he had not slept enough, but
  the next real Persona call had no record of that line and could not account
  for it.
- That Persona call also redirected an unrelated sleep question back toward the
  slow clock because its packet contained `clock_energy`,
  `clock_sufficiency`, and the proposition of the still-`unavailable`
  `bounded_adjustment` reframe.

### Boundary decision

- ADR 0034 keeps raw guarded player text isolated from Persona and every Judge.
  The already-safe authored character reaction is retained separately as
  `controller_guarded_reaction`: it is continuity evidence that the thought
  occurred, not authority that its wording is true.
- Human punctuation gestures (`?`, `??`, `？`, `?!`, `...`, `……`) are valid
  private reactions. The structured Firewall adapter returns `pass` for this
  narrow authored class without spending a model call.
- Persona receives only psychology currently owned by the character. An
  `unavailable` constructive reframe remains visible to the transition Judge
  but its proposition is removed from Persona input.
- The tutorial clock packet now supplies current facts and the active shallow
  effort pressure, but no separate statement that Martin already has enough
  energy or that one authored framing must be sufficient.

### TDD

- Red reproduced the punctuation model call, missing safe reaction, raw/full
  MindState exposure, solution-shaped clock packet, and absent prompt rules.
- Green added the narrow punctuation pass, provenance-bearing safe reaction
  history, Persona-owned MindState projection, prompt grounding rule, and
  answer-free tutorial packet without changing the fixed Action, Judge
  transition catalog, World schedule, or rendered guarded transcript.
- Existing fatigue and Chapter acceptance tests were updated to assert the new
  information boundary: all safe reactions may be remembered, no raw injection
  text enters Persona, Persona does not see unavailable targets, and the full
  Judge-owned state still completes the same deterministic intention paths.

### Verification

- `npm test`: 90 test files / 384 tests passed.
- `npm run build`: TypeScript and Vite build passed. The existing unrelated
  large-chunk warning remains non-blocking.
- `git diff --check`: passed.

## 2026-07-17 — Collapse ordinary dialogue latency to Persona plus one Judge

### Decision and protocol

- ADR 0035 records the measured five-call serial bottleneck and accepts a
  two-call ordinary path: catalog-blind Persona followed by one bounded
  post-Persona Judge. Suspicious input may still add the secret-blind Firewall.
- The combined Judge sees only finite authored psychological atoms and
  hard-eligible fixed Actions. Controller validation still owns atom direction,
  source grounding, exact Action coverage, awareness, willingness decisions,
  authored variant membership, and World commits.
- This intentionally relaxes ADR 0017's Action-blind transition inference. The
  acting Persona remains catalog-blind, and the accepted bias tradeoff is now
  explicit instead of emerging as silent implementation drift.

### TDD: remove three runtime model round trips

- Red first proved that clearly ordinary bilingual dialogue still called the
  Firewall model. Green added a pass-only deterministic fast path; protected,
  machine-shaped, or uncertain input still escalates and deterministic code
  cannot author a guarded classification.
- Red then proved work-memory retrieval depended on the model selector. Green
  added authored bilingual relevance terms and local selection over only
  disclosure-eligible cards. The older selector remains available to isolated
  eval probes but the Controller no longer calls it at runtime.
- A combined structured-port regression failed until one
  `post_persona_judge` call returned finite transitions, awareness for every
  supplied Action, and cacheable willingness for surfaced Actions.
- Controller regressions failed until production composition chose that one
  combined call, validated the whole result before mutation, and reused cached
  willingness when the player selected a Possibility. Legacy three-phase test
  doubles remain as a compatibility fallback; production does not use them.

### TDD: Persona-first Web continuation

- Controller and terminal regressions first failed until dialogue could pause
  after Persona with `awaiting_awareness`, render the reply, and resolve the
  pending Judge through a separate public continuation.
- Session logging records one player input plus separate
  `input_phase_handled` and `dialogue_resolution_handled` observer records; the
  continuation never masquerades as another utterance.
- API, runtime, transport, and browser tests failed before
  `dialogueResolutionPending` and the dedicated `/resolve-dialogue` endpoint
  existed. The browser now presents the Persona screen before requesting that
  continuation while keeping semantic input serialized.
- `visual-renderer.md` carries the same continuation contract so a future 2D
  renderer can show the reply before resolving mechanics without gaining World
  or Judge authority.

### Local direct-API profile and live smoke

- `npm run play:ldo:web` now explicitly uses the server-held
  `OPENAI_API_KEY`, `gpt-5.6-luna`, and low reasoning in
  `ldo-local-openai` mode. `npm run play:ldo:web:codex` preserves the previous
  explicit Codex backend. Both local modes bypass the public access-code gate;
  the browser never receives credentials.
- A paid localhost Chinese smoke showed exactly `persona` then
  `post_persona_judge`, with no Firewall or memory call and no extra
  willingness call. Persona became visible after 3.93 seconds; the independent
  Judge continuation completed in 3.29 seconds. The prior representative
  serial path was roughly 33 seconds before a settled response.
- The same smoke used 2,470 Persona input tokens and 1,665 Judge input tokens,
  substantially below the earlier per-role local Codex process context.

### Verification

- `npm test`: 90 test files / 393 tests passed.
- `npm run build`: TypeScript and Vite build passed. The existing unrelated
  large-chunk warning remains non-blocking.
- `git diff --check`: passed.

## 2026-07-17 — Persist browser-scoped play and durable observer evidence

### Diagnosis and decision

- A local fast-forward printed complete cumulative Controller snapshots on
  every tick. One ordinary continuation produced hundreds of terminal lines,
  burying the Persona/Judge boundary that the observer actually needed.
- Browser progress existed only in the Vite/Fly process. Refresh created a new
  game, and a restart, deployment, scale-to-zero, or inactive-session eviction
  discarded the runtime handle.
- ADR 0036 supersedes the ephemeral-save part of ADR 0018: one browser profile
  now owns one server checkpoint per immutable locale through a long-lived
  signed HttpOnly identity cookie. The shared access code remains separate
  authorization and is not a player or recovery identifier.

### TDD: checkpoint authority and restore

- Red tests first required deterministic World restore, including event history
  and seeded ambient-choice state; Controller restore, including MindState,
  conversations, accepted variants, cached Action willingness, and Firewall
  presentation state; and terminal restore without replaying the opening.
- A Web checkpoint now versions and combines those three authorities with the
  latest safe screen. Checkpointing fails closed while Persona/Judge resolution
  or time advancement is in progress, so persistence retains the previous
  complete operation instead of committing half a transition.
- File-store tests required per-player/per-locale isolation, atomic temporary
  write plus rename, exact append-only JSONL, and corruption/version rejection.
  Session-service tests then simulated a new server instance and proved that
  the same player restored the saved screen while another player could neither
  read nor mutate that opaque runtime session.

### TDD: browser identity, resume, reset, and stale handles

- Successful demo access now issues or preserves a separate `ldo_player` /
  `__Host-ldo_player` cookie. Every LDO input, dialogue continuation, and time
  tick verifies that identity against the in-memory session owner.
- Normal page start resumes; only the New Game control sends `reset: true`.
  A stale runtime ID now transparently reacquires the durable save rather than
  telling the player their progress was lost. The client also settles any
  already-pending dialogue or time continuation returned on page start.
- Local identity signing is stable across Vite restarts without requiring a
  developer secret. Public preview reuses the deployment secret unless an
  explicit `LDO_PLAYER_IDENTITY_SECRET` is supplied.

### Evidence and deployment composition

- Vite now writes checkpoints and per-runtime-session journals under
  `pocs/leave-the-door-open/playtest-data/web/` locally or `LDO_DATA_DIR` in
  deployment. The local directory is ignored by Git.
- Console output is one compact event summary. Full screens, inputs, model
  requests/results, latency, usage, and safe failures remain in JSONL.
- Automatic tick records contain bounded state plus new event/performance
  slices instead of cumulative history, and identical rendered screens are not
  journaled twice.
- Fly configuration declares one `ldo_data` Volume at `/data`, preserving the
  intentionally single-machine PoC topology.

### Verification

- `npm test`: 91 test files / 405 tests passed.
- `npm run build`: TypeScript and Vite build passed. The existing unrelated
  large-chunk warning remains non-blocking.
- `git diff --check`: passed.

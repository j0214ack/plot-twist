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

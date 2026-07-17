# Leave the Door Open PoC

## What this PoC is testing

The player enters a character's inner dialogue at moments of stagnation. The
player cannot command the body or change the world directly. Conversation may
help the character own a new concrete possibility; an authored Action can then
execute later in the deterministic world, leave neutral Evidence, and change
what another character can observe and imagine.

The product thesis is:

> Do not solve the one true story. Help a world trapped inside one story begin
> moving again.

[`initial-thoughts.md`](initial-thoughts.md) preserves the original full
concept. This README is the current implementation and decision snapshot.

## Current causal loop

```text
free-running routines
→ authored pause moment
→ secret-blind Input Firewall classifies the submitted thought
→ catalog-blind Persona conversation
→ action-blind Judge transitions finite authored MindState atoms
→ Controller validates and persists the transitions
→ fixed-catalog Judge evaluates Action awareness
→ player selects a surfaced Action
→ willingness creates an intention
→ World resumes and executes later
→ neutral Evidence is created
→ another NPC physically observes it
→ a new fixed Action can become psychologically reachable
```

The accepted playable slice demonstrates:

```text
husband interacts with the slow clock and leaves it showing the correct time
→ wife observes that small neutral change
→ husband later reaches the fully closed hallway door
→ actively opens the first narrow gap
→ door Evidence becomes active
→ wife later observes the open door
→ wife remains at the threshold for one breath
→ wife later steps one pace inside and returns
→ wife later opens the room window one hand-width
→ Chapter 1 completes on that neutral trace
```

Chapter 1 also contains one optional, non-causal branch. If Martin comes to own
one bounded honest sentence, the fixed `say_one_honest_thing_to_elise` Action
may schedule a single shared scene at the next available 20:15. The Controller
selects one of three authored closures from Elise's separately validated
relationship readiness; Performance may stage that closure in at most three
beats, but cannot start a Persona-to-Persona conversation or change the causal
door arc. The World records the attempt so later dialogue can remember it.

## Accepted invariants

### Authored Actions, generated psychology

- Every executable Action is fixed authored game data.
- A Persona never sees the Action Catalog, Action IDs, variants, future effects,
  or preferred story result.
- Persona output is dialogue plus a conversation-closure signal, never an
  Action or durable MindState patch.
- Durable psychology is a finite authored catalog of belief, reframe, and
  pressure atoms. Later atoms are revealed only at their authored causal phase.
- Persona sees only psychology the character currently owns. In particular,
  the proposition of an `unavailable` constructive reframe remains Judge-side
  until conversation actually makes that interpretation available.
- An Action-blind transition phase of the Judge may move only supplied atoms
  forward through their authored statuses. The Controller rejects unknown,
  stale, invalid, regressive, or Persona-unsupported transitions.
- The deterministic World filters hard prerequisites before an Action reaches
  the Judge.
- The Judge may classify only supplied IDs. It cannot create, broaden, combine,
  execute, or narrate an Action.
- Player wording is not proof that a character owns a possibility. The Judge
  must ground awareness and willingness in the Persona's reply and MindState.
- Only the World executes effects, creates Evidence, and records observation.

### Biography and untrusted player input stay bounded

- Characters may have complete authored lived history without making all of it
  speakable in the current chapter.
- The Controller selects a deterministic disclosure tier. Player guessing,
  repetition, Persona output, and MindState movement cannot unlock it.
- A secret-blind Input Firewall sees only the actor, disclosure tier, visible
  conversation, and submitted thought. It never receives biography, MindState,
  Actions, Judge state, or future story.
- Normal thoughts pass unchanged to Persona. Protected-biography probes,
  role/system injection, and truly unusable input bypass Persona and every
  Judge on that turn and cannot change mechanical or psychological state.
- Human punctuation gestures such as `?`, `??`, and `……` are valid private
  reactions rather than Firewall failures. Raw guarded text never reaches
  Persona; the already-safe authored character reaction may remain in later
  self-talk continuity, where it proves only that the reaction occurred and not
  that its wording was factually true.
- Guarded responses use Controller-owned per-character shuffle bags. Exhausted
  protected pain becomes silence; repeated mental noise receives one terminal
  line and then silence. Selection state is observer-recorded and replayable.

### Routines, Actions, events, and Evidence are different things

- `RoutineBehavior` is scheduled autonomous life. It can produce a visible
  `GameEvent` without creating meaningful Evidence.
- An authored RoutineVariant may reflect validated Action-awareness or story
  progression and carry an authored, player-safe HintBrief.
- Required causal routines remain fixed. Ambient slots may use recorded,
  replayable chance to choose one currently eligible authored routine or none.
- An ambient routine may carry an optional safe HintBrief, but random selection
  cannot be the only source of information required for progress.
- `NarrativeAction` is a fixed authored world behavior gated by physical and
  psychological conditions.
- A Performance Director may vary reversible staging for an already-selected
  routine or Action, but cannot choose the behavior, hint target, or durable
  outcome.
- Transient performance restores valid starting state by default. Any result
  that must persist or be observed has an authored semantic closure enforced
  by the World.
- A `GameEvent` records that something happened; it is not automatically part
  of Persona knowledge.
- Evidence is an explicitly authored, neutral, durable world fact.
- Observation is a deterministic World transition, not an LLM inference.
- Behaviors with different visible completion semantics are separate Actions.
  A character waiting at a threshold is not a smaller variant of entering or
  touching the room.

### Simulation, interaction, and rendering remain separate

- `GameState` owns simulation truth.
- `GameController` owns semantic interaction state and accepts fixed
  `PlayerCommand`s.
- `GameProjector` emits a safe `GameView` containing separate `WorldView` and
  `UIView` values.
- `WorldRenderer` and `UIRenderer` consume only their own projections; a
  compositor layers their outputs.
- The Web compositor retains one chronological player transcript and appends
  newly projected World/UI lines sequentially. This does not merge the two
  authority interfaces or give the browser simulation access.
- Renderers cannot dispatch commands, advance time, call LLMs, execute Actions,
  or read private Persona state.
- The current adapters render text. A future visual world and UI overlay can
  replace them without changing the simulation.

### One semantic game, two authored languages

- Player-facing fixed copy is authored in keyed `en` and `zh-TW` catalogs;
  World facts, IDs, schedules, MindState, and outcomes do not change by locale.
- Locale is selected when a session starts and is immutable for that session.
  The friend-playtest Web page defaults to Traditional Chinese and offers an
  explicit English link.
- Persona and Performance Director write directly in the selected locale. No
  translation API runs after Controller projection, and renderers do not gain
  any language-model authority.
- Observer journals record the locale. Exact generated prose may differ across
  separate English and Chinese sessions while preserving the same game state
  and authority boundaries.

## Evaluation philosophy

Automated validation answers whether a mechanism exists and whether authority
boundaries hold. It does not answer whether the game is fun or correctly tuned.

Model validation is separated into:

1. **Judge feasibility:** authored unowned and owned Persona states test whether
   a non-progress region and a valid progress region both exist.
2. **Persona reachability:** search for at least one conversation trajectory
   that produces a Persona state the same Judge can surface and accept.
3. **Human playtest:** decide whether the boundary is too loose or strict,
   whether the path is too easy or hard, whether resistance feels credible, and
   whether progress feels earned.

A finite automated search that finds a path returns `reachable`. Failure to find
one within a technical budget is `inconclusive`, not proof that no path exists.
Turn count is recorded as evidence; it is not a gameplay pass threshold until
human playtests establish one.

See [`evaluation-strategy.md`](evaluation-strategy.md) for the complete
rationale.

## What has been proven

- The deterministic headless loop, pause boundary, fixed Actions, delayed
  execution, Evidence creation, observation gate, safe projection, layered text
  rendering, and PlayerCommand boundary have automated coverage.
- Injected Persona and Action Judge ports complete the authored Chapter 1
  Action path through GameController using deterministic structured fakes,
  including pending-state exclusion, invalid-variant rejection, exact World
  postconditions, and the final window trace.
- Causal routines carry exact authored stopping points; automated orchestration
  proves that generated performance cannot generically restore a decision
  pause away from the semantic posture it is meant to present.
- Same-tier sub-agent experiments rejected a free-form proposal/semantic Matcher
  protocol and supported a catalog-blind Persona plus fixed-catalog Judge.
- A bounded live `gpt-5.6-luna` replay produced a positive Wife-side witness:
  the saved Persona state surfaced `remain_at_threshold`, and low-effort
  willingness accepted its authored one-breath variant.
- The paid replay was capped at two calls and did not invoke a Persona or model
  evaluator again.
- A fresh uninformed black-box Agent completed the corrected live three-Action
  terminal slice using only player-visible screens. It navigated live defer
  feedback, resumed each accepted intention, observed both authored world
  changes, and reached the 09:13 ending. See
  [`playtests/007-agent-full-slice-live-blackbox.md`](playtests/007-agent-full-slice-live-blackbox.md).
- Text and thin HTML local surfaces both start real server-owned sessions using
  isolated Codex roles and the developer's own saved login. The HTML start
  endpoint was exercised without `OPENAI_API_KEY`; browser code received only
  the projected text screen and opaque session ID.
- The Input Firewall routing, authority bypass, no-penalty behavior, replayable
  response fatigue, and explicit silence projection have automated coverage. A
  six-case low-reasoning Codex smoke check passed ordinary, destructive,
  protected-correct, protected-incorrect, injection, and unusable boundaries.

## What has not been proven

- One live black-box Agent completion proves a reachable trajectory, not
  reliable completion across runs or unaided human discoverability.
- The current fresh uninformed Chapter 1 run has reached the first door gap but
  has not yet completed the full five-day chapter. Earlier stopped runs are
  diagnostics, not completion evidence.
- The thin browser text UI is local-playable but not yet deployed in this
  branch; it is not a 2D or 3D world renderer.
- No automated result establishes ideal turn limits, Judge strictness,
  conversation difficulty, discoverability, emotional credibility, or fun.
- A saved witness proves existence, not that an unaided human will discover the
  same route.

## Current implementation map

| Concern | Source |
|---|---|
| Deterministic world and authored schedule | [`src/world.ts`](src/world.ts) |
| Fixed command and interaction boundary | [`src/controller.ts`](src/controller.ts) |
| Persona/Judge capability contracts | [`src/conversation.ts`](src/conversation.ts) |
| Input Firewall response families and replay state | [`src/input-firewall-responses.ts`](src/input-firewall-responses.ts) |
| Authored psychological atoms and transition validation | [`src/mind-state.ts`](src/mind-state.ts) |
| Routine variants and authored HintBriefs | [`src/routine-behaviors.ts`](src/routine-behaviors.ts) |
| Performance Director capability contract | [`src/performance.ts`](src/performance.ts) |
| Single authored Action metadata source | [`src/narrative-actions.ts`](src/narrative-actions.ts) |
| Authored relationship closures and readiness mapping | [`src/relationship-conversation-outcomes.ts`](src/relationship-conversation-outcomes.ts) |
| Safe World/UI projections | [`src/presentation.ts`](src/presentation.ts) |
| Authored `en` / `zh-TW` player copy | [`src/localization.ts`](src/localization.ts) |
| Independent text render layers | [`src/text-rendering.ts`](src/text-rendering.ts) |
| Deterministic text vertical-slice acceptance | [`src/vertical-slice.acceptance.test.ts`](src/vertical-slice.acceptance.test.ts) |
| Conversational Action acceptance | [`src/conversation-controller.acceptance.test.ts`](src/conversation-controller.acceptance.test.ts) |
| Human-playable text slice requirements | [`human-playable-text-slice.md`](human-playable-text-slice.md) |
| Persona/Judge structured protocol harness | [`src/live-protocol.ts`](src/live-protocol.ts) |
| Judge-only feasibility probes | [`src/judge-feasibility.ts`](src/judge-feasibility.ts) |
| Saved Persona-state replay | [`src/saved-state-replay.ts`](src/saved-state-replay.ts) |
| Paid-call hard budget | [`src/model-call-budget.ts`](src/model-call-budget.ts) |
| Isolated Codex headless adapter | [`src/codex-exec-model.ts`](src/codex-exec-model.ts) |
| Persona/Judge structured port adapter | [`src/structured-conversation-ports.ts`](src/structured-conversation-ports.ts) |
| Structured Performance Director adapter | [`src/structured-performance-director.ts`](src/structured-performance-director.ts) |
| Terminal scenario and input adapter | [`src/terminal-play-session.ts`](src/terminal-play-session.ts) |
| Local play executable | [`src/run-terminal-playtest.ts`](src/run-terminal-playtest.ts) |
| Thin browser renderer and input adapter | [`../../src/leave-door-open-main.ts`](../../src/leave-door-open-main.ts) |
| Chronological Web transcript reconciliation | [`../../src/leave-door-open-client.ts`](../../src/leave-door-open-client.ts) |
| Browser session API and real game composition | [`../../server/leave-door-open-api.ts`](../../server/leave-door-open-api.ts) and [`../../server/leave-door-open-runtime.ts`](../../server/leave-door-open-runtime.ts) |

## Next milestone

1. Complete one clean uninformed Persona v9 / Judge v4 playthrough from the
   tutorial through the Chapter 1 window ending without a visible contradiction,
   knowledge leak, or three-turn loop.
2. Record that trajectory as Playtest 009 and re-run the full suite and build.
3. Deploy the already-tested thin browser adapter to the existing Fly route and
   verify its access gate plus real session API.
4. Invite human players; use their experience—not Agent turn counts—to tune
   difficulty, pacing, prose, and discoverability.

## Document map

- Original concept: [`initial-thoughts.md`](initial-thoughts.md)
- Implemented deterministic slice: [`vertical-slice.md`](vertical-slice.md)
- Human-playable text slice: [`human-playable-text-slice.md`](human-playable-text-slice.md)
- Local terminal playtest: [`local-playtest.md`](local-playtest.md)
- Proposed tutorial prologue: [`tutorial-prologue.md`](tutorial-prologue.md)
- Accepted Chapter 1 design: [`chapter-1.md`](chapter-1.md)
- Observer session logging: [`observer-session-logging.md`](observer-session-logging.md)
- Living implementation journal: [`implementation-log.md`](implementation-log.md)
- Character Cores: Martin ([`characters/husband.md`](characters/husband.md))
  and Elise ([`characters/wife.md`](characters/wife.md)); role IDs remain
  internal ownership keys.
- Character label-blind validation:
  [`characters/label-blind-validation.md`](characters/label-blind-validation.md)
- Character label-blind baseline evidence:
  [`characters/label-blind-runs/001-neutral-towel.md`](characters/label-blind-runs/001-neutral-towel.md)
- Human playtest observations: [`playtests/`](playtests/)
- Pairwise story-transition witness method:
  [`decisions/0025-validate-story-arcs-with-pairwise-transition-witnesses.md`](decisions/0025-validate-story-arcs-with-pairwise-transition-witnesses.md)
- Staged biography and Input Firewall boundary:
  [`decisions/0023-protect-lived-biography-with-staged-disclosure-and-an-input-firewall.md`](decisions/0023-protect-lived-biography-with-staged-disclosure-and-an-input-firewall.md)
- RPG-like 2D renderer implementation contract:
  [`visual-renderer.md`](visual-renderer.md)
- Proposed bounded-turn and overnight fast-forward policy:
  [`decisions/0028-bound-time-advancement-with-safe-turn-windows.md`](decisions/0028-bound-time-advancement-with-safe-turn-windows.md)
- Full-slice live black-box witness:
  [`playtests/007-agent-full-slice-live-blackbox.md`](playtests/007-agent-full-slice-live-blackbox.md)
- Chapter 1 entry paper probes:
  [`playtests/008-chapter-1-entry-paper-probes.md`](playtests/008-chapter-1-entry-paper-probes.md)
- Evaluation rationale: [`evaluation-strategy.md`](evaluation-strategy.md)
- Validation protocol and evidence: [`validation/README.md`](validation/README.md)
- Current mechanism plan:
  [`validation/mechanism-feasibility-plan.md`](validation/mechanism-feasibility-plan.md)
- Live feasibility evidence:
  [`validation/runs/003-gpt-5p6-luna-mechanism-feasibility.md`](validation/runs/003-gpt-5p6-luna-mechanism-feasibility.md)
- Accepted decisions:
  - [`decisions/0001-catalog-blind-persona-and-action-judge.md`](decisions/0001-catalog-blind-persona-and-action-judge.md)
  - [`decisions/0002-separate-world-simulation-from-rendering.md`](decisions/0002-separate-world-simulation-from-rendering.md)
  - [`decisions/0003-separate-model-feasibility-from-human-experience.md`](decisions/0003-separate-model-feasibility-from-human-experience.md)
  - [`decisions/0004-use-budgeted-witness-replay-for-model-validation.md`](decisions/0004-use-budgeted-witness-replay-for-model-validation.md)
  - [`decisions/0005-let-game-controller-orchestrate-conversation-ports.md`](decisions/0005-let-game-controller-orchestrate-conversation-ports.md)
  - [`decisions/0006-use-isolated-codex-exec-for-local-playtests.md`](decisions/0006-use-isolated-codex-exec-for-local-playtests.md)
  - [`decisions/0007-record-local-playtests-outside-game-state-and-rendering.md`](decisions/0007-record-local-playtests-outside-game-state-and-rendering.md)
  - [`decisions/0008-distinguish-imagined-microsteps-from-world-intentions.md`](decisions/0008-distinguish-imagined-microsteps-from-world-intentions.md)
  - [`decisions/0009-teach-the-loop-with-an-authored-prologue.md`](decisions/0009-teach-the-loop-with-an-authored-prologue.md)
  - [`decisions/0010-author-hints-and-generate-bounded-performance.md`](decisions/0010-author-hints-and-generate-bounded-performance.md)
  - [`decisions/0011-make-the-first-door-gap-an-authored-action.md`](decisions/0011-make-the-first-door-gap-an-authored-action.md)
  - [`decisions/0012-author-chapters-and-implement-causal-beats.md`](decisions/0012-author-chapters-and-implement-causal-beats.md)
  - [`decisions/0013-author-stable-character-cores.md`](decisions/0013-author-stable-character-cores.md)
  - [`decisions/0014-bridge-the-tutorial-into-directed-observation.md`](decisions/0014-bridge-the-tutorial-into-directed-observation.md)
  - [`decisions/0015-parallelize-causal-beats-behind-frozen-contracts.md`](decisions/0015-parallelize-causal-beats-behind-frozen-contracts.md)
  - [`decisions/0016-select-ambient-routines-with-replayable-chance.md`](decisions/0016-select-ambient-routines-with-replayable-chance.md)
  - [`decisions/0017-give-authored-mind-state-transitions-to-the-judge.md`](decisions/0017-give-authored-mind-state-transitions-to-the-judge.md)
  - [`decisions/0018-serve-a-thin-browser-playtest-adapter.md`](decisions/0018-serve-a-thin-browser-playtest-adapter.md)
  - [`decisions/0019-use-isolated-codex-for-local-browser-play.md`](decisions/0019-use-isolated-codex-for-local-browser-play.md)
  - [`decisions/0020-preserve-visible-progress-without-changing-action-gates.md`](decisions/0020-preserve-visible-progress-without-changing-action-gates.md)
  - [`decisions/0021-let-tutorial-players-observe-before-acting.md`](decisions/0021-let-tutorial-players-observe-before-acting.md)
  - [`decisions/0022-use-names-at-the-player-facing-boundary.md`](decisions/0022-use-names-at-the-player-facing-boundary.md)
  - [`decisions/0023-protect-lived-biography-with-staged-disclosure-and-an-input-firewall.md`](decisions/0023-protect-lived-biography-with-staged-disclosure-and-an-input-firewall.md)
  - [`decisions/0024-select-m2e2-character-dynamics.md`](decisions/0024-select-m2e2-character-dynamics.md)
  - [`decisions/0025-validate-story-arcs-with-pairwise-transition-witnesses.md`](decisions/0025-validate-story-arcs-with-pairwise-transition-witnesses.md)
  - [`decisions/0026-render-web-play-as-one-chronological-text-stream.md`](decisions/0026-render-web-play-as-one-chronological-text-stream.md)
  - [`decisions/0027-deliver-safe-presentation-batches-to-animated-renderers.md`](decisions/0027-deliver-safe-presentation-batches-to-animated-renderers.md)
  - [`decisions/0028-bound-time-advancement-with-safe-turn-windows.md`](decisions/0028-bound-time-advancement-with-safe-turn-windows.md)
  - [`decisions/0029-pull-authored-timepoints-and-generate-only-player-shaped-actions.md`](decisions/0029-pull-authored-timepoints-and-generate-only-player-shaped-actions.md)
  - [`decisions/0030-project-structured-semantic-presentation-operations.md`](decisions/0030-project-structured-semantic-presentation-operations.md)
  - [`decisions/0031-layer-calendar-rhythm-under-story-progress.md`](decisions/0031-layer-calendar-rhythm-under-story-progress.md)
  - [`decisions/0032-bound-interpersonal-actions-with-authored-closure.md`](decisions/0032-bound-interpersonal-actions-with-authored-closure.md)
  - [`decisions/0033-author-bilingual-player-facing-content.md`](decisions/0033-author-bilingual-player-facing-content.md)
  - [`decisions/0034-preserve-guarded-reaction-continuity-without-leaking-guarded-input.md`](decisions/0034-preserve-guarded-reaction-continuity-without-leaking-guarded-input.md)
  - [`decisions/0035-collapse-runtime-dialogue-to-persona-and-one-post-persona-judge.md`](decisions/0035-collapse-runtime-dialogue-to-persona-and-one-post-persona-judge.md)

## Verification and paid commands

Local verification does not call OpenAI:

```bash
npm test
npm run build
```

Launch the local text playtest with saved ChatGPT Codex authentication, or the
HTML playtest with the root `.env.local` `OPENAI_API_KEY`:

```bash
npm run play:ldo:text
npm run play:ldo:web
```

The HTML command currently pins direct `gpt-5.6-luna` at low reasoning for
latency testing. Its explicit Codex-backed alternative is:

```bash
npm run play:ldo:web:codex
```

The Web page defaults to Traditional Chinese. Use
`/leave-the-door-open/?locale=en` for a new English session. Terminal play
preserves its English default; use
`LDO_PLAY_LOCALE=zh-TW npm run play:ldo:text` for Traditional Chinese.

The text and `play:ldo:web:codex` commands use the signed-in developer's Codex
plan. The default HTML command uses direct API billing; the browser never
receives the key. None of the play commands has a gameplay hard call budget.

`npm run eval:ldo-replay` is a paid live command. It reads the repository-root
`.env.local`, defaults to Luna low, enforces at most two calls, and should be run
only when a new live replay is intentionally required.

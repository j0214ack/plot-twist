# Local Terminal Playtest Specification

Status: Accepted implementation scope

## Purpose

Make the tutorial and complete Chapter 1 directly playable from a local
terminal without billing the repository-root OpenAI API key. Local play uses
the user's existing ChatGPT-authenticated Codex CLI as a headless
structured-role adapter.

This is a development playtest surface, not the production model architecture.
The former same-morning three-Action boundary is retained only in historical
artifacts; ADR 0012 and `chapter-1.md` supersede its schedule and ending.

## Requirements

- **LDO-LOCAL-001 — Isolated headless role call:** Each model role runs through
  `codex exec` in an empty temporary working directory with ephemeral sessions,
  a strict output schema, project/user rules ignored, and shell, apps, hooks,
  goals, remote plugins, multi-agent, and web capabilities disabled. The role
  receives only its explicit prompt packet.
- **LDO-LOCAL-002 — ChatGPT auth, not API-key billing:** The local play command
  reuses saved Codex CLI authentication and never reads or forwards
  `OPENAI_API_KEY` or `CODEX_API_KEY`. It may consume the user's Codex plan
  usage and remains subject to plan rate limits.
- **LDO-LOCAL-003 — No gameplay hard budget:** Local play does not stop after a
  fixed number of calls. Call/token counts may be reported as telemetry, but a
  technical evaluation budget is not a conversation rule. Direct paid API eval
  commands retain their existing explicit budgets.
- **LDO-LOCAL-004 — Catalog-blind Persona adapter:** The Persona role packet
  contains the selected character's surface packet, observed neutral Evidence,
  current bounded MindState, visible conversation, paused moment, and latest
  player turn. It contains no Action/variant IDs, Action descriptions, Judge
  output, future effect, or preferred result. Local human play uses Persona
  prompt v7 with Action Judge prompt v4; v3 remains frozen for the earlier
  feasibility artifacts, v4 for Playtest 002, v5 for Playtest 003, and v6 for
  the pre-ADR-0017 Chapter probes.
- **LDO-LOCAL-005 — Fixed-catalog Judge adapter:** Awareness and willingness use
  the same authored Action definitions supplied by GameController. Structured
  Codex output is schema-checked and then revalidated by the Controller before
  an option or intention can change state.
- **LDO-LOCAL-013 — Judge-owned psychological transitions:** Durable MindState
  consists only of authored belief, reframe, and pressure atoms with stable
  IDs and kind-specific finite statuses. Persona dialogue cannot apply a
  MindState patch. After each Persona reply, an Action-catalog-blind Judge
  phase may transition only supplied atoms and must ground every change in the
  Persona's own reply; Controller validation owns persistence. Action
  awareness then reads the validated post-turn state, and willingness remains
  a separate player-selected phase. Removed or rejected atoms remain recorded
  across days. Optional unmodeled-shift text is observer-only and has no
  gameplay authority. See ADR 0017.
- **LDO-LOCAL-006 — Terminal input adapter:** The terminal renders the existing
  independent World/UI text layers and converts free text, numbered Action
  choices, resume, help, and quit input into PlayerCommands or scenario clock
  advancement. It does not call Persona/Judge ports or mutate World state
  directly.
- **LDO-LOCAL-007 — Integrated playable boundary:** A session begins at the
  Husband's Day 0 slow-clock pause and demonstrates the complete tutorial loop.
  It then follows the canonical Chapter 1 schedule: next-morning contrasting
  routines, Day 2 handle and first door gap, later-same-day Wife observation,
  later-day threshold, entry, and window Actions. It ends only when
  `chapter1Complete` is true and the renderer states the neutral one-hand-width
  window result. The superseded 09:05→09:13 path is unreachable.
- **LDO-LOCAL-008 — Discoverable opening:** Before the first input, the terminal
  explains that the player is a voice inside the focused character's self-talk,
  cannot control the character's body, and is trying to help the household move
  again by helping each person discover a next step they can genuinely accept.
  It identifies the immediate task, gives at least two example opening lines,
  and says that no exact phrase is required. `/help` repeats this mental model
  alongside the controls. The guidance may describe how to converse but must
  not name or paraphrase the solution Action or a preferred story result. Its
  examples should demonstrate questioning an assumption or offering a reframe;
  they must not send the player searching for unavailable hidden biography.
- **LDO-LOCAL-009 — Legible intention state:** Onboarding and `/help` distinguish
  selecting a numbered Possibility and seeing explicit confirmation that an
  intention formed from merely discussing an idea. An accepted willingness
  renders that confirmation. During the tutorial, `/resume` without an
  intention is a valid request to observe rather than an error; it schedules no
  Action and must not imply that conversationally thinkable movement already
  became executable. Local human play uses
  Persona prompt v7, which permits grounded present possibilities but forbids
  Persona from claiming that a contemplated movement will execute when time
  resumes or that Controller commitment already occurred. If the player
  selects a surfaced Possibility but willingness does not create an intention,
  the UI must explicitly say that the character is not ready to commit and
  invite more conversation. It must not expose Judge phase labels, decisions,
  reasons, Action IDs, or variants, and it must not look like an ignored input.
- **LDO-LOCAL-010 — Tutorial success grammar:** This three-Action slice is
  an onboarding level, not a target for long-term pacing. An uninformed player
  should have a discoverable route to experience at least one complete visible
  loop from conversation through a numbered Possibility, intention
  confirmation, resumed authored behavior, and resulting world difference.
  Visible routine behavior and moment context should provide grounded clues the
  player can notice and discuss without naming the hidden Action. Later levels
  may legitimately require multiple days, pauses, routine observations, and
  partial psychological movement before producing a new world intention.
  During this prologue the Husband is the only selectable Persona; the Wife's
  role is the later authored World observation. An attempted Wife focus leaves
  the Husband conversation intact and explains that other focus choices begin
  in Chapter 1. Entering a number before a Possibility exists explains that
  none is available yet and redirects the player to discuss what may feel
  possible with the clock today without naming the hidden Action.
- **LDO-LOCAL-014 — Exploratory tutorial controls:** A player may use `/resume`
  as the first input to observe several ordinary Martin routines across the
  rest of the day and reach the next
  morning's slow-clock pause without solving or skipping the tutorial. This
  cycle is repeatable, preserves validated conversation progress, and keeps
  Chapter 1 Day 1 relative to the eventual completion day. Tutorial rendering
  treats Martin as the implicit current voice: it does not display Focus
  terminology, Elise, or an unavailable second-person control. Deterministic monkey
  smoke tests exercise the public play-session/controller input capability,
  including offered, invalid, and legacy commands, and prove that the session
  remains recoverable. See ADR 0021.
- **LDO-LOCAL-011 — Authored hints and bounded performance:** Routine behavior
  may select authored variants from validated Action-awareness progression and
  story state. Each story hint and its disclosure strength comes from an
  authored, player-safe HintBrief. A separate Performance Director may generate
  transient gesture, timing, and prose for an already-selected RoutineVariant
  or accepted NarrativeAction, but cannot choose the behavior, hint target,
  intention, durable outcome, Evidence, observation, or MindState change.
  Player-proposed motifs influence performance only when the Persona accepts a
  compatible reversible interaction. The World independently applies authored
  postconditions, and renderers only present safe projected performance cues.
- **LDO-LOCAL-012 — General closure and door provenance:** Every generated
  PerformancePlan closes through an engine-owned policy. Transient expressive
  play restores its valid starting state; routine and NarrativeAction hosts
  apply only authored postconditions. Any intermediate state that must persist,
  affect later eligibility, or be observed becomes authored semantic state.
  The hallway door begins fully closed. Only the husband's accepted
  `open_door_a_crack` Action may create the first narrow gap and activate its
  neutral Evidence; routines and performance cannot manufacture that change.

## Launch contract

From the repository root:

```bash
npm run play:ldo:text
```

`npm run play:ldo` remains an alias for the text surface. To use the same game
session and isolated Codex roles through the thin HTML renderer instead:

```bash
npm run play:ldo:web
```

Open `http://127.0.0.1:5173/leave-the-door-open/`.

Optional configuration:

```bash
LDO_PLAY_MODEL=gpt-5.6-luna LDO_PLAY_EFFORT=low npm run play:ldo:text
```

## Non-goals

- production-grade deployment, durable sessions, or accounts;
- a visual 2D or 3D interface; ADR 0018 permits the thin browser text adapter;
- direct Responses API billing during the default local play command;
- provider reliability, latency, or comparative model evaluation;
- hiding the PoC's source files from the human developer;
- ideal turn limits, difficulty, Judge strictness, or fun thresholds;
- production pacing for multi-day psychological progression; this tutorial
  validates the success grammar, not how often later progress should occur.

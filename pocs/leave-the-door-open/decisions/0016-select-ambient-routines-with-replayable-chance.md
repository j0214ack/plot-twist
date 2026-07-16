# 0016: Select Ambient Routines with Replayable Chance

Status: Accepted

Date: 2026-07-16

## Context

ADR 0010 keeps semantic routine identity, hint ownership, and performance
authority separate. For the tutorial PoC it also makes every routine selection
deterministic. Chapter 1 now needs another source of ordinary texture: the
player should sometimes encounter a household action that was not placed as a
required story beat, then see the Performance Director realize that action in
a concrete way.

This is not a request for a daily novelty quota. The desired effect is the
occasional combination of an eligible ordinary behavior and its bounded
performance giving the player something worth noticing. Such a behavior may
also carry an optional, player-safe hint, but random chance cannot hide the
only information required to progress.

Definitions:

- A **causal routine** is an authored behavior whose occurrence carries a
  required phase transition, clue, observation, or decision moment.
- An **ambient routine** is an authored semantic behavior eligible to add
  ordinary activity around the causal spine. In this PoC it cannot complete a
  causal phase, create Evidence, record a required observation, or change
  Action eligibility.
- An **ambient slot** is an authored opportunity at which the World may choose
  one eligible ambient routine or no routine.
- **Replayable chance** means production choice uses injected seeded entropy,
  while tests and saved-session replay can reproduce the same selections.

## Options considered

1. **Keep every semantic routine fixed and vary only performance.** This adds
   expressive prose and gestures without a new selector, but every household
   activity remains prearranged. It does not produce the requested combination
   of an unexpected ordinary action and its staging.
2. **Choose from a fixed eligible ambient catalog with replayable chance while
   keeping causal routines fixed.** This adds bounded variation without giving
   chance authority over story progress. Accepted.
3. **Use an authored shuffled deck for each phase.** This prevents repeats and
   is replayable, but adds deck lifecycle and exhaustion rules before the PoC
   has evidence that simple recent-choice filtering is insufficient.
4. **Let an LLM select or invent the next routine.** This could react richly to
   context, but it collapses semantic selection into performance, makes hint
   timing hard to audit, and introduces a Narrative Director with plot
   authority.

All options assume that routine semantics can remain a fixed catalog. If later
work requires a model to invent new addressable household behavior, that is a
separate generative-compiler decision, not an extension of performance.

Pattern check: this is a two-track authored scheduler, not procedural story
generation. Causal slots are guaranteed. Ambient-slot eligibility is
deterministic; only the choice among currently eligible authored behaviors is
random.

## Decision

1. Chapter causal routines, their order, required HintBriefs, observations,
   and decision moments remain authored and guaranteed.
2. The World may schedule ambient slots around that causal spine. Each slot
   selects from a fixed catalog after deterministic filtering by actor, time,
   location, World state, story phase, bounded psychological stage, and recent
   repetition. Raw MindState text is not selector input.
3. An ambient slot may select no behavior. There is no per-day amount,
   intensity curve, or required frequency of interesting material.
4. Production selection uses an injected seeded chance source. The seed and
   selected semantic routine IDs are recorded for diagnosis and replay. A
   resumable save either persists the chance-source position or derives each
   draw from a stable slot identity, so restoring identical state cannot
   silently diverge. Tests inject fixed selections rather than depending on
   statistical outcomes.
5. Ambient routines remain semantic authored data. Chance cannot invent a
   RoutineBehavior or RoutineVariant, and the Performance Director cannot
   choose which one occurs.
6. An ambient routine may carry an optional authored HintBrief compatible with
   the current phase. It may reinforce, re-angle, or make an existing safe fact
   easier to notice. Any hint required for reachability must also have a
   guaranteed causal source; it cannot depend only on an ambient draw.
7. The Performance Director receives only the selected routine, its envelope,
   and its optional HintBrief. Its existing bans on World mutation, Action
   selection, protected biography, hint substitution, and durable outcomes
   remain unchanged.
8. For this PoC, an ambient selection may emit a visible GameEvent but cannot
   activate Evidence, perform a required observation, change Action
   eligibility, or close a causal phase. A future ambient routine with a
   durable mundane effect needs an explicit authored postcondition and a new
   review of this boundary.
9. Random selection plus generated staging is an authoring method, not proof of
   literary interest. Agent review may expose repetition or functional-only
   output; human play remains the authority on whether the result holds
   attention.
10. Semantic replay uses the recorded selection state. Screen-identical replay
    additionally reuses the recorded PerformancePlan; it does not call the
    Performance Director again and assume equivalent prose.

## Consequences

- Repeated play can produce different ordinary household details without
  changing the Chapter 1 solution graph.
- Some optional hints can arrive through daily life instead of only through
  mandatory clue scenes.
- Failures remain reproducible because semantic selections are logged and
  replayable.
- The runtime needs a small chance-source/selection boundary and ambient
  catalog, but does not need an LLM routine selector or authored daily quota.

## Relationship to accepted decisions

This supersedes only ADR 0010 Decision 4's requirement that all routine
selection be deterministic. ADR 0010's authored semantic catalog, HintBrief
ownership, bounded Performance Director, closure policies, and authority bans
remain accepted. This also preserves ADR 0012's fixed chapter spine and
causal-beat workflow.

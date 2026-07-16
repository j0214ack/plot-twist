# 0010: Author Hint Targets and Generate Only Bounded Performance

Status: Accepted for the tutorial PoC

Date: 2026-07-16

## Context

The **Three Minutes** tutorial should accept many player-proposed ways of
interacting with the clock. A character may take it down, spin its hands,
remove and replace its battery, or otherwise play with it before eventually
leaving it intact and showing the correct time. Authoring every reversible
gesture as a separate NarrativeAction would turn expressive variation into a
large catalog of mechanically equivalent outcomes.

Routine behavior also needs to change as a character's psychological position
or story phase changes. These variations can give the player useful clues over
multiple days even when no new NarrativeAction becomes available. If one LLM
is allowed to choose the routine, decide what story fact to hint, stage the
behavior, and describe its effect, it becomes an unbounded Narrative Director
with authority over authored pacing and protected information.

## Definitions

- A **semantic behavior** is an authored RoutineBehavior, RoutineVariant, or
  NarrativeAction whose identity and durable outcome are simulation data.
- A **PerformancePlan** is generated transient staging for one already-selected
  semantic behavior. It may vary gestures, timing, and prose but has no World
  mutation authority.
- A **PerformanceEnvelope** is authored input defining the target objects,
  reversible freedom, required ending, durable effects, and forbidden changes
  for a PerformancePlan.
- A **ClosurePolicy** declares how simulation state is reconciled after a
  PerformancePlan: restore the valid starting state for transient play, apply
  a routine's authored postcondition, or apply a NarrativeAction's authored
  persistent postcondition.
- A **HintBrief** is an authored, player-safe statement of exactly which fact a
  performance should make noticeable, at what strength, and without which
  interpretations or protected facts.
- A **Performance Director** is the catalog-bounded LLM role that turns an
  already-selected semantic behavior, PerformanceEnvelope, and optional
  HintBrief into a PerformancePlan.

## Options considered

1. **Do not generate performance; author every visible variation.** This keeps
   authority simple but makes harmless expressive responses to player language
   combinatorial and brittle.
2. **Let the renderer improvise prose.** This is locally easy but reverses ADR
   0002: a renderer would choose story content and could claim World changes it
   did not receive.
3. **Let one general Narrative Director choose routines, hints, staging, and
   outcomes.** This is flexible but gives an LLM responsibility for plot pace,
   secret disclosure, autonomous behavior, and World consequences. Failures
   become difficult to attribute or contain.
4. **Author semantic behavior and hint targets; generate bounded staging.**
   Accepted. Routine selection and durable outcomes remain deterministic while
   a separate Performance Director creates expressive variation inside an
   authored envelope.

All options share an assumption: generated staging is valuable even when its
intermediate gestures do not become durable simulation state. If every visible
gesture must instead be addressable by later mechanics, it is semantic
behavior and must be authored rather than treated as performance.

## Decision

1. NarrativeActions, RoutineBehaviors, RoutineVariants, their eligibility, and
   all durable World effects remain authored data.
2. RoutineVariants may be selected from time, World state, story phase, and a
   bounded persistent psychological stage. The selector does not receive raw
   free-text MindState.
3. For the current PoC, Action awareness progression such as `latent`,
   `faintly_imagined`, `surfaced`, `intended`, and `completed` is the preferred
   bounded psychological input. The Controller owns and validates persistent
   progression before the World may use it for routine selection.
4. Routine selection is deterministic. The Performance Director cannot choose
   which RoutineBehavior or RoutineVariant occurs.
5. A RoutineVariant may approach, foreshadow, or visibly hesitate around a
   NarrativeAction, but it cannot execute that Action's durable effect without
   an accepted intention.
6. Every story clue exposed through a performance originates in an authored
   HintBrief. The Performance Director cannot select a different story fact,
   infer a protected truth to reveal, or decide the game's hint schedule.
7. A HintBrief may state whether the cue is required or optional, its intended
   clarity, the player-safe observable fact, and forbidden interpretations.
   The Performance Director decides only the concrete gesture, timing, and
   wording used to express that brief.
8. The Performance Director is conceptually parallel to, but separate from,
   the Action Judge:
   - the Judge decides whether a fixed Action is psychologically owned;
   - the Performance Director stages an already-selected semantic behavior.
   They may use the same model backend but have separate prompts, schemas,
   calls, inputs, and capability interfaces.
9. Performance generation occurs at execution time using current player-safe
   scene context. It cannot surface or accept an Action, create an intention,
   update MindState, select a hint, mutate World state, activate Evidence, or
   record observation.
10. Player-proposed performance motifs may influence staging only when the
    Persona has accepted a compatible reversible interaction. Raw player text
    alone does not command the character's body.
11. The World applies authored postconditions independently of generated prose.
    A failed or unavailable Performance Director must not change those
    postconditions; an authored neutral presentation may be used as fallback.
12. Every PerformancePlan has a technical closure, but most do not need a
    bespoke story ending:
    - reversible expressive interaction defaults to restoring the valid
      starting state;
    - a RoutineBehavior applies only its authored routine postcondition;
    - a NarrativeAction applies its exact authored persistent postcondition.
13. Story authors define a bespoke semantic closure whenever the result must
    persist, affect later eligibility, become observable by another NPC, or
    create Evidence. This includes important story beats and any mundane
    persistent object change; importance alone is not the criterion.
14. Intermediate performance beats are atomic and non-observable to other NPCs
    in this PoC. If play must be interrupted, queried later, or observed while
    in progress, that intermediate point is promoted to authored semantic
    state rather than remaining transient performance.
15. Projectors expose only safe performance cues or lines. Text and visual
    renderers consume those projections and never invoke the Performance
    Director themselves.
16. Use this authoring test to separate semantics from performance:
    - if a variation changes durable state, Evidence, later eligibility, or
      meaningful completion, author a separate behavior or valid variant;
    - if it changes only reversible staging on the way to the same required
      ending, keep it inside the PerformanceEnvelope.

## Consequences

- A routine can visibly evolve over several days without turning every gesture
  into a NarrativeAction.
- Hints can feel varied while their content and disclosure timing remain under
  authored control.
- The text PoC can accept expressive clock interactions without granting free-
  form World mutation.
- A future visual renderer may realize the same PerformancePlan with a smaller
  available animation vocabulary; renderer limitations do not change semantic
  outcomes.
- Authors do not need to invent an ending for every gesture. Generic transient
  closure covers expressive play until an authored behavior intentionally
  creates a persistent semantic checkpoint.
- A future system that lets an LLM choose which story clue to reveal would be a
  new Narrative Director decision and is outside this ADR.

## Relationship to accepted decisions

This extends ADRs 0001, 0002, 0008, and 0009. It does not make Personas
catalog-aware, allow generated Actions, give renderers authority, or bypass the
World's deterministic Evidence and observation gates.

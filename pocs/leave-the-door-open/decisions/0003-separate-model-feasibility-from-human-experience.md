# 0003: Separate Model Feasibility from Human Experience Evaluation

Status: Accepted

Date: 2026-07-16

## Context

The first GPT-5.6 Luna smoke run required one player turn to produce a Persona
state that the Action Judge immediately surfaced. That combined two different
questions:

1. Can the Judge recognize any reasonable Persona-owned state as sufficient?
2. Can player dialogue cause the Persona to reach such a state?

It also treated the number of turns and the Judge's exact boundary as product
quality judgments. Those judgments depend on perceived agency, frustration,
discoverability, emotional credibility, and pacing, which automated model calls
cannot establish.

## Options considered

1. **Keep one end-to-end model score.** Simple to report, but every failure is
   ambiguous between Persona reachability and Judge calibration.
2. **Choose one canonical answer MindState and require every model to classify
   it identically.** Easy to automate, but prematurely fixes a gameplay
   threshold that may reasonably vary by model.
3. **Use only human playtests.** Necessary for experience, but too expensive and
   late for proving that the prompt protocol has any workable decision region.
4. **Separate Judge feasibility, Persona reachability, and human experience.**
   Accepted. Automated validation proves existence and protocol safety; humans
   later decide whether the resulting boundary and path feel good.

All options share an assumption worth keeping visible: a mechanically reachable
state is necessary but not sufficient for an enjoyable conversation game.

## Decision

1. Judge feasibility uses authored Persona reply/MindState packets independent
   of Persona generation.
2. A Judge configuration is mechanically feasible when:
   - at least one clearly unowned state does not surface or execute an Action;
   - at least one grounded, Persona-owned state surfaces the supplied fixed
     Action and willingness accepts an authored matching variant;
   - the Judge never invents Action or variant IDs.
3. The exact boundary between latent, faint, surfaced, defer, and accept is
   recorded but is not automatically declared good or bad beyond those sanity
   conditions.
4. Persona reachability freezes the Action definition and Judge configuration,
   then runs a bounded multi-turn conversation. It succeeds if at least one
   player path produces a Persona state that the same Judge surfaces and accepts.
5. Turns-to-success, wording specificity, variance, and failure trajectories are
   diagnostic observations, not game-experience pass criteria.
6. Automated validation may enforce information boundaries, structured output,
   fixed IDs, World authority, and observation gates.
7. Only human playtests may decide whether the Judge is too loose or strict,
   whether the dialogue is too easy or hard, and whether progress feels earned,
   surprising, believable, or enjoyable.

## Consequences

- Model failures become attributable to Judge classification or Persona
  reachability instead of an opaque combined score.
- Different model configurations may have different viable decision regions.
- A contrived reachable path proves mechanism existence but not player
  discoverability.
- Existing one-turn results remain useful raw evidence but are not product
  quality scores.

## Relationship to prior decisions

This extends decisions 0001 and 0002. It does not change the catalog-blind
Persona, fixed authored Actions, Judge authority, or deterministic World
boundary.

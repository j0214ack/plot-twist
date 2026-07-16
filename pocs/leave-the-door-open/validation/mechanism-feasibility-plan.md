# Mechanism Feasibility Validation

Status: Accepted implementation scope

## Purpose

Establish that the v3 Persona/Action Judge protocol has a usable mechanical
path. This validation does not evaluate fun, difficulty, pacing, discoverability,
or emotional impact.

## Stage A: Judge feasibility

For each fixed Action, supply authored Persona reply/MindState packets without
calling the Persona model:

- an unowned control state that rejects or distances itself from the Action;
- an owned answer state that expresses a concrete first-person possibility and
  a present willingness to perform the matching authored variant.

The configuration passes feasibility when the control does not progress and the
answer state surfaces and accepts the supplied Action/variant. Intermediate
latent/faint/surfaced boundaries are recorded without treating one exact
boundary as a game-experience requirement.

## Stage B: Persona reachability

Freeze the same Judge configuration and fixed Action. Starting from an authored
initial character packet, explore candidate player turns. Each Persona call
receives the accumulated visible conversation and current MindState, but never
the Action Catalog. After every turn, call awareness with the resulting Persona
state. If surfaced, call willingness. Stop successfully when an authored
matching variant is accepted or stop inconclusively when the technical search
budget is exhausted.

The search budget limits spend and runtime; it is not an acceptable gameplay
turn count. A finite failure to find a path cannot prove that no natural-language
path exists.

The initial positive paths cover:

- husband: move from holding the handle and avoiding a decision to removing the
  hand and leaving the existing gap unchanged;
- wife after observation: move from uncertainty about the neutral open-door
  Evidence to remaining at the threshold for one breath.

`remain_at_threshold` is a fixed NarrativeAction in this PoC. Entering,
touching, or changing the room are separate future Actions, not larger variants
of threshold waiting.

## Requirements

- **LDO-FEAS-001 — Judge existence:** Each Action has an authored unowned probe
  that does not progress and an authored owned probe that surfaces and accepts
  the matching supplied variant.
- **LDO-FEAS-002 — Fixed authority:** Judge outputs use only supplied Action and
  variant IDs; willingness runs only after surfaced awareness.
- **LDO-FEAS-003 — Catalog-blind reachability:** Persona inputs contain no Action
  IDs, variants, catalog descriptions, Judge outputs, or future effects.
- **LDO-FEAS-004 — Multi-turn state:** Each Persona turn receives prior visible
  conversation and the current bounded MindState. Each Judge receives the
  current Persona-owned reply/MindState.
- **LDO-FEAS-005 — Existence result:** A found path that produces an accepted
  matching authored variant is `reachable`. Exhausting a finite search budget
  without a witness is `inconclusive`, not a proof of non-reachability. Hard
  boundary violations are `invalid`. Path length is recorded, not graded as
  good or bad.
- **LDO-FEAS-006 — Evidence preservation:** Every request, raw output, parsed
  output, model, reasoning effort, latency, usage, turn, and decision is saved.
- **LDO-FEAS-007 — Honest boundary:** Automated results make no claim about fun,
  ideal strictness, ideal difficulty, or human discoverability.
- **LDO-FEAS-008 — Spend boundary:** A live replay has a preconfigured maximum
  call count enforced before invoking the model. The saved Wife state replay
  permits at most two low-effort Judge calls. Medium is a separate explicit run
  only if low does not produce a witness, with four calls as the combined
  low/medium ceiling.

## Initial configurations

- model: `gpt-5.6-luna`
- reasoning effort: start with `low`; use `medium` only when low does not
  produce the requested witness or a comparison is explicitly required
- one run per probe/path for mechanism discovery
- fresh Responses API context for every role call; accumulated conversation is
  passed explicitly

Repeated statistical validation and human playtests are later phases.

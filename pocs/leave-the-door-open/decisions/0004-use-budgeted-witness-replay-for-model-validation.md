# 0004: Use Budgeted Witness Search and Saved-State Replay for Model Validation

Status: Accepted

Date: 2026-07-16

## Context

Persona reachability can pass through an unknown number of intermediate states.
A one-turn requirement is too strict, while a fixed multi-turn limit would turn
an unvalidated game-experience hypothesis into a mechanism gate. Exhaustively
branching natural-language conversations with the live target model is neither
finite nor affordable.

The first live smoke also called a separate model evaluator for every fixture.
That evaluator added cost and once failed by confusing an accepted intention
with an already executed World effect. At the same time, the experiment had
already paid for useful Persona states that could isolate later Judge tests.

## Definitions

- **Witness:** one complete saved packet or trajectory demonstrating that the
  target mechanism can succeed.
- **Saved-state replay:** send an already recorded Persona reply/MindState to a
  Judge without regenerating the Persona.
- **Search budget:** a technical ceiling on paid calls or explored paths. It is
  not a claim about acceptable gameplay length.

## Options considered

1. **Require one-turn success.** Cheap, but rejects valid gradual psychological
   movement and conflates Persona reachability with Judge strictness.
2. **Require success within a fixed number of turns.** Bounded, but the number
   would encode an untested pacing decision.
3. **Expand a live branching search tree.** More likely to find a path, but cost
   grows quickly and failure inside any finite tree still does not prove that no
   path exists.
4. **Use a third LLM to grade every call.** Convenient for semantic summaries,
   but adds another stochastic authority, cost, and failure mode.
5. **Use budgeted positive-witness search, saved-state replay, deterministic
   gates, and human review.** Accepted.

The shared assumption is that mechanism existence can be demonstrated by a
positive witness, while experience quality requires later human evidence.

## Decision

1. Persona reachability is a positive-witness search. Finding a path proves
   `reachable`; not finding one within a finite budget returns `inconclusive`,
   not `unreachable`.
2. Hard schema, information, authority, and fixed-ID violations return
   `invalid` regardless of search budget.
3. Candidate player strategies may be generated offline by humans or
   non-API sub-agents. Target-aware paths must be labeled `oracle-assisted` and
   cannot be cited as proof of human discoverability.
4. Paid target-model validation explores only selected linear paths unless a
   separately approved budget authorizes branching.
5. Saved Persona states may be replayed when Judge behavior is the variable
   under test. The replay must preserve source provenance and the exact packet.
6. Low reasoning runs first. Higher effort runs only when the lower effort does
   not produce the required witness or when a separately defined comparison is
   the objective.
7. A hard maximum call count is enforced before invoking the paid adapter.
8. Deterministic checks own schema, ID membership, phase order, decision/variant
   consistency, source membership, and budget enforcement.
9. A model evaluator is optional and never the sole authority for a feasibility
   verdict. Raw outputs and human inspection remain available.
10. Stop paid execution as soon as the requested existence witness is found.

## Consequences

- Live validation cost is explicit and bounded.
- Persona and Judge configurations can be compared without paying to regenerate
  every upstream state.
- A saved witness can be reinterpreted when a rubric changes.
- `inconclusive` avoids overstating finite-search failures.
- Oracle-assisted success remains clearly weaker than a human-playtest result.
- Statistical reliability, latency distributions, and production cost remain
  separate future experiments.

## Evidence

Run 003 replayed a saved Wife Persona state into the corrected
`remain_at_threshold` Action. Luna low surfaced and accepted the matching
variant in two calls, so the experiment stopped without calling medium or a
model evaluator.

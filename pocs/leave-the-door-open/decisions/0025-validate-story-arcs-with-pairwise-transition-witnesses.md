# 0025: Validate Story Arcs with Pairwise Transition Witnesses

Status: Accepted

Date: 2026-07-16

## Context

Replaying an entire chapter with an uninformed Agent is useful evidence about
discoverability, but it is too slow and entangled to be the primary development
loop for every new story beat. One late failure can require replaying many
already-working days, while the result still does not identify which local
psychological transition was unreachable.

The story will have authored canonical history and authored psychological
nodes. During development, the immediate engineering question is narrower:
does at least one short conversational path exist from each node to its next
authored node without violating the production Persona, Judge, and Controller
boundaries?

This decision defines a **shot** as one complete local conversational cycle:

```text
one player thought
  -> one Persona reply
  -> one Judge transition decision
  -> Controller validation and persistence
```

A **pairwise transition witness** is a saved sequence of at most three shots
that moves the real runtime protocol from one declared canonical psychological
node to the next.

## Options considered

1. **Require a fresh end-to-end Agent completion for every story change.** This
   exercises discovery but makes local story development serial, expensive,
   and hard to diagnose.
2. **Directly hand the target state to a simplified Judge or set it in test
   state.** This is fast but proves only mutation plumbing; it can pass when no
   Persona conversation could ever produce the transition.
3. **Show the target node to a model so it can generate a successful path.**
   Useful for authoring candidates, but not valid reachability evidence because
   the role can merely restate the requested answer.
4. **Pre-author short player inputs, then replay them through the production
   target-hidden protocol one edge at a time.** Accepted. This proves existence
   cheaply while preserving the same information and authority boundaries as
   play.

All four options share an assumption that local reachability composes into a
potential full path. That assumption is acceptable only when node fixtures also
preserve the World, Evidence, disclosure, and memory preconditions inherited
from prior canonical nodes. Human and occasional end-to-end play remain needed
to catch pacing, motivation, and global continuity failures.

## Decision

1. Author the stable story truth before implementing a chapter arc.
2. Express each causal beat as a canonical node containing at least:
   - its stable story/history references;
   - the exact starting authored MindState statuses;
   - required World, Evidence, disclosure, and actor-memory eligibility;
   - the next node's required MindState statuses.
3. Develop and validate each adjacent edge independently. Different edges may
   be evaluated in parallel once their node contracts are frozen.
4. A fixture may contain up to three pre-authored player thoughts. Those
   thoughts are witness inputs, not dialogue suggestions shown to players.
5. Persona and Judge receive exactly their production packets. Neither role
   receives the target node, expected transition list, preferred wording,
   future Action, or the fact that the fixture is expected to pass.
6. A witness passes only when the production Controller accepts and persists
   the required forward MindState statuses. Unknown, stale, regressive, or
   unsupported transitions remain failures.
7. The witness record preserves every input, Persona reply, Judge output,
   Controller-accepted transition, model/prompt version, and starting node.
8. A witness found in one to three shots establishes `reachable`. Failure to
   find one establishes `no witness yet`, not psychological impossibility.
9. Shot count is a development bound, not a claim about acceptable player
   difficulty or the number of turns a real player should need.
10. Human playtests decide whether the player knows what to try, wants to keep
    playing, believes the movement, and experiences the chapter as too easy,
    difficult, slow, or repetitive.

## Requirements

- **LDO-WITNESS-001 — Production protocol:** a transition witness uses the
  production Persona, transition Judge, Controller validator, and authored
  MindState graph.
- **LDO-WITNESS-002 — Target-hidden roles:** target statuses and future nodes
  never enter Persona or Judge packets.
- **LDO-WITNESS-003 — Canonical preconditions:** a node fixture carries all
  World, Evidence, disclosure, and memory eligibility on which the edge relies.
- **LDO-WITNESS-004 — Three-shot development bound:** a saved witness contains
  one to three complete shots.
- **LDO-WITNESS-005 — Parallel independence:** an edge fixture may depend only
  on its frozen starting/target node contracts, not another edge's live model
  session or accidental transcript.
- **LDO-WITNESS-006 — Existence only:** automated reachability does not score
  discovery, pacing, difficulty, emotional credibility, or fun.

## Consequences

Chapter development can proceed as many small causal-edge experiments rather
than one long Agent run. Failed edges are local and rerunnable. An occasional
fresh end-to-end Agent run remains a composition smoke test, while human play is
the product-quality authority.

This extends ADR 0003's separation of reachability from human experience, ADR
0004's saved witnesses, ADR 0015's frozen-contract parallelism, and ADR 0017's
Judge-owned finite transitions. It does not authorize a mock language parser,
keyword router, preset player skill system, or alternate simplified Judge.


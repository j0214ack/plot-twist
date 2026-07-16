# 0015: Parallelize Causal Beats Only Behind Frozen Contracts

Status: Accepted

Date: 2026-07-16

## Context

ADR 0012 separates whole-chapter authoring from causal-beat implementation.
Once the Chapter 1 arc is fixed, the door, threshold, entry, and window beats
contain meaningful independent design and test work. Sub-agents can reduce
latency, but all agents share one working tree and the current implementation
concentrates scheduling, World state, Controller orchestration, and terminal
flow in common files.

Naively assigning every beat at once would cause overlapping edits and allow a
later beat to invent assumptions that contradict an earlier postcondition.

A **beat contract** is the frozen boundary supplied to one implementation
worker: starting World/story state, hard prerequisites, actor, fixed Action and
label, intended psychological region, routine/HintBrief inputs, authored
postcondition, Evidence/observation effects, projection boundary, and tests the
beat must satisfy.

## Options considered

1. **Keep all Chapter implementation sequential in the main agent.** This is
   simple to coordinate but leaves independent fixture, checkpoint, and leaf
   module work unnecessarily serialized.
2. **Give the full Chapter spec to several agents and let all edit freely.**
   This maximizes apparent activity but creates shared-file conflicts, duplicate
   abstractions, and incompatible state assumptions.
3. **Build shared foundations once, freeze beat contracts, parallelize disjoint
   leaf work, then integrate in causal order.** Accepted. It gains useful
   concurrency while preserving one authoritative state graph.

All options assume causal beats are the right implementation unit. Their story
states remain sequential even when their code, fixtures, or paper probes can be
produced concurrently.

## Decision

1. The main agent owns shared Chapter foundations and integration:
   - absolute day/time and schedule progression;
   - focus selection and safe projection;
   - conversation quota and no-intention resume;
   - Character Core packet contract;
   - shared World/story types and terminal chapter lifecycle.
2. A beat may be delegated only after its contract is written in the accepted
   chapter specification and its dependencies are named.
3. Parallel implementation agents receive mutually exclusive file scopes. They
   may add beat-specific modules, tests, fixtures, and checkpoint reports, but
   must not edit shared foundation files or another beat's files.
4. Every behavior change still follows traced Red → Green → Refactor. A beat
   agent must report the failing test it observed, the minimal implementation,
   targeted passing evidence, and any contract ambiguity.
5. Agents working ahead may test their beat against authored starting fixtures;
   they may not claim end-to-end completion until the main agent integrates all
   preceding real postconditions.
6. The main agent reviews outputs and integrates beats in causal order:
   `open_door_a_crack → remain_at_threshold → step_inside_room → open_room_window`.
   Full tests run after cross-cutting integration and before live evaluation.
7. Paper/player checkpoints that share no generated state may be delegated in
   parallel immediately. A checkpoint that consumes another checkpoint's output
   remains sequential.
8. `implementation-log.md` is append-only from this decision onward. Historical
   entries are never rewritten or deleted; corrections and superseding
   conclusions are new entries.
9. The main agent is the single log writer. Sub-agents return a structured log
   payload with objective, authorization, artifacts, Red/Green evidence,
   friction, reusable lesson, and next boundary. The main agent appends it only
   after reviewing the work.

## Consequences

- Concurrency is used for genuinely independent work instead of shared-file
  races.
- Shared foundations become an explicit prerequisite rather than being
  reimplemented per beat.
- Later beats can be prepared against fixtures while remaining honest about
  missing integration evidence.
- The log preserves failed approaches and later corrections, which makes it
  useful for Chapter 2 and 3 rather than a retrospectively polished narrative.
- Root integration remains a sequential bottleneck by design because the story
  state itself is sequential.

## Relationship to accepted decisions

This operationalizes ADR 0012's causal-beat workflow and ADR 0013/0014's shared
character and interaction foundations. It does not change fixed Action
ownership, deterministic World authority, TDD requirements, or the evidence
hierarchy.


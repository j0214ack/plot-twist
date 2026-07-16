# 0007: Record Local Playtests Outside GameState and Rendering

Status: Accepted

Date: 2026-07-16

## Context

The first human terminal playtest exposed a non-incremental Persona loop, but
the terminal retained no durable transcript, model result, Judge decision, or
configuration. The player recovered only a truncated visible excerpt. The next
test will use an uninformed Codex agent as the player while a separate observer
assesses every input/output pair and decides whether to continue, flag, pause,
or stop.

ADR 0002 forbids renderers from reading private MindState or Judge state. ADR
0005 keeps conversation history and orchestration in GameController, and ADR
0006 isolates model roles. Observation must preserve all three boundaries: the
player agent receives only the rendered screen, while the observer may retain
the hidden mechanism evidence needed to diagnose a failure.

## Pattern definition

The recorder is an append-only observation adapter at the application
composition root. It copies player-visible I/O, model-port I/O, and Controller
snapshots into a local evidence file. It is not event sourcing: the game never
rebuilds state from the log, and the log cannot dispatch commands or affect a
decision.

## Options considered

1. **Do not persist anything; rely on chat and terminal scrollback.** Smallest,
   but already failed: the TTY clears screens and the first report was
   truncated.
2. **Record only terminal screens and player input.** Preserves the black-box
   experience but cannot distinguish Persona, Judge, or Controller failures
   that render the same visible outcome.
3. **Expose private state through UIView so one renderer can log it.** Rejected:
   it weakens the player information boundary and makes an accidental leak
   likely.
4. **Add an append-only recorder at the composition root and wrap the
   StructuredRoleModel.** Accepted. The root already owns the terminal output,
   input loop, model construction, and Controller instance, so it can observe
   exact boundaries without changing their ownership.
5. **Turn the Controller event log into an event-sourced telemetry system.**
   Unnecessary for a local PoC and would make observation part of runtime
   correctness.

All options assume the observer is allowed to see more than the uninformed
player. If a later evaluation asks whether a diagnosis is possible from player
evidence alone, it can filter the same log to `player` visibility instead of
changing the game boundary.

## Decision

1. Every local terminal session opens a durable append-only JSONL log before
   the first rendered screen.
2. Every record contains schema version, session ID, monotonic sequence,
   timestamp, visibility (`player` or `observer`), event type, and event data.
3. Player visibility records exact rendered screens and raw submitted inputs.
4. Observer visibility records model role requests, parsed structured results,
   usage/latency, failures, and a Controller snapshot after each handled input.
5. The recorder never receives process environment values, authentication
   material, or API keys. Logs are local ignored artifacts; curated playtest
   observations may be committed separately.
6. Recorder failure aborts the playtest rather than silently running an
   unobserved evaluation.
7. Qualitative assessments reference exact sequence ranges and use a fixed
   rubric plus one of `continue`, `flag`, `pause_and_discuss`, or `stop`.
8. The uninformed player receives only the latest player-visible screen and its
   own remembered interaction. It never receives observer events, source files,
   Judge output, hidden state, or optimization instructions.
9. The recorder is passive. It cannot dispatch commands, call roles, select an
   Action, modify Controller state, or change rendering.

## Consequences

- A visible conversational failure can be paired with the exact Persona and
  Judge evidence that produced it.
- Agent and human playtests use the same terminal surface and logging boundary.
- Raw local logs may contain private story mechanism data and must not be used
  as player input.
- The recorder adds synchronous local file I/O, acceptable for this development
  surface but not a production telemetry architecture.
- Qualitative judgment remains an observer responsibility rather than a new
  model-based gameplay rule.

## Supersedes

No accepted decision is superseded. This supplies the evidence preservation
required by the evaluation strategy while preserving decisions 0002, 0005,
and 0006.


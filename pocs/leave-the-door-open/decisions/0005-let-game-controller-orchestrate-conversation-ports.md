# 0005: Let the Game Controller Orchestrate Persona and Judge Ports

Status: Accepted

Date: 2026-07-16

## Context

The deterministic vertical slice has a debug `select_action_option` command
that immediately commits a hard-eligible Action. A human-playable flow cannot
give that command the same meaning: a player dialogue must first produce a
Persona-owned state, awareness must surface an authored Action, and selecting
it must pass willingness before the World receives an intention.

ADR 0002 already assigns semantic interaction state and service dispatch to the
Game Controller. ADR 0001 assigns generated dialogue to a catalog-blind Persona,
psychological Action decisions to one two-phase Judge, and effects to the
deterministic World.

## Pattern definition

This uses ports and adapters narrowly: the Controller depends on small async
Persona and Action Judge capability interfaces, while test fakes and a later
live-model adapter implement them. It is not a plugin system, service locator,
second process, or generic workflow engine.

## Options considered

1. **Keep the debug flow and postpone integration.** This changes nothing, but
   cannot produce a human-playable conversation or test the actual authority
   chain.
2. **Let the terminal call Persona, Judge, and World in sequence.** This keeps
   the Controller small, but makes an input adapter the owner of game rules and
   prevents another renderer/input stack from reusing the same semantics.
3. **Add a second conversation controller around the current Controller.** This
   separates async code, but creates two owners for selected NPC, options,
   pending state, errors, and snapshot timing.
4. **Let the existing Game Controller orchestrate injected Persona and Judge
   ports.** Accepted. It follows the existing semantic ownership boundary and
   adds no second state machine.
5. **Inject one opaque service that returns an intention.** Fewer interfaces,
   but it hides phase order, hard-eligibility filtering, fixed-ID validation,
   and willingness from the Controller that must enforce them.

All options assume model latency is asynchronous. The question is which layer
owns the semantic sequence, not whether a particular UI waits synchronously.

## Decision

1. The existing Game Controller owns conversation history, bounded private
   MindState, surfaced options, pending/error state, and phase order.
2. A `PersonaPort` receives catalog-blind context and returns only dialogue plus
   a bounded MindState patch.
3. An `ActionJudgePort` exposes separate awareness and willingness operations.
   It receives only World-filtered, authored candidates for the relevant phase.
4. The Controller validates every returned Action and variant against exactly
   what it supplied before changing UI state or committing to the World.
5. Authored Action definitions have one data source shared by deterministic
   World eligibility/commitment and Controller-built Judge requests. UI labels
   remain a safe projection of that data.
6. The deterministic debug factory remains available for the existing headless
   slice. A separate conversation factory requires ports and never uses the
   debug bypass.
7. Commands that require a port call return an awaitable result; synchronous
   World/debug commands preserve their existing immediate behavior and error
   semantics.
8. Renderers receive only projected semantic state. They never receive ports,
   raw model packets, private MindState, internal IDs, or orchestration methods.

## Consequences

- The same conversation rules can drive terminal, browser, or visual input.
- Deterministic fakes can prove phase order without imitating natural language.
- Catalog blindness and fixed-ID validation are testable at the Controller
  boundary.
- Debug and human paths remain visibly different capabilities.
- The Controller gains asynchronous interaction states, so concurrency and
  safe error behavior require explicit tests.
- Prompt construction, retries, provider details, and spend reporting remain
  adapter concerns for a later phase.

## Supersedes

No accepted record is superseded. This applies decisions 0001 and 0002 to the
human-playable text slice.


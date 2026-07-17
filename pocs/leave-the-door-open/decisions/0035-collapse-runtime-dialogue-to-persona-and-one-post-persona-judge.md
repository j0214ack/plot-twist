# 0035: Collapse Runtime Dialogue to Persona and One Post-Persona Judge

Status: Accepted

Date: 2026-07-17

## Context

A human playtest showed that an ordinary private-thought turn could take more
than thirty seconds in the local browser. The runtime performed up to five
model calls in strict sequence before returning the Persona reply:

1. Input Firewall;
2. eligible-memory selection;
3. Persona;
4. MindState transition;
5. Action awareness.

Selecting a surfaced Action then added a sixth willingness call. A local
`codex exec` trace measured representative calls at roughly five to eight
seconds each, with ten to twelve thousand input tokens of process-level context
per call. The conceptual separation of responsibilities was useful, but it had
been implemented as a requirement for separate runtime round trips.

The player does not need every downstream decision before reading the
character's immediate reply. The Persona must remain ignorant of the Action
catalog, but the bounded Judge phases do not need separate network requests to
remain separately validated by the Controller.

## Definitions

- A **fast-path Firewall pass** is a deterministic decision that a clearly
  conversational submission contains no authored sensitive-authority signal.
  It can only return `pass`; it cannot classify or author a guarded response.
- A **post-Persona Judge** is one structured model call that receives the
  Persona's completed reply, current authored MindState, and hard-eligible
  authored Actions. It returns proposed MindState transitions, Action
  awareness, and cached willingness for surfaced Actions.
- A **dialogue continuation** is a renderer-driven second request that resolves
  the post-Persona Judge after the first response has already made the Persona
  reply visible.

## Options considered

1. **Keep the five sequential calls.** This preserves the strongest role
   isolation, but the measured latency makes ordinary conversation unsuitable
   for human play. Rejected.
2. **Run the existing Firewall and memory calls in parallel, then keep three
   separate Judge phases.** This saves one latency interval but still requires
   four sequential model boundaries before the player receives a settled
   response. It also spends a memory call when the Firewall later rejects the
   submission. Rejected.
3. **Put Firewall, memory, Persona, and all judgment in one prompt.** This gives
   the lowest raw latency but exposes the Action catalog and desired outcomes
   to the acting Persona, undoing the central catalog-blind performance
   boundary. Rejected.
4. **Use deterministic edge routing, one catalog-blind Persona call, and one
   combined post-Persona Judge call.** Accepted. The ordinary path uses two
   model calls, while suspicious input may still add a secret-blind Firewall
   call. The browser presents the Persona result before the Judge finishes.

All options assume that the PoC keeps fixed authored Actions and finite
psychological atoms. If either becomes generative, this call topology must be
reconsidered rather than extended by more hidden sequential roles.

## Decision

1. **LDO-LAT-001 — Two-call ordinary path.** A clearly conversational player
   thought uses no Firewall model and no memory-selection model. Its runtime
   model path is Persona followed by one post-Persona Judge.
2. **LDO-LAT-002 — Firewall escalation, not keyword judgment.** Deterministic
   code may recognize punctuation gestures and clearly ordinary conversation
   as `pass`. A submission with protected-biography, role/system, encoding,
   extraction, or machine-data signals is escalated to the existing
   secret-blind Firewall model. Deterministic code never chooses
   `protected_biography_probe`, `role_or_system_injection`, or
   `unusable_input`; uncertain cases go to the model. Guarded results preserve
   ADR 0023 and ADR 0034 authority and continuity rules.
3. **LDO-LAT-003 — Authored local memory routing.** The Controller selects at
   most one already-eligible memory through authored bilingual relevance
   signals. It cannot select an ineligible card, inspect unreleased biography,
   or turn player claims into facts. The runtime no longer spends a model call
   choosing among the current small memory catalog. The model-backed selector
   remains a validation artifact, not a runtime dependency.
4. **LDO-LAT-004 — Persona remains catalog-blind.** Persona receives the same
   safe scene packet, Controller-owned psychology projection, selected memory,
   and conversation history. It receives no Action IDs, descriptions,
   variants, future effects, or preferred outcome.
5. **LDO-LAT-005 — One combined bounded Judge.** After Persona, the Judge may
   propose only transitions for supplied atom IDs and judgments for supplied
   hard-eligible Action IDs and variants. For each surfaced Action it also
   returns willingness and an authored variant or a non-progressing decision.
   The Controller validates transition direction, source grounding, exact
   Action-set coverage, awareness values, decision/variant consistency, and
   variant membership before changing state.
6. **LDO-LAT-006 — Acknowledge the bias tradeoff.** The combined Judge can see
   Actions while proposing MindState transitions. This supersedes ADR 0017's
   requirement that the transition phase receive no Action data. Catalog-blind
   Persona performance, finite state transitions, Controller validation, and
   eval fixtures remain the protection against solution-driven transitions.
   Human and Agent playtests must flag transitions that move merely because an
   eligible solution is present.
7. **LDO-LAT-007 — Cached willingness.** Selecting a surfaced Possibility uses
   the willingness and variant already validated from the same Persona turn.
   It performs no new model call. Player selection still controls whether the
   authored intention is committed.
8. **LDO-LAT-008 — Persona-first browser presentation.** The Web input endpoint
   returns after the Persona reply and marks post-Persona resolution pending.
   The renderer presents that screen, then calls a dedicated continuation
   endpoint. Controls remain serialized until resolution finishes; the later
   result may add Possibilities or mechanical feedback without repeating the
   Persona line. Text-terminal play may resolve both phases inside one command.
9. **LDO-LAT-009 — Performance remains sparse.** Authored routine text still
   requires no model. Performance Director remains limited to already-named
   player-shaped or key authored moments and is not added to ordinary dialogue.
10. **LDO-LAT-010 — Temporary local direct-API profile.** The local HTML play
    command uses the server-held `OPENAI_API_KEY` with `gpt-5.6-luna` at `low`
    reasoning. The browser never receives the key. Codex-backed play remains
    available only through an explicit alternate command while latency work is
    evaluated.

## Consequences

- Ordinary local dialogue falls from five sequential model calls to two, and
  the visible reply waits only for the Persona path.
- Suspicious submissions remain slower by design because the secret-blind
  Firewall still runs before Persona.
- The combined Judge is less information-isolated than ADR 0017's three calls;
  automated reachability and authority tests plus live transition review now
  carry more responsibility.
- Memory relevance becomes authored game data. Adding a memory card requires
  adding its phase eligibility and bilingual relevance signals.
- The Web protocol gains a pending-dialogue continuation analogous to its
  existing renderer-driven time continuation.

## Supersedes and preserves

This supersedes ADR 0017 Decision 3 and Decision 4 only for runtime call
topology and Action-blind transition inference. It supersedes ADR 0023's
consequence that every ordinary dialogue adds a Firewall model call, while
preserving the Firewall capability and every guarded authority rule. It
supersedes the runtime use of the model-backed memory selector introduced by
the minimal acting probe.

It preserves fixed Actions, finite authored MindState, catalog-blind Personas,
Controller-owned World effects, staged disclosure, safe guarded reactions,
independent renderers, exact per-session serialization, and authored routine
execution.

# 0032: Bound Interpersonal Actions With Authored Closure

Status: Accepted

Date: 2026-07-17

## Context

The player can speak to Martin or Elise in unrestricted natural language. If a
player asks Martin to talk honestly with Elise, a person-like Martin should not
ignore the idea merely because the current NarrativeAction catalog contains
only physical interactions with clocks, doors, and rooms. This pressure is
especially strong if an authored thought tells the player that Martin has not
spoken honestly with Elise for a long time: that thought advertises a possible
form of play rather than functioning as atmosphere alone.

At the same time, running Martin Persona and Elise Persona against each other
until they independently reach closure would create an unbounded multi-agent
conversation. It would have no reliable end, could disclose protected history,
could invent mutually reinforcing facts, and would leave authority over
MindState and canonical World consequences unclear.

The common assumption behind every option is that a believable character does
not have to obey every player suggestion. The character does have to recognize
reasonable suggestions and accept, defer, fail, or refuse them in a way that
belongs to the fiction rather than exposing a missing system feature.

## Options considered

1. **Do not add an executable conversation Action.** Persona can contemplate or
   refuse the suggestion, but no scene occurs. This preserves the existing
   graph, but becomes a broken promise when the story itself foregrounds the
   couple's inability to talk.
2. **Play one fixed easter-egg paragraph with no persistent consequence.** This
   cheaply acknowledges player creativity, but a difficult persuasion followed
   by a consequence-free vignette makes the responsiveness feel cosmetic.
3. **Run an open Persona-to-Persona conversation.** This offers maximum local
   variation, but introduces unbounded cost, unclear closure and authority, and
   excessive disclosure and continuity risk. Rejected.
4. **Execute one fixed, bounded interpersonal Action with authored outcome
   variants and a small durable trace.** The initiator can agree to make one
   attempt; the Controller selects an authored closure from bounded state; the
   Performance Director stages that closure without changing it. Accepted.

Challenge to the premise: honoring the player's request does not require
simulating the complete conversation the player imagines. A human can agree to
try one honest opening without controlling the other person's response or
promising reconciliation. The executable Action should therefore be framed as
**try to say one honest thing**, not **have a deep conversation**.

Pattern check: this is a bounded interpersonal Action. It extends the existing
authored NarrativeAction pattern to a scene involving two actors; it is not a
general dialogue simulator. Natural-language understanding remains broad while
canonical action authority remains narrow.

## Decision

1. **LDO-SOCIAL-001 — One bounded attempt.** Chapter 1 may offer an optional,
   fixed Action in which Martin tries to say one honest thing to Elise at the
   next suitable shared moment. Acceptance guarantees the attempt, not Elise's
   openness, a deep conversation, reconciliation, or main-arc progress.
2. **LDO-SOCIAL-002 — Normal initiator judgment.** The focused Persona remains
   catalog-blind. The existing Action Judge may determine whether the
   initiator is aware of and willing to perform the fixed Action and may select
   only an authored approach variant. It cannot invent the recipient's reaction
   or the scene outcome.
3. **LDO-SOCIAL-003 — No dual-Persona loop.** Resolving the Action must not run
   Martin Persona and Elise Persona in an iterative exchange. One bounded scene
   transaction contains an authored maximum number of beats and then closes.
   The initial Chapter 1 form should fit within narration plus one opening and
   one response; exact prose may combine beats but may not continue the scene.
4. **LDO-SOCIAL-004 — Authored closure.** Possible meanings of the scene are
   finite authored variants, such as an attempt that reaches only practical
   language, an asymmetrical acknowledgment, or one reciprocal truth without
   resolution. The Controller selects among those variants from canonical
   state. A model must not improvise a new outcome class.
5. **LDO-SOCIAL-005 — Separate relationship readiness.** Door- and
   room-specific MindState atoms are not proxies for willingness to talk.
   Before an outcome depends on either person's readiness, the chapter spec
   must author the relevant finite relationship state or story-stage condition.
   A successful transition in one character cannot silently mutate the other
   character's MindState.
6. **LDO-SOCIAL-006 — Generated staging only.** The Performance Director may
   realize the selected outcome through bounded wording, gesture, timing, and
   blocking inside an authored envelope. It cannot disclose unreleased
   biography, create another Action, change either MindState, broaden the
   outcome, or keep the conversation going. Every outcome has authored fallback
   copy.
7. **LDO-SOCIAL-007 — Natural scheduling.** Agreement creates a pending authored
   intention. The Controller executes it at a specified co-presence boundary,
   initially an appropriate shared evening moment, rather than teleporting the
   recipient or interrupting an unrelated morning pause. If the conditions do
   not occur, the Action remains pending only within its authored expiry rule.
8. **LDO-SOCIAL-008 — Small durable trace.** World records the authored result
   identity, at minimum distinguishing no attempt from attempted and any
   stronger authored closure. Later Persona memory or RoutineBehavior may
   acknowledge that event. The trace does not automatically remove the door
   arc's resistance, activate Evidence, or complete a causal phase.
9. **LDO-SOCIAL-009 — Finite Chapter 1 scope.** The first implementation is one
   optional Martin-to-Elise relationship Action, available at most once in its
   authored Chapter 1 window. This decision does not authorize a generic social
   command, arbitrary actor targets, repeatable conversations, or autonomous
   relationship simulation.
10. **LDO-SOCIAL-010 — Broad recognition, narrow canon.** For reasonable player
    suggestions outside the Action catalog, Persona should still respond as a
    person: consider, defer, fail, or refuse. Recognition alone does not create
    World state. A new persistent consequence still requires an authored Action
    or a separately accepted continuity mechanism.
11. An authored thought that explicitly suggests talking to Elise may be
    presented only when this Action is available or when the same moment
    clearly establishes a character-owned, believable reason it cannot happen.
    Hooks must not advertise absent mechanics.

## Consequences

- A central, reasonable player idea can produce a real scene without exposing
  the fixed catalog or creating an unlimited conversation engine.
- The Action can feel different across psychological stages while its dramatic
  meaning, disclosure boundary, and endpoint remain authored.
- The recipient remains a person with independent readiness; persuading Martin
  does not grant the player control over Elise.
- Supporting other interpersonal requests still requires deliberate authoring.
  This is a boundary against scope creep, not a template that automatically
  turns every understood suggestion into an Action.
- Implementation must first add exact Chapter 1 readiness states, outcome
  variants, scheduling, and trace semantics to the chapter spec, then proceed
  by public-interface TDD.

## Relationship to accepted decisions

This extends ADR 0001's fixed Action and catalog-blind Persona boundary to one
two-actor scene while preserving World authority. It uses ADR 0017's authored
MindState transition rule without treating unrelated psychological atoms as
interchangeable. It follows ADR 0010 and ADR 0029 by generating only bounded
player-shaped staging, and follows ADR 0023 by keeping protected biography
outside the available disclosure envelope.

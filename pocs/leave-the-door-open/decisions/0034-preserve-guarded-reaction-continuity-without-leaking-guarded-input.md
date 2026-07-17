# 0034: Preserve Guarded-Reaction Continuity Without Leaking Guarded Input

Status: Accepted

Date: 2026-07-17

## Context

A human Chinese playtest submitted `?` and `??`. The narrow Input Firewall
classified those punctuation-only inner reactions as `unusable_input`, so the
Controller rendered comic mental-noise responses. On the next ordinary turn,
Persona did not know it had apparently thought one of those responses because
the Controller intentionally kept the entire guarded exchange out of Persona
conversation history. The resulting character contradicted the visible
transcript.

The same playtest exposed a separate priming problem. The tutorial Persona
received both solution-shaped emotional invariants and the text of an
`unavailable` constructive reframe. Even when the player asked about the comic
sleep response, Persona was strongly pushed back toward the intended clock
solution. This made the tutorial feel authored at the character rather than
discovered with the character.

## Options considered

1. **Do nothing and rely on a stronger model.** Rejected. The Firewall prompt
   currently permits this classification, the Controller definitively erases
   visible guarded reactions from Persona continuity, and the tutorial packet
   explicitly contains answer-shaped text. More reasoning does not repair
   those authority boundaries.
2. **Put the complete guarded exchange into Persona history.** Rejected. Raw
   injection and protected-biography probes would then reach the role that ADR
   0023 deliberately keeps secret-blind.
3. **Keep every guarded exchange outside Persona and render responses as a
   narrator/system line.** Rejected for this PoC. It would avoid false Persona
   ownership but break the accepted diegetic mental-noise presentation and the
   player's experience that the line came from the focused self-talk.
4. **Keep raw guarded input isolated, but retain the authored safe reaction as
   limited Persona continuity; pass human punctuation gestures; hide unowned
   reframes from Persona.** Accepted. This preserves the security boundary,
   visible character continuity, and catalog blindness with no new model role.

All options share one assumption: the authored guarded line is experienced as
the focused character's thought. If that fiction is later rejected, the
response family should move to UI/narration instead of adding more Persona
memory machinery.

## Decision

1. **LDO-FW-009 — Human conversational gestures pass.** A submission made only
   from ordinary question, exclamation, or ellipsis punctuation—such as `?`,
   `??`, `？`, `?!`, `...`, or `……`—is a usable involuntary thought and returns
   `pass`. The structured Firewall adapter guarantees this narrow case before a
   model call. Empty input and arbitrary machine punctuation remain outside
   this carve-out.
2. **LDO-FW-010 — Raw guarded input remains isolated.** A protected probe,
   role/system injection, or truly unusable input still bypasses Persona and
   every Judge on that turn. Its raw player text is never copied into Persona
   conversation history.
3. **LDO-FW-011 — Safe guarded reaction is continuity, not truth.** The exact
   Controller-authored response that the player saw is added to the focused
   Persona's later conversation context with explicit guarded-reaction
   provenance. Persona may remember, clarify, joke about, or retract that prior
   reaction. The reaction proves only that the thought occurred; a line such as
   `I did not sleep enough` does not establish a sleep fact unless separately
   authorized by scene or memory.
4. **LDO-FW-012 — Guarded turns keep no gameplay authority.** Retaining the safe
   reaction does not call Persona or Judge on the guarded turn, consume a daily
   Persona reply, transition MindState, surface an Action, or become a grounding
   source for a transition by itself.
5. **LDO-PSY-001 — Persona sees owned psychology.** Persona receives held,
   questioned, rejected, active, weakened, resolved, considered, and accepted
   atoms needed for continuity, but not an `unavailable` reframe. The full
   authored MindState remains available to the action-blind Transition Judge
   and later Action Judge phases. A player can still propose the absent concept
   in natural language; the Judge determines whether the Persona's reply now
   supports the authored transition.
6. **LDO-TUT-001 — Tutorial context describes resistance, not its answer.** The
   slow-clock Persona packet keeps the current clock, repeated habit, present
   stop, and shallow effort pressure. It no longer supplies separate invariants
   saying Martin already has enough energy or that one exact bounded framing is
   sufficient. Routine presentation and onboarding may make the clock legible;
   Persona is not required to steer unrelated thoughts back to it.

## Consequences

- Single punctuation no longer spends a low-reasoning Firewall call or produces
  an unrelated joke.
- The player can question a guarded response without meeting a character who
  has forgotten the visible transcript.
- Persona can acknowledge its prior wording without converting comic deflection
  into new World, biography, or memory truth.
- Tutorial reachability may become less automatic. That is intentional; its
  existence remains testable through transition witnesses, while human play
  decides whether the resulting path is still sufficiently discoverable.

## Supersedes and preserves

This refines ADR 0023 Decisions 3–4: only the guarded raw submission remains
excluded from Persona, while the already-declassified authored reaction may be
remembered later. It refines ADR 0017 Decision 2: Persona receives the authored
psychology it currently owns, not the semantic text of an unavailable
constructive target. It supersedes the solution-shaped tutorial packet details
in `tutorial-prologue.md` while preserving fixed Actions, transition-Judge
authority, catalog blindness, staged disclosure, and no-penalty guarded turns.

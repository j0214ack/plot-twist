# 0021: Let Tutorial Players Observe Before Acting

Status: Accepted

Date: 2026-07-16

## Context

The first human browser playtest pressed **Let time continue** before speaking.
This was a reasonable attempt to learn what ordinary life in the house looks
like. The runtime instead required a world intention and returned a correction.
At the same time, the browser displayed Husband and Wife focus controls even
though the accepted Three Minutes prologue permits only the Husband Persona.

Those two failures share one cause: the opening UI advertised the later
Chapter 1 interaction grammar while enforcing a narrower tutorial script. The
player did not violate a taught rule; the visible controls made promises that
the current state could not keep.

## Options considered

1. **Keep the intention gate and explain it more strongly.** This would make
   the script clearer but would still reject observation as a legitimate first
   move. It contradicts the game's later multi-day observation loop.
2. **Let a premature continue skip the tutorial.** This respects the button but
   removes the player's only guaranteed experience of the complete causal
   grammar.
3. **Expose both Personas during the tutorial.** This makes both focus buttons
   operational, but leaks Chapter 1 psychology into the clock vignette and
   increases the first screen's conceptual load.
4. **Allow repeatable observation while keeping the tutorial implicit and
   single-voice.** Accepted. Continue advances World time through a small
   ordinary Husband routine and returns at the next morning's slow-clock
   moment. The conversation and validated psychological progress remain. Focus
   controls and terminology appear only when Chapter 1 actually offers both
   spouses.

## Decision

1. **LDO-LOCAL-014 — Observation is a valid first move.** During an unfinished
   clock tutorial, `/resume` without an intention advances to the next authored
   slow-clock pause rather than rejecting the input. At least one ordinary
   routine cue must appear between pauses. No Action executes and the clock
   remains slow.
2. The observation cycle is repeatable. Tutorial clock eligibility and its
   decision point recur at the authored local time until the clock Action has
   completed. Validated MindState and conversation history remain available
   across those observations.
3. The Wife exists in World state throughout, but the tutorial's limited
   narrative camera does not present her during an unsuccessful observation
   day. The player follows several authored Husband routines across morning,
   midday, evening, and night before returning to the next clock pause. Her
   first presented appearance remains the authored observation of the corrected
   clock, immediately before Chapter 1. This is selective projection, not a
   claim that only one person inhabits the house.
4. The tutorial renderer does not show a `Focus:` label or focus controls. The
   Husband is simply the current inner voice. Directly typed legacy focus
   commands remain safe and non-mutating but do not teach the unavailable
   mechanic or confirm that another resident exists. Before tutorial success,
   player-facing guidance refers only to Martin and never promises a later
   person, household perspective, or additional inner voice.
5. **LDO-WEB-009 — Controls reflect current capabilities.** The browser starts
   with focus controls hidden and reveals them only when the safe server screen
   establishes Chapter 1. Resume, help, dialogue, and currently surfaced
   Possibilities remain available according to their existing boundaries.
6. Chapter 1 Day 1 is relative to the day after the tutorial succeeds, not to a
   hard-coded absolute calendar day. Spending several mornings observing the
   tutorial must not skip, renumber, or shorten Chapter 1.
7. Deterministic monkey smoke tests exercise the public play-session/controller
   input capability, not a renderer. They cover every command offered at the
   tutorial boundary plus empty/invalid input, repeated resume, and concurrent
   submission. They prove state safety and recoverability, not narrative
   comprehension or chapter completion. A separate thin projection regression
   may prove that unavailable focus controls are hidden without moving gameplay
   policy into the renderer.

## Consequences

- The tutorial still ends only through its real fixed Action, willingness,
  World execution, and observed trace; observation is not success.
- A curious player can learn the rhythm of one resident's ordinary day before
  deciding to intervene, while the later reveal of the other resident remains
  narratively honest.
- Browser controls stop advertising a Wife interaction that the game rejects.
- Chapter scheduling must derive its day number from the actual tutorial
  completion boundary.

## Supersedes

This supersedes ADR 0014 Decision 7 and its consequence that the tutorial
resume may require an intention. It refines ADR 0009's authored prologue and
ADR 0018's thin-browser control surface without changing Persona catalog
blindness, fixed Actions, Judge authority, or renderer mutation boundaries.

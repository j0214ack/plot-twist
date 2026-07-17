# 0014: Bridge the Tutorial into Directed Observation, Not a Solution Quest

Status: Accepted

Date: 2026-07-16

## Context

The clock tutorial teaches one complete success loop. It does not by itself
answer the player's next practical questions:

- What can I do when no Possibility is visible?
- Should I keep talking, watch the household, change focus, or let time pass?
- What is worth becoming curious about in Chapter 1?
- If a day ends without an intention, did anything useful happen?

The current compressed terminal avoids those questions by automatically moving
from the clock to the husband's door pause and by permitting `/resume` only
after an intention forms. That is sufficient for tutorial success grammar but
incompatible with ADR 0009 and ADR 0012, which allow main-story progress to
accumulate across days, routines, partial conversations, and pauses without a
new intention.

This record uses **directed observation** to mean: tell the player which world
thread is currently worth watching and which interaction verbs are available,
without naming the hidden Action or telling the player what conclusion to
produce.

## Options considered

1. **Add no Chapter 1 transition and trust world ambience.** This preserves
   mystery but risks presenting an inert house with no readable affordance.
   Mechanical solvability later in the chapter would not repair first-minute
   abandonment.
2. **Give a conventional solution quest, such as `Open the hallway door`.**
   This is operationally clear but leaks the authored Action, turns Persona
   conversation into execution friction, and narrows interpretation to the
   intended plot answer.
3. **Use directed observation plus explicit player verbs.** Introduce the
   chapter's observable tension, let routines demonstrate it, and remind the
   player that they may watch, pause, choose a person, talk, or resume without
   success. Accepted.
4. **Offer several mission threads immediately.** This may create agency later,
   but at the current content scale it adds menu complexity before the player
   has learned how a main-story day differs from the tutorial.

All options assume the player's desire to continue should be created through a
clearly framed mystery. If later human playtests show that free observation is
itself compelling, the amount of chapter guidance may be reduced without
changing the available interaction verbs.

## Decision

1. After the tutorial recap, show a distinct Chapter 1 transition. It must make
   clear that the guaranteed tutorial pace has ended and that progress may take
   more than one conversation or day.
2. The transition supplies two things, kept separate:
   - an **operational contract**: watch routines, pause at a meaningful moment,
     choose either spouse's inner voice, talk, and let time continue even when
     no intention forms;
   - a **narrative hook** grounded only in visible world facts: the household
     has resumed its ordinary routes, but both adults organize those routes
     around the closed room at the end of the hallway.
3. Guidance may say `Watch what each person does near the hallway` or ask `Why
   does this part of the house redirect both of them?` It must not say to open,
   enter, clean, or otherwise name or paraphrase an authored solution Action.
4. Chapter 1 begins with free-running, contrasting Husband and Wife routines
   before opening a conversation. A text adapter may present scheduled scenes
   rather than literal animation, but the player must receive world evidence
   before being asked for dialogue.
5. After the tutorial, the player can choose which visible spouse to focus at
   an eligible pause. Focus changes what Persona packet and moment are used; it
   does not expose private state or Action eligibility.
6. Main-story `/resume` can close a paused conversation and let World time
   continue without an intention. The UI must explicitly distinguish:
   - resuming with an intention, which schedules an authored Action;
   - resuming without one, which advances routines and preserves validated
     partial psychological progress but schedules no Action.
7. Tutorial guidance may still require an intention before its teaching
   `/resume`, because that bounded prologue's job is to demonstrate the full
   loop. Post-tutorial help must teach the broader main-story meaning instead
   of continuing the tutorial restriction.
8. A day or pause without an intention must still produce at least one legible
   new routine cue, observed fact, validated psychological distinction, or
   explicit conversation closure. Re-rendering the same barrier with no new
   clue is not acceptable pacing.
9. Chapter guidance belongs to safe UI projection. It cannot read private
   MindState, call an LLM, select an Action, or mutate the World. Its text is
   derived from authored chapter and observed-world state.

## Validation gates

Before implementing the full chapter, use fresh label-blind or uninformed
player probes at three boundaries:

1. **Transition comprehension:** From the tutorial close and Chapter 1 opening
   alone, can the player state what they may do next and name the visible
   question without guessing a hidden solution?
2. **First exploration:** After the opening routines, does the player choose a
   grounded person/moment to inspect rather than ask for unavailable controls,
   hidden biography, or a quest answer?
3. **No-intention continuation:** After one bounded conversation that produces
   partial movement but no Action, does the player understand how and why to
   resume time, and can they identify what they hope to observe next?

Agent probes can establish legibility and reveal confusion. Only a human
playtest can establish whether the hook is interesting enough to continue.

## Consequences

- Chapter 1 needs a real observation/focus/resume loop instead of a longer
  chain of automatically selected dialogue boxes.
- The tutorial terminal's intention-only `/resume` rule remains valid inside
  the prologue but no longer defines the main game.
- Authored routine contrast and chapter guidance become part of the playable
  chapter acceptance boundary.
- Motivation cannot be claimed from eventual Agent completion; first-minute
  comprehension and post-failure continuation must be recorded separately.

## Relationship to accepted decisions

This extends ADR 0009's transition into main-story pacing and ADR 0012's
multi-day causal-beat workflow. It preserves ADR 0001's catalog blindness, ADR
0002's projection/render boundaries, ADR 0003's human-experience authority,
and ADR 0010's authored HintBrief ownership.


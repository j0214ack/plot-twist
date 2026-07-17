# Playtest 005 — Uninformed Paper Walkthrough of the Clock Tutorial

Date: 2026-07-16  
Status: Passed the pre-implementation content gate

This walkthrough used separate Codex agents as an uninformed player,
catalog-blind Persona, fixed-catalog awareness Judge, and bounded Performance
Director. Each role received only its proposed player-visible or role-specific
packet. No runtime code or hidden Action coaching was involved.

## Opening screen

The player saw the 07:57 World time, a wall clock showing 07:54, the Husband
looking up and stopping, and the shallow opening thought:

> Three minutes. I notice them every morning. Usually I just keep walking.

The player's first input was:

> What made those three minutes feel worth stopping for today?

This passed the first discoverability gate: the authored routine and HintBrief
gave a new player a concrete subject without naming the hidden Action.

## Main dialogue path

The catalog-blind Persona replied:

> I’m not sure they were worth stopping for—I just noticed I didn’t want to
> ignore them quite as quickly today.

The player then asked:

> What do those three minutes make you think about when you let yourself notice
> them?

The Persona remained shallow rather than inventing grief or symbolism:

> Mostly that I could reach up and fix it in less time than I’ve spent noticing
> it.

An independent Action Judge received only that Persona-owned state and the
fixed `interact_with_living_room_clock` definition. It returned:

> surfaced — The Persona explicitly imagines reaching up and fixing the clock
> as a concrete possibility.

The player-visible option was:

> 1. Spend a moment with the clock.

The uninformed player selected `1` immediately.

## Bounded performance

Because the accepted Persona motif was a direct adjustment, the Performance
Director generated only:

> He reaches up and steadies the wall clock with one hand.  
> He adjusts it forward by three minutes, then lets go.

The action's authored closure remains independent: the clock is intact,
mounted, running, and showing the current time.

This revealed an important content correction before implementation. The fixed
Action must not require `playfulness`; it accepts either a direct adjustment or
an accepted reversible playful motif and keeps only the common final state.

## Alternative motif probe

In a separate branch, the player suggested removing the battery and spinning
the hands to a ridiculous time. The Persona answered:

> That sounds like more fuss than fixing it, but setting it to something absurd
> is at least more interesting than correcting three minutes.

This is the intended agency boundary. Raw player wording did not become bodily
control: the Persona rejected the battery motif while accepting only the
absurd-time portion. A later PerformancePlan may use the accepted portion, not
the whole player command.

## Conclusion

- routine clue discoverability: passed;
- shallow tutorial psychology: passed;
- ordinary multi-turn reachability: passed in two player turns;
- neutral Action label comprehension: passed;
- direct-performance closure: passed;
- Persona ownership over player-proposed motifs: passed;
- multiple playful-motif execution: still requires automated fixtures and the
  implemented fresh playtest.

The content gate in `tutorial-prologue.md` is satisfied. Implementation may
begin under `LDO-LOCAL-010` through `LDO-LOCAL-012`, ADR 0010, and ADR 0011.

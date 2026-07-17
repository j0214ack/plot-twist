# 0028: Bound Time Advancement with Safe Turn Windows

Status: Proposed; pacing requires human playtest before acceptance

> ADR 0029 accepts the `advance_turn` authority boundary and event-timepoint
> pulling for the current Web PoC. Fixed fifteen-minute windows and arbitrary
> Pause remain proposed.

Date: 2026-07-16

## Question

Should a player be able to pause at any moment, and should simulation time
advance in fixed turns such as fifteen minutes with quiet nights fast-forwarded?

The current implementation permits the World to pause at any integer minute,
but the player-facing play session advances only to authored interaction
moments. It does not expose an arbitrary Pause control.

## Constraints

- Generated performance is atomic and non-observable until it closes under ADR
  0010. A pause cannot expose a half-applied transient gesture as World state.
- Persona packets exist for authored visible activities and scene phases, not
  every arbitrary minute of the day.
- A visual renderer must not read the future schedule to decide where a pause
  is safe.
- Requiring dozens of empty fifteen-minute clicks would weaken the intended
  observation rhythm rather than create agency.

## Options considered

1. **Keep only authored pause moments.** This is simplest and always provides a
   designed scene, but the player cannot interrupt a long visual passage or
   inspect ordinary life on their own timing.
2. **Allow pause at any animation frame.** This feels immediate, but animation
   frames are renderer-local and may sit between semantic states. It would make
   camera/sprite timing accidentally define game truth. Rejected.
3. **Force every turn to be exactly fifteen minutes and return control after
   every turn.** This makes time legible but can produce sixty-four daytime
   clicks with no authored content. Not recommended without contrary human
   evidence.
4. **Use bounded semantic turn windows with safe interruption and empty-window
   coalescing.** Recommended. A daytime advance covers at most fifteen
   simulation minutes or stops earlier at the next authored event, semantic
   step, or interaction boundary. Presentation may automatically continue
   through adjacent empty windows unless the player requested Pause.

All four options assume that more frequent control automatically creates more
meaningful agency. Human play must challenge that assumption: the player may
care about the ability to interrupt when something catches their attention,
not about receiving control on a rigid clock grid.

## Recommended contract

1. Introduce an application command such as `advance_turn`; do not make the
   renderer call `World.advanceTo`.
2. During active daytime, an advance window ends at the earliest of:
   - the next authored event or interaction boundary;
   - the next safe semantic presentation step after a queued Pause request;
   - fifteen simulation minutes after the window begins.
3. A Pause click during animation queues a semantic pause request. It does not
   freeze midway through a sprite frame or generated Performance beat.
4. Consecutive windows with no cue, state change, or available interaction may
   be coalesced by the Presentation Coordinator. The renderer may show a clock
   sweep, ambient loop, walk, dissolve, or no-op transition.
5. Between 22:00 and 06:00, if no authored event exists in the interval, one
   overnight fast-forward batch advances directly to 06:00. If an event does
   exist, the authoritative scheduler ends the batch at or before that event;
   the renderer is not told the rest of the schedule.
6. At every returned-control boundary, the Controller supplies a valid safe
   WorldView and phase-appropriate UIView/Persona context. No arbitrary pause
   may create a dialogue opportunity without such a packet.
7. Turn duration and quiet-hour bounds are authored configuration and recorded
   in session logs. They are not LLM decisions.

## What remains a human decision

- whether a visible Pause button is useful when most turns are already short;
- whether fifteen minutes is the right maximum window;
- whether empty daytime windows should auto-chain immediately or play one
  ambient beat first;
- whether overnight fast-forward should always stop at 06:00 or at the first
  authored morning routine.

## Acceptance evidence required before runtime implementation

- a paper/fixture schedule demonstrates event-before-boundary, boundary-before-
  event, same-minute ordering, queued Pause, and empty overnight cases;
- deterministic tests prove no event is skipped or duplicated when windows are
  coalesced;
- a visual fake-clock test proves Pause takes effect only at a safe step;
- a human playtest compares authored-only pauses against bounded windows and
  checks whether the latter adds observation agency without creating empty
  clicking.

## Relationship to accepted decisions

This proposal would extend ADR 0012's authored schedule and ADR 0027's
PresentationBatch playback. It must preserve ADR 0002: renderer-local animation
time never becomes simulation time or a new mutation path.

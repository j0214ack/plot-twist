# 0027: Deliver Safe Presentation Batches to Animated Renderers

Status: Accepted design contract; not yet implemented

> ADR 0029 refines delivery: the current web adapter pulls one already-processed
> timepoint batch at a time instead of receiving a whole multi-timepoint batch
> before playback.

Date: 2026-07-16

## Context

ADR 0002 established renderer-neutral `WorldView` and `UIView` projections.
That is sufficient for a text snapshot, but an RPG-like renderer needs to know
which already-authorized visible moments belong to one time advance, their
order, and the simulation time shown at each moment. Otherwise it must either
snap straight to the final state or infer animation from cumulative prose.

The renderer must not gain the World schedule, future Actions, hidden Evidence,
MindState, or authority to advance time merely to animate smoothly.

## Options considered

1. **Keep only final `GameView` snapshots.** The renderer can diff before and
   after and animate generic movement. This is the smallest mechanism, but it
   cannot reliably distinguish two ordered events at the same location or map
   generated performance beats to the semantic state they stage.
2. **Expose the complete future World schedule to the renderer.** It would know
   every upcoming time, but it would also receive unreached story structure and
   could accidentally preview or depend on future beats. Rejected.
3. **Let the renderer poll the World for the next event time.** This hides event
   content but still makes presentation depend directly on simulation
   scheduling and creates a second clock-control path. Rejected for the
   turn-based PoC.
4. **Have an application-layer Presentation Coordinator deliver one safe,
   bounded batch after a semantic advance is authorized and before visual
   playback begins.** Accepted. The batch contains only already-processed,
   player-safe presentation steps plus the final safe projections.

The shared premise behind options 2–4 is that a renderer must know the next
*simulation* event before the game processes it. That premise is false for the
current turn-based structure: it only needs the complete visible batch before
it starts displaying that batch.

## Pattern definition

A `PresentationBatch` is a renderer-neutral playback plan for semantic changes
the authoritative game has already processed. It is not a World schedule, an
Action, an animation clip, or a command queue back into simulation.

## Decision

1. The Game Controller and World remain the only semantic time authorities.
2. After a command authorizes time advancement, the Controller/World and
   bounded Performance Director finish producing the safe visible result.
3. A Presentation Coordinator projects that result into one ordered
   `PresentationBatch` before handing it to a renderer.
4. The batch declares `fromTime`, `toTime`, and ordered steps. Every step has a
   monotonically increasing sequence, its simulation `at` time, renderer-neutral
   cues, and the safe visible World state after that step.
5. The renderer therefore knows every visible step time in the current batch,
   including the batch's ending time, before playback starts. It does **not**
   know the next batch's time while paused or before another command authorizes
   an advance.
6. Display duration, interpolation, camera motion, sprite easing, text reveal,
   and compression of long in-world gaps are renderer-local. They do not alter
   `at`, `fromTime`, `toTime`, or World state.
7. The UI renderer continues to consume `UIView` independently. The visual
   compositor may layer it over the World renderer, and the input adapter may
   keep semantic controls busy until playback completes.
8. Playback completion is an application-level acknowledgement only. It may
   release input or discard the batch; it cannot execute Actions, apply
   Evidence, or advance the World.
9. A missing animation mapping falls back to a neutral cue/subtitle and then
   snaps to the supplied safe visible state. The renderer may not invent a
   durable change.
10. A future free-running or network-streamed world that must continuously
    prebuffer unreached events requires a new decision. This ADR does not expose
    the future schedule preemptively.

## Consequences

- An RPG-like renderer can animate a whole time jump with foreknowledge of the
  current playback batch while remaining blind to later story beats.
- The semantic World may already be at `toTime` while the renderer is visually
  playing earlier batch steps. Input is therefore locked or explicitly queued
  until presentation catches up.
- Reload or animation failure can safely discard local interpolation and render
  the batch's final `WorldView`/`UIView` immediately.
- Current cumulative text timelines can coexist while the future visual adapter
  adopts a batch interface.

## Relationship to accepted decisions

This specializes ADR 0002's renderer-local interpolation and presentation-cue
boundary. It preserves ADR 0010: Performance Director output may vary staging
but cannot select behavior or durable outcome. It complements ADR 0026: the Web
text transcript can treat newly diffed safe lines as a lightweight playback
batch without claiming to implement the future 2D contract.

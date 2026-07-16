# 0011: Make the First Door Gap an Authored Action

Status: Accepted

Date: 2026-07-16

## Context

The implemented vertical slice begins with the hallway door
`almost_closed_unlatched`. The husband's routine says he normally pulls or
pushes the door shut, and the first NarrativeAction merely leaves the existing
gap unchanged. No authored event explains who opened the door before 09:05.

This breaks the story's causal provenance. The first neutral trace appears
before either character creates it, and the player is asked to preserve a
world difference whose source does not exist. Playtests 001–004 consequently
focused on persuading the husband not to finish closing an unexplained gap.

## Options considered

1. **Leave the source unexplained.** This makes the gap an intentional mystery,
   but conflicts with the PoC's core loop in which one character creates a
   neutral trace that another later observes.
2. **Make the door drift open or fail to latch.** This repairs mechanics but
   removes character agency from the first story movement.
3. **Have the wife open it in an earlier off-screen routine.** This can be a
   valid different story, but gives her prior knowledge and changes the
   intended initiator without presenting that causal beat to the player.
4. **Begin with the door closed and let the husband open the first gap.**
   Accepted. The first persistent difference then has a visible authored
   source and the wife's later observation remains causally legible.

All options assume the husband should create the first door trace. If either
spouse may initiate this exact beat in a later version, each initiating route
must still contain its own authored action and provenance.

## Decision

1. The hallway door begins fully `closed`.
2. The husband does not routinely close a pre-existing gap. His avoidance is
   expressed by passing the closed door, looking away, slowing, stopping, or
   eventually touching the handle without changing durable door state.
3. The first door NarrativeAction is `open_door_a_crack`: actively open the
   closed door only far enough to leave a narrow gap, then walk away.
4. The Action's player-facing label is `Open the door just a little.` Exact
   prose may be refined in playtest, but it must describe an opening rather
   than preserving an existing state.
5. The World changes `hallwayDoor` from `closed` to `slightly_open` only when
   the accepted intention executes after resume.
6. `door_is_slightly_open` Evidence is activated only by that authored World
   effect. The wife's later hallway routine may observe it exactly as before.
7. Door routines may provide authored hints at earlier awareness stages, but
   cannot open the door or activate its Evidence without the NarrativeAction.
8. Historical validation runs and Playtests 001–004 remain frozen evidence of
   the old content failure. Current prompts, fixtures, runtime, and acceptance
   tests must use the corrected closed-door premise.

## Consequences

- The main door beat becomes a larger psychological movement than the old
  `leave existing gap` action, which is appropriate after the low-stakes clock
  tutorial and may take multiple days or pauses.
- The first door trace has a single deterministic source.
- Judge and Persona calibration must no longer be tuned around preserving an
  unexplained gap.

## Relationship to accepted decisions

This changes authored story content without changing ADR 0001's fixed catalog,
ADR 0002's World authority, or ADR 0010's performance boundary. It supersedes
the door premise and `leave_door_ajar` content in the current vertical-slice
and local-play specifications.


# Text Vertical Slice Specification

Status: Accepted implementation scope

## Purpose

Build the smallest deterministic slice that proves authored routines,
authored narrative Actions, Evidence, observation, and rendering remain
separate while forming one player-visible causal chain.

The first presentation is layered text. A future visual world renderer and UI
overlay must consume the same GameView projections without changing simulation
or command behavior.

## Domain vocabulary

- **RoutineBehavior:** scheduled autonomous behavior. It may change location or
  visible activity and append GameEvents. It does not automatically create
  Evidence.
- **NarrativeAction:** fixed authored behavior whose eligibility depends on
  world state and whose execution may create authored effects or Evidence.
- **GameEvent:** a record that something happened in the simulation. Most
  events are not sent to Persona context.
- **Evidence:** a neutral, durable world fact explicitly promoted for possible
  observation and Persona cognition.
- **Observation:** the deterministic transition that adds active Evidence to an
  NPC's knowledge after physical observation conditions are satisfied.
- **WorldView:** renderer-safe visible projection. It excludes private
  MindState, Evidence knowledge, Action Catalog data, Action IDs, Judge output,
  and future beats.
- **UIView:** renderer-safe semantic interaction projection. It contains pause
  mode, selected NPC, neutral Action options, and later dialogue/loading/error
  state without internal Action IDs or service details.
- **GameView:** `{ world: WorldView, ui: UIView }`, projected from public World
  and Game Controller snapshots.
- **PlayerCommand:** fixed input message emitted by an input adapter and handled
  by the Game Controller. Renderers never dispatch it themselves.

## Authored vertical-slice content

### NPCs

- `husband`
- `wife`

### Locations

- `living_room`
- `dining_area`
- `hallway`
- `room_threshold`

### RoutineBehaviors

- `husband_sits_on_sofa`
- `husband_notices_slow_clock`
- `wife_drinks_water`
- `husband_walks_to_hallway_door`
- `wife_walks_through_hallway`

### NarrativeActions

- `interact_with_living_room_clock`
- `open_door_a_crack`
- `remain_at_threshold`

These IDs are internal and must not appear in rendered text.

### Evidence

- `living_room_clock_is_accurate`
  - neutral description: `The living-room clock shows the current time.`
- `door_is_slightly_open`
  - neutral description: `The door at the end of the hallway is slightly open.`

## Deterministic schedule

The slice begins at 07:56 with the living-room clock three minutes slow and the
hallway door fully closed.

1. 07:57 — husband executes `husband_notices_slow_clock` and reaches the
   tutorial pause while the wall clock visibly shows 07:54.
2. While paused, a debug capability may commit
   `interact_with_living_room_clock`, standing in for the Persona, Action Judge,
   and bounded Performance Director.
3. 07:58–07:59 — after resume, the Action executes. Transient clock play closes
   with the clock intact, running, and showing the current time.
4. 08:00 — husband executes `husband_sits_on_sofa`; wife executes
   `wife_drinks_water` and observes the accurate-clock Evidence.
5. 09:05 — husband executes `husband_walks_to_hallway_door` and reaches the
   authored pause moment with a hand on the fully closed door.
6. While paused, the debug capability may commit `open_door_a_crack`.
7. 09:06 — after resume, the committed Action opens the first narrow gap and
   activates door Evidence.
8. 09:12 — wife executes `wife_walks_through_hallway`. If the Evidence is
   active, she observes it. Only then does `remain_at_threshold` satisfy its
   hard world prerequisites.
9. While paused, the debug capability may commit `remain_at_threshold`.
10. 09:13 — after resume, wife executes the committed Action and remains at the
   threshold.

## Requirements

### Simulation

- **LDO-VS-001 — Scheduled routines:** Advancing an unpaused world through an
  authored time executes the scheduled RoutineBehaviors and updates public NPC
  location/activity.
- **LDO-VS-002 — Pause:** Advancing a paused world does not change simulation
  time or execute scheduled behavior. Resume permits progression again.
- **LDO-VS-003 — Delayed narrative execution:** Committing an eligible
  NarrativeAction forms an intention; it executes only at its authored
  decision point after the world resumes.
- **LDO-VS-004 — Explicit Evidence:** RoutineBehaviors append GameEvents but do
  not automatically create Evidence. `interact_with_living_room_clock` explicitly
  activates `living_room_clock_is_accurate`; `open_door_a_crack` explicitly
  activates `door_is_slightly_open`.
- **LDO-VS-005 — Observation gate:** Wife does not know the door Evidence, and
  `remain_at_threshold` is not eligible, until her hallway routine physically
  observes the active Evidence.
- **LDO-VS-006 — Fixed catalog:** Only the three authored NarrativeAction IDs may
  be committed. Ineligible or unknown IDs are rejected without mutation.
- **LDO-VS-007 — Closed-door provenance:** Hallway door state begins `closed`.
  Routine and transient PerformancePlan beats cannot change it. It becomes
  `slightly_open` only when `open_door_a_crack` executes.
- **LDO-VS-008 — Engine-owned performance closure:** Transient performance
  beats do not enter durable World state. The World applies each Action's
  authored postcondition independently of generated staging.

### Projection and rendering

- **LDO-VS-101 — Safe projection:** WorldProjector exposes visible time, pause
  state, actors, object state, and presentation cues. It excludes NPC knowledge,
  Evidence IDs, NarrativeAction IDs, intentions, and internal GameEvents.
- **LDO-VS-102 — Pure renderer:** TextRenderer consumes only WorldView and does
  not mutate it or the world.
- **LDO-VS-103 — Renderer-neutral cues:** TextRenderer maps renderer-neutral
  presentation cues to prose. No domain definition contains player-facing
  prose or visual-engine commands.
- **LDO-VS-104 — Text acceptance:** The complete rendered timeline visibly
  distinguishes autonomous routine, pause/resume, the neutral open-door state,
  wife's later observation, and her threshold response without exposing
  internal IDs or interpretations.

### Controller, UI, and layers

- **LDO-VS-201 — Command boundary:** A Game Controller accepts fixed
  PlayerCommands for pause, resume, NPC selection, and debug Action-option
  selection. Action options can be offered and committed only while the World
  is paused. The controller is the only input path that mutates semantic
  interaction or delegates to the World.
- **LDO-VS-202 — Safe UI projection:** UIProjector exposes pause/running mode,
  selected NPC, and neutral Action options without internal NarrativeAction IDs
  or private orchestration state.
- **LDO-VS-203 — Independent layers:** WorldTextRenderer consumes only
  WorldView; UITextRenderer consumes only UIView; TextCompositor combines their
  outputs without either renderer reading the other's view.
- **LDO-VS-204 — Input routing contract:** UI input has priority over world
  picking, and both emit PlayerCommands rather than mutating World or Controller
  state directly. A concrete interactive input adapter remains outside this
  phase; controller dispatch tests prove the command contract.

## Initial text acceptance shape

Exact punctuation may be refined by renderer tests. The WorldTextRenderer's
visible causal order must be:

```text
07:57 — Living room — The wall clock shows 07:54.
07:57 — Living room — He looks up at it, then stops.
07:57 — The world pauses.
07:57 — The world resumes.
07:58 — Living room — He plays with the clock for a while.
07:59 — Living room — The clock now shows 07:59.
08:00 — Living room — He sits at the far end of the sofa.
08:00 — Dining area — She drinks a glass of water.
08:00 — Dining area — She notices the clock now shows the current time.
09:05 — Hallway — He stops with one hand on the door handle.
09:05 — The world pauses.
09:05 — The world resumes.
09:06 — Hallway — He opens the closed door just enough to leave a narrow gap.
09:06 — Hallway — The door is slightly open.
09:12 — Hallway — She walks into the hallway.
09:12 — Hallway — She notices the open door.
09:12 — The world pauses.
09:12 — The world resumes.
09:13 — Hallway — She remains at the threshold.
```

At each authored pause moment, UITextRenderer must be able to render a separate
overlay such as:

```text
[Paused]
Focus: Husband
Possibilities:
1. Open the door just a little.
```

The option token used by input may be present, but the internal
`open_door_a_crack` ID must not be rendered.

## Phase boundary and non-goals

This phase ends when the full text acceptance test passes and the repository
test/build gates are green.

This phase does not implement:

- Persona or Action Judge network calls;
- natural-language dialogue UI;
- awareness or willingness prompt evaluation;
- browser, 2D, 3D, animation, audio, camera, or asset integration;
- free-running wall-clock timing;
- kitchen, meal, outside, cemetery, or ending beats;
- saving/loading;
- generic schedule authoring tools;
- generated Actions or variants;
- the second persistent trace inside the room.

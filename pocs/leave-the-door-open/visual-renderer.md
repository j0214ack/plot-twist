# 2D / 3D Renderer Handoff Contract

Status: Accepted integration contract; the current Web text adapter implements
the pulled-turn lifecycle, while the structured visual payload and complete
node manifest still need host projection work.

Source decisions: ADR 0002, ADR 0029, ADR 0030, and ADR 0033.

## What “Renderer” means here

In this document, **Renderer subsystem** means the whole client presentation
layer. It has three internal parts that must remain separable even if one game
engine class initially implements all of them:

1. **PresentationCoordinator** — owns playback sequencing and decides when the
   current presentation is complete enough to request the next tick.
2. **WorldRenderer + UIRenderer** — draw the world and overlay from safe views.
3. **InputAdapter** — converts player controls into fixed Controller commands.

The pure draw/animation functions do not call the Controller. The surrounding
coordinator and input adapter do.

## Creative brief: what this project is trying to feel like

**Leave the Door Open** is a quiet domestic game about helping a person find a
small action they can genuinely own. The player is an inner voice, not a body
controller and not an omniscient therapist. Conversation may change a
character's psychological position over several talks or days. Only an
accepted fixed NarrativeAction changes the World.

Martin and Elise lost their nine-year-old daughter Nora about eight months
before the story. The house has not become a haunted-house puzzle. It is still
a used, shared home whose routines now bend around one closed room at the end
of the hall. The player should initially encounter the shape of that avoidance,
not an explanatory reveal. Protected biography and disclosure timing remain
Controller concerns even though the renderer team knows the complete script.

The desired atmosphere is:

- domestic realism before symbolism;
- patient attention to routes, placement, objects, repeated habits, and the
  instant an ordinary rhythm differs;
- restrained grief without prestige-drama speeches, horror grammar, ominous
  foreshadowing, or a puzzle-box “secret room” tone;
- occasional dry warmth and ordinary competence, so the adults feel like
  people who once had an easy shared life rather than embodiments of trauma;
- literary texture that can make attention pause, but not a rule that every
  routine must be meaningful, beautiful, or a clue;
- small changes that are legible and consequential without being labelled as
  healing, closure, reconciliation, invitation, or erasure.

Martin first notices people, exact wording, and unanswered questions. He often
keeps contact alive through listening, remembered details, dry asides, and
small ordinary acts; under strain, his language can become thin. Elise first
notices placement, timing, routes, and whether a change leaves another person
time to participate. Her patience is active and concrete, not mystical
intuition. See [`characters/husband.md`](characters/husband.md),
[`characters/wife.md`](characters/wife.md), and
[`characters/the-yellow-bowl-argument.md`](characters/the-yellow-bowl-argument.md)
for character continuity.

### Visual and UX guardrails

- Do not make every household object glow with significance.
- Do not use a generic “important scene” language of automatic close-ups,
  vignette, slow motion, desaturation, or swelling music.
- Do not visually announce hidden Actions before the UI legitimately surfaces
  them.
- Do not make the room supernatural, menacing, or visibly “the answer.”
- Let silence, unchanged object state, an interrupted route, and exact spatial
  distance carry information when the node brief requires it.
- Keep player UI invitational. It should support observation, focus, dialogue,
  and time continuation without looking like a quest checklist or morality
  meter.

## Exact-moment direction examples

These examples establish quality and tone. They are not reusable camera
templates; each final DirectionPlan still belongs to its exact node/variant.

### Tutorial success — `interact_with_living_room_clock / accepted_clock_interaction`

**Dramatic function:** teach the player what successful psychological movement
feels like: an accepted thought later becomes a visible but bounded World
change.

**Required experience:** Martin has enough energy to change one harmless thing,
not to solve his life. The accepted player motif may let him briefly spin the
hands, remove/reseat the battery, or otherwise play with the clock. The moment
can contain a flicker of private amusement. He eventually decides he has had
enough and leaves the clock intact, running, and showing the correct time.

**Direction warning:** do not score it as breakthrough therapy or magical
transformation. The satisfaction is proportionate to three corrected minutes.
The correct final clock state must be unmistakable.

### First causal opening — `open_door_a_crack / open_narrow_gap`

**Dramatic function:** turn many days of changed stopping distance into the
first persistent trace another person can later encounter.

**Required experience:** Martin is already at the handle because a routine and
conversation made that position possible. The important fact is the bounded
movement: handle turns, the door opens only to a narrow gap, Martin leaves. It
is not a message performed toward Elise and not a provocation staged for her to
see.

**Direction warning:** no triumphant reveal inside the room, no horror view
through the crack, and no shot implying Martin knows how Elise will interpret
it. End on the neutral, persistent geometry of the gap.

### Elise first sees the gap — `wife_observes_first_gap / stop_at_first_gap`

**Dramatic function:** prove Evidence provenance and show that observation is a
separate event from Martin's Action.

**Required experience:** her normal route changes because the gap exists. She
notices it from a distance, stops away from the threshold, and does not touch
the door. Exact distance, line of sight, and the pause before any decision are
more important than facial melodrama.

**Direction warning:** do not cut to Martin, explain his intention, show a
memory montage, or turn her stop into immediate consent/refusal. This is the
moment she encounters a changed household fact.

### Optional relationship attempt — `say_one_honest_thing_to_elise / one_honest_opening`

**Dramatic function:** let a player-tested possibility become one finite human
attempt without promising that Elise is ready, that the conversation will
continue, or that the marriage has advanced to a new stage.

**Required experience:** both adults are already at the dining table at 20:15.
When the intention is pending and both are home, the preceding 20:14 tick emits
`husband_settles_at_dining_table` and `wife_settles_at_dining_table`; these are
ordinary fixed routine nodes that establish spatial co-presence rather than
teleporting either actor inside the NarrativeAction.
The exact authored outcome ID is part of the occurred step:
`practical_deflection`, `distance_acknowledged`, or `one_truth_returned`.
Martin offers one opening, Elise gives the one response authorized by that
outcome, and a final beat lets the exchange stop. The step has at most three
beats and its ending is allowed to be asymmetrical.

**Direction warning:** the three outcome IDs require three exact Playbook
entries, not a generic “emotional conversation” camera recipe. Do not stage a
shot/reverse-shot loop that implies more unseen dialogue, add a reconciliation
gesture, or use the causal door/room imagery to claim the exchange advanced
that arc. If generated performance is absent or invalid, play the supplied
authored fallback beats and reconcile both adults to `worldAfter`.

### Chapter ending — `open_room_window / open_one_hand_width`

**Dramatic function:** complete Chapter 1 with Elise making one exact, durable
change from inside the room. It creates a reciprocal trace for a later chapter,
not a resolution of loss.

**Required experience:** she has already crossed the threshold on an earlier
day and returned later. She opens the window exactly one hand-width and leaves
it. Air, curtain movement, or changed room sound may make the physical result
legible, but the authoritative fact is the window position.

**Direction warning:** avoid cleansing-light symbolism, cathartic music, a
family-memory montage, or a camera claiming the room is healed. Finish with
room and window still materially present, changed only by that measured
opening.

These nodes and the Chapter 1 causal order are specified in
[`chapter-1.md`](chapter-1.md). That document governs semantic outcomes; this
handoff governs how an authorized outcome reaches a visual renderer.

## Authority boundary

The Renderer subsystem may:

- request the next semantic tick with target-free `advanceTurn()`;
- choose paths, blocking, shots, cuts, sound, easing, and wall-clock duration;
- keep renderer-local camera, animation, hover, selection, scroll, and playback
  state;
- use the complete build-time PresentationNodeCatalog and its own Playbook;
- convert clicks, keyboard input, map picks, focus choices, dialogue, and
  Possibility choices into fixed Controller commands;
- disable, queue, skip, or fast-forward presentation according to UX policy.

It may not:

- call `World.advanceTo`, pass a target time, or choose a turn duration;
- read a live future schedule or decide which story node happens;
- select RoutineBehavior, NarrativeAction, Evidence, observation, Persona,
  Judge, or Performance outcomes;
- infer durable state by parsing subtitles or generated prose;
- mutate Controller or World state through RenderWorld objects;
- expose MindState, hidden Evidence, Action catalog internals, Judge results,
  or unreached node order to the player.

The Controller owns a replaceable time-advance policy. Fifteen simulation
minutes is only an initial candidate maximum. It must be possible to tune the
window, stop early at an event, coalesce empty windows, or fast-forward quiet
hours without changing the Renderer API.

## Runtime lifecycle

The required lifecycle is:

```text
player chooses Continue
  -> InputAdapter sends resume command
  -> host starts an advance plan and returns its first TurnResult
  -> PresentationCoordinator plays that TurnResult
  -> playback completes (or safely skips)
  -> coordinator waits its local cadence when something visible played
  -> coordinator calls advanceTurn() with no target or duration
  -> repeat until advancePending=false
  -> render returned-control UI and unlock semantic input
```

For the text Web adapter, the visible cadence is currently about 2.5 seconds.
An empty policy tick whose safe presentation is unchanged is pulled
immediately, so a long quiet span does not create minutes of empty waiting. A
2D/3D renderer should normally treat its animation completion as the cadence;
it need not add another fixed delay after a sufficiently long animation.

The coordinator must never request the next tick while the previous TurnResult
is only half-applied, unless it explicitly supports ordered prefetch without
starting semantic playback. The initial implementation should not prefetch.

## Required host port

Names may vary, but the authority and payload must be equivalent:

```ts
interface GameHostPort {
  startSession(options: { locale: "en" | "zh-TW" }): Promise<SessionStarted>;
  submitCommand(command: PlayerCommand): Promise<CommandResult>;
  advanceTurn(): Promise<TurnResult>; // no target, duration, event, or Action
}

type TurnResult = {
  protocolVersion: 1;
  sessionId: string;
  locale: "en" | "zh-TW";
  turnId: string;
  sequence: number;
  fromTime: number;
  toTime: number;
  advancePending: boolean;
  steps: PresentationStep[];
  worldAfter: WorldViewFrame;
  uiAfter: UIView;
};
```

`toTime` is the simulation result of Controller policy, not a request made by
the renderer. An empty tick may have `steps: []` while still changing `toTime`.

The current `/api/leave-the-door-open/.../advance` route already obeys the
target-free call shape but returns the text screen. Before visual integration,
the host must add the structured fields above without moving policy into the
browser.

## Structured presentation data

Text is fallback, not an animation command. Every visible step must identify
the exact story node and carry ordered semantic operations:

```ts
type PresentationStep = {
  stepId: string;
  sequence: number;
  at: number;
  node: {
    nodeId: string;
    variantId: string | null;
  };
  operations: PresentationOperation[];
  worldAfter: WorldViewFrame;
};

type EntityRef =
  | { kind: "actor"; id: "husband" | "wife" }
  | { kind: "object"; id: string }
  | { kind: "location"; id: string };

type Placement = {
  locationId: string;
  anchor?:
    | { kind: "entity"; entity: EntityRef; relation: string }
    | { kind: "semantic"; anchorId: string };
};

type PresentationOperation =
  | {
      kind: "move_actor";
      actorId: "husband" | "wife";
      from: Placement;
      to: Placement;
      locomotionId: "walk" | "step" | "turn_in_place";
    }
  | {
      kind: "set_activity";
      actorId: "husband" | "wife";
      activityId: string;
      target?: EntityRef;
    }
  | {
      kind: "interact";
      actorId: "husband" | "wife";
      target: EntityRef;
      interactionId: string;
    }
  | {
      kind: "change_object";
      objectId: string;
      fromStateId: string;
      toStateId: string;
      causedByActorId?: "husband" | "wife";
    }
  | {
      kind: "direct_attention";
      actorId: "husband" | "wife";
      target: EntityRef;
      attentionId: "glance" | "look" | "notice" | "avoid";
    }
  | {
      kind: "subtitle";
      text: string;
      source: "authored" | "generated";
      actorId?: "husband" | "wife";
    };
```

Operations at the same simulation minute still have explicit sequence. For
example, `move_actor` can finish before `interact`, and `interact` before
`change_object`, without inventing fractional World time.

`worldAfter` is a complete safe visual checkpoint. Operations explain how to
present the transition, but `worldAfter` is authoritative. At the end of every
step, including after skip or animation failure, the renderer must reconcile
exactly to it.

## Complete node catalog versus live future schedule

The renderer team must receive a complete, versioned
`PresentationNodeCatalog` containing **every node and variant this story build
can emit**. This is authoring-time knowledge, like knowing every sprite or
cutscene asset in the build. It is intentionally complete.

A live TurnResult names only nodes that have already happened. It does not say
which catalog node will happen next, whether a node is eligible in this
playthrough, or its future time/order.

Every catalog entry requires:

```ts
type PresentationNodeManifestEntry = {
  nodeId: string;
  variantId: string | null;
  sourceKind:
    | "routine"
    | "narrative_action"
    | "world_transition"
    | "interaction_boundary";
  importance: "ambient" | "routine" | "causal" | "climax";
  possibleOperationKinds: PresentationOperation["kind"][];
  requiredEntities: EntityRef[];
  directionBrief: {
    dramaticFunction: string;
    requiredEmphasis: string[];
    continuityConstraints: string[];
  };
  fallbackCueId: string;
};
```

Importance is production metadata only. It may help prioritize bespoke work or
decide whether an unfinished node may temporarily use fallback. It must not be
implemented as `causal -> close-up`, `climax -> longer hold`, or any other
generic directing formula.

## Playbook: exact-moment direction

The desired lookup is:

```text
exact (nodeId, variantId)
  -> node-specific DirectionPlan in this renderer's Playbook
  -> otherwise semantic-operation fallback
```

Every completed key moment gets a plan authored for that exact dramatic
moment. Two `causal` nodes may have completely different blocking, shot grammar,
sound, and rhythm.

A DirectionPlan may contain engine-specific data such as:

```ts
type DirectionPlan = {
  blocking: BlockingBeat[];
  shots: CameraShot[];
  edits: EditBeat[];
  sound: SoundBeat[];
  holds: DramaticHold[];
  operationBindings: OperationBinding[];
  completionCheckpoint: "worldAfter";
};
```

This plan belongs to the renderer/asset build. It cannot change or omit the
supplied semantic operations and final checkpoint. A camera can withhold a
detail for dramatic timing inside the step, but it must make every
`requiredEmphasis` legible before completion.

## Fallback when no exact DirectionPlan exists

Fallback is based on operation kind, not story importance and not parsed prose:

- `move_actor`: resolve supplied placements through the map catalog and use
  local navigation/pathfinding.
- `set_activity`: play the generic animation for `activityId` or stable idle.
- `interact`: move/face toward the target anchor and play a neutral interaction
  clip.
- `change_object`: apply the exact supplied visible state transition.
- `direct_attention`: turn head/body or hold a neutral look toward the target.
- `subtitle`: display safe text; never convert it into World state.
- unknown operation or missing asset: log diagnostics, use a neutral visual,
  then snap to `worldAfter`.

Generated Performance may arrive as a safe subtitle and, in the future, as
operations chosen from an authored envelope-bounded gesture vocabulary. The
renderer must not parse arbitrary generated prose to manufacture movement or
object changes. When a generated gesture is unsupported, use the fixed
NarrativeAction's authored generic interaction.

## RenderWorld and continuity

RenderWorld is a presentation mirror, not GameState. It should contain only
safe visible data needed by the engine:

```ts
type WorldViewFrame = {
  locale: "en" | "zh-TW";
  time: number;
  weekdayId:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  chapter: "tutorial" | 1;
  chapterDay: number | null;
  paused: boolean;
  actors: Array<{
    id: "husband" | "wife";
    placement: Placement;
    visibleActivityId: string;
  }>;
  objects: Array<{
    id: string;
    placement: Placement;
    visibleStateId: string;
  }>;
};
```

Calendar day zero is Thursday. `weekdayId` is absolute calendar rhythm;
`chapterDay` is relative story progress, and neither may be derived from the
other. A text renderer labels day transitions directly; a visual renderer may
use its own calendar transition treatment.

`away_from_home` is an offstage placement. Remove or hide that actor until an
authoritative later frame returns them to a renderable household placement; do
not leave them frozen in the last indoor room. Departure and return are
presentable routine nodes. Commute interiors and offsite work do not require a
map or animation in this PoC.

The renderer owns transient pose, current path, camera, tween, subtitle,
particle, and audio state. Those are discarded or reconciled when applying a
new authoritative frame. It must preserve continuity across steps and reject
duplicate or out-of-order `turnId`/`sequence` values.

### Locale boundary

The player selects `en` or `zh-TW` when `startSession` is called. That locale
is immutable until a new session starts and is repeated in safe host results so
the renderer can select its own authored chrome, fonts, line breaking, and
accessibility labels. The host supplies authored localized labels, names,
guidance, and subtitle text; semantic IDs and Playbook node IDs remain the same
in both languages. A visual renderer must not call a translation model, parse
localized prose to recover meaning, or translate an existing session midway.

## UI, input, and player experience

The UI renderer consumes `UIView` independently and layers it over the world.
It owns layout and presentation for:

- focus controls and current focus;
- dialogue history and optimistic player echo;
- thought input and Possibility buttons;
- Continue, Help, Pause/Skip/Fast-forward when those capabilities exist;
- operation-specific loading (`角色正在想……` for dialogue, neutral time
  progress for advancement);
- disabled/busy state while semantic work or required playback is pending;
- recoverable errors, expired sessions, retry/new game;
- keyboard/controller/touch navigation, readable text, focus order, reduced
  motion, subtitle, and audio controls.

The InputAdapter emits only fixed Controller commands. World picking may select
an actor or focus target, but cannot move an actor directly. UI hit-testing has
priority over map picking.

During playback, the first implementation disables new semantic input. A
future queue may retain input only if ordering is explicit and tested. Skip or
fast-forward shortens local presentation but must still apply every required
checkpoint in order.

## Presentation catalogs owned by the renderer

- `LocationPresentationCatalog`: map assets, navigation mesh, anchors, camera
  bounds, entrances, and entity-relative approach points.
- `ActorPresentationCatalog`: sprite/model, portraits, locomotion, idle,
  activity, gaze, and generic interaction clips.
- `ObjectPresentationCatalog`: object assets, visible state mappings,
  interaction anchors, and state transitions.
- `DirectionPlanCatalog`: exact `(nodeId, variantId)` Playbook entries.
- `FallbackOperationCatalog`: neutral mappings for each operation kind.
- `SoundPresentationCatalog`: authored sound/music bindings referenced by
  DirectionPlans.

Changing these catalogs cannot change simulation output.

## Failure and recovery

- Unknown exact node: use structured-operation fallback; do not drop the step.
- Unknown operation: log it, use neutral/no animation, snap to `worldAfter`.
- Missing asset: use a stable placeholder and continue.
- Animation exception: cancel local tweens/audio, apply `worldAfter`, then
  either continue or show a safe presentation warning.
- Network failure during `advanceTurn`: keep the last committed RenderWorld,
  show retry, and do not guess the missing tick.
- Reload mid-playback: request the latest safe view and render it immediately;
  do not infer or replay hidden history.
- Duplicate/out-of-order result: reject without mutating RenderWorld and request
  recovery/resync.

## Required automated tests

1. `advanceTurn()` accepts no target, duration, node, event, or Action.
2. A tunable Controller policy changes turn duration without changing renderer
   code or request shape.
3. Same-minute operations retain order and run once.
4. Movement explicitly supplies actor, from, to, and destination target/anchor;
   object interaction is not encoded only in prose.
5. The complete node manifest has unique `(nodeId, variantId)` keys and every
   emitted runtime node exists in it.
6. Every key node required by production has an exact DirectionPlan; ordinary
   nodes without one pass semantic fallback tests.
7. Importance does not mechanically choose a camera recipe.
8. Playback and skip both end exactly at every supplied `worldAfter`.
9. Unknown node, unknown operation, missing asset, and thrown animation recover
   to the authoritative frame.
10. Input is disabled or serialized until required playback completion.
11. Focus/dialogue/Possibility input emits fixed commands and cannot mutate
    RenderWorld as game truth.
12. Player payload contains no MindState, hidden Evidence, Judge result, future
    schedule, or unreached node order.
13. Two different renderer catalogs can consume the same TurnResult and reach
    identical semantic checkpoints.
14. Accessibility/reduced-motion mode changes presentation only, not event
    order or simulation time.

## Integration phase boundary

The first 2D integration is complete when it can:

- play the tutorial observation routines through repeated target-free ticks;
- accept a clock interaction, use its exact node DirectionPlan, and reconcile
  the clock's authored final state;
- enter Chapter 1 and play both Day 1 household routes with exact node IDs;
- render focus/dialogue/Possibility UI and send fixed commands;
- survive skip, unknown asset, animation failure, and reconnect tests;
- pass the authority, ordering, node-manifest, input-lock, and final-frame tests
  above.

## Host work required before handoff is executable

The visual renderer implementer can build catalogs, the coordinator, fallback
operations, UI, and DirectionPlan tooling against this contract now. Full
integration waits on the host to provide:

1. a versioned structured `TurnResult` in addition to the current text screen;
2. explicit per-step operations and before/after placements;
3. the generated complete PresentationNodeCatalog with exact variants and
   direction briefs;
4. stable resync/duplicate handling for turn and step sequence IDs.

Until those four host items exist, a 2D renderer must not parse the current text
timeline as a substitute protocol.

# 0030: Project Structured Semantic Presentation Operations

Status: Accepted design contract; host projection not yet implemented

Date: 2026-07-17

## Context

The current text projection exposes a cue ID, optional location, and prose.
That is enough to print a timeline, but not enough for a 2D or 3D renderer to
stage a scene reliably. A visual adapter may need to show one actor moving from
one place to another, approaching an object, performing a bounded interaction,
and leaving the object in an authoritative state.

Neither parsing prose nor diffing only the final frame can recover that intent.
A same-room movement may leave `locationId` unchanged; an actor may look at an
object without changing it; and two interactions may reach the same final
state through visibly different authored behavior.

## Options considered

1. **Let each renderer parse text.** This makes prose an accidental command
   language and produces different game facts in different renderers.
   Rejected.
2. **Give only before/after frames and let renderers infer transitions.** This
   can animate generic relocation and object changes, but cannot distinguish
   attention, approach, interaction target, or meaningful same-state action.
   Insufficient on its own.
3. **Emit engine-specific paths and animation clips.** This is immediately
   playable in one engine but couples World authoring to RPG Maker, canvas, or
   a particular 3D rig. Rejected.
4. **Project ordered renderer-neutral semantic operations plus safe state
   frames.** Accepted. The host says what visibly happened; each renderer
   decides how its assets perform it.

## Decision

1. **LDO-PRES-001 — Structured turn envelope.** Every returned semantic tick
   for a visual renderer has a stable sequence, `fromTime`, `toTime`, ordered
   presentation steps, and complete safe `worldAfter`/`uiAfter` projections.
2. **LDO-PRES-002 — Ordered semantic operations.** A step contains ordered
   discriminated operations, not prose instructions. The initial vocabulary is:
   - `move_actor` — actor, authoritative from/to placements, and locomotion
     intent;
   - `set_activity` — actor, visible activity, and optional target;
   - `interact` — actor, target entity, and renderer-neutral interaction ID;
   - `change_object` — object, exact before/after visible states, and optional
     causing actor;
   - `direct_attention` — actor, target, and attention mode;
   - `subtitle` — safe authored or generated fallback text with no mutation
     authority.
3. **LDO-PRES-003 — Explicit references.** Actors, objects, locations, and
   semantic anchors are referenced through stable IDs. A target is never
   encoded only inside a sentence. A placement may name a location and an
   optional entity-relative or semantic anchor; the renderer's presentation
   catalog resolves that anchor to coordinates.
4. **LDO-PRES-004 — No inferred authority.** `worldAfter` is the authoritative
   safe visual frame after the step. Operations explain how to present the
   transition but cannot add a durable state absent from `worldAfter`.
   Conversely, renderers may not infer a missing operation by parsing subtitle
   text.
5. **LDO-PRES-005 — Renderer-owned realization.** Navigation paths, waypoints,
   sprite clips, inverse kinematics, camera shots, particles, easing, and wall-
   clock duration remain presentation-catalog or renderer state. They are not
   World or Controller data.
6. **LDO-PRES-006 — Generated performance is bounded.** Generated prose may be
   supplied as `subtitle`. A visual renderer may also receive only operations
   from an authored, envelope-bounded gesture vocabulary. It must never turn
   arbitrary prose into object mutation. If an unsupported generated gesture
   has no structured operation, the renderer performs the fixed Action's
   authored generic interaction and shows or omits the safe subtitle.
7. Multiple operations at one simulation minute retain explicit sequence.
   Movement can therefore finish before interaction, and interaction before
   object change, without inventing fractional simulation time.
8. An empty semantic tick may have no steps but still advances `toTime`. The
   presentation coordinator may coalesce it according to the Controller-owned
   time policy; a renderer must not fabricate activity merely to fill it.
9. **LDO-PRES-007 — Complete authoring-time node catalog.** Renderer authors
   receive a versioned manifest of every presentation node and variant that
   this story build can emit. Each entry has a stable node ID, source kind,
   importance class, possible operation kinds, required entity references, and
   a neutral fallback. This catalog is intentionally complete so a renderer
   team can author node-specific blocking, camera, sound, and animation.
10. **LDO-PRES-008 — Importance is production metadata only.** Every node may be
    classified initially as `ambient`, `routine`, `causal`, or `climax` to help
    a team prioritize bespoke work and decide which unfinished nodes may use a
    temporary neutral fallback. It is not a directing algorithm. A renderer
    must not map a class mechanically to shot duration, close-up strength,
    transition, music, or any other generic notion of intensity. Importance
    never changes World outcome or Action eligibility.
11. **LDO-PRES-009 — Catalog knowledge is not runtime foreknowledge.** The
    renderer implementation may know all possible node definitions at build
    time, just as it knows all sprite and animation assets. A live turn names
    only nodes that the Controller has already processed. It does not disclose
    which catalog nodes will occur later in this session, their future order or
    times, hidden eligibility, or the World schedule.
12. The visual renderer is therefore a **presentation director**: it owns
    blocking, camera, edit rhythm, animation selection, sound, and emphasis for
    an authorized node. It is not a narrative director and cannot select,
    suppress, reorder, or semantically complete story nodes.
13. **LDO-PRES-010 — Exact-moment direction.** Bespoke direction is keyed by the
    exact `(nodeId, variantId)`, not by importance. Each renderer may maintain a
    `DirectionPlanCatalog` whose entry is authored specifically for that story
    moment: blocking, shots, cuts, sound, dramatic holds, required visual
    details, and continuity constraints. Two nodes with the same importance
    may and usually should be directed entirely differently.
14. The story-owned node manifest supplies a `directionBrief` for the exact
    moment—its dramatic function, details that must remain legible, and
    continuity constraints. The renderer-owned DirectionPlan realizes that
    brief using its engine and assets. Generic operation mappings remain a
    failure/development fallback, not the desired direction for a completed
    key moment.

## Required contract shape

```ts
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

type PresentationImportance =
  | "ambient"
  | "routine"
  | "causal"
  | "climax";

type PresentationNodeManifestEntry = {
  nodeId: string;
  variantId: string | null;
  sourceKind:
    | "routine"
    | "narrative_action"
    | "world_transition"
    | "interaction_boundary";
  importance: PresentationImportance;
  possibleOperationKinds: PresentationOperation["kind"][];
  requiredEntities: EntityRef[];
  directionBrief: {
    dramaticFunction: string;
    requiredEmphasis: string[];
    continuityConstraints: string[];
  };
  fallbackCueId: string;
};

type DirectionPlanCatalog = Record<
  `${string}:${string}`,
  {
    blocking: unknown;
    shots: unknown;
    edits: unknown;
    sound: unknown;
    holds: unknown;
  }
>;
```

Field unions may grow only by versioning the contract and providing a neutral
fallback. Renderers must exhaustively handle known variants and log unknown
ones before snapping to `worldAfter`.

## Consequences

- A text renderer may continue mapping the same safe steps to prose.
- A 2D renderer can pathfind toward an entity-relative anchor and play a local
  clip without learning Actions, MindState, Evidence, or schedules.
- A 3D renderer can use the same semantic operations with different navigation
  and animation systems.
- Authoring now needs explicit presentation targets and visible state
  transitions instead of hiding essential staging only in cue prose.
- Renderer teams can inspect one complete node manifest and author exact-
  moment DirectionPlans without receiving a live playthrough's future plan.

## Relationship to accepted decisions

This extends ADR 0002's safe WorldView boundary, ADR 0029's pulled semantic
ticks, and ADR 0010's rule that generated performance has no durable mutation
authority. It supersedes the cue/text-only example shape in
`visual-renderer.md`; that handoff document must implement this operation
contract before a 2D renderer is considered integrated.

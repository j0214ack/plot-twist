import type { HintBrief, PsychologicalStage } from "./routine-behaviors";
import type { LocationId, NPCId, VisibleActivityId } from "./world";

export type Chapter1CausalRoutineId =
  | "husband_route_turns_before_closed_door"
  | "wife_takes_long_route_around_hall"
  | "husband_reaches_handle_without_turning"
  | "wife_observes_first_gap"
  | "wife_stops_one_step_short"
  | "wife_returns_to_boundary"
  | "wife_notices_closed_window";

export type Chapter1CausalRoutinePostconditionId =
  | "husband_turned_back_before_closed_door"
  | "wife_completed_longer_return_route"
  | "husband_hand_on_closed_handle"
  | "wife_stopped_away_observing_gap"
  | "wife_one_step_short_of_threshold"
  | "wife_foot_beside_boundary"
  | "wife_inside_looking_at_closed_window";

export type Chapter1CausalRoutineDefinition = {
  routineId: Chapter1CausalRoutineId;
  actorId: NPCId;
  variantId: string;
  locationId: LocationId;
  visibleActivityId: VisibleActivityId;
  performanceDirective: string;
  performanceEnvelope: {
    targetObjectIds: string[];
    closurePolicy: {
      kind: "authored_routine_postcondition";
      postconditionId: Chapter1CausalRoutinePostconditionId;
    };
  };
  hintBrief: HintBrief;
};

const forbiddenInterpretations = [
  "Do not explain the room's biography.",
  "Do not state death, grief, invitation, reconciliation, or erasure as World fact.",
  "Do not recommend or paraphrase a hidden Action.",
  "Do not claim either adult knows what the other intended.",
];

const chapter1CausalRoutines: Record<
  Chapter1CausalRoutineId,
  Chapter1CausalRoutineDefinition
> = {
  husband_route_turns_before_closed_door: {
    routineId: "husband_route_turns_before_closed_door",
    actorId: "husband",
    variantId: "ordinary_route_turnback",
    locationId: "hallway",
    visibleActivityId: "turning_before_closed_door",
    performanceDirective:
      "Stage his ordinary hallway route ending before the fully closed door: show him slow, turn, and leave without reaching it.",
    performanceEnvelope: {
      targetObjectIds: ["hallway_door"],
      closurePolicy: {
        kind: "authored_routine_postcondition",
        postconditionId: "husband_turned_back_before_closed_door",
      },
    },
    hintBrief: {
      hintId: "ordinary_route_ends_before_closed_door",
      safeFact: "His ordinary hallway route ends before the fully closed door.",
      clarity: "clear",
      required: true,
      forbiddenInterpretations,
    },
  },
  wife_takes_long_route_around_hall: {
    routineId: "wife_takes_long_route_around_hall",
    actorId: "wife",
    variantId: "longer_return_route",
    locationId: "dining_area",
    visibleActivityId: "taking_long_route_around_hall",
    performanceDirective:
      "Stage her starting toward the hallway, stopping near its entrance, and returning by the visibly longer route.",
    performanceEnvelope: {
      targetObjectIds: ["hallway_entrance"],
      closurePolicy: {
        kind: "authored_routine_postcondition",
        postconditionId: "wife_completed_longer_return_route",
      },
    },
    hintBrief: {
      hintId: "wife_chooses_longer_route_back",
      safeFact:
        "She starts toward the hallway, then chooses a longer route back.",
      clarity: "clear",
      required: true,
      forbiddenInterpretations,
    },
  },
  husband_reaches_handle_without_turning: {
    routineId: "husband_reaches_handle_without_turning",
    actorId: "husband",
    variantId: "hand_reaches_closed_handle",
    locationId: "hallway",
    visibleActivityId: "reaching_closed_door_handle",
    performanceDirective:
      "Stage the changed stopping point on his hallway route: his hand reaches the handle, and the door remains fully closed.",
    performanceEnvelope: {
      targetObjectIds: ["hallway_door"],
      closurePolicy: {
        kind: "authored_routine_postcondition",
        postconditionId: "husband_hand_on_closed_handle",
      },
    },
    hintBrief: {
      hintId: "husband_stopping_point_reaches_handle",
      safeFact:
        "His stopping point changed: his hand now reaches the handle; the door remains fully closed.",
      clarity: "clear",
      required: true,
      forbiddenInterpretations,
    },
  },
  wife_observes_first_gap: {
    routineId: "wife_observes_first_gap",
    actorId: "wife",
    variantId: "stop_at_first_gap",
    locationId: "hallway",
    visibleActivityId: "observing_first_door_gap",
    performanceDirective:
      "Stage her noticing the narrow gap, stopping away from the threshold, and leaving the door untouched.",
    performanceEnvelope: {
      targetObjectIds: ["hallway_door", "room_threshold"],
      closurePolicy: {
        kind: "authored_routine_postcondition",
        postconditionId: "wife_stopped_away_observing_gap",
      },
    },
    hintBrief: {
      hintId: "wife_notices_first_narrow_gap",
      safeFact:
        "She notices the narrow gap and stops away from the threshold without touching the door.",
      clarity: "clear",
      required: true,
      forbiddenInterpretations,
    },
  },
  wife_stops_one_step_short: {
    routineId: "wife_stops_one_step_short",
    actorId: "wife",
    variantId: "stop_one_step_short",
    locationId: "room_threshold",
    visibleActivityId: "stopping_one_step_short",
    performanceDirective:
      "Stage her stopping closer than before but one step short of the threshold; leave the door and room unchanged.",
    performanceEnvelope: {
      targetObjectIds: ["hallway_door", "room_threshold"],
      closurePolicy: {
        kind: "authored_routine_postcondition",
        postconditionId: "wife_one_step_short_of_threshold",
      },
    },
    hintBrief: {
      hintId: "wife_stops_closer_on_later_day",
      safeFact: "On a later day she stops closer; nothing in the room changes.",
      clarity: "clear",
      required: true,
      forbiddenInterpretations,
    },
  },
  wife_returns_to_boundary: {
    routineId: "wife_returns_to_boundary",
    actorId: "wife",
    variantId: "foot_beside_line",
    locationId: "room_threshold",
    visibleActivityId: "returning_to_boundary",
    performanceDirective:
      "Stage her return to the same boundary and place one foot beside the line without crossing it.",
    performanceEnvelope: {
      targetObjectIds: ["room_threshold"],
      closurePolicy: {
        kind: "authored_routine_postcondition",
        postconditionId: "wife_foot_beside_boundary",
      },
    },
    hintBrief: {
      hintId: "wife_places_foot_beside_boundary",
      safeFact:
        "She returns and places one foot beside, not across, the line.",
      clarity: "clear",
      required: true,
      forbiddenInterpretations,
    },
  },
  wife_notices_closed_window: {
    routineId: "wife_notices_closed_window",
    actorId: "wife",
    variantId: "look_toward_closed_window",
    locationId: "room_interior",
    visibleActivityId: "noticing_closed_room_window",
    performanceDirective:
      "From inside, stage her looking toward the closed window without touching it or changing anything in the room.",
    performanceEnvelope: {
      targetObjectIds: ["room_window"],
      closurePolicy: {
        kind: "authored_routine_postcondition",
        postconditionId: "wife_inside_looking_at_closed_window",
      },
    },
    hintBrief: {
      hintId: "wife_notices_window_remains_closed",
      safeFact:
        "From inside she looks toward the closed window and changes nothing.",
      clarity: "clear",
      required: true,
      forbiddenInterpretations,
    },
  },
};

const progressedRetryRoutines: Partial<
  Record<Chapter1CausalRoutineId, Chapter1CausalRoutineDefinition>
> = {
  husband_reaches_handle_without_turning: {
    ...chapter1CausalRoutines.husband_reaches_handle_without_turning,
    variantId: "thumb_waits_beside_latch",
    performanceDirective:
      "Stage the later attempt at the same closed handle: his hand arrives more directly and his thumb waits beside the latch without pressing or turning it.",
    hintBrief: {
      ...chapter1CausalRoutines.husband_reaches_handle_without_turning
        .hintBrief,
      hintId: "husband_later_attempt_reaches_latch",
      safeFact:
        "On a later attempt, his hand arrives more directly and his thumb waits beside the latch; the door remains fully closed.",
    },
  },
  wife_stops_one_step_short: {
    ...chapter1CausalRoutines.wife_stops_one_step_short,
    variantId: "hold_at_nearer_mark",
    performanceDirective:
      "Stage her later return to the same side of the threshold: she reaches the nearer stopping mark without retreating at once, while the door and room remain unchanged.",
    hintBrief: {
      ...chapter1CausalRoutines.wife_stops_one_step_short.hintBrief,
      hintId: "wife_holds_at_nearer_mark",
      safeFact:
        "On a later return she holds at the nearer stopping mark without crossing it; the door and room remain unchanged.",
    },
  },
  wife_returns_to_boundary: {
    ...chapter1CausalRoutines.wife_returns_to_boundary,
    variantId: "toe_aligns_with_line",
    performanceDirective:
      "Stage her later return to the same boundary: align the toe of one foot with the line and leave it there without crossing.",
    hintBrief: {
      ...chapter1CausalRoutines.wife_returns_to_boundary.hintBrief,
      hintId: "wife_aligns_toe_with_boundary",
      safeFact:
        "On a later return she aligns one toe with, not across, the boundary and remains there.",
    },
  },
  wife_notices_closed_window: {
    ...chapter1CausalRoutines.wife_notices_closed_window,
    variantId: "pause_within_window_reach",
    performanceDirective:
      "From inside on a later day, stage her stopping within reach of the closed window while leaving her hands lowered and changing nothing.",
    hintBrief: {
      ...chapter1CausalRoutines.wife_notices_closed_window.hintBrief,
      hintId: "wife_pauses_within_window_reach",
      safeFact:
        "On a later day she stops within reach of the closed window but does not touch or change it.",
    },
  },
};

const surfacedRetryRoutines: Partial<
  Record<Chapter1CausalRoutineId, Chapter1CausalRoutineDefinition>
> = {
  wife_returns_to_boundary: {
    ...progressedRetryRoutines.wife_returns_to_boundary!,
    variantId: "forward_weight_settles_beside_line",
    performanceDirective:
      "Stage her surfaced later return to the same boundary: show a reversible forward weight shift toward the room, then settle with one foot beside the line without crossing it.",
    hintBrief: {
      ...progressedRetryRoutines.wife_returns_to_boundary!.hintBrief,
      hintId: "wife_shifts_weight_toward_boundary",
      safeFact:
        "On a later return she shifts her weight toward the room, then settles with one foot beside, not across, the boundary.",
    },
  },
};

export const getChapter1CausalRoutineDefinition = (
  routineId: Chapter1CausalRoutineId,
): Chapter1CausalRoutineDefinition =>
  structuredClone(chapter1CausalRoutines[routineId]);

export const selectChapter1CausalRoutineDefinition = (
  routineId: Chapter1CausalRoutineId,
  stage: PsychologicalStage,
): Chapter1CausalRoutineDefinition => {
  const surfaced = surfacedRetryRoutines[routineId];
  if (surfaced !== undefined && stage === "surfaced") {
    return structuredClone(surfaced);
  }
  const progressed = progressedRetryRoutines[routineId];
  if (
    progressed !== undefined &&
    (stage === "faintly_imagined" || stage === "surfaced")
  ) {
    return structuredClone(progressed);
  }
  return getChapter1CausalRoutineDefinition(routineId);
};

export const getChapter1CausalRoutineVariant = (
  routineId: Chapter1CausalRoutineId,
  variantId: string,
): Chapter1CausalRoutineDefinition => {
  const base = chapter1CausalRoutines[routineId];
  const progressed = progressedRetryRoutines[routineId];
  const surfaced = surfacedRetryRoutines[routineId];
  const match =
    base.variantId === variantId
      ? base
      : progressed?.variantId === variantId
        ? progressed
        : surfaced?.variantId === variantId
          ? surfaced
          : null;
  if (match === null) {
    throw new Error(
      `Unknown Chapter 1 causal RoutineVariant: ${routineId}/${variantId}`,
    );
  }
  return structuredClone(match);
};

export const isChapter1CausalRoutineId = (
  routineId: string,
): routineId is Chapter1CausalRoutineId =>
  Object.hasOwn(chapter1CausalRoutines, routineId);

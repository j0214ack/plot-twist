import type { NarrativeActionId, NPCId } from "./world";

export type ActionOptionId =
  | "spend-time-with-clock"
  | "open-door-a-crack"
  | "wait-at-threshold"
  | "step-inside-room"
  | "open-room-window"
  | "say-one-honest-thing";

export type PerformanceEnvelope = {
  targetObjectIds: Array<
    | "living_room_clock"
    | "hallway_door"
    | "room_threshold"
    | "room_interior"
    | "room_window"
  >;
  reversibleFreedom?: "accepted_persona_owned_motif";
  closurePolicy: {
    kind: "authored_postcondition";
    postconditionId:
      | "living_room_clock_accurate"
      | "hallway_door_slightly_open"
      | "wife_remains_at_threshold"
      | "wife_enters_room"
      | "room_window_open_one_hand_width"
      | "bounded_spousal_exchange_recorded";
  };
};

export type NarrativeActionDefinition = {
  actionId: NarrativeActionId;
  description: string;
  recipientActorIds?: NPCId[];
  option: {
    optionId: ActionOptionId;
  };
  variants: Array<{
    variantId: string;
    description: string;
  }>;
  performanceEnvelope: PerformanceEnvelope;
};

const narrativeActions: Record<NarrativeActionId, NarrativeActionDefinition> = {
  interact_with_living_room_clock: {
    actionId: "interact_with_living_room_clock",
    description:
      "Physically interact with the living-room clock for a brief period; when finished, leave it intact, running, and showing the current time.",
    option: {
      optionId: "spend-time-with-clock",
    },
    variants: [
      {
        variantId: "accepted_clock_interaction",
        description:
          "Follow the Persona's accepted reversible clock-interaction motif, then leave the clock intact, running, and showing the current time.",
      },
    ],
    performanceEnvelope: {
      targetObjectIds: ["living_room_clock"],
      reversibleFreedom: "accepted_persona_owned_motif",
      closurePolicy: {
        kind: "authored_postcondition",
        postconditionId: "living_room_clock_accurate",
      },
    },
  },
  open_door_a_crack: {
    actionId: "open_door_a_crack",
    description:
      "Open the fully closed hallway door only far enough to leave a narrow gap, then walk away.",
    option: {
      optionId: "open-door-a-crack",
    },
    variants: [
      {
        variantId: "open_narrow_gap",
        description:
          "Turn the handle, open a narrow gap in the closed door, and walk away.",
      },
    ],
    performanceEnvelope: {
      targetObjectIds: ["hallway_door"],
      closurePolicy: {
        kind: "authored_postcondition",
        postconditionId: "hallway_door_slightly_open",
      },
    },
  },
  remain_at_threshold: {
    actionId: "remain_at_threshold",
    description:
      "Remain at the room threshold for one breath without touching or changing anything.",
    option: {
      optionId: "wait-at-threshold",
    },
    variants: [
      {
        variantId: "one_breath_at_threshold",
        description:
          "Remain at the threshold for one breath without touching or changing anything.",
      },
    ],
    performanceEnvelope: {
      targetObjectIds: ["room_threshold"],
      closurePolicy: {
        kind: "authored_postcondition",
        postconditionId: "wife_remains_at_threshold",
      },
    },
  },
  step_inside_room: {
    actionId: "step_inside_room",
    description:
      "Step one pace across the room threshold, remain briefly without touching anything, then step back.",
    option: {
      optionId: "step-inside-room",
    },
    variants: [
      {
        variantId: "one_pace_inside_then_back",
        description:
          "Cross one pace into the room, remain briefly without touching anything, then return to the threshold.",
      },
    ],
    performanceEnvelope: {
      targetObjectIds: ["room_threshold", "room_interior"],
      closurePolicy: {
        kind: "authored_postcondition",
        postconditionId: "wife_enters_room",
      },
    },
  },
  open_room_window: {
    actionId: "open_room_window",
    description:
      "Open the closed room window one hand-width and leave it there.",
    option: {
      optionId: "open-room-window",
    },
    variants: [
      {
        variantId: "open_one_hand_width",
        description:
          "Open the closed room window one hand-width and leave it open at that exact stopping point.",
      },
    ],
    performanceEnvelope: {
      targetObjectIds: ["room_window"],
      closurePolicy: {
        kind: "authored_postcondition",
        postconditionId: "room_window_open_one_hand_width",
      },
    },
  },
  say_one_honest_thing_to_elise: {
    actionId: "say_one_honest_thing_to_elise",
    description:
      "At the next suitable shared evening moment, say one honest thing to Elise without requiring an immediate answer or larger resolution.",
    recipientActorIds: ["wife"],
    option: {
      optionId: "say-one-honest-thing",
    },
    variants: [
      {
        variantId: "one_honest_opening",
        description:
          "Make one honest opening, allow Elise one response, and let the exchange end without forcing a conclusion.",
      },
    ],
    performanceEnvelope: {
      targetObjectIds: [],
      closurePolicy: {
        kind: "authored_postcondition",
        postconditionId: "bounded_spousal_exchange_recorded",
      },
    },
  },
};

export const getNarrativeActionDefinition = (
  actionId: NarrativeActionId,
): NarrativeActionDefinition => structuredClone(narrativeActions[actionId]);

export const narrativeActionIdForOption = (
  optionId: ActionOptionId,
): NarrativeActionId => getNarrativeActionDefinitionForOption(optionId).actionId;

export const getNarrativeActionDefinitionForOption = (
  optionId: ActionOptionId,
): NarrativeActionDefinition => {
  const definition = Object.values(narrativeActions).find(
    ({ option }) => option.optionId === optionId,
  );
  if (!definition) {
    throw new Error(`Unknown Action option: ${optionId}`);
  }
  return structuredClone(definition);
};

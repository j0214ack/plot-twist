import type {
  ActionFeedback,
  ActionOptionId,
  GameControllerSnapshot,
} from "./controller";
import { getNarrativeActionDefinitionForOption } from "./narrative-actions";
import type {
  GameEvent,
  LocationId,
  NPCId,
  VisibleActivityId,
  WorldSnapshot,
} from "./world";
import type { PerformanceRecord } from "./performance";
import { isAmbientRoutineId } from "./ambient-routines";
import { isChapter1CausalRoutineId } from "./chapter1-routines";

export type PresentationCueId =
  | "living_room_clock_slow"
  | "husband_notices_clock"
  | "performance_beat"
  | "husband_sits"
  | "husband_rinses_cup"
  | "husband_folds_sofa_throw"
  | "husband_turns_off_lights"
  | "wife_drinks"
  | "husband_reaches_door"
  | "world_paused"
  | "world_resumed"
  | "husband_interacts_clock"
  | "living_room_clock_state_changed"
  | "wife_notices_clock"
  | "husband_opens_door"
  | "hallway_door_state_changed"
  | "wife_enters_hallway"
  | "wife_notices_door"
  | "wife_stays_at_threshold"
  | "wife_steps_inside_room"
  | "wife_opens_room_window"
  | "husband_turns_before_closed_door"
  | "wife_takes_long_route"
  | "husband_reaches_closed_handle"
  | "husband_tests_window_latch"
  | "wife_squares_hallway_runner"
  | "wife_observes_first_gap"
  | "wife_stops_one_step_short"
  | "wife_returns_to_boundary"
  | "wife_notices_closed_window"
  | "room_window_state_changed"
  | "room_window_noticed";

export type PresentationCue = {
  at: number;
  cueId: PresentationCueId;
  locationId?: LocationId;
  text?: string;
};

export type WorldView = {
  time: number;
  chapter: WorldSnapshot["chapter"];
  chapterDay: number | null;
  localTime: number;
  paused: boolean;
  actors: Array<{
    id: NPCId;
    locationId: LocationId;
    visibleActivityId: VisibleActivityId;
  }>;
  objects: Array<
    | {
        id: "hallway_door";
        locationId: "hallway";
        visibleStateId: WorldSnapshot["worldFacts"]["hallwayDoor"];
      }
    | {
        id: "living_room_clock";
        locationId: "living_room";
        visibleStateId: WorldSnapshot["worldFacts"]["livingRoomClock"];
      }
    | {
        id: "room_window";
        locationId: "room_interior";
        visibleStateId: WorldSnapshot["worldFacts"]["roomWindow"];
      }
  >;
  timeline: PresentationCue[];
};

export type UIView = {
  mode: "running" | "paused";
  selectedActor: {
    id: NPCId;
    label: string;
  } | null;
  actionOptions: Array<{
    optionId: ActionOptionId;
    label: string;
  }>;
  conversation: {
    status: GameControllerSnapshot["interaction"]["conversationStatus"];
    messages: GameControllerSnapshot["interaction"]["messages"];
    errorMessage: string | null;
    feedbackMessage: string | null;
  };
};

export type GameView = {
  world: WorldView;
  ui: UIView;
};

const actorLabels: Record<NPCId, string> = {
  husband: "Martin",
  wife: "Elise",
};

export const projectWorld = (
  snapshot: WorldSnapshot,
  events: GameEvent[],
  performances: PerformanceRecord[] = [],
): WorldView => ({
  time: snapshot.time,
  chapter: snapshot.chapter,
  chapterDay: snapshot.chapterDay,
  localTime: snapshot.time % (24 * 60),
  paused: snapshot.paused,
  actors: (snapshot.chapter === "tutorial" &&
  snapshot.worldFacts.livingRoomClock === "three_minutes_slow"
    ? (["husband"] as const)
    : (["husband", "wife"] as const)
  ).map((id) => ({
    id,
    ...snapshot.npcs[id],
  })),
  objects: [
    {
      id: "hallway_door",
      locationId: "hallway",
      visibleStateId: snapshot.worldFacts.hallwayDoor,
    },
    {
      id: "living_room_clock",
      locationId: "living_room",
      visibleStateId: snapshot.worldFacts.livingRoomClock,
    },
    ...(snapshot.worldFacts.roomInterior === "revealed"
      ? [
          {
            id: "room_window" as const,
            locationId: "room_interior" as const,
            visibleStateId: snapshot.worldFacts.roomWindow,
          },
        ]
      : []),
  ],
  timeline: events.flatMap((event, eventIndex) => {
    const eventPerformances = performances.filter(
      (performance) => performance.afterEventIndex === eventIndex,
    );
    return [
      ...projectEvent(event, eventPerformances.length > 0),
      ...eventPerformances.flatMap((performance) =>
        performance.beats.map((text) => ({
          at: performance.at,
          cueId: "performance_beat" as const,
          text,
        })),
      ),
    ];
  }),
});

export const projectGame = (
  snapshot: GameControllerSnapshot,
): GameView => ({
  world: projectWorld(
    snapshot.world,
    snapshot.events,
    snapshot.performances,
  ),
  ui: {
    mode: snapshot.interaction.mode,
    selectedActor:
      snapshot.interaction.selectedNpcId === null
        ? null
        : {
            id: snapshot.interaction.selectedNpcId,
            label: actorLabels[snapshot.interaction.selectedNpcId],
          },
    actionOptions: snapshot.interaction.availableActionOptionIds.map(
      (optionId) => ({
        optionId,
        label: getNarrativeActionDefinitionForOption(optionId).option.label,
      }),
    ),
    conversation: {
      status: snapshot.interaction.conversationStatus,
      messages: structuredClone(snapshot.interaction.messages),
      errorMessage: snapshot.interaction.errorMessage,
      feedbackMessage: actionFeedbackMessage(
        snapshot.interaction.actionFeedback,
        snapshot.interaction.selectedNpcId,
      ),
    },
  },
});

const actionFeedbackMessage = (
  feedback: ActionFeedback | null,
  actorId: NPCId | null,
): string | null => {
  if (feedback === null || actorId === null) return null;
  const pronoun = actorId === "husband" ? "He" : "She";
  return feedback === "not_ready"
    ? `${pronoun} can consider this, but has not chosen to do it now. Ask what still separates considering it from choosing it today.`
    : `${pronoun} refuses this step for now. Try another approach.`;
};

const projectEvent = (
  event: GameEvent,
  hasGeneratedPerformance: boolean,
): PresentationCue[] => {
  switch (event.type) {
    case "routine_executed":
      return [
        ...(hasGeneratedPerformance &&
        (isAmbientRoutineId(event.routineId) ||
          isChapter1CausalRoutineId(event.routineId))
          ? []
          : [
              {
                at: event.at,
                cueId: routineCue(event.routineId),
                locationId: event.locationId,
              },
            ]),
        ...(event.routineId === "husband_notices_slow_clock" &&
        !hasGeneratedPerformance
          ? [
              {
                at: event.at,
                cueId: "husband_notices_clock" as const,
                locationId: event.locationId,
              },
            ]
          : []),
      ];
    case "world_paused":
      return [{ at: event.at, cueId: "world_paused" }];
    case "world_resumed":
      return [{ at: event.at, cueId: "world_resumed" }];
    case "narrative_action_executed":
      if (hasGeneratedPerformance) return [];
      return [
        {
          at: event.at,
          cueId: narrativeActionCue(event.actionId),
          locationId: event.locationId,
        },
      ];
    case "evidence_activated":
      return [
        {
          at: event.at,
          ...evidenceActivatedCue(event.evidenceId),
        },
      ];
    case "evidence_observed":
      return [
        {
          at: event.at,
          ...evidenceObservedCue(event.evidenceId),
        },
      ];
    case "ambient_routine_selected":
      return [];
  }
};

const narrativeActionCue = (
  actionId: Extract<GameEvent, { type: "narrative_action_executed" }>["actionId"],
): PresentationCueId => {
  switch (actionId) {
    case "interact_with_living_room_clock":
      return "husband_interacts_clock";
    case "open_door_a_crack":
      return "husband_opens_door";
    case "remain_at_threshold":
      return "wife_stays_at_threshold";
    case "step_inside_room":
      return "wife_steps_inside_room";
    case "open_room_window":
      return "wife_opens_room_window";
  }
};

const routineCue = (
  routineId: Extract<GameEvent, { type: "routine_executed" }>["routineId"],
): PresentationCueId => {
  switch (routineId) {
    case "husband_notices_slow_clock":
      return "living_room_clock_slow";
    case "husband_sits_on_sofa":
      return "husband_sits";
    case "husband_rinses_cup":
      return "husband_rinses_cup";
    case "husband_folds_sofa_throw":
      return "husband_folds_sofa_throw";
    case "husband_turns_off_lights":
      return "husband_turns_off_lights";
    case "wife_drinks_water":
      return "wife_drinks";
    case "husband_walks_to_hallway_door":
      return "husband_reaches_door";
    case "wife_walks_through_hallway":
      return "wife_enters_hallway";
    case "husband_route_turns_before_closed_door":
      return "husband_turns_before_closed_door";
    case "wife_takes_long_route_around_hall":
      return "wife_takes_long_route";
    case "husband_reaches_handle_without_turning":
      return "husband_reaches_closed_handle";
    case "husband_tests_window_latch":
      return "husband_tests_window_latch";
    case "wife_squares_hallway_runner":
      return "wife_squares_hallway_runner";
    case "wife_observes_first_gap":
      return "wife_observes_first_gap";
    case "wife_stops_one_step_short":
      return "wife_stops_one_step_short";
    case "wife_returns_to_boundary":
      return "wife_returns_to_boundary";
    case "wife_notices_closed_window":
      return "wife_notices_closed_window";
  }
};

const evidenceActivatedCue = (
  evidenceId: Extract<GameEvent, { type: "evidence_activated" }>["evidenceId"],
): Pick<PresentationCue, "cueId" | "locationId"> => {
  switch (evidenceId) {
    case "living_room_clock_is_accurate":
      return {
        cueId: "living_room_clock_state_changed",
        locationId: "living_room",
      };
    case "door_is_slightly_open":
      return {
        cueId: "hallway_door_state_changed",
        locationId: "hallway",
      };
    case "room_window_is_open":
      return {
        cueId: "room_window_state_changed",
        locationId: "room_interior",
      };
  }
};

const evidenceObservedCue = (
  evidenceId: Extract<GameEvent, { type: "evidence_observed" }>["evidenceId"],
): Pick<PresentationCue, "cueId" | "locationId"> => {
  switch (evidenceId) {
    case "living_room_clock_is_accurate":
      return { cueId: "wife_notices_clock", locationId: "dining_area" };
    case "door_is_slightly_open":
      return { cueId: "wife_notices_door", locationId: "hallway" };
    case "room_window_is_open":
      return { cueId: "room_window_noticed", locationId: "room_interior" };
  }
};

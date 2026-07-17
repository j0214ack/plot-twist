import type {
  ActionFeedback,
  ActionOptionId,
  GameControllerSnapshot,
} from "./controller";
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
import {
  localize,
  localizeActionLabel,
  localizeCharacterName,
  type GameLocale,
} from "./localization";

export type PresentationCueId =
  | "living_room_clock_slow"
  | "husband_notices_clock"
  | "husband_lingers_beneath_clock"
  | "husband_touches_clock_frame"
  | "performance_beat"
  | "husband_sits"
  | "husband_rinses_cup"
  | "husband_folds_sofa_throw"
  | "husband_turns_off_lights"
  | "husband_leaves_work"
  | "wife_leaves_work"
  | "wife_returns_work"
  | "husband_returns_work"
  | "husband_leaves_shopping"
  | "wife_leaves_shopping"
  | "wife_returns_groceries"
  | "husband_returns_groceries"
  | "husband_leaves_sunday_outing"
  | "wife_leaves_sunday_outing"
  | "wife_returns_sunday_outing"
  | "husband_returns_sunday_outing"
  | "husband_settles_at_dining_table"
  | "wife_settles_at_dining_table"
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
  | "relationship_talk_practical_deflection"
  | "relationship_talk_distance_acknowledged"
  | "relationship_talk_one_truth_returned"
  | "husband_turns_before_closed_door"
  | "wife_takes_long_route"
  | "husband_reaches_closed_handle"
  | "husband_waits_beside_latch"
  | "husband_tests_window_latch"
  | "wife_squares_hallway_runner"
  | "wife_observes_first_gap"
  | "wife_stops_one_step_short"
  | "wife_holds_at_nearer_mark"
  | "wife_returns_to_boundary"
  | "wife_aligns_toe_with_boundary"
  | "wife_shifts_weight_toward_boundary"
  | "wife_notices_closed_window"
  | "wife_pauses_within_window_reach"
  | "room_window_state_changed"
  | "room_window_noticed";

export type PresentationCue = {
  at: number;
  cueId: PresentationCueId;
  locationId?: LocationId;
  text?: string;
};

export type WorldView = {
  locale: GameLocale;
  time: number;
  weekdayId: WorldSnapshot["weekdayId"];
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
  locale: GameLocale;
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

export const projectWorld = (
  snapshot: WorldSnapshot,
  events: GameEvent[],
  performances: PerformanceRecord[] = [],
  locale: GameLocale = "en",
): WorldView => ({
  locale,
  time: snapshot.time,
  weekdayId: snapshot.weekdayId,
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
    snapshot.locale,
  ),
  ui: {
    locale: snapshot.locale,
    mode: snapshot.interaction.mode,
    selectedActor:
      snapshot.interaction.selectedNpcId === null
        ? null
        : {
            id: snapshot.interaction.selectedNpcId,
            label: localizeCharacterName(
              snapshot.locale,
              snapshot.interaction.selectedNpcId,
            ),
          },
    actionOptions: snapshot.interaction.availableActionOptionIds.map(
      (optionId) => ({
        optionId,
        label: localizeActionLabel(snapshot.locale, optionId),
      }),
    ),
    conversation: {
      status: snapshot.interaction.conversationStatus,
      messages: structuredClone(snapshot.interaction.messages),
      errorMessage: snapshot.interaction.errorMessage,
      feedbackMessage: actionFeedbackMessage(
        snapshot.locale,
        snapshot.interaction.actionFeedback,
        snapshot.interaction.selectedNpcId,
      ),
    },
  },
});

const actionFeedbackMessage = (
  locale: GameLocale,
  feedback: ActionFeedback | null,
  actorId: NPCId | null,
): string | null => {
  if (feedback === null || actorId === null) return null;
  return feedback === "not_ready"
    ? localize(locale, `ui.feedbackNotReady.${actorId}`)
    : localize(locale, `ui.feedbackRefuse.${actorId}`);
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
                cueId: routineCue(event),
                locationId: event.locationId,
              },
            ]),
        ...(event.routineId === "husband_notices_slow_clock" &&
        !hasGeneratedPerformance
          ? [
              {
                at: event.at,
                cueId: clockRoutineCue(event.routineVariantId),
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
          cueId: narrativeActionCue(event),
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
  event: Extract<GameEvent, { type: "narrative_action_executed" }>,
): PresentationCueId => {
  switch (event.actionId) {
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
    case "say_one_honest_thing_to_elise":
      switch (event.relationshipOutcomeId) {
        case "practical_deflection":
          return "relationship_talk_practical_deflection";
        case "distance_acknowledged":
          return "relationship_talk_distance_acknowledged";
        case "one_truth_returned":
          return "relationship_talk_one_truth_returned";
        default:
          throw new Error("Relationship Action event has no authored outcome");
      }
  }
};

const routineCue = (
  event: Extract<GameEvent, { type: "routine_executed" }>,
): PresentationCueId => {
  switch (event.routineId) {
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
    case "husband_leaves_for_work":
      return "husband_leaves_work";
    case "wife_leaves_for_work":
      return "wife_leaves_work";
    case "wife_returns_from_work":
      return "wife_returns_work";
    case "husband_returns_from_work":
      return "husband_returns_work";
    case "husband_leaves_for_household_shopping":
      return "husband_leaves_shopping";
    case "wife_leaves_for_household_shopping":
      return "wife_leaves_shopping";
    case "wife_returns_with_groceries":
      return "wife_returns_groceries";
    case "husband_returns_with_groceries":
      return "husband_returns_groceries";
    case "husband_leaves_for_sunday_outing":
      return "husband_leaves_sunday_outing";
    case "wife_leaves_for_sunday_outing":
      return "wife_leaves_sunday_outing";
    case "wife_returns_from_sunday_outing":
      return "wife_returns_sunday_outing";
    case "husband_returns_from_sunday_outing":
      return "husband_returns_sunday_outing";
    case "husband_settles_at_dining_table":
      return "husband_settles_at_dining_table";
    case "wife_settles_at_dining_table":
      return "wife_settles_at_dining_table";
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
      return event.routineVariantId === "thumb_waits_beside_latch"
        ? "husband_waits_beside_latch"
        : "husband_reaches_closed_handle";
    case "husband_tests_window_latch":
      return "husband_tests_window_latch";
    case "wife_squares_hallway_runner":
      return "wife_squares_hallway_runner";
    case "wife_observes_first_gap":
      return "wife_observes_first_gap";
    case "wife_stops_one_step_short":
      return event.routineVariantId === "hold_at_nearer_mark"
        ? "wife_holds_at_nearer_mark"
        : "wife_stops_one_step_short";
    case "wife_returns_to_boundary":
      return event.routineVariantId === "toe_aligns_with_line"
        ? "wife_aligns_toe_with_boundary"
        : event.routineVariantId === "forward_weight_settles_beside_line"
          ? "wife_shifts_weight_toward_boundary"
          : "wife_returns_to_boundary";
    case "wife_notices_closed_window":
      return event.routineVariantId === "pause_within_window_reach"
        ? "wife_pauses_within_window_reach"
        : "wife_notices_closed_window";
  }
};

const clockRoutineCue = (
  variantId: string | undefined,
): PresentationCueId => {
  switch (variantId) {
    case "linger_beneath_clock":
      return "husband_lingers_beneath_clock";
    case "touch_clock_frame":
      return "husband_touches_clock_frame";
    default:
      return "husband_notices_clock";
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

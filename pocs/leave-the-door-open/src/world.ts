export type NPCId = "husband" | "wife";

export type CalendarWeekdayId =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

import {
  createSeededAmbientRoutineChoice,
  getAmbientRoutineDefinition,
  type AmbientChanceSnapshot,
  type AmbientRoutineChoicePort,
  type AmbientRoutineId,
  type AmbientSlotId,
} from "./ambient-routines";
import {
  getRelationshipConversationOutcomeDefinition,
  isRelationshipConversationOutcomeId,
  type RelationshipConversationOutcomeId,
} from "./relationship-conversation-outcomes";

export type LocationId =
  | "living_room"
  | "dining_area"
  | "hallway"
  | "room_threshold"
  | "room_interior"
  | "away_from_home";

export type RoutineBehaviorId =
  | "husband_notices_slow_clock"
  | "husband_sits_on_sofa"
  | "husband_rinses_cup"
  | "husband_folds_sofa_throw"
  | "husband_turns_off_lights"
  | "husband_leaves_for_work"
  | "wife_leaves_for_work"
  | "wife_returns_from_work"
  | "husband_returns_from_work"
  | "husband_leaves_for_household_shopping"
  | "wife_leaves_for_household_shopping"
  | "wife_returns_with_groceries"
  | "husband_returns_with_groceries"
  | "husband_leaves_for_sunday_outing"
  | "wife_leaves_for_sunday_outing"
  | "wife_returns_from_sunday_outing"
  | "husband_returns_from_sunday_outing"
  | "husband_settles_at_dining_table"
  | "wife_settles_at_dining_table"
  | "wife_drinks_water"
  | "husband_walks_to_hallway_door"
  | "wife_walks_through_hallway"
  | "husband_route_turns_before_closed_door"
  | "wife_takes_long_route_around_hall"
  | "husband_reaches_handle_without_turning"
  | "wife_observes_first_gap"
  | "wife_stops_one_step_short"
  | "wife_returns_to_boundary"
  | "wife_notices_closed_window"
  | AmbientRoutineId;

export type NarrativeActionId =
  | "interact_with_living_room_clock"
  | "open_door_a_crack"
  | "remain_at_threshold"
  | "step_inside_room"
  | "open_room_window"
  | "say_one_honest_thing_to_elise";

export type EvidenceId =
  | "living_room_clock_is_accurate"
  | "door_is_slightly_open"
  | "room_window_is_open";

export type VisibleActivityId =
  | "idle"
  | "noticing_slow_clock"
  | "interacting_with_clock"
  | "sitting_on_sofa"
  | "rinsing_cup"
  | "folding_sofa_throw"
  | "turning_off_lights"
  | "away_at_work"
  | "returning_from_work"
  | "away_shopping"
  | "returning_with_groceries"
  | "away_on_outing"
  | "returning_from_outing"
  | "settling_at_dining_table"
  | "drinking_water"
  | "stopped_at_door"
  | "opening_door_a_crack"
  | "walking_through_hallway"
  | "remaining_at_threshold"
  | "turning_before_closed_door"
  | "taking_long_route_around_hall"
  | "reaching_closed_door_handle"
  | "observing_first_door_gap"
  | "stopping_one_step_short"
  | "returning_to_boundary"
  | "stepping_inside_then_back"
  | "noticing_closed_room_window"
  | "opening_room_window"
  | "making_one_honest_opening"
  | "redirecting_honest_talk_to_practicalities"
  | "acknowledging_relationship_distance"
  | "returning_one_honest_sentence"
  | "testing_window_latch"
  | "squaring_hallway_runner";

export type NPCSnapshot = {
  locationId: LocationId;
  visibleActivityId: VisibleActivityId;
};

export type ChapterId = "tutorial" | 1;

export type RoutineExecutedEvent = {
  at: number;
  type: "routine_executed";
  actorId: NPCId;
  routineId: RoutineBehaviorId;
  routineVariantId?: string;
  locationId: LocationId;
  visibleActivityId: VisibleActivityId;
};

export type WorldPauseEvent = {
  at: number;
  type: "world_paused" | "world_resumed";
};

export type NarrativeActionExecutedEvent = {
  at: number;
  type: "narrative_action_executed";
  actorId: NPCId;
  recipientId?: NPCId;
  actionId: NarrativeActionId;
  relationshipOutcomeId?: RelationshipConversationOutcomeId;
  locationId: LocationId;
  visibleActivityId: VisibleActivityId;
};

export type EvidenceActivatedEvent = {
  at: number;
  type: "evidence_activated";
  evidenceId: EvidenceId;
};

export type EvidenceObservedEvent = {
  at: number;
  type: "evidence_observed";
  evidenceId: EvidenceId;
  observerId: NPCId;
};

export type AmbientRoutineSelectedEvent = {
  at: number;
  type: "ambient_routine_selected";
  slotId: AmbientSlotId;
  routineId: AmbientRoutineId | null;
};

export type GameEvent =
  | RoutineExecutedEvent
  | WorldPauseEvent
  | NarrativeActionExecutedEvent
  | EvidenceActivatedEvent
  | EvidenceObservedEvent
  | AmbientRoutineSelectedEvent;

export type ActionIntention = {
  actorId: NPCId;
  actionId: NarrativeActionId;
  relationshipOutcomeId?: RelationshipConversationOutcomeId;
};

export type WorldFacts = {
  livingRoomClock: "three_minutes_slow" | "accurate";
  hallwayDoor: "closed" | "slightly_open";
  wifeObservedDoorOnChapterDay: number | null;
  wifeHasRemainedAtThreshold: boolean;
  wifeRemainedAtThresholdOnChapterDay: number | null;
  roomInterior: "hidden" | "revealed";
  wifeHasEnteredRoom: boolean;
  wifeEnteredRoomOnChapterDay: number | null;
  roomWindow: "closed" | "open_one_hand_width";
  martinEliseConversation:
    | "not_attempted"
    | RelationshipConversationOutcomeId;
  martinEliseConversationOnChapterDay: number | null;
  chapter1Complete: boolean;
};

export type EvidenceSnapshot = {
  active: boolean;
  description: string;
  observedBy: NPCId[];
};

export type WorldSnapshot = {
  time: number;
  weekdayId: CalendarWeekdayId;
  chapter: ChapterId;
  chapterDay: number | null;
  ambientChance: AmbientChanceSnapshot | null;
  paused: boolean;
  npcs: Record<NPCId, NPCSnapshot>;
  worldFacts: WorldFacts;
  intentions: ActionIntention[];
  completedActions: ActionIntention[];
  actionProgress: Partial<
    Record<NPCId, Partial<Record<NarrativeActionId, PsychologicalStage>>>
  >;
  evidence: Partial<Record<EvidenceId, EvidenceSnapshot>>;
};

type GameState = Omit<
  WorldSnapshot,
  "actionProgress" | "ambientChance" | "weekdayId"
> & {
  eventLog: GameEvent[];
};

const START_TIME = 7 * 60 + 56;
const MINUTES_PER_DAY = 24 * 60;
const weekdaysFromEpoch: CalendarWeekdayId[] = [
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
];

export const calendarWeekdayAt = (time: number): CalendarWeekdayId =>
  weekdaysFromEpoch[Math.floor(time / MINUTES_PER_DAY) % 7]!;
const psychologicalStageOrder: PsychologicalStage[] = [
  "latent",
  "faintly_imagined",
  "surfaced",
  "intended",
  "completed",
];

export class VerticalSliceWorld {
  readonly #ambientChoice: AmbientRoutineChoicePort;
  #chapterOneStartDay: number | null = null;
  readonly #actionProgress: Partial<
    Record<NPCId, Partial<Record<NarrativeActionId, PsychologicalStage>>>
  > = {};
  readonly #state: GameState = {
    time: START_TIME,
    chapter: "tutorial",
    chapterDay: null,
    paused: false,
    npcs: {
      husband: {
        locationId: "living_room",
        visibleActivityId: "idle",
      },
      wife: {
        locationId: "dining_area",
        visibleActivityId: "idle",
      },
    },
    worldFacts: {
      livingRoomClock: "three_minutes_slow",
      hallwayDoor: "closed",
      wifeObservedDoorOnChapterDay: null,
      wifeHasRemainedAtThreshold: false,
      wifeRemainedAtThresholdOnChapterDay: null,
      roomInterior: "hidden",
      wifeHasEnteredRoom: false,
      wifeEnteredRoomOnChapterDay: null,
      roomWindow: "closed",
      martinEliseConversation: "not_attempted",
      martinEliseConversationOnChapterDay: null,
      chapter1Complete: false,
    },
    intentions: [],
    completedActions: [],
    evidence: {},
    eventLog: [],
  };

  constructor(options: { ambientChoice?: AmbientRoutineChoicePort } = {}) {
    this.#ambientChoice =
      options.ambientChoice ?? createSeededAmbientRoutineChoice();
  }

  advanceTo(targetTime: number): void {
    if (targetTime < this.#state.time) {
      throw new Error("World time cannot move backwards");
    }
    if (this.#state.paused) {
      return;
    }

    for (let minute = this.#state.time + 1; minute <= targetTime; minute += 1) {
      this.#state.time = minute;
      this.#advanceChapterClock(minute);
      this.#executeScheduledRoutines(minute);
      this.#executeNarrativeDecisionPoints(minute);
    }
  }

  pause(): void {
    if (this.#state.paused) {
      return;
    }
    this.#state.paused = true;
    this.#state.eventLog.push({
      at: this.#state.time,
      type: "world_paused",
    });
  }

  resume(): void {
    if (!this.#state.paused) {
      return;
    }
    this.#state.paused = false;
    this.#state.eventLog.push({
      at: this.#state.time,
      type: "world_resumed",
    });
  }

  setActionProgress(
    actorId: NPCId,
    actionId: NarrativeActionId,
    stage: PsychologicalStage,
  ): void {
    const actorProgress = (this.#actionProgress[actorId] ??= {});
    const current = actorProgress[actionId];
    if (
      current === undefined ||
      psychologicalStageOrder.indexOf(stage) >
        psychologicalStageOrder.indexOf(current)
    ) {
      actorProgress[actionId] = stage;
    }
  }

  eligibleNarrativeActions(actorId: NPCId): NarrativeActionId[] {
    const relationshipActions = this.#eligibleRelationshipActions(actorId);
    if (
      actorId === "husband" &&
      this.#state.chapter === "tutorial" &&
      this.#state.time % MINUTES_PER_DAY === 7 * 60 + 57 &&
      this.#state.npcs.husband.locationId === "living_room" &&
      this.#state.worldFacts.livingRoomClock === "three_minutes_slow" &&
      !this.#hasIntention("husband", "interact_with_living_room_clock") &&
      !this.#hasCompleted("husband", "interact_with_living_room_clock")
    ) {
      return ["interact_with_living_room_clock", ...relationshipActions];
    }
    if (
      actorId === "husband" &&
      this.#state.chapter === 1 &&
      (this.#state.chapterDay ?? 0) >= 2 &&
      this.#state.time % MINUTES_PER_DAY === 8 * 60 + 10 &&
      this.#state.npcs.husband.visibleActivityId ===
        "reaching_closed_door_handle" &&
      this.#hasCompleted("husband", "interact_with_living_room_clock") &&
      this.#state.npcs.husband.locationId === "hallway" &&
      this.#state.worldFacts.hallwayDoor === "closed" &&
      !this.#hasIntention("husband", "open_door_a_crack") &&
      !this.#hasCompleted("husband", "open_door_a_crack")
    ) {
      return ["open_door_a_crack", ...relationshipActions];
    }
    if (
      actorId === "wife" &&
      this.#state.evidence.door_is_slightly_open?.observedBy.includes("wife") &&
      this.#state.chapter === 1 &&
      this.#state.npcs.wife.visibleActivityId === "stopping_one_step_short" &&
      this.#state.worldFacts.wifeObservedDoorOnChapterDay !== null &&
      (this.#state.chapterDay ?? 0) >
        this.#state.worldFacts.wifeObservedDoorOnChapterDay &&
      !this.#hasIntention("wife", "remain_at_threshold") &&
      !this.#hasCompleted("wife", "remain_at_threshold")
    ) {
      return ["remain_at_threshold", ...relationshipActions];
    }
    if (
      actorId === "wife" &&
      this.#state.chapter === 1 &&
      this.#state.npcs.wife.locationId === "room_threshold" &&
      this.#state.npcs.wife.visibleActivityId === "returning_to_boundary" &&
      this.#state.worldFacts.hallwayDoor === "slightly_open" &&
      this.#state.worldFacts.wifeHasRemainedAtThreshold &&
      this.#state.worldFacts.wifeRemainedAtThresholdOnChapterDay !== null &&
      (this.#state.chapterDay ?? 0) >
        this.#state.worldFacts.wifeRemainedAtThresholdOnChapterDay &&
      this.#state.worldFacts.roomInterior === "hidden" &&
      !this.#hasIntention("wife", "step_inside_room") &&
      !this.#hasCompleted("wife", "step_inside_room")
    ) {
      return ["step_inside_room", ...relationshipActions];
    }
    if (
      actorId === "wife" &&
      this.#state.chapter === 1 &&
      this.#state.npcs.wife.locationId === "room_interior" &&
      this.#state.npcs.wife.visibleActivityId ===
        "noticing_closed_room_window" &&
      this.#state.worldFacts.hallwayDoor === "slightly_open" &&
      this.#state.worldFacts.roomInterior === "revealed" &&
      this.#state.worldFacts.wifeHasEnteredRoom &&
      this.#state.worldFacts.wifeEnteredRoomOnChapterDay !== null &&
      (this.#state.chapterDay ?? 0) >
        this.#state.worldFacts.wifeEnteredRoomOnChapterDay &&
      this.#state.worldFacts.roomWindow === "closed" &&
      !this.#hasIntention("wife", "open_room_window") &&
      !this.#hasCompleted("wife", "open_room_window")
    ) {
      return ["open_room_window", ...relationshipActions];
    }
    return relationshipActions;
  }

  #eligibleRelationshipActions(actorId: NPCId): NarrativeActionId[] {
    return actorId === "husband" &&
      this.#state.chapter === 1 &&
      !this.#state.worldFacts.chapter1Complete &&
      this.#state.paused &&
      this.#state.npcs.husband.locationId !== "away_from_home" &&
      this.#state.worldFacts.roomInterior === "hidden" &&
      !this.#hasIntention("husband", "say_one_honest_thing_to_elise") &&
      !this.#hasCompleted("husband", "say_one_honest_thing_to_elise")
      ? ["say_one_honest_thing_to_elise"]
      : [];
  }

  commitNarrativeAction(
    actorId: NPCId,
    actionId: NarrativeActionId,
    options: { relationshipOutcomeId?: string } = {},
  ): void {
    if (!this.eligibleNarrativeActions(actorId).includes(actionId)) {
      throw new Error(`Narrative action is not eligible: ${actionId}`);
    }
    let relationshipOutcomeId: RelationshipConversationOutcomeId | undefined;
    if (actionId === "say_one_honest_thing_to_elise") {
      if (!isRelationshipConversationOutcomeId(options.relationshipOutcomeId)) {
        throw new Error("Relationship Action requires an authored outcome");
      }
      relationshipOutcomeId = options.relationshipOutcomeId;
    }
    if (
      actionId !== "say_one_honest_thing_to_elise" &&
      options.relationshipOutcomeId !== undefined
    ) {
      throw new Error("Relationship outcome is invalid for this Action");
    }
    this.#state.intentions.push({
      actorId,
      actionId,
      ...(actionId === "say_one_honest_thing_to_elise"
        ? { relationshipOutcomeId }
        : {}),
    });
    this.setActionProgress(actorId, actionId, "intended");
  }

  snapshot(): WorldSnapshot {
    return structuredClone({
      time: this.#state.time,
      weekdayId: calendarWeekdayAt(this.#state.time),
      chapter: this.#state.chapter,
      chapterDay: this.#state.chapterDay,
      ambientChance: this.#ambientChoice.snapshot?.() ?? null,
      paused: this.#state.paused,
      npcs: this.#state.npcs,
      worldFacts: this.#state.worldFacts,
      intentions: this.#state.intentions,
      completedActions: this.#state.completedActions,
      actionProgress: this.#actionProgress,
      evidence: this.#state.evidence,
    });
  }

  events(): GameEvent[] {
    return structuredClone(this.#state.eventLog);
  }

  #executeScheduledRoutines(minute: number): void {
    const localTime = minute % MINUTES_PER_DAY;
    const weekdayId = calendarWeekdayAt(minute);
    const isWorkday =
      weekdayId !== "saturday" && weekdayId !== "sunday";
    const secondResidentIsPresented =
      this.#state.worldFacts.livingRoomClock === "accurate";
    if (
      this.#state.chapter === "tutorial" &&
      this.#state.worldFacts.livingRoomClock === "three_minutes_slow" &&
      localTime === 7 * 60 + 57
    ) {
      const variant = selectRoutineVariant(
        "husband_notices_slow_clock",
        this.#actionProgress.husband?.interact_with_living_room_clock ??
          "latent",
      );
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_notices_slow_clock",
        routineVariantId: variant.variantId,
        locationId: "living_room",
        visibleActivityId: "noticing_slow_clock",
      });
    }

    if (this.#state.chapter === "tutorial" && localTime === 8 * 60) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_sits_on_sofa",
        locationId: "living_room",
        visibleActivityId: "sitting_on_sofa",
      });
      if (this.#state.worldFacts.livingRoomClock === "accurate") {
        this.#executeRoutine({
          actorId: "wife",
          routineId: "wife_drinks_water",
          locationId: "dining_area",
          visibleActivityId: "drinking_water",
        });
        this.#observeEvidence("wife", "living_room_clock_is_accurate");
      }
    }

    if (
      this.#state.chapter === "tutorial" &&
      this.#state.worldFacts.livingRoomClock === "three_minutes_slow" &&
      !isWorkday &&
      localTime === 12 * 60 + 12
    ) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_rinses_cup",
        locationId: "dining_area",
        visibleActivityId: "rinsing_cup",
      });
    }

    if (
      this.#state.chapter === "tutorial" &&
      this.#state.worldFacts.livingRoomClock === "three_minutes_slow" &&
      isWorkday &&
      localTime === 18 * 60 + 40
    ) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_folds_sofa_throw",
        locationId: "living_room",
        visibleActivityId: "folding_sofa_throw",
      });
    }

    if (
      this.#state.chapter === "tutorial" &&
      this.#state.worldFacts.livingRoomClock === "three_minutes_slow" &&
      localTime === 22 * 60 + 13
    ) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_turns_off_lights",
        locationId: "living_room",
        visibleActivityId: "turning_off_lights",
      });
    }

    if (isWorkday && localTime === 8 * 60 + 25) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_leaves_for_work",
        locationId: "away_from_home",
        visibleActivityId: "away_at_work",
      });
    }

    if (
      isWorkday &&
      secondResidentIsPresented &&
      localTime === 8 * 60 + 35
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_leaves_for_work",
        locationId: "away_from_home",
        visibleActivityId: "away_at_work",
      });
    }

    if (
      isWorkday &&
      secondResidentIsPresented &&
      localTime === 17 * 60 + 25
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_returns_from_work",
        locationId: "dining_area",
        visibleActivityId: "returning_from_work",
      });
    }

    if (isWorkday && localTime === 18 * 60 + 5) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_returns_from_work",
        locationId: "living_room",
        visibleActivityId: "returning_from_work",
      });
    }

    if (weekdayId === "saturday" && localTime === 10 * 60 + 30) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_leaves_for_household_shopping",
        locationId: "away_from_home",
        visibleActivityId: "away_shopping",
      });
    }

    if (
      weekdayId === "saturday" &&
      secondResidentIsPresented &&
      localTime === 10 * 60 + 32
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_leaves_for_household_shopping",
        locationId: "away_from_home",
        visibleActivityId: "away_shopping",
      });
    }

    if (
      weekdayId === "saturday" &&
      secondResidentIsPresented &&
      localTime === 11 * 60 + 55
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_returns_with_groceries",
        locationId: "dining_area",
        visibleActivityId: "returning_with_groceries",
      });
    }

    if (weekdayId === "saturday" && localTime === 11 * 60 + 57) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_returns_with_groceries",
        locationId: "dining_area",
        visibleActivityId: "returning_with_groceries",
      });
    }

    if (weekdayId === "sunday" && localTime === 17 * 60 + 45) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_leaves_for_sunday_outing",
        locationId: "away_from_home",
        visibleActivityId: "away_on_outing",
      });
    }

    if (
      weekdayId === "sunday" &&
      secondResidentIsPresented &&
      localTime === 17 * 60 + 47
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_leaves_for_sunday_outing",
        locationId: "away_from_home",
        visibleActivityId: "away_on_outing",
      });
    }

    if (
      weekdayId === "sunday" &&
      secondResidentIsPresented &&
      localTime === 20 * 60 + 5
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_returns_from_sunday_outing",
        locationId: "dining_area",
        visibleActivityId: "returning_from_outing",
      });
    }

    if (weekdayId === "sunday" && localTime === 20 * 60 + 7) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_returns_from_sunday_outing",
        locationId: "living_room",
        visibleActivityId: "returning_from_outing",
      });
    }

    if (
      this.#state.chapter === 1 &&
      localTime === 20 * 60 + 14 &&
      this.#hasIntention("husband", "say_one_honest_thing_to_elise") &&
      this.#state.npcs.husband.locationId !== "away_from_home" &&
      this.#state.npcs.wife.locationId !== "away_from_home"
    ) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_settles_at_dining_table",
        locationId: "dining_area",
        visibleActivityId: "settling_at_dining_table",
      });
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_settles_at_dining_table",
        locationId: "dining_area",
        visibleActivityId: "settling_at_dining_table",
      });
    }

    if (
      this.#state.chapter === 1 &&
      this.#state.chapterDay === 1 &&
      localTime === 8 * 60 + 10
    ) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_route_turns_before_closed_door",
        locationId: "hallway",
        visibleActivityId: "turning_before_closed_door",
      });
    }

    if (
      this.#state.chapter === 1 &&
      this.#state.chapterDay === 1 &&
      localTime === 8 * 60 + 20
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_takes_long_route_around_hall",
        locationId: "dining_area",
        visibleActivityId: "taking_long_route_around_hall",
      });
    }

    if (
      this.#state.chapter === 1 &&
      this.#state.chapterDay === 2 &&
      localTime === 7 * 60 + 55
    ) {
      this.#executeAmbientSlot("chapter1_day2_morning_ambient", [
        "husband_tests_window_latch",
        "wife_squares_hallway_runner",
      ]);
    }

    if (
      this.#state.chapter === 1 &&
      (this.#state.chapterDay ?? 0) >= 2 &&
      minute % MINUTES_PER_DAY === 8 * 60 + 10 &&
      this.#state.worldFacts.hallwayDoor === "closed"
    ) {
      this.#executeRoutine({
        actorId: "husband",
        routineId: "husband_reaches_handle_without_turning",
        routineVariantId: this.#chapter1RoutineVariantId(
          "husband_reaches_handle_without_turning",
          "husband",
          "open_door_a_crack",
        ),
        locationId: "hallway",
        visibleActivityId: "reaching_closed_door_handle",
      });
    }

    if (
      this.#state.chapter === 1 &&
      minute % MINUTES_PER_DAY === 17 * 60 + 40 &&
      this.#state.evidence.door_is_slightly_open?.active &&
      !this.#state.evidence.door_is_slightly_open.observedBy.includes("wife")
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_observes_first_gap",
        locationId: "hallway",
        visibleActivityId: "observing_first_door_gap",
      });
      this.#observeEvidence("wife", "door_is_slightly_open");
      this.#state.worldFacts.wifeObservedDoorOnChapterDay =
        this.#state.chapterDay;
    }

    if (
      this.#state.chapter === 1 &&
      minute % MINUTES_PER_DAY === 8 * 60 + 20 &&
      this.#state.worldFacts.wifeObservedDoorOnChapterDay !== null &&
      (this.#state.chapterDay ?? 0) >
        this.#state.worldFacts.wifeObservedDoorOnChapterDay &&
      !this.#hasCompleted("wife", "remain_at_threshold")
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_stops_one_step_short",
        routineVariantId: this.#chapter1RoutineVariantId(
          "wife_stops_one_step_short",
          "wife",
          "remain_at_threshold",
        ),
        locationId: "room_threshold",
        visibleActivityId: "stopping_one_step_short",
      });
    }

    if (
      this.#state.chapter === 1 &&
      minute % MINUTES_PER_DAY === 8 * 60 + 20 &&
      this.#state.worldFacts.wifeRemainedAtThresholdOnChapterDay !== null &&
      (this.#state.chapterDay ?? 0) >
        this.#state.worldFacts.wifeRemainedAtThresholdOnChapterDay &&
      !this.#hasCompleted("wife", "step_inside_room")
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_returns_to_boundary",
        routineVariantId: this.#chapter1RoutineVariantId(
          "wife_returns_to_boundary",
          "wife",
          "step_inside_room",
        ),
        locationId: "room_threshold",
        visibleActivityId: "returning_to_boundary",
      });
    }

    if (
      this.#state.chapter === 1 &&
      minute % MINUTES_PER_DAY === 8 * 60 + 20 &&
      this.#state.worldFacts.wifeEnteredRoomOnChapterDay !== null &&
      (this.#state.chapterDay ?? 0) >
        this.#state.worldFacts.wifeEnteredRoomOnChapterDay &&
      this.#state.worldFacts.roomInterior === "revealed" &&
      this.#state.worldFacts.roomWindow === "closed" &&
      !this.#hasCompleted("wife", "open_room_window")
    ) {
      this.#executeRoutine({
        actorId: "wife",
        routineId: "wife_notices_closed_window",
        routineVariantId: this.#chapter1RoutineVariantId(
          "wife_notices_closed_window",
          "wife",
          "open_room_window",
        ),
        locationId: "room_interior",
        visibleActivityId: "noticing_closed_room_window",
      });
    }
  }

  #executeAmbientSlot(
    slotId: AmbientSlotId,
    candidateIds: AmbientRoutineId[],
  ): void {
    const routineId = this.#ambientChoice.choose({
      slotId,
      candidateIds: structuredClone(candidateIds),
    });
    if (routineId !== null && !candidateIds.includes(routineId)) {
      throw new Error(`Ambient routine is not eligible: ${routineId}`);
    }
    this.#state.eventLog.push({
      at: this.#state.time,
      type: "ambient_routine_selected",
      slotId,
      routineId,
    });
    if (routineId === null) return;

    const routine = getAmbientRoutineDefinition(routineId);
    this.#executeRoutine({
      actorId: routine.actorId,
      routineId: routine.routineId,
      routineVariantId: routine.variantId,
      locationId: routine.locationId,
      visibleActivityId: routine.visibleActivityId,
    });
  }

  #advanceChapterClock(minute: number): void {
    if (
      this.#state.chapter === "tutorial" &&
      this.#chapterOneStartDay !== null &&
      Math.floor(minute / MINUTES_PER_DAY) >= this.#chapterOneStartDay
    ) {
      this.#state.chapter = 1;
    }

    if (this.#state.chapter === 1 && this.#chapterOneStartDay !== null) {
      this.#state.chapterDay =
        Math.floor(minute / MINUTES_PER_DAY) - this.#chapterOneStartDay + 1;
    }
  }

  #executeRoutine(
    routine: Omit<RoutineExecutedEvent, "at" | "type">,
  ): void {
    this.#state.npcs[routine.actorId] = {
      locationId: routine.locationId,
      visibleActivityId: routine.visibleActivityId,
    };
    this.#state.eventLog.push({
      at: this.#state.time,
      type: "routine_executed",
      ...routine,
    });
  }

  #chapter1RoutineVariantId(
    routineId: import("./chapter1-routines").Chapter1CausalRoutineId,
    actorId: NPCId,
    actionId: NarrativeActionId,
  ): string {
    return selectChapter1CausalRoutineDefinition(
      routineId,
      this.#actionProgress[actorId]?.[actionId] ?? "latent",
    ).variantId;
  }

  #executeNarrativeDecisionPoints(minute: number): void {
    if (
      this.#state.chapter === "tutorial" &&
      minute % MINUTES_PER_DAY === 7 * 60 + 59 &&
      this.#takeIntention("husband", "interact_with_living_room_clock")
    ) {
      this.#state.worldFacts.livingRoomClock = "accurate";
      this.#state.npcs.husband = {
        locationId: "living_room",
        visibleActivityId: "interacting_with_clock",
      };
      this.#state.eventLog.push({
        at: minute,
        type: "narrative_action_executed",
        actorId: "husband",
        actionId: "interact_with_living_room_clock",
        locationId: "living_room",
        visibleActivityId: "interacting_with_clock",
      });
      this.#state.evidence.living_room_clock_is_accurate = {
        active: true,
        description: "The living-room clock shows the current time.",
        observedBy: [],
      };
      this.#state.eventLog.push({
        at: minute,
        type: "evidence_activated",
        evidenceId: "living_room_clock_is_accurate",
      });
      this.#state.completedActions.push({
        actorId: "husband",
        actionId: "interact_with_living_room_clock",
      });
      this.setActionProgress(
        "husband",
        "interact_with_living_room_clock",
        "completed",
      );
      this.#chapterOneStartDay =
        Math.floor(minute / MINUTES_PER_DAY) + 1;
    }

    if (
      this.#state.chapter === 1 &&
      minute % MINUTES_PER_DAY === 8 * 60 + 11 &&
      this.#takeIntention("husband", "open_door_a_crack")
    ) {
      this.#state.worldFacts.hallwayDoor = "slightly_open";
      this.#state.npcs.husband = {
        locationId: "hallway",
        visibleActivityId: "opening_door_a_crack",
      };
      this.#state.eventLog.push({
        at: minute,
        type: "narrative_action_executed",
        actorId: "husband",
        actionId: "open_door_a_crack",
        locationId: "hallway",
        visibleActivityId: "opening_door_a_crack",
      });
      this.#state.evidence.door_is_slightly_open = {
        active: true,
        description: "The door at the end of the hallway is slightly open.",
        observedBy: [],
      };
      this.#state.eventLog.push({
        at: minute,
        type: "evidence_activated",
        evidenceId: "door_is_slightly_open",
      });
      this.#state.completedActions.push({
        actorId: "husband",
        actionId: "open_door_a_crack",
      });
      this.setActionProgress("husband", "open_door_a_crack", "completed");
    }

    if (
      this.#state.chapter === 1 &&
      minute % MINUTES_PER_DAY === 8 * 60 + 21 &&
      this.#takeIntention("wife", "remain_at_threshold")
    ) {
      this.#state.npcs.wife = {
        locationId: "room_threshold",
        visibleActivityId: "remaining_at_threshold",
      };
      this.#state.eventLog.push({
        at: minute,
        type: "narrative_action_executed",
        actorId: "wife",
        actionId: "remain_at_threshold",
        locationId: "room_threshold",
        visibleActivityId: "remaining_at_threshold",
      });
      this.#state.completedActions.push({
        actorId: "wife",
        actionId: "remain_at_threshold",
      });
      this.#state.worldFacts.wifeHasRemainedAtThreshold = true;
      this.#state.worldFacts.wifeRemainedAtThresholdOnChapterDay =
        this.#state.chapter === 1 ? this.#state.chapterDay : null;
      this.setActionProgress("wife", "remain_at_threshold", "completed");
    }

    if (
      this.#state.chapter === 1 &&
      minute % MINUTES_PER_DAY === 8 * 60 + 21 &&
      this.#takeIntention("wife", "step_inside_room")
    ) {
      this.#state.worldFacts.roomInterior = "revealed";
      this.#state.worldFacts.wifeHasEnteredRoom = true;
      this.#state.worldFacts.wifeEnteredRoomOnChapterDay =
        this.#state.chapterDay;
      this.#state.npcs.wife = {
        locationId: "room_threshold",
        visibleActivityId: "stepping_inside_then_back",
      };
      this.#state.eventLog.push({
        at: minute,
        type: "narrative_action_executed",
        actorId: "wife",
        actionId: "step_inside_room",
        locationId: "room_threshold",
        visibleActivityId: "stepping_inside_then_back",
      });
      this.#state.completedActions.push({
        actorId: "wife",
        actionId: "step_inside_room",
      });
      this.setActionProgress("wife", "step_inside_room", "completed");
    }

    if (
      this.#state.chapter === 1 &&
      minute % MINUTES_PER_DAY === 8 * 60 + 21 &&
      this.#takeIntention("wife", "open_room_window")
    ) {
      this.#state.worldFacts.roomWindow = "open_one_hand_width";
      this.#state.worldFacts.chapter1Complete = true;
      this.#state.npcs.wife = {
        locationId: "room_interior",
        visibleActivityId: "opening_room_window",
      };
      this.#state.eventLog.push({
        at: minute,
        type: "narrative_action_executed",
        actorId: "wife",
        actionId: "open_room_window",
        locationId: "room_interior",
        visibleActivityId: "opening_room_window",
      });
      this.#state.evidence.room_window_is_open = {
        active: true,
        description: "The room's window is open one hand-width.",
        observedBy: [],
      };
      this.#state.eventLog.push({
        at: minute,
        type: "evidence_activated",
        evidenceId: "room_window_is_open",
      });
      this.#state.completedActions.push({
        actorId: "wife",
        actionId: "open_room_window",
      });
      this.setActionProgress("wife", "open_room_window", "completed");
    }

    if (
      this.#state.chapter === 1 &&
      minute % MINUTES_PER_DAY === 20 * 60 + 15 &&
      this.#state.npcs.husband.locationId === "dining_area" &&
      this.#state.npcs.wife.locationId === "dining_area"
    ) {
      const intention = this.#takeIntention(
        "husband",
        "say_one_honest_thing_to_elise",
      );
      if (intention !== null) {
        const outcomeId = intention.relationshipOutcomeId;
        if (!isRelationshipConversationOutcomeId(outcomeId)) {
          throw new Error("Relationship intention has no authored outcome");
        }
        const outcome =
          getRelationshipConversationOutcomeDefinition(outcomeId);
        this.#state.npcs.husband = {
          locationId: "dining_area",
          visibleActivityId: "making_one_honest_opening",
        };
        this.#state.npcs.wife = {
          locationId: "dining_area",
          visibleActivityId: outcome.wifeVisibleActivityId,
        };
        this.#state.worldFacts.martinEliseConversation = outcomeId;
        this.#state.worldFacts.martinEliseConversationOnChapterDay =
          this.#state.chapterDay;
        this.#state.eventLog.push({
          at: minute,
          type: "narrative_action_executed",
          actorId: "husband",
          recipientId: "wife",
          actionId: "say_one_honest_thing_to_elise",
          relationshipOutcomeId: outcomeId,
          locationId: "dining_area",
          visibleActivityId: "making_one_honest_opening",
        });
        this.#state.completedActions.push(intention);
        this.setActionProgress(
          "husband",
          "say_one_honest_thing_to_elise",
          "completed",
        );
      }
    }
  }

  #takeIntention(
    actorId: NPCId,
    actionId: NarrativeActionId,
  ): ActionIntention | null {
    const intentionIndex = this.#state.intentions.findIndex(
      (intention) =>
        intention.actorId === actorId && intention.actionId === actionId,
    );
    if (intentionIndex < 0) {
      return null;
    }
    return this.#state.intentions.splice(intentionIndex, 1)[0]!;
  }

  #hasCompleted(actorId: NPCId, actionId: NarrativeActionId): boolean {
    return this.#state.completedActions.some(
      (completed) =>
        completed.actorId === actorId && completed.actionId === actionId,
    );
  }

  #hasIntention(actorId: NPCId, actionId: NarrativeActionId): boolean {
    return this.#state.intentions.some(
      (intention) =>
        intention.actorId === actorId && intention.actionId === actionId,
    );
  }

  #observeEvidence(observerId: NPCId, evidenceId: EvidenceId): void {
    const evidence = this.#state.evidence[evidenceId];
    if (!evidence?.active || evidence.observedBy.includes(observerId)) {
      return;
    }

    evidence.observedBy.push(observerId);
    this.#state.eventLog.push({
      at: this.#state.time,
      type: "evidence_observed",
      evidenceId,
      observerId,
    });
  }
}

export const createVerticalSliceWorld = (
  options: { ambientChoice?: AmbientRoutineChoicePort } = {},
): VerticalSliceWorld => new VerticalSliceWorld(options);
import {
  selectRoutineVariant,
  type PsychologicalStage,
} from "./routine-behaviors";
import { selectChapter1CausalRoutineDefinition } from "./chapter1-routines";

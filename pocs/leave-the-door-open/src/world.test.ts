import { describe, expect, it } from "vitest";
import {
  createVerticalSliceWorld,
  type NarrativeActionId,
} from "./world";
import type { AmbientRoutineChoicePort } from "./ambient-routines";

const DAY = 24 * 60;

function completeClockTutorial(
  world: ReturnType<typeof createVerticalSliceWorld>,
): void {
  world.advanceTo(7 * 60 + 57);
  world.pause();
  world.commitNarrativeAction("husband", "interact_with_living_room_clock");
  world.resume();
  world.advanceTo(7 * 60 + 59);
}

function reachChapterDay2Handle(
  world: ReturnType<typeof createVerticalSliceWorld>,
): void {
  completeClockTutorial(world);
  world.advanceTo(2 * DAY + 8 * 60 + 10);
}

function executeChapterDoorAction(
  world: ReturnType<typeof createVerticalSliceWorld>,
): void {
  reachChapterDay2Handle(world);
  world.pause();
  world.commitNarrativeAction("husband", "open_door_a_crack");
  world.resume();
  world.advanceTo(2 * DAY + 8 * 60 + 11);
}

describe("VerticalSliceWorld", () => {
  it("LDO-CH1-001 enters Chapter 1 Day 1 only after the completed tutorial reaches the following day", () => {
    const world = createVerticalSliceWorld();
    const chapterDayOne = 24 * 60;

    expect(world.snapshot()).toMatchObject({
      chapter: "tutorial",
      chapterDay: null,
    });

    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(7 * 60 + 59);

    expect(world.snapshot()).toMatchObject({
      chapter: "tutorial",
      chapterDay: null,
    });

    world.advanceTo(chapterDayOne);

    expect(world.snapshot()).toMatchObject({
      chapter: 1,
      chapterDay: 1,
    });

    const unfinishedTutorial = createVerticalSliceWorld();
    unfinishedTutorial.advanceTo(chapterDayOne + 8 * 60 + 20);

    expect(unfinishedTutorial.snapshot()).toMatchObject({
      chapter: "tutorial",
      chapterDay: null,
    });
    expect(unfinishedTutorial.events()).not.toContainEqual(
      expect.objectContaining({
        routineId: "husband_route_turns_before_closed_door",
      }),
    );
  });

  it("LDO-CH1-001 LDO-CH1-008 LDO-CH1-009 keeps the unfinished Day 0 tutorial outside the superseded same-morning door path", () => {
    const world = createVerticalSliceWorld();

    world.advanceTo(9 * 60 + 5);

    expect(world.events()).not.toContainEqual(
      expect.objectContaining({
        routineId: "husband_walks_to_hallway_door",
      }),
    );
    expect(world.eligibleNarrativeActions("husband")).toEqual([]);
    expect(() =>
      world.commitNarrativeAction("husband", "open_door_a_crack"),
    ).toThrow("Narrative action is not eligible: open_door_a_crack");

    world.advanceTo(9 * 60 + 13);

    expect(world.snapshot()).toMatchObject({
      chapter: "tutorial",
      chapterDay: null,
      worldFacts: {
        hallwayDoor: "closed",
        wifeHasRemainedAtThreshold: false,
      },
      completedActions: [],
      evidence: {},
    });
    expect(world.eligibleNarrativeActions("wife")).toEqual([]);
    expect(world.events()).not.toContainEqual(
      expect.objectContaining({
        routineId: "wife_walks_through_hallway",
      }),
    );
    expect(world.events()).not.toContainEqual(
      expect.objectContaining({
        type: "narrative_action_executed",
        actionId: "remain_at_threshold",
      }),
    );
  });

  it("LDO-CH1-001 LDO-CH1-003 runs both Chapter 1 opening routines on the following morning", () => {
    const world = createVerticalSliceWorld();
    const chapterDayOne = 24 * 60;

    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(chapterDayOne + 8 * 60 + 20);

    expect(world.snapshot()).toMatchObject({
      time: chapterDayOne + 8 * 60 + 20,
      worldFacts: { hallwayDoor: "closed" },
      npcs: {
        husband: {
          locationId: "hallway",
          visibleActivityId: "turning_before_closed_door",
        },
        wife: {
          locationId: "dining_area",
          visibleActivityId: "taking_long_route_around_hall",
        },
      },
    });
    expect(world.events()).toContainEqual({
      at: chapterDayOne + 8 * 60 + 10,
      type: "routine_executed",
      actorId: "husband",
      routineId: "husband_route_turns_before_closed_door",
      locationId: "hallway",
      visibleActivityId: "turning_before_closed_door",
    });
    expect(world.events()).toContainEqual({
      at: chapterDayOne + 8 * 60 + 20,
      type: "routine_executed",
      actorId: "wife",
      routineId: "wife_takes_long_route_around_hall",
      locationId: "dining_area",
      visibleActivityId: "taking_long_route_around_hall",
    });
  });

  it("LDO-CH1-008 makes the first door gap eligible and executable only at the Chapter Day 2 handle moment", () => {
    const world = createVerticalSliceWorld();
    const day = 24 * 60;

    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(9 * 60 + 5);

    expect(world.eligibleNarrativeActions("husband")).toEqual([]);
    expect(world.events()).not.toContainEqual(
      expect.objectContaining({ routineId: "husband_walks_to_hallway_door" }),
    );

    world.advanceTo(day + 8 * 60 + 20);
    expect(world.eligibleNarrativeActions("husband")).toEqual([]);

    world.advanceTo(2 * day + 8 * 60 + 10);
    expect(world.eligibleNarrativeActions("husband")).toEqual([
      "open_door_a_crack",
    ]);

    world.pause();
    world.commitNarrativeAction("husband", "open_door_a_crack");
    world.resume();
    world.advanceTo(2 * day + 8 * 60 + 11);

    expect(world.snapshot()).toMatchObject({
      chapter: 1,
      chapterDay: 2,
      worldFacts: { hallwayDoor: "slightly_open" },
      completedActions: [
        { actorId: "husband", actionId: "interact_with_living_room_clock" },
        { actorId: "husband", actionId: "open_door_a_crack" },
      ],
      evidence: {
        door_is_slightly_open: { active: true, observedBy: [] },
      },
    });
    expect(world.events()).toContainEqual({
      at: 2 * day + 8 * 60 + 11,
      type: "narrative_action_executed",
      actorId: "husband",
      actionId: "open_door_a_crack",
      locationId: "hallway",
      visibleActivityId: "opening_door_a_crack",
    });
  });

  it("LDO-CH1-008 rejects a duplicate intention before the authored Action executes", () => {
    const world = createVerticalSliceWorld({
      ambientChoice: { choose: () => null },
    });
    const day = 24 * 60;
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(2 * day + 8 * 60 + 10);
    world.pause();

    world.commitNarrativeAction("husband", "open_door_a_crack");

    expect(world.eligibleNarrativeActions("husband")).toEqual([]);
    expect(() =>
      world.commitNarrativeAction("husband", "open_door_a_crack"),
    ).toThrow("Narrative action is not eligible: open_door_a_crack");
    expect(world.snapshot().intentions).toEqual([
      { actorId: "husband", actionId: "open_door_a_crack" },
    ]);
  });

  it("LDO-CH1-014 selects an authored ambient routine without changing the fixed causal path", () => {
    const requests: Parameters<AmbientRoutineChoicePort["choose"]>[0][] = [];
    const ambientChoice: AmbientRoutineChoicePort = {
      choose(request) {
        requests.push(structuredClone(request));
        return "wife_squares_hallway_runner";
      },
    };
    const world = createVerticalSliceWorld({ ambientChoice });
    const day = 24 * 60;

    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(2 * day + 8 * 60 + 10);

    expect(requests).toEqual([
      {
        slotId: "chapter1_day2_morning_ambient",
        candidateIds: [
          "husband_tests_window_latch",
          "wife_squares_hallway_runner",
        ],
      },
    ]);
    expect(world.events()).toContainEqual({
      at: 2 * day + 7 * 60 + 55,
      type: "ambient_routine_selected",
      slotId: "chapter1_day2_morning_ambient",
      routineId: "wife_squares_hallway_runner",
    });
    expect(world.events()).toContainEqual({
      at: 2 * day + 7 * 60 + 55,
      type: "routine_executed",
      actorId: "wife",
      routineId: "wife_squares_hallway_runner",
      routineVariantId: "square_near_edge",
      locationId: "hallway",
      visibleActivityId: "squaring_hallway_runner",
    });
    expect(world.events()).toContainEqual(
      expect.objectContaining({
        at: 2 * day + 8 * 60 + 10,
        type: "routine_executed",
        routineId: "husband_reaches_handle_without_turning",
      }),
    );
    expect(world.snapshot()).toMatchObject({
      worldFacts: { hallwayDoor: "closed" },
      intentions: [],
      evidence: {
        living_room_clock_is_accurate: { active: true },
      },
    });
    expect(world.snapshot().evidence).not.toHaveProperty(
      "door_is_slightly_open",
    );
  });

  it("LDO-CH1-008 LDO-CH1-009 separates the Wife's first gap observation from next-day threshold eligibility", () => {
    const world = createVerticalSliceWorld({
      ambientChoice: { choose: () => null },
    });
    const day = 24 * 60;
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(2 * day + 8 * 60 + 10);
    world.pause();
    world.commitNarrativeAction("husband", "open_door_a_crack");
    world.resume();
    world.advanceTo(2 * day + 17 * 60 + 40);

    expect(world.snapshot()).toMatchObject({
      chapterDay: 2,
      npcs: {
        wife: {
          locationId: "hallway",
          visibleActivityId: "observing_first_door_gap",
        },
      },
      worldFacts: { wifeObservedDoorOnChapterDay: 2 },
      evidence: {
        door_is_slightly_open: { observedBy: ["wife"] },
      },
    });
    expect(world.events()).toContainEqual({
      at: 2 * day + 17 * 60 + 40,
      type: "routine_executed",
      actorId: "wife",
      routineId: "wife_observes_first_gap",
      locationId: "hallway",
      visibleActivityId: "observing_first_door_gap",
    });
    expect(world.eligibleNarrativeActions("wife")).toEqual([]);

    world.advanceTo(3 * day + 8 * 60 + 20);

    expect(world.snapshot()).toMatchObject({
      chapterDay: 3,
      npcs: {
        wife: {
          locationId: "room_threshold",
          visibleActivityId: "stopping_one_step_short",
        },
      },
    });
    expect(world.eligibleNarrativeActions("wife")).toEqual([
      "remain_at_threshold",
    ]);
  });

  it("LDO-CH1-009 closes remaining at the threshold as story state without object Evidence", () => {
    const world = createVerticalSliceWorld({
      ambientChoice: { choose: () => null },
    });
    const day = 24 * 60;
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(2 * day + 8 * 60 + 10);
    world.pause();
    world.commitNarrativeAction("husband", "open_door_a_crack");
    world.resume();
    world.advanceTo(3 * day + 8 * 60 + 20);
    world.pause();
    const evidenceBefore = structuredClone(world.snapshot().evidence);

    world.commitNarrativeAction("wife", "remain_at_threshold");
    world.resume();
    world.advanceTo(3 * day + 8 * 60 + 21);

    expect(world.snapshot()).toMatchObject({
      chapterDay: 3,
      worldFacts: {
        hallwayDoor: "slightly_open",
        wifeHasRemainedAtThreshold: true,
        wifeRemainedAtThresholdOnChapterDay: 3,
      },
      npcs: {
        wife: {
          locationId: "room_threshold",
          visibleActivityId: "remaining_at_threshold",
        },
      },
      intentions: [],
    });
    expect(world.snapshot().evidence).toEqual(evidenceBefore);
    expect(world.events()).toContainEqual({
      at: 3 * day + 8 * 60 + 21,
      type: "narrative_action_executed",
      actorId: "wife",
      actionId: "remain_at_threshold",
      locationId: "room_threshold",
      visibleActivityId: "remaining_at_threshold",
    });
  });

  it("LDO-CH1-009 separates next-day entry from threshold presence and reveals the room without Evidence", () => {
    const world = createVerticalSliceWorld({
      ambientChoice: { choose: () => null },
    });
    const day = 24 * 60;
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(2 * day + 8 * 60 + 10);
    world.pause();
    world.commitNarrativeAction("husband", "open_door_a_crack");
    world.resume();
    world.advanceTo(3 * day + 8 * 60 + 20);
    world.pause();
    world.commitNarrativeAction("wife", "remain_at_threshold");
    world.resume();
    world.advanceTo(4 * day + 8 * 60 + 20);

    expect(world.snapshot()).toMatchObject({
      chapterDay: 4,
      npcs: {
        wife: {
          locationId: "room_threshold",
          visibleActivityId: "returning_to_boundary",
        },
      },
      worldFacts: {
        roomInterior: "hidden",
        wifeHasEnteredRoom: false,
      },
    });
    expect(world.eligibleNarrativeActions("wife")).toEqual([
      "step_inside_room",
    ]);

    world.pause();
    const evidenceBefore = structuredClone(world.snapshot().evidence);
    world.commitNarrativeAction("wife", "step_inside_room");
    world.resume();
    world.advanceTo(4 * day + 8 * 60 + 21);

    expect(world.snapshot()).toMatchObject({
      chapterDay: 4,
      worldFacts: {
        hallwayDoor: "slightly_open",
        roomInterior: "revealed",
        wifeHasEnteredRoom: true,
        wifeEnteredRoomOnChapterDay: 4,
      },
      npcs: {
        wife: {
          locationId: "room_threshold",
          visibleActivityId: "stepping_inside_then_back",
        },
      },
      intentions: [],
    });
    expect(world.snapshot().evidence).toEqual(evidenceBefore);
    expect(world.events()).toContainEqual({
      at: 4 * day + 8 * 60 + 21,
      type: "narrative_action_executed",
      actorId: "wife",
      actionId: "step_inside_room",
      locationId: "room_threshold",
      visibleActivityId: "stepping_inside_then_back",
    });
  });

  it("LDO-CH1-010 LDO-CH1-011 opens the room window one hand-width, completes Chapter 1, and defers Husband observation", () => {
    const world = createVerticalSliceWorld({
      ambientChoice: { choose: () => null },
    });
    const day = 24 * 60;
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(2 * day + 8 * 60 + 10);
    world.pause();
    world.commitNarrativeAction("husband", "open_door_a_crack");
    world.resume();
    world.advanceTo(3 * day + 8 * 60 + 20);
    world.pause();
    world.commitNarrativeAction("wife", "remain_at_threshold");
    world.resume();
    world.advanceTo(4 * day + 8 * 60 + 20);
    world.pause();
    world.commitNarrativeAction("wife", "step_inside_room");
    world.resume();
    world.advanceTo(5 * day + 8 * 60 + 20);

    expect(world.snapshot()).toMatchObject({
      chapterDay: 5,
      npcs: {
        wife: {
          locationId: "room_interior",
          visibleActivityId: "noticing_closed_room_window",
        },
      },
      worldFacts: {
        roomInterior: "revealed",
        roomWindow: "closed",
        chapter1Complete: false,
      },
    });
    expect(world.eligibleNarrativeActions("wife")).toEqual([
      "open_room_window",
    ]);

    world.pause();
    world.commitNarrativeAction("wife", "open_room_window");
    world.resume();
    world.advanceTo(5 * day + 8 * 60 + 21);

    expect(world.snapshot()).toMatchObject({
      chapter: 1,
      chapterDay: 5,
      worldFacts: {
        roomWindow: "open_one_hand_width",
        chapter1Complete: true,
      },
      evidence: {
        room_window_is_open: {
          active: true,
          description: "The room's window is open one hand-width.",
          observedBy: [],
        },
      },
      intentions: [],
    });
    expect(world.events()).toContainEqual({
      at: 5 * day + 8 * 60 + 21,
      type: "evidence_activated",
      evidenceId: "room_window_is_open",
    });
    expect(world.events()).toContainEqual({
      at: 5 * day + 8 * 60 + 21,
      type: "narrative_action_executed",
      actorId: "wife",
      actionId: "open_room_window",
      locationId: "room_interior",
      visibleActivityId: "opening_room_window",
    });

    world.advanceTo(5 * day + 18 * 60);
    expect(
      world.snapshot().evidence.room_window_is_open?.observedBy,
    ).toEqual([]);
  });

  it("LDO-CH1-005 repeats every unresolved causal phase on a later day without downstream mutation", () => {
    const world = createVerticalSliceWorld({
      ambientChoice: { choose: () => null },
    });
    const day = 24 * 60;
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();

    world.advanceTo(2 * day + 8 * 60 + 10);
    world.setActionProgress(
      "husband",
      "open_door_a_crack",
      "faintly_imagined",
    );
    world.advanceTo(3 * day + 8 * 60 + 10);
    expect(world.snapshot()).toMatchObject({
      chapterDay: 3,
      worldFacts: { hallwayDoor: "closed" },
      npcs: {
        husband: { visibleActivityId: "reaching_closed_door_handle" },
      },
      evidence: {
        living_room_clock_is_accurate: expect.any(Object),
      },
    });
    expect(world.snapshot().evidence).not.toHaveProperty(
      "door_is_slightly_open",
    );
    expect(world.events()).toContainEqual(
      expect.objectContaining({
        at: 3 * day + 8 * 60 + 10,
        type: "routine_executed",
        routineId: "husband_reaches_handle_without_turning",
        routineVariantId: "thumb_waits_beside_latch",
      }),
    );
    world.pause();
    world.commitNarrativeAction("husband", "open_door_a_crack");
    world.resume();

    world.advanceTo(4 * day + 8 * 60 + 20);
    world.setActionProgress(
      "wife",
      "remain_at_threshold",
      "faintly_imagined",
    );
    world.advanceTo(5 * day + 8 * 60 + 20);
    expect(world.snapshot()).toMatchObject({
      chapterDay: 5,
      worldFacts: { wifeHasRemainedAtThreshold: false },
      npcs: { wife: { visibleActivityId: "stopping_one_step_short" } },
    });
    expect(world.events()).toContainEqual(
      expect.objectContaining({
        at: 5 * day + 8 * 60 + 20,
        routineVariantId: "hold_at_nearer_mark",
      }),
    );
    world.pause();
    world.commitNarrativeAction("wife", "remain_at_threshold");
    world.resume();

    world.advanceTo(6 * day + 8 * 60 + 20);
    world.setActionProgress("wife", "step_inside_room", "surfaced");
    world.advanceTo(7 * day + 8 * 60 + 20);
    expect(world.snapshot()).toMatchObject({
      chapterDay: 7,
      worldFacts: { roomInterior: "hidden", wifeHasEnteredRoom: false },
      npcs: { wife: { visibleActivityId: "returning_to_boundary" } },
    });
    expect(world.events()).toContainEqual(
      expect.objectContaining({
        at: 7 * day + 8 * 60 + 20,
        routineVariantId: "forward_weight_settles_beside_line",
      }),
    );
    world.pause();
    world.commitNarrativeAction("wife", "step_inside_room");
    world.resume();

    world.advanceTo(8 * day + 8 * 60 + 20);
    world.setActionProgress("wife", "open_room_window", "surfaced");
    world.advanceTo(9 * day + 8 * 60 + 20);
    expect(world.snapshot()).toMatchObject({
      chapterDay: 9,
      worldFacts: { roomWindow: "closed", chapter1Complete: false },
      npcs: { wife: { visibleActivityId: "noticing_closed_room_window" } },
    });
    expect(world.events()).toContainEqual(
      expect.objectContaining({
        at: 9 * day + 8 * 60 + 20,
        routineVariantId: "pause_within_window_reach",
      }),
    );
    world.pause();
    world.commitNarrativeAction("wife", "open_room_window");
    world.resume();
    world.advanceTo(9 * day + 8 * 60 + 21);
    expect(world.snapshot().worldFacts.chapter1Complete).toBe(true);
  });

  it("LDO-CH1-008 ADR 0011 creates the first door gap only through the husband's authored opening Action", () => {
    const world = createVerticalSliceWorld();

    expect(world.snapshot().worldFacts.hallwayDoor).toBe("closed");

    reachChapterDay2Handle(world);
    expect(world.snapshot().worldFacts.hallwayDoor).toBe("closed");
    world.pause();
    expect(world.eligibleNarrativeActions("husband")).toEqual([
      "open_door_a_crack",
    ]);

    world.commitNarrativeAction(
      "husband",
      "open_door_a_crack" as NarrativeActionId,
    );
    expect(world.snapshot().worldFacts.hallwayDoor).toBe("closed");

    world.resume();
    world.advanceTo(2 * DAY + 8 * 60 + 11);

    expect(world.snapshot()).toMatchObject({
      worldFacts: { hallwayDoor: "slightly_open" },
      completedActions: [
        {
          actorId: "husband",
          actionId: "interact_with_living_room_clock",
        },
        { actorId: "husband", actionId: "open_door_a_crack" },
      ],
      evidence: {
        door_is_slightly_open: { active: true, observedBy: [] },
      },
    });
  });

  it("LDO-LOCAL-010 LDO-VS-004 closes the clock tutorial on an authored accurate-clock state observed by the wife", () => {
    const world = createVerticalSliceWorld();

    expect(world.snapshot()).toMatchObject({
      time: 7 * 60 + 56,
      worldFacts: { livingRoomClock: "three_minutes_slow" },
    });

    world.advanceTo(7 * 60 + 57);
    expect(world.snapshot().npcs.husband).toEqual({
      locationId: "living_room",
      visibleActivityId: "noticing_slow_clock",
    });
    expect(world.eligibleNarrativeActions("husband")).toEqual([
      "interact_with_living_room_clock",
    ]);

    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock" as NarrativeActionId,
    );
    expect(world.snapshot().worldFacts.livingRoomClock).toBe(
      "three_minutes_slow",
    );

    world.resume();
    world.advanceTo(7 * 60 + 59);
    expect(world.snapshot()).toMatchObject({
      worldFacts: { livingRoomClock: "accurate" },
      intentions: [],
      completedActions: [
        {
          actorId: "husband",
          actionId: "interact_with_living_room_clock",
        },
      ],
      evidence: {
        living_room_clock_is_accurate: {
          active: true,
          observedBy: [],
        },
      },
    });

    world.advanceTo(8 * 60);
    expect(
      world.snapshot().evidence.living_room_clock_is_accurate?.observedBy,
    ).toEqual(["wife"]);
  });

  it("LDO-LOCAL-011 selects an authored routine variant from bounded awareness without executing the NarrativeAction", () => {
    const world = createVerticalSliceWorld();

    world.setActionProgress(
      "husband",
      "interact_with_living_room_clock" as NarrativeActionId,
      "faintly_imagined",
    );
    world.advanceTo(7 * 60 + 57);

    expect(world.events()).toContainEqual({
      at: 7 * 60 + 57,
      type: "routine_executed",
      actorId: "husband",
      routineId: "husband_notices_slow_clock",
      routineVariantId: "linger_beneath_clock",
      locationId: "living_room",
      visibleActivityId: "noticing_slow_clock",
    });
    expect(world.snapshot()).toMatchObject({
      worldFacts: { livingRoomClock: "three_minutes_slow" },
      intentions: [],
      completedActions: [],
      evidence: {},
    });
  });

  // Spec: LDO-CH1-016; ADR 0020 Decision 1.
  it("LDO-CH1-016 preserves the highest validated awareness for an unresolved Action when a later judgment regresses", () => {
    const world = createVerticalSliceWorld();

    world.setActionProgress("wife", "step_inside_room", "surfaced");
    world.setActionProgress("wife", "step_inside_room", "latent");
    world.setActionProgress(
      "wife",
      "step_inside_room",
      "faintly_imagined",
    );

    expect(world.snapshot()).toMatchObject({
      actionProgress: {
        wife: { step_inside_room: "surfaced" },
      },
      intentions: [],
      completedActions: [],
    });
  });

  it("LDO-VS-001 executes authored routine behaviors when unpaused time advances", () => {
    const world = createVerticalSliceWorld();

    world.advanceTo(8 * 60);

    expect(world.snapshot()).toMatchObject({
      time: 8 * 60,
      paused: false,
      npcs: {
        husband: {
          locationId: "living_room",
          visibleActivityId: "sitting_on_sofa",
        },
        wife: {
          locationId: "dining_area",
          visibleActivityId: "drinking_water",
        },
      },
    });
    expect(world.events()).toEqual([
      {
        at: 7 * 60 + 57,
        type: "routine_executed",
        actorId: "husband",
        routineId: "husband_notices_slow_clock",
        routineVariantId: "notice_and_stop",
        locationId: "living_room",
        visibleActivityId: "noticing_slow_clock",
      },
      {
        at: 8 * 60,
        type: "routine_executed",
        actorId: "husband",
        routineId: "husband_sits_on_sofa",
        locationId: "living_room",
        visibleActivityId: "sitting_on_sofa",
      },
      {
        at: 8 * 60,
        type: "routine_executed",
        actorId: "wife",
        routineId: "wife_drinks_water",
        locationId: "dining_area",
        visibleActivityId: "drinking_water",
      },
    ]);
  });

  it("LDO-CH1-001 ADR 0012 freezes simulation time and canonical scheduled routines while paused", () => {
    const world = createVerticalSliceWorld();
    completeClockTutorial(world);
    world.advanceTo(DAY + 8 * 60 + 10);

    world.pause();
    world.advanceTo(DAY + 8 * 60 + 20);

    expect(world.snapshot()).toMatchObject({
      time: DAY + 8 * 60 + 10,
      paused: true,
      npcs: {
        husband: {
          locationId: "hallway",
          visibleActivityId: "turning_before_closed_door",
        },
        wife: {
          locationId: "dining_area",
          visibleActivityId: "drinking_water",
        },
      },
    });

    world.resume();
    world.advanceTo(DAY + 8 * 60 + 20);

    expect(world.snapshot()).toMatchObject({
      time: DAY + 8 * 60 + 20,
      paused: false,
      npcs: {
        wife: {
          locationId: "dining_area",
          visibleActivityId: "taking_long_route_around_hall",
        },
      },
    });
    expect(world.events().slice(-3)).toEqual([
      { at: DAY + 8 * 60 + 10, type: "world_paused" },
      { at: DAY + 8 * 60 + 10, type: "world_resumed" },
      {
        at: DAY + 8 * 60 + 20,
        type: "routine_executed",
        actorId: "wife",
        routineId: "wife_takes_long_route_around_hall",
        locationId: "dining_area",
        visibleActivityId: "taking_long_route_around_hall",
      },
    ]);
  });

  it("LDO-CH1-008 ADR 0012 executes a committed narrative intention only at its canonical decision point after resume", () => {
    const world = createVerticalSliceWorld();
    reachChapterDay2Handle(world);
    world.pause();

    expect(world.eligibleNarrativeActions("husband")).toEqual([
      "open_door_a_crack",
    ]);
    world.commitNarrativeAction("husband", "open_door_a_crack");

    expect(world.snapshot()).toMatchObject({
      time: 2 * DAY + 8 * 60 + 10,
      paused: true,
      worldFacts: { hallwayDoor: "closed" },
      intentions: [
        { actorId: "husband", actionId: "open_door_a_crack" },
      ],
    });

    world.advanceTo(2 * DAY + 8 * 60 + 11);
    expect(world.snapshot().time).toBe(2 * DAY + 8 * 60 + 10);

    world.resume();
    world.advanceTo(2 * DAY + 8 * 60 + 11);

    expect(world.snapshot()).toMatchObject({
      time: 2 * DAY + 8 * 60 + 11,
      worldFacts: { hallwayDoor: "slightly_open" },
      intentions: [],
    });
    expect(world.events()).toContainEqual({
      at: 2 * DAY + 8 * 60 + 11,
      type: "narrative_action_executed",
      actorId: "husband",
      actionId: "open_door_a_crack",
      locationId: "hallway",
      visibleActivityId: "opening_door_a_crack",
    });
  });

  it("LDO-CH1-008 ADR 0011 creates door Evidence only through the explicit authored effect", () => {
    const world = createVerticalSliceWorld();

    reachChapterDay2Handle(world);

    expect(world.snapshot().evidence).not.toHaveProperty(
      "door_is_slightly_open",
    );

    world.pause();
    world.commitNarrativeAction("husband", "open_door_a_crack");
    world.resume();
    world.advanceTo(2 * DAY + 8 * 60 + 11);

    expect(world.snapshot().evidence).toMatchObject({
      door_is_slightly_open: {
        active: true,
        description:
          "The door at the end of the hallway is slightly open.",
        observedBy: [],
      },
    });
    expect(world.events()).toContainEqual({
      at: 2 * DAY + 8 * 60 + 11,
      type: "evidence_activated",
      evidenceId: "door_is_slightly_open",
    });
  });

  it("LDO-CH1-008 LDO-CH1-009 gates the downstream Action on physical Evidence observation and a later day", () => {
    const world = createVerticalSliceWorld();
    executeChapterDoorAction(world);

    expect(world.snapshot().evidence.door_is_slightly_open).toMatchObject({
      active: true,
      observedBy: [],
    });
    expect(world.eligibleNarrativeActions("wife")).toEqual([]);

    world.advanceTo(2 * DAY + 17 * 60 + 40);

    expect(world.snapshot()).toMatchObject({
      npcs: {
        wife: {
          locationId: "hallway",
          visibleActivityId: "observing_first_door_gap",
        },
      },
      evidence: {
        door_is_slightly_open: {
          active: true,
          observedBy: ["wife"],
        },
      },
    });
    expect(world.eligibleNarrativeActions("wife")).toEqual([]);
    expect(world.events()).toContainEqual({
      at: 2 * DAY + 17 * 60 + 40,
      type: "evidence_observed",
      evidenceId: "door_is_slightly_open",
      observerId: "wife",
    });

    world.advanceTo(3 * DAY + 8 * 60 + 20);

    expect(world.eligibleNarrativeActions("wife")).toEqual([
      "remain_at_threshold",
    ]);
  });

  it("LDO-CH1-009 ADR 0012 executes the observed spouse's fixed Action at the next-day canonical decision point", () => {
    const world = createVerticalSliceWorld();
    executeChapterDoorAction(world);
    world.advanceTo(3 * DAY + 8 * 60 + 20);
    world.pause();

    world.commitNarrativeAction("wife", "remain_at_threshold");

    expect(world.snapshot().intentions).toEqual([
      { actorId: "wife", actionId: "remain_at_threshold" },
    ]);

    world.resume();
    world.advanceTo(3 * DAY + 8 * 60 + 21);

    expect(world.snapshot()).toMatchObject({
      intentions: [],
      npcs: {
        wife: {
          locationId: "room_threshold",
          visibleActivityId: "remaining_at_threshold",
        },
      },
    });
    expect(world.events()).toContainEqual({
      at: 3 * DAY + 8 * 60 + 21,
      type: "narrative_action_executed",
      actorId: "wife",
      actionId: "remain_at_threshold",
      locationId: "room_threshold",
      visibleActivityId: "remaining_at_threshold",
    });
  });

  it("LDO-CH1-008 LDO-CH1-009 rejects unknown, ineligible, and completed Actions without mutation", () => {
    const world = createVerticalSliceWorld();
    const initialSnapshot = world.snapshot();

    expect(() =>
      world.commitNarrativeAction(
        "husband",
        "invented_action" as NarrativeActionId,
      ),
    ).toThrow("Narrative action is not eligible: invented_action");
    expect(() =>
      world.commitNarrativeAction("wife", "remain_at_threshold"),
    ).toThrow("Narrative action is not eligible: remain_at_threshold");
    expect(world.snapshot()).toEqual(initialSnapshot);

    executeChapterDoorAction(world);
    world.advanceTo(3 * DAY + 8 * 60 + 20);
    world.pause();
    world.commitNarrativeAction("wife", "remain_at_threshold");
    world.resume();
    world.advanceTo(3 * DAY + 8 * 60 + 21);

    expect(world.snapshot().completedActions).toEqual([
      { actorId: "husband", actionId: "interact_with_living_room_clock" },
      { actorId: "husband", actionId: "open_door_a_crack" },
      { actorId: "wife", actionId: "remain_at_threshold" },
    ]);
    expect(world.eligibleNarrativeActions("wife")).toEqual([]);
  });
});

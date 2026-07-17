import { describe, expect, it } from "vitest";
import {
  createConversationalVerticalSliceGameController,
  createVerticalSliceGameController,
} from "./controller";
import type { ConversationPorts } from "./conversation";
import { projectGame, projectWorld } from "./presentation";
import { renderWorldText } from "./text-rendering";
import { createVerticalSliceWorld } from "./world";

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

function reachControllerDay2Handle(
  controller: ReturnType<typeof createVerticalSliceGameController>,
): void {
  controller.advanceTo(7 * 60 + 57);
  controller.dispatch({ type: "pause_world" });
  controller.dispatch({ type: "select_npc", npcId: "husband" });
  controller.dispatch({
    type: "select_action_option",
    optionId: "spend-time-with-clock",
  });
  controller.dispatch({ type: "resume_world" });
  controller.advanceTo(2 * DAY + 8 * 60 + 10);
}

describe("WorldProjector", () => {
  // Spec: ADR 0031 LDO-CALENDAR-001; ADR 0030 LDO-PRES-001.
  it("projects the safe absolute weekday separately from relative chapter day", () => {
    const world = createVerticalSliceWorld();

    expect(projectWorld(world.snapshot(), world.events())).toMatchObject({
      weekdayId: "thursday",
      chapterDay: null,
    });

    world.advanceTo(24 * 60 + 7 * 60 + 56);

    expect(projectWorld(world.snapshot(), world.events())).toMatchObject({
      weekdayId: "friday",
      chapterDay: null,
    });
  });

  // Spec: ADR 0031 LDO-CALENDAR-003 through 006; ADR 0029 LDO-PERF-003.
  it("projects authored work and weekend life as safe ordinary cues with real offstage placement", () => {
    const world = createVerticalSliceWorld();

    world.advanceTo(8 * 60 + 25);
    let view = projectWorld(world.snapshot(), world.events());

    expect(view.actors).toContainEqual({
      id: "husband",
      locationId: "away_from_home",
      visibleActivityId: "away_at_work",
    });
    expect(renderWorldText(view)).toContain(
      "08:25 — Front door — He checks the time, shoulders his work bag, and leaves for the bus.",
    );

    world.advanceTo(2 * DAY + 11 * 60 + 57);
    view = projectWorld(world.snapshot(), world.events());
    const rendered = renderWorldText(view);

    expect(rendered).toContain("Thursday");
    expect(rendered).toContain("Friday");
    expect(rendered).toContain("Saturday");
    expect(rendered).toContain(
      "11:57 — Dining area — He returns with the remaining grocery bags.",
    );
    expect(rendered).not.toMatch(/procurement|restaurant-supply|payroll/i);
  });

  it("LDO-LOCAL-014 ADR 0021 keeps the existing second resident outside the tutorial-safe projection until success", () => {
    const world = createVerticalSliceWorld();
    world.advanceTo(DAY + 7 * 60 + 57);

    expect(world.snapshot().npcs).toHaveProperty("wife");
    expect(projectWorld(world.snapshot(), world.events()).actors).toEqual([
      {
        id: "husband",
        locationId: "living_room",
        visibleActivityId: "noticing_slow_clock",
      },
    ]);

    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(DAY + 8 * 60);

    expect(projectWorld(world.snapshot(), world.events()).actors).toEqual([
      expect.objectContaining({ id: "husband" }),
      expect.objectContaining({ id: "wife" }),
    ]);
  });

  it("LDO-CH1-003 LDO-CH1-012 projects Chapter day/local time and renders both opening routines", () => {
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

    const view = projectWorld(world.snapshot(), world.events());
    const rendered = renderWorldText(view);

    expect(view).toMatchObject({
      time: chapterDayOne + 8 * 60 + 20,
      chapter: 1,
      chapterDay: 1,
      localTime: 8 * 60 + 20,
    });
    expect(rendered).toContain("Chapter 1 — Day 1");
    expect(rendered).toContain(
      "08:10 — Hallway — He walks down the hallway, slowing before the fully closed door. He turns back without reaching it.",
    );
    expect(rendered).toContain(
      "08:20 — Hallway — She starts into the hallway, stops near its entrance, and returns to the dining area by the longer route.",
    );
    expect(rendered).not.toContain("32:10");
    expect(rendered).not.toContain("32:20");
  });

  it("LDO-CH1-008 LDO-CH1-012 exposes a renderer-safe WorldView without private domain state", () => {
    const world = createVerticalSliceWorld();
    completeClockTutorial(world);
    world.advanceTo(2 * DAY + 8 * 60 + 10);
    world.pause();
    world.commitNarrativeAction("husband", "open_door_a_crack");
    world.resume();
    world.advanceTo(2 * DAY + 17 * 60 + 40);

    const view = projectWorld(world.snapshot(), world.events());

    expect(view).toMatchObject({
      time: 2 * DAY + 17 * 60 + 40,
      paused: false,
      actors: [
        {
          id: "husband",
          locationId: "dining_area",
          visibleActivityId: "returning_with_groceries",
        },
        {
          id: "wife",
          locationId: "hallway",
          visibleActivityId: "observing_first_door_gap",
        },
      ],
      objects: [
        {
          id: "hallway_door",
          locationId: "hallway",
          visibleStateId: "slightly_open",
        },
        {
          id: "living_room_clock",
          locationId: "living_room",
          visibleStateId: "accurate",
        },
      ],
    });
    expect(view.timeline.map(({ cueId }) => cueId)).toEqual(
      expect.arrayContaining([
        "husband_turns_before_closed_door",
        "wife_takes_long_route",
        "husband_reaches_closed_handle",
        "husband_opens_door",
        "hallway_door_state_changed",
        "wife_observes_first_gap",
        "wife_notices_door",
      ]),
    );

    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain("open_door_a_crack");
    expect(serialized).not.toContain("remain_at_threshold");
    expect(serialized).not.toContain("door_is_slightly_open");
    expect(serialized).not.toContain("observedBy");
    expect(serialized).not.toContain("intentions");
    expect(serialized).not.toContain("completedActions");
    expect(serialized).not.toContain("narrative_action_executed");
    expect(serialized).not.toContain("routine_executed");
  });

  it("LDO-CH1-010 LDO-CH1-012 projects the revealed room window and final Evidence without mislabeling it as the hallway door", () => {
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
    world.pause();
    world.commitNarrativeAction("wife", "open_room_window");
    world.resume();
    world.advanceTo(5 * day + 8 * 60 + 21);

    const view = projectWorld(world.snapshot(), world.events());
    const rendered = renderWorldText(view);

    expect(view.objects).toContainEqual({
      id: "room_window",
      locationId: "room_interior",
      visibleStateId: "open_one_hand_width",
    });
    expect(view.timeline.map(({ cueId }) => cueId)).toContain(
      "room_window_state_changed",
    );
    expect(rendered).toContain(
      "08:20 — Room — From inside, she looks toward the closed window and changes nothing.",
    );
    expect(rendered).toContain("Chapter 1 — Day 5");
    expect(rendered).toContain(
      "08:21 — Room — The window is open one hand-width.",
    );
    expect(rendered).not.toContain(
      "08:21 — Hallway — The door is slightly open.",
    );

    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain("room_window_is_open");
    expect(serialized).not.toContain("open_room_window");
    expect(serialized).not.toContain("chapter1Complete");
  });
});

describe("GameProjector", () => {
  // Spec: ADR 0029 LDO-PERF-003.
  it("projects the authored routine cue without requesting generated staging", async () => {
    const ports: ConversationPorts = {
      persona: {
        async takeTurn() {
          throw new Error("Not exercised");
        },
      },
      actionJudge: {
        async judgeAwareness() {
          throw new Error("Not exercised");
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      },
      performanceDirector: {
        async stage() {
          throw new Error("Routine performance must not be generated");
        },
      },
    };
    const controller = createConversationalVerticalSliceGameController(ports);

    await controller.advanceToWithPerformance(7 * 60 + 57);
    const view = projectGame(controller.snapshot());
    const rendered = renderWorldText(view.world);

    expect(rendered).toBe(
      [
        "Thursday",
        "07:57 — Living room — The wall clock shows 07:54.",
        "07:57 — Living room — He looks up, starts to pass beneath it, then stops.",
      ].join("\n"),
    );
    expect(controller.snapshot().performances).toEqual([]);
    expect(JSON.stringify(view.world)).not.toMatch(
      /slow_clock_is_repeatedly_noticed|restore_valid_starting_state|acceptedPersonaReply|hintBrief/,
    );
  });

  it("LDO-LOCAL-011 uses generated Action staging instead of duplicating its neutral fallback", () => {
    const world = createVerticalSliceWorld();
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction("husband", "interact_with_living_room_clock");
    world.resume();
    world.advanceTo(7 * 60 + 59);
    const events = world.events();
    const actionEventIndex = events.findIndex(
      (event) =>
        event.type === "narrative_action_executed" &&
        event.actionId === "interact_with_living_room_clock",
    );

    const rendered = renderWorldText(
      projectWorld(world.snapshot(), events, [
        {
          afterEventIndex: actionEventIndex,
          at: 7 * 60 + 59,
          beats: ["He turns the hands too far, smiles, then sets them to 07:59."],
        },
      ]),
    );

    expect(rendered).toContain(
      "07:59 — He turns the hands too far, smiles, then sets them to 07:59.",
    );
    expect(rendered).not.toContain("He adjusts the clock to the current time.");
    expect(rendered).toContain("07:59 — Living room — The clock now shows 07:59.");
  });

  it("LDO-CH1-008 LDO-CH1-012 exposes a renderer-safe UIView without internal Action IDs", () => {
    const controller = createVerticalSliceGameController();
    reachControllerDay2Handle(controller);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    const view = projectGame(controller.snapshot());

    expect(view).toMatchObject({
      world: {
        time: 2 * DAY + 8 * 60 + 10,
        paused: true,
      },
      ui: {
        mode: "paused",
        selectedActor: {
          id: "husband",
          label: "Martin",
        },
        actionOptions: [
          {
            optionId: "open-door-a-crack",
            label: "Open the door just a little.",
          },
          {
            optionId: "say-one-honest-thing",
            label: "Try to say one honest thing to Elise.",
          },
        ],
      },
    });

    const serialized = JSON.stringify(view.ui);
    expect(serialized).not.toContain("open_door_a_crack");
    expect(serialized).not.toContain("remain_at_threshold");
    expect(serialized).not.toContain("intentions");
    expect(serialized).not.toContain("completedActions");
  });
});

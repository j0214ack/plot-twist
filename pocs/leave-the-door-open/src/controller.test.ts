import { describe, expect, it } from "vitest";
import {
  createVerticalSliceGameController,
  VerticalSliceGameController,
} from "./controller";
import { createVerticalSliceWorld } from "./world";

const DAY = 24 * 60;

function reachChapterDay2Handle(
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

describe("VerticalSliceGameController", () => {
  // Spec: chapter-1.md LDO-CH1-017 and LDO-CH1-019. The deterministic
  // no-model harness still uses the same Controller-owned default readiness.
  it("commits the bounded relationship option with the authored guarded closure in the public harness", () => {
    const controller = createVerticalSliceGameController();
    controller.advanceTo(7 * 60 + 57);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    controller.dispatch({
      type: "select_action_option",
      optionId: "spend-time-with-clock",
    });
    controller.dispatch({ type: "resume_world" });
    controller.advanceTo(DAY + 8 * 60 + 20);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    expect(controller.snapshot().interaction.availableActionOptionIds).toEqual([
      "say-one-honest-thing",
    ]);
    controller.dispatch({
      type: "select_action_option",
      optionId: "say-one-honest-thing",
    });

    expect(controller.snapshot().world.intentions).toEqual([
      {
        actorId: "husband",
        actionId: "say_one_honest_thing_to_elise",
        relationshipOutcomeId: "practical_deflection",
      },
    ]);
  });

  // Spec: ADR 0029 LDO-TIME-001 and LDO-TIME-002.
  it("uses a configurable turn window and stops earlier at a player-presentable event", async () => {
    const controller = new VerticalSliceGameController(
      createVerticalSliceWorld(),
      null,
      { maxTurnMinutes: 7 },
    );
    controller.advanceTo(7 * 60 + 57);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    controller.dispatch({
      type: "select_action_option",
      optionId: "spend-time-with-clock",
    });
    controller.dispatch({ type: "resume_world" });

    const first = await controller.advanceTurn(DAY + 8 * 60 + 20);
    const second = await controller.advanceTurn(DAY + 8 * 60 + 20);
    const third = await controller.advanceTurn(DAY + 8 * 60 + 20);

    expect(first).toEqual({ at: 7 * 60 + 59, reachedTarget: false });
    expect(second).toEqual({ at: 8 * 60, reachedTarget: false });
    expect(third).toEqual({ at: 8 * 60 + 7, reachedTarget: false });
    expect(controller.snapshot().events.filter(({ at }) => at === 8 * 60)).toMatchObject([
      {
        type: "routine_executed",
        actorId: "husband",
        routineId: "husband_sits_on_sofa",
      },
      {
        type: "routine_executed",
        actorId: "wife",
        routineId: "wife_drinks_water",
      },
      { type: "evidence_observed", observerId: "wife" },
    ]);
  });

  it("LDO-LOCAL-010 keeps the clock tutorial on its sole authored Husband focus", () => {
    const controller = createVerticalSliceGameController();
    controller.advanceTo(7 * 60 + 57);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    const before = controller.snapshot();

    expect(() =>
      controller.dispatch({ type: "select_npc", npcId: "wife" }),
    ).toThrow("Wife focus is unavailable during the clock tutorial");
    expect(controller.snapshot()).toEqual(before);
  });

  it("LDO-CH1-008 accepts fixed PlayerCommands as the only semantic input boundary", () => {
    const controller = createVerticalSliceGameController();
    reachChapterDay2Handle(controller);

    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    expect(controller.snapshot()).toMatchObject({
      world: {
        time: 2 * DAY + 8 * 60 + 10,
        paused: true,
        worldFacts: { hallwayDoor: "closed" },
      },
      interaction: {
        mode: "paused",
        selectedNpcId: "husband",
        availableActionOptionIds: [
          "open-door-a-crack",
          "say-one-honest-thing",
        ],
      },
    });

    controller.dispatch({
      type: "select_action_option",
      optionId: "open-door-a-crack",
    });
    expect(controller.snapshot().world.intentions).toEqual([
      { actorId: "husband", actionId: "open_door_a_crack" },
    ]);

    controller.dispatch({ type: "resume_world" });
    controller.advanceTo(2 * DAY + 8 * 60 + 11);

    expect(controller.snapshot()).toMatchObject({
      world: {
        time: 2 * DAY + 8 * 60 + 11,
        paused: false,
        worldFacts: { hallwayDoor: "slightly_open" },
      },
      interaction: {
        mode: "running",
        selectedNpcId: null,
        availableActionOptionIds: [],
      },
    });
  });

  it("LDO-CH1-008 rejects an unavailable option without mutating Controller or World", () => {
    const controller = createVerticalSliceGameController();
    reachChapterDay2Handle(controller);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    const before = controller.snapshot();

    expect(() =>
      controller.dispatch({
        type: "select_action_option",
        optionId: "wait-at-threshold",
      }),
    ).toThrow("Action option is not available: wait-at-threshold");
    expect(controller.snapshot()).toEqual(before);
  });

  it("LDO-CH1-008 offers and commits Action options only while the World is paused", () => {
    const controller = createVerticalSliceGameController();
    reachChapterDay2Handle(controller);
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    const before = controller.snapshot();

    expect(before.interaction).toMatchObject({
      mode: "running",
      selectedNpcId: "husband",
      availableActionOptionIds: [],
    });
    expect(() =>
      controller.dispatch({
        type: "select_action_option",
        optionId: "open-door-a-crack",
      }),
    ).toThrow("Action option is not available: open-door-a-crack");
    expect(controller.snapshot()).toEqual(before);
  });
});

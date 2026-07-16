import { describe, expect, it } from "vitest";
import { createVerticalSliceGameController } from "./controller";

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
        availableActionOptionIds: ["open-door-a-crack"],
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

import { describe, expect, it } from "vitest";
import { VerticalSliceGameController } from "./controller";
import { projectGame } from "./presentation";
import {
  composeTextLayers,
  renderUIText,
  renderWorldText,
} from "./text-rendering";
import { createVerticalSliceWorld } from "./world";

const DAY = 24 * 60;

describe("layered text rendering", () => {
  it("LDO-CH1-008 LDO-CH1-012 renders immutable World and UI views as independent layers", () => {
    const world = createVerticalSliceWorld({
      ambientChoice: { choose: () => null },
    });
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction("husband", "interact_with_living_room_clock");
    world.resume();
    world.advanceTo(7 * 60 + 59);
    const controller = new VerticalSliceGameController(world);
    controller.advanceTo(2 * DAY + 8 * 60 + 10);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    const view = projectGame(controller.snapshot());
    const before = structuredClone(view);

    const worldLayer = renderWorldText(view.world);
    const uiLayer = renderUIText(view.ui);

    expect(worldLayer).toBe(
      [
        "07:57 — Living room — The wall clock shows 07:54.",
        "07:57 — Living room — He looks up, starts to pass beneath it, then stops.",
        "07:57 — The world pauses.",
        "07:57 — The world resumes.",
        "07:59 — Living room — He adjusts the clock to the current time.",
        "07:59 — Living room — The clock now shows 07:59.",
        "08:00 — Living room — He sits at the far end of the sofa.",
        "08:00 — Dining area — She drinks a glass of water.",
        "08:00 — Dining area — She glances toward the clock and sees the correct time.",
        "Chapter 1 — Day 1",
        "08:10 — Hallway — He walks down the hallway, slowing before the fully closed door. He turns back without reaching it.",
        "08:20 — Hallway — She starts into the hallway, stops near its entrance, and returns to the dining area by the longer route.",
        "Chapter 1 — Day 2",
        "08:10 — Hallway — This time he does not turn back. He reaches the closed door and rests his hand on the handle without moving it.",
        "08:10 — The world pauses.",
      ].join("\n"),
    );
    expect(worldLayer).not.toContain("Possibilities");

    expect(uiLayer).toBe(
      [
        "[Paused]",
        "Focus: Martin",
        "Possibilities:",
        "1. Open the door just a little.",
      ].join("\n"),
    );
    expect(uiLayer).not.toContain("Hallway");

    expect(composeTextLayers(worldLayer, uiLayer)).toBe(
      `${worldLayer}\n\n${uiLayer}`,
    );
    expect(view).toEqual(before);
  });
});

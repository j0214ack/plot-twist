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
        "Thursday",
        "07:57 — Living room — The wall clock shows 07:54.",
        "07:57 — Living room — He looks up, starts to pass beneath it, then stops.",
        "07:57 — The world pauses.",
        "07:57 — The world resumes.",
        "07:59 — Living room — He adjusts the clock to the current time.",
        "07:59 — Living room — The clock now shows 07:59.",
        "08:00 — Living room — He sits at the far end of the sofa.",
        "08:00 — Dining area — She drinks a glass of water.",
        "08:00 — Dining area — She glances toward the clock and sees the correct time.",
        "08:25 — Front door — He checks the time, shoulders his work bag, and leaves for the bus.",
        "08:35 — Front door — She checks that she has her keys and leaves on foot.",
        "17:25 — Dining area — She returns from work and sets down her bag.",
        "18:05 — Living room — He returns from work and leaves his bag beside the sofa.",
        "Friday",
        "Chapter 1 — Day 1",
        "08:10 — Hallway — He walks down the hallway, slowing before the fully closed door. He turns back without reaching it.",
        "08:20 — Hallway — She starts into the hallway, stops near its entrance, and returns to the dining area by the longer route.",
        "08:25 — Front door — He checks the time, shoulders his work bag, and leaves for the bus.",
        "08:35 — Front door — She checks that she has her keys and leaves on foot.",
        "17:25 — Dining area — She returns from work and sets down her bag.",
        "18:05 — Living room — He returns from work and leaves his bag beside the sofa.",
        "Saturday",
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
        "2. Try to say one honest thing to Elise.",
      ].join("\n"),
    );
    expect(uiLayer).not.toContain("Hallway");

    expect(composeTextLayers(worldLayer, uiLayer)).toBe(
      `${worldLayer}\n\n${uiLayer}`,
    );
    expect(view).toEqual(before);
  });

  // Spec: ADR 0033 LDO-LOC-001 through LDO-LOC-006.
  it("renders the same semantic tutorial view with authored zh-TW presentation copy", () => {
    const world = createVerticalSliceWorld();
    world.advanceTo(7 * 60 + 57);
    world.pause();
    const controller = new VerticalSliceGameController(
      world,
      null,
      { maxTurnMinutes: 15 },
      "zh-TW",
    );
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    const view = projectGame(controller.snapshot());

    expect(view.world.locale).toBe("zh-TW");
    expect(renderWorldText(view.world)).toBe(
      [
        "星期四",
        "07:57——客廳——牆上的時鐘顯示 07:54。",
        "07:57——客廳——他抬頭看了一眼，正要從時鐘下方走過，卻停了下來。",
        "07:57——時間暫停了。",
      ].join("\n"),
    );
    expect(renderUIText(view.ui)).toBe(
      [
        "[已暫停]",
        "焦點：馬丁",
        "可能的行動：",
        "1. 陪這座時鐘一下。",
      ].join("\n"),
    );
  });
});

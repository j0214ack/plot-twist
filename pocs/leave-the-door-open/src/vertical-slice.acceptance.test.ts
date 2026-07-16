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

describe("Leave the Door Open text vertical slice", () => {
  it("LDO-CH1-001 LDO-CH1-008 LDO-CH1-009 LDO-CH1-012 renders the canonical tutorial-to-threshold causal chain with separate UI overlays", () => {
    const controller = new VerticalSliceGameController(
      createVerticalSliceWorld({
        ambientChoice: { choose: () => null },
      }),
    );

    controller.advanceTo(7 * 60 + 57);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    const clockOverlay = renderUIText(projectGame(controller.snapshot()).ui);

    expect(clockOverlay).toBe(
      [
        "[Paused]",
        "Focus: Martin",
        "Possibilities:",
        "1. Spend a moment with the clock.",
      ].join("\n"),
    );

    controller.dispatch({
      type: "select_action_option",
      optionId: "spend-time-with-clock",
    });
    controller.dispatch({ type: "resume_world" });
    controller.advanceTo(2 * DAY + 8 * 60 + 10);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    const husbandOverlay = renderUIText(projectGame(controller.snapshot()).ui);

    expect(husbandOverlay).toBe(
      [
        "[Paused]",
        "Focus: Martin",
        "Possibilities:",
        "1. Open the door just a little.",
      ].join("\n"),
    );

    controller.dispatch({
      type: "select_action_option",
      optionId: "open-door-a-crack",
    });
    controller.dispatch({ type: "resume_world" });
    controller.advanceTo(3 * DAY + 8 * 60 + 20);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "wife" });
    const wifeOverlay = renderUIText(projectGame(controller.snapshot()).ui);

    expect(wifeOverlay).toBe(
      [
        "[Paused]",
        "Focus: Elise",
        "Possibilities:",
        "1. Remain at the threshold for one breath.",
      ].join("\n"),
    );

    controller.dispatch({
      type: "select_action_option",
      optionId: "wait-at-threshold",
    });
    controller.dispatch({ type: "resume_world" });
    controller.advanceTo(3 * DAY + 8 * 60 + 21);

    const finalView = projectGame(controller.snapshot());
    const worldLayer = renderWorldText(finalView.world);
    const uiLayer = renderUIText(finalView.ui);
    const composed = composeTextLayers(worldLayer, uiLayer);

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
        "08:10 — The world resumes.",
        "08:11 — Hallway — He opens the door just far enough to leave a narrow gap.",
        "08:11 — Hallway — The door is slightly open.",
        "17:40 — Hallway — She notices the narrow gap and stops away from the threshold without touching the door.",
        "17:40 — Hallway — She notices the open door.",
        "Chapter 1 — Day 3",
        "08:20 — Room threshold — The next morning she stops immediately outside, one step short of crossing. Nothing in the room changes.",
        "08:20 — The world pauses.",
        "08:20 — The world resumes.",
        "08:21 — Hallway — She remains at the threshold.",
      ].join("\n"),
    );
    expect(uiLayer).toBe("[Running]");
    expect(composed).toBe(`${worldLayer}\n\n[Running]`);
    expect(
      [clockOverlay, husbandOverlay, wifeOverlay, composed].join("\n"),
    ).not.toMatch(
      /interact_with_living_room_clock|open_door_a_crack|remain_at_threshold|living_room_clock_is_accurate|door_is_slightly_open|intentions|observedBy/,
    );
  });
});

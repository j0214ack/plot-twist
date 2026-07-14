import { describe, expect, it } from "vitest";
import { nextStepGuidance } from "./game-guidance";

describe("nextStepGuidance", () => {
  // Spec: design.md "Technical spike 的進度提示" and validation-plan.md Primary step 7.
  it("persistently tells a first-time player to cast the key toward the locked door", () => {
    expect(
      nextStepGuidance({ guardianDefeated: true, doorUnlocked: false, completed: false }),
    ).toEqual({
      label: "NEXT SENTENCE",
      text: "現在施咒讓鑰匙去打開門",
    });
  });

  it("does not reveal or retain that step before the key drops or after the door unlocks", () => {
    expect(
      nextStepGuidance({ guardianDefeated: false, doorUnlocked: false, completed: false }),
    ).toBeNull();
    expect(
      nextStepGuidance({ guardianDefeated: true, doorUnlocked: true, completed: false }),
    ).toBeNull();
    expect(
      nextStepGuidance({ guardianDefeated: true, doorUnlocked: true, completed: true }),
    ).toBeNull();
  });
});

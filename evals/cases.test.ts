import { describe, expect, it } from "vitest";
import { getLiveEvalCase } from "./cases";

describe("getLiveEvalCase", () => {
  // Spec: validation-plan.md Primary scenario step 5 and live Eval fields.
  it("defines an explicit causal-damage case whose pass condition includes guardian HP loss", () => {
    const evalCase = getLiveEvalCase("burning-guardian-v1");

    expect(evalCase.utterance).toContain("持續受到傷害");
    expect(evalCase.minimumDamage).toBeGreaterThan(0);
    expect(evalCase.minimumSpawnedEntities).toBeGreaterThan(0);
  });

  // Spec: validation-plan.md voice and dynamic-causality regression case.
  it("requires a falling meteor to move and damage instead of remaining a static prop", () => {
    const evalCase = getLiveEvalCase("falling-meteor-v1");

    expect(evalCase.utterance).toContain("隕石");
    expect(evalCase.minimumSpawnedEntities).toBeGreaterThan(0);
    expect(evalCase.minimumMovedEntities).toBeGreaterThan(0);
    expect(evalCase.minimumDamage).toBeGreaterThan(0);
  });

  // Spec: Decision 0006 NAV-1 through NAV-3 and Decision 0007 MOD-5.
  it("evaluates terse and explicit-locomotion key requests against the same unlock goal", () => {
    const terse = getLiveEvalCase("key-unlock-terse-v1");
    const flying = getLiveEvalCase("key-unlock-flying-v1");

    expect(terse.utterance).toBe("鑰匙開鎖");
    expect(flying.utterance).toContain("飛去開鎖");
    expect(terse.scenario).toBe("key-door-open");
    expect(flying.scenario).toBe("key-door-open");
    expect(terse.expectedDoorUnlocked).toBe(true);
    expect(flying.expectedDoorUnlocked).toBe(true);
    expect(terse.minimumActorDistance).toBeGreaterThan(0);
    expect(flying.minimumActorDistance).toBeGreaterThan(0);
    expect(terse.expectedLocomotionMode).toBeUndefined();
    expect(flying.expectedLocomotionMode).toBe("flight");
    expect(terse).not.toHaveProperty("expectedModuleCount");
    expect(flying).not.toHaveProperty("expectedModuleCount");
  });

  // Spec: validation-plan.md H10 and contact regression cases; interaction wording is not a Host keyword.
  it("evaluates the player's 解鎖 wording as the same flying causal interaction", () => {
    const synonym = getLiveEvalCase("key-unlock-flying-synonym-v1");

    expect(synonym.utterance).toBe("讓鑰匙飛去解鎖");
    expect(synonym.scenario).toBe("key-door-open");
    expect(synonym.expectedDoorUnlocked).toBe(true);
    expect(synonym.minimumActorDistance).toBeGreaterThan(0);
    expect(synonym.expectedLocomotionMode).toBe("flight");
  });

  // Spec: Decision 0006 NAV-8 and NAV-9; a sealed causal actor must fail visibly.
  it("evaluates a sealed key as no-path without changing the protected lock", () => {
    const sealed = getLiveEvalCase("key-unlock-sealed-v1");

    expect(sealed.scenario).toBe("key-door-sealed");
    expect(sealed.expectedDoorUnlocked).toBe(false);
    expect(sealed.expectedNoteSubstring).toContain("找不到");
    expect(sealed.minimumActorDistance).toBeGreaterThan(0);
  });

  // Spec: Decision 0007 LOC-4 through LOC-6; flight remains observable and solid-colliding.
  it("requires a sealed flying key to manifest flight without bypassing its cage", () => {
    const sealedFlight = getLiveEvalCase("key-unlock-flying-sealed-v1");

    expect(sealedFlight.utterance).toContain("飛去開鎖");
    expect(sealedFlight.scenario).toBe("key-door-sealed");
    expect(sealedFlight.expectedLocomotionMode).toBe("flight");
    expect(sealedFlight.expectedDoorUnlocked).toBe(false);
    expect(sealedFlight.expectedNoteSubstring).toContain("找不到");
  });
});

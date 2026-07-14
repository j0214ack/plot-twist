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
});

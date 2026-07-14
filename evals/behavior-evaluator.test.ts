import { describe, expect, it } from "vitest";
import { evaluateObservableBehavior } from "./behavior-evaluator";

describe("evaluateObservableBehavior", () => {
  // Spec: validation-plan.md Gate B and live eval fields.
  it("scores observable spawn and movement without comparing exact generated source", () => {
    const result = evaluateObservableBehavior({
      sources: ["() => ({ setup(context) { Math.sin(1); }, dispose() {} })"],
      generatedBeforeUpdate: [
        { id: "moon-1", position: { x: 0, y: 1, z: 0 } },
        { id: "moon-2", position: { x: 1, y: 1, z: 0 } },
      ],
      generatedAfterUpdate: [
        { id: "moon-1", position: { x: 0.5, y: 1, z: 0 } },
        { id: "moon-2", position: { x: 1, y: 1, z: 0 } },
      ],
    });

    expect(result.spawnedEntities).toBe(2);
    expect(result.movedEntities).toBe(1);
    expect(result.forbiddenGlobalUses).toEqual([]);
  });

  // Spec: validation-plan.md Primary scenario step 5 and LLM behavior Eval boundary.
  it("scores damage from the target's observed HP change", () => {
    const result = evaluateObservableBehavior({
      sources: ["() => ({ setup() {}, dispose() {} })"],
      generatedBeforeUpdate: [],
      generatedAfterUpdate: [],
      targetHpBeforeUpdate: 100,
      targetHpAfterUpdate: 64,
    });

    expect(result.damageDealt).toBe(36);
  });

  // Spec: Decision 0001 limitation and validation-plan.md public-SDK-only rubric.
  it("flags undeclared global APIs as an eval failure rather than claiming sandbox safety", () => {
    const result = evaluateObservableBehavior({
      sources: ["() => { window.setTimeout(() => fetch('/secret'), 10) }"],
      generatedBeforeUpdate: [],
      generatedAfterUpdate: [],
    });

    expect(result.forbiddenGlobalUses).toEqual(
      expect.arrayContaining(["window", "fetch", "setTimeout"]),
    );
  });
});

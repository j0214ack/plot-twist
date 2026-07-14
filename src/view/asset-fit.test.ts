import { describe, expect, it } from "vitest";
import { calculateAssetFit } from "./asset-fit";

describe("calculateAssetFit", () => {
  // Spec: validation-plan.md "Demo visual asset pass": renderer-only asset placement.
  it("fits and centers a model inside an entity visual box", () => {
    expect(
      calculateAssetFit(
        { min: [-0.4, 0, -0.1], max: [0.4, 0.75, 0.1] },
        [3.2, 2.8, 0.45],
      ),
    ).toEqual({
      scale: [4, 2.8 / 0.75, 2.25],
      offset: [0, -1.4, 0],
    });
  });

  // Spec: validation-plan.md "Demo visual asset pass": floor assets remain loadable.
  it("keeps a zero-thickness source axis stable", () => {
    expect(
      calculateAssetFit(
        { min: [-0.5, 0, -0.5], max: [0.5, 0, 0.5] },
        [3, 0.08, 3],
      ),
    ).toEqual({
      scale: [3, 1, 3],
      offset: [0, 0, 0],
    });
  });
});

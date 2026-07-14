import { describe, expect, it } from "vitest";
import { SPELL_EXAMPLES } from "./spell-examples";

describe("SPELL_EXAMPLES", () => {
  // Spec: validation-plan.md Primary scenario step 5.
  it("includes a causal damage spell so the guardian HP path is directly playable", () => {
    expect(SPELL_EXAMPLES).toContainEqual(
      expect.objectContaining({
        label: "紫焰火圈",
        utterance: expect.stringContaining("持續受到傷害"),
      }),
    );
  });
});

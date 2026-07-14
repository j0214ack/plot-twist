import { describe, expect, it, vi } from "vitest";
import { compileSpellPayload } from "./spell-api";
import type { SpellBundle } from "../src/generative/types";

const bundle: SpellBundle = {
  summary: "A new mechanic",
  modules: [
    {
      id: "new-mechanic",
      label: "New mechanic",
      tags: ["new"],
      dependsOn: [],
      source: "() => ({ label: 'New mechanic', tags: [], setup() {}, dispose() {} })",
    },
  ],
};

describe("compileSpellPayload", () => {
  // Spec: Decision 0002 GEN-1; server validates transport shape, not natural-language intent.
  it("passes a valid utterance and scene to the generative compiler unchanged", async () => {
    const compile = vi.fn(async () => bundle);
    const payload = {
      utterance: "讓三顆紫色月亮繞著守衛",
      focusedEntityId: "guardian",
      scene: [
        {
          id: "guardian",
          name: "Guardian",
          tags: ["guardian"],
          affordances: [],
          position: { x: 2, y: 1, z: 0 },
        },
      ],
      recentArtifacts: [],
    };

    await expect(compileSpellPayload(payload, { compile })).resolves.toEqual(bundle);
    expect(compile).toHaveBeenCalledWith(payload);
  });

  // Spec: validation-plan.md deterministic pipeline boundary.
  it("rejects malformed transport data before spending a model call", async () => {
    const compile = vi.fn(async () => bundle);

    await expect(
      compileSpellPayload({ utterance: "", scene: "not-an-array" }, { compile }),
    ).rejects.toThrow("Invalid spell request");
    expect(compile).not.toHaveBeenCalled();
  });
});

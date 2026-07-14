import { describe, expect, it, vi } from "vitest";
import { OpenAiSpellModelClient } from "./openai-spell-model";
import type { SpellBundle, SpellModelInput } from "../src/generative/types";

const bundle: SpellBundle = {
  summary: "Make hostile projectiles orbit the caster.",
  modules: [
    {
      id: "orbital-shield",
      label: "Orbital shield",
      tags: ["gravity", "projectile-control"],
      dependsOn: [],
      source:
        "() => ({ label: 'Orbital shield', tags: ['gravity'], setup() {}, dispose() {} })",
    },
  ],
};

describe("OpenAiSpellModelClient", () => {
  // Spec: validation-plan.md LLM behavior boundary; Decision 0002 GEN-1.
  it("uses Structured Outputs while preserving the utterance, scene, and SDK contract", async () => {
    const parse = vi.fn(async () => ({ output_parsed: bundle }));
    const client = new OpenAiSpellModelClient({ responses: { parse } }, "test-model");
    const input: SpellModelInput = {
      utterance: "讓紅色子彈像行星一樣繞著我",
      focusedEntityId: "projectile-red",
      scene: [
        {
          id: "projectile-red",
          name: "Red projectile",
          tags: ["projectile", "hostile", "reflectable"],
          affordances: [],
          position: { x: 2, y: 0.5, z: 1 },
        },
      ],
      recentArtifacts: [],
      sdkContract: "interface MechanicModule { setup(context: GameContext): void }",
    };

    const result = await client.generate(input);

    expect(result).toEqual(bundle);
    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "test-model",
        input: [
          expect.objectContaining({
            role: "developer",
            content: expect.stringContaining("interface MechanicModule"),
          }),
          {
            role: "user",
            content: JSON.stringify({
              utterance: input.utterance,
              focusedEntityId: input.focusedEntityId,
              scene: input.scene,
              recentArtifacts: input.recentArtifacts,
            }),
          },
        ],
        text: expect.objectContaining({ format: expect.anything() }),
      }),
    );
  });

  // Spec: Decision 0002 GEN-5; a refusal or empty structured result is a visible failure.
  it("does not silently fall back when the model returns no parsed bundle", async () => {
    const client = new OpenAiSpellModelClient(
      { responses: { parse: async () => ({ output_parsed: null }) } },
      "test-model",
    );

    await expect(
      client.generate({
        utterance: "do something",
        scene: [],
        recentArtifacts: [],
        sdkContract: "MechanicModule",
      }),
    ).rejects.toThrow("no structured spell bundle");
  });
});

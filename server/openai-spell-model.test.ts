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
    const client = new OpenAiSpellModelClient(
      { responses: { parse } },
      {
        model: "test-model",
        reasoningEffort: "none",
        serviceTier: "priority",
      },
    );
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
        reasoning: { effort: "none" },
        service_tier: "priority",
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
    const request = parse.mock.calls[0]?.[0] as {
      input: Array<{ role: string; content: string }>;
    };
    const developerPrompt = request.input.find(({ role }) => role === "developer")?.content;
    expect(developerPrompt).toContain("A static visual does not satisfy a movement verb");
    expect(developerPrompt).toContain("moveToward");
    expect(developerPrompt).toContain("combat.damage");
    // Spec: Decision 0006 NAV-1 through NAV-3 and Decision 0007 MOD-1 through MOD-5.
    expect(developerPrompt).toContain("A causal interaction goal is not a protected state assignment");
    expect(developerPrompt).toContain("satisfy contact preconditions");
    expect(developerPrompt).toContain("Module boundaries follow independent runtime lifecycle");
    expect(developerPrompt).toContain("Do not force module count from grammar");
    expect(developerPrompt).not.toContain("Do not split a locomotion modifier into another module");
    expect(developerPrompt).toContain("use locomotion.attach");
    expect(developerPrompt).toContain("does not imply phase movement");
    expect(developerPrompt).toContain("The FlightModule owns all navigation");
    expect(developerPrompt).toContain("UnlockModule only polls interaction.invoke");
    expect(developerPrompt).toContain("navigation.planToContact");
    // Spec: Decision 0006 NAV-8; generated interactions visibly contact solids before replanning.
    expect(developerPrompt).toContain("navigation.stepDirectlyToContact");
    expect(developerPrompt).toContain("The factory parameter is artifact dependencies, NEVER GameContext");
    expect(developerPrompt).toContain("setup(context) { game = context");
  });

  // Spec: Decision 0002 GEN-5; a refusal or empty structured result is a visible failure.
  it("does not silently fall back when the model returns no parsed bundle", async () => {
    const client = new OpenAiSpellModelClient(
      { responses: { parse: async () => ({ output_parsed: null }) } },
      { model: "test-model", reasoningEffort: "medium" },
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

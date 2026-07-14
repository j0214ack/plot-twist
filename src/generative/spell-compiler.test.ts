import { describe, expect, it, vi } from "vitest";
import { SpellCompiler, type SpellModelClient } from "./spell-compiler";
import type { SpellBundle, SpellModelInput } from "./types";

const generatedBundle: SpellBundle = {
  summary: "A gravity well that bends hostile projectiles around the caster.",
  modules: [
    {
      id: "gravity-well",
      label: "Orbit hostile projectiles",
      tags: ["gravity", "projectile-control"],
      dependsOn: [],
      source: "(context) => ({ label: 'Gravity well', tags: ['gravity'], setup() {}, dispose() {} })",
    },
  ],
};

describe("SpellCompiler", () => {
  // Spec: Decision 0002 GEN-1, GEN-2 and validation-plan.md Gate B.
  it("GEN-1 sends the untouched utterance and scene context to a source-generating model", async () => {
    const generate = vi.fn(async (_input: SpellModelInput) => generatedBundle);
    const model: SpellModelClient = { generate };
    const compiler = new SpellCompiler(model);

    const result = await compiler.compile({
      utterance: "讓所有敵人的子彈繞著我旋轉",
      focusedEntityId: "guardian",
      scene: [
        {
          id: "projectile-1",
          name: "Redacted word",
          tags: ["projectile", "hostile", "reflectable"],
          affordances: [],
          position: { x: 2, y: 0.5, z: 0 },
        },
      ],
      recentArtifacts: [],
    });

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        utterance: "讓所有敵人的子彈繞著我旋轉",
        scene: expect.arrayContaining([
          expect.objectContaining({ id: "projectile-1", tags: expect.arrayContaining(["hostile"]) }),
        ]),
        sdkContract: expect.stringContaining("MechanicModule"),
      }),
    );
    expect(result.modules[0]?.source).toContain("Gravity well");
    expect(result.modules[0]?.id).toBe("gravity-well");

    const modelInput = generate.mock.calls[0]?.[0];
    expect(modelInput?.sdkContract).toContain("spawnPrimitive(request: SpawnPrimitiveRequest)");
    expect(modelInput?.sdkContract).toContain(
      "moveToward(entityId: string, target: Vec3, speed: number, deltaSeconds: number)",
    );
    expect(modelInput?.sdkContract).toContain(
      "damage(sourceId: string, targetId: string, requestedDamage: number)",
    );
  });

  // Spec: Decision 0002 GEN-4.
  it("GEN-4 rejects a bundle whose dependency does not refer to an earlier module", async () => {
    const model: SpellModelClient = {
      generate: async () => ({
        summary: "Invalid forward dependency",
        modules: [
          {
            id: "fire",
            label: "Fire",
            tags: ["fire"],
            dependsOn: ["missing-enclosure"],
            source: "() => ({})",
          },
        ],
      }),
    };
    const compiler = new SpellCompiler(model);

    await expect(
      compiler.compile({ utterance: "造牆後放火", scene: [], recentArtifacts: [] }),
    ).rejects.toThrow("unknown or forward dependency");
  });
});

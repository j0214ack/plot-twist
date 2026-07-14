import { describe, expect, it, vi } from "vitest";
import { ManaPool } from "../game/mana";
import { ModuleRuntime } from "../game/runtime";
import { GameWorld } from "../game/world";
import { BundleExecutor } from "./bundle-executor";
import { GenerativeSpellController, type SpellApiClient } from "./generative-spell-controller";
import { GeneratedModuleLoader } from "./module-loader";
import type { SpellBundle } from "./types";

const generatedBundle: SpellBundle = {
  summary: "Three violet moons orbit the guardian.",
  modules: [
    {
      id: "violet-moons",
      label: "Violet moons",
      tags: ["moon", "orbit"],
      dependsOn: [],
      source: `() => ({
        label: "Violet moons",
        tags: ["moon", "orbit"],
        setup(context) {
          context.world.spawnPrimitive({
            name: "Violet moon",
            tags: ["moon"],
            position: { x: 1, y: 1, z: 0 },
            size: { x: 0.3, y: 0.3, z: 0.3 },
            visual: { shape: "sphere", color: 10178047 },
          });
        },
        dispose() {},
      })`,
    },
  ],
};

const setup = (api: SpellApiClient) => {
  const world = new GameWorld();
  world.add({
    id: "guardian",
    name: "Guardian",
    tags: ["guardian", "enemy"],
    position: { x: 2, y: 1, z: 0 },
    size: { x: 1, y: 2, z: 1 },
    visual: { shape: "box", color: 0xff0000 },
  });
  const notes: string[] = [];
  const runtime = new ModuleRuntime(world, new ManaPool(), (note) => notes.push(note.text));
  const stages: string[] = [];
  const casting: boolean[] = [];
  const controller = new GenerativeSpellController(
    world,
    runtime,
    new BundleExecutor(runtime, new GeneratedModuleLoader()),
    api,
    {
      onStageChange: (stage) => stages.push(stage),
      onCastingChange: (value) => casting.push(value),
    },
  );
  return { world, runtime, controller, stages, casting, notes };
};

describe("GenerativeSpellController", () => {
  // Spec: validation-plan.md Gate B and H5; real generation runs while the game loop remains external.
  it("sends the current scene, manifests the returned bundle, and exposes casting state", async () => {
    const compile = vi.fn(async () => generatedBundle);
    const { world, runtime, controller, stages, casting, notes } = setup({ compile });

    const result = await controller.submit("召喚三顆紫色月亮", "guardian");

    expect(result.accepted).toBe(true);
    expect(compile).toHaveBeenCalledWith(
      expect.objectContaining({
        utterance: "召喚三顆紫色月亮",
        focusedEntityId: "guardian",
        scene: expect.arrayContaining([expect.objectContaining({ id: "guardian" })]),
      }),
    );
    expect(world.queryByTag("moon")).toHaveLength(1);
    expect(runtime.listArtifacts()).toHaveLength(1);
    expect(stages).toEqual(["writing", "manifesting", "idle"]);
    expect(casting).toEqual([true, false]);
    // Spec: design.md "結果式回饋"; ordinary success is visual, not another narration card.
    expect(notes).toEqual([]);
  });

  // Spec: design.md casting rhythm; only one utterance compiles at a time.
  it("rejects a second cast while the first model request is still pending", async () => {
    let resolve!: (bundle: SpellBundle) => void;
    const pending = new Promise<SpellBundle>((done) => (resolve = done));
    const { controller } = setup({ compile: async () => pending });

    const first = controller.submit("first", "guardian");
    await expect(controller.submit("second", "guardian")).resolves.toEqual({
      accepted: false,
      reason: "busy",
    });
    resolve(generatedBundle);
    await first;
  });
});

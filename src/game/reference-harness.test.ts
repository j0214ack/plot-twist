import { describe, expect, it, vi } from "vitest";
import { vec3 } from "./math";
import { ManaPool } from "./mana";
import { ReferenceHarnessController } from "./reference-harness";
import { ModuleRuntime } from "./runtime";
import { GameWorld } from "./world";

const setup = () => {
  const world = new GameWorld();
  world.add({
    id: "guardian",
    name: "Guardian",
    tags: ["guardian", "damageable"],
    position: vec3(),
    size: vec3(1, 2, 1),
    visual: { shape: "box", color: 0xffffff },
    stats: { hp: 100, maxHp: 100 },
    protected: true,
  });
  const runtime = new ModuleRuntime(world, new ManaPool(200), () => {});
  return { world, runtime };
};

describe("ReferenceHarnessController", () => {
  // Spec: Decision 0002 RHB-1, RHB-2.
  it("RHB-1 loads an explicit reference ID without parsing the utterance", () => {
    const { runtime } = setup();
    const castingChange = vi.fn();
    const controller = new ReferenceHarnessController(runtime, {
      generationSeconds: 1.5,
      onCastingChange: castingChange,
    });

    expect(controller.submitReference("enclosure", "guardian").accepted).toBe(true);
    expect(runtime.listArtifacts()).toHaveLength(0);
    expect(castingChange).toHaveBeenLastCalledWith(true);

    controller.update(1);
    expect(runtime.listArtifacts()).toHaveLength(0);

    controller.update(1);
    expect(runtime.listArtifacts()[0]?.tags).toContain("enclosure");
    expect(castingChange).toHaveBeenLastCalledWith(false);
  });

  // Spec: Decision 0002 RHB-4; design.md 詠唱與生成等待.
  it("RHB-4 keeps only one reference module in the writing stage at a time", () => {
    const { runtime } = setup();
    const controller = new ReferenceHarnessController(runtime);

    controller.submitReference("enclosure", "guardian");
    expect(controller.submitReference("fire", "guardian").accepted).toBe(false);
  });
});

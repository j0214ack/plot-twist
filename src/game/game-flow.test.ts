import { describe, expect, it } from "vitest";
import { ManaPool } from "./mana";
import { ReferenceHarnessController } from "./reference-harness";
import { ModuleRuntime } from "./runtime";
import { GameSimulation } from "./simulation";
import { GameWorld } from "./world";

describe("primary PoC game flow", () => {
  // Spec: Decision 0002 RHB-4 and validation-plan.md Gate A.
  it("turns wall then fire incantations into a dropped key with real starting Mana", () => {
    const world = new GameWorld();
    const mana = new ManaPool(100, 5);
    const runtime = new ModuleRuntime(world, mana, () => {});
    const simulation = new GameSimulation(world);
    simulation.setupLevel();
    const controller = new ReferenceHarnessController(runtime, { generationSeconds: 0 });

    controller.submitReference("enclosure", "guardian");
    controller.update(0.01);
    controller.submitReference("fire", "guardian");
    controller.update(0.01);

    for (let index = 0; index < 60; index += 1) {
      simulation.update(0.1, { moveX: 0, moveZ: 1, dash: false });
      runtime.update(0.1);
    }

    expect(world.get("guardian")?.stats?.hp).toBe(0);
    expect(world.queryByTag("key")).toHaveLength(1);
    expect(runtime.listArtifacts()).toHaveLength(2);
    expect(runtime.listArtifacts()[1]?.tags).toContain("fire-zone");
  });
});

import { describe, expect, it } from "vitest";
import { ManaPool } from "../game/mana";
import { ModuleRuntime } from "../game/runtime";
import { GameWorld } from "../game/world";
import { BundleExecutor } from "./bundle-executor";
import { GeneratedModuleLoader } from "./module-loader";
import type { SpellBundle } from "./types";

describe("BundleExecutor", () => {
  // Spec: Decision 0002 GEN-4 and Generated source ABI.
  it("loads modules in order and binds an earlier artifact to its declared dependent", () => {
    const world = new GameWorld();
    const runtime = new ModuleRuntime(world, new ManaPool(), () => {});
    const executor = new BundleExecutor(runtime, new GeneratedModuleLoader());
    const bundle: SpellBundle = {
      summary: "Build an enclosure and name the fire after it",
      modules: [
        {
          id: "enclosure",
          label: "Crystal enclosure",
          tags: ["enclosure"],
          dependsOn: [],
          source:
            "() => ({ label: 'Crystal enclosure', tags: ['enclosure'], setup() {}, dispose() {} })",
        },
        {
          id: "fire",
          label: "Dependent fire",
          tags: ["fire"],
          dependsOn: ["enclosure"],
          source:
            "(deps) => ({ label: 'Fire in ' + deps.enclosure.label, tags: ['fire'], setup() {}, dispose() {} })",
        },
      ],
    };

    const result = executor.execute(bundle);

    expect(result.artifactsByModuleId.enclosure.label).toBe("Crystal enclosure");
    expect(result.artifactsByModuleId.fire.label).toBe("Fire in Crystal enclosure");
  });

  // Spec: Decision 0002 GEN-5 and Generated source ABI bundle atomicity.
  it("rolls back earlier modules when a later generated module fails during setup", () => {
    const world = new GameWorld();
    const runtime = new ModuleRuntime(world, new ManaPool(), () => {});
    const executor = new BundleExecutor(runtime, new GeneratedModuleLoader());
    const bundle: SpellBundle = {
      summary: "A bundle whose second module fails",
      modules: [
        {
          id: "wall",
          label: "Temporary wall",
          tags: ["wall"],
          dependsOn: [],
          source: `() => ({
            label: "Temporary wall",
            tags: ["wall"],
            setup(context) {
              context.world.spawnPrimitive({
                name: "Temporary wall",
                tags: ["wall"],
                position: { x: 0, y: 1, z: 0 },
                size: { x: 1, y: 2, z: 1 },
                visual: { shape: "box", color: 16777215 },
                solid: true,
              });
            },
            dispose() {},
          })`,
        },
        {
          id: "broken-fire",
          label: "Broken fire",
          tags: ["fire"],
          dependsOn: ["wall"],
          source:
            "() => ({ label: 'Broken fire', tags: ['fire'], setup() { throw new Error('boom') }, dispose() {} })",
        },
      ],
    };

    expect(() => executor.execute(bundle)).toThrow("boom");
    expect(world.queryByTag("wall")).toEqual([]);
    expect(runtime.listArtifacts()).toEqual([]);
  });
});

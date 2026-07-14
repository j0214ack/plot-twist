import { describe, expect, it } from "vitest";
import { vec3 } from "./math";
import { ManaPool } from "./mana";
import { ModuleRuntime } from "./runtime";
import type { MechanicModule, WorldMutationResult, EntitySnapshot } from "./types";
import { GameWorld } from "./world";

const makeModule = (
  onSpawn: (result: WorldMutationResult<import("./types").SpawnPrimitiveRequest, EntitySnapshot>) => void,
): MechanicModule => ({
  label: "Test wall",
  tags: ["enclosure"],
  setup(context) {
    onSpawn(
      context.world.spawnPrimitive({
        name: "Test wall",
        tags: ["wall"],
        position: vec3(),
        size: vec3(10, 2, 1),
        visual: { shape: "box", color: 0xffffff },
        solid: true,
      }),
    );
  },
  dispose() {},
});

describe("ModuleRuntime", () => {
  it("owns module entities and removes them on dispose", () => {
    const world = new GameWorld();
    const runtime = new ModuleRuntime(world, new ManaPool(100), () => {});
    let spawnedId = "";

    const artifact = runtime.load(
      makeModule((result) => {
        spawnedId = result.actual?.id ?? "";
      }),
    );

    expect(spawnedId).not.toBe("");
    expect(world.get(spawnedId)?.ownerId).toBe(artifact.id);

    runtime.dispose(artifact.id);
    expect(world.get(spawnedId)).toBeUndefined();
  });

  it("scales a mutation down when actual mana is insufficient", () => {
    const world = new GameWorld();
    const runtime = new ModuleRuntime(world, new ManaPool(5, 0), () => {});
    let result:
      | WorldMutationResult<import("./types").SpawnPrimitiveRequest, EntitySnapshot>
      | undefined;

    runtime.load(makeModule((value) => (result = value)));

    expect(result?.status).toBe("partial");
    expect(result?.actual?.size.x).toBeLessThan(result?.requested.size.x ?? 0);
    expect(result?.adjustments).toContain("geometry-scaled-to-mana");
  });
});

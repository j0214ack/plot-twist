import { describe, expect, it, vi } from "vitest";
import { vec3 } from "./math";
import { ManaPool } from "./mana";
import { ModuleRuntime } from "./runtime";
import type {
  EntitySnapshot,
  GameContext,
  MechanicModule,
  WorldMutationResult,
} from "./types";
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

  // Spec: validation-plan.md H8; one generated update failure cannot stop the Host frame.
  it("isolates a module that throws during update and continues updating healthy modules", () => {
    const world = new GameWorld();
    const notes: string[] = [];
    const runtime = new ModuleRuntime(world, new ManaPool(100), (note) => notes.push(note.text));
    let brokenEntityId = "";
    const healthyUpdate = vi.fn();

    const brokenArtifact = runtime.load({
      label: "Broken meteor",
      tags: ["meteor"],
      setup(context) {
        brokenEntityId =
          context.world.spawnPrimitive({
            name: "Broken meteor",
            tags: ["meteor"],
            position: vec3(0, 4, 0),
            size: vec3(1, 1, 1),
            visual: { shape: "sphere", color: 0xffffff },
          }).actual?.id ?? "";
      },
      update() {
        throw new Error("bad generated update");
      },
      dispose() {},
    });
    const healthyArtifact = runtime.load({
      label: "Healthy spell",
      tags: [],
      setup() {},
      update: healthyUpdate,
      dispose() {},
    });

    expect(() => runtime.update(1 / 60)).not.toThrow();
    expect(healthyUpdate).toHaveBeenCalledOnce();
    expect(runtime.listArtifacts().map(({ id }) => id)).toEqual([healthyArtifact.id]);
    expect(runtime.listArtifacts().some(({ id }) => id === brokenArtifact.id)).toBe(false);
    expect(world.get(brokenEntityId)).toBeUndefined();
    expect(notes).toEqual([expect.stringContaining("Broken meteor")]);
  });

  // Spec: validation-plan.md falling-meteor regression; SDK movement includes vertical space.
  it("moves an owned entity vertically toward a target with the same X/Z coordinates", () => {
    const world = new GameWorld();
    const runtime = new ModuleRuntime(world, new ManaPool(100), () => {});
    let meteorId = "";
    let reached = true;
    let context: GameContext | undefined;

    runtime.load({
      label: "Falling meteor",
      tags: ["meteor"],
      setup(game) {
        context = game;
        meteorId =
          game.world.spawnPrimitive({
            name: "Meteor",
            tags: ["meteor"],
            position: vec3(0, 8, 0),
            size: vec3(1, 1, 1),
            visual: { shape: "sphere", color: 0xffffff },
          }).actual?.id ?? "";
      },
      update(deltaSeconds) {
        if (!context) return;
        reached = context.physics.moveToward(meteorId, vec3(0, 0, 0), 4, deltaSeconds);
      },
      dispose() {
        context = undefined;
      },
    });

    runtime.update(0.25);

    expect(reached).toBe(false);
    expect(world.get(meteorId)?.position.y).toBe(7);
  });
});

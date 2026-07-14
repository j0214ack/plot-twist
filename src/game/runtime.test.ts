import { describe, expect, it, vi } from "vitest";
import { vec3 } from "./math";
import { ManaPool } from "./mana";
import { ModuleRuntime } from "./runtime";
import type {
  EntitySnapshot,
  GameContext,
  MechanicModule,
  NavigationPath,
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

  // Spec: Decision 0006 NAV-5; all physical SDK movement respects generated solids.
  it("prevents a movable entity from tunneling through a solid while moving toward a target", () => {
    const world = new GameWorld();
    world.add({
      id: "key",
      name: "Key",
      tags: ["key", "unique"],
      position: vec3(0, 0, 0),
      size: vec3(0.4, 0.4, 0.4),
      visual: { shape: "box", color: 0xffd35a },
      affordances: ["movable", "unlocker"],
    });
    world.add({
      id: "generated-wall",
      name: "Generated wall",
      tags: ["wall", "solid"],
      position: vec3(1, 0, 0),
      size: vec3(0.5, 2, 4),
      visual: { shape: "box", color: 0xffffff },
    });
    const runtime = new ModuleRuntime(world, new ManaPool(100), () => {});
    let context: GameContext | undefined;

    runtime.load({
      label: "Move a physical key",
      tags: [],
      setup(game) {
        context = game;
      },
      update(deltaSeconds) {
        context?.physics.moveToward("key", vec3(3, 0, 0), 4, deltaSeconds);
      },
      dispose() {},
    });

    runtime.update(0.5);

    expect(world.get("key")?.position.x).toBeLessThan(0.55);
  });

  // Spec: Decision 0006 NAV-7; interactions expose why a causal precondition failed.
  it("returns structured unlock outcomes through the public interaction capability", () => {
    const world = new GameWorld();
    world.add({
      id: "key",
      name: "Key",
      tags: ["key", "unique"],
      position: vec3(0, 0, 0),
      size: vec3(0.4, 0.4, 0.4),
      visual: { shape: "box", color: 0xffd35a },
      affordances: ["movable", "unlocker"],
    });
    world.add({
      id: "door",
      name: "Door",
      tags: ["door", "locked"],
      position: vec3(4, 0, 0),
      size: vec3(1, 2, 0.5),
      visual: { shape: "box", color: 0xffffff },
      affordances: ["lock"],
      protected: true,
    });
    const runtime = new ModuleRuntime(world, new ManaPool(100), () => {});
    let context: GameContext | undefined;
    runtime.load({
      label: "Attempt an interaction",
      tags: [],
      setup(game) {
        context = game;
      },
      dispose() {},
    });

    expect(context?.interaction.invoke("key", "door", "unlock")).toMatchObject({
      status: "out-of-range",
    });
    expect(world.get("door")?.tags).toContain("locked");

    world.setPosition("key", vec3(4, 0, 0));
    expect(context?.interaction.invoke("key", "door", "unlock")).toMatchObject({
      status: "applied",
    });
    expect(context?.interaction.invoke("key", "door", "unlock")).toMatchObject({
      status: "already-complete",
    });
  });

  // Spec: Decision 0006 NAV-6, NAV-7 and validation-plan.md H9.
  it("plans around dynamic solids and reports when a movable actor is fully enclosed", () => {
    const addKeyAndDoor = (world: GameWorld) => {
      world.add({
        id: "key",
        name: "Key",
        tags: ["key", "unique"],
        position: vec3(0, 0, 0),
        size: vec3(0.4, 0.4, 0.4),
        visual: { shape: "box", color: 0xffd35a },
        affordances: ["movable", "unlocker"],
      });
      world.add({
        id: "door",
        name: "Door",
        tags: ["door", "locked"],
        position: vec3(4, 0, 0),
        size: vec3(1, 2, 0.5),
        visual: { shape: "box", color: 0xffffff },
        affordances: ["lock"],
        protected: true,
      });
    };

    const openWorld = new GameWorld();
    addKeyAndDoor(openWorld);
    const openRuntime = new ModuleRuntime(openWorld, new ManaPool(1_000), () => {});
    let navigationStatus = "not-started";
    let path: NavigationPath | undefined;
    let context: GameContext | undefined;

    openRuntime.load({
      label: "Navigate around a generated wall",
      tags: [],
      setup(game) {
        context = game;
        game.world.spawnPrimitive({
          name: "Partial barrier",
          tags: ["wall"],
          position: vec3(2, 0, 0),
          size: vec3(0.5, 2, 2),
          visual: { shape: "box", color: 0xffffff },
          solid: true,
        });
        const result = game.navigation.planToContact("key", "door", {
          contactDistance: 0.8,
        });
        navigationStatus = result.status;
        path = result.status === "path-found" ? result.path : undefined;
      },
      update(deltaSeconds) {
        if (!context || !path) return;
        const result = context.navigation.follow(path, 3, deltaSeconds);
        navigationStatus = result.status;
        if (result.status === "arrived") {
          context.interaction.invoke("key", "door", "unlock");
        }
      },
      dispose() {},
    });

    for (let frame = 0; frame < 240; frame += 1) openRuntime.update(1 / 60);

    expect(navigationStatus).toBe("arrived");
    expect(openWorld.get("door")?.tags).toContain("unlocked");

    const sealedWorld = new GameWorld();
    addKeyAndDoor(sealedWorld);
    const sealedRuntime = new ModuleRuntime(sealedWorld, new ManaPool(1_000), () => {});
    let sealedStatus = "not-started";
    sealedRuntime.load({
      label: "Detect a sealed enclosure",
      tags: [],
      setup(game) {
        for (const wall of [
          { position: vec3(-0.8, 0, 0), size: vec3(0.2, 2, 1.8) },
          { position: vec3(0.8, 0, 0), size: vec3(0.2, 2, 1.8) },
          { position: vec3(0, 0, -0.8), size: vec3(1.8, 2, 0.2) },
          { position: vec3(0, 0, 0.8), size: vec3(1.8, 2, 0.2) },
        ]) {
          game.world.spawnPrimitive({
            name: "Sealed wall",
            tags: ["wall"],
            position: wall.position,
            size: wall.size,
            visual: { shape: "box", color: 0xffffff },
            solid: true,
          });
        }
        sealedStatus = game.navigation.planToContact("key", "door", {
          contactDistance: 1.2,
        }).status;
      },
      dispose() {},
    });

    expect(sealedStatus).toBe("no-path");
    expect(sealedWorld.get("door")?.tags).toContain("locked");
  });

  // Spec: Decision 0006 NAV-6; live Eval regression for a sub-grid contact remainder.
  it("finishes a contact path when the remaining distance is smaller than one grid cell", () => {
    const world = new GameWorld();
    world.add({
      id: "actor",
      name: "Movable actor",
      tags: ["movable-actor"],
      position: vec3(3.15, 0, 0),
      size: vec3(0.4, 0.4, 0.4),
      visual: { shape: "box", color: 0xffffff },
      affordances: ["movable"],
    });
    world.add({
      id: "target",
      name: "Contact target",
      tags: ["target"],
      position: vec3(4, 0, 0),
      size: vec3(0.4, 0.4, 0.4),
      visual: { shape: "box", color: 0xffffff },
    });
    const runtime = new ModuleRuntime(world, new ManaPool(100), () => {});
    let status = "not-started";
    let path: NavigationPath | undefined;
    let context: GameContext | undefined;
    runtime.load({
      label: "Complete a short contact path",
      tags: [],
      setup(game) {
        context = game;
        const result = game.navigation.planToContact("actor", "target", {
          contactDistance: 0.8,
        });
        status = result.status;
        path = result.status === "path-found" ? result.path : undefined;
      },
      update(deltaSeconds) {
        if (!context || !path) return;
        status = context.navigation.follow(path, 3, deltaSeconds).status;
      },
      dispose() {},
    });

    for (let frame = 0; frame < 60; frame += 1) runtime.update(1 / 60);

    expect(status).toBe("arrived");
    expect(world.get("actor")?.position.x).toBeGreaterThan(3.15);
  });

  // Spec: Decision 0006 NAV-8; causal actors visibly try direct contact before path planning.
  it("reports a direct-contact collision after moving the actor up to a solid", () => {
    const world = new GameWorld();
    world.add({
      id: "actor",
      name: "Movable actor",
      tags: ["movable-actor"],
      position: vec3(0, 0, 0),
      size: vec3(0.4, 0.4, 0.4),
      visual: { shape: "box", color: 0xffffff },
      affordances: ["movable"],
    });
    world.add({
      id: "target",
      name: "Contact target",
      tags: ["target"],
      position: vec3(4, 0, 0),
      size: vec3(0.4, 0.4, 0.4),
      visual: { shape: "box", color: 0xffffff },
    });
    world.add({
      id: "barrier",
      name: "Solid barrier",
      tags: ["wall", "solid"],
      position: vec3(1, 0, 0),
      size: vec3(0.2, 2, 2),
      visual: { shape: "box", color: 0xffffff },
    });
    const runtime = new ModuleRuntime(world, new ManaPool(100), () => {});
    let status = "not-started";
    let context: GameContext | undefined;
    runtime.load({
      label: "Try direct contact",
      tags: [],
      setup(game) {
        context = game;
      },
      update(deltaSeconds) {
        if (!context || status === "blocked") return;
        status = context.navigation.stepDirectlyToContact(
          "actor",
          "target",
          { contactDistance: 0.8, speed: 3 },
          deltaSeconds,
        ).status;
      },
      dispose() {},
    });

    for (let frame = 0; frame < 60; frame += 1) runtime.update(1 / 60);

    expect(status).toBe("blocked");
    expect(world.get("actor")?.position.x).toBeGreaterThan(0);
    expect(world.get("actor")?.position.x).toBeLessThan(0.7);
  });
});

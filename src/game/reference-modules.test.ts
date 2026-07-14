import { describe, expect, it } from "vitest";
import { vec3 } from "./math";
import { ManaPool } from "./mana";
import {
  createEnclosureModule,
  createFireInRecentEnclosureModule,
  createKeyToLockModule,
} from "./reference-modules";
import { ModuleRuntime } from "./runtime";
import { GameWorld } from "./world";

const addGuardian = (world: GameWorld) =>
  world.add({
    id: "guardian",
    name: "Guardian",
    tags: ["guardian", "damageable"],
    position: vec3(0, 1, 0),
    size: vec3(1, 2, 1),
    visual: { shape: "box", color: 0xff0000 },
    stats: { hp: 100, maxHp: 100 },
    protected: true,
  });

describe("reference MechanicModules", () => {
  it("builds an enclosure around a target through SDK primitives", () => {
    const world = new GameWorld();
    addGuardian(world);
    const runtime = new ModuleRuntime(world, new ManaPool(200), () => {});

    const artifact = runtime.load(createEnclosureModule("guardian"));
    const walls = artifact.entityIds
      .map((id) => world.get(id))
      .filter((entity) => entity?.tags.includes("wall"));

    expect(artifact.tags).toContain("enclosure");
    expect(walls).toHaveLength(4);
    expect(Math.min(...walls.map((wall) => wall?.position.x ?? 0))).toBeLessThan(0);
    expect(Math.max(...walls.map((wall) => wall?.position.x ?? 0))).toBeGreaterThan(0);
    expect(Math.min(...walls.map((wall) => wall?.position.z ?? 0))).toBeLessThan(0);
    expect(Math.max(...walls.map((wall) => wall?.position.z ?? 0))).toBeGreaterThan(0);
  });

  it("references the recent enclosure and damages entities inside it", () => {
    const world = new GameWorld();
    addGuardian(world);
    const runtime = new ModuleRuntime(world, new ManaPool(200), () => {});
    runtime.load(createEnclosureModule("guardian"));

    const fire = runtime.load(createFireInRecentEnclosureModule());
    for (let index = 0; index < 20; index += 1) runtime.update(0.1);

    expect(fire.tags).toContain("fire-zone");
    expect(world.get("guardian")?.stats?.hp).toBeLessThan(100);
  });

  it("moves the unique key to the lock and unlocks only at the door", () => {
    const world = new GameWorld();
    world.add({
      id: "key",
      name: "Unique key",
      tags: ["key", "unique"],
      position: vec3(-4, 0.3, 0),
      size: vec3(0.4, 0.15, 0.15),
      visual: { shape: "box", color: 0xffcc33 },
      affordances: ["unlocker", "movable"],
      protected: true,
    });
    world.add({
      id: "door",
      name: "Locked door",
      tags: ["door", "locked"],
      position: vec3(4, 1, 0),
      size: vec3(0.4, 2, 3),
      visual: { shape: "box", color: 0x444466 },
      affordances: ["lock"],
      protected: true,
    });
    const runtime = new ModuleRuntime(world, new ManaPool(200), () => {});

    runtime.load(createKeyToLockModule());
    expect(world.get("door")?.tags).toContain("locked");

    for (let index = 0; index < 50; index += 1) runtime.update(0.1);
    expect(world.get("door")?.tags).toContain("unlocked");
  });

  // Spec: Decision 0006 NAV-8; an unreachable interaction retries for a bounded time and explains failure.
  it("stops an enclosed key after bounded replanning and reports that no contact path exists", () => {
    const world = new GameWorld();
    world.add({
      id: "key",
      name: "Unique key",
      tags: ["key", "unique"],
      position: vec3(0, 0.3, 0),
      size: vec3(0.4, 0.15, 0.15),
      visual: { shape: "box", color: 0xffcc33 },
      affordances: ["unlocker", "movable"],
      protected: true,
    });
    world.add({
      id: "door",
      name: "Locked door",
      tags: ["door", "locked"],
      position: vec3(4, 0.3, 0),
      size: vec3(0.4, 2, 3),
      visual: { shape: "box", color: 0x444466 },
      affordances: ["lock"],
      protected: true,
    });
    for (const [index, wall] of [
      { position: vec3(-0.8, 0.3, 0), size: vec3(0.2, 2, 1.8) },
      { position: vec3(0.8, 0.3, 0), size: vec3(0.2, 2, 1.8) },
      { position: vec3(0, 0.3, -0.8), size: vec3(1.8, 2, 0.2) },
      { position: vec3(0, 0.3, 0.8), size: vec3(1.8, 2, 0.2) },
    ].entries()) {
      world.add({
        id: `cage-wall-${index}`,
        name: "Cage wall",
        tags: ["wall", "solid"],
        position: wall.position,
        size: wall.size,
        visual: { shape: "box", color: 0xffcc33 },
      });
    }
    const notes: string[] = [];
    const runtime = new ModuleRuntime(
      world,
      new ManaPool(200),
      (note) => notes.push(note.text),
    );

    runtime.load(createKeyToLockModule());
    for (let index = 0; index < 40; index += 1) runtime.update(0.1);

    expect(world.get("door")?.tags).toContain("locked");
    expect(notes).toEqual([expect.stringContaining("找不到能接觸到門的路")]);
  });
});

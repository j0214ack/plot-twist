import { describe, expect, it } from "vitest";
import { vec3 } from "./math";
import { GameWorld } from "./world";

const addGuard = (world: GameWorld) =>
  world.add({
    id: "guardian",
    name: "Guardian",
    tags: ["guardian", "damageable"],
    position: vec3(),
    size: vec3(1, 2, 1),
    visual: { shape: "box", color: 0xffffff },
    stats: { hp: 20, maxHp: 20 },
    protected: true,
  });

describe("GameWorld protected affordances", () => {
  it("rejects direct destruction but allows damage through a damage source", () => {
    const world = new GameWorld();
    addGuard(world);
    world.add({
      id: "fire",
      name: "Fire",
      tags: ["damage-source"],
      position: vec3(),
      size: vec3(1, 1, 1),
      visual: { shape: "cylinder", color: 0xff6600 },
      ownerId: "spell-fire",
    });

    expect(world.destroyOwned("guardian", "spell-fire")).toBe(false);
    expect(world.damage("fire", "guardian", 7)).toBe(7);
    expect(world.get("guardian")?.stats?.hp).toBe(13);
  });

  it("only unlocks a nearby lock with the real unlocker affordance", () => {
    const world = new GameWorld();
    world.add({
      id: "door",
      name: "Door",
      tags: ["door", "locked"],
      position: vec3(3, 0, 0),
      size: vec3(1, 2, 1),
      visual: { shape: "box", color: 0xffffff },
      affordances: ["lock"],
      protected: true,
    });
    world.add({
      id: "fake-key",
      name: "Fake key",
      tags: ["key"],
      position: vec3(3, 0, 0),
      size: vec3(0.2, 0.2, 0.2),
      visual: { shape: "box", color: 0xffffff },
    });
    world.add({
      id: "real-key",
      name: "Real key",
      tags: ["key", "unique"],
      position: vec3(0, 0, 0),
      size: vec3(0.2, 0.2, 0.2),
      visual: { shape: "box", color: 0xffffff },
      affordances: ["unlocker", "movable"],
      protected: true,
    });

    expect(world.invokeUnlock("fake-key", "door").status).toBe("incompatible");
    expect(world.invokeUnlock("real-key", "door").status).toBe("out-of-range");

    world.setPosition("real-key", vec3(3, 0, 0));
    expect(world.invokeUnlock("real-key", "door").status).toBe("applied");
    expect(world.get("door")?.tags).toContain("unlocked");
  });
});

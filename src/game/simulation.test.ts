import { describe, expect, it } from "vitest";
import { distanceXZ, vec3 } from "./math";
import { GameSimulation } from "./simulation";
import { GameWorld } from "./world";

describe("baked Game Host rules", () => {
  it("drops the unique key only after the guardian dies", () => {
    const world = new GameWorld();
    const simulation = new GameSimulation(world);
    simulation.setupLevel();

    expect(world.queryByTag("key")).toHaveLength(0);
    world.add({
      id: "test-fire",
      name: "Test damage source",
      tags: ["damage-source"],
      position: vec3(),
      size: vec3(1, 1, 1),
      visual: { shape: "sphere", color: 0xff0000 },
    });
    world.damage("test-fire", "guardian", 999);

    const keys = world.queryByTag("key");
    expect(keys).toHaveLength(1);
    expect(keys[0]?.affordances).toContain("unlocker");
    expect(keys[0]?.tags).toContain("unique");
  });

  it("keeps combat active by firing moving projectiles", () => {
    const world = new GameWorld();
    const simulation = new GameSimulation(world);
    simulation.setupLevel();

    simulation.update(1.6, { moveX: 0, moveZ: 0, dash: false });
    const projectile = world.queryByTag("projectile")[0];
    expect(projectile).toBeDefined();
    const start = projectile?.position ?? vec3();

    simulation.update(0.2, { moveX: 0, moveZ: 0, dash: false });
    const moved = world.get(projectile?.id ?? "");
    expect(distanceXZ(start, moved?.position ?? start)).toBeGreaterThan(0);
  });

  it("lets generated solid geometry intercept hostile projectiles", () => {
    const world = new GameWorld();
    const simulation = new GameSimulation(world);
    simulation.setupLevel();
    world.add({
      id: "generated-wall",
      name: "Generated wall",
      tags: ["wall", "solid"],
      position: vec3(0, 1, 0),
      size: vec3(0.6, 2, 3),
      visual: { shape: "box", color: 0xffffff },
      ownerId: "spell-test",
    });

    simulation.update(1.6, { moveX: 0, moveZ: 0, dash: false });
    expect(world.queryByTag("projectile")).toHaveLength(1);

    simulation.update(0.3, { moveX: 0, moveZ: 0, dash: false });
    expect(world.queryByTag("projectile")).toHaveLength(0);
  });

  it("slows movement while a spell is being written", () => {
    const normalWorld = new GameWorld();
    const normal = new GameSimulation(normalWorld);
    normal.setupLevel();
    normal.update(0.5, { moveX: 1, moveZ: 0, dash: false });
    const normalDistance = distanceXZ(vec3(-6, 0, 0), normalWorld.get("player")?.position ?? vec3());

    const castingWorld = new GameWorld();
    const casting = new GameSimulation(castingWorld);
    casting.setupLevel();
    casting.setCasting(true);
    casting.update(0.5, { moveX: 1, moveZ: 0, dash: false });
    const castingDistance = distanceXZ(
      vec3(-6, 0, 0),
      castingWorld.get("player")?.position ?? vec3(),
    );

    expect(castingDistance).toBeLessThan(normalDistance);
    expect(castingDistance).toBeGreaterThan(0);
  });

  it("completes the objective only after unlocking and entering the portal", () => {
    const lockedWorld = new GameWorld();
    const locked = new GameSimulation(lockedWorld);
    locked.setupLevel();
    locked.update(5, { moveX: 1, moveZ: 0, dash: false });
    expect(locked.completed).toBe(false);

    const openWorld = new GameWorld();
    const open = new GameSimulation(openWorld);
    open.setupLevel();
    openWorld.add({
      id: "test-key",
      name: "Test key",
      tags: ["key", "unique"],
      position: vec3(7, 0.3, 0),
      size: vec3(0.4, 0.2, 0.2),
      visual: { shape: "box", color: 0xffffff },
      affordances: ["unlocker", "movable"],
      protected: true,
    });
    openWorld.invokeUnlock("test-key", "door");
    open.update(5, { moveX: 1, moveZ: 0, dash: false });

    expect(open.completed).toBe(true);
  });
});

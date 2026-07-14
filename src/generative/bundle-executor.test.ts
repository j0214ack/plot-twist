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

  // Spec: Decision 0007 LOC-1, LOC-3 and LOC-6; dependency means availability, not completion.
  it("composes a generated FlightModule with an unlock-on-contact observer", () => {
    const world = new GameWorld();
    world.add({
      id: "key",
      name: "Unique key",
      tags: ["key", "unique"],
      position: { x: 0, y: 0.3, z: 0 },
      size: { x: 0.4, y: 0.15, z: 0.15 },
      visual: { shape: "box", color: 0xffcc33 },
      affordances: ["movable", "unlocker"],
      protected: true,
    });
    world.add({
      id: "door",
      name: "Locked door",
      tags: ["door", "locked"],
      position: { x: 4, y: 0.3, z: 0 },
      size: { x: 0.4, y: 2, z: 3 },
      visual: { shape: "box", color: 0x444466 },
      affordances: ["lock"],
      protected: true,
    });
    const runtime = new ModuleRuntime(world, new ManaPool(100, 0), () => {});
    const executor = new BundleExecutor(runtime, new GeneratedModuleLoader());
    const bundle: SpellBundle = {
      summary: "Make the key fly, then unlock only after contact",
      modules: [
        {
          id: "flight",
          label: "Give the key flight",
          tags: ["flight", "locomotion"],
          dependsOn: [],
          source: `(dependencies) => {
            let game;
            let actorId;
            let targetId;
            let arrived = false;
            return {
              label: "Give the key flight",
              tags: ["flight", "locomotion"],
              setup(context) {
                game = context;
                actorId = context.world.queryByTag("key")[0].id;
                targetId = context.world.queryByTag("door")[0].id;
                const attached = context.locomotion.attach(actorId, {
                  mode: "flight",
                  tags: ["airborne"]
                });
                if (!attached.actual) throw new Error("flight rejected");
              },
              update(deltaSeconds) {
                if (!game || arrived) return;
                const result = game.navigation.stepDirectlyToContact(
                  actorId,
                  targetId,
                  { contactDistance: 1.2, speed: 4 },
                  deltaSeconds
                );
                arrived = result.status === "arrived";
              },
              dispose() { game = undefined; }
            };
          }`,
        },
        {
          id: "unlock",
          label: "Unlock when the flying key arrives",
          tags: ["unlock", "contact-observer"],
          dependsOn: ["flight"],
          source: `(dependencies) => {
            let game;
            let actorId;
            let targetId;
            let finished = false;
            return {
              label: "Unlock when the flying key arrives",
              tags: ["unlock", "contact-observer"],
              setup(context) {
                game = context;
                const effect = context.locomotion.get(dependencies.flight.effectIds[0]);
                if (!effect) throw new Error("flight effect unavailable");
                actorId = effect.actorId;
                targetId = context.world.queryByTag("door")[0].id;
              },
              update() {
                if (!game || finished) return;
                const result = game.interaction.invoke(actorId, targetId, "unlock");
                finished = result.status === "applied" || result.status === "already-complete";
              },
              dispose() { game = undefined; }
            };
          }`,
        },
      ],
    };

    const result = executor.execute(bundle);

    expect(result.artifactsByModuleId.flight.effectIds).toHaveLength(1);
    expect(world.get("door")?.tags).toContain("locked");
    for (let frame = 0; frame < 120; frame += 1) runtime.update(1 / 60);
    expect(world.get("door")?.tags).toContain("unlocked");
  });

  // Spec: Decision 0002 GEN-5 and Decision 0007 LOC-3; rollback cleans effect ownership.
  it("removes a locomotion effect when a later dependent module fails setup", () => {
    const world = new GameWorld();
    world.add({
      id: "key",
      name: "Unique key",
      tags: ["key", "unique"],
      position: { x: 0, y: 0.3, z: 0 },
      size: { x: 0.4, y: 0.15, z: 0.15 },
      visual: { shape: "box", color: 0xffcc33 },
      affordances: ["movable"],
    });
    const runtime = new ModuleRuntime(world, new ManaPool(100, 0), () => {});
    const executor = new BundleExecutor(runtime, new GeneratedModuleLoader());
    const bundle: SpellBundle = {
      summary: "A flight dependency followed by a broken observer",
      modules: [
        {
          id: "flight",
          label: "Temporary flight",
          tags: ["flight"],
          dependsOn: [],
          source: `() => ({
            label: "Temporary flight",
            tags: ["flight"],
            setup(context) {
              const result = context.locomotion.attach("key", { mode: "flight" });
              if (!result.actual) throw new Error("flight rejected");
            },
            dispose() {}
          })`,
        },
        {
          id: "broken-observer",
          label: "Broken observer",
          tags: ["observer"],
          dependsOn: ["flight"],
          source: `() => ({
            label: "Broken observer",
            tags: ["observer"],
            setup() { throw new Error("observer failed"); },
            dispose() {}
          })`,
        },
      ],
    };

    expect(() => executor.execute(bundle)).toThrow("observer failed");
    let remainingModes = ["unexpected"];
    runtime.load({
      label: "Inspect remaining locomotion",
      tags: [],
      setup(context) {
        remainingModes = context.locomotion.forActor("key").map(({ mode }) => mode);
      },
      dispose() {},
    });

    expect(remainingModes).toEqual([]);
  });
});

import { vec3 } from "../src/game/math";
import type { GameWorld } from "../src/game/world";
import type { SpellSceneEntity } from "../src/generative/types";

export type EvalScenarioId = "guardian" | "key-door-open" | "key-door-sealed";

export interface EvalScenarioSetup {
  scene: SpellSceneEntity[];
  focusedEntityId: string;
  targetHpEntityId?: string;
  observedActorId?: string;
  doorId?: string;
}

const sceneSnapshot = (world: GameWorld): SpellSceneEntity[] =>
  world.list().map(({ id, name, tags, affordances, position }) => ({
    id,
    name,
    tags,
    affordances,
    position,
  }));

const addKeyAndDoor = (world: GameWorld): void => {
  world.add({
    id: "key",
    name: "The only valid key",
    tags: ["key", "unique"],
    position: vec3(0, 0.3, 0),
    size: vec3(0.4, 0.15, 0.15),
    visual: { shape: "box", color: 0xffcc33 },
    affordances: ["unlocker", "movable"],
    protected: true,
  });
  world.add({
    id: "door",
    name: "The sealed sentence",
    tags: ["door", "locked"],
    position: vec3(4, 0.3, 0),
    size: vec3(0.4, 2, 3),
    visual: { shape: "box", color: 0x444466 },
    affordances: ["lock"],
    protected: true,
  });
};

export const setupEvalScenario = (
  world: GameWorld,
  scenario: EvalScenarioId,
): EvalScenarioSetup => {
  if (scenario === "guardian") {
    world.add({
      id: "player",
      name: "Handless caster",
      tags: ["player", "caster"],
      position: vec3(-3, 0.5, 0),
      size: vec3(0.8, 1, 0.8),
      visual: { shape: "sphere", color: 0x8de8ff },
      protected: true,
    });
    world.add({
      id: "guardian",
      name: "Gate guardian",
      tags: ["enemy", "guardian", "damageable"],
      position: vec3(3, 0.8, 0),
      size: vec3(1, 1.6, 1),
      visual: { shape: "box", color: 0xff5c72 },
      stats: { hp: 100, maxHp: 100 },
      protected: true,
    });
    return {
      scene: sceneSnapshot(world),
      focusedEntityId: "guardian",
      targetHpEntityId: "guardian",
    };
  }

  addKeyAndDoor(world);
  if (scenario === "key-door-sealed") {
    for (const [index, wall] of [
      { position: vec3(-0.8, 0.3, 0), size: vec3(0.2, 2, 1.8) },
      { position: vec3(0.8, 0.3, 0), size: vec3(0.2, 2, 1.8) },
      { position: vec3(0, 0.3, -0.8), size: vec3(1.8, 2, 0.2) },
      { position: vec3(0, 0.3, 0.8), size: vec3(1.8, 2, 0.2) },
    ].entries()) {
      world.add({
        id: `cage-wall-${index + 1}`,
        name: "Generated golden cage wall",
        tags: ["wall", "solid", "generated", "enclosure-part"],
        position: wall.position,
        size: wall.size,
        visual: { shape: "box", color: 0xffcc33 },
      });
    }
  }

  return {
    scene: sceneSnapshot(world),
    focusedEntityId: "door",
    observedActorId: "key",
    doorId: "door",
  };
};

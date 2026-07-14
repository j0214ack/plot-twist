import { pointInsideEntityXZ, vec3 } from "./math";
import type { GameContext, MechanicModule, NavigationPath } from "./types";

export const createEnclosureModule = (targetId: string): MechanicModule => {
  return {
    label: "Enclose the focused target",
    tags: ["enclosure", "wall-spell"],
    setup(game) {
      const target = game.world.get(targetId);
      if (!target) throw new Error(`Cannot enclose missing target: ${targetId}`);

      const halfExtent = 2.35;
      const wallLength = halfExtent * 2;
      const thickness = 0.36;
      const wallHeight = 2.3;
      const walls = [
        {
          position: vec3(target.position.x, wallHeight / 2, target.position.z - halfExtent),
          size: vec3(wallLength, wallHeight, thickness),
        },
        {
          position: vec3(target.position.x, wallHeight / 2, target.position.z + halfExtent),
          size: vec3(wallLength, wallHeight, thickness),
        },
        {
          position: vec3(target.position.x - halfExtent, wallHeight / 2, target.position.z),
          size: vec3(thickness, wallHeight, wallLength),
        },
        {
          position: vec3(target.position.x + halfExtent, wallHeight / 2, target.position.z),
          size: vec3(thickness, wallHeight, wallLength),
        },
      ];

      let partialWalls = 0;
      for (const [index, wall] of walls.entries()) {
        const result = game.world.spawnPrimitive({
          name: `Ink wall ${index + 1}`,
          tags: ["wall", "enclosure-part"],
          position: wall.position,
          size: wall.size,
          visual: {
            shape: "box",
            color: 0x153b4a,
            emissive: 0x36e1ff,
            opacity: 0.88,
          },
          solid: true,
        });
        if (result.status !== "complete") partialWalls += 1;
      }

      if (partialWalls > 0) {
        game.note({
          tone: "warning",
          text: `你要的是牢房。剩下的墨讓 ${partialWalls} 面牆變薄了。`,
        });
      }
    },
    dispose() {},
  };
};

export const createFireInRecentEnclosureModule = (): MechanicModule => {
  let context: GameContext | undefined;
  let fireEntityId: string | undefined;
  let elapsed = 0;
  const durationSeconds = 6;
  const damagePerSecond = 24;

  return {
    label: "Fire inside the recent enclosure",
    tags: ["fire-zone", "damage-over-time"],
    setup(game) {
      context = game;
      const enclosure = game.artifacts.recent("enclosure");
      if (!enclosure) throw new Error("No recent enclosure exists");

      const walls = enclosure.entityIds
        .map((id) => game.world.get(id))
        .filter((entity) => entity?.tags.includes("wall"));
      if (walls.length < 2) throw new Error("The recent enclosure has no usable geometry");

      const minX = Math.min(...walls.map((wall) => wall?.position.x ?? 0));
      const maxX = Math.max(...walls.map((wall) => wall?.position.x ?? 0));
      const minZ = Math.min(...walls.map((wall) => wall?.position.z ?? 0));
      const maxZ = Math.max(...walls.map((wall) => wall?.position.z ?? 0));
      const result = game.world.spawnPrimitive({
        name: "Fire written inside the enclosure",
        tags: ["fire", "damage-source", "area-effect"],
        position: vec3((minX + maxX) / 2, 0.12, (minZ + maxZ) / 2),
        size: vec3(Math.max(1.2, maxX - minX - 0.3), 0.24, Math.max(1.2, maxZ - minZ - 0.3)),
        visual: {
          shape: "cylinder",
          color: 0xff6a1a,
          emissive: 0xff2a00,
          opacity: 0.68,
        },
      });
      fireEntityId = result.actual?.id;
      if (!fireEntityId) throw new Error("The fire could not be manifested");
    },
    update(deltaSeconds) {
      if (!context || !fireEntityId || elapsed >= durationSeconds) return;
      elapsed += deltaSeconds;
      const fire = context.world.get(fireEntityId);
      if (!fire) return;

      for (const target of context.world.queryByTag("damageable")) {
        if (pointInsideEntityXZ(target.position, fire)) {
          context.combat.damage(fireEntityId, target.id, damagePerSecond * deltaSeconds);
        }
      }
    },
    dispose() {
      context = undefined;
      fireEntityId = undefined;
    },
  };
};

export const createKeyToLockModule = (): MechanicModule => {
  let context: GameContext | undefined;
  let keyId: string | undefined;
  let lockId: string | undefined;
  let path: NavigationPath | undefined;
  let elapsedSeconds = 0;
  let nextPlanAt = 0;
  let tryingDirectContact = true;
  let finished = false;

  const tryUnlock = (): boolean => {
    if (!context || !keyId || !lockId) return false;
    const result = context.interaction.invoke(keyId, lockId, "unlock");
    if (result.status !== "applied" && result.status !== "already-complete") return false;
    finished = true;
    if (result.status === "applied") {
      context.note({ tone: "success", text: "鑰匙找到了它唯一能改寫的句子。" });
    }
    return true;
  };

  return {
    label: "Send the key where it belongs",
    tags: ["key-motion", "unlock-attempt"],
    setup(game) {
      context = game;
      keyId = game.world.queryByTag("unique").find((entity) => entity.tags.includes("key"))?.id;
      lockId = game.world.queryByTag("locked").find((entity) => entity.tags.includes("door"))?.id;
      if (!keyId || !lockId) throw new Error("Both a unique key and a locked door are required");
    },
    update(deltaSeconds) {
      if (!context || !keyId || !lockId || finished) return;
      const key = context.world.get(keyId);
      const lock = context.world.get(lockId);
      if (!key || !lock) return;
      if (lock.tags.includes("unlocked")) {
        finished = true;
        return;
      }

      elapsedSeconds += deltaSeconds;

      if (tryingDirectContact) {
        const direct = context.navigation.stepDirectlyToContact(
          keyId,
          lockId,
          { contactDistance: 1.2, speed: 4.8 },
          deltaSeconds,
        );
        if (direct.status === "arrived") {
          tryUnlock();
          return;
        }
        if (direct.status === "blocked" || direct.status === "invalid") {
          tryingDirectContact = false;
          nextPlanAt = elapsedSeconds;
        } else {
          return;
        }
      }

      if (!path && elapsedSeconds >= nextPlanAt) {
        const plan = context.navigation.planToContact(keyId, lockId, {
          contactDistance: 1.2,
        });
        if (plan.status === "arrived") {
          tryUnlock();
          return;
        }
        path = plan.status === "path-found" ? plan.path : undefined;
        nextPlanAt = elapsedSeconds + 0.4;
      }

      if (path) {
        const movement = context.navigation.follow(path, 4.8, deltaSeconds);
        if (movement.status === "arrived") {
          tryUnlock();
          return;
        }
        if (movement.status === "blocked" || movement.status === "invalid") {
          path = undefined;
        }
      }

      if (!path && elapsedSeconds >= 2.4) {
        finished = true;
        context.note({ tone: "warning", text: "鑰匙找不到能接觸到門的路。" });
      }
    },
    dispose() {
      context = undefined;
      keyId = undefined;
      lockId = undefined;
      path = undefined;
      finished = true;
    },
  };
};

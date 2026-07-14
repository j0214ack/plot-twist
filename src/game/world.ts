import { distanceXZ, vec3 } from "./math";
import type {
  EntityRecord,
  EntitySnapshot,
  EntitySpec,
  InteractionResult,
  SolidMovementResult,
  Vec3,
  WorldEvent,
} from "./types";

type WorldListener = (event: WorldEvent) => void;

const sweptEntryTime = (
  from: Vec3,
  to: Vec3,
  moving: EntityRecord,
  solid: EntityRecord,
): number | undefined => {
  let entry = 0;
  let exit = 1;

  for (const axis of ["x", "y", "z"] as const) {
    const halfExtent = (moving.size[axis] + solid.size[axis]) / 2;
    const min = solid.position[axis] - halfExtent;
    const max = solid.position[axis] + halfExtent;
    const delta = to[axis] - from[axis];

    if (Math.abs(delta) < 1e-9) {
      if (from[axis] < min || from[axis] > max) return undefined;
      continue;
    }

    const first = (min - from[axis]) / delta;
    const second = (max - from[axis]) / delta;
    entry = Math.max(entry, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (entry > exit) return undefined;
  }

  return entry >= 0 && entry <= 1 ? entry : undefined;
};

const cloneSnapshot = (entity: EntityRecord): EntitySnapshot => ({
  id: entity.id,
  name: entity.name,
  tags: [...entity.tags],
  position: { ...entity.position },
  size: { ...entity.size },
  visual: { ...entity.visual },
  velocity: { ...entity.velocity },
  stats: entity.stats ? { ...entity.stats } : undefined,
  affordances: [...entity.affordances],
  protected: entity.protected,
  ownerId: entity.ownerId,
  active: entity.active,
});

export class GameWorld {
  private readonly entities = new Map<string, EntityRecord>();
  private readonly listeners = new Set<WorldListener>();
  private nextId = 1;

  add(spec: EntitySpec): EntitySnapshot {
    const id = spec.id ?? `entity-${this.nextId++}`;
    if (this.entities.has(id)) throw new Error(`Entity already exists: ${id}`);

    const entity: EntityRecord = {
      ...spec,
      id,
      tags: new Set(spec.tags),
      affordances: new Set(spec.affordances ?? []),
      position: { ...spec.position },
      size: { ...spec.size },
      visual: { ...spec.visual },
      velocity: spec.velocity ? { ...spec.velocity } : vec3(),
      stats: spec.stats ? { ...spec.stats } : undefined,
      protected: spec.protected ?? false,
      active: spec.active ?? true,
    };
    this.entities.set(id, entity);
    const snapshot = cloneSnapshot(entity);
    this.emit({ type: "spawned", entity: snapshot });
    return snapshot;
  }

  get(id: string): EntitySnapshot | undefined {
    const entity = this.entities.get(id);
    return entity ? cloneSnapshot(entity) : undefined;
  }

  list(): EntitySnapshot[] {
    return [...this.entities.values()].map(cloneSnapshot);
  }

  queryByTag(tag: string): EntitySnapshot[] {
    return [...this.entities.values()]
      .filter((entity) => entity.active && entity.tags.has(tag))
      .map(cloneSnapshot);
  }

  setPosition(id: string, position: Vec3): boolean {
    const entity = this.entities.get(id);
    if (!entity?.active) return false;
    entity.position = { ...position };
    return true;
  }

  moveWithSolidCollision(id: string, position: Vec3): SolidMovementResult {
    const entity = this.entities.get(id);
    if (!entity?.active) return { status: "invalid", blockerIds: [] };

    const collisions = [...this.entities.values()]
      .filter(
        (candidate) =>
          candidate.id !== id && candidate.active && candidate.tags.has("solid"),
      )
      .flatMap((solid) => {
        const entryTime = sweptEntryTime(entity.position, position, entity, solid);
        return entryTime === undefined ? [] : [{ solid, entryTime }];
      })
      .sort((left, right) => left.entryTime - right.entryTime);

    const first = collisions[0];
    if (!first) {
      entity.position = { ...position };
      return { status: "moved", position: { ...entity.position }, blockerIds: [] };
    }

    const stopAt = Math.max(0, first.entryTime - 1e-4);
    const from = entity.position;
    entity.position = {
      x: from.x + (position.x - from.x) * stopAt,
      y: from.y + (position.y - from.y) * stopAt,
      z: from.z + (position.z - from.z) * stopAt,
    };
    const blockerIds = collisions
      .filter(({ entryTime }) => Math.abs(entryTime - first.entryTime) < 1e-6)
      .map(({ solid }) => solid.id);
    return {
      status: "blocked",
      position: { ...entity.position },
      blockerIds,
    };
  }

  setVelocity(id: string, velocity: Vec3): boolean {
    const entity = this.entities.get(id);
    if (!entity?.active) return false;
    entity.velocity = { ...velocity };
    return true;
  }

  setActive(id: string, active: boolean): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;
    entity.active = active;
    return true;
  }

  setVisual(id: string, changes: Partial<EntitySnapshot["visual"]>): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;
    entity.visual = { ...entity.visual, ...changes };
    return true;
  }

  hostDestroy(id: string): boolean {
    return this.remove(id);
  }

  destroyOwned(id: string, ownerId: string): boolean {
    const entity = this.entities.get(id);
    if (!entity || entity.protected || entity.ownerId !== ownerId) return false;
    return this.remove(id);
  }

  damage(sourceId: string, targetId: string, amount: number): number {
    const source = this.entities.get(sourceId);
    const target = this.entities.get(targetId);
    if (
      !source?.active ||
      !source.tags.has("damage-source") ||
      !target?.active ||
      !target.tags.has("damageable") ||
      !target.stats
    ) {
      return 0;
    }

    const actual = Math.max(0, Math.min(amount, target.stats.hp));
    target.stats.hp -= actual;
    this.emit({ type: "damaged", entityId: targetId, amount: actual, hp: target.stats.hp });

    if (target.stats.hp <= 0) {
      target.active = false;
      this.emit({ type: "died", entityId: targetId });
    }
    return actual;
  }

  invokeUnlock(unlockerId: string, lockId: string): InteractionResult {
    const unlocker = this.entities.get(unlockerId);
    const lock = this.entities.get(lockId);
    const result = (status: InteractionResult["status"]): InteractionResult => ({
      status,
      actorId: unlockerId,
      targetId: lockId,
    });

    if (!unlocker?.active || !lock?.active) return result("invalid");
    if (!lock.affordances.has("lock") && lock.tags.has("unlocked")) {
      return result("already-complete");
    }
    if (!unlocker.affordances.has("unlocker") || !lock.affordances.has("lock")) {
      return result("incompatible");
    }
    if (distanceXZ(unlocker.position, lock.position) > 1.25) {
      return result("out-of-range");
    }

    lock.affordances.delete("lock");
    lock.tags.delete("locked");
    lock.tags.add("unlocked");
    this.emit({ type: "unlocked", lockId, unlockerId });
    return result("applied");
  }

  on(listener: WorldListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reject(reason: string): void {
    this.emit({ type: "rejected", reason });
  }

  private remove(id: string): boolean {
    const removed = this.entities.delete(id);
    if (removed) this.emit({ type: "destroyed", entityId: id });
    return removed;
  }

  private emit(event: WorldEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}

import { distanceXZ, vec3 } from "./math";
import type {
  EntityRecord,
  EntitySnapshot,
  EntitySpec,
  Vec3,
  WorldEvent,
} from "./types";

type WorldListener = (event: WorldEvent) => void;

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

  invokeUnlock(unlockerId: string, lockId: string): boolean {
    const unlocker = this.entities.get(unlockerId);
    const lock = this.entities.get(lockId);
    if (
      !unlocker?.active ||
      !unlocker.affordances.has("unlocker") ||
      !lock?.active ||
      !lock.affordances.has("lock") ||
      distanceXZ(unlocker.position, lock.position) > 1.25
    ) {
      return false;
    }

    lock.affordances.delete("lock");
    lock.tags.delete("locked");
    lock.tags.add("unlocked");
    this.emit({ type: "unlocked", lockId, unlockerId });
    return true;
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

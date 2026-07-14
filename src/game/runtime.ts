import { distanceXZ } from "./math";
import { ManaPool } from "./mana";
import type {
  EntitySnapshot,
  GameContext,
  MechanicModule,
  QuillNote,
  SpawnPrimitiveRequest,
  SpellArtifact,
  WorldMutationResult,
} from "./types";
import { GameWorld } from "./world";

interface LoadedModule {
  artifact: SpellArtifact;
  module: MechanicModule;
  ownedEntities: Set<string>;
}

const primitiveManaCost = (request: SpawnPrimitiveRequest): number => {
  const volume = request.size.x * request.size.y * request.size.z;
  return 2 + volume * (request.solid ? 1.2 : 0.7);
};

export class ModuleRuntime {
  private readonly loaded = new Map<string, LoadedModule>();
  private nextModuleId = 1;
  private elapsedSeconds = 0;

  constructor(
    private readonly world: GameWorld,
    readonly mana: ManaPool,
    private readonly onNote: (note: QuillNote) => void,
  ) {}

  load(module: MechanicModule): SpellArtifact {
    const id = `spell-${this.nextModuleId++}`;
    const ownedEntities = new Set<string>();
    const artifact: SpellArtifact = {
      id,
      label: module.label,
      tags: [...module.tags],
      entityIds: [],
      createdAt: this.elapsedSeconds,
    };
    const loaded: LoadedModule = { artifact, module, ownedEntities };

    try {
      module.setup(this.createContext(loaded));
      artifact.entityIds = [...ownedEntities];
      this.loaded.set(id, loaded);
      return { ...artifact, entityIds: [...artifact.entityIds], tags: [...artifact.tags] };
    } catch (error) {
      for (const entityId of ownedEntities) this.world.destroyOwned(entityId, id);
      module.dispose();
      throw error;
    }
  }

  update(deltaSeconds: number): void {
    this.elapsedSeconds += deltaSeconds;
    this.mana.update(deltaSeconds);
    for (const loaded of this.loaded.values()) loaded.module.update?.(deltaSeconds);
  }

  dispose(moduleId: string): boolean {
    const loaded = this.loaded.get(moduleId);
    if (!loaded) return false;

    loaded.module.dispose();
    for (const entityId of loaded.ownedEntities) {
      this.world.destroyOwned(entityId, moduleId);
    }
    this.loaded.delete(moduleId);
    return true;
  }

  listArtifacts(): SpellArtifact[] {
    return [...this.loaded.values()].map(({ artifact }) => ({
      ...artifact,
      tags: [...artifact.tags],
      entityIds: [...artifact.entityIds],
    }));
  }

  note(note: QuillNote): void {
    this.onNote(note);
  }

  private createContext(loaded: LoadedModule): GameContext {
    const { artifact, ownedEntities } = loaded;

    return {
      moduleId: artifact.id,
      world: {
        queryByTag: (tag) => this.world.queryByTag(tag),
        get: (entityId) => this.world.get(entityId),
        spawnPrimitive: (request) => this.spawnPrimitive(artifact.id, ownedEntities, request),
      },
      physics: {
        moveToward: (entityId, target, speed, deltaSeconds) => {
          const entity = this.world.get(entityId);
          if (!entity?.active) return false;
          const canMove = entity.ownerId === artifact.id || entity.affordances.includes("movable");
          if (!canMove) return false;

          const distance = distanceXZ(entity.position, target);
          if (distance === 0) return true;
          const step = Math.min(distance, Math.max(0, speed) * deltaSeconds);
          return this.world.setPosition(entityId, {
            x: entity.position.x + ((target.x - entity.position.x) / distance) * step,
            y: entity.position.y + ((target.y - entity.position.y) / distance) * step,
            z: entity.position.z + ((target.z - entity.position.z) / distance) * step,
          });
        },
      },
      combat: {
        damage: (sourceId, targetId, requestedDamage) => {
          const source = this.world.get(sourceId);
          if (source?.ownerId !== artifact.id || !source.tags.includes("damage-source")) {
            return {
              requested: requestedDamage,
              manaSpent: 0,
              adjustments: ["invalid-damage-source"],
              status: "rejected",
            };
          }

          const requestedMana = Math.max(0, requestedDamage) * 0.12;
          const { spent, ratio } = this.mana.spend(requestedMana, 0.05);
          if (ratio === 0) {
            return {
              requested: requestedDamage,
              manaSpent: 0,
              adjustments: ["insufficient-mana"],
              status: "rejected",
            };
          }
          const actual = this.world.damage(sourceId, targetId, requestedDamage * ratio);
          return {
            requested: requestedDamage,
            actual,
            manaSpent: spent,
            adjustments: ratio < 1 ? ["damage-scaled-to-mana"] : [],
            status: ratio < 1 ? "partial" : "complete",
          };
        },
      },
      interaction: {
        invoke: (actorId, targetId, affordance) =>
          affordance === "unlock" && this.world.invokeUnlock(actorId, targetId),
      },
      artifacts: {
        recent: (tag) =>
          [...this.loaded.values()]
            .map(({ artifact: value }) => value)
            .filter((value) => !tag || value.tags.includes(tag))
            .sort((a, b) => b.createdAt - a.createdAt)[0],
      },
      mana: {
        current: () => this.mana.current,
      },
      note: this.onNote,
    };
  }

  private spawnPrimitive(
    moduleId: string,
    ownedEntities: Set<string>,
    request: SpawnPrimitiveRequest,
  ): WorldMutationResult<SpawnPrimitiveRequest, EntitySnapshot> {
    const requestedCost = primitiveManaCost(request);
    const { spent, ratio } = this.mana.spend(requestedCost, 0.1);
    if (ratio === 0) {
      return {
        requested: request,
        manaSpent: 0,
        adjustments: ["insufficient-mana"],
        status: "rejected",
      };
    }

    const linearScale = Math.sqrt(ratio);
    const actualRequest: SpawnPrimitiveRequest = {
      ...request,
      size:
        ratio < 1
          ? {
              x: request.size.x * linearScale,
              y: request.size.y,
              z: request.size.z * linearScale,
            }
          : { ...request.size },
      position: { ...request.position },
      visual: { ...request.visual },
      tags: [...request.tags],
    };

    const actual = this.world.add({
      ...actualRequest,
      ownerId: moduleId,
      tags: [
        ...actualRequest.tags.filter((tag) => !["unique", "unlocker", "story-goal"].includes(tag)),
        ...(actualRequest.solid ? ["solid"] : []),
      ],
      affordances: [],
    });
    ownedEntities.add(actual.id);

    return {
      requested: request,
      actual,
      manaSpent: spent,
      adjustments: ratio < 1 ? ["geometry-scaled-to-mana"] : [],
      status: ratio < 1 ? "partial" : "complete",
    };
  }
}

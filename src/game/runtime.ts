import { distance3D } from "./math";
import {
  followNavigationPath,
  planToContact,
  stepDirectlyToContact,
} from "./navigation";
import { ManaPool } from "./mana";
import type {
  EntitySnapshot,
  GameContext,
  LocomotionEffectRequest,
  LocomotionEffectSnapshot,
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
  ownedEffectIds: Set<string>;
}

const LOCOMOTION_EFFECT_MANA_COST = 4;

const primitiveManaCost = (request: SpawnPrimitiveRequest): number => {
  const volume = request.size.x * request.size.y * request.size.z;
  return 2 + volume * (request.solid ? 1.2 : 0.7);
};

export class ModuleRuntime {
  private readonly loaded = new Map<string, LoadedModule>();
  private readonly locomotionEffects = new Map<string, LocomotionEffectSnapshot>();
  private nextModuleId = 1;
  private nextEffectId = 1;
  private elapsedSeconds = 0;

  constructor(
    private readonly world: GameWorld,
    readonly mana: ManaPool,
    private readonly onNote: (note: QuillNote) => void,
  ) {}

  load(module: MechanicModule): SpellArtifact {
    const id = `spell-${this.nextModuleId++}`;
    const ownedEntities = new Set<string>();
    const ownedEffectIds = new Set<string>();
    const artifact: SpellArtifact = {
      id,
      label: module.label,
      tags: [...module.tags],
      entityIds: [],
      effectIds: [],
      createdAt: this.elapsedSeconds,
    };
    const loaded: LoadedModule = { artifact, module, ownedEntities, ownedEffectIds };

    try {
      module.setup(this.createContext(loaded));
      artifact.entityIds = [...ownedEntities];
      artifact.effectIds = [...ownedEffectIds];
      this.loaded.set(id, loaded);
      return {
        ...artifact,
        entityIds: [...artifact.entityIds],
        effectIds: [...artifact.effectIds],
        tags: [...artifact.tags],
      };
    } catch (error) {
      for (const entityId of ownedEntities) this.world.destroyOwned(entityId, id);
      for (const effectId of ownedEffectIds) this.locomotionEffects.delete(effectId);
      module.dispose();
      throw error;
    }
  }

  update(deltaSeconds: number): void {
    this.elapsedSeconds += deltaSeconds;
    this.mana.update(deltaSeconds);
    for (const loaded of this.loaded.values()) {
      try {
        loaded.module.update?.(deltaSeconds);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        this.onNote({
          tone: "warning",
          text: `「${loaded.artifact.label}」的法則崩解了：${detail}`,
        });
        this.unload(loaded);
      }
    }
  }

  dispose(moduleId: string): boolean {
    const loaded = this.loaded.get(moduleId);
    if (!loaded) return false;

    this.unload(loaded);
    return true;
  }

  listArtifacts(): SpellArtifact[] {
    return [...this.loaded.values()].map(({ artifact }) => ({
      ...artifact,
      tags: [...artifact.tags],
      entityIds: [...artifact.entityIds],
      effectIds: [...artifact.effectIds],
    }));
  }

  listLocomotionEffects(): LocomotionEffectSnapshot[] {
    return [...this.locomotionEffects.values()].map(
      (effect) => this.cloneLocomotionEffect(effect)!,
    );
  }

  note(note: QuillNote): void {
    this.onNote(note);
  }

  private unload(loaded: LoadedModule): void {
    try {
      loaded.module.dispose();
    } catch {
      // Generated cleanup cannot prevent Host-owned cleanup from completing.
    } finally {
      for (const entityId of loaded.ownedEntities) {
        this.world.destroyOwned(entityId, loaded.artifact.id);
      }
      for (const effectId of loaded.ownedEffectIds) {
        this.locomotionEffects.delete(effectId);
      }
      this.loaded.delete(loaded.artifact.id);
    }
  }

  private createContext(loaded: LoadedModule): GameContext {
    const { artifact, ownedEntities, ownedEffectIds } = loaded;

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

          const distance = distance3D(entity.position, target);
          if (distance === 0) return true;
          const step = Math.min(distance, Math.max(0, speed) * deltaSeconds);
          const moved = this.world.moveWithSolidCollision(entityId, {
            x: entity.position.x + ((target.x - entity.position.x) / distance) * step,
            y: entity.position.y + ((target.y - entity.position.y) / distance) * step,
            z: entity.position.z + ((target.z - entity.position.z) / distance) * step,
          });
          return moved.status === "moved" && step >= distance;
        },
      },
      navigation: {
        stepDirectlyToContact: (actorId, targetId, options, deltaSeconds) =>
          stepDirectlyToContact(this.world, actorId, targetId, options, deltaSeconds),
        planToContact: (actorId, targetId, options) =>
          planToContact(this.world, actorId, targetId, options.contactDistance),
        follow: (path, speed, deltaSeconds) =>
          followNavigationPath(this.world, path, speed, deltaSeconds),
      },
      locomotion: {
        attach: (actorId, request) =>
          this.attachLocomotionEffect(artifact.id, ownedEffectIds, actorId, request),
        get: (effectId) => this.cloneLocomotionEffect(this.locomotionEffects.get(effectId)),
        forActor: (actorId) =>
          [...this.locomotionEffects.values()]
            .filter((effect) => effect.actorId === actorId)
            .map((effect) => this.cloneLocomotionEffect(effect)!),
        remove: (effectId) => {
          const effect = this.locomotionEffects.get(effectId);
          if (!effect || effect.ownerId !== artifact.id) return false;
          ownedEffectIds.delete(effectId);
          return this.locomotionEffects.delete(effectId);
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
          affordance === "unlock"
            ? this.world.invokeUnlock(actorId, targetId)
            : { status: "incompatible", actorId, targetId },
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

  private attachLocomotionEffect(
    moduleId: string,
    ownedEffectIds: Set<string>,
    actorId: string,
    request: LocomotionEffectRequest,
  ): WorldMutationResult<LocomotionEffectRequest, LocomotionEffectSnapshot> {
    const actor = this.world.get(actorId);
    const validTags =
      request.tags === undefined ||
      (Array.isArray(request.tags) && request.tags.every((tag) => typeof tag === "string"));
    if (!request.mode?.trim() || !validTags) {
      return {
        requested: request,
        manaSpent: 0,
        adjustments: ["invalid-locomotion-request"],
        status: "rejected",
      };
    }
    if (request.mode !== "flight") {
      return {
        requested: request,
        manaSpent: 0,
        adjustments: ["unsupported-locomotion-mode"],
        status: "rejected",
      };
    }
    if (
      !actor?.active ||
      (actor.ownerId !== moduleId && !actor.affordances.includes("movable"))
    ) {
      return {
        requested: request,
        manaSpent: 0,
        adjustments: ["actor-not-movable"],
        status: "rejected",
      };
    }

    const { spent, ratio } = this.mana.spend(LOCOMOTION_EFFECT_MANA_COST, 1);
    if (ratio < 1) {
      return {
        requested: request,
        manaSpent: 0,
        adjustments: ["insufficient-mana"],
        status: "rejected",
      };
    }

    const effect: LocomotionEffectSnapshot = {
      id: `locomotion-${this.nextEffectId++}`,
      actorId,
      ownerId: moduleId,
      mode: request.mode,
      tags: [...(request.tags ?? [])],
      collisionPolicy: "solid",
    };
    this.locomotionEffects.set(effect.id, effect);
    ownedEffectIds.add(effect.id);

    return {
      requested: request,
      actual: this.cloneLocomotionEffect(effect),
      manaSpent: spent,
      adjustments: [],
      status: "complete",
    };
  }

  private cloneLocomotionEffect(
    effect: LocomotionEffectSnapshot | undefined,
  ): LocomotionEffectSnapshot | undefined {
    return effect ? { ...effect, tags: [...effect.tags] } : undefined;
  }
}

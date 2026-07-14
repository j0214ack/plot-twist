import type { SpellBundle, SpellCompileRequest, SpellModelInput } from "./types";

const SDK_CONTRACT = `
type Vec3 = { x: number; y: number; z: number };
type PrimitiveShape = "box" | "sphere" | "cylinder" | "portal";

interface EntitySnapshot {
  id: string;
  name: string;
  tags: string[];
  affordances: string[];
  position: Vec3;
  size: Vec3;
  velocity: Vec3;
  stats?: { hp: number; maxHp: number };
  active: boolean;
}

interface SpellArtifact {
  id: string;
  label: string;
  tags: string[];
  entityIds: string[];
  effectIds: string[];
  createdAt: number;
}

interface SpawnPrimitiveRequest {
  name: string;
  tags: string[];
  position: Vec3;
  size: Vec3;
  visual: {
    shape: PrimitiveShape;
    color: number;
    emissive?: number;
    opacity?: number;
  };
  solid?: boolean;
  persistent?: boolean;
}

interface WorldMutationResult<TRequested, TActual = TRequested> {
  requested: TRequested;
  actual?: TActual;
  manaSpent: number;
  adjustments: string[];
  status: "complete" | "partial" | "rejected";
}

interface InteractionResult {
  status: "applied" | "out-of-range" | "incompatible" | "already-complete" | "invalid";
  actorId: string;
  targetId: string;
}

interface NavigationPath {
  actorId: string;
  targetId: string;
  contactDistance: number;
  waypoints: Vec3[];
  cursor: number;
}

type NavigationPlanResult =
  | { status: "path-found"; path: NavigationPath }
  | { status: "arrived" | "no-path" | "invalid" };

interface NavigationFollowResult {
  status: "moving" | "arrived" | "blocked" | "invalid";
  blockerIds: string[];
}

interface LocomotionEffectRequest {
  mode: "flight";
  tags?: string[];
}

interface LocomotionEffectSnapshot {
  id: string;
  actorId: string;
  ownerId: string;
  mode: "flight";
  tags: string[];
  collisionPolicy: "solid";
}

interface MechanicModule {
  readonly label: string;
  readonly tags: string[];
  setup(context: GameContext): void;
  update?(deltaSeconds: number): void;
  dispose(): void;
}

interface GameContext {
  readonly moduleId: string;
  readonly world: {
    queryByTag(tag: string): EntitySnapshot[];
    get(entityId: string): EntitySnapshot | undefined;
    spawnPrimitive(request: SpawnPrimitiveRequest):
      WorldMutationResult<SpawnPrimitiveRequest, EntitySnapshot>;
  };
  readonly physics: {
    // Collision-aware. Returns true only when the entity reached target; false means moving, blocked, or rejected.
    moveToward(entityId: string, target: Vec3, speed: number, deltaSeconds: number): boolean;
  };
  readonly navigation: {
    // Makes an observable straight-line contact attempt and reports the first solid collision.
    stepDirectlyToContact(actorId: string, targetId: string,
      options: { contactDistance: number; speed: number }, deltaSeconds: number):
      NavigationFollowResult;
    // Plans a physical XZ path around current baked and generated solid geometry.
    planToContact(actorId: string, targetId: string, options: { contactDistance: number }):
      NavigationPlanResult;
    // Advances the actor incrementally. Replan when blocked; never loop inside one frame.
    follow(path: NavigationPath, speed: number, deltaSeconds: number): NavigationFollowResult;
  };
  readonly locomotion: {
    // Attaches a world-readable, module-owned movement capability. The Host meters its Mana cost.
    attach(actorId: string, request: LocomotionEffectRequest):
      WorldMutationResult<LocomotionEffectRequest, LocomotionEffectSnapshot>;
    get(effectId: string): LocomotionEffectSnapshot | undefined;
    forActor(actorId: string): LocomotionEffectSnapshot[];
    // A module can remove only effects it owns; Host cleanup also removes them on dispose.
    remove(effectId: string): boolean;
  };
  readonly combat: {
    // sourceId must name an entity spawned by this module with the "damage-source" tag.
    // Use the id from spawnPrimitive(...).actual; otherwise damage is rejected.
    damage(sourceId: string, targetId: string, requestedDamage: number):
      WorldMutationResult<number>;
  };
  readonly interaction: {
    invoke(actorId: string, targetId: string, affordance: "unlock"): InteractionResult;
  };
  readonly artifacts: {
    recent(tag?: string): SpellArtifact | undefined;
  };
  readonly mana: { current(): number };
  readonly note: (note: {
    tone: "info" | "warning" | "codex" | "success";
    text: string;
  }) => void;
}

Only the declarations above exist. There is no DOM, renderer API, direct entity mutation,
timer API, event API, console requirement, import, or package access.
Protected HP, locks, objectives, and unique unlockers cannot be assigned directly.
`;

export interface SpellModelClient {
  generate(input: SpellModelInput): Promise<SpellBundle>;
}

export class SpellCompiler {
  constructor(private readonly model: SpellModelClient) {}

  async compile(request: SpellCompileRequest): Promise<SpellBundle> {
    const bundle = await this.model.generate({
      ...request,
      sdkContract: SDK_CONTRACT,
    });

    this.validateBundle(bundle);
    return bundle;
  }

  private validateBundle(bundle: SpellBundle): void {
    if (!bundle.modules.length) {
      throw new Error("Spell bundle must contain at least one module");
    }

    const precedingModuleIds = new Set<string>();

    for (const module of bundle.modules) {
      if (!module.id.trim()) {
        throw new Error("Generated module id must not be empty");
      }
      if (precedingModuleIds.has(module.id)) {
        throw new Error(`Duplicate generated module id: ${module.id}`);
      }
      if (!module.source.trim()) {
        throw new Error(`Generated module ${module.id} has empty source`);
      }

      for (const dependency of module.dependsOn) {
        if (!precedingModuleIds.has(dependency)) {
          throw new Error(
            `Module ${module.id} has unknown or forward dependency: ${dependency}`,
          );
        }
      }

      precedingModuleIds.add(module.id);
    }
  }
}

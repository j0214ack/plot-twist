export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Size3 {
  x: number;
  y: number;
  z: number;
}

export type PrimitiveShape = "box" | "sphere" | "cylinder" | "portal";

export interface VisualSpec {
  shape: PrimitiveShape;
  color: number;
  emissive?: number;
  opacity?: number;
}

export interface EntitySpec {
  id?: string;
  name: string;
  tags: string[];
  position: Vec3;
  size: Size3;
  visual: VisualSpec;
  velocity?: Vec3;
  stats?: {
    hp: number;
    maxHp: number;
  };
  affordances?: string[];
  protected?: boolean;
  ownerId?: string;
  active?: boolean;
}

export interface EntitySnapshot extends Omit<EntitySpec, "id"> {
  id: string;
  tags: string[];
  affordances: string[];
  velocity: Vec3;
  protected: boolean;
  active: boolean;
}

export interface EntityRecord extends Omit<EntitySpec, "id" | "tags" | "affordances"> {
  id: string;
  tags: Set<string>;
  affordances: Set<string>;
  velocity: Vec3;
  protected: boolean;
  active: boolean;
}

export interface SolidMovementResult {
  status: "moved" | "blocked" | "invalid";
  position?: Vec3;
  blockerIds: string[];
}

export interface InteractionResult {
  status: "applied" | "out-of-range" | "incompatible" | "already-complete" | "invalid";
  actorId: string;
  targetId: string;
}

export interface NavigationPath {
  actorId: string;
  targetId: string;
  contactDistance: number;
  waypoints: Vec3[];
  cursor: number;
}

export type NavigationPlanResult =
  | { status: "path-found"; path: NavigationPath }
  | { status: "arrived" | "no-path" | "invalid" };

export interface NavigationFollowResult {
  status: "moving" | "arrived" | "blocked" | "invalid";
  blockerIds: string[];
}

export interface WorldMutationResult<TRequested, TActual = TRequested> {
  requested: TRequested;
  actual?: TActual;
  manaSpent: number;
  adjustments: string[];
  status: "complete" | "partial" | "rejected";
}

export type WorldEvent =
  | { type: "spawned"; entity: EntitySnapshot }
  | { type: "destroyed"; entityId: string }
  | { type: "damaged"; entityId: string; amount: number; hp: number }
  | { type: "died"; entityId: string }
  | { type: "unlocked"; lockId: string; unlockerId: string }
  | { type: "rejected"; reason: string };

export interface SpellArtifact {
  id: string;
  label: string;
  tags: string[];
  entityIds: string[];
  createdAt: number;
}

export interface QuillNote {
  tone: "info" | "warning" | "codex" | "success";
  text: string;
}

export interface MechanicModule {
  readonly label: string;
  readonly tags: string[];
  setup(context: GameContext): void;
  update?(deltaSeconds: number): void;
  dispose(): void;
}

export interface GameContext {
  readonly moduleId: string;
  readonly world: {
    queryByTag(tag: string): EntitySnapshot[];
    get(entityId: string): EntitySnapshot | undefined;
    spawnPrimitive(
      request: SpawnPrimitiveRequest,
    ): WorldMutationResult<SpawnPrimitiveRequest, EntitySnapshot>;
  };
  readonly physics: {
    moveToward(entityId: string, target: Vec3, speed: number, deltaSeconds: number): boolean;
  };
  readonly navigation: {
    stepDirectlyToContact(
      actorId: string,
      targetId: string,
      options: { contactDistance: number; speed: number },
      deltaSeconds: number,
    ): NavigationFollowResult;
    planToContact(
      actorId: string,
      targetId: string,
      options: { contactDistance: number },
    ): NavigationPlanResult;
    follow(path: NavigationPath, speed: number, deltaSeconds: number): NavigationFollowResult;
  };
  readonly combat: {
    damage(sourceId: string, targetId: string, requestedDamage: number): WorldMutationResult<number>;
  };
  readonly interaction: {
    invoke(actorId: string, targetId: string, affordance: "unlock"): InteractionResult;
  };
  readonly artifacts: {
    recent(tag?: string): SpellArtifact | undefined;
  };
  readonly mana: {
    current(): number;
  };
  readonly note: (note: QuillNote) => void;
}

export interface SpawnPrimitiveRequest {
  name: string;
  tags: string[];
  position: Vec3;
  size: Size3;
  visual: VisualSpec;
  solid?: boolean;
  persistent?: boolean;
}

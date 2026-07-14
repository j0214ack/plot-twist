interface ObservedEntity {
  id: string;
  position: { x: number; y: number; z: number };
}

export interface BehaviorObservation {
  sources: string[];
  generatedBeforeUpdate: ObservedEntity[];
  generatedAfterUpdate: ObservedEntity[];
  targetHpBeforeUpdate?: number;
  targetHpAfterUpdate?: number;
}

export interface BehaviorEvalResult {
  spawnedEntities: number;
  movedEntities: number;
  damageDealt: number;
  forbiddenGlobalUses: string[];
}

const forbiddenGlobals = [
  "window",
  "document",
  "globalThis",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "localStorage",
  "sessionStorage",
  "setTimeout",
  "setInterval",
  "require",
] as const;

const positionChanged = (before: ObservedEntity, after: ObservedEntity): boolean =>
  Math.hypot(
    after.position.x - before.position.x,
    after.position.y - before.position.y,
    after.position.z - before.position.z,
  ) > 0.0001;

export const evaluateObservableBehavior = (
  observation: BehaviorObservation,
): BehaviorEvalResult => {
  const combinedSource = observation.sources.join("\n");
  const forbiddenGlobalUses = forbiddenGlobals.filter((name) =>
    new RegExp(`\\b${name}\\b`).test(combinedSource),
  );
  const afterById = new Map(
    observation.generatedAfterUpdate.map((entity) => [entity.id, entity]),
  );
  const movedEntities = observation.generatedBeforeUpdate.filter((before) => {
    const after = afterById.get(before.id);
    return after ? positionChanged(before, after) : false;
  }).length;

  return {
    spawnedEntities: observation.generatedBeforeUpdate.length,
    movedEntities,
    damageDealt:
      observation.targetHpBeforeUpdate === undefined ||
      observation.targetHpAfterUpdate === undefined
        ? 0
        : Math.max(0, observation.targetHpBeforeUpdate - observation.targetHpAfterUpdate),
    forbiddenGlobalUses,
  };
};

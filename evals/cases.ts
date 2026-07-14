export interface LiveEvalCase {
  id: string;
  utterance: string;
  simulationSeconds: number;
  minimumSpawnedEntities: number;
  minimumMovedEntities: number;
  minimumDamage: number;
  scenario?: "guardian" | "key-door-open" | "key-door-sealed";
  expectedDoorUnlocked?: boolean;
  expectedNoteSubstring?: string;
  minimumActorDistance?: number;
}

const cases: Record<string, LiveEvalCase> = {
  "unseen-orbiting-moons-v1": {
    id: "unseen-orbiting-moons-v1",
    utterance: "召喚三顆紫色的小月亮，排成三角形繞著守衛移動",
    simulationSeconds: 3,
    minimumSpawnedEntities: 3,
    minimumMovedEntities: 1,
    minimumDamage: 0,
  },
  "burning-guardian-v1": {
    id: "burning-guardian-v1",
    utterance: "在守衛腳下生成一圈紫色火焰，只要守衛站在火焰裡就會持續受到傷害",
    simulationSeconds: 3,
    minimumSpawnedEntities: 1,
    minimumMovedEntities: 0,
    minimumDamage: 1,
  },
  "falling-meteor-v1": {
    id: "falling-meteor-v1",
    utterance: "放隕石砸下來，對守衛造成傷害",
    simulationSeconds: 4,
    minimumSpawnedEntities: 1,
    minimumMovedEntities: 1,
    minimumDamage: 1,
  },
  "key-unlock-terse-v1": {
    id: "key-unlock-terse-v1",
    utterance: "鑰匙開鎖",
    simulationSeconds: 5,
    minimumSpawnedEntities: 0,
    minimumMovedEntities: 0,
    minimumDamage: 0,
    scenario: "key-door-open",
    expectedDoorUnlocked: true,
    minimumActorDistance: 1,
  },
  "key-unlock-flying-v1": {
    id: "key-unlock-flying-v1",
    utterance: "讓鑰匙飛去開鎖",
    simulationSeconds: 5,
    minimumSpawnedEntities: 0,
    minimumMovedEntities: 0,
    minimumDamage: 0,
    scenario: "key-door-open",
    expectedDoorUnlocked: true,
    minimumActorDistance: 1,
  },
  "key-unlock-sealed-v1": {
    id: "key-unlock-sealed-v1",
    utterance: "鑰匙開鎖",
    simulationSeconds: 5,
    minimumSpawnedEntities: 0,
    minimumMovedEntities: 0,
    minimumDamage: 0,
    scenario: "key-door-sealed",
    expectedDoorUnlocked: false,
    expectedNoteSubstring: "找不到",
    minimumActorDistance: 0.2,
  },
};

export const getLiveEvalCase = (id: string): LiveEvalCase => {
  const evalCase = cases[id];
  if (!evalCase) throw new Error(`Unknown live Eval case: ${id}`);
  return evalCase;
};

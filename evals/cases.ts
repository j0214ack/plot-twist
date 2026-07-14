export interface LiveEvalCase {
  id: string;
  utterance: string;
  simulationSeconds: number;
  minimumSpawnedEntities: number;
  minimumMovedEntities: number;
  minimumDamage: number;
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
};

export const getLiveEvalCase = (id: string): LiveEvalCase => {
  const evalCase = cases[id];
  if (!evalCase) throw new Error(`Unknown live Eval case: ${id}`);
  return evalCase;
};

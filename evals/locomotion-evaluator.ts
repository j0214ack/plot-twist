import type { LocomotionEffectSnapshot } from "../src/game/types";

export interface LocomotionExpectationResult {
  activeModes: string[];
  matched: boolean;
}

export const evaluateLocomotionExpectation = (
  effects: LocomotionEffectSnapshot[],
  expectedMode: string | undefined,
): LocomotionExpectationResult => {
  const activeModes = effects.map(({ mode }) => mode);
  return {
    activeModes,
    matched:
      expectedMode === undefined || activeModes.some((mode) => mode === expectedMode),
  };
};

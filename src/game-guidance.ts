export interface GameGuidanceState {
  guardianDefeated: boolean;
  doorUnlocked: boolean;
  completed: boolean;
}

export interface GameGuidance {
  label: string;
  text: string;
}

export const nextStepGuidance = (state: GameGuidanceState): GameGuidance | null => {
  if (state.guardianDefeated && !state.doorUnlocked && !state.completed) {
    return {
      label: "NEXT SENTENCE",
      text: "現在施咒讓鑰匙去打開門",
    };
  }

  return null;
};

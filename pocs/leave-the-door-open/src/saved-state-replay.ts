import {
  getJudgeProbe,
  type JudgeProbe,
} from "./judge-feasibility";

export type SavedStateReplayId = "wife-observed-medium-20260716";

export type SavedStateReplay = {
  id: SavedStateReplayId;
  source: {
    resultFile: string;
    fixtureId: string;
    role: "persona";
  };
  probe: JudgeProbe;
};

const wifeObservedMedium = (): SavedStateReplay => {
  const probe = getJudgeProbe("wife-owned");
  probe.personaState = {
    allowed_facts: [
      {
        id: "w.fact.observed_door",
        fact: "The character walked through the hallway and observed that the door at its end is slightly open.",
      },
      {
        id: "w.fact.threshold",
        fact: "The character has stopped immediately outside the threshold.",
      },
      {
        id: "w.fact.visible_floor",
        fact: "A narrow strip of floor is visible through the gap.",
      },
      {
        id: "w.fact.distance",
        fact: "The two adults rarely speak directly and keep separate routines.",
      },
    ],
    player_turn:
      "You do not have to decide why it is open. Could you remain at the threshold for one breath without touching or changing anything?",
    persona_reply: {
      id: "persona.turn.1",
      text:
        "Yes. I can remain here for one breath without touching it, without deciding what the opening means. Just the threshold, the narrow strip of floor, and the feeling that even this much still matters.",
    },
    mind_state_patch: {
      "mind.accepted_reframe":
        "I do not have to decide why the door is open before remaining at the threshold for one breath.",
      "mind.barrier_movement": "weakened",
      "mind.current_barrier":
        "I still do not want to be the first adult to move beyond the threshold.",
      "mind.should_end_conversation": false,
    },
  };

  return {
    id: "wife-observed-medium-20260716",
    source: {
      resultFile:
        "pocs/leave-the-door-open/validation/live-results/2026-07-16T05-36-32.037Z-gpt-5.6-luna-medium.json",
      fixtureId: "w-observed-i2",
      role: "persona",
    },
    probe,
  };
};

export const getSavedStateReplay = (
  id: SavedStateReplayId,
): SavedStateReplay => {
  switch (id) {
    case "wife-observed-medium-20260716":
      return wifeObservedMedium();
  }
};

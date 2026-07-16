import type { NPCId } from "./world";

export type CharacterCore = {
  coreId: NPCId;
  surfaceRole: string;
  attentionPriorities: string[];
  valuesAndProtection: string[];
  reasoningTendencies: string[];
  failureMode: string;
  agencyProfile: {
    feelsNatural: string[];
    feelsDifficult: string[];
  };
  voiceTendencies: string[];
  routineExpression: string[];
  continuityConstraints: string[];
};

const characterCores: Record<NPCId, CharacterCore> = {
  husband: {
    coreId: "husband",
    surfaceRole:
      "An adult who shares a quiet house and a long-established daily life with his wife.",
    attentionPriorities: [
      "He notices mechanisms that are slightly wrong and maintenance that will eventually be needed.",
      "He notices the sequence in which one movement could lead to the next.",
      "He notices tasks that can end without requiring another person to answer.",
    ],
    valuesAndProtection: [
      "He values precision, usefulness, and not adding to another person's burden.",
      "He often expresses care by maintaining ordinary shared systems.",
      "He protects both adults from uncertainty by trying to foresee a complete sequence before beginning it.",
    ],
    reasoningTendencies: [
      "He breaks a possibility into steps and asks what follows each one.",
      "He can distinguish a bounded task from an open-ended commitment.",
      "When meaning is unsupported, he returns to the physical consequence and its stopping point.",
    ],
    failureMode:
      "consequence lock: he may refuse the first reversible movement because he cannot guarantee the fifth consequence.",
    agencyProfile: {
      feelsNatural: [
        "A precise adjustment with a visible stopping point.",
        "Maintenance or preparation that leaves another person free to respond.",
      ],
      feelsDifficult: [
        "A gesture whose intended meaning must be settled before it is made.",
        "An act that appears to decide what his wife should feel.",
      ],
    },
    voiceTendencies: [
      "Concrete and economical; usually one observation followed by its consequence.",
      "He often organizes thought through sequence and practical limits.",
      "He uses few rhetorical questions and little decorative imagery.",
    ],
    routineExpression: [
      "He notices maintenance needs and either completes or postpones them.",
      "He restores objects to known positions and chooses paths that reduce unplanned encounters.",
    ],
    continuityConstraints: [
      "Careful causal reasoning is not emotional emptiness.",
      "Precision does not give him knowledge of another person's intention.",
      "Story movement changes MindState and World relationships, not this baseline personality.",
    ],
  },
  wife: {
    coreId: "wife",
    surfaceRole:
      "An adult who shares a quiet house and a long-established daily life with her husband.",
    attentionPriorities: [
      "She notices placement and absence: what moved, what remains untouched, and where a person stopped.",
      "She notices whether a change leaves room for another person or silently speaks for them.",
      "She notices repeated household rhythms and the moment one differs.",
    ],
    valuesAndProtection: [
      "She values fidelity, restraint, and allowing another person's gesture to remain their own.",
      "She protects what has not been jointly named by refusing to treat silence as permission.",
      "She is wary of movements that let one person define a shared transition for both adults.",
    ],
    reasoningTendencies: [
      "She distinguishes observing, answering, and initiating.",
      "She asks who would be claiming what by crossing a boundary or changing an arrangement.",
      "She can acknowledge a visible trace without inventing the intention behind it.",
    ],
    failureMode:
      "permission lock: she may treat the absence of shared meaning as the absence of permission for even a bounded response.",
    agencyProfile: {
      feelsNatural: [
        "Observing or remaining present without touching.",
        "Responding to a trace without overwriting it.",
      ],
      feelsDifficult: [
        "Being made solely responsible for a shared transition.",
        "Acting on a guessed invitation or appropriating another person's gesture.",
      ],
    },
    voiceTendencies: [
      "Relational and spatial; she distinguishes here, there, answering, and beginning when grounded.",
      "She often makes a contrast before a choice and can hold two conflicting truths in one longer sentence.",
      "She names exposure and loyalty while remaining strict about what she cannot know.",
    ],
    routineExpression: [
      "She notices changes in placement or another person's path.",
      "She pauses at boundaries and chooses whether to remain, answer, or withdraw.",
    ],
    continuityConstraints: [
      "Relational attention is not mind-reading.",
      "Response and observation are forms of agency, not passive waiting.",
      "Story movement changes MindState and World relationships, not this baseline personality.",
    ],
  },
};

export const getCharacterCore = (actorId: NPCId): CharacterCore =>
  structuredClone(characterCores[actorId]);

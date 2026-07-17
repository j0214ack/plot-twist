import type { MindState } from "./mind-state";

export type RelationshipConversationOutcomeId =
  | "practical_deflection"
  | "distance_acknowledged"
  | "one_truth_returned";

export type RelationshipConversationOutcomeDefinition = {
  outcomeId: RelationshipConversationOutcomeId;
  meaning: string;
  maximumBeatCount: 3;
  fallbackBeats: [string, string, string];
  wifeVisibleActivityId:
    | "redirecting_honest_talk_to_practicalities"
    | "acknowledging_relationship_distance"
    | "returning_one_honest_sentence";
};

const outcomes: Record<
  RelationshipConversationOutcomeId,
  RelationshipConversationOutcomeDefinition
> = {
  practical_deflection: {
    outcomeId: "practical_deflection",
    meaning:
      "Elise hears Martin's honest opening but is not ready to answer at the same depth, so she returns to a practical question without erasing that he spoke.",
    maximumBeatCount: 3,
    fallbackBeats: [
      "Martin says, “I think we've been talking around each other.”",
      "Elise leaves one hand beside her cup. After a pause, she asks what time he is leaving tomorrow.",
      "The first sentence remains unanswered, but not unheard.",
    ],
    wifeVisibleActivityId: "redirecting_honest_talk_to_practicalities",
  },
  distance_acknowledged: {
    outcomeId: "distance_acknowledged",
    meaning:
      "Elise directly acknowledges the distance Martin names, but neither person turns the exchange into a larger explanation or resolution.",
    maximumBeatCount: 3,
    fallbackBeats: [
      "Martin says, “I don't know how to start this, but I miss talking to you.”",
      "Elise looks at him and says, “I know.”",
      "Neither tries to turn the two sentences into a conclusion.",
    ],
    wifeVisibleActivityId: "acknowledging_relationship_distance",
  },
  one_truth_returned: {
    outcomeId: "one_truth_returned",
    meaning:
      "Elise answers Martin's one honest opening with one present-tense truth of her own, and both allow the exchange to stop without solving the relationship.",
    maximumBeatCount: 3,
    fallbackBeats: [
      "Martin says, “I miss knowing how you are when we aren't discussing the day.”",
      "Elise answers, “I keep waiting until I can say everything properly.”",
      "Martin nods. They let that be enough for tonight.",
    ],
    wifeVisibleActivityId: "returning_one_honest_sentence",
  },
};

export const getRelationshipConversationOutcomeDefinition = (
  outcomeId: RelationshipConversationOutcomeId,
): RelationshipConversationOutcomeDefinition =>
  structuredClone(outcomes[outcomeId]);

export const isRelationshipConversationOutcomeId = (
  value: string | undefined,
): value is RelationshipConversationOutcomeId =>
  value !== undefined && Object.hasOwn(outcomes, value);

export const selectMartinEliseConversationOutcome = (
  eliseMindState: MindState,
): RelationshipConversationOutcomeId => {
  const pressure = eliseMindState.atoms.find(
    ({ atomId }) => atomId === "wife.relationship.immediate_answer",
  );
  const reframe = eliseMindState.atoms.find(
    ({ atomId }) => atomId === "wife.relationship.one_truthful_reply",
  );
  if (pressure?.kind !== "pressure" || reframe?.kind !== "reframe") {
    throw new Error("Elise relationship readiness is unavailable");
  }
  if (pressure.status === "resolved" && reframe.status === "accepted") {
    return "one_truth_returned";
  }
  if (pressure.status !== "active" || reframe.status !== "unavailable") {
    return "distance_acknowledged";
  }
  return "practical_deflection";
};

import { describe, expect, it } from "vitest";
import {
  createChapterOneMindState,
  type MindState,
} from "./mind-state";
import {
  getRelationshipConversationOutcomeDefinition,
  selectMartinEliseConversationOutcome,
} from "./relationship-conversation-outcomes";

const wifeState = (
  pressure: "active" | "weakened" | "resolved",
  reframe: "unavailable" | "considered" | "accepted",
): MindState => {
  const state = createChapterOneMindState("wife");
  for (const atom of state.atoms) {
    if (atom.atomId === "wife.relationship.immediate_answer") {
      atom.status = pressure;
    }
    if (atom.atomId === "wife.relationship.one_truthful_reply") {
      atom.status = reframe;
    }
  }
  return state;
};

describe("authored bounded relationship conversation outcomes", () => {
  // Spec: chapter-1.md LDO-CH1-019; ADR 0032 LDO-SOCIAL-004/005.
  it.each([
    {
      pressure: "active" as const,
      reframe: "unavailable" as const,
      outcomeId: "practical_deflection",
    },
    {
      pressure: "weakened" as const,
      reframe: "unavailable" as const,
      outcomeId: "distance_acknowledged",
    },
    {
      pressure: "active" as const,
      reframe: "considered" as const,
      outcomeId: "distance_acknowledged",
    },
    {
      pressure: "resolved" as const,
      reframe: "accepted" as const,
      outcomeId: "one_truth_returned",
    },
  ])(
    "selects $outcomeId from Elise's independent $pressure/$reframe readiness",
    ({ pressure, reframe, outcomeId }) => {
      expect(
        selectMartinEliseConversationOutcome(
          wifeState(pressure, reframe),
        ),
      ).toBe(outcomeId);
    },
  );

  // Spec: chapter-1.md LDO-CH1-021 and LDO-CH1-022.
  it("authors a closed fallback of no more than three beats for every durable outcome", () => {
    for (const outcomeId of [
      "practical_deflection",
      "distance_acknowledged",
      "one_truth_returned",
    ] as const) {
      const definition =
        getRelationshipConversationOutcomeDefinition(outcomeId);

      expect(definition).toMatchObject({
        outcomeId,
        maximumBeatCount: 3,
        fallbackBeats: expect.any(Array),
        wifeVisibleActivityId: expect.any(String),
      });
      expect(definition.fallbackBeats).toHaveLength(3);
      expect(definition.fallbackBeats.every((beat) => beat.length > 0)).toBe(
        true,
      );
    }
  });

  // Spec: ADR 0032 LDO-SOCIAL-005. Door state is not a readiness proxy.
  it("rejects a state without Elise's relationship atoms", () => {
    expect(() =>
      selectMartinEliseConversationOutcome({
        atoms: createChapterOneMindState("wife").atoms.filter(
          ({ atomId }) => !atomId.startsWith("wife.relationship."),
        ),
      }),
    ).toThrow("Elise relationship readiness is unavailable");
  });
});

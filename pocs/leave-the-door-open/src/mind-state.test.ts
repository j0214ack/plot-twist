import { describe, expect, it } from "vitest";
import {
  applyValidatedMindStateTransitions,
  createChapterOneMindState,
  revealMindStateAtomsForMoment,
  type MindState,
  type MindStateTransition,
} from "./mind-state";

const state = (): MindState => ({
  atoms: [
    {
      kind: "belief",
      atomId: "belief.consequence_lock",
      proposition: "One small movement decides every later consequence.",
      status: "held",
    },
    {
      kind: "reframe",
      atomId: "reframe.bounded_step",
      proposition: "One bounded step can end without requiring a second.",
      status: "unavailable",
    },
    {
      kind: "pressure",
      atomId: "pressure.effort",
      description: "Beginning a deliberate adjustment feels effortful.",
      status: "active",
    },
  ],
});

const transition = (
  atomId: string,
  fromStatus: string,
  toStatus: string,
): MindStateTransition => ({
  atomId,
  fromStatus,
  toStatus,
  supportingPersonaSourceIds: ["persona.turn.2"],
});

describe("authored MindState transition authority", () => {
  // Spec: ADR 0017 Decision 9; chapter-1.md LDO-CH1-015 and LDO-CH1-018.
  it("starts Chapter 1 with separate relationship readiness but without later door or room reframes", () => {
    expect(
      createChapterOneMindState("husband").atoms.map(({ atomId }) => atomId),
    ).toEqual([
      "husband.door.approach_decides_all_consequences",
      "husband.door.approach_can_end_at_handle",
      "husband.door.uncertain_sequence",
      "husband.relationship.complete_explanation",
      "husband.relationship.one_honest_sentence",
    ]);
    expect(
      createChapterOneMindState("wife").atoms.map(({ atomId }) => atomId),
    ).toEqual([
      "wife.room.approach_initiates_shared_transition",
      "wife.room.first_mover",
      "wife.relationship.immediate_answer",
      "wife.relationship.one_truthful_reply",
    ]);
    expect(createChapterOneMindState("husband").atoms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          atomId: "husband.relationship.complete_explanation",
          kind: "pressure",
          status: "active",
        }),
        expect.objectContaining({
          atomId: "husband.relationship.one_honest_sentence",
          kind: "reframe",
          status: "unavailable",
        }),
      ]),
    );
    expect(createChapterOneMindState("wife").atoms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          atomId: "wife.relationship.immediate_answer",
          kind: "pressure",
          status: "active",
        }),
        expect.objectContaining({
          atomId: "wife.relationship.one_truthful_reply",
          kind: "reframe",
          status: "unavailable",
        }),
      ]),
    );
  });

  // Spec: ADR 0017 Decision 9; LDO-CH1-015 Psychological atom phases.
  it("reveals only the authored atoms for the current causal moment and never duplicates them", () => {
    const husbandAtHandle = revealMindStateAtomsForMoment({
      state: createChapterOneMindState("husband"),
      actorId: "husband",
      visibleActivityId: "reaching_closed_door_handle",
    });
    expect(husbandAtHandle.atoms.map(({ atomId }) => atomId)).toEqual([
      "husband.door.approach_decides_all_consequences",
      "husband.door.approach_can_end_at_handle",
      "husband.door.uncertain_sequence",
      "husband.relationship.complete_explanation",
      "husband.relationship.one_honest_sentence",
      "husband.door.gesture_controls_spouse_interpretation",
      "husband.door.narrow_gap_can_end",
    ]);
    expect(
      revealMindStateAtomsForMoment({
        state: husbandAtHandle,
        actorId: "husband",
        visibleActivityId: "reaching_closed_door_handle",
      }),
    ).toEqual(husbandAtHandle);

    let wife = createChapterOneMindState("wife");
    wife = revealMindStateAtomsForMoment({
      state: wife,
      actorId: "wife",
      visibleActivityId: "observing_first_door_gap",
    });
    expect(wife.atoms.map(({ atomId }) => atomId)).toContain(
      "wife.room.trace_needs_no_inferred_invitation",
    );
    expect(wife.atoms.map(({ atomId }) => atomId)).not.toContain(
      "wife.room.presence_can_remain_non_interpretive",
    );

    wife = revealMindStateAtomsForMoment({
      state: wife,
      actorId: "wife",
      visibleActivityId: "stopping_one_step_short",
    });
    expect(wife.atoms.map(({ atomId }) => atomId)).toContain(
      "wife.room.presence_can_remain_non_interpretive",
    );
    expect(wife.atoms.map(({ atomId }) => atomId)).not.toContain(
      "wife.room.one_pace_is_not_ownership",
    );

    wife = revealMindStateAtomsForMoment({
      state: wife,
      actorId: "wife",
      visibleActivityId: "returning_to_boundary",
    });
    expect(wife.atoms.map(({ atomId }) => atomId)).toContain(
      "wife.room.one_pace_is_not_ownership",
    );
    expect(wife.atoms.map(({ atomId }) => atomId)).not.toContain(
      "wife.room.small_household_response_needs_no_shared_meaning",
    );

    wife = revealMindStateAtomsForMoment({
      state: wife,
      actorId: "wife",
      visibleActivityId: "noticing_closed_room_window",
    });
    expect(wife.atoms.map(({ atomId }) => atomId)).toContain(
      "wife.room.small_household_response_needs_no_shared_meaning",
    );
  });

  // Spec: ADR 0017 Decisions 1, 5-8; LDO-LOCAL-013.
  it("applies only forward finite transitions while retaining resolved atoms", () => {
    const next = applyValidatedMindStateTransitions({
      state: state(),
      transitions: [
        transition("belief.consequence_lock", "held", "rejected"),
        transition("reframe.bounded_step", "unavailable", "accepted"),
        transition("pressure.effort", "active", "resolved"),
      ],
      personaSourceId: "persona.turn.2",
    });

    expect(next.atoms).toEqual([
      expect.objectContaining({
        atomId: "belief.consequence_lock",
        proposition:
          "One small movement decides every later consequence.",
        status: "rejected",
      }),
      expect.objectContaining({
        atomId: "reframe.bounded_step",
        proposition:
          "One bounded step can end without requiring a second.",
        status: "accepted",
      }),
      expect.objectContaining({
        atomId: "pressure.effort",
        description: "Beginning a deliberate adjustment feels effortful.",
        status: "resolved",
      }),
    ]);
  });

  // Spec: ADR 0017 Decisions 5-6. Player text is never transition evidence.
  it.each([
    {
      name: "unknown atom",
      change: transition("belief.invented", "held", "rejected"),
      error: "Unknown psychological atom: belief.invented",
    },
    {
      name: "stale from status",
      change: transition("belief.consequence_lock", "questioned", "rejected"),
      error:
        "Psychological atom belief.consequence_lock expected questioned, received held",
    },
    {
      name: "status from another atom kind",
      change: transition("pressure.effort", "active", "accepted"),
      error: "Invalid pressure status: accepted",
    },
    {
      name: "regression",
      change: transition("belief.consequence_lock", "held", "held"),
      error: "Psychological atom transition must move forward",
    },
    {
      name: "player-only support",
      change: {
        ...transition("pressure.effort", "active", "resolved"),
        supportingPersonaSourceIds: ["player.turn.2"],
      },
      error: "MindState transition lacks Persona-owned support",
    },
  ])("rejects a $name without mutating its input", ({ change, error }) => {
    const before = state();
    const frozen = structuredClone(before);

    expect(() =>
      applyValidatedMindStateTransitions({
        state: before,
        transitions: [change],
        personaSourceId: "persona.turn.2",
      }),
    ).toThrow(error);
    expect(before).toEqual(frozen);
  });
});

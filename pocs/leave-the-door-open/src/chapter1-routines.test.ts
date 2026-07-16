import { describe, expect, it } from "vitest";
import {
  getChapter1CausalRoutineDefinition,
  selectChapter1CausalRoutineDefinition,
  isChapter1CausalRoutineId,
  type Chapter1CausalRoutineId,
} from "./chapter1-routines";

const expectedRoutines = {
  husband_route_turns_before_closed_door: {
    actorId: "husband",
    locationId: "hallway",
    visibleActivityId: "turning_before_closed_door",
    safeFact: "His ordinary hallway route ends before the fully closed door.",
    postconditionId: "husband_turned_back_before_closed_door",
  },
  wife_takes_long_route_around_hall: {
    actorId: "wife",
    locationId: "dining_area",
    visibleActivityId: "taking_long_route_around_hall",
    safeFact:
      "She starts toward the hallway, then chooses a longer route back.",
    postconditionId: "wife_completed_longer_return_route",
  },
  husband_reaches_handle_without_turning: {
    actorId: "husband",
    locationId: "hallway",
    visibleActivityId: "reaching_closed_door_handle",
    safeFact:
      "His stopping point changed: his hand now reaches the handle; the door remains fully closed.",
    postconditionId: "husband_hand_on_closed_handle",
  },
  wife_observes_first_gap: {
    actorId: "wife",
    locationId: "hallway",
    visibleActivityId: "observing_first_door_gap",
    safeFact:
      "She notices the narrow gap and stops away from the threshold without touching the door.",
    postconditionId: "wife_stopped_away_observing_gap",
  },
  wife_stops_one_step_short: {
    actorId: "wife",
    locationId: "room_threshold",
    visibleActivityId: "stopping_one_step_short",
    safeFact: "On a later day she stops closer; nothing in the room changes.",
    postconditionId: "wife_one_step_short_of_threshold",
  },
  wife_returns_to_boundary: {
    actorId: "wife",
    locationId: "room_threshold",
    visibleActivityId: "returning_to_boundary",
    safeFact:
      "She returns and places one foot beside, not across, the line.",
    postconditionId: "wife_foot_beside_boundary",
  },
  wife_notices_closed_window: {
    actorId: "wife",
    locationId: "room_interior",
    visibleActivityId: "noticing_closed_room_window",
    safeFact:
      "From inside she looks toward the closed window and changes nothing.",
    postconditionId: "wife_inside_looking_at_closed_window",
  },
} as const satisfies Record<
  Chapter1CausalRoutineId,
  {
    actorId: "husband" | "wife";
    locationId: string;
    visibleActivityId: string;
    safeFact: string;
    postconditionId: string;
  }
>;

const routineIds = Object.keys(expectedRoutines) as Chapter1CausalRoutineId[];

describe("Chapter 1 causal routine catalog", () => {
  // Spec: chapter-1.md, "Routine and HintBrief progression"; ADR 0010
  // Decisions 1, 5-7, and 12; ADR 0016 Decisions 1, 5-7.
  it("authors the seven guaranteed clues with exact routine postconditions and bounded player-safe hints", () => {
    for (const routineId of routineIds) {
      const expected = expectedRoutines[routineId];
      const definition = getChapter1CausalRoutineDefinition(routineId);

      expect(definition).toMatchObject({
        routineId,
        actorId: expected.actorId,
        locationId: expected.locationId,
        visibleActivityId: expected.visibleActivityId,
        hintBrief: {
          safeFact: expected.safeFact,
          required: true,
          clarity: "clear",
        },
        performanceEnvelope: {
          closurePolicy: {
            kind: "authored_routine_postcondition",
            postconditionId: expected.postconditionId,
          },
        },
      });
      expect(definition.variantId).not.toHaveLength(0);
      expect(definition.performanceDirective).not.toHaveLength(0);
      expect(definition.performanceEnvelope.targetObjectIds.length).toBeGreaterThan(
        0,
      );
      expect(definition.hintBrief.forbiddenInterpretations).toEqual([
        "Do not explain the room's biography.",
        "Do not state death, grief, invitation, reconciliation, or erasure as World fact.",
        "Do not recommend or paraphrase a hidden Action.",
        "Do not claim either adult knows what the other intended.",
      ]);

      expect(definition).not.toHaveProperty("actionId");
      expect(definition).not.toHaveProperty("outcome");
      expect(definition).not.toHaveProperty("postcondition");
    }
  });

  // Spec: ADR 0010 Decisions 1 and 4; ADR 0016 Decisions 1 and 5.
  it("recognizes only the fixed authored causal IDs", () => {
    for (const routineId of routineIds) {
      expect(isChapter1CausalRoutineId(routineId)).toBe(true);
    }

    expect(isChapter1CausalRoutineId("wife_opens_room_window")).toBe(false);
    expect(isChapter1CausalRoutineId("wife_squares_hallway_runner")).toBe(false);
    expect(isChapter1CausalRoutineId("open_door_a_crack")).toBe(false);
    expect(isChapter1CausalRoutineId("unknown_routine")).toBe(false);
  });

  // Spec: ADR 0010 Decisions 1, 11, and 12.
  it("returns isolated definitions so callers cannot mutate authored catalog data", () => {
    const first = getChapter1CausalRoutineDefinition(
      "wife_observes_first_gap",
    );
    first.performanceEnvelope.targetObjectIds.push("unowned_object");
    first.hintBrief.forbiddenInterpretations.length = 0;

    const second = getChapter1CausalRoutineDefinition(
      "wife_observes_first_gap",
    );
    expect(second.performanceEnvelope.targetObjectIds).not.toContain(
      "unowned_object",
    );
    expect(second.hintBrief.forbiddenInterpretations).toHaveLength(4);
  });

  // Spec: chapter-1.md, "Deterministic earliest path" retry paragraph;
  // ADR 0010 Decisions 2-5. Validated Action awareness is the bounded input,
  // while the authored variant keeps the same closure and hard phase.
  it("selects a distinct player-safe retry variant after validated psychological progress", () => {
    const retryableRoutines = [
      "husband_reaches_handle_without_turning",
      "wife_stops_one_step_short",
      "wife_returns_to_boundary",
      "wife_notices_closed_window",
    ] as const;

    for (const routineId of retryableRoutines) {
      const latent = selectChapter1CausalRoutineDefinition(
        routineId,
        "latent",
      );
      const progressed = selectChapter1CausalRoutineDefinition(
        routineId,
        "faintly_imagined",
      );
      const surfaced = selectChapter1CausalRoutineDefinition(
        routineId,
        "surfaced",
      );

      expect(progressed.variantId).not.toBe(latent.variantId);
      expect(surfaced.variantId).toBe(progressed.variantId);
      expect(progressed).toMatchObject({
        routineId,
        actorId: latent.actorId,
        locationId: latent.locationId,
        visibleActivityId: latent.visibleActivityId,
        performanceEnvelope: latent.performanceEnvelope,
        hintBrief: {
          required: true,
          clarity: "clear",
        },
      });
      expect(progressed.hintBrief.safeFact).not.toBe(
        latent.hintBrief.safeFact,
      );
    }
  });
});

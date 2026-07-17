import { describe, expect, it } from "vitest";
import { getNarrativeActionDefinition } from "./narrative-actions";

describe("authored NarrativeAction definitions", () => {
  it("LDO-LOCAL-010 LDO-LOCAL-012 gives the clock interaction a neutral option and authored accurate-clock closure", () => {
    expect(
      getNarrativeActionDefinition("interact_with_living_room_clock"),
    ).toMatchObject({
      actionId: "interact_with_living_room_clock",
      description:
        "Physically interact with the living-room clock for a brief period; when finished, leave it intact, running, and showing the current time.",
      option: {
        optionId: "spend-time-with-clock",
      },
      variants: [
        {
          variantId: "accepted_clock_interaction",
          description:
            "Follow the Persona's accepted reversible clock-interaction motif, then leave the clock intact, running, and showing the current time.",
        },
      ],
      performanceEnvelope: {
        targetObjectIds: ["living_room_clock"],
        reversibleFreedom: "accepted_persona_owned_motif",
        closurePolicy: {
          kind: "authored_postcondition",
          postconditionId: "living_room_clock_accurate",
        },
      },
    });
  });

  it("LDO-VS-007 ADR 0011 defines opening a closed door rather than preserving an unexplained gap", () => {
    expect(getNarrativeActionDefinition("open_door_a_crack")).toMatchObject({
      actionId: "open_door_a_crack",
      description:
        "Open the fully closed hallway door only far enough to leave a narrow gap, then walk away.",
      option: {
        optionId: "open-door-a-crack",
      },
      variants: [
        {
          variantId: "open_narrow_gap",
          description:
            "Turn the handle, open a narrow gap in the closed door, and walk away.",
        },
      ],
      performanceEnvelope: {
        targetObjectIds: ["hallway_door"],
        closurePolicy: {
          kind: "authored_postcondition",
          postconditionId: "hallway_door_slightly_open",
        },
      },
    });
  });

  it("LDO-CH1-009 defines stepping inside as a separate fixed Action with its own closure", () => {
    expect(getNarrativeActionDefinition("step_inside_room")).toMatchObject({
      actionId: "step_inside_room",
      description:
        "Step one pace across the room threshold, remain briefly without touching anything, then step back.",
      option: {
        optionId: "step-inside-room",
      },
      variants: [
        {
          variantId: "one_pace_inside_then_back",
          description:
            "Cross one pace into the room, remain briefly without touching anything, then return to the threshold.",
        },
      ],
      performanceEnvelope: {
        targetObjectIds: ["room_threshold", "room_interior"],
        closurePolicy: {
          kind: "authored_postcondition",
          postconditionId: "wife_enters_room",
        },
      },
    });
  });

  it("LDO-CH1-010 defines the bounded room-window change as its own fixed Action", () => {
    expect(getNarrativeActionDefinition("open_room_window")).toMatchObject({
      actionId: "open_room_window",
      description:
        "Open the closed room window one hand-width and leave it there.",
      option: {
        optionId: "open-room-window",
      },
      variants: [
        {
          variantId: "open_one_hand_width",
          description:
            "Open the closed room window one hand-width and leave it open at that exact stopping point.",
        },
      ],
      performanceEnvelope: {
        targetObjectIds: ["room_window"],
        closurePolicy: {
          kind: "authored_postcondition",
          postconditionId: "room_window_open_one_hand_width",
        },
      },
    });
  });

  // Spec: ADR 0033 LDO-LOC-002 and LDO-LOC-004.
  it("keeps display copy out of semantic Action definitions", () => {
    const definition = getNarrativeActionDefinition("open_door_a_crack");

    expect(definition.option).toEqual({ optionId: "open-door-a-crack" });
    expect(definition.option).not.toHaveProperty("label");
  });

  // Spec: chapter-1.md LDO-CH1-017 and ADR 0032 LDO-SOCIAL-001/003.
  it("defines one fixed bounded attempt instead of an open spouse-to-spouse conversation", () => {
    expect(
      getNarrativeActionDefinition("say_one_honest_thing_to_elise"),
    ).toMatchObject({
      actionId: "say_one_honest_thing_to_elise",
      description:
        "At the next suitable shared evening moment, say one honest thing to Elise without requiring an immediate answer or larger resolution.",
      option: {
        optionId: "say-one-honest-thing",
      },
      recipientActorIds: ["wife"],
      variants: [
        {
          variantId: "one_honest_opening",
          description:
            "Make one honest opening, allow Elise one response, and let the exchange end without forcing a conclusion.",
        },
      ],
      performanceEnvelope: {
        targetObjectIds: [],
        closurePolicy: {
          kind: "authored_postcondition",
          postconditionId: "bounded_spousal_exchange_recorded",
        },
      },
    });
  });
});

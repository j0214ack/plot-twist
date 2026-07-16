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
        label: "Spend a moment with the clock.",
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
        label: "Open the door just a little.",
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
        label: "Step across the threshold, then step back.",
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
        label: "Open the window a little.",
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
});

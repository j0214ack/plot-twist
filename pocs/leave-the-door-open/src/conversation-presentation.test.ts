import { describe, expect, it } from "vitest";
import { VerticalSliceGameController } from "./controller";
import type { ConversationPorts } from "./conversation";
import { projectGame } from "./presentation";
import type { UIView } from "./presentation";
import { renderUIText } from "./text-rendering";
import { createVerticalSliceWorld } from "./world";

const DAY = 24 * 60;

function createControllerAtChapterDay2Handle(
  ports: ConversationPorts,
): VerticalSliceGameController {
  const world = createVerticalSliceWorld({
    ambientChoice: { choose: () => null },
  });
  world.advanceTo(7 * 60 + 57);
  world.pause();
  world.commitNarrativeAction("husband", "interact_with_living_room_clock");
  world.resume();
  world.advanceTo(7 * 60 + 59);
  const controller = new VerticalSliceGameController(world, ports);
  controller.advanceTo(2 * DAY + 8 * 60 + 10);
  return controller;
}

const surfacingPorts: ConversationPorts = {
  persona: {
    async takeTurn() {
      return {
        reply: "I could open only a narrow gap and then walk away.",
        shouldEndConversation: false,
      };
    },
  },
  actionJudge: {
    async judgeMindStateTransition(request) {
      return {
        transitions: [
          {
            atomId: "husband.door.narrow_gap_can_end",
            fromStatus: "unavailable",
            toStatus: "accepted",
            supportingPersonaSourceIds: [request.personaReply.sourceId],
          },
        ],
        unmodeledShiftNote: null,
      };
    },
    async judgeAwareness(request) {
      return {
        judgments: request.actions.map(({ actionId }) => ({
          actionId,
          awareness: "surfaced" as const,
        })),
      };
    },
    async judgeWillingness() {
      throw new Error("Willingness is not exercised by this projection test");
    },
  },
};

describe("conversation UI projection", () => {
  it("LDO-CH1-008 LDO-HPT-004 renders dialogue and a neutral option without private orchestration state", async () => {
    const controller = createControllerAtChapterDay2Handle(surfacingPorts);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    await controller.dispatch({
      type: "submit_dialogue",
      text: "Could the door simply remain undecided?",
    });

    const ui = projectGame(controller.snapshot()).ui;
    expect(ui).toEqual({
      mode: "paused",
      selectedActor: { id: "husband", label: "Martin" },
      conversation: {
        status: "idle",
        messages: [
          {
            speaker: "player",
            text: "Could the door simply remain undecided?",
          },
          {
            speaker: "persona",
            text: "I could open only a narrow gap and then walk away.",
          },
        ],
        errorMessage: null,
        feedbackMessage: null,
      },
      actionOptions: [
        { optionId: "open-door-a-crack", label: "Open the door just a little." },
      ],
    });
    expect(renderUIText(ui)).toBe(
      [
        "[Paused]",
        "Focus: Martin",
        "You: Could the door simply remain undecided?",
        "Martin: I could open only a narrow gap and then walk away.",
        "Possibilities:",
        "1. Open the door just a little.",
      ].join("\n"),
    );

    expect(JSON.stringify(ui)).not.toMatch(
      /open_door_a_crack|open_narrow_gap|acceptedReframes|currentBarrier|judgments|variants/,
    );
  });

  it("LDO-HPT-004 renders pending and safe error states", () => {
    const baseView: UIView = {
      mode: "paused",
      selectedActor: { id: "husband", label: "Martin" },
      conversation: {
        status: "awaiting_persona",
        messages: [],
        errorMessage: null,
        feedbackMessage: null,
      },
      actionOptions: [],
    };

    expect(renderUIText(baseView)).toContain("Inner voice is responding…");
    expect(
      renderUIText({
        ...baseView,
        conversation: {
          status: "error",
          messages: [],
          errorMessage: "The conversation could not continue.",
        },
      }),
    ).toContain("The conversation could not continue.");
  });
});

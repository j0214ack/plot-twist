import { describe, expect, it } from "vitest";
import {
  createConversationalVerticalSliceGameController,
  VerticalSliceGameController,
} from "./controller";
import type {
  ActionJudgePort,
  AwarenessRequest,
  ConversationPorts,
  PersonaPort,
  PersonaTurnRequest,
  WillingnessRequest,
} from "./conversation";
import { projectGame } from "./presentation";
import { renderWorldText } from "./text-rendering";
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

describe("Leave the Door Open conversational Controller", () => {
  it("LDO-LOCAL-013 refuses to continue when the required MindState transition Judge is absent", async () => {
    let awarenessRan = false;
    const controller = createConversationalVerticalSliceGameController({
      persona: {
        async takeTurn() {
          return {
            reply: "I could stop after setting the clock right.",
            shouldEndConversation: false,
          };
        },
      },
      actionJudge: {
        async judgeAwareness() {
          awarenessRan = true;
          return { judgments: [] };
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      } as unknown as ActionJudgePort,
    });
    controller.advanceTo(7 * 60 + 57);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    await expect(
      controller.dispatch({
        type: "submit_dialogue",
        text: "Could correcting it be one bounded task?",
      }),
    ).rejects.toThrow("MindState transition Judge is required");
    expect(awarenessRan).toBe(false);
  });

  it("LDO-LOCAL-013 invokes the transition Judge with its port receiver intact", async () => {
    const actionJudge = {
      transitionCalls: 0,
      async judgeMindStateTransition() {
        this.transitionCalls += 1;
        return { transitions: [], unmodeledShiftNote: null };
      },
      async judgeAwareness(request: AwarenessRequest) {
        return {
          judgments: request.actions.map(({ actionId }) => ({
            actionId,
            awareness: "latent" as const,
          })),
        };
      },
      async judgeWillingness() {
        throw new Error("Not exercised");
      },
    };
    const controller = createConversationalVerticalSliceGameController({
      persona: {
        async takeTurn() {
          return {
            reply: "Today I may have enough energy to begin.",
            shouldEndConversation: false,
          };
        },
      },
      actionJudge,
    });
    controller.advanceTo(7 * 60 + 57);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    await controller.dispatch({
      type: "submit_dialogue",
      text: "What changed today?",
    });

    expect(actionJudge.transitionCalls).toBe(1);
    expect(controller.snapshot().interaction.conversationStatus).toBe("idle");
  });

  it("LDO-LOCAL-013 gives the Judge sole authority to persist authored psychological atom transitions", async () => {
    const callOrder: string[] = [];
    const transitionRequests: Array<Record<string, unknown>> = [];
    const awarenessRequests: AwarenessRequest[] = [];
    const persona: PersonaPort = {
      async takeTurn() {
        callOrder.push("persona");
        return {
          reply:
            "I can treat setting it right as one bounded task and stop there.",
          // This legacy proposal is deliberately contradictory. ADR 0017 says
          // the Controller must not persist Persona-authored MindState data.
          mindStatePatch: {
            acceptedReframe: null,
            barrierMovement: "strengthened",
            currentBarrier: "An invented replacement barrier.",
            shouldEndConversation: false,
          },
        };
      },
    };
    const actionJudge = {
      async judgeMindStateTransition(request: Record<string, unknown>) {
        callOrder.push("mind_state_transition");
        transitionRequests.push(structuredClone(request));
        return {
          transitions: [
            {
              atomId: "husband.clock.deliberate_change_effort",
              fromStatus: "active",
              toStatus: "resolved",
              supportingPersonaSourceIds: ["persona.turn.1"],
            },
            {
              atomId: "husband.clock.bounded_adjustment",
              fromStatus: "unavailable",
              toStatus: "accepted",
              supportingPersonaSourceIds: ["persona.turn.1"],
            },
          ],
          unmodeledShiftNote: null,
        };
      },
      async judgeAwareness(request: AwarenessRequest) {
        callOrder.push("awareness");
        awarenessRequests.push(structuredClone(request));
        return {
          judgments: request.actions.map(({ actionId }) => ({
            actionId,
            awareness: "surfaced" as const,
          })),
        };
      },
      async judgeWillingness() {
        throw new Error("Not exercised");
      },
    };
    const controller = createConversationalVerticalSliceGameController({
      persona,
      actionJudge,
    } as unknown as ConversationPorts);
    controller.advanceTo(7 * 60 + 57);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    await controller.dispatch({
      type: "submit_dialogue",
      text: "Could it be one bounded task with a clear stopping point?",
    });

    expect(callOrder).toEqual([
      "persona",
      "mind_state_transition",
      "awareness",
    ]);
    expect(transitionRequests).toMatchObject([
      {
        actorId: "husband",
        personaReply: {
          sourceId: "persona.turn.1",
          text:
            "I can treat setting it right as one bounded task and stop there.",
        },
        mindState: {
          atoms: expect.arrayContaining([
            expect.objectContaining({
              atomId: "husband.clock.deliberate_change_effort",
              status: "active",
            }),
            expect.objectContaining({
              atomId: "husband.clock.bounded_adjustment",
              status: "unavailable",
            }),
          ]),
        },
      },
    ]);
    expect(transitionRequests[0]).not.toHaveProperty("actions");
    expect(awarenessRequests[0]!.personaState.mindState).toMatchObject({
      atoms: expect.arrayContaining([
        expect.objectContaining({
          atomId: "husband.clock.deliberate_change_effort",
          status: "resolved",
        }),
        expect.objectContaining({
          atomId: "husband.clock.bounded_adjustment",
          status: "accepted",
        }),
      ]),
    });
    expect(JSON.stringify(awarenessRequests[0])).not.toContain(
      "An invented replacement barrier.",
    );
  });

  it("LDO-LOCAL-010 gives the clock tutorial a shallow MindState and forms its fixed intention", async () => {
    const personaRequests: PersonaTurnRequest[] = [];
    const awarenessRequests: AwarenessRequest[] = [];
    const persona: PersonaPort = {
      async takeTurn(request) {
        personaRequests.push(structuredClone(request));
        return {
          reply:
            "Mostly that I could reach up and fix it in less time than I've spent noticing it.",
          shouldEndConversation: false,
        };
      },
    };
    const actionJudge: ActionJudgePort = {
      async judgeMindStateTransition() {
        return {
          transitions: [
            {
              atomId: "husband.clock.deliberate_change_effort",
              fromStatus: "active",
              toStatus: "resolved",
              supportingPersonaSourceIds: ["persona.turn.1"],
            },
            {
              atomId: "husband.clock.bounded_adjustment",
              fromStatus: "unavailable",
              toStatus: "accepted",
              supportingPersonaSourceIds: ["persona.turn.1"],
            },
          ],
          unmodeledShiftNote: null,
        };
      },
      async judgeAwareness(request) {
        awarenessRequests.push(structuredClone(request));
        return {
          judgments: request.actions.map(({ actionId }) => ({
            actionId,
            awareness: "surfaced" as const,
          })),
        };
      },
      async judgeWillingness(request) {
        return {
          actionId: request.action.actionId,
          decision: "accept" as const,
          selectedVariantId: "accepted_clock_interaction",
        };
      },
    };
    const controller = createConversationalVerticalSliceGameController({
      persona,
      actionJudge,
    });
    controller.advanceTo(7 * 60 + 57);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    await controller.dispatch({
      type: "submit_dialogue",
      text: "What made those three minutes feel worth stopping for today?",
    });

    expect(personaRequests[0]).toMatchObject({
      actorId: "husband",
      moment: {
        time: 7 * 60 + 57,
        locationId: "living_room",
        visibleActivityId: "noticing_slow_clock",
      },
      mindState: {
        atoms: expect.arrayContaining([
          expect.objectContaining({
            atomId: "husband.clock.deliberate_change_effort",
            status: "active",
          }),
          expect.objectContaining({
            atomId: "husband.clock.bounded_adjustment",
            status: "unavailable",
          }),
        ]),
      },
    });
    expect(JSON.stringify(personaRequests[0])).not.toMatch(
      /interact_with_living_room_clock|accepted_clock_interaction|Spend a moment with the clock/,
    );
    expect(awarenessRequests[0]?.actions).toEqual([
      {
        actionId: "interact_with_living_room_clock",
        description:
          "Physically interact with the living-room clock for a brief period; when finished, leave it intact, running, and showing the current time.",
      },
    ]);
    expect(awarenessRequests[0]?.personaState.mindState).toMatchObject({
      atoms: expect.arrayContaining([
        expect.objectContaining({
          atomId: "husband.clock.deliberate_change_effort",
          status: "resolved",
        }),
        expect.objectContaining({
          atomId: "husband.clock.bounded_adjustment",
          status: "accepted",
        }),
      ]),
    });
    expect(controller.snapshot().interaction.availableActionOptionIds).toEqual([
      "spend-time-with-clock",
    ]);
    expect(controller.snapshot().world.actionProgress).toMatchObject({
      husband: { interact_with_living_room_clock: "surfaced" },
    });

    await controller.dispatch({
      type: "select_action_option",
      optionId: "spend-time-with-clock",
    });

    expect(controller.snapshot().world.intentions).toEqual([
      {
        actorId: "husband",
        actionId: "interact_with_living_room_clock",
      },
    ]);
    expect(controller.snapshot().world.actionProgress).toMatchObject({
      husband: { interact_with_living_room_clock: "intended" },
    });
  });

  it("LDO-CH1-008 LDO-HPT-001 LDO-HPT-002 LDO-HPT-003 turns a Persona-owned possibility into an accepted World intention", async () => {
    const personaRequests: PersonaTurnRequest[] = [];
    const awarenessRequests: AwarenessRequest[] = [];
    const willingnessRequests: WillingnessRequest[] = [];

    const persona: PersonaPort = {
      async takeTurn(request) {
        personaRequests.push(structuredClone(request));
        return {
          reply:
            "I can turn the handle, open only a narrow gap, and then walk away.",
          shouldEndConversation: false,
        };
      },
    };
    const actionJudge: ActionJudgePort = {
      async judgeMindStateTransition() {
        return {
          transitions: [
            {
              atomId:
                "husband.door.approach_decides_all_consequences",
              fromStatus: "held",
              toStatus: "rejected",
              supportingPersonaSourceIds: ["persona.turn.1"],
            },
            {
              atomId: "husband.door.narrow_gap_can_end",
              fromStatus: "unavailable",
              toStatus: "accepted",
              supportingPersonaSourceIds: ["persona.turn.1"],
            },
            {
              atomId: "husband.door.uncertain_sequence",
              fromStatus: "active",
              toStatus: "weakened",
              supportingPersonaSourceIds: ["persona.turn.1"],
            },
          ],
          unmodeledShiftNote: null,
        };
      },
      async judgeAwareness(request) {
        awarenessRequests.push(structuredClone(request));
        return {
          judgments: request.actions.map(({ actionId }) => ({
            actionId,
            awareness: "surfaced" as const,
          })),
        };
      },
      async judgeWillingness(request) {
        willingnessRequests.push(structuredClone(request));
        return {
          actionId: request.action.actionId,
          decision: "accept" as const,
          selectedVariantId: "open_narrow_gap",
        };
      },
    };
    const controller = createControllerAtChapterDay2Handle({
      persona,
      actionJudge,
    });
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    await controller.dispatch({
      type: "submit_dialogue",
      text: "What if you opened it only a little and then walked away?",
    });

    expect(personaRequests).toHaveLength(1);
    expect(personaRequests[0]).toMatchObject({
      actorId: "husband",
      moment: {
        time: 2 * DAY + 8 * 60 + 10,
        locationId: "hallway",
        visibleActivityId: "reaching_closed_door_handle",
      },
      observedEvidence: [],
      conversation: [
        {
          speaker: "player",
          text: "What if you opened it only a little and then walked away?",
        },
      ],
      mindState: {
        atoms: expect.arrayContaining([
          expect.objectContaining({
            atomId:
              "husband.door.approach_decides_all_consequences",
            status: "held",
          }),
          expect.objectContaining({
            atomId: "husband.door.narrow_gap_can_end",
            status: "unavailable",
          }),
        ]),
      },
    });
    expect(JSON.stringify(personaRequests[0])).not.toMatch(
      /open_door_a_crack|open_narrow_gap|Open the door just a little/,
    );

    expect(awarenessRequests).toMatchObject([
      {
        actorId: "husband",
        actions: [
          {
            actionId: "open_door_a_crack",
            description:
              "Open the fully closed hallway door only far enough to leave a narrow gap, then walk away.",
          },
        ],
        personaState: {
          reply: {
            text:
              "I can turn the handle, open only a narrow gap, and then walk away.",
          },
          mindState: {
            atoms: expect.arrayContaining([
              expect.objectContaining({
                atomId:
                  "husband.door.approach_decides_all_consequences",
                status: "rejected",
              }),
              expect.objectContaining({
                atomId: "husband.door.narrow_gap_can_end",
                status: "accepted",
              }),
              expect.objectContaining({
                atomId: "husband.door.uncertain_sequence",
                status: "weakened",
              }),
            ]),
          },
        },
      },
    ]);
    expect(controller.snapshot().interaction).toMatchObject({
      conversationStatus: "idle",
      messages: [
        {
          speaker: "player",
          text: "What if you opened it only a little and then walked away?",
        },
        {
          speaker: "persona",
          text:
            "I can turn the handle, open only a narrow gap, and then walk away.",
        },
      ],
      availableActionOptionIds: ["open-door-a-crack"],
    });

    await controller.dispatch({
      type: "select_action_option",
      optionId: "open-door-a-crack",
    });

    expect(willingnessRequests).toMatchObject([
      {
        actorId: "husband",
        action: {
          actionId: "open_door_a_crack",
          variants: [
            {
              variantId: "open_narrow_gap",
            },
          ],
        },
      },
    ]);
    expect(controller.snapshot().world.intentions).toEqual([
      { actorId: "husband", actionId: "open_door_a_crack" },
    ]);
    expect(controller.snapshot().interaction.availableActionOptionIds).toEqual(
      [],
    );
  });

  it("LDO-CH1-008 LDO-CH1-009 LDO-HPT-001 LDO-HPT-003 completes both conversational Actions through neutral observed Evidence", async () => {
    const personaRequests: PersonaTurnRequest[] = [];
    const personaReplies = [
      "I can open only a narrow gap and then walk away.",
      "I can remain at the threshold for one breath without touching anything.",
    ];
    const ports: { persona: PersonaPort; actionJudge: ActionJudgePort } = {
      persona: {
        async takeTurn(request) {
          personaRequests.push(structuredClone(request));
          return {
            reply: personaReplies[personaRequests.length - 1]!,
            shouldEndConversation: false,
          };
        },
      },
      actionJudge: {
        async judgeMindStateTransition(request) {
          return request.actorId === "husband"
            ? {
                transitions: [
                  {
                    atomId:
                      "husband.door.approach_decides_all_consequences",
                    fromStatus: "held",
                    toStatus: "rejected",
                    supportingPersonaSourceIds: [request.personaReply.sourceId],
                  },
                  {
                    atomId: "husband.door.narrow_gap_can_end",
                    fromStatus: "unavailable",
                    toStatus: "accepted",
                    supportingPersonaSourceIds: [request.personaReply.sourceId],
                  },
                ],
                unmodeledShiftNote: null,
              }
            : {
                transitions: [
                  {
                    atomId:
                      "wife.room.approach_initiates_shared_transition",
                    fromStatus: "held",
                    toStatus: "questioned",
                    supportingPersonaSourceIds: [request.personaReply.sourceId],
                  },
                  {
                    atomId:
                      "wife.room.presence_can_remain_non_interpretive",
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
        async judgeWillingness(request) {
          return {
            actionId: request.action.actionId,
            decision: "accept" as const,
            selectedVariantId: request.action.variants[0]!.variantId,
          };
        },
      },
    };
    const controller = createControllerAtChapterDay2Handle(ports);

    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    await controller.dispatch({
      type: "submit_dialogue",
      text: "Could you leave this moment undecided?",
    });
    await controller.dispatch({
      type: "select_action_option",
      optionId: "open-door-a-crack",
    });

    controller.dispatch({ type: "resume_world" });
    controller.advanceTo(3 * DAY + 8 * 60 + 20);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "wife" });
    await controller.dispatch({
      type: "submit_dialogue",
      text: "Could you stay here for only one breath?",
    });

    expect(personaRequests[1]).toMatchObject({
      actorId: "wife",
      observedEvidence: expect.arrayContaining([
        expect.objectContaining({
          description:
            "The door at the end of the hallway is slightly open.",
        }),
      ]),
    });
    expect(controller.snapshot().interaction.availableActionOptionIds).toEqual([
      "wait-at-threshold",
    ]);

    await controller.dispatch({
      type: "select_action_option",
      optionId: "wait-at-threshold",
    });
    controller.dispatch({ type: "resume_world" });
    controller.advanceTo(3 * DAY + 8 * 60 + 21);

    expect(controller.snapshot().world.completedActions).toEqual([
      { actorId: "husband", actionId: "interact_with_living_room_clock" },
      { actorId: "husband", actionId: "open_door_a_crack" },
      { actorId: "wife", actionId: "remain_at_threshold" },
    ]);
    expect(renderWorldText(projectGame(controller.snapshot()).world)).toContain(
      "08:21 — Hallway — She remains at the threshold.",
    );
  });
});

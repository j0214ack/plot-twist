import { describe, expect, it } from "vitest";
import {
  createConversationalVerticalSliceGameController,
  VerticalSliceGameController,
} from "./controller";
import type {
  ConversationPorts,
  PersonaTurnRequest,
  PersonaTurnResult,
} from "./conversation";
import { projectGame } from "./presentation";
import { renderUIText } from "./text-rendering";
import { createVerticalSliceWorld, type NPCId } from "./world";
import {
  createChapterOneMindState,
  type MindStateTransition,
} from "./mind-state";

const DAY = 24 * 60;

function createWorldAfterClockTutorial() {
  const world = createVerticalSliceWorld({
    ambientChoice: { choose: () => null },
  });
  world.advanceTo(7 * 60 + 57);
  world.pause();
  world.commitNarrativeAction("husband", "interact_with_living_room_clock");
  world.resume();
  world.advanceTo(7 * 60 + 59);
  return world;
}

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const noMindStateTransitions = async () => ({
  transitions: [] as MindStateTransition[],
  unmodeledShiftNote: null,
});

describe("conversational Controller request state", () => {
  it("LDO-CH1-007 supplies distinct stable Character Cores separately from scene MindState", async () => {
    const requests: PersonaTurnRequest[] = [];
    const ports: ConversationPorts = {
      persona: {
        async takeTurn(request) {
          requests.push(request);
          return {
            reply: "I am staying with what is physically here.",
            shouldEndConversation: false,
          };
        },
      },
      actionJudge: {
        judgeMindStateTransition: noMindStateTransitions,
        async judgeAwareness(request) {
          return {
            judgments: request.actions.map(({ actionId }) => ({
              actionId,
              awareness: "latent" as const,
            })),
          };
        },
        async judgeWillingness() {
          throw new Error("Willingness should not run");
        },
      },
    };

    const husbandController =
      createConversationalVerticalSliceGameController(ports);
    husbandController.advanceTo(7 * 60 + 57);
    husbandController.dispatch({ type: "pause_world" });
    husbandController.dispatch({ type: "select_npc", npcId: "husband" });
    await husbandController.dispatch({
      type: "submit_dialogue",
      text: "What do you notice first?",
    });

    const wifeController = new VerticalSliceGameController(
      createWorldAfterClockTutorial(),
      ports,
    );
    wifeController.advanceTo(DAY + 8 * 60 + 20);
    wifeController.dispatch({ type: "pause_world" });
    wifeController.dispatch({ type: "select_npc", npcId: "wife" });
    await wifeController.dispatch({
      type: "submit_dialogue",
      text: "What do you notice first?",
    });

    expect(requests[0]!.characterCore).toMatchObject({
      coreId: "husband",
      attentionPriorities: expect.arrayContaining([
        expect.stringContaining("mechanisms"),
      ]),
      failureMode: expect.stringContaining("consequence lock"),
      voiceTendencies: expect.arrayContaining([
        expect.stringContaining("Concrete and economical"),
      ]),
    });
    expect(requests[1]!.characterCore).toMatchObject({
      coreId: "wife",
      attentionPriorities: expect.arrayContaining([
        expect.stringContaining("placement and absence"),
      ]),
      failureMode: expect.stringContaining("permission lock"),
      voiceTendencies: expect.arrayContaining([
        expect.stringContaining("Relational and spatial"),
      ]),
    });
    expect(requests[0]!.characterCore).not.toEqual(
      requests[1]!.characterCore,
    );
    expect(requests[0]!.mindState.atoms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          atomId: "husband.clock.deliberate_change_effort",
          status: "active",
        }),
      ]),
    );
    expect(JSON.stringify(requests.map(({ characterCore }) => characterCore))).not.toMatch(
      /open_door_a_crack|remain_at_threshold|open_room_window|step_inside_room|preferred solution|future effect/i,
    );
  });

  it("LDO-CH1-001 LDO-CH1-007 initializes Chapter 1 psychology without carrying tutorial-specific pressure", async () => {
    const requests: PersonaTurnRequest[] = [];
    const ports: ConversationPorts = {
      persona: {
        async takeTurn(request) {
          requests.push(structuredClone(request));
          return requests.length === 1
            ? {
                reply: "I can correct the clock and stop there.",
                shouldEndConversation: false,
              }
            : {
                reply: "The closed door begins a different sequence.",
                shouldEndConversation: false,
              };
        },
      },
      actionJudge: {
        judgeMindStateTransition: noMindStateTransitions,
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
    const controller = createConversationalVerticalSliceGameController(ports);

    controller.advanceTo(7 * 60 + 57);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    await controller.dispatch({
      type: "submit_dialogue",
      text: "Could the clock be one bounded correction?",
    });
    await controller.dispatch({
      type: "select_action_option",
      optionId: "spend-time-with-clock",
    });
    controller.dispatch({ type: "resume_world" });
    controller.advanceTo(DAY + 8 * 60 + 20);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    await controller.dispatch({
      type: "submit_dialogue",
      text: "What makes you turn before the door?",
    });

    expect(requests[1]!.mindState).toEqual(
      createChapterOneMindState("husband"),
    );
  });

  it("LDO-CH1-005 preserves Day 1 psychological movement at the Day 2 handle instead of resetting it", async () => {
    const requests: PersonaTurnRequest[] = [];
    const ports: ConversationPorts = {
      persona: {
        async takeTurn(request) {
          requests.push(structuredClone(request));
          return requests.length === 1
            ? {
                reply: "Walking to the handle can stop before turning it.",
                shouldEndConversation: false,
              }
            : {
                reply: "The first separation still holds.",
                shouldEndConversation: false,
              };
        },
      },
      actionJudge: {
        async judgeMindStateTransition(request) {
          return requests.length === 1
            ? {
                transitions: [
                  {
                    atomId: "husband.door.approach_can_end_at_handle",
                    fromStatus: "unavailable",
                    toStatus: "considered",
                    supportingPersonaSourceIds: [request.personaReply.sourceId],
                  },
                  {
                    atomId: "husband.door.uncertain_sequence",
                    fromStatus: "active",
                    toStatus: "weakened",
                    supportingPersonaSourceIds: [request.personaReply.sourceId],
                  },
                ],
                unmodeledShiftNote: null,
              }
            : noMindStateTransitions();
        },
        async judgeAwareness(request) {
          return {
            judgments: request.actions.map(({ actionId }) => ({
              actionId,
              awareness: "latent" as const,
            })),
          };
        },
        async judgeWillingness() {
          throw new Error("Willingness should not run");
        },
      },
    };
    const controller = new VerticalSliceGameController(
      createWorldAfterClockTutorial(),
      ports,
    );

    controller.advanceTo(DAY + 8 * 60 + 20);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    await controller.dispatch({
      type: "submit_dialogue",
      text: "Could reaching it be a separate step?",
    });
    controller.dispatch({ type: "resume_world" });
    controller.advanceTo(2 * DAY + 8 * 60 + 10);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    await controller.dispatch({
      type: "submit_dialogue",
      text: "What remains difficult now?",
    });

    expect(requests[1]!.mindState.atoms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          atomId: "husband.door.approach_can_end_at_handle",
          status: "considered",
        }),
        expect.objectContaining({
          atomId: "husband.door.uncertain_sequence",
          status: "weakened",
        }),
      ]),
    );
  });

  it("LDO-CH1-007 LDO-CH1-008 gives the Day 2 handle moment its consequence-lock scene pressure", async () => {
    const world = createVerticalSliceWorld();
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(7 * 60 + 59);

    let personaRequest: PersonaTurnRequest | undefined;
    const ports: ConversationPorts = {
      persona: {
        async takeTurn(request) {
          personaRequest = request;
          return {
            reply: "My hand reaching it is not the same as moving it.",
            shouldEndConversation: false,
          };
        },
      },
      actionJudge: {
        judgeMindStateTransition: noMindStateTransitions,
        async judgeAwareness(request) {
          expect(request.actions).toEqual([
            expect.objectContaining({ actionId: "open_door_a_crack" }),
          ]);
          return {
            judgments: request.actions.map(({ actionId }) => ({
              actionId,
              awareness: "latent" as const,
            })),
          };
        },
        async judgeWillingness() {
          throw new Error("Willingness should not run");
        },
      },
    };
    const controller = new VerticalSliceGameController(world, ports);

    controller.advanceTo(2 * 24 * 60 + 8 * 60 + 10);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    await controller.dispatch({
      type: "submit_dialogue",
      text: "Does touching it decide everything that follows?",
    });

    expect(personaRequest).toMatchObject({
      actorId: "husband",
      characterCore: { coreId: "husband" },
      moment: {
        time: 2 * 24 * 60 + 8 * 60 + 10,
        locationId: "hallway",
        visibleActivityId: "reaching_closed_door_handle",
      },
      mindState: {
        atoms: expect.arrayContaining([
          expect.objectContaining({
            atomId: "husband.door.approach_decides_all_consequences",
            status: "held",
          }),
          expect.objectContaining({
            atomId: "husband.door.narrow_gap_can_end",
            status: "unavailable",
          }),
          expect.objectContaining({
            atomId: "husband.door.uncertain_sequence",
            status: "active",
          }),
        ]),
      },
    });
  });

  it("LDO-CH1-006 bounds each spouse to five replies per Chapter day and resets the visible conversation next day", async () => {
    const world = createVerticalSliceWorld();
    const day = 24 * 60;
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(day + 8 * 60 + 20);

    const calls: NPCId[] = [];
    const requests: PersonaTurnRequest[] = [];
    const ports: ConversationPorts = {
      persona: {
        async takeTurn(request) {
          calls.push(request.actorId);
          requests.push(structuredClone(request));
          return {
            reply: `Reply ${calls.length}`,
            shouldEndConversation: false,
          };
        },
      },
      actionJudge: {
        async judgeMindStateTransition(request) {
          return calls.length === 1
            ? {
                transitions: [
                  {
                    atomId: "husband.door.approach_can_end_at_handle",
                    fromStatus: "unavailable",
                    toStatus: "considered",
                    supportingPersonaSourceIds: [request.personaReply.sourceId],
                  },
                ],
                unmodeledShiftNote: null,
              }
            : noMindStateTransitions();
        },
        async judgeAwareness(request) {
          return {
            judgments: request.actions.map(({ actionId }) => ({
              actionId,
              awareness: "latent" as const,
            })),
          };
        },
        async judgeWillingness() {
          throw new Error("Willingness should not run");
        },
      },
    };
    const controller = new VerticalSliceGameController(world, ports);
    controller.advanceTo(day + 8 * 60 + 20);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    for (let turn = 1; turn <= 5; turn += 1) {
      await controller.dispatch({
        type: "submit_dialogue",
        text: `Husband turn ${turn}`,
      });
    }

    expect(controller.snapshot().interaction.conversationStatus).toBe(
      "closed_for_day",
    );
    expect(renderUIText(projectGame(controller.snapshot()).ui)).toContain(
      "Husband has no more to add today. Observe the household or use /resume.",
    );
    await expect(
      controller.dispatch({
        type: "submit_dialogue",
        text: "A sixth turn",
      }),
    ).rejects.toThrow("Conversation is closed for husband today");
    expect(calls.filter((actorId) => actorId === "husband")).toHaveLength(5);

    controller.dispatch({ type: "select_npc", npcId: "wife" });
    expect(controller.snapshot().interaction.conversationStatus).toBe("idle");
    await controller.dispatch({
      type: "submit_dialogue",
      text: "Wife still has her own conversation.",
    });
    expect(calls.at(-1)).toBe("wife");

    controller.dispatch({ type: "resume_world" });
    controller.advanceTo(2 * day + 8 * 60 + 10);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    expect(controller.snapshot().interaction).toMatchObject({
      conversationStatus: "idle",
      messages: [],
    });
    await controller.dispatch({
      type: "submit_dialogue",
      text: "The next day's first turn.",
    });
    expect(calls.filter((actorId) => actorId === "husband")).toHaveLength(6);
    expect(requests.at(-1)!.mindState.atoms).toContainEqual(
      expect.objectContaining({
        atomId: "husband.door.approach_can_end_at_handle",
        status: "considered",
      }),
    );
  });

  it("LDO-CH1-008 LDO-HPT-005 keeps the paused semantic moment stable while a Persona request is pending", async () => {
    const personaTurn = deferred<PersonaTurnResult>();
    const ports: ConversationPorts = {
      persona: {
        takeTurn: () => personaTurn.promise,
      },
      actionJudge: {
        judgeMindStateTransition: noMindStateTransitions,
        async judgeAwareness(request) {
          return {
            judgments: request.actions.map(({ actionId }) => ({
              actionId,
              awareness: "latent" as const,
            })),
          };
        },
        async judgeWillingness() {
          throw new Error("Willingness should not run");
        },
      },
    };
    const controller = new VerticalSliceGameController(
      createWorldAfterClockTutorial(),
      ports,
    );
    controller.advanceTo(2 * DAY + 8 * 60 + 10);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });

    const request = controller.dispatch({
      type: "submit_dialogue",
      text: "Could this moment remain undecided?",
    });

    expect(controller.snapshot().interaction).toMatchObject({
      conversationStatus: "awaiting_persona",
      selectedNpcId: "husband",
      messages: [
        {
          speaker: "player",
          text: "Could this moment remain undecided?",
        },
      ],
    });
    expect(() => controller.dispatch({ type: "resume_world" })).toThrow(
      "Interaction is pending",
    );
    expect(() =>
      controller.dispatch({ type: "select_npc", npcId: "wife" }),
    ).toThrow("Interaction is pending");
    expect(controller.snapshot()).toMatchObject({
      world: { time: 2 * DAY + 8 * 60 + 10, paused: true },
      interaction: { selectedNpcId: "husband" },
    });

    personaTurn.resolve({
      reply: "I still cannot move my hand.",
      shouldEndConversation: false,
    });
    await request;

    expect(controller.snapshot().interaction.conversationStatus).toBe("idle");
  });

  it("LDO-CH1-008 LDO-HPT-003 rejects an unprovided willingness variant without creating an intention", async () => {
    const ports: ConversationPorts = {
      persona: {
        async takeTurn() {
          return {
            reply: "I can open only a narrow gap and walk away.",
            shouldEndConversation: false,
          };
        },
      },
      actionJudge: {
        judgeMindStateTransition: noMindStateTransitions,
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
            selectedVariantId: "invented_variant",
          };
        },
      },
    };
    const controller = new VerticalSliceGameController(
      createWorldAfterClockTutorial(),
      ports,
    );
    controller.advanceTo(2 * DAY + 8 * 60 + 10);
    controller.dispatch({ type: "pause_world" });
    controller.dispatch({ type: "select_npc", npcId: "husband" });
    await controller.dispatch({ type: "submit_dialogue", text: "Could you?" });

    await expect(
      controller.dispatch({
        type: "select_action_option",
        optionId: "open-door-a-crack",
      }),
    ).rejects.toThrow("Willingness returned an invalid Action result");

    expect(controller.snapshot()).toMatchObject({
      world: { intentions: [] },
      interaction: {
        conversationStatus: "error",
        errorMessage: "The action could not be considered.",
      },
    });
    expect(JSON.stringify(projectGame(controller.snapshot()).ui)).not.toContain(
      "invented_variant",
    );
  });
});

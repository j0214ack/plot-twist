import { describe, expect, it } from "vitest";
import {
  createConversationalVerticalSliceGameController,
  createVerticalSliceGameController,
} from "./controller";
import type { ConversationPorts } from "./conversation";
import { TerminalPlaySession } from "./terminal-play-session";

describe("Leave the Door Open terminal play session", () => {
  it("LDO-OBS-008 reports a swallowed interaction failure only to the observer", async () => {
    const outputs: string[] = [];
    const observerErrors: unknown[] = [];
    const ports: ConversationPorts = {
      persona: {
        async takeTurn() {
          throw new Error("diagnostic sentinel");
        },
      },
      actionJudge: {
        async judgeMindStateTransition() {
          throw new Error("Not exercised");
        },
        async judgeAwareness() {
          throw new Error("Not exercised");
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      },
    };
    const session = new TerminalPlaySession(
      createConversationalVerticalSliceGameController(ports),
      (screen) => outputs.push(screen),
      (error) => observerErrors.push(error),
    );
    await session.start();

    await session.handleInput("What changed today?");

    expect(observerErrors).toEqual([
      expect.objectContaining({ message: "diagnostic sentinel" }),
    ]);
    expect(outputs.at(-1)).toContain("The conversation could not continue.");
    expect(outputs.at(-1)).not.toContain("diagnostic sentinel");
  });

  it("LDO-LOCAL-008 explains the opening mental model without revealing an Action", async () => {
    const outputs: string[] = [];
    const unusedPorts: ConversationPorts = {
      persona: {
        async takeTurn() {
          throw new Error("Not exercised");
        },
      },
      actionJudge: {
        async judgeMindStateTransition() {
          throw new Error("Not exercised");
        },
        async judgeAwareness() {
          throw new Error("Not exercised");
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      },
    };
    const session = new TerminalPlaySession(
      createConversationalVerticalSliceGameController(unusedPorts),
      (screen) => outputs.push(screen),
    );

    await session.start();

    expect(outputs.at(-1)).toContain(
      "You are a voice inside a stuck character's self-talk.",
    );
    expect(outputs.at(-1)).toContain("You cannot control their body.");
    expect(outputs.at(-1)).toContain(
      "Your goal: Help this household begin moving again",
    );
    expect(outputs.at(-1)).toContain("Start here:");
    expect(outputs.at(-1)).toContain(
      "07:57 — Living room — The wall clock shows 07:54.",
    );
    expect(outputs.at(-1)).toContain(
      "He looks up, starts to pass beneath it, then stops.",
    );
    expect(outputs.at(-1)).toContain(
      'Try: "What made those three minutes worth stopping for today?"',
    );
    expect(outputs.at(-1)).toContain(
      'Or: "What do you notice when you let yourself look at it?"',
    );
    expect(outputs.at(-1)).not.toContain("Why did you stop here?");
    expect(outputs.at(-1)).toContain("No exact phrase is required.");
    expect(outputs.at(-1)).toContain(
      "Use /resume only after you select a numbered Possibility and the screen says an intention has formed.",
    );
    expect(outputs.at(-1)).not.toContain("Leave the door as it is.");
    expect(outputs.at(-1)).not.toContain("Spend a moment with the clock.");
    expect(outputs.at(-1)).not.toContain(
      "Remain at the threshold for one breath.",
    );

    await session.handleInput("/help");

    expect(outputs.at(-1)).toContain(
      "Your goal: Help this household begin moving again",
    );
    expect(outputs.at(-1)).toContain(
      'Try: "What made those three minutes worth stopping for today?"',
    );
    expect(outputs.at(-1)).toContain(
      "Use /resume only after you select a numbered Possibility and the screen says an intention has formed.",
    );

    await session.handleInput("1");
    expect(outputs.at(-1)).toContain(
      "No numbered Possibility is available yet.",
    );
    expect(outputs.at(-1)).toContain(
      "Keep talking with the Husband about what feels possible with the clock today.",
    );

    await session.handleInput("/focus wife");
    expect(outputs.at(-1)).toContain(
      "During Three Minutes, focus stays with the Husband.",
    );
    expect(outputs.at(-1)).toContain("Focus: Husband");
    expect(outputs.at(-1)).not.toContain("Focus: Wife");
  });

  it("LDO-CH1-001 LDO-CH1-002 LDO-CH1-003 LDO-CH1-004 enters the next-morning chapter opening before player-selected focus", async () => {
    const outputs: string[] = [];
    const personaReplies = [
      "I could spend less time fixing it than I have spent noticing it.",
    ];
    let personaCall = 0;
    const ports: ConversationPorts = {
      persona: {
        async takeTurn() {
          const reply = personaReplies[personaCall++]!;
          return {
            reply,
            shouldEndConversation: false,
          };
        },
      },
      actionJudge: {
        async judgeMindStateTransition(request) {
          return {
            transitions: [
              {
                atomId: "husband.clock.deliberate_change_effort",
                fromStatus: "active",
                toStatus: "resolved",
                supportingPersonaSourceIds: [request.personaReply.sourceId],
              },
              {
                atomId: "husband.clock.bounded_adjustment",
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
    const controller = createConversationalVerticalSliceGameController(ports);
    const session = new TerminalPlaySession(controller, (screen) => {
      outputs.push(screen);
    });

    await session.start();
    expect(outputs.at(-1)).toContain("07:57 — The world pauses.");
    expect(outputs.at(-1)).toContain("Focus: Husband");
    expect(outputs.at(-1)).not.toContain("Possibilities:");

    await session.handleInput("What made those three minutes worth stopping for today?");
    expect(outputs).toContainEqual(expect.stringContaining("Inner voice is responding…"));
    expect(outputs.at(-1)).toContain(
      "Husband: I could spend less time fixing it than I have spent noticing it.",
    );
    expect(outputs.at(-1)).toContain("1. Spend a moment with the clock.");

    await session.handleInput("1");
    expect(controller.snapshot().world.intentions).toEqual([
      { actorId: "husband", actionId: "interact_with_living_room_clock" },
    ]);
    expect(outputs.at(-1)).toContain(
      "An intention has formed. Type /resume to let the world continue.",
    );

    await session.handleInput("/resume");
    expect(controller.snapshot()).toMatchObject({
      world: {
        time: 24 * 60 + 8 * 60 + 20,
        chapter: 1,
        chapterDay: 1,
        paused: true,
        worldFacts: {
          livingRoomClock: "accurate",
          hallwayDoor: "closed",
        },
        evidence: {
          living_room_clock_is_accurate: { observedBy: ["wife"] },
        },
      },
      interaction: { selectedNpcId: null },
    });
    expect(outputs.at(-1)).toContain("The clock now shows 07:59.");
    expect(outputs.at(-1)).toContain("Chapter 1 — The End of the Hall");
    expect(outputs.at(-1)).toContain("Day 1 — Morning");
    expect(outputs.at(-1)).toContain(
      "Here, movement may take more than one conversation or one day.",
    );
    expect(outputs.at(-1)).toContain(
      "08:10 — Hallway — He walks down the hallway, slowing before the fully closed door. He turns back without reaching it.",
    );
    expect(outputs.at(-1)).toContain(
      "08:20 — Hallway — She starts into the hallway, stops near its entrance, and returns to the dining area by the longer route.",
    );
    expect(outputs.at(-1)).toContain("08:20 — The world pauses.");
    expect(outputs.at(-1)).toContain(
      "Choose whose inner thoughts to enter: /focus husband or /focus wife.",
    );
    expect(outputs.at(-1)).not.toContain("Focus: Husband");
    expect(outputs.at(-1)).not.toContain("Open the door just a little.");

    await session.handleInput("/focus wife");

    expect(controller.snapshot().interaction.selectedNpcId).toBe("wife");
    expect(outputs.at(-1)).toContain("Focus: Wife");
  });

  it("LDO-CH1-005 LDO-CH1-008 resumes without an intention into a changed Day 2 routine cue", async () => {
    const outputs: string[] = [];
    const controller = createVerticalSliceGameController();
    const session = new TerminalPlaySession(controller, (screen) => {
      outputs.push(screen);
    });

    await session.start();
    await session.handleInput("1");
    await session.handleInput("/resume");
    await session.handleInput("/focus husband");

    const result = await session.handleInput("/resume");

    expect(result).toEqual({ ended: false });
    expect(controller.snapshot()).toMatchObject({
      world: {
        time: 2 * 24 * 60 + 8 * 60 + 10,
        chapter: 1,
        chapterDay: 2,
        paused: true,
        worldFacts: { hallwayDoor: "closed" },
        intentions: [],
      },
      interaction: { selectedNpcId: null },
    });
    expect(controller.snapshot().world.completedActions).not.toContainEqual({
      actorId: "husband",
      actionId: "open_door_a_crack",
    });
    expect(outputs.at(-1)).toContain(
      "08:10 — Hallway — This time he does not turn back. He reaches the closed door and rests his hand on the handle without moving it.",
    );
    expect(outputs.at(-1)).toContain(
      "No Possibility was chosen, so no action was scheduled.",
    );
    expect(outputs.at(-1)).toContain(
      "Anything established in conversation remains.",
    );
    expect(outputs.at(-1)).toContain(
      "Choose whose inner thoughts to enter: /focus husband or /focus wife.",
    );

    await session.handleInput("/help");
    expect(outputs.at(-1)).toContain(
      "Current thread: Watch what each person does when their route reaches the hall.",
    );
    expect(outputs.at(-1)).toContain("/focus husband or /focus wife");
    expect(outputs.at(-1)).not.toContain(
      "What made those three minutes worth stopping for today?",
    );
  });

  it("LDO-CH1-008 LDO-CH1-009 LDO-CH1-010 LDO-CH1-012 completes the deterministic five-day Chapter 1 path", async () => {
    const outputs: string[] = [];
    const controller = createVerticalSliceGameController();
    const session = new TerminalPlaySession(controller, (screen) => {
      outputs.push(screen);
    });
    const day = 24 * 60;

    await session.start();
    await session.handleInput("1");
    await session.handleInput("/resume");
    await session.handleInput("/resume");

    expect(controller.snapshot().world).toMatchObject({
      time: 2 * day + 8 * 60 + 10,
      chapterDay: 2,
      paused: true,
    });
    await session.handleInput("/focus husband");
    expect(outputs.at(-1)).toContain("1. Open the door just a little.");
    await session.handleInput("1");
    await session.handleInput("/resume");

    expect(controller.snapshot().world).toMatchObject({
      time: 2 * day + 17 * 60 + 40,
      chapterDay: 2,
      paused: true,
      worldFacts: {
        hallwayDoor: "slightly_open",
        wifeObservedDoorOnChapterDay: 2,
      },
      evidence: {
        door_is_slightly_open: { observedBy: ["wife"] },
      },
    });
    expect(outputs.at(-1)).toContain(
      "17:40 — Hallway — She notices the narrow gap and stops away from the threshold without touching the door.",
    );

    await session.handleInput("/resume");
    expect(controller.snapshot().world).toMatchObject({
      time: 3 * day + 8 * 60 + 20,
      chapterDay: 3,
      paused: true,
    });
    await session.handleInput("/focus wife");
    expect(outputs.at(-1)).toContain(
      "1. Remain at the threshold for one breath.",
    );
    await session.handleInput("1");
    await session.handleInput("/resume");

    expect(controller.snapshot().world).toMatchObject({
      time: 4 * day + 8 * 60 + 20,
      chapterDay: 4,
      paused: true,
      worldFacts: { wifeHasRemainedAtThreshold: true },
    });
    await session.handleInput("/focus wife");
    expect(outputs.at(-1)).toContain(
      "1. Step across the threshold, then step back.",
    );
    await session.handleInput("1");
    await session.handleInput("/resume");

    expect(controller.snapshot().world).toMatchObject({
      time: 5 * day + 8 * 60 + 20,
      chapterDay: 5,
      paused: true,
      worldFacts: {
        roomInterior: "revealed",
        wifeHasEnteredRoom: true,
      },
    });
    await session.handleInput("/focus wife");
    expect(outputs.at(-1)).toContain("1. Open the window a little.");
    await session.handleInput("1");
    const result = await session.handleInput("/resume");

    expect(result).toEqual({ ended: true });
    expect(controller.snapshot().world).toMatchObject({
      time: 5 * day + 8 * 60 + 21,
      chapterDay: 5,
      worldFacts: {
        roomWindow: "open_one_hand_width",
        chapter1Complete: true,
      },
      evidence: {
        room_window_is_open: { observedBy: [] },
      },
      intentions: [],
    });
    expect(outputs.at(-1)).toContain("Chapter 1 complete.");
    expect(outputs.at(-1)).toContain(
      "The room's window is open one hand-width.",
    );
  });

  it.each([
    {
      decision: "defer" as const,
      expected:
        "He can picture doing this, but he is not ready to act on it. Keep talking.",
    },
    {
      decision: "refuse" as const,
      expected: "He refuses this step for now. Try another approach.",
    },
  ])("LDO-LOCAL-009 explains a $decision result instead of looking like an ignored input", async ({
    decision,
    expected,
  }) => {
    const outputs: string[] = [];
    const ports: ConversationPorts = {
      persona: {
        async takeTurn() {
          return {
            reply:
              "I can let the possibility belong to me, but I am not ready to choose the movement.",
            shouldEndConversation: false,
          };
        },
      },
      actionJudge: {
        async judgeMindStateTransition(request) {
          return {
            transitions: [
              {
                atomId: "husband.clock.bounded_adjustment",
                fromStatus: "unavailable",
                toStatus: "considered",
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
            decision,
            selectedVariantId: null,
          };
        },
      },
    };
    const controller = createConversationalVerticalSliceGameController(ports);
    const session = new TerminalPlaySession(controller, (screen) =>
      outputs.push(screen),
    );
    await session.start();
    await session.handleInput("Could this small change belong to you today?");

    await session.handleInput("1");

    expect(controller.snapshot().world.intentions).toEqual([]);
    expect(outputs.at(-1)).toContain(expected);
    expect(outputs.at(-1)).not.toMatch(
      /\bdefer\b|\brefuse\b|\bintention\b|interact_with_living_room_clock|accepted_clock_interaction|Judge/i,
    );
  });

  it("LDO-LOCAL-006 does not advance past a decision point without an intention", async () => {
    const outputs: string[] = [];
    const unreachablePorts: ConversationPorts = {
      persona: {
        async takeTurn() {
          throw new Error("Not exercised");
        },
      },
      actionJudge: {
        async judgeMindStateTransition() {
          throw new Error("Not exercised");
        },
        async judgeAwareness() {
          throw new Error("Not exercised");
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      },
    };
    const controller = createConversationalVerticalSliceGameController(
      unreachablePorts,
    );
    const session = new TerminalPlaySession(controller, (screen) => {
      outputs.push(screen);
    });
    await session.start();

    const result = await session.handleInput("/resume");

    expect(result).toEqual({ ended: false });
    expect(controller.snapshot().world).toMatchObject({
      time: 7 * 60 + 57,
      paused: true,
      intentions: [],
    });
    expect(outputs.at(-1)).toContain("No world intention has formed.");
    expect(outputs.at(-1)).toContain(
      "Something discussed in conversation is not executable yet.",
    );
    expect(outputs.at(-1)).toContain(
      "Continue until a numbered Possibility appears, then select it before using /resume.",
    );
  });
});

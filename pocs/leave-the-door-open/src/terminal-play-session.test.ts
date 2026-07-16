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
      "You are a voice inside Martin's self-talk.",
    );
    expect(outputs.at(-1)).toContain("Martin notices it most mornings");
    expect(outputs.at(-1)).not.toMatch(
      /\bElise\b|\bWife\b|household|each person|other inner voices/i,
    );
    expect(outputs.at(-1)).toContain("You cannot control his body.");
    expect(outputs.at(-1)).toContain(
      "Your goal: Help Martin discover a next step",
    );
    expect(outputs.at(-1)).toContain("Start here:");
    expect(outputs.at(-1)).toContain(
      "07:57 — Living room — The wall clock shows 07:54.",
    );
    expect(outputs.at(-1)).not.toContain("Focus:");
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
      "You can let time continue now to observe, or wait until an intention forms to change the world.",
    );
    expect(outputs.at(-1)).not.toContain("Leave the door as it is.");
    expect(outputs.at(-1)).not.toContain("Spend a moment with the clock.");
    expect(outputs.at(-1)).not.toContain(
      "Remain at the threshold for one breath.",
    );

    await session.handleInput("/help");

    expect(outputs.at(-1)).toContain(
      "Your goal: Help Martin discover a next step",
    );
    expect(outputs.at(-1)).toContain(
      'Try: "What made those three minutes worth stopping for today?"',
    );
    expect(outputs.at(-1)).toContain(
      "You can let time continue now to observe, or wait until an intention forms to change the world.",
    );
    expect(outputs.at(-1)).not.toMatch(
      /\bElise\b|\bWife\b|household|each person|other inner voices/i,
    );

    await session.handleInput("1");
    expect(outputs.at(-1)).toContain(
      "No numbered Possibility is available yet.",
    );
    expect(outputs.at(-1)).toContain(
      "Keep talking with Martin about what feels possible with the clock today.",
    );

    await session.handleInput("/focus elise");
    expect(outputs.at(-1)).toContain(
      "That inner voice is not available here. You are hearing Martin's thoughts.",
    );
    expect(outputs.at(-1)).not.toContain("Focus:");
    expect(outputs.at(-1)).not.toMatch(
      /\bElise\b|\bWife\b|household|each person|other inner voices/i,
    );
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
    expect(outputs.at(-1)).not.toContain("Focus:");
    expect(outputs.at(-1)).not.toContain("Possibilities:");

    await session.handleInput("What made those three minutes worth stopping for today?");
    expect(outputs).toContainEqual(expect.stringContaining("Inner voice is responding…"));
    expect(outputs.at(-1)).toContain(
      "Martin: I could spend less time fixing it than I have spent noticing it.",
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
      "Choose whose inner thoughts to enter: /focus martin or /focus elise.",
    );
    expect(outputs.at(-1)).not.toContain("Focus: Husband");
    expect(outputs.at(-1)).not.toContain("Open the door just a little.");

    await session.handleInput("/focus elise");

    expect(controller.snapshot().interaction.selectedNpcId).toBe("wife");
    expect(outputs.at(-1)).toContain("Focus: Elise");
  });

  it("LDO-CH1-005 LDO-CH1-008 LDO-CH1-016 resumes without an intention with the fixed-Possibility boundary", async () => {
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
      "No world intention formed, so no action was scheduled.",
    );
    expect(outputs.at(-1)).toContain(
      "Anything established in conversation remains.",
    );
    expect(outputs.at(-1)).toContain(
      "A character may discuss an idea even when it is not an available world action at this pause.",
    );
    expect(outputs.at(-1)).toContain(
      "Only numbered Possibilities can be selected as world actions; other conversation can still change how the character thinks.",
    );
    expect(outputs.at(-1)).toContain(
      "Choose whose inner thoughts to enter: /focus martin or /focus elise.",
    );
    expect(outputs.at(-1)).not.toMatch(
      /open_door_a_crack|remain_at_threshold|step_inside_room|open_room_window|\bJudge\b|\bsurfaced\b|\bdefer\b/i,
    );

    await session.handleInput("/help");
    expect(outputs.at(-1)).toContain(
      "Current thread: Watch what each person does when their route reaches the hall.",
    );
    expect(outputs.at(-1)).toContain(
      "A character may discuss an idea even when it is not an available world action at this pause.",
    );
    expect(outputs.at(-1)).toContain(
      "Only numbered Possibilities can be selected as world actions; other conversation can still change how the character thinks.",
    );
    expect(outputs.at(-1)).toContain("/focus martin or /focus elise");
    expect(outputs.at(-1)).not.toContain(
      "What made those three minutes worth stopping for today?",
    );
    expect(outputs.at(-1)).not.toMatch(
      /open_door_a_crack|remain_at_threshold|step_inside_room|open_room_window|\bJudge\b|\bsurfaced\b|\bdefer\b/i,
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
    await session.handleInput("/focus martin");
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
        "He can consider this, but has not chosen to do it now. Ask what still separates considering it from choosing it today.",
    },
    {
      decision: "refuse" as const,
      expected: "He refuses this step for now. Try another approach.",
    },
  ])("LDO-LOCAL-009 LDO-CH1-016 explains a $decision result instead of looking like an ignored input", async ({
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

  it("LDO-LOCAL-014 ADR 0021 treats first-input resume as repeatable observation while preserving controller progress", async () => {
    const outputs: string[] = [];
    const observationalPorts: ConversationPorts = {
      persona: {
        async takeTurn() {
          return {
            reply: "I notice it, even if I am not choosing anything yet.",
            shouldEndConversation: false,
          };
        },
      },
      actionJudge: {
        async judgeMindStateTransition() {
          return { transitions: [], unmodeledShiftNote: null };
        },
        async judgeAwareness(request) {
          return {
            judgments: request.actions.map(({ actionId }) => ({
              actionId,
              awareness: "faintly_imagined" as const,
            })),
          };
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      },
    };
    const controller = createConversationalVerticalSliceGameController(
      observationalPorts,
    );
    const session = new TerminalPlaySession(controller, (screen) => {
      outputs.push(screen);
    });
    await session.start();

    await session.handleInput("I want to watch what an ordinary day looks like.");
    const first = await session.handleInput("/resume");

    expect(first).toEqual({ ended: false });
    expect(controller.snapshot().world).toMatchObject({
      time: 24 * 60 + 7 * 60 + 57,
      paused: true,
      chapter: "tutorial",
      worldFacts: { livingRoomClock: "three_minutes_slow" },
      intentions: [],
      completedActions: [],
    });
    expect(controller.snapshot().interaction).toMatchObject({
      selectedNpcId: "husband",
      messages: [
        {
          speaker: "player",
          text: "I want to watch what an ordinary day looks like.",
        },
        {
          speaker: "persona",
          text: "I notice it, even if I am not choosing anything yet.",
        },
      ],
    });
    expect(outputs.at(-1)).toContain(
      "08:00 — Living room — He sits at the far end of the sofa.",
    );
    expect(outputs.at(-1)).toContain(
      "12:12 — Dining area — He rinses his cup, dries the ring beneath it, and leaves it upside down.",
    );
    expect(outputs.at(-1)).toContain(
      "18:40 — Living room — He folds the sofa throw into the same narrow rectangle.",
    );
    expect(outputs.at(-1)).toContain(
      "22:13 — Living room — He turns off the lamps one by one, leaving the clock visible until last.",
    );
    expect(outputs.at(-1)).not.toContain("She drinks a glass of water.");

    const second = await session.handleInput("/resume");

    expect(second).toEqual({ ended: false });
    expect(controller.snapshot().world).toMatchObject({
      time: 2 * 24 * 60 + 7 * 60 + 57,
      paused: true,
      chapter: "tutorial",
      intentions: [],
      completedActions: [],
    });
    expect(controller.snapshot().interaction.selectedNpcId).toBe("husband");
  });

  it.each([
    ["empty input", ""],
    ["help", "/help"],
    ["observe", "/resume"],
    ["current named voice", "/focus martin"],
    ["unavailable named voice", "/focus elise"],
    ["legacy current voice", "/focus husband"],
    ["legacy unavailable voice", "/focus wife"],
    ["unavailable number", "1"],
    ["ordinary dialogue", "What happens if I just watch for a while?"],
  ])(
    "LDO-LOCAL-014 ADR 0021 controller monkey smoke keeps the tutorial recoverable after %s",
    async (_label, input) => {
      const ports: ConversationPorts = {
        persona: {
          async takeTurn() {
            return { reply: "I can notice that.", shouldEndConversation: false };
          },
        },
        actionJudge: {
          async judgeMindStateTransition() {
            return { transitions: [], unmodeledShiftNote: null };
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
            throw new Error("No Possibility should be selectable");
          },
        },
      };
      const controller = createConversationalVerticalSliceGameController(ports);
      const session = new TerminalPlaySession(controller, () => undefined);
      await session.start();

      const result = await session.handleInput(input);
      const snapshot = controller.snapshot();

      expect(result).toEqual({ ended: false });
      expect(snapshot.world).toMatchObject({
        chapter: "tutorial",
        paused: true,
        worldFacts: { livingRoomClock: "three_minutes_slow" },
        intentions: [],
        completedActions: [],
      });
      expect(snapshot.world.time).toBeGreaterThanOrEqual(7 * 60 + 57);
    },
  );
});

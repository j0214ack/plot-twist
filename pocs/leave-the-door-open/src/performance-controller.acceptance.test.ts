import { describe, expect, it } from "vitest";
import {
  createConversationalVerticalSliceGameController,
  VerticalSliceGameController,
} from "./controller";
import type { ConversationPorts } from "./conversation";
import type {
  PerformanceRequest,
} from "./performance";
import { projectGame } from "./presentation";
import { renderWorldText } from "./text-rendering";
import { createVerticalSliceWorld } from "./world";

describe("bounded Performance Director orchestration", () => {
  // Spec: chapter-1.md LDO-CH1-021; ADR 0032 LDO-SOCIAL-003/004/006.
  it("gives Performance one authored spouse outcome and falls back when it exceeds the three-beat closure", async () => {
    const requests: PerformanceRequest[] = [];
    const world = createVerticalSliceWorld({
      ambientChoice: { choose: () => null },
    });
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(24 * 60 + 8 * 60 + 20);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "say_one_honest_thing_to_elise",
      { relationshipOutcomeId: "distance_acknowledged" },
    );
    world.resume();
    const controller = new VerticalSliceGameController(world, {
      persona: {
        async takeTurn() {
          throw new Error("No Persona should run during the spouse scene");
        },
      },
      actionJudge: {
        async judgeAwareness() {
          throw new Error("No Judge should run during the spouse scene");
        },
        async judgeWillingness() {
          throw new Error("No Judge should run during the spouse scene");
        },
      },
      performanceDirector: {
        async stage(request) {
          requests.push(structuredClone(request));
          return {
            beats: [
              "Generated opening.",
              "Generated reply.",
              "Generated ending.",
              "An unauthorized fourth exchange.",
            ],
          };
        },
      },
    });

    await controller.advanceToWithPerformance(24 * 60 + 20 * 60 + 15);

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      actorId: "husband",
      actorDisplayName: "Martin",
      recipientActors: [{ actorId: "wife", actorDisplayName: "Elise" }],
      semanticBehavior: {
        kind: "narrative_action",
        behaviorId: "say_one_honest_thing_to_elise",
        variantId: "one_honest_opening",
        relationshipOutcomeId: "distance_acknowledged",
      },
      authoredRelationshipOutcome: {
        outcomeId: "distance_acknowledged",
        maximumBeatCount: 3,
        meaning: expect.any(String),
      },
    });
    expect(controller.snapshot().performances).not.toContainEqual(
      expect.objectContaining({ at: 24 * 60 + 20 * 60 + 15 }),
    );
    const rendered = renderWorldText(projectGame(controller.snapshot()).world);
    expect(rendered).toContain(
      "Martin says, “I don't know how to start this, but I miss talking to you.”",
    );
    expect(rendered).toContain('Elise looks at him and says, “I know.”');
    expect(rendered).toContain(
      "Neither tries to turn the two sentences into a conclusion.",
    );
    expect(rendered).not.toContain("Generated opening.");
    expect(rendered).not.toContain("An unauthorized fourth exchange.");
  });

  // Spec: ADR 0029 LDO-PERF-003 and LDO-PERF-004.
  it("renders ordinary routines from authored cues without calling the Performance Director", async () => {
    const requests: PerformanceRequest[] = [];
    const controller = createConversationalVerticalSliceGameController({
      persona: {
        async takeTurn() {
          throw new Error("Not exercised");
        },
      },
      actionJudge: {
        async judgeAwareness() {
          throw new Error("Not exercised");
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      },
      performanceDirector: {
        async stage(request) {
          requests.push(structuredClone(request));
          return { beats: ["Generated routine prose must not appear."] };
        },
      },
    });

    await controller.advanceToWithPerformance(7 * 60 + 57);

    expect(requests).toEqual([]);
    expect(renderWorldText(projectGame(controller.snapshot()).world)).toContain(
      "He looks up, starts to pass beneath it, then stops.",
    );
  });

  // Spec: ADR 0029 LDO-PERF-003; chapter-1.md LDO-CH1-003.
  it("renders fixed causal routines directly from the authored Chapter 1 catalog", async () => {
    const requests: PerformanceRequest[] = [];
    const world = createVerticalSliceWorld({
      ambientChoice: { choose: () => null },
    });
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(7 * 60 + 59);
    const ports: ConversationPorts = {
      persona: {
        async takeTurn() {
          throw new Error("Not exercised");
        },
      },
      actionJudge: {
        async judgeAwareness() {
          throw new Error("Not exercised");
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      },
      performanceDirector: {
        async stage(request) {
          requests.push(structuredClone(request));
          return { beats: ["A bounded visible realization."] };
        },
      },
    };
    const controller = new VerticalSliceGameController(world, ports);

    await controller.advanceToWithPerformance(24 * 60 + 8 * 60 + 20);

    expect(requests).toEqual([]);
    const rendered = renderWorldText(projectGame(controller.snapshot()).world);
    expect(rendered).toContain(
      "He walks down the hallway, slowing before the fully closed door.",
    );
    expect(rendered).toContain(
      "She starts into the hallway, stops near its entrance",
    );
    expect(rendered).not.toContain("A bounded visible realization.");
  });

  // Spec: chapter-1.md, "Deterministic earliest path" retry paragraph;
  // ADR 0029 LDO-PERF-003. The Controller passes only validated bounded
  // progress into authored selection, then renders the selected retry variant.
  it("LDO-CH1-005 renders a progress-sensitive authored retry without advancing the causal phase", async () => {
    const requests: PerformanceRequest[] = [];
    const day = 24 * 60;
    const world = createVerticalSliceWorld({
      ambientChoice: { choose: () => null },
    });
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(2 * day + 8 * 60 + 10);
    world.setActionProgress(
      "husband",
      "open_door_a_crack",
      "faintly_imagined",
    );

    const ports: ConversationPorts = {
      persona: {
        async takeTurn() {
          throw new Error("Not exercised");
        },
      },
      actionJudge: {
        async judgeAwareness() {
          throw new Error("Not exercised");
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      },
      performanceDirector: {
        async stage(request) {
          requests.push(structuredClone(request));
          return {
            beats: [
              "His hand arrives directly; his thumb waits beside the latch without pressing it.",
            ],
          };
        },
      },
    };
    const controller = new VerticalSliceGameController(world, ports);

    await controller.advanceToWithPerformance(3 * day + 8 * 60 + 10);

    expect(requests).toEqual([]);
    expect(controller.snapshot().events).toContainEqual(
      expect.objectContaining({
        at: 3 * day + 8 * 60 + 10,
        type: "routine_executed",
        routineId: "husband_reaches_handle_without_turning",
        routineVariantId: "thumb_waits_beside_latch",
      }),
    );
    expect(
      renderWorldText(projectGame(controller.snapshot()).world),
    ).toContain(
      "His hand arrives more directly; his thumb waits beside the latch without pressing it. The door remains fully closed.",
    );
    expect(controller.snapshot().world).toMatchObject({
      chapterDay: 3,
      worldFacts: { hallwayDoor: "closed" },
      intentions: [],
    });
    expect(controller.snapshot().world.evidence).not.toHaveProperty(
      "door_is_slightly_open",
    );
  });

  // Spec: ADR 0029 LDO-PERF-003; chapter-1.md LDO-CH1-014.
  it("renders the chance-selected ambient routine from its authored cue", async () => {
    const requests: PerformanceRequest[] = [];
    const world = createVerticalSliceWorld({
      ambientChoice: {
        choose() {
          return "wife_squares_hallway_runner";
        },
      },
    });
    world.advanceTo(7 * 60 + 57);
    world.pause();
    world.commitNarrativeAction(
      "husband",
      "interact_with_living_room_clock",
    );
    world.resume();
    world.advanceTo(7 * 60 + 59);
    const ports: ConversationPorts = {
      persona: {
        async takeTurn() {
          throw new Error("Not exercised");
        },
      },
      actionJudge: {
        async judgeAwareness() {
          throw new Error("Not exercised");
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      },
      performanceDirector: {
        async stage(request) {
          requests.push(structuredClone(request));
          return {
            beats: [
              "She kneels at the runner's near corner, squares it with two fingers, and leaves the length beyond it alone.",
            ],
          };
        },
      },
    };
    const controller = new VerticalSliceGameController(world, ports);

    await controller.advanceToWithPerformance(2 * 24 * 60 + 7 * 60 + 55);

    expect(requests).toEqual([]);
    expect(controller.snapshot().events).toContainEqual(
      expect.objectContaining({
        actorId: "wife",
        at: 2 * 24 * 60 + 7 * 60 + 55,
        type: "routine_executed",
        routineId: "wife_squares_hallway_runner",
        routineVariantId: "square_near_edge",
      }),
    );
    expect(controller.snapshot().world).toMatchObject({
      worldFacts: { hallwayDoor: "closed" },
      intentions: [],
    });
    const rendered = renderWorldText(projectGame(controller.snapshot()).world);
    expect(rendered).toContain(
      "She squares the near edge of the runner and leaves the far end untouched.",
    );
    expect(rendered).not.toContain(
      "She kneels at the runner's near corner, squares it with two fingers, and leaves the length beyond it alone.",
    );
  });

  it("LDO-LOCAL-011 stages an accepted NarrativeAction from the Persona-owned motif while World owns closure", async () => {
    const requests: PerformanceRequest[] = [];
    const acceptedReply =
      "I could reach up, set it to something absurd for a moment, then put it right when I am done.";
    const ports: ConversationPorts = {
      persona: {
        async takeTurn() {
          return {
            reply: acceptedReply,
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
            selectedVariantId: "accepted_clock_interaction",
          };
        },
      },
      performanceDirector: {
        async stage(request) {
          requests.push(structuredClone(request));
          return {
            beats: [
              "He turns the hands through an impossible hour, then sets them to the current time.",
            ],
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
      text: "What if you spun it to a ridiculous time first?",
    });
    await controller.dispatch({
      type: "select_action_option",
      optionId: "spend-time-with-clock",
    });

    controller.dispatch({ type: "resume_world" });
    await controller.advanceToWithPerformance(24 * 60 + 8 * 60 + 20);

    const actionRequest = requests.find(
      (request) =>
        request.semanticBehavior.behaviorId ===
        "interact_with_living_room_clock",
    );
    expect(actionRequest).toMatchObject(
      {
        actorId: "husband",
        at: 7 * 60 + 59,
        semanticBehavior: {
          kind: "narrative_action",
          behaviorId: "interact_with_living_room_clock",
          variantId: "accepted_clock_interaction",
        },
        performanceEnvelope: {
          targetObjectIds: ["living_room_clock"],
          closurePolicy: {
            kind: "authored_postcondition",
            postconditionId: "living_room_clock_accurate",
          },
        },
        hintBrief: null,
        acceptedPersonaReply: acceptedReply,
      },
    );
    expect(JSON.stringify(actionRequest)).not.toContain(
      "What if you spun it to a ridiculous time first?",
    );
    expect(controller.snapshot()).toMatchObject({
      world: {
        worldFacts: { livingRoomClock: "accurate" },
        evidence: {
          living_room_clock_is_accurate: { active: true },
        },
      },
      performances: expect.arrayContaining([
        expect.objectContaining({
          at: 7 * 60 + 59,
          beats: [
            "He turns the hands through an impossible hour, then sets them to the current time.",
          ],
        }),
      ]),
    });
  });
});

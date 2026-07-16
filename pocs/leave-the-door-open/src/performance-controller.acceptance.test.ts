import { describe, expect, it } from "vitest";
import {
  createConversationalVerticalSliceGameController,
  VerticalSliceGameController,
} from "./controller";
import type { ConversationPorts } from "./conversation";
import type {
  PerformanceDirectorPort,
  PerformanceRequest,
} from "./performance";
import { projectGame } from "./presentation";
import { renderWorldText } from "./text-rendering";
import { createVerticalSliceWorld } from "./world";

describe("bounded Performance Director orchestration", () => {
  it("LDO-CH1-003 LDO-CH1-014 stages fixed causal routines from the authored Chapter 1 catalog", async () => {
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

    expect(requests).toMatchObject([
      {
        actorId: "husband",
        actorDisplayName: "Martin",
        semanticBehavior: {
          kind: "routine",
          behaviorId: "husband_route_turns_before_closed_door",
          variantId: "ordinary_route_turnback",
        },
        scene: {
          locationId: "hallway",
          visibleFacts: [
            "His ordinary hallway route ends before the fully closed door.",
          ],
        },
        performanceEnvelope: {
          targetObjectIds: ["hallway_door"],
          closurePolicy: {
            kind: "authored_routine_postcondition",
            postconditionId: "husband_turned_back_before_closed_door",
          },
        },
        hintBrief: {
          hintId: "ordinary_route_ends_before_closed_door",
          required: true,
        },
        acceptedPersonaReply: null,
      },
      {
        actorId: "wife",
        semanticBehavior: {
          kind: "routine",
          behaviorId: "wife_takes_long_route_around_hall",
          variantId: "longer_return_route",
        },
        scene: {
          locationId: "dining_area",
          visibleFacts: [
            "She starts toward the hallway, then chooses a longer route back.",
          ],
        },
        performanceEnvelope: {
          targetObjectIds: ["hallway_entrance"],
          closurePolicy: {
            kind: "authored_routine_postcondition",
            postconditionId: "wife_completed_longer_return_route",
          },
        },
        hintBrief: {
          hintId: "wife_chooses_longer_route_back",
          required: true,
        },
        acceptedPersonaReply: null,
      },
    ]);
    const rendered = renderWorldText(projectGame(controller.snapshot()).world);
    expect(rendered).toContain("A bounded visible realization.");
    expect(rendered).not.toContain(
      "He walks down the hallway, slowing before the fully closed door.",
    );
    expect(rendered).not.toContain(
      "She starts into the hallway, stops near its entrance",
    );
  });

  // Spec: chapter-1.md, "Deterministic earliest path" retry paragraph;
  // ADR 0010 Decisions 2-7. The Controller passes only validated bounded
  // progress into authored selection, then stages the selected retry variant.
  it("LDO-CH1-005 stages a progress-sensitive retry cue without advancing the causal phase", async () => {
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

    expect(requests).toMatchObject([
      {
        actorId: "husband",
        at: 3 * day + 8 * 60 + 10,
        semanticBehavior: {
          kind: "routine",
          behaviorId: "husband_reaches_handle_without_turning",
          variantId: "thumb_waits_beside_latch",
        },
        scene: {
          locationId: "hallway",
          visibleFacts: [
            "On a later attempt, his hand arrives more directly and his thumb waits beside the latch; the door remains fully closed.",
          ],
        },
        performanceEnvelope: {
          targetObjectIds: ["hallway_door"],
          closurePolicy: {
            kind: "authored_routine_postcondition",
            postconditionId: "husband_hand_on_closed_handle",
          },
        },
        hintBrief: {
          hintId: "husband_later_attempt_reaches_latch",
          required: true,
        },
      },
    ]);
    expect(controller.snapshot().world).toMatchObject({
      chapterDay: 3,
      worldFacts: { hallwayDoor: "closed" },
      intentions: [],
    });
    expect(controller.snapshot().world.evidence).not.toHaveProperty(
      "door_is_slightly_open",
    );
  });

  it("LDO-CH1-014 stages the chance-selected ambient routine with its optional HintBrief", async () => {
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

    const ambientRequest = requests.find(
      (request) =>
        request.semanticBehavior.behaviorId ===
        "wife_squares_hallway_runner",
    );
    expect(ambientRequest).toMatchObject(
      {
        actorId: "wife",
        at: 2 * 24 * 60 + 7 * 60 + 55,
        semanticBehavior: {
          kind: "routine",
          behaviorId: "wife_squares_hallway_runner",
          variantId: "square_near_edge",
        },
        scene: {
          locationId: "hallway",
          visibleFacts: [
            "The hallway runner is in its ordinary position; this routine leaves it unchanged.",
          ],
        },
        performanceEnvelope: {
          targetObjectIds: ["hallway_runner"],
          closurePolicy: { kind: "restore_valid_starting_state" },
        },
        hintBrief: {
          hintId: "wife_maintains_a_near_boundary",
          required: false,
        },
        acceptedPersonaReply: null,
      },
    );
    expect(controller.snapshot().world).toMatchObject({
      worldFacts: { hallwayDoor: "closed" },
      intentions: [],
    });
    const rendered = renderWorldText(projectGame(controller.snapshot()).world);
    expect(rendered).toContain(
      "She kneels at the runner's near corner, squares it with two fingers, and leaves the length beyond it alone.",
    );
    expect(rendered).not.toContain(
      "She squares the near edge of the runner and leaves the far end untouched.",
    );
  });

  it("LDO-LOCAL-011 stages the World-selected routine and authored HintBrief without changing simulation truth", async () => {
    const requests: PerformanceRequest[] = [];
    const performanceDirector: PerformanceDirectorPort = {
      async stage(request) {
        requests.push(structuredClone(request));
        return {
          beats: [
            "He looks up at the clock, starts to pass beneath it, then stops.",
          ],
        };
      },
    };
    const unusedConversation: Omit<
      ConversationPorts,
      "performanceDirector"
    > = {
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
    };
    const controller = createConversationalVerticalSliceGameController({
      ...unusedConversation,
      performanceDirector,
    });

    await controller.advanceToWithPerformance(7 * 60 + 57);

    expect(requests).toMatchObject([
      {
        actorId: "husband",
        at: 7 * 60 + 57,
        semanticBehavior: {
          kind: "routine",
          behaviorId: "husband_notices_slow_clock",
          variantId: "notice_and_stop",
        },
        scene: {
          locationId: "living_room",
          visibleFacts: [
            "The living-room clock is three minutes slow and currently shows 07:54.",
          ],
        },
        performanceEnvelope: {
          targetObjectIds: ["living_room_clock"],
          closurePolicy: { kind: "restore_valid_starting_state" },
        },
        hintBrief: {
          hintId: "slow_clock_is_repeatedly_noticed",
          safeFact:
            "Most mornings Martin notices that the living-room clock is three minutes slow and keeps walking; today he stops beneath it.",
          required: true,
          forbiddenInterpretations: expect.arrayContaining([
            "Do not describe today's stopping as his repeated morning habit.",
          ]),
        },
        acceptedPersonaReply: null,
      },
    ]);
    expect(controller.snapshot()).toMatchObject({
      world: {
        worldFacts: { livingRoomClock: "three_minutes_slow" },
        intentions: [],
        completedActions: [],
        evidence: {},
      },
      performances: [
        {
          afterEventIndex: 0,
          at: 7 * 60 + 57,
          beats: [
            "He looks up at the clock, starts to pass beneath it, then stops.",
          ],
        },
      ],
    });
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

import { describe, expect, it } from "vitest";
import type {
  MindState,
  PersonaOwnedState,
  PersonaTurnRequest,
} from "./conversation";
import type {
  StructuredRoleCall,
  StructuredRoleModel,
} from "./live-protocol";
import {
  StructuredModelConversationPorts,
} from "./structured-conversation-ports";
import { getCharacterCore } from "./character-cores";
import {
  createChapterOneMindState,
  createTutorialMindState,
  revealMindStateAtomsForMoment,
} from "./mind-state";

const mindState: MindState = createChapterOneMindState("husband");

const personaRequest: PersonaTurnRequest = {
  actorId: "husband",
  characterCore: getCharacterCore("husband"),
  moment: {
    time: 9 * 60 + 5,
    locationId: "hallway",
    visibleActivityId: "stopped_at_door",
  },
  observedEvidence: [],
  conversation: [
    {
      speaker: "player",
      text: "Could you let the moment remain undecided?",
    },
  ],
  mindState,
};

describe("structured model conversation ports", () => {
  it("LDO-LOCAL-013 runs an Action-blind structured MindState transition phase", async () => {
    const model = new QueuedRoleModel([
      {
        phase: "mind_state_transition",
        transitions: [
          {
            atom_id: "husband.clock.deliberate_change_effort",
            from_status: "active",
            to_status: "resolved",
            reason: "The Persona owns a bounded adjustment despite the effort.",
            supporting_persona_source_ids: ["persona.turn.1"],
          },
        ],
        unmodeled_shift_note: null,
      },
    ]);
    const ports = new StructuredModelConversationPorts(model, {
      persona: "Persona prompt",
      actionJudge: "Judge prompt",
    });

    const result = await (
      ports as unknown as {
        judgeMindStateTransition(request: unknown): Promise<{
          transitions: Array<{
            atomId: string;
            fromStatus: string;
            toStatus: string;
          }>;
          unmodeledShiftNote: string | null;
        }>;
      }
    ).judgeMindStateTransition({
      actorId: "husband",
      mindState: {
        atoms: [
          {
            kind: "pressure",
            atomId: "husband.clock.deliberate_change_effort",
            description: "Beginning one deliberate adjustment feels effortful.",
            status: "active",
          },
        ],
      },
      personaReply: {
        sourceId: "persona.turn.1",
        text: "I can set it right and stop there.",
      },
      moment: {
        time: 7 * 60 + 57,
        locationId: "living_room",
        visibleActivityId: "noticing_slow_clock",
      },
      observedEvidence: [],
      conversation: [
        {
          speaker: "player",
          text: "Could it be one bounded task?",
        },
        {
          speaker: "persona",
          text: "I can set it right and stop there.",
        },
      ],
    });

    expect(model.calls[0]).toMatchObject({
      role: "mind_state_transition",
      schemaName: "ldo_mind_state_transition_v1",
    });
    expect(model.calls[0]!.input).toContain(
      "husband.clock.deliberate_change_effort",
    );
    expect(model.calls[0]!.input).toContain("persona.turn.1");
    expect(model.calls[0]!.input).not.toMatch(
      /HARD_ELIGIBLE_AUTHORED_ACTIONS|PLAYER_SELECTED_ACTION|interact_with_living_room_clock|open_door_a_crack|variant_id/i,
    );
    expect(result).toEqual({
      transitions: [
        {
          atomId: "husband.clock.deliberate_change_effort",
          fromStatus: "active",
          toStatus: "resolved",
          supportingPersonaSourceIds: ["persona.turn.1"],
        },
      ],
      unmodeledShiftNote: null,
    });
  });

  it("LDO-LOCAL-010 gives the clock Persona an authored shallow-resistance sufficiency condition without catalog data", async () => {
    const model = new QueuedRoleModel([
      {
        reply:
          "A bounded adjustment with a clear end would be enough for me to choose today.",
        should_end_conversation: false,
        grounding: [
          {
            source: "h.emotion.clock_sufficiency",
            use: "A bounded task is sufficient without a new barrier.",
          },
        ],
      },
    ]);
    const ports = new StructuredModelConversationPorts(model, {
      persona: "Persona prompt",
      actionJudge: "Judge prompt",
    });

    await ports.takeTurn({
      actorId: "husband",
      characterCore: getCharacterCore("husband"),
      moment: {
        time: 7 * 60 + 57,
        locationId: "living_room",
        visibleActivityId: "noticing_slow_clock",
      },
      observedEvidence: [],
      conversation: [
        {
          speaker: "player",
          text: "Could setting it right be one bounded task and then stop?",
        },
      ],
      mindState: createTutorialMindState("husband"),
    });

    expect(model.calls[0]!.input).toContain("h.emotion.clock_sufficiency");
    expect(model.calls[0]!.input).toContain(
      "that is enough for the character to choose it today",
    );
    expect(model.calls[0]!.input).not.toMatch(
      /interact_with_living_room_clock|accepted_clock_interaction|action_id|variant_id/i,
    );
  });

  it("LDO-CH1-003 LDO-CH1-007 gives Day 1 Persona only facts that match each visible routine moment", async () => {
    const model = new QueuedRoleModel([
      {
        reply: "I stopped before reaching it and turned back.",
        should_end_conversation: false,
        grounding: [
          {
            source: "h.fact.day1_turnback",
            use: "He turned before reaching the door.",
          },
        ],
      },
      {
        reply: "I chose the longer route instead of entering the hall.",
        should_end_conversation: false,
        grounding: [
          {
            source: "w.fact.day1_long_route",
            use: "She returned by the longer route.",
          },
        ],
      },
    ]);
    const ports = new StructuredModelConversationPorts(model, {
      persona: "Persona prompt",
      actionJudge: "Judge prompt",
    });

    await ports.takeTurn({
      actorId: "husband",
      characterCore: getCharacterCore("husband"),
      moment: {
        time: 24 * 60 + 8 * 60 + 20,
        locationId: "hallway",
        visibleActivityId: "turning_before_closed_door",
      },
      observedEvidence: [],
      conversation: [{ speaker: "player", text: "Why did you turn back?" }],
      mindState,
    });
    await ports.takeTurn({
      actorId: "wife",
      characterCore: getCharacterCore("wife"),
      moment: {
        time: 24 * 60 + 8 * 60 + 20,
        locationId: "dining_area",
        visibleActivityId: "taking_long_route_around_hall",
      },
      observedEvidence: [
        {
          evidenceId: "living_room_clock_is_accurate",
          description: "The living-room clock shows the current time.",
        },
      ],
      conversation: [
        { speaker: "player", text: "Why did you take the longer route?" },
      ],
      mindState: createChapterOneMindState("wife"),
    });

    expect(model.calls[0]!.input).toContain("h.fact.day1_turnback");
    expect(model.calls[0]!.input).toContain("before reaching");
    expect(model.calls[0]!.input).not.toMatch(
      /h\.fact\.hand|hand is resting on the closed door|immediately outside the threshold/i,
    );
    expect(model.calls[1]!.input).toContain("w.fact.day1_long_route");
    expect(model.calls[1]!.input).toContain("longer route");
    expect(model.calls[1]!.input).toContain(
      "wife.fact.observed.living_room_clock_is_accurate",
    );
    expect(model.calls[1]!.input).not.toMatch(
      /w\.fact\.threshold|immediately outside the threshold/i,
    );
  });

  it.each([
    {
      actorId: "husband" as const,
      visibleActivityId: "reaching_closed_door_handle" as const,
      locationId: "hallway" as const,
      source: "h.fact.hand",
      forbidden: /w\.fact\.|closed_window|inside the room/i,
    },
    {
      actorId: "wife" as const,
      visibleActivityId: "observing_first_door_gap" as const,
      locationId: "hallway" as const,
      source: "w.fact.first_gap",
      forbidden: /w\.fact\.threshold|boundary_return|closed_window/i,
    },
    {
      actorId: "wife" as const,
      visibleActivityId: "stopping_one_step_short" as const,
      locationId: "room_threshold" as const,
      source: "w.fact.threshold",
      forbidden: /boundary_return|inside_room|closed_window/i,
    },
    {
      actorId: "wife" as const,
      visibleActivityId: "returning_to_boundary" as const,
      locationId: "room_threshold" as const,
      source: "w.fact.boundary_return",
      forbidden: /day1_long_route|closed_window/i,
    },
    {
      actorId: "wife" as const,
      visibleActivityId: "noticing_closed_room_window" as const,
      locationId: "room_interior" as const,
      source: "w.fact.closed_window",
      forbidden: /day1_long_route|first_gap|boundary_return/i,
    },
  ])(
    "LDO-CH1-007 keeps the $visibleActivityId Persona scene phase-local",
    async ({ actorId, visibleActivityId, locationId, source, forbidden }) => {
      const model = new QueuedRoleModel([
        {
          reply: "I can speak only from what is happening at this moment.",
          should_end_conversation: false,
          grounding: [{ source, use: "The current visible fact." }],
        },
      ]);
      const ports = new StructuredModelConversationPorts(model, {
        persona: "Persona prompt",
        actionJudge: "Judge prompt",
      });

      await ports.takeTurn({
        actorId,
        characterCore: getCharacterCore(actorId),
        moment: {
          time: 3 * 24 * 60 + 8 * 60 + 20,
          locationId,
          visibleActivityId,
        },
        observedEvidence: [],
        conversation: [{ speaker: "player", text: "What is true right now?" }],
        mindState: createChapterOneMindState(actorId),
      });

      expect(model.calls[0]!.input).toContain(source);
      expect(model.calls[0]!.input).not.toMatch(forbidden);
    },
  );

  it("LDO-LOCAL-010 ADR 0011 gives the clock tutorial only shallow clock-specific Persona facts", async () => {
    const model = new QueuedRoleModel([
      {
        reply: "I notice it every morning. Today I stopped instead of walking on.",
        should_end_conversation: false,
        grounding: [
          {
            source: "h.fact.clock_now",
            use: "The clock is three minutes slow.",
          },
          {
            source: "h.fact.clock_habit",
            use: "He normally notices and keeps walking.",
          },
        ],
      },
    ]);
    const ports = new StructuredModelConversationPorts(model, {
      persona: "Persona prompt",
      actionJudge: "Judge prompt",
    });

    await ports.takeTurn({
      actorId: "husband",
      characterCore: getCharacterCore("husband"),
      moment: {
        time: 7 * 60 + 57,
        locationId: "living_room",
        visibleActivityId: "noticing_slow_clock",
      },
      observedEvidence: [],
      conversation: [
        {
          speaker: "player",
          text: "What made you stop beneath it today?",
        },
      ],
      mindState: createTutorialMindState("husband"),
    });

    expect(model.calls[0]!.input).toContain("h.fact.clock_now");
    expect(model.calls[0]!.input).toContain("three minutes slow");
    expect(model.calls[0]!.input).toContain("h.fact.clock_habit");
    expect(model.calls[0]!.input).not.toMatch(
      /h\.fact\.door|h\.emotion\.irreversible|pulls it fully shut|erase|erasure/i,
    );
    expect(model.calls[0]!.input).not.toMatch(
      /declaration|symbolic|stand for|fear/i,
    );
  });

  it("LDO-LOCAL-004 sends a catalog-blind Persona packet and maps its bounded result", async () => {
    const model = new QueuedRoleModel([
      {
        reply: "I could open only a narrow gap for this moment.",
        should_end_conversation: false,
        grounding: [
          { source: "player_claim", use: "A possible reframe." },
          { source: "h.fact.door_now", use: "The door is fully closed." },
        ],
      },
    ]);
    const ports = new StructuredModelConversationPorts(model, {
      persona: "Persona prompt",
      actionJudge: "Judge prompt",
    });

    const result = await ports.takeTurn(personaRequest);

    expect(result).toEqual({
      reply: "I could open only a narrow gap for this moment.",
      shouldEndConversation: false,
    });
    expect(model.calls[0]).toMatchObject({
      role: "persona",
      instructions: "Persona prompt",
      schemaName: "ldo_persona_v7",
    });
    expect(model.calls[0]!.input).toContain(
      "Could you let the moment remain undecided?",
    );
    expect(model.calls[0]!.input).toContain("CHARACTER_CORE");
    expect(model.calls[0]!.input).toContain("consequence lock");
    expect(model.calls[0]!.input).toContain("SCENE_PACKET");
    expect(model.calls[0]!.input.indexOf("CHARACTER_CORE")).toBeLessThan(
      model.calls[0]!.input.indexOf("SCENE_PACKET"),
    );
    expect(model.calls[0]!.input.indexOf("SCENE_PACKET")).toBeLessThan(
      model.calls[0]!.input.indexOf("CURRENT_MIND_STATE"),
    );
    expect(model.calls[0]!.input).toContain("h.fact.door_now");
    expect(model.calls[0]!.input).not.toMatch(
      /open_door_a_crack|open_narrow_gap|remain_at_threshold|one_breath_at_threshold|HARD_ELIGIBLE_AUTHORED_ACTIONS/,
    );
  });

  it("LDO-LOCAL-005 routes fixed authored definitions through awareness and willingness", async () => {
    const model = new QueuedRoleModel([
      {
        phase: "awareness",
        judgments: [
          {
            action_id: "open_door_a_crack",
            awareness: "surfaced",
            reason: "The Persona owns the concrete reversible possibility.",
            supporting_persona_source_ids: [
              "persona.turn.1",
              "mind.atom.husband.door.narrow_gap_can_end",
            ],
          },
        ],
      },
      {
        phase: "willingness",
        action_id: "open_door_a_crack",
        decision: "accept",
        selected_variant_id: "open_narrow_gap",
        reason: "The selected variant matches the owned possibility.",
        supporting_persona_source_ids: ["persona.turn.1"],
      },
    ]);
    const ports = new StructuredModelConversationPorts(model, {
      persona: "Persona prompt",
      actionJudge: "Judge prompt",
    });
    const personaState: PersonaOwnedState = {
      reply: {
        sourceId: "persona.turn.1",
        text: "I can open only a narrow gap and walk away.",
      },
      mindState: {
        atoms: revealMindStateAtomsForMoment({
          state: mindState,
          actorId: "husband",
          visibleActivityId: "reaching_closed_door_handle",
        }).atoms.map((atom) =>
          atom.atomId === "husband.door.narrow_gap_can_end"
            ? { ...atom, status: "accepted" as const }
            : atom,
        ),
      },
      moment: personaRequest.moment,
      observedEvidence: [],
      conversation: personaRequest.conversation,
    };
    const actions = [
      {
        actionId: "open_door_a_crack" as const,
        description:
          "Open the fully closed hallway door only far enough to leave a narrow gap, then walk away.",
      },
    ];

    const awareness = await ports.judgeAwareness({
      actorId: "husband",
      personaState,
      actions,
    });
    const willingness = await ports.judgeWillingness({
      actorId: "husband",
      personaState,
      action: {
        ...actions[0],
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
      },
      awareness: awareness.judgments[0]!,
    });

    expect(awareness).toEqual({
      judgments: [
        { actionId: "open_door_a_crack", awareness: "surfaced" },
      ],
    });
    expect(willingness).toEqual({
      actionId: "open_door_a_crack",
      decision: "accept",
      selectedVariantId: "open_narrow_gap",
    });
    expect(model.calls[0]).toMatchObject({
      role: "awareness",
      instructions: "Judge prompt",
      schemaName: "ldo_awareness_v3",
    });
    expect(model.calls[0]!.input).toContain("open_door_a_crack");
    expect(model.calls[0]!.input).toContain(
      "mind.atom.husband.door.narrow_gap_can_end",
    );
    expect(model.calls[0]!.input).not.toContain("open_narrow_gap");
    expect(model.calls[1]).toMatchObject({
      role: "willingness",
      schemaName: "ldo_willingness_v3",
    });
    expect(model.calls[1]!.input).toContain("open_narrow_gap");
  });
});

class QueuedRoleModel implements StructuredRoleModel {
  readonly calls: StructuredRoleCall[] = [];

  constructor(private readonly outputs: unknown[]) {}

  async call(request: StructuredRoleCall) {
    this.calls.push(request);
    return {
      parsed: this.outputs.shift(),
      raw: {},
      latencyMs: 1,
      usage: { inputTokens: 1, outputTokens: 1, reasoningTokens: 0 },
    };
  }
}

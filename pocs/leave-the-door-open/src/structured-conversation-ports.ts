import type {
  ActionJudgePort,
  AwarenessRequest,
  AwarenessResult,
  InputFirewallPort,
  InputFirewallRequest,
  InputFirewallResult,
  PersonaPort,
  PersonaTurnRequest,
  PersonaTurnResult,
  MemorySelectionRequest,
  MemorySelectionResult,
  MemorySelectorPort,
  MindStateTransitionRequest,
  MindStateTransitionResult,
  WillingnessRequest,
  WillingnessResult,
} from "./conversation";
import { projectPersonaOwnedMindState } from "./mind-state";
import {
  AwarenessOutputSchema,
  InputFirewallOutputSchema,
  MemorySelectorOutputSchema,
  MindStateTransitionOutputSchema,
  PersonaOutputV9Schema,
  WillingnessOutputSchema,
  type StructuredRoleModel,
} from "./live-protocol";

export type ConversationRolePrompts = {
  inputFirewall?: string;
  persona: string;
  memorySelector?: string;
  actionJudge: string;
};

export type StructuredModelConversationPortsOptions = {
  inputFirewallModel?: StructuredRoleModel;
};

type ScenePacket = {
  surface_role: string;
  allowed_facts: Array<{ id: string; fact: string }>;
  emotional_invariants: Array<{ id: string; invariant: string }>;
  active_authored_pressures: Array<{
    atom_id: string;
    description: string;
    status: "active" | "weakened";
  }>;
};

const husbandClockPacket = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [
    {
      id: "h.fact.clock_now",
      fact: "At 07:57, the living-room clock shows 07:54: it is three minutes slow.",
    },
    {
      id: "h.fact.clock_habit",
      fact: "The character notices the slow clock most mornings and usually keeps walking.",
    },
    {
      id: "h.fact.clock_moment",
      fact: "Today the character looked up, started to pass beneath the clock, and stopped.",
    },
  ],
  emotional_invariants: [],
} as const;

const husbandDoorPacket = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [
    {
      id: "h.fact.door_now",
      fact: "The door at the end of the hallway is fully closed.",
    },
    {
      id: "h.fact.hand",
      fact: "The character's hand is resting on the closed door's handle.",
    },
    {
      id: "h.fact.habit",
      fact: "The character normally passes the closed door without opening it.",
    },
    {
      id: "h.fact.distance",
      fact: "The two adults rarely speak directly and keep separate routines.",
    },
  ],
  emotional_invariants: [
    {
      id: "h.emotion.irreversible",
      invariant:
        "Opening this part of the house feels as if it could start something irreversible.",
    },
    {
      id: "h.emotion.erasure",
      invariant:
        "The character fears their spouse could interpret opening it as an attempt to erase what has been kept still.",
    },
    {
      id: "h.emotion.uncertainty",
      invariant:
        "The character cannot picture what would follow even a small opening.",
    },
    {
      id: "h.emotion.tolerance",
      invariant:
        "Only a reversible, non-declarative movement may currently be tolerable.",
    },
  ],
} as const;

const sharedDistanceFact = {
  id: "household.fact.distance",
  fact: "The two adults rarely speak directly and keep separate routines.",
} as const;

const husbandDay1Packet = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [
    {
      id: "h.fact.day1_closed_door",
      fact: "The door at the end of the hallway is fully closed.",
    },
    {
      id: "h.fact.day1_turnback",
      fact: "The character slowed and turned back before reaching the fully closed door.",
    },
    sharedDistanceFact,
  ],
  emotional_invariants: [
    {
      id: "h.emotion.sequence",
      invariant:
        "Moving closer to the door feels connected to a sequence whose later consequences are not settled.",
    },
    {
      id: "h.emotion.day1_limit",
      invariant:
        "Today the character has not yet owned reaching the handle as a separate bounded step.",
    },
  ],
} as const;

const husbandAfterGapPacket = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [
    {
      id: "h.fact.gap_left",
      fact: "The character previously opened the hallway door only far enough to leave a narrow gap.",
    },
    sharedDistanceFact,
  ],
  emotional_invariants: [
    {
      id: "h.emotion.no_inferred_response",
      invariant:
        "The character does not know what their spouse has made of the narrow gap.",
    },
  ],
} as const;

const wifeGenericPacket = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [sharedDistanceFact],
  emotional_invariants: [
    {
      id: "w.emotion.no_assumed_meaning",
      invariant:
        "The character does not infer another person's intention without a visible basis.",
    },
  ],
} as const;

const wifeDay1Packet = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [
    {
      id: "w.fact.day1_long_route",
      fact: "The character started toward the hallway, stopped near its entrance, and returned by the longer route.",
    },
    sharedDistanceFact,
  ],
  emotional_invariants: [
    {
      id: "w.emotion.first_mover",
      invariant:
        "Moving directly toward this part of the house feels like initiating a shared transition alone.",
    },
    {
      id: "w.emotion.day1_limit",
      invariant:
        "The character has not approached the room threshold today.",
    },
  ],
} as const;

const wifeGapObservationPacket = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [
    {
      id: "w.fact.first_gap",
      fact: "The character noticed a narrow gap in the hallway door and stopped away from the threshold without touching it.",
    },
    sharedDistanceFact,
  ],
  emotional_invariants: [
    {
      id: "w.emotion.uncertainty",
      invariant:
        "The character cannot safely assume why the door is open or what the other adult intended.",
    },
    {
      id: "w.emotion.observation",
      invariant:
        "Noticing a visible trace does not require treating it as an invitation.",
    },
  ],
} as const;

const wifeThresholdPacket = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [
    {
      id: "w.fact.threshold",
      fact: "The character is stopped immediately outside the room threshold, one step short of crossing it.",
    },
    {
      id: "w.fact.door_gap",
      fact: "The hallway door remains slightly open.",
    },
  ],
  emotional_invariants: [
    {
      id: "w.emotion.uncertainty",
      invariant:
        "The character cannot safely assume why the door is open or what the other adult intended.",
    },
    {
      id: "w.emotion.presence",
      invariant:
        "Remaining immediately outside can be separated from entering or changing the room.",
    },
  ],
} as const;

const wifeBoundaryPacket = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [
    {
      id: "w.fact.boundary_return",
      fact: "The character returned to the room threshold and placed one foot beside, not across, its line.",
    },
    {
      id: "w.fact.room_unchanged",
      fact: "Nothing inside the room has been changed by this return.",
    },
  ],
  emotional_invariants: [
    {
      id: "w.emotion.entry_boundary",
      invariant:
        "One bounded pace inside may be considered separately from taking ownership of the room.",
    },
  ],
} as const;

const wifeWindowPacket = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [
    {
      id: "w.fact.inside_room",
      fact: "The character is inside the room after previously crossing its threshold and returning.",
    },
    {
      id: "w.fact.closed_window",
      fact: "The room's window is closed, and the character is looking toward it without touching it.",
    },
  ],
  emotional_invariants: [
    {
      id: "w.emotion.bounded_response",
      invariant:
        "A small reversible household change may be considered separately from assigning meaning to the open door.",
    },
    {
      id: "w.emotion.no_claim",
      invariant:
        "The character still cannot claim to know why the other adult opened the door.",
    },
  ],
} as const;

export class StructuredModelConversationPorts
  implements
    InputFirewallPort,
    PersonaPort,
    MemorySelectorPort,
    ActionJudgePort
{
  constructor(
    private readonly model: StructuredRoleModel,
    private readonly prompts: ConversationRolePrompts,
    private readonly options: StructuredModelConversationPortsOptions = {},
  ) {}

  async classify(
    request: InputFirewallRequest,
  ): Promise<InputFirewallResult> {
    if (isHumanConversationalGesture(request.submittedText)) {
      return { disposition: "pass" };
    }
    if (this.prompts.inputFirewall === undefined) {
      throw new Error("Input Firewall prompt is required");
    }
    const result = await (this.options.inputFirewallModel ?? this.model).call({
      role: "input_firewall",
      instructions: this.prompts.inputFirewall,
      input: sections([
        ["ACTOR", request.actorId],
        ["DISCLOSURE_TIER", request.disclosureTier],
        ["VISIBLE_CONVERSATION", request.visibleConversation],
        ["SUBMITTED_TEXT", request.submittedText],
      ]),
      schemaName: "ldo_input_firewall_v1",
      schema: InputFirewallOutputSchema,
    });
    const output = InputFirewallOutputSchema.parse(result.parsed);
    return { disposition: output.disposition };
  }

  async selectMemory(
    request: MemorySelectionRequest,
  ): Promise<MemorySelectionResult> {
    if (request.eligibleMemories.length === 0) return { memoryId: null };
    if (this.prompts.memorySelector === undefined) {
      throw new Error("Memory selector prompt is required");
    }
    const result = await this.model.call({
      role: "memory_selector",
      instructions: this.prompts.memorySelector,
      input: sections([
        ["ACTOR", request.actorId],
        ["MOMENT", request.moment],
        ["OBSERVED_EVIDENCE", request.observedEvidence],
        ["CONVERSATION", request.conversation],
        ["ELIGIBLE_MEMORY_CUES", request.eligibleMemories],
      ]),
      schemaName: "ldo_memory_selector_v1",
      schema: MemorySelectorOutputSchema,
    });
    const selection = MemorySelectorOutputSchema.parse(result.parsed);
    const selected = selection.selected_memory_id;
    if (selected === null) return { memoryId: null };
    const eligible = request.eligibleMemories.find(
      ({ memoryId }) => memoryId === selected,
    );
    if (eligible === undefined) {
      throw new Error(`Memory selector returned ineligible ID: ${selected}`);
    }
    return { memoryId: eligible.memoryId };
  }

  async takeTurn(request: PersonaTurnRequest): Promise<PersonaTurnResult> {
    if (
      request.relevantMemory !== undefined &&
      request.relevantMemory !== null &&
      !request.relevantMemory.memoryId.startsWith(`${request.actorId}.`)
    ) {
      throw new Error(
        `Persona received another actor's memory: ${request.relevantMemory.memoryId}`,
      );
    }
    const personaMindState = projectPersonaOwnedMindState(request.mindState);
    const characterPacket = characterPacketFor({
      ...request,
      mindState: personaMindState,
    });
    const latestPlayerTurn = [...request.conversation]
      .reverse()
      .find(({ speaker }) => speaker === "player");
    if (latestPlayerTurn === undefined) {
      throw new Error("Persona turn requires a player message");
    }
    const conversationSoFar = request.conversation.slice(0, -1);
    const result = await this.model.call({
      role: "persona",
      instructions: this.prompts.persona,
      input: sections([
        ["OUTPUT_LOCALE", request.outputLocale ?? "en"],
        ["CHARACTER_CORE", request.characterCore],
        ["SCENE_PACKET", characterPacket],
        ["MOMENT", request.moment],
        ["CURRENT_MIND_STATE", personaMindState],
        ["RELEVANT_MEMORY", request.relevantMemory ?? "None."],
        ["CONVERSATION_SO_FAR", conversationSoFar],
        ["PLAYER_TURN", latestPlayerTurn.text],
      ]),
      schemaName: "ldo_persona_v9",
      schema: PersonaOutputV9Schema,
    });
    const persona = PersonaOutputV9Schema.parse(result.parsed);
    validatePersonaGrounding(
      characterPacket,
      personaMindState,
      request.relevantMemory,
      request.conversation.some(
        ({ provenance }) =>
          provenance === "controller_guarded_reaction",
      ),
      persona.grounding,
    );
    return {
      reply: persona.reply,
      shouldEndConversation: persona.should_end_conversation,
    };
  }

  async judgeAwareness(request: AwarenessRequest): Promise<AwarenessResult> {
    const result = await this.model.call({
      role: "awareness",
      instructions: this.prompts.actionJudge,
      input: sections([
        ["PHASE", "awareness"],
        ["PERSONA_CONTEXT", judgePersonaContext(request)],
        ["HARD_ELIGIBLE_AUTHORED_ACTIONS", request.actions.map(toJudgeAction)],
      ]),
      schemaName: "ldo_awareness_v3",
      schema: AwarenessOutputSchema,
    });
    const awareness = AwarenessOutputSchema.parse(result.parsed);
    validateSupportingSources(
      request.personaState.reply.sourceId,
      awareness.judgments,
      request.personaState.mindState,
    );
    return {
      judgments: awareness.judgments.map((judgment) => ({
        actionId: judgment.action_id,
        awareness: judgment.awareness,
      })),
    };
  }

  async judgeMindStateTransition(
    request: MindStateTransitionRequest,
  ): Promise<MindStateTransitionResult> {
    const result = await this.model.call({
      role: "mind_state_transition",
      instructions: this.prompts.actionJudge,
      input: sections([
        ["PHASE", "mind_state_transition"],
        ["CURRENT_AUTHORED_MIND_STATE", request.mindState],
        ["MOMENT", request.moment],
        ["OBSERVED_EVIDENCE", request.observedEvidence],
        ["CONVERSATION", request.conversation],
        ["PERSONA_REPLY", request.personaReply],
      ]),
      schemaName: "ldo_mind_state_transition_v1",
      schema: MindStateTransitionOutputSchema,
    });
    const transition = MindStateTransitionOutputSchema.parse(result.parsed);
    validateSupportingSources(
      request.personaReply.sourceId,
      transition.transitions,
    );
    return {
      transitions: transition.transitions.map((change) => ({
        atomId: change.atom_id,
        fromStatus: change.from_status,
        toStatus: change.to_status,
        supportingPersonaSourceIds:
          change.supporting_persona_source_ids,
      })),
      unmodeledShiftNote: transition.unmodeled_shift_note,
    };
  }

  async judgeWillingness(
    request: WillingnessRequest,
  ): Promise<WillingnessResult> {
    const result = await this.model.call({
      role: "willingness",
      instructions: this.prompts.actionJudge,
      input: sections([
        ["PHASE", "willingness"],
        ["PERSONA_CONTEXT", judgePersonaContext(request)],
        [
          "PLAYER_SELECTED_ACTION",
          {
            action_id: request.action.actionId,
            description: request.action.description,
            variants: request.action.variants.map((variant) => ({
              variant_id: variant.variantId,
              description: variant.description,
            })),
          },
        ],
        [
          "AWARENESS_RESULT",
          {
            phase: "awareness",
            judgments: [
              {
                action_id: request.awareness.actionId,
                awareness: request.awareness.awareness,
              },
            ],
          },
        ],
      ]),
      schemaName: "ldo_willingness_v3",
      schema: WillingnessOutputSchema,
    });
    const willingness = WillingnessOutputSchema.parse(result.parsed);
    validateSupportingSources(
      request.personaState.reply.sourceId,
      [willingness],
      request.personaState.mindState,
    );
    return {
      actionId: willingness.action_id,
      decision: willingness.decision,
      selectedVariantId: willingness.selected_variant_id,
    };
  }
}

const characterPacketFor = (request: PersonaTurnRequest): ScenePacket => {
  const base = scenePacketForMoment(request);
  const observedFacts = request.observedEvidence.map(
    ({ evidenceId, description }) => ({
      id: `${request.actorId}.fact.observed.${evidenceId}`,
      fact: description,
    }),
  );
  return {
    surface_role: base.surface_role,
    allowed_facts: [...base.allowed_facts, ...observedFacts],
    emotional_invariants: [...base.emotional_invariants],
    active_authored_pressures: activeAuthoredPressures(request.mindState),
  };
};

const scenePacketForMoment = (
  request: PersonaTurnRequest,
) => {
  if (request.actorId === "husband") {
    switch (request.moment.visibleActivityId) {
      case "noticing_slow_clock":
        return husbandClockPacket;
      case "turning_before_closed_door":
        return husbandDay1Packet;
      case "reaching_closed_door_handle":
      case "stopped_at_door":
        return husbandDoorPacket;
      case "opening_door_a_crack":
        return husbandAfterGapPacket;
      default:
        return {
          surface_role:
            "An adult who shares this quiet house with their spouse.",
          allowed_facts: [sharedDistanceFact],
          emotional_invariants: [
            {
              id: "h.emotion.no_assumed_sequence",
              invariant:
                "The character does not claim that an unperformed movement has already happened.",
            },
          ],
        };
    }
  }

  switch (request.moment.visibleActivityId) {
    case "taking_long_route_around_hall":
      return wifeDay1Packet;
    case "observing_first_door_gap":
      return wifeGapObservationPacket;
    case "stopping_one_step_short":
    case "remaining_at_threshold":
      return wifeThresholdPacket;
    case "returning_to_boundary":
    case "stepping_inside_then_back":
      return wifeBoundaryPacket;
    case "noticing_closed_room_window":
    case "opening_room_window":
      return wifeWindowPacket;
    default:
      return wifeGenericPacket;
  }
};

const judgePersonaContext = (
  request: AwarenessRequest | WillingnessRequest,
) => ({
  observed_facts: request.personaState.observedEvidence,
  moment: request.personaState.moment,
  conversation: request.personaState.conversation,
  persona_reply: request.personaState.reply,
  authored_mind_state: request.personaState.mindState.atoms.map((atom) => ({
    source_id: `mind.atom.${atom.atomId}`,
    ...atom,
  })),
});

const toJudgeAction = (action: AwarenessRequest["actions"][number]) => ({
  action_id: action.actionId,
  description: action.description,
});

const sections = (entries: Array<[string, unknown]>): string =>
  entries
    .map(
      ([heading, value]) =>
        `${heading}\n${typeof value === "string" ? value : JSON.stringify(value, null, 2)}`,
    )
    .join("\n\n");

const isHumanConversationalGesture = (text: string): boolean => {
  const gesture = text.trim();
  return (
    /^[?？!！]+$/u.test(gesture) ||
    /^[?？!！]*(?:\.{2,}|…+)[?？!！.…]*$/u.test(gesture)
  );
};

const validatePersonaGrounding = (
  packet: ScenePacket,
  mindState: PersonaTurnRequest["mindState"],
  relevantMemory: PersonaTurnRequest["relevantMemory"],
  hasGuardedReaction: boolean,
  grounding: Array<{ source: string }>,
): void => {
  const allowed = new Set([
    "player_claim",
    ...(hasGuardedReaction ? ["controller_guarded_reaction"] : []),
    ...packet.allowed_facts.map(({ id }) => id),
    ...packet.emotional_invariants.map(({ id }) => id),
    ...(mindState.atoms ?? []).map(({ atomId }) => atomId),
    ...(relevantMemory === undefined || relevantMemory === null
      ? []
      : [relevantMemory.memoryId]),
  ]);
  const unavailable = grounding.find(({ source }) => !allowed.has(source));
  if (unavailable !== undefined) {
    throw new Error(`Persona cited unavailable source: ${unavailable.source}`);
  }
};

const activeAuthoredPressures = (
  mindState: PersonaTurnRequest["mindState"],
): ScenePacket["active_authored_pressures"] =>
  (mindState.atoms ?? []).flatMap((atom) =>
    atom.kind === "pressure" && atom.status !== "resolved"
      ? [
          {
            atom_id: atom.atomId,
            description: atom.description,
            status: atom.status,
          },
        ]
      : [],
  );

const validateSupportingSources = (
  personaSourceId: string,
  outputs: Array<{ supporting_persona_source_ids: string[] }>,
  mindState?: PersonaTurnRequest["mindState"],
): void => {
  const allowed = new Set([
    personaSourceId,
    ...(mindState?.atoms ?? []).map(
      ({ atomId }) => `mind.atom.${atomId}`,
    ),
  ]);
  for (const output of outputs) {
    const unavailable = output.supporting_persona_source_ids.find(
      (sourceId) => !allowed.has(sourceId),
    );
    if (unavailable !== undefined) {
      throw new Error(`Judge cited unavailable Persona source: ${unavailable}`);
    }
  }
};

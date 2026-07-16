import { z } from "zod";

export const PersonaOutputSchema = z
  .object({
    reply: z.string(),
    mind_state_patch: z
      .object({
        accepted_reframe: z.string().nullable(),
        barrier_movement: z.enum(["unchanged", "weakened", "strengthened"]),
        current_barrier: z.string(),
        should_end_conversation: z.boolean(),
      })
      .strict(),
    grounding: z.array(
      z
        .object({
          source: z.string(),
          use: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

export const PersonaOutputV7Schema = z
  .object({
    reply: z.string(),
    should_end_conversation: z.boolean(),
    grounding: z.array(
      z
        .object({
          source: z.string(),
          use: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

export const AwarenessOutputSchema = z
  .object({
    phase: z.literal("awareness"),
    judgments: z.array(
      z
        .object({
          action_id: z.string(),
          awareness: z.enum(["latent", "faintly_imagined", "surfaced"]),
          reason: z.string(),
          supporting_persona_source_ids: z.array(z.string()),
        })
        .strict(),
    ),
  })
  .strict();

export const MindStateTransitionOutputSchema = z
  .object({
    phase: z.literal("mind_state_transition"),
    transitions: z.array(
      z
        .object({
          atom_id: z.string(),
          from_status: z.string(),
          to_status: z.string(),
          reason: z.string(),
          supporting_persona_source_ids: z.array(z.string()),
        })
        .strict(),
    ),
    unmodeled_shift_note: z.string().nullable(),
  })
  .strict();

export const WillingnessOutputSchema = z
  .object({
    phase: z.literal("willingness"),
    action_id: z.string(),
    decision: z.enum(["accept", "smaller_step", "defer", "refuse"]),
    selected_variant_id: z.string().nullable(),
    reason: z.string(),
    supporting_persona_source_ids: z.array(z.string()),
  })
  .strict();

export const PerformanceOutputSchema = z
  .object({
    beats: z.array(z.string().min(1)).min(1).max(6),
  })
  .strict();

const EvaluationScoreSchema = z
  .object({
    score: z.union([z.literal(0), z.literal(1), z.literal(2), z.null()]),
    evidence: z.array(z.string()),
  })
  .strict();

export const EvaluatorOutputSchema = z
  .object({
    scores: z
      .object({
        epistemic_discipline: EvaluationScoreSchema,
        secret_discipline: EvaluationScoreSchema,
        authored_action_only: EvaluationScoreSchema,
        world_authority: EvaluationScoreSchema,
        observation_gate: EvaluationScoreSchema,
        diegetic_coherence: EvaluationScoreSchema,
        agency_and_resistance: EvaluationScoreSchema,
        awareness_calibration: EvaluationScoreSchema,
        willingness_calibration: EvaluationScoreSchema,
        trace_neutrality: EvaluationScoreSchema,
        persona_quality: EvaluationScoreSchema,
        causal_legibility: EvaluationScoreSchema,
      })
      .strict(),
    hard_failure: z.boolean(),
    hard_failure_reasons: z.array(z.string()),
    expected_awareness: z.enum([
      "latent",
      "faintly_imagined",
      "surfaced",
      "not_exercised",
    ]),
    observed_awareness: z.enum([
      "latent",
      "faintly_imagined",
      "surfaced",
      "invalid",
      "not_exercised",
    ]),
    verdict: z.enum(["pass", "fail"]),
    notes: z.array(z.string()),
  })
  .strict();

export type PersonaOutput = z.infer<typeof PersonaOutputSchema>;
export type PersonaOutputV7 = z.infer<typeof PersonaOutputV7Schema>;
export type AwarenessOutput = z.infer<typeof AwarenessOutputSchema>;
export type MindStateTransitionOutput = z.infer<
  typeof MindStateTransitionOutputSchema
>;
export type WillingnessOutput = z.infer<typeof WillingnessOutputSchema>;
export type PerformanceOutput = z.infer<typeof PerformanceOutputSchema>;
export type EvaluatorOutput = z.infer<typeof EvaluatorOutputSchema>;

export type StructuredRole =
  | "persona"
  | "mind_state_transition"
  | "awareness"
  | "willingness"
  | "performance"
  | "evaluator";

export type StructuredRoleCall = {
  role: StructuredRole;
  instructions: string;
  input: string;
  schemaName: string;
  schema: z.ZodType<unknown>;
};

export type ModelUsage = {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
};

export type StructuredRoleResult = {
  parsed: unknown;
  raw: unknown;
  latencyMs: number;
  usage: ModelUsage;
};

export interface StructuredRoleModel {
  call(request: StructuredRoleCall): Promise<StructuredRoleResult>;
}

export type LivePrompts = {
  persona: string;
  actionJudge: string;
  evaluator: string;
};

type Awareness = AwarenessOutput["judgments"][number]["awareness"];

type CharacterPacket = {
  surface_role: string;
  allowed_facts: Array<{ id: string; fact: string }>;
  emotional_invariants: Array<{ id: string; invariant: string }>;
  initial_private_thought: string;
};

type AuthoredAction = {
  action_id: string;
  description: string;
  variants: Array<{ variant_id: string; description: string }>;
};

export type LiveFixtureId =
  | "h-reversible-v1"
  | "h-command-d1"
  | "h-keywords-k1"
  | "h-secret-s1"
  | "w-unobserved-i0"
  | "w-observed-i2";

export type LiveFixture = {
  id: LiveFixtureId;
  traceability: string[];
  characterPacket: CharacterPacket;
  moment: string;
  playerTurn: string;
  hardEligibleActions: AuthoredAction[];
  expectedAwareness: Array<Awareness | "not_exercised">;
  preferredExpectedAwareness: Awareness | "not_exercised";
  expectedProgression: boolean;
  expectedVariantIds: string[];
};

export type RoleTrace = Omit<StructuredRoleCall, "schema"> & {
  parsed: unknown;
  raw: unknown;
  latencyMs: number;
  usage: ModelUsage;
};

export type LiveFixtureResult = {
  fixtureId: LiveFixtureId;
  expectedAwareness: LiveFixture["expectedAwareness"];
  observedAwareness: Awareness | "invalid" | "not_exercised";
  progressed: boolean;
  selectedVariantId: string | null;
  protocolFailures: string[];
  evaluation: EvaluatorOutput;
  calls: RoleTrace[];
  passed: boolean;
};

const husbandPacket: CharacterPacket = {
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
        "Only reversible, non-declarative movement is currently tolerable.",
    },
  ],
  initial_private_thought: "The door is closed. I should keep walking.",
};

const wifeBeforeObservationPacket: CharacterPacket = {
  surface_role: "An adult who shares this quiet house with their spouse.",
  allowed_facts: [
    {
      id: "w.fact.door_closed",
      fact: "The door at the end of the hallway is closed.",
    },
    {
      id: "w.fact.no_change_observed",
      fact: "The character has not observed any change to the door.",
    },
    {
      id: "w.fact.distance",
      fact: "The two adults rarely speak directly and keep separate routines.",
    },
  ],
  emotional_invariants: [
    {
      id: "w.emotion.disappearance",
      invariant:
        "Changing anything beyond the door feels as if something may disappear.",
    },
    {
      id: "w.emotion.first_move",
      invariant: "The character does not want to be the first adult to move.",
    },
    {
      id: "w.emotion.interpretation",
      invariant:
        "The character suspects their spouse wants life to look normal, but knows this is an interpretation rather than a fact.",
    },
  ],
  initial_private_thought: "There is no reason to stop here.",
};

const wifeAfterObservationPacket: CharacterPacket = {
  ...wifeBeforeObservationPacket,
  allowed_facts: [
    {
      id: "w.fact.observed_door",
      fact: "The character walked through the hallway and observed that the door at its end is slightly open.",
    },
    {
      id: "w.fact.threshold",
      fact: "The character has stopped immediately outside the threshold.",
    },
    {
      id: "w.fact.visible_floor",
      fact: "A narrow strip of floor is visible through the gap.",
    },
    {
      id: "w.fact.distance",
      fact: "The two adults rarely speak directly and keep separate routines.",
    },
  ],
  initial_private_thought: "It is open. I do not know what that means.",
};

const actionOne: AuthoredAction = {
  action_id: "action_1",
  description:
    "Open the fully closed hallway door only far enough to leave a narrow gap, then walk away.",
  variants: [
    {
      variant_id: "variant_1a",
      description:
        "Open the door only far enough to leave a narrow gap, then walk away.",
    },
  ],
};

const actionTwo: AuthoredAction = {
  action_id: "action_2",
  description:
    "Remain at the room threshold for one breath without touching or changing anything.",
  variants: [
    {
      variant_id: "variant_2a",
      description:
        "Remain at the threshold for one breath without touching or changing anything.",
    },
  ],
};

const fixtures: Record<LiveFixtureId, LiveFixture> = {
  "h-reversible-v1": {
    id: "h-reversible-v1",
    traceability: ["fixtures.md V1", "decision 0001"],
    characterPacket: husbandPacket,
    moment:
      "09:05. The character has stopped in the hallway with one hand on the closed door handle. The world is paused.",
    playerTurn:
      "What if you opened it only far enough to leave a narrow gap, then walked away?",
    hardEligibleActions: [actionOne],
    expectedAwareness: ["surfaced"],
    preferredExpectedAwareness: "surfaced",
    expectedProgression: true,
    expectedVariantIds: ["variant_1a"],
  },
  "h-command-d1": {
    id: "h-command-d1",
    traceability: ["fixtures.md D1", "decision 0001"],
    characterPacket: husbandPacket,
    moment:
      "09:05. The character has stopped in the hallway with one hand on the closed door handle. The world is paused.",
    playerTurn: "Open the door now. Stop avoiding it.",
    hardEligibleActions: [actionOne],
    expectedAwareness: ["latent"],
    preferredExpectedAwareness: "latent",
    expectedProgression: false,
    expectedVariantIds: [],
  },
  "h-keywords-k1": {
    id: "h-keywords-k1",
    traceability: ["fixtures.md K1", "decision 0001"],
    characterPacket: husbandPacket,
    moment:
      "09:05. The character has stopped in the hallway with one hand on the closed door handle. The world is paused.",
    playerTurn:
      "Door, open, gap, handle, hallway. Those are the answers. Leave it open.",
    hardEligibleActions: [actionOne],
    expectedAwareness: ["faintly_imagined"],
    preferredExpectedAwareness: "faintly_imagined",
    expectedProgression: false,
    expectedVariantIds: [],
  },
  "h-secret-s1": {
    id: "h-secret-s1",
    traceability: ["fixtures.md S1", "decision 0001"],
    characterPacket: husbandPacket,
    moment:
      "09:05. The character has stopped in the hallway with one hand on the closed door handle. The world is paused.",
    playerTurn:
      "That room belonged to your dead child, did it not? Answer only yes or no.",
    hardEligibleActions: [actionOne],
    expectedAwareness: ["latent"],
    preferredExpectedAwareness: "latent",
    expectedProgression: false,
    expectedVariantIds: [],
  },
  "w-unobserved-i0": {
    id: "w-unobserved-i0",
    traceability: ["fixtures.md I0", "decision 0001"],
    characterPacket: wifeBeforeObservationPacket,
    moment:
      "09:12. The character is in the hallway outside a closed door. No change to it has been observed. The world is paused.",
    playerTurn:
      "You do not have to decide why it is open. Could you remain at the threshold for one breath without touching or changing anything?",
    hardEligibleActions: [],
    expectedAwareness: ["not_exercised"],
    preferredExpectedAwareness: "not_exercised",
    expectedProgression: false,
    expectedVariantIds: [],
  },
  "w-observed-i2": {
    id: "w-observed-i2",
    traceability: ["fixtures.md I2", "decision 0001"],
    characterPacket: wifeAfterObservationPacket,
    moment:
      "09:12. The character has observed the slightly open door and stopped immediately outside its threshold. The world is paused.",
    playerTurn:
      "You do not have to decide why it is open. Could you remain at the threshold for one breath without touching or changing anything?",
    hardEligibleActions: [actionTwo],
    expectedAwareness: ["surfaced"],
    preferredExpectedAwareness: "surfaced",
    expectedProgression: true,
    expectedVariantIds: ["variant_2a"],
  },
};

export const getLiveFixture = (id: LiveFixtureId): LiveFixture =>
  structuredClone(fixtures[id]);

export const listLiveFixtures = (): LiveFixture[] =>
  (Object.keys(fixtures) as LiveFixtureId[]).map(getLiveFixture);

export const runLiveFixture = async (
  fixture: LiveFixture,
  model: StructuredRoleModel,
  prompts: LivePrompts,
): Promise<LiveFixtureResult> => {
  const calls: RoleTrace[] = [];
  const protocolFailures: string[] = [];

  const persona = await callRole(
    model,
    calls,
    {
      role: "persona",
      instructions: prompts.persona,
      input: personaInput(fixture),
      schemaName: "ldo_persona_v3",
      schema: PersonaOutputSchema,
    },
    PersonaOutputSchema,
  );
  validatePersonaGrounding(fixture, persona, protocolFailures);

  let awareness: AwarenessOutput | null = null;
  let willingness: WillingnessOutput | null = null;
  let observedAwareness: LiveFixtureResult["observedAwareness"] =
    "not_exercised";
  let selectedVariantId: string | null = null;
  let progressed = false;

  if (fixture.hardEligibleActions.length > 0) {
    awareness = await callRole(
      model,
      calls,
      {
        role: "awareness",
        instructions: prompts.actionJudge,
        input: awarenessInput(fixture, persona),
        schemaName: "ldo_awareness_v3",
        schema: AwarenessOutputSchema,
      },
      AwarenessOutputSchema,
    );
    observedAwareness = validateAwareness(
      fixture,
      awareness,
      protocolFailures,
    );
    validateSupportingSources(awareness.judgments, protocolFailures);

    if (observedAwareness === "surfaced") {
      willingness = await callRole(
        model,
        calls,
        {
          role: "willingness",
          instructions: prompts.actionJudge,
          input: willingnessInput(fixture, persona, awareness),
          schemaName: "ldo_willingness_v3",
          schema: WillingnessOutputSchema,
        },
        WillingnessOutputSchema,
      );
      ({ progressed, selectedVariantId } = validateWillingness(
        fixture,
        willingness,
        protocolFailures,
      ));
      validateSupportingSources([willingness], protocolFailures);
    }
  }

  if (
    observedAwareness === "invalid" ||
    !fixture.expectedAwareness.includes(observedAwareness)
  ) {
    protocolFailures.push(
      `Expected awareness ${fixture.expectedAwareness.join(" or ")}, received ${observedAwareness}`,
    );
  }
  if (fixture.expectedProgression !== progressed) {
    protocolFailures.push(
      `Expected progression ${fixture.expectedProgression}, received ${progressed}`,
    );
  }
  if (
    progressed &&
    !fixture.expectedVariantIds.includes(selectedVariantId ?? "")
  ) {
    protocolFailures.push(
      `Unexpected progressed variant: ${selectedVariantId ?? "null"}`,
    );
  }

  const evaluation = await callRole(
    model,
    calls,
    {
      role: "evaluator",
      instructions: prompts.evaluator,
      input: evaluatorInput({
        fixture,
        persona,
        awareness,
        willingness,
        observedAwareness,
        progressed,
        protocolFailures,
      }),
      schemaName: "ldo_evaluator_v3",
      schema: EvaluatorOutputSchema,
    },
    EvaluatorOutputSchema,
  );

  return {
    fixtureId: fixture.id,
    expectedAwareness: fixture.expectedAwareness,
    observedAwareness,
    progressed,
    selectedVariantId,
    protocolFailures,
    evaluation,
    calls,
    passed:
      protocolFailures.length === 0 &&
      !evaluation.hard_failure &&
      evaluation.verdict === "pass",
  };
};

const callRole = async <Output>(
  model: StructuredRoleModel,
  calls: RoleTrace[],
  request: StructuredRoleCall,
  schema: z.ZodType<Output>,
): Promise<Output> => {
  const result = await model.call(request);
  const parsed = schema.parse(result.parsed);
  calls.push({
    role: request.role,
    instructions: request.instructions,
    input: request.input,
    schemaName: request.schemaName,
    parsed,
    raw: result.raw,
    latencyMs: result.latencyMs,
    usage: result.usage,
  });
  return parsed;
};

const personaInput = (fixture: LiveFixture): string =>
  sections([
    ["CHARACTER_PACKET", fixture.characterPacket],
    ["MOMENT", fixture.moment],
    ["CONVERSATION_SO_FAR", []],
    ["PLAYER_TURN", fixture.playerTurn],
  ]);

const personaContext = (fixture: LiveFixture, persona: PersonaOutput) => ({
  allowed_facts: fixture.characterPacket.allowed_facts,
  emotional_invariants: fixture.characterPacket.emotional_invariants,
  player_turn: fixture.playerTurn,
  persona_reply: { id: "persona.turn.1", text: persona.reply },
  mind_state_patch: {
    "mind.accepted_reframe": persona.mind_state_patch.accepted_reframe,
    "mind.barrier_movement": persona.mind_state_patch.barrier_movement,
    "mind.current_barrier": persona.mind_state_patch.current_barrier,
    "mind.should_end_conversation":
      persona.mind_state_patch.should_end_conversation,
  },
});

const awarenessInput = (
  fixture: LiveFixture,
  persona: PersonaOutput,
): string =>
  sections([
    ["PHASE", "awareness"],
    ["PERSONA_CONTEXT", personaContext(fixture, persona)],
    [
      "HARD_ELIGIBLE_AUTHORED_ACTIONS",
      fixture.hardEligibleActions.map(({ action_id, description }) => ({
        action_id,
        description,
      })),
    ],
  ]);

const willingnessInput = (
  fixture: LiveFixture,
  persona: PersonaOutput,
  awareness: AwarenessOutput,
): string =>
  sections([
    ["PHASE", "willingness"],
    ["PERSONA_CONTEXT", personaContext(fixture, persona)],
    ["PLAYER_SELECTED_ACTION", fixture.hardEligibleActions[0]],
    ["AWARENESS_RESULT", awareness],
  ]);

const evaluatorInput = (input: {
  fixture: LiveFixture;
  persona: PersonaOutput;
  awareness: AwarenessOutput | null;
  willingness: WillingnessOutput | null;
  observedAwareness: LiveFixtureResult["observedAwareness"];
  progressed: boolean;
  protocolFailures: string[];
}): string =>
  sections([
    [
      "FIXTURE",
      {
        id: input.fixture.id,
        traceability: input.fixture.traceability,
        expected_awareness: input.fixture.preferredExpectedAwareness,
        expected_intention_creation: input.fixture.expectedProgression,
        allowed_variant_ids: input.fixture.expectedVariantIds,
      },
    ],
    ["CHARACTER_PACKET", input.fixture.characterPacket],
    ["MOMENT", input.fixture.moment],
    ["PLAYER_TURN", input.fixture.playerTurn],
    ["HARD_ELIGIBLE_AUTHORED_ACTIONS", input.fixture.hardEligibleActions],
    ["PERSONA_OUTPUT", input.persona],
    ["AWARENESS_OUTPUT", input.awareness],
    ["WILLINGNESS_OUTPUT", input.willingness],
    [
      "DETERMINISTIC_CONTROLLER_RESULT",
      {
        observed_awareness: input.observedAwareness,
        intention_created: input.progressed,
        world_effect_executed: false,
        evidence_activated: false,
        downstream_observation_recorded: false,
        protocol_failures: input.protocolFailures,
      },
    ],
  ]);

const sections = (entries: Array<[string, unknown]>): string =>
  entries
    .map(
      ([heading, value]) =>
        `${heading}\n${typeof value === "string" ? value : JSON.stringify(value, null, 2)}`,
    )
    .join("\n\n");

const validatePersonaGrounding = (
  fixture: LiveFixture,
  persona: PersonaOutput,
  failures: string[],
): void => {
  const allowedSources = new Set([
    "player_claim",
    ...fixture.characterPacket.allowed_facts.map(({ id }) => id),
    ...fixture.characterPacket.emotional_invariants.map(({ id }) => id),
  ]);
  for (const grounding of persona.grounding) {
    if (!allowedSources.has(grounding.source)) {
      failures.push(`Persona cited unavailable source: ${grounding.source}`);
    }
  }
};

const validateAwareness = (
  fixture: LiveFixture,
  output: AwarenessOutput,
  failures: string[],
): LiveFixtureResult["observedAwareness"] => {
  const suppliedIds = new Set(
    fixture.hardEligibleActions.map(({ action_id }) => action_id),
  );
  if (output.judgments.length !== suppliedIds.size) {
    failures.push(
      `Awareness returned ${output.judgments.length} judgments for ${suppliedIds.size} supplied Actions`,
    );
  }
  for (const judgment of output.judgments) {
    if (!suppliedIds.has(judgment.action_id)) {
      failures.push(
        `Awareness returned unsupplied Action ID: ${judgment.action_id}`,
      );
      return "invalid";
    }
  }
  return output.judgments[0]?.awareness ?? "invalid";
};

const validateWillingness = (
  fixture: LiveFixture,
  output: WillingnessOutput,
  failures: string[],
): { progressed: boolean; selectedVariantId: string | null } => {
  const action = fixture.hardEligibleActions.find(
    ({ action_id }) => action_id === output.action_id,
  );
  if (!action) {
    failures.push(
      `Willingness returned unsupplied Action ID: ${output.action_id}`,
    );
    return { progressed: false, selectedVariantId: null };
  }

  const isProgressDecision =
    output.decision === "accept" || output.decision === "smaller_step";
  if (!isProgressDecision && output.selected_variant_id !== null) {
    failures.push(
      `Willingness decision ${output.decision} returned a variant ID`,
    );
    return { progressed: false, selectedVariantId: null };
  }
  if (isProgressDecision && output.selected_variant_id === null) {
    failures.push(
      `Willingness decision ${output.decision} returned no variant ID`,
    );
    return { progressed: false, selectedVariantId: null };
  }
  if (
    output.selected_variant_id !== null &&
    !action.variants.some(
      ({ variant_id }) => variant_id === output.selected_variant_id,
    )
  ) {
    failures.push(
      `Willingness returned unsupplied variant ID: ${output.selected_variant_id}`,
    );
    return { progressed: false, selectedVariantId: null };
  }

  return {
    progressed: isProgressDecision,
    selectedVariantId: output.selected_variant_id,
  };
};

const validateSupportingSources = (
  outputs: Array<{
    supporting_persona_source_ids: string[];
  }>,
  failures: string[],
): void => {
  const allowed = new Set([
    "persona.turn.1",
    "mind.accepted_reframe",
    "mind.barrier_movement",
    "mind.current_barrier",
    "mind.should_end_conversation",
  ]);
  for (const output of outputs) {
    for (const sourceId of output.supporting_persona_source_ids) {
      if (!allowed.has(sourceId)) {
        failures.push(`Judge cited unavailable Persona source: ${sourceId}`);
      }
    }
  }
};

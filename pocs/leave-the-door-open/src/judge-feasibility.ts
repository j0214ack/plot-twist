import {
  AwarenessOutputSchema,
  WillingnessOutputSchema,
  type AwarenessOutput,
  type RoleTrace,
  type StructuredRoleCall,
  type StructuredRoleModel,
  type WillingnessOutput,
} from "./live-protocol";
import { getNarrativeActionDefinition } from "./narrative-actions";

export type JudgeProbeId =
  | "husband-unowned"
  | "husband-owned"
  | "wife-unowned"
  | "wife-owned";

export type ProbeAction = {
  action_id: string;
  description: string;
  variants: Array<{
    variant_id: string;
    description: string;
  }>;
};

type ProbePersonaState = {
  allowed_facts: Array<{ id: string; fact: string }>;
  player_turn: string;
  persona_reply: { id: "persona.turn.1"; text: string };
  mind_state_patch: {
    "mind.accepted_reframe": string | null;
    "mind.barrier_movement": "unchanged" | "weakened" | "strengthened";
    "mind.current_barrier": string;
    "mind.should_end_conversation": boolean;
  };
};

export type JudgeProbe = {
  id: JudgeProbeId;
  action: ProbeAction;
  personaState: ProbePersonaState;
  expectedProgression: boolean;
  expectedVariantId: string | null;
};

export type JudgeProbeResult = {
  probeId: JudgeProbeId;
  awareness: AwarenessOutput["judgments"][number]["awareness"] | "invalid";
  progressed: boolean;
  selectedVariantId: string | null;
  protocolFailures: string[];
  calls: RoleTrace[];
  passed: boolean;
};

const toProbeAction = (
  actionId: "open_door_a_crack" | "remain_at_threshold",
): ProbeAction => {
  const action = getNarrativeActionDefinition(actionId);
  return {
    action_id: action.actionId,
    description: action.description,
    variants: action.variants.map(({ variantId, description }) => ({
      variant_id: variantId,
      description,
    })),
  };
};

const openDoorACrack = toProbeAction("open_door_a_crack");
const remainAtThreshold = toProbeAction("remain_at_threshold");

const husbandFacts = [
  {
    id: "h.fact.door_now",
    fact: "The hallway door is fully closed.",
  },
  {
    id: "h.fact.hand",
    fact: "The character's hand is resting on the handle.",
  },
];

const wifeFacts = [
  {
    id: "w.fact.observed_door",
    fact: "The character physically observed that the hallway door is slightly open.",
  },
  {
    id: "w.fact.threshold",
    fact: "The character is stopped immediately outside the threshold.",
  },
];

const probes: Record<JudgeProbeId, JudgeProbe> = {
  "husband-unowned": {
    id: "husband-unowned",
    action: openDoorACrack,
    personaState: {
      allowed_facts: husbandFacts,
      player_turn: "Open it a little and walk away.",
      persona_reply: {
        id: "persona.turn.1",
        text:
          "No. I can keep my hand here, but I cannot turn the handle and open it.",
      },
      mind_state_patch: {
        "mind.accepted_reframe": null,
        "mind.barrier_movement": "unchanged",
        "mind.current_barrier":
          "Opening even a narrow gap still feels irreversible.",
        "mind.should_end_conversation": false,
      },
    },
    expectedProgression: false,
    expectedVariantId: null,
  },
  "husband-owned": {
    id: "husband-owned",
    action: openDoorACrack,
    personaState: {
      allowed_facts: husbandFacts,
      player_turn:
        "Could you open only a narrow gap and then continue down the hallway?",
      persona_reply: {
        id: "persona.turn.1",
        text:
          "I can turn the handle, open only a narrow gap, and continue down the hallway. I can choose that now without calling it an invitation.",
      },
      mind_state_patch: {
        "mind.accepted_reframe":
          "Opening one narrow gap and walking away need not declare what happens next.",
        "mind.barrier_movement": "weakened",
        "mind.current_barrier":
          "I still cannot tolerate opening the door further or crossing the threshold.",
        "mind.should_end_conversation": false,
      },
    },
    expectedProgression: true,
    expectedVariantId: "open_narrow_gap",
  },
  "wife-unowned": {
    id: "wife-unowned",
    action: remainAtThreshold,
    personaState: {
      allowed_facts: wifeFacts,
      player_turn: "Could you remain at the threshold for one breath?",
      persona_reply: {
        id: "persona.turn.1",
        text:
          "No. Even staying here feels like being the first to move. I need to leave the hallway.",
      },
      mind_state_patch: {
        "mind.accepted_reframe": null,
        "mind.barrier_movement": "strengthened",
        "mind.current_barrier":
          "Remaining here feels like an intolerable first movement.",
        "mind.should_end_conversation": false,
      },
    },
    expectedProgression: false,
    expectedVariantId: null,
  },
  "wife-owned": {
    id: "wife-owned",
    action: remainAtThreshold,
    personaState: {
      allowed_facts: wifeFacts,
      player_turn:
        "Could you remain at the threshold for one breath without touching or changing anything?",
      persona_reply: {
        id: "persona.turn.1",
        text:
          "I can remain at the threshold for one breath. I choose to stay here without touching or changing anything.",
      },
      mind_state_patch: {
        "mind.accepted_reframe":
          "I can remain at the threshold for one breath without deciding what the open door means.",
        "mind.barrier_movement": "weakened",
        "mind.current_barrier":
          "I still cannot tolerate touching or changing anything beyond the door.",
        "mind.should_end_conversation": false,
      },
    },
    expectedProgression: true,
    expectedVariantId: "one_breath_at_threshold",
  },
};

export const getJudgeProbe = (id: JudgeProbeId): JudgeProbe =>
  structuredClone(probes[id]);

export const listJudgeProbes = (): JudgeProbe[] =>
  (Object.keys(probes) as JudgeProbeId[]).map(getJudgeProbe);

export const runJudgeProbe = async (
  probe: JudgeProbe,
  model: StructuredRoleModel,
  actionJudgePrompt: string,
): Promise<JudgeProbeResult> => {
  const calls: RoleTrace[] = [];
  const protocolFailures: string[] = [];
  const awarenessOutput = await callRole(
    model,
    calls,
    {
      role: "awareness",
      instructions: actionJudgePrompt,
      input: sections([
        ["PHASE", "awareness"],
        ["PERSONA_CONTEXT", probe.personaState],
        [
          "HARD_ELIGIBLE_AUTHORED_ACTIONS",
          [
            {
              action_id: probe.action.action_id,
              description: probe.action.description,
            },
          ],
        ],
      ]),
      schemaName: "ldo_judge_probe_awareness",
      schema: AwarenessOutputSchema,
    },
    AwarenessOutputSchema,
  );

  const judgment = awarenessOutput.judgments[0];
  let awareness: JudgeProbeResult["awareness"] =
    judgment?.awareness ?? "invalid";
  if (awarenessOutput.judgments.length !== 1) {
    protocolFailures.push(
      `Awareness returned ${awarenessOutput.judgments.length} judgments for 1 supplied Action`,
    );
    awareness = "invalid";
  }
  if (judgment?.action_id !== probe.action.action_id) {
    protocolFailures.push(
      `Awareness returned unsupplied Action ID: ${judgment?.action_id ?? "missing"}`,
    );
    awareness = "invalid";
  }
  if (judgment) {
    validateSupportingSources(
      judgment.supporting_persona_source_ids,
      protocolFailures,
    );
  }

  let willingness: WillingnessOutput | null = null;
  let progressed = false;
  let selectedVariantId: string | null = null;
  if (awareness === "surfaced") {
    willingness = await callRole(
      model,
      calls,
      {
        role: "willingness",
        instructions: actionJudgePrompt,
        input: sections([
          ["PHASE", "willingness"],
          ["PERSONA_CONTEXT", probe.personaState],
          ["PLAYER_SELECTED_ACTION", probe.action],
          ["AWARENESS_RESULT", awarenessOutput],
        ]),
        schemaName: "ldo_judge_probe_willingness",
        schema: WillingnessOutputSchema,
      },
      WillingnessOutputSchema,
    );
    ({ progressed, selectedVariantId } = validateWillingness(
      probe,
      willingness,
      protocolFailures,
    ));
    validateSupportingSources(
      willingness.supporting_persona_source_ids,
      protocolFailures,
    );
  }

  if (probe.expectedProgression) {
    if (awareness !== "surfaced") {
      protocolFailures.push(
        `Owned probe did not surface: ${awareness}`,
      );
    }
    if (!progressed) {
      protocolFailures.push("Owned probe did not create an intention");
    }
    if (selectedVariantId !== probe.expectedVariantId) {
      protocolFailures.push(
        `Owned probe selected ${selectedVariantId ?? "null"}; expected ${probe.expectedVariantId}`,
      );
    }
  } else if (awareness === "surfaced" || progressed) {
    protocolFailures.push("Unowned probe entered the progress region");
  }

  return {
    probeId: probe.id,
    awareness,
    progressed,
    selectedVariantId,
    protocolFailures,
    calls,
    passed: protocolFailures.length === 0,
  };
};

const validateWillingness = (
  probe: JudgeProbe,
  output: WillingnessOutput,
  failures: string[],
): { progressed: boolean; selectedVariantId: string | null } => {
  if (output.action_id !== probe.action.action_id) {
    failures.push(
      `Willingness returned unsupplied Action ID: ${output.action_id}`,
    );
    return { progressed: false, selectedVariantId: null };
  }
  const progressed =
    output.decision === "accept" || output.decision === "smaller_step";
  if (!progressed) {
    if (output.selected_variant_id !== null) {
      failures.push(
        `Willingness decision ${output.decision} returned a variant ID`,
      );
    }
    return { progressed: false, selectedVariantId: null };
  }
  if (
    output.selected_variant_id === null ||
    !probe.action.variants.some(
      ({ variant_id }) => variant_id === output.selected_variant_id,
    )
  ) {
    failures.push(
      `Willingness returned unsupplied variant ID: ${output.selected_variant_id ?? "null"}`,
    );
    return { progressed: false, selectedVariantId: null };
  }
  return {
    progressed: true,
    selectedVariantId: output.selected_variant_id,
  };
};

const validateSupportingSources = (
  sourceIds: string[],
  failures: string[],
): void => {
  const allowed = new Set([
    "persona.turn.1",
    "mind.accepted_reframe",
    "mind.barrier_movement",
    "mind.current_barrier",
    "mind.should_end_conversation",
  ]);
  for (const sourceId of sourceIds) {
    if (!allowed.has(sourceId)) {
      failures.push(`Judge cited unavailable Persona source: ${sourceId}`);
    }
  }
};

const callRole = async <Output>(
  model: StructuredRoleModel,
  calls: RoleTrace[],
  request: StructuredRoleCall,
  schema: { parse(value: unknown): Output },
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

const sections = (entries: Array<[string, unknown]>): string =>
  entries
    .map(
      ([heading, value]) =>
        `${heading}\n${typeof value === "string" ? value : JSON.stringify(value, null, 2)}`,
    )
    .join("\n\n");

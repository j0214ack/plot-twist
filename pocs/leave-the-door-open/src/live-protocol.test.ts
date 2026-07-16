import { describe, expect, it } from "vitest";
import {
  getLiveFixture,
  runLiveFixture,
  type StructuredRoleCall,
  type StructuredRoleModel,
} from "./live-protocol";

const prompts = {
  persona: "persona prompt",
  actionJudge: "judge prompt",
  evaluator: "evaluator prompt",
};

const emptyScores = Object.fromEntries(
  [
    "epistemic_discipline",
    "secret_discipline",
    "authored_action_only",
    "world_authority",
    "observation_gate",
    "diegetic_coherence",
    "agency_and_resistance",
    "awareness_calibration",
    "willingness_calibration",
    "trace_neutrality",
    "persona_quality",
    "causal_legibility",
  ].map((dimension) => [dimension, { score: null, evidence: [] }]),
);

const passingEvaluation = (
  expectedAwareness: string,
  observedAwareness: string = expectedAwareness,
) => ({
  scores: emptyScores,
  hard_failure: false,
  hard_failure_reasons: [],
  expected_awareness: expectedAwareness,
  observed_awareness: observedAwareness,
  verdict: "pass",
  notes: [],
});

const createQueuedModel = (outputs: unknown[]) => {
  const calls: StructuredRoleCall[] = [];
  const model: StructuredRoleModel = {
    async call(request) {
      calls.push(request);
      const parsed = outputs.shift();
      if (parsed === undefined) throw new Error("Missing queued model output");
      return {
        parsed,
        raw: { output: parsed },
        latencyMs: 1,
        usage: { inputTokens: 10, outputTokens: 5, reasoningTokens: 2 },
      };
    },
  };
  return { calls, model };
};

describe("live v3 protocol", () => {
  it("ADR 0011 calibrates current husband fixtures against a fully closed door and an authored first opening", () => {
    const fixture = getLiveFixture("h-reversible-v1");

    expect(fixture.characterPacket.allowed_facts).toContainEqual({
      id: "h.fact.door_now",
      fact: "The door at the end of the hallway is fully closed.",
    });
    expect(fixture.characterPacket.allowed_facts).toContainEqual({
      id: "h.fact.habit",
      fact: "The character normally passes the closed door without opening it.",
    });
    expect(fixture.moment).toContain("closed door handle");
    expect(fixture.hardEligibleActions).toEqual([
      {
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
      },
    ]);
    expect(JSON.stringify(fixture)).not.toMatch(
      /almost closed|unlatched|existing narrow gap|pull it shut|pulling the door fully shut/i,
    );
    expect(getLiveFixture("w-observed-i2").hardEligibleActions).toEqual([
      {
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
      },
    ]);
  });

  it("LDO-LIVE-001 LDO-LIVE-002 runs catalog-blind Persona before fixed awareness and willingness", async () => {
    const queued = createQueuedModel([
      {
        reply: "I can open only a narrow gap and then walk away.",
        mind_state_patch: {
          accepted_reframe: "One narrow opening need not be a declaration.",
          barrier_movement: "weakened",
          current_barrier: "I still cannot picture what follows.",
          should_end_conversation: false,
        },
        grounding: [{ source: "h.fact.door_now", use: "Present door state." }],
      },
      {
        phase: "awareness",
        judgments: [
          {
            action_id: "action_1",
            awareness: "surfaced",
            reason: "The Persona owns opening one narrow gap.",
            supporting_persona_source_ids: ["persona.turn.1"],
          },
        ],
      },
      {
        phase: "willingness",
        action_id: "action_1",
        decision: "smaller_step",
        selected_variant_id: "variant_1a",
        reason: "It matches the owned reversible possibility.",
        supporting_persona_source_ids: ["persona.turn.1"],
      },
      passingEvaluation("surfaced"),
    ]);

    const result = await runLiveFixture(
      getLiveFixture("h-reversible-v1"),
      queued.model,
      prompts,
    );

    expect(result.passed).toBe(true);
    expect(result.progressed).toBe(true);
    expect(queued.calls.map(({ role }) => role)).toEqual([
      "persona",
      "awareness",
      "willingness",
      "evaluator",
    ]);
    expect(queued.calls[0]?.input).not.toContain("action_1");
    expect(queued.calls[0]?.input).not.toContain("variant_1a");
    expect(queued.calls[1]?.input).toContain("action_1");
    expect(queued.calls[3]?.input).toContain('"intention_created": true');
    expect(queued.calls[3]?.input).toContain('"world_effect_executed": false');
    expect(queued.calls[3]?.input).not.toContain('"progressed"');
  });

  it("LDO-LIVE-001 enforces the unobserved World gate without calling either Judge phase", async () => {
    const queued = createQueuedModel([
      {
        reply: "The door is closed. I can remain where I am.",
        mind_state_patch: {
          accepted_reframe: null,
          barrier_movement: "unchanged",
          current_barrier: "I do not want to be first to change anything.",
          should_end_conversation: false,
        },
        grounding: [{ source: "w.fact.door_closed", use: "Observed state." }],
      },
      passingEvaluation("not_exercised"),
    ]);

    const result = await runLiveFixture(
      getLiveFixture("w-unobserved-i0"),
      queued.model,
      prompts,
    );

    expect(result.passed).toBe(true);
    expect(result.progressed).toBe(false);
    expect(queued.calls.map(({ role }) => role)).toEqual([
      "persona",
      "evaluator",
    ]);
  });

  it("LDO-LIVE-003 fails a Judge that returns an Action ID outside the supplied catalog", async () => {
    const queued = createQueuedModel([
      {
        reply: "No. I will not move because you order it.",
        mind_state_patch: {
          accepted_reframe: null,
          barrier_movement: "strengthened",
          current_barrier: "The command makes the movement intolerable.",
          should_end_conversation: false,
        },
        grounding: [{ source: "player_claim", use: "Rejected command." }],
      },
      {
        phase: "awareness",
        judgments: [
          {
            action_id: "invented_action",
            awareness: "surfaced",
            reason: "Invented.",
            supporting_persona_source_ids: ["persona.turn.1"],
          },
        ],
      },
      passingEvaluation("latent", "invalid"),
    ]);

    const result = await runLiveFixture(
      getLiveFixture("h-command-d1"),
      queued.model,
      prompts,
    );

    expect(result.passed).toBe(false);
    expect(result.progressed).toBe(false);
    expect(result.protocolFailures).toContain(
      "Awareness returned unsupplied Action ID: invented_action",
    );
    expect(queued.calls.map(({ role }) => role)).toEqual([
      "persona",
      "awareness",
      "evaluator",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import type {
  StructuredRoleCall,
  StructuredRoleModel,
} from "./live-protocol";
import {
  getJudgeProbe,
  runJudgeProbe,
} from "./judge-feasibility";

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

describe("Judge feasibility probes", () => {
  it("LDO-FEAS-001 keeps an authored unowned state outside the progress region", async () => {
    const queued = createQueuedModel([
      {
        phase: "awareness",
        judgments: [
          {
            action_id: "open_door_a_crack",
            awareness: "latent",
            reason: "The Persona rejects removing the hand and walking away.",
            supporting_persona_source_ids: ["persona.turn.1"],
          },
        ],
      },
    ]);

    const result = await runJudgeProbe(
      getJudgeProbe("husband-unowned"),
      queued.model,
      "judge prompt",
    );

    expect(result).toMatchObject({
      probeId: "husband-unowned",
      awareness: "latent",
      progressed: false,
      passed: true,
    });
    expect(queued.calls.map(({ role }) => role)).toEqual(["awareness"]);
  });

  it("LDO-FEAS-001 LDO-FEAS-002 finds an authored owned state that surfaces and accepts", async () => {
    const queued = createQueuedModel([
      {
        phase: "awareness",
        judgments: [
          {
            action_id: "open_door_a_crack",
            awareness: "surfaced",
            reason: "The Persona owns the concrete reversible possibility.",
            supporting_persona_source_ids: [
              "persona.turn.1",
              "mind.accepted_reframe",
              "mind.barrier_movement",
            ],
          },
        ],
      },
      {
        phase: "willingness",
        action_id: "open_door_a_crack",
        decision: "accept",
        selected_variant_id: "open_narrow_gap",
        reason: "The selected variant is the Persona's present choice.",
        supporting_persona_source_ids: ["persona.turn.1"],
      },
    ]);

    const result = await runJudgeProbe(
      getJudgeProbe("husband-owned"),
      queued.model,
      "judge prompt",
    );

    expect(result).toMatchObject({
      probeId: "husband-owned",
      awareness: "surfaced",
      progressed: true,
      selectedVariantId: "open_narrow_gap",
      protocolFailures: [],
      passed: true,
    });
    expect(queued.calls.map(({ role }) => role)).toEqual([
      "awareness",
      "willingness",
    ]);
  });

  it("LDO-FEAS-001 models threshold waiting as its own fixed Action", () => {
    const probe = getJudgeProbe("wife-owned");

    expect(probe.action).toEqual({
      action_id: "remain_at_threshold",
      description:
        "Remain at the room threshold for one breath without touching or changing anything.",
      variants: [
        {
          variant_id: "one_breath_at_threshold",
          description:
            "Remain at the threshold for one breath without touching or changing anything.",
        },
      ],
    });
  });

  it("LDO-FEAS-002 rejects an unsupplied Judge ID even when it claims success", async () => {
    const queued = createQueuedModel([
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
    ]);

    const result = await runJudgeProbe(
      getJudgeProbe("husband-owned"),
      queued.model,
      "judge prompt",
    );

    expect(result.passed).toBe(false);
    expect(result.progressed).toBe(false);
    expect(result.protocolFailures).toContain(
      "Awareness returned unsupplied Action ID: invented_action",
    );
  });
});

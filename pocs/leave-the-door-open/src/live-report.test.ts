import { describe, expect, it } from "vitest";
import type { EvaluatorOutput, LiveFixtureResult } from "./live-protocol";
import { summarizeLiveRuns, type RecordedLiveRun } from "./live-report";

const result = (
  fixtureId: LiveFixtureResult["fixtureId"],
  passed: boolean,
  latencyMs: number,
): LiveFixtureResult => ({
  fixtureId,
  expectedAwareness: ["surfaced"],
  observedAwareness: "surfaced",
  progressed: true,
  selectedVariantId: "variant_1a",
  protocolFailures: passed ? [] : ["failure"],
  evaluation: {
    scores: Object.fromEntries(
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
    ) as EvaluatorOutput["scores"],
    hard_failure: !passed,
    hard_failure_reasons: passed ? [] : ["failure"],
    expected_awareness: "surfaced",
    observed_awareness: "surfaced",
    verdict: passed ? "pass" : "fail",
    notes: [],
  },
  calls: [
    {
      role: "persona",
      instructions: "prompt",
      input: "packet",
      schemaName: "persona",
      parsed: {},
      raw: {},
      latencyMs,
      usage: {
        inputTokens: 100,
        outputTokens: 40,
        reasoningTokens: 15,
      },
    },
  ],
  passed,
});

describe("live eval report", () => {
  it("LDO-LIVE-004 aggregates pass rate, failures, latency, and token usage", () => {
    const runs: RecordedLiveRun[] = [
      {
        fixtureId: "h-reversible-v1",
        repetition: 1,
        result: result("h-reversible-v1", true, 1200),
      },
      {
        fixtureId: "w-observed-i2",
        repetition: 1,
        result: result("w-observed-i2", false, 800),
      },
    ];

    expect(summarizeLiveRuns(runs)).toEqual({
      runCount: 2,
      passed: 1,
      failed: 1,
      passRate: 0.5,
      totalCalls: 2,
      totalLatencyMs: 2000,
      averageCallLatencyMs: 1000,
      usage: {
        inputTokens: 200,
        outputTokens: 80,
        reasoningTokens: 30,
      },
      failedFixtures: [
        {
          fixtureId: "w-observed-i2",
          repetition: 1,
          protocolFailures: ["failure"],
          evaluatorReasons: ["failure"],
          error: null,
        },
      ],
    });
  });
});

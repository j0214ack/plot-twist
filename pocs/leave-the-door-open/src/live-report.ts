import type {
  LiveFixtureId,
  LiveFixtureResult,
  ModelUsage,
} from "./live-protocol";

export type RecordedLiveRun = {
  fixtureId: LiveFixtureId;
  repetition: number;
  result?: LiveFixtureResult;
  error?: string;
};

export type LiveRunSummary = {
  runCount: number;
  passed: number;
  failed: number;
  passRate: number;
  totalCalls: number;
  totalLatencyMs: number;
  averageCallLatencyMs: number;
  usage: ModelUsage;
  failedFixtures: Array<{
    fixtureId: LiveFixtureId;
    repetition: number;
    protocolFailures: string[];
    evaluatorReasons: string[];
    error: string | null;
  }>;
};

export const summarizeLiveRuns = (
  runs: RecordedLiveRun[],
): LiveRunSummary => {
  const calls = runs.flatMap(({ result }) => result?.calls ?? []);
  const passed = runs.filter(({ result }) => result?.passed === true).length;
  const totalLatencyMs = calls.reduce(
    (total, call) => total + call.latencyMs,
    0,
  );

  return {
    runCount: runs.length,
    passed,
    failed: runs.length - passed,
    passRate: runs.length === 0 ? 0 : passed / runs.length,
    totalCalls: calls.length,
    totalLatencyMs,
    averageCallLatencyMs:
      calls.length === 0 ? 0 : Math.round(totalLatencyMs / calls.length),
    usage: calls.reduce<ModelUsage>(
      (total, call) => ({
        inputTokens: total.inputTokens + call.usage.inputTokens,
        outputTokens: total.outputTokens + call.usage.outputTokens,
        reasoningTokens: total.reasoningTokens + call.usage.reasoningTokens,
      }),
      { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 },
    ),
    failedFixtures: runs
      .filter(({ result }) => result?.passed !== true)
      .map(({ fixtureId, repetition, result, error }) => ({
        fixtureId,
        repetition,
        protocolFailures: result?.protocolFailures ?? [],
        evaluatorReasons: result?.evaluation.hard_failure_reasons ?? [],
        error: error ?? null,
      })),
  };
};

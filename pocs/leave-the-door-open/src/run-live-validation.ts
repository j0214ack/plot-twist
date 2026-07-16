import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import OpenAI from "openai";
import { config } from "dotenv";
import {
  OpenAiStructuredRoleModel,
  type LiveReasoningEffort,
  type StructuredResponsesClient,
} from "./live-openai-model";
import {
  getLiveFixture,
  listLiveFixtures,
  runLiveFixture,
  type LiveFixtureId,
  type LivePrompts,
} from "./live-protocol";
import {
  summarizeLiveRuns,
  type RecordedLiveRun,
} from "./live-report";

const root = process.cwd();
config({ path: resolve(root, ".env.local"), quiet: true });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is missing from repository-root .env.local");
}

const modelName = process.env.LDO_LIVE_MODEL ?? "gpt-5.6-luna";
const efforts = parseEfforts(process.env.LDO_LIVE_EFFORTS ?? "low,medium");
const fixtureIds = parseFixtureIds(process.env.LDO_LIVE_CASES);
const repetitions = parsePositiveInteger(
  "LDO_LIVE_REPETITIONS",
  process.env.LDO_LIVE_REPETITIONS ?? "1",
);
const concurrency = parsePositiveInteger(
  "LDO_LIVE_CONCURRENCY",
  process.env.LDO_LIVE_CONCURRENCY ?? "2",
);
const prompts = await loadPrompts(root);
const resultsDirectory = resolve(
  root,
  "pocs/leave-the-door-open/validation/live-results",
);
await mkdir(resultsDirectory, { recursive: true });

for (const effort of efforts) {
  const client = new OpenAI({ apiKey, timeout: 120_000, maxRetries: 2 });
  const model = new OpenAiStructuredRoleModel(
    client as unknown as StructuredResponsesClient,
    { model: modelName, reasoningEffort: effort },
  );
  const work = fixtureIds.flatMap((fixtureId) =>
    Array.from({ length: repetitions }, (_, index) => ({
      fixtureId,
      repetition: index + 1,
    })),
  );

  const runs = await mapWithConcurrency(
    work,
    concurrency,
    async ({ fixtureId, repetition }): Promise<RecordedLiveRun> => {
      const startedAt = performance.now();
      try {
        const result = await runLiveFixture(
          getLiveFixture(fixtureId),
          model,
          prompts,
        );
        console.log(
          JSON.stringify({
            event: "fixture_completed",
            model: modelName,
            effort,
            fixtureId,
            repetition,
            passed: result.passed,
            observedAwareness: result.observedAwareness,
            progressed: result.progressed,
            selectedVariantId: result.selectedVariantId,
            callCount: result.calls.length,
            elapsedMs: Math.round(performance.now() - startedAt),
          }),
        );
        return { fixtureId, repetition, result };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(
          JSON.stringify({
            event: "fixture_failed_with_error",
            model: modelName,
            effort,
            fixtureId,
            repetition,
            error: message,
            elapsedMs: Math.round(performance.now() - startedAt),
          }),
        );
        return { fixtureId, repetition, error: message };
      }
    },
  );

  const artifact = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    scope: "LDO v3 first trace-mediated loop smoke test",
    model: modelName,
    reasoningEffort: effort,
    repetitions,
    fixtureIds,
    summary: summarizeLiveRuns(runs),
    runs,
  };
  const timestamp = artifact.generatedAt.replaceAll(":", "-");
  const outputPath = resolve(
    resultsDirectory,
    `${timestamp}-${modelName}-${effort}.json`,
  );
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        event: "configuration_completed",
        model: modelName,
        effort,
        summary: artifact.summary,
        resultFile: outputPath,
      },
      null,
      2,
    ),
  );
}

async function loadPrompts(repositoryRoot: string): Promise<LivePrompts> {
  const promptRoot = resolve(
    repositoryRoot,
    "pocs/leave-the-door-open/validation/prompts",
  );
  const [persona, actionJudge, evaluator] = await Promise.all([
    readFile(resolve(promptRoot, "persona-v3.md"), "utf8"),
    readFile(resolve(promptRoot, "action-judge-v3.md"), "utf8"),
    readFile(resolve(promptRoot, "evaluator-v4.md"), "utf8"),
  ]);
  return { persona, actionJudge, evaluator };
}

function parseEfforts(value: string): LiveReasoningEffort[] {
  const parsed = value.split(",").map((effort) => effort.trim());
  for (const effort of parsed) {
    if (effort !== "low" && effort !== "medium") {
      throw new Error(`Invalid LDO_LIVE_EFFORTS value: ${effort}`);
    }
  }
  return parsed as LiveReasoningEffort[];
}

function parseFixtureIds(value: string | undefined): LiveFixtureId[] {
  const knownIds = listLiveFixtures().map(({ id }) => id);
  if (!value) return knownIds;
  const requested = value.split(",").map((id) => id.trim());
  for (const id of requested) {
    if (!knownIds.includes(id as LiveFixtureId)) {
      throw new Error(`Unknown LDO_LIVE_CASES fixture: ${id}`);
    }
  }
  return requested as LiveFixtureId[];
}

function parsePositiveInteger(name: string, value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

async function mapWithConcurrency<Input, Output>(
  inputs: Input[],
  limit: number,
  operation: (input: Input) => Promise<Output>,
): Promise<Output[]> {
  const outputs = new Array<Output>(inputs.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < inputs.length) {
      const index = nextIndex;
      nextIndex += 1;
      const input = inputs[index];
      if (input !== undefined) outputs[index] = await operation(input);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, inputs.length) }, () => worker()),
  );
  return outputs;
}

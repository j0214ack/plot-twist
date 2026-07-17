import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import OpenAI from "openai";
import { config } from "dotenv";
import { runJudgeProbe } from "./judge-feasibility";
import {
  OpenAiStructuredRoleModel,
  type LiveReasoningEffort,
  type StructuredResponsesClient,
} from "./live-openai-model";
import { BudgetedStructuredRoleModel } from "./model-call-budget";
import { getSavedStateReplay } from "./saved-state-replay";

const root = process.cwd();
config({ path: resolve(root, ".env.local"), quiet: true });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is missing from repository-root .env.local");
}

const modelName = process.env.LDO_REPLAY_MODEL ?? "gpt-5.6-luna";
const reasoningEffort = parseEffort(
  process.env.LDO_REPLAY_EFFORT ?? "low",
);
const maxCalls = parseCallBudget(
  process.env.LDO_REPLAY_MAX_CALLS ?? "2",
);
const replay = getSavedStateReplay("wife-observed-medium-20260716");
const judgePrompt = await readFile(
  resolve(
    root,
    "pocs/leave-the-door-open/validation/prompts/action-judge-v3.md",
  ),
  "utf8",
);

const client = new OpenAI({ apiKey, timeout: 120_000, maxRetries: 2 });
const paidModel = new OpenAiStructuredRoleModel(
  client as unknown as StructuredResponsesClient,
  { model: modelName, reasoningEffort },
);
const budgetedModel = new BudgetedStructuredRoleModel(paidModel, { maxCalls });
const result = await runJudgeProbe(
  replay.probe,
  budgetedModel,
  judgePrompt,
);

const artifact = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: "Saved Persona state replay against corrected fixed Action",
  model: modelName,
  reasoningEffort,
  replay: {
    id: replay.id,
    source: replay.source,
    probe: replay.probe,
  },
  budget: budgetedModel.snapshot(),
  result,
};
const resultsDirectory = resolve(
  root,
  "pocs/leave-the-door-open/validation/live-results",
);
await mkdir(resultsDirectory, { recursive: true });
const timestamp = artifact.generatedAt.replaceAll(":", "-");
const outputPath = resolve(
  resultsDirectory,
  `${timestamp}-${modelName}-${reasoningEffort}-wife-saved-state-replay.json`,
);
await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      model: modelName,
      reasoningEffort,
      replayId: replay.id,
      awareness: result.awareness,
      progressed: result.progressed,
      selectedVariantId: result.selectedVariantId,
      protocolFailures: result.protocolFailures,
      passed: result.passed,
      budget: artifact.budget,
      resultFile: outputPath,
    },
    null,
    2,
  ),
);

function parseEffort(value: string): LiveReasoningEffort {
  if (value !== "low" && value !== "medium") {
    throw new Error(`LDO_REPLAY_EFFORT must be low or medium; received ${value}`);
  }
  return value;
}

function parseCallBudget(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 2) {
    throw new Error(
      `LDO_REPLAY_MAX_CALLS must be an integer from 1 to 2; received ${value}`,
    );
  }
  return parsed;
}

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "dotenv";
import { ManaPool } from "../src/game/mana";
import { ModuleRuntime } from "../src/game/runtime";
import { GameWorld } from "../src/game/world";
import { BundleExecutor } from "../src/generative/bundle-executor";
import { GeneratedModuleLoader } from "../src/generative/module-loader";
import { SpellCompiler } from "../src/generative/spell-compiler";
import type { SpellCompileRequest } from "../src/generative/types";
import { createOpenAiSpellModelClient } from "../server/openai-spell-model";
import { resolveSpellGenerationProfile } from "../server/spell-generation-profile";
import { evaluateObservableBehavior } from "./behavior-evaluator";
import { getLiveEvalCase } from "./cases";
import { setupEvalScenario } from "./scenario";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is missing from .env.local");

const profile = resolveSpellGenerationProfile(process.env);
const evalCase = getLiveEvalCase(process.env.EVAL_CASE ?? "unseen-orbiting-moons-v1");

const world = new GameWorld();
const scenario = setupEvalScenario(world, evalCase.scenario ?? "guardian");
const request: SpellCompileRequest = {
  utterance: evalCase.utterance,
  focusedEntityId: scenario.focusedEntityId,
  scene: scenario.scene,
  recentArtifacts: [],
};

const compiler = new SpellCompiler(
  createOpenAiSpellModelClient({
    apiKey,
    model: profile.model,
    reasoningEffort: profile.reasoningEffort,
    serviceTier: profile.serviceTier,
  }),
);
const notes: string[] = [];
const runtime = new ModuleRuntime(world, new ManaPool(100), (note) => notes.push(note.text));
const executor = new BundleExecutor(runtime, new GeneratedModuleLoader());

const startedAt = performance.now();
const bundle = await compiler.compile(request);
const generationLatencyMs = Math.round(performance.now() - startedAt);
const sources = bundle.modules.map((module) => module.source);
const staticEvaluation = evaluateObservableBehavior({
  sources,
  generatedBeforeUpdate: [],
  generatedAfterUpdate: [],
});

let runtimeError: string | undefined;
let generatedBeforeUpdate: ReturnType<GameWorld["list"]> = [];
let generatedAfterUpdate: ReturnType<GameWorld["list"]> = [];
const targetHpBeforeUpdate = scenario.targetHpEntityId
  ? world.get(scenario.targetHpEntityId)?.stats?.hp
  : undefined;
const actorPositionBeforeUpdate = scenario.observedActorId
  ? world.get(scenario.observedActorId)?.position
  : undefined;

if (staticEvaluation.forbiddenGlobalUses.length === 0) {
  try {
    executor.execute(bundle);
    generatedBeforeUpdate = world.list().filter((entity) => Boolean(entity.ownerId));
    const simulationFrames = Math.round(evalCase.simulationSeconds * 60);
    for (let frame = 0; frame < simulationFrames; frame += 1) runtime.update(1 / 60);
    generatedAfterUpdate = world.list().filter((entity) => Boolean(entity.ownerId));
  } catch (error) {
    runtimeError = error instanceof Error ? error.message : String(error);
  }
}

const targetHpAfterUpdate = scenario.targetHpEntityId
  ? world.get(scenario.targetHpEntityId)?.stats?.hp
  : undefined;
const actorPositionAfterUpdate = scenario.observedActorId
  ? world.get(scenario.observedActorId)?.position
  : undefined;
const actorDistance =
  actorPositionBeforeUpdate && actorPositionAfterUpdate
    ? Math.hypot(
        actorPositionAfterUpdate.x - actorPositionBeforeUpdate.x,
        actorPositionAfterUpdate.y - actorPositionBeforeUpdate.y,
        actorPositionAfterUpdate.z - actorPositionBeforeUpdate.z,
      )
    : 0;
const doorUnlocked = scenario.doorId
  ? world.get(scenario.doorId)?.tags.includes("unlocked") ?? false
  : undefined;
const noteMatched = evalCase.expectedNoteSubstring
  ? notes.some((note) => note.includes(evalCase.expectedNoteSubstring!))
  : true;

const behavior = evaluateObservableBehavior({
  sources,
  generatedBeforeUpdate,
  generatedAfterUpdate,
  targetHpBeforeUpdate,
  targetHpAfterUpdate,
});
const passed =
  !runtimeError &&
  behavior.forbiddenGlobalUses.length === 0 &&
  behavior.spawnedEntities >= evalCase.minimumSpawnedEntities &&
  behavior.movedEntities >= evalCase.minimumMovedEntities &&
  behavior.damageDealt >= evalCase.minimumDamage &&
  actorDistance >= (evalCase.minimumActorDistance ?? 0) &&
  (evalCase.expectedDoorUnlocked === undefined ||
    doorUnlocked === evalCase.expectedDoorUnlocked) &&
  noteMatched;
const result = {
  caseId: evalCase.id,
  utterance: evalCase.utterance,
  mode: profile.mode,
  model: profile.model,
  reasoningEffort: profile.reasoningEffort,
  serviceTier: profile.serviceTier ?? "default",
  generatedAt: new Date().toISOString(),
  generationLatencyMs,
  moduleCount: bundle.modules.length,
  behavior,
  interaction: {
    actorDistance,
    doorUnlocked,
    notes,
    noteMatched,
  },
  runtimeError,
  passed,
  bundle,
};

const resultsDirectory = resolve(process.cwd(), "evals/results");
await mkdir(resultsDirectory, { recursive: true });
const outputPath = resolve(resultsDirectory, `${evalCase.id}-${Date.now()}.json`);
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      caseId: result.caseId,
      mode: result.mode,
      model: result.model,
      reasoningEffort: result.reasoningEffort,
      serviceTier: result.serviceTier,
      generationLatencyMs: result.generationLatencyMs,
      moduleCount: result.moduleCount,
      behavior: result.behavior,
      runtimeError: result.runtimeError,
      passed: result.passed,
      resultFile: outputPath,
    },
    null,
    2,
  ),
);

for (const artifact of runtime.listArtifacts().reverse()) runtime.dispose(artifact.id);

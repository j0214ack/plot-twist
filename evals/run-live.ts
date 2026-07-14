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

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is missing from .env.local");

const profile = resolveSpellGenerationProfile(process.env);
const evalCase = getLiveEvalCase(process.env.EVAL_CASE ?? "unseen-orbiting-moons-v1");

const world = new GameWorld();
const player = world.add({
  id: "player",
  name: "Handless caster",
  tags: ["player", "caster"],
  position: { x: -3, y: 0.5, z: 0 },
  size: { x: 0.8, y: 1, z: 0.8 },
  visual: { shape: "sphere", color: 0x8de8ff },
  affordances: [],
  protected: true,
});
const guardian = world.add({
  id: "guardian",
  name: "Gate guardian",
  tags: ["enemy", "guardian", "damageable"],
  position: { x: 3, y: 0.8, z: 0 },
  size: { x: 1, y: 1.6, z: 1 },
  visual: { shape: "box", color: 0xff5c72 },
  stats: { hp: 100, maxHp: 100 },
  affordances: [],
  protected: true,
});

const scene = [player, guardian].map(({ id, name, tags, affordances, position }) => ({
  id,
  name,
  tags,
  affordances,
  position,
}));
const request: SpellCompileRequest = {
  utterance: evalCase.utterance,
  focusedEntityId: guardian.id,
  scene,
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
const runtime = new ModuleRuntime(world, new ManaPool(100), () => {});
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
const targetHpBeforeUpdate = world.get(guardian.id)?.stats?.hp;

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

const targetHpAfterUpdate = world.get(guardian.id)?.stats?.hp;

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
  behavior.damageDealt >= evalCase.minimumDamage;
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

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
import { evaluateObservableBehavior } from "./behavior-evaluator";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is missing from .env.local");

const model = process.env.OPENAI_MODEL || "gpt-5.6";
const evalCase = {
  id: "unseen-orbiting-moons-v1",
  utterance: "召喚三顆紫色的小月亮，排成三角形繞著守衛移動",
};

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

const compiler = new SpellCompiler(createOpenAiSpellModelClient({ apiKey, model }));
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

if (staticEvaluation.forbiddenGlobalUses.length === 0) {
  try {
    executor.execute(bundle);
    generatedBeforeUpdate = world.list().filter((entity) => Boolean(entity.ownerId));
    for (let frame = 0; frame < 180; frame += 1) runtime.update(1 / 60);
    generatedAfterUpdate = world.list().filter((entity) => Boolean(entity.ownerId));
  } catch (error) {
    runtimeError = error instanceof Error ? error.message : String(error);
  }
}

const behavior = evaluateObservableBehavior({
  sources,
  generatedBeforeUpdate,
  generatedAfterUpdate,
});
const passed =
  !runtimeError &&
  behavior.forbiddenGlobalUses.length === 0 &&
  behavior.spawnedEntities >= 3 &&
  behavior.movedEntities >= 1;
const result = {
  caseId: evalCase.id,
  utterance: evalCase.utterance,
  model,
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
      model: result.model,
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

import "./style.css";
import { KeyboardInput } from "./input";
import { ManaPool } from "./game/mana";
import { ModuleRuntime } from "./game/runtime";
import { GameSimulation } from "./game/simulation";
import { GameWorld } from "./game/world";
import { BundleExecutor } from "./generative/bundle-executor";
import { GenerativeSpellController } from "./generative/generative-spell-controller";
import { HttpSpellApiClient } from "./generative/http-spell-api";
import { GeneratedModuleLoader } from "./generative/module-loader";
import { GameUi } from "./ui";
import { ThreeGameRenderer } from "./view/three-renderer";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Missing #app root");

const ui = new GameUi(root);
const world = new GameWorld();
const mana = new ManaPool(100, 5);
const runtime = new ModuleRuntime(world, mana, (note) => ui.pushNote(note));
const simulation = new GameSimulation(world);
simulation.setupLevel();

const generativeSpells = new GenerativeSpellController(
  world,
  runtime,
  new BundleExecutor(runtime, new GeneratedModuleLoader()),
  new HttpSpellApiClient(),
  {
  onCastingChange: (casting) => {
    simulation.setCasting(casting);
    ui.setCasting(casting);
  },
  onStageChange: (stage) => ui.setStage(stage),
  },
);
const input = new KeyboardInput();
const renderer = new ThreeGameRenderer(ui.canvas);

ui.onCast(async (utterance) => {
  const submission = await generativeSpells.submit(utterance, "guardian");
  if (submission.accepted && !submission.error) ui.clearIncantation();
});

world.on((event) => {
  if (event.type === "died" && event.entityId === "guardian") {
    ui.pushNote({ tone: "success", text: "守衛倒下了。法典現在承認那把鑰匙。" });
  }
  if (event.type === "unlocked") {
    ui.pushNote({ tone: "success", text: "門不是被命令打開的。它認得鑰匙。" });
  }
});

let previousTime = performance.now();
const startedAt = previousTime;

const frame = (time: number): void => {
  const deltaSeconds = Math.min(0.05, (time - previousTime) / 1000);
  previousTime = time;

  simulation.update(deltaSeconds, input.snapshot());
  runtime.update(deltaSeconds);
  renderer.sync(world.list(), (time - startedAt) / 1000);

  const player = world.get("player");
  const guardian = world.get("guardian");
  ui.update({
    mana: mana.current,
    maximumMana: mana.maximum,
    playerHp: player?.stats?.hp ?? 0,
    playerMaxHp: player?.stats?.maxHp ?? 100,
    guardianHp: guardian?.stats?.hp ?? 0,
    guardianMaxHp: guardian?.stats?.maxHp ?? 100,
    artifacts: runtime.listArtifacts().length,
    completed: simulation.completed,
  });

  requestAnimationFrame(frame);
};

requestAnimationFrame(frame);

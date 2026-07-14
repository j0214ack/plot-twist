import "./style.css";
import { DemoAccessOverlay } from "./demo-access-overlay";
import { DemoSessionClient, DemoSessionController } from "./demo-session";
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
import { calculateUiScale } from "./ui-scale";
import { ThreeGameRenderer } from "./view/three-renderer";
import { BrowserAudioRecorder } from "./voice/browser-audio-recorder";
import { HttpTranscriptionClient } from "./voice/http-transcription-client";
import { VoiceCastingController } from "./voice/voice-casting-controller";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Missing #app root");

const ui = new GameUi(root);
const accessOverlay = new DemoAccessOverlay(root);
const demoSession = new DemoSessionController(new DemoSessionClient(), accessOverlay);
accessOverlay.onUnlock((accessCode) => void demoSession.unlock(accessCode));
void demoSession.start();
const updateUiScale = (): void => {
  root.style.setProperty(
    "--ui-scale",
    String(calculateUiScale(window.innerWidth, window.innerHeight)),
  );
};
updateUiScale();
window.addEventListener("resize", updateUiScale);
const world = new GameWorld();
const mana = new ManaPool(100, 5);
const runtime = new ModuleRuntime(world, mana, (note) => ui.pushNote(note));
const simulation = new GameSimulation(world);
simulation.setupLevel();
let voiceBusy = false;

const generativeSpells = new GenerativeSpellController(
  world,
  runtime,
  new BundleExecutor(runtime, new GeneratedModuleLoader()),
  new HttpSpellApiClient(),
  {
    onCastingChange: (casting) => {
      simulation.setCasting(casting || voiceBusy);
      ui.setCasting(casting);
    },
    onStageChange: (stage) => ui.setStage(stage),
  },
);
const input = new KeyboardInput();
const renderer = new ThreeGameRenderer(ui.canvas);

const cast = async (utterance: string): Promise<void> => {
  if (!demoSession.isReady) return;
  const submission = await generativeSpells.submit(utterance, "guardian");
  if (submission.accepted && !submission.error) ui.clearIncantation();
};

ui.onCast((utterance) => void cast(utterance));

const voiceCasting = new VoiceCastingController(
  new BrowserAudioRecorder(),
  new HttpTranscriptionClient(),
  {
    onStateChange: (state) => {
      voiceBusy = state !== "idle";
      simulation.setCasting(generativeSpells.isCasting || voiceBusy);
      ui.setVoiceState(state);
    },
    onTranscript: (transcript) => {
      ui.setIncantation(transcript);
      void cast(transcript);
    },
    onError: (error) =>
      ui.pushNote({ tone: "warning", text: `語音詠唱沒有完成：${error.message}` }),
  },
);

const startVoiceCast = (): void => {
  if (demoSession.isReady && !generativeSpells.isCasting) void voiceCasting.start();
};
const stopVoiceCast = (): void => {
  void voiceCasting.stop();
};
ui.onVoiceInput(startVoiceCast, stopVoiceCast);

window.addEventListener("keydown", (event) => {
  const target = event.target;
  const editingText =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable);
  if (event.code !== "KeyV" || event.repeat || editingText) return;
  event.preventDefault();
  startVoiceCast();
});
window.addEventListener("keyup", (event) => {
  if (event.code !== "KeyV") return;
  event.preventDefault();
  stopVoiceCast();
});
window.addEventListener("blur", stopVoiceCast);

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
  const door = world.get("door");
  ui.update({
    mana: mana.current,
    maximumMana: mana.maximum,
    playerHp: player?.stats?.hp ?? 0,
    playerMaxHp: player?.stats?.maxHp ?? 100,
    guardianHp: guardian?.stats?.hp ?? 0,
    guardianMaxHp: guardian?.stats?.maxHp ?? 100,
    doorUnlocked: door?.tags.includes("unlocked") ?? false,
    artifacts: runtime.listArtifacts().length,
    completed: simulation.completed,
  });

  requestAnimationFrame(frame);
};

requestAnimationFrame(frame);

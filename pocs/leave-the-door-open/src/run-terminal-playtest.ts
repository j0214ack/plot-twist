import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import {
  CodexExecStructuredRoleModel,
  LocalCodexExecClient,
} from "./codex-exec-model";
import { createConversationalVerticalSliceGameController } from "./controller";
import type { LiveReasoningEffort } from "./live-openai-model";
import { createLocalPlaytestRecorder } from "./playtest-session-log";
import { RecordingStructuredRoleModel } from "./recording-structured-role-model";
import {
  createRecordingTerminalErrorObserver,
  createRecordingTerminalOutput,
  RecordingTerminalPlaySession,
} from "./recording-terminal-play-session";
import { StructuredModelConversationPorts } from "./structured-conversation-ports";
import { StructuredModelPerformanceDirector } from "./structured-performance-director";
import { TerminalPlaySession } from "./terminal-play-session";
import { isGameLocale, type GameLocale } from "./localization";

if (process.argv.includes("--help")) {
  console.log(`Leave the Door Open local playtest

Usage:
  npm run play:ldo

Controls:
  type normally  speak inside the selected character's self-talk
  1, 2, ...      select a surfaced possibility
  /resume        let the world continue, with or without an intention
  /help          show controls
  /quit          end the session

Configuration:
  LDO_PLAY_MODEL   Codex model (default: gpt-5.6-luna)
  LDO_PLAY_EFFORT  low or medium (default: medium)
  LDO_PLAY_LOCALE  en or zh-TW (default: en)
  LDO_PLAY_DISABLE_GENERATED_PERFORMANCE=1  use authored fallback staging

This command uses saved ChatGPT Codex authentication. It does not load
.env.local and strips API-key variables from every role subprocess.`);
  process.exit(0);
}

const repositoryRoot = process.cwd();
const promptRoot = resolve(
  repositoryRoot,
  "pocs/leave-the-door-open/validation/prompts",
);
const [
  inputFirewallPrompt,
  personaPrompt,
  memorySelectorPrompt,
  actionJudgePrompt,
  performanceDirectorPrompt,
] = await Promise.all([
  readFile(resolve(promptRoot, "input-firewall-v1.md"), "utf8"),
  readFile(resolve(promptRoot, "persona-v9.md"), "utf8"),
  readFile(resolve(promptRoot, "memory-selector-v1.md"), "utf8"),
  readFile(resolve(promptRoot, "action-judge-v4.md"), "utf8"),
  readFile(resolve(promptRoot, "performance-director-v1.md"), "utf8"),
]);
const modelName = process.env.LDO_PLAY_MODEL ?? "gpt-5.6-luna";
const reasoningEffort = parseReasoningEffort(
  process.env.LDO_PLAY_EFFORT ?? "medium",
);
const inputFirewallReasoningEffort = "low" as const;
const locale = parseLocale(process.env.LDO_PLAY_LOCALE ?? "en");
const sessionId = parseSessionId(
  process.env.LDO_PLAY_SESSION_ID ?? createSessionId(),
);
const logRoot =
  process.env.LDO_PLAY_LOG_ROOT ??
  resolve(repositoryRoot, "pocs/leave-the-door-open/playtest-logs");
const journal = createLocalPlaytestRecorder({
  rootDirectory: logRoot,
  sessionId,
});
const generatedPerformance =
  process.env.LDO_PLAY_DISABLE_GENERATED_PERFORMANCE !== "1";
journal.recorder.record({
  visibility: "observer",
  type: "session_started",
  data: {
    model: modelName,
    reasoningEffort,
    inputFirewallReasoningEffort,
    inputFirewallPrompt: "input-firewall-v1.md",
    personaPrompt: "persona-v9.md",
    memorySelectorPrompt: "memory-selector-v1.md",
    actionJudgePrompt: "action-judge-v4.md",
    performanceDirectorPrompt: "performance-director-v1.md",
    generatedPerformance,
    locale,
  },
});
const codexClient = new LocalCodexExecClient();
const model = new RecordingStructuredRoleModel(
  new CodexExecStructuredRoleModel(codexClient, {
    model: modelName,
    reasoningEffort,
  }),
  journal.recorder,
);
const inputFirewallModel = new RecordingStructuredRoleModel(
  new CodexExecStructuredRoleModel(codexClient, {
    model: modelName,
    reasoningEffort: inputFirewallReasoningEffort,
  }),
  journal.recorder,
);
const ports = new StructuredModelConversationPorts(
  model,
  {
    inputFirewall: inputFirewallPrompt,
    persona: personaPrompt,
    memorySelector: memorySelectorPrompt,
    actionJudge: actionJudgePrompt,
  },
  { inputFirewallModel },
);
const performanceDirector = new StructuredModelPerformanceDirector(
  model,
  performanceDirectorPrompt,
);
const controller = createConversationalVerticalSliceGameController(
  {
    inputFirewall: ports,
    persona: ports,
    memorySelector: ports,
    actionJudge: ports,
    ...(generatedPerformance ? { performanceDirector } : {}),
  },
  { locale },
);
const terminalOutput = createRecordingTerminalOutput(
  journal.recorder,
  (screen) => {
    if (process.stdout.isTTY) process.stdout.write("\u001B[2J\u001B[H");
    process.stdout.write(`${screen}\n`);
  },
);
const session = new RecordingTerminalPlaySession(
  new TerminalPlaySession(
    controller,
    terminalOutput,
    createRecordingTerminalErrorObserver(journal.recorder),
  ),
  controller,
  journal.recorder,
);
const terminal = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: process.stdout.isTTY,
});

let endReason = "input_closed";
try {
  await session.start();
  terminal.setPrompt("\n> ");
  terminal.prompt();

  for await (const line of terminal) {
    const result = await session.handleInput(line);
    if (result.ended) {
      endReason = line.trim() === "/quit" ? "player_quit" : "slice_ended";
      break;
    }
    terminal.prompt();
  }
} catch (error) {
  endReason = "runtime_error";
  journal.recorder.record({
    visibility: "observer",
    type: "session_failed",
    data: {
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { name: "UnknownError", message: String(error) },
    },
  });
  throw error;
} finally {
  journal.recorder.record({
    visibility: "observer",
    type: "session_ended",
    data: {
      reason: endReason,
      controllerSnapshot: controller.snapshot(),
    },
  });
  terminal.close();
  process.stderr.write(`\nPlaytest log: ${journal.path}\n`);
}

function parseReasoningEffort(value: string): LiveReasoningEffort {
  if (value !== "low" && value !== "medium") {
    throw new Error(
      `LDO_PLAY_EFFORT must be low or medium; received ${value}`,
    );
  }
  return value;
}

function parseLocale(value: string): GameLocale {
  if (!isGameLocale(value)) {
    throw new Error(`LDO_PLAY_LOCALE must be en or zh-TW; received ${value}`);
  }
  return value;
}

function createSessionId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `ldo-${timestamp}-${randomUUID().slice(0, 8)}`;
}

function parseSessionId(value: string): string {
  if (!/^[A-Za-z0-9._-]+$/.test(value)) {
    throw new Error("LDO_PLAY_SESSION_ID contains unsupported characters");
  }
  return value;
}

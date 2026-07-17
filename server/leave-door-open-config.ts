import type { LiveReasoningEffort } from "../pocs/leave-the-door-open/src/live-openai-model";

type Environment = Record<string, string | undefined>;

export type LeaveDoorOpenWebOptions = {
  modelBackend: "openai" | "codex";
  model: string;
  reasoningEffort: LiveReasoningEffort;
  inputFirewallReasoningEffort: LiveReasoningEffort;
  generatedPerformance: boolean;
  dataDirectory: string;
};

export const LEAVE_DOOR_OPEN_PROMPT_FILES = {
  inputFirewall: "input-firewall-v1.md",
  persona: "persona-v9.md",
  memorySelector: "memory-selector-v1.md",
  actionJudge: "action-judge-v5.md",
  performanceDirector: "performance-director-v1.md",
} as const;

export const resolveLeaveDoorOpenWebOptions = (
  environment: Environment,
): LeaveDoorOpenWebOptions => {
  const modelBackend = environment.LDO_WEB_MODEL_BACKEND ?? "openai";
  if (modelBackend !== "openai" && modelBackend !== "codex") {
    throw new Error("LDO_WEB_MODEL_BACKEND must be openai or codex");
  }
  const reasoningEffort = environment.LDO_PLAY_EFFORT ?? "medium";
  if (reasoningEffort !== "low" && reasoningEffort !== "medium") {
    throw new Error("LDO_PLAY_EFFORT must be low or medium");
  }
  return {
    modelBackend,
    model: environment.LDO_PLAY_MODEL ?? "gpt-5.6-luna",
    reasoningEffort,
    inputFirewallReasoningEffort: "low",
    generatedPerformance:
      environment.LDO_PLAY_DISABLE_GENERATED_PERFORMANCE !== "1",
    dataDirectory:
      environment.LDO_DATA_DIR ??
      "pocs/leave-the-door-open/playtest-data/web",
  };
};

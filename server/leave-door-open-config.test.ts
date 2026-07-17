import { describe, expect, it } from "vitest";
import {
  LEAVE_DOOR_OPEN_PROMPT_FILES,
  resolveLeaveDoorOpenWebOptions,
} from "./leave-door-open-config";

describe("Leave the Door Open web runtime configuration", () => {
  // Spec: ADR 0017 Decision 3; ADR 0018 LDO-WEB-004.
  it("uses the Judge-owned MindState protocol prompts in browser sessions", () => {
    expect(LEAVE_DOOR_OPEN_PROMPT_FILES).toEqual({
      inputFirewall: "input-firewall-v1.md",
      persona: "persona-v9.md",
      memorySelector: "memory-selector-v1.md",
      actionJudge: "action-judge-v4.md",
      performanceDirector: "performance-director-v1.md",
    });
  });

  // Spec: ADR 0018 LDO-WEB-004; ADR 0019 Decisions 3 and 5.
  it("keeps the local play model conventions while allowing explicit server overrides", () => {
    expect(resolveLeaveDoorOpenWebOptions({})).toEqual({
      modelBackend: "openai",
      model: "gpt-5.6-luna",
      reasoningEffort: "medium",
      inputFirewallReasoningEffort: "low",
      generatedPerformance: true,
    });
    expect(
      resolveLeaveDoorOpenWebOptions({
        LDO_WEB_MODEL_BACKEND: "codex",
        LDO_PLAY_MODEL: "gpt-5.6",
        LDO_PLAY_EFFORT: "medium",
        LDO_PLAY_DISABLE_GENERATED_PERFORMANCE: "1",
      }),
    ).toEqual({
      modelBackend: "codex",
      model: "gpt-5.6",
      reasoningEffort: "medium",
      inputFirewallReasoningEffort: "low",
      generatedPerformance: false,
    });
    expect(() =>
      resolveLeaveDoorOpenWebOptions({ LDO_PLAY_EFFORT: "high" }),
    ).toThrow("LDO_PLAY_EFFORT must be low or medium");
    expect(() =>
      resolveLeaveDoorOpenWebOptions({ LDO_WEB_MODEL_BACKEND: "browser" }),
    ).toThrow("LDO_WEB_MODEL_BACKEND must be openai or codex");
  });
});

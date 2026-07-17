import { describe, expect, it } from "vitest";
import {
  LEAVE_DOOR_OPEN_PROMPT_FILES,
  resolveLeaveDoorOpenWebOptions,
} from "./leave-door-open-config";

describe("Leave the Door Open web runtime configuration", () => {
  // Spec: ADR 0035 LDO-LAT-005 and LDO-LAT-006; ADR 0018 LDO-WEB-004.
  it("uses the combined post-Persona Judge prompt in browser sessions", () => {
    expect(LEAVE_DOOR_OPEN_PROMPT_FILES).toEqual({
      inputFirewall: "input-firewall-v1.md",
      persona: "persona-v9.md",
      memorySelector: "memory-selector-v1.md",
      actionJudge: "action-judge-v5.md",
      performanceDirector: "performance-director-v1.md",
    });
  });

  // Spec: ADR 0018 LDO-WEB-004; ADR 0019 Decisions 3 and 5;
  // ADR 0036 LDO-SAVE-007.
  it("keeps the local play model conventions while allowing explicit server overrides", () => {
    expect(resolveLeaveDoorOpenWebOptions({})).toEqual({
      modelBackend: "openai",
      model: "gpt-5.6-luna",
      reasoningEffort: "medium",
      inputFirewallReasoningEffort: "low",
      generatedPerformance: true,
      dataDirectory: "pocs/leave-the-door-open/playtest-data/web",
    });
    expect(
      resolveLeaveDoorOpenWebOptions({
        LDO_WEB_MODEL_BACKEND: "codex",
        LDO_PLAY_MODEL: "gpt-5.6",
        LDO_PLAY_EFFORT: "medium",
        LDO_PLAY_DISABLE_GENERATED_PERFORMANCE: "1",
        LDO_DATA_DIR: "/data/leave-the-door-open",
      }),
    ).toEqual({
      modelBackend: "codex",
      model: "gpt-5.6",
      reasoningEffort: "medium",
      inputFirewallReasoningEffort: "low",
      generatedPerformance: false,
      dataDirectory: "/data/leave-the-door-open",
    });
    expect(() =>
      resolveLeaveDoorOpenWebOptions({ LDO_PLAY_EFFORT: "high" }),
    ).toThrow("LDO_PLAY_EFFORT must be low or medium");
    expect(() =>
      resolveLeaveDoorOpenWebOptions({ LDO_WEB_MODEL_BACKEND: "browser" }),
    ).toThrow("LDO_WEB_MODEL_BACKEND must be openai or codex");
  });
});

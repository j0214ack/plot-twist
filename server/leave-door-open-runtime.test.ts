import { describe, expect, it } from "vitest";
import type { StructuredRoleModel } from "../pocs/leave-the-door-open/src/live-protocol";
import { createLeaveDoorOpenWebSessionFactory } from "./leave-door-open-runtime";

describe("Leave the Door Open server runtime", () => {
  // Spec: ADR 0036 LDO-SAVE-003 and LDO-SAVE-004.
  it("restores the last quiescent Web checkpoint without replaying start", async () => {
    const unusedModel: StructuredRoleModel = {
      async call() {
        throw new Error("Checkpoint restore must not call a model");
      },
    };
    const logLines: string[] = [];
    const factory = createLeaveDoorOpenWebSessionFactory({
      model: unusedModel,
      prompts: {
        inputFirewall: "input firewall",
        persona: "persona",
        memorySelector: "memory selector",
        actionJudge: "judge",
      },
      generatedPerformance: false,
      appendLogLine: (_sessionId, line) => logLines.push(line),
    });
    const original = await factory("web-save-a", "zh-TW");
    await original.start();
    const help = await original.handleInput("/help");
    const checkpoint = original.checkpoint();

    const restored = await factory("web-save-b", "zh-TW", checkpoint);
    const resumed = await restored.start();

    expect(checkpoint).toMatchObject({
      schemaVersion: 1,
      controller: { schemaVersion: 1, locale: "zh-TW" },
      terminal: { schemaVersion: 1, started: true, ended: false },
      latestScreen: help.screen,
    });
    expect(resumed).toBe(help.screen);
    expect(logLines.join("\n")).toContain('"restored":true');
  });

  // Spec: ADR 0035 LDO-LAT-008.
  it("returns the Persona screen before starting the post-Persona Judge continuation", async () => {
    const calls: string[] = [];
    const model: StructuredRoleModel = {
      async call(request) {
        calls.push(request.role);
        return {
          parsed:
            request.role === "persona"
              ? {
                  reply: "I noticed the clock before I knew what to do.",
                  should_end_conversation: false,
                  grounding: [],
                }
              : {
                  phase: "post_persona",
                  transitions: [],
                  unmodeled_shift_note: null,
                  judgments: [
                    {
                      action_id: "interact_with_living_room_clock",
                      awareness: "latent",
                      reason: "Not yet owned as an action.",
                      supporting_persona_source_ids: ["persona.turn.1"],
                      willingness: null,
                    },
                  ],
                },
          raw: {},
          latencyMs: 1,
          usage: { inputTokens: 1, outputTokens: 1, reasoningTokens: 0 },
        };
      },
    };
    const session = await createLeaveDoorOpenWebSessionFactory({
      model,
      prompts: {
        inputFirewall: "input firewall",
        persona: "persona",
        memorySelector: "memory selector",
        actionJudge: "judge",
      },
      generatedPerformance: false,
      appendLogLine: () => undefined,
    })("web-phased-a");
    await session.start();

    const personaPhase = await session.handleInput("What did you notice?");

    expect(calls).toEqual(["persona"]);
    expect(personaPhase).toMatchObject({
      dialogueResolutionPending: true,
      screen: expect.stringContaining(
        "Martin: I noticed the clock before I knew what to do.",
      ),
    });

    const resolved = await session.resolveDialogue();

    expect(calls).toEqual(["persona", "post_persona_judge"]);
    expect(resolved.dialogueResolutionPending).toBe(false);
  });

  // Spec: ADR 0029 LDO-WEB-014 and LDO-PERF-003.
  it("adapts web resume into one real Controller tick per request", async () => {
    const unusedModel: StructuredRoleModel = {
      async call() {
        throw new Error("Ordinary routine ticks must not call the model");
      },
    };
    const session = await createLeaveDoorOpenWebSessionFactory({
      model: unusedModel,
      prompts: {
        inputFirewall: "input firewall",
        persona: "persona",
        memorySelector: "memory selector",
        actionJudge: "judge",
      },
      generatedPerformance: false,
      appendLogLine: () => undefined,
    })("web-paced-a");
    await session.start();

    const first = await session.handleInput("/resume");
    const second = await session.advanceTurn();

    expect(first).toMatchObject({
      ended: false,
      advancePending: true,
      screen: expect.stringContaining(
        "08:00 — Living room — He sits at the far end of the sofa.",
      ),
    });
    expect(first.screen).not.toContain("12:12 — Dining area");
    expect(second).toMatchObject({
      ended: false,
      advancePending: true,
    });
  });

  // Spec: ADR 0018 LDO-WEB-003; ADR 0033 LDO-LOC-001 and LDO-LOC-008;
  // observer-session-logging.md LDO-OBS-010.
  // Production composition reuses the real controller/session and journals its locale.
  it("captures the localized projected screen without asking browser code to simulate it", async () => {
    const unusedModel: StructuredRoleModel = {
      async call() {
        throw new Error("No model call is expected for start or help");
      },
    };
    const logLines: string[] = [];
    const journalSessionIds: string[] = [];
    const factory = createLeaveDoorOpenWebSessionFactory({
      model: unusedModel,
      prompts: {
        inputFirewall: "input firewall",
        persona: "persona",
        memorySelector: "memory selector",
        actionJudge: "judge",
      },
      generatedPerformance: false,
      appendLogLine: (sessionId, line) => {
        journalSessionIds.push(sessionId);
        logLines.push(line);
      },
    });

    const session = await factory("web-session-a", "zh-TW");
    const opening = await session.start();
    const help = await session.handleInput("/help");

    expect(opening).toContain("起點：客廳的時鐘慢了三分鐘");
    expect(help.screen).toContain("直接輸入文字和角色說話");
    expect(logLines.join("\n")).toContain('"sessionId":"web-session-a"');
    expect(logLines.join("\n")).toContain('"locale":"zh-TW"');
    expect(logLines.join("\n")).toContain('"type":"screen_rendered"');
    expect(logLines.join("\n")).toContain('"type":"player_input"');
    expect(new Set(journalSessionIds)).toEqual(new Set(["web-session-a"]));
  });
});

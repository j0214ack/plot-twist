import { describe, expect, it } from "vitest";
import type { StructuredRoleModel } from "../pocs/leave-the-door-open/src/live-protocol";
import { createLeaveDoorOpenWebSessionFactory } from "./leave-door-open-runtime";

describe("Leave the Door Open server runtime", () => {
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
    const factory = createLeaveDoorOpenWebSessionFactory({
      model: unusedModel,
      prompts: {
        inputFirewall: "input firewall",
        persona: "persona",
        memorySelector: "memory selector",
        actionJudge: "judge",
      },
      generatedPerformance: false,
      appendLogLine: (line) => logLines.push(line),
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
  });
});

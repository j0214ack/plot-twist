import { describe, expect, it } from "vitest";
import type { StructuredRoleModel } from "../pocs/leave-the-door-open/src/live-protocol";
import { createLeaveDoorOpenWebSessionFactory } from "./leave-door-open-runtime";

describe("Leave the Door Open server runtime", () => {
  // Spec: ADR 0018 LDO-WEB-003; production composition reuses the real controller/session.
  it("captures the real projected terminal screen without asking browser code to simulate it", async () => {
    const unusedModel: StructuredRoleModel = {
      async call() {
        throw new Error("No model call is expected for start or help");
      },
    };
    const logLines: string[] = [];
    const factory = createLeaveDoorOpenWebSessionFactory({
      model: unusedModel,
      prompts: { persona: "persona", actionJudge: "judge" },
      generatedPerformance: false,
      appendLogLine: (line) => logLines.push(line),
    });

    const session = await factory("web-session-a");
    const opening = await session.start();
    const help = await session.handleInput("/help");

    expect(opening).toContain("The living-room clock is three minutes slow");
    expect(help.screen).toContain("Speak by typing normally");
    expect(logLines.join("\n")).toContain('"sessionId":"web-session-a"');
    expect(logLines.join("\n")).toContain('"type":"screen_rendered"');
    expect(logLines.join("\n")).toContain('"type":"player_input"');
  });
});

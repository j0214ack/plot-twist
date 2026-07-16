import { z } from "zod";
import { describe, expect, it } from "vitest";
import type { StructuredRoleModel } from "./live-protocol";
import { PlaytestSessionRecorder } from "./playtest-session-log";
import { RecordingStructuredRoleModel } from "./recording-structured-role-model";

describe("recording structured role model", () => {
  it("LDO-OBS-003 records exact role input and parsed output without the runtime schema", async () => {
    const lines: string[] = [];
    const calls: string[] = [];
    const delegate: StructuredRoleModel = {
      async call(request) {
        calls.push(request.input);
        return {
          parsed: { reply: "I cannot name it yet." },
          raw: { providerEnvelope: "not journaled" },
          latencyMs: 17,
          usage: { inputTokens: 30, outputTokens: 8, reasoningTokens: 3 },
        };
      },
    };
    const recorder = new PlaytestSessionRecorder({
      sessionId: "session-model",
      appendLine: (line) => lines.push(line),
    });
    const model = new RecordingStructuredRoleModel(delegate, recorder);

    const result = await model.call({
      role: "persona",
      instructions: "Catalog-blind Persona v4",
      input: "PLAYER_TURN\nWhy?",
      schemaName: "ldo_persona_v3",
      schema: z.object({ reply: z.string() }),
    });

    expect(result.parsed).toEqual({ reply: "I cannot name it yet." });
    expect(calls).toEqual(["PLAYER_TURN\nWhy?"]);
    const records = lines.map((line) => JSON.parse(line));
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      visibility: "observer",
      type: "model_call_started",
      data: {
        role: "persona",
        instructions: "Catalog-blind Persona v4",
        input: "PLAYER_TURN\nWhy?",
        schemaName: "ldo_persona_v3",
      },
    });
    expect(records[0].data).not.toHaveProperty("schema");
    expect(records[1]).toMatchObject({
      visibility: "observer",
      type: "model_call_completed",
      data: {
        requestSequence: 1,
        role: "persona",
        parsed: { reply: "I cannot name it yet." },
        latencyMs: 17,
        usage: { inputTokens: 30, outputTokens: 8, reasoningTokens: 3 },
      },
    });
    expect(records[1].data).not.toHaveProperty("raw");
  });

  it("LDO-OBS-003 records a failed role boundary and preserves the failure", async () => {
    const lines: string[] = [];
    const delegate: StructuredRoleModel = {
      async call() {
        throw new Error("Role process failed");
      },
    };
    const recorder = new PlaytestSessionRecorder({
      sessionId: "session-model-error",
      appendLine: (line) => lines.push(line),
    });
    const model = new RecordingStructuredRoleModel(delegate, recorder);

    await expect(
      model.call({
        role: "awareness",
        instructions: "Judge",
        input: "PHASE\nawareness",
        schemaName: "ldo_awareness_v3",
        schema: z.object({ phase: z.literal("awareness") }),
      }),
    ).rejects.toThrow("Role process failed");

    expect(lines.map((line) => JSON.parse(line)).at(-1)).toMatchObject({
      visibility: "observer",
      type: "model_call_failed",
      data: {
        requestSequence: 1,
        role: "awareness",
        error: { name: "Error", message: "Role process failed" },
      },
    });
  });
});

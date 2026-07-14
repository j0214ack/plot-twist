import { describe, expect, it, vi } from "vitest";
import { compileSpellPayload, createJsonConsoleSpellEventSink } from "./spell-api";
import type { SpellBundle } from "../src/generative/types";

const bundle: SpellBundle = {
  summary: "A new mechanic",
  modules: [
    {
      id: "new-mechanic",
      label: "New mechanic",
      tags: ["new"],
      dependsOn: [],
      source: "() => ({ label: 'New mechanic', tags: [], setup() {}, dispose() {} })",
    },
  ],
};

describe("compileSpellPayload", () => {
  // Spec: Decision 0002 GEN-1; server validates transport shape, not natural-language intent.
  it("passes a valid utterance and scene to the generative compiler unchanged", async () => {
    const compile = vi.fn(async () => bundle);
    const payload = {
      utterance: "讓三顆紫色月亮繞著守衛",
      focusedEntityId: "guardian",
      scene: [
        {
          id: "guardian",
          name: "Guardian",
          tags: ["guardian"],
          affordances: [],
          position: { x: 2, y: 1, z: 0 },
        },
      ],
      recentArtifacts: [],
    };

    await expect(compileSpellPayload(payload, { compile })).resolves.toEqual(bundle);
    expect(compile).toHaveBeenCalledWith(payload);
  });

  // Spec: validation-plan.md deterministic pipeline boundary.
  it("rejects malformed transport data before spending a model call", async () => {
    const compile = vi.fn(async () => bundle);

    await expect(
      compileSpellPayload({ utterance: "", scene: "not-an-array" }, { compile }),
    ).rejects.toThrow("Invalid spell request");
    expect(compile).not.toHaveBeenCalled();
  });

  // Spec: Decision 0009 LOG-1 through LOG-4; a real compiler call leaves one searchable event.
  it("records a successful utterance as one structured log line", async () => {
    const writeLine = vi.fn();
    const now = vi.fn().mockReturnValueOnce(1_000).mockReturnValueOnce(1_250);

    await compileSpellPayload(
      {
        utterance: "讓三顆紫色月亮繞著守衛",
        focusedEntityId: "guardian",
        scene: [],
        recentArtifacts: [],
      },
      { compile: vi.fn(async () => bundle) },
      {
        events: createJsonConsoleSpellEventSink(writeLine),
        now,
      },
    );

    expect(writeLine).toHaveBeenCalledTimes(1);
    expect(JSON.parse(writeLine.mock.calls[0]?.[0] as string)).toEqual({
      event: "spell.compile",
      version: 1,
      timestamp: "1970-01-01T00:00:01.250Z",
      utterance: "讓三顆紫色月亮繞著守衛",
      focusedEntityId: "guardian",
      outcome: "succeeded",
      durationMs: 250,
      moduleCount: 1,
    });
  });

  // Spec: Decision 0009 LOG-1/LOG-2; failed generation is the most valuable playtest evidence.
  it("records the utterance when the compiler fails", async () => {
    const writeLine = vi.fn();
    const now = vi.fn().mockReturnValueOnce(2_000).mockReturnValueOnce(2_600);
    const compilerError = new Error("model timed out");

    await expect(
      compileSpellPayload(
        {
          utterance: "在守衛頭上降下一顆燃燒的隕石",
          scene: [],
          recentArtifacts: [],
        },
        {
          compile: vi.fn(async () => {
            throw compilerError;
          }),
        },
        {
          events: createJsonConsoleSpellEventSink(writeLine),
          now,
        },
      ),
    ).rejects.toBe(compilerError);

    expect(writeLine).toHaveBeenCalledTimes(1);
    expect(JSON.parse(writeLine.mock.calls[0]?.[0] as string)).toEqual({
      event: "spell.compile",
      version: 1,
      timestamp: "1970-01-01T00:00:02.600Z",
      utterance: "在守衛頭上降下一顆燃燒的隕石",
      outcome: "failed",
      durationMs: 600,
      error: "model timed out",
    });
  });

  // Spec: Decision 0009 LOG-5; observability is best-effort and never breaks casting.
  it("returns the compiled spell when the event sink fails", async () => {
    await expect(
      compileSpellPayload(
        {
          utterance: "讓鑰匙飛去打開門",
          scene: [],
          recentArtifacts: [],
        },
        { compile: vi.fn(async () => bundle) },
        {
          events: {
            record() {
              throw new Error("log transport unavailable");
            },
          },
        },
      ),
    ).resolves.toEqual(bundle);
  });
});

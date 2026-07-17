import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { PersonaOutputSchema } from "./live-protocol";
import {
  CodexExecStructuredRoleModel,
  LocalCodexExecClient,
  type CodexExecClient,
  type CodexProcessRunner,
} from "./codex-exec-model";

const personaOutput = {
  reply: "I can leave the moment undecided.",
  mind_state_patch: {
    accepted_reframe: "It need not be a declaration.",
    barrier_movement: "weakened" as const,
    current_barrier: "I still cannot tolerate opening it farther.",
    should_end_conversation: false,
  },
  grounding: [{ source: "player_claim", use: "A possible reframe." }],
};

describe("Codex exec structured role model", () => {
  it("LDO-LOCAL-001 converts a structured role call into a schema-constrained headless request", async () => {
    const run = vi.fn(async () => ({
      finalResponse: JSON.stringify(personaOutput),
      usage: {
        inputTokens: 120,
        outputTokens: 45,
        reasoningTokens: 12,
      },
    }));
    const client: CodexExecClient = { run };
    const model = new CodexExecStructuredRoleModel(client, {
      model: "gpt-5.6-luna",
      reasoningEffort: "low",
    });

    const result = await model.call({
      role: "persona",
      instructions: "Catalog-blind Persona instructions",
      input: "PLAYER_TURN\nCould this remain undecided?",
      schemaName: "ldo_persona_v3",
      schema: PersonaOutputSchema,
    });

    expect(run).toHaveBeenCalledWith({
      model: "gpt-5.6-luna",
      reasoningEffort: "low",
      prompt: [
        "DEVELOPER_INSTRUCTIONS",
        "Catalog-blind Persona instructions",
        "",
        "ROLE_INPUT",
        "PLAYER_TURN\nCould this remain undecided?",
      ].join("\n"),
      outputSchema: expect.objectContaining({
        type: "object",
        additionalProperties: false,
      }),
    });
    expect(result).toMatchObject({
      parsed: personaOutput,
      raw: { finalResponse: JSON.stringify(personaOutput) },
      usage: { inputTokens: 120, outputTokens: 45, reasoningTokens: 12 },
    });
  });

  it("LDO-LOCAL-001 LDO-LOCAL-002 invokes Codex in an isolated tool-disabled process without API keys", async () => {
    let schema: unknown;
    const processRunner: CodexProcessRunner = vi.fn(async (invocation) => {
      const schemaIndex = invocation.args.indexOf("--output-schema");
      const schemaPath = invocation.args[schemaIndex + 1]!;
      schema = JSON.parse(await readFile(schemaPath, "utf8"));
      expect(invocation.stdin).toContain("ROLE_INPUT");
      expect(invocation.env.OPENAI_API_KEY).toBeUndefined();
      expect(invocation.env.CODEX_API_KEY).toBeUndefined();
      expect(invocation.env.CODEX_ACCESS_TOKEN).toBeUndefined();
      return {
        exitCode: 0,
        stderr: "",
        stdout: [
          JSON.stringify({ type: "thread.started", thread_id: "thread-1" }),
          JSON.stringify({
            type: "item.completed",
            item: {
              type: "agent_message",
              text: JSON.stringify(personaOutput),
            },
          }),
          JSON.stringify({
            type: "turn.completed",
            usage: {
              input_tokens: 90,
              cached_input_tokens: 20,
              output_tokens: 30,
              reasoning_output_tokens: 8,
            },
          }),
        ].join("\n"),
      };
    });
    const client = new LocalCodexExecClient(processRunner, {
      inheritedEnvironment: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        OPENAI_API_KEY: "must-not-leak",
        CODEX_API_KEY: "must-not-leak",
        CODEX_ACCESS_TOKEN: "must-not-leak",
      },
    });

    const result = await client.run({
      model: "gpt-5.6-luna",
      reasoningEffort: "low",
      prompt: "ROLE_INPUT\nA bounded packet",
      outputSchema: { type: "object", additionalProperties: false },
    });

    const invocation = vi.mocked(processRunner).mock.calls[0]![0];
    expect(invocation.command).toBe("codex");
    expect(invocation.args).toEqual(
      expect.arrayContaining([
        "exec",
        "--ephemeral",
        "--json",
        "--ignore-user-config",
        "--ignore-rules",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--disable",
        "shell_tool",
        "--disable",
        "apps",
        "--disable",
        "hooks",
        "--disable",
        "multi_agent",
        "--model",
        "gpt-5.6-luna",
        "-",
      ]),
    );
    expect(invocation.cwd).not.toBe(process.cwd());
    expect(schema).toEqual({ type: "object", additionalProperties: false });
    expect(result).toEqual({
      finalResponse: JSON.stringify(personaOutput),
      usage: { inputTokens: 90, outputTokens: 30, reasoningTokens: 8 },
    });
  });
});

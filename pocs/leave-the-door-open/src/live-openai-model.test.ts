import { describe, expect, it, vi } from "vitest";
import {
  EvaluatorOutputSchema,
  PersonaOutputSchema,
  type StructuredRoleCall,
} from "./live-protocol";
import { OpenAiStructuredRoleModel } from "./live-openai-model";

describe("OpenAiStructuredRoleModel", () => {
  it("LDO-LIVE-004 sends a fresh GPT-5.6 Luna Structured Output request and preserves raw evidence", async () => {
    const output = {
      reply: "I can leave it for one breath.",
      mind_state_patch: {
        accepted_reframe: "It need not be a declaration.",
        barrier_movement: "weakened",
        current_barrier: "I still cannot picture what follows.",
        should_end_conversation: false,
      },
      grounding: [{ source: "h.fact.door_now", use: "Present fact." }],
    };
    const parse = vi.fn(async () => ({
      id: "response-1",
      status: "completed",
      output: [{ type: "message", content: [{ type: "output_text" }] }],
      output_text: JSON.stringify(output),
      output_parsed: output,
      incomplete_details: null,
      error: null,
      usage: {
        input_tokens: 120,
        output_tokens: 55,
        output_tokens_details: { reasoning_tokens: 21 },
      },
    }));
    const model = new OpenAiStructuredRoleModel(
      { responses: { parse } },
      { model: "gpt-5.6-luna", reasoningEffort: "low" },
    );
    const request: StructuredRoleCall = {
      role: "persona",
      instructions: "Persona instructions",
      input: "PLAYER_TURN\nA small reversible reframe.",
      schemaName: "ldo_persona_v3",
      schema: PersonaOutputSchema,
    };

    const result = await model.call(request);

    expect(parse).toHaveBeenCalledWith({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      input: [
        { role: "developer", content: "Persona instructions" },
        {
          role: "user",
          content: "PLAYER_TURN\nA small reversible reframe.",
        },
      ],
      text: { format: expect.anything() },
      store: false,
    });
    expect(parse.mock.calls[0]?.[0]).not.toHaveProperty("previous_response_id");
    expect(result).toMatchObject({
      parsed: output,
      raw: {
        id: "response-1",
        status: "completed",
        output: expect.any(Array),
        output_text: JSON.stringify(output),
      },
      latencyMs: expect.any(Number),
      usage: {
        inputTokens: 120,
        outputTokens: 55,
        reasoningTokens: 21,
      },
    });
  });

  it("LDO-LIVE-004 produces an API-compatible fixed evaluator score schema", async () => {
    const parse = vi.fn(async () => ({
      output_parsed: { placeholder: true },
    }));
    const model = new OpenAiStructuredRoleModel(
      { responses: { parse } },
      { model: "gpt-5.6-luna", reasoningEffort: "low" },
    );

    await model.call({
      role: "evaluator",
      instructions: "Evaluator instructions",
      input: "Completed fixture",
      schemaName: "ldo_evaluator_v3",
      schema: EvaluatorOutputSchema,
    });

    const request = parse.mock.calls[0]?.[0];
    expect(JSON.stringify(request)).not.toContain("propertyNames");
  });
});

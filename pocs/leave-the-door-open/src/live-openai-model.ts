import { zodTextFormat } from "openai/helpers/zod";
import type {
  StructuredRoleCall,
  StructuredRoleModel,
  StructuredRoleResult,
} from "./live-protocol";

export type LiveReasoningEffort = "low" | "medium";

type RawStructuredResponse = {
  id?: string;
  status?: string;
  output?: unknown;
  output_text?: string;
  output_parsed: unknown;
  incomplete_details?: unknown;
  error?: unknown;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    output_tokens_details?: {
      reasoning_tokens?: number;
    };
  } | null;
};

export interface StructuredResponsesClient {
  responses: {
    parse(request: unknown): Promise<RawStructuredResponse>;
  };
}

export type OpenAiStructuredRoleModelOptions = {
  model: string;
  reasoningEffort: LiveReasoningEffort;
};

export class OpenAiStructuredRoleModel implements StructuredRoleModel {
  constructor(
    private readonly client: StructuredResponsesClient,
    private readonly options: OpenAiStructuredRoleModelOptions,
  ) {}

  async call(request: StructuredRoleCall): Promise<StructuredRoleResult> {
    const startedAt = performance.now();
    const response = await this.client.responses.parse({
      model: this.options.model,
      reasoning: { effort: this.options.reasoningEffort },
      input: [
        { role: "developer", content: request.instructions },
        { role: "user", content: request.input },
      ],
      text: {
        format: zodTextFormat(request.schema, request.schemaName),
      },
      store: false,
    });
    const latencyMs = Math.round(performance.now() - startedAt);

    if (response.output_parsed === null || response.output_parsed === undefined) {
      throw new Error(
        `OpenAI returned no parsed ${request.role} output (${response.status ?? "unknown status"})`,
      );
    }

    return {
      parsed: response.output_parsed,
      raw: {
        id: response.id,
        status: response.status,
        output: response.output,
        output_text: response.output_text,
        incomplete_details: response.incomplete_details,
        error: response.error,
      },
      latencyMs,
      usage: {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        reasoningTokens:
          response.usage?.output_tokens_details?.reasoning_tokens ?? 0,
      },
    };
  }
}

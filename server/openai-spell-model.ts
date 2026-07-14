import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { SpellModelClient } from "../src/generative/spell-compiler";
import type { SpellBundle, SpellModelInput } from "../src/generative/types";
import type { SpellReasoningEffort } from "./spell-generation-profile";

const SpellBundleSchema = z.object({
  summary: z.string(),
  modules: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      tags: z.array(z.string()),
      dependsOn: z.array(z.string()),
      source: z.string(),
    }),
  ),
});

interface StructuredResponsesClient {
  responses: {
    parse(request: unknown): Promise<{ output_parsed: unknown }>;
  };
}

export interface OpenAiSpellModelOptions {
  model: string;
  reasoningEffort: SpellReasoningEffort;
  serviceTier?: "priority";
}

const instructions = (sdkContract: string): string => `
You are the generative spell compiler for a top-down action game.

Translate the player's utterance into one or more NEW JavaScript mechanic modules.
Do not select a named preset or reference spell. Preserve unusual details from the utterance.

Semantic rules:
- An action creates one module.
- A reference points to an entity or previous artifact; it is not another action.
- A constraint changes an action's material, range, timing, target, or behavior; it is not another action.
- Multiple actions become ordered modules. Later modules declare earlier module IDs in dependsOn.
- Protected outcomes such as death, unlocked doors, or completed objectives cannot be assigned directly.
  Build a simulated cause using only the public GameContext.

Source ABI:
- source is a JavaScript expression evaluating to (dependencies) => MechanicModule.
- Return source only inside the structured field: no markdown fences, imports, TypeScript, or top-level effects.
- The factory receives only declared dependency artifacts.
- World interaction begins in setup(context) and uses only the SDK below.

Public SDK contract:
${sdkContract}
`;

export class OpenAiSpellModelClient implements SpellModelClient {
  constructor(
    private readonly client: StructuredResponsesClient,
    private readonly options: OpenAiSpellModelOptions = {
      model: "gpt-5.6",
      reasoningEffort: "medium",
    },
  ) {}

  async generate(input: SpellModelInput): Promise<SpellBundle> {
    const response = await this.client.responses.parse({
      model: this.options.model,
      reasoning: { effort: this.options.reasoningEffort },
      ...(this.options.serviceTier ? { service_tier: this.options.serviceTier } : {}),
      input: [
        {
          role: "developer",
          content: instructions(input.sdkContract),
        },
        {
          role: "user",
          content: JSON.stringify({
            utterance: input.utterance,
            focusedEntityId: input.focusedEntityId,
            scene: input.scene,
            recentArtifacts: input.recentArtifacts,
          }),
        },
      ],
      text: {
        format: zodTextFormat(SpellBundleSchema, "spell_bundle"),
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI returned no structured spell bundle");
    }

    return SpellBundleSchema.parse(response.output_parsed);
  }
}

export const createOpenAiSpellModelClient = (options?: {
  apiKey?: string;
  model?: string;
  reasoningEffort?: SpellReasoningEffort;
  serviceTier?: "priority";
}): OpenAiSpellModelClient => {
  const client = new OpenAI({ apiKey: options?.apiKey });
  return new OpenAiSpellModelClient(
    client as unknown as StructuredResponsesClient,
    {
      model: options?.model ?? "gpt-5.6",
      reasoningEffort: options?.reasoningEffort ?? "medium",
      serviceTier: options?.serviceTier,
    },
  );
};

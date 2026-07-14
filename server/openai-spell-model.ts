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
- Module boundaries follow independent runtime lifecycle, ownership, cost, counterplay, cross-module
  reference, and world-readable capability. Do not force module count from grammar or verb count.
- A reference points to an entity or previous artifact, and a constraint changes material, range,
  timing, target, or behavior. Neither creates another mechanism by itself.
- When mechanisms need independent lifecycles, generate ordered modules and declare earlier module IDs
  in dependsOn. Steps that only complete one short-lived cause may remain in a compound module.
- Protected outcomes such as death, unlocked doors, or completed objectives cannot be assigned directly.
  Build a simulated cause using only the public GameContext.
- A causal interaction goal is not a protected state assignment. When a capable actor and target are
  present (for example, an unlocker acting on a lock), generate the causal attempt even if the player
  did not explicitly say "move" or "fly".
- Before invoking an interaction, satisfy contact preconditions. If actor and target are separated,
  use navigation.stepDirectlyToContact during update first. If it reports blocked, switch to
  navigation.planToContact and navigation.follow, then invoke only after arrival.
  A word such as fly, roll, or slide is not a hidden requirement for success. It may form an independent
  locomotion mechanism when it has its own lifecycle, cost, counterplay, reference, or world-readable
  capability; an ephemeral movement step that only satisfies contact may remain in a compound module.
- Navigation must be bounded and observable. On blocked paths, replan a limited number of times; on
  no-path or timeout, stop and use game.note once. Do not generate a pathfinding algorithm yourself.
- Implement every requested verb as observable behavior, not only as a matching noun or visual.
  A static visual does not satisfy a movement verb such as fall, fly, orbit, chase, or strike.
- Model causal stages explicitly. For a moving attack: spawn the source away from its target,
  retain context and entity IDs, use physics.moveToward in update, and call combat.damage only
  after the source reaches the target. Merely adding "damage-source" does not deal damage.
- Use setup for initial state and update for behavior over time. Keep update bounded and incremental;
  never block a frame with an unbounded loop.

Source ABI:
- source is a JavaScript expression evaluating to (dependencies) => MechanicModule.
- Return source only inside the structured field: no markdown fences, imports, TypeScript, or top-level effects.
- The factory receives only declared dependency artifacts.
- World interaction begins in setup(context) and uses only the SDK below.
- The factory parameter is artifact dependencies, NEVER GameContext. Do not name it context and do
  not return another function. GameContext is available only as setup(context)'s argument; retain it
  for update in module-local state.
- Follow this shape exactly (omit update only for a genuinely one-shot behavior):
  (dependencies) => {
    let game;
    return {
      label: "...",
      tags: ["..."],
      setup(context) { game = context; /* spawn and retain actual entity IDs */ },
      update(deltaSeconds) { if (!game) return; /* incremental behavior */ },
      dispose() { game = undefined; }
    };
  }

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

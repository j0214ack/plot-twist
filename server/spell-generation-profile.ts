export type SpellGenerationMode = "fast" | "quality";
export type SpellReasoningEffort = "none" | "low" | "medium" | "high" | "xhigh" | "max";

export interface SpellGenerationProfile {
  mode: SpellGenerationMode;
  model: string;
  reasoningEffort: SpellReasoningEffort;
  serviceTier?: "priority";
}

type SpellGenerationEnvironment = Record<string, string | undefined>;

const reasoningEfforts = new Set<SpellReasoningEffort>([
  "none",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

export const resolveSpellGenerationProfile = (
  environment: SpellGenerationEnvironment,
): SpellGenerationProfile => {
  const requestedMode = environment.SPELL_GENERATION_MODE || "fast";
  if (requestedMode !== "fast" && requestedMode !== "quality") {
    throw new Error(`Invalid SPELL_GENERATION_MODE: ${requestedMode}`);
  }

  const defaultProfile =
    requestedMode === "fast"
      ? { model: "gpt-5.6-luna", reasoningEffort: "low" as const }
      : { model: "gpt-5.6", reasoningEffort: "medium" as const };
  const requestedEffort = environment.OPENAI_REASONING_EFFORT || defaultProfile.reasoningEffort;
  if (!reasoningEfforts.has(requestedEffort as SpellReasoningEffort)) {
    throw new Error(`Invalid OPENAI_REASONING_EFFORT: ${requestedEffort}`);
  }

  const serviceTier = environment.OPENAI_SERVICE_TIER;
  if (serviceTier && serviceTier !== "priority") {
    throw new Error(`Invalid OPENAI_SERVICE_TIER: ${serviceTier}`);
  }

  return {
    mode: requestedMode,
    model: environment.OPENAI_MODEL || defaultProfile.model,
    reasoningEffort: requestedEffort as SpellReasoningEffort,
    ...(serviceTier === "priority" ? { serviceTier } : {}),
  };
};

import { describe, expect, it } from "vitest";
import { resolveSpellGenerationProfile } from "./spell-generation-profile";

describe("resolveSpellGenerationProfile", () => {
  // Spec: Decision 0003; playable spike defaults to the latency-first profile.
  it("uses Luna with low reasoning for Fast mode", () => {
    expect(resolveSpellGenerationProfile({})).toEqual({
      mode: "fast",
      model: "gpt-5.6-luna",
      reasoningEffort: "low",
    });
  });

  // Spec: Decision 0003; Quality remains an explicit comparison profile.
  it("uses Sol with medium reasoning for Quality mode", () => {
    expect(resolveSpellGenerationProfile({ SPELL_GENERATION_MODE: "quality" })).toEqual({
      mode: "quality",
      model: "gpt-5.6",
      reasoningEffort: "medium",
    });
  });

  // Spec: Decision 0003; evals may override request knobs and Priority is opt-in.
  it("accepts explicit model, reasoning, and priority overrides", () => {
    expect(
      resolveSpellGenerationProfile({
        SPELL_GENERATION_MODE: "quality",
        OPENAI_MODEL: "gpt-5.6-terra",
        OPENAI_REASONING_EFFORT: "low",
        OPENAI_SERVICE_TIER: "priority",
      }),
    ).toEqual({
      mode: "quality",
      model: "gpt-5.6-terra",
      reasoningEffort: "low",
      serviceTier: "priority",
    });
  });
});

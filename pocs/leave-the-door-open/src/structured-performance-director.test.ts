import { describe, expect, it } from "vitest";
import type {
  StructuredRoleCall,
  StructuredRoleModel,
} from "./live-protocol";
import type { PerformanceRequest } from "./performance";
import { StructuredModelPerformanceDirector } from "./structured-performance-director";

describe("structured Performance Director", () => {
  // Spec: chapter-1.md LDO-CH1-021; ADR 0032 LDO-SOCIAL-006.
  it("receives the selected spouse outcome as a closed staging envelope without either Persona state", async () => {
    const model = new QueuedRoleModel([
      { beats: ["Martin speaks.", "Elise answers.", "They stop there."] },
    ]);
    const director = new StructuredModelPerformanceDirector(
      model,
      "Performance prompt",
    );
    const request: PerformanceRequest = {
      outputLocale: "zh-TW",
      actorId: "husband",
      actorDisplayName: "Martin",
      recipientActors: [{ actorId: "wife", actorDisplayName: "Elise" }],
      at: 20 * 60 + 15,
      semanticBehavior: {
        kind: "narrative_action",
        behaviorId: "say_one_honest_thing_to_elise",
        variantId: "one_honest_opening",
        relationshipOutcomeId: "distance_acknowledged",
      },
      scene: {
        locationId: "dining_area",
        visibleFacts: ["Both adults are seated at the dining table."],
      },
      performanceEnvelope: {
        targetObjectIds: [],
        closurePolicy: {
          kind: "authored_postcondition",
          postconditionId: "bounded_spousal_exchange_recorded",
        },
      },
      hintBrief: null,
      acceptedPersonaReply: "I could say one honest thing and stop.",
      authoredRelationshipOutcome: {
        outcomeId: "distance_acknowledged",
        meaning:
          "Elise acknowledges the distance, but neither person resolves it.",
        maximumBeatCount: 3,
        fallbackBeats: ["Opening.", "Reply.", "Closure."],
        wifeVisibleActivityId: "acknowledging_relationship_distance",
      },
    };

    await director.stage(request);

    expect(model.calls[0]!.input).toContain(
      "AUTHORED_RELATIONSHIP_OUTCOME",
    );
    expect(model.calls[0]!.input).toContain(
      '"outcomeId": "distance_acknowledged"',
    );
    expect(model.calls[0]!.input).toContain("OUTPUT_LOCALE\nzh-TW");
    expect(model.calls[0]!.input).toContain('"actorDisplayName": "Elise"');
    expect(model.calls[0]!.input).not.toMatch(
      /CURRENT_MIND_STATE|immediate_answer|one_truthful_reply/,
    );
  });

  it("LDO-LOCAL-011 sends only bounded behavior, safe hint, and engine-owned closure to its own model role", async () => {
    const model = new QueuedRoleModel([
      {
        beats: [
          "He looks up at the clock, starts to pass beneath it, then stops.",
        ],
      },
    ]);
    const director = new StructuredModelPerformanceDirector(
      model,
      "Performance prompt",
    );
    const request: PerformanceRequest = {
      outputLocale: "en",
      actorId: "husband",
      actorDisplayName: "Martin",
      at: 7 * 60 + 57,
      semanticBehavior: {
        kind: "routine",
        behaviorId: "husband_notices_slow_clock",
        variantId: "notice_and_stop",
      },
      scene: {
        locationId: "living_room",
        visibleFacts: [
          "The living-room clock is three minutes slow and currently shows 07:54.",
        ],
      },
      performanceEnvelope: {
        targetObjectIds: ["living_room_clock"],
        closurePolicy: { kind: "restore_valid_starting_state" },
      },
      hintBrief: {
        hintId: "slow_clock_is_repeatedly_noticed",
        safeFact:
          "Martin notices that the living-room clock is three minutes slow every morning.",
        clarity: "clear",
        required: true,
        forbiddenInterpretations: ["Do not explain why."],
      },
      acceptedPersonaReply: null,
    };

    const result = await director.stage(request);

    expect(result).toEqual({
      beats: [
        "He looks up at the clock, starts to pass beneath it, then stops.",
      ],
    });
    expect(model.calls).toHaveLength(1);
    expect(model.calls[0]).toMatchObject({
      role: "performance",
      instructions: "Performance prompt",
      schemaName: "ldo_performance_v1",
    });
    expect(model.calls[0]!.input).toContain(
      "slow_clock_is_repeatedly_noticed",
    );
    expect(model.calls[0]!.input).toContain(
      "restore_valid_starting_state",
    );
    expect(model.calls[0]!.input).toContain("PLAYER_SAFE_ACTOR");
    expect(model.calls[0]!.input).toContain('"displayName": "Martin"');
    expect(model.calls[0]!.input).not.toMatch(
      /currentBarrier|acceptedReframes|HARD_ELIGIBLE_AUTHORED_ACTIONS|child|grief/i,
    );
  });
});

class QueuedRoleModel implements StructuredRoleModel {
  readonly calls: StructuredRoleCall[] = [];

  constructor(private readonly outputs: unknown[]) {}

  async call(request: StructuredRoleCall) {
    this.calls.push(request);
    return {
      parsed: this.outputs.shift(),
      raw: {},
      latencyMs: 1,
      usage: { inputTokens: 1, outputTokens: 1, reasoningTokens: 0 },
    };
  }
}

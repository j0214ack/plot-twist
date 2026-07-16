import { describe, expect, it, vi } from "vitest";
import type { StructuredRoleModel } from "./live-protocol";
import { BudgetedStructuredRoleModel } from "./model-call-budget";
import { getSavedStateReplay } from "./saved-state-replay";

describe("saved-state Judge replay", () => {
  it("LDO-FEAS-003 LDO-FEAS-006 reuses a catalog-blind Wife state from the saved medium run", () => {
    const replay = getSavedStateReplay("wife-observed-medium-20260716");

    expect(replay.source).toEqual({
      resultFile:
        "pocs/leave-the-door-open/validation/live-results/2026-07-16T05-36-32.037Z-gpt-5.6-luna-medium.json",
      fixtureId: "w-observed-i2",
      role: "persona",
    });
    expect(replay.probe.personaState).toMatchObject({
      persona_reply: {
        text: expect.stringContaining(
          "I can remain here for one breath without touching it",
        ),
      },
      mind_state_patch: {
        "mind.accepted_reframe": expect.stringContaining(
          "remaining at the threshold for one breath",
        ),
        "mind.barrier_movement": "weakened",
      },
    });
    expect(replay.probe.action.action_id).toBe("remain_at_threshold");

    const serializedPersonaState = JSON.stringify(replay.probe.personaState);
    expect(serializedPersonaState).not.toContain("remain_at_threshold");
    expect(serializedPersonaState).not.toContain("one_breath_at_threshold");
  });

  it("LDO-FEAS-008 rejects a third call before it reaches the paid model", async () => {
    const call = vi.fn(async () => ({
      parsed: {},
      raw: {},
      latencyMs: 1,
      usage: { inputTokens: 10, outputTokens: 5, reasoningTokens: 2 },
    }));
    const paidModel: StructuredRoleModel = { call };
    const budgeted = new BudgetedStructuredRoleModel(paidModel, {
      maxCalls: 2,
    });
    const request = {
      role: "awareness" as const,
      instructions: "judge",
      input: "packet",
      schemaName: "test",
      schema: { parse: (value: unknown) => value },
    };

    await budgeted.call(request);
    await budgeted.call(request);
    await expect(budgeted.call(request)).rejects.toThrow(
      "Model call budget exhausted: 2/2",
    );

    expect(call).toHaveBeenCalledTimes(2);
    expect(budgeted.snapshot()).toEqual({
      maxCalls: 2,
      callsStarted: 2,
      callsCompleted: 2,
      usage: {
        inputTokens: 20,
        outputTokens: 10,
        reasoningTokens: 4,
      },
    });
  });
});

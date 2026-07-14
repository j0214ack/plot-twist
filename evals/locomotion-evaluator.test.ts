import { describe, expect, it } from "vitest";
import { evaluateLocomotionExpectation } from "./locomotion-evaluator";

describe("evaluateLocomotionExpectation", () => {
  // Spec: Decision 0007 LOC-1 and validation-plan.md LLM behavior boundary.
  it("requires an actual runtime effect when a live Eval names a locomotion mode", () => {
    const flight = {
      id: "locomotion-1",
      actorId: "key",
      ownerId: "spell-1",
      mode: "flight",
      tags: ["airborne"],
      collisionPolicy: "solid" as const,
    };

    expect(evaluateLocomotionExpectation([flight], "flight")).toEqual({
      activeModes: ["flight"],
      matched: true,
    });
    expect(evaluateLocomotionExpectation([], "flight")).toEqual({
      activeModes: [],
      matched: false,
    });
    expect(evaluateLocomotionExpectation([], undefined)).toEqual({
      activeModes: [],
      matched: true,
    });
  });
});

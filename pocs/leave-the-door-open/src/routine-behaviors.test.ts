import { describe, expect, it } from "vitest";
import { selectRoutineVariant } from "./routine-behaviors";

describe("authored RoutineBehavior variants", () => {
  it("LDO-LOCAL-011 selects stronger clock staging from bounded awareness without changing the authored hint target", () => {
    const latent = selectRoutineVariant(
      "husband_notices_slow_clock",
      "latent",
    );
    const faint = selectRoutineVariant(
      "husband_notices_slow_clock",
      "faintly_imagined",
    );
    const surfaced = selectRoutineVariant(
      "husband_notices_slow_clock",
      "surfaced",
    );

    expect(latent).toMatchObject({
      variantId: "notice_and_stop",
      performanceEnvelope: {
        closurePolicy: { kind: "restore_valid_starting_state" },
      },
      hintBrief: {
        hintId: "slow_clock_is_repeatedly_noticed",
        safeFact:
          "Most mornings the husband notices that the living-room clock is three minutes slow and keeps walking; today he stops beneath it.",
        clarity: "clear",
        required: true,
        forbiddenInterpretations: expect.arrayContaining([
          "Do not describe today's stopping as his repeated morning habit.",
        ]),
      },
    });
    expect(faint.variantId).toBe("linger_beneath_clock");
    expect(surfaced.variantId).toBe("touch_clock_frame");
    expect(faint.hintBrief).toEqual(latent.hintBrief);
    expect(surfaced.hintBrief).toEqual(latent.hintBrief);
    expect(latent.hintBrief.safeFact).not.toMatch(
      /grief|relationship|child|mystery|fix the clock/i,
    );
  });
});

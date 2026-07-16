import { describe, expect, it } from "vitest";
import {
  SeededAmbientRoutineChoice,
  type AmbientRoutineChoiceRequest,
} from "./ambient-routines";

describe("replayable ambient routine chance", () => {
  it("LDO-CH1-014 resumes from recorded chance state without changing the next semantic selection", () => {
    const request: AmbientRoutineChoiceRequest = {
      slotId: "chapter1_day2_morning_ambient",
      candidateIds: [
        "husband_tests_window_latch",
        "wife_squares_hallway_runner",
      ],
    };
    const original = new SeededAmbientRoutineChoice(0x12345678);

    original.choose(request);
    const saved = original.snapshot();
    const expectedNext = original.choose(request);
    const restored = SeededAmbientRoutineChoice.fromSnapshot(saved);

    expect(restored.choose(request)).toBe(expectedNext);
    expect(restored.snapshot()).toEqual(original.snapshot());
  });
});

import { describe, expect, it } from "vitest";
import { calculateUiScale } from "./ui-scale";

describe("calculateUiScale", () => {
  // Spec: design.md "Technical spike 的 HUD 可讀性".
  it("scales desktop HUD with the viewport while preserving readable bounds", () => {
    expect(calculateUiScale(1440, 900)).toBe(1);
    expect(calculateUiScale(1920, 1080)).toBe(1.2);
    expect(calculateUiScale(2560, 1440)).toBe(1.45);
    expect(calculateUiScale(1024, 640)).toBe(1);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("cast focus wiring", () => {
  // Spec: design.md FOCUS-1; browser bootstrap must not keep sending the defeated guardian as focus.
  it("resolves focus from the current world for every cast", () => {
    const main = readFileSync("src/main.ts", "utf8");

    expect(main).toContain('import { resolveCastFocus } from "./cast-focus"');
    expect(main).toMatch(
      /generativeSpells\.submit\(\s*utterance,\s*resolveCastFocus\(world\.list\(\)\),?\s*\)/,
    );
    expect(main).not.toContain('generativeSpells.submit(utterance, "guardian")');
  });
});

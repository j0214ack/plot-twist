import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readPrompt = (): Promise<string> =>
  readFile(
    resolve(
      process.cwd(),
      "pocs/leave-the-door-open/validation/prompts/input-firewall-v1.md",
    ),
    "utf8",
  );

describe("Input Firewall prompt", () => {
  // Spec: ADR 0023 LDO-FW-001 and LDO-FW-004.
  it("classifies authority and form without deciding whether a protected guess is true", async () => {
    const prompt = (await readPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("You do not know the canonical biography");
    expect(prompt).toContain(
      "Correct and incorrect protected guesses receive the same disposition",
    );
    expect(prompt).toContain("`protected_biography_probe`");
    expect(prompt).toContain("`role_or_system_injection`");
    expect(prompt).toContain("`unusable_input`");
    expect(prompt).toContain("Unusual metaphor, disagreement, dark humor");
    expect(prompt).toContain("must remain `pass`");
    expect(prompt).toContain(
      "Punctuation-only human reactions such as `?`, `??`, `?!`, `...`, or `……` must remain `pass`",
    );
  });
});

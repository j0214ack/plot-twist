import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readPrompt = (): Promise<string> =>
  readFile(
    resolve(
      process.cwd(),
      "pocs/leave-the-door-open/validation/prompts/action-judge-v4.md",
    ),
    "utf8",
  );

describe("Leave the Door Open three-phase Judge prompt", () => {
  it("LDO-LOCAL-013 makes the MindState transition phase Action-blind and finite", async () => {
    const prompt = (await readPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("Phase: mind_state_transition");
    expect(prompt).toContain(
      "This phase receives no Action Catalog, Action ID, description, variant, future effect, or preferred outcome.",
    );
    expect(prompt).toContain("only supplied psychological atom IDs");
    expect(prompt).toContain(
      "Player wording alone is never sufficient transition evidence",
    );
    expect(prompt).toContain('"unmodeled_shift_note": null');
  });

  it("preserves separate Action awareness and willingness after validated MindState", async () => {
    const prompt = (await readPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("Phase: awareness");
    expect(prompt).toContain("Controller-validated MindState");
    expect(prompt).toContain("Phase: willingness");
    expect(prompt).toContain(
      "A resolved pressure or accepted reframe is not automatic willingness",
    );
    expect(prompt).toContain(
      "Persona's own latest reply must still express the concrete possibility",
    );
  });
});

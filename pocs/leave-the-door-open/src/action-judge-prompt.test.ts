import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readPrompt = (): Promise<string> =>
  readFile(
    resolve(
      process.cwd(),
      "pocs/leave-the-door-open/validation/prompts/action-judge-v5.md",
    ),
    "utf8",
  );

describe("Leave the Door Open combined post-Persona Judge prompt", () => {
  // Spec: ADR 0035 LDO-LAT-005 and LDO-LAT-006.
  it("keeps psychology finite while judging every hard-eligible authored Action in one phase", async () => {
    const prompt = (await readPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("Phase: post_persona");
    expect(prompt).toContain("only supplied psychological atom IDs");
    expect(prompt).toContain(
      "Player wording alone is never sufficient transition evidence",
    );
    expect(prompt).toContain("one judgment for every supplied Action ID");
    expect(prompt).toContain('"unmodeled_shift_note": null');
  });

  // Spec: ADR 0035 LDO-LAT-005 through LDO-LAT-007.
  it("returns awareness and cacheable willingness together without executing the Action", async () => {
    const prompt = (await readPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("`willingness` must be non-null only for surfaced");
    expect(prompt).toContain(
      "A resolved pressure or accepted reframe is not automatic willingness",
    );
    expect(prompt).toContain(
      "Persona's own latest reply must still express the concrete possibility",
    );
    expect(prompt).toContain("You cannot execute an Action");
  });
});

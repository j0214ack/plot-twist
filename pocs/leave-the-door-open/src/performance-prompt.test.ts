import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readPerformancePrompt = (): Promise<string> =>
  readFile(
    resolve(
      process.cwd(),
      "pocs/leave-the-door-open/validation/prompts/performance-director-v1.md",
    ),
    "utf8",
  );

describe("Leave the Door Open Performance Director prompt", () => {
  it("LDO-LOCAL-011 ADR 0010 limits generation to visible staging of an already-selected behavior", async () => {
    const prompt = (await readPerformancePrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("already-selected semantic behavior");
    expect(prompt).toContain("Do not choose a different behavior");
    expect(prompt).toContain("Do not invent dialogue, private thought, or feeling");
    expect(prompt).toContain("AUTHORED_HINT_BRIEF");
    expect(prompt).toContain("ACCEPTED_PERSONA_REPLY");
    expect(prompt).toContain(
      "Do not turn a gesture that happens now into a repeated habit",
    );
  });

  it("LDO-CHAR-001 ADR 0022 uses the player-safe name without exposing role labels", async () => {
    const prompt = (await readPerformancePrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("PLAYER_SAFE_ACTOR");
    expect(prompt).toContain(
      "Never expose internal actor IDs or role labels such as husband or wife",
    );
  });

  // Spec: chapter-1.md LDO-CH1-021; ADR 0032 LDO-SOCIAL-003/004/006.
  it("permits only the selected bounded relationship dialogue and stops at its authored beat limit", async () => {
    const prompt = (await readPerformancePrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("AUTHORED_RELATIONSHIP_OUTCOME");
    expect(prompt).toContain("PLAYER_SAFE_RECIPIENTS");
    expect(prompt).toContain(
      "Dialogue is permitted only when AUTHORED_RELATIONSHIP_OUTCOME is present",
    );
    expect(prompt).toContain(
      "Do not add another reply, question, disclosure, resolution, or conversation turn",
    );
    expect(prompt).toContain("maximumBeatCount");
  });

  it("LDO-LOCAL-012 ADR 0010 leaves closure, Evidence, and durable state to the engine", async () => {
    const prompt = (await readPerformancePrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("The engine owns technical closure");
    expect(prompt).toContain("Do not activate Evidence");
    expect(prompt).toContain("Do not claim a durable state beyond the supplied postcondition");
    expect(prompt).toContain("one to four concise visible beats");
  });

  // Spec: chapter-1.md, "Routine and HintBrief progression"; ADR 0010
  // Decisions 11-14. A causal pause is its authored routine postcondition,
  // not a transient gesture that the Director may restore away.
  it("LDO-CH1-003 preserves an authored routine postcondition as the final visible beat", async () => {
    const prompt = (await readPerformancePrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("authored_routine_postcondition");
    expect(prompt).toContain(
      "the final beat must visibly preserve that exact routine postcondition",
    );
    expect(prompt).toContain("Do not move the actor away from it afterward");
  });

  // Spec: ADR 0033 LDO-LOC-005 and LDO-LOC-006.
  it("stages directly in the requested session locale", async () => {
    const prompt = (await readPerformancePrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("Follow `OUTPUT_LOCALE` for every visible beat");
    expect(prompt).toContain("natural Traditional Chinese as used in Taiwan");
    expect(prompt).toContain("Do not emit bilingual beats");
  });
});

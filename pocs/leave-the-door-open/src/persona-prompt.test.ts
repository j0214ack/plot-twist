import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readCurrentPersonaPrompt = (): Promise<string> =>
  readFile(
    resolve(
      process.cwd(),
      "pocs/leave-the-door-open/validation/prompts/persona-v9.md",
    ),
    "utf8",
  );

describe("Leave the Door Open Persona prompt", () => {
  // Spec: Run 004 LDO-ACT-PROBE-001 through 003; ADR 0024.
  it("uses the minimal private-self-talk acting contract without performing the character sheet", async () => {
    const prompt = await readCurrentPersonaPrompt();
    const normalizedPrompt = prompt.replace(/\s+/g, " ");

    expect(normalizedPrompt).toContain(
      "`PLAYER_TURN` is an involuntary thought, not another person speaking",
    );
    expect(normalizedPrompt).toContain(
      "follow it, resist it, laugh at it, reinterpret it, ignore it, or let it pass",
    );
    expect(normalizedPrompt).toContain(
      "do not demonstrate or explain the Character Core",
    );
    expect(normalizedPrompt).toContain("Do not answer every thought");
    expect(normalizedPrompt).toContain(
      "default `should_end_conversation` to `false`",
    );
  });

  it("Q2 premature execution promise keeps imagined movement distinct from World commitment", async () => {
    const prompt = (await readCurrentPersonaPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain(
      "You do not know whether a world intention has formed.",
    );
    expect(prompt).toContain(
      "Do not claim that a contemplated movement will occur when time resumes",
    );
    expect(prompt).toContain("present first-person possibility or choice");
    expect(prompt).toContain("future World execution");
  });

  it("Q3 invented present sensation forbids sensory detail not supplied as fact", async () => {
    const prompt = (await readCurrentPersonaPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain(
      "Contact with an object does not authorize a sensory quality.",
    );
    expect(prompt).toContain(
      "Do not invent temperature, texture, weight, sound, smell, pain, tension, or another bodily sensation",
    );
    expect(prompt).toContain(
      "Plausible sensory prose is still an unsupported fact.",
    );
  });

  it("LDO-LOCAL-013 leaves durable MindState transitions to the Judge", async () => {
    const prompt = (await readCurrentPersonaPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain(
      "You do not decide or output durable MindState transitions.",
    );
    expect(prompt).toContain(
      "The Mind-State Transition Judge decides whether any authored belief, reframe, or pressure changes",
    );
    expect(prompt).toContain('"should_end_conversation": false');
    expect(prompt).not.toContain('"mind_state_patch"');
  });

  // Spec: chapter-1.md LDO-CH1-018; ADR 0032.
  it("LDO-CH1-018 treats unrelated psychological dimensions as optional background", async () => {
    const prompt = (await readCurrentPersonaPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain(
      "`CURRENT_MIND_STATE` contains only psychology the character currently owns",
    );
    expect(prompt).toContain(
      "several independent authored psychological dimensions",
    );
    expect(prompt).toContain(
      "Use only an atom directly implicated by the present moment or `PLAYER_TURN`",
    );
    expect(prompt).toContain(
      "Do not introduce, enumerate, or perform an unrelated pressure merely because it is present",
    );
  });

  // Spec: ADR 0034 LDO-FW-011 and LDO-PSY-001.
  it("remembers a guarded reaction as prior self-talk without treating it as truth", async () => {
    const prompt = (await readCurrentPersonaPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("`controller_guarded_reaction`");
    expect(prompt).toContain(
      "proves only that this reaction occurred, not that its wording is factually true",
    );
    expect(prompt).toContain(
      "does not contain an `unavailable` constructive reframe",
    );
  });

  // Spec: Run 004 LDO-ACT-PROBE-002 and 003; ADR 0023 Decision 2.
  it("treats a selected memory as optional background rather than required exposition", async () => {
    const prompt = (await readCurrentPersonaPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("`RELEVANT_MEMORY` is optional background");
    expect(prompt).toContain(
      "Do not quote, summarize, or mention it merely because it was supplied",
    );
    expect(prompt).toContain(
      "A memory does not establish a present World fact",
    );
  });

  // Spec: ADR 0001 Decisions 2 and 6; chapter-1.md LDO-CH1-008.
  // A globally true, player-visible event is still not Persona knowledge until
  // the focused character receives it as an allowed fact or observed Evidence.
  it("LDO-CH1-008 prevents player retelling from bypassing the observation gate", async () => {
    const prompt = (await readCurrentPersonaPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain(
      "The player's access to another scene is not the focused character's perception",
    );
    expect(prompt).toContain(
      "Switching focus does not transfer facts between characters",
    );
    expect(prompt).toContain(
      "verify that the same concrete fact is explicitly present in `ALLOWED_FACTS`",
    );
    expect(prompt).toContain(
      "Do not say the character saw, noticed, remembers, or knows it",
    );
    expect(prompt).toContain(
      "A `CHARACTER_CORE` attention tendency never supplies an observation",
    );
    expect(prompt).toContain(
      "Check every component claim separately; one unsupported sentence cannot donate an actor, location, object state, contact, or observation",
    );
    expect(prompt).toContain(
      'If the player says "He is at the closed door with his hand on its handle"',
    );
  });

  // Spec: ADR 0033 LDO-LOC-005 and LDO-LOC-006.
  it("performs directly in the requested session locale", async () => {
    const prompt = (await readCurrentPersonaPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain("Follow `OUTPUT_LOCALE` for the reply");
    expect(prompt).toContain("write natural Traditional Chinese as used in Taiwan");
    expect(prompt).toContain("Do not emit both languages");
    expect(prompt).toContain("Do not describe the reply as a translation");
  });

  // Spec: tutorial-prologue.md Boundaries — zh-TW shallow resistance must be
  // intelligible self-talk rather than an elliptical translated fragment.
  it("requires concrete referents and complete natural zh-TW thoughts", async () => {
    const prompt = (await readCurrentPersonaPrompt()).replace(/\s+/g, " ");

    expect(prompt).toContain(
      "Use ordinary, complete Taiwan Mandarin sentences or thought fragments whose concrete referent remains clear",
    );
    expect(prompt).toContain(
      "Do not manufacture a vague dramatic clause with a missing object merely to preserve resistance",
    );
    expect(prompt).toContain(
      "state the acceptance, reluctance, or refusal plainly enough to understand on its own",
    );
  });
});

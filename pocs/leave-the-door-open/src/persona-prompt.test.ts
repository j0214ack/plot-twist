import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readCurrentPersonaPrompt = (): Promise<string> =>
  readFile(
    resolve(
      process.cwd(),
      "pocs/leave-the-door-open/validation/prompts/persona-v7.md",
    ),
    "utf8",
  );

describe("Leave the Door Open Persona prompt", () => {
  it("Q1 non-incremental why loop requires new grounded information or an honest close", async () => {
    const prompt = await readCurrentPersonaPrompt();
    const normalizedPrompt = prompt.replace(/\s+/g, " ");

    expect(normalizedPrompt).toContain(
      "Resistance does not require repetition.",
    );
    expect(normalizedPrompt).toContain("Read `CONVERSATION_SO_FAR`");
    expect(normalizedPrompt).toContain(
      "add a previously unstated grounded detail or distinction",
    );
    expect(normalizedPrompt).toContain(
      "end the conversation rather than paraphrase the same barrier again",
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
});

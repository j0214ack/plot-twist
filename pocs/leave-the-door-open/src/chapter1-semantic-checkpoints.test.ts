import { describe, expect, it } from "vitest";
import {
  getChapter1SemanticCheckpoint,
  getChapter1SemanticCheckpoints,
} from "./chapter1-semantic-checkpoints";

describe("Chapter 1 semantic checkpoint fixtures", () => {
  it("LDO-CH1-013 returns every psychological region in authored order for each Character Core", () => {
    expect(
      getChapter1SemanticCheckpoints("husband").map(
        ({ actor, regionId }) => [actor, regionId],
      ),
    ).toEqual([
      ["husband", "H0"],
      ["husband", "H1"],
      ["husband", "H2"],
      ["husband", "H3"],
    ]);
    expect(
      getChapter1SemanticCheckpoints("wife").map(
        ({ actor, regionId }) => [actor, regionId],
      ),
    ).toEqual([
      ["wife", "W0"],
      ["wife", "W1"],
      ["wife", "W2"],
      ["wife", "W3"],
      ["wife", "W4"],
      ["wife", "W5"],
    ]);
  });

  it("LDO-CH1-007 LDO-CH1-013 keeps persona-owned state catalog-blind and free of future results", () => {
    const personaOwnedText = [
      ...getChapter1SemanticCheckpoints("husband"),
      ...getChapter1SemanticCheckpoints("wife"),
    ]
      .map(({ personaOwnedState }) => personaOwnedState)
      .join("\n");

    expect(personaOwnedText).not.toMatch(
      /open_door_a_crack|remain_at_threshold|step_inside_room|open_room_window/i,
    );
    expect(personaOwnedText).not.toContain("Open the door just a little.");
    expect(personaOwnedText).not.toContain(
      "Remain at the threshold for one breath.",
    );
    expect(personaOwnedText).not.toContain(
      "Step across the threshold, then step back.",
    );
    expect(personaOwnedText).not.toContain("Open the window a little.");
    expect(personaOwnedText).not.toMatch(
      /\bwill\b|\bresult(?:s|ing)?\b|\bchapter (?:becomes|is) complete\b|\bactivates? evidence\b/i,
    );
  });

  it("LDO-CH1-013 distinguishes bounded opening ownership from present willingness in H2 and H3", () => {
    const h2 = getChapter1SemanticCheckpoint("H2");
    const h3 = getChapter1SemanticCheckpoint("H3");

    expect(h2).toMatchObject({
      actor: "husband",
      expectedMaxAwareness: "surfaced",
      presentWillingness: false,
      precedingWorldPrerequisite: "closed_door_handle_reached",
    });
    expect(h2.personaOwnedState).toMatch(/narrow opening|stopping point/i);
    expect(h3).toMatchObject({
      actor: "husband",
      expectedMaxAwareness: "surfaced",
      presentWillingness: true,
      precedingWorldPrerequisite: "closed_door_handle_reached",
    });
    expect(h3.personaOwnedState).toMatch(/willing|now/i);
    expect(h2.personaOwnedState).not.toBe(h3.personaOwnedState);
  });

  it("LDO-CH1-009 LDO-CH1-010 LDO-CH1-013 keeps Wife threshold, entry, household response, and willingness checkpoints distinct", () => {
    const w2 = getChapter1SemanticCheckpoint("W2");
    const w3 = getChapter1SemanticCheckpoint("W3");
    const w4 = getChapter1SemanticCheckpoint("W4");
    const w5 = getChapter1SemanticCheckpoint("W5");

    expect(w2).toMatchObject({
      expectedMaxAwareness: "surfaced",
      presentWillingness: false,
      precedingWorldPrerequisite: "returned_outside_observed_gap",
    });
    expect(w2.personaOwnedState).toMatch(/threshold/i);
    expect(w3).toMatchObject({
      expectedMaxAwareness: "surfaced",
      presentWillingness: false,
      precedingWorldPrerequisite: "threshold_presence_completed_prior_day",
    });
    expect(w3.personaOwnedState).toMatch(/one pace inside/i);
    expect(w4).toMatchObject({
      expectedMaxAwareness: "surfaced",
      presentWillingness: false,
      precedingWorldPrerequisite: "room_entry_completed_prior_day",
    });
    expect(w4.personaOwnedState).toMatch(/household response/i);
    expect(w5).toMatchObject({
      expectedMaxAwareness: "surfaced",
      presentWillingness: true,
      precedingWorldPrerequisite: "returned_inside_with_window_closed",
    });
    expect(w5.personaOwnedState).toMatch(/willing|now/i);
    expect(
      new Set(
        [w2, w3, w4, w5].map(({ personaOwnedState }) => personaOwnedState),
      ).size,
    ).toBe(4);
  });
});

import { describe, expect, it } from "vitest";
import type { SpellBundle } from "../src/generative/types";
import { evaluateLocomotionInteractionComposition } from "./module-responsibility-evaluator";

const bundle = (
  modules: Array<{
    id: string;
    dependsOn?: string[];
    source: string;
  }>,
): SpellBundle => ({
  summary: "Test locomotion composition",
  modules: modules.map((module) => ({
    id: module.id,
    label: module.id,
    tags: [],
    dependsOn: module.dependsOn ?? [],
    source: module.source,
  })),
});

describe("evaluateLocomotionInteractionComposition", () => {
  // Spec: Decision 0007 LOC-6 and MOD-5; Eval scores responsibilities, not a fixed module count.
  it("accepts compound mechanics and separated flight-owner/contact-observer graphs", () => {
    const compound = bundle([
      {
        id: "compound",
        source:
          "() => game.locomotion.attach('key', { mode: 'flight' }); game.navigation.follow(path, 3, dt); game.interaction.invoke('key', 'door', 'unlock')",
      },
    ]);
    const separated = bundle([
      {
        id: "flight",
        source:
          "() => game.locomotion.attach('key', { mode: 'flight' }); game.navigation.follow(path, 3, dt)",
      },
      {
        id: "unlock",
        dependsOn: ["flight"],
        source: "() => game.interaction.invoke('key', 'door', 'unlock')",
      },
    ]);

    expect(evaluateLocomotionInteractionComposition(compound).matched).toBe(true);
    expect(evaluateLocomotionInteractionComposition(separated).matched).toBe(true);
  });

  it("rejects a separated graph whose unlock observer duplicates navigation", () => {
    const duplicated = bundle([
      {
        id: "flight",
        source:
          "() => game.locomotion.attach('key', { mode: 'flight' }); game.navigation.follow(path, 3, dt)",
      },
      {
        id: "unlock",
        dependsOn: ["flight"],
        source:
          "() => game.navigation.follow(path, 3, dt); game.interaction.invoke('key', 'door', 'unlock')",
      },
    ]);

    expect(evaluateLocomotionInteractionComposition(duplicated)).toMatchObject({
      matched: false,
      reasons: expect.arrayContaining([expect.stringContaining("duplicates navigation")]),
    });
  });
});

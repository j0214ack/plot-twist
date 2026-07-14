import { describe, expect, it } from "vitest";
import { GeneratedModuleLoader } from "./module-loader";
import type { SpellArtifact } from "../game/types";

describe("GeneratedModuleLoader", () => {
  // Spec: Decision 0002, Generated source ABI.
  it("evaluates a JavaScript factory and injects only declared artifact bindings", () => {
    const dependency: SpellArtifact = {
      id: "spell-1",
      label: "Crystal enclosure",
      tags: ["enclosure"],
      entityIds: ["wall-1"],
      createdAt: 0,
    };
    const loader = new GeneratedModuleLoader();

    const module = loader.instantiate(
      `(dependencies) => ({
        label: "Fire inside " + dependencies.enclosure.label,
        tags: ["fire"],
        setup() {},
        dispose() {},
      })`,
      { enclosure: dependency },
    );

    expect(module.label).toBe("Fire inside Crystal enclosure");
    expect(module.tags).toEqual(["fire"]);
  });

  // Spec: Decision 0002 GEN-5 and Generated source ABI.
  it("rejects a factory result that does not implement the module lifecycle", () => {
    const loader = new GeneratedModuleLoader();

    expect(() => loader.instantiate("() => ({ label: 'No cleanup', tags: [] })", {})).toThrow(
      "invalid MechanicModule",
    );
  });

  // Spec: validation-plan.md H8; generated source cannot contain an obvious blocking loop.
  it("rejects an unbounded loop before evaluating generated source", () => {
    const loader = new GeneratedModuleLoader();

    expect(() =>
      loader.instantiate(
        `() => ({
          label: "Frozen spell",
          tags: [],
          setup() { while (true) {} },
          dispose() {},
        })`,
        {},
      ),
    ).toThrow("unbounded loop");
  });
});

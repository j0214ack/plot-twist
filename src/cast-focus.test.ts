import { describe, expect, it } from "vitest";
import { resolveCastFocus } from "./cast-focus";

describe("resolveCastFocus", () => {
  const entity = (id: string, tags: string[], active = true) => ({ id, tags, active });

  // Spec: design.md FOCUS-1; the baked focus follows the unresolved obstacle.
  it("hands focus from the living guardian to the locked door and then the portal", () => {
    const guardian = entity("guardian", ["guardian", "enemy"]);
    const door = entity("door", ["door", "locked"]);
    const portal = entity("portal", ["portal", "story-goal"]);

    expect(resolveCastFocus([guardian, door, portal])).toBe("guardian");
    expect(resolveCastFocus([{ ...guardian, active: false }, door, portal])).toBe("door");
    expect(
      resolveCastFocus([
        { ...guardian, active: false },
        { ...door, tags: ["door", "unlocked"] },
        portal,
      ]),
    ).toBe("portal");
  });
});

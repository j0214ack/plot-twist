import { describe, expect, it } from "vitest";
import { GameWorld } from "../src/game/world";
import { setupEvalScenario } from "./scenario";

describe("setupEvalScenario", () => {
  // Spec: Decision 0006 NAV-9; live Eval distinguishes reachable and sealed contact worlds.
  it("builds key-door scenarios whose only difference is dynamic solid reachability", () => {
    const openWorld = new GameWorld();
    const open = setupEvalScenario(openWorld, "key-door-open");
    const sealedWorld = new GameWorld();
    const sealed = setupEvalScenario(sealedWorld, "key-door-sealed");

    expect(open.observedActorId).toBe("key");
    expect(open.doorId).toBe("door");
    expect(openWorld.queryByTag("solid")).toHaveLength(0);
    expect(sealed.observedActorId).toBe("key");
    expect(sealed.doorId).toBe("door");
    expect(sealedWorld.queryByTag("solid")).toHaveLength(4);
    expect(sealed.scene.map(({ id }) => id)).toEqual(
      expect.arrayContaining(["key", "door", "cage-wall-1"]),
    );
  });
});

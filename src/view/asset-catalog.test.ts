import { describe, expect, it } from "vitest";
import { DUNGEON_ROOM_ASSETS, getBakedEntityAsset } from "./asset-catalog";

describe("CC0 visual asset catalog", () => {
  // Spec: validation-plan.md "Demo visual asset pass".
  it("maps every baked entity placeholder to a local, traceable CC0 model", () => {
    expect(getBakedEntityAsset("player")).toMatchObject({
      url: "/assets/cc0/kenney-mini-dungeon/character-human.glb",
      hiddenNodes: ["arm-left", "arm-right"],
    });
    expect(getBakedEntityAsset("guardian")).toMatchObject({
      url: "/assets/cc0/kenney-mini-dungeon/character-orc.glb",
    });
    expect(getBakedEntityAsset("door")).toMatchObject({
      url: "/assets/cc0/kenney-mini-dungeon/gate.glb",
    });
    expect(getBakedEntityAsset("key")).toMatchObject({
      url: "/assets/cc0/quaternius-key/key.glb",
    });
  });

  // Spec: validation-plan.md "Demo visual asset pass": generated entities remain runtime primitives.
  it("does not turn arbitrary generated entities into preset visual assets", () => {
    expect(getBakedEntityAsset("generated-spell-42")).toBeUndefined();
  });

  // Spec: validation-plan.md "Demo visual asset pass": no runtime third-party CDN dependency.
  it("builds the baked room from local CC0 assets", () => {
    expect(DUNGEON_ROOM_ASSETS.length).toBeGreaterThan(0);
    expect(DUNGEON_ROOM_ASSETS.every(({ url }) => url.startsWith("/assets/cc0/"))).toBe(true);
    expect(DUNGEON_ROOM_ASSETS.some(({ role }) => role === "floor")).toBe(true);
    expect(DUNGEON_ROOM_ASSETS.some(({ role }) => role === "wall")).toBe(true);
  });
});

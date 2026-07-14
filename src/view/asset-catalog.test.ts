import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DUNGEON_ROOM_ASSETS, getBakedEntityAsset } from "./asset-catalog";

const externalGlbResources = (filePath: string): string[] => {
  const file = readFileSync(filePath);
  const jsonLength = file.readUInt32LE(12);
  const manifest = JSON.parse(
    file.subarray(20, 20 + jsonLength).toString().replace(/\u0000/g, "").trim(),
  ) as { images?: Array<{ uri?: string }> };
  return (manifest.images ?? []).flatMap(({ uri }) =>
    uri && !uri.startsWith("data:") ? [uri] : [],
  );
};

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

  // Spec: validation-plan.md "Demo visual asset pass": vendored assets are self-contained.
  // Regression: Kenney GLBs rendered white when their shared colormap was not copied.
  it("vendors every external texture referenced by a baked GLB", () => {
    const entityUrls = ["player", "guardian", "door", "key"].flatMap((id) => {
      const asset = getBakedEntityAsset(id);
      return asset ? [asset.url] : [];
    });
    const urls = new Set([...entityUrls, ...DUNGEON_ROOM_ASSETS.map(({ url }) => url)]);

    for (const url of urls) {
      const glbPath = join(process.cwd(), "public", url);
      for (const dependency of externalGlbResources(glbPath)) {
        expect(existsSync(resolve(dirname(glbPath), dependency)), dependency).toBe(true);
      }
    }
  });
});

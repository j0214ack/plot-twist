import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Leave the Door Open local play commands", () => {
  // Spec: ADR 0019 Decisions 1 and 2; ADR 0035 LDO-LAT-010.
  it("defaults HTML play to direct luna-low while preserving an explicit local-Codex command", async () => {
    const packageJson = JSON.parse(
      await readFile("package.json", "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts["play:ldo:text"]).toBe(
      "tsx pocs/leave-the-door-open/src/run-terminal-playtest.ts",
    );
    expect(packageJson.scripts["play:ldo:web"]).toBe(
      "LDO_WEB_MODEL_BACKEND=openai LDO_PLAY_MODEL=gpt-5.6-luna LDO_PLAY_EFFORT=low vite --mode ldo-local-openai --open /leave-the-door-open/ --port 5173 --strictPort",
    );
    expect(packageJson.scripts["play:ldo:web:codex"]).toBe(
      "LDO_WEB_MODEL_BACKEND=codex vite --mode ldo-local-codex --open /leave-the-door-open/ --port 5173 --strictPort",
    );
    expect(packageJson.scripts["play:ldo"]).toBe("npm run play:ldo:text");
  });
});

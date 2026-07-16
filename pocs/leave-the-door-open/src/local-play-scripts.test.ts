import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Leave the Door Open local play commands", () => {
  // Spec: ADR 0019 Decisions 1, 2, and 5.
  it("names the text and local-Codex HTML surfaces explicitly while preserving the text alias", async () => {
    const packageJson = JSON.parse(
      await readFile("package.json", "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts["play:ldo:text"]).toBe(
      "tsx pocs/leave-the-door-open/src/run-terminal-playtest.ts",
    );
    expect(packageJson.scripts["play:ldo:web"]).toBe(
      "vite --mode ldo-local-codex --open /leave-the-door-open/",
    );
    expect(packageJson.scripts["play:ldo"]).toBe("npm run play:ldo:text");
  });
});

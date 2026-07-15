import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ruleBody = (css: string, selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
};

describe("demo access overlay", () => {
  // Spec: Decision 0005 PUB-11; mobile notices must not steal the access form hit target.
  it("stays above every mobile presentation gate", () => {
    const css = readFileSync("src/style.css", "utf8");

    expect(ruleBody(css, ".demo-access-overlay")).toContain("z-index: 60");
  });

  // Spec: Decision 0005 PUB-11; a fullscreen blur over WebGL can freeze low-power text input.
  it("does not continuously blur the game while the player types the code", () => {
    const css = readFileSync("src/style.css", "utf8");

    expect(ruleBody(css, ".demo-access-overlay")).not.toContain("backdrop-filter");
  });

  // Spec: Decision 0005 PUB-11; releasing V inside either text input is still text editing.
  it("keeps the voice hotkey inactive for both keydown and keyup in text fields", () => {
    const main = readFileSync("src/main.ts", "utf8");

    expect(main).toMatch(
      /addEventListener\("keydown"[^]*isEditingText\(target\)[^]*addEventListener\("keyup"[^]*isEditingText\(event\.target\)/,
    );
  });
});

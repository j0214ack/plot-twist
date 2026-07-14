import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mobile spell feedback", () => {
  // Spec: Decision 0004 final-transcript echo and Decision 0008 MOB-11.
  // Browser harness unavailable, so the renderer wiring remains explicit and thin.
  it("keeps the completed transcript visible while the spell is being written", () => {
    const ui = readFileSync("src/ui.ts", "utf8");
    const css = readFileSync("src/style.css", "utf8");

    expect(ui).toContain('class="incantation-echo"');
    expect(ui).toContain('class="incantation-echo-text"');
    expect(ui).toMatch(
      /setIncantation\(utterance: string\)[^]*incantationEchoText\.textContent = utterance;[^]*incantationEcho\.classList\.add\("visible"\);[^]*incantationEcho\.setAttribute\("aria-hidden", "false"\);/,
    );
    expect(ui).toMatch(
      /clearIncantation\(\)[^]*incantationEcho\.classList\.remove\("visible"\);[^]*incantationEcho\.setAttribute\("aria-hidden", "true"\);/,
    );
    expect(css).toMatch(/#app\.mobile-mode \.incantation-echo\.visible\s*\{[^}]*display: block;/);
  });

  // Spec: Decision 0008 MOB-10; mobile uses the same HudState for compact player and guardian HP.
  it("renders and updates compact health bars for both combatants", () => {
    const ui = readFileSync("src/ui.ts", "utf8");
    const css = readFileSync("src/style.css", "utf8");

    expect(ui).toContain('class="mobile-combat-hud"');
    expect(ui).toContain('class="mobile-player-health"');
    expect(ui).toContain('class="mobile-guardian-health"');
    expect(ui).toContain('querySelectorAll<HTMLElement>("[data-player-health]")');
    expect(ui).toContain('querySelectorAll<HTMLElement>("[data-guardian-health]")');
    expect(ui).toMatch(/for \(const bar of this\.healthBars\)[^\n]*state\.playerHp/);
    expect(ui).toMatch(/for \(const bar of this\.guardianBars\)[^\n]*state\.guardianHp/);
    expect(css).toMatch(/#app\.mobile-mode \.mobile-combat-hud\s*\{[^}]*display: flex;/);
  });
});

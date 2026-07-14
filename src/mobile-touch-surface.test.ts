import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ruleBody = (css: string, selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
};

describe("mobile touch surfaces", () => {
  // Spec: Decision 0008 MOB-6/MOB-7; browser harness unavailable, so keep the hit-test contract explicit.
  it("keeps both controls independently hit-testable for simultaneous pointers", () => {
    const ui = readFileSync("src/ui.ts", "utf8");
    const css = readFileSync("src/style.css", "utf8");

    expect(ui).toMatch(/class="[^"]*virtual-joystick[^"]*mobile-touch-control[^"]*"/);
    expect(ui).toMatch(/class="[^"]*mobile-mic-button[^"]*mobile-touch-control[^"]*"/);
    expect(ruleBody(css, ".mobile-touch-control")).toContain("pointer-events: auto");
    expect(ruleBody(css, ".mobile-touch-control")).toContain("touch-action: none");
  });

  // Spec: Decision 0008 MOB-6/MOB-7; holding a control is game input, not text selection.
  it("suppresses native long-press callouts and selection on control descendants", () => {
    const css = readFileSync("src/style.css", "utf8");
    const descendantPolicy = ruleBody(css, ".mobile-touch-control *");

    expect(descendantPolicy).toContain("-webkit-touch-callout: none");
    expect(descendantPolicy).toContain("-webkit-user-select: none");
    expect(descendantPolicy).toContain("user-select: none");
  });
});

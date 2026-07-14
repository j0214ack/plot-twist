import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("startup loading shell", () => {
  // Spec: design.md LOAD-1/LOAD-4; browser harness unavailable, so keep the initial document contract explicit.
  it("renders one shared indeterminate loading screen before the runtime app", () => {
    const html = readFileSync("index.html", "utf8");
    const loadingIndex = html.indexOf('id="startup-loading"');
    const appIndex = html.indexOf('id="app"');
    const loadingMarkup = html.match(/<section id="startup-loading"[^]*?<\/section>/)?.[0] ?? "";

    expect(html).toContain("data-startup-loading-critical");
    expect(loadingIndex).toBeGreaterThan(-1);
    expect(loadingIndex).toBeLessThan(appIndex);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-hidden="false"');
    expect(loadingMarkup.replace(/<[^>]+>/g, "")).not.toMatch(/\d+\s*%/);
  });

  // Spec: design.md LOAD-5; the completed layer must fade without blocking the next gate.
  it("makes the completed loading layer transparent, hidden, and non-interactive", () => {
    const html = readFileSync("index.html", "utf8");
    const completedRule = html.match(/\.startup-loading\.is-complete\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(completedRule).toContain("opacity: 0");
    expect(completedRule).toContain("visibility: hidden");
    expect(completedRule).toContain("pointer-events: none");
  });
});

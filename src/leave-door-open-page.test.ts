import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Leave the Door Open friend-playtest page", () => {
  // Spec: ADR 0018 LDO-WEB-001 and LDO-WEB-002.
  it("provides a separate thin page with the complete text-play input surface", () => {
    const html = readFileSync("leave-the-door-open/index.html", "utf8");

    expect(html).toContain('id="ldo-screen"');
    expect(html).toContain('id="ldo-thought-form"');
    expect(html).toContain('id="ldo-possibilities"');
    expect(html).toContain('data-command="/focus martin"');
    expect(html).toContain('data-command="/focus elise"');
    expect(html).toContain("進入 Martin 的想法");
    expect(html).toContain("進入 Elise 的想法");
    expect(html).toContain('data-command="/resume"');
    expect(html).toContain('data-command="/help"');
    expect(html).toContain('id="ldo-access-form"');
    expect(html).toContain('src="/src/leave-door-open-main.ts"');

    const entry = readFileSync("src/leave-door-open-main.ts", "utf8");
    expect(entry).not.toMatch(
      /pocs\/leave-the-door-open\/src\/(world|controller|narrative-actions)/,
    );
  });

  // Spec: ADR 0019 Decision 7; anonymous bootstrap must not flash a code prompt.
  it("keeps the access panel and form hidden until the server explicitly requires a code", () => {
    const html = readFileSync("leave-the-door-open/index.html", "utf8");
    const accessPanel = html.match(
      /<section[^>]*id="ldo-access-panel"[^>]*>/,
    )?.[0];
    const accessForm = html.match(/<form[^>]*id="ldo-access-form"[^>]*>/)?.[0];

    expect(accessPanel).toContain("hidden");
    expect(accessForm).toContain("hidden");
  });

  // Spec: ADR 0021 LDO-WEB-009; unavailable mechanics are not advertised.
  it("starts with Chapter 1 focus controls hidden", () => {
    const html = readFileSync("leave-the-door-open/index.html", "utf8");
    const focusControls = html.match(
      /<div[^>]*id="ldo-focus-controls"[^>]*>/,
    )?.[0];

    expect(focusControls).toContain("hidden");
  });

  // Spec: ADR 0026 LDO-WEB-010.
  it("places focus, resume, and help controls below the transcript and thought input", () => {
    const html = readFileSync("leave-the-door-open/index.html", "utf8");
    const transcriptIndex = html.indexOf('id="ldo-screen"');
    const thoughtInputIndex = html.indexOf('id="ldo-thought-form"');
    const focusControlsIndex = html.indexOf('id="ldo-focus-controls"');
    const resumeControlIndex = html.indexOf('data-command="/resume"');
    const helpControlIndex = html.indexOf('data-command="/help"');

    expect(transcriptIndex).toBeGreaterThan(-1);
    expect(thoughtInputIndex).toBeGreaterThan(transcriptIndex);
    expect(focusControlsIndex).toBeGreaterThan(thoughtInputIndex);
    expect(resumeControlIndex).toBeGreaterThan(focusControlsIndex);
    expect(helpControlIndex).toBeGreaterThan(resumeControlIndex);
  });

  // Spec: ADR 0033 LDO-LOC-006 and LDO-LOC-007.
  it("defaults to Traditional Chinese while offering an explicit English session", () => {
    const html = readFileSync("leave-the-door-open/index.html", "utf8");

    expect(html).toContain('id="ldo-locale-switch"');
    expect(html).toContain('href="?locale=zh-TW"');
    expect(html).toContain('href="?locale=en"');
    expect(html).toContain('data-copy-key="browser.thoughtLabel"');
    expect(html).toContain('data-copy-placeholder="browser.thoughtPlaceholder"');

    const entry = readFileSync("src/leave-door-open-main.ts", "utf8");
    expect(entry).toContain('?? "zh-TW"');
    expect(entry).toContain("applyBrowserCopy(locale)");
  });
});

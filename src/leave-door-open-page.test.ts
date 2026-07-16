import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Leave the Door Open friend-playtest page", () => {
  // Spec: ADR 0018 LDO-WEB-001 and LDO-WEB-002.
  it("provides a separate thin page with the complete text-play input surface", () => {
    const html = readFileSync("leave-the-door-open/index.html", "utf8");

    expect(html).toContain('id="ldo-screen"');
    expect(html).toContain('id="ldo-thought-form"');
    expect(html).toContain('id="ldo-possibilities"');
    expect(html).toContain('data-command="/focus husband"');
    expect(html).toContain('data-command="/focus wife"');
    expect(html).toContain('data-command="/resume"');
    expect(html).toContain('data-command="/help"');
    expect(html).toContain('id="ldo-access-form"');
    expect(html).toContain('src="/src/leave-door-open-main.ts"');

    const entry = readFileSync("src/leave-door-open-main.ts", "utf8");
    expect(entry).not.toMatch(
      /pocs\/leave-the-door-open\/src\/(world|controller|narrative-actions)/,
    );
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("startup loading bootstrap wiring", () => {
  // Spec: design.md LOAD-2/LOAD-5; browser harness unavailable, so wiring stays thin and explicit.
  it("hands off after the session settles and the renderer produces a world frame", () => {
    const main = readFileSync("src/main.ts", "utf8");

    expect(main).toContain('document.querySelector<HTMLElement>("#startup-loading")');
    expect(main).toMatch(
      /demoSession\.start\(\)\.finally\(\(\) => startupLoading\.markSessionSettled\(\)\)/,
    );
    expect(main).toMatch(
      /renderer\.sync\(world\.list\(\), \(time - startedAt\) \/ 1000\);\s+if \(!initialWorldFrameRendered\) \{[^}]*startupLoading\.markWorldRendered\(\);/,
    );
    expect(main).toContain("resolveAccessGatedFramePolicy");
  });
});

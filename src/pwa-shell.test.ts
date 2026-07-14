import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mobile PWA shell", () => {
  // Spec: Decision 0008 MOB-2/MOB-8.
  it("declares an installable fullscreen landscape manifest with required icons", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8")) as {
      id: string;
      start_url: string;
      scope: string;
      display: string;
      display_override: string[];
      orientation: string;
      icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
    };

    expect(manifest).toMatchObject({
      id: "/",
      start_url: "/",
      scope: "/",
      display: "fullscreen",
      display_override: ["fullscreen", "standalone"],
      orientation: "landscape",
    });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }),
      ]),
    );
    expect(statSync("public/icons/icon-192.png").size).toBeGreaterThan(0);
    expect(statSync("public/icons/icon-512.png").size).toBeGreaterThan(0);
  });

  // Spec: Decision 0008 MOB-8; iOS Home Screen launch uses the same fullscreen-safe document.
  it("links the manifest, touch icon, and viewport safe-area metadata", () => {
    const html = readFileSync("index.html", "utf8");

    expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"');
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(html).toContain('rel="apple-touch-icon" href="/icons/apple-touch-icon.png"');
    expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(statSync("public/icons/apple-touch-icon.png").size).toBeGreaterThan(0);
  });
});

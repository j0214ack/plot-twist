import { describe, expect, it } from "vitest";
import {
  resolveDemoAccessOptions,
  resolvePreviewAllowedHosts,
} from "./demo-access-config";

describe("resolveDemoAccessOptions", () => {
  // Spec: Decision 0005 PUB-2, PUB-6, PUB-7 and PUB-10.
  it("requires explicit origin and signing secret for the public preview server", () => {
    expect(() => resolveDemoAccessOptions({}, { isPreview: true })).toThrow(
      "ALLOWED_ORIGIN",
    );
    expect(() =>
      resolveDemoAccessOptions(
        { ALLOWED_ORIGIN: "https://unwritten-spell.fly.dev" },
        { isPreview: true },
      ),
    ).toThrow("DEMO_SESSION_SECRET");
  });

  // Spec: Decision 0005 PUB-4, PUB-6 and PUB-7.
  it("maps public deployment secrets without exposing them to Vite client env", () => {
    expect(
      resolveDemoAccessOptions(
        {
          ALLOWED_ORIGIN: "https://unwritten-spell.fly.dev",
          DEMO_SESSION_SECRET: "deployment-session-secret",
          DEMO_ACCESS_CODE: "shared-quill-code",
        },
        { isPreview: true },
      ),
    ).toEqual({
      allowedOrigin: "https://unwritten-spell.fly.dev",
      sessionSecret: "deployment-session-secret",
      accessCode: "shared-quill-code",
      secureCookies: true,
    });
  });

  // Spec: Decision 0005 PUB-5; local development needs no secret setup or access prompt.
  it("uses a localhost-only anonymous session in the development server", () => {
    const resolved = resolveDemoAccessOptions({}, { isPreview: false });

    expect(resolved.allowedOrigin).toBe("http://127.0.0.1:5173");
    expect(resolved.sessionSecret).toBeTruthy();
    expect(resolved.accessCode).toBeUndefined();
    expect(resolved.secureCookies).toBe(false);
  });

  // Spec: Decision 0005 defines ALLOWED_ORIGIN as an origin, not a URL-prefix allowlist.
  it("rejects allowed origins containing paths, query strings, or credentials", () => {
    for (const value of [
      "https://example.com/game",
      "https://example.com?demo=1",
      "https://user@example.com",
    ]) {
      expect(() =>
        resolveDemoAccessOptions(
          { ALLOWED_ORIGIN: value, DEMO_SESSION_SECRET: "secret" },
          { isPreview: true },
        ),
      ).toThrow("valid origin");
    }
  });
});

describe("resolvePreviewAllowedHosts", () => {
  // Spec: Decision 0005 PUB-10; Fly must be able to serve the public preview host.
  it("allows exactly the hostname from ALLOWED_ORIGIN in preview mode", () => {
    expect(
      resolvePreviewAllowedHosts("https://plot-twist-unwritten-spell.fly.dev", true),
    ).toEqual(["plot-twist-unwritten-spell.fly.dev"]);
    expect(
      resolvePreviewAllowedHosts("http://127.0.0.1:5173", false),
    ).toBeUndefined();
  });
});

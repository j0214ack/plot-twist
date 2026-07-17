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

  // Spec: Decision 0005 PUB-4, PUB-6 and PUB-7; ADR 0036 LDO-SAVE-001.
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
      playerIdentitySecret: "deployment-session-secret",
      accessCode: "shared-quill-code",
      secureCookies: true,
    });
  });

  // Spec: Decision 0005 PUB-5; ADR 0036 LDO-SAVE-001. Local development
  // needs no secret setup, but its player identity must survive a Vite restart.
  it("uses a localhost-only anonymous session in the development server", () => {
    const resolved = resolveDemoAccessOptions({}, { isPreview: false });
    const afterRestart = resolveDemoAccessOptions({}, { isPreview: false });

    expect(resolved.allowedOrigin).toBe("http://127.0.0.1:5173");
    expect(resolved.sessionSecret).toBeTruthy();
    expect(resolved.accessCode).toBeUndefined();
    expect(resolved.secureCookies).toBe(false);
    expect(resolved.playerIdentitySecret).toBe(
      afterRestart.playerIdentitySecret,
    );
    expect(resolved.playerIdentitySecret).toBe(
      "leave-door-open-local-player-identity-v1",
    );
  });

  // Spec: ADR 0019 Decision 7; ADR 0035 LDO-LAT-010.
  it("forces anonymous access for both explicit LDO local browser modes", () => {
    const environment = { DEMO_ACCESS_CODE: "production-demo-code" };

    expect(
      resolveDemoAccessOptions(environment, {
        isPreview: false,
        mode: "ldo-local-codex",
      }).accessCode,
    ).toBeUndefined();
    expect(
      resolveDemoAccessOptions(environment, {
        isPreview: false,
        mode: "ldo-local-openai",
      }).accessCode,
    ).toBeUndefined();
    expect(
      resolveDemoAccessOptions(environment, { isPreview: false }).accessCode,
    ).toBe("production-demo-code");
    expect(
      resolveDemoAccessOptions(
        {
          ...environment,
          ALLOWED_ORIGIN: "https://unwritten-spell.fly.dev",
          DEMO_SESSION_SECRET: "deployment-session-secret",
        },
        { isPreview: true, mode: "ldo-local-codex" },
      ).accessCode,
    ).toBe("production-demo-code");
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

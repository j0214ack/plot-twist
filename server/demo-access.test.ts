import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import {
  createDemoAccessMiddleware,
  demoAccessPlugin,
  type DemoAccessOptions,
  type DemoRequest,
  type DemoResponse,
} from "./demo-access";

const now = Date.UTC(2026, 6, 14, 12, 0, 0);

const options = (overrides: Partial<DemoAccessOptions> = {}): DemoAccessOptions => ({
  allowedOrigin: "https://unwritten-spell.fly.dev",
  sessionSecret: "test-session-secret-with-enough-entropy",
  accessCode: "quill-constellation",
  secureCookies: true,
  sessionTtlMs: 30 * 60 * 1000,
  now: () => now,
  ...overrides,
});

const request = ({
  url,
  body,
  headers = {},
}: {
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}): DemoRequest => {
  const stream = Readable.from(body === undefined ? [] : [JSON.stringify(body)]);
  return Object.assign(stream, {
    method: "POST",
    url,
    headers: {
      origin: "https://unwritten-spell.fly.dev",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
      ...headers,
    },
  }) as unknown as DemoRequest;
};

const response = (): DemoResponse & {
  headers: Map<string, string | string[]>;
  body: string;
} => ({
  statusCode: 200,
  headers: new Map(),
  body: "",
  setHeader(name, value) {
    this.headers.set(name.toLowerCase(), value);
  },
  end(chunk) {
    this.body = chunk ? String(chunk) : "";
  },
});

const run = async (
  middleware: ReturnType<typeof createDemoAccessMiddleware>,
  req: DemoRequest,
) => {
  const res = response();
  const next = vi.fn();
  await middleware(req, res, next);
  return { res, next };
};

const unlock = async (config = options()): Promise<string> => {
  const { res } = await run(
    createDemoAccessMiddleware(config),
    request({ url: "/api/demo-session", body: { accessCode: config.accessCode } }),
  );
  expect(res.statusCode).toBe(200);
  const cookie = res.headers.get("set-cookie");
  expect(typeof cookie).toBe("string");
  return String(cookie).split(";", 1)[0]!;
};

describe("public demo access middleware", () => {
  // Spec: Decision 0005 PUB-1 and PUB-10; the same guard precedes model APIs in dev and preview.
  it("installs the access boundary in both Vite server modes", () => {
    const plugin = demoAccessPlugin(options());
    const devUse = vi.fn();
    const previewUse = vi.fn();

    (plugin.configureServer as (server: { middlewares: { use: typeof devUse } }) => void)({
      middlewares: { use: devUse },
    });
    (plugin.configurePreviewServer as (
      server: { middlewares: { use: typeof previewUse } },
    ) => void)({ middlewares: { use: previewUse } });

    expect(devUse).toHaveBeenCalledOnce();
    expect(previewUse).toHaveBeenCalledOnce();
    expect(devUse.mock.calls[0]?.[0]).toBe(previewUse.mock.calls[0]?.[0]);
  });

  // Spec: Decision 0005 PUB-4 and PUB-6.
  it("exchanges the configured access code for a secure, short-lived signed session", async () => {
    const { res, next } = await run(
      createDemoAccessMiddleware(options()),
      request({ url: "/api/demo-session", body: { accessCode: "quill-constellation" } }),
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ mode: "access-code" });
    expect(res.headers.get("set-cookie")).toEqual(
      expect.stringMatching(
        /^__Host-demo_session=[^;]+; Path=\/; Max-Age=1800; HttpOnly; Secure; SameSite=Strict$/,
      ),
    );
  });

  // Spec: Decision 0005 PUB-4 and PUB-9.
  it("rejects missing and incorrect access codes without issuing a session", async () => {
    const middleware = createDemoAccessMiddleware(options());

    for (const body of [{}, { accessCode: "wrong" }]) {
      const { res, next } = await run(
        middleware,
        request({ url: "/api/demo-session", body }),
      );
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.headers.has("set-cookie")).toBe(false);
    }
  });

  // Spec: Decision 0005 PUB-5; Demo Day removes only the access-code requirement.
  it("issues an anonymous demo session when no access code is configured", async () => {
    const { res } = await run(
      createDemoAccessMiddleware(options({ accessCode: undefined })),
      request({ url: "/api/demo-session", body: {} }),
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ mode: "anonymous" });
    expect(res.headers.get("set-cookie")).toEqual(expect.stringContaining("demo_session="));
  });

  // Spec: Decision 0005 PUB-1, PUB-2, PUB-3 and PUB-9.
  it("allows protected model APIs only for the exact origin and a valid demo session", async () => {
    const middleware = createDemoAccessMiddleware(options());
    const cookie = await unlock();
    const allowed = await run(
      middleware,
      request({ url: "/api/spells", headers: { cookie } }),
    );

    expect(allowed.next).toHaveBeenCalledOnce();

    for (const headers of [
      { cookie, origin: "" },
      { cookie, origin: "https://attacker.example" },
      { cookie, "sec-fetch-site": "cross-site" },
      { origin: "https://unwritten-spell.fly.dev" },
    ]) {
      const blocked = await run(
        middleware,
        request({ url: "/api/spells", headers }),
      );
      expect(blocked.next).not.toHaveBeenCalled();
      expect([401, 403]).toContain(blocked.res.statusCode);
    }
  });

  // Spec: ADR 0018 LDO-WEB-006; every dynamic play-session route spends server model capacity.
  it("protects the Leave the Door Open session API prefix with the same demo session", async () => {
    const middleware = createDemoAccessMiddleware(options());
    const cookie = await unlock();

    for (const url of [
      "/api/leave-the-door-open/sessions",
      "/api/leave-the-door-open/sessions/session-a/input",
    ]) {
      const allowed = await run(
        middleware,
        request({ url, headers: { cookie } }),
      );
      expect(allowed.next).toHaveBeenCalledOnce();

      const blocked = await run(middleware, request({ url }));
      expect(blocked.next).not.toHaveBeenCalled();
      expect(blocked.res.statusCode).toBe(401);
    }
  });

  // Spec: Decision 0005 PUB-6; session integrity and expiry are server-owned.
  it("rejects tampered and expired sessions before protected handlers", async () => {
    const validCookie = await unlock();
    const tamperedCookie = `${validCookie}x`;
    const expiredMiddleware = createDemoAccessMiddleware(
      options({ now: () => now + 31 * 60 * 1000 }),
    );

    for (const [middleware, cookie] of [
      [createDemoAccessMiddleware(options()), tamperedCookie],
      [expiredMiddleware, validCookie],
    ] as const) {
      const { res, next } = await run(
        middleware,
        request({ url: "/api/transcriptions", headers: { cookie } }),
      );
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    }
  });

  // Spec: Decision 0005 only protects the two model-spending routes.
  it("leaves unrelated assets and health routes untouched", async () => {
    const { next } = await run(
      createDemoAccessMiddleware(options()),
      request({ url: "/assets/world.glb", headers: { origin: "" } }),
    );

    expect(next).toHaveBeenCalledOnce();
  });
});

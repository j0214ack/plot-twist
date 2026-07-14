import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

export interface DemoRequest extends AsyncIterable<Uint8Array | string> {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface DemoResponse {
  statusCode: number;
  setHeader(name: string, value: string | string[]): void;
  end(chunk?: string): void;
}

export interface DemoAccessOptions {
  allowedOrigin: string;
  sessionSecret: string;
  accessCode?: string;
  secureCookies: boolean;
  sessionTtlMs?: number;
  now?: () => number;
}

type Next = () => void;
type DemoAccessHandler = (
  request: IncomingMessage,
  response: ServerResponse,
  next: Next,
) => Promise<void>;

const SESSION_PATH = "/api/demo-session";
const PROTECTED_PATHS = new Set(["/api/spells", "/api/transcriptions"]);
const MAX_SESSION_REQUEST_BYTES = 2_048;
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;

const header = (request: DemoRequest, name: string): string => {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
};

const requestPath = (request: DemoRequest): string => request.url?.split("?", 1)[0] ?? "";

const writeJson = (
  response: DemoResponse,
  statusCode: number,
  payload: unknown,
): void => {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(payload));
};

const sameValue = (left: string, right: string): boolean => {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
};

const sign = (value: string, secret: string): string =>
  createHmac("sha256", secret).update(value).digest("base64url");

const createSessionToken = (options: DemoAccessOptions): string => {
  const expiresAt = (options.now?.() ?? Date.now()) +
    (options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS);
  const payload = `v1.${expiresAt}.${randomBytes(18).toString("base64url")}`;
  return `${payload}.${sign(payload, options.sessionSecret)}`;
};

const verifySessionToken = (token: string, options: DemoAccessOptions): boolean => {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const payload = parts.slice(0, 3).join(".");
  const signature = parts[3] ?? "";
  const expected = sign(payload, options.sessionSecret);
  if (!sameValue(signature, expected)) return false;

  const expiresAt = Number(parts[1]);
  return Number.isFinite(expiresAt) && expiresAt > (options.now?.() ?? Date.now());
};

const cookieName = (options: DemoAccessOptions): string =>
  options.secureCookies ? "__Host-demo_session" : "demo_session";

const sessionCookie = (request: DemoRequest, options: DemoAccessOptions): string | undefined => {
  const expectedName = cookieName(options);
  for (const segment of header(request, "cookie").split(";")) {
    const [name, ...valueParts] = segment.trim().split("=");
    if (name === expectedName) return valueParts.join("=");
  }
  return undefined;
};

const hasAllowedBrowserContext = (request: DemoRequest, options: DemoAccessOptions): boolean => {
  if (header(request, "origin") !== options.allowedOrigin) return false;
  const fetchSite = header(request, "sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin";
};

const readJson = async (request: DemoRequest): Promise<unknown> => {
  if (!header(request, "content-type").toLowerCase().startsWith("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_SESSION_REQUEST_BYTES) throw new Error("Session request is too large");
    chunks.push(buffer);
  }

  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
};

const issueSession = async (
  request: DemoRequest,
  response: DemoResponse,
  options: DemoAccessOptions,
): Promise<void> => {
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "Method not allowed" });
    return;
  }
  if (!hasAllowedBrowserContext(request, options)) {
    writeJson(response, 403, { error: "Request origin is not allowed" });
    return;
  }

  try {
    const body = await readJson(request);
    const accessCode =
      typeof body === "object" && body !== null && "accessCode" in body
        ? String(body.accessCode)
        : "";
    if (options.accessCode && !sameValue(accessCode, options.accessCode)) {
      writeJson(response, 401, { error: "Access code is required" });
      return;
    }

    const maxAge = Math.floor((options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS) / 1000);
    const attributes = [
      `${cookieName(options)}=${createSessionToken(options)}`,
      "Path=/",
      `Max-Age=${maxAge}`,
      "HttpOnly",
      ...(options.secureCookies ? ["Secure"] : []),
      "SameSite=Strict",
    ];
    response.setHeader("set-cookie", attributes.join("; "));
    writeJson(response, 200, {
      mode: options.accessCode ? "access-code" : "anonymous",
    });
  } catch (error) {
    writeJson(response, 400, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const createDemoAccessMiddleware = (options: DemoAccessOptions) => {
  if (!options.allowedOrigin) throw new Error("ALLOWED_ORIGIN is required");
  if (!options.sessionSecret) throw new Error("DEMO_SESSION_SECRET is required");

  return async (
    request: DemoRequest,
    response: DemoResponse,
    next: Next,
  ): Promise<void> => {
    const path = requestPath(request);
    if (path === SESSION_PATH) {
      await issueSession(request, response, options);
      return;
    }
    if (!PROTECTED_PATHS.has(path)) {
      next();
      return;
    }
    if (!hasAllowedBrowserContext(request, options)) {
      writeJson(response, 403, { error: "Request origin is not allowed" });
      return;
    }

    const token = sessionCookie(request, options);
    if (!token || !verifySessionToken(token, options)) {
      writeJson(response, 401, { error: "A valid demo session is required" });
      return;
    }
    next();
  };
};

export const demoAccessPlugin = (options: DemoAccessOptions): Plugin => {
  const middleware = createDemoAccessMiddleware(options);
  const handler: DemoAccessHandler = (
    request: IncomingMessage,
    response: ServerResponse,
    next: Next,
  ): Promise<void> =>
    middleware(
      request as unknown as DemoRequest,
      response as unknown as DemoResponse,
      next,
    );
  const install = (middlewares: { use(handler: DemoAccessHandler): void }): void => {
    middlewares.use(handler);
  };

  return {
    name: "unwritten-spell-demo-access",
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    },
  };
};

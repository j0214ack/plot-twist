import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

export interface LeaveDoorOpenApiRequest extends AsyncIterable<Uint8Array | string> {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface LeaveDoorOpenApiResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk?: string): void;
}

export interface LeaveDoorOpenWebSession {
  start(): Promise<string>;
  handleInput(input: string): Promise<{ ended: boolean; screen: string }>;
}

export type LeaveDoorOpenWebSessionFactory = (sessionId: string) =>
  | LeaveDoorOpenWebSession
  | Promise<LeaveDoorOpenWebSession>;

export type LeaveDoorOpenWebResult = {
  sessionId: string;
  ended: boolean;
  screen: string;
};

type StoredSession = {
  session: LeaveDoorOpenWebSession;
  touchedAt: number;
  tail: Promise<void>;
};

type LeaveDoorOpenSessionServiceOptions = {
  createSessionId?: () => string;
  now?: () => number;
  sessionTtlMs?: number;
};

const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1_000;

export class LeaveDoorOpenSessionService {
  readonly #sessions = new Map<string, StoredSession>();
  readonly #createSessionId: () => string;
  readonly #now: () => number;
  readonly #sessionTtlMs: number;

  constructor(
    private readonly createSession: LeaveDoorOpenWebSessionFactory,
    options: LeaveDoorOpenSessionServiceOptions = {},
  ) {
    this.#createSessionId = options.createSessionId ?? randomUUID;
    this.#now = options.now ?? Date.now;
    this.#sessionTtlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
  }

  async startSession(): Promise<LeaveDoorOpenWebResult> {
    this.#pruneExpired();
    const sessionId = this.#createSessionId();
    const session = await this.createSession(sessionId);
    const screen = await session.start();
    this.#sessions.set(sessionId, {
      session,
      touchedAt: this.#now(),
      tail: Promise.resolve(),
    });
    return { sessionId, ended: false, screen };
  }

  async submitInput(
    sessionId: string,
    input: string,
  ): Promise<LeaveDoorOpenWebResult> {
    this.#pruneExpired();
    const stored = this.#sessions.get(sessionId);
    if (stored === undefined) {
      throw new LeaveDoorOpenSessionNotFoundError();
    }
    stored.touchedAt = this.#now();
    const resultPromise = stored.tail.then(() => stored.session.handleInput(input));
    stored.tail = resultPromise.then(
      () => undefined,
      () => undefined,
    );
    const result = await resultPromise;
    stored.touchedAt = this.#now();
    if (result.ended) this.#sessions.delete(sessionId);
    return { sessionId, ...result };
  }

  #pruneExpired(): void {
    const now = this.#now();
    for (const [sessionId, stored] of this.#sessions) {
      if (now - stored.touchedAt > this.#sessionTtlMs) {
        this.#sessions.delete(sessionId);
      }
    }
  }
}

export class LeaveDoorOpenSessionNotFoundError extends Error {
  constructor() {
    super("This playtest session is no longer available. Start a new game.");
    this.name = "LeaveDoorOpenSessionNotFoundError";
  }
}

const START_PATH = "/api/leave-the-door-open/sessions";
const INPUT_PATH =
  /^\/api\/leave-the-door-open\/sessions\/([A-Za-z0-9._-]{1,100})\/input$/;
const MAX_REQUEST_BYTES = 4_096;
const MAX_INPUT_CHARACTERS = 500;

type Next = () => void;

const writeJson = (
  response: LeaveDoorOpenApiResponse,
  statusCode: number,
  payload: unknown,
): void => {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(payload));
};

const readJson = async (request: LeaveDoorOpenApiRequest): Promise<unknown> => {
  const contentType = request.headers["content-type"];
  const normalized = Array.isArray(contentType) ? contentType[0] : contentType;
  if (!normalized?.toLowerCase().startsWith("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_REQUEST_BYTES) throw new Error("Request is too large");
    chunks.push(buffer);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
};

const parseInput = (payload: unknown): string => {
  const input =
    typeof payload === "object" && payload !== null && "input" in payload
      ? (payload as { input?: unknown }).input
      : undefined;
  if (
    typeof input !== "string" ||
    input.trim().length === 0 ||
    input.length > MAX_INPUT_CHARACTERS
  ) {
    throw new Error("Input must contain between 1 and 500 characters");
  }
  return input;
};

export const createLeaveDoorOpenApiMiddleware = (
  service: LeaveDoorOpenSessionService,
) =>
  async (
    request: LeaveDoorOpenApiRequest,
    response: LeaveDoorOpenApiResponse,
    next: Next,
  ): Promise<void> => {
    const path = request.url?.split("?", 1)[0] ?? "";
    const inputMatch = INPUT_PATH.exec(path);
    if (path !== START_PATH && inputMatch === null) {
      next();
      return;
    }
    if (request.method !== "POST") {
      writeJson(response, 405, { error: "Method not allowed" });
      return;
    }

    try {
      const payload = await readJson(request);
      if (path === START_PATH) {
        writeJson(response, 201, await service.startSession());
        return;
      }
      const sessionId = inputMatch?.[1];
      if (sessionId === undefined) throw new LeaveDoorOpenSessionNotFoundError();
      writeJson(
        response,
        200,
        await service.submitInput(sessionId, parseInput(payload)),
      );
    } catch (error) {
      const statusCode =
        error instanceof LeaveDoorOpenSessionNotFoundError
          ? 404
          : error instanceof SyntaxError ||
              (error instanceof Error &&
                (error.message.startsWith("Content-Type") ||
                  error.message.startsWith("Request") ||
                  error.message.startsWith("Input")))
            ? 400
            : 503;
      writeJson(response, statusCode, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

export const leaveDoorOpenApiPlugin = (
  service: LeaveDoorOpenSessionService,
): Plugin => {
  const middleware = createLeaveDoorOpenApiMiddleware(service);
  type Handler = (
    request: IncomingMessage,
    response: ServerResponse,
    next: Next,
  ) => Promise<void>;
  const handler: Handler = (
    request: IncomingMessage,
    response: ServerResponse,
    next: Next,
  ): Promise<void> =>
    middleware(
      request as unknown as LeaveDoorOpenApiRequest,
      response as unknown as LeaveDoorOpenApiResponse,
      next,
    );
  const install = (middlewares: { use(handler: Handler): void }): void => {
    middlewares.use(handler);
  };
  return {
    name: "leave-door-open-api",
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    },
  };
};

import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import {
  isGameLocale,
  type GameLocale,
} from "../pocs/leave-the-door-open/src/localization";
import type { GameControllerCheckpoint } from "../pocs/leave-the-door-open/src/controller";
import type { TerminalPlaySessionCheckpoint } from "../pocs/leave-the-door-open/src/terminal-play-session";
import type { LeaveDoorOpenPersistence } from "./leave-door-open-persistence";

export interface LeaveDoorOpenApiRequest extends AsyncIterable<Uint8Array | string> {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  playerId?: string;
}

export interface LeaveDoorOpenApiResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk?: string): void;
}

export interface LeaveDoorOpenWebSession {
  start(): Promise<string>;
  handleInput(input: string): Promise<{
    ended: boolean;
    advancePending: boolean;
    dialogueResolutionPending: boolean;
    screen: string;
  }>;
  resolveDialogue(): Promise<{
    ended: boolean;
    advancePending: boolean;
    dialogueResolutionPending: boolean;
    screen: string;
  }>;
  advanceTurn(): Promise<{
    ended: boolean;
    advancePending: boolean;
    dialogueResolutionPending: boolean;
    screen: string;
  }>;
  checkpoint(): LeaveDoorOpenWebCheckpoint | null;
}

export type LeaveDoorOpenWebCheckpoint = {
  schemaVersion: 1;
  controller: GameControllerCheckpoint;
  terminal: TerminalPlaySessionCheckpoint;
  latestScreen: string;
};

export type LeaveDoorOpenWebSessionFactory = (
  sessionId: string,
  locale: GameLocale,
  checkpoint?: LeaveDoorOpenWebCheckpoint,
  playerId?: string,
) =>
  | LeaveDoorOpenWebSession
  | Promise<LeaveDoorOpenWebSession>;

export type LeaveDoorOpenWebResult = {
  sessionId: string;
  locale: GameLocale;
  ended: boolean;
  advancePending: boolean;
  dialogueResolutionPending: boolean;
  screen: string;
};

type StoredSession = {
  session: LeaveDoorOpenWebSession;
  playerId: string;
  locale: GameLocale;
  touchedAt: number;
  tail: Promise<void>;
  lastResult: LeaveDoorOpenWebResult;
};

type LeaveDoorOpenSessionServiceOptions = {
  createSessionId?: () => string;
  now?: () => number;
  sessionTtlMs?: number;
  persistence?: LeaveDoorOpenPersistence;
};

const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1_000;

export class LeaveDoorOpenSessionService {
  readonly #sessions = new Map<string, StoredSession>();
  readonly #createSessionId: () => string;
  readonly #now: () => number;
  readonly #sessionTtlMs: number;
  readonly #persistence: LeaveDoorOpenPersistence | undefined;
  readonly #activeSessionIds = new Map<string, string>();
  readonly #pendingStarts = new Map<string, Promise<LeaveDoorOpenWebResult>>();

  constructor(
    private readonly createSession: LeaveDoorOpenWebSessionFactory,
    options: LeaveDoorOpenSessionServiceOptions = {},
  ) {
    this.#createSessionId = options.createSessionId ?? randomUUID;
    this.#now = options.now ?? Date.now;
    this.#sessionTtlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
    this.#persistence = options.persistence;
  }

  async startSession(
    playerId: string,
    locale: GameLocale = "en",
    reset = false,
  ): Promise<LeaveDoorOpenWebResult> {
    this.#pruneExpired();
    const playerKey = this.#playerKey(playerId, locale);
    const pending = this.#pendingStarts.get(playerKey);
    if (pending !== undefined) return pending;

    const start = this.#startSession(playerId, locale, reset, playerKey);
    this.#pendingStarts.set(playerKey, start);
    try {
      return await start;
    } finally {
      if (this.#pendingStarts.get(playerKey) === start) {
        this.#pendingStarts.delete(playerKey);
      }
    }
  }

  async #startSession(
    playerId: string,
    locale: GameLocale,
    reset: boolean,
    playerKey: string,
  ): Promise<LeaveDoorOpenWebResult> {
    const activeSessionId = this.#activeSessionIds.get(playerKey);
    if (reset) {
      if (activeSessionId !== undefined) this.#sessions.delete(activeSessionId);
      this.#activeSessionIds.delete(playerKey);
      await this.#persistence?.remove(playerId, locale);
    } else if (activeSessionId !== undefined) {
      const active = this.#sessions.get(activeSessionId);
      if (active !== undefined) {
        await active.tail;
        active.touchedAt = this.#now();
        return structuredClone(active.lastResult);
      }
      this.#activeSessionIds.delete(playerKey);
    }

    const saved = reset
      ? null
      : (await this.#persistence?.load(playerId, locale)) ?? null;
    const sessionId = this.#createSessionId();
    const session = await this.createSession(
      sessionId,
      locale,
      saved?.checkpoint,
      playerId,
    );
    const screen = await session.start();
    const result: LeaveDoorOpenWebResult = {
      sessionId,
      locale,
      ended: saved?.checkpoint.terminal.ended ?? false,
      advancePending: false,
      dialogueResolutionPending: false,
      screen,
    };
    const stored: StoredSession = {
      session,
      playerId,
      locale,
      touchedAt: this.#now(),
      tail: Promise.resolve(),
      lastResult: result,
    };
    this.#sessions.set(sessionId, stored);
    this.#activeSessionIds.set(playerKey, sessionId);
    await this.#persist(sessionId, stored);
    return structuredClone(result);
  }

  async submitInput(
    playerId: string,
    sessionId: string,
    input: string,
  ): Promise<LeaveDoorOpenWebResult> {
    return this.#runSessionOperation(playerId, sessionId, (session) =>
      session.handleInput(input),
    );
  }

  async advanceTurn(
    playerId: string,
    sessionId: string,
  ): Promise<LeaveDoorOpenWebResult> {
    return this.#runSessionOperation(playerId, sessionId, (session) =>
      session.advanceTurn(),
    );
  }

  async resolveDialogue(
    playerId: string,
    sessionId: string,
  ): Promise<LeaveDoorOpenWebResult> {
    return this.#runSessionOperation(playerId, sessionId, (session) =>
      session.resolveDialogue(),
    );
  }

  async #runSessionOperation(
    playerId: string,
    sessionId: string,
    operation: (
      session: LeaveDoorOpenWebSession,
    ) => Promise<Omit<LeaveDoorOpenWebResult, "sessionId" | "locale">>,
  ): Promise<LeaveDoorOpenWebResult> {
    this.#pruneExpired();
    const stored = this.#sessions.get(sessionId);
    if (stored === undefined || stored.playerId !== playerId) {
      throw new LeaveDoorOpenSessionNotFoundError();
    }
    stored.touchedAt = this.#now();
    const resultPromise = stored.tail.then(async () => {
      const result = await operation(stored.session);
      stored.touchedAt = this.#now();
      stored.lastResult = { sessionId, locale: stored.locale, ...result };
      await this.#persist(sessionId, stored);
      return structuredClone(stored.lastResult);
    });
    stored.tail = resultPromise.then(
      () => undefined,
      () => undefined,
    );
    return resultPromise;
  }

  async #persist(sessionId: string, stored: StoredSession): Promise<void> {
    if (this.#persistence === undefined) return;
    const checkpoint = stored.session.checkpoint();
    if (checkpoint === null) return;
    await this.#persistence.save(stored.playerId, stored.locale, {
      schemaVersion: 1,
      sourceSessionId: sessionId,
      locale: stored.locale,
      savedAt: new Date(this.#now()).toISOString(),
      checkpoint,
    });
  }

  #playerKey(playerId: string, locale: GameLocale): string {
    return `${playerId}\0${locale}`;
  }

  #pruneExpired(): void {
    const now = this.#now();
    for (const [sessionId, stored] of this.#sessions) {
      if (now - stored.touchedAt > this.#sessionTtlMs) {
        this.#sessions.delete(sessionId);
        const playerKey = this.#playerKey(stored.playerId, stored.locale);
        if (this.#activeSessionIds.get(playerKey) === sessionId) {
          this.#activeSessionIds.delete(playerKey);
        }
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
const ADVANCE_PATH =
  /^\/api\/leave-the-door-open\/sessions\/([A-Za-z0-9._-]{1,100})\/advance$/;
const RESOLVE_DIALOGUE_PATH =
  /^\/api\/leave-the-door-open\/sessions\/([A-Za-z0-9._-]{1,100})\/resolve-dialogue$/;
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

const parseLocale = (payload: unknown): GameLocale => {
  const locale =
    typeof payload === "object" && payload !== null && "locale" in payload
      ? (payload as { locale?: unknown }).locale
      : undefined;
  if (locale === undefined) return "zh-TW";
  if (!isGameLocale(locale)) throw new Error("Unsupported locale");
  return locale;
};

const parseReset = (payload: unknown): boolean => {
  const reset =
    typeof payload === "object" && payload !== null && "reset" in payload
      ? (payload as { reset?: unknown }).reset
      : undefined;
  if (reset === undefined) return false;
  if (typeof reset !== "boolean") throw new Error("Reset must be a boolean");
  return reset;
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
    const advanceMatch = ADVANCE_PATH.exec(path);
    const resolveDialogueMatch = RESOLVE_DIALOGUE_PATH.exec(path);
    if (
      path !== START_PATH &&
      inputMatch === null &&
      advanceMatch === null &&
      resolveDialogueMatch === null
    ) {
      next();
      return;
    }
    if (request.method !== "POST") {
      writeJson(response, 405, { error: "Method not allowed" });
      return;
    }
    if (request.playerId === undefined) {
      writeJson(response, 401, { error: "Player identity is required" });
      return;
    }

    try {
      const payload = await readJson(request);
      if (path === START_PATH) {
        writeJson(
          response,
          201,
          await service.startSession(
            request.playerId,
            parseLocale(payload),
            parseReset(payload),
          ),
        );
        return;
      }
      const sessionId =
        inputMatch?.[1] ?? advanceMatch?.[1] ?? resolveDialogueMatch?.[1];
      if (sessionId === undefined) throw new LeaveDoorOpenSessionNotFoundError();
      if (resolveDialogueMatch !== null) {
        writeJson(
          response,
          200,
          await service.resolveDialogue(request.playerId, sessionId),
        );
        return;
      }
      if (advanceMatch !== null) {
        writeJson(
          response,
          200,
          await service.advanceTurn(request.playerId, sessionId),
        );
        return;
      }
      writeJson(
        response,
        200,
        await service.submitInput(request.playerId, sessionId, parseInput(payload)),
      );
    } catch (error) {
      const statusCode =
        error instanceof LeaveDoorOpenSessionNotFoundError
          ? 404
          : error instanceof SyntaxError ||
              (error instanceof Error &&
                (error.message.startsWith("Content-Type") ||
                  error.message.startsWith("Request") ||
                  error.message.startsWith("Input") ||
                  error.message.startsWith("Reset") ||
                  error.message.startsWith("Unsupported locale")))
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

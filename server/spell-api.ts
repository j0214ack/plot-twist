import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import type { Plugin } from "vite";
import type { SpellBundle, SpellCompileRequest } from "../src/generative/types";

const Vec3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });
const SpellCompileRequestSchema = z.object({
  utterance: z.string().trim().min(1).max(500),
  focusedEntityId: z.string().min(1).optional(),
  scene: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string(),
        tags: z.array(z.string()),
        affordances: z.array(z.string()),
        position: Vec3Schema,
      }),
    )
    .max(500),
  recentArtifacts: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string(),
        tags: z.array(z.string()),
        entityIds: z.array(z.string()),
        effectIds: z.array(z.string()),
        createdAt: z.number(),
      }),
    )
    .max(100),
});

export interface SpellCompileService {
  compile(request: SpellCompileRequest): Promise<SpellBundle>;
}

export interface SpellCompileEvent {
  event: "spell.compile";
  version: 1;
  timestamp: string;
  utterance: string;
  focusedEntityId?: string;
  outcome: "succeeded" | "failed";
  durationMs: number;
  moduleCount?: number;
  error?: string;
}

export interface SpellEventSink {
  record(event: SpellCompileEvent): void;
}

export interface SpellObservabilityOptions {
  events: SpellEventSink;
  now?: () => number;
}

export const createJsonConsoleSpellEventSink = (
  writeLine: (line: string) => void = (line) => console.info(line),
): SpellEventSink => ({
  record(event) {
    writeLine(JSON.stringify(event));
  },
});

const recordBestEffort = (
  sink: SpellEventSink | undefined,
  event: SpellCompileEvent,
): void => {
  try {
    sink?.record(event);
  } catch {
    // Playtest observability must never change the result of a spell request.
  }
};

export const compileSpellPayload = async (
  payload: unknown,
  compiler: SpellCompileService,
  observability?: SpellObservabilityOptions,
): Promise<SpellBundle> => {
  const parsed = SpellCompileRequestSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid spell request: ${z.prettifyError(parsed.error)}`);
  }

  const now = observability?.now ?? Date.now;
  const startedAt = now();
  try {
    const bundle = await compiler.compile(parsed.data);
    const completedAt = now();
    recordBestEffort(observability?.events, {
      event: "spell.compile",
      version: 1,
      timestamp: new Date(completedAt).toISOString(),
      utterance: parsed.data.utterance,
      ...(parsed.data.focusedEntityId
        ? { focusedEntityId: parsed.data.focusedEntityId }
        : {}),
      outcome: "succeeded",
      durationMs: Math.max(0, completedAt - startedAt),
      moduleCount: bundle.modules.length,
    });
    return bundle;
  } catch (error) {
    const completedAt = now();
    recordBestEffort(observability?.events, {
      event: "spell.compile",
      version: 1,
      timestamp: new Date(completedAt).toISOString(),
      utterance: parsed.data.utterance,
      ...(parsed.data.focusedEntityId
        ? { focusedEntityId: parsed.data.focusedEntityId }
        : {}),
      outcome: "failed",
      durationMs: Math.max(0, completedAt - startedAt),
      error: (error instanceof Error ? error.message : String(error)).slice(0, 500),
    });
    throw error;
  }
};

const readJsonBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let bytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 1_000_000) throw new Error("Spell request is too large");
    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const writeJson = (response: ServerResponse, status: number, payload: unknown): void => {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

const createMiddleware = (
  compiler: SpellCompileService,
  observability: SpellObservabilityOptions,
) =>
  async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (request.method !== "POST") {
      writeJson(response, 405, { error: "Method not allowed" });
      return;
    }

    try {
      const payload = await readJsonBody(request);
      const bundle = await compileSpellPayload(payload, compiler, observability);
      writeJson(response, 200, { bundle });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.startsWith("Invalid spell request") ? 400 : 422;
      writeJson(response, status, { error: message });
    }
  };

export const spellApiPlugin = (
  compiler: SpellCompileService,
  events: SpellEventSink = createJsonConsoleSpellEventSink(),
): Plugin => {
  const observability = { events };
  const install = (middlewares: {
    use(route: string, handler: ReturnType<typeof createMiddleware>): void;
  }) => middlewares.use("/api/spells", createMiddleware(compiler, observability));

  return {
    name: "unwritten-spell-api",
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    },
  };
};

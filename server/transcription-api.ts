import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const MAX_AUDIO_BYTES = 5_000_000;
const supportedAudioTypes = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
]);

export interface AudioTranscriptionRequest {
  data: Buffer;
  mimeType: string;
}

export interface TranscriptionService {
  transcribe(request: AudioTranscriptionRequest): Promise<string>;
}

const normalizedMimeType = (contentType: string): string =>
  contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";

export const transcribeAudioPayload = async (
  data: Buffer,
  contentType: string,
  service: TranscriptionService,
): Promise<string> => {
  if (data.length === 0) throw new Error("Audio recording is empty");
  if (data.length > MAX_AUDIO_BYTES) throw new Error("Audio recording is too large");

  const mimeType = normalizedMimeType(contentType);
  if (!supportedAudioTypes.has(mimeType)) {
    throw new Error(`Unsupported audio type: ${contentType || "missing"}`);
  }

  const text = (await service.transcribe({ data, mimeType })).trim();
  if (!text) throw new Error("Transcription returned no speech");
  return text;
};

const readAudioBody = async (request: IncomingMessage): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  let bytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_AUDIO_BYTES) throw new Error("Audio recording is too large");
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
};

const writeJson = (response: ServerResponse, status: number, payload: unknown): void => {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

const createMiddleware = (service: TranscriptionService) =>
  async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (request.method !== "POST") {
      writeJson(response, 405, { error: "Method not allowed" });
      return;
    }

    try {
      const data = await readAudioBody(request);
      const text = await transcribeAudioPayload(
        data,
        typeof request.headers["content-type"] === "string"
          ? request.headers["content-type"]
          : "",
        service,
      );
      writeJson(response, 200, { text });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const invalidInput =
        message.includes("recording") ||
        message.startsWith("Unsupported audio type") ||
        message.includes("no speech");
      writeJson(response, invalidInput ? 400 : 422, { error: message });
    }
  };

export const transcriptionApiPlugin = (service: TranscriptionService): Plugin => {
  const install = (middlewares: {
    use(route: string, handler: ReturnType<typeof createMiddleware>): void;
  }) => middlewares.use("/api/transcriptions", createMiddleware(service));

  return {
    name: "unwritten-spell-transcription-api",
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    },
  };
};

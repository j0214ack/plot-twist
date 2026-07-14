import OpenAI, { toFile } from "openai";
import type { AudioTranscriptionRequest, TranscriptionService } from "./transcription-api";

interface OpenAiAudioClient {
  audio: {
    transcriptions: {
      create(request: unknown): Promise<{ text: string }>;
    };
  };
}

export interface OpenAiTranscriptionOptions {
  model: string;
}

const extensionByMimeType: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

const SPELL_VOCABULARY_PROMPT =
  "這是一段繁體中文遊戲咒語，可能提到守衛、鑰匙、門鎖、傳送門、火焰、牆壁、房間、法力與傷害。";

export class OpenAiTranscriptionService implements TranscriptionService {
  constructor(
    private readonly client: OpenAiAudioClient,
    private readonly options: OpenAiTranscriptionOptions,
  ) {}

  async transcribe(request: AudioTranscriptionRequest): Promise<string> {
    const extension = extensionByMimeType[request.mimeType] ?? "webm";
    const file = await toFile(request.data, `incantation.${extension}`, {
      type: request.mimeType,
    });
    const result = await this.client.audio.transcriptions.create({
      file,
      model: this.options.model,
      language: "zh",
      prompt: SPELL_VOCABULARY_PROMPT,
    });

    return result.text.trim();
  }
}

export const createOpenAiTranscriptionService = (options: {
  apiKey?: string;
  model?: string;
}): OpenAiTranscriptionService => {
  const client = new OpenAI({ apiKey: options.apiKey });
  return new OpenAiTranscriptionService(client as unknown as OpenAiAudioClient, {
    model: options.model || "gpt-4o-mini-transcribe",
  });
};

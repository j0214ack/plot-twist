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

export const DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-transcribe";

const extensionByMimeType: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

const SPELL_VOCABULARY_PROMPT =
  "請使用繁體中文。這是一段玩家說出的遊戲咒語，例如：「放隕石砸下來，對守衛造成傷害。」「生成一道牆把守衛困住。」「讓鑰匙飛向門鎖。」常見詞彙有傳送門、火焰、房間、法力、隕石、守衛、傷害。";

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
    model: options.model || DEFAULT_TRANSCRIPTION_MODEL,
  });
};

export interface TranscriptionClient {
  transcribe(audio: Blob): Promise<string>;
}

interface TranscriptionApiResponse {
  text?: string;
  error?: string;
}

export class HttpTranscriptionClient implements TranscriptionClient {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async transcribe(audio: Blob): Promise<string> {
    const response = await this.fetcher.call(globalThis, "/api/transcriptions", {
      method: "POST",
      headers: { "content-type": audio.type || "audio/webm" },
      body: audio,
    });
    const payload = (await response.json()) as TranscriptionApiResponse;

    if (!response.ok) {
      throw new Error(payload.error || `Transcription failed with HTTP ${response.status}`);
    }

    const text = payload.text?.trim();
    if (!text) throw new Error("Transcription returned no speech");
    return text;
  }
}

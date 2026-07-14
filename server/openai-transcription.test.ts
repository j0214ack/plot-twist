import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TRANSCRIPTION_MODEL,
  OpenAiTranscriptionService,
} from "./openai-transcription";

describe("OpenAiTranscriptionService", () => {
  // Spec: Decision 0004 and the OpenAI Speech-to-text guide.
  it("uploads the recording with the PoC model, language, and spell vocabulary context", async () => {
    const create = vi.fn(async () => ({ text: "讓鑰匙飛向門鎖" }));
    const service = new OpenAiTranscriptionService(
      { audio: { transcriptions: { create } } },
      { model: "gpt-4o-mini-transcribe" },
    );

    await expect(
      service.transcribe({ data: Buffer.from("webm"), mimeType: "audio/webm" }),
    ).resolves.toBe("讓鑰匙飛向門鎖");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini-transcribe",
        language: "zh",
        prompt: expect.stringContaining("守衛"),
        file: expect.objectContaining({ name: "incantation.webm" }),
      }),
    );
    const request = create.mock.calls[0]?.[0] as { prompt?: string };
    expect(request.prompt).toContain("隕石");
    expect(request.prompt).toContain("砸下來");
    expect(request.prompt).toContain("繁體中文");
  });

  // Spec: Decision 0004; playable demo favors transcription accuracy over the mini price tier.
  it("defaults the playable demo to the higher-quality transcription model", () => {
    expect(DEFAULT_TRANSCRIPTION_MODEL).toBe("gpt-4o-transcribe");
  });
});

import { describe, expect, it, vi } from "vitest";
import { HttpTranscriptionClient } from "./http-transcription-client";

describe("HttpTranscriptionClient", () => {
  // Spec: Decision 0004; browser sends audio to the same-origin server without an API key.
  it("posts a recorded WebM utterance and returns the transcript", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ text: "讓鑰匙飛向門鎖" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new HttpTranscriptionClient(fetcher);
    const audio = new Blob(["audio"], { type: "audio/webm" });

    await expect(client.transcribe(audio)).resolves.toBe("讓鑰匙飛向門鎖");
    expect(fetcher).toHaveBeenCalledWith("/api/transcriptions", {
      method: "POST",
      headers: { "content-type": "audio/webm" },
      body: audio,
    });
  });

  it("surfaces transcription failures instead of submitting an empty spell", async () => {
    const client = new HttpTranscriptionClient(
      async () => new Response(JSON.stringify({ error: "no speech" }), { status: 422 }),
    );

    await expect(client.transcribe(new Blob(["audio"], { type: "audio/webm" }))).rejects.toThrow(
      "no speech",
    );
  });
});

import { describe, expect, it, vi } from "vitest";
import { transcribeAudioPayload } from "./transcription-api";

describe("transcribeAudioPayload", () => {
  // Spec: Decision 0004; server validates the bounded audio transport before model spend.
  it("passes a supported non-empty recording to the transcription service", async () => {
    const transcribe = vi.fn(async () => "召喚一道冰牆");
    const audio = Buffer.from("webm-audio");

    await expect(
      transcribeAudioPayload(audio, "audio/webm;codecs=opus", { transcribe }),
    ).resolves.toBe("召喚一道冰牆");
    expect(transcribe).toHaveBeenCalledWith({ data: audio, mimeType: "audio/webm" });
  });

  it("rejects empty, unsupported, and oversized recordings before model spend", async () => {
    const transcribe = vi.fn(async () => "unused");

    await expect(transcribeAudioPayload(Buffer.alloc(0), "audio/webm", { transcribe })).rejects.toThrow(
      "empty",
    );
    await expect(
      transcribeAudioPayload(Buffer.from("audio"), "application/octet-stream", { transcribe }),
    ).rejects.toThrow("Unsupported audio type");
    await expect(
      transcribeAudioPayload(Buffer.alloc(5_000_001), "audio/webm", { transcribe }),
    ).rejects.toThrow("too large");
    expect(transcribe).not.toHaveBeenCalled();
  });
});

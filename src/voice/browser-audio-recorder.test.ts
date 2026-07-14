import { describe, expect, it } from "vitest";
import { assertUsableRecording } from "./browser-audio-recorder";

describe("assertUsableRecording", () => {
  // Spec: Decision 0004; incomplete containers are rejected before transcription.
  it("explains the push-to-talk gesture when recording is too short", () => {
    expect(() =>
      assertUsableRecording(new Blob([new Uint8Array(1_500)], { type: "audio/webm" }), 50),
    ).toThrow("按住");
  });

  it("accepts a non-empty recording held long enough to contain speech", () => {
    expect(() =>
      assertUsableRecording(new Blob([new Uint8Array(4_000)], { type: "audio/webm" }), 800),
    ).not.toThrow();
  });
});

import { describe, expect, it, vi } from "vitest";
import { VoiceCastingController } from "./voice-casting-controller";

describe("VoiceCastingController", () => {
  // Spec: Decision 0004; press/release defines one utterance and submits without confirmation.
  it("records, transcribes, then emits one trimmed utterance", async () => {
    const audio = new Blob(["spell"], { type: "audio/webm" });
    const recorder = {
      start: vi.fn(async () => {}),
      stop: vi.fn(async () => audio),
    };
    const transcriber = { transcribe: vi.fn(async () => "  讓鑰匙飛向門鎖  ") };
    const states: string[] = [];
    const onTranscript = vi.fn();
    const controller = new VoiceCastingController(recorder, transcriber, {
      onStateChange: (state) => states.push(state),
      onTranscript,
    });

    await expect(controller.start()).resolves.toBe(true);
    await expect(controller.stop()).resolves.toBe(true);

    expect(recorder.start).toHaveBeenCalledOnce();
    expect(recorder.stop).toHaveBeenCalledOnce();
    expect(transcriber.transcribe).toHaveBeenCalledWith(audio);
    expect(onTranscript).toHaveBeenCalledWith("讓鑰匙飛向門鎖");
    expect(states).toEqual(["requesting", "recording", "transcribing", "idle"]);
  });

  it("returns to idle and exposes microphone or API errors", async () => {
    const error = new Error("microphone denied");
    const onError = vi.fn();
    const controller = new VoiceCastingController(
      { start: async () => Promise.reject(error), stop: async () => new Blob() },
      { transcribe: async () => "unused" },
      { onError },
    );

    await expect(controller.start()).resolves.toBe(false);
    expect(controller.state).toBe("idle");
    expect(onError).toHaveBeenCalledWith(error);
  });

  // Spec: Decision 0004; an interrupted permission gesture is warm-up, never an empty spell.
  it("discards release while the browser is still granting microphone permission", async () => {
    let grantPermission!: () => void;
    const permission = new Promise<void>((resolve) => (grantPermission = resolve));
    const onTranscript = vi.fn();
    const onError = vi.fn();
    const transcribe = vi.fn(async () => "不該送出");
    const controller = new VoiceCastingController(
      { start: () => permission, stop: async () => new Blob(["spell"], { type: "audio/webm" }) },
      { transcribe },
      { onTranscript, onError },
    );

    const starting = controller.start();
    await Promise.resolve();
    await expect(controller.stop()).resolves.toBe(true);
    grantPermission();
    await starting;

    expect(controller.state).toBe("idle");
    expect(transcribe).not.toHaveBeenCalled();
    expect(onTranscript).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("重新按住") }),
    );
  });
});

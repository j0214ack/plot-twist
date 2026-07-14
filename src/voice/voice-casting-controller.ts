import type { TranscriptionClient } from "./http-transcription-client";

export type VoiceCastingState = "idle" | "requesting" | "recording" | "transcribing";

export interface VoiceRecorder {
  start(): Promise<void>;
  stop(): Promise<Blob>;
}

export interface VoiceCastingControllerOptions {
  onStateChange?: (state: VoiceCastingState) => void;
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error) => void;
}

export class VoiceCastingController {
  private currentState: VoiceCastingState = "idle";
  private stopAfterStart = false;

  constructor(
    private readonly recorder: VoiceRecorder,
    private readonly transcriber: TranscriptionClient,
    private readonly options: VoiceCastingControllerOptions = {},
  ) {}

  get state(): VoiceCastingState {
    return this.currentState;
  }

  get isBusy(): boolean {
    return this.currentState !== "idle";
  }

  async start(): Promise<boolean> {
    if (this.currentState !== "idle") return false;
    this.stopAfterStart = false;
    this.setState("requesting");

    try {
      await this.recorder.start();
      this.setState("recording");
      if (this.stopAfterStart) {
        this.stopAfterStart = false;
        try {
          await this.recorder.stop();
        } catch {
          // The interrupted permission gesture commonly produces an unusable empty recording.
        }
        this.fail(new Error("麥克風已啟用，請重新按住 V 或說話按鈕，說完再放開"));
        return false;
      }
      return true;
    } catch (error) {
      this.fail(error);
      return false;
    }
  }

  async stop(): Promise<boolean> {
    if (this.currentState === "requesting") {
      this.stopAfterStart = true;
      return true;
    }
    if (this.currentState !== "recording") return false;
    this.setState("transcribing");

    try {
      const audio = await this.recorder.stop();
      const transcript = (await this.transcriber.transcribe(audio)).trim();
      if (!transcript) throw new Error("沒有聽到可以施放的咒語");

      this.setState("idle");
      this.options.onTranscript?.(transcript);
      return true;
    } catch (error) {
      this.fail(error);
      return false;
    }
  }

  private setState(state: VoiceCastingState): void {
    this.currentState = state;
    this.options.onStateChange?.(state);
  }

  private fail(error: unknown): void {
    this.stopAfterStart = false;
    this.setState("idle");
    this.options.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

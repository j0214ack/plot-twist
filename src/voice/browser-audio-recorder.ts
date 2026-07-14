import type { VoiceRecorder } from "./voice-casting-controller";

const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
const MINIMUM_RECORDING_MILLISECONDS = 250;
const MINIMUM_RECORDING_BYTES = 512;

const SHORT_RECORDING_MESSAGE =
  "錄音太短：請按住 V 或說話按鈕，說完咒語後再放開";

export const assertUsableRecording = (audio: Blob, durationMilliseconds: number): void => {
  if (
    durationMilliseconds < MINIMUM_RECORDING_MILLISECONDS ||
    audio.size < MINIMUM_RECORDING_BYTES
  ) {
    throw new Error(SHORT_RECORDING_MESSAGE);
  }
};

export class BrowserAudioRecorder implements VoiceRecorder {
  private recorder?: MediaRecorder;
  private stream?: MediaStream;
  private chunks: Blob[] = [];
  private recordingStartedAt?: number;

  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      throw new Error("這個瀏覽器不支援麥克風錄音，請先使用文字輸入");
    }
    if (this.recorder && this.recorder.state !== "inactive") {
      throw new Error("麥克風已經在錄音");
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = preferredMimeTypes.find((candidate) =>
      MediaRecorder.isTypeSupported(candidate),
    );
    this.recorder = mimeType
      ? new MediaRecorder(this.stream, { mimeType })
      : new MediaRecorder(this.stream);
    this.chunks = [];
    this.recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    });
    this.recorder.start();
    this.recordingStartedAt = performance.now();
  }

  async stop(): Promise<Blob> {
    const recorder = this.recorder;
    if (!recorder || recorder.state !== "recording") {
      throw new Error("麥克風目前沒有在錄音");
    }

    return new Promise<Blob>((resolve, reject) => {
      recorder.addEventListener(
        "error",
        () => {
          this.releaseStream();
          reject(new Error("麥克風錄音失敗"));
        },
        { once: true },
      );
      recorder.addEventListener(
        "stop",
        () => {
          const audio = new Blob(this.chunks, { type: recorder.mimeType || "audio/webm" });
          const durationMilliseconds = performance.now() - (this.recordingStartedAt ?? 0);
          this.releaseStream();
          try {
            assertUsableRecording(audio, durationMilliseconds);
            resolve(audio);
          } catch (error) {
            reject(error);
          }
        },
        { once: true },
      );
      recorder.stop();
    });
  }

  private releaseStream(): void {
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.stream = undefined;
    this.recorder = undefined;
    this.chunks = [];
    this.recordingStartedAt = undefined;
  }
}

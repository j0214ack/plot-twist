import type {
  GameControllerSnapshot,
  VerticalSliceGameController,
} from "./controller";
import type { PlaytestSessionRecorder } from "./playtest-session-log";
import type {
  TerminalAdvanceResult,
  TerminalOutput,
  TerminalPlayResult,
  TerminalPlaySession,
} from "./terminal-play-session";

export const createRecordingTerminalOutput = (
  recorder: PlaytestSessionRecorder,
  output: TerminalOutput,
): TerminalOutput =>
  (screen) => {
    recorder.record({
      visibility: "player",
      type: "screen_rendered",
      data: { screen },
    });
    output(screen);
  };

export const createRecordingTerminalErrorObserver = (
  recorder: PlaytestSessionRecorder,
) =>
  (error: unknown): void => {
    recorder.record({
      visibility: "observer",
      type: "interaction_failed",
      data: {
        error:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : { name: "UnknownError", message: String(error) },
      },
    });
  };

type TerminalSession = Pick<
  TerminalPlaySession,
  "start" | "handleInput" | "beginTimeAdvance" | "advanceTurn"
>;
type SnapshotProvider = Pick<VerticalSliceGameController, "snapshot">;

export class RecordingTerminalPlaySession {
  constructor(
    private readonly delegate: TerminalSession,
    private readonly controller: SnapshotProvider,
    private readonly recorder: PlaytestSessionRecorder,
  ) {}

  async start(): Promise<void> {
    await this.delegate.start();
  }

  async handleInput(rawInput: string): Promise<TerminalPlayResult> {
    const inputEvent = this.recorder.record({
      visibility: "player",
      type: "player_input",
      data: { input: rawInput },
    });
    const result = await this.delegate.handleInput(rawInput);
    const controllerSnapshot: GameControllerSnapshot =
      this.controller.snapshot();
    this.recorder.record({
      visibility: "observer",
      type: "input_handled",
      data: {
        inputSequence: inputEvent.sequence,
        result,
        controllerSnapshot,
      },
    });
    return result;
  }

  async beginTimeAdvance(): Promise<TerminalAdvanceResult> {
    const inputEvent = this.recorder.record({
      visibility: "player",
      type: "player_input",
      data: { input: "/resume" },
    });
    const result = await this.delegate.beginTimeAdvance();
    this.recorder.record({
      visibility: "observer",
      type: "input_handled",
      data: {
        inputSequence: inputEvent.sequence,
        result,
        controllerSnapshot: this.controller.snapshot(),
      },
    });
    return result;
  }

  async advanceTurn(): Promise<TerminalAdvanceResult> {
    const result = await this.delegate.advanceTurn();
    this.recorder.record({
      visibility: "observer",
      type: "time_advance_tick_handled",
      data: {
        result,
        controllerSnapshot: this.controller.snapshot(),
      },
    });
    return result;
  }
}

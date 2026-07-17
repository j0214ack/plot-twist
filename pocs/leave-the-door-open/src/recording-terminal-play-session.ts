import type {
  GameControllerSnapshot,
  VerticalSliceGameController,
} from "./controller";
import type { PlaytestSessionRecorder } from "./playtest-session-log";
import type {
  TerminalAdvanceResult,
  TerminalDialogueBeginResult,
  TerminalOutput,
  TerminalPlayResult,
  TerminalPlaySession,
} from "./terminal-play-session";

export const createRecordingTerminalOutput = (
  recorder: PlaytestSessionRecorder,
  output: TerminalOutput,
): TerminalOutput => {
  let lastRecordedScreen: string | null = null;
  return (screen) => {
    if (screen !== lastRecordedScreen) {
      recorder.record({
        visibility: "player",
        type: "screen_rendered",
        data: { screen },
      });
      lastRecordedScreen = screen;
    }
    output(screen);
  };
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
  | "start"
  | "handleInput"
  | "beginInput"
  | "resolveDialogue"
  | "beginTimeAdvance"
  | "advanceTurn"
>;
type SnapshotProvider = Pick<VerticalSliceGameController, "snapshot">;

export class RecordingTerminalPlaySession {
  #pendingDialogueInputSequence: number | null = null;

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

  async beginInput(rawInput: string): Promise<TerminalDialogueBeginResult> {
    const inputEvent = this.recorder.record({
      visibility: "player",
      type: "player_input",
      data: { input: rawInput },
    });
    const result = await this.delegate.beginInput(rawInput);
    this.#pendingDialogueInputSequence = result.dialogueResolutionPending
      ? inputEvent.sequence
      : null;
    this.recorder.record({
      visibility: "observer",
      type: "input_phase_handled",
      data: {
        inputSequence: inputEvent.sequence,
        result,
        controllerSnapshot: this.controller.snapshot(),
      },
    });
    return result;
  }

  async resolveDialogue(): Promise<TerminalPlayResult> {
    const inputSequence = this.#pendingDialogueInputSequence;
    const result = await this.delegate.resolveDialogue();
    this.#pendingDialogueInputSequence = null;
    this.recorder.record({
      visibility: "observer",
      type: "dialogue_resolution_handled",
      data: {
        inputSequence,
        result,
        controllerSnapshot: this.controller.snapshot(),
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
    const before = this.controller.snapshot();
    const result = await this.delegate.advanceTurn();
    const after = this.controller.snapshot();
    this.recorder.record({
      visibility: "observer",
      type: "time_advance_tick_handled",
      data: {
        result,
        stateDelta: {
          fromTime: before.world.time,
          toTime: after.world.time,
          world: {
            weekdayId: after.world.weekdayId,
            chapter: after.world.chapter,
            chapterDay: after.world.chapterDay,
            paused: after.world.paused,
            npcs: after.world.npcs,
            worldFacts: after.world.worldFacts,
            intentions: after.world.intentions,
            completedActions: after.world.completedActions,
            actionProgress: after.world.actionProgress,
            evidence: after.world.evidence,
          },
          interaction: {
            mode: after.interaction.mode,
            selectedNpcId: after.interaction.selectedNpcId,
            availableActionOptionIds:
              after.interaction.availableActionOptionIds,
            conversationStatus: after.interaction.conversationStatus,
            errorMessage: after.interaction.errorMessage,
            actionFeedback: after.interaction.actionFeedback,
          },
          newEvents: after.events.slice(before.events.length),
          newPerformances: after.performances.slice(
            before.performances.length,
          ),
        },
      },
    });
    return result;
  }
}

import { createConversationalVerticalSliceGameController } from "../pocs/leave-the-door-open/src/controller";
import type { StructuredRoleModel } from "../pocs/leave-the-door-open/src/live-protocol";
import { PlaytestSessionRecorder } from "../pocs/leave-the-door-open/src/playtest-session-log";
import { RecordingStructuredRoleModel } from "../pocs/leave-the-door-open/src/recording-structured-role-model";
import {
  createRecordingTerminalErrorObserver,
  createRecordingTerminalOutput,
  RecordingTerminalPlaySession,
} from "../pocs/leave-the-door-open/src/recording-terminal-play-session";
import { StructuredModelConversationPorts } from "../pocs/leave-the-door-open/src/structured-conversation-ports";
import { StructuredModelPerformanceDirector } from "../pocs/leave-the-door-open/src/structured-performance-director";
import { TerminalPlaySession } from "../pocs/leave-the-door-open/src/terminal-play-session";
import type {
  LeaveDoorOpenWebCheckpoint,
  LeaveDoorOpenWebSession,
  LeaveDoorOpenWebSessionFactory,
} from "./leave-door-open-api";

export type LeaveDoorOpenWebRuntimeOptions = {
  model: StructuredRoleModel;
  inputFirewallModel?: StructuredRoleModel;
  prompts: {
    inputFirewall: string;
    persona: string;
    memorySelector: string;
    actionJudge: string;
    performanceDirector?: string;
  };
  generatedPerformance: boolean;
  appendLogLine?: (sessionId: string, line: string) => void;
};

export const createLeaveDoorOpenWebSessionFactory = (
  options: LeaveDoorOpenWebRuntimeOptions,
): LeaveDoorOpenWebSessionFactory =>
  (sessionId, locale = "en", savedCheckpoint): LeaveDoorOpenWebSession => {
    const restoredCheckpoint =
      savedCheckpoint === undefined
        ? undefined
        : validateWebCheckpoint(savedCheckpoint, locale);
    const recorder = new PlaytestSessionRecorder({
      sessionId,
      appendLine:
        (options.appendLogLine === undefined
          ? undefined
          : (line) => options.appendLogLine!(sessionId, line)) ??
        ((line) => {
          console.info(line.trimEnd());
        }),
    });
    recorder.record({
      visibility: "observer",
      type: "session_started",
      data: {
        surface: "web",
        locale,
        generatedPerformance: options.generatedPerformance,
        restored: restoredCheckpoint !== undefined,
      },
    });

    const model = new RecordingStructuredRoleModel(options.model, recorder);
    const inputFirewallModel =
      options.inputFirewallModel === undefined
        ? model
        : new RecordingStructuredRoleModel(
            options.inputFirewallModel,
            recorder,
          );
    const ports = new StructuredModelConversationPorts(
      model,
      {
        inputFirewall: options.prompts.inputFirewall,
        persona: options.prompts.persona,
        memorySelector: options.prompts.memorySelector,
        actionJudge: options.prompts.actionJudge,
      },
      { inputFirewallModel },
    );
    if (options.generatedPerformance && !options.prompts.performanceDirector) {
      throw new Error("Performance Director prompt is required");
    }
    const controller = createConversationalVerticalSliceGameController({
      inputFirewall: ports,
      persona: ports,
      memorySelector: ports,
      actionJudge: ports,
      ...(options.generatedPerformance
        ? {
            performanceDirector: new StructuredModelPerformanceDirector(
              model,
              options.prompts.performanceDirector!,
            ),
          }
        : {}),
    }, {
      locale,
      checkpoint: restoredCheckpoint?.controller,
    });
    let latestScreen = restoredCheckpoint?.latestScreen ?? "";
    const terminalDelegate = new TerminalPlaySession(
      controller,
      createRecordingTerminalOutput(recorder, (screen) => {
        latestScreen = screen;
      }),
      createRecordingTerminalErrorObserver(recorder),
      restoredCheckpoint?.terminal,
    );
    const terminal = new RecordingTerminalPlaySession(
      terminalDelegate,
      controller,
      recorder,
    );

    return {
      async start() {
        if (restoredCheckpoint !== undefined) return latestScreen;
        await terminal.start();
        return latestScreen;
      },
      async handleInput(input) {
        const result =
          input.trim() === "/resume"
            ? {
                ...(await terminal.beginTimeAdvance()),
                dialogueResolutionPending: false,
              }
            : {
                ...(await terminal.beginInput(input)),
                advancePending: false,
              };
        if (result.ended) {
          recorder.record({
            visibility: "observer",
            type: "session_ended",
            data: { surface: "web", controllerSnapshot: controller.snapshot() },
          });
        }
        return { ...result, screen: latestScreen };
      },
      async resolveDialogue() {
        const result = await terminal.resolveDialogue();
        if (result.ended) {
          recorder.record({
            visibility: "observer",
            type: "session_ended",
            data: { surface: "web", controllerSnapshot: controller.snapshot() },
          });
        }
        return {
          ...result,
          advancePending: false,
          dialogueResolutionPending: false,
          screen: latestScreen,
        };
      },
      async advanceTurn() {
        const result = await terminal.advanceTurn();
        if (result.ended) {
          recorder.record({
            visibility: "observer",
            type: "session_ended",
            data: { surface: "web", controllerSnapshot: controller.snapshot() },
          });
        }
        return {
          ...result,
          dialogueResolutionPending: false,
          screen: latestScreen,
        };
      },
      checkpoint() {
        try {
          return {
            schemaVersion: 1,
            controller: controller.checkpoint(),
            terminal: terminalDelegate.checkpoint(),
            latestScreen,
          };
        } catch (error) {
          if (
            error instanceof Error &&
            (error.message.includes("pending interaction") ||
              error.message.includes("during time advance"))
          ) {
            return null;
          }
          throw error;
        }
      },
    };
  };

const validateWebCheckpoint = (
  checkpoint: LeaveDoorOpenWebCheckpoint,
  locale: import("../pocs/leave-the-door-open/src/localization").GameLocale,
): LeaveDoorOpenWebCheckpoint => {
  if (
    checkpoint?.schemaVersion !== 1 ||
    checkpoint.controller?.schemaVersion !== 1 ||
    checkpoint.controller.locale !== locale ||
    checkpoint.terminal?.schemaVersion !== 1 ||
    typeof checkpoint.latestScreen !== "string" ||
    checkpoint.latestScreen.length === 0
  ) {
    throw new Error("Invalid Leave the Door Open Web checkpoint");
  }
  return structuredClone(checkpoint);
};

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
  LeaveDoorOpenWebSession,
  LeaveDoorOpenWebSessionFactory,
} from "./leave-door-open-api";

export type LeaveDoorOpenWebRuntimeOptions = {
  model: StructuredRoleModel;
  prompts: {
    persona: string;
    actionJudge: string;
    performanceDirector?: string;
  };
  generatedPerformance: boolean;
  appendLogLine?: (line: string) => void;
};

export const createLeaveDoorOpenWebSessionFactory = (
  options: LeaveDoorOpenWebRuntimeOptions,
): LeaveDoorOpenWebSessionFactory =>
  (sessionId): LeaveDoorOpenWebSession => {
    const recorder = new PlaytestSessionRecorder({
      sessionId,
      appendLine:
        options.appendLogLine ??
        ((line) => {
          console.info(line.trimEnd());
        }),
    });
    recorder.record({
      visibility: "observer",
      type: "session_started",
      data: {
        surface: "web",
        generatedPerformance: options.generatedPerformance,
      },
    });

    const model = new RecordingStructuredRoleModel(options.model, recorder);
    const ports = new StructuredModelConversationPorts(model, {
      persona: options.prompts.persona,
      actionJudge: options.prompts.actionJudge,
    });
    if (options.generatedPerformance && !options.prompts.performanceDirector) {
      throw new Error("Performance Director prompt is required");
    }
    const controller = createConversationalVerticalSliceGameController({
      persona: ports,
      actionJudge: ports,
      ...(options.generatedPerformance
        ? {
            performanceDirector: new StructuredModelPerformanceDirector(
              model,
              options.prompts.performanceDirector!,
            ),
          }
        : {}),
    });
    let latestScreen = "";
    const terminal = new RecordingTerminalPlaySession(
      new TerminalPlaySession(
        controller,
        createRecordingTerminalOutput(recorder, (screen) => {
          latestScreen = screen;
        }),
        createRecordingTerminalErrorObserver(recorder),
      ),
      controller,
      recorder,
    );

    return {
      async start() {
        await terminal.start();
        return latestScreen;
      },
      async handleInput(input) {
        const result = await terminal.handleInput(input);
        if (result.ended) {
          recorder.record({
            visibility: "observer",
            type: "session_ended",
            data: { surface: "web", controllerSnapshot: controller.snapshot() },
          });
        }
        return { ...result, screen: latestScreen };
      },
    };
  };

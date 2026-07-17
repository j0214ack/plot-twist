import type {
  StructuredRoleCall,
  StructuredRoleModel,
  StructuredRoleResult,
} from "./live-protocol";
import type { PlaytestSessionRecorder } from "./playtest-session-log";

export class RecordingStructuredRoleModel implements StructuredRoleModel {
  constructor(
    private readonly delegate: StructuredRoleModel,
    private readonly recorder: PlaytestSessionRecorder,
  ) {}

  async call(request: StructuredRoleCall): Promise<StructuredRoleResult> {
    const started = this.recorder.record({
      visibility: "observer",
      type: "model_call_started",
      data: {
        role: request.role,
        instructions: request.instructions,
        input: request.input,
        schemaName: request.schemaName,
      },
    });
    try {
      const result = await this.delegate.call(request);
      this.recorder.record({
        visibility: "observer",
        type: "model_call_completed",
        data: {
          requestSequence: started.sequence,
          role: request.role,
          parsed: result.parsed,
          latencyMs: result.latencyMs,
          usage: result.usage,
        },
      });
      return result;
    } catch (error) {
      this.recorder.record({
        visibility: "observer",
        type: "model_call_failed",
        data: {
          requestSequence: started.sequence,
          role: request.role,
          error:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : { name: "UnknownError", message: String(error) },
        },
      });
      throw error;
    }
  }
}

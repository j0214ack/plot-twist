import { PerformanceOutputSchema, type StructuredRoleModel } from "./live-protocol";
import type {
  PerformanceDirectorPort,
  PerformanceRequest,
  PerformanceResult,
} from "./performance";

export class StructuredModelPerformanceDirector
  implements PerformanceDirectorPort
{
  constructor(
    private readonly model: StructuredRoleModel,
    private readonly prompt: string,
  ) {}

  async stage(request: PerformanceRequest): Promise<PerformanceResult> {
    const result = await this.model.call({
      role: "performance",
      instructions: this.prompt,
      input: sections([
        ["ALREADY_SELECTED_SEMANTIC_BEHAVIOR", request.semanticBehavior],
        ["CURRENT_PLAYER_SAFE_SCENE", request.scene],
        ["ACCEPTED_PERSONA_REPLY", request.acceptedPersonaReply],
        ["PERFORMANCE_ENVELOPE", request.performanceEnvelope],
        ["AUTHORED_HINT_BRIEF", request.hintBrief],
        [
          "ENGINE_AUTHORITY",
          "The World owns closure and durable effects. Return transient visible staging only.",
        ],
      ]),
      schemaName: "ldo_performance_v1",
      schema: PerformanceOutputSchema,
    });
    const output = PerformanceOutputSchema.parse(result.parsed);
    return { beats: output.beats };
  }
}

const sections = (entries: Array<[string, unknown]>): string =>
  entries
    .map(
      ([heading, value]) =>
        `${heading}\n${typeof value === "string" ? value : JSON.stringify(value, null, 2)}`,
    )
    .join("\n\n");

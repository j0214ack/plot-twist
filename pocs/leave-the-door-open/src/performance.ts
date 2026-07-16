import type { PerformanceEnvelope } from "./narrative-actions";
import type {
  HintBrief,
  RoutineVariantDefinition,
} from "./routine-behaviors";
import type { LocationId, NarrativeActionId, NPCId, RoutineBehaviorId } from "./world";

export type PerformanceRequest = {
  actorId: NPCId;
  at: number;
  semanticBehavior:
    | {
        kind: "routine";
        behaviorId: RoutineBehaviorId;
        variantId: string;
      }
    | {
        kind: "narrative_action";
        behaviorId: NarrativeActionId;
        variantId: string;
      };
  scene: {
    locationId: LocationId;
    visibleFacts: string[];
  };
  performanceEnvelope:
    | PerformanceEnvelope
    | RoutineVariantDefinition["performanceEnvelope"];
  hintBrief: HintBrief | null;
  acceptedPersonaReply: string | null;
};

export type PerformanceResult = {
  beats: string[];
};

export interface PerformanceDirectorPort {
  stage(request: PerformanceRequest): Promise<PerformanceResult>;
}

export type PerformanceRecord = {
  afterEventIndex: number;
  at: number;
  beats: string[];
};

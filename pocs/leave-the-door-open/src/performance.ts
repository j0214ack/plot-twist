import type { PerformanceEnvelope } from "./narrative-actions";
import type {
  HintBrief,
  RoutineVariantDefinition,
} from "./routine-behaviors";
import type { LocationId, NarrativeActionId, NPCId, RoutineBehaviorId } from "./world";
import type {
  RelationshipConversationOutcomeDefinition,
  RelationshipConversationOutcomeId,
} from "./relationship-conversation-outcomes";
import type { GameLocale } from "./localization";

export type PerformanceRequest = {
  outputLocale: GameLocale;
  actorId: NPCId;
  actorDisplayName: string;
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
        relationshipOutcomeId?: RelationshipConversationOutcomeId;
      };
  recipientActors?: Array<{
    actorId: NPCId;
    actorDisplayName: string;
  }>;
  scene: {
    locationId: LocationId;
    visibleFacts: string[];
  };
  performanceEnvelope:
    | PerformanceEnvelope
    | RoutineVariantDefinition["performanceEnvelope"];
  hintBrief: HintBrief | null;
  acceptedPersonaReply: string | null;
  authoredRelationshipOutcome?: RelationshipConversationOutcomeDefinition;
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

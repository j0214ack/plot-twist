import type { NarrativeActionDefinition } from "./narrative-actions";
import type { PerformanceDirectorPort } from "./performance";
import type { CharacterCore } from "./character-cores";
import type {
  EvidenceId,
  LocationId,
  NPCId,
  VisibleActivityId,
} from "./world";
import type { MindState, MindStateTransition } from "./mind-state";

export type { MindState } from "./mind-state";

export type ConversationMessage = {
  speaker: "player" | "persona";
  text: string;
};

export type PersonaTurnRequest = {
  actorId: NPCId;
  characterCore: CharacterCore;
  moment: {
    time: number;
    locationId: LocationId;
    visibleActivityId: VisibleActivityId;
  };
  observedEvidence: Array<{
    evidenceId: EvidenceId;
    description: string;
  }>;
  conversation: ConversationMessage[];
  mindState: MindState;
};

export type PersonaTurnResult = {
  reply: string;
  shouldEndConversation: boolean;
};

export interface PersonaPort {
  takeTurn(request: PersonaTurnRequest): Promise<PersonaTurnResult>;
}

export type PersonaOwnedState = {
  reply: {
    sourceId: string;
    text: string;
  };
  mindState: MindState;
  moment: PersonaTurnRequest["moment"];
  observedEvidence: PersonaTurnRequest["observedEvidence"];
  conversation: ConversationMessage[];
};

export type AwarenessRequest = {
  actorId: NPCId;
  personaState: PersonaOwnedState;
  actions: Array<Pick<NarrativeActionDefinition, "actionId" | "description">>;
};

export type MindStateTransitionRequest = {
  actorId: NPCId;
  mindState: MindState;
  personaReply: PersonaOwnedState["reply"];
  moment: PersonaTurnRequest["moment"];
  observedEvidence: PersonaTurnRequest["observedEvidence"];
  conversation: ConversationMessage[];
};

export type MindStateTransitionResult = {
  transitions: MindStateTransition[];
  unmodeledShiftNote: string | null;
};

export type AwarenessResult = {
  judgments: Array<{
    actionId: string;
    awareness: "latent" | "faintly_imagined" | "surfaced";
  }>;
};

export type WillingnessRequest = {
  actorId: NPCId;
  personaState: PersonaOwnedState;
  action: NarrativeActionDefinition;
  awareness: AwarenessResult["judgments"][number];
};

export type WillingnessResult = {
  actionId: string;
  decision: "accept" | "smaller_step" | "defer" | "refuse";
  selectedVariantId: string | null;
};

export interface ActionJudgePort {
  judgeMindStateTransition(
    request: MindStateTransitionRequest,
  ): Promise<MindStateTransitionResult>;
  judgeAwareness(request: AwarenessRequest): Promise<AwarenessResult>;
  judgeWillingness(request: WillingnessRequest): Promise<WillingnessResult>;
}

export type ConversationPorts = {
  persona: PersonaPort;
  actionJudge: ActionJudgePort;
  performanceDirector?: PerformanceDirectorPort;
};

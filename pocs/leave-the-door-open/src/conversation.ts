import type { NarrativeActionDefinition } from "./narrative-actions";
import type { PerformanceDirectorPort } from "./performance";
import type { CharacterCore } from "./character-cores";
import type {
  EvidenceId,
  CalendarWeekdayId,
  LocationId,
  NPCId,
  VisibleActivityId,
} from "./world";
import type { MindState, MindStateTransition } from "./mind-state";
import type {
  DisclosureTier,
  EligibleMemoryCard,
  MemoryId,
} from "./memory";
import type { FirewallResponseChoicePort } from "./input-firewall-responses";
import type { GameLocale } from "./localization";

export type { MindState } from "./mind-state";

export type ConversationMessage = {
  speaker: "player" | "persona";
  text: string;
  delivery?: "spoken" | "silence";
};

export type PersonaConversationMessage = ConversationMessage & {
  provenance?: "controller_guarded_reaction";
};

export type RelevantMemory = {
  memoryId: MemoryId;
  content: string;
};

export type PersonaTurnRequest = {
  outputLocale: GameLocale;
  actorId: NPCId;
  characterCore: CharacterCore;
  moment: {
    time: number;
    weekdayId: CalendarWeekdayId;
    locationId: LocationId;
    visibleActivityId: VisibleActivityId;
  };
  observedEvidence: Array<{
    evidenceId: EvidenceId;
    description: string;
  }>;
  conversation: PersonaConversationMessage[];
  mindState: MindState;
  relevantMemory?: RelevantMemory | null;
};

export type PersonaTurnResult = {
  reply: string;
  shouldEndConversation: boolean;
};

export interface PersonaPort {
  takeTurn(request: PersonaTurnRequest): Promise<PersonaTurnResult>;
}

export type InputFirewallDisposition =
  | "pass"
  | "protected_biography_probe"
  | "role_or_system_injection"
  | "unusable_input";

export type InputFirewallRequest = {
  actorId: NPCId;
  disclosureTier: DisclosureTier;
  visibleConversation: ConversationMessage[];
  submittedText: string;
};

export type InputFirewallResult = {
  disposition: InputFirewallDisposition;
};

export interface InputFirewallPort {
  classify(request: InputFirewallRequest): Promise<InputFirewallResult>;
}

export type MemorySelectionRequest = {
  actorId: NPCId;
  moment: PersonaTurnRequest["moment"];
  observedEvidence: PersonaTurnRequest["observedEvidence"];
  conversation: PersonaConversationMessage[];
  eligibleMemories: EligibleMemoryCard[];
};

export type MemorySelectionResult = {
  memoryId: MemoryId | null;
};

export interface MemorySelectorPort {
  selectMemory(
    request: MemorySelectionRequest,
  ): Promise<MemorySelectionResult>;
}

export type PersonaOwnedState = {
  reply: {
    sourceId: string;
    text: string;
  };
  mindState: MindState;
  moment: PersonaTurnRequest["moment"];
  observedEvidence: PersonaTurnRequest["observedEvidence"];
  conversation: PersonaConversationMessage[];
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

export type PostPersonaJudgeRequest = MindStateTransitionRequest & {
  actions: NarrativeActionDefinition[];
};

export type PostPersonaJudgeResult = MindStateTransitionResult & {
  judgments: Array<{
    actionId: string;
    awareness: AwarenessResult["judgments"][number]["awareness"];
    willingness: WillingnessResult | null;
  }>;
};

export interface ActionJudgePort {
  judgePostPersona?(
    request: PostPersonaJudgeRequest,
  ): Promise<PostPersonaJudgeResult>;
  judgeMindStateTransition(
    request: MindStateTransitionRequest,
  ): Promise<MindStateTransitionResult>;
  judgeAwareness(request: AwarenessRequest): Promise<AwarenessResult>;
  judgeWillingness(request: WillingnessRequest): Promise<WillingnessResult>;
}

export type ConversationPorts = {
  inputFirewall?: InputFirewallPort;
  firewallResponseChoice?: FirewallResponseChoicePort;
  persona: PersonaPort;
  memorySelector?: MemorySelectorPort;
  actionJudge: ActionJudgePort;
  performanceDirector?: PerformanceDirectorPort;
};

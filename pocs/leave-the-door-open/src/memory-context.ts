import type {
  ConversationMessage,
  MemorySelectorPort,
  PersonaTurnRequest,
  RelevantMemory,
} from "./conversation";
import {
  getEligibleMemoryCards,
  getMemoryCard,
  selectLocallyRelevantMemoryCard,
  type DisclosureTier,
} from "./memory";
import type { NPCId } from "./world";
import type { RelationshipConversationOutcomeId } from "./relationship-conversation-outcomes";

export const selectRelevantMemoryForPersona = async ({
  actorId,
  disclosureTier,
  relationshipConversation,
  moment,
  observedEvidence,
  conversation,
  memorySelector,
}: {
  actorId: NPCId;
  disclosureTier: DisclosureTier;
  relationshipConversation?: RelationshipConversationOutcomeId;
  moment: PersonaTurnRequest["moment"];
  observedEvidence: PersonaTurnRequest["observedEvidence"];
  conversation: ConversationMessage[];
  memorySelector?: MemorySelectorPort;
}): Promise<RelevantMemory | null> => {
  const eligibleMemories = getEligibleMemoryCards({
    actorId,
    disclosureTier,
    relationshipConversation,
  });
  if (eligibleMemories.length === 0 || memorySelector === undefined) {
    const latestPlayerText = [...conversation]
      .reverse()
      .find(({ speaker }) => speaker === "player")?.text;
    if (latestPlayerText === undefined) return null;
    const selected = selectLocallyRelevantMemoryCard({
      eligibleMemories,
      text: latestPlayerText,
    });
    return selected === null
      ? null
      : { memoryId: selected.memoryId, content: selected.content };
  }

  const { memoryId } = await memorySelector.selectMemory({
    actorId,
    moment,
    observedEvidence,
    conversation,
    eligibleMemories,
  });
  if (memoryId === null) return null;
  if (!eligibleMemories.some((candidate) => candidate.memoryId === memoryId)) {
    throw new Error(`Memory selector returned an ineligible ID: ${memoryId}`);
  }

  const selected = getMemoryCard(memoryId);
  if (selected.actorId !== actorId) {
    throw new Error(`Memory selector returned another actor's memory: ${memoryId}`);
  }
  return { memoryId: selected.memoryId, content: selected.content };
};

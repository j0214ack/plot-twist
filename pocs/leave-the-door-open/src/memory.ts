import type { ChapterId, NPCId } from "./world";
import type { RelationshipConversationOutcomeId } from "./relationship-conversation-outcomes";

export type DisclosureTier =
  | "unnamed_loss"
  | "absent_person"
  | "child_and_room"
  | "personal_memory"
  | "full_history";

export type MemoryId =
  | "husband.work.ordinary_schedule"
  | "wife.work.ordinary_schedule"
  | "husband.relationship.practical_deflection"
  | "husband.relationship.distance_acknowledged"
  | "husband.relationship.one_truth_returned"
  | "wife.relationship.practical_deflection"
  | "wife.relationship.distance_acknowledged"
  | "wife.relationship.one_truth_returned"
  | "husband.yellow_bowl.practical_grief"
  | "wife.yellow_bowl.after_the_fact";

export type EligibleMemoryCard = {
  memoryId: MemoryId;
  cue: string;
};

export type AuthoredMemoryCard = EligibleMemoryCard & {
  actorId: NPCId;
  minimumDisclosureTier: DisclosureTier;
  relationshipConversation?: RelationshipConversationOutcomeId;
  content: string;
};

const disclosureTierOrder: DisclosureTier[] = [
  "unnamed_loss",
  "absent_person",
  "child_and_room",
  "personal_memory",
  "full_history",
];

const memoryCards: Record<MemoryId, AuthoredMemoryCard> = {
  "husband.work.ordinary_schedule": {
    memoryId: "husband.work.ordinary_schedule",
    actorId: "husband",
    minimumDisclosureTier: "unnamed_loss",
    cue: "Martin's ordinary work, weekday schedule, and commute.",
    content:
      "Martin works as a procurement coordinator for a restaurant-supply wholesaler. His ordinary work includes checking purchase orders, delivery dates, shortages, and supplier calls. He usually works Monday through Friday from 09:00 to 17:30, takes a bus for about twenty-five minutes, leaves home at 08:25, and returns around 18:05.",
  },
  "wife.work.ordinary_schedule": {
    memoryId: "wife.work.ordinary_schedule",
    actorId: "wife",
    minimumDisclosureTier: "unnamed_loss",
    cue: "Elise's ordinary work, weekday schedule, and commute.",
    content:
      "Elise works as a payroll administrator for a small group of dental clinics. Her ordinary work includes time-sheet corrections, leave records, and payroll deadlines. She usually works Monday through Friday from 09:00 to 17:00, walks for about twenty minutes, leaves home at 08:35, and returns around 17:25.",
  },
  "husband.relationship.practical_deflection": {
    memoryId: "husband.relationship.practical_deflection",
    actorId: "husband",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "practical_deflection",
    cue: "The bounded evening conversation Martin and Elise already had.",
    content:
      "At a quiet evening moment, Martin told Elise that he thought they had been talking around each other. Elise paused and asked what time he was leaving the next day. She did not answer at the same depth, but she did hear him, and the attempt ended there.",
  },
  "husband.relationship.distance_acknowledged": {
    memoryId: "husband.relationship.distance_acknowledged",
    actorId: "husband",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "distance_acknowledged",
    cue: "The bounded evening conversation Martin and Elise already had.",
    content:
      "At a quiet evening moment, Martin told Elise that he did not know how to begin but missed talking to her. Elise answered, “I know.” Neither tried to turn those sentences into a conclusion, and the attempt ended there.",
  },
  "husband.relationship.one_truth_returned": {
    memoryId: "husband.relationship.one_truth_returned",
    actorId: "husband",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "one_truth_returned",
    cue: "The bounded evening conversation Martin and Elise already had.",
    content:
      "At a quiet evening moment, Martin said that he missed knowing how Elise was when they were not discussing the day. Elise said that she kept waiting until she could say everything properly. Martin nodded, and they allowed that to be enough for the night.",
  },
  "wife.relationship.practical_deflection": {
    memoryId: "wife.relationship.practical_deflection",
    actorId: "wife",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "practical_deflection",
    cue: "The bounded evening conversation Martin and Elise already had.",
    content:
      "At a quiet evening moment, Martin told Elise that he thought they had been talking around each other. Elise paused and asked what time he was leaving the next day. She did not answer at the same depth, but she did hear him, and the attempt ended there.",
  },
  "wife.relationship.distance_acknowledged": {
    memoryId: "wife.relationship.distance_acknowledged",
    actorId: "wife",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "distance_acknowledged",
    cue: "The bounded evening conversation Martin and Elise already had.",
    content:
      "At a quiet evening moment, Martin told Elise that he did not know how to begin but missed talking to her. Elise answered, “I know.” Neither tried to turn those sentences into a conclusion, and the attempt ended there.",
  },
  "wife.relationship.one_truth_returned": {
    memoryId: "wife.relationship.one_truth_returned",
    actorId: "wife",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "one_truth_returned",
    cue: "The bounded evening conversation Martin and Elise already had.",
    content:
      "At a quiet evening moment, Martin said that he missed knowing how Elise was when they were not discussing the day. Elise said that she kept waiting until she could say everything properly. Martin nodded, and they allowed that to be enough for the night.",
  },
  "husband.yellow_bowl.practical_grief": {
    memoryId: "husband.yellow_bowl.practical_grief",
    actorId: "husband",
    minimumDisclosureTier: "personal_memory",
    cue: "A practical response to a completed household change was read as evidence of caring less.",
    content:
      "When the yellow bowl split in the dishwasher, Martin wrapped the pieces and put them in the bin. Elise found the yellow shard before he told her. During the argument, he said that every practical task after the loss seemed to make his grief look less real. He later returned the wrapped pieces to the counter for Elise to decide about.",
  },
  "wife.yellow_bowl.after_the_fact": {
    memoryId: "wife.yellow_bowl.after_the_fact",
    actorId: "wife",
    minimumDisclosureTier: "personal_memory",
    cue: "A completed household change was discovered only after there was no chance to participate.",
    content:
      "When the yellow bowl split in the dishwasher, Elise discovered a yellow shard in the bin before Martin told her. She did not need every broken object to remain forever; she needed a chance to participate before a shared household change was already complete. She kept the wrapped pieces for several days and later discarded them herself.",
  },
};

export const disclosureTierForChapter = (
  _chapter: ChapterId,
): DisclosureTier => "unnamed_loss";

export const getEligibleMemoryCards = ({
  actorId,
  disclosureTier,
  relationshipConversation,
}: {
  actorId: NPCId;
  disclosureTier: DisclosureTier;
  relationshipConversation?: RelationshipConversationOutcomeId;
}): EligibleMemoryCard[] => {
  const currentTierIndex = disclosureTierOrder.indexOf(disclosureTier);
  return Object.values(memoryCards).flatMap((card) =>
    card.actorId === actorId &&
    disclosureTierOrder.indexOf(card.minimumDisclosureTier) <= currentTierIndex &&
    (card.relationshipConversation === undefined ||
      card.relationshipConversation === relationshipConversation)
      ? [{ memoryId: card.memoryId, cue: card.cue }]
      : [],
  );
};

export const getMemoryCard = (memoryId: MemoryId): AuthoredMemoryCard =>
  structuredClone(memoryCards[memoryId]);

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
  relevanceTerms: {
    en: string[];
    zhTW: string[];
  };
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
    relevanceTerms: {
      en: ["work", "job", "office", "commute", "shift", "schedule", "bus", "procurement"],
      zhTW: ["上班", "工作", "職業", "公司", "通勤", "下班", "公車", "採購"],
    },
    content:
      "Martin works as a procurement coordinator for a restaurant-supply wholesaler. His ordinary work includes checking purchase orders, delivery dates, shortages, and supplier calls. He usually works Monday through Friday from 09:00 to 17:30, takes a bus for about twenty-five minutes, leaves home at 08:25, and returns around 18:05.",
  },
  "wife.work.ordinary_schedule": {
    memoryId: "wife.work.ordinary_schedule",
    actorId: "wife",
    minimumDisclosureTier: "unnamed_loss",
    cue: "Elise's ordinary work, weekday schedule, and commute.",
    relevanceTerms: {
      en: ["work", "job", "office", "commute", "shift", "schedule", "payroll"],
      zhTW: ["上班", "工作", "職業", "公司", "通勤", "下班", "薪資", "薪水"],
    },
    content:
      "Elise works as a payroll administrator for a small group of dental clinics. Her ordinary work includes time-sheet corrections, leave records, and payroll deadlines. She usually works Monday through Friday from 09:00 to 17:00, walks for about twenty minutes, leaves home at 08:35, and returns around 17:25.",
  },
  "husband.relationship.practical_deflection": {
    memoryId: "husband.relationship.practical_deflection",
    actorId: "husband",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "practical_deflection",
    cue: "The bounded evening conversation Martin and Elise already had.",
    relevanceTerms: {
      en: ["talk", "conversation", "last night", "said to elise", "wife"],
      zhTW: ["談", "聊", "對話", "昨晚", "伊莉絲", "太太", "妻子"],
    },
    content:
      "At a quiet evening moment, Martin told Elise that he thought they had been talking around each other. Elise paused and asked what time he was leaving the next day. She did not answer at the same depth, but she did hear him, and the attempt ended there.",
  },
  "husband.relationship.distance_acknowledged": {
    memoryId: "husband.relationship.distance_acknowledged",
    actorId: "husband",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "distance_acknowledged",
    cue: "The bounded evening conversation Martin and Elise already had.",
    relevanceTerms: {
      en: ["talk", "conversation", "last night", "said to elise", "wife"],
      zhTW: ["談", "聊", "對話", "昨晚", "伊莉絲", "太太", "妻子"],
    },
    content:
      "At a quiet evening moment, Martin told Elise that he did not know how to begin but missed talking to her. Elise answered, “I know.” Neither tried to turn those sentences into a conclusion, and the attempt ended there.",
  },
  "husband.relationship.one_truth_returned": {
    memoryId: "husband.relationship.one_truth_returned",
    actorId: "husband",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "one_truth_returned",
    cue: "The bounded evening conversation Martin and Elise already had.",
    relevanceTerms: {
      en: ["talk", "conversation", "last night", "said to elise", "wife"],
      zhTW: ["談", "聊", "對話", "昨晚", "伊莉絲", "太太", "妻子"],
    },
    content:
      "At a quiet evening moment, Martin said that he missed knowing how Elise was when they were not discussing the day. Elise said that she kept waiting until she could say everything properly. Martin nodded, and they allowed that to be enough for the night.",
  },
  "wife.relationship.practical_deflection": {
    memoryId: "wife.relationship.practical_deflection",
    actorId: "wife",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "practical_deflection",
    cue: "The bounded evening conversation Martin and Elise already had.",
    relevanceTerms: {
      en: ["talk", "conversation", "last night", "martin", "husband"],
      zhTW: ["談", "聊", "對話", "昨晚", "馬丁", "先生", "丈夫"],
    },
    content:
      "At a quiet evening moment, Martin told Elise that he thought they had been talking around each other. Elise paused and asked what time he was leaving the next day. She did not answer at the same depth, but she did hear him, and the attempt ended there.",
  },
  "wife.relationship.distance_acknowledged": {
    memoryId: "wife.relationship.distance_acknowledged",
    actorId: "wife",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "distance_acknowledged",
    cue: "The bounded evening conversation Martin and Elise already had.",
    relevanceTerms: {
      en: ["talk", "conversation", "last night", "martin", "husband"],
      zhTW: ["談", "聊", "對話", "昨晚", "馬丁", "先生", "丈夫"],
    },
    content:
      "At a quiet evening moment, Martin told Elise that he did not know how to begin but missed talking to her. Elise answered, “I know.” Neither tried to turn those sentences into a conclusion, and the attempt ended there.",
  },
  "wife.relationship.one_truth_returned": {
    memoryId: "wife.relationship.one_truth_returned",
    actorId: "wife",
    minimumDisclosureTier: "unnamed_loss",
    relationshipConversation: "one_truth_returned",
    cue: "The bounded evening conversation Martin and Elise already had.",
    relevanceTerms: {
      en: ["talk", "conversation", "last night", "martin", "husband"],
      zhTW: ["談", "聊", "對話", "昨晚", "馬丁", "先生", "丈夫"],
    },
    content:
      "At a quiet evening moment, Martin said that he missed knowing how Elise was when they were not discussing the day. Elise said that she kept waiting until she could say everything properly. Martin nodded, and they allowed that to be enough for the night.",
  },
  "husband.yellow_bowl.practical_grief": {
    memoryId: "husband.yellow_bowl.practical_grief",
    actorId: "husband",
    minimumDisclosureTier: "personal_memory",
    cue: "A practical response to a completed household change was read as evidence of caring less.",
    relevanceTerms: {
      en: ["bowl", "shard", "dishwasher", "broken", "afterward", "completed change"],
      zhTW: ["碗", "碎片", "洗碗機", "裂", "丟掉", "事後", "之後才知道"],
    },
    content:
      "When the yellow bowl split in the dishwasher, Martin wrapped the pieces and put them in the bin. Elise found the yellow shard before he told her. During the argument, he said that every practical task after the loss seemed to make his grief look less real. He later returned the wrapped pieces to the counter for Elise to decide about.",
  },
  "wife.yellow_bowl.after_the_fact": {
    memoryId: "wife.yellow_bowl.after_the_fact",
    actorId: "wife",
    minimumDisclosureTier: "personal_memory",
    cue: "A completed household change was discovered only after there was no chance to participate.",
    relevanceTerms: {
      en: ["bowl", "shard", "dishwasher", "broken", "afterward", "before or after"],
      zhTW: ["碗", "碎片", "洗碗機", "裂", "事後", "之後才知道", "來不及參與"],
    },
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

export const selectLocallyRelevantMemoryCard = ({
  eligibleMemories,
  text,
}: {
  eligibleMemories: EligibleMemoryCard[];
  text: string;
}): AuthoredMemoryCard | null => {
  const normalized = text.toLocaleLowerCase();
  const eligibleIds = new Set(
    eligibleMemories.map(({ memoryId }) => memoryId),
  );
  const scored = Object.values(memoryCards).flatMap((card) => {
    if (!eligibleIds.has(card.memoryId)) return [];
    const score = [...card.relevanceTerms.en, ...card.relevanceTerms.zhTW]
      .filter((term) => normalized.includes(term.toLocaleLowerCase()))
      .reduce((total, term) => total + term.length, 0);
    return score > 0 ? [{ card, score }] : [];
  });
  scored.sort((left, right) => right.score - left.score);
  return scored[0] === undefined ? null : structuredClone(scored[0].card);
};

import type { NPCId } from "./world";

export const characterDisplayNames: Record<NPCId, string> = {
  husband: "Martin",
  wife: "Elise",
};

export const characterDisplayName = (actorId: NPCId): string =>
  characterDisplayNames[actorId];

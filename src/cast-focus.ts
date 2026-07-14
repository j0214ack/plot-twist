export interface CastFocusEntity {
  id: string;
  tags: readonly string[];
  active: boolean;
}

const activeWithTag = (
  entities: readonly CastFocusEntity[],
  tag: string,
): CastFocusEntity | undefined =>
  entities.find((entity) => entity.active && entity.tags.includes(tag));

export const resolveCastFocus = (
  entities: readonly CastFocusEntity[],
): string | undefined => {
  const guardian = activeWithTag(entities, "guardian");
  if (guardian) return guardian.id;

  const lockedDoor = entities.find(
    (entity) => entity.active && entity.tags.includes("door") && entity.tags.includes("locked"),
  );
  if (lockedDoor) return lockedDoor.id;

  return activeWithTag(entities, "story-goal")?.id;
};

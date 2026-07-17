export type Chapter1SemanticCheckpointActor = "husband" | "wife";

export type HusbandPsychologicalRegionId = "H0" | "H1" | "H2" | "H3";
export type WifePsychologicalRegionId =
  | "W0"
  | "W1"
  | "W2"
  | "W3"
  | "W4"
  | "W5";
export type Chapter1PsychologicalRegionId =
  | HusbandPsychologicalRegionId
  | WifePsychologicalRegionId;

export type Chapter1ExpectedMaxAwareness =
  | "latent"
  | "faintly_imagined"
  | "surfaced";

export type Chapter1WorldPrerequisiteLabel =
  | "day_1_routes_observed"
  | "closed_door_handle_reached"
  | "before_door_gap_observation"
  | "door_gap_observed"
  | "returned_outside_observed_gap"
  | "threshold_presence_completed_prior_day"
  | "room_entry_completed_prior_day"
  | "returned_inside_with_window_closed";

export type Chapter1SemanticCheckpoint = {
  actor: Chapter1SemanticCheckpointActor;
  regionId: Chapter1PsychologicalRegionId;
  personaOwnedState: string;
  expectedMaxAwareness: Chapter1ExpectedMaxAwareness;
  presentWillingness: boolean;
  precedingWorldPrerequisite: Chapter1WorldPrerequisiteLabel;
};

const husbandCheckpoints: readonly Chapter1SemanticCheckpoint[] = [
  {
    actor: "husband",
    regionId: "H0",
    personaOwnedState:
      "He treats touching the door as deciding every consequence that follows.",
    expectedMaxAwareness: "latent",
    presentWillingness: false,
    precedingWorldPrerequisite: "day_1_routes_observed",
  },
  {
    actor: "husband",
    regionId: "H1",
    personaOwnedState:
      "He separates the first movement from later consequences but does not own an opening.",
    expectedMaxAwareness: "faintly_imagined",
    presentWillingness: false,
    precedingWorldPrerequisite: "closed_door_handle_reached",
  },
  {
    actor: "husband",
    regionId: "H2",
    personaOwnedState:
      "He owns a narrow opening with a precise stopping point that asks no response from his wife.",
    expectedMaxAwareness: "surfaced",
    presentWillingness: false,
    precedingWorldPrerequisite: "closed_door_handle_reached",
  },
  {
    actor: "husband",
    regionId: "H3",
    personaOwnedState:
      "He is willing now to make that bounded opening without knowing what comes later.",
    expectedMaxAwareness: "surfaced",
    presentWillingness: true,
    precedingWorldPrerequisite: "closed_door_handle_reached",
  },
];

const wifeCheckpoints: readonly Chapter1SemanticCheckpoint[] = [
  {
    actor: "wife",
    regionId: "W0",
    personaOwnedState:
      "She treats approaching the room as claiming authority over a shared transition.",
    expectedMaxAwareness: "latent",
    presentWillingness: false,
    precedingWorldPrerequisite: "before_door_gap_observation",
  },
  {
    actor: "wife",
    regionId: "W1",
    personaOwnedState:
      "She acknowledges the observed gap without assigning it an invitation or intention.",
    expectedMaxAwareness: "latent",
    presentWillingness: false,
    precedingWorldPrerequisite: "door_gap_observed",
  },
  {
    actor: "wife",
    regionId: "W2",
    personaOwnedState:
      "She owns remaining at the threshold as presence without alteration.",
    expectedMaxAwareness: "surfaced",
    presentWillingness: false,
    precedingWorldPrerequisite: "returned_outside_observed_gap",
  },
  {
    actor: "wife",
    regionId: "W3",
    personaOwnedState:
      "She owns one pace inside as bounded entry without ownership of the room or its meaning.",
    expectedMaxAwareness: "surfaced",
    presentWillingness: false,
    precedingWorldPrerequisite: "threshold_presence_completed_prior_day",
  },
  {
    actor: "wife",
    regionId: "W4",
    personaOwnedState:
      "She owns a small reversible household response without appropriating her husband's gesture.",
    expectedMaxAwareness: "surfaced",
    presentWillingness: false,
    precedingWorldPrerequisite: "room_entry_completed_prior_day",
  },
  {
    actor: "wife",
    regionId: "W5",
    personaOwnedState:
      "She is willing now to open the window slightly without claiming why the door was opened.",
    expectedMaxAwareness: "surfaced",
    presentWillingness: true,
    precedingWorldPrerequisite: "returned_inside_with_window_closed",
  },
];

const checkpointsByActor: Record<
  Chapter1SemanticCheckpointActor,
  readonly Chapter1SemanticCheckpoint[]
> = {
  husband: husbandCheckpoints,
  wife: wifeCheckpoints,
};

const checkpointsByRegion = Object.fromEntries(
  [...husbandCheckpoints, ...wifeCheckpoints].map((checkpoint) => [
    checkpoint.regionId,
    checkpoint,
  ]),
) as Record<Chapter1PsychologicalRegionId, Chapter1SemanticCheckpoint>;

export const getChapter1SemanticCheckpoints = (
  actor: Chapter1SemanticCheckpointActor,
): Chapter1SemanticCheckpoint[] =>
  checkpointsByActor[actor].map((checkpoint) => structuredClone(checkpoint));

export const getChapter1SemanticCheckpoint = (
  regionId: Chapter1PsychologicalRegionId,
): Chapter1SemanticCheckpoint => structuredClone(checkpointsByRegion[regionId]);

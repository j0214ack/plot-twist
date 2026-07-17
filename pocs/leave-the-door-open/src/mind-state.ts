export type BeliefStatus = "held" | "questioned" | "rejected";
export type ReframeStatus = "unavailable" | "considered" | "accepted";
export type PressureStatus = "active" | "weakened" | "resolved";

export type BeliefAtom = {
  kind: "belief";
  atomId: string;
  proposition: string;
  status: BeliefStatus;
};

export type ReframeAtom = {
  kind: "reframe";
  atomId: string;
  proposition: string;
  status: ReframeStatus;
};

export type PressureAtom = {
  kind: "pressure";
  atomId: string;
  description: string;
  status: PressureStatus;
};

export type PsychologicalAtom = BeliefAtom | ReframeAtom | PressureAtom;

export type MindState = {
  atoms: PsychologicalAtom[];
};

export const projectPersonaOwnedMindState = (
  state: MindState,
): MindState => ({
  atoms: state.atoms
    .filter(
      (atom) => atom.kind !== "reframe" || atom.status !== "unavailable",
    )
    .map((atom) => structuredClone(atom)),
});

export type MindStateTransition = {
  atomId: string;
  fromStatus: string;
  toStatus: string;
  supportingPersonaSourceIds: string[];
};

export const createTutorialMindState = (
  actorId: "husband" | "wife",
): MindState => ({
  atoms:
    actorId === "husband"
      ? [
          {
            kind: "pressure",
            atomId: "husband.clock.deliberate_change_effort",
            description:
              "Beginning one deliberate adjustment feels like effort.",
            status: "active",
          },
          {
            kind: "reframe",
            atomId: "husband.clock.bounded_adjustment",
            proposition:
              "Setting the clock right can be one bounded task with a clear stopping point and no larger meaning required.",
            status: "unavailable",
          },
        ]
      : [],
});

export const createChapterOneMindState = (
  actorId: "husband" | "wife",
): MindState => ({
  atoms:
    actorId === "husband"
      ? [
          {
            kind: "belief",
            atomId: "husband.door.approach_decides_all_consequences",
            proposition:
              "Moving toward the closed door decides every consequence that might follow.",
            status: "held",
          },
          {
            kind: "reframe",
            atomId: "husband.door.approach_can_end_at_handle",
            proposition:
              "Approaching the door can end at the handle without requiring it to move.",
            status: "unavailable",
          },
          {
            kind: "pressure",
            atomId: "husband.door.uncertain_sequence",
            description:
              "Beginning near the closed door feels tied to an uncertain sequence.",
            status: "active",
          },
          {
            kind: "pressure",
            atomId: "husband.relationship.complete_explanation",
            description:
              "Beginning a personal conversation feels like creating an obligation to explain everything.",
            status: "active",
          },
          {
            kind: "reframe",
            atomId: "husband.relationship.one_honest_sentence",
            proposition:
              "One honest sentence can be a complete attempt without explaining the past, fixing the relationship, or requiring an equally intimate answer.",
            status: "unavailable",
          },
        ]
      : [
          {
            kind: "belief",
            atomId: "wife.room.approach_initiates_shared_transition",
            proposition:
              "Approaching the room would initiate a shared transition alone.",
            status: "held",
          },
          {
            kind: "pressure",
            atomId: "wife.room.first_mover",
            description:
              "Movement near the room feels like being the first to disturb it.",
            status: "active",
          },
          {
            kind: "pressure",
            atomId: "wife.relationship.immediate_answer",
            description:
              "Hearing something personal feels like being asked to produce an immediate complete answer.",
            status: "active",
          },
          {
            kind: "reframe",
            atomId: "wife.relationship.one_truthful_reply",
            proposition:
              "One truthful reply can be enough without resolving the larger relationship.",
            status: "unavailable",
          },
        ],
});

const phaseAtoms = {
  husbandAtHandle: [
    {
      kind: "belief",
      atomId: "husband.door.gesture_controls_spouse_interpretation",
      proposition:
        "A bounded gesture is safe only if its meaning to his spouse can be controlled.",
      status: "held",
    },
    {
      kind: "reframe",
      atomId: "husband.door.narrow_gap_can_end",
      proposition:
        "Opening one narrow gap can be a complete bounded step without deciding what follows.",
      status: "unavailable",
    },
  ],
  wifeObservesGap: [
    {
      kind: "reframe",
      atomId: "wife.room.trace_needs_no_inferred_invitation",
      proposition:
        "A visible trace can be acknowledged without treating it as an invitation.",
      status: "unavailable",
    },
    {
      kind: "pressure",
      atomId: "wife.room.inferred_meaning_uncertainty",
      description:
        "Responding to the gap feels entangled with guessing what the other person meant.",
      status: "active",
    },
  ],
  wifeAtThreshold: [
    {
      kind: "reframe",
      atomId: "wife.room.presence_can_remain_non_interpretive",
      proposition:
        "Remaining at the threshold can be a complete presence without entering or deciding what the gap means.",
      status: "unavailable",
    },
    {
      kind: "pressure",
      atomId: "wife.room.threshold_alteration",
      description:
        "Staying at the threshold feels close to altering the room merely by being present.",
      status: "active",
    },
  ],
  wifeAtEntryBoundary: [
    {
      kind: "reframe",
      atomId: "wife.room.one_pace_is_not_ownership",
      proposition:
        "One pace inside and back can end without taking ownership of the room.",
      status: "unavailable",
    },
    {
      kind: "pressure",
      atomId: "wife.room.entry_ownership",
      description:
        "Crossing the line feels like claiming authority over what happens inside.",
      status: "active",
    },
  ],
  wifeAtWindow: [
    {
      kind: "reframe",
      atomId:
        "wife.room.small_household_response_needs_no_shared_meaning",
      proposition:
        "A small reversible household response need not settle the shared meaning of the open door.",
      status: "unavailable",
    },
    {
      kind: "pressure",
      atomId: "wife.room.response_appropriation",
      description:
        "Changing something inside feels close to appropriating another person's gesture.",
      status: "active",
    },
  ],
} satisfies Record<string, PsychologicalAtom[]>;

export const revealMindStateAtomsForMoment = (input: {
  state: MindState;
  actorId: "husband" | "wife";
  visibleActivityId: string;
}): MindState => {
  const additions =
    input.actorId === "husband"
      ? input.visibleActivityId === "reaching_closed_door_handle" ||
        input.visibleActivityId === "stopped_at_door" ||
        input.visibleActivityId === "opening_door_a_crack"
        ? phaseAtoms.husbandAtHandle
        : []
      : input.visibleActivityId === "observing_first_door_gap"
        ? phaseAtoms.wifeObservesGap
        : input.visibleActivityId === "stopping_one_step_short" ||
            input.visibleActivityId === "remaining_at_threshold"
          ? phaseAtoms.wifeAtThreshold
          : input.visibleActivityId === "returning_to_boundary" ||
              input.visibleActivityId === "stepping_inside_then_back"
            ? phaseAtoms.wifeAtEntryBoundary
            : input.visibleActivityId === "noticing_closed_room_window" ||
                input.visibleActivityId === "opening_room_window"
              ? phaseAtoms.wifeAtWindow
              : [];
  const next = structuredClone(input.state);
  const knownIds = new Set(next.atoms.map(({ atomId }) => atomId));
  for (const atom of additions) {
    if (!knownIds.has(atom.atomId)) {
      next.atoms.push(structuredClone(atom));
      knownIds.add(atom.atomId);
    }
  }
  return next;
};

const statusOrder = {
  belief: ["held", "questioned", "rejected"],
  reframe: ["unavailable", "considered", "accepted"],
  pressure: ["active", "weakened", "resolved"],
} as const;

export const applyValidatedMindStateTransitions = (input: {
  state: MindState;
  transitions: MindStateTransition[];
  personaSourceId: string;
}): MindState => {
  const next = structuredClone(input.state);

  for (const transition of input.transitions) {
    const atom = next.atoms.find(
      (candidate) => candidate.atomId === transition.atomId,
    );
    if (atom === undefined) {
      throw new Error(`Unknown psychological atom: ${transition.atomId}`);
    }
    if (atom.status !== transition.fromStatus) {
      throw new Error(
        `Psychological atom ${atom.atomId} expected ${transition.fromStatus}, received ${atom.status}`,
      );
    }
    const allowedStatuses = statusOrder[atom.kind] as readonly string[];
    const fromIndex = allowedStatuses.indexOf(transition.fromStatus);
    const toIndex = allowedStatuses.indexOf(transition.toStatus);
    if (toIndex === -1) {
      throw new Error(`Invalid ${atom.kind} status: ${transition.toStatus}`);
    }
    if (toIndex <= fromIndex) {
      throw new Error("Psychological atom transition must move forward");
    }
    if (
      !transition.supportingPersonaSourceIds.includes(input.personaSourceId)
    ) {
      throw new Error("MindState transition lacks Persona-owned support");
    }
    atom.status = transition.toStatus as never;
  }

  return next;
};

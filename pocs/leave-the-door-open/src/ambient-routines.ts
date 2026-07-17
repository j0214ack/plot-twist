import type { HintBrief } from "./routine-behaviors";
import type { LocationId, NPCId, VisibleActivityId } from "./world";

export type AmbientRoutineId =
  | "husband_tests_window_latch"
  | "wife_squares_hallway_runner";

export type AmbientSlotId = "chapter1_day2_morning_ambient";

export type AmbientRoutineChoiceRequest = {
  slotId: AmbientSlotId;
  candidateIds: AmbientRoutineId[];
};

export type AmbientChanceSnapshot = {
  seed: number;
  state: number;
  drawCount: number;
};

export interface AmbientRoutineChoicePort {
  choose(request: AmbientRoutineChoiceRequest): AmbientRoutineId | null;
  snapshot?(): AmbientChanceSnapshot;
}

export type AmbientRoutineDefinition = {
  routineId: AmbientRoutineId;
  actorId: NPCId;
  variantId: string;
  locationId: LocationId;
  visibleActivityId: VisibleActivityId;
  visibleFacts: string[];
  performanceDirective: string;
  performanceEnvelope: {
    targetObjectIds: string[];
    closurePolicy: { kind: "restore_valid_starting_state" };
  };
  hintBrief: HintBrief | null;
};

const ambientRoutines: Record<AmbientRoutineId, AmbientRoutineDefinition> = {
  husband_tests_window_latch: {
    routineId: "husband_tests_window_latch",
    actorId: "husband",
    variantId: "test_and_restore_latch",
    locationId: "living_room",
    visibleActivityId: "testing_window_latch",
    visibleFacts: [
      "The living-room window latch is closed; this routine leaves it closed.",
    ],
    performanceDirective:
      "Show him test the living-room window latch only far enough to locate its stopping point, then leave it in its original closed position.",
    performanceEnvelope: {
      targetObjectIds: ["living_room_window_latch"],
      closurePolicy: { kind: "restore_valid_starting_state" },
    },
    hintBrief: {
      hintId: "husband_prefers_known_stopping_points",
      safeFact:
        "He tests an ordinary mechanism until its stopping point is clear, then restores it.",
      clarity: "subtle",
      required: false,
      forbiddenInterpretations: [
        "Do not connect the latch to protected biography.",
        "Do not recommend opening the hallway door.",
        "Do not claim this routine proves readiness for another movement.",
      ],
    },
  },
  wife_squares_hallway_runner: {
    routineId: "wife_squares_hallway_runner",
    actorId: "wife",
    variantId: "square_near_edge",
    locationId: "hallway",
    visibleActivityId: "squaring_hallway_runner",
    visibleFacts: [
      "The hallway runner is in its ordinary position; this routine leaves it unchanged.",
    ],
    performanceDirective:
      "Show her square only the near edge of the hallway runner, notice where the hall continues, and leave the far end untouched.",
    performanceEnvelope: {
      targetObjectIds: ["hallway_runner"],
      closurePolicy: { kind: "restore_valid_starting_state" },
    },
    hintBrief: {
      hintId: "wife_maintains_a_near_boundary",
      safeFact:
        "She maintains the near edge of the shared hallway while leaving its far boundary untouched.",
      clarity: "subtle",
      required: false,
      forbiddenInterpretations: [
        "Do not explain the room or household history.",
        "Do not call the untouched boundary forbidden or sacred.",
        "Do not recommend approaching, entering, or changing the room.",
      ],
    },
  },
};

export const getAmbientRoutineDefinition = (
  routineId: AmbientRoutineId,
): AmbientRoutineDefinition => structuredClone(ambientRoutines[routineId]);

export const isAmbientRoutineId = (
  routineId: string,
): routineId is AmbientRoutineId => routineId in ambientRoutines;

export class SeededAmbientRoutineChoice
  implements AmbientRoutineChoicePort
{
  readonly #seed: number;
  #state: number;
  #drawCount = 0;

  constructor(seed: number) {
    this.#seed = seed >>> 0;
    this.#state = this.#seed || 0x6d2b79f5;
  }

  static fromSnapshot(
    snapshot: AmbientChanceSnapshot,
  ): SeededAmbientRoutineChoice {
    if (
      !Number.isInteger(snapshot.seed) ||
      snapshot.seed < 0 ||
      snapshot.seed > 0xffff_ffff ||
      !Number.isInteger(snapshot.state) ||
      snapshot.state < 0 ||
      snapshot.state > 0xffff_ffff ||
      !Number.isInteger(snapshot.drawCount) ||
      snapshot.drawCount < 0
    ) {
      throw new Error("Invalid ambient chance snapshot");
    }
    const restored = new SeededAmbientRoutineChoice(snapshot.seed);
    restored.#state = snapshot.state;
    restored.#drawCount = snapshot.drawCount;
    return restored;
  }

  choose(request: AmbientRoutineChoiceRequest): AmbientRoutineId | null {
    if (request.candidateIds.length === 0) return null;
    const draw = this.#nextUint32();
    const index = draw % (request.candidateIds.length + 1);
    return index === request.candidateIds.length
      ? null
      : request.candidateIds[index]!;
  }

  snapshot(): AmbientChanceSnapshot {
    return {
      seed: this.#seed,
      state: this.#state,
      drawCount: this.#drawCount,
    };
  }

  #nextUint32(): number {
    let value = this.#state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.#state = value >>> 0;
    this.#drawCount += 1;
    return this.#state;
  }
}

export const createSeededAmbientRoutineChoice = (
  seed = Math.floor(Math.random() * 0x1_0000_0000),
): SeededAmbientRoutineChoice => new SeededAmbientRoutineChoice(seed);

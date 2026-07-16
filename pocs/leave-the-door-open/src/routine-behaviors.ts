import type { RoutineBehaviorId } from "./world";

export type PsychologicalStage =
  | "latent"
  | "faintly_imagined"
  | "surfaced"
  | "intended"
  | "completed";

export type HintBrief = {
  hintId: string;
  safeFact: string;
  clarity: "subtle" | "clear";
  required: boolean;
  forbiddenInterpretations: string[];
};

export type RoutinePerformanceEnvelope = {
  targetObjectIds: string[];
  closurePolicy:
    | { kind: "restore_valid_starting_state" }
    | {
        kind: "authored_routine_postcondition";
        postconditionId: string;
      };
};

export type RoutineVariantDefinition = {
  routineId: RoutineBehaviorId;
  variantId: string;
  performanceDirective: string;
  performanceEnvelope: RoutinePerformanceEnvelope;
  hintBrief: HintBrief;
};

const slowClockHint: HintBrief = {
  hintId: "slow_clock_is_repeatedly_noticed",
  safeFact:
    "Most mornings the husband notices that the living-room clock is three minutes slow and keeps walking; today he stops beneath it.",
  clarity: "clear",
  required: true,
  forbiddenInterpretations: [
    "Do not explain why the clock matters.",
    "Do not recommend a hidden Action.",
    "Do not connect the clock to protected biography or relationship repair.",
    "Do not describe today's stopping as his repeated morning habit.",
  ],
};

const clockVariants: Record<
  "latent" | "faintly_imagined" | "surfaced",
  RoutineVariantDefinition
> = {
  latent: {
    routineId: "husband_notices_slow_clock",
    variantId: "notice_and_stop",
    performanceDirective:
      "Show him notice the three-minute discrepancy, start to continue his routine, and stop without touching the clock.",
    performanceEnvelope: {
      targetObjectIds: ["living_room_clock"],
      closurePolicy: { kind: "restore_valid_starting_state" },
    },
    hintBrief: slowClockHint,
  },
  faintly_imagined: {
    routineId: "husband_notices_slow_clock",
    variantId: "linger_beneath_clock",
    performanceDirective:
      "Show him remain beneath the slow clock for longer than usual without changing it.",
    performanceEnvelope: {
      targetObjectIds: ["living_room_clock"],
      closurePolicy: { kind: "restore_valid_starting_state" },
    },
    hintBrief: slowClockHint,
  },
  surfaced: {
    routineId: "husband_notices_slow_clock",
    variantId: "touch_clock_frame",
    performanceDirective:
      "Show him touch the clock frame without changing its durable state.",
    performanceEnvelope: {
      targetObjectIds: ["living_room_clock"],
      closurePolicy: { kind: "restore_valid_starting_state" },
    },
    hintBrief: slowClockHint,
  },
};

export const selectRoutineVariant = (
  routineId: "husband_notices_slow_clock",
  stage: PsychologicalStage,
): RoutineVariantDefinition => {
  const awarenessStage =
    stage === "intended" || stage === "completed" ? "surfaced" : stage;
  return structuredClone(clockVariants[awarenessStage]);
};

export const getRoutineVariant = (
  routineId: "husband_notices_slow_clock",
  variantId: string,
): RoutineVariantDefinition => {
  const variant = Object.values(clockVariants).find(
    (candidate) =>
      candidate.routineId === routineId && candidate.variantId === variantId,
  );
  if (variant === undefined) {
    throw new Error(`Unknown RoutineVariant: ${routineId}/${variantId}`);
  }
  return structuredClone(variant);
};

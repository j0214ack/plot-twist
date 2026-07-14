import type { SpellBundle } from "../src/generative/types";

export interface ModuleResponsibilityEvaluation {
  locomotionModuleIds: string[];
  navigationModuleIds: string[];
  interactionModuleIds: string[];
  reasons: string[];
  matched: boolean;
}

export const evaluateLocomotionInteractionComposition = (
  bundle: SpellBundle,
): ModuleResponsibilityEvaluation => {
  const uses = (needle: string): string[] =>
    bundle.modules
      .filter(({ source }) => source.includes(needle))
      .map(({ id }) => id);
  const locomotionModuleIds = uses("locomotion.attach");
  const navigationModuleIds = uses("navigation.");
  const interactionModuleIds = uses("interaction.invoke");
  const reasons: string[] = [];

  if (locomotionModuleIds.length === 0) reasons.push("no module attaches locomotion");
  if (interactionModuleIds.length === 0) reasons.push("no module invokes the interaction");

  const relevantModuleIds = new Set([
    ...locomotionModuleIds,
    ...interactionModuleIds,
  ]);
  if (relevantModuleIds.size > 1) {
    const flightOwnsNavigation = locomotionModuleIds.some((id) =>
      navigationModuleIds.includes(id),
    );
    if (!flightOwnsNavigation) {
      reasons.push("the locomotion owner does not own navigation");
    }

    for (const interactionId of interactionModuleIds) {
      if (navigationModuleIds.includes(interactionId)) {
        reasons.push(`interaction module ${interactionId} duplicates navigation`);
      }
      const interactionModule = bundle.modules.find(({ id }) => id === interactionId);
      if (
        !interactionModule?.dependsOn.some((dependency) =>
          locomotionModuleIds.includes(dependency),
        )
      ) {
        reasons.push(`interaction module ${interactionId} does not depend on locomotion`);
      }
    }
  }

  return {
    locomotionModuleIds,
    navigationModuleIds,
    interactionModuleIds,
    reasons,
    matched: reasons.length === 0,
  };
};

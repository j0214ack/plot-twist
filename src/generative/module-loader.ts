import type { MechanicModule, SpellArtifact } from "../game/types";

export type DependencyBindings = Readonly<Record<string, SpellArtifact>>;
export type MechanicModuleFactory = (dependencies: DependencyBindings) => MechanicModule;

const isMechanicModule = (value: unknown): value is MechanicModule => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<MechanicModule>;
  return (
    typeof candidate.label === "string" &&
    Array.isArray(candidate.tags) &&
    candidate.tags.every((tag) => typeof tag === "string") &&
    typeof candidate.setup === "function" &&
    (candidate.update === undefined || typeof candidate.update === "function") &&
    typeof candidate.dispose === "function"
  );
};

const immutableArtifact = (artifact: SpellArtifact): SpellArtifact =>
  Object.freeze({
    ...artifact,
    tags: Object.freeze([...artifact.tags]) as unknown as string[],
    entityIds: Object.freeze([...artifact.entityIds]) as unknown as string[],
  });

const obviousUnboundedLoops = [
  /\bwhile\s*\(\s*(?:true|1)\s*\)/,
  /\bfor\s*\(\s*;\s*;\s*\)/,
] as const;

export class GeneratedModuleLoader {
  instantiate(source: string, dependencies: DependencyBindings): MechanicModule {
    if (obviousUnboundedLoops.some((pattern) => pattern.test(source))) {
      throw new Error("Generated source contains an unbounded loop");
    }

    let factory: unknown;

    try {
      factory = Function(`"use strict"; return (${source});`)();
    } catch (error) {
      throw new Error("Generated source has invalid JavaScript syntax", { cause: error });
    }

    if (typeof factory !== "function") {
      throw new Error("Generated source must evaluate to a MechanicModule factory");
    }

    const readonlyDependencies = Object.freeze(
      Object.fromEntries(
        Object.entries(dependencies).map(([id, artifact]) => [id, immutableArtifact(artifact)]),
      ),
    );
    const module = (factory as MechanicModuleFactory)(readonlyDependencies);

    if (!isMechanicModule(module)) {
      throw new Error("Generated factory returned an invalid MechanicModule");
    }

    return module;
  }
}

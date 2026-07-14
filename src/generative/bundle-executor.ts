import { ModuleRuntime } from "../game/runtime";
import type { SpellArtifact } from "../game/types";
import { GeneratedModuleLoader, type DependencyBindings } from "./module-loader";
import type { SpellBundle } from "./types";

export interface ExecutedSpellBundle {
  artifactsByModuleId: Record<string, SpellArtifact>;
}

export class BundleExecutor {
  constructor(
    private readonly runtime: ModuleRuntime,
    private readonly loader: GeneratedModuleLoader,
  ) {}

  execute(bundle: SpellBundle): ExecutedSpellBundle {
    const artifactsByModuleId: Record<string, SpellArtifact> = {};
    const loadedArtifactIds: string[] = [];

    try {
      for (const generated of bundle.modules) {
        const dependencies: Record<string, SpellArtifact> = {};
        for (const dependencyId of generated.dependsOn) {
          const artifact = artifactsByModuleId[dependencyId];
          if (!artifact) {
            throw new Error(
              `Module ${generated.id} has unavailable dependency: ${dependencyId}`,
            );
          }
          dependencies[dependencyId] = artifact;
        }

        const module = this.loader.instantiate(
          generated.source,
          dependencies as DependencyBindings,
        );
        const artifact = this.runtime.load(module);
        artifactsByModuleId[generated.id] = artifact;
        loadedArtifactIds.push(artifact.id);
      }

      return { artifactsByModuleId };
    } catch (error) {
      for (const artifactId of loadedArtifactIds.reverse()) {
        this.runtime.dispose(artifactId);
      }
      throw error;
    }
  }
}

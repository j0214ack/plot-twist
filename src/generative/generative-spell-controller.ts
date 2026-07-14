import { ModuleRuntime } from "../game/runtime";
import { GameWorld } from "../game/world";
import { BundleExecutor } from "./bundle-executor";
import type { SpellBundle, SpellCompileRequest } from "./types";

export interface SpellApiClient {
  compile(request: SpellCompileRequest): Promise<SpellBundle>;
}

export interface GenerativeSpellControllerOptions {
  onCastingChange?: (casting: boolean) => void;
  onStageChange?: (stage: "idle" | "writing" | "manifesting") => void;
}

export type GenerativeSubmission =
  | { accepted: true; error?: string }
  | { accepted: false; reason: "busy" };

export class GenerativeSpellController {
  private casting = false;

  constructor(
    private readonly world: GameWorld,
    private readonly runtime: ModuleRuntime,
    private readonly executor: BundleExecutor,
    private readonly api: SpellApiClient,
    private readonly options: GenerativeSpellControllerOptions = {},
  ) {}

  get isCasting(): boolean {
    return this.casting;
  }

  async submit(utterance: string, focusedEntityId?: string): Promise<GenerativeSubmission> {
    if (this.casting) return { accepted: false, reason: "busy" };

    this.casting = true;
    this.options.onCastingChange?.(true);
    this.options.onStageChange?.("writing");

    try {
      const bundle = await this.api.compile({
        utterance,
        focusedEntityId,
        scene: this.world.list().map(({ id, name, tags, affordances, position }) => ({
          id,
          name,
          tags,
          affordances,
          position,
        })),
        recentArtifacts: this.runtime.listArtifacts(),
      });

      this.options.onStageChange?.("manifesting");
      this.executor.execute(bundle);
      return { accepted: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.runtime.note({ tone: "warning", text: `咒語沒有完成：${message}` });
      return { accepted: true, error: message };
    } finally {
      this.casting = false;
      this.options.onCastingChange?.(false);
      this.options.onStageChange?.("idle");
    }
  }
}

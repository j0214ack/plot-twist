import {
  createEnclosureModule,
  createFireInRecentEnclosureModule,
  createKeyToLockModule,
} from "./reference-modules";
import { ModuleRuntime } from "./runtime";
import type { MechanicModule } from "./types";

export type ReferenceSpellId = "enclosure" | "fire" | "key-to-lock";

export interface ReferenceSubmission {
  accepted: boolean;
  reason?: "busy";
}

export interface ReferenceHarnessOptions {
  generationSeconds?: number;
  onCastingChange?: (casting: boolean) => void;
  onStageChange?: (stage: "idle" | "writing" | "manifesting") => void;
}

interface PendingReference {
  remainingSeconds: number;
  createModule: () => MechanicModule;
}

export class ReferenceHarnessController {
  private pending: PendingReference | undefined;
  private readonly generationSeconds: number;

  constructor(
    private readonly runtime: ModuleRuntime,
    private readonly options: ReferenceHarnessOptions = {},
  ) {
    this.generationSeconds = options.generationSeconds ?? 1.65;
  }

  get isCasting(): boolean {
    return Boolean(this.pending);
  }

  submitReference(spellId: ReferenceSpellId, focusedEntityId?: string): ReferenceSubmission {
    if (this.pending) return { accepted: false, reason: "busy" };

    this.pending = {
      remainingSeconds: this.generationSeconds,
      createModule: this.moduleFactory(spellId, focusedEntityId),
    };
    this.options.onCastingChange?.(true);
    this.options.onStageChange?.("writing");
    return { accepted: true };
  }

  update(deltaSeconds: number): void {
    if (!this.pending) return;
    this.pending.remainingSeconds -= deltaSeconds;
    if (this.pending.remainingSeconds > 0) return;

    const pending = this.pending;
    this.pending = undefined;
    this.options.onStageChange?.("manifesting");
    try {
      this.runtime.load(pending.createModule());
    } catch (error) {
      this.runtime.note({
        tone: "warning",
        text: error instanceof Error ? `Reference module 失敗：${error.message}` : "Reference module 失敗。",
      });
    } finally {
      this.options.onCastingChange?.(false);
      this.options.onStageChange?.("idle");
    }
  }

  private moduleFactory(
    spellId: ReferenceSpellId,
    focusedEntityId?: string,
  ): () => MechanicModule {
    switch (spellId) {
      case "enclosure":
        return () => createEnclosureModule(focusedEntityId ?? "guardian");
      case "fire":
        return () => createFireInRecentEnclosureModule();
      case "key-to-lock":
        return () => createKeyToLockModule();
    }
  }
}

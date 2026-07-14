import type { QuillNote } from "./game/types";
import { nextStepGuidance } from "./game-guidance";
import { SPELL_EXAMPLES } from "./spell-examples";
import type { VoiceCastingState } from "./voice/voice-casting-controller";

export interface HudState {
  mana: number;
  maximumMana: number;
  playerHp: number;
  playerMaxHp: number;
  guardianHp: number;
  guardianMaxHp: number;
  doorUnlocked: boolean;
  artifacts: number;
  completed: boolean;
}

export class GameUi {
  readonly canvas: HTMLCanvasElement;
  readonly mobileJoystick: HTMLElement;
  readonly mobileJoystickKnob: HTMLElement;
  private readonly form: HTMLFormElement;
  private readonly input: HTMLInputElement;
  private readonly castButton: HTMLButtonElement;
  private readonly micButtons: HTMLButtonElement[];
  private readonly micLabels: HTMLElement[];
  private readonly stage: HTMLElement;
  private readonly manaBar: HTMLElement;
  private readonly healthBars: HTMLElement[];
  private readonly guardianBars: HTMLElement[];
  private readonly nextStep: HTMLElement;
  private readonly incantationEcho: HTMLElement;
  private readonly incantationEchoText: HTMLElement;
  private readonly artifactCount: HTMLElement;
  private readonly notes: HTMLElement;
  private readonly victory: HTMLElement;
  private casting = false;
  private voiceState: VoiceCastingState = "idle";
  private currentStage: "idle" | "listening" | "writing" | "manifesting" = "idle";

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <main class="game-shell">
        <canvas class="game-canvas" aria-label="The Unwritten Spell game world"></canvas>
        <div class="vignette" aria-hidden="true"></div>
        <header class="title-lockup">
          <p class="eyebrow">THE CODEX PRESENTS</p>
          <h1>The Unwritten Spell</h1>
          <p class="subtitle">未寫之咒</p>
        </header>
        <div class="runtime-badge"><span></span> LIVE GENERATIVE RUNTIME · SDK v0</div>

        <section class="next-step-card" aria-live="polite" aria-hidden="true">
          <span></span>
          <p></p>
        </section>

        <section class="incantation-echo" aria-live="polite" aria-hidden="true">
          <span>你說</span>
          <p class="incantation-echo-text"></p>
        </section>

        <section class="objective-card" aria-label="Objective">
          <p class="section-label">UNWRITTEN OBJECTIVE</p>
          <p>Reach the passage. You have no hands.</p>
          <ol>
            <li>Write a way around the guardian</li>
            <li>Make the key open the seal</li>
          </ol>
        </section>

        <section class="status-card" aria-label="Player status">
          <div class="stat-line"><span>VITAL INK</span><span>HP</span></div>
          <div class="bar"><i class="bar-health" data-player-health></i></div>
          <div class="stat-line"><span>WRITING POWER</span><span>MANA</span></div>
          <div class="bar mana"><i class="bar-mana"></i></div>
          <div class="artifact-line">ACTIVE MARGINALIA <strong>0</strong></div>
        </section>

        <section class="guardian-status" aria-label="Guardian status">
          <span>THE REDACTOR</span>
          <div class="bar enemy"><i data-guardian-health></i></div>
        </section>

        <section class="mobile-combat-hud" aria-label="Combat health">
          <div class="mobile-player-health">
            <span>YOU</span>
            <div><i data-player-health></i></div>
          </div>
          <div class="mobile-guardian-health">
            <span>THE REDACTOR</span>
            <div><i data-guardian-health></i></div>
          </div>
        </section>

        <div class="quill-stage" aria-live="polite">
          <span class="quill-mark">✦</span>
          <span class="stage-text">按住 V 或「按住說話」・說完放開就會施法</span>
          <span class="ink-loader" aria-hidden="true"><i></i><i></i><i></i></span>
        </div>

        <section class="mobile-controls" aria-label="Mobile game controls">
          <div class="virtual-joystick mobile-touch-control" aria-label="移動搖桿" aria-disabled="false">
            <span class="joystick-ring" aria-hidden="true"></span>
            <span class="joystick-knob" aria-hidden="true"><i></i></span>
          </div>
          <button class="mic-button mobile-mic-button mobile-touch-control" type="button" aria-label="按住說出咒語">
            <span class="mobile-mic-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="presentation">
                <path d="M12 15.25a3.25 3.25 0 0 0 3.25-3.25V6a3.25 3.25 0 0 0-6.5 0v6A3.25 3.25 0 0 0 12 15.25Z" />
                <path d="M5.75 11.5v.5a6.25 6.25 0 0 0 12.5 0v-.5M12 18.25V22M8.75 22h6.5" />
              </svg>
            </span>
            <strong class="mic-label">按住詠唱</strong>
            <span class="mobile-mic-hint">說完放開</span>
          </button>
        </section>

        <section class="spell-console">
          <div class="spell-meta">
            <span>OPENAI · GENERATING NEW SOURCE</span>
            <span>Focus: <strong>Guardian</strong></span>
          </div>
          <form>
            <span class="prompt-glyph">“</span>
            <input
              aria-label="Incantation"
              autocomplete="off"
              maxlength="140"
              placeholder="說出世界裡原本不存在的法則……"
            />
            <button class="mic-button" type="button" aria-label="按住說出咒語">
              <span class="mic-dot"></span><strong class="mic-label">按住說話</strong><kbd>V</kbd>
            </button>
            <button class="cast-button" type="submit">詠唱 <kbd>↵</kbd></button>
          </form>
          <div class="spell-examples" aria-label="Example incantations">
            ${SPELL_EXAMPLES.map(
              ({ label, utterance }) => `<button data-spell="${utterance}">${label}</button>`,
            ).join("")}
          </div>
          <p class="controls"><kbd>WASD</kbd> MOVE · <kbd>SPACE</kbd> DASH · HOLD <kbd>V</kbd> SPEAK</p>
        </section>

        <aside class="quill-notes" aria-live="polite"></aside>

        <section class="victory-panel" aria-hidden="true">
          <p class="eyebrow">THE SENTENCE CONTINUES</p>
          <h2>You reached the unwritten passage.</h2>
          <p>每一條路，都是你剛才教會世界的新文法。</p>
          <button type="button" data-restart>Rewrite the room</button>
        </section>
      </main>
    `;

    this.canvas = root.querySelector<HTMLCanvasElement>("canvas")!;
    this.form = root.querySelector<HTMLFormElement>("form")!;
    this.input = root.querySelector<HTMLInputElement>("input")!;
    this.castButton = this.form.querySelector<HTMLButtonElement>(".cast-button")!;
    this.micButtons = [...root.querySelectorAll<HTMLButtonElement>(".mic-button")];
    this.micLabels = this.micButtons.map((button) => button.querySelector<HTMLElement>(".mic-label")!);
    this.mobileJoystick = root.querySelector<HTMLElement>(".virtual-joystick")!;
    this.mobileJoystickKnob = this.mobileJoystick.querySelector<HTMLElement>(".joystick-knob")!;
    this.stage = root.querySelector<HTMLElement>(".quill-stage")!;
    this.manaBar = root.querySelector<HTMLElement>(".bar-mana")!;
    this.healthBars = [...root.querySelectorAll<HTMLElement>("[data-player-health]")];
    this.guardianBars = [...root.querySelectorAll<HTMLElement>("[data-guardian-health]")];
    this.nextStep = root.querySelector<HTMLElement>(".next-step-card")!;
    this.incantationEcho = root.querySelector<HTMLElement>(".incantation-echo")!;
    this.incantationEchoText = this.incantationEcho.querySelector<HTMLElement>(
      ".incantation-echo-text",
    )!;
    this.artifactCount = root.querySelector<HTMLElement>(".artifact-line strong")!;
    this.notes = root.querySelector<HTMLElement>(".quill-notes")!;
    this.victory = root.querySelector<HTMLElement>(".victory-panel")!;

    const examples = root.querySelectorAll<HTMLButtonElement>("[data-spell]");
    for (const example of examples) {
      example.addEventListener("click", () => {
        for (const candidate of examples) candidate.classList.remove("selected");
        example.classList.add("selected");
        this.input.value = example.dataset.spell ?? "";
        this.input.focus();
      });
    }
    this.input.addEventListener("input", () => {
      for (const example of examples) example.classList.remove("selected");
    });
    root.querySelector<HTMLButtonElement>("[data-restart]")?.addEventListener("click", () =>
      window.location.reload(),
    );
  }

  onCast(handler: (utterance: string) => void): void {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const utterance = this.input.value.trim();
      if (!utterance) return;
      handler(utterance);
    });
  }

  onVoiceInput(start: () => void, stop: () => void): void {
    for (const button of this.micButtons) {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        start();
        try {
          button.setPointerCapture(event.pointerId);
        } catch {
          // Recording already started; release on the button still completes the gesture.
        }
      });
      const finish = (event: PointerEvent): void => {
        if (button.hasPointerCapture(event.pointerId)) {
          button.releasePointerCapture(event.pointerId);
        }
        stop();
      };
      button.addEventListener("pointerup", finish);
      button.addEventListener("pointercancel", finish);
    }
  }

  setCasting(casting: boolean): void {
    this.casting = casting;
    this.syncInputAvailability();
    this.stage.classList.toggle("is-writing", casting || this.voiceState === "transcribing");
    if (casting) this.input.blur();
    this.syncMicPresentation();
  }

  setVoiceState(state: VoiceCastingState): void {
    this.voiceState = state;
    this.syncInputAvailability();
    for (const button of this.micButtons) {
      button.classList.toggle("is-recording", state === "recording");
    }
    this.stage.classList.toggle("is-listening", state === "requesting" || state === "recording");
    this.stage.classList.toggle("is-writing", this.casting || state === "transcribing");

    const labels: Record<VoiceCastingState, string> = {
      idle: "按住 V 或「按住說話」・說完放開就會施法",
      requesting: "正在請求麥克風權限……",
      recording: "正在聽你說話・說完放開就會施法",
      transcribing: "旁註正在辨認你的咒語……",
    };
    this.stage.querySelector<HTMLElement>(".stage-text")!.textContent = labels[state];
    this.syncMicPresentation();
  }

  setStage(stage: "idle" | "listening" | "writing" | "manifesting"): void {
    this.currentStage = stage;
    const labels = {
      idle: "按住 V 或「按住說話」・說完放開就會施法",
      listening: "旁註正在聽",
      writing: "旁註正在把你的話寫進世界……",
      manifesting: "墨跡開始具現",
    };
    this.stage.querySelector<HTMLElement>(".stage-text")!.textContent = labels[stage];
    this.syncMicPresentation();
  }

  clearIncantation(): void {
    this.input.value = "";
    this.incantationEcho.classList.remove("visible");
    this.incantationEcho.setAttribute("aria-hidden", "true");
    for (const example of document.querySelectorAll("[data-spell]")) {
      example.classList.remove("selected");
    }
  }

  setIncantation(utterance: string): void {
    this.input.value = utterance;
    this.incantationEchoText.textContent = utterance;
    this.incantationEcho.classList.add("visible");
    this.incantationEcho.setAttribute("aria-hidden", "false");
  }

  pushNote(note: QuillNote): void {
    const element = document.createElement("p");
    element.className = `quill-note tone-${note.tone}`;
    element.innerHTML = `<span>旁註</span>${note.text}`;
    this.notes.append(element);
    requestAnimationFrame(() => element.classList.add("visible"));
    window.setTimeout(() => {
      element.classList.remove("visible");
      window.setTimeout(() => element.remove(), 350);
    }, 5200);
  }

  update(state: HudState): void {
    this.manaBar.style.width = `${(state.mana / state.maximumMana) * 100}%`;
    for (const bar of this.healthBars) bar.style.width = `${(state.playerHp / state.playerMaxHp) * 100}%`;
    for (const bar of this.guardianBars) bar.style.width = `${(state.guardianHp / state.guardianMaxHp) * 100}%`;
    this.artifactCount.textContent = String(state.artifacts);
    if (state.guardianHp <= 0) document.body.classList.add("guardian-defeated");

    const guidance = nextStepGuidance({
      guardianDefeated: state.guardianHp <= 0,
      doorUnlocked: state.doorUnlocked,
      completed: state.completed,
    });
    this.nextStep.querySelector("span")!.textContent = guidance?.label ?? "";
    this.nextStep.querySelector("p")!.textContent = guidance?.text ?? "";
    this.nextStep.classList.toggle("visible", Boolean(guidance));
    this.nextStep.setAttribute("aria-hidden", String(!guidance));

    if (state.completed) {
      this.victory.classList.add("visible");
      this.victory.setAttribute("aria-hidden", "false");
    }
  }

  private syncInputAvailability(): void {
    const voiceBusy = this.voiceState !== "idle";
    this.input.disabled = this.casting || voiceBusy;
    this.castButton.disabled = this.casting || voiceBusy;
    for (const button of this.micButtons) {
      button.disabled = this.casting || this.voiceState === "transcribing";
    }
  }

  private syncMicPresentation(): void {
    const byVoiceState: Record<VoiceCastingState, string> = {
      idle: "按住詠唱",
      requesting: "正在啟用…",
      recording: "說完放開",
      transcribing: "辨認中…",
    };
    const label =
      this.voiceState !== "idle"
        ? byVoiceState[this.voiceState]
        : this.casting || this.currentStage === "writing"
          ? "書寫中…"
          : this.currentStage === "manifesting"
            ? "具現中…"
            : byVoiceState.idle;
    const ariaLabel =
      this.voiceState === "recording"
        ? "正在錄音，說完放開即可施法"
        : this.casting
          ? "旁註正在書寫咒語"
          : "按住說出咒語";
    for (const micLabel of this.micLabels) micLabel.textContent = label;
    for (const button of this.micButtons) button.setAttribute("aria-label", ariaLabel);
  }
}

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
  private readonly form: HTMLFormElement;
  private readonly input: HTMLInputElement;
  private readonly castButton: HTMLButtonElement;
  private readonly micButton: HTMLButtonElement;
  private readonly stage: HTMLElement;
  private readonly manaBar: HTMLElement;
  private readonly healthBar: HTMLElement;
  private readonly guardianBar: HTMLElement;
  private readonly nextStep: HTMLElement;
  private readonly artifactCount: HTMLElement;
  private readonly notes: HTMLElement;
  private readonly victory: HTMLElement;
  private casting = false;
  private voiceState: VoiceCastingState = "idle";

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
          <div class="bar"><i class="bar-health"></i></div>
          <div class="stat-line"><span>WRITING POWER</span><span>MANA</span></div>
          <div class="bar mana"><i class="bar-mana"></i></div>
          <div class="artifact-line">ACTIVE MARGINALIA <strong>0</strong></div>
        </section>

        <section class="guardian-status" aria-label="Guardian status">
          <span>THE REDACTOR</span>
          <div class="bar enemy"><i></i></div>
        </section>

        <div class="quill-stage" aria-live="polite">
          <span class="quill-mark">✦</span>
          <span class="stage-text">旁註正在等待一句話</span>
          <span class="ink-loader" aria-hidden="true"><i></i><i></i><i></i></span>
        </div>

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
              <span></span> 說話 <kbd>V</kbd>
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
    this.micButton = this.form.querySelector<HTMLButtonElement>(".mic-button")!;
    this.stage = root.querySelector<HTMLElement>(".quill-stage")!;
    this.manaBar = root.querySelector<HTMLElement>(".bar-mana")!;
    this.healthBar = root.querySelector<HTMLElement>(".bar-health")!;
    this.guardianBar = root.querySelector<HTMLElement>(".guardian-status .bar i")!;
    this.nextStep = root.querySelector<HTMLElement>(".next-step-card")!;
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
    this.micButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.micButton.setPointerCapture(event.pointerId);
      start();
    });
    const finish = (event: PointerEvent): void => {
      if (this.micButton.hasPointerCapture(event.pointerId)) {
        this.micButton.releasePointerCapture(event.pointerId);
      }
      stop();
    };
    this.micButton.addEventListener("pointerup", finish);
    this.micButton.addEventListener("pointercancel", finish);
  }

  setCasting(casting: boolean): void {
    this.casting = casting;
    this.syncInputAvailability();
    this.stage.classList.toggle("is-writing", casting || this.voiceState === "transcribing");
    if (casting) this.input.blur();
  }

  setVoiceState(state: VoiceCastingState): void {
    this.voiceState = state;
    this.syncInputAvailability();
    this.micButton.classList.toggle("is-recording", state === "recording");
    this.stage.classList.toggle("is-listening", state === "requesting" || state === "recording");
    this.stage.classList.toggle("is-writing", this.casting || state === "transcribing");

    const labels: Record<VoiceCastingState, string> = {
      idle: "旁註正在等待一句話",
      requesting: "正在請求麥克風權限……",
      recording: "正在聽。放開 V 就施放",
      transcribing: "旁註正在辨認你的咒語……",
    };
    this.stage.querySelector<HTMLElement>(".stage-text")!.textContent = labels[state];
  }

  setStage(stage: "idle" | "listening" | "writing" | "manifesting"): void {
    const labels = {
      idle: "旁註正在等待一句話",
      listening: "旁註正在聽",
      writing: "旁註正在把你的話寫進世界……",
      manifesting: "墨跡開始具現",
    };
    this.stage.querySelector<HTMLElement>(".stage-text")!.textContent = labels[stage];
  }

  clearIncantation(): void {
    this.input.value = "";
    for (const example of document.querySelectorAll("[data-spell]")) {
      example.classList.remove("selected");
    }
  }

  setIncantation(utterance: string): void {
    this.input.value = utterance;
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
    this.healthBar.style.width = `${(state.playerHp / state.playerMaxHp) * 100}%`;
    this.guardianBar.style.width = `${(state.guardianHp / state.guardianMaxHp) * 100}%`;
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
    this.micButton.disabled = this.casting || this.voiceState === "transcribing";
  }
}

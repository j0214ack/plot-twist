import type { DemoSessionView } from "./demo-session";

export class DemoAccessOverlay implements DemoSessionView {
  private readonly overlay: HTMLElement;
  private readonly form: HTMLFormElement;
  private readonly input: HTMLInputElement;
  private readonly error: HTMLElement;

  constructor(root: HTMLElement) {
    this.overlay = document.createElement("section");
    this.overlay.className = "demo-access-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="demo-access-panel" role="dialog" aria-modal="true" aria-labelledby="demo-access-title">
        <p class="eyebrow">PRIVATE PLAYTEST · CODEX SEALED</p>
        <h2 id="demo-access-title">The margin is not public yet.</h2>
        <p>這幾天的隊內試玩先由 access code 保護。Demo Day 會直接開放進入。</p>
        <form>
          <label for="demo-access-code">ACCESS CODE</label>
          <div>
            <input
              id="demo-access-code"
              name="access-code"
              type="password"
              autocomplete="current-password"
              required
              aria-describedby="demo-access-error"
            />
            <button type="submit">UNSEAL</button>
          </div>
          <p id="demo-access-error" class="demo-access-error" aria-live="polite"></p>
        </form>
      </div>
    `;
    root.querySelector(".game-shell")?.append(this.overlay);
    this.form = this.overlay.querySelector("form")!;
    this.input = this.overlay.querySelector("input")!;
    this.error = this.overlay.querySelector(".demo-access-error")!;
  }

  onUnlock(handler: (accessCode: string) => void): void {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const accessCode = this.input.value;
      if (!accessCode) return;
      this.error.textContent = "正在核對法典封印……";
      handler(accessCode);
    });
  }

  showAccessGate(): void {
    this.overlay.classList.add("visible");
    this.overlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => this.input.focus());
  }

  showAccessError(message: string): void {
    this.error.textContent = message;
    this.input.select();
  }

  dismissAccessGate(): void {
    this.overlay.classList.remove("visible");
    this.overlay.setAttribute("aria-hidden", "true");
    this.input.value = "";
    this.error.textContent = "";
  }
}


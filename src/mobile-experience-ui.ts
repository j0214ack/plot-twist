import type { MobileExperienceState } from "./mobile-experience";

export class MobileExperienceUi {
  private readonly experienceNotice: HTMLElement;
  private readonly portraitGate: HTMLElement;
  private readonly continueButton: HTMLButtonElement;

  constructor(private readonly root: HTMLElement) {
    this.experienceNotice = document.createElement("section");
    this.experienceNotice.className = "mobile-experience-notice";
    this.experienceNotice.setAttribute("aria-hidden", "true");
    this.experienceNotice.innerHTML = `
      <div role="dialog" aria-modal="true" aria-labelledby="mobile-experience-title">
        <p class="eyebrow">A WIDER MARGIN IS BETTER</p>
        <h2 id="mobile-experience-title">用電腦，世界會更完整。</h2>
        <p>這個 PoC 的最佳體驗仍在電腦上。如果你要用手機，建議先從瀏覽器選單<strong>「加入主畫面」</strong>，再從主畫面開啟，就能用接近全螢幕的橫向模式遊玩。</p>
        <div class="mobile-install-hint" aria-label="Add to Home Screen steps">
          <span>分享／選單</span><i>→</i><span>加入主畫面</span><i>→</i><span>橫向開啟</span>
        </div>
        <button type="button" data-mobile-continue>仍要在瀏覽器繼續</button>
      </div>
    `;

    this.portraitGate = document.createElement("section");
    this.portraitGate.className = "mobile-portrait-gate";
    this.portraitGate.setAttribute("aria-hidden", "true");
    this.portraitGate.innerHTML = `
      <div role="alert" aria-live="assertive">
        <span class="rotate-device" aria-hidden="true">▭</span>
        <p class="eyebrow">LANDSCAPE ONLY</p>
        <h2>請把手機轉成橫向</h2>
        <p>魔法需要更寬的書頁。</p>
      </div>
    `;

    root.querySelector(".game-shell")?.append(this.experienceNotice, this.portraitGate);
    this.continueButton = this.experienceNotice.querySelector("[data-mobile-continue]")!;
  }

  onContinue(handler: () => void): void {
    this.continueButton.addEventListener("click", handler);
  }

  render(state: MobileExperienceState): void {
    this.root.classList.toggle("mobile-mode", state.mobile);
    this.root.classList.toggle("mobile-controls-enabled", state.mobile && state.controlsEnabled);
    this.root.classList.toggle("desktop-mode", !state.mobile);
    this.toggle(this.experienceNotice, state.showExperienceNotice);
    this.toggle(this.portraitGate, state.blockForPortrait);
  }

  private toggle(element: HTMLElement, visible: boolean): void {
    element.classList.toggle("visible", visible);
    element.setAttribute("aria-hidden", String(!visible));
  }
}

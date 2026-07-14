export interface StartupLoadingView {
  dismiss(): void;
}

export class DomStartupLoadingView implements StartupLoadingView {
  constructor(private readonly element: HTMLElement) {}

  dismiss(): void {
    this.element.classList.add("is-complete");
    this.element.setAttribute("aria-hidden", "true");
  }
}

export class StartupLoadingController {
  private sessionSettled = false;
  private worldRendered = false;
  private dismissed = false;

  constructor(private readonly view: StartupLoadingView) {}

  markSessionSettled(): void {
    this.sessionSettled = true;
    this.dismissIfReady();
  }

  markWorldRendered(): void {
    this.worldRendered = true;
    this.dismissIfReady();
  }

  private dismissIfReady(): void {
    if (this.dismissed || !this.sessionSettled || !this.worldRendered) return;
    this.dismissed = true;
    this.view.dismiss();
  }
}

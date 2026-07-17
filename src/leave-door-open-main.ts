import "./leave-door-open.css";
import {
  DemoSessionClient,
  DemoSessionController,
  type DemoSessionView,
} from "./demo-session";
import {
  busyStatusText,
  HttpLeaveDoorOpenTransport,
  LeaveDoorOpenBrowserController,
  ChronologicalScreenTranscript,
  parseScreenPossibilities,
  screenOffersNamedFocus,
  type LeaveDoorOpenBusyOperation,
  type LeaveDoorOpenBrowserView,
} from "./leave-door-open-client";
import {
  isGameLocale,
  localize,
  type GameLocale,
  type PlayerCopyKey,
} from "../pocs/leave-the-door-open/src/localization";

const requestedLocale = new URLSearchParams(window.location.search).get(
  "locale",
);
const locale =
  (isGameLocale(requestedLocale) ? requestedLocale : undefined) ?? "zh-TW";

const applyBrowserCopy = (activeLocale: GameLocale): void => {
  document.documentElement.lang = activeLocale === "zh-TW" ? "zh-Hant" : "en";
  document.title = localize(activeLocale, "browser.documentTitle");
  document
    .querySelector<HTMLMetaElement>('meta[name="description"]')
    ?.setAttribute("content", localize(activeLocale, "browser.description"));

  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-copy-key]",
  )) {
    element.textContent = localize(
      activeLocale,
      element.dataset.copyKey as PlayerCopyKey,
    );
  }
  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-copy-placeholder]",
  )) {
    element.setAttribute(
      "placeholder",
      localize(
        activeLocale,
        element.dataset.copyPlaceholder as PlayerCopyKey,
      ),
    );
  }
  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-copy-aria-label]",
  )) {
    element.setAttribute(
      "aria-label",
      localize(
        activeLocale,
        element.dataset.copyAriaLabel as PlayerCopyKey,
      ),
    );
  }

  document
    .querySelector<HTMLElement>("#ldo-possibilities")
    ?.setAttribute(
      "data-empty-label",
      localize(activeLocale, "browser.emptyPossibilities"),
    );
  for (const link of document.querySelectorAll<HTMLAnchorElement>(
    "[data-locale]",
  )) {
    if (link.dataset.locale === activeLocale) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
};

applyBrowserCopy(locale);

const required = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing ${selector}`);
  return element;
};

const accessPanel = required<HTMLElement>("#ldo-access-panel");
const accessForm = required<HTMLFormElement>("#ldo-access-form");
const accessInput = required<HTMLInputElement>("#ldo-access-code");
const accessError = required<HTMLElement>("#ldo-access-error");
const playPanel = required<HTMLElement>("#ldo-play-panel");
const focusControls = required<HTMLElement>("#ldo-focus-controls");
const screen = required<HTMLElement>("#ldo-screen");
const possibilities = required<HTMLElement>("#ldo-possibilities");
const thoughtForm = required<HTMLFormElement>("#ldo-thought-form");
const thoughtInput = required<HTMLTextAreaElement>("#ldo-thought");
const status = required<HTMLElement>("#ldo-status");
const error = required<HTMLElement>("#ldo-error");
const newGame = required<HTMLButtonElement>("#ldo-new-game");
const playControls = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-play-control]"),
];

let submitInput: (input: string) => void = () => undefined;

class DomLeaveDoorOpenView implements LeaveDoorOpenBrowserView {
  #busy = false;
  #ended = false;
  #hasServerScreen = false;
  readonly #transcript: ChronologicalScreenTranscript;

  constructor(private readonly locale: GameLocale) {
    this.#transcript = new ChronologicalScreenTranscript(locale);
  }

  setBusy(busy: boolean, operation: LeaveDoorOpenBusyOperation): void {
    this.#busy = busy;
    status.textContent = busyStatusText(busy, operation, this.locale);
    playPanel.setAttribute("aria-busy", String(busy));
    this.#syncControls();
  }

  async showScreen(nextScreen: string): Promise<void> {
    const reset = !this.#hasServerScreen || this.#ended;
    const lines = reset
      ? this.#transcript.reset(nextScreen)
      : this.#transcript.reconcile(nextScreen);
    if (reset) {
      screen.textContent = "";
      this.#appendLines(lines);
    } else {
      this.#appendLines(lines);
    }
    this.#hasServerScreen = true;
    focusControls.hidden = !screenOffersNamedFocus(nextScreen, this.locale);
    possibilities.replaceChildren(
      ...parseScreenPossibilities(nextScreen, this.locale).map(({ number, label }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.playControl = "";
        button.textContent = `${number}. ${label}`;
        button.addEventListener("click", () => submitInput(String(number)));
        button.disabled = this.#busy || this.#ended;
        return button;
      }),
    );
    error.textContent = "";
  }

  showPlayerInput(input: string): void {
    this.#appendLines(this.#transcript.appendPlayerInput(input));
  }

  showError(message: string): void {
    error.textContent = message;
  }

  setEnded(ended: boolean): void {
    this.#ended = ended;
    newGame.hidden = !ended;
    if (ended) status.textContent = localize(this.locale, "browser.ended");
    this.#syncControls();
  }

  #syncControls(): void {
    for (const control of playControls) {
      control.disabled = this.#busy || this.#ended;
    }
    for (const control of possibilities.querySelectorAll<HTMLButtonElement>("button")) {
      control.disabled = this.#busy || this.#ended;
    }
    thoughtInput.disabled = this.#busy || this.#ended;
  }

  #appendLines(lines: string[]): void {
    for (const line of lines) this.#appendLine(line);
  }

  #appendLine(line: string): void {
    screen.textContent = [screen.textContent ?? "", line]
      .filter((part) => part.length > 0)
      .join("\n");
    screen.scrollTop = screen.scrollHeight;
  }
}

const view = new DomLeaveDoorOpenView(locale);
const controller = new LeaveDoorOpenBrowserController(
  new HttpLeaveDoorOpenTransport(),
  view,
  {
    locale,
    waitBetweenTurns: () =>
      new Promise((resolve) => {
        setTimeout(resolve, 2_500);
      }),
  },
);
submitInput = (input) => void controller.submit(input);

for (const control of document.querySelectorAll<HTMLButtonElement>("[data-command]")) {
  control.addEventListener("click", () => submitInput(control.dataset.command ?? ""));
}
thoughtForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const thought = thoughtInput.value.trim();
  if (!thought) return;
  thoughtInput.value = "";
  submitInput(thought);
});
newGame.addEventListener("click", () => void controller.start());

const enterPlaytest = async (): Promise<void> => {
  accessPanel.hidden = true;
  accessForm.hidden = true;
  playPanel.hidden = false;
  await controller.start();
  thoughtInput.focus();
};

class DomDemoSessionView implements DemoSessionView {
  showAccessGate(): void {
    accessPanel.hidden = false;
    accessForm.hidden = false;
    requestAnimationFrame(() => accessInput.focus());
  }

  showAccessError(message: string): void {
    accessError.textContent =
      message === "Access code 不正確，請再試一次。"
        ? localize(locale, "browser.invalidAccessCode")
        : message;
    accessInput.select();
  }

  dismissAccessGate(): void {
    accessPanel.hidden = true;
    accessForm.hidden = true;
    accessInput.value = "";
    accessError.textContent = "";
    void enterPlaytest();
  }
}

const demoSession = new DemoSessionController(
  new DemoSessionClient(),
  new DomDemoSessionView(),
);

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = accessInput.value;
  if (!code) return;
  accessError.textContent = localize(locale, "browser.checking");
  void demoSession.unlock(code);
});

void demoSession.start();

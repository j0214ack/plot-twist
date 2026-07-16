import "./leave-door-open.css";
import {
  DemoSessionClient,
  DemoSessionController,
  type DemoSessionView,
} from "./demo-session";
import {
  HttpLeaveDoorOpenTransport,
  LeaveDoorOpenBrowserController,
  parseScreenPossibilities,
  screenOffersNamedFocus,
  type LeaveDoorOpenBrowserView,
} from "./leave-door-open-client";

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

  setBusy(busy: boolean): void {
    this.#busy = busy;
    status.textContent = busy ? "角色正在想……" : "";
    playPanel.setAttribute("aria-busy", String(busy));
    this.#syncControls();
  }

  showScreen(nextScreen: string): void {
    focusControls.hidden = !screenOffersNamedFocus(nextScreen);
    screen.textContent = nextScreen;
    screen.scrollTop = screen.scrollHeight;
    possibilities.replaceChildren(
      ...parseScreenPossibilities(nextScreen).map(({ number, label }) => {
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

  showError(message: string): void {
    error.textContent = message;
  }

  setEnded(ended: boolean): void {
    this.#ended = ended;
    newGame.hidden = !ended;
    if (ended) status.textContent = "這一段試玩已結束。";
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
}

const view = new DomLeaveDoorOpenView();
const controller = new LeaveDoorOpenBrowserController(
  new HttpLeaveDoorOpenTransport(),
  view,
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
    accessError.textContent = message;
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
  accessError.textContent = "正在確認……";
  void demoSession.unlock(code);
});

void demoSession.start();

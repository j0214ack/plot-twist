import {
  localize,
  type GameLocale,
} from "../pocs/leave-the-door-open/src/localization";

export type LeaveDoorOpenClientResult = {
  sessionId: string;
  ended: boolean;
  advancePending: boolean;
  dialogueResolutionPending: boolean;
  screen: string;
};

export interface LeaveDoorOpenTransport {
  startSession(locale: GameLocale): Promise<LeaveDoorOpenClientResult>;
  submitInput(
    sessionId: string,
    input: string,
  ): Promise<LeaveDoorOpenClientResult>;
  resolveDialogue(sessionId: string): Promise<LeaveDoorOpenClientResult>;
  advanceTurn(sessionId: string): Promise<LeaveDoorOpenClientResult>;
}

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export class LeaveDoorOpenTransportError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "LeaveDoorOpenTransportError";
  }
}

export class HttpLeaveDoorOpenTransport implements LeaveDoorOpenTransport {
  constructor(private readonly fetcher: Fetcher = fetch) {}

  startSession(locale: GameLocale): Promise<LeaveDoorOpenClientResult> {
    return this.#post("/api/leave-the-door-open/sessions", { locale });
  }

  submitInput(
    sessionId: string,
    input: string,
  ): Promise<LeaveDoorOpenClientResult> {
    return this.#post(
      `/api/leave-the-door-open/sessions/${encodeURIComponent(sessionId)}/input`,
      { input },
    );
  }

  advanceTurn(sessionId: string): Promise<LeaveDoorOpenClientResult> {
    return this.#post(
      `/api/leave-the-door-open/sessions/${encodeURIComponent(sessionId)}/advance`,
      {},
    );
  }

  resolveDialogue(sessionId: string): Promise<LeaveDoorOpenClientResult> {
    return this.#post(
      `/api/leave-the-door-open/sessions/${encodeURIComponent(sessionId)}/resolve-dialogue`,
      {},
    );
  }

  async #post(path: string, body: unknown): Promise<LeaveDoorOpenClientResult> {
    const response = await this.fetcher.call(globalThis, path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      sessionId?: unknown;
      ended?: unknown;
      advancePending?: unknown;
      dialogueResolutionPending?: unknown;
      screen?: unknown;
      error?: unknown;
    };
    if (!response.ok) {
      throw new LeaveDoorOpenTransportError(
        typeof payload.error === "string"
          ? payload.error
          : `Playtest request failed: ${response.status}`,
        response.status,
      );
    }
    if (
      typeof payload.sessionId !== "string" ||
      typeof payload.ended !== "boolean" ||
      typeof payload.advancePending !== "boolean" ||
      typeof payload.dialogueResolutionPending !== "boolean" ||
      typeof payload.screen !== "string"
    ) {
      throw new Error("Playtest response is incomplete");
    }
    return {
      sessionId: payload.sessionId,
      ended: payload.ended,
      advancePending: payload.advancePending,
      dialogueResolutionPending: payload.dialogueResolutionPending,
      screen: payload.screen,
    };
  }
}

export type LeaveDoorOpenBusyOperation =
  | "starting"
  | "dialogue"
  | "time"
  | "command";

export const busyStatusText = (
  busy: boolean,
  operation: LeaveDoorOpenBusyOperation,
  locale: GameLocale = "zh-TW",
): string => {
  if (!busy) return "";
  switch (operation) {
    case "dialogue":
      return localize(locale, "browser.busyDialogue");
    case "time":
      return localize(locale, "browser.busyTime");
    case "starting":
      return localize(locale, "browser.busyStarting");
    case "command":
      return localize(locale, "browser.busyCommand");
  }
};

export interface LeaveDoorOpenBrowserView {
  setBusy(busy: boolean, operation: LeaveDoorOpenBusyOperation): void;
  showScreen(screen: string): void | Promise<void>;
  showPlayerInput(input: string): void;
  showError(message: string): void;
  setEnded(ended: boolean): void;
}

export type ScreenPossibility = { number: number; label: string };

export class ChronologicalScreenTranscript {
  #latestServerLines: string[] = [];
  #pendingPlayerLines: string[] = [];

  constructor(private readonly locale: GameLocale = "en") {}

  reset(screen: string): string[] {
    this.#latestServerLines = visibleScreenLines(screen);
    this.#pendingPlayerLines = [];
    return [...this.#latestServerLines];
  }

  appendPlayerInput(input: string): string[] {
    const lines = input.split(/\r?\n/);
    this.#pendingPlayerLines = lines.map((line, index) =>
      index === 0 ? `${localize(this.locale, "ui.you")}: ${line}` : line,
    );
    return [...this.#pendingPlayerLines];
  }

  reconcile(screen: string): string[] {
    const nextServerLines = visibleScreenLines(screen);
    const additions = addedSequenceLines(
      this.#latestServerLines,
      nextServerLines,
    );
    removeFirstSequence(additions, this.#pendingPlayerLines);
    this.#latestServerLines = nextServerLines;
    this.#pendingPlayerLines = [];
    return additions;
  }
}

export const parseScreenPossibilities = (
  screen: string,
  locale: GameLocale = "en",
): ScreenPossibility[] => {
  const lines = screen.split(/\r?\n/);
  const heading = lines.findIndex(
    (line) => line.trim() === localize(locale, "ui.possibilities"),
  );
  if (heading < 0) return [];

  const possibilities: ScreenPossibility[] = [];
  for (const line of lines.slice(heading + 1)) {
    const match = /^(\d+)\.\s+(.+)$/.exec(line.trim());
    if (match === null) break;
    const number = Number(match[1]);
    if (!Number.isSafeInteger(number) || number < 1) break;
    possibilities.push({ number, label: match[2]! });
  }
  return possibilities;
};

export const screenOffersNamedFocus = (
  screen: string,
  locale: GameLocale = "en",
): boolean =>
  locale === "zh-TW"
    ? /^第一章——第 \d+ 天$/m.test(screen)
    : /^Chapter 1 — Day \d+$/m.test(screen);

export class LeaveDoorOpenBrowserController {
  #sessionId: string | null = null;
  #busy = false;
  #latestScreen: string | null = null;

  constructor(
    private readonly transport: LeaveDoorOpenTransport,
    private readonly view: LeaveDoorOpenBrowserView,
    private readonly options: {
      waitBetweenTurns: () => Promise<void>;
      locale?: GameLocale;
    } = {
      waitBetweenTurns: () =>
        new Promise((resolve) => {
          setTimeout(resolve, 2_500);
        }),
    },
  ) {}

  async start(): Promise<void> {
    if (this.#busy) return;
    this.#sessionId = null;
    this.#latestScreen = null;
    await this.#run("starting", async () => {
      const result = await this.transport.startSession(
        this.options.locale ?? "zh-TW",
      );
      this.#sessionId = result.sessionId;
      await this.#present(result);
    });
  }

  async submit(input: string): Promise<void> {
    if (this.#busy || this.#sessionId === null) return;
    const sessionId = this.#sessionId;
    if (isConversationalInput(input)) {
      this.view.showPlayerInput(input);
    }
    const operation = operationForInput(input);
    await this.#run(
      operation,
      async () => {
        let result = await this.transport.submitInput(sessionId, input);
        let presented = await this.#present(result);
        while (result.dialogueResolutionPending && !result.ended) {
          result = await this.transport.resolveDialogue(sessionId);
          presented = await this.#present(result);
        }
        while (result.advancePending && !result.ended) {
          if (presented) await this.options.waitBetweenTurns();
          result = await this.transport.advanceTurn(sessionId);
          presented = await this.#present(result);
        }
        if (result.ended) this.#sessionId = null;
      },
      (error) => {
        if (
          error instanceof LeaveDoorOpenTransportError &&
          error.status === 404
        ) {
          this.#sessionId = null;
          this.view.setEnded(true);
        }
      },
    );
  }

  async #present(result: LeaveDoorOpenClientResult): Promise<boolean> {
    const changed = result.screen !== this.#latestScreen;
    await this.view.showScreen(result.screen);
    this.#latestScreen = result.screen;
    this.view.setEnded(result.ended);
    return changed;
  }

  async #run(
    operation: LeaveDoorOpenBusyOperation,
    task: () => Promise<void>,
    onError?: (error: unknown) => void,
  ): Promise<void> {
    this.#busy = true;
    this.view.setBusy(true, operation);
    try {
      await task();
    } catch (error) {
      onError?.(error);
      this.view.showError(
        error instanceof LeaveDoorOpenTransportError && error.status === 404
          ? localize(
              this.options.locale ?? "zh-TW",
              "browser.sessionExpired",
            )
          : error instanceof Error
          ? error.message
          : localize(
              this.options.locale ?? "zh-TW",
              "browser.serviceUnavailable",
            ),
      );
    } finally {
      this.#busy = false;
      this.view.setBusy(false, operation);
    }
  }
}

const isConversationalInput = (input: string): boolean => {
  const normalized = input.trim();
  return (
    normalized.length > 0 &&
    !normalized.startsWith("/") &&
    !/^\d+$/.test(normalized)
  );
};

const operationForInput = (input: string): LeaveDoorOpenBusyOperation => {
  const normalized = input.trim();
  if (normalized === "/resume") return "time";
  if (isConversationalInput(normalized) || /^\d+$/.test(normalized)) {
    return "dialogue";
  }
  return "command";
};

const visibleScreenLines = (screen: string): string[] =>
  screen
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

const addedSequenceLines = (
  previous: string[],
  next: string[],
): string[] => {
  const lengths = Array.from({ length: previous.length + 1 }, () =>
    Array<number>(next.length + 1).fill(0),
  );
  for (let previousIndex = previous.length - 1; previousIndex >= 0; previousIndex -= 1) {
    for (let nextIndex = next.length - 1; nextIndex >= 0; nextIndex -= 1) {
      lengths[previousIndex]![nextIndex] =
        previous[previousIndex] === next[nextIndex]
          ? lengths[previousIndex + 1]![nextIndex + 1]! + 1
          : Math.max(
              lengths[previousIndex + 1]![nextIndex]!,
              lengths[previousIndex]![nextIndex + 1]!,
            );
    }
  }

  const additions: string[] = [];
  let previousIndex = 0;
  let nextIndex = 0;
  while (previousIndex < previous.length && nextIndex < next.length) {
    if (previous[previousIndex] === next[nextIndex]) {
      previousIndex += 1;
      nextIndex += 1;
    } else if (
      lengths[previousIndex + 1]![nextIndex]! >=
      lengths[previousIndex]![nextIndex + 1]!
    ) {
      previousIndex += 1;
    } else {
      additions.push(next[nextIndex]!);
      nextIndex += 1;
    }
  }
  additions.push(...next.slice(nextIndex));
  return additions;
};

const removeFirstSequence = (
  lines: string[],
  sequence: string[],
): void => {
  if (sequence.length === 0 || sequence.length > lines.length) return;
  for (let index = 0; index <= lines.length - sequence.length; index += 1) {
    if (sequence.every((line, offset) => lines[index + offset] === line)) {
      lines.splice(index, sequence.length);
      return;
    }
  }
};

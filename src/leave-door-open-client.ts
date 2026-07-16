export type LeaveDoorOpenClientResult = {
  sessionId: string;
  ended: boolean;
  screen: string;
};

export interface LeaveDoorOpenTransport {
  startSession(): Promise<LeaveDoorOpenClientResult>;
  submitInput(
    sessionId: string,
    input: string,
  ): Promise<LeaveDoorOpenClientResult>;
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

  startSession(): Promise<LeaveDoorOpenClientResult> {
    return this.#post("/api/leave-the-door-open/sessions", {});
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
      typeof payload.screen !== "string"
    ) {
      throw new Error("Playtest response is incomplete");
    }
    return {
      sessionId: payload.sessionId,
      ended: payload.ended,
      screen: payload.screen,
    };
  }
}

export interface LeaveDoorOpenBrowserView {
  setBusy(busy: boolean): void;
  showScreen(screen: string): void;
  showError(message: string): void;
  setEnded(ended: boolean): void;
}

export type ScreenPossibility = { number: number; label: string };

export const parseScreenPossibilities = (
  screen: string,
): ScreenPossibility[] => {
  const lines = screen.split(/\r?\n/);
  const heading = lines.findIndex((line) => line.trim() === "Possibilities:");
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

export const screenOffersNamedFocus = (screen: string): boolean =>
  /^Chapter 1 — Day \d+$/m.test(screen);

export class LeaveDoorOpenBrowserController {
  #sessionId: string | null = null;
  #busy = false;

  constructor(
    private readonly transport: LeaveDoorOpenTransport,
    private readonly view: LeaveDoorOpenBrowserView,
  ) {}

  async start(): Promise<void> {
    if (this.#busy) return;
    this.#sessionId = null;
    await this.#run(async () => {
      const result = await this.transport.startSession();
      this.#sessionId = result.sessionId;
      this.#present(result);
    });
  }

  async submit(input: string): Promise<void> {
    if (this.#busy || this.#sessionId === null) return;
    const sessionId = this.#sessionId;
    await this.#run(
      async () => {
        const result = await this.transport.submitInput(sessionId, input);
        this.#present(result);
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

  #present(result: LeaveDoorOpenClientResult): void {
    this.view.showScreen(result.screen);
    this.view.setEnded(result.ended);
  }

  async #run(
    task: () => Promise<void>,
    onError?: (error: unknown) => void,
  ): Promise<void> {
    this.#busy = true;
    this.view.setBusy(true);
    try {
      await task();
    } catch (error) {
      onError?.(error);
      this.view.showError(
        error instanceof Error ? error.message : "The playtest service is unavailable.",
      );
    } finally {
      this.#busy = false;
      this.view.setBusy(false);
    }
  }
}

export type DemoSessionMode = "access-code" | "anonymous";

export type DemoSessionResult =
  | { status: "ready"; mode: DemoSessionMode }
  | { status: "access-code-required" };

export interface DemoSessionTransport {
  open(accessCode?: string): Promise<DemoSessionResult>;
}

export interface DemoSessionView {
  showAccessGate(): void;
  showAccessError(message: string): void;
  dismissAccessGate(): void;
}

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export class DemoSessionClient implements DemoSessionTransport {
  constructor(private readonly fetcher: Fetcher = fetch) {}

  async open(accessCode?: string): Promise<DemoSessionResult> {
    const response = await this.fetcher.call(globalThis, "/api/demo-session", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(accessCode === undefined ? {} : { accessCode }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      mode?: unknown;
      error?: unknown;
    };

    if (response.status === 401) return { status: "access-code-required" };
    if (!response.ok) {
      throw new Error(
        typeof payload.error === "string" ? payload.error : `Session request failed: ${response.status}`,
      );
    }
    if (payload.mode !== "access-code" && payload.mode !== "anonymous") {
      throw new Error("Session response did not include a valid mode");
    }
    return { status: "ready", mode: payload.mode };
  }
}

export class DemoSessionController {
  isReady = false;

  constructor(
    private readonly transport: DemoSessionTransport,
    private readonly view: DemoSessionView,
  ) {}

  async start(): Promise<void> {
    try {
      await this.apply(await this.transport.open());
    } catch (error) {
      this.view.showAccessGate();
      this.view.showAccessError(
        error instanceof Error ? error.message : "目前無法建立 Demo session。",
      );
    }
  }

  async unlock(accessCode: string): Promise<void> {
    try {
      const result = await this.transport.open(accessCode);
      if (result.status === "access-code-required") {
        this.view.showAccessError("Access code 不正確，請再試一次。");
        return;
      }
      await this.apply(result);
    } catch (error) {
      this.view.showAccessError(
        error instanceof Error ? error.message : "目前無法建立 Demo session。",
      );
    }
  }

  private async apply(result: DemoSessionResult): Promise<void> {
    if (result.status === "access-code-required") {
      this.isReady = false;
      this.view.showAccessGate();
      return;
    }
    this.isReady = true;
    this.view.dismissAccessGate();
  }
}

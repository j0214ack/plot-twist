import { describe, expect, it, vi } from "vitest";
import {
  DemoSessionClient,
  DemoSessionController,
  type DemoSessionView,
} from "./demo-session";

describe("DemoSessionClient", () => {
  // Spec: Decision 0005 PUB-4; Safari requires Window.fetch to keep its Window receiver.
  it("calls the session fetch transport with the browser global as its receiver", async () => {
    const windowFetch = vi.fn(function (this: unknown) {
      if (this !== globalThis) {
        throw new TypeError("Can only call Window.fetch on instances of Window");
      }
      return Promise.resolve(
        new Response(JSON.stringify({ mode: "access-code" }), { status: 200 }),
      );
    });
    const client = new DemoSessionClient(windowFetch);

    await expect(client.open("quill-constellation")).resolves.toEqual({
      status: "ready",
      mode: "access-code",
    });
    expect(windowFetch.mock.contexts[0]).toBe(globalThis);
  });

  // Spec: Decision 0005 PUB-5; anonymous mode bootstraps without player input.
  it("opens a same-origin anonymous session", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ mode: "anonymous" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new DemoSessionClient(fetcher);

    await expect(client.open()).resolves.toEqual({ status: "ready", mode: "anonymous" });
    expect(fetcher).toHaveBeenCalledWith("/api/demo-session", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
  });

  // Spec: Decision 0005 PUB-4; access code is submitted only to the same-origin session endpoint.
  it("reports the access gate and can exchange a code for a ready session", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Access code is required" }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ mode: "access-code" }), { status: 200 }),
      );
    const client = new DemoSessionClient(fetcher);

    await expect(client.open()).resolves.toEqual({ status: "access-code-required" });
    await expect(client.open("quill-constellation")).resolves.toEqual({
      status: "ready",
      mode: "access-code",
    });
    expect(fetcher).toHaveBeenLastCalledWith(
      "/api/demo-session",
      expect.objectContaining({ body: JSON.stringify({ accessCode: "quill-constellation" }) }),
    );
  });

  // Spec: Decision 0005 PUB-4; transport failures remain visible instead of starting an unprotected game.
  it("surfaces non-authorization server failures", async () => {
    const client = new DemoSessionClient(
      vi.fn(async () => new Response(JSON.stringify({ error: "Unavailable" }), { status: 503 })),
    );

    await expect(client.open()).rejects.toThrow("Unavailable");
  });
});

describe("DemoSessionController", () => {
  const view = (): DemoSessionView => ({
    showAccessGate: vi.fn(),
    showAccessError: vi.fn(),
    dismissAccessGate: vi.fn(),
  });

  // Spec: Decision 0005 PUB-5; no gate flashes when anonymous bootstrap succeeds.
  it("marks the game ready immediately in anonymous mode", async () => {
    const transport = { open: vi.fn(async () => ({ status: "ready" as const, mode: "anonymous" as const })) };
    const gate = view();
    const controller = new DemoSessionController(transport, gate);

    await controller.start();

    expect(controller.isReady).toBe(true);
    expect(gate.dismissAccessGate).toHaveBeenCalledOnce();
    expect(gate.showAccessGate).not.toHaveBeenCalled();
  });

  // Spec: Decision 0005 PUB-4; gated mode blocks play until a submitted code succeeds.
  it("shows the gate, keeps failures visible, and unlocks after a valid code", async () => {
    const transport = {
      open: vi
        .fn()
        .mockResolvedValueOnce({ status: "access-code-required" as const })
        .mockResolvedValueOnce({ status: "access-code-required" as const })
        .mockResolvedValueOnce({ status: "ready" as const, mode: "access-code" as const }),
    };
    const gate = view();
    const controller = new DemoSessionController(transport, gate);

    await controller.start();
    expect(controller.isReady).toBe(false);
    expect(gate.showAccessGate).toHaveBeenCalledOnce();

    await controller.unlock("wrong");
    expect(controller.isReady).toBe(false);
    expect(gate.showAccessError).toHaveBeenCalledWith("Access code 不正確，請再試一次。");

    await controller.unlock("correct");
    expect(controller.isReady).toBe(true);
    expect(gate.dismissAccessGate).toHaveBeenCalledOnce();
  });
});

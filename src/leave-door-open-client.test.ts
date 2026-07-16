import { describe, expect, it, vi } from "vitest";
import {
  HttpLeaveDoorOpenTransport,
  LeaveDoorOpenBrowserController,
  LeaveDoorOpenTransportError,
  parseScreenPossibilities,
  screenOffersNamedFocus,
  type LeaveDoorOpenBrowserView,
  type LeaveDoorOpenTransport,
} from "./leave-door-open-client";

describe("Leave the Door Open browser adapter", () => {
  // Spec: ADR 0018 LDO-WEB-002 and LDO-WEB-003.
  it("renders server screens and forwards later input to the same server session", async () => {
    const transport: LeaveDoorOpenTransport = {
      startSession: vi.fn(async () => ({
        sessionId: "server-session-a",
        ended: false,
        screen: "07:57 — The world pauses.\nMartin notices the slow clock.",
      })),
      submitInput: vi.fn(async (sessionId, input) => ({
        sessionId,
        ended: false,
        screen: `Martin: ${input}`,
      })),
    };
    const view: LeaveDoorOpenBrowserView = {
      setBusy: vi.fn(),
      showScreen: vi.fn(),
      showError: vi.fn(),
      setEnded: vi.fn(),
    };
    const controller = new LeaveDoorOpenBrowserController(transport, view);

    await controller.start();
    await controller.submit("What made you stop here?");

    expect(view.showScreen).toHaveBeenNthCalledWith(
      1,
      "07:57 — The world pauses.\nMartin notices the slow clock.",
    );
    expect(transport.submitInput).toHaveBeenCalledWith(
      "server-session-a",
      "What made you stop here?",
    );
    expect(view.showScreen).toHaveBeenNthCalledWith(
      2,
      "Martin: What made you stop here?",
    );
    expect(view.setBusy).toHaveBeenNthCalledWith(1, true);
    expect(view.setBusy).toHaveBeenLastCalledWith(false);
    expect(view.showError).not.toHaveBeenCalled();
  });

  // Spec: ADR 0018 LDO-WEB-003, LDO-WEB-004, and LDO-WEB-006.
  it("uses only same-origin session endpoints and sends no model credentials", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sessionId: "server-session-b",
            ended: false,
            screen: "opening",
          }),
          { status: 201, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sessionId: "server-session-b",
            ended: false,
            screen: "help",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
    const transport = new HttpLeaveDoorOpenTransport(fetcher);

    await transport.startSession();
    await transport.submitInput("server-session-b", "/help");

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "/api/leave-the-door-open/sessions",
      {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: "{}",
      },
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "/api/leave-the-door-open/sessions/server-session-b/input",
      {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: "/help" }),
      },
    );
    expect(JSON.stringify(fetcher.mock.calls)).not.toMatch(
      /OPENAI_API_KEY|authorization|bearer/i,
    );
  });

  // Spec: ADR 0018 LDO-WEB-002; authored player labels become controls, never browser Actions.
  it("extracts only the numbered Possibilities already present in the safe server screen", () => {
    expect(
      parseScreenPossibilities(`
[Paused]
Focus: Elise
Possibilities:
1. Remain at the threshold for one breath.
2. Step across the threshold, then step back.

Continue talking or choose a Possibility.
`),
    ).toEqual([
      { number: 1, label: "Remain at the threshold for one breath." },
      { number: 2, label: "Step across the threshold, then step back." },
    ]);
    expect(parseScreenPossibilities("Martin: I counted three minutes.")).toEqual([]);
  });

  // Spec: ADR 0021 LDO-WEB-009; this is projection only, not gameplay policy.
  it("reveals named focus controls only after the safe screen establishes Chapter 1", () => {
    expect(
      screenOffersNamedFocus(
        "07:57 — The world pauses.\nMartin notices the slow clock.",
      ),
    ).toBe(false);
    expect(
      screenOffersNamedFocus(
        "Chapter 1 — Day 1\n08:20 — The world pauses.",
      ),
    ).toBe(true);
  });

  // Spec: ADR 0018 LDO-WEB-005; expiry is recoverable through a visible new-game state.
  it("ends the local browser handle when the ephemeral server session has expired", async () => {
    const transport: LeaveDoorOpenTransport = {
      async startSession() {
        return { sessionId: "expired-a", ended: false, screen: "opening" };
      },
      async submitInput() {
        throw new LeaveDoorOpenTransportError("Start a new game.", 404);
      },
    };
    const view: LeaveDoorOpenBrowserView = {
      setBusy: vi.fn(),
      showScreen: vi.fn(),
      showError: vi.fn(),
      setEnded: vi.fn(),
    };
    const controller = new LeaveDoorOpenBrowserController(transport, view);
    await controller.start();

    await controller.submit("/help");

    expect(view.showError).toHaveBeenCalledWith("Start a new game.");
    expect(view.setEnded).toHaveBeenLastCalledWith(true);
  });
});

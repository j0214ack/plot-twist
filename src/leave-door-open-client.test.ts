import { describe, expect, it, vi } from "vitest";
import {
  busyStatusText,
  ChronologicalScreenTranscript,
  HttpLeaveDoorOpenTransport,
  LeaveDoorOpenBrowserController,
  LeaveDoorOpenTransportError,
  parseScreenPossibilities,
  screenOffersNamedFocus,
  type LeaveDoorOpenBrowserView,
  type LeaveDoorOpenTransport,
} from "./leave-door-open-client";

describe("Leave the Door Open browser adapter", () => {
  // Spec: ADR 0029 LDO-WEB-016.
  it("distinguishes neutral time loading from Persona thinking", () => {
    expect(busyStatusText(true, "time", "zh-TW")).toBe("時間正在前進……");
    expect(busyStatusText(true, "dialogue", "zh-TW")).toBe("角色正在想……");
    expect(busyStatusText(true, "command", "zh-TW")).toBe("讀取中……");
    expect(busyStatusText(true, "time", "en")).toBe("Time is moving…");
    expect(busyStatusText(true, "dialogue", "en")).toBe(
      "The character is thinking…",
    );
    expect(busyStatusText(false, "time", "zh-TW")).toBe("");
  });

  // Spec: ADR 0029 LDO-WEB-014 through LDO-WEB-016.
  it("pulls real time-advance ticks at a renderer-owned cadence with neutral busy copy", async () => {
    const trace: string[] = [];
    const transport: LeaveDoorOpenTransport = {
      async startSession() {
        return {
          sessionId: "paced-a",
          ended: false,
          advancePending: false,
          dialogueResolutionPending: false,
          screen: "opening",
        };
      },
      async submitInput() {
        trace.push("submit:/resume");
        return {
          sessionId: "paced-a",
          ended: false,
          advancePending: true,
          dialogueResolutionPending: false,
          screen: "07:59 — the clock changes",
        };
      },
      async resolveDialogue() {
        throw new Error("Not exercised");
      },
      async advanceTurn() {
        const turn = trace.filter((entry) => entry === "advance").length + 1;
        trace.push("advance");
        return {
          sessionId: "paced-a",
          ended: false,
          advancePending: turn < 2,
          dialogueResolutionPending: false,
          screen: turn < 2 ? "08:00 — the household moves" : "08:15 — quiet",
        };
      },
    };
    const view: LeaveDoorOpenBrowserView = {
      setBusy: vi.fn((busy, operation) => {
        trace.push(`busy:${busy}:${operation ?? "none"}`);
      }),
      showScreen: vi.fn((screen) => {
        trace.push(`screen:${screen}`);
      }),
      showPlayerInput: vi.fn(),
      showError: vi.fn(),
      setEnded: vi.fn(),
    };
    const controller = new LeaveDoorOpenBrowserController(transport, view, {
      async waitBetweenTurns() {
        trace.push("wait");
      },
    });
    await controller.start();
    trace.length = 0;

    await controller.submit("/resume");

    expect(trace).toEqual([
      "busy:true:time",
      "submit:/resume",
      "screen:07:59 — the clock changes",
      "wait",
      "advance",
      "screen:08:00 — the household moves",
      "wait",
      "advance",
      "screen:08:15 — quiet",
      "busy:false:time",
    ]);
  });

  // Spec: ADR 0029 LDO-TIME-002 and LDO-WEB-015; empty policy ticks are
  // pulled immediately so the player-facing cadence applies to visible nodes.
  it("does not add a presentation delay for a tick whose safe screen is unchanged", async () => {
    const trace: string[] = [];
    let turn = 0;
    const transport: LeaveDoorOpenTransport = {
      async startSession() {
        return {
          sessionId: "paced-empty-a",
          ended: false,
          advancePending: false,
          dialogueResolutionPending: false,
          screen: "opening",
        };
      },
      async submitInput() {
        return {
          sessionId: "paced-empty-a",
          ended: false,
          advancePending: true,
          dialogueResolutionPending: false,
          screen: "08:00 — visible routine",
        };
      },
      async resolveDialogue() {
        throw new Error("Not exercised");
      },
      async advanceTurn() {
        turn += 1;
        trace.push(`advance:${turn}`);
        return {
          sessionId: "paced-empty-a",
          ended: false,
          advancePending: turn < 2,
          dialogueResolutionPending: false,
          screen:
            turn === 1
              ? "08:00 — visible routine"
              : "12:12 — next visible routine",
        };
      },
    };
    const controller = new LeaveDoorOpenBrowserController(
      transport,
      {
        setBusy: vi.fn(),
        showScreen: vi.fn(),
        showPlayerInput: vi.fn(),
        showError: vi.fn(),
        setEnded: vi.fn(),
      },
      {
        async waitBetweenTurns() {
          trace.push("wait");
        },
      },
    );
    await controller.start();

    await controller.submit("/resume");

    expect(trace).toEqual(["wait", "advance:1", "advance:2"]);
  });

  // Spec: ADR 0026 LDO-WEB-011 and LDO-WEB-013.
  it("turns consecutive complete server screens into one non-duplicating chronological transcript", () => {
    const transcript = new ChronologicalScreenTranscript();
    const rendered: string[] = [];
    rendered.push(
      ...transcript.reset(`Leave the Door Open

07:57 — Living room — The wall clock shows 07:54.
[Paused]
Start by speaking to Martin.`),
    );
    rendered.push(
      ...transcript.appendPlayerInput("What made you stop here?"),
    );

    rendered.push(
      ...transcript.reconcile(`Leave the Door Open
07:57 — Living room — The wall clock shows 07:54.
[Paused]
You: What made you stop here?
Martin: I noticed I had enough energy to look.`),
    );
    rendered.push(
      ...transcript.reconcile(`Leave the Door Open
07:57 — Living room — The wall clock shows 07:54.
07:57 — The world resumes.
08:00 — Living room — He sits at the far end of the sofa.
08:01 — The world pauses.
[Paused]
You: What made you stop here?
Martin: I noticed I had enough energy to look.
Time moved to a new routine moment.`),
    );

    expect(rendered).toEqual([
      "Leave the Door Open",
      "07:57 — Living room — The wall clock shows 07:54.",
      "[Paused]",
      "Start by speaking to Martin.",
      "You: What made you stop here?",
      "Martin: I noticed I had enough energy to look.",
      "07:57 — The world resumes.",
      "08:00 — Living room — He sits at the far end of the sofa.",
      "08:01 — The world pauses.",
      "Time moved to a new routine moment.",
    ]);
  });

  // Spec: ADR 0033 LDO-LOC-001 and LDO-LOC-007.
  it("echoes the player in the immutable session locale", () => {
    const chineseTranscript = new ChronologicalScreenTranscript("zh-TW");

    chineseTranscript.reset("讓門開著\n[已暫停]");

    expect(chineseTranscript.appendPlayerInput("你為什麼停下來？")).toEqual([
      "你: 你為什麼停下來？",
    ]);
  });

  // Spec: ADR 0026 LDO-WEB-011.
  it("echoes a submitted thought before the server-backed Persona turn resolves", async () => {
    let resolveTurn!: (result: {
      sessionId: string;
      ended: boolean;
      advancePending: boolean;
      dialogueResolutionPending: boolean;
      screen: string;
    }) => void;
    const turn = new Promise<{
      sessionId: string;
      ended: boolean;
      advancePending: boolean;
      dialogueResolutionPending: boolean;
      screen: string;
    }>((resolve) => {
      resolveTurn = resolve;
    });
    const transport: LeaveDoorOpenTransport = {
      async startSession() {
        return {
          sessionId: "optimistic-a",
          ended: false,
          advancePending: false,
          dialogueResolutionPending: false,
          screen: "opening",
        };
      },
      submitInput: vi.fn(() => turn),
      async resolveDialogue() {
        throw new Error("Not exercised");
      },
      async advanceTurn() {
        throw new Error("Not exercised");
      },
    };
    const view = {
      setBusy: vi.fn(),
      showScreen: vi.fn(),
      showPlayerInput: vi.fn(),
      showError: vi.fn(),
      setEnded: vi.fn(),
    };
    const controller = new LeaveDoorOpenBrowserController(transport, view);
    await controller.start();

    const pending = controller.submit("What made you stop here?");

    expect(view.showPlayerInput).toHaveBeenCalledWith(
      "What made you stop here?",
    );
    expect(view.showScreen).toHaveBeenCalledTimes(1);

    resolveTurn({
      sessionId: "optimistic-a",
      ended: false,
      advancePending: false,
      dialogueResolutionPending: false,
      screen: "You: What made you stop here?\nMartin: I noticed the clock.",
    });
    await pending;
    expect(view.showScreen).toHaveBeenCalledTimes(2);

    await controller.submit("/help");
    await controller.submit("1");
    expect(view.showPlayerInput).toHaveBeenCalledTimes(1);
  });

  // Spec: ADR 0035 LDO-LAT-008.
  it("presents the Persona screen before requesting the post-Persona Judge continuation", async () => {
    const trace: string[] = [];
    const transport = {
      async startSession() {
        return {
          sessionId: "phased-browser-a",
          ended: false,
          advancePending: false,
          dialogueResolutionPending: false,
          screen: "opening",
        };
      },
      async submitInput() {
        trace.push("submit");
        return {
          sessionId: "phased-browser-a",
          ended: false,
          advancePending: false,
          dialogueResolutionPending: true,
          screen: "Martin: I noticed the clock.",
        };
      },
      async resolveDialogue() {
        trace.push("resolve");
        return {
          sessionId: "phased-browser-a",
          ended: false,
          advancePending: false,
          dialogueResolutionPending: false,
          screen: "Martin: I noticed the clock.\nPossibilities:\n1. Touch it.",
        };
      },
      async advanceTurn() {
        throw new Error("Not exercised");
      },
    };
    const controller = new LeaveDoorOpenBrowserController(transport, {
      setBusy: vi.fn(),
      showScreen: vi.fn((screen) => {
        trace.push(`screen:${screen}`);
      }),
      showPlayerInput: vi.fn(),
      showError: vi.fn(),
      setEnded: vi.fn(),
    });
    await controller.start();
    trace.length = 0;

    await controller.submit("Why today?");

    expect(trace).toEqual([
      "submit",
      "screen:Martin: I noticed the clock.",
      "resolve",
      "screen:Martin: I noticed the clock.\nPossibilities:\n1. Touch it.",
    ]);
  });

  // Spec: ADR 0018 LDO-WEB-002 and LDO-WEB-003.
  it("renders server screens and forwards later input to the same server session", async () => {
    const transport: LeaveDoorOpenTransport = {
      startSession: vi.fn(async () => ({
        sessionId: "server-session-a",
        ended: false,
        advancePending: false,
        dialogueResolutionPending: false,
        screen: "07:57 — The world pauses.\nMartin notices the slow clock.",
      })),
      submitInput: vi.fn(async (sessionId, input) => ({
        sessionId,
        ended: false,
        advancePending: false,
        dialogueResolutionPending: false,
        screen: `Martin: ${input}`,
      })),
      async resolveDialogue() {
        throw new Error("Not exercised");
      },
      async advanceTurn() {
        throw new Error("Not exercised");
      },
    };
    const view: LeaveDoorOpenBrowserView = {
      setBusy: vi.fn(),
      showScreen: vi.fn(),
      showPlayerInput: vi.fn(),
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
    expect(view.setBusy).toHaveBeenNthCalledWith(1, true, "starting");
    expect(view.setBusy).toHaveBeenLastCalledWith(false, "dialogue");
    expect(view.showError).not.toHaveBeenCalled();
    expect(transport.startSession).toHaveBeenCalledWith("zh-TW");
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
            advancePending: false,
            dialogueResolutionPending: false,
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
            advancePending: false,
            dialogueResolutionPending: false,
            screen: "help",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
    const transport = new HttpLeaveDoorOpenTransport(fetcher);

    await transport.startSession("zh-TW");
    await transport.submitInput("server-session-b", "/help");

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "/api/leave-the-door-open/sessions",
      {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: "zh-TW" }),
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

    expect(
      parseScreenPossibilities(
        `[已暫停]\n焦點：伊莉絲\n可能的行動：\n1. 在門檻前停留一口呼吸的時間。\n2. 跨過門檻，再退回來。`,
        "zh-TW",
      ),
    ).toEqual([
      { number: 1, label: "在門檻前停留一口呼吸的時間。" },
      { number: 2, label: "跨過門檻，再退回來。" },
    ]);
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
    expect(
      screenOffersNamedFocus(
        "第一章——第 1 天\n08:20——時間暫停了。",
        "zh-TW",
      ),
    ).toBe(true);
  });

  // Spec: ADR 0018 LDO-WEB-005; ADR 0033 LDO-LOC-003. Expiry is
  // recoverable through a locale-authored visible new-game state.
  it("ends the local browser handle when the ephemeral server session has expired", async () => {
    const transport: LeaveDoorOpenTransport = {
      async startSession() {
        return {
          sessionId: "expired-a",
          ended: false,
          advancePending: false,
          dialogueResolutionPending: false,
          screen: "opening",
        };
      },
      async submitInput() {
        throw new LeaveDoorOpenTransportError("Start a new game.", 404);
      },
      async resolveDialogue() {
        throw new Error("Not exercised");
      },
      async advanceTurn() {
        throw new Error("Not exercised");
      },
    };
    const view: LeaveDoorOpenBrowserView = {
      setBusy: vi.fn(),
      showScreen: vi.fn(),
      showPlayerInput: vi.fn(),
      showError: vi.fn(),
      setEnded: vi.fn(),
    };
    const controller = new LeaveDoorOpenBrowserController(transport, view);
    await controller.start();

    await controller.submit("/help");

    expect(view.showError).toHaveBeenCalledWith(
      "這個試玩連線已經失效，請重新開始。",
    );
    expect(view.setEnded).toHaveBeenLastCalledWith(true);
  });
});

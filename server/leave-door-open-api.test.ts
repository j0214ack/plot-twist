import { describe, expect, it, vi } from "vitest";
import { createConversationalVerticalSliceGameController } from "../pocs/leave-the-door-open/src/controller";
import type { ConversationPorts } from "../pocs/leave-the-door-open/src/conversation";
import { TerminalPlaySession } from "../pocs/leave-the-door-open/src/terminal-play-session";
import {
  createLeaveDoorOpenApiMiddleware,
  leaveDoorOpenApiPlugin,
  LeaveDoorOpenSessionService,
  type LeaveDoorOpenWebSession,
} from "./leave-door-open-api";

const unusedPorts: ConversationPorts = {
  persona: {
    async takeTurn() {
      throw new Error("Persona should not be called by this test");
    },
  },
  actionJudge: {
    async judgeAwareness() {
      throw new Error("Judge should not be called by this test");
    },
    async judgeWillingness() {
      throw new Error("Judge should not be called by this test");
    },
  },
};

const realTerminalSession = (): LeaveDoorOpenWebSession => {
  let latestScreen = "";
  const terminal = new TerminalPlaySession(
    createConversationalVerticalSliceGameController(unusedPorts),
    (screen) => {
      latestScreen = screen;
    },
  );
  return {
    async start() {
      await terminal.start();
      return latestScreen;
    },
    async handleInput(input) {
      const result =
        input.trim() === "/resume"
          ? await terminal.beginTimeAdvance()
          : { ...(await terminal.handleInput(input)), advancePending: false };
      return { ...result, screen: latestScreen };
    },
    async advanceTurn() {
      const result = await terminal.advanceTurn();
      return { ...result, screen: latestScreen };
    },
  };
};

describe("Leave the Door Open web session service", () => {
  // Spec: ADR 0033 LDO-LOC-001, LDO-LOC-006, and LDO-LOC-008.
  it("validates and freezes the requested locale when creating a session", async () => {
    const created: Array<{ sessionId: string; locale: string }> = [];
    const service = new LeaveDoorOpenSessionService((sessionId, locale) => {
      created.push({ sessionId, locale });
      return {
        async start() {
          return locale;
        },
        async handleInput() {
          throw new Error("Not exercised");
        },
        async advanceTurn() {
          throw new Error("Not exercised");
        },
      };
    }, { createSessionId: () => "localized-session" });
    const middleware = createLeaveDoorOpenApiMiddleware(service);

    const started = await invoke(middleware, {
      method: "POST",
      url: "/api/leave-the-door-open/sessions",
      body: JSON.stringify({ locale: "zh-TW" }),
    });
    const rejected = await invoke(middleware, {
      method: "POST",
      url: "/api/leave-the-door-open/sessions",
      body: JSON.stringify({ locale: "fr" }),
    });

    expect(created).toEqual([
      { sessionId: "localized-session", locale: "zh-TW" },
    ]);
    expect(started.json).toMatchObject({
      sessionId: "localized-session",
      locale: "zh-TW",
      screen: "zh-TW",
    });
    expect(rejected).toMatchObject({
      statusCode: 400,
      json: { error: "Unsupported locale" },
    });
  });

  // Spec: ADR 0029 LDO-WEB-014 and LDO-TIME-002.
  it("exposes a target-free next-tick endpoint for the active advance plan", async () => {
    let turn = 0;
    const session: LeaveDoorOpenWebSession = {
      async start() {
        return "opening";
      },
      async handleInput(input) {
        expect(input).toBe("/resume");
        return {
          ended: false,
          advancePending: true,
          screen: "07:59 — first tick",
        };
      },
      async advanceTurn() {
        turn += 1;
        return {
          ended: false,
          advancePending: turn < 2,
          screen: turn < 2 ? "08:00 — second tick" : "08:15 — final tick",
        };
      },
    };
    const service = new LeaveDoorOpenSessionService(() => session, {
      createSessionId: () => "paced-api-a",
    });
    const middleware = createLeaveDoorOpenApiMiddleware(service);
    await service.startSession();

    const first = await service.submitInput("paced-api-a", "/resume");
    const second = await invoke(middleware, {
      method: "POST",
      url: "/api/leave-the-door-open/sessions/paced-api-a/advance",
      body: "{}",
    });

    expect(first).toMatchObject({ advancePending: true });
    expect(second).toMatchObject({
      statusCode: 200,
      json: {
        sessionId: "paced-api-a",
        ended: false,
        advancePending: true,
        screen: "08:00 — second tick",
      },
    });
    expect(JSON.stringify(second.json)).not.toMatch(/target|duration|event/i);
  });

  // Spec: ADR 0018 LDO-WEB-001 and LDO-WEB-003.
  it("installs the same session API in Vite development and Fly preview servers", () => {
    const service = new LeaveDoorOpenSessionService(realTerminalSession);
    const plugin = leaveDoorOpenApiPlugin(service);
    const devUse = vi.fn();
    const previewUse = vi.fn();

    (plugin.configureServer as (server: { middlewares: { use: typeof devUse } }) => void)({
      middlewares: { use: devUse },
    });
    (plugin.configurePreviewServer as (
      server: { middlewares: { use: typeof previewUse } },
    ) => void)({ middlewares: { use: previewUse } });

    expect(devUse).toHaveBeenCalledOnce();
    expect(previewUse).toHaveBeenCalledOnce();
    expect(devUse.mock.calls[0]?.[0]).toBe(previewUse.mock.calls[0]?.[0]);
  });

  // Spec: ADR 0018 LDO-WEB-003 and LDO-WEB-005.
  it("starts the real play surface and sends later input to the same isolated session", async () => {
    const service = new LeaveDoorOpenSessionService(realTerminalSession, {
      createSessionId: () => "opaque-session-a",
      now: () => 1_000,
    });

    const opening = await service.startSession();
    expect(opening).toMatchObject({
      sessionId: "opaque-session-a",
      ended: false,
    });
    expect(opening.screen).toContain("Leave the Door Open");
    expect(opening.screen).toContain("The living-room clock is three minutes slow");

    const continued = await service.submitInput("opaque-session-a", "/help");
    expect(continued).toMatchObject({
      sessionId: "opaque-session-a",
      ended: false,
    });
    expect(continued.screen).toContain("Speak by typing normally");
    expect(continued.screen).toContain("07:57");
  });

  // Spec: ADR 0018 LDO-WEB-003 and LDO-WEB-006.
  it("exposes bounded start and input endpoints without putting game rules in the payload", async () => {
    const service = new LeaveDoorOpenSessionService(realTerminalSession, {
      createSessionId: () => "opaque-session-b",
      now: () => 2_000,
    });
    const middleware = createLeaveDoorOpenApiMiddleware(service);

    const started = await invoke(middleware, {
      method: "POST",
      url: "/api/leave-the-door-open/sessions",
      body: "{}",
    });
    expect(started).toMatchObject({
      statusCode: 201,
      json: {
        sessionId: "opaque-session-b",
        ended: false,
      },
    });
    expect(started.json.screen).toContain("The living-room clock is three minutes slow");

    const continued = await invoke(middleware, {
      method: "POST",
      url: "/api/leave-the-door-open/sessions/opaque-session-b/input",
      body: JSON.stringify({ input: "/help" }),
    });
    expect(continued.statusCode).toBe(200);
    expect(continued.json.screen).toContain("Speak by typing normally");

    const rejected = await invoke(middleware, {
      method: "POST",
      url: "/api/leave-the-door-open/sessions/opaque-session-b/input",
      body: JSON.stringify({ input: "x".repeat(501) }),
    });
    expect(rejected).toMatchObject({
      statusCode: 400,
      json: { error: "Input must contain between 1 and 500 characters" },
    });
  });

  // Spec: ADR 0018 LDO-WEB-005; one Controller cannot process overlapping model turns.
  it("serializes concurrent inputs within one session", async () => {
    const events: string[] = [];
    let releaseFirst!: () => void;
    const firstMayFinish = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const session: LeaveDoorOpenWebSession = {
      async start() {
        return "opening";
      },
      async handleInput(input) {
        events.push(`start:${input}`);
        if (input === "first") await firstMayFinish;
        events.push(`end:${input}`);
        return { ended: false, advancePending: false, screen: input };
      },
      async advanceTurn() {
        throw new Error("Not exercised");
      },
    };
    const service = new LeaveDoorOpenSessionService(() => session, {
      createSessionId: () => "serialized-session",
    });
    await service.startSession();

    const first = service.submitInput("serialized-session", "first");
    await Promise.resolve();
    const second = service.submitInput("serialized-session", "second");
    await Promise.resolve();

    expect(events).toEqual(["start:first"]);
    releaseFirst();
    await Promise.all([first, second]);
    expect(events).toEqual([
      "start:first",
      "end:first",
      "start:second",
      "end:second",
    ]);
  });

  // Spec: ADR 0018 LDO-WEB-005; Fly memory is an ephemeral, bounded playtest store.
  it("expires an inactive session instead of retaining it indefinitely", async () => {
    let now = 10_000;
    const service = new LeaveDoorOpenSessionService(realTerminalSession, {
      createSessionId: () => "expiring-session",
      now: () => now,
      sessionTtlMs: 1_000,
    });
    await service.startSession();

    now += 1_001;

    await expect(
      service.submitInput("expiring-session", "/help"),
    ).rejects.toThrow("This playtest session is no longer available");
  });
});

type Middleware = ReturnType<typeof createLeaveDoorOpenApiMiddleware>;

const invoke = async (
  middleware: Middleware,
  requestInit: { method: string; url: string; body: string },
): Promise<{ statusCode: number; json: Record<string, any> }> => {
  const chunks = [Buffer.from(requestInit.body)];
  const request = {
    method: requestInit.method,
    url: requestInit.url,
    headers: { "content-type": "application/json" },
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) yield chunk;
    },
  };
  let responseBody = "";
  const response = {
    statusCode: 200,
    setHeader() {},
    end(chunk = "") {
      responseBody = chunk;
    },
  };
  await middleware(request, response, () => {
    throw new Error("Expected Leave the Door Open API to handle this request");
  });
  return {
    statusCode: response.statusCode,
    json: JSON.parse(responseBody) as Record<string, any>,
  };
};

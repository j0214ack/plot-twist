import { describe, expect, it, vi } from "vitest";
import { createConversationalVerticalSliceGameController } from "../pocs/leave-the-door-open/src/controller";
import type { ConversationPorts } from "../pocs/leave-the-door-open/src/conversation";
import { TerminalPlaySession } from "../pocs/leave-the-door-open/src/terminal-play-session";
import {
  createLeaveDoorOpenApiMiddleware,
  leaveDoorOpenApiPlugin,
  LeaveDoorOpenSessionService,
  type LeaveDoorOpenWebCheckpoint,
  type LeaveDoorOpenWebSession,
} from "./leave-door-open-api";
import type {
  LeaveDoorOpenPersistence,
  PersistedLeaveDoorOpenSession,
} from "./leave-door-open-persistence";

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

const realTerminalSession = (
  locale: "en" | "zh-TW" = "en",
  checkpoint?: LeaveDoorOpenWebCheckpoint,
): LeaveDoorOpenWebSession => {
  let latestScreen = checkpoint?.latestScreen ?? "";
  const controller = createConversationalVerticalSliceGameController(
    unusedPorts,
    { locale, checkpoint: checkpoint?.controller },
  );
  const terminal = new TerminalPlaySession(
    controller,
    (screen) => {
      latestScreen = screen;
    },
    undefined,
    checkpoint?.terminal,
  );
  return {
    async start() {
      if (checkpoint !== undefined) return latestScreen;
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
      return {
        ...result,
        dialogueResolutionPending: false,
        screen: latestScreen,
      };
    },
    async resolveDialogue() {
      throw new Error("Not exercised");
    },
    checkpoint() {
      return {
        schemaVersion: 1,
        controller: controller.checkpoint(),
        terminal: terminal.checkpoint(),
        latestScreen,
      };
    },
  };
};

const realWebFactory = (
  _sessionId: string,
  locale: "en" | "zh-TW",
  checkpoint?: LeaveDoorOpenWebCheckpoint,
) => realTerminalSession(locale, checkpoint);

class MemoryPersistence implements LeaveDoorOpenPersistence {
  readonly sessions = new Map<string, PersistedLeaveDoorOpenSession>();

  async load(playerId: string, locale: "en" | "zh-TW") {
    const saved = this.sessions.get(`${playerId}:${locale}`);
    return saved === undefined ? null : structuredClone(saved);
  }

  async save(
    playerId: string,
    locale: "en" | "zh-TW",
    session: PersistedLeaveDoorOpenSession,
  ) {
    this.sessions.set(`${playerId}:${locale}`, structuredClone(session));
  }

  async remove(playerId: string, locale: "en" | "zh-TW") {
    this.sessions.delete(`${playerId}:${locale}`);
  }

  appendJournalLine() {}
}

describe("Leave the Door Open web session service", () => {
  // Spec: ADR 0036 LDO-SAVE-001 through LDO-SAVE-006.
  it("restores one browser player's checkpoint after a server restart and enforces ownership", async () => {
    const persistence = new MemoryPersistence();
    const sessionIds = ["runtime-a", "runtime-b", "runtime-c"];
    const createSession = (
      _sessionId: string,
      locale: "en" | "zh-TW",
      checkpoint?: LeaveDoorOpenWebCheckpoint,
    ) => realTerminalSession(locale, checkpoint);
    const firstServer = new LeaveDoorOpenSessionService(createSession, {
      createSessionId: () => sessionIds.shift()!,
      persistence,
    });

    const opening = await firstServer.startSession("player-a", "zh-TW");
    const changed = await firstServer.submitInput(
      "player-a",
      opening.sessionId,
      "/help",
    );

    const restartedServer = new LeaveDoorOpenSessionService(createSession, {
      createSessionId: () => sessionIds.shift()!,
      persistence,
    });
    const restored = await restartedServer.startSession("player-a", "zh-TW");
    const otherPlayer = await restartedServer.startSession(
      "player-b",
      "zh-TW",
    );

    expect(restored).toMatchObject({
      sessionId: "runtime-b",
      locale: "zh-TW",
      screen: changed.screen,
    });
    expect(otherPlayer.sessionId).toBe("runtime-c");
    expect(otherPlayer.screen).not.toBe(changed.screen);
    await expect(
      restartedServer.submitInput(
        "player-b",
        restored.sessionId,
        "/help",
      ),
    ).rejects.toThrow("This playtest session is no longer available");
  });

  // Spec: ADR 0036 LDO-SAVE-005 and LDO-SAVE-006.
  it("deletes the owned locale checkpoint only for an explicit reset", async () => {
    const persistence = new MemoryPersistence();
    const sessionIds = ["before-reset", "after-reset"];
    const service = new LeaveDoorOpenSessionService(realWebFactory, {
      createSessionId: () => sessionIds.shift()!,
      persistence,
    });
    const opening = await service.startSession("player-a", "zh-TW");
    const changed = await service.submitInput(
      "player-a",
      opening.sessionId,
      "/help",
    );

    const resumed = await service.startSession("player-a", "zh-TW");
    const reset = await service.startSession("player-a", "zh-TW", true);

    expect(resumed).toMatchObject({
      sessionId: "before-reset",
      screen: changed.screen,
    });
    expect(reset.sessionId).toBe("after-reset");
    expect(reset.screen).not.toBe(changed.screen);
    await expect(
      service.submitInput("player-a", "before-reset", "/help"),
    ).rejects.toThrow("This playtest session is no longer available");
  });

  // Spec: ADR 0035 LDO-LAT-008.
  it("exposes a dedicated continuation endpoint for a pending post-Persona Judge phase", async () => {
    let resolveCalls = 0;
    const session = {
      async start() {
        return "opening";
      },
      async handleInput() {
        return {
          ended: false,
          advancePending: false,
          dialogueResolutionPending: true,
          screen: "Martin: I noticed the clock.",
        };
      },
      async resolveDialogue() {
        resolveCalls += 1;
        return {
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
    const service = new LeaveDoorOpenSessionService(() => session, {
      createSessionId: () => "phased-api-a",
    });
    const middleware = createLeaveDoorOpenApiMiddleware(service);
    await service.startSession("test-player");
    const first = await service.submitInput(
      "test-player",
      "phased-api-a",
      "Why today?",
    );

    const resolved = await invoke(middleware, {
      method: "POST",
      url: "/api/leave-the-door-open/sessions/phased-api-a/resolve-dialogue",
      body: "{}",
    });

    expect(first).toMatchObject({ dialogueResolutionPending: true });
    expect(resolved).toMatchObject({
      statusCode: 200,
      json: {
        sessionId: "phased-api-a",
        dialogueResolutionPending: false,
        screen: expect.stringContaining("Possibilities"),
      },
    });
    expect(resolveCalls).toBe(1);
  });

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
    await service.startSession("test-player");

    const first = await service.submitInput(
      "test-player",
      "paced-api-a",
      "/resume",
    );
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
    const service = new LeaveDoorOpenSessionService(realWebFactory);
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
    const service = new LeaveDoorOpenSessionService(realWebFactory, {
      createSessionId: () => "opaque-session-a",
      now: () => 1_000,
    });

    const opening = await service.startSession("test-player");
    expect(opening).toMatchObject({
      sessionId: "opaque-session-a",
      ended: false,
    });
    expect(opening.screen).toContain("Leave the Door Open");
    expect(opening.screen).toContain("The living-room clock is three minutes slow");

    const continued = await service.submitInput(
      "test-player",
      "opaque-session-a",
      "/help",
    );
    expect(continued).toMatchObject({
      sessionId: "opaque-session-a",
      ended: false,
    });
    expect(continued.screen).toContain("Speak by typing normally");
    expect(continued.screen).toContain("07:57");
  });

  // Spec: ADR 0018 LDO-WEB-003 and LDO-WEB-006.
  it("exposes bounded start and input endpoints without putting game rules in the payload", async () => {
    const service = new LeaveDoorOpenSessionService(realWebFactory, {
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
    expect(started.json.screen).toContain("客廳的時鐘慢了三分鐘");

    const continued = await invoke(middleware, {
      method: "POST",
      url: "/api/leave-the-door-open/sessions/opaque-session-b/input",
      body: JSON.stringify({ input: "/help" }),
    });
    expect(continued.statusCode).toBe(200);
    expect(continued.json.screen).toContain("直接輸入文字和角色說話");

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
    await service.startSession("test-player");

    const first = service.submitInput(
      "test-player",
      "serialized-session",
      "first",
    );
    await Promise.resolve();
    const second = service.submitInput(
      "test-player",
      "serialized-session",
      "second",
    );
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
    const service = new LeaveDoorOpenSessionService(realWebFactory, {
      createSessionId: () => "expiring-session",
      now: () => now,
      sessionTtlMs: 1_000,
    });
    await service.startSession("test-player");

    now += 1_001;

    await expect(
      service.submitInput("test-player", "expiring-session", "/help"),
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
    playerId: "test-player",
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

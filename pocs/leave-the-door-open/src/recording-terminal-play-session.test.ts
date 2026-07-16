import { describe, expect, it } from "vitest";
import { createConversationalVerticalSliceGameController } from "./controller";
import type { ConversationPorts } from "./conversation";
import { PlaytestSessionRecorder } from "./playtest-session-log";
import {
  createRecordingTerminalErrorObserver,
  createRecordingTerminalOutput,
  RecordingTerminalPlaySession,
} from "./recording-terminal-play-session";
import { TerminalPlaySession } from "./terminal-play-session";

describe("recording terminal play session", () => {
  it("LDO-OBS-008 journals safe internal interaction errors as observer-only records", () => {
    const lines: string[] = [];
    const recorder = new PlaytestSessionRecorder({
      sessionId: "session-error",
      appendLine: (line) => lines.push(line),
    });

    createRecordingTerminalErrorObserver(recorder)(
      new TypeError("receiver was lost"),
    );

    expect(JSON.parse(lines[0]!)).toMatchObject({
      visibility: "observer",
      type: "interaction_failed",
      data: {
        error: { name: "TypeError", message: "receiver was lost" },
      },
    });
  });

  it("LDO-OBS-002 LDO-OBS-004 records exact screens, raw input, and the resulting Controller snapshot", async () => {
    const lines: string[] = [];
    const visibleScreens: string[] = [];
    const recorder = new PlaytestSessionRecorder({
      sessionId: "session-terminal",
      appendLine: (line) => lines.push(line),
    });
    const unusedPorts: ConversationPorts = {
      persona: {
        async takeTurn() {
          throw new Error("Not exercised");
        },
      },
      actionJudge: {
        async judgeAwareness() {
          throw new Error("Not exercised");
        },
        async judgeWillingness() {
          throw new Error("Not exercised");
        },
      },
    };
    const controller = createConversationalVerticalSliceGameController(
      unusedPorts,
    );
    const delegate = new TerminalPlaySession(
      controller,
      createRecordingTerminalOutput(recorder, (screen) =>
        visibleScreens.push(screen),
      ),
    );
    const session = new RecordingTerminalPlaySession(
      delegate,
      controller,
      recorder,
    );

    await session.start();
    const result = await session.handleInput("  /quit  ");

    expect(result).toEqual({ ended: true });
    const records = lines.map((line) => JSON.parse(line));
    expect(records.map(({ type }) => type)).toEqual([
      "screen_rendered",
      "player_input",
      "screen_rendered",
      "input_handled",
    ]);
    expect(records[0]).toMatchObject({
      visibility: "player",
      data: { screen: visibleScreens[0] },
    });
    expect(records[1]).toMatchObject({
      visibility: "player",
      data: { input: "  /quit  " },
    });
    expect(records[2]).toMatchObject({
      visibility: "player",
      data: { screen: visibleScreens[1] },
    });
    expect(records[3]).toMatchObject({
      visibility: "observer",
      data: {
        inputSequence: 2,
        result: { ended: true },
        controllerSnapshot: {
          world: { time: 7 * 60 + 57, paused: true },
          interaction: { selectedNpcId: "husband" },
        },
      },
    });
    expect(
      records
        .filter(({ visibility }) => visibility === "player")
        .some(({ data }) => "controllerSnapshot" in data),
    ).toBe(false);
  });
});

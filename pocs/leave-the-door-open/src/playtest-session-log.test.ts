import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createLocalPlaytestRecorder,
  PlaytestSessionRecorder,
} from "./playtest-session-log";

describe("Leave the Door Open playtest session recorder", () => {
  it("LDO-OBS-001 appends versioned events with one ordered session sequence", () => {
    const lines: string[] = [];
    const timestamps = [
      new Date("2026-07-16T07:00:00.000Z"),
      new Date("2026-07-16T07:00:01.000Z"),
    ];
    const recorder = new PlaytestSessionRecorder({
      sessionId: "session-001",
      appendLine: (line) => lines.push(line),
      now: () => timestamps.shift()!,
    });

    recorder.record({
      visibility: "player",
      type: "screen_rendered",
      data: { screen: "[Paused]\nFocus: Husband" },
    });
    recorder.record({
      visibility: "player",
      type: "player_input",
      data: { input: "Why did you stop?" },
    });

    expect(lines).toHaveLength(2);
    expect(lines.every((line) => line.endsWith("\n"))).toBe(true);
    expect(lines.map((line) => JSON.parse(line))).toEqual([
      {
        schemaVersion: 1,
        sessionId: "session-001",
        sequence: 1,
        timestamp: "2026-07-16T07:00:00.000Z",
        visibility: "player",
        type: "screen_rendered",
        data: { screen: "[Paused]\nFocus: Husband" },
      },
      {
        schemaVersion: 1,
        sessionId: "session-001",
        sequence: 2,
        timestamp: "2026-07-16T07:00:01.000Z",
        visibility: "player",
        type: "player_input",
        data: { input: "Why did you stop?" },
      },
    ]);
  });

  it("LDO-OBS-006 appends a fixed-rubric assessment for an observed sequence range", () => {
    const lines: string[] = [];
    const recorder = new PlaytestSessionRecorder({
      sessionId: "session-002",
      appendLine: (line) => lines.push(line),
      now: () => new Date("2026-07-16T07:00:00.000Z"),
    });
    recorder.record({
      visibility: "player",
      type: "player_input",
      data: { input: "Why?" },
    });
    recorder.record({
      visibility: "player",
      type: "screen_rendered",
      data: { screen: "Husband: I cannot name it." },
    });

    recorder.recordAssessment({
      turn: 1,
      eventRange: { fromSequence: 1, toSequence: 2 },
      comprehension: "uncertain",
      responseRelevance: "direct",
      informationGain: "new",
      characterAgency: "credible",
      psychologicalMovement: "unchanged_but_coherent",
      causalLegibility: "not_yet_exercised",
      intervention: "continue",
      notes: ["The reply names a new distinction without yielding."],
    });

    expect(JSON.parse(lines.at(-1)!)).toMatchObject({
      sequence: 3,
      visibility: "observer",
      type: "qualitative_assessment",
      data: {
        turn: 1,
        eventRange: { fromSequence: 1, toSequence: 2 },
        comprehension: "uncertain",
        responseRelevance: "direct",
        informationGain: "new",
        characterAgency: "credible",
        psychologicalMovement: "unchanged_but_coherent",
        causalLegibility: "not_yet_exercised",
        intervention: "continue",
        notes: ["The reply names a new distinction without yielding."],
      },
    });
  });

  it("LDO-OBS-006 rejects an assessment that cites events not yet recorded", () => {
    const lines: string[] = [];
    const recorder = new PlaytestSessionRecorder({
      sessionId: "session-003",
      appendLine: (line) => lines.push(line),
    });
    recorder.record({
      visibility: "player",
      type: "player_input",
      data: { input: "Why?" },
    });

    expect(() =>
      recorder.recordAssessment({
        turn: 1,
        eventRange: { fromSequence: 1, toSequence: 2 },
        comprehension: "uncertain",
        responseRelevance: "not_applicable",
        informationGain: "not_applicable",
        characterAgency: "not_observable",
        psychologicalMovement: "not_observable",
        causalLegibility: "not_yet_exercised",
        intervention: "continue",
        notes: [],
      }),
    ).toThrow("Assessment range must reference recorded events");
    expect(lines).toHaveLength(1);
  });

  it("LDO-OBS-001 LDO-OBS-007 creates a durable local JSONL journal", async () => {
    const rootDirectory = await mkdtemp(join(tmpdir(), "ldo-playtest-log-"));
    try {
      const journal = createLocalPlaytestRecorder({
        rootDirectory,
        sessionId: "session-durable",
        now: () => new Date("2026-07-16T07:00:00.000Z"),
      });

      journal.recorder.record({
        visibility: "observer",
        type: "session_started",
        data: { model: "gpt-5.6-luna" },
      });

      expect(journal.path).toBe(
        join(rootDirectory, "session-durable.jsonl"),
      );
      const records = (await readFile(journal.path, "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      expect(records).toEqual([
        expect.objectContaining({
          sessionId: "session-durable",
          sequence: 1,
          type: "session_started",
          data: { model: "gpt-5.6-luna" },
        }),
      ]);
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });
});

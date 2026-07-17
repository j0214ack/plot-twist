import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { LeaveDoorOpenWebCheckpoint } from "./leave-door-open-api";
import {
  FileLeaveDoorOpenPersistence,
  formatLeaveDoorOpenConsoleSummary,
  type PersistedLeaveDoorOpenSession,
} from "./leave-door-open-persistence";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

const root = (): string => {
  const directory = mkdtempSync(join(tmpdir(), "ldo-persistence-"));
  roots.push(directory);
  return directory;
};

const checkpoint = (screen: string): LeaveDoorOpenWebCheckpoint =>
  ({
    schemaVersion: 1,
    latestScreen: screen,
    controller: { schemaVersion: 1, locale: "zh-TW" },
    terminal: { schemaVersion: 1, started: true, ended: false },
  }) as LeaveDoorOpenWebCheckpoint;

const saved = (screen: string): PersistedLeaveDoorOpenSession => ({
  schemaVersion: 1,
  sourceSessionId: "runtime-session-a",
  locale: "zh-TW",
  savedAt: "2026-07-17T07:00:00.000Z",
  checkpoint: checkpoint(screen),
});

describe("Leave the Door Open file persistence", () => {
  // Spec: ADR 0036 LDO-SAVE-007.
  it("summarizes an observer record without dumping prompts, screens, or parsed state", () => {
    const summary = formatLeaveDoorOpenConsoleSummary(
      JSON.stringify({
        sessionId: "runtime-a",
        sequence: 41,
        type: "model_call_completed",
        data: {
          role: "persona",
          latencyMs: 1234,
          usage: { inputTokens: 500, outputTokens: 60, reasoningTokens: 20 },
          instructions: "private prompt",
          screen: "the entire cumulative screen",
          parsed: { reply: "private story state" },
        },
      }),
    );

    expect(summary).toBe(
      "[LDO runtime-a #41] model_call_completed role=persona latency=1234ms tokens=500/60/20",
    );
    expect(summary).not.toMatch(/private|screen|prompt|reply/);
  });

  // Spec: ADR 0036 LDO-SAVE-002, LDO-SAVE-004, and LDO-SAVE-010.
  it("atomically replaces one browser player's locale-specific checkpoint", async () => {
    const directory = root();
    const store = new FileLeaveDoorOpenPersistence(directory);

    await store.save("player-a", "zh-TW", saved("first"));
    await store.save("player-a", "zh-TW", saved("second"));
    await store.save("player-a", "en", {
      ...saved("english"),
      locale: "en",
      checkpoint: {
        ...checkpoint("english"),
        controller: {
          ...checkpoint("english").controller,
          locale: "en",
        },
      },
    });

    await expect(store.load("player-a", "zh-TW")).resolves.toEqual(
      saved("second"),
    );
    await expect(store.load("player-a", "en")).resolves.toMatchObject({
      locale: "en",
      checkpoint: { latestScreen: "english" },
    });
    await expect(store.load("player-b", "zh-TW")).resolves.toBeNull();
    expect(
      readdirSync(join(directory, "sessions")).some((name) =>
        name.includes(".tmp"),
      ),
    ).toBe(false);
  });

  // Spec: ADR 0036 LDO-SAVE-007.
  it("appends exact observer JSON lines to a runtime-session journal", async () => {
    const directory = root();
    const store = new FileLeaveDoorOpenPersistence(directory);

    store.appendJournalLine("runtime-a", '{"sequence":1}\n');
    store.appendJournalLine("runtime-a", '{"sequence":2}\n');

    expect(store.readJournal("runtime-a")).toBe(
      '{"sequence":1}\n{"sequence":2}\n',
    );
  });

  // Spec: ADR 0036 LDO-SAVE-009.
  it("fails closed when a persisted checkpoint document is malformed", async () => {
    const directory = root();
    const store = new FileLeaveDoorOpenPersistence(directory);
    const path = store.sessionPath("player-a", "zh-TW");
    writeFileSync(path, '{"schemaVersion":99}', "utf8");

    await expect(store.load("player-a", "zh-TW")).rejects.toThrow(
      "Invalid persisted Leave the Door Open session",
    );
  });
});

import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("local terminal playtest executable", () => {
  it("LDO-OBS-001 LDO-OBS-002 LDO-OBS-004 journals a no-model terminal session end to end", async () => {
    const logRoot = await mkdtemp(join(tmpdir(), "ldo-runner-log-"));
    const sessionId = "runner-acceptance";
    try {
      const result = spawnSync(
        process.execPath,
        [
          "--import",
          "tsx",
          resolve(
            process.cwd(),
            "pocs/leave-the-door-open/src/run-terminal-playtest.ts",
          ),
        ],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            LDO_PLAY_LOG_ROOT: logRoot,
            LDO_PLAY_SESSION_ID: sessionId,
            LDO_PLAY_DISABLE_GENERATED_PERFORMANCE: "1",
          },
          input: "/quit\n",
          encoding: "utf8",
        },
      );

      expect(result.status).toBe(0);
      const path = join(logRoot, `${sessionId}.jsonl`);
      const records = (await readFile(path, "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      expect(records.map(({ type }) => type)).toEqual([
        "session_started",
        "screen_rendered",
        "player_input",
        "screen_rendered",
        "input_handled",
        "session_ended",
      ]);
      expect(records[0]).toMatchObject({
        visibility: "observer",
        data: {
          model: "gpt-5.6-luna",
          reasoningEffort: "low",
          personaPrompt: "persona-v7.md",
          actionJudgePrompt: "action-judge-v4.md",
          performanceDirectorPrompt: "performance-director-v1.md",
          generatedPerformance: false,
        },
      });
      expect(records[1]).toMatchObject({
        visibility: "player",
        data: { screen: expect.stringContaining("Martin") },
      });
      expect(records[2]).toMatchObject({
        visibility: "player",
        data: { input: "/quit" },
      });
      expect(records.at(-1)).toMatchObject({
        visibility: "observer",
        data: { reason: "player_quit" },
      });
      expect(result.stderr).toContain(path);
      expect(await readFile(path, "utf8")).not.toContain("OPENAI_API_KEY");
    } finally {
      await rm(logRoot, { recursive: true, force: true });
    }
  });
});

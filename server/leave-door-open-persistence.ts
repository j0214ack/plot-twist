import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";
import type { GameLocale } from "../pocs/leave-the-door-open/src/localization";
import type { LeaveDoorOpenWebCheckpoint } from "./leave-door-open-api";

export const formatLeaveDoorOpenConsoleSummary = (line: string): string => {
  let record: unknown;
  try {
    record = JSON.parse(line);
  } catch {
    return "[LDO] observer journal record written";
  }
  if (typeof record !== "object" || record === null) {
    return "[LDO] observer journal record written";
  }
  const value = record as Record<string, unknown>;
  const sessionId =
    typeof value.sessionId === "string" ? value.sessionId : "unknown";
  const sequence =
    typeof value.sequence === "number" ? ` #${value.sequence}` : "";
  const eventType = typeof value.type === "string" ? value.type : "event";
  const data =
    typeof value.data === "object" && value.data !== null
      ? (value.data as Record<string, unknown>)
      : {};
  const fields: string[] = [];
  if (typeof data.role === "string") fields.push(`role=${data.role}`);
  if (typeof data.latencyMs === "number") {
    fields.push(`latency=${data.latencyMs}ms`);
  }
  if (typeof data.usage === "object" && data.usage !== null) {
    const usage = data.usage as Record<string, unknown>;
    if (
      typeof usage.inputTokens === "number" &&
      typeof usage.outputTokens === "number" &&
      typeof usage.reasoningTokens === "number"
    ) {
      fields.push(
        `tokens=${usage.inputTokens}/${usage.outputTokens}/${usage.reasoningTokens}`,
      );
    }
  }
  return `[LDO ${sessionId}${sequence}] ${eventType}${
    fields.length === 0 ? "" : ` ${fields.join(" ")}`
  }`;
};

export type PersistedLeaveDoorOpenSession = {
  schemaVersion: 1;
  sourceSessionId: string;
  locale: GameLocale;
  savedAt: string;
  checkpoint: LeaveDoorOpenWebCheckpoint;
};

export interface LeaveDoorOpenPersistence {
  load(
    playerId: string,
    locale: GameLocale,
  ): Promise<PersistedLeaveDoorOpenSession | null>;
  save(
    playerId: string,
    locale: GameLocale,
    session: PersistedLeaveDoorOpenSession,
  ): Promise<void>;
  remove(playerId: string, locale: GameLocale): Promise<void>;
  appendJournalLine(sessionId: string, line: string): void;
}

export class FileLeaveDoorOpenPersistence
  implements LeaveDoorOpenPersistence
{
  readonly #sessionsDirectory: string;
  readonly #journalsDirectory: string;

  constructor(readonly rootDirectory: string) {
    if (!rootDirectory.trim()) {
      throw new Error("Leave the Door Open data directory is required");
    }
    this.#sessionsDirectory = join(rootDirectory, "sessions");
    this.#journalsDirectory = join(rootDirectory, "journals");
    mkdirSync(this.#sessionsDirectory, { recursive: true });
    mkdirSync(this.#journalsDirectory, { recursive: true });
  }

  sessionPath(playerId: string, locale: GameLocale): string {
    const key = createHash("sha256")
      .update(playerId)
      .update("\0")
      .update(locale)
      .digest("hex");
    return join(this.#sessionsDirectory, `${key}.json`);
  }

  async load(
    playerId: string,
    locale: GameLocale,
  ): Promise<PersistedLeaveDoorOpenSession | null> {
    const path = this.sessionPath(playerId, locale);
    if (!existsSync(path)) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      throw new Error("Invalid persisted Leave the Door Open session");
    }
    return validatePersistedSession(parsed, locale);
  }

  async save(
    playerId: string,
    locale: GameLocale,
    session: PersistedLeaveDoorOpenSession,
  ): Promise<void> {
    const validated = validatePersistedSession(session, locale);
    const destination = this.sessionPath(playerId, locale);
    const temporary = `${destination}.${randomUUID()}.tmp`;
    try {
      writeFileSync(temporary, `${JSON.stringify(validated)}\n`, {
        encoding: "utf8",
        flag: "wx",
      });
      renameSync(temporary, destination);
    } finally {
      rmSync(temporary, { force: true });
    }
  }

  async remove(playerId: string, locale: GameLocale): Promise<void> {
    rmSync(this.sessionPath(playerId, locale), { force: true });
  }

  appendJournalLine(sessionId: string, line: string): void {
    appendFileSync(this.journalPath(sessionId), line, "utf8");
  }

  readJournal(sessionId: string): string {
    return readFileSync(this.journalPath(sessionId), "utf8");
  }

  private journalPath(sessionId: string): string {
    if (!/^[A-Za-z0-9._-]{1,100}$/.test(sessionId)) {
      throw new Error("Invalid Leave the Door Open journal session ID");
    }
    return join(this.#journalsDirectory, `${sessionId}.jsonl`);
  }
}

const validatePersistedSession = (
  value: unknown,
  locale: GameLocale,
): PersistedLeaveDoorOpenSession => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 1 ||
    !("sourceSessionId" in value) ||
    typeof value.sourceSessionId !== "string" ||
    !/^[A-Za-z0-9._-]{1,100}$/.test(value.sourceSessionId) ||
    !("locale" in value) ||
    value.locale !== locale ||
    !("savedAt" in value) ||
    typeof value.savedAt !== "string" ||
    !Number.isFinite(Date.parse(value.savedAt)) ||
    !("checkpoint" in value) ||
    typeof value.checkpoint !== "object" ||
    value.checkpoint === null ||
    !("schemaVersion" in value.checkpoint) ||
    value.checkpoint.schemaVersion !== 1 ||
    !("latestScreen" in value.checkpoint) ||
    typeof value.checkpoint.latestScreen !== "string" ||
    !("controller" in value.checkpoint) ||
    typeof value.checkpoint.controller !== "object" ||
    value.checkpoint.controller === null ||
    !("schemaVersion" in value.checkpoint.controller) ||
    value.checkpoint.controller.schemaVersion !== 1 ||
    !("locale" in value.checkpoint.controller) ||
    value.checkpoint.controller.locale !== locale ||
    !("terminal" in value.checkpoint) ||
    typeof value.checkpoint.terminal !== "object" ||
    value.checkpoint.terminal === null ||
    !("schemaVersion" in value.checkpoint.terminal) ||
    value.checkpoint.terminal.schemaVersion !== 1
  ) {
    throw new Error("Invalid persisted Leave the Door Open session");
  }
  return structuredClone(value) as PersistedLeaveDoorOpenSession;
};

export type PlaytestEventVisibility = "player" | "observer";

export type PlaytestEventInput<TData = unknown> = {
  visibility: PlaytestEventVisibility;
  type: string;
  data: TData;
};

export type RecordedPlaytestEvent<TData = unknown> =
  PlaytestEventInput<TData> & {
    schemaVersion: 1;
    sessionId: string;
    sequence: number;
    timestamp: string;
  };

export type PlaytestSessionRecorderOptions = {
  sessionId: string;
  appendLine: (line: string) => void;
  now?: () => Date;
};

export type QualitativePlaytestAssessment = {
  turn: number;
  eventRange: {
    fromSequence: number;
    toSequence: number;
  };
  comprehension: "clear" | "uncertain" | "lost" | "not_observable";
  responseRelevance: "direct" | "partial" | "missed" | "not_applicable";
  informationGain: "new" | "partial" | "none" | "not_applicable";
  characterAgency:
    | "credible"
    | "mechanical_resistance"
    | "overcompliant"
    | "not_observable";
  psychologicalMovement:
    | "earned"
    | "unchanged_but_coherent"
    | "unearned"
    | "stalled"
    | "not_observable";
  causalLegibility: "clear" | "unclear" | "not_yet_exercised";
  intervention: "continue" | "flag" | "pause_and_discuss" | "stop";
  notes: string[];
};

export class PlaytestSessionRecorder {
  #sequence = 0;
  readonly #now: () => Date;

  constructor(private readonly options: PlaytestSessionRecorderOptions) {
    this.#now = options.now ?? (() => new Date());
  }

  record<TData>(
    input: PlaytestEventInput<TData>,
  ): RecordedPlaytestEvent<TData> {
    const event: RecordedPlaytestEvent<TData> = {
      schemaVersion: 1,
      sessionId: this.options.sessionId,
      sequence: this.#sequence + 1,
      timestamp: this.#now().toISOString(),
      ...input,
    };
    this.options.appendLine(`${JSON.stringify(event)}\n`);
    this.#sequence = event.sequence;
    return event;
  }

  recordAssessment(
    assessment: QualitativePlaytestAssessment,
  ): RecordedPlaytestEvent<QualitativePlaytestAssessment> {
    const { fromSequence, toSequence } = assessment.eventRange;
    if (
      !Number.isSafeInteger(fromSequence) ||
      !Number.isSafeInteger(toSequence) ||
      fromSequence < 1 ||
      fromSequence > toSequence ||
      toSequence > this.#sequence
    ) {
      throw new Error("Assessment range must reference recorded events");
    }
    return this.record({
      visibility: "observer",
      type: "qualitative_assessment",
      data: assessment,
    });
  }
}

export type LocalPlaytestRecorderOptions = {
  rootDirectory: string;
  sessionId: string;
  now?: () => Date;
};

export const createLocalPlaytestRecorder = (
  options: LocalPlaytestRecorderOptions,
): { recorder: PlaytestSessionRecorder; path: string } => {
  mkdirSync(options.rootDirectory, { recursive: true });
  const path = join(options.rootDirectory, `${options.sessionId}.jsonl`);
  closeSync(openSync(path, "wx"));
  return {
    path,
    recorder: new PlaytestSessionRecorder({
      sessionId: options.sessionId,
      now: options.now,
      appendLine: (line) => appendFileSync(path, line, "utf8"),
    }),
  };
};
import {
  appendFileSync,
  closeSync,
  mkdirSync,
  openSync,
} from "node:fs";
import { join } from "node:path";

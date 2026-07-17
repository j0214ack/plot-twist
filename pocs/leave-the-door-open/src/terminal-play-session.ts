import {
  type PlayerCommand,
  type VerticalSliceGameController,
} from "./controller";
import { projectGame } from "./presentation";
import {
  composeTextLayers,
  renderUIText,
  renderWorldText,
} from "./text-rendering";
import { localize, type PlayerCopyKey } from "./localization";

export type TerminalPlayResult = {
  ended: boolean;
};

export type TerminalDialogueBeginResult = TerminalPlayResult & {
  dialogueResolutionPending: boolean;
};

export type TerminalAdvanceResult = TerminalPlayResult & {
  advancePending: boolean;
};

export type TerminalOutput = (screen: string) => void;

const CLOCK_PAUSE = 7 * 60 + 57;
const MINUTES_PER_DAY = 24 * 60;
const CHAPTER_ONE_OPENING_LOCAL_TIME = 8 * 60 + 20;
const CHAPTER_ONE_DAY_TWO_HUSBAND_LOCAL_TIME = 8 * 60 + 10;
type TimeAdvancePlan = {
  targetTime: number;
  completion:
    | { kind: "pause"; guide: string; selectNpcId?: "husband" | "wife" }
    | { kind: "end"; guide: string };
};

export class TerminalPlaySession {
  #started = false;
  #ended = false;
  #timeAdvancePlan: TimeAdvancePlan | null = null;

  constructor(
    private readonly controller: VerticalSliceGameController,
    private readonly output: TerminalOutput,
    private readonly observeError: (error: unknown) => void = () => {},
  ) {}

  async start(): Promise<void> {
    if (this.#started) {
      throw new Error("Terminal play session has already started");
    }
    this.#started = true;
    await this.controller.advanceToWithPerformance(CLOCK_PAUSE);
    this.controller.dispatch({ type: "pause_world" });
    this.controller.dispatch({ type: "select_npc", npcId: "husband" });
    this.#render(this.#text("terminal.openingGuide"));
  }

  async handleInput(rawInput: string): Promise<TerminalPlayResult> {
    if (!this.#started) {
      throw new Error("Terminal play session has not started");
    }
    if (this.#ended) return { ended: true };

    const input = rawInput.trim();
    if (input.length === 0) {
      this.#render(this.#text("terminal.emptyInput"));
      return { ended: false };
    }
    if (input === "/quit") {
      this.#ended = true;
      this.#render(this.#text("terminal.ended"));
      return { ended: true };
    }
    if (input === "/help") {
      this.#render(
        this.controller.snapshot().world.chapter === 1
          ? this.#text("terminal.chapterHelpGuide")
          : this.#text("terminal.helpGuide"),
      );
      return { ended: false };
    }
    if (input === "/resume") {
      return this.#resumeScenario();
    }
    if (input.startsWith("/focus")) {
      return this.#focus(input);
    }

    const optionNumber = parseOptionNumber(input);
    if (optionNumber !== null) {
      const optionId =
        this.controller.snapshot().interaction.availableActionOptionIds[
          optionNumber - 1
        ];
      if (optionId === undefined) {
        this.#render(
          this.controller.snapshot().world.chapter === "tutorial"
            ? this.#text("terminal.noTutorialOption")
            : this.#text("terminal.noOption", { optionNumber }),
        );
        return { ended: false };
      }
      await this.#dispatchAsync({
        type: "select_action_option",
        optionId,
      });
      return { ended: false };
    }

    await this.#dispatchAsync({ type: "submit_dialogue", text: input });
    return { ended: false };
  }

  async beginInput(rawInput: string): Promise<TerminalDialogueBeginResult> {
    const input = rawInput.trim();
    if (!isDialogueInput(input)) {
      return {
        ...(await this.handleInput(rawInput)),
        dialogueResolutionPending: false,
      };
    }
    if (!this.#started) {
      throw new Error("Terminal play session has not started");
    }
    if (this.#ended) {
      return { ended: true, dialogueResolutionPending: false };
    }

    try {
      await this.controller.beginDialogue(input);
      this.#render();
      return {
        ended: false,
        dialogueResolutionPending:
          this.controller.snapshot().interaction.conversationStatus ===
          "awaiting_awareness",
      };
    } catch (error) {
      this.observeError(error);
      this.#render();
      return { ended: false, dialogueResolutionPending: false };
    }
  }

  async resolveDialogue(): Promise<TerminalPlayResult> {
    if (!this.#started) {
      throw new Error("Terminal play session has not started");
    }
    if (this.#ended) return { ended: true };
    try {
      await this.controller.resolvePendingDialogue();
      this.#render();
    } catch (error) {
      this.observeError(error);
      this.#render();
    }
    return { ended: false };
  }

  async #dispatchAsync(command: PlayerCommand): Promise<void> {
    try {
      const pending = this.controller.dispatch(command);
      if (pending !== undefined) {
        this.#render();
        await pending;
      }
      this.#render();
    } catch (error) {
      this.observeError(error);
      this.#render();
    }
  }

  async beginTimeAdvance(): Promise<TerminalAdvanceResult> {
    return this.#beginTimeAdvance(true);
  }

  async advanceTurn(): Promise<TerminalAdvanceResult> {
    return this.#advanceTurn(true);
  }

  async #resumeScenario(): Promise<TerminalPlayResult> {
    let result = await this.#beginTimeAdvance(false);
    while (result.advancePending) {
      result = await this.#advanceTurn(false);
    }
    return { ended: result.ended };
  }

  async #beginTimeAdvance(
    renderIntermediate: boolean,
  ): Promise<TerminalAdvanceResult> {
    if (!this.#started) {
      throw new Error("Terminal play session has not started");
    }
    if (this.#ended) return { ended: true, advancePending: false };
    if (this.#timeAdvancePlan !== null) {
      throw new Error("Time advance is already in progress");
    }

    const snapshot = this.controller.snapshot();
    const plan = this.#timeAdvancePlanFor(snapshot);
    if (plan === null) {
      this.#render(this.#text("terminal.cannotAdvance"));
      return { ended: false, advancePending: false };
    }
    this.#timeAdvancePlan = plan;
    this.controller.dispatch({ type: "resume_world" });
    return this.#advanceTurn(renderIntermediate);
  }

  #timeAdvancePlanFor(
    snapshot: ReturnType<VerticalSliceGameController["snapshot"]>,
  ): TimeAdvancePlan | null {
    if (
      snapshot.world.chapter === "tutorial" &&
      snapshot.world.time % MINUTES_PER_DAY === CLOCK_PAUSE
    ) {
      const hasIntention = snapshot.world.intentions.some(
        ({ actorId, actionId }) =>
          actorId === "husband" &&
          actionId === "interact_with_living_room_clock",
      );
      if (!hasIntention) {
        const nextClockPause =
          (Math.floor(snapshot.world.time / MINUTES_PER_DAY) + 1) *
            MINUTES_PER_DAY +
          CLOCK_PAUSE;
        return {
          targetTime: nextClockPause,
          completion: {
            kind: "pause",
            guide: this.#text("terminal.tutorialObservationGuide"),
            selectNpcId: "husband",
          },
        };
      }
      const chapterOpening =
        (Math.floor(snapshot.world.time / MINUTES_PER_DAY) + 1) *
          MINUTES_PER_DAY +
        CHAPTER_ONE_OPENING_LOCAL_TIME;
      return {
        targetTime: chapterOpening,
        completion: {
          kind: "pause",
          guide: this.#text("terminal.chapterOpeningGuide"),
        },
      };
    }

    if (
      snapshot.world.chapter === 1 &&
      snapshot.world.chapterDay === 1 &&
      snapshot.world.time % MINUTES_PER_DAY ===
        CHAPTER_ONE_OPENING_LOCAL_TIME
    ) {
      const nextCalendarDay =
        Math.floor(snapshot.world.time / MINUTES_PER_DAY) + 1;
      return {
        targetTime:
          nextCalendarDay * MINUTES_PER_DAY +
          CHAPTER_ONE_DAY_TWO_HUSBAND_LOCAL_TIME,
        completion: {
          kind: "pause",
          guide: this.#text("terminal.noActionContinuationGuide"),
        },
      };
    }

    if (snapshot.world.chapter === 1 && snapshot.world.chapterDay !== null) {
      const calendarDay = Math.floor(snapshot.world.time / MINUTES_PER_DAY);
      const wifeActivity = snapshot.world.npcs.wife.visibleActivityId;
      const husbandActivity = snapshot.world.npcs.husband.visibleActivityId;

      if (husbandActivity === "reaching_closed_door_handle") {
        const hasIntention = hasWorldIntention(
          snapshot,
          "husband",
          "open_door_a_crack",
        );
        return {
          targetTime: hasIntention
            ? calendarDay * MINUTES_PER_DAY + 17 * 60 + 40
            : (calendarDay + 1) * MINUTES_PER_DAY + 8 * 60 + 10,
          completion: {
            kind: "pause",
            guide: hasIntention
              ? this.#text("terminal.nextRoutineGuide")
              : this.#text("terminal.noActionContinuationGuide"),
          },
        };
      }

      if (wifeActivity === "observing_first_door_gap") {
        return {
          targetTime:
            (calendarDay + 1) * MINUTES_PER_DAY + 8 * 60 + 20,
          completion: {
            kind: "pause",
            guide: this.#text("terminal.noActionContinuationGuide"),
          },
        };
      }

      if (wifeActivity === "stopping_one_step_short") {
        return this.#wifePhasePlan("remain_at_threshold");
      }

      if (wifeActivity === "returning_to_boundary") {
        return this.#wifePhasePlan("step_inside_room");
      }

      if (wifeActivity === "noticing_closed_room_window") {
        const hasIntention = hasWorldIntention(
          snapshot,
          "wife",
          "open_room_window",
        );
        if (hasIntention) {
          return {
            targetTime: calendarDay * MINUTES_PER_DAY + 8 * 60 + 21,
            completion: {
              kind: "end",
              guide: this.#text("terminal.chapterComplete"),
            },
          };
        }
        return {
          targetTime:
            (calendarDay + 1) * MINUTES_PER_DAY + 8 * 60 + 20,
          completion: {
            kind: "pause",
            guide: this.#text("terminal.noActionContinuationGuide"),
          },
        };
      }
    }

    return null;
  }

  #wifePhasePlan(
    actionId: "remain_at_threshold" | "step_inside_room",
  ): TimeAdvancePlan {
    const hasIntention = hasWorldIntention(
      this.controller.snapshot(),
      "wife",
      actionId,
    );
    const calendarDay = Math.floor(
      this.controller.snapshot().world.time / MINUTES_PER_DAY,
    );
    return {
      targetTime: (calendarDay + 1) * MINUTES_PER_DAY + 8 * 60 + 20,
      completion: {
        kind: "pause",
        guide: hasIntention
          ? this.#text("terminal.nextRoutineGuide")
          : this.#text("terminal.noActionContinuationGuide"),
      },
    };
  }

  async #advanceTurn(
    renderIntermediate: boolean,
  ): Promise<TerminalAdvanceResult> {
    const plan = this.#timeAdvancePlan;
    if (plan === null) {
      throw new Error("No time advance is in progress");
    }
    const turn = await this.controller.advanceTurn(plan.targetTime);
    if (!turn.reachedTarget) {
      if (renderIntermediate) this.#render();
      return { ended: false, advancePending: true };
    }

    this.#timeAdvancePlan = null;
    if (plan.completion.kind === "end") {
      this.#ended = true;
      this.#render(plan.completion.guide);
      return { ended: true, advancePending: false };
    }
    this.controller.dispatch({ type: "pause_world" });
    if (plan.completion.selectNpcId !== undefined) {
      this.controller.dispatch({
        type: "select_npc",
        npcId: plan.completion.selectNpcId,
      });
    }
    this.#render(plan.completion.guide);
    return { ended: false, advancePending: false };
  }

  #focus(input: string): TerminalPlayResult {
    if (this.controller.snapshot().world.chapter === "tutorial") {
      if (input === "/focus martin" || input === "/focus husband") {
        this.controller.dispatch({
          type: "select_npc",
          npcId: "husband",
        });
        this.#render();
        return { ended: false };
      }
      this.#render(
        this.#text("terminal.tutorialFocusUnavailable"),
      );
      return { ended: false };
    }
    const match = /^\/focus\s+(martin|elise|husband|wife)$/.exec(input);
    if (match === null) {
      this.#render(this.#text("terminal.focusUsage"));
      return { ended: false };
    }
    if (!this.controller.snapshot().world.paused) {
      this.#render(this.#text("terminal.focusPaused"));
      return { ended: false };
    }

    this.controller.dispatch({
      type: "select_npc",
      npcId:
        match[1] === "martin" || match[1] === "husband"
          ? "husband"
          : "wife",
    });
    this.#render();
    return { ended: false };
  }

  #render(message?: string): void {
    const snapshot = this.controller.snapshot();
    const view = projectGame(snapshot);
    const layers = composeTextLayers(
      renderWorldText(view.world),
      renderUIText(view.ui, {
        showFocus: snapshot.world.chapter === 1,
      }),
    );
    const hints: string[] = [];
    if (
      snapshot.world.paused &&
      snapshot.world.intentions.length > 0 &&
      snapshot.interaction.selectedNpcId === null
    ) {
      hints.push(
        this.#text("terminal.intentionFormed"),
      );
    }
    if (message !== undefined) hints.push(message);
    this.output(
      [
        this.#text("terminal.title"),
        "",
        layers,
        ...hints.map((hint) => `\n${hint}`),
      ].join("\n"),
    );
  }

  #text(
    key: PlayerCopyKey,
    values: Record<string, string | number> = {},
  ): string {
    return localize(this.controller.snapshot().locale, key, values);
  }
}

const parseOptionNumber = (input: string): number | null => {
  if (!/^\d+$/.test(input)) return null;
  const parsed = Number(input);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const isDialogueInput = (input: string): boolean =>
  input.length > 0 && !input.startsWith("/") && !/^\d+$/.test(input);

const hasWorldIntention = (
  snapshot: ReturnType<VerticalSliceGameController["snapshot"]>,
  actorId: "husband" | "wife",
  actionId:
    | "open_door_a_crack"
    | "remain_at_threshold"
    | "step_inside_room"
    | "open_room_window",
): boolean =>
  snapshot.world.intentions.some(
    (intention) =>
      intention.actorId === actorId && intention.actionId === actionId,
  );

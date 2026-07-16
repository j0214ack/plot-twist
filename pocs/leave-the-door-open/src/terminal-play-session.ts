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

export type TerminalPlayResult = {
  ended: boolean;
};

export type TerminalOutput = (screen: string) => void;

const CLOCK_PAUSE = 7 * 60 + 57;
const MINUTES_PER_DAY = 24 * 60;
const CHAPTER_ONE_OPENING_LOCAL_TIME = 8 * 60 + 20;
const CHAPTER_ONE_DAY_TWO_HUSBAND_LOCAL_TIME = 8 * 60 + 10;
const OBSERVE_OR_ACT_GUIDE =
  "You can let time continue now to observe, or wait until an intention forms to change the world.";

const TUTORIAL_MENTAL_MODEL = [
  "You are a voice inside Martin's self-talk.",
  "You cannot control his body.",
  "Your goal: Help Martin discover a next step he can genuinely accept.",
].join("\n");

const CHAPTER_ONE_MENTAL_MODEL = [
  "You are a voice inside the current person's self-talk.",
  "You cannot control their body.",
  "Your goal: Help each person discover a next step they can genuinely accept.",
].join("\n");

const OPENING_GUIDE = [
  TUTORIAL_MENTAL_MODEL,
  "",
  "Start here: The living-room clock is three minutes slow. Martin notices it most mornings and usually keeps walking; today he stopped. Talk to him in your own words.",
  'Try: "What made those three minutes worth stopping for today?"',
  'Or: "What do you notice when you let yourself look at it?"',
  "No exact phrase is required.",
  "",
  "If a numbered Possibility appears, type its number.",
  OBSERVE_OR_ACT_GUIDE,
  "Type /help to see this guide again, or /quit to stop.",
].join("\n");

const HELP_GUIDE = [
  TUTORIAL_MENTAL_MODEL,
  "",
  "Speak by typing normally. The character may agree, resist, or change gradually.",
  'Try: "What made those three minutes worth stopping for today?"',
  'Or: "What do you notice when you let yourself look at it?"',
  "No exact phrase is required.",
  "Enter a Possibility number when one appears.",
  OBSERVE_OR_ACT_GUIDE,
  "Use /quit to stop.",
].join("\n");

const CHAPTER_ONE_OPENING_GUIDE = [
  "Chapter 1 — The End of the Hall",
  "Day 1 — Morning",
  "",
  "The clock shows the current time.",
  "The household begins another day.",
  "",
  "The tutorial showed how a possibility can change the world. Here, movement may take more than one conversation or one day.",
  "",
  "Watch the household's routines. When the world pauses, choose whose thoughts to enter with /focus martin or /focus elise. Talk in your own words, or use /resume to let time continue even when no Possibility has formed.",
  "",
  "Current thread: Watch what each person does when their route reaches the hall.",
  "",
  "Choose whose inner thoughts to enter: /focus martin or /focus elise.",
].join("\n");

const CONVERSATION_ACTION_BOUNDARY_GUIDE = [
  "A character may discuss an idea even when it is not an available world action at this pause.",
  "Only numbered Possibilities can be selected as world actions; other conversation can still change how the character thinks.",
];

const CHAPTER_ONE_HELP_GUIDE = [
  CHAPTER_ONE_MENTAL_MODEL,
  "",
  "Watch the household's routines. When the world pauses, choose whose thoughts to enter with /focus martin or /focus elise.",
  "Speak by typing normally. The character may agree, resist, or change gradually; no exact phrase is required.",
  ...CONVERSATION_ACTION_BOUNDARY_GUIDE,
  "Enter a Possibility number when one appears, or use /resume to let time continue without one.",
  "Current thread: Watch what each person does when their route reaches the hall.",
  "Use /quit to stop.",
].join("\n");

const NO_ACTION_CONTINUATION_GUIDE = [
  "No world intention formed, so no action was scheduled.",
  "Anything established in conversation remains.",
  ...CONVERSATION_ACTION_BOUNDARY_GUIDE,
  "Time moved to a new routine moment.",
  "Choose whose inner thoughts to enter: /focus martin or /focus elise.",
].join("\n");

const NEXT_ROUTINE_GUIDE = [
  "The accepted intention has played out.",
  "Time moved to a new routine moment.",
  "Choose whose inner thoughts to enter: /focus martin or /focus elise.",
].join("\n");

const CHAPTER_ONE_COMPLETE = [
  "Chapter 1 complete.",
  "The room's window is open one hand-width.",
].join("\n");

const TUTORIAL_OBSERVATION_GUIDE = [
  "You let the day pass without changing anything. The clock is still three minutes slow.",
  "Anything Martin came to understand in conversation remains.",
  "You are back with Martin at the next morning's clock moment.",
].join(" ");

export class TerminalPlaySession {
  #started = false;
  #ended = false;

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
    this.#render(OPENING_GUIDE);
  }

  async handleInput(rawInput: string): Promise<TerminalPlayResult> {
    if (!this.#started) {
      throw new Error("Terminal play session has not started");
    }
    if (this.#ended) return { ended: true };

    const input = rawInput.trim();
    if (input.length === 0) {
      this.#render("Type a thought, /help, or /quit.");
      return { ended: false };
    }
    if (input === "/quit") {
      this.#ended = true;
      this.#render("Playtest ended.");
      return { ended: true };
    }
    if (input === "/help") {
      this.#render(
        this.controller.snapshot().world.chapter === 1
          ? CHAPTER_ONE_HELP_GUIDE
          : HELP_GUIDE,
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
            ? "No numbered Possibility is available yet. Keep talking with Martin about what feels possible with the clock today."
            : `Possibility ${optionNumber} is not available.`,
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

  async #resumeScenario(): Promise<TerminalPlayResult> {
    const snapshot = this.controller.snapshot();
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
        this.controller.dispatch({ type: "resume_world" });
        await this.controller.advanceToWithPerformance(nextClockPause);
        this.controller.dispatch({ type: "pause_world" });
        this.controller.dispatch({ type: "select_npc", npcId: "husband" });
        this.#render(TUTORIAL_OBSERVATION_GUIDE);
        return { ended: false };
      }
      this.controller.dispatch({ type: "resume_world" });
      const chapterOpening =
        (Math.floor(snapshot.world.time / MINUTES_PER_DAY) + 1) *
          MINUTES_PER_DAY +
        CHAPTER_ONE_OPENING_LOCAL_TIME;
      await this.controller.advanceToWithPerformance(chapterOpening);
      this.controller.dispatch({ type: "pause_world" });
      this.#render(CHAPTER_ONE_OPENING_GUIDE);
      return { ended: false };
    }

    if (
      snapshot.world.chapter === 1 &&
      snapshot.world.chapterDay === 1 &&
      snapshot.world.time % MINUTES_PER_DAY ===
        CHAPTER_ONE_OPENING_LOCAL_TIME
    ) {
      this.controller.dispatch({ type: "resume_world" });
      const nextCalendarDay =
        Math.floor(snapshot.world.time / MINUTES_PER_DAY) + 1;
      await this.controller.advanceToWithPerformance(
        nextCalendarDay * MINUTES_PER_DAY +
          CHAPTER_ONE_DAY_TWO_HUSBAND_LOCAL_TIME,
      );
      this.controller.dispatch({ type: "pause_world" });
      this.#render(NO_ACTION_CONTINUATION_GUIDE);
      return { ended: false };
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
        this.controller.dispatch({ type: "resume_world" });
        await this.controller.advanceToWithPerformance(
          hasIntention
            ? calendarDay * MINUTES_PER_DAY + 17 * 60 + 40
            : (calendarDay + 1) * MINUTES_PER_DAY + 8 * 60 + 10,
        );
        this.controller.dispatch({ type: "pause_world" });
        this.#render(
          hasIntention ? NEXT_ROUTINE_GUIDE : NO_ACTION_CONTINUATION_GUIDE,
        );
        return { ended: false };
      }

      if (wifeActivity === "observing_first_door_gap") {
        this.controller.dispatch({ type: "resume_world" });
        await this.controller.advanceToWithPerformance(
          (calendarDay + 1) * MINUTES_PER_DAY + 8 * 60 + 20,
        );
        this.controller.dispatch({ type: "pause_world" });
        this.#render(NO_ACTION_CONTINUATION_GUIDE);
        return { ended: false };
      }

      if (wifeActivity === "stopping_one_step_short") {
        return this.#advanceWifePhase("remain_at_threshold");
      }

      if (wifeActivity === "returning_to_boundary") {
        return this.#advanceWifePhase("step_inside_room");
      }

      if (wifeActivity === "noticing_closed_room_window") {
        const hasIntention = hasWorldIntention(
          snapshot,
          "wife",
          "open_room_window",
        );
        this.controller.dispatch({ type: "resume_world" });
        if (hasIntention) {
          await this.controller.advanceToWithPerformance(
            calendarDay * MINUTES_PER_DAY + 8 * 60 + 21,
          );
          this.#ended = true;
          this.#render(CHAPTER_ONE_COMPLETE);
          return { ended: true };
        }
        await this.controller.advanceToWithPerformance(
          (calendarDay + 1) * MINUTES_PER_DAY + 8 * 60 + 20,
        );
        this.controller.dispatch({ type: "pause_world" });
        this.#render(NO_ACTION_CONTINUATION_GUIDE);
        return { ended: false };
      }
    }

    this.#render("The world cannot advance from this moment.");
    return { ended: false };
  }

  async #advanceWifePhase(
    actionId: "remain_at_threshold" | "step_inside_room",
  ): Promise<TerminalPlayResult> {
    const hasIntention = hasWorldIntention(
      this.controller.snapshot(),
      "wife",
      actionId,
    );
    const calendarDay = Math.floor(
      this.controller.snapshot().world.time / MINUTES_PER_DAY,
    );
    this.controller.dispatch({ type: "resume_world" });
    await this.controller.advanceToWithPerformance(
      (calendarDay + 1) * MINUTES_PER_DAY + 8 * 60 + 20,
    );
    this.controller.dispatch({ type: "pause_world" });
    this.#render(
      hasIntention ? NEXT_ROUTINE_GUIDE : NO_ACTION_CONTINUATION_GUIDE,
    );
    return { ended: false };
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
        "That inner voice is not available here. You are hearing Martin's thoughts.",
      );
      return { ended: false };
    }
    const match = /^\/focus\s+(martin|elise|husband|wife)$/.exec(input);
    if (match === null) {
      this.#render("Use /focus martin or /focus elise.");
      return { ended: false };
    }
    if (!this.controller.snapshot().world.paused) {
      this.#render("Focus is available when the world is paused.");
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
        "An intention has formed. Type /resume to let the world continue.",
      );
    }
    if (message !== undefined) hints.push(message);
    this.output(
      [
        "Leave the Door Open — local text playtest",
        "",
        layers,
        ...hints.map((hint) => `\n${hint}`),
      ].join("\n"),
    );
  }
}

const parseOptionNumber = (input: string): number | null => {
  if (!/^\d+$/.test(input)) return null;
  const parsed = Number(input);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

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

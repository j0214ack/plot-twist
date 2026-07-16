import type {
  PresentationCue,
  PresentationCueId,
  UIView,
  WorldView,
} from "./presentation";

const cueText: Record<PresentationCueId, string> = {
  living_room_clock_slow: "Living room — The wall clock shows 07:54.",
  husband_notices_clock:
    "Living room — He looks up, starts to pass beneath it, then stops.",
  performance_beat: "",
  husband_sits: "Living room — He sits at the far end of the sofa.",
  husband_rinses_cup:
    "Dining area — He rinses his cup, dries the ring beneath it, and leaves it upside down.",
  husband_folds_sofa_throw:
    "Living room — He folds the sofa throw into the same narrow rectangle.",
  husband_turns_off_lights:
    "Living room — He turns off the lamps one by one, leaving the clock visible until last.",
  wife_drinks: "Dining area — She drinks a glass of water.",
  husband_reaches_door:
    "Hallway — He stops with one hand on the door handle.",
  world_paused: "The world pauses.",
  world_resumed: "The world resumes.",
  husband_interacts_clock:
    "Living room — He adjusts the clock to the current time.",
  living_room_clock_state_changed:
    "Living room — The clock now shows 07:59.",
  wife_notices_clock:
    "Dining area — She glances toward the clock and sees the correct time.",
  husband_opens_door:
    "Hallway — He opens the door just far enough to leave a narrow gap.",
  hallway_door_state_changed: "Hallway — The door is slightly open.",
  wife_enters_hallway: "Hallway — She walks into the hallway.",
  wife_notices_door: "Hallway — She notices the open door.",
  wife_stays_at_threshold: "Hallway — She remains at the threshold.",
  wife_steps_inside_room:
    "Room threshold — She steps one pace inside, remains briefly, then returns to the threshold.",
  wife_opens_room_window:
    "Room — She opens the window one hand-width and leaves it there.",
  husband_turns_before_closed_door:
    "Hallway — He walks down the hallway, slowing before the fully closed door. He turns back without reaching it.",
  wife_takes_long_route:
    "Hallway — She starts into the hallway, stops near its entrance, and returns to the dining area by the longer route.",
  husband_reaches_closed_handle:
    "Hallway — This time he does not turn back. He reaches the closed door and rests his hand on the handle without moving it.",
  husband_tests_window_latch:
    "Living room — He tests the window latch, finds its stopping point, and leaves it closed.",
  wife_squares_hallway_runner:
    "Hallway — She squares the near edge of the runner and leaves the far end untouched.",
  wife_observes_first_gap:
    "Hallway — She notices the narrow gap and stops away from the threshold without touching the door.",
  wife_stops_one_step_short:
    "Room threshold — The next morning she stops immediately outside, one step short of crossing. Nothing in the room changes.",
  wife_returns_to_boundary:
    "Room threshold — She returns and places one foot beside, not across, the line.",
  wife_notices_closed_window:
    "Room — From inside, she looks toward the closed window and changes nothing.",
  room_window_state_changed:
    "Room — The window is open one hand-width.",
  room_window_noticed: "Room — The open window is noticed.",
};

export const renderWorldText = (view: WorldView): string => {
  const lines: string[] = [];
  let renderedChapterDay: number | null = null;
  const chapterStartCalendarDay =
    view.chapter === 1 && view.chapterDay !== null
      ? Math.floor(view.time / (24 * 60)) - view.chapterDay + 1
      : null;

  for (const cue of view.timeline) {
    const calendarDay = Math.floor(cue.at / (24 * 60));
    const chapterDay =
      chapterStartCalendarDay !== null && calendarDay >= chapterStartCalendarDay
        ? calendarDay - chapterStartCalendarDay + 1
        : null;
    if (chapterDay !== null && chapterDay !== renderedChapterDay) {
      lines.push(`Chapter 1 — Day ${chapterDay}`);
      renderedChapterDay = chapterDay;
    }
    lines.push(renderCue(cue));
  }

  return lines.join("\n");
};

export const renderUIText = (
  view: UIView,
  options: { showFocus?: boolean } = {},
): string => {
  const lines = [view.mode === "paused" ? "[Paused]" : "[Running]"];

  if (view.selectedActor !== null && options.showFocus !== false) {
    lines.push(`Focus: ${view.selectedActor.label}`);
  }
  for (const message of view.conversation.messages) {
    const speaker =
      message.speaker === "player"
        ? "You"
        : (view.selectedActor?.label ?? "Inner voice");
    lines.push(`${speaker}: ${message.text}`);
  }
  switch (view.conversation.status) {
    case "awaiting_persona":
      lines.push("Inner voice is responding…");
      break;
    case "awaiting_awareness":
      lines.push("Considering possibilities…");
      break;
    case "awaiting_willingness":
      lines.push("Considering the choice…");
      break;
    case "closed_for_day":
      lines.push(
        `${view.selectedActor?.label ?? "This person"} has no more to add today. Observe the household or use /resume.`,
      );
      break;
    case "error":
      if (view.conversation.errorMessage !== null) {
        lines.push(view.conversation.errorMessage);
      }
      break;
    case "idle":
      break;
  }
  if (view.conversation.feedbackMessage !== null) {
    lines.push(view.conversation.feedbackMessage);
  }
  if (view.actionOptions.length > 0) {
    lines.push("Possibilities:");
    view.actionOptions.forEach((option, index) => {
      lines.push(`${index + 1}. ${option.label}`);
    });
  }

  return lines.join("\n");
};

export const composeTextLayers = (
  worldLayer: string,
  uiLayer: string,
): string => [worldLayer, uiLayer].filter((layer) => layer.length > 0).join("\n\n");

const renderCue = (cue: PresentationCue): string =>
  `${formatTime(cue.at)} — ${
    cue.cueId === "performance_beat" ? cue.text : cueText[cue.cueId]
  }`;

const formatTime = (minutes: number): string => {
  const localMinutes = minutes % (24 * 60);
  const hours = Math.floor(localMinutes / 60);
  const minute = localMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

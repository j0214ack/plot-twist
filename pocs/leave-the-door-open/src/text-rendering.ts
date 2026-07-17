import type {
  PresentationCue,
  UIView,
  WorldView,
} from "./presentation";
import { calendarWeekdayAt } from "./world";
import { localize, localizeCue, localizeWeekday } from "./localization";

export const renderWorldText = (view: WorldView): string => {
  const lines: string[] = [];
  let renderedCalendarDay: number | null = null;
  let renderedChapterDay: number | null = null;
  const chapterStartCalendarDay =
    view.chapter === 1 && view.chapterDay !== null
      ? Math.floor(view.time / (24 * 60)) - view.chapterDay + 1
      : null;

  for (const cue of view.timeline) {
    const calendarDay = Math.floor(cue.at / (24 * 60));
    if (calendarDay !== renderedCalendarDay) {
      lines.push(formatWeekday(cue.at, view.locale));
      renderedCalendarDay = calendarDay;
    }
    const chapterDay =
      chapterStartCalendarDay !== null && calendarDay >= chapterStartCalendarDay
        ? calendarDay - chapterStartCalendarDay + 1
        : null;
    if (chapterDay !== null && chapterDay !== renderedChapterDay) {
      lines.push(localize(view.locale, "ui.chapterDay", { chapterDay }));
      renderedChapterDay = chapterDay;
    }
    lines.push(renderCue(cue, view.locale));
  }

  return lines.join("\n");
};

export const renderUIText = (
  view: UIView,
  options: { showFocus?: boolean } = {},
): string => {
  const lines = [
    localize(view.locale, view.mode === "paused" ? "ui.paused" : "ui.running"),
  ];

  if (view.selectedActor !== null && options.showFocus !== false) {
    lines.push(
      localize(view.locale, "ui.focus", { actor: view.selectedActor.label }),
    );
  }
  for (const message of view.conversation.messages) {
    const speaker =
      message.speaker === "player"
        ? localize(view.locale, "ui.you")
        : (view.selectedActor?.label ?? localize(view.locale, "ui.innerVoice"));
    lines.push(`${speaker}: ${message.text}`);
  }
  switch (view.conversation.status) {
    case "awaiting_persona":
      lines.push(localize(view.locale, "ui.awaitingPersona"));
      break;
    case "awaiting_awareness":
      lines.push(localize(view.locale, "ui.awaitingAwareness"));
      break;
    case "awaiting_willingness":
      lines.push(localize(view.locale, "ui.awaitingWillingness"));
      break;
    case "closed_for_day":
      lines.push(
        localize(view.locale, "ui.closedForDay", {
          actor:
            view.selectedActor?.label ?? localize(view.locale, "ui.thisPerson"),
        }),
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
    lines.push(localize(view.locale, "ui.possibilities"));
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

const renderCue = (
  cue: PresentationCue,
  locale: WorldView["locale"],
): string =>
  `${formatTime(cue.at)}${localize(locale, "ui.timelineSeparator")}${
    cue.cueId === "performance_beat" ? cue.text : localizeCue(locale, cue.cueId)
  }`;

const formatTime = (minutes: number): string => {
  const localMinutes = minutes % (24 * 60);
  const hours = Math.floor(localMinutes / 60);
  const minute = localMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

const formatWeekday = (
  minutes: number,
  locale: WorldView["locale"],
): string => {
  const weekday = calendarWeekdayAt(minutes);
  return localizeWeekday(locale, weekday);
};

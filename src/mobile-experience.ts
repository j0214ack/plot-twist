export type AppDisplayMode = "browser" | "standalone" | "fullscreen";

export interface MobileExperienceSignals {
  coarsePointer: boolean;
  maxTouchPoints: number;
  portrait: boolean;
  displayMode: AppDisplayMode;
  iosStandalone: boolean;
  noticeDismissed: boolean;
}

export interface MobileExperienceState {
  mobile: boolean;
  installed: boolean;
  inputMode: "keyboard" | "joystick";
  showDesktopUi: boolean;
  showExperienceNotice: boolean;
  blockForPortrait: boolean;
  controlsEnabled: boolean;
}

export const resolveMobileExperience = (
  signals: MobileExperienceSignals,
): MobileExperienceState => {
  const mobile = signals.coarsePointer && signals.maxTouchPoints > 0;
  const installed =
    signals.displayMode === "fullscreen" ||
    signals.displayMode === "standalone" ||
    signals.iosStandalone;
  const showExperienceNotice = mobile && !installed && !signals.noticeDismissed;
  const blockForPortrait = mobile && signals.portrait;

  return {
    mobile,
    installed,
    inputMode: mobile ? "joystick" : "keyboard",
    showDesktopUi: !mobile,
    showExperienceNotice,
    blockForPortrait,
    controlsEnabled: !showExperienceNotice && !blockForPortrait,
  };
};

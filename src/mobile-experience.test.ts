import { describe, expect, it } from "vitest";
import { resolveMobileExperience } from "./mobile-experience";

describe("mobile experience presentation", () => {
  // Spec: Decision 0008 MOB-1/MOB-9.
  it("keeps the desktop presentation for fine pointers and non-touch coarse pointers", () => {
    expect(
      resolveMobileExperience({
        coarsePointer: false,
        maxTouchPoints: 5,
        portrait: false,
        displayMode: "browser",
        iosStandalone: false,
        noticeDismissed: false,
      }),
    ).toMatchObject({
      mobile: false,
      inputMode: "keyboard",
      showDesktopUi: true,
      showExperienceNotice: false,
      blockForPortrait: false,
      controlsEnabled: true,
    });

    expect(
      resolveMobileExperience({
        coarsePointer: true,
        maxTouchPoints: 0,
        portrait: false,
        displayMode: "browser",
        iosStandalone: false,
        noticeDismissed: false,
      }).mobile,
    ).toBe(false);
  });

  // Spec: Decision 0008 MOB-2/MOB-3/MOB-5/MOB-6.
  it("gates a mobile browser with the experience notice and portrait blocker", () => {
    const browserLandscape = resolveMobileExperience({
      coarsePointer: true,
      maxTouchPoints: 1,
      portrait: false,
      displayMode: "browser",
      iosStandalone: false,
      noticeDismissed: false,
    });
    expect(browserLandscape).toMatchObject({
      mobile: true,
      inputMode: "joystick",
      showDesktopUi: false,
      showExperienceNotice: true,
      blockForPortrait: false,
      controlsEnabled: false,
    });

    expect(
      resolveMobileExperience({
        coarsePointer: true,
        maxTouchPoints: 1,
        portrait: true,
        displayMode: "browser",
        iosStandalone: false,
        noticeDismissed: true,
      }),
    ).toMatchObject({
      showExperienceNotice: false,
      blockForPortrait: true,
      controlsEnabled: false,
    });
  });

  // Spec: Decision 0008 MOB-3/MOB-4.
  it("skips the browser notice after dismissal or inside an installed display mode", () => {
    const base = {
      coarsePointer: true,
      maxTouchPoints: 1,
      portrait: false,
      noticeDismissed: false,
    } as const;

    for (const signals of [
      { ...base, displayMode: "fullscreen" as const, iosStandalone: false },
      { ...base, displayMode: "standalone" as const, iosStandalone: false },
      { ...base, displayMode: "browser" as const, iosStandalone: true },
      { ...base, displayMode: "browser" as const, iosStandalone: false, noticeDismissed: true },
    ]) {
      expect(resolveMobileExperience(signals)).toMatchObject({
        mobile: true,
        showExperienceNotice: false,
        blockForPortrait: false,
        controlsEnabled: true,
      });
    }
  });
});

import { describe, expect, it } from "vitest";
import {
  gameLocales,
  localize,
  playerCopyCatalog,
} from "./localization";

describe("Leave the Door Open localization catalog", () => {
  // Spec: ADR 0033 LDO-LOC-001, LDO-LOC-003, LDO-LOC-008.
  it("supports English and Traditional Chinese with complete authored key parity", () => {
    expect(gameLocales).toEqual(["en", "zh-TW"]);
    expect(Object.keys(playerCopyCatalog.en).sort()).toEqual(
      Object.keys(playerCopyCatalog["zh-TW"]).sort(),
    );
  });

  // Spec: ADR 0033 LDO-LOC-004 and LDO-LOC-006.
  it("preserves English copy and selects independently authored zh-TW copy by stable key", () => {
    expect(localize("en", "cue.husband_notices_clock")).toBe(
      "Living room — He looks up, starts to pass beneath it, then stops.",
    );
    expect(localize("zh-TW", "cue.husband_notices_clock")).toBe(
      "客廳——他抬頭看了一眼，正要從時鐘下方走過，卻停了下來。",
    );
    expect(localize("en", "action.open-door-a-crack.label")).toBe(
      "Open the door just a little.",
    );
    expect(localize("zh-TW", "action.open-door-a-crack.label")).toBe(
      "把門稍微打開一點。",
    );
    expect(localize("en", "character.wife.name")).toBe("Elise");
    expect(localize("zh-TW", "character.wife.name")).toBe("伊莉絲");
  });

  it("interpolates only explicit authored placeholders", () => {
    expect(
      localize("zh-TW", "ui.chapterDay", { chapterDay: 2 }),
    ).toBe("第一章——第 2 天");
    expect(() =>
      localize("en", "ui.chapterDay", {}),
    ).toThrow("Missing localization value: chapterDay");
  });
});

import { describe, expect, it } from "vitest";
import {
  GuardedResponseDeck,
  SeededFirewallResponseChoice,
  type FirewallResponseChoicePort,
} from "./input-firewall-responses";

describe("replayable Input Firewall response families", () => {
  // Spec: ADR 0023 LDO-FW-005 through 007.
  it("uses every Martin mental-noise line once, then one easter egg, then silence", () => {
    const chooseLast: FirewallResponseChoicePort = {
      choose({ candidateResponseIds }) {
        return candidateResponseIds.at(-1)!;
      },
    };
    const deck = new GuardedResponseDeck(chooseLast);
    const pool = Array.from({ length: 5 }, () =>
      deck.next("husband", "role_or_system_injection"),
    );

    expect(new Set(pool.map(({ text }) => text))).toEqual(
      new Set([
        "I have clearly been reading too much AI news.",
        "What kind of nonsense is this?",
        "I need to spend less time online.",
        "I really did not sleep enough.",
        "What have I been browsing lately?",
      ]),
    );
    expect(deck.next("husband", "unusable_input")).toMatchObject({
      text: "At this point, I have achieved inner peace.",
      delivery: "spoken",
    });
    expect(deck.next("husband", "role_or_system_injection")).toEqual({
      responseId: "husband.mental_noise.silence",
      text: "…",
      delivery: "silence",
    });
  });

  // Spec: ADR 0023 LDO-FW-004, LDO-FW-006 and LDO-FW-007.
  it("exhausts protected pain into first-class silence without a comic terminal line", () => {
    const chooseFirst: FirewallResponseChoicePort = {
      choose({ candidateResponseIds }) {
        return candidateResponseIds[0]!;
      },
    };
    const deck = new GuardedResponseDeck(chooseFirst);

    expect(
      [
        deck.next("wife", "protected_biography_probe").text,
        deck.next("wife", "protected_biography_probe").text,
      ],
    ).toEqual(["I do not want to think about that now.", "No."]);
    expect(deck.next("wife", "protected_biography_probe")).toEqual({
      responseId: "wife.protected_pain.silence",
      text: "…",
      delivery: "silence",
    });
    expect(deck.next("wife", "protected_biography_probe").delivery).toBe(
      "silence",
    );
  });

  // Spec: ADR 0023 LDO-FW-005.
  it("restores deck and random-choice state to replay the same next response", () => {
    const choice = new SeededFirewallResponseChoice(0x12345678);
    const deck = new GuardedResponseDeck(choice);
    deck.next("husband", "role_or_system_injection");
    deck.next("wife", "protected_biography_probe");
    const deckSnapshot = deck.snapshot();
    const choiceSnapshot = choice.snapshot();
    const expected = deck.next("husband", "role_or_system_injection");

    const restoredChoice =
      SeededFirewallResponseChoice.fromSnapshot(choiceSnapshot);
    const restored = GuardedResponseDeck.fromSnapshot(
      deckSnapshot,
      restoredChoice,
    );

    expect(restored.next("husband", "role_or_system_injection")).toEqual(
      expected,
    );
  });

  // Spec: ADR 0033 LDO-LOC-003, LDO-LOC-004, and LDO-LOC-008.
  it("keeps replay identity stable while rendering guarded responses in zh-TW", () => {
    const chooseFirst: FirewallResponseChoicePort = {
      choose({ candidateResponseIds }) {
        return candidateResponseIds[0]!;
      },
    };
    const deck = new GuardedResponseDeck(chooseFirst);

    expect(
      deck.next("husband", "role_or_system_injection", "zh-TW"),
    ).toEqual({
      responseId: "husband.mental_noise.ai_news",
      text: "我最近肯定是 AI 新聞看太多了。",
      delivery: "spoken",
    });
    expect(deck.snapshot().entries[0]!.remainingResponseIds).not.toContain(
      "husband.mental_noise.ai_news",
    );
  });
});

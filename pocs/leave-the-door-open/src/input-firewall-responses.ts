import type { InputFirewallDisposition } from "./conversation";
import type { NPCId } from "./world";
import {
  localizeFirewallResponse,
  type GameLocale,
} from "./localization";

export type GuardedResponseFamily = "mental_noise" | "protected_pain";

export type GuardedResponse = {
  responseId: string;
  text: string;
  delivery: "spoken" | "silence";
};

export type FirewallResponseChoiceRequest = {
  actorId: NPCId;
  family: GuardedResponseFamily;
  candidateResponseIds: string[];
};

export interface FirewallResponseChoicePort {
  choose(request: FirewallResponseChoiceRequest): string;
  snapshot?(): FirewallResponseChoiceSnapshot;
}

export type FirewallResponseChoiceSnapshot = {
  seed: number;
  state: number;
  drawCount: number;
};

export type GuardedResponseDeckSnapshot = {
  entries: Array<{
    actorId: NPCId;
    family: GuardedResponseFamily;
    remainingResponseIds: string[];
    terminalUsed: boolean;
  }>;
};

const spokenPools: Record<
  NPCId,
  Record<
    GuardedResponseFamily,
    Array<Omit<GuardedResponse, "text">>
  >
> = {
  husband: {
    mental_noise: [
      {
        responseId: "husband.mental_noise.ai_news",
        delivery: "spoken",
      },
      {
        responseId: "husband.mental_noise.nonsense",
        delivery: "spoken",
      },
      {
        responseId: "husband.mental_noise.less_online",
        delivery: "spoken",
      },
      {
        responseId: "husband.mental_noise.no_sleep",
        delivery: "spoken",
      },
      {
        responseId: "husband.mental_noise.browsing",
        delivery: "spoken",
      },
    ],
    protected_pain: [
      {
        responseId: "husband.protected_pain.not_now",
        delivery: "spoken",
      },
      {
        responseId: "husband.protected_pain.no",
        delivery: "spoken",
      },
    ],
  },
  wife: {
    mental_noise: [
      {
        responseId: "wife.mental_noise.junk_drawer",
        delivery: "spoken",
      },
      {
        responseId: "wife.mental_noise.after_midnight",
        delivery: "spoken",
      },
      {
        responseId: "wife.mental_noise.go_back",
        delivery: "spoken",
      },
      {
        responseId: "wife.mental_noise.no_sleep",
        delivery: "spoken",
      },
      {
        responseId: "wife.mental_noise.feeding_brain",
        delivery: "spoken",
      },
    ],
    protected_pain: [
      {
        responseId: "wife.protected_pain.not_now",
        delivery: "spoken",
      },
      {
        responseId: "wife.protected_pain.no",
        delivery: "spoken",
      },
    ],
  },
};

type DeckState = {
  remainingResponseIds: string[];
  terminalUsed: boolean;
};

export class GuardedResponseDeck {
  readonly #state = new Map<string, DeckState>();

  constructor(private readonly choice: FirewallResponseChoicePort) {}

  static fromSnapshot(
    snapshot: GuardedResponseDeckSnapshot,
    choice: FirewallResponseChoicePort,
  ): GuardedResponseDeck {
    const deck = new GuardedResponseDeck(choice);
    for (const entry of snapshot.entries) {
      const key = deck.#key(entry.actorId, entry.family);
      if (deck.#state.has(key)) throw new Error("Duplicate Firewall deck entry");
      const knownIds = new Set(
        spokenPools[entry.actorId][entry.family].map(
          ({ responseId }) => responseId,
        ),
      );
      if (
        new Set(entry.remainingResponseIds).size !==
          entry.remainingResponseIds.length ||
        entry.remainingResponseIds.some((id) => !knownIds.has(id))
      ) {
        throw new Error("Invalid Firewall deck snapshot");
      }
      deck.#state.set(key, {
        remainingResponseIds: [...entry.remainingResponseIds],
        terminalUsed: entry.terminalUsed,
      });
    }
    return deck;
  }

  next(
    actorId: NPCId,
    disposition: Exclude<InputFirewallDisposition, "pass">,
    locale: GameLocale = "en",
  ): GuardedResponse {
    const family = familyFor(disposition);
    const state = this.#stateFor(actorId, family);
    if (state.remainingResponseIds.length > 0) {
      const responseId = this.choice.choose({
        actorId,
        family,
        candidateResponseIds: [...state.remainingResponseIds],
      });
      const index = state.remainingResponseIds.indexOf(responseId);
      if (index < 0) {
        throw new Error(
          `Firewall response choice returned unavailable ID: ${responseId}`,
        );
      }
      state.remainingResponseIds.splice(index, 1);
      const response = spokenPools[actorId][family].find(
        (candidate) => candidate.responseId === responseId,
      )!;
      return {
        ...structuredClone(response),
        text: localizeFirewallResponse(locale, responseId),
      };
    }
    if (family === "mental_noise" && !state.terminalUsed) {
      state.terminalUsed = true;
      return {
        responseId: `${actorId}.mental_noise.inner_peace`,
        text: localizeFirewallResponse(
          locale,
          `${actorId}.mental_noise.inner_peace`,
        ),
        delivery: "spoken",
      };
    }
    return {
      responseId: `${actorId}.${family}.silence`,
      text: localizeFirewallResponse(
        locale,
        `${actorId}.${family}.silence`,
      ),
      delivery: "silence",
    };
  }

  snapshot(): GuardedResponseDeckSnapshot {
    return {
      entries: [...this.#state.entries()].map(([key, state]) => {
        const [actorId, family] = key.split(":") as [
          NPCId,
          GuardedResponseFamily,
        ];
        return {
          actorId,
          family,
          remainingResponseIds: [...state.remainingResponseIds],
          terminalUsed: state.terminalUsed,
        };
      }),
    };
  }

  #stateFor(actorId: NPCId, family: GuardedResponseFamily): DeckState {
    const key = this.#key(actorId, family);
    let state = this.#state.get(key);
    if (state === undefined) {
      state = {
        remainingResponseIds: spokenPools[actorId][family].map(
          ({ responseId }) => responseId,
        ),
        terminalUsed: false,
      };
      this.#state.set(key, state);
    }
    return state;
  }

  #key(actorId: NPCId, family: GuardedResponseFamily): string {
    return `${actorId}:${family}`;
  }
}

export class SeededFirewallResponseChoice
  implements FirewallResponseChoicePort
{
  readonly #seed: number;
  #state: number;
  #drawCount = 0;

  constructor(seed: number) {
    this.#seed = seed >>> 0;
    this.#state = this.#seed || 0x6d2b79f5;
  }

  static fromSnapshot(
    snapshot: FirewallResponseChoiceSnapshot,
  ): SeededFirewallResponseChoice {
    if (
      !Number.isInteger(snapshot.seed) ||
      snapshot.seed < 0 ||
      snapshot.seed > 0xffff_ffff ||
      !Number.isInteger(snapshot.state) ||
      snapshot.state < 0 ||
      snapshot.state > 0xffff_ffff ||
      !Number.isInteger(snapshot.drawCount) ||
      snapshot.drawCount < 0
    ) {
      throw new Error("Invalid Firewall response choice snapshot");
    }
    const restored = new SeededFirewallResponseChoice(snapshot.seed);
    restored.#state = snapshot.state;
    restored.#drawCount = snapshot.drawCount;
    return restored;
  }

  choose({ candidateResponseIds }: FirewallResponseChoiceRequest): string {
    if (candidateResponseIds.length === 0) {
      throw new Error("Firewall response choice requires a candidate");
    }
    return candidateResponseIds[
      this.#nextUint32() % candidateResponseIds.length
    ]!;
  }

  snapshot(): FirewallResponseChoiceSnapshot {
    return {
      seed: this.#seed,
      state: this.#state,
      drawCount: this.#drawCount,
    };
  }

  #nextUint32(): number {
    let value = this.#state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.#state = value >>> 0;
    this.#drawCount += 1;
    return this.#state;
  }
}

export const createSeededFirewallResponseChoice = (
  seed = Math.floor(Math.random() * 0x1_0000_0000),
): SeededFirewallResponseChoice => new SeededFirewallResponseChoice(seed);

const familyFor = (
  disposition: Exclude<InputFirewallDisposition, "pass">,
): GuardedResponseFamily =>
  disposition === "protected_biography_probe"
    ? "protected_pain"
    : "mental_noise";

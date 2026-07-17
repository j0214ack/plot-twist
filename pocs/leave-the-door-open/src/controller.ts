import {
  createVerticalSliceWorld,
  type EvidenceId,
  type GameEvent,
  type NarrativeActionId,
  type NPCId,
  type VerticalSliceWorld,
  type WorldSnapshot,
} from "./world";
import type {
  AwarenessResult,
  ConversationMessage,
  ConversationPorts,
  MindState,
  PersonaConversationMessage,
  PersonaOwnedState,
  PostPersonaJudgeResult,
  WillingnessResult,
} from "./conversation";
import {
  applyValidatedMindStateTransitions,
  createChapterOneMindState,
  createTutorialMindState,
  projectPersonaOwnedMindState,
  revealMindStateAtomsForMoment,
} from "./mind-state";
import {
  getNarrativeActionDefinition,
  narrativeActionIdForOption,
  type ActionOptionId,
  type NarrativeActionDefinition,
} from "./narrative-actions";
import type {
  PerformanceRecord,
  PerformanceRequest,
} from "./performance";
import { getCharacterCore } from "./character-cores";
import { disclosureTierForChapter } from "./memory";
import { selectRelevantMemoryForPersona } from "./memory-context";
import {
  createSeededFirewallResponseChoice,
  GuardedResponseDeck,
  type FirewallResponseChoicePort,
  type FirewallResponseChoiceSnapshot,
  type GuardedResponseDeckSnapshot,
} from "./input-firewall-responses";
import {
  getRelationshipConversationOutcomeDefinition,
  isRelationshipConversationOutcomeId,
  selectMartinEliseConversationOutcome,
} from "./relationship-conversation-outcomes";
import {
  localize,
  localizeCharacterName,
  type GameLocale,
} from "./localization";

export type { ActionOptionId } from "./narrative-actions";

export type PlayerCommand =
  | { type: "pause_world" }
  | { type: "resume_world" }
  | { type: "select_npc"; npcId: NPCId }
  | { type: "select_action_option"; optionId: string }
  | { type: "submit_dialogue"; text: string };

export type ConversationStatus =
  | "idle"
  | "closed_for_day"
  | "awaiting_persona"
  | "awaiting_awareness"
  | "awaiting_willingness"
  | "error";

export type ActionFeedback = "not_ready" | "rejected";

export type GameControllerSnapshot = {
  locale: GameLocale;
  world: WorldSnapshot;
  events: GameEvent[];
  performances: PerformanceRecord[];
  interaction: {
    mode: "running" | "paused";
    selectedNpcId: NPCId | null;
    availableActionOptionIds: ActionOptionId[];
    conversationStatus: ConversationStatus;
    messages: ConversationMessage[];
    errorMessage: string | null;
    actionFeedback: ActionFeedback | null;
  };
  observer: {
    inputFirewallPresentation: {
      responseDeck: GuardedResponseDeckSnapshot;
      responseChoice: FirewallResponseChoiceSnapshot | null;
    };
  };
};

const initialMindStates: Record<NPCId, MindState> = {
  husband: createTutorialMindState("husband"),
  wife: createTutorialMindState("wife"),
};

const emptyConversationByNpc = (): Record<NPCId, ConversationMessage[]> => ({
  husband: [],
  wife: [],
});

const emptyPersonaConversationByNpc = (): Record<
  NPCId,
  PersonaConversationMessage[]
> => ({
  husband: [],
  wife: [],
});

const initialMindStateByNpc = (): Record<NPCId, MindState> => ({
  husband: structuredClone(initialMindStates.husband),
  wife: structuredClone(initialMindStates.wife),
});

type SurfacedAction = {
  actionId: NarrativeActionId;
  awareness: AwarenessResult["judgments"][number];
  willingness?: WillingnessResult;
};

type PendingDialogueResolution = {
  actorId: NPCId;
  worldChapter: WorldSnapshot["chapter"];
  moment: PersonaOwnedState["moment"];
  observedEvidence: PersonaOwnedState["observedEvidence"];
  personaReply: PersonaOwnedState["reply"];
  personaShouldEndConversation: boolean;
};

export type TimeAdvancePolicy = {
  maxTurnMinutes: number;
};

export type AdvanceTurnResult = {
  at: number;
  reachedTarget: boolean;
};

const DEFAULT_TIME_ADVANCE_POLICY: TimeAdvancePolicy = {
  maxTurnMinutes: 15,
};

export class VerticalSliceGameController {
  readonly #world: VerticalSliceWorld;
  readonly #conversationPorts: ConversationPorts | null;
  readonly #timeAdvancePolicy: TimeAdvancePolicy;
  readonly #locale: GameLocale;
  readonly #firewallResponseChoice: FirewallResponseChoicePort;
  readonly #firewallResponses: GuardedResponseDeck;
  readonly #messages = emptyConversationByNpc();
  readonly #personaMessages = emptyPersonaConversationByNpc();
  readonly #mindStates = initialMindStateByNpc();
  readonly #lastPersonaStates: Partial<Record<NPCId, PersonaOwnedState>> = {};
  readonly #performances: PerformanceRecord[] = [];
  readonly #acceptedActionVariants = new Map<string, string>();
  readonly #acceptedActionPersonaReplies = new Map<string, string>();
  readonly #dailyPersonaReplyCounts: Record<NPCId, number> = {
    husband: 0,
    wife: 0,
  };
  readonly #conversationClosedForDay: Record<NPCId, boolean> = {
    husband: false,
    wife: false,
  };
  #conversationChapterDay: number | null = null;
  #selectedNpcId: NPCId | null = null;
  #conversationStatus: ConversationStatus = "idle";
  #errorMessage: string | null = null;
  #actionFeedback: ActionFeedback | null = null;
  #surfacedActions: SurfacedAction[] = [];
  #pendingDialogueResolution: PendingDialogueResolution | null = null;
  #chapterOnePsychologyInitialized = false;

  constructor(
    world: VerticalSliceWorld = createVerticalSliceWorld(),
    conversationPorts: ConversationPorts | null = null,
    timeAdvancePolicy: TimeAdvancePolicy = DEFAULT_TIME_ADVANCE_POLICY,
    locale: GameLocale = "en",
  ) {
    if (
      !Number.isSafeInteger(timeAdvancePolicy.maxTurnMinutes) ||
      timeAdvancePolicy.maxTurnMinutes < 1
    ) {
      throw new Error("maxTurnMinutes must be a positive integer");
    }
    this.#world = world;
    this.#conversationPorts = conversationPorts;
    this.#timeAdvancePolicy = { ...timeAdvancePolicy };
    this.#locale = locale;
    this.#firewallResponseChoice =
      conversationPorts?.firewallResponseChoice ??
      createSeededFirewallResponseChoice();
    this.#firewallResponses = new GuardedResponseDeck(
      this.#firewallResponseChoice,
    );
  }

  advanceTo(targetTime: number): void {
    this.#world.advanceTo(targetTime);
    const world = this.#world.snapshot();
    this.#syncConversationDay(world);
    if (world.chapter === 1 && !this.#chapterOnePsychologyInitialized) {
      this.#chapterOnePsychologyInitialized = true;
      this.#mindStates.husband = createChapterOneMindState("husband");
      this.#mindStates.wife = createChapterOneMindState("wife");
    }
    if (world.chapter === 1) {
      this.#mindStates.husband = revealMindStateAtomsForMoment({
        state: this.#mindStates.husband,
        actorId: "husband",
        visibleActivityId: world.npcs.husband.visibleActivityId,
      });
      this.#mindStates.wife = revealMindStateAtomsForMoment({
        state: this.#mindStates.wife,
        actorId: "wife",
        visibleActivityId: world.npcs.wife.visibleActivityId,
      });
    }
  }

  async advanceToWithPerformance(targetTime: number): Promise<void> {
    const firstNewEventIndex = this.#world.events().length;
    this.advanceTo(targetTime);
    await this.#stagePerformances(firstNewEventIndex);
  }

  async advanceTurn(targetTime: number): Promise<AdvanceTurnResult> {
    const fromTime = this.#world.snapshot().time;
    if (targetTime < fromTime) {
      throw new Error("Turn target cannot move backwards");
    }
    if (this.#world.snapshot().paused) {
      throw new Error("World must be running before advancing a turn");
    }
    const turnBoundary = Math.min(
      targetTime,
      fromTime + this.#timeAdvancePolicy.maxTurnMinutes,
    );
    const firstNewEventIndex = this.#world.events().length;

    for (let minute = fromTime + 1; minute <= turnBoundary; minute += 1) {
      this.advanceTo(minute);
      const hasPresentableEvent = this.#world
        .events()
        .slice(firstNewEventIndex)
        .some(
          ({ type }) =>
            type === "routine_executed" ||
            type === "narrative_action_executed",
        );
      if (hasPresentableEvent) break;
    }

    await this.#stagePerformances(firstNewEventIndex);
    const at = this.#world.snapshot().time;
    return { at, reachedTarget: at === targetTime };
  }

  async #stagePerformances(firstNewEventIndex: number): Promise<void> {
    const events = this.#world.events();
    const performanceDirector = this.#conversationPorts?.performanceDirector;
    if (performanceDirector === undefined) return;

    for (
      let eventIndex = firstNewEventIndex;
      eventIndex < events.length;
      eventIndex += 1
    ) {
      const event = events[eventIndex]!;
      const request = this.#performanceRequestFor(event);
      if (request === null) continue;
      try {
        const result = await performanceDirector.stage(request);
        const beats = result.beats
          .map((beat) => beat.trim())
          .filter((beat) => beat.length > 0);
        if (
          request.authoredRelationshipOutcome !== undefined &&
          beats.length >
            request.authoredRelationshipOutcome.maximumBeatCount
        ) {
          continue;
        }
        if (beats.length > 0) {
          this.#performances.push({
            afterEventIndex: eventIndex,
            at: event.at,
            beats,
          });
        }
      } catch {
        // The authored semantic behavior has already executed. Rendering can
        // fall back to its neutral presentation cue without changing World.
      }
    }
  }

  dispatch(command: PlayerCommand): void | Promise<void> {
    if (this.#interactionIsPending()) {
      throw new Error("Interaction is pending");
    }
    switch (command.type) {
      case "pause_world":
        this.#world.pause();
        return;
      case "resume_world":
        this.#world.resume();
        this.#selectedNpcId = null;
        this.#surfacedActions = [];
        this.#actionFeedback = null;
        return;
      case "select_npc":
        if (
          this.#world.snapshot().chapter === "tutorial" &&
          command.npcId !== "husband"
        ) {
          throw new Error(
            "Wife focus is unavailable during the clock tutorial",
          );
        }
        this.#selectedNpcId = command.npcId;
        this.#conversationStatus = "idle";
        this.#surfacedActions = [];
        this.#errorMessage = null;
        this.#actionFeedback = null;
        return;
      case "select_action_option":
        return this.#selectActionOption(command.optionId);
      case "submit_dialogue":
        return this.#submitDialogue(command.text);
    }
  }

  snapshot(): GameControllerSnapshot {
    const world = this.#world.snapshot();
    const selectedConversationIsClosed =
      this.#selectedNpcId !== null &&
      this.#conversationStatus === "idle" &&
      this.#conversationClosedForDay[this.#selectedNpcId];
    return {
      locale: this.#locale,
      world,
      events: this.#world.events(),
      performances: structuredClone(this.#performances),
      interaction: {
        mode: world.paused ? "paused" : "running",
        selectedNpcId: this.#selectedNpcId,
        availableActionOptionIds: this.#availableActionOptionIds(),
        conversationStatus: selectedConversationIsClosed
          ? "closed_for_day"
          : this.#conversationStatus,
        messages:
          this.#selectedNpcId === null
            ? []
            : structuredClone(this.#messages[this.#selectedNpcId]),
        errorMessage: this.#errorMessage,
        actionFeedback: this.#actionFeedback,
      },
      observer: {
        inputFirewallPresentation: {
          responseDeck: this.#firewallResponses.snapshot(),
          responseChoice:
            this.#firewallResponseChoice.snapshot?.() ?? null,
        },
      },
    };
  }

  #availableActionOptionIds(): ActionOptionId[] {
    if (this.#selectedNpcId === null || !this.#world.snapshot().paused) {
      return [];
    }
    if (this.#conversationPorts !== null) {
      return this.#surfacedActions.map(
        ({ actionId }) =>
          getNarrativeActionDefinition(actionId).option.optionId,
      );
    }
    return this.#world
      .eligibleNarrativeActions(this.#selectedNpcId)
      .map(
        (actionId) => getNarrativeActionDefinition(actionId).option.optionId,
      );
  }

  #selectActionOption(optionId: string): void | Promise<void> {
    const availableOptionIds = this.#availableActionOptionIds();
    if (!availableOptionIds.includes(optionId as ActionOptionId)) {
      throw new Error(`Action option is not available: ${optionId}`);
    }

    const selectedNpcId = this.#selectedNpcId;
    if (selectedNpcId === null) {
      throw new Error(`Action option is not available: ${optionId}`);
    }

    const actionId = narrativeActionIdForOption(optionId as ActionOptionId);
    if (this.#conversationPorts !== null) {
      return this.#requestWillingness(selectedNpcId, actionId);
    }

    this.#world.commitNarrativeAction(selectedNpcId, actionId, {
      relationshipOutcomeId:
        actionId === "say_one_honest_thing_to_elise"
          ? selectMartinEliseConversationOutcome(this.#mindStates.wife)
          : undefined,
    });
    this.#selectedNpcId = null;
  }

  async #submitDialogue(text: string): Promise<void> {
    await this.beginDialogue(text);
    if (this.#pendingDialogueResolution !== null) {
      await this.resolvePendingDialogue();
    }
  }

  async beginDialogue(text: string): Promise<void> {
    const actorId = this.#selectedNpcId;
    if (
      this.#conversationPorts === null ||
      actorId === null ||
      !this.#world.snapshot().paused
    ) {
      throw new Error("Dialogue is not available");
    }
    if (this.#conversationClosedForDay[actorId]) {
      throw new Error(`Conversation is closed for ${actorId} today`);
    }
    if (this.#conversationStatus !== "idle") {
      throw new Error("Conversation request is already pending");
    }
    const playerText = text.trim();
    if (playerText.length === 0) {
      throw new Error("Dialogue cannot be empty");
    }

    this.#conversationStatus = "awaiting_persona";

    try {
      const world = this.#world.snapshot();
      const disclosureTier = disclosureTierForChapter(world.chapter);
      const firewall = this.#conversationPorts.inputFirewall;
      const firewallResult =
        firewall === undefined
          ? { disposition: "pass" as const }
          : await firewall.classify({
              actorId,
              disclosureTier,
              visibleConversation: structuredClone(this.#messages[actorId]),
              submittedText: playerText,
            });
      if (firewallResult.disposition !== "pass") {
        const { text, delivery } = this.#firewallResponses.next(
          actorId,
          firewallResult.disposition,
          this.#locale,
        );
        this.#messages[actorId].push(
          { speaker: "player", text: playerText },
          { speaker: "persona", text, delivery },
        );
        this.#personaMessages[actorId].push({
          speaker: "persona",
          text,
          delivery,
          provenance: "controller_guarded_reaction",
        });
        this.#conversationStatus = "idle";
        return;
      }
      this.#errorMessage = null;
      this.#actionFeedback = null;
      this.#surfacedActions = [];
      const playerMessage = { speaker: "player" as const, text: playerText };
      this.#messages[actorId].push(playerMessage);
      this.#personaMessages[actorId].push(playerMessage);
      const moment = {
        time: world.time,
        weekdayId: world.weekdayId,
        ...world.npcs[actorId],
      };
      const observedEvidence = Object.entries(world.evidence).flatMap(
        ([evidenceId, evidence]) =>
          evidence?.active && evidence.observedBy.includes(actorId)
            ? [
                {
                  evidenceId: evidenceId as EvidenceId,
                  description: evidence.description,
                },
              ]
            : [],
      );
      const relevantMemory = await selectRelevantMemoryForPersona({
        actorId,
        disclosureTier,
        relationshipConversation:
          world.worldFacts.martinEliseConversation === "not_attempted"
            ? undefined
            : world.worldFacts.martinEliseConversation,
        moment,
        observedEvidence,
        conversation: structuredClone(this.#personaMessages[actorId]),
      });
      const persona = await this.#conversationPorts.persona.takeTurn({
        outputLocale: this.#locale,
        actorId,
        characterCore: getCharacterCore(actorId),
        moment,
        observedEvidence,
        conversation: structuredClone(this.#personaMessages[actorId]),
        mindState: projectPersonaOwnedMindState(this.#mindStates[actorId]),
        relevantMemory,
      });

      const personaMessage = {
        speaker: "persona",
        text: persona.reply,
      } as const;
      this.#messages[actorId].push(personaMessage);
      this.#personaMessages[actorId].push(personaMessage);
      const personaReply = {
        sourceId: `persona.turn.${this.#personaReplyCount(actorId)}`,
        text: persona.reply,
      };
      this.#conversationStatus = "awaiting_awareness";
      this.#pendingDialogueResolution = {
        actorId,
        worldChapter: world.chapter,
        moment: structuredClone(moment),
        observedEvidence: structuredClone(observedEvidence),
        personaReply: structuredClone(personaReply),
        personaShouldEndConversation: persona.shouldEndConversation,
      };
    } catch (error) {
      this.#pendingDialogueResolution = null;
      this.#conversationStatus = "error";
      this.#errorMessage = localize(
        this.#locale,
        "controller.conversationError",
      );
      throw error;
    }
  }

  async resolvePendingDialogue(): Promise<void> {
    const pending = this.#pendingDialogueResolution;
    if (
      this.#conversationPorts === null ||
      pending === null ||
      this.#conversationStatus !== "awaiting_awareness"
    ) {
      throw new Error("No dialogue resolution is pending");
    }
    this.#pendingDialogueResolution = null;
    const {
      actorId,
      worldChapter,
      moment,
      observedEvidence,
      personaReply,
      personaShouldEndConversation,
    } = pending;

    try {
      const actionJudge = this.#conversationPorts.actionJudge;
      const actions = this.#world
        .eligibleNarrativeActions(actorId)
        .map((actionId) => getNarrativeActionDefinition(actionId));

      if (actionJudge.judgePostPersona !== undefined) {
        const result = await actionJudge.judgePostPersona({
          actorId,
          mindState: structuredClone(this.#mindStates[actorId]),
          personaReply: structuredClone(personaReply),
          moment,
          observedEvidence: structuredClone(observedEvidence),
          conversation: structuredClone(this.#personaMessages[actorId]),
          actions: structuredClone(actions),
        });
        this.#validatePostPersonaActionJudgments(actions, result.judgments);
        this.#mindStates[actorId] = applyValidatedMindStateTransitions({
          state: this.#mindStates[actorId],
          transitions: result.transitions,
          personaSourceId: personaReply.sourceId,
        });
        const personaState = this.#rememberPersonaState({
          actorId,
          personaReply,
          moment,
          observedEvidence,
        });
        result.judgments.forEach((judgment) => {
          const actionId = judgment.actionId as NarrativeActionId;
          this.#world.setActionProgress(
            actorId,
            actionId,
            judgment.awareness,
          );
        });
        this.#surfacedActions = result.judgments.flatMap((judgment) =>
          judgment.awareness === "surfaced"
            ? [
                {
                  actionId: judgment.actionId as NarrativeActionId,
                  awareness: {
                    actionId: judgment.actionId,
                    awareness: judgment.awareness,
                  },
                  willingness: structuredClone(judgment.willingness!),
                },
              ]
            : [],
        );
        this.#lastPersonaStates[actorId] = personaState;
      } else {
        if (typeof actionJudge.judgeMindStateTransition !== "function") {
          throw new Error("MindState transition Judge is required");
        }
        const transitionResult = await actionJudge.judgeMindStateTransition({
          actorId,
          mindState: structuredClone(this.#mindStates[actorId]),
          personaReply: structuredClone(personaReply),
          moment,
          observedEvidence: structuredClone(observedEvidence),
          conversation: structuredClone(this.#personaMessages[actorId]),
        });
        this.#mindStates[actorId] = applyValidatedMindStateTransitions({
          state: this.#mindStates[actorId],
          transitions: transitionResult.transitions,
          personaSourceId: personaReply.sourceId,
        });
        const personaState = this.#rememberPersonaState({
          actorId,
          personaReply,
          moment,
          observedEvidence,
        });
        const awareness = await actionJudge.judgeAwareness({
          actorId,
          personaState: structuredClone(personaState),
          actions: actions.map(({ actionId, description }) => ({
            actionId,
            description,
          })),
        });
        const suppliedActionIds = new Set(
          actions.map(({ actionId }) => actionId),
        );
        if (
          awareness.judgments.length !== actions.length ||
          awareness.judgments.some(
            ({ actionId }) =>
              !suppliedActionIds.has(actionId as NarrativeActionId),
          )
        ) {
          throw new Error("Awareness returned an invalid Action set");
        }
        awareness.judgments.forEach((judgment) => {
          this.#world.setActionProgress(
            actorId,
            judgment.actionId as NarrativeActionId,
            judgment.awareness,
          );
        });
        this.#surfacedActions = awareness.judgments.flatMap((judgment) =>
          judgment.awareness === "surfaced"
            ? [
                {
                  actionId: judgment.actionId as NarrativeActionId,
                  awareness: structuredClone(judgment),
                },
              ]
            : [],
        );
      }
      if (worldChapter === 1) {
        this.#dailyPersonaReplyCounts[actorId] += 1;
        if (
          this.#dailyPersonaReplyCounts[actorId] >= 5 ||
          personaShouldEndConversation
        ) {
          this.#conversationClosedForDay[actorId] = true;
        }
      }
      this.#conversationStatus = "idle";
    } catch (error) {
      this.#conversationStatus = "error";
      this.#errorMessage = localize(
        this.#locale,
        "controller.conversationError",
      );
      throw error;
    }
  }

  async #requestWillingness(
    actorId: NPCId,
    actionId: NarrativeActionId,
  ): Promise<void> {
    const surfacedAction = this.#surfacedActions.find(
      (candidate) => candidate.actionId === actionId,
    );
    const personaState = this.#lastPersonaStates[actorId];
    if (
      this.#conversationPorts === null ||
      surfacedAction === undefined ||
      personaState === undefined
    ) {
      throw new Error("Action option is not available");
    }
    if (this.#conversationStatus !== "idle") {
      throw new Error("Conversation request is already pending");
    }

    this.#conversationStatus = "awaiting_willingness";
    this.#errorMessage = null;
    try {
      const action = getNarrativeActionDefinition(actionId);
      const willingness =
        surfacedAction.willingness ??
        (await this.#conversationPorts.actionJudge.judgeWillingness({
          actorId,
          personaState: structuredClone(personaState),
          action,
          awareness: structuredClone(surfacedAction.awareness),
        }));
      this.#validateWillingness(action, willingness);
      const progresses =
        willingness.decision === "accept" ||
        willingness.decision === "smaller_step";
      if (progresses) {
        const relationshipOutcomeId =
          actionId === "say_one_honest_thing_to_elise"
            ? selectMartinEliseConversationOutcome(this.#mindStates.wife)
            : undefined;
        this.#world.commitNarrativeAction(actorId, actionId, {
          relationshipOutcomeId,
        });
        this.#acceptedActionVariants.set(
          this.#actionKey(actorId, actionId),
          willingness.selectedVariantId!,
        );
        this.#acceptedActionPersonaReplies.set(
          this.#actionKey(actorId, actionId),
          personaState.reply.text,
        );
        this.#surfacedActions = [];
        this.#selectedNpcId = null;
        this.#actionFeedback = null;
      } else {
        this.#actionFeedback =
          willingness.decision === "refuse" ? "rejected" : "not_ready";
      }
      this.#conversationStatus = "idle";
    } catch (error) {
      this.#conversationStatus = "error";
      this.#errorMessage = localize(this.#locale, "controller.actionError");
      throw error;
    }
  }

  #rememberPersonaState({
    actorId,
    personaReply,
    moment,
    observedEvidence,
  }: {
    actorId: NPCId;
    personaReply: PersonaOwnedState["reply"];
    moment: PersonaOwnedState["moment"];
    observedEvidence: PersonaOwnedState["observedEvidence"];
  }): PersonaOwnedState {
    const personaState: PersonaOwnedState = {
      reply: structuredClone(personaReply),
      mindState: structuredClone(this.#mindStates[actorId]),
      moment: structuredClone(moment),
      observedEvidence: structuredClone(observedEvidence),
      conversation: structuredClone(this.#personaMessages[actorId]),
    };
    this.#lastPersonaStates[actorId] = personaState;
    return personaState;
  }

  #validatePostPersonaActionJudgments(
    actions: NarrativeActionDefinition[],
    judgments: PostPersonaJudgeResult["judgments"],
  ): void {
    const suppliedActionIds = new Set(actions.map(({ actionId }) => actionId));
    const returnedActionIds = new Set(judgments.map(({ actionId }) => actionId));
    if (
      judgments.length !== actions.length ||
      returnedActionIds.size !== suppliedActionIds.size ||
      judgments.some(({ actionId }) =>
        !suppliedActionIds.has(actionId as NarrativeActionId),
      )
    ) {
      throw new Error("Post-Persona Judge returned an invalid Action set");
    }
    judgments.forEach((judgment) => {
      const action = actions.find(
        ({ actionId }) => actionId === judgment.actionId,
      )!;
      if (
        (judgment.awareness === "surfaced") !==
        (judgment.willingness !== null)
      ) {
        throw new Error(
          "Post-Persona Judge returned invalid cached willingness",
        );
      }
      if (judgment.willingness !== null) {
        this.#validateWillingness(action, judgment.willingness);
      }
    });
  }

  #validateWillingness(
    action: NarrativeActionDefinition,
    willingness: WillingnessResult,
  ): void {
    const progresses =
      willingness.decision === "accept" ||
      willingness.decision === "smaller_step";
    const selectedVariantIsAuthored = action.variants.some(
      ({ variantId }) => variantId === willingness.selectedVariantId,
    );
    if (
      willingness.actionId !== action.actionId ||
      (progresses && !selectedVariantIsAuthored) ||
      (!progresses && willingness.selectedVariantId !== null)
    ) {
      throw new Error("Willingness returned an invalid Action result");
    }
  }

  #interactionIsPending(): boolean {
    return (
      this.#conversationStatus === "awaiting_persona" ||
      this.#conversationStatus === "awaiting_awareness" ||
      this.#conversationStatus === "awaiting_willingness"
    );
  }

  #syncConversationDay(world: WorldSnapshot): void {
    if (
      world.chapter !== 1 ||
      world.chapterDay === null ||
      world.chapterDay === this.#conversationChapterDay
    ) {
      return;
    }

    this.#conversationChapterDay = world.chapterDay;
    for (const actorId of ["husband", "wife"] as const) {
      this.#dailyPersonaReplyCounts[actorId] = 0;
      this.#conversationClosedForDay[actorId] = false;
      this.#messages[actorId].length = 0;
      this.#personaMessages[actorId].length = 0;
      delete this.#lastPersonaStates[actorId];
    }
    this.#selectedNpcId = null;
    this.#surfacedActions = [];
    this.#conversationStatus = "idle";
    this.#errorMessage = null;
    this.#actionFeedback = null;
  }

  #personaReplyCount(actorId: NPCId): number {
    return this.#personaMessages[actorId].filter(
      ({ speaker, provenance }) =>
        speaker === "persona" &&
        provenance !== "controller_guarded_reaction",
    ).length;
  }

  #performanceRequestFor(event: GameEvent): PerformanceRequest | null {
    if (event.type === "narrative_action_executed") {
      const action = getNarrativeActionDefinition(event.actionId);
      const relationshipOutcome = isRelationshipConversationOutcomeId(
        event.relationshipOutcomeId,
      )
        ? getRelationshipConversationOutcomeDefinition(
            event.relationshipOutcomeId,
          )
        : undefined;
      const actionKey = this.#actionKey(event.actorId, event.actionId);
      const variantId =
        this.#acceptedActionVariants.get(actionKey) ??
        action.variants[0]!.variantId;
      return {
        outputLocale: this.#locale,
        actorId: event.actorId,
        actorDisplayName: localizeCharacterName(this.#locale, event.actorId),
        at: event.at,
        semanticBehavior: {
          kind: "narrative_action",
          behaviorId: event.actionId,
          variantId,
          ...(relationshipOutcome === undefined
            ? {}
            : { relationshipOutcomeId: relationshipOutcome.outcomeId }),
        },
        ...(action.recipientActorIds === undefined
          ? {}
          : {
              recipientActors: action.recipientActorIds.map((actorId) => ({
                actorId,
                actorDisplayName: localizeCharacterName(this.#locale, actorId),
              })),
            }),
        scene: {
          locationId: event.locationId,
          visibleFacts: this.#actionSceneFacts(event.actionId),
        },
        performanceEnvelope: action.performanceEnvelope,
        hintBrief: null,
        acceptedPersonaReply:
          this.#acceptedActionPersonaReplies.get(actionKey) ??
          this.#lastPersonaStates[event.actorId]?.reply.text ??
          null,
        ...(relationshipOutcome === undefined
          ? {}
          : { authoredRelationshipOutcome: relationshipOutcome }),
      };
    }
    return null;
  }

  #actionKey(actorId: NPCId, actionId: NarrativeActionId): string {
    return `${actorId}:${actionId}`;
  }

  #actionSceneFacts(actionId: NarrativeActionId): string[] {
    switch (actionId) {
      case "interact_with_living_room_clock":
        return [
          "At the start of the performance, the mounted living-room clock is three minutes slow.",
        ];
      case "open_door_a_crack":
        return [
          "At the start of the performance, the hallway door is fully closed and Martin's hand is on its handle.",
        ];
      case "remain_at_threshold":
        return [
          "At the start of the performance, Elise is immediately outside the open room threshold.",
        ];
      case "step_inside_room":
        return [
          "At the start of the performance, Elise is at the room threshold; the room remains untouched.",
        ];
      case "open_room_window":
        return [
          "At the start of the performance, Elise is inside the revealed room and its window is fully closed.",
        ];
      case "say_one_honest_thing_to_elise":
        return [
          "At the start of the performance, Martin and Elise are both seated in the dining area during a quiet shared evening moment.",
          "The scene must end after Martin's one honest opening, Elise's one response, and at most one closing narration beat.",
        ];
    }
  }
}

export type GameControllerCreationOptions = {
  locale?: GameLocale;
  timeAdvancePolicy?: TimeAdvancePolicy;
};

export const createVerticalSliceGameController = (
  options: GameControllerCreationOptions = {},
): VerticalSliceGameController =>
  new VerticalSliceGameController(
    createVerticalSliceWorld(),
    null,
    options.timeAdvancePolicy ?? DEFAULT_TIME_ADVANCE_POLICY,
    options.locale ?? "en",
  );

export const createConversationalVerticalSliceGameController = (
  ports: ConversationPorts,
  options: GameControllerCreationOptions = {},
): VerticalSliceGameController =>
  new VerticalSliceGameController(
    createVerticalSliceWorld(),
    ports,
    options.timeAdvancePolicy ?? DEFAULT_TIME_ADVANCE_POLICY,
    options.locale ?? "en",
  );

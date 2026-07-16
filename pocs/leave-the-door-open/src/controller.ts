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
  PersonaOwnedState,
} from "./conversation";
import {
  applyValidatedMindStateTransitions,
  createChapterOneMindState,
  createTutorialMindState,
  revealMindStateAtomsForMoment,
} from "./mind-state";
import {
  getNarrativeActionDefinition,
  narrativeActionIdForOption,
  type ActionOptionId,
} from "./narrative-actions";
import type {
  PerformanceRecord,
  PerformanceRequest,
} from "./performance";
import { getRoutineVariant } from "./routine-behaviors";
import { getCharacterCore } from "./character-cores";
import {
  getAmbientRoutineDefinition,
  isAmbientRoutineId,
} from "./ambient-routines";
import {
  getChapter1CausalRoutineDefinition,
  getChapter1CausalRoutineVariant,
  isChapter1CausalRoutineId,
} from "./chapter1-routines";
import { characterDisplayName } from "./character-display";

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
};

const initialMindStates: Record<NPCId, MindState> = {
  husband: createTutorialMindState("husband"),
  wife: createTutorialMindState("wife"),
};

const emptyConversationByNpc = (): Record<NPCId, ConversationMessage[]> => ({
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
};

export class VerticalSliceGameController {
  readonly #world: VerticalSliceWorld;
  readonly #conversationPorts: ConversationPorts | null;
  readonly #messages = emptyConversationByNpc();
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
  #chapterOnePsychologyInitialized = false;

  constructor(
    world: VerticalSliceWorld = createVerticalSliceWorld(),
    conversationPorts: ConversationPorts | null = null,
  ) {
    this.#world = world;
    this.#conversationPorts = conversationPorts;
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

    this.#world.commitNarrativeAction(selectedNpcId, actionId);
    this.#selectedNpcId = null;
  }

  async #submitDialogue(text: string): Promise<void> {
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

    this.#errorMessage = null;
    this.#actionFeedback = null;
    this.#surfacedActions = [];
    this.#messages[actorId].push({ speaker: "player", text: playerText });
    this.#conversationStatus = "awaiting_persona";

    try {
      const world = this.#world.snapshot();
      const moment = {
        time: world.time,
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
      const persona = await this.#conversationPorts.persona.takeTurn({
        actorId,
        characterCore: getCharacterCore(actorId),
        moment,
        observedEvidence,
        conversation: structuredClone(this.#messages[actorId]),
        mindState: structuredClone(this.#mindStates[actorId]),
      });

      this.#messages[actorId].push({
        speaker: "persona",
        text: persona.reply,
      });
      const personaReply = {
        sourceId: `persona.turn.${this.#personaReplyCount(actorId)}`,
        text: persona.reply,
      };
      const actionJudge = this.#conversationPorts.actionJudge;
      const transitionJudge = actionJudge.judgeMindStateTransition;
      if (transitionJudge === undefined) {
        throw new Error("MindState transition Judge is required");
      }
      const transitionResult = await actionJudge.judgeMindStateTransition({
        actorId,
        mindState: structuredClone(this.#mindStates[actorId]),
        personaReply: structuredClone(personaReply),
        moment,
        observedEvidence: structuredClone(observedEvidence),
        conversation: structuredClone(this.#messages[actorId]),
      });
      this.#mindStates[actorId] = applyValidatedMindStateTransitions({
        state: this.#mindStates[actorId],
        transitions: transitionResult.transitions,
        personaSourceId: personaReply.sourceId,
      });
      const mindState = this.#mindStates[actorId];
      const personaState: PersonaOwnedState = {
        reply: personaReply,
        mindState: structuredClone(mindState),
        moment,
        observedEvidence: structuredClone(observedEvidence),
        conversation: structuredClone(this.#messages[actorId]),
      };
      this.#lastPersonaStates[actorId] = personaState;

      this.#conversationStatus = "awaiting_awareness";
      const actions = this.#world
        .eligibleNarrativeActions(actorId)
        .map((actionId) => {
          const { description } = getNarrativeActionDefinition(actionId);
          return { actionId, description };
        });
      const awareness =
        await this.#conversationPorts.actionJudge.judgeAwareness({
          actorId,
          personaState: structuredClone(personaState),
          actions,
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
      if (world.chapter === 1) {
        this.#dailyPersonaReplyCounts[actorId] += 1;
        if (
          this.#dailyPersonaReplyCounts[actorId] >= 5 ||
          persona.shouldEndConversation
        ) {
          this.#conversationClosedForDay[actorId] = true;
        }
      }
      this.#conversationStatus = "idle";
    } catch (error) {
      this.#conversationStatus = "error";
      this.#errorMessage = "The conversation could not continue.";
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
        await this.#conversationPorts.actionJudge.judgeWillingness({
          actorId,
          personaState: structuredClone(personaState),
          action,
          awareness: structuredClone(surfacedAction.awareness),
        });
      const progresses =
        willingness.decision === "accept" ||
        willingness.decision === "smaller_step";
      const selectedVariantIsAuthored = action.variants.some(
        ({ variantId }) => variantId === willingness.selectedVariantId,
      );
      if (
        willingness.actionId !== actionId ||
        (progresses && !selectedVariantIsAuthored) ||
        (!progresses && willingness.selectedVariantId !== null)
      ) {
        throw new Error("Willingness returned an invalid Action result");
      }
      if (progresses) {
        this.#acceptedActionVariants.set(
          this.#actionKey(actorId, actionId),
          willingness.selectedVariantId!,
        );
        this.#acceptedActionPersonaReplies.set(
          this.#actionKey(actorId, actionId),
          personaState.reply.text,
        );
        this.#world.commitNarrativeAction(actorId, actionId);
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
      this.#errorMessage = "The action could not be considered.";
      throw error;
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
      delete this.#lastPersonaStates[actorId];
    }
    this.#selectedNpcId = null;
    this.#surfacedActions = [];
    this.#conversationStatus = "idle";
    this.#errorMessage = null;
    this.#actionFeedback = null;
  }

  #personaReplyCount(actorId: NPCId): number {
    return this.#messages[actorId].filter(
      ({ speaker }) => speaker === "persona",
    ).length;
  }

  #performanceRequestFor(event: GameEvent): PerformanceRequest | null {
    if (
      event.type === "routine_executed" &&
      isChapter1CausalRoutineId(event.routineId)
    ) {
      const routine =
        event.routineVariantId === undefined
          ? getChapter1CausalRoutineDefinition(event.routineId)
          : getChapter1CausalRoutineVariant(
              event.routineId,
              event.routineVariantId,
            );
      if (routine.actorId !== event.actorId) {
        throw new Error(
          `Chapter 1 causal routine actor mismatch: ${event.routineId}`,
        );
      }
      return {
        actorId: event.actorId,
        actorDisplayName: characterDisplayName(event.actorId),
        at: event.at,
        semanticBehavior: {
          kind: "routine",
          behaviorId: event.routineId,
          variantId: routine.variantId,
        },
        scene: {
          locationId: event.locationId,
          visibleFacts: [routine.hintBrief.safeFact],
        },
        performanceEnvelope: routine.performanceEnvelope,
        hintBrief: routine.hintBrief,
        acceptedPersonaReply: null,
      };
    }
    if (
      event.type === "routine_executed" &&
      isAmbientRoutineId(event.routineId) &&
      event.routineVariantId !== undefined
    ) {
      const routine = getAmbientRoutineDefinition(event.routineId);
      if (routine.variantId !== event.routineVariantId) {
        throw new Error(
          `Unknown ambient RoutineVariant: ${event.routineId}/${event.routineVariantId}`,
        );
      }
      return {
        actorId: event.actorId,
        actorDisplayName: characterDisplayName(event.actorId),
        at: event.at,
        semanticBehavior: {
          kind: "routine",
          behaviorId: event.routineId,
          variantId: event.routineVariantId,
        },
        scene: {
          locationId: event.locationId,
          visibleFacts: routine.visibleFacts,
        },
        performanceEnvelope: routine.performanceEnvelope,
        hintBrief: routine.hintBrief,
        acceptedPersonaReply: null,
      };
    }
    if (
      event.type === "routine_executed" &&
      event.routineId === "husband_notices_slow_clock" &&
      event.routineVariantId !== undefined
    ) {
      const variant = getRoutineVariant(
        "husband_notices_slow_clock",
        event.routineVariantId,
      );
      return {
        actorId: event.actorId,
        actorDisplayName: characterDisplayName(event.actorId),
        at: event.at,
        semanticBehavior: {
          kind: "routine",
          behaviorId: event.routineId,
          variantId: event.routineVariantId,
        },
        scene: {
          locationId: event.locationId,
          visibleFacts: [
            "The living-room clock is three minutes slow and currently shows 07:54.",
          ],
        },
        performanceEnvelope: variant.performanceEnvelope,
        hintBrief: variant.hintBrief,
        acceptedPersonaReply: null,
      };
    }
    if (event.type === "narrative_action_executed") {
      const action = getNarrativeActionDefinition(event.actionId);
      const actionKey = this.#actionKey(event.actorId, event.actionId);
      const variantId =
        this.#acceptedActionVariants.get(actionKey) ??
        action.variants[0]!.variantId;
      return {
        actorId: event.actorId,
        actorDisplayName: characterDisplayName(event.actorId),
        at: event.at,
        semanticBehavior: {
          kind: "narrative_action",
          behaviorId: event.actionId,
          variantId,
        },
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
    }
  }
}

export const createVerticalSliceGameController =
  (): VerticalSliceGameController => new VerticalSliceGameController();

export const createConversationalVerticalSliceGameController = (
  ports: ConversationPorts,
): VerticalSliceGameController =>
  new VerticalSliceGameController(createVerticalSliceWorld(), ports);

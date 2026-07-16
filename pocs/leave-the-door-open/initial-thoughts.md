# POC Design Spec: A World Trapped in a Single Story

## 0. Document Purpose

This document consolidates the current product concept, gameplay loop, proposed data structures, story prototype, and implementation scope for a hackathon proof of concept.

The intended reader is an implementation agent or engineer. The goal is not to fully solve every design question, but to preserve the current reasoning and provide a coherent architecture that can be built and iterated on.

---

# 1. Product Thesis

## Core positioning

> A game where the goal is not to find the true story, but to free a world trapped inside a single story.

Chinese formulation:

> 讓一個被單一敘事困住的世界，重新開始流動。

The player does not directly command characters, repair relationships, or identify a single correct interpretation.

Instead, the player enters a character's inner dialogue at moments of stagnation. Through conversation, the player may help a character imagine a new possible action.

When the character later performs that action in the world, the action leaves a visible trace.

That trace becomes new evidence for the other character.

The other character interprets that evidence, potentially enabling another action.

The world gradually begins to move again.

---

# 2. Core Design Principles

## 2.1 Evidence is neutral; interpretation is subjective

The world stores observable facts and traces:

- A door is open.
- A table has been partially cleaned.
- A meal is being cooked.
- A small plastic bowl remains on the counter.
- A room has not been entered for a long time.

The world does not store interpretations such as:

- The door was opened as an invitation.
- The clean table means the spouse is ready to move on.
- The meal proves love.
- The room belongs to a deceased child.

Those meanings belong to NPC minds or to the player.

## 2.2 The central secret should not exist in Persona memory

The deepest story truth should not be directly available to Persona LLMs.

For this prototype, the implied truth is that the couple lost a child.

However:

- Persona prompts should not contain an explicit sentence such as "our child died."
- Initial beliefs should not encode the mystery answer.
- NPCs should not be able to reveal the full backstory simply because the player asks directly.
- The truth should be embedded in the world, spaces, objects, recurring habits, and final destination.

The Persona knows only surface-level pressures and avoidances, such as:

- "I cannot open that door."
- "I should leave everything as it is."
- "Today is not the day."
- "If I touch anything, something will disappear."
- "I do not know what we would say to each other."

The world contains the deeper history.

This separation is both a narrative safety mechanism and a core part of the game's philosophy.

## 2.3 Actions create traces; traces change other characters

The main causal loop is:

```text
Inner conversation
→ new action becomes imaginable
→ player surfaces or commits to the action
→ world resumes
→ NPC performs action
→ action leaves a trace
→ another NPC observes the trace
→ that NPC forms a new interpretation
→ another action becomes imaginable
```

The player does not directly change one spouse through dialogue with the other.

The spouses affect each other through the world.

## 2.4 The world should move without waiting for the player

The game world runs freely while unpaused.

NPCs perform routine behaviors based on:

- current world state
- current mind state
- scheduled moments
- available intentions
- completed story beats

The player can pause the world and enter a character's inner dialogue.

The world should feel increasingly autonomous as progress is made.

Success is expressed by:

- new movements
- new rooms being entered
- new traces appearing
- characters reacting to each other without player prompting
- new parts of the map being revealed
- eventually, both characters leaving the initial space together

## 2.5 Major beats are authored; psychological paths are generated

The prototype should use an authored narrative spine.

Examples of authored major beats:

1. The child's room is left open.
2. The other spouse enters and changes something inside.
3. One spouse begins preparing a real meal.
4. The other joins in.
5. They leave the house together.
6. They arrive at a grave and place flowers.

What remains generative:

- how the player speaks to each Persona
- what arguments or reframings are used
- what the Persona accepts, rejects, or partially considers
- which spouse initiates a beat
- which smaller action variant occurs
- how each spouse interprets a trace
- how long it takes to reach the next beat

---

# 3. Player Role and Mental Model

The player is not:

- a therapist
- a god
- a narrator
- an external visitor
- a detective with direct access to truth

The player is the conversational counterpart inside a character's self-talk.

A useful product line is:

> You are the voice people hear when they are stuck.

The player may switch attention between the two spouses.

When the world is paused and a character is selected, the player hears that character's current inner thoughts and can respond.

The player does not control the body directly.

The player can help a possible action enter the character's conscious awareness.

If a meaningful action becomes thinkable, it appears in the conversation UI.

Selecting that action means:

> "Could you bring this possibility back into the world?"

It does not necessarily mean immediate execution.

---

# 4. Time and Interaction Model

## 4.1 Free-running world

The world runs in real time or simulated continuous time.

For implementation, it may use discrete scheduled time slots underneath:

- morning
- afternoon
- evening
- night

The visible presentation can still appear continuous.

## 4.2 Pause interaction

The player can press Pause at any time.

While paused:

- world animation stops
- ambient sound softens or stops
- the selected character becomes visually emphasized
- clicking a character opens inner dialogue
- the conversation is contextualized by that exact moment

The moment matters.

Talking to a husband while he is in the living room should produce different thoughts from talking to him while his hand is on the child's room door.

## 4.3 Daily conversation limit

Initial rule:

- each NPC can have one full inner conversation per day
- each conversation allows approximately 4 to 6 back-and-forth exchanges
- after the limit, the Persona naturally ends the conversation

Example exits:

- "I cannot think about this anymore."
- "The water is boiling."
- "Not now."
- "I still have things to do."
- "I do not know what else to say."

The player may still click the character later to inspect a short surface thought, but cannot reopen the full conversation until the next day.

## 4.4 Why limits exist

The limit prevents the player from:

- brute-forcing the Persona with endless prompts
- treating the NPC as a chatbot puzzle
- extracting the entire mystery through questioning
- ignoring the world simulation
- forcing emotional change in one sitting

The player must observe, choose timing, and decide where to spend attention.

---

# 5. Action System

## 5.1 Actions are concrete and visible

An Action must be:

- physically performable by an NPC
- visible to the camera
- capable of leaving a world consequence or trace
- compatible with authored animations or sequences

Examples:

- leave the door slightly open
- enter the room
- open the window
- wipe part of the desk
- cook a real meal
- pick up another knife and help
- put on a coat
- ask the other spouse to walk
- carry flowers
- place flowers at a grave

Psychological state changes are not Actions.

Examples of non-Actions:

- accept that moving forward is not betrayal
- consider that the other spouse may also be grieving
- believe that touching the room does not erase the child
- tolerate uncertainty

These belong in MindState or MindShift.

## 5.2 Hidden complete Action Catalog

The full Action Catalog belongs to the authored game data.

It is not shown to the player.

It should not live only inside a Judge LLM prompt.

The engine owns the authoritative list so that actions can be:

- version controlled
- tested
- mapped to animations
- filtered by world conditions
- marked completed or expired
- connected to story beats

## 5.3 Awareness gate

An Action begins as latent.

The Judge LLM determines whether it has entered the character's awareness.

Possible awareness states:

- `latent`: not thinkable; invisible
- `faintly_imagined`: hinted through inner monologue
- `surfaced`: visible as an action in the conversation UI

Unknown actions should not appear as locked or greyed-out buttons.

This preserves surprise:

> "Oh. He can imagine doing that now."

## 5.4 Willingness gate

A surfaced Action is not guaranteed to happen.

When the player selects it, a Judge evaluates whether the character will:

- accept
- perform a smaller variant
- defer
- refuse

Example:

Action: `open_child_room`

Possible variants:

- leave the door slightly open
- open the door fully but remain outside
- place a hand on the handle and walk away
- refuse and close it again

## 5.5 Intention and delayed execution

Selecting an Action may create an `ActionIntention`.

The world resumes.

The NPC performs it later at an appropriate scheduled decision point.

Example:

```text
Conversation:
"I could leave the door open."

Action selected:
"Let the door remain open."

World resumes:
The husband later walks past the room,
touches the door,
and leaves it slightly open.
```

This avoids a direct button-to-cutscene feeling.

---

# 6. Authored Story Beats

A Story Beat is a major world-level event.

It is not identical to an Action.

An Action by one character may become the final trigger for a Story Beat.

Story Beats have:

- hard world prerequisites
- optional soft psychological prerequisites
- a trigger Action
- an authored sequence
- deterministic effects

## Proposed POC beats

### Beat 1: The room is opened

World result:

```text
child_room_door_open = true
child_room_revealed = true
```

Initiator:

- either spouse

The beat should not be permanently assigned to one gender.

### Beat 2: The room receives a new trace

The other spouse enters after seeing the open door.

Possible trace:

- window opened
- a small area of the desk wiped clean
- curtain moving
- one object repositioned

World result:

```text
child_room_changed = true
clean_patch_on_desk = true
window_open = true
```

### Beat 3: The kitchen becomes alive

One spouse sees the new room trace and begins cooking a real meal.

The other spouse later joins.

World result:

```text
real_meal_started = true
shared_cooking = true
kitchen_revealed = true
```

### Beat 4: Shared meal

They eat together.

This does not mean reconciliation.

It means they can once again occupy the same living rhythm.

World result:

```text
shared_meal = true
relationship_phase = "moving"
```

### Beat 5: Leaving home

One spouse surfaces an Action such as:

- "Walk?"
- put on shoes
- retrieve coats
- carry flowers

The other responds with a complementary Action.

World result:

```text
both_left_home = true
outside_revealed = true
```

### Beat 6: Grave visit

They arrive at a quiet cemetery.

They place or straighten flowers.

No explicit exposition is required.

Ending:

```text
Thank you for playing.
```

---

# 7. Story Prototype

## 7.1 Initial state

The living room clock is three minutes slow.

The husband knows but never fixes it.

Each morning:

- he sits on the far right side of the sofa
- she drinks water at the dining table
- no one says good morning
- the television may be on, but no one watches

The house feels as if it stopped after a particular day.

The kitchen contains two normal sets of dishes and one small plastic bowl.

The husband washes the small bowl and puts it back.

The wife never removes it.

At the end of the hallway is a closed room.

When the husband passes it, he pushes the door shut.

Neither Persona explicitly identifies the room.

## 7.2 Surface mental states

### Husband

Surface beliefs and pressures:

- "Opening that door would make something happen that I cannot take back."
- "It is safer if everything stays where it is."
- "If I begin, she may think I am trying to erase what happened."
- "I should not disturb her."
- "I do not know what we would do after the door opens."

He does not know or state the full mystery answer.

### Wife

Surface beliefs and pressures:

- "If the room changes, something will disappear."
- "If I touch anything, I may not be able to stop."
- "He wants everything to look normal again."
- "I do not want to be the first one to move."
- "There is nothing useful to say."

She does not know or state the full mystery answer.

## 7.3 First movement

One spouse eventually imagines leaving the room door open.

The Action surfaces.

The player selects it.

The world resumes.

The spouse leaves the door slightly open.

This creates a neutral trace:

```text
The door is open.
```

## 7.4 Response

The other spouse sees the open door.

This observation changes the context of the next inner conversation.

Possible Action surfaces:

- push the door open
- enter the room
- open the window
- wipe a small part of the desk

The second spouse performs one small action.

This creates another neutral trace:

```text
A small part of the desk is clean.
The curtain moves.
The room has fresh air.
```

## 7.5 Reciprocal response

The first spouse sees that the room has changed.

The significance is not provided by the world.

The Persona interprets it.

Possible new Action:

- cook a real meal
- use the kitchen again
- prepare enough food for two
- take out ingredients instead of frozen food

The other spouse later sees or smells the cooking.

Possible Action:

- enter the kitchen
- pick up another knife
- begin cutting vegetables

This becomes shared cooking.

## 7.6 Ending movement

After the shared meal, the house has begun to move.

The final step should still remain small and non-triumphant.

Possible Action:

- "Walk?"
- put on a coat
- bring flowers
- leave the house together

The map expands beyond the home.

They walk to a cemetery.

At one grave:

- one spouse straightens dry flowers
- the other removes fallen leaves
- both place their hands on the ground near the stone
- their hands do not need to touch

No one says the child died.

The world confirms what the player has inferred.

Fade out.

> Thank you for playing.

---

# 8. Proposed Data Structures

The following structures are intentionally more complete than the minimum POC.

The implementation may simplify them, but the separation of responsibilities should remain.

## 8.1 IDs

```ts
type NPCId = "husband" | "wife";
type ActionId = string;
type ActionVariantId = string;
type StoryBeatId = string;
type EvidenceId = string;
type LocationId = string;
type BeliefId = string;
type MindShiftId = string;
```

## 8.2 GameState

```ts
type GameState = {
  day: number;
  timeSlot: TimeSlot;
  isPaused: boolean;

  currentNpcId: NPCId | null;

  npcs: Record<NPCId, NPCState>;
  locations: Record<LocationId, LocationState>;

  evidence: Record<EvidenceId, Evidence>;
  worldFacts: Record<string, boolean | string | number>;

  actionStates: Record<ActionId, NPCActionState>;
  storyBeatStates: Record<StoryBeatId, StoryBeatState>;

  scheduledMoments: ScheduledMoment[];
  eventLog: GameEvent[];
};
```

## 8.3 Time

```ts
type TimeSlot =
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

type ScheduledMoment = {
  id: string;
  day: number;
  timeSlot: TimeSlot;
  actorId: NPCId;

  locationId: LocationId;

  defaultActionId?: ActionId;
  alternativeActionIds: ActionId[];

  durationSeconds: number;
};
```

## 8.4 NPCDefinition

Static authored data.

```ts
type NPCDefinition = {
  id: NPCId;
  name: string;

  personaPrompt: string;
  speakingStyle: string;

  surfaceBackground: string[];
  coreValues: string[];
  longTermDesires: string[];

  initialLocationId: LocationId;
  actionIds: ActionId[];
};
```

Important:

`surfaceBackground` must not contain the explicit central mystery.

## 8.5 NPCState

```ts
type NPCState = {
  id: NPCId;

  locationId: LocationId;
  activity: NPCActivity;

  mindState: MindState;

  knownEvidenceIds: EvidenceId[];
  observedEventIds: string[];

  conversationHistory: ConversationMessage[];

  dailyConversation: DailyConversationState;

  surfacedActionIds: ActionId[];
  actionIntentions: ActionIntention[];
  completedActionIds: ActionId[];
};
```

```ts
type NPCActivity =
  | "idle"
  | "walking"
  | "routine"
  | "thinking"
  | "acting"
  | "unavailable";
```

## 8.6 DailyConversationState

```ts
type DailyConversationState = {
  day: number;

  status:
    | "unused"
    | "active"
    | "completed";

  exchangeCount: number;
  maxExchanges: number;
};
```

## 8.7 MindState

```ts
type MindState = {
  beliefs: Belief[];
  interpretations: Interpretation[];
  desires: Desire[];
  fears: Fear[];

  consideredMindShifts: MindShift[];
  acceptedMindShifts: MindShift[];

  unresolvedQuestions: string[];

  emotionalState: EmotionalState;
  summary: string;
};
```

## 8.8 Belief

Beliefs should be deep enough to affect behavior but must not expose the mystery answer.

```ts
type Belief = {
  id: BeliefId;
  proposition: string;

  stance:
    | "certain"
    | "likely"
    | "possible"
    | "doubtful"
    | "rejected";

  basis: BeliefBasis[];

  emotionallyProtected: boolean;
  protectionReason?: string;
};
```

```ts
type BeliefBasis = {
  type:
    | "evidence"
    | "assumption"
    | "conversation"
    | "world_event";

  refId: string;
  interpretation: string;
};
```

## 8.9 Interpretation

```ts
type Interpretation = {
  id: string;

  subjectRefId: string;
  meaning: string;

  confidence:
    | "low"
    | "medium"
    | "high";

  alternativesConsidered: string[];
};
```

## 8.10 Desire and Fear

```ts
type Desire = {
  id: string;
  description: string;

  salience:
    | "weak"
    | "moderate"
    | "strong";
};

type Fear = {
  id: string;
  description: string;

  salience:
    | "weak"
    | "moderate"
    | "strong";

  anticipatedOutcome: string;
};
```

## 8.11 MindShift

```ts
type MindShift = {
  id: MindShiftId;
  proposition: string;

  status:
    | "considering"
    | "accepted"
    | "integrated"
    | "rejected";

  basis: MindShiftBasis[];
  createdAtDay: number;
};
```

```ts
type MindShiftBasis = {
  type:
    | "player_statement"
    | "evidence"
    | "npc_action"
    | "story_beat";

  refId: string;
};
```

## 8.12 Conversation

```ts
type ConversationMessage = {
  id: string;
  day: number;
  timeSlot: TimeSlot;

  speaker:
    | "player"
    | "npc_inner_voice";

  text: string;
};
```

Persona output:

```ts
type PersonaTurnResult = {
  reply: string;

  mindStatePatch: MindStatePatch;

  newlyMentionedConcepts: string[];
  newlyAcceptedEvidenceIds: EvidenceId[];

  suggestedActionAwareness: ActionThought[];
  shouldEndConversation: boolean;
};
```

```ts
type MindStatePatch = {
  beliefUpdates: BeliefUpdate[];
  newInterpretations: Interpretation[];
  newMindShifts: MindShift[];

  desireUpdates: DesireUpdate[];
  fearUpdates: FearUpdate[];

  emotionalState?: EmotionalState;
  summary?: string;
};
```

## 8.13 Evidence

Evidence belongs to the world.

It should be phrased neutrally.

```ts
type Evidence = {
  id: EvidenceId;
  description: string;

  kind:
    | "world_fact"
    | "observed_behavior"
    | "object"
    | "dialogue"
    | "trace";

  reliability:
    | "certain"
    | "contested"
    | "subjective";

  locationId?: LocationId;

  observableBy: NPCId[];

  createdBy:
    | { type: "initial_state" }
    | { type: "action"; actionId: ActionId }
    | { type: "story_beat"; storyBeatId: StoryBeatId };

  active: boolean;
};
```

Examples:

```ts
const evidence = {
  small_bowl_on_counter: {
    description: "A small plastic bowl is kept on the kitchen counter."
  },

  child_room_door_open: {
    description: "The room at the end of the hallway has been left open."
  },

  clean_patch_on_desk: {
    description: "A small area of the desk has been wiped clean."
  },

  real_meal_cooking: {
    description: "A pot of soup is simmering in the kitchen."
  }
};
```

## 8.14 NarrativeAction

```ts
type NarrativeAction = {
  id: ActionId;
  actorScope:
    | NPCId
    | "either_spouse"
    | "other_spouse";

  label: string;
  description: string;

  psychologicalMeaning: string;
  intendedGoal: string;
  perceivedRisk: string;

  candidateConditions: WorldCondition[];
  executionConditions: WorldCondition[];

  awarenessSpec: ActionAwarenessSpec;
  willingnessSpec: ActionWillingnessSpec;

  triggerMode:
    | "player_attempt"
    | "npc_autonomous"
    | "world_reaction";

  repeatPolicy:
    | "once"
    | "repeatable"
    | "repeatable_until_success"
    | "once_per_phase";

  variants: ActionVariant[];
};
```

## 8.15 ActionAwarenessSpec

```ts
type ActionAwarenessSpec = {
  relevantConcepts: string[];
  supportingEvidenceIds?: EvidenceId[];

  compatibleDesires?: string[];
  relevantMindShiftPatterns?: string[];

  description: string;
};
```

## 8.16 ActionWillingnessSpec

```ts
type ActionWillingnessSpec = {
  emotionalCost:
    | "low"
    | "medium"
    | "high";

  socialRisk:
    | "low"
    | "medium"
    | "high";

  questionForJudge: string;
  smallerVariantAllowed: boolean;
};
```

## 8.17 ActionVariant

```ts
type ActionVariant = {
  id: ActionVariantId;

  label: string;
  description: string;

  sequenceId: string;
  effects: GameEffect[];
};
```

## 8.18 NPCActionState

```ts
type NPCActionState = {
  actionId: ActionId;
  actorId?: NPCId;

  awareness:
    | "latent"
    | "faintly_imagined"
    | "surfaced";

  status:
    | "hidden"
    | "available_to_attempt"
    | "attempted"
    | "deferred"
    | "committed"
    | "executing"
    | "completed"
    | "expired"
    | "superseded";

  discoveredAtDay?: number;
  attemptedAtDays: number[];

  selectedVariantId?: ActionVariantId;

  lastRefusalReason?: string;
  revealedBarrier?: string;
};
```

## 8.19 ActionIntention

```ts
type ActionIntention = {
  actionId: ActionId;
  npcId: NPCId;

  formedAtDay: number;
  formedAtTimeSlot: TimeSlot;
  formedFromConversationId: string;

  status:
    | "considered"
    | "committed"
    | "abandoned"
    | "executed";

  internalReason: string;
};
```

## 8.20 ActionThought

```ts
type ActionThought = {
  actionId: ActionId;

  awareness:
    | "unthinkable"
    | "faintly_imagined"
    | "actively_considered";

  internalThought?: string;
  reason: string;
};
```

## 8.21 StoryBeat

```ts
type StoryBeat = {
  id: StoryBeatId;
  title: string;

  prerequisites: StoryCondition[];

  triggerActionId: ActionId;

  sequenceId: string;
  effects: GameEffect[];

  repeatPolicy: "once";
};
```

## 8.22 StoryBeatState

```ts
type StoryBeatState = {
  storyBeatId: StoryBeatId;

  status:
    | "locked"
    | "eligible"
    | "surfaced"
    | "triggered"
    | "completed";

  completedAtDay?: number;
};
```

## 8.23 Conditions

Hard conditions:

```ts
type WorldCondition =
  | {
      type: "world_fact";
      key: string;
      equals: boolean | string | number;
    }
  | {
      type: "action_completed";
      actionId: ActionId;
    }
  | {
      type: "action_not_completed";
      actionId: ActionId;
    }
  | {
      type: "story_beat_completed";
      storyBeatId: StoryBeatId;
    }
  | {
      type: "npc_at";
      npcId: NPCId;
      locationId: LocationId;
    }
  | {
      type: "evidence_exists";
      evidenceId: EvidenceId;
    };
```

Soft conditions:

```ts
type JudgeCondition = {
  type: "judge_condition";

  npcId: NPCId;
  condition: string;

  relevantEvidenceIds?: EvidenceId[];
  relevantActionIds?: ActionId[];
  relevantMindShiftPatterns?: string[];
};

type StoryCondition =
  | WorldCondition
  | JudgeCondition;
```

## 8.24 Judge outputs

Awareness:

```ts
type ActionAwarenessJudgment = {
  actionId: ActionId;

  awareness:
    | "unthinkable"
    | "faintly_imagined"
    | "actively_considered";

  reason: string;
  internalThought?: string;
};
```

Willingness:

```ts
type ActionWillingnessJudgment = {
  actionId: ActionId;

  decision:
    | "accept"
    | "smaller_step"
    | "defer"
    | "refuse";

  reason: string;

  selectedVariantId?: ActionVariantId;
  revealedBarrier?: string;
};
```

Soft condition:

```ts
type SoftConditionJudgment = {
  conditionId: string;

  satisfied: boolean;
  confidence: number;

  supportingReasons: string[];
  blockingReasons: string[];
};
```

## 8.25 Locations

```ts
type LocationState = {
  id: LocationId;
  name: string;

  revealed: boolean;
  accessible: boolean;

  connectedLocationIds: LocationId[];

  discoveredByNpcId?: NPCId;
  discoveredByActionId?: ActionId;
};
```

Prototype locations:

- living_room
- kitchen
- hallway
- child_room
- entrance
- street
- cemetery

## 8.26 Game effects

```ts
type GameEffect =
  | {
      type: "reveal_location";
      locationId: LocationId;
    }
  | {
      type: "set_location_accessible";
      locationId: LocationId;
      accessible: boolean;
    }
  | {
      type: "move_npc";
      npcId: NPCId;
      locationId: LocationId;
    }
  | {
      type: "create_evidence";
      evidenceId: EvidenceId;
    }
  | {
      type: "share_evidence";
      evidenceId: EvidenceId;
      npcIds: NPCId[];
    }
  | {
      type: "set_world_fact";
      key: string;
      value: boolean | string | number;
    }
  | {
      type: "surface_action";
      actionId: ActionId;
    }
  | {
      type: "expire_action";
      actionId: ActionId;
    }
  | {
      type: "complete_story_beat";
      storyBeatId: StoryBeatId;
    };
```

---

# 9. LLM Responsibilities

## 9.1 Persona LLM

Each spouse has an independent Persona LLM.

It receives:

- surface persona
- current MindState
- currently known Evidence
- current location and exact paused moment
- recent conversation
- currently eligible Action candidates, if needed

It is responsible for:

- maintaining personality consistency
- resisting simplistic persuasion
- responding as inner self-talk
- considering or rejecting alternative interpretations
- updating surface beliefs and interpretations
- suggesting whether an Action has entered awareness
- naturally ending the conversation

It must not:

- reveal the central backstory
- invent inaccessible world facts
- directly rewrite the world
- create unsupported Actions
- become instantly healthy or agreeable
- behave like a therapist or assistant

## 9.2 Judge LLM

The Judge receives:

- current NPC MindState
- known Evidence
- current world state
- candidate authored Actions
- recent conversation
- Action specs
- story soft conditions

It decides:

- which candidate Actions are thinkable
- whether a surfaced Action is currently performable
- whether a smaller variant is more plausible
- whether a Story Beat soft condition is satisfied

The Judge should reason from the character's current state, not from a hidden intended solution.

## 9.3 World engine

The World Engine is deterministic.

It owns:

- Action Catalog
- Story Beat definitions
- hard prerequisites
- schedules
- animation mapping
- location reveal
- evidence creation
- completion and expiration
- save state
- day progression
- conversation quotas

---

# 10. Suggested POC Action Catalog

## `leave_room_door_ajar`

Actor:

- either spouse

World candidate conditions:

- child room not yet revealed
- actor passes hallway
- beat not completed

Psychological meaning:

- allow contact without fully entering

Variants:

- hand on handle, then leave
- leave a narrow gap
- open fully but remain outside

Effects:

- reveal hallway
- create evidence `child_room_door_open`
- potentially reveal child room boundary

## `enter_child_room`

Actor:

- the spouse who did not initiate the previous door action

Conditions:

- `child_room_door_open`
- character observes it

Meaning:

- acknowledge the other person's movement without direct conversation

Variants:

- stand at threshold
- step inside
- open window
- wipe one part of the desk

Effects:

- reveal child room
- create evidence `clean_patch_on_desk`
- create evidence `window_open`

## `cook_real_meal`

Actor:

- either spouse

Conditions:

- child room has a new trace
- kitchen accessible
- not yet completed

Meaning:

- return to sustaining daily life

Variants:

- take out ingredients
- make soup
- cook and leave
- cook and remain

Effects:

- reveal kitchen
- create evidence `real_meal_cooking`

## `join_cooking`

Actor:

- other spouse

Conditions:

- `real_meal_cooking`
- observes or smells food

Meaning:

- participate without requiring explicit reconciliation

Variants:

- pick up another knife
- wash vegetables
- set the table

Effects:

- set `shared_cooking = true`
- complete shared cooking beat

## `ask_to_walk`

Actor:

- either spouse

Conditions:

- shared meal completed
- relationship phase moving
- exit accessible

Meaning:

- propose shared movement without claiming resolution

Variants:

- "Walk?"
- place coat near the other spouse
- pick up flowers and wait by the door

Effects:

- surface complementary spouse Action

## `accept_walk`

Actor:

- other spouse

Conditions:

- walk proposal trace exists

Variants:

- put on coat
- pick up flowers
- walk to entrance

Effects:

- set `both_left_home = true`
- trigger cemetery sequence

---

# 11. POC Gameplay Flow

## Day 1

World runs.

Routine:

- husband sits in living room
- wife sits at dining table
- one washes the small bowl
- hallway door remains closed

Player watches.

At a meaningful moment, player pauses and speaks with one spouse.

Possible result:

`leave_room_door_ajar` surfaces and is committed.

World resumes.

The spouse later leaves the door open.

The other spouse observes it.

Player may use the other spouse's one daily conversation at that moment.

Possible result:

`enter_child_room` surfaces.

World resumes.

The room is entered.

A small trace is left.

## Day 2

The first spouse observes the changed room.

Player pauses and talks.

Possible result:

`cook_real_meal` surfaces.

World resumes.

Cooking begins.

The other spouse observes the food.

Player pauses and talks.

Possible result:

`join_cooking` surfaces.

World resumes.

They cook together.

Shared meal beat occurs.

## Day 3 or ending segment

One spouse surfaces `ask_to_walk`.

The other surfaces `accept_walk`.

They leave.

The map reveals the outside world and cemetery.

They place flowers.

End.

---

# 12. Minimum Technical Scope

For the hackathon POC, implement:

- 2 Persona LLMs
- 1 Judge LLM
- 7 locations
- free-running scheduled world
- pause button
- click-to-enter-inner-dialogue
- one conversation per NPC per day
- maximum 5 exchanges per conversation
- 6 authored Actions
- 4 to 6 Story Beats
- Action awareness and willingness judgments
- world traces as Evidence
- two or three days of simulated time
- deterministic animations or simple movement
- final cemetery sequence
- `Thank you for playing`

The world can be visually minimal.

Possible POC presentation:

- top-down 2D rooms
- simple character sprites or circles
- fixed paths
- minimal animations
- dialogue panel on pause
- new Actions displayed as special cards in the dialogue UI
- fog or hidden map sections revealed through NPC movement

---

# 13. Implementation Priority

## Phase 1: Deterministic skeleton

Build without LLM:

- world clock
- pause
- characters following schedules
- location reveal
- action execution
- evidence creation
- story beats
- ending sequence

Use debug buttons to force Actions.

## Phase 2: Persona conversations

Add:

- two Persona prompts
- daily quotas
- context-aware inner dialogue
- structured MindState patch

## Phase 3: Judge integration

Add:

- awareness judgment
- willingness judgment
- action variants
- story soft conditions

## Phase 4: Demo polish

Add:

- timed camera movement
- environmental sound
- visual distinction between world time and inner time
- action cards
- map reveal
- ending typography

---

# 14. Key Open Questions

These remain unresolved and should be treated as configurable:

1. Does the player have to talk to both spouses each day, or may they save a conversation?
2. Can the player miss a critical pause window?
3. Should failed Action attempts remain surfaced across days?
4. How much of MindState should be structured versus summarized prose?
5. Does the Judge evaluate every candidate Action after every conversation, or only semantically relevant ones?
6. Should the grave explicitly show a child's name, or remain ambiguous?
7. Is the final destination a cemetery, forest cemetery, or memorial field?
8. How long should one simulated day last?
9. How much autonomy should NPCs have for small unprompted actions?
10. Can either spouse initiate every major beat, or are some beats role-specific?

---

# 15. One-Sentence Architecture

```text
Player dialogue
→ Persona mind update
→ Judge surfaces a possible action
→ player commits the possibility
→ world resumes
→ NPC action leaves a trace
→ the other Persona interprets the trace
→ the next possibility emerges
```

---

# 16. Final Creative Principle

> The player does not uncover the story because an NPC explains it.

> The player uncovers the story because the world finally begins to move again.


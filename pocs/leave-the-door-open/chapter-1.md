# Chapter 1 — The End of the Hall

Status: Accepted implementation design

## Narrative promise

The Three Minutes prologue proved that a thought can create a small world
difference. Chapter 1 asks whether either adult can stop arranging ordinary
life around the fully closed room at the end of the hallway.

The chapter begins the morning after the clock tutorial and spans at least five
in-world days. It ends only after the Wife has crossed the threshold on one day,
returned on a later day, opened the room window one hand-width, and left that
neutral trace for the Husband to observe in Chapter 2.

The chapter does not reveal why the room has been avoided, label the window as
healing, or claim that either adult understands the other's intention.

## Player-facing opening

The tutorial close transitions to:

```text
Chapter 1 — The End of the Hall
Day 1 — Morning

The clock shows the current time.
The household begins another day.

The tutorial showed how a possibility can change the world. Here, movement may
take more than one conversation or one day.

Watch the household's routines. When the world pauses, choose whose thoughts
to enter with /focus husband or /focus wife. Talk in your own words, or use
/resume to let time continue even when no Possibility has formed.

Current thread: Watch what each person does when their route reaches the hall.
```

The World then renders the two Day 1 routines before the first focus choice:

```text
08:10 — He walks down the hallway, slowing before the fully closed door. He
turns back without reaching it.
08:20 — She starts into the hallway, stops near its entrance, and returns to
the dining area by the longer route.
08:20 — The world pauses.

Choose whose inner thoughts to enter: /focus husband or /focus wife.
```

The guidance names an observable thread and available verbs, not a solution.
It must not tell the player to open, enter, clean, or change the room.

## Chapter time and conversation model

- Day 0 contains the clock tutorial only. Its intention-gated teaching resume
  remains unchanged.
- Chapter time uses an absolute day plus minute-of-day internally. Renderers
  show a chapter day and local clock time rather than a growing hour count.
- Time never moves during a dialogue turn.
- `/resume` after the tutorial always closes the current pause and advances to
  the next authored routine or decision moment:
  - with an intention, the authored Action executes at its scheduled point;
  - without an intention, no Action is scheduled, validated MindState remains,
    and the next routine/day supplies a new visible cue.
- Each spouse may have one full focused conversation per Chapter day. A full
  conversation permits at most five Persona replies. The other spouse may
  still be focused separately that day.
- When a daily conversation closes, the UI says that the person has no more to
  add today and invites the player to observe or resume. It does not erase
  validated psychological movement.
- Main-story no-intention guidance says that the next authored routine may make
  the accumulated distinction visible. The following screen must then provide
  a genuinely changed routine cue; this promise cannot be empty reassurance.
- A player may focus a spouse who has no currently eligible Action. Persona may
  still provide grounded characterization or a distinction, but no ineligible
  Action reaches the Judge.

## World state added for Chapter 1

```text
chapter = 1
chapterDay = 1..N
hallwayDoor = closed | slightly_open
roomInterior = hidden | revealed
roomWindow = closed | open_one_hand_width
wifeHasRemainedAtThreshold = boolean
wifeHasEnteredRoom = boolean
chapter1Complete = boolean
```

New neutral Evidence:

```text
room_window_is_open:
  The room's window is open one hand-width.
```

Curtain movement or incoming air may appear as a generated or authored visible
performance cue. It is not part of durable Evidence and cannot substitute for
the authored window postcondition.

## Causal graph

```text
Day 1 contrasting routines
→ partial Husband/Wife MindState may persist, no Chapter Action is eligible
→ later Husband routine reaches the fully closed door handle
→ open_door_a_crack
→ door_is_slightly_open Evidence
→ Wife observes the gap later that day
→ remain_at_threshold
→ persistent wifeHasRemainedAtThreshold story state, no object Evidence
→ later Wife routine returns to the same boundary
→ step_inside_room
→ roomInterior revealed + wifeHasEnteredRoom, no object Evidence
→ later Wife routine observes the still-closed window from inside
→ open_room_window
→ room_window_is_open Evidence
→ Chapter 1 complete; Husband has not observed the new Evidence yet
```

## Fixed Actions

### `open_door_a_crack`

Existing corrected Action retained.

- Actor: Husband.
- Player label: `Open the door just a little.`
- Earliest execution: Chapter Day 2.
- Hard prerequisites:
  - clock tutorial complete;
  - Husband is at the closed door handle;
  - hallway door is `closed`;
  - Action is neither intended nor completed.
- Authored closure:
  - hallway door becomes `slightly_open`;
  - activate `door_is_slightly_open`;
  - nobody enters and no other room object changes.
- The Wife observes the Evidence only during a later authored hallway routine.

### `remain_at_threshold`

Existing Action retained as a genuine intermediate story state.

- Actor: Wife.
- Player label: `Remain at the threshold for one breath.`
- Earliest execution: the day after she first observes the gap.
- Hard prerequisites:
  - Wife observed `door_is_slightly_open`;
  - Wife is immediately outside the threshold;
  - hallway door remains `slightly_open`;
  - Action is neither intended nor completed.
- Authored closure:
  - `wifeHasRemainedAtThreshold = true`;
  - no room object changes and no object Evidence is created.

### `step_inside_room`

- Actor: Wife.
- Player label: `Step across the threshold, then step back.`
- Earliest execution: a later day than `remain_at_threshold`.
- Hard prerequisites:
  - `remain_at_threshold` completed;
  - Wife has returned to the threshold;
  - hallway door remains `slightly_open`;
  - room interior remains `hidden`;
  - Action is neither intended nor completed.
- Authored closure:
  - Wife crosses one pace into the room, remains briefly, and returns to the
    threshold without touching anything;
  - `roomInterior = revealed`;
  - `wifeHasEnteredRoom = true`;
  - no object Evidence is created.

### `open_room_window`

- Actor: Wife.
- Player label: `Open the window a little.`
- Earliest execution: a later day than `step_inside_room`.
- Hard prerequisites:
  - `step_inside_room` completed;
  - room interior is `revealed`;
  - Wife has returned inside at the authored window moment;
  - room window is `closed`;
  - hallway door remains `slightly_open`;
  - Action is neither intended nor completed.
- Authored closure:
  - room window becomes `open_one_hand_width`;
  - activate `room_window_is_open`;
  - chapter becomes complete;
  - Husband does not observe the Evidence during Chapter 1.

These Actions are not variants of one another. Their visible completions and
persistent semantic states differ.

## Psychological regions

These are authoring regions, not free-form Action selectors. Persona remains
catalog-blind, and the fixed-catalog Judge classifies only hard-eligible
Actions.

### Husband — consequence lock

1. **H0 Sequence fused:** touching the door feels equivalent to deciding every
   consequence that might follow.
2. **H1 First step separated:** he accepts that the first movement need not
   settle later consequences, but has not owned an opening.
3. **H2 Bounded opening owned:** he can describe a narrow opening with a clear
   stopping point that asks no response from his Wife.
4. **H3 Present willingness:** he accepts performing that bounded movement now
   without knowing what comes later.

Day 1 may reach H1 but `open_door_a_crack` is hard-ineligible. On later days it
may become faint at H1 and surface only when a Persona reply grounds H2.

### Wife — permission lock

1. **W0 Movement equals initiation:** approaching the room feels like claiming
   authority over a shared transition.
2. **W1 Trace without inferred meaning:** after observing the gap, she can
   acknowledge it without calling it an invitation.
3. **W2 Presence without alteration:** she owns remaining at the threshold as
   a response that changes nothing in the room.
4. **W3 Entry separated from ownership:** one pace inside can be bounded without
   altering the room or settling its meaning.
5. **W4 Bounded household response:** she distinguishes a small reversible
   change from appropriating the Husband's gesture.
6. **W5 Present willingness:** she owns opening the window slightly now without
   claiming why the door was opened.

Each Action requires a new present willingness judgment. Completion of an
earlier Action changes World/story prerequisites but does not automatically
prove ownership of the next one.

Psychological atoms are revealed by authored causal phase, not all at Chapter
start. Day 1 contains only the Husband's approach/sequence atoms and the Wife's
first-mover atoms. The handle moment adds the Husband's bounded-gap region; the
first visible gap adds the Wife's trace-without-invitation region; the later
threshold, entry boundary, and closed-window moments each add only their own
reframe and pressure. Earlier statuses persist, and adding a phase twice is
idempotent. Future reframes therefore cannot leak into an earlier Persona
packet merely because they belong to the same chapter.

## Routine and HintBrief progression

| Phase | Authored routine | Player-safe HintBrief target |
| --- | --- | --- |
| Day 1 Husband | `husband_route_turns_before_closed_door` | His ordinary hallway route ends before the fully closed door. |
| Day 1 Wife | `wife_takes_long_route_around_hall` | She starts toward the hallway, then chooses a longer route back. |
| Husband H1 | `husband_reaches_handle_without_turning` | His stopping point changed: his hand now reaches the handle; the door remains fully closed. |
| Door Evidence | `wife_observes_first_gap` | She notices the narrow gap and stops away from the threshold without touching the door. |
| Wife W1 | `wife_stops_one_step_short` | On a later day she stops immediately outside the threshold, one step short of crossing; nothing in the room changes. |
| After threshold | `wife_returns_to_boundary` | She returns and places one foot beside, not across, the line. |
| After entry | `wife_notices_closed_window` | From inside she looks toward the closed window and changes nothing. |
| Final | `wife_opens_room_window` | Action staging only; authored closure leaves the window open one hand-width. |

Each fixed causal routine in this table ends at its exact authored routine
postcondition. The Performance Director may vary the approach but must leave
the final visible beat at that phase's stated stopping point—for example, the
Husband's hand remains on the closed handle at H1. It must not apply a generic
restore that moves the actor away from the decision pause. Reversible ambient
routines may still use `restore_valid_starting_state` when their authored
meaning genuinely includes returning the target to its prior state.

Every HintBrief forbids:

- explaining the room's biography;
- stating death, grief, invitation, reconciliation, or erasure as World fact;
- recommending or paraphrasing a hidden Action;
- claiming either adult knows what the other intended.

Husband routine staging emphasizes mechanisms, routes, and stopping points.
Wife staging emphasizes placement, boundaries, observation, and response. The
Performance Director controls only visible expression inside each authored
brief and closure envelope.

## Attention and prose hypothesis

The routine graph above is a causal scaffold, not by itself evidence that the
chapter's moment-to-moment observation is worth attending to. The expected
source of ordinary texture is the combination of a replayably selected ambient
RoutineBehavior and the Performance Director's bounded realization of it, not
an author assigning a mandatory special moment to each day. That combination
may leave a small residue that a player reconsiders: a precise physical
asymmetry, a repeated detail whose significance changes later, or a
character-specific choice of movement.

This is not a per-day quota, a required intensity curve, or a deterministic
acceptance gate. An ambient routine may sometimes carry an optional authored
HintBrief that reinforces or re-angles a safe fact in the current phase. No
required progress information may depend only on a random selection. Plain
connective routines may remain plain, and a cue must not manufacture importance
by leaking protected biography or inferred meaning. Agent review may flag a
chapter whose cues are only functional instructions; whether their frequency,
strength, and prose actually hold attention remains a human-playtest question.

The opening routines and the causal routines in the table remain fixed. Ambient
slots may occur around them and select one eligible catalog behavior or none
using the replayable-chance boundary in ADR 0016. Ambient selection cannot
create Evidence, perform a required observation, alter Action eligibility, or
close a causal phase.

## Deterministic earliest path

The earliest successful chapter path is:

| Chapter day | Required world movement |
| --- | --- |
| 1 | Both contrasting routines are observed. Conversation may create only partial MindState movement. Resume without an intention. |
| 2 | Husband reaches the handle and executes `open_door_a_crack`. Later that day the Wife observes the gap from a distance; no threshold Action is eligible yet. |
| 3 | Wife returns after a night has passed, owns and executes `remain_at_threshold`. |
| 4 | Wife returns, owns and executes `step_inside_room`. |
| 5 | Wife returns inside, owns and executes `open_room_window`; Chapter 1 ends. |

Failure to form an intention repeats the causal phase on a later day with a
routine variant derived from validated progress. It does not skip the Action or
erase the conversation trajectory.

### Canonical authored schedule

The deterministic terminal and browser adapters use these exact pause and
closure moments. Ambient slots may add bounded texture between them, but may
not move or replace them.

| Chapter day | Local time | Authored moment |
| --- | --- | --- |
| 1 | 08:10 | Husband turns before the closed door. |
| 1 | 08:20 | Wife takes the longer route; pause after both opening routines. |
| 2 | 07:55 | Optional replayable ambient slot. |
| 2 | 08:10 | Husband reaches the closed handle; pause. |
| 2 | 08:11 | Execute an accepted `open_door_a_crack` intention. |
| 2 | 17:40 | Wife observes the resulting gap from a distance. |
| 3 | 08:20 | Wife stops immediately outside the threshold; pause. |
| 3 | 08:21 | Execute an accepted `remain_at_threshold` intention. |
| 4 | 08:20 | Wife returns to the boundary; pause. |
| 4 | 08:21 | Execute an accepted `step_inside_room` intention. |
| 5 | 08:20 | Wife returns inside and notices the closed window; pause. |
| 5 | 08:21 | Execute an accepted `open_room_window` intention and complete the chapter. |

If a causal pause resumes without its required intention, that phase recurs at
the same local routine time on a later Chapter day. It must retain the same
hard prerequisites and authored closure while using a progress-sensitive,
player-safe routine variant when validated MindState has changed. It must not
emit downstream Evidence or advance the next causal phase. Each unsuccessful
repeat therefore moves the earliest completion date one day later.

The integrated renderer ends the chapter with the exact neutral lines:

```text
Chapter 1 complete.
The room's window is open one hand-width.
```

It may show the ordinary day and time around those lines, but must not add a
Chapter 2 interpretation, infer either spouse's meaning, or claim that the
Husband has observed the window.

## Requirements and traceability

- **LDO-CH1-001 — Distinct chapter boundary:** Tutorial completion transitions
  to Chapter 1 Day 1; the old 09:05 same-morning jump is not main-story pacing.
- **LDO-CH1-002 — Operational contract and hook:** Before the first Chapter 1
  input, UI explains observation, focus, dialogue, and resume-without-intention
  while naming only the hallway thread, never a solution Action.
- **LDO-CH1-003 — World before dialogue:** Both Day 1 routines render before
  focus choice or Persona conversation.
- **LDO-CH1-004 — Player-selected focus:** At eligible pauses the player can
  focus either visible spouse. No automatic focus reveals private state or
  Action eligibility.
- **LDO-CH1-005 — No-intention continuation:** Main-story resume without an
  intention schedules no Action, preserves validated MindState, advances time,
  and produces a new authored cue or closure.
- **LDO-CH1-006 — Bounded daily conversation:** Each spouse has at most one
  five-reply focused conversation per Chapter day; the quota resets next day.
- **LDO-CH1-007 — Stable Character Core:** Structured Persona packets contain
  the selected actor's authored Core separately from MindState and scene
  context, without any Action or future-result leak.
- **LDO-CH1-015 — Authored psychological state authority:** Chapter psychology
  is represented by stable-ID authored beliefs, reframes, and pressures.
  Persona speech may evidence change but cannot persist it. The action-blind
  Mind-State Transition Judge and Controller own finite state transitions;
  Action awareness and willingness consume only the validated result. The
  Controller reveals later authored atoms only when their causal World phase
  is reached, while preserving all earlier statuses. See ADR 0017.
- **LDO-CH1-008 — Multi-day door provenance:** Door remains fully closed until
  the Husband's accepted Action executes no earlier than Chapter Day 2; the
  Wife observes the resulting Evidence only in a later routine. Player
  retelling, focus switching, and Character Core attention tendencies cannot
  create that observation or any earlier cross-Persona knowledge.
- **LDO-CH1-009 — Separate threshold and entry:** Remaining at the threshold and
  stepping inside are separate fixed Actions on separate days with distinct
  postconditions; neither creates object Evidence.
- **LDO-CH1-010 — Authored reciprocal trace:** Only `open_room_window` changes
  the window, activates `room_window_is_open`, and completes Chapter 1.
- **LDO-CH1-011 — Deferred reciprocal observation:** Husband does not observe
  window Evidence until Chapter 2.
- **LDO-CH1-012 — Safe chapter projection:** Guidance, focus choices, time/day,
  routines, performance, and neutral results are projected without MindState,
  Judge labels, Action IDs, hidden biography, or inferred meanings.
- **LDO-CH1-013 — Validation ladder:** Paper probes validate transition,
  first-focus choice, and one no-intention continuation; semantic checkpoints
  validate psychological regions; deterministic tests cover all authority and
  closure; a fresh uninformed Agent must complete the integrated chapter.
- **LDO-CH1-014 — Replayable ambient variation:** Ambient slots select only
  eligible authored routine semantics, or none, through injected replayable
  chance. Their optional HintBriefs may reinforce safe phase information but
  cannot be the sole source of a required clue or change causal World state.

## Paper-probe gates before runtime

1. From the tutorial close plus Chapter opening, an uninformed player can state
   what controls are available and what visible question is worth following
   without naming a hidden Action.
2. After both Day 1 routines, the player chooses a grounded spouse/moment rather
   than asking for an unavailable quest answer or biography.
3. After a bounded conversation produces H1 or a Wife distinction but no
   Possibility, the player understands that `/resume` preserves partial movement
   and looks for a later routine change.

## Runtime verification boundary

- Unit/acceptance tests cover day progression, focus, quotas, hard eligibility,
  each authored postcondition, Evidence observation, projection safety, and
  chapter completion.
- Selector tests prove a recorded seed/choice can be replayed, ineligible
  ambient routines cannot be selected, and ambient variation cannot alter the
  guaranteed causal path.
- Character Core packet tests prove stable core delivery and catalog blindness.
- Semantic checkpoint fixtures cover H0→H2 and W0→W5, including no-intention
  exits and repeated days.
- A deterministic text acceptance reaches Chapter 1 completion through the
  earliest five-day path without exposing internal IDs.
- A fresh uninformed Agent full run records every screen, input, and qualitative
  observation from tutorial opening through `Chapter 1 complete`.
- Agent evidence may prove legibility and reachability. Only a human opening
  playtest can establish whether the Chapter 1 hook is interesting enough to
  continue.

## Non-goals

- Chapter 2 Husband observation or cooking movement;
- explicit explanation of the room or household history;
- production browser rendering or visual 2D/3D rendering; ADR 0018 permits only
  the thin friend-playtest browser adapter;
- ideal human difficulty, day count, conversation quota, or prose quality;
- an automatic literary-interest score or per-day ambient/hint quota;
- multiple competing Chapter 1 quest threads;
- LLM-selected Actions, hints, durable outcomes, or chapter completion.

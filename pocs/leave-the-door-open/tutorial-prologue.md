# Tutorial Prologue Proposal — Three Minutes

Status: Accepted implementation design

## What the tutorial must teach

By the end of this short prologue, a first-time player should have personally
experienced this sequence once:

```text
notice a routine anomaly and its authored performance hint
→ enter a character's inner dialogue
→ help a concrete possibility become thinkable
→ select the surfaced Possibility
→ see an intention form
→ resume time
→ watch a bounded, player-influenced performance of the fixed behavior
→ see another character notice the resulting trace
```

This is the **success grammar**: the causal shape a player needs to recognize.
It is not a promise that later problems resolve in one conversation or one day.

## Story premise

The living-room clock is three minutes slow. The husband knows this and notices
it every morning, but never corrects it. This detail already belongs to the
authored initial state.

Correcting the clock does not need a deep symbolic reason. On this morning, the
husband may simply discover that he has enough energy to make one small change
to a familiar routine.

## Beat-by-beat presentation

### 1. Routine clue

The World, not the tutorial UI, supplies the first clue:

```text
07:57 — Living room — The wall clock shows 07:54.
07:57 — He looks up at it, then starts to pass beneath it as usual.
07:57 — He stops.
07:57 — The world pauses.
```

The discrepancy is visible before the conversation. The player does not need
hidden biography or a guessed keyword to find a subject.

### 2. Bounded Persona state

The tutorial pause has one authored conversational focus: the Husband. The
Wife remains a World participant whose later observation closes the teaching
loop, but she is not a selectable Persona until Chapter 1 begins. A renderer
must reject an attempted Wife focus without changing the current Husband
conversation. This prevents main-story scene psychology from leaking into the
clock prologue and keeps the first interaction legible.

The Husband packet may know only the local, surface facts needed for this beat:

- the living-room clock is three minutes slow;
- he notices the discrepancy every morning;
- he has left it unchanged for a long time;
- he is currently beneath the clock while the World is paused.

His light resistance is:

- he is used to noticing the discrepancy and continuing past it;
- even a small deliberate adjustment normally feels like more effort than he
  wants to spend;
- he has not yet noticed that today he may have enough energy to change this
  one thing.

The tutorial authors one shallow constructive atom: setting the clock right can
be understood as one bounded task with a clear stopping point. When the Persona
actually owns that understanding, the action-blind transition Judge may mark
the atom accepted and resolve the small effort pressure. No deeper meaning,
permission, symbolic reason, or replacement barrier is required. This is a
tutorial-specific reachability choice, not a rule that every future event needs
one sufficient sentence. It exposes no Action ID and does not force World
execution; awareness, player selection, and willingness remain separate.

An opening thought can make the conversational object legible without giving
away the Action:

> Three minutes. I notice them every morning. Usually I just keep walking.

### 3. Reachable reframe

Several kinds of player language should plausibly help without requiring one
exact phrase:

- ask whether changing three minutes feels possible today;
- notice that he stopped instead of continuing his routine;
- suggest that a small change does not need a larger reason;
- ask whether he has enough energy to touch, adjust, or simply play with the
  clock for a moment;
- propose a reversible way to interact with the clock, such as spinning its
  hands or briefly removing and replacing its battery.

The Persona may resist, partially reframe, or ask for clarification. A suitable
owned state is conceptually:

> I think I have enough in me to do something with these three minutes. I can
> play with them for a while and leave the clock right when I am done.

This sentence is an example of the required ownership boundary, not canonical
player-facing dialogue.

### 4. Fixed Action

Proposed authored data:

```text
Action: interact_with_living_room_clock
Psychological description:
  Physically interact with the living-room clock for a brief period; when
  finished, leave it intact, running, and showing the current time. The
  intermediate interaction may be a direct adjustment or a reversible motif
  the Persona accepted.
Player label:
  Spend a moment with the clock.
Variant:
  Follow the Persona's accepted clock-interaction motif, then leave the clock
  showing the current time.
```

The fixed Action owns the meaningful choice and required ending. It does not
fix every intermediate gesture. A Performance Director may stage an accepted
player/Persona motif such as taking the clock down, spinning its hands,
removing and replacing the battery, or trying several deliberately incorrect
times. These are transient performance beats rather than separate durable
Actions because they all close on the same authored World state.

The authored PerformanceEnvelope is:

- target: the living-room clock;
- freedom: reversible handling and playful temporary settings;
- required ending: clock intact, installed, running, and showing current time;
- durable effect: the clock is now accurate;
- forbidden changes: damage, disposal, changes to other objects, new Evidence
  beyond the accurate clock, or claims about another character's meaning.

The Performance Director cannot choose this Action, its ending, or a story
clue. It generates staging only after the Persona owns a compatible motif, the
Action Judge accepts willingness, and the player selects the Possibility.

### 5. Visible commitment and execution

After the Possibility surfaces and the player selects it, the existing UI gate
confirms:

```text
An intention has formed. Type /resume to let the world continue.
```

After resume:

```text
07:58 — He takes down the clock and turns its hands through several impossible
        hours. He removes the battery, waits, then fits it back into place.
07:59 — When he has had enough, he sets the hands to the current time and hangs
        the clock back on the wall.
07:59 — The wall clock now shows 07:59.
```

The exact intermediate lines are an example, not authored canonical prose.
The closing state is authored and fixed. The character's sense of having
played enough is expressed by stopping and restoring the clock; it does not
give the Performance Director a general MindState mutation capability.

The neutral World fact is only that the clock now matches the current time.
The World does not label the act as healing, hope, love, or progress.

### 6. Observation and tutorial close

During the Wife's next ordinary routine:

```text
08:00 — Dining area — She carries in her glass of water.
08:00 — She looks at the living-room clock, then looks again.
```

The World records that she observed the accurate clock. It does not state what
she thinks the change means.

The tutorial UI may then recap:

```text
A possibility became an intention.
Time resumed, and the world changed.
Someone else noticed.

Day 1
```

The existing hallway-door story begins after this transition.

## Routine stages and authored hints

The clock routine may use authored variants keyed to validated Action-awareness
progression:

```text
latent
→ he glances at the slow clock and continues walking

faintly_imagined
→ he stops beneath it and watches it for several seconds

surfaced
→ he touches the frame but does not change its durable state

intended
→ the scheduled NarrativeAction performs the bounded clock interaction

completed
→ a later routine acknowledges that the clock is now accurate
```

The authored HintBrief for the opening routine is only:

```text
safe fact: He notices that the clock is three minutes slow every morning.
clarity: clear enough to invite a first question.
forbidden: explain why, recommend the hidden Action, or connect the clock to
           grief, relationship repair, or the central mystery.
```

The Performance Director may decide whether this appears as a glance, a second
look, a counted pause, or another compatible gesture. It cannot choose a
different fact to hint or decide when a protected story clue should appear.

Before any intention forms, letting time continue is also a valid exploratory
move. The World follows Martin through several ordinary routines across the
rest of the day, leaves the clock unchanged, and returns to the next morning's
slow-clock moment. This observation cycle may repeat without skipping the
tutorial or resetting validated conversation progress. Elise exists in the
simulation, but the tutorial's limited narrative camera does not present her;
this is not a claim that Martin lives alone. Martin is the implicit inner voice.
Focus controls and Elise are introduced only when the corrected-clock
observation opens Chapter 1. See ADRs 0021–0022 and `LDO-LOCAL-014`.

## Authoring constraints

- Use the production PoC pipeline; do not hard-code a successful Judge result.
- Keep the Action fixed and catalog-owned.
- Keep the Persona catalog-blind.
- Keep routine identity, stage eligibility, and every HintBrief authored.
- Let the Performance Director generate only staging inside the supplied
  envelope and hint target.
- Do not make the clock a metaphor in World state or UI text.
- Keep the tutorial resistance shallow: ordinary inertia and available energy,
  not grief, relationship repair, or fear of irreversible consequences.
- Do not require success in one turn or one exact sentence; author a broad,
  legible reachable region.
- Keep the tutorial focus on the Husband. If the player enters a number before
  any Possibility is visible, explain that none is available yet and direct
  attention back to what might feel possible with the clock today without
  revealing the fixed Action.
- Do not infer later-game pacing from this tutorial's short path.
- Do not add a second required Action merely to lengthen the tutorial. The
  wife's observation is enough to demonstrate that a trace can reach another
  character.

## Validation before implementation

The next design check is a paper/agent walkthrough using only proposed
player-visible screens. It should answer:

1. Does the routine presentation give an uninformed player a natural first
   question?
2. Does at least one ordinary multi-turn conversation reach exact ownership of
   the clock Action without exposing it to the Persona?
3. Does the post-resume sequence make the causal loop legible without tutorial
   jargon?
4. Does the prologue feel like the same quiet house rather than a detached
   training puzzle?
5. Do several reversible player-proposed clock interactions produce coherent
   performances with the same authored final state?
6. Does every generated hint express only its supplied safe fact rather than
   selecting or leaking another story fact?

Only after this content walkthrough should implementation begin with tests
traced to `LDO-LOCAL-010` and the accepted form of ADR 0009.

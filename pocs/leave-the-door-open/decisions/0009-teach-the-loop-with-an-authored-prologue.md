# 0009: Teach the Loop with a Low-Stakes Authored Prologue

Status: Accepted for the tutorial content walkthrough

Date: 2026-07-16

## Context

Black-box Playtests 002–004 used the husband's first hallway-door moment as
both the opening of the story and the mechanical tutorial. The players could
produce credible partial psychological movement, but none experienced a
numbered Possibility, intention confirmation, resumed authored behavior, or a
visible world consequence.

The hallway door is the story's first major emotionally ambiguous beat. It is
supposed to support resistance, incomplete movement, and discovery over time.
Those properties make it poor content for teaching the interaction grammar.
Prompt tuning alone cannot make it simultaneously subtle as story content and
reliably legible as the player's first example of success.

This does not show that later play must produce progress within one day or one
pause. It shows that the first level currently asks the player to infer a game
loop they have never seen complete.

## Options considered

1. **Keep the door as the tutorial and tune Persona or Judge prompts.** This is
   the smallest content change, but makes a global mechanism compensate for a
   local teaching problem and risks weakening every later psychological gate.
2. **Script a guaranteed tutorial outside the real model pipeline.** This is
   reliable, but teaches the player that conversation has authored answers
   instead of demonstrating the actual generative-psychology/fixed-Action
   contract.
3. **Create an unrelated training vignette.** This isolates tutorial pacing,
   but adds characters and world content whose tone and rules may feel
   disconnected from the main story.
4. **Add a low-stakes authored prologue in the same house, using the real
   pipeline.** Recommended. It uses a simple existing world detail—the living
   room clock that is always three minutes slow—to demonstrate the complete
   loop before the hallway-door story begins.

All options assume the tutorial should teach the real causal grammar. If a
scripted approximation is acceptable, options 2 and 4 must be compared again
under that different premise.

## Proposed decision

1. Add a short `Day 0` prologue before the existing hallway-door beat.
2. The prologue uses the same catalog-blind Persona, fixed Action Judge,
   willingness gate, intention, deterministic World execution, Evidence,
   observation, projection, and render layers as the main game. There is no
   tutorial-only success override.
3. The content is deliberately low-stakes and strongly clued through routine
   behavior. It exists to teach the success grammar, not the main story's
   difficulty or long-term pacing.
4. The proposed beat is **Three Minutes**:
   - the visible World shows that the living-room clock is three minutes slow;
   - the husband notices it during an established morning routine and pauses;
   - conversation may help him notice that he has enough energy today to make
     one small change to the familiar routine;
   - a fixed Action lets him interact with the clock, either directly or
     playfully, while an authored envelope requires the performance to end with
     the clock intact, running, and showing the current time;
   - the World executes the intention and creates the neutral fact that the
     clock now shows the current time;
   - the wife later observes the changed clock during her routine.
5. Completion UI explicitly recaps the observable grammar in player language:
   a possibility became an intention, time resumed, the world changed, and
   another person noticed. It does not reveal IDs, Judge state, or future
   story answers.
6. The main story begins only after this recap. From that point onward, days
   and pauses may end without substantive psychological progress, provided
   routine behavior or new observations still give the player something
   meaningful to notice.
7. Action definitions presented to the psychological Judge describe the
   concrete volitional change the character must own. Incidental exit movement
   or routine continuation may appear in World choreography, but must not
   silently enlarge the psychological success condition.

## Why this is preferred

- It adds authored content, not a new gameplay mechanism.
- It exercises the exact boundaries the PoC is meant to validate.
- It gives routine animation an instructional job before dialogue begins.
- Its resistance is ordinary inertia rather than a miniature version of the
  main story's deeper emotional conflict.
- It preserves the hallway door as a slower, emotionally difficult main-story
  beat.
- It is reversible: the prologue can be replaced without changing the core
  protocol.

## Relationship to accepted decisions

This extends ADRs 0001, 0002, 0003, and 0008. It does not expose the Action
Catalog to Personas, let renderers mutate state, make automated evaluation a
fun judgment, or turn generated microsteps into executable Actions.

ADR 0010 defines how player-influenced clock performance and authored routine
hints remain bounded inside this prologue.

# 0020: Preserve Visible Progress Without Changing Action Gates

Status: Accepted

Date: 2026-07-16

## Context

The first full Persona v7 / Judge v4 black-box run reached the Wife's
`step_inside_room` Possibility, selected it, and received a correct willingness
defer. Conversation then continued to move among bounded entry, first-mover
pressure, and possible spoken exchanges. The next authored routine repeated the
same toe-at-the-line image, while the UI said only to keep talking and later
reported that no Possibility was chosen. The uninformed player could not tell
three different facts apart:

- the fixed entry Action had been understood but was not yet a present choice;
- spoken ideas could matter psychologically but were not fixed world Actions at
  that pause;
- validated awareness already reached in an earlier reply had not been erased
  merely because a later reply became more distant.

The run stopped on Day 6 as a qualitative loop. It had no World contradiction,
cross-Persona knowledge leak, protocol error, or evidence that the willingness
Judge should have accepted the deferred reply.

## Options considered

1. **Make no change and retry another Agent.** A different player might ask the
   direct present-choice question and complete the chapter. Rejected because it
   leaves the reproduced routine repetition and misleading UI unexplained.
2. **Automatically accept a surfaced Action after one defer.** This would make
   completion shorter. Rejected because awareness is not present willingness;
   it would collapse the psychological gate the PoC is validating.
3. **Turn any accepted spoken proposal into a free-form Action.** Rejected. It
   reverses the fixed Action catalog, lets Persona speech choose World behavior,
   and makes authored closure uncontrollable.
4. **Tell the catalog-blind Persona which Actions exist so it avoids other
   proposals.** Rejected because it leaks solution structure into the role that
   must not anticipate the Judge's catalog.
5. **Preserve the highest validated render-facing awareness, add one authored
   surfaced retry routine, and clarify the existing UI boundary.** Accepted.
   The Judge remains just as strict and the Action catalog remains fixed, while
   the player can see that an earlier distinction survived and can understand
   what a numbered Possibility means.

The options share one assumption worth making explicit: the failure is a
legibility problem around a valid defer, not proof that the target Action
itself is unreachable. The saved run supports that assumption because the
Persona explicitly said the crossing was only considered, and the willingness
Judge deferred for that exact reason.

## Decision

1. Render-facing `actionProgress` records the highest validated awareness stage
   reached for an unresolved Action. Later `latent` or `faintly_imagined`
   judgments may hide the numbered option for that reply, but may not erase the
   progress used by future routine staging. `intended` and `completed` remain
   terminal forward stages.
2. `wife_returns_to_boundary` has a distinct authored `surfaced` retry variant.
   It may show a reversible forward weight shift while ending with the foot
   beside the boundary. It cannot cross the threshold, create Evidence, or
   execute the Action.
3. A willingness defer remains a defer. Player-safe feedback distinguishes
   considering an Action from owning it as a choice now and suggests asking
   about that remaining separation; it does not expose Judge labels, atoms, or
   an answer.
4. Chapter help and no-intention continuation state that conversation can
   consider more than the fixed world Actions. Only a numbered Possibility can
   be selected as an Action at the current pause; dialogue can still persist as
   psychological movement.
5. Persona remains catalog-blind, the Mind-State Transition Judge remains
   action-blind, and no natural-language parser, keyword router, free-form
   Action, auto-accept counter, or model-evaluator layer is added.

## Consequences

- Repeated days can visibly acknowledge surfaced-but-deferred progress without
  changing the authored postcondition or lowering willingness strictness.
- A player who explores an unmodeled spoken idea receives an accurate game-loop
  explanation instead of an implied promise that every accepted sentence will
  become a World Action.
- `actionProgress` is explicitly a monotonic render-facing trace, not the
  authoritative MindState and not the current reply's option availability.
- This does not establish ideal difficulty or guarantee completion across
  models; another fresh uninformed run remains required.

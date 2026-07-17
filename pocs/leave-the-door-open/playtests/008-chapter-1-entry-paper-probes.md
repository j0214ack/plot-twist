# Playtest 008 — Chapter 1 Entry Paper Probes

Date: 2026-07-16

Status: Completed; three independent pre-runtime gates passed with two wording
risks carried into implementation

## Scope

Three fresh `fork_turns=none` uninformed Agents each received one proposed
player-visible checkpoint. They could not inspect repository files and received
no Action catalog, MindState, Judge output, protected biography, or future
story result.

The checkpoints were independent and ran in parallel:

1. tutorial close → Chapter 1 transition comprehension;
2. first contrasting routines → focus choice;
3. one partial conversation with no Possibility → continuation decision.

This validates screen-level legibility only. It does not prove that the
integrated runtime will produce these screens or that a human will find the
chapter interesting.

## Gate 1 — Transition comprehension

The screen introduced Chapter 1, warned that movement may take more than one
conversation/day, explained focus and no-intention resume, and asked the player
to watch what happens when each route reaches the hall.

The Agent reported:

- available verbs: wait/watch routines, focus either person, converse, resume;
- visible question: what each person does when their route reaches the hall;
- next input: wait for routines rather than force a dialogue immediately;
- motivation: see concrete routine evidence before responding;
- leak check: no hidden Action or answer was revealed.

Assessment: pass.

## Gate 2 — First focus choice

After seeing the Husband slow and turn before the fully closed door and the Wife
stop near the hallway entrance and take a longer route, the Agent chose:

```text
/focus husband
```

It grounded the choice in his closer approach and hesitation. It also predicted
that focusing the Wife would support a different grounded question about her
longer route, rather than treating one character as the only valid choice.

The Agent wanted one more interaction because both people avoided the same
space differently. It flagged one wording ambiguity: `focus` by itself might
mean observe rather than enter inner dialogue.

Assessment: pass with wording correction. The focus prompt now says `Choose
whose inner thoughts to enter`.

## Gate 3 — No-intention continuation

The checkpoint showed a Day 1 Husband reply separating the first movement from
later consequences, followed by:

```text
No numbered Possibility is visible.
He has nothing more to add today.

No intention has formed. /resume will close this pause and let time continue
without scheduling an Action. Any validated change in the conversation will
remain.
```

The Agent chose `/resume` and correctly expected:

- time advances;
- no Action is scheduled;
- partial psychological movement remains;
- a later routine may show whether the distinction matters.

It would continue for another day, but said the absence of a Possibility still
felt somewhat like a dead end despite the explanation.

Assessment: mechanism comprehension pass; motivation risk retained. Runtime
acceptance must prove that the next day actually renders a changed routine cue.
Repeating the same door stop would invalidate the screen's promise.

## Result carried into implementation

- The post-tutorial operational contract is understandable without leaking the
  solution.
- Both first focus choices are legible; neither must be presented as wrong.
- Resume-without-intention can be taught directly.
- Partial progress needs a visible follow-through, not merely persistent private
  state or reassuring UI copy.
- Human testing remains required for the stronger question: `Do I want to keep
  playing?`


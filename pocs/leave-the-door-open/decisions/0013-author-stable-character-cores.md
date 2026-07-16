# 0013: Author Stable Character Cores Separately from MindState and Scene Context

Status: Accepted

Date: 2026-07-16

## Context

The current Husband and Wife Persona packets use the same surface role:
`An adult who shares this quiet house with their spouse.` Their supplied facts
and emotional barriers differ by scene, but the shared Persona prompt has no
stable character-specific values, attention pattern, protective strategy, or
voice guidance.

Playtest 007 exposed the practical result. Both characters frequently answered
with the same cadence: `I can't...`, `I only know...`, `I can consider...`, and
`I am not ready...`. They behaved like one general resistant Persona facing
different obstacles rather than two people with distinct continuous lives.

The system currently represents two changing layers well:

- `MindState`: accepted reframes, barrier movement, and current pressure;
- scene context: observed facts, moment, routine, location, and conversation.

It lacks an authored stable layer explaining how this particular person tends
to notice, interpret, protect, speak, and choose.

## Options considered

1. **Rely on scene facts and emotional barriers.** This adds no new data, but
   makes character identity collapse whenever two people face structurally
   similar resistance.
2. **Add character catchphrases or prose-style instructions only.** This may
   improve label recognition, but risks caricature and does not change what a
   character notices, values, or finds psychologically reachable.
3. **Add an authored stable Character Core, separate from MindState and scene
   context.** This lets personality influence reasoning, attention, routine,
   and voice without becoming mutable conversation state. Accepted.

All options assume the two spouses should be recognizably distinct even when
names and labels are removed. If anonymity or deliberate identity convergence
becomes part of the intended story, this goal must be revised explicitly rather
than emerging accidentally from a generic prompt.

## Decision

1. Before authoring Chapter 1 in detail, create a concise one-page Character
   Core for the Husband and another for the Wife.
2. A Character Core contains only stable authored tendencies needed for play,
   such as:
   - what the person habitually notices;
   - values and protective strategies;
   - default reasoning or defensive patterns;
   - what forms of agency feel natural or difficult;
   - voice tendencies, including directness, rhythm, and use of abstraction.
3. Character Core, MindState, and scene context remain separate:
   - Character Core supplies the stable person;
   - MindState records conversation-reachable change;
   - scene context supplies current observable reality.
4. A Character Core contains no Action IDs, variants, future effects, preferred
   solution, or unsupported hidden biography. Supplying it to Persona must not
   weaken catalog blindness or World authority.
5. Character distinction must affect attention, interpretation, resistance,
   and reachable reframes—not just vocabulary or catchphrases. RoutineVariant
   and HintBrief authors should also check that visible behavior belongs to the
   same person.
6. Baseline personality remains stable across chapters. Any story-driven
   development is represented explicitly through MindState, authored story
   state, Actions, and Evidence rather than silently rewriting the core.
7. Before runtime implementation, perform a label-blind paper or checkpoint
   probe using multiple replies from both profiles. Record whether a player or
   evaluator can explain which person produced each reply and which stable
   difference supported that judgment.
8. Label-blind recognition is diagnostic evidence, not proof that the voices
   are enjoyable, subtle, or free of stereotypes. Human playtests retain that
   responsibility.

## Consequences

- Chapter routines, hints, and conversations gain a shared characterization
  source instead of independently inventing personality.
- Persona packet and validation contracts will need a separately specified,
  tested extension before runtime changes are made.
- Strong differentiation cannot be achieved by globally tightening the Judge;
  the Judge still evaluates grounded ownership of fixed Actions.
- Repetitive global prompt behavior can be distinguished from an intentional
  character trait during playtest review.

## Relationship to accepted decisions

This extends ADR 0001 without exposing the Action catalog to Persona. It keeps
ADR 0002's World authority, ADR 0003's human evaluation boundary, and ADR
0010's authored hint targets. It adds no new Performance Director authority.


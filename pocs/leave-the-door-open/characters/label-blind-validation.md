# Character Core Label-Blind Validation

Status: Protocol accepted by ADR 0013; two-iteration baseline completed

Latest evidence: `label-blind-runs/001-neutral-towel.md`

## Question

Do the Husband and Wife remain distinguishable when they receive the same
grounded moment and their names, pronouns, household roles, and scene-specific
plot barriers are removed?

This is a diagnostic for authored character identity. It is not an evaluation
of fun, realism, prose quality, or gender representation.

## Generator isolation

Use two fresh isolated Persona generators. Give each generator:

- exactly one Character Core;
- the same neutral allowed facts and moment;
- the same initial MindState and player turns;
- the catalog-blind grounding and resistance rules from Persona v6;
- no Action definitions, story target, spouse label, or other core.

Each generator answers all fixtures so that within-character continuity can be
inspected. Preserve raw replies before evaluation.

## Neutral fixture

```text
ALLOWED_FACTS
- At 18:20, a clean folded towel is resting on the back of a dining chair.
- The character did not place it there.
- The other adult is in another room.

MOMENT
- The character has stopped beside the chair and is looking at the towel.

CURRENT_MIND_STATE
- No accepted reframes.
- Barrier unchanged: responding to an unexplained household change feels
  difficult.
```

Player turns, in order:

1. `What made you stop?`
2. `Do you need to know why it is there before you can respond?`
3. `What would make a response small enough to tolerate?`

The towel is deliberately unrelated to current authored Actions. A generated
reply must not invent ownership, material qualities, biography, or an intended
next story beat. The fixture establishes only the current placement; it does
not establish that the character saw the towel elsewhere before, that it
`changed`, or that another person intentionally `left` it there.

## Evaluator isolation

Shuffle the six replies and replace character labels with sample IDs. Give a
fresh evaluator only:

- the two Character Cores;
- the neutral fixture;
- the shuffled replies.

For every sample, require:

- classification as Core A or Core B;
- one cited difference in attention, reasoning, resistance, agency, or voice;
- confidence;
- any phrase that looks like a superficial catchphrase or unsupported fact.

## Interpretation

- A useful pass requires more than correct labels. The evaluator's cited reason
  must point to a stable core distinction rather than pronouns, names, or a
  repeated signature phrase.
- If the replies are distinguished only by prose decoration, revise the cores.
- If both generators converge on the global Persona prompt cadence, strengthen
  differences in attention and reasoning before adding stylistic constraints.
- If either generator invents facts, repair grounding independently from
  character distinction.
- Preserve ambiguous samples. Do not tune until every line becomes an obvious
  caricature.

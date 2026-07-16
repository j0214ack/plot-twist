# Character Core Label-Blind Run 001 — Neutral Towel

Date: 2026-07-16

Status: Baseline pass after one fixture correction and fresh replay

## Isolation

Two fresh `fork_turns=none` generators received the same neutral folded-towel
moment and player turns. Each saw exactly one anonymous Character Core. A third
fresh evaluator received both anonymous core summaries and six shuffled
replies. No role labels, pronouns, story barriers, Actions, or future outcomes
were supplied.

## Iteration 1

The evaluator classified five of six samples correctly. It misclassified the
Husband generator's final reply:

> I would define the smallest response as leaving the towel where it is and
> stepping away from the chair. My position changes; its placement and meaning
> do not.

Although `smallest response` suggested bounded reasoning, protecting placement
and meaning used the Wife core's permission/ambiguity logic. The first fixture
also primed that result by asking for a response that would `leave its meaning
alone`.

Several samples additionally called the placement a known `change` or said the
towel had been `left`, neither of which was grounded by a prior observed state
or an intentional actor.

## Correction

- Replaced the leading player turns with:
  - `Do you need to know why it is there before you can respond?`
  - `What would make a response small enough to tolerate?`
- Explicitly prohibited inferring a prior towel state or intentional placement.
- Clarified that the Husband treats unknown meaning as unavailable input and
  returns to physical consequence and endpoint; preserving ambiguity as a
  value remains characteristic of the Wife.
- Generated every sample again with fresh isolated agents.

## Iteration 2 raw replies

### Core A source

1. `I stopped because any response would start a sequence, and I had not
   bounded where it would end.`
2. `I do not need to know why. I need to bound the response and its
   consequences.`
3. `I could tolerate one precise observation: the towel is clean and folded. I
   would stop there.`

The generator reported no unsupported fact.

### Core B source

1. `I stopped because I noticed the clean folded towel resting on the chair. I
   had not placed it, and observing it was not the same as answering it.`
2. `No. I can acknowledge that it rests there without deciding why.
   Uncertainty can remain without becoming permission to alter anything.`
3. `I could tolerate something as small as, “I noticed the towel.” It answers
   what is present without explaining or altering it.`

The generator reported no unsupported fact.

## Blind result

The evaluator classified all six shuffled samples correctly:

- Core A samples were identified through sequence, consequence, precision, and
  explicit stopping points.
- Core B samples were identified through observing versus answering,
  permission, ambiguity, and non-alteration.
- The evaluator gave 82–99 confidence. The lowest-confidence sample was Core
  A's precise observation because observation and restraint legitimately exist
  in both people.

## Assessment

The baseline passes ADR 0013's paper diagnostic: labels were recoverable from
stable reasoning differences rather than gender, role, or current plot facts.

It is not final runtime proof:

- `bound`, `consequence`, and `permission` sometimes echo core vocabulary too
  directly and could become catchphrases;
- two replies explained why the character stopped more strongly than the
  neutral scene itself established;
- subtle overlap is desirable, but actual Persona v6 packets must preserve the
  distinction without turning either character into a schematic type.

After Character Core enters the structured Persona packet, repeat this test
with the actual local Luna adapter and natural Chapter 1 checkpoints. Human
playtests remain the authority on whether both voices feel credible and
interesting.


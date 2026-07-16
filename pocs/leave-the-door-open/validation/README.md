# Prompt-Protocol Validation

This directory preserves the experiments and live evidence for the highest-risk
claim in `initial-thoughts.md`:

> Can open conversation make a bounded physical action genuinely imaginable,
> so that its neutral world trace changes what another Persona can imagine?

Runs 001 and 002 are prompt and information-boundary experiments using
same-tier sub-agents. Run 003 adds a bounded live target-model feasibility
check with `gpt-5.6-luna`. Automated results can establish a working protocol
path and enforce authority boundaries, but cannot establish fun, ideal
strictness, difficulty, pacing, or discoverability; those require human
playtests under decision 0003.

The current primary plan is `mechanism-feasibility-plan.md`. The earlier
`live-eval-plan.md` and one-turn smoke artifacts remain diagnostic evidence,
not product-quality scores.

## Spec traceability

- Product thesis: `initial-thoughts.md` sections 1 and 15.
- Neutral Evidence and subjective Interpretation: sections 2.1 and 8.13.
- The central truth must not be Persona memory: section 2.2.
- Actions create traces that change the other character: section 2.3.
- Authored Actions and awareness/willingness gates: sections 5.2 through 5.5.
- Persona, Judge, and deterministic World responsibilities: section 9.

## Decision under experiment

The initial document suggests that a Persona may receive eligible Actions and
suggest Action awareness, after which a Judge decides awareness and
willingness. That gives two roles overlapping authority and may seed the
desired answer into the Persona prompt.

Run 001 tested a catalog-blind free-form proposal protocol:

```text
scripted player turn
  -> catalog-blind Persona
  -> free-form physical thought or null
  -> catalog-only semantic Matcher
  -> character-context Willingness Veto
  -> deterministic World effect
  -> neutral trace
  -> observation event
  -> catalog-blind second Persona
```

That protocol did not grant execution authority to the proposal, but it made a
free-form physical description look like a generated Action and forced a fuzzy
Matcher to decide whether near-enough behavior counted. This obscured the
authored-catalog invariant in `initial-thoughts.md` section 5.2 and created
unnecessary micro-actions.

Starting with v3, the experiment preserves this stricter invariant:

> Every executable Action and ActionVariant is authored in advance. No LLM can
> propose, create, or execute a new one.

The historical v3 feasibility protocol is:

```text
scripted player turn
  -> catalog-blind Persona reply and MindState patch
  -> Action Judge awareness phase with hard-eligible authored Actions
  -> fixed authored Action card or no card
  -> player selects surfaced card
  -> Action Judge willingness phase with authored variants
  -> deterministic World effect
  -> neutral trace and later observation
```

The Action Judge's awareness phase must cite the Persona's own reply or
MindState movement. A player mention is never sufficient evidence. The Judge
may change only the awareness or willingness state of an ID supplied by the
engine.

ADR 0017 supersedes Persona-authored patches in the integrated v7/v4 protocol:

```text
player turn
  -> catalog-blind Persona v7 reply only
  -> action-blind Judge transitions supplied authored psychological atoms
  -> Controller validates and persists finite forward transitions
  -> Action Judge awareness with hard-eligible authored Actions
  -> player selects a surfaced card
  -> Action Judge willingness with authored variants
  -> deterministic World effect
```

The transition phase receives no Action catalog or preferred result. It may
move only supplied belief, reframe, and pressure IDs through their authored
statuses, grounded in the Persona's own reply. Useful changes outside the
catalog may be noted for observers but have no gameplay authority.

## Authority and information boundaries

### Persona

Receives only its surface card, present emotional invariants, observed facts,
the paused moment, and its own conversation. It does not receive:

- the central backstory;
- an Action Catalog, Action IDs, or preferred result;
- another Persona's thoughts or dialogue;
- future beats or effects.

Historical v3 may reply and propose a bounded MindState patch. Current Persona
v7 returns only reply text, conversation closure, and grounding. It cannot
return an Action ID, Action proposal, durable psychological change, or world
alteration.

### Action Judge

The current Judge first receives only conversation, Persona reply, observed
Evidence, moment, and the current authored psychological atoms. After the
Controller validates that transition result, awareness receives the validated
state plus only Actions satisfying hard World prerequisites and may mark a
supplied Action `latent`, `faintly_imagined`, or `surfaced`. After the player
selects a surfaced card, willingness may accept, choose an authored smaller
variant, defer, or refuse. No phase may create an ID, treat the player's words
as character ownership, or invent an effect.

### World operator

Is deterministic. Only it applies an accepted authored variant, creates
Evidence, and later creates an observation event. The observing Persona gets a
state-only neutral Evidence description, never the actor's dialogue, intention,
action provenance, or private reason. Prefer `The door is slightly open` over
`The door has been left open`, because the latter implies an agentive act.

## Competing protocols retained as controls

1. **No Judge:** Persona sees eligible cards and chooses one. This is the
   simplest implementation, but success may be prompt seeding.
2. **Persona plus Judge from the initial document:** both receive candidate
   Actions. This preserves the proposed design but duplicates awareness
   authority.
3. **Catalog-blind proposal plus Matcher and Veto:** rejected after Run 001;
   free-form proposals blurred the authored Action boundary.
4. **Player proposal plus Persona veto:** challenges whether spontaneous
   awareness is needed at all; it may feel like guessing an Action.
5. **Deterministic action control:** dialogue never controls the Action. This
   gives an upper-bound test of whether the trace-mediated loop is legible even
   when progression is guaranteed.
6. **Catalog-blind Persona plus fixed-catalog Awareness and Willingness
   phases of one Action Judge:** the v3 main experiment. Only authored IDs can
   change state.

All protocols share a premise that should remain open to challenge: the
emotional value comes from indirect world mediation rather than merely from
good Persona dialogue or authored sequencing.

## Evaluation order

1. Prove deterministic World, catalog, observation, and authority contracts
   without model calls.
2. Use authored unowned/owned packets to establish that a Judge decision region
   exists independently of Persona generation.
3. Reuse saved Persona states when the Judge alone is under test.
4. For Persona reachability, generate candidate strategies offline and live-test
   only selected catalog-blind paths under an explicit search and spend budget.
5. Treat a found path as `reachable`, budget exhaustion as `inconclusive`, and
   hard boundary violations as `invalid`.
6. Freeze prompt versions before comparative or holdout runs.
7. Conduct human playtests before defining acceptable strictness, difficulty,
   turn counts, pacing, or discoverability.

For manual collaboration runs, preserve exact Persona replies, supplied and
validated MindState atoms, all three Judge-phase outputs, and all
decision-relevant packets. Automated
target-model runs must preserve complete raw inputs and outputs. A narrative
summary without packets is not evidence.

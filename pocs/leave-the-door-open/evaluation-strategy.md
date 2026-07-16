# Evaluation Strategy

## Why this needs more than one kind of evaluation

The game depends on a causal chain across generated psychology and deterministic
world behavior. A single end-to-end score cannot explain why a run failed. The
Persona may not have reached a useful state, the Judge may have classified a
good state too strictly, the supplied Action may have had the wrong semantics,
or the deterministic World may have violated an observation gate.

Evaluation is therefore divided by authority boundary. Each layer makes a
different claim and must not borrow evidence from another.

## Layer 1: deterministic contracts

Ordinary automated tests prove facts that do not require aesthetic or semantic
judgment:

- only fixed PlayerCommands enter GameController;
- only hard-eligible authored Action IDs may be committed;
- routines, intentions, effects, Evidence, and observations occur at their
  authored decision points;
- unobserved Evidence cannot change another Persona's eligible Actions;
- unknown IDs and invalid state transitions are rejected without mutation;
- projectors and renderers do not expose private state or internal IDs;
- renderer functions do not mutate simulation or interaction state;
- paid model calls stop at a configured hard call boundary.

These are binary engineering gates.

## Layer 2A: Judge feasibility

Judge feasibility is tested independently of Persona generation. Each fixed
Action receives at least two authored, internally coherent packets:

- **unowned control:** the Persona rejects or distances itself from the
  behavior; this packet must not enter the progress region;
- **owned answer state:** the Persona expresses a grounded, first-person,
  concrete possibility and present willingness; this packet must have some
  route through surfaced awareness to an accepted supplied variant.

The goal is not to force every model to draw exactly the same boundary among
`latent`, `faintly_imagined`, `surfaced`, `defer`, and `accept`. The minimum
claim is that a meaningful boundary exists:

```text
clearly unowned state → no progression
clearly owned state   → surfaced and accepted authored variant
```

The Judge must cite only Persona-owned reply/MindState sources and may never
invent an Action or variant ID.

## Layer 2B: Persona reachability

Let `s` be the current visible conversation and bounded MindState, and `u` a
player utterance. A Persona call behaves like a stochastic transition:

```text
T(s, u) → s'
```

The frozen Judge provides a goal predicate for a fixed Action:

```text
J(s', action) → surfaced/accepted or not
```

Reachability asks whether there exists some sequence of player utterances:

```text
A → B → C → … → S
```

where `S` is any grounded Persona state that the Judge can surface and accept.
There is no requirement that `A → S` happen in one turn, and no automated turn
count is currently declared acceptable gameplay.

Natural-language reachability is an open search space. A finite search can
produce a positive witness but cannot prove non-reachability. Results therefore
use three statuses:

- `reachable`: at least one complete witness trajectory was found;
- `inconclusive`: no witness was found inside this search budget;
- `invalid`: a hard information, authority, schema, or ID boundary was broken.

Search depth, branching, token usage, intermediate states, and turns-to-witness
are preserved as diagnostic evidence. They are not interpreted as fun, ideal
difficulty, or acceptable pacing.

## Candidate-path generation versus live verification

Expanding every conversational branch with a paid model is both expensive and
conceptually misleading. The current cost discipline is:

1. use human reasoning or non-API sub-agents to generate candidate dialogue
   strategies;
2. keep the Persona catalog-blind in every simulated or live packet;
3. verify only a small number of selected linear paths with the target model;
4. label target-aware search as `oracle-assisted` so it is not confused with
   human discoverability;
5. preserve the exact live path when a witness is found.

An oracle-assisted witness proves controllability: the model can be guided into
the region. It does not prove that an ordinary player will discover the route.

## Saved-state replay

Persona generation and Judge classification are separate experimental
variables. Once a Persona output has been paid for and saved, the exact reply
and MindState can be replayed into different Judge configurations without
regenerating the Persona.

Replay is valid for Judge feasibility because the input state is the object
under test. It is not a replacement for a fresh end-to-end Persona trajectory
when reachability itself is under test.

Every replay records:

- the source result file, fixture, and role;
- the exact Persona packet;
- the corrected fixed Action definition;
- every Judge request and raw/parsed response;
- model, reasoning effort, latency, usage, and call budget.

## Why a model evaluator is not the default gate

A third LLM evaluator adds cost and can introduce another semantic failure. In
the first live smoke it incorrectly interpreted `intention_created=true` as a
World effect that required downstream observation.

The default feasibility gate is therefore deterministic wherever possible:

- exact Action and variant membership;
- awareness before willingness;
- decision/variant consistency;
- source-ID membership;
- schema validity;
- call budget;
- raw-packet preservation.

Human inspection can assess the small number of semantic witness packets. A
model evaluator remains optional for explicitly defined semantic rubrics, but
its verdict is evidence to inspect, not an unquestioned source of truth.

## Cost discipline

Naive branching grows rapidly because every node can require a Persona call, an
awareness call, and sometimes willingness. Live experiments therefore follow
these rules:

- run local tests and same-tier simulations before any paid call;
- reuse saved Persona states when testing only the Judge;
- use Luna low first and escalate effort only if the lower setting does not
  produce the required witness;
- do not call a model evaluator when deterministic checks answer the question;
- enforce a maximum call count before the paid adapter is invoked;
- stop immediately when the existence witness has been found;
- preserve raw results so the same evidence can be reinterpreted without
  paying to regenerate it.

The Run 003 Wife replay stopped after Luna low succeeded in exactly two Judge
calls. Medium was not called.

## Layer 3: human playtest

Only a human playtest may answer:

- Is the Judge boundary too loose or strict?
- Can a player understand their role without seeing the hidden Action?
- Does resistance feel like character agency or chatbot obstruction?
- Do intermediate states feel like meaningful movement?
- Is a successful path discoverable rather than merely possible?
- Does an Action feel earned when it appears?
- Are conversation length, daily limits, and pacing satisfying?
- Does the resulting World trace feel surprising, legible, and emotionally
  credible?

Turns-to-success and success rates may become product gates only after human
playtests establish what ranges correspond to the intended experience.

### Tutorial success is not long-term pacing

The first playable slice has a different job from the later game. It must teach
the success grammar by letting an uninformed player discover and witness at
least one full loop:

```text
conversation
→ surfaced numbered Possibility
→ selected intention
→ resumed authored behavior
→ visible world difference
```

This does not imply that every day or pause in the full game should produce
substantive psychological progress. Later movement may accumulate across many
days, conversations, routine observations, and partial reframes. A day with no
new intention can be valid; repeated dialogue with no new information or clue
is still a quality failure.

Routine behavior is part of discoverability even when it creates no Evidence.
Playtests should separately record whether the player notices a routine or
moment cue, uses it in conversation, misreads it, or receives no useful clue.
The first tutorial may be intentionally more legible and compressed than the
long-term pacing model.

## Evidence hierarchy

From narrowest to strongest claim:

1. **Unit/acceptance test:** a deterministic contract holds.
2. **Authored Judge probe:** a classification region exists.
3. **Saved-state live replay:** the target Judge accepts a previously generated
   Persona state.
4. **Live witness trajectory:** the target Persona and Judge complete at least
   one catalog-blind path.
5. **Human playtest:** the path is understandable and feels appropriate.
6. **Repeated playtests:** the experience is robust across people and play
   styles.

No lower level should be cited as proof of a higher one.

## Current evidence and next evaluation

Run 003 provides a saved-state live replay witness for the Wife's
`remain_at_threshold` transition on `gpt-5.6-luna` with low reasoning. It proves
mechanical feasibility for that transition, not human discoverability.

The next meaningful evaluation is a human-playable text vertical slice. It
should log exact conversation trajectories and Judge decisions while keeping
the render layer independent and the paid-call budget visible. Its first goal
is observation, not optimization: learn what players try, where they feel
movement, and what they believe caused the Action to appear.

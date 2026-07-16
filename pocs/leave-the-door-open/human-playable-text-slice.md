# Human-Playable Text Slice Specification

Status: Accepted implementation scope

## Purpose

Replace the deterministic slice's debug-only Action selection with the minimum
renderer-independent conversation loop needed for a human-playable text
prototype. This phase connects catalog-blind Persona and fixed-catalog Action
Judge ports to the existing Game Controller without connecting a paid model or
building the terminal adapter yet.

The player-visible causal path for this phase is:

```text
paused selected character
→ player dialogue
→ Persona reply and bounded MindState update
→ awareness judgment over hard-eligible authored Actions
→ surfaced neutral Action option
→ player selects the option
→ willingness judgment over authored variants
→ accepted intention in the deterministic World
```

## Requirements

- **LDO-HPT-001 — Catalog-blind Persona turn:** A dialogue command is accepted
  only while the World is paused and an NPC is selected. The Persona port
  receives that NPC's visible paused moment, observed neutral Evidence,
  conversation history, and private bounded MindState. It receives no Action
  IDs, variants, Action descriptions, Judge result, future effect, or preferred
  outcome.
- **LDO-HPT-002 — Controller-owned awareness:** After a Persona reply, the Game
  Controller asks the deterministic World for hard-eligible Action IDs and
  gives only their authored Judge-facing definitions plus the Persona-owned
  state to the Action Judge. Only a supplied Action classified `surfaced` may
  become a neutral player-facing option.
- **LDO-HPT-003 — Willingness before intention:** Selecting a surfaced option
  asks the Action Judge for willingness. The Controller commits an intention
  only when the decision is `accept` or `smaller_step` and the selected variant
  belongs to the supplied authored Action. A deferred, refused, unknown, or
  malformed result creates no intention.
- **LDO-HPT-004 — Safe semantic UI state:** The Controller snapshot and
  `UIView` expose conversation messages, `idle`/pending/error status, safe
  errors, and neutral Action options. They do not expose private MindState,
  Action IDs, variant IDs, Judge reasoning, raw service errors, or future
  effects.
- **LDO-HPT-005 — One semantic owner:** The Game Controller owns phase order,
  pending-state exclusion, output validation, conversation persistence, and
  World commitment. Persona and Judge ports cannot mutate the World or UI
  state. Renderers and input adapters remain passive adapters.
- **LDO-HPT-006 — Explicit debug separation:** The existing deterministic debug
  factory may continue to expose hard-eligible Actions directly for headless
  World tests. The conversation factory never surfaces an Action before an
  awareness result and never bypasses willingness.

## First acceptance boundary

The first controller-level acceptance test covers the husband-side path from a
paused dialogue turn through a surfaced option and accepted intention using
deterministic port fakes. A second acceptance test completes both Actions and
checks that the Wife's Persona receives the neutral door Evidence only after
physical observation. Fakes return authored structured packets; they do not
parse player language, route keywords, or imitate a model.

Follow-up tests cover catalog blindness, invalid Judge output, pending/error
state, safe projection, and text rendering before a live adapter is connected.

## Phase boundary and non-goals

This phase ends when the renderer-independent conversation path and safe text
UI state pass local tests and the repository test/build gates are green.

This phase does not implement:

- a terminal, browser, 2D, or 3D input adapter;
- OpenAI network calls or prompt construction;
- API spend accounting beyond the already tested call-budget component;
- conversation quotas, day rollover, save/load, or the remaining story beats;
- natural-language parsing, keyword routing, preset strategies, or a mock LLM;
- human-experience thresholds such as ideal turns, strictness, or difficulty.

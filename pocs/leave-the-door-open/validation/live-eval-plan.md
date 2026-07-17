# GPT-5.6 Luna Live Validation Plan

Status: Superseded as the primary feasibility score

Superseded by `mechanism-feasibility-plan.md` and decision 0003. The one-turn
smoke fixtures and saved results remain diagnostic evidence, but they conflate
Judge feasibility with Persona reachability and do not evaluate game experience.

## Purpose

Replace the same-tier sub-agent evidence in Run 002 with repeatable calls to the
actual target model. This phase validates only the v3 Persona/Action Judge
protocol around the first trace-mediated loop. It is not an end-to-end proof of
the six-beat game.

## Configurations

- model: `gpt-5.6-luna`
- reasoning efforts: `low`, then `medium`
- repetitions: one per fixture for the initial smoke run
- API: Responses API with Structured Outputs
- context: a fresh response for every Persona, awareness, willingness, and
  evaluator call
- evaluator: v4, which distinguishes intention creation from later World
  execution and cross-Persona Evidence observation

The model and reasoning effort are explicit run metadata. The runner loads
`OPENAI_API_KEY` from the repository-root `.env.local` and never persists it.

## Smoke fixtures

1. `h-reversible-v1`: V1 reversible reframe; `action_1` should surface and
   willingness should select authored `variant_1a`.
2. `h-command-d1`: direct command; `action_1` must not surface.
3. `h-keywords-k1`: keyword pile; `action_1` must not surface.
4. `h-secret-s1`: protected-backstory attack; the reply must not confirm or
   invent the secret, and `action_1` must not surface.
5. `w-unobserved-i0`: no observed door trace; the engine supplies no Action,
   so neither Judge phase may run.
6. `w-observed-i2`: neutral door Evidence was physically observed;
   `action_2` should surface and willingness should select authored
   `variant_2a`.

## Requirements

- **LDO-LIVE-001 — Information boundary:** Persona calls receive no Action
  Catalog or Action IDs. Awareness receives only hard-eligible authored
  Actions. W0 invokes no Judge because `action_2` is hard-ineligible.
- **LDO-LIVE-002 — Fixed authority:** Judge outputs may reference only supplied
  Action and variant IDs. Only a surfaced Action may enter willingness.
- **LDO-LIVE-003 — Deterministic verdict:** The runner combines fixture
  expectations, ID-membership checks, and a fresh evaluator result. Any hard
  failure, unknown ID, wrong awareness class, invalid progression, or evaluator
  failure fails the fixture.
- **LDO-LIVE-004 — Evidence preservation:** Every result records exact prompts,
  user packets, raw model output items, parsed output, latency, usage, model,
  effort, fixture ID, and repetition. It never records the API key.
- **LDO-LIVE-005 — Honest scope:** A one-repetition smoke run may establish
  basic feasibility and expose failure modes. It cannot satisfy the five-run
  statistical gates in `fixtures.md` or prove complete-game playability.

## Phase boundary

Stop after low and medium each complete one repetition of the six smoke
fixtures and their result files are summarized. Do not tune prompts between the
two configurations. Prompt changes, five-run validation, a generative player,
and full-game beats are separate phases.

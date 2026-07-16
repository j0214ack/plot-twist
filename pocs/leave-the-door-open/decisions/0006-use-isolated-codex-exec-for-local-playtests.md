# 0006: Use Isolated Codex Exec for Local Playtests

Status: Accepted

Date: 2026-07-16

## Context

The first terminal-play proposal carried the paid-evaluation call budget into
human play. That mixed two concerns: an eval needs a hard spend boundary, while
a playtest needs enough conversational freedom to observe how a person
actually searches through intermediate psychological states.

The local machine already has a ChatGPT-authenticated Codex CLI. Codex supports
non-interactive `codex exec`, ephemeral runs, JSONL events, and a final JSON
Schema. However, an ordinary Codex agent launched inside this repository could
inspect the Action Catalog and hidden story material, violating the Persona's
information boundary.

## Options considered

1. **Use the Responses API with a hard call cap.** Closest to a production
   adapter and easiest to account for, but makes an arbitrary technical budget
   interrupt early human exploration and directly bills the API key.
2. **Run `codex exec` inside the repository.** Reuses ChatGPT plan usage, but a
   tool-capable Persona can inspect source-of-truth files and leak the answer.
3. **Run isolated, tool-disabled `codex exec` roles.** Accepted for local
   playtests. Each role receives only an explicit packet in an empty temporary
   directory and returns schema-constrained output.
4. **Use deterministic fakes for the playable terminal.** Useful for acceptance
   tests, but cannot test whether human dialogue changes model psychology.

All model-backed options consume some limited resource. The decision separates
"no direct API invoice" from "unlimited usage": ChatGPT-authenticated Codex is
still subject to plan limits and credits.

## Decision

1. `npm run play:ldo` uses saved ChatGPT Codex authentication by default and
   never loads the repository `.env.local`.
2. Each role call uses a fresh `codex exec --ephemeral` process in an empty
   temporary directory with `--output-schema` and JSONL output.
3. User/project config and execpolicy rules are ignored for the role process.
   Shell, apps, hooks, goals, multi-agent, remote plugins, and web access are
   explicitly disabled. The sandbox remains read-only.
4. The Persona process receives no authored Action data. The Judge receives
   only the World-filtered definitions supplied for its current phase.
5. Local play has no hard call budget. Usage is diagnostic telemetry. A plan
   rate-limit failure becomes a safe UI error, not a game-design outcome.
6. Paid Responses API validation remains separate and keeps explicit budgets
   under decision 0004.
7. Deterministic fake-process and fake-port tests prove command construction,
   information boundaries, phase routing, and the terminal game loop without
   consuming Codex usage.

## Consequences

- A developer can play through the real generative mechanism without API-key
  billing or an arbitrary conversation cutoff.
- Local play consumes Codex/ChatGPT plan usage and may be slower than direct
  model calls because every role starts a headless agent process.
- Disabling tools and using an empty working directory keeps Persona inputs
  aligned with the catalog-blind contract.
- This adapter is intentionally local-only; a production game should use a
  purpose-built model service rather than requiring Codex CLI.
- Provider cost and gameplay conversation limits remain separate decisions.

## Supersedes

No accepted decision is superseded. This narrows decision 0004 to paid model
validation and supplies the local adapter anticipated by decision 0005.


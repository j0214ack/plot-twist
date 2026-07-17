# 0019: Use Isolated Codex for Local Browser Play

Status: Accepted

Date: 2026-07-16

## Context

ADR 0006 lets a local terminal playtest use the developer's saved Codex login
without loading the repository API key. ADR 0018 added a thin browser renderer,
but its first server composition supported only the production-style OpenAI API
backend. A teammate cloning the repository could therefore use their own Codex
login in the terminal but not in the local HTML surface.

The browser must not receive a Codex token, invoke a local agent directly, or
gain gameplay authority. Fly production must continue to use its server-side
`OPENAI_API_KEY` rather than requiring a Codex installation or interactive
account.

## Options considered

1. **Keep the current split.** Add clearer script names, but require an API key
   for all HTML play. This has no implementation cost but makes the two local
   renderers exercise different model-access contracts and prevents a teammate
   with only a Codex login from trying the HTML version.
2. **Call Codex from browser JavaScript.** This appears direct but would expose
   credentials or privileged local execution to an untrusted renderer and
   reverse ADR 0018's server-only model boundary. Rejected.
3. **Add a separate local Codex proxy or daemon.** This could isolate the
   provider but would duplicate the existing Vite session server, introduce a
   second process and protocol, and solve no current scaling requirement.
   Rejected.
4. **Select the existing isolated Codex adapter inside the local Vite server.**
   Accepted. The server continues to own the real session and injects a
   `StructuredRoleModel`; only its explicitly selected local provider changes.

All options assume the teammate has a usable model entitlement. For the
accepted local-Codex path, they must install Codex CLI and authenticate their
own machine. Repository sharing never shares credentials or plan usage.

## Decision

1. Add explicit `play:ldo:text` and `play:ldo:web` commands. Keep `play:ldo` as
   a backward-compatible alias for the text surface.
2. `play:ldo:web` starts the existing Vite development server in an explicit
   local-Codex mode, opens `/leave-the-door-open/` as its initial browser page,
   and serves that canonical route on the fixed local origin. It fails clearly
   if that port is already occupied instead of moving to an origin that the
   anonymous-session boundary will reject. The command must not lead a player
   to the root Unwritten Spell page.
3. In that mode only, the Vite server injects
   `CodexExecStructuredRoleModel(LocalCodexExecClient)` into the existing web
   session factory. Every role retains ADR 0006's ephemeral, tool-disabled,
   empty-directory isolation and strips API credentials from subprocesses.
4. Browser code still receives only the player-safe screen and sends ordinary
   player input. It never receives Codex auth, an API key, prompts, private
   state, or a model capability.
5. Normal development, preview, and Fly production default to the OpenAI API
   backend and retain ADR 0018's server-side key contract. Codex mode must be
   explicitly selected and is not a production fallback.
6. A missing or signed-out Codex CLI becomes the existing legible server error.
   The application does not inspect, copy, persist, or transmit Codex login
   files.
7. The explicit `ldo-local-codex` mode does not require or prompt for the
   public demo access code, even when a root `.env.local` defines one for Fly or
   production-style preview. It retains anonymous same-origin session handling;
   the browser keeps the code form hidden while that anonymous session is being
   established and reveals it only if the server explicitly requires a code.
   Normal development, preview, and Fly access policy are unchanged.

## Consequences

- A teammate can clone the repository and play either renderer using their own
  local Codex authentication and their own plan usage.
- Text and HTML share World, Controller, prompts, role isolation, logging, and
  model behavior; only input/output presentation differs.
- Local HTML remains slower than a direct API integration because each role
  starts an isolated `codex exec` process.
- This adds a provider choice at an existing capability boundary, not a new
  browser authority, session protocol, daemon, or gameplay mechanism.

## Supersedes

This narrows ADR 0018 Decision 4 only for an explicitly selected local
development mode. Public preview and Fly deployment continue to use the
server-side OpenAI API backend exactly as ADR 0018 specifies. ADR 0006's role
isolation and credential rules are reused without change.

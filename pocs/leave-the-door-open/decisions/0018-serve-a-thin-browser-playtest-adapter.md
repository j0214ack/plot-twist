# 0018: Serve a Thin Browser Playtest Adapter

Status: Accepted

Date: 2026-07-16

## Context

The terminal adapter has been useful for developer and Agent playtests, but it
is not a practical surface for inviting friends to play Chapter 1. The existing
Fly.io deployment already serves The Unwritten Spell at its root path. A new
Leave the Door Open surface therefore needs to coexist on a separate path
without replacing that demo or moving gameplay authority into browser code.

This request expands the presentation and deployment boundary only. It does not
turn the current PoC into a production service, settle long-term authentication
or persistence, or change Chapter 1's authored causal graph.

## Decision

1. **LDO-WEB-001 — Separate route.** The existing Fly.io app serves a minimal
   Leave the Door Open page at `/leave-the-door-open/`; the root Unwritten Spell
   page and its API remain intact.
2. **LDO-WEB-002 — Thin browser renderer.** Browser code renders the latest
   player-safe text screen, busy/error state, conversation input, focus
   controls, numbered Possibilities, resume, and help. It does not recreate
   World schedules, Action eligibility, conversation rules, or outcome logic.
3. **LDO-WEB-003 — Real session authority.** A server-owned playtest session
   wraps the same `TerminalPlaySession` and conversational
   `VerticalSliceGameController` used by local play. Browser input is forwarded
   as terminal/player input; the returned screen is captured from the existing
   independent text projection.
4. **LDO-WEB-004 — Server-only model access.** The browser never receives an
   OpenAI key. Public preview uses the Fly app's existing server-side
   `OPENAI_API_KEY` secret and the repository's structured Persona/Judge and
   Performance Director adapters. Model and effort remain environment-selected.
   Local preview without that server configuration returns a legible service
   error rather than embedding credentials or replacing the model with browser
   logic.
5. **LDO-WEB-005 — Ephemeral friend-playtest sessions.** Sessions are isolated
   by opaque IDs, serialize inputs, expire after bounded inactivity, and live
   only in the current Fly process. A restart or scale-down may end a playtest;
   durable saves and multi-machine coordination are explicitly deferred.
6. **LDO-WEB-006 — Narrow public boundary.** Request bodies and input lengths
   are bounded. The existing demo-access middleware protects the new play API
   when the shared demo is access-gated; friends never send server credentials.
7. **LDO-WEB-007 — Acceptance evidence.** Automated tests prove that a new web
   session starts the real play surface and that submitted input advances that
   same session. Browser acceptance then verifies that the deployed page can
   start, submit text, focus, resume/help, and display the returned screen.
8. **LDO-WEB-008 — Canonical page routing.** Requests for the convenient
   no-trailing-slash path `/leave-the-door-open` redirect to the canonical
   `/leave-the-door-open/` page in development and preview. They must never fall
   through to the root Unwritten Spell HTML.

## Consequences

- Friends can play through an ordinary link while the original demo remains at
  the Fly root.
- The HTML surface may look deliberately plain because it is a renderer and
  input adapter, not a second game implementation.
- Server memory and one running process are acceptable for this playtest spike;
  losing a session on restart is an explicit limitation shown in the UI.
- Model latency is visible as a busy state and concurrent submissions for one
  session are serialized.

## Supersedes

This supersedes only the browser/deployment non-goals in `chapter-1.md` and
`local-playtest.md` for this thin friend-playtest adapter. Their simulation,
privacy, catalog-blindness, pacing, and validation boundaries remain accepted.
ADR 0002's layered projection and renderer authority bans remain unchanged.

## Deferred

- accounts, permanent saves, analytics dashboards, moderation, and production
  availability guarantees;
- a visual 2D/3D world, animation system, or browser-owned game loop;
- sharing one session between multiple people or resuming across deployments;
- changing Chapter 1 content, Action definitions, psychology, or difficulty.

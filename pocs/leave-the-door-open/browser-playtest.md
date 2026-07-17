# Browser Friend Playtest

The thin HTML renderer is served alongside The Unwritten Spell at:

```text
https://plot-twist-unwritten-spell.fly.dev/leave-the-door-open/
```

It uses the same shared access code as the existing Fly demo. The browser never
receives an OpenAI credential. After access is established, it starts an
server-owned `TerminalPlaySession` and forwards text, focus,
Possibility numbers, resume, and help input to that session.

Progress is bound to one browser profile by a separate signed, HttpOnly player
cookie. Opening or refreshing the page resumes that browser's save in the
selected locale. `重新開始` / `Start over` is the only operation that deletes
that locale's checkpoint and begins again. The shared access code still gates
the demo; it is not a player identity or save-recovery code.

## Local preview

For the current latency playtest, put a valid `OPENAI_API_KEY` in the
repository-root `.env.local`, then start the HTML surface:

```bash
npm run play:ldo:web
```

Then open:

```text
http://127.0.0.1:5173/leave-the-door-open/
```

The Vite server—not browser JavaScript—uses the key to call
`gpt-5.6-luna` with `low` reasoning. This local mode bypasses the public demo
access-code prompt even when root `.env.local` contains `DEMO_ACCESS_CODE`.
The key remains server-only.

Local checkpoints and raw observer journals are written under
`pocs/leave-the-door-open/playtest-data/web/`, which is ignored by Git. The
development console prints compact event summaries instead of complete
screens, prompts, and cumulative Controller snapshots. Removing that local
directory or clearing the browser's `ldo_player` cookie deliberately severs the
local save association.

To use the previous isolated Codex backend instead, authenticate Codex CLI and
run its explicit alternate command:

```bash
codex login
codex login status
npm run play:ldo:web:codex
```

That alternate path uses the teammate's local Codex login and plan allowance
and does not require `OPENAI_API_KEY`.

For a production-style local preview of the Fly composition instead, build and
run the preview server with the existing server environment:

```bash
npm run build
npm run start
```

Then open `http://localhost:8080/leave-the-door-open/`. This production-style
path expects `OPENAI_API_KEY`, `DEMO_SESSION_SECRET`, and the same
`ALLOWED_ORIGIN`/optional `DEMO_ACCESS_CODE` contract as the root demo.

The direct local HTML command pins these settings; explicit environment
overrides remain available for diagnostic runs:

```text
LDO_PLAY_MODEL=gpt-5.6-luna
LDO_PLAY_EFFORT=low
LDO_PLAY_DISABLE_GENERATED_PERFORMANCE=1  # optional authored fallback
```

## Persistence and deliberate limitations

- Inactive runtime handles still leave memory after 30 minutes, but the next
  page start restores the durable checkpoint with a new opaque runtime session.
- Fly uses one persistent Volume and one application machine. Deployment,
  restart, and scale-to-zero preserve progress as long as that Volume remains
  attached.
- Saves are browser-profile- and locale-scoped. Clearing cookies, using private
  browsing, another browser/profile, or another device creates a new player.
  Accounts, recovery codes, export/import, and cross-device continuation are
  intentionally deferred.
- This is a text renderer and input adapter; the World, Controller, fixed
  Actions, Persona/Judge calls, performance, and safe projection remain on the
  server.
- Friend-playtest events and model calls are appended as per-runtime-session
  JSONL journals on the same private data root. Journals are diagnostic
  evidence, not event sourcing and not a player-facing API.
- Both local HTML profiles are development-only. Fly never falls back to a
  local Codex installation.

# Browser Friend Playtest

The thin HTML renderer is served alongside The Unwritten Spell at:

```text
https://plot-twist-unwritten-spell.fly.dev/leave-the-door-open/
```

It uses the same shared access code as the existing Fly demo. The browser never
receives an OpenAI credential. After access is established, it starts an
ephemeral server-owned `TerminalPlaySession` and forwards text, focus,
Possibility numbers, resume, and help input to that session.

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

## Deliberate limitations

- Sessions live in one Fly process and expire after 30 minutes of inactivity.
- A deployment, machine restart, or scale-down may require starting again.
- This is a text renderer and input adapter; the World, Controller, fixed
  Actions, Persona/Judge calls, performance, and safe projection remain on the
  server.
- Friend-playtest events and model calls are written as structured JSON lines
  to the Fly application log; durable remote playtest storage is not included.
- Both local HTML profiles are development-only. Fly never falls back to a
  local Codex installation.

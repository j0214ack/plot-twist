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

For ordinary local play, install and authenticate Codex CLI on this machine,
then start the HTML surface with the explicit local-Codex command:

```bash
codex login
codex login status
npm run play:ldo:web
```

Then open:

```text
http://127.0.0.1:5173/leave-the-door-open/
```

This mode needs no repository `OPENAI_API_KEY`. The Vite server—not browser
JavaScript—uses the same isolated, ephemeral, tool-disabled `codex exec` role
adapter as the terminal playtest. Each teammate therefore uses their own local
Codex login and plan allowance; repository sharing never shares credentials.

For a production-style local preview of the Fly composition instead, build and
run the preview server with the existing server environment:

```bash
npm run build
npm run start
```

Then open `http://localhost:8080/leave-the-door-open/`. This production-style
path expects `OPENAI_API_KEY`, `DEMO_SESSION_SECRET`, and the same
`ALLOWED_ORIGIN`/optional `DEMO_ACCESS_CODE` contract as the root demo.

Both local model backends retain the terminal model settings:

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
- Local-Codex HTML play is development-only and incurs the same per-role
  subprocess latency as terminal play. Fly never falls back to a local Codex
  installation.

# 0036: Persist Browser-Scoped Player Checkpoints and Observer Journals

Status: Accepted

Date: 2026-07-17

## Context

The friend-playtest server currently keeps every game session only in one
process. Refreshing the page starts another game, a Fly restart or scale-down
loses progress, and Web observer events are printed only to the terminal. A
single time advance also prints a complete cumulative Controller snapshot for
every tick; one ordinary local run produced hundreds of lines and exhausted
the terminal capture before the Persona and Judge records could be inspected.

ADR 0018 deliberately accepted ephemeral sessions and deferred durable saves.
ADR 0026 likewise deferred transcript/save restoration. Human playtesting now
requires the opposite: one player must be able to leave, refresh, or cross a
deployment without silently returning to the tutorial, and a strange result
must leave durable diagnostic evidence.

The shared access code is authorization, not player identity. Adding accounts
would solve a different and substantially larger problem. For this PoC, a
"player" means one browser profile that retains its first-party cookies.

## Pattern definitions

- A **browser-scoped player identity** is a server-signed opaque ID stored in an
  HttpOnly first-party cookie. It identifies a save slot but grants no access
  by itself; the short-lived demo-access session remains a separate gate.
- A **checkpoint** is a versioned complete snapshot of the deterministic World,
  Controller-owned conversational state, terminal adapter state, and current
  safe screen at a quiescent operation boundary. It is not a public GameView
  and never reaches the renderer.
- An **observer journal** remains the append-only evidence adapter from ADR
  0007. It diagnoses play but is not replayed to rebuild gameplay state.

## Options considered

1. **Keep only terminal logs and process-memory sessions.** This is the fewest
   moving parts, but it has already lost both progress and the evidence needed
   to diagnose progress. It does not meet the playtest requirement.
2. **Store GameState or command history in browser local storage.** Refresh is
   easy, but the browser would gain private Controller/MindState authority and
   could tamper with the save. It also would not give the server a durable
   observer record. Rejected.
3. **Replay every player command and recorded model result from an event
   journal.** This could rebuild the game, but it turns observation into runtime
   correctness, couples old saves to prompt/schema history, and reverses ADR
   0007's explicit non-event-sourcing boundary. Rejected.
4. **Persist versioned server checkpoints plus separate append-only journals on
   a Fly Volume.** Accepted. The current deployment is deliberately one Fly
   machine, so an atomic filesystem store has fewer concepts than a database
   while still surviving refresh, stop/start, restart, and deployment.
5. **Introduce accounts or player-entered recovery codes backed by an external
   database.** This supports cross-device play, but adds account recovery,
   privacy, and multi-machine coordination that the PoC does not need.
   Deferred.

All persistence options assume that one browser profile is a sufficient player
boundary. If cross-device continuation becomes a real test requirement, that
assumption must be replaced explicitly rather than stretching the shared
access code into an identity system.

## Decision

1. **LDO-SAVE-001 — Separate stable identity.** Successful demo access issues
   or preserves a long-lived, opaque, signed, HttpOnly player cookie. The
   existing demo session remains short-lived and is still required before any
   play API. Tampered or missing player identity cannot read or mutate a save.
2. **LDO-SAVE-002 — One save per player and locale.** The server keys durable
   state by player identity plus immutable `en` or `zh-TW` locale. Locale links
   therefore remain independent playthroughs rather than rewriting an existing
   session's generated text.
3. **LDO-SAVE-003 — Server checkpoint authority.** The World, Controller,
   terminal adapter, and safe current screen expose explicit versioned
   checkpoint/restore capabilities. The browser receives only the existing
   opaque session ID and safe screen.
4. **LDO-SAVE-004 — Quiescent atomic commits.** After a completed stable
   operation, the service atomically replaces that player's checkpoint. A
   Persona response awaiting its post-Persona Judge and an in-progress time
   pull are journaled but do not replace the last quiescent checkpoint. A crash
   in that short window resumes the last complete operation rather than a
   half-owned psychological transition.
5. **LDO-SAVE-005 — Resume and reset are distinct.** Starting the page resumes
   the active or durable save. Starting a new game is an explicit reset and
   creates a new play session without reusing the old checkpoint.
6. **LDO-SAVE-006 — Session ownership.** Every input, dialogue-resolution, and
   advance request must carry the same verified player identity that owns the
   opaque session. Guessing or leaking a session ID is insufficient.
7. **LDO-SAVE-007 — Durable raw evidence, compact console.** Each server
   runtime session has its own append-only JSONL observer journal on the same
   durable data root. Raw screens, model boundaries, failures, and quiescent
   Controller outcomes remain exact. The development console prints only a
   compact event summary; it never substitutes for the journal.
8. **LDO-SAVE-008 — Bounded tick records.** A time-advance observer record
   stores the result and the state/event delta needed to diagnose that tick,
   not the complete cumulative event history and repeated full screen.
9. **LDO-SAVE-009 — Version and corruption boundary.** Checkpoint documents
   carry an explicit schema version and are validated before restoration.
   Unknown or malformed state fails closed for that save; it is never silently
   interpreted as a new game.
10. **LDO-SAVE-010 — One-machine PoC topology.** Local development uses an
    ignored repository data directory. Fly mounts one persistent Volume at the
    configured data root and continues to run one application machine. Atomic
    rename is the commit boundary; multi-machine writers are not supported.

## Consequences

- Refresh normally returns the same active session; process restart or deploy
  creates a new opaque runtime session over the saved gameplay checkpoint.
- Scale-to-zero no longer erases progress as long as the same Fly Volume is
  attached when the machine starts again.
- A browser that clears cookies, uses another profile/device, or enters private
  browsing is a new player. That limitation is intentional and visible in the
  architecture rather than hidden behind the shared access code.
- Restoring private state requires more explicit checkpoint data, but the
  capability remains inside World/Controller/application boundaries and can be
  regression-tested without a renderer.
- Raw journals can contain hidden story mechanisms and player text. They remain
  server-side ignored artifacts with no player API.

## Supersedes

- ADR 0018 LDO-WEB-005 and its deferred durable-save limitation.
- ADR 0026's deferred long-term transcript/save-restoration item only to the
  extent defined here. The browser still renders safe projection and does not
  own gameplay state.
- `browser-playtest.md` statements that a restart, scale-down, or deployment
  necessarily ends the playthrough and that remote evidence exists only in Fly
  application logs.

ADR 0007's recorder boundary is preserved: journals remain passive evidence,
not event sourcing. ADR 0002's World/Controller/renderer authority boundaries
remain unchanged.

## Deferred

- accounts, email, names, cross-device recovery, shared/multiplayer saves;
- an external database, multiple Fly application machines, conflict merging;
- exactly-once continuation through a model request interrupted mid-call;
- player-facing save-slot management, export/import, retention, deletion, and
  production privacy policy;
- reconstructing the complete browser-composited historical transcript after
  refresh. The restored current safe screen and gameplay state are required;
  transcript history remains available in the observer journal.

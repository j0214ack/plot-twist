# Observer Session Logging Specification

Status: Accepted implementation scope

## Purpose

Preserve exact local-play evidence while keeping an uninformed player isolated
from Persona MindState, Judge decisions, Action identifiers, and future state.
The log supports turn-by-turn qualitative observation; it never becomes a game
input or gameplay evaluator.

## Requirements

- **LDO-OBS-001 — Durable ordered journal:** A local playtest opens an
  append-only JSONL journal before the first screen. Every event contains
  `schemaVersion`, `sessionId`, monotonically increasing `sequence`, ISO
  timestamp, visibility, type, and data.
- **LDO-OBS-002 — Exact player boundary:** Every rendered terminal screen and
  every raw submitted player input is recorded with `player` visibility in the
  same order the player experiences them.
- **LDO-OBS-003 — Exact model boundary:** A passive StructuredRoleModel wrapper
  records each role request without its runtime schema object, then records the
  parsed result, latency, and token usage or the safe string form of a failure.
  It must not record environment variables or credentials.
- **LDO-OBS-004 — Controller outcome:** After every handled input, the runner
  records the resulting public Controller snapshot and whether the terminal
  slice ended. This record is observer-only and is never projected into either
  render layer.
- **LDO-OBS-005 — Fail closed and remain passive:** Journal creation or append
  failure aborts the playtest. Recording cannot dispatch a PlayerCommand, call
  a model, mutate Controller state, or alter rendered text.
- **LDO-OBS-006 — Qualitative assessment contract:** An observer assessment
  references an exact event sequence range and scores comprehension, response
  relevance, information gain, character agency, psychological movement, and
  causal legibility. It records notes and exactly one intervention decision:
  `continue`, `flag`, `pause_and_discuss`, or `stop`.
- **LDO-OBS-007 — Local artifact boundary:** Raw journals live under
  `pocs/leave-the-door-open/playtest-logs/`, are ignored by Git, and may contain
  observer-only mechanism data. Curated observation documents live separately
  under `playtests/`.
- **LDO-OBS-008 — Safe interaction failure diagnostic:** When the terminal
  converts an internal interaction failure into generic player-safe error text,
  it also reports the original error name and message to an observer-only
  callback. The local and browser recorders may journal that diagnostic, but it
  is never included in `GameView`, renderer text, or a player API response.
- **LDO-OBS-009 — Boundary-probe observation:** Curated assessment may label a
  player turn as an autonomy, mundane-continuity, social-possibility, direct-
  command, focus-switch, or post-persuasion probe. The label describes what the
  player was testing; it does not declare the input invalid or require a new
  Action. Assessment records whether the response preserved person-like
  recognition and canonical authority.
- **LDO-OBS-010 — Replay language:** The session-start observer record includes
  the immutable `en` or `zh-TW` locale. Replaying or comparing a journal must
  never silently substitute another player-facing language.

## Intervention policy for agent playtests

- `stop`: hidden-information leak, invented/invalid Action, authority breach,
  or unsafe runtime failure;
- `pause_and_discuss`: the UI makes the task unintelligible, or continuing
  would invalidate the intended black-box evaluation;
- `flag`: repeated non-incremental dialogue or another quality problem that is
  important but does not yet require contaminating the player's path;
- `continue`: ordinary resistance, an unproductive player strategy, slow
  movement, or ambiguity that remains legitimate playtest evidence.

The observer defaults to continuing. It must not coach the player agent toward
the hidden Action merely because progress is slow.

## Non-goals

- production analytics, remote upload, dashboards, or retention policy;
- replaying or reconstructing GameState from the log;
- automatically grading fun or choosing gameplay Actions;
- exposing observer records to a human or agent player;
- replacing curated qualitative playtest reports.

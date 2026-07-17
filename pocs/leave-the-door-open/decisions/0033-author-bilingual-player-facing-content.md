# 0033: Author Bilingual Player-Facing Content

Status: Accepted

Date: 2026-07-17

## Context

The current playable slice was authored and validated in English, but the
development team and hackathon judges primarily read Traditional Chinese. The
English version must remain playable. Translating every returned screen through
a runtime API would add latency, cost, nondeterminism, and another prose-changing
authority after the Controller has already produced safe presentation. It would
also make fixed authored lines less stable than the story data they represent.

The word **locale** in this record means the session's chosen player-facing
language, initially `en` or `zh-TW`. It does not change World semantics,
eligibility, psychology, disclosure, or story outcome.

## Options considered

1. **Keep English only.** This has no implementation cost but makes the actual
   team and judging audience work through a language barrier. Rejected.
2. **Translate every output at runtime.** This preserves one English source but
   adds a model/API call after fixed narration and generated performance, can
   drift terminology and voice, and makes ordinary time advancement slower.
   Rejected.
3. **Make all source material, prompts, IDs, and documentation bilingual.** This
   duplicates internal material that players never see and creates two semantic
   sources of truth. Rejected.
4. **Author player-facing fixed copy in both locales and ask generative roles to
   perform directly in the session locale.** Accepted. Semantic IDs remain
   language-neutral; each presentation adapter selects authored copy by key.

The shared assumption behind all four options is that every language needs the
same semantic game. If a later adaptation intentionally changes cultural
setting, character history, or mechanic meaning, that is a separate authored
edition rather than localization under this record.

## Decision

1. **LDO-LOC-001 — Stable locale IDs.** The supported initial locales are `en`
   and `zh-TW`. Locale is selected when a session starts, recorded with the
   session, and remains stable for that session.
2. **LDO-LOC-002 — One semantic game.** World facts, Action IDs, option IDs,
   MindState atoms, cue IDs, Evidence, schedules, disclosure tiers, structured
   protocol fields, and durable outcomes remain locale-independent.
3. **LDO-LOC-003 — Bilingual authored presentation.** Every player-visible fixed
   gameplay string has an English and Traditional Chinese authored value. This
   includes routine and Action fallback narration, names, Action labels,
   guidance, controls, guarded Firewall responses, and other in-game UI copy.
   Developer diagnostics, observer-only logs, tests, prompts, and internal
   documentation need not be bilingual.
4. **LDO-LOC-004 — Keyed catalogs.** Semantic sources reference stable keys or
   existing stable IDs. English and `zh-TW` catalogs own the actual display
   strings. Simulation and Controller logic do not branch on translated prose.
5. **LDO-LOC-005 — Direct generative performance.** Persona and Performance
   Director receive an explicit output locale and write directly in that
   locale. They are not asked to emit both languages, and no translation API
   runs inside the gameplay loop. Judge and selector roles may keep their
   internal structured output language unrestricted because their reasons are
   not player-facing.
6. **LDO-LOC-006 — Preserve English behavior.** Existing English authored copy
   becomes the `en` catalog without paraphrase. English remains an explicitly
   selectable session mode. The Web friend/judge surface defaults to `zh-TW`.
7. **LDO-LOC-007 — Renderer boundary.** Locale selection changes subtitles,
   labels, names, help, and UI presentation only. It does not let a renderer call
   an LLM, infer story meaning, or mutate GameState. This refines ADR 0026 and
   preserves ADR 0030's semantic presentation contract.
8. **LDO-LOC-008 — Completeness and replay.** Automated tests require catalog
   key parity across supported locales. Session logs record locale so a replay
   never silently changes language. A generated Chinese reply does not require
   an exact English twin; an English session produces its own natural English
   performance.

## Consequences

- Fixed Chinese prose is reviewable, deterministic, and available without a
  network translation step.
- Adding a player-visible authored key requires values in both catalogs before
  tests pass.
- Persona and Performance need locale-aware prompt contracts, and Chinese
  model smoke probes must verify natural language, authority boundaries, and
  Judge reachability.
- A bilingual transcript of one exact generated session is deferred. If needed,
  it can be produced after play as an observer/export tool without affecting the
  game loop.

## Non-goals

- translating every design document, internal character packet, prompt, source
  identifier, or observer diagnostic;
- runtime machine translation, language auto-detection, or mid-session locale
  switching;
- culturally adapting the story or guaranteeing sentence-level equivalence
  between separately generated English and Chinese performances.

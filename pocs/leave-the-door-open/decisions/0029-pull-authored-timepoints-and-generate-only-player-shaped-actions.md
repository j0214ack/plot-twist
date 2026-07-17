# 0029: Pull Authored Timepoints and Generate Only Player-Shaped Actions

Status: Accepted

Date: 2026-07-17

## Context

The first browser implementation sent `/resume` as one server request. The
server advanced across the complete authored interval and invoked the
Performance Director for every RoutineBehavior before returning. Only after
that work completed did the browser reveal the resulting text line by line.
Although the DOM changed incrementally, the player still experienced a long
model-backed wait followed by one burst of already-computed scenes.

That implementation also labelled every request as `角色正在想……`. Ordinary
time advancement is not a Persona turn, and ordinary authored routines do not
need model-generated staging. The browser needs real incremental simulation
results, not delayed playback of one complete response.

## Options considered

1. **Keep whole-span `/resume` and slow down the existing line reveal.** This
   changes only the illusion after the wait and does not remove routine model
   calls. Rejected.
2. **Stream one whole-span request with SSE or another server push channel.**
   This can deliver true intermediate results, but introduces a long-lived
   transport and cancellation lifecycle that the PoC does not otherwise need.
   Deferred.
3. **Let the renderer inspect World schedules and call `World.advanceTo`.**
   This gives presentation a second time-authority path and violates ADR 0002.
   Rejected.
4. **Let the browser input/presentation coordinator pull one bounded
   `advance_turn` result at a time.** Accepted. The Controller remains the time
   authority and the pure render methods still only consume safe projections.

The renderer itself does not own this loop. The browser adapter that already
turns controls into application commands owns the wall-clock pacing. This is
the same boundary that may keep controls busy while an animated renderer plays
an already-authorized result.

## Decision

1. **LDO-WEB-014 — Real incremental resume.** Submitting `/resume` starts one
   bounded advance plan. The web adapter then requests `advance_turn`
   repeatedly until the plan reports completion. It never receives or infers
   the unreached schedule.
2. **LDO-TIME-001 — One configurable semantic tick.** One `advance_turn`
   processes one Controller-selected simulation window. The current candidate
   maximum is fifteen simulation minutes, but that number is tuning data, not
   a renderer contract or permanent game rule. A player-presentable routine,
   NarrativeAction, interaction boundary, or plan ending may stop the tick
   earlier. All events produced at the returned minute belong to the same
   timepoint and are neither split nor duplicated.
3. **LDO-TIME-002 — Controller-owned advancement policy.** The Controller owns
   a replaceable time-advance policy that can later choose five-, fifteen-, or
   thirty-minute windows, coalesce empty windows, or fast-forward configured
   quiet hours. A presentation adapter may request the next tick but cannot
   supply a duration, target time, event identity, Action, or schedule
   position. It receives only state that has already happened.
4. **LDO-WEB-015 — Renderer-owned wall-clock pace.** After presenting one
   returned timepoint, the browser waits approximately 2.5 seconds before
   requesting the next one. Simulation timestamps remain authoritative;
   browser delay does not become game time. The initial request may start
   immediately so the button never waits on an artificial delay.
5. **LDO-WEB-016 — Operation-specific busy copy.** Persona dialogue uses
   `角色正在想……`. Time advancement uses a neutral time-progress label. The
   view receives the operation kind instead of guessing from elapsed time or
   screen prose.
6. **LDO-PERF-003 — Authored ordinary routines.** RoutineBehavior and
   RoutineVariant selection, cue text, hints, and durable effects remain
   authored. In this PoC their ordinary visible text is rendered directly and
   does not invoke the Performance Director.
7. **LDO-PERF-004 — Generated player-shaped Action staging.** The Performance
   Director is invoked only after an accepted fixed NarrativeAction executes.
   It may use the Persona-owned accepted interaction motif to vary reversible
   staging inside the existing PerformanceEnvelope. World closure remains
   authored and is applied independently of generated prose.
8. The terminal `/resume` command may consume the same bounded advance plan in
   one process without wall-clock delays. The 2.5-second pace is a web
   presentation choice, not a domain rule.
9. The existing chronological browser transcript remains append-only, but new
   lines from one returned timepoint are appended together. The browser no
   longer simulates event streaming by delaying individual lines from a
   complete multi-timepoint server screen.

## Consequences

- Long quiet spans are handled by the authoritative advancement policy. It may
  coalesce empty ticks or fast-forward a configured quiet interval without
  exposing schedule data or requiring empty player clicks.
- Ordinary routine steps return without a model round trip. A NarrativeAction
  step can still take longer because generated staging is genuinely needed at
  that semantic boundary.
- A future RPG-like renderer can animate each returned timepoint, acknowledge
  completion, then let its presentation coordinator request the next turn.
  It knows the current result's simulation time but not the following one in
  advance.
- Server push, arbitrary mid-animation pause, and fixed fifteen-minute turns
  remain separate future decisions.

## Supersedes and refines

- Supersedes ADR 0026 LDO-WEB-012 and its conclusion that the API does not need
  a browser-owned game loop. LDO-WEB-010, 011, and 013 remain accepted.
- Refines ADR 0027: one returned timepoint is a small safe presentation batch,
  but a multi-timepoint advance is pulled batch by batch instead of being
  fully processed before playback.
- Accepts the `advance_turn` authority boundary proposed by ADR 0028. Fifteen
  minutes remains an adjustable initial policy value rather than a fixed
  contract; arbitrary Pause remains unaccepted.
- Narrows ADR 0010 for the current PoC: its bounded Performance mechanism and
  closure rules remain valid, but routine HintBriefs are realized through
  authored cues rather than runtime model generation.

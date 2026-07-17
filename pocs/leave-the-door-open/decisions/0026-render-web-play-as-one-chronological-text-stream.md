# 0026: Render Web Play as One Chronological Text Stream

Status: Accepted

> ADR 0029 supersedes LDO-WEB-012 and the post-response fake-streaming part of
> this record. LDO-WEB-010, LDO-WEB-011, and LDO-WEB-013 remain accepted.

Date: 2026-07-16

## Context

The first human browser playtest exposed a presentation mismatch. The server
correctly projects World text and UI text as independent layers, but the thin
browser adapter replaced one complete terminal screen with the next. World
time therefore appeared in one block while inner dialogue appeared in another;
after resume, several hours of routine and performance text arrived as one
flush. A submitted thought was also invisible until the model-backed request
completed.

The World/UI authority separation remains correct. The problem is how the web
renderer composes already-safe text over time, not how the simulation,
Controller, Persona, or Judge behaves.

## Decision

1. **LDO-WEB-010 — Bottom controls.** Focus, resume, and help controls appear
   after the chronological transcript, Possibilities, and thought input in
   document order. They do not interrupt the reading surface above it.
2. **LDO-WEB-011 — Optimistic player thought.** A normal submitted thought is
   appended to the transcript immediately as player text before the server
   model request resolves. Slash commands and numbered Possibility selections
   are controls, not spoken thoughts, and are not echoed as dialogue. The later
   authoritative screen reconciles the optimistic line without duplicating it.
3. **LDO-WEB-012 — Incremental presentation.** After the initial screen, newly
   projected non-empty text lines are appended one at a time with a short
   renderer-owned interval. A multi-event time advance therefore becomes a
   legible sequence rather than one DOM replacement. This pacing delays only
   display; it does not advance World time or schedule behavior.
4. **LDO-WEB-013 — One persistent chronological transcript.** World events,
   generated performance text, player thoughts, Persona replies, focus changes,
   and player-safe guidance share one append-only browser transcript in the
   order the browser receives them. Dialogue remains visible when later World
   time advances.
5. The browser derives additions only by comparing consecutive complete,
   player-safe server screens. It may compute a line-sequence diff and retain
   presentation history, but it may not infer events, parse gameplay meaning,
   recreate schedules, determine Action eligibility, or mutate Controller
   state.
6. Numbered Possibility buttons and capability-dependent focus visibility
   continue to derive from the latest authoritative server screen, not from the
   accumulated transcript.

## Consequences

- The terminal may continue rendering independent World/UI layers as complete
  snapshots. The web surface is a different renderer over the same safe
  projection.
- The API does not need token streaming or a browser-owned game loop for this
  PoC. Model computation may finish before the renderer begins presenting the
  returned event lines one at a time.
- Busy state remains visible and controls remain disabled until both the server
  request and incremental presentation finish.
- If a request fails after optimistic echo, the attempted thought remains
  visible beside the safe error. It never becomes Persona or World authority.

## Preserves and refines

This refines ADR 0018 LDO-WEB-002 and LDO-WEB-003: the browser still consumes
only the latest safe terminal projection and forwards fixed input to the real
server session. It preserves ADR 0002's independent World/UI render layers;
independent projections do not require visually separate player transcripts.
It also preserves ADR 0021's capability-dependent controls and ADR 0023's
Firewall authority boundary.

## Deferred

- server-sent events, token streaming, cancellable model calls, and real-time
  animation synchronized to simulation time;
- long-term transcript persistence or save restoration;
- visual 2D/3D scene rendering.

# 0012: Author Whole Chapters and Implement One Causal Beat at a Time

Status: Accepted

Date: 2026-07-16

## Context

The Day 0 clock prologue and the compressed door/threshold path now form a
successful live three-Action demonstration. A fresh uninformed Agent completed
that path, but its 07:57–09:13 schedule also made the current playable boundary
easy to mistake for a complete story chapter.

ADR 0009 already separates the clock tutorial from main-story pacing. It says
that later days and pauses may end without a new intention, as long as routine
behavior or observation gives the player something meaningful to notice. ADR
0011 likewise says that the first door gap may require multiple days or pauses.

The remaining decision is the unit in which later content should be authored,
implemented, and evaluated.

This record uses these terms:

- A **chapter** is a player-facing narrative arc with a starting tension, an
  accumulation of changes, and a legible closing world state.
- A **causal beat** is the smallest useful implementation arc connecting an
  authored clue or routine, psychological movement, a fixed Action, its World
  effect or Evidence, and any resulting observation.

## Options considered

1. **Implement one complete chapter at a time.** This preserves narrative
   context, but creates a large debugging and evaluation surface. A failed
   playtest would not clearly identify which routine, psychological gate,
   Action, trace, or observation caused the failure.
2. **Author and implement one isolated Action at a time.** This is locally
   small, but can produce individually valid Actions without coherent pacing,
   cross-character causality, or a meaningful chapter ending.
3. **Author the whole chapter, then implement one causal beat at a time.** This
   preserves the destination and Evidence chain while keeping each TDD and
   evaluation cycle bounded. Accepted.

All three options assume that chapters are the correct player-facing content
unit. If later playtests show that players experience a different natural unit,
such as a household day or a character-specific arc, the chapter definition
should be revisited without changing the causal-beat implementation boundary.

## Decision

1. Before implementing a main-story chapter, author its narrative promise,
   starting and closing World states, in-world time span, fixed Action graph,
   Evidence/observation chain, routine progression, and HintBrief targets.
2. A calendar day is a pacing tool, not automatically a chapter. A chapter may
   span several in-world days, and one day may contain several causal beats.
3. Implement and validate one causal beat at a time through the public World,
   Controller, Persona/Judge, projection, and rendering boundaries that the
   beat uses.
4. Dialogue turns inside a paused moment do not advance the clock. Time moves
   when the World resumes and follows authored routine or scheduled-event
   progression; scene transitions may skip hours or days.
5. Use semantic checkpoints for bounded Persona/Judge trajectory exploration
   within a beat. Do not repeatedly replay an entire chapter to tune one
   decision point.
6. After all beats are integrated, run a fresh uninformed Agent through the
   complete chapter. Use human playtests, not Agent success alone, to judge
   difficulty, patience, pacing, and emotional credibility.
7. The existing three-Action terminal remains a tutorial and mechanical
   integration witness. Its compressed timing is not canonical main-story
   pacing, and it must not be lengthened merely to imitate a chapter.

## Consequences

- Story direction is decided before code grows around disconnected Actions.
- Failures remain attributable to a bounded causal chain.
- Multi-day routine clues and partial psychological movement can be authored
  without forcing every pause to produce an intention.
- Full-chapter live runs remain valuable integration evidence but are too
  expensive for local prompt iteration.
- Chapter 1 design must precede selection of its first implementation test.

## Relationship to accepted decisions

This operationalizes ADR 0009's distinction between tutorial success grammar
and main-story pacing. It preserves ADR 0001's fixed Action catalog, ADR 0002's
World/render separation, ADR 0003's human-experience boundary, ADR 0010's
authored hints, and ADR 0011's multi-day door premise.


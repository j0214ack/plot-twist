# 0031: Layer Calendar Rhythm Under Story Progress

Status: Accepted

Date: 2026-07-17

## Context

The tutorial World currently begins at 07:56 on an unnamed day. If the player
lets time continue, Martin sits in the living room, rinses a cup at midday,
folds a throw in the evening, and turns out the lights. Repeating this loop can
make the household's emotional stagnation look like the adults have no work,
appointments, errands, or life outside the house.

The desired contrast is narrower: this family is unable to move around one
loss, but ordinary time still moves. The first calendar day should be Thursday
so the player can see a short run of workdays followed quickly by a weekend.
The weekend must not mean that both adults remain inside the house all day;
shopping, a meal out, a walk, or another ordinary outing should remain
possible and visible.

This decision defines **calendar rhythm** as the authored layer of ordinary
departures, absences, returns, errands, meals, and leisure that continues
underneath tutorial and chapter progress. It does not select or advance causal
story Actions.

## Options considered

1. **Change only the tutorial prose to say that Martin works.** This is the
   smallest patch, but a visual renderer would still leave him standing in the
   last room all day and later turns would contradict the claim.
2. **Author each chapter day as one complete bespoke schedule.** This can make
   every day precise, but couples the door arc to a particular weekday and
   makes delayed tutorial completion shift or invalidate the schedule.
3. **Layer an absolute calendar rhythm beneath relative story days.** Workday
   and weekend RoutineBehaviors are selected by the absolute weekday, while
   tutorial and chapter causal beats remain relative to story progress.
   Accepted.
4. **Introduce a fully autonomous life simulator.** Jobs, destinations,
   transport, meals, and preferences could generate a schedule dynamically,
   but the PoC does not need that authority or complexity. A fixed authored
   routine catalog is sufficient.

All options assume that the game should present selected meaningful changes,
not simulate or narrate every minute of a day. The accepted option therefore
adds continuity anchors rather than a complete calendar application.

Pattern check: this is a layered authored scheduler. Calendar routines and
story-causal routines share World time, but neither derives or overrides the
other. It extends ADR 0016's distinction between ordinary texture and the
causal spine; it does not introduce procedural story generation.

## Decision

1. **LDO-CALENDAR-001 — Thursday epoch.** Absolute calendar day zero is
   Thursday. The World and safe renderer projection expose the current weekday
   independently of `chapterDay`.
2. **LDO-CALENDAR-002 — Calendar and story time are independent.** Tutorial
   completion does not reset the weekday. Chapter 1 Day 1 remains the morning
   after the tutorial succeeds, on whichever weekday that actually is.
   **LDO-CALENDAR-006:** a text renderer labels the first presented timepoint
   of each calendar day with its weekday; a visual renderer receives the same
   safe weekday and may present it through its own day-transition UI.
3. **LDO-CALENDAR-003 — Visible workday continuity.** Monday through Friday
   include authored departure and return routines. The first Thursday and
   Friday therefore establish work life before the first weekend. A successful
   Thursday tutorial may still show Thursday's departure and return while time
   advances toward Friday's Chapter 1 opening.
4. **LDO-CALENDAR-005 — Canonical ordinary work.** Martin is a procurement
   coordinator for a restaurant-supply wholesaler. His usual hours are Monday
   through Friday, 09:00–17:30; his usual bus journey takes about twenty-five
   minutes, so he normally leaves at 08:25 and returns around 18:05. Elise is a
   payroll administrator for a small group of dental clinics. Her usual hours
   are Monday through Friday, 09:00–17:00; her usual walk takes about twenty
   minutes, so she normally leaves at 08:35 and returns around 17:25. These are
   deliberately ordinary biographical facts, not explanations of M2E2.
5. Work identity and schedule live in actor-specific ordinary-biography memory
   cards eligible from `unnamed_loss`; they are not placed in the always-on
   Character Core. The Controller supplies only safe cue metadata to the
   Memory Selector and loads card content only if the current conversation
   directly needs it. A direct question about occupation, whether work is due
   today, hours, or commute is sufficient relevance. Unrelated conversation
   should receive no work card.
6. World-affecting schedule facts are canonical rather than improvised. Small
   offstage details with no mechanical, disclosure, or causal consequence may
   be improvised, but any detail meant to persist needs a separate continuity
   record before later Persona turns can rely on it. A player's unsupported
   assertion is not automatically such a record.
7. **LDO-CALENDAR-004 — Visible weekend continuity.** The first Saturday
   includes an ordinary household-shopping outing and the first Sunday includes
   a modest leisure outing. These are authored examples of weekend life, not a
   rule that every future weekend must repeat the same activities or contain a
   quota of notable scenes.
8. Departing actors enter an explicit safe `away_from_home` placement until an
   authored return routine places them inside again. A renderer must remove or
   hide an away actor rather than leave them frozen at their last indoor
   position.
9. Calendar routines are ordinary authored RoutineBehaviors. They do not invoke
   the Performance Director, activate Evidence, mutate MindState, change Action
   eligibility, or complete a causal phase.
10. The tutorial's camera boundary remains intact. Before the clock succeeds,
   Elise exists in World state but her routines are not presented. Martin's
   visible departures and returns are sufficient to establish that his life
   extends beyond the house without prematurely introducing focus or the second
   inner voice.
11. Calendar routines are returned through the existing target-free
   `advance_turn` contract. Each presentable timepoint may stop a semantic tick;
   the renderer controls wall-clock pacing and never reads the future schedule.
12. The first-week schedule is authored and guaranteed. Later variation may
    use ADR 0016's fixed ambient catalog and replayable chance, but chance may
    not erase the departure/return continuity required by the current week.
13. **LDO-CALENDAR-007 — Continuity anchors, not complete simulation.** A
    routine belongs in the fixed visible schedule when it changes who is home,
    whether a character is available, or the household's major shared rhythm.
    The intended first-chapter skeleton is morning, work departure, return,
    an evening meal or explicit meal outing, and night. Breakfast and lunch may
    remain implied. Bathing, toilets, dressing, routine cleaning, and other
    upkeep are not fixed visible ticks; they may appear as occasional ambient
    texture without becoming a daily quota.
14. Sleep is a World availability boundary, but a renderer need only receive
    one authored night transition and the later morning state. It must not be
    forced to present every preparation step. A future distinction between a
    silent continuity update and a presentable routine requires its own public
    contract and test; this ADR does not authorize adding it implicitly.
15. Appointments, visitors, repairs, and exceptional errands enter the
    schedule only when authored story or established continuity requires them.
    Random texture cannot make a character unavailable across a causal moment.

## Consequences

- A player who observes instead of intervening sees Thursday and Friday work
  rhythms, then a recognizably different Saturday and Sunday.
- Emotional stasis no longer implies physical stasis or unemployment.
- The same chapter beat can occur on Friday, Sunday, or another weekday after a
  delayed tutorial without being rewritten.
- The World and visual renderer contracts gain an offstage placement and a
  weekday field.
- The PoC still does not need employer names, travel maps, transport
  simulation, or a general autonomous schedule planner.

## Relationship to accepted decisions

This refines ADR 0021's repeatable tutorial observation cycle: the cycle now
uses calendar-appropriate routines rather than one identical stay-at-home day.
It fulfills ADR 0024's requirement that occupations be separately authored
before use, while preserving ADR 0029's authored routine performance boundary
and ADR 0030's renderer-neutral semantic projection.

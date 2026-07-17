# 0008: Distinguish Imagined Microsteps from World Intentions

Status: Accepted

Date: 2026-07-16

## Context

In black-box Playtest 002, the catalog-blind Husband Persona credibly came to
own `loosening my fingers` as a reversible microstep. The player asked whether
that was what the character wanted to do when time resumed. Persona answered
yes and promised that future movement. The player then used `/resume`, but the
Controller correctly rejected it because no authored Action had surfaced or
passed willingness.

The visible sequence contradicted itself: Persona language represented a
generated microstep as a world intention, while ADR 0001 permits only fixed
authored Actions to execute. The generic rejection did not explain that
distinction. Continuing would have tested whether the player could guess the
hidden Action rather than whether the game loop was understandable.

## Options considered

1. **Keep the fixed catalog and make the intention boundary explicit.** Persona
   may own generated psychological microsteps but cannot promise that one will
   execute after resume. UI tells the player to resume only after selecting a
   numbered Possibility and receiving explicit intention confirmation.
   Accepted for the PoC.
2. **Author `loosen_grip` as another executable Action.** This would make the
   observed path executable, but risks chasing arbitrary generated microsteps
   such as breathing, looking away, or stepping back with ever more authored
   Actions. It remains a future content-design option, not a response to one
   trajectory.
3. **Treat the microstep as a variant of `leave_door_ajar`.** Rejected because
   loosening a grip and removing the hand/walking away have different visible
   completion semantics. ADR 0002 requires separate Actions in that case.
4. **Let Persona generate an Action or match free text to the nearest catalog
   entry.** Rejected by ADR 0001 and the Run 001 negative control.

All options assume a character may psychologically consider more possibilities
than the fixed world can execute. If that assumption is later rejected, the
catalog and authored world behavior must expand explicitly rather than being
silently generated or semantically broadened.

## Decision

1. Persona remains catalog-blind and may discuss or provisionally own grounded
   microsteps that are not executable Actions.
2. During a paused conversation, Persona must not claim that a contemplated
   movement will execute when time resumes or that a world intention has
   already been committed. It does not know that orchestration result.
3. Persona may still express a present first-person possibility or choice. The
   Judge needs that ownership to surface a fixed authored Action; the rule
   forbids claims about future World execution, not psychological movement.
4. Onboarding and help instruct the player to use `/resume` only after a
   numbered Possibility is selected and the screen explicitly confirms an
   intention.
5. After willingness succeeds, the terminal explicitly renders that an
   intention has formed before inviting `/resume`.
6. Premature `/resume` distinguishes a thinkable conversational possibility
   from a world intention and tells the player how the visible gate works. It
   does not expose Action IDs, private MindState, or Judge output.
7. Playtest 002 remains a valid failed trajectory. Verification uses a fresh
   uninformed player and session rather than coaching or resuming the old one.

## Consequences

- Fixed Actions and catalog blindness remain intact.
- Generated intermediate psychology can remain richer than the executable
  catalog without falsely promising a World effect.
- The terminal becomes slightly more explicit about PoC mechanics, which is
  preferable to testing hidden-catalog guessing.
- Whether meaningful no-Evidence microsteps should become separate authored
  Actions remains an open content and pacing decision for later playtests.

## Supersedes

No accepted record is superseded. This clarifies the player-facing consequence
of ADR 0001's fixed-catalog boundary and ADR 0005's Controller ownership.


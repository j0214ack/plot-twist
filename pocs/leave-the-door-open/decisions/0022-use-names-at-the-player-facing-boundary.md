# 0022: Use Names at the Player-Facing Boundary

Status: Accepted for Chapter 1 PoC

Date: 2026-07-16

## Context

The first chapter asks the player to enter two distinct inner lives. Labeling
them only `Husband` and `Wife` makes both conversations feel like functions in
the causal graph and makes it harder for characterization to accumulate. At the
same time, those role IDs already own authored Actions, psychology, evidence
visibility, and tests. Renaming the semantic IDs would create migration work
without improving the player experience.

## Decision

1. **LDO-CHAR-001 — Player-facing names.** The Husband is presented as
   **Martin** and the Wife as **Elise**. These are PoC names: short, visually and
   phonetically distinct, and not intended to encode a hidden clue.
2. Internal IDs remain `husband` and `wife`. Rules, Action ownership, MindState,
   and evidence access continue to use stable semantic IDs rather than display
   strings.
3. The tutorial introduces only Martin. Elise's name first appears when her
   corrected-clock observation closes the prologue and Chapter 1 unlocks both
   inner voices.
4. Player guidance, conversation speaker labels, and browser focus controls use
   names. Neutral third-person World prose may continue to use `he` and `she`
   when the current subject is unambiguous.

## Consequences

- Character identity can develop independently from marital role.
- A later naming revision changes projection copy, not gameplay ownership.
- Tests of semantic behavior continue to assert IDs; projection tests assert
  the names at the safe player boundary.

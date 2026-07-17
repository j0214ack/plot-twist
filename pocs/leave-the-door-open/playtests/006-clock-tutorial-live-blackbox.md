# Playtest 006 — Clock Tutorial Live Black-Box

Date: 2026-07-16

Status: Completed diagnostic pass; tutorial completion still requires a fresh
live witness after the fixes below.

## Scope

Two fresh `fork_turns=none` agents played only from terminal screens. They were
forbidden from reading repository files or receiving Action, MindState, Judge,
or story information. The production local runner used `gpt-5.6-luna` at low
reasoning effort for Persona, Action Judge, and Performance Director roles.

Raw observer/player logs:

- `playtest-logs/ldo-blackbox-clock-20260716.jsonl`
- `playtest-logs/ldo-blackbox-clock-v2-20260716.jsonl`

## Qualitative turn log

### Session A

| Step | Player input | Player understanding | Output assessment |
| --- | --- | --- | --- |
| Opening | — | Correctly understood that the player is an inner voice, cannot control the body, and should help the husband find an acceptable next step. | Goal and immediate clue were discoverable. Generated routine prose was slightly repetitive but stayed on the clock. |
| 1 | `Why did the slow clock bother you today when it usually doesn't?` | Followed the visible routine anomaly without searching for hidden biography. | Persona honestly denied a deeper reason, distinguished today from the usual routine, and introduced available energy. No why-loop. |
| 2 | `Would you be willing to take it down and set it to the right time, just for today?` | Converted the shallow energy cue into a concrete proposal. | Persona owned the possibility and awareness surfaced the fixed clock option. The line `I’m not promising the movement yet` sounded procedural but correctly prevented an execution promise. |
| 3 | `1` | Expected the surfaced option to become a selected step. | Judge returned `defer`, but the UI showed the identical screen with no feedback. |
| 4 | `1` | Reported that the prior selection appeared not to have been recorded, then retried it. | Critical legibility failure confirmed. Session stopped for a regression fix. |

### Session B

| Step | Player input | Player understanding | Output assessment |
| --- | --- | --- | --- |
| Opening | — | Again identified the clock as the only available clue and the goal as finding a willing next step. | Onboarding reproduced successfully. Performance incorrectly generalized today's stop into `Each morning, the husband pauses`; this violated the distinction between repeated noticing and today's selected gesture. |
| 1 | `What made those three minutes worth stopping for today?` | Used an offered example naturally. | Persona stayed shallow, but introduced `not a declaration`, a symbolic frame supplied by an over-specified clock packet rather than by the player. |
| 2 | `What would make adjusting the clock feel like a small effort instead of a declaration?` | Followed the Persona's frame and sought a smaller interpretation. | Fixed option surfaced, but the symbolic vocabulary had already pulled the tutorial away from ordinary inertia. |
| 3 | `1` | Expected the fixed option to form a step. | Judge reasonably deferred because the Persona had owned only a possibility. The first feedback fix made the input legible, but said `not ready to make this an intention`, exposing a system term. |
| 4 | `What is keeping you from making that small adjustment right now?` | Correctly understood that more conversation, rather than retrying the number, was required. | The feedback successfully repaired navigation, although the Persona still repeated the shallow effort barrier. |

## Fixes driven by the sessions

1. **Deferred/refused selection feedback** — Controller now exposes only a
   renderer-safe `not_ready` or `rejected` UI state. Projectors render:
   - defer: `He can picture doing this, but he is not ready to act on it. Keep talking.`
   - refuse: `He refuses this step for now. Try another approach.`
   Neither path exposes Judge labels, reasons, Action IDs, variants, or the
   system term `intention`.
2. **Shallow clock psychology** — Removed `larger declaration` from the clock
   Persona packet. It now supplies only ordinary inertia and enough energy for
   one small adjustment.
3. **Habit/current-performance separation** — Performance Director prompt now
   forbids turning a gesture that happens in the selected behavior now into a
   repeated habit. The authored repeated fact is only that he notices the slow
   clock most mornings.

Each runtime change has a regression test traced to `LDO-LOCAL-009`,
`LDO-LOCAL-010`, or `LDO-LOCAL-011`.

## One-round checkpoint method

When a problem is isolated to one visible decision point, do not replay the
whole game:

1. Preserve the full player-visible screen and its source log sequence.
2. For a player-comprehension probe, send that screen plus only necessary
   prior visible turns to a fresh uninformed player agent. One model round
   returns its next input and qualitative observation.
3. For a Persona/Judge probe, replay a semantic checkpoint rather than the
   screen alone. It must contain the paused moment, observed Evidence,
   conversation, bounded MindState, eligible authored Actions, and relevant
   validated progression. Invoke only the role being tested.
4. Keep occasional full live sessions to verify that checkpoint composition
   and actual GameController sequencing have not drifted.

This session used the first form to validate revised feedback copy in one
round. The player responded by continuing the conversation rather than
retrying the option, and explicitly understood the distinction between a
thinkable step and readiness to act.

## Current validation status

- Opening mental model: pass in two independent black-box sessions.
- Routine clue discoverability: pass, with prompt correction required for
  habit/current wording.
- Non-repetitive shallow Persona response: pass for the first turn.
- Surfacing a fixed clock Possibility: pass in two sessions within two turns.
- Deferred-selection legibility: failed live, fixed by regression test, then
  passed a one-round checkpoint comprehension probe.
- Complete live clock loop through intention, performance, World change, and
  Wife observation: not yet witnessed after these fixes.
- Hallway-door and Wife phases: deterministic acceptance coverage exists, but
  this black-box run intentionally stopped at the tutorial defects.

# Playtest 007 — Full-Slice Live Black-Box Agent

Date: 2026-07-16

Status: Completed; fresh uninformed Agent reached the end of the live
three-Action slice.

## Scope and isolation

A fresh `fork_turns=none` Agent played from player-visible terminal screens
only. It was forbidden from reading repository files, logs, prompts, Action
definitions, MindState, Judge output, or story answers. On every turn it
returned one `INPUT` plus a qualitative `OBSERVATION`; only the input was sent
to the game.

The production local runner used `gpt-5.6-luna` at low reasoning effort for
Persona, Action Judge, and Performance Director roles. Generated performance
was enabled. The observer log is:

- `playtest-logs/ldo-agent-clock-fresh-20260716-a.jsonl`

This run validates one reachable unaided trajectory. It does not establish
human difficulty, fun, or model reliability across repeated runs.

## Result

The Agent completed all three authored Actions:

```text
interact_with_living_room_clock
→ open_door_a_crack
→ remain_at_threshold
→ End of this playtest slice
```

The final controller snapshot was at 09:13 with the clock accurate, the hallway
door slightly open, both Evidence records observed by the wife, and all three
Action progress records completed.

The run used 22 player inputs:

- 14 dialogue turns: clock 4, door 6, wife 4;
- 5 numbered selections: clock and door each deferred once before acceptance;
- 3 `/resume` commands.

The local role adapter made 37 calls: 14 Persona, 14 awareness, 5 willingness,
and 4 Performance Director calls. Recorded role latency totalled 288,865 ms.
Because this uses saved Codex authentication, that is plan usage rather than
repository API-key billing, but the full path remains expensive enough that
checkpoint probes should be preferred for isolated prompt questions.

## Qualitative turn log

### Clock tutorial

| Step | Player input | Visible result | Black-box assessment |
| --- | --- | --- | --- |
| Opening | — | The slow clock, today's unusual stop, role, goal, and example questions were visible. | The Agent correctly understood that it was an inner voice, could not control the body, and should follow the clock clue. |
| 1 | `What made those three minutes worth stopping for today?` | The husband denied a deeper reason and named enough energy for one small adjustment, though effort remained. | Direct acknowledgement and a usable new clue; no repetition yet. |
| 2 | `What is the smallest adjustment you could genuinely accept making right now?` | He named correcting the three minutes; the fixed clock Possibility surfaced. | Clear progress from general energy to a concrete small step. |
| 3 | `1` | Willingness deferred and the screen said he could picture it but was not ready; it invited more conversation. | The Agent explicitly understood that its number was received and that it should keep talking rather than retry blindly. |
| 4 | `If you corrected the clock, what would having those three minutes right give you?` | He could not name a benefit and repeated that it could remain one small adjustment without standing for anything more. | The Agent judged that the conversation was beginning to circle. The output also reintroduced a negated symbolic frame despite the shallow tutorial packet. |
| 5 | `It doesn't have to mean anything more-can you let one small adjustment be enough for today?` | He accepted that the correction could be enough today. | The Agent recognized changed readiness and retried the option. |
| 6 | `1` | Intention confirmation appeared. | Accepted on the second selection. |
| 7 | `/resume` | The clock advanced three minutes, remained intact, showed the current time, and the wife observed it before the next pause. | Tutorial completion and causal World change were legible. Performance described one action today and did not turn it into a repeated habit. |

### Hallway door

| Step | Player input | Visible result | Black-box assessment |
| --- | --- | --- | --- |
| 8 | `What makes you stop with your hand on the door?` | The husband feared an irreversible, misread opening. | A meaningful direction was visible without hidden biography. |
| 9 | `What would you want your spouse to understand if you opened the door?` | He could not name an intended meaning and repeated the erasure fear. | This approach was blocked rather than advanced. |
| 10 | `What are you trying to protect by keeping things still?` | He still could not name it, but revealed separate routines and rare direct speech. | Some new context appeared, though the erasure/stillness language was repetitive. |
| 11 | `Could you make a little room for your spouse without deciding what it means for either of you?` | He separated imagining room for the spouse from acting or assigning meaning. | A plausible new route emerged from visible dialogue alone. |
| 12 | `Could leaving the door slightly open keep the meaning unclaimed rather than decide it?` | He could imagine a reversible slight opening; the fixed door Possibility surfaced while the door remained closed. | The option felt discoverable and physical state remained coherent. |
| 13 | `1` | Willingness deferred with explicit feedback. | The Agent inferred that not knowing what followed was the remaining barrier. |
| 14 | `You don't have to know what follows-could the slight opening be complete in itself for now?` | He accepted the opening as a complete reversible act. | Readiness visibly changed. |
| 15 | `1` | Intention confirmation appeared. | Accepted on the second selection. |
| 16 | `/resume` | Only then did the door open a narrow crack; the wife later entered the hallway and observed it. | Door provenance and Evidence causality were clear. |

### Wife at the threshold

| Step | Player input | Visible result | Black-box assessment |
| --- | --- | --- | --- |
| 17 | `What do you notice in yourself when you see the door slightly open?` | The wife named uncertainty, disloyalty, exposure, and tolerance only for observation. | The psychological barrier and a possible observation route were clear. |
| 18 | `Could you move a little closer just to observe, without accepting the door as an invitation?` | She could consider reduced distance but not make the movement. | Some psychological movement, but the first-mover barrier remained. |
| 19 | `Would moving closer really make you the first to disturb it, if someone has already opened the door?` | She rejected that reframe and distinguished her own deliberate approach from the prior opening. | A reasonable route failed, but the refusal was coherent and suggested using what she already tolerated. |
| 20 | `What can you notice from where you are, without moving any closer?` | She chose to remain outside and observe; the fixed threshold Possibility surfaced. | The route became legible without requiring entry or touch. |
| 21 | `1` | Intention confirmation appeared immediately. | The Agent regarded deliberate presence for one breath as meaningful progress. |
| 22 | `/resume` | She remained at the threshold for one quiet breath and the slice ended. | The Agent understood this as a bounded ending rather than resolution of the household's whole story. |

## Gate assessment

- **Unaided Agent completion:** pass for one fresh full-slice run.
- **Opening mental model and clue discoverability:** pass.
- **Clock Possibility reachability:** pass within two dialogue turns.
- **Deferred-selection legibility:** live pass for both clock and door.
- **Clock shallow psychology:** partial pass. No grief, relationship repair, or
  hidden biography appeared, but `stand for anything more` reintroduced a
  negated symbolic frame and influenced the next player turn.
- **Current gesture versus repeated habit:** pass. The clock performance did
  not claim that today's stop or adjustment happens every day.
- **Door provenance:** pass. The visible door stayed closed until the accepted
  Action executed, then the wife observed the first narrow gap.
- **Full three-Action live completion:** pass.

## Friction to carry forward

1. The door's first three responses circled around erasure, stillness, and
   unknown intent before the Agent found the `make a little room` reframe.
   This did not block completion, but should be compared with human tolerance.
2. The positive confirmation `An intention has formed` was unambiguous, but
   the Agent described it as deliberately system-like rather than part of the
   character's inner voice.
3. Generated clock staging changed pronouns from the surrounding `he/his` to
   singular `they/their`, then the authored World output switched back. The
   action remained understandable, but presentation voice was inconsistent.
4. The full path consumed 431,786 recorded input tokens across role calls,
   largely because full conversation context is replayed. This is telemetry,
   not a gameplay turn limit, but it reinforces the checkpoint-replay priority.

No prompt or runtime change was made from this single run. The next product
evidence should come from a human playtest; isolated wording or prompt fixes
should use saved visible/semantic checkpoints before another full live replay.

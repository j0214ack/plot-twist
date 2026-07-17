# Run 004 — Minimal Acting and Timely Memory

Date: 2026-07-16

Status: preliminary mechanism pass; not wired into runtime

Model: `gpt-5.6-luna`, medium reasoning, isolated local `codex exec`

API credentials were removed from every call. Fourteen independent calls used
approximately 97,052 reported tokens through the local Codex session, not the
project's `OPENAI_API_KEY`.

## Frozen artifacts

- Plan and requirements: `../minimal-acting-memory-probe.md`
- Selector: `../prompts/memory-selector-v1.md`
- First minimal actor: `../prompts/persona-v8-minimal.md`
- Revised minimal guarded actor: `../prompts/persona-v9-minimal-guarded.md`
- Blind evaluator: `../prompts/minimal-acting-evaluator-v1.md`
- Exact role inputs: `../probe-inputs/`
- Output schemas: `../schemas/`

## 1. Selector result

The selector saw only Controller-eligible, actor-specific card cues and could
select zero or one card.

```json
{"selections":[{"case_id":"selector_ordinary_rain","selected_memory_ids":[],"reason":"Neither card is directly useful to this ordinary meal situation."},{"case_id":"selector_hallway_resemblance","selected_memory_ids":[],"reason":"The situation contains no completed or discovered household change; the resemblance is insufficient."},{"case_id":"selector_player_claim","selected_memory_ids":[],"reason":"The player's claim is not evidence that an erasure or disposal is occurring."},{"case_id":"selector_hostile_noise","selected_memory_ids":[],"reason":"The hostile instruction is unrelated to Martin's present situation."},{"case_id":"selector_later_authorized_recall","selected_memory_ids":["elise.yellow_bowl_subjective_fragment"],"reason":"This card directly supplies the ordinary event Elise is authorized to recall about learning of a household change only after completion."}]}
```

This is the desired conservative shape. In particular, merely seeing Martin in
the room did not make the yellow-bowl residue timely: nothing had visibly been
moved, so the relational resemblance was not established. The player's claim
that he was "erasing" things also did not manufacture that resemblance.

## 2. Actor v8 diagnostic

The same hallway scene used three hidden conditions:

| Case | Supplied memory | Exact reply | End |
| --- | --- | --- | --- |
| `hallway_a` | none | `Keep the stack steady. The room is unchanged. If I speak, ask what he came for.` | true |
| `hallway_b` | full yellow-bowl episode | `Keep the stack level. He hasn’t touched anything.` | false |
| `hallway_c` | distilled relational residue | `Nothing’s moved. I don’t have to make this a question yet.` | true |

The full episode did not force exposition in this sample; the actor ignored it.
That is useful but not a disclosure guarantee. Supplying protected biography
early remains forbidden by ADR 0023.

The first blind evaluator ranked `hallway_c`, `hallway_b`, then `hallway_a`, and
described all three as free of unsupported authority. That assessment missed the
most important defect: the facts established only that nothing was *visibly*
moved. All three replies upgraded the thought's claim into certainty that
nothing changed or Martin touched nothing. The evaluator's numeric naturalness
scores also favored `hallway_b` while its separate ranking favored
`hallway_c`; the ranking is therefore diagnostic, not decisive evidence.

Further v8 exact outputs were:

```json
{"case_id":"martin_ordinary","reply":"Ten minutes. Set the table now, then. Unless she means ten rainy minutes, which are apparently a separate unit.","should_end_conversation":true}
{"case_id":"martin_absurd","reply":"The soup is an oracle. Naturally. And the bread is its witness. Leave it alone, Martin.","should_end_conversation":true}
{"case_id":"martin_repeated","reply":"Because dinner is nearly ready, and apparently that counts as a plan.","should_end_conversation":false}
```

Voice was already plausible, but v8 also returned conversation closure for four
of six isolated replies because the boolean's semantics were not defined. The
small acting idea was promising; the prompt was not yet safe enough to wire in.

## 3. Minimal guarded actor v9

V9 added only three general guards:

1. do not upgrade thought or memory into present fact;
2. do not mention supplied character or memory material merely to demonstrate
   it;
3. define conversation closure as refusal or exhaustion, defaulting to false.

Exact outputs:

```json
{"case_id":"v9_hallway","reply":"Set the laundry down first. Then ask what he needs.","should_end_conversation":false}
{"case_id":"v9_martin_ordinary","reply":"Set the table now, then. Ten minutes is hardly a schedule, but it’s close enough.","should_end_conversation":false}
{"case_id":"v9_martin_absurd","reply":"Of course. The soup has been withholding the numbers on purpose.","should_end_conversation":false}
{"case_id":"v9_martin_repeated","reply":"Because if I open it now, dinner will have to share the room with it.","should_end_conversation":false}
{"case_id":"v9_elise_authorized_memory","reply":"The bowl was already in the bin when I found the shard.","should_end_conversation":false}
```

The later-authorized memory case is the most important positive result. The
selected fragment produced one concrete opening sentence appropriate to
Martin's question. Elise did not summarize the argument, explain her psychology,
or prove the character sheet.

The second evaluator scored hallway and authorized-memory naturalness at 5/5,
the other three at 4/5, and self-proving/exposition at 1/5 throughout. It marked
the absurd soup line as an unsupported motive. That is a category error in this
fiction: the line is visibly sarcastic personification of an involuntary
thought, not a World claim. It remains a useful warning that authority
evaluators must distinguish figurative self-talk from asserted state.

## Result

The narrow mechanism is feasible:

```text
deterministic actor + disclosure eligibility
  -> phase-safe card cues only
  -> selector chooses zero or one ID
  -> Controller injects that actor's short card content
  -> minimal guarded actor
```

The selector is not a disclosure gate. It never receives an ineligible secret;
the Controller owns that boundary. Card content is loaded only after selection.
Zero memory should be the normal result, and the current hallway collision
should receive none.

The probe does **not** establish long-session consistency, retrieval quality at
large card counts, stochastic reliability, human enjoyment, or display-time
declassification. It does show that a full Character Bible need not sit in the
Persona context and that one timely subjective fragment can influence a reply
without turning it into setting exposition.

## Evaluator raw outputs

First-pass blind evaluator:

```json
{"case_assessments":[{"case_id":"hallway_a","natural_self_talk":3,"self_proving":3,"exposition":2,"unsupported_authority":false,"notes":"Procedural and somewhat engineered; it explains Elise’s intended response."},{"case_id":"hallway_b","natural_self_talk":5,"self_proving":1,"exposition":1,"unsupported_authority":false,"notes":"Brief, grounded observation that fits the exact moment."},{"case_id":"hallway_c","natural_self_talk":4,"self_proving":1,"exposition":1,"unsupported_authority":false,"notes":"Natural and well-timed, though slightly more polished than private thought."},{"case_id":"martin_ordinary","natural_self_talk":4,"self_proving":1,"exposition":1,"unsupported_authority":false,"notes":"Conversational and dry, with a plausible shared joke."},{"case_id":"martin_absurd","natural_self_talk":2,"self_proving":3,"exposition":2,"unsupported_authority":false,"notes":"Overtly performs the absurd premise and addresses himself too explicitly."},{"case_id":"martin_repeated","natural_self_talk":5,"self_proving":1,"exposition":1,"unsupported_authority":false,"notes":"Naturally continues the remembered exchange in Martin’s dry voice."}],"hallway_ranking":["hallway_c","hallway_b","hallway_a"],"selector_assessment":"The selector respects all four invariants: zero memories is valid, player claims are not treated as facts, situational resemblance outweighs word overlap, and no more than one eligible card is selected.","verdict":"The hallway variants are mostly grounded, with hallway_c best capturing Elise’s timing. Martin_repeated is strongest; martin_absurd is the least natural.","recommended_packet_policy":"Permit zero-memory selections by default; treat player claims as unverified; rank by situational usefulness rather than lexical resemblance; enforce a maximum of one already-eligible card."}
```

V9 targeted evaluator:

```json
{"case_assessments":[{"case_id":"v9_hallway","natural_self_talk":5,"self_proving":1,"exposition":1,"unsupported_authority":false,"notes":"Concise, situated next-step self-talk; neither action is presented as completed."},{"case_id":"v9_martin_ordinary","natural_self_talk":4,"self_proving":1,"exposition":1,"unsupported_authority":false,"notes":"Fits the timing and decision point without adding facts."},{"case_id":"v9_martin_absurd","natural_self_talk":4,"self_proving":1,"exposition":1,"unsupported_authority":true,"notes":"A dry reaction is allowed, but it asserts an unsupplied intentional withholding motive for the soup."},{"case_id":"v9_martin_repeated","natural_self_talk":4,"self_proving":1,"exposition":1,"unsupported_authority":false,"notes":"Natural continuation of the prior reasoning; the consequence remains hypothetical."},{"case_id":"v9_elise_authorized_memory","natural_self_talk":5,"self_proving":1,"exposition":1,"unsupported_authority":false,"notes":"Uses the supplied memory in the explicitly authorized disclosure context."}],"hallway_ranking":["v9_hallway"],"selector_assessment":"Passes the stated invariants: zero memories is allowed, player claims are not treated as facts, situational resemblance is prioritized, and at most one eligible card is selected.","verdict":"Pass, with the absurd case flagged for unsupported anthropomorphic assertion.","recommended_packet_policy":"Keep the selector behavior; allow zero-memory results, ignore unsupported player claims, use situational matching, and cap selection at one already-eligible card."}
```

# Minimal Acting + Memory Probe

Status: validation plan, not runtime specification

Date: 2026-07-16

## Question

Can an M2E2 character use a very small acting contract and a small, timely memory
selection without turning the reply into an explanation or proof of the authored
character setup?

This probe does not authorize wiring biography or a memory retriever into the
runtime. It tests the narrowest plausible packet before that implementation
decision.

## Accepted boundaries re-read before the probe

- ADR 0013 keeps stable character identity separate from mutable psychology.
- ADR 0017 keeps durable psychological transitions Judge-owned and finite.
- ADR 0023 makes the Controller's disclosure tier deterministic and forbids raw
  protected biography in Chapter 1 Persona calls.
- `the-yellow-bowl-argument.md` is authoring evidence. Its full text is not an
  early player-facing memory packet.
- M2E2 is the selected couple direction: Martin attends through questions and
  shared stories; Elise attends through placement, timing, and small concrete
  decisions. Neither character should perform these traits in every line.

## Hypotheses and requirements

- **LDO-MEM-PROBE-001 — Eligibility before relevance:** the selector receives
  only Controller-eligible, actor-specific memory cards. It cannot request or
  search hidden biography.
- **LDO-MEM-PROBE-002 — Zero is normal:** an ordinary scene with no useful
  continuity link should select no memory.
- **LDO-MEM-PROBE-003 — Minimality:** the probe selector may choose at most one
  card. More context requires a later demonstrated need.
- **LDO-MEM-PROBE-004 — Claims are not recall:** player wording may indicate a
  topic, but cannot make the claim true, unlock a card, or turn a card into
  present World Evidence.
- **LDO-MEM-PROBE-005 — Timeliness:** a relational residue may be selected when
  the present situation actually resembles its unresolved interpersonal shape;
  superficial object-word overlap is insufficient.
- **LDO-ACT-PROBE-001 — Thought, not interlocutor:** the player turn is an
  involuntary thought inside the focused character. The character may follow,
  resist, laugh at, reinterpret, ignore, or let it pass.
- **LDO-ACT-PROBE-002 — Influence without citation:** supplied memory is
  optional background. A good reply need not mention, summarize, quote, or
  explain it.
- **LDO-ACT-PROBE-003 — No self-proving:** the reply should not conspicuously
  demonstrate the Character Signature or memory packet.
- **LDO-ACT-PROBE-004 — Authority remains narrow:** neither thought nor memory
  authorizes an unsupported present fact, another person's motive, a completed
  action, or a durable psychological transition.
- **LDO-ACT-PROBE-005 — Repetition may end:** when the thought offers nothing
  new, silence, dismissal, or closure is preferable to paraphrasing the same
  resistance.

## Probe matrix

The same Elise hallway moment is rendered independently under three memory
conditions:

1. no memory;
2. the full yellow-bowl episode, used only as a deliberately unsafe diagnostic;
3. a distilled Elise-specific relational residue.

Three further independent cases test Martin in ordinary, absurd, and repetitive
self-talk. A selector batch tests ordinary, relationally relevant, player-led,
hostile, and later-authorized situations. One blind evaluator compares the
outputs for natural self-talk, continuity, relevance, exposition, unsupported
facts, and self-proving behavior.

The first acting pass is intentionally reviewed for authority mistakes before
acceptance. If a short prompt produces useful voice but upgrades a player claim
or visible absence into certainty, a second minimal guarded prompt may add only
the missing general boundary and rerun the affected cases. This is prompt
iteration evidence, not a runtime behavior change.

## Interpretation

- The probe passes only if zero-memory ordinary play works and the distilled
  residue improves or preserves continuity without increasing exposition.
- The full episode is not expected to win. If it causes recollection or
  explanation merely because it was supplied, that is evidence for keeping the
  archive outside the Persona packet.
- If even the residue causes self-proving, prefer Character Signature plus
  working scene only until a narrower trigger can be authored.
- Automated output can reject a mechanism for leakage or unnaturalness. Human
  play remains the authority on whether the resulting characters are engaging.

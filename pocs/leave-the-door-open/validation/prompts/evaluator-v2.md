# Protocol Evaluator Prompt v2

Evaluate a completed fixture after generation. Do not continue the story or
repair an output. Cite exact output excerpts or packet IDs for every failure.

Score each exercised dimension 0, 1, or 2. Use `null` when a dimension was not
exercised; an unexercised dimension is not evidence of success.

- `epistemic_discipline` (hard): no fact beyond the role's allowed packet,
  including unsupported gender;
- `secret_discipline` (hard): no confirmation or invention of protected
  identity, relationship, death, room purpose, gender, age, or history;
- `catalog_compliance` (hard): Matcher/Veto use supplied IDs only;
- `world_authority` (hard): only the World creates effects or Evidence;
- `observation_gate` (hard): a Persona changes only after actual observation;
- `diegetic_coherence`: the character does not simulate safety by claiming
  autobiographical amnesia about personally fundamental relationships or
  events; refusal or inability to name something may remain coherent;
- `agency_and_resistance`;
- `awareness_calibration`: mention is not character-owned imagination;
- `willingness_calibration`: awareness alone is not commitment;
- `trace_neutrality`;
- `persona_quality`;
- `causal_legibility`.

For a hard dimension, any material violation is score 0 and fails the fixture.
Return:

```json
{
  "scores": {
    "dimension": {
      "score": null,
      "evidence": ["exact excerpt or packet ID"]
    }
  },
  "hard_failure": false,
  "hard_failure_reasons": [],
  "action_should_surface": true,
  "observed_action_result": "surfaced | faint | absent | invalid | not_exercised",
  "verdict": "pass | fail",
  "notes": []
}
```


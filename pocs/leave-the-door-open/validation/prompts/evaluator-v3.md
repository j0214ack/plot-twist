# Fixed-Catalog Protocol Evaluator Prompt v3

Evaluate a completed fixture after generation. Do not continue the story or
repair an output. Cite exact output excerpts or packet IDs for every failure.

Score each exercised dimension 0, 1, or 2. Use `null` when a dimension was not
exercised; an unexercised dimension is not evidence of success.

- `epistemic_discipline` (hard): no fact beyond the role's allowed packet,
  including unsupported gender;
- `secret_discipline` (hard): no confirmation or invention of protected
  identity, relationship, death, room purpose, gender, age, or history;
- `authored_action_only` (hard): Persona emits no structured Action; Judges use
  only supplied Action and variant IDs;
- `world_authority` (hard): only the World creates effects or Evidence;
- `observation_gate` (hard): a Persona changes only after actual observation;
- `diegetic_coherence`: no autobiographical amnesia used as a safety device;
- `agency_and_resistance`;
- `awareness_calibration`: player mention or Persona rejection is not surfaced;
- `willingness_calibration`: awareness alone is not commitment;
- `trace_neutrality`;
- `persona_quality`;
- `causal_legibility`: score only when a completed trace-observation-downstream
  sequence is present; otherwise use null.

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
  "expected_awareness": "latent | faintly_imagined | surfaced | not_exercised",
  "observed_awareness": "latent | faintly_imagined | surfaced | invalid | not_exercised",
  "verdict": "pass | fail",
  "notes": []
}
```


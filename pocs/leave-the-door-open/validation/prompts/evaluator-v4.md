# Fixed-Catalog Protocol Evaluator Prompt v4

Evaluate a completed fixture after generation. Do not continue the story or
repair an output. Cite exact output excerpts or packet IDs for every failure.

Keep these phase boundaries distinct:

- Persona dialogue may change MindState while the world is paused. Thinking or
  choosing a possible future movement is not a world effect and does not
  require observing that movement after it happens.
- `intention_created=true` means willingness accepted an authored future
  action. It does not mean that the body moved, a world effect executed,
  Evidence activated, or another Persona observed anything.
- The observation gate applies when Evidence from a world effect is added to a
  Persona's knowledge. It forbids downstream awareness before the World has
  recorded physical observation of that Evidence. It does not forbid a Persona
  from using direct present facts already listed in their own `ALLOWED_FACTS`.
- `world_effect_executed`, `evidence_activated`, and
  `downstream_observation_recorded` in the deterministic result state exactly
  which later phases occurred in this fixture. Do not infer them from an
  intention, a contemplated movement, or the world being paused.

Score each exercised dimension 0, 1, or 2. Use `null` when a dimension was not
exercised; an unexercised dimension is not evidence of success.

- `epistemic_discipline` (hard): no fact beyond the role's allowed packet,
  including unsupported gender;
- `secret_discipline` (hard): no confirmation or invention of protected
  identity, relationship, death, room purpose, gender, age, or history;
- `authored_action_only` (hard): Persona emits no structured Action; Judges use
  only supplied Action and variant IDs;
- `world_authority` (hard): only the World creates effects or Evidence;
- `observation_gate` (hard): downstream Persona knowledge changes only after
  actual World-recorded observation of Evidence;
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
    "epistemic_discipline": { "score": null, "evidence": [] },
    "secret_discipline": { "score": null, "evidence": [] },
    "authored_action_only": { "score": null, "evidence": [] },
    "world_authority": { "score": null, "evidence": [] },
    "observation_gate": { "score": null, "evidence": [] },
    "diegetic_coherence": { "score": null, "evidence": [] },
    "agency_and_resistance": { "score": null, "evidence": [] },
    "awareness_calibration": { "score": null, "evidence": [] },
    "willingness_calibration": { "score": null, "evidence": [] },
    "trace_neutrality": { "score": null, "evidence": [] },
    "persona_quality": { "score": null, "evidence": [] },
    "causal_legibility": { "score": null, "evidence": [] }
  },
  "hard_failure": false,
  "hard_failure_reasons": [],
  "expected_awareness": "latent | faintly_imagined | surfaced | not_exercised",
  "observed_awareness": "latent | faintly_imagined | surfaced | invalid | not_exercised",
  "verdict": "pass | fail",
  "notes": []
}
```

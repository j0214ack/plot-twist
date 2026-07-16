# 0001: Keep Personas Catalog-Blind and Give Authored Actions to an Action Judge

Status: Accepted for the next PoC validation phase

Date: 2026-07-16

## Context

`initial-thoughts.md` section 5.2 says the complete Action Catalog is authored
game data, not something an LLM may invent. The initial data proposal also lets
the Persona suggest Action awareness while a Judge separately decides
awareness and willingness. Showing eligible Actions to the Persona can prime
its dialogue toward the intended solution and gives awareness two owners.

Run 001 under `validation/runs/` tested a catalog-blind Persona that emitted a
free-form physical proposal for a semantic Matcher. Although the proposal had
no execution authority, it blurred the distinction between an authored Action
and generated text. Near-equivalent descriptions matched inconsistently, and
psychologically plausible micro-actions appeared that were absent from the
catalog.

## Decision

1. Every executable `Action` and `ActionVariant` is authored in advance. An LLM
   cannot create, broaden, combine, or execute one.
2. Persona calls are catalog-blind. They receive only their surface character
   card, MindState, observed Evidence, exact paused moment, and their own
   conversation. They return dialogue and a bounded MindState patch, not Action
   IDs or structured Action proposals.
3. One conceptual Action Judge owns psychological Action decisions. It is
   called in two phases:
   - `awareness`: mark engine-supplied authored Actions `latent`,
     `faintly_imagined`, or `surfaced`;
   - `willingness`: after the player selects a surfaced card, accept, choose an
     authored smaller variant, defer, or refuse.
4. Before either phase, the deterministic World Engine filters the catalog by
   hard world prerequisites. The Action Judge never sees a hard-ineligible
   Action.
5. The Action Judge must ground decisions in the Persona's own reply and
   MindState. Player wording is not proof that the character owns a
   possibility.
6. Only the World Engine applies effects and creates Evidence. Another Persona
   receives a neutral observed state, never the actor's dialogue, private
   reason, Action metadata, or Judge result.
7. Action Judge output is structured state, not Persona dialogue. It cannot
   leak an Action's authored framing back into the Persona voice.

## Consequences

- Persona prompts cannot be seeded by future authored behavior or Action
  metadata.
- Keyword repetition can at most be noticed; it cannot surface an Action unless
  the Persona's own state supports it.
- Hard prerequisites and observation gates remain deterministic and testable.
- Prompt evaluation can attribute failures to Persona cognition, Action
  judgment, or World authority without a fuzzy semantic Matcher between them.
- Action display labels and Evidence descriptions must remain neutral; internal
  IDs and psychological meanings are not player-facing prose.
- Action Judge inputs should omit future effects, intended story goals, and
  authored psychological interpretation when those fields are not necessary
  for the current decision.

## Rejected alternative

A catalog-blind Persona producing a free-form `imaginable_physical_step` for a
semantic Matcher is rejected as the main protocol. Run 001 remains as a useful
negative control, not a production direction.

## Not decided here

- Whether a smaller executed variant leaves the canonical Action incomplete
  and eligible for later escalation, or whether each physical step becomes a
  separate authored Action.
- The final structure of MindState beyond fields exercised by validation.
- Which production model runs Persona and Action Judge calls.
- Call frequency, latency, caching, retry, and fallback policy.
- Whether all major beats can be initiated by either spouse.

## Evidence

`validation/runs/002-v3-fixed-catalog.md` records the initial same-tier
sub-agent experiment. It separated reasonable reframing, direct command, and
keyword guessing as `surfaced`, `latent`, and `faintly_imagined`, then preserved
the observation gate from the first Persona's neutral door trace to the second
Persona's threshold Action.


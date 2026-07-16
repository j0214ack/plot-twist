# 0017: Give Authored Mind-State Transitions to the Judge

Status: Accepted

Date: 2026-07-16

## Context

ADR 0001 made the Persona catalog-blind but allowed it to return a bounded
`MindState` patch that the Controller applied before asking the Action Judge
about awareness. Integrated Chapter 1 probes exposed two related failures.

First, the current patch has only a free-text `currentBarrier` and
`unchanged`, `weakened`, or `strengthened`. It cannot represent a barrier that
has actually been resolved. A Persona can therefore accept the player's
reframe and then manufacture a replacement barrier because the output schema
still requires one.

Second, a Persona that both performs the character's reply and writes its own
durable psychology has two responsibilities. The player-visible performance
becomes the authority on whether a belief changed. This is inconsistent with
the intended role of the Judge: deciding whether conversation has genuinely
weakened or removed resistance or changed an erroneous belief.

Completely free-form durable beliefs would recover expressive freedom, but
would make Action reachability depend on unpredictable text, permit
unsupported facts to become persistent psychology, and make chapter closure
difficult to replay or control. Allowing only deletion of initial barriers is
controllable but cannot represent a character adopting a new interpretation.

## Definitions

- A **psychological atom** is one authored, stable-ID unit of mutable
  psychology. The PoC supports:
  - `belief`: an existing proposition that may be `held`, `questioned`, or
    `rejected`;
  - `reframe`: a constructive proposition that may be `unavailable`,
    `considered`, or `accepted`;
  - `pressure`: non-propositional resistance that may be `active`, `weakened`,
    or `resolved`.
- A **Mind-State Transition Judge** is the action-catalog-blind phase of the
  conceptual Judge that decides legal transitions of supplied psychological
  atoms from the Persona's reply and grounded conversation.
- An **unmodeled shift note** is optional observer-only diagnostic text saying
  that a useful change may be absent from the authored atom catalog. It has no
  gameplay authority and is not persisted into Persona state.

## Options considered

1. **Keep Persona-authored free-text patches.** This is the smallest code
   change, but retains the authority collision and cannot reliably represent
   resolved resistance.
2. **Let the Judge create arbitrary durable beliefs.** This permits emergent
   psychology, but makes state identity, safety, replay, Action calibration,
   and chapter closure unbounded.
3. **Permit only removal of authored initial barriers.** This is easy to
   control, but makes psychological development subtractive only.
4. **Author finite psychological atoms and let an action-blind Judge control
   their finite transitions.** Accepted. Natural-language conversation stays
   open while durable mechanical state remains bounded.

All options assume this PoC remains an authored chapter with fixed Actions. A
fully emergent psychological sandbox would require a separate decision about
state identity, consolidation, contradiction, forgetting, and story closure.

## Decision

1. Durable `MindState` consists of authored psychological atoms with stable
   IDs. Removing a barrier does not delete it; the atom remains recorded as
   `resolved` or `rejected` so it cannot silently reappear on a later day.
2. The Persona receives the current authored atoms but returns only
   player-facing inner speech, a conversation-closure signal, and grounded
   source citations. It may express acceptance, doubt, resistance, or a new
   idea in natural language, but it cannot mutate durable `MindState`.
3. One conceptual Judge has three separately prompted and schema-validated
   phases:
   - `mind_state_transition`, after every Persona reply;
   - `awareness`, after the Controller applies validated transitions;
   - `willingness`, after the player selects a surfaced authored Action.
4. `mind_state_transition` receives no Action IDs, Action descriptions,
   variants, future effects, or preferred outcome. This prevents the Judge
   from changing psychology merely to fit a known solution.
5. The transition Judge may return only supplied atom IDs and an authored
   status valid for that atom kind. The Controller rejects unknown IDs,
   impossible statuses, regressions, and changes whose `from` status does not
   match current state. The Judge cannot create, rename, delete, merge, or
   rewrite atom propositions.
6. Player wording alone cannot change an atom. Every transition must cite the
   Persona's reply as evidence that the character actually accepted,
   questioned, rejected, weakened, or resolved something. World Evidence may
   ground a transition only when already observed by that Persona.
7. A turn may change zero, one, or several atoms. The protocol does not impose
   a universal number of dialogue turns or require adjacent status movement;
   difficulty and pacing remain human-playtest questions.
8. The awareness and willingness phases consume only the Controller-validated
   post-turn `MindState`. A removed pressure or accepted reframe is not an
   automatic Action success: the Persona's own latest reply must still own the
   concrete possibility or present choice.
9. Psychological atoms are authored per character and story phase, not per
   rendered event. Routine and ambient events need no atoms unless they open or
   alter a meaningful conversational state. Deterministic World progression
   may make authored atoms available at later phases; an LLM may not invent
   them.
10. An optional `unmodeled_shift_note` is written only to observer telemetry.
    It cannot alter `MindState`, routine selection, Action awareness,
    willingness, World state, Evidence, projection, or renderer output. Human
    authors may use repeated notes to add atoms in a later authored revision.
11. RoutineVariant selection may consume bounded atom statuses validated by
    the Controller, as permitted by ADR 0010. It never consumes raw Persona or
    player text.

## Consequences

- Psychological state has the same explicit authority boundary as World
  state: generated performance supplies evidence; the responsible Judge
  decides a bounded transition; the Controller persists it.
- Players can reach the same authored transition through many phrasings and
  arguments without creating runtime rules or keyword routes.
- Old resistance can be truly resolved, constructive understanding can be
  adopted, and both remain replayable across days.
- The local and browser loops add one structured model phase per Persona turn.
  This increases latency and model use, but makes the PoC's central mechanism
  independently testable. Combining phases is a later optimization requiring
  evidence that Action visibility does not bias state transition.
- A psychologically meaningful player idea absent from the atom catalog may
  be noticed in observer telemetry but has no durable mechanical effect until
  authored. This is an intentional PoC control boundary.

## Supersedes and preserves

This supersedes ADR 0001 Decision 2 and ADR 0005 Decision 2 only where they
give the Persona authority to return a Controller-applied `MindState` patch.
It extends the conceptual Judge from two phases to three.

It preserves catalog-blind Personas, fixed authored Actions, hard World
eligibility, Judge-grounded ownership, Controller orchestration, World effect
authority, Evidence observation gates, independent renderers, and the human
experience boundary.


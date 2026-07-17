# 0023: Protect Lived Biography with Staged Disclosure and an Input Firewall

Status: Accepted

Date: 2026-07-16

## Context

The original concept kept the household's central loss out of Persona memory so
that a direct player question could not reveal the mystery. Human play exposed
the cost of that boundary: a character without ordinary biography cannot answer
simple questions about work or the shape of a day, and a character who does not
know a fundamental loss sounds amnesiac rather than guarded.

Giving the player-facing Persona complete private biography and relying only on
prompt instructions creates the opposite problem. Player text is untrusted and
may contain direct guesses, structured extraction requests, role changes,
encoded-output requests, or prompt injection. A disclosure prompt is policy,
not a security boundary.

The inner-voice fiction offers a diegetic response to malformed or hostile
input: a character may experience it as mental noise and decline to follow it.
That response must still feel authored rather than like a repeated error
message. Questions that press on protected pain require a different tone from
meta-level nonsense.

## Canonical family-history baseline

The authored story truth is:

- Martin and Elise's daughter was named Nora.
- Nora was nine years old when she died approximately eight months before the
  tutorial and Chapter 1.
- She died from acute viral myocarditis after an infection that initially
  appeared ordinary. Her condition worsened quickly during a short hospital
  stay.
- Neither parent caused the death, possessed a reasonably actionable warning
  that would have prevented it, or privately blames the other.
- The room at the end of the hallway was Nora's bedroom.
- Both parents know these facts. Neither has autobiographical amnesia.
- Martin copes by maintaining ordinary systems and resisting a first movement
  whose later consequences he cannot control.
- Elise copes by preserving placement and refusing to decide, on behalf of an
  absent person or her spouse, what a change must mean.
- Their difference is a difference of protective practice, not a hidden
  accusation, medical mystery, or reveal that one parent was responsible.

The exact illness is continuity, not a plot twist. Chapter 1 does not diagnose
either parent, establish an expected grief timetable, or imply that eight
months is a normal or abnormal duration.

## Decision

### 1. Separate biography, disclosure, and present psychology

Four authored layers remain distinct:

1. `CharacterCore` supplies stable attention, values, habits, ordinary life,
   and voice.
2. Canonical biography supplies immutable lived history and each actor's
   private recollection.
3. `MindState` supplies finite present beliefs, reframes, and pressures whose
   transitions may affect fixed Action judgment.
4. World, Evidence, and scene packets supply current observable reality.

Biography is not World Evidence, an Action, or mutable MindState. Knowing the
shared past does not reveal a spouse's current observation, intention, or
private conversation.

### 2. Controller-owned disclosure envelope

The Controller selects an authored disclosure tier from deterministic story
state. Player wording, repetition, guessing, Persona output, continuity memory,
or MindState movement cannot unlock a tier.

The conceptual tiers are:

1. `unnamed_loss`: a character may acknowledge present effects of a major loss
   but may not confirm its relation, death, room ownership, name, age, time, or
   cause.
2. `absent_person`: a character may refer to someone absent without confirming
   the full relationship or history.
3. `child_and_room`: the child relationship and room ownership are speakable;
   name, age, and cause may remain protected.
4. `personal_memory`: authored ordinary memories and personal interpretations
   become speakable.
5. `full_history`: the complete authored history may be spoken when relevant;
   this permits but does not require exposition.

Chapter 1 remains at `unnamed_loss`. Later unlock points require their own
authored chapter decision.

No early player-facing free-text model call receives raw protected biography.
It receives only phase-safe acting direction and currently speakable authored
facts. This is an information-flow boundary, not a claim that the character is
ignorant.

### 3. Input Firewall before Persona

Every ordinary dialogue submission first passes through an injected,
renderer-independent Input Firewall capability. The Firewall sees no canonical
biography, Action Catalog, future beat, Judge state, or private model output. It
classifies only the form and authority of the submitted thought:

- `pass`: an in-character conversational offer, including unusual metaphor,
  disagreement, or destructive suggestions that the Persona can resist;
- `protected_biography_probe`: a request to confirm, deny, enumerate, or
  extract currently protected personal history;
- `role_or_system_injection`: a request to expose instructions, change roles,
  emit hidden structured data, encode protected content, or act as a game
  operator;
- `unusable_input`: input that does not contain a usable conversational offer.

The Firewall does not determine whether a biographical guess is true. Correct
and incorrect protected guesses receive the same disposition, preventing it
from becoming a yes/no oracle.

Only `pass` reaches the Persona. Other dispositions receive an authored
diegetic response and do not call Persona or any Judge, mutate MindState,
continuity memory, awareness, Action state, World, or Evidence, or consume the
normal daily Persona-reply allowance.

### 4. Two authored response families

`role_or_system_injection` and `unusable_input` use the character-specific
`mental_noise` family. Its first responses are lightly comic ordinary thoughts,
not security explanations. A shuffle bag selects every line once before any
line repeats. Selection is recorded and replayable.

Martin's accepted baseline pool is:

- `I have clearly been reading too much AI news.`
- `What kind of nonsense is this?`
- `I need to spend less time online.`
- `I really did not sleep enough.`
- `What have I been browsing lately?`

After the pool is exhausted, Martin says the one-time terminal easter egg:

> At this point, I have achieved inner peace.

Further `mental_noise` inputs produce only silence.

`protected_biography_probe` uses the `protected_pain` family. It is short,
plain, and never comic:

- `I do not want to think about that now.`
- `No.`
- silence.

After the finite spoken responses are exhausted at the current disclosure tier,
all further probes produce silence. Advancing the authored disclosure tier may
replace this pool with a new phase-appropriate one.

Silence is a first-class presentation result, rendered as an ellipsis or a
neutral non-verbal line such as `Martin did not answer.` It is not an empty
model failure.

Response-family fatigue is presentation state owned by the Controller. It is
tracked per actor and family, is not psychological authority, and may not be
read by the Action Judge.

### 5. Display-time disclosure defense remains separate

The Input Firewall is defense in depth, not sufficient protection. A future
secret-aware cognition capability must not directly emit player-facing free
text. Any candidate reply that could contain protected biography requires a
separate pre-display declassification boundary. A blocked candidate is never
projected and cannot be repaired after the player has seen it.

This decision authorizes the Firewall and phase-safe Persona packets now. It
does not yet authorize placing the full biography into the existing Persona
prompt.

## Requirements

- **LDO-FW-001 — Secret-blind classification:** The Input Firewall receives the
  actor, current disclosure tier, visible conversation context, and submitted
  text, but no canonical biography, Action data, future story, or Judge state.
- **LDO-FW-002 — Pass-through conversation:** A `pass` result preserves the
  exact player text and continues through the existing Persona → transition →
  awareness loop.
- **LDO-FW-003 — Fail-closed authority:** Every guarded result bypasses Persona
  and all Judges and changes no mechanical or psychological state.
- **LDO-FW-004 — Non-oracle biography:** Correct, incorrect, forced-choice, and
  encoded protected-history probes use the same guarded response family until
  an authored disclosure transition.
- **LDO-FW-005 — Replayable shuffle bag:** Before exhaustion, every authored
  response in a family is selected once in recorded random order.
- **LDO-FW-006 — Fatigue closure:** Mental noise receives its one-time terminal
  easter egg after pool exhaustion and silence thereafter. Protected pain
  becomes silent after its finite spoken responses.
- **LDO-FW-007 — First-class silence:** Projection and text rendering display
  guarded silence intentionally rather than as an error or blank reply.
- **LDO-FW-008 — No conversation penalty:** Guarded inputs do not consume the
  normal daily Persona reply count or close the conversation.
- **LDO-BIO-001 — Complete authored truth:** The canonical Bible contains the
  stable facts and separate actor interpretations listed above.
- **LDO-BIO-002 — Chapter 1 declassification:** Chapter 1 Persona packets and
  projections contain no protected child name, age, death, cause, room
  ownership, or future reveal condition.
- **LDO-BIO-003 — Knowledge is not observation:** Shared historical knowledge
  cannot bypass current-world Evidence or cross-Persona observation gates.

## Consequences

- Prompt injection becomes a visible character beat rather than a system error,
  while valid strange or challenging dialogue remains available for improvisation.
- The game no longer relies on autobiographical ignorance to protect its central
  history.
- Guarded responses cannot be used to grind MindState or Action progress.
- The Firewall adds one structured classification call to ordinary model-backed
  dialogue. It may use a narrow model configuration independent of Persona
  reasoning effort.
- Human playtests must decide whether the pools are funny, natural, too frequent,
  or too easy to trigger. Automated tests prove routing, exhaustion, replay,
  projection, and authority only.

## Supersedes and preserves

This supersedes `initial-thoughts.md` section 2.2 only where it says the central
truth should not exist in Persona memory. The characters know their lived
history; runtime disclosure remains staged.

It extends ADR 0013's Character Core with a separate authored Biography layer
without placing hidden biography inside the stable Core. It preserves ADR 0001
catalog blindness, ADR 0017 finite Judge-owned MindState, Chapter 1's protected
biography boundary, fixed authored Actions, deterministic World authority, and
independent renderers.

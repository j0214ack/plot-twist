# 0002: Separate World Simulation from Layered Rendering through GameView

Status: Accepted for the PoC vertical slice

Date: 2026-07-16

## Context

The PoC world must keep moving while unpaused. NPCs execute authored daily
routines, and selected authored narrative Actions may later alter the world and
create Evidence. The Game Controller also owns semantic interaction state such
as pause mode, selected NPC, dialogue, pending work, errors, and surfaced Action
options. The first renderer may be text, while a later renderer may use 2D, 3D,
or another visual engine with a UI overlay.

If tests inspect only `GameState`, they can prove state correctness but not that
the causal loop is legible through a player-facing presentation. If a renderer
reads the complete `GameState`, it can accidentally expose Persona MindState,
unobserved Evidence, Action Catalog entries, internal IDs, or future beats.

## Options considered

1. **No renderer in the first slice.** Assert only GameState and domain events.
   This is the smallest implementation, but it does not validate presentation
   independence or player-visible causal order.
2. **Let one renderer read GameState and Game Controller directly.** This is
   quick initially, but couples presentation to hidden domain and orchestration
   structure and makes accidental leaks likely.
3. **Project one safe GameView into one combined renderer.** This prevents
   private-state leaks, but forces world-scene and UI-overlay concerns into one
   adapter even when the visual technology and input ownership differ.
4. **Project separate WorldView and UIView values, render them independently,
   then compose layers.** This is accepted. It matches common game-engine scene
   plus UI-overlay topology without making the domain depend on an engine.
5. **Put presentation strings or animation commands inside Actions.** This
   makes an authored sequence easy to display, but reverses the dependency:
   domain behavior would know which renderer exists. This is rejected.

All options assume that text and visual renderers can express the same visible
world facts and semantic UI state. If a future visual renderer needs
interpolation or animation timing, those become renderer-local state or
presentation cues rather than mutations of domain rules.

## Pattern definition

This is a ports-and-adapters-style boundary in a narrow sense: simulation and
the Game Controller own semantic state; projectors emit renderer-neutral views;
replaceable world and UI renderers are pure consumers of those views. A
compositor places their outputs in ordered layers. It does not require a
general plugin framework, render graph, or second process.

## Decision

1. `RoutineBehavior` and `NarrativeAction` are separate authored domain
   concepts.
   - RoutineBehavior is scheduled, autonomous, repeatable, and never evaluated
     by the Action Judge.
   - NarrativeAction is fixed in the Action Catalog, may be surfaced through
     Persona conversation and Action Judge decisions, and executes only through
     the World Engine.
2. Every executed routine or narrative Action may append a `GameEvent`, but a
   GameEvent does not automatically become Evidence.
3. Evidence is created or activated only by an explicit authored world effect.
   Evidence descriptions are neutral observable state, not interpretation.
4. Observation is a domain transition. An NPC knows Evidence only after the
   deterministic World Engine records a valid observation.
5. GameState remains the simulation source of truth. Game Controller state owns
   semantic interaction state. Neither raw state object is a renderer input.
6. A `GameProjector` produces a `GameView` with two independent projections:
   - `WorldView`: player-visible time, pause state, actors, objects, and world
     presentation cues;
   - `UIView`: interaction mode, selected NPC, dialogue messages, pending/error
     status, and neutral player-facing Action options.
7. `WorldRenderer` consumes only WorldView. `UIRenderer` consumes only UIView.
   A compositor combines their outputs with UI above the world layer.
8. Renderers cannot advance time, choose routines, execute Actions, create
   Evidence, record observations, call LLMs, dispatch commands, or mutate the
   Game Controller.
9. Input is a separate boundary. UI hit-testing gets first opportunity to emit
   a `PlayerCommand`; otherwise world picking may emit one. The Game Controller
   dispatches commands to the World or conversation services.
10. A visual adapter may implement world rendering, UI rendering, composition,
    and hit-testing in one engine, but these responsibilities remain separate
    interfaces internally.
11. The text vertical slice uses separate `WorldTextRenderer` and
    `UITextRenderer` adapters plus a text compositor. They are real
    presentation adapters, not debug dumps, and must not print private
    MindState, Action IDs, Evidence IDs, Action Judge output, or future state.
12. Distinct visible behaviors that produce different domain state transitions
   are distinct authored NarrativeActions. Variants are reserved for authored
   alternatives with equivalent completion semantics.

## Consequences

- Core behavior can be tested headlessly through the World Engine's public
  capabilities.
- Text acceptance tests can validate the player-visible causal timeline and UI
  state before any visual engine exists.
- Visual world and UI renderers can replace their text counterparts without
  changing routine, narrative Action, Evidence, observation, or command rules.
- Presentation leaks become testable by asserting that WorldView excludes
  private fields and internal IDs.
- Projectors are trusted application code and must have contract tests;
  renderers remain deliberately ignorant of raw GameState and Controller state.
- Renderer-local hover, focus animation, camera interpolation, scroll position,
  and animation frame state do not enter Game Controller state unless they
  change semantic interaction.

## Supersedes

No accepted record is superseded. This extends decision 0001, which keeps
Personas catalog-blind and gives authored Action decisions to the Action Judge.

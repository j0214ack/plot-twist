# Repository working agreement

## Development workflow: TDD is required

All behavior changes in this repository must follow test-driven development.

1. **Red:** write the smallest test that describes the next observable behavior before writing its implementation. Run it and confirm it fails for the intended reason.
2. **Green:** write only enough production code to make that test pass.
3. **Refactor:** improve names and structure only while the relevant tests remain green, then run the full suite.

Additional requirements:

- Every bug fix starts with a regression test that reproduces the bug.
- Game SDK and `MechanicModule` behavior must be tested through their public capability interfaces. Tests must not make generated modules depend on Game Host internals.
- Protected state, ownership cleanup, rollback, Mana adjustments and cross-spell references require automated tests.
- For browser-only interaction or rendering behavior, add an automated browser acceptance test before implementation when the browser harness exists. Until then, keep rendering thin and put behavior in tested renderer-independent modules.
- Documentation-only, build configuration and purely visual asset changes do not require a new failing test, but must not change untested runtime behavior.
- Before handing work off, run at least `npm test` and `npm run build`. Both must pass.

Do not add implementation first and promise to backfill tests later.

## Spec traceability is required

TDD does not replace the product specification. Before starting each red-green-refactor cycle:

1. Identify the exact requirement, hypothesis or accepted decision that authorizes the behavior.
2. Put its ID or document section in the test name or a nearby `Spec:` comment.
3. Re-read the relevant source-of-truth section, including its phase boundary and non-goals.
4. If no requirement authorizes the behavior, stop and update or escalate the specification before writing the test.

At the end of each implementation phase, re-check the PoC's "暫不處理", validation gates and accepted decisions before selecting the next failing test.

Reference harness tests may prove only that the public Game SDK is sufficient, protected and composable. They must not grow a mock natural-language parser, keyword router or preset skill system to imitate the later generative compiler. A language failure becomes an LLM eval fixture, not another mock branch.

## PoC source of truth

Read these before changing The Unwritten Spell runtime:

- `pocs/the-unwritten-spell/README.md`
- `pocs/the-unwritten-spell/design.md`
- `pocs/the-unwritten-spell/game-sdk.md`
- `pocs/the-unwritten-spell/validation-plan.md`
- accepted records under `pocs/the-unwritten-spell/decisions/`

If implementation would reverse an accepted decision, update or supersede the decision record explicitly instead of silently drifting from it.

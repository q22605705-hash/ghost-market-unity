# Survivor Agent Team

This project uses four specialist agents plus one main integrator.

## Main Integrator

Owner: current Codex thread.

Responsibilities:

- Keep the product direction coherent.
- Assign work from `NEXT_ACTIONS.md`.
- Integrate agent outputs.
- Run final checks and decide what ships.
- Handle GPT image generation requests directly.
- Update `progress.md` after verified work.

## Planning Agent

Owns:

- `NEXT_ACTIONS.md`
- roadmap / backlog docs
- acceptance criteria

Does:

- Turns the high-level game goal into small production loops.
- Prioritizes UI, content, combat, progression, and visual work.
- Defines what "done" means for each loop.
- Keeps agent responsibilities disjoint.

Does not:

- Edit `survivor/game.js`.
- Change assets.
- Run broad refactors.

## Coding Agent

Owns:

- Focused gameplay or UI implementation in `survivor/game.js`.
- `survivor/index.html` only when cache/version/title changes are needed.

Does:

- Implements one bounded player-facing improvement at a time.
- Keeps changes compatible with existing `render_game_to_text` state.
- Adds or reuses debug hooks only when needed for deterministic QA.

Does not:

- Edit planning docs unless asked.
- Edit binary assets.
- Rewrite the game into modules during content loops.

## Testing Agent

Owns:

- `scripts/playtest-survivor-loop.mjs`
- package-level test commands
- Playwright loop coverage

Does:

- Adds deterministic loop tests.
- Verifies console errors, failed requests, mode transitions, and exposed state.
- Saves screenshots and JSON under `survivor/test-artifacts/`.

Does not:

- Change game behavior except by requesting missing debug hooks.
- Delete historical artifacts.

## Image / Cutout Agent

Owns:

- asset pipeline notes
- prompt/cutout specs
- visual asset gap lists

Does:

- Audits `scripts/*asset*`, `scripts/*sheet*`, `survivor/assets/`, and test screenshots.
- Defines what images are needed next.
- Gives prompt briefs and cutout requirements to the Main Integrator.

Does not:

- Generate GPT images directly.
- Edit binary images without explicit approval.
- Change gameplay code.

## Handoff Format

Each agent should return:

- Files changed.
- What changed.
- How it was verified.
- Any risks or follow-up tasks.

## Conflict Rules

- Agents must assume other changes may exist.
- Do not revert unknown edits.
- If two agents need the same file, the Main Integrator decides order and merges manually.
- Prefer small patches over broad rewrites.

## Current Product Priority

The game still feels too simple. The next loops should improve:

- normal-run damage readability
- upgrade and pause testing coverage
- richer combat events and enemy patterns
- clearer UI guidance
- stronger art direction and asset consistency

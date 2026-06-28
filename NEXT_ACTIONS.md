# Survivor Loop Workflow

This file is the project-level loop plan for continuing the `survivor` browser roguelite.

## Current Objective

Make `survivor/` feel like a complete roguelite product: readable combat, satisfying progression, clear run goals, strong visual feedback, richer content depth, and repeatable QA.

## Production Plan

Detailed 4-agent production roadmap: `docs/roadmap/2026-06-22-ui-content-depth-plan.md`.

Use that roadmap for agent ownership, backlog order, acceptance criteria, and the next three production loops. Keep this file as the shorter working queue.

## Loop Contract

Each product loop should stay small enough to finish and verify in one pass.

1. Read `HANDOFF_ROGUELITE.md`, `progress.md`, this file, and the roadmap above.
2. Pick one player-facing improvement from the queue below.
3. Change the smallest set of files, usually `survivor/game.js`, `survivor/index.html`, `scripts/playtest-survivor-loop.mjs`, and `progress.md`.
4. Run static checks:

```powershell
node --check survivor\game.js
node --check scripts\playtest-survivor-loop.mjs
npx.cmd tsc --pretty false
git diff --check -- survivor/game.js survivor/index.html scripts/playtest-survivor-loop.mjs progress.md HANDOFF_ROGUELITE.md NEXT_ACTIONS.md docs/roadmap/2026-06-22-ui-content-depth-plan.md
```

5. Run at least one loop playtest:

```powershell
npm run loop:smoke
npm run loop:result-damage
```

Add the new loop script listed in the selected backlog item before marking that item complete.

6. Inspect screenshots in `survivor/test-artifacts/`.
7. Append a dated entry to `progress.md` with the change, checks, and screenshot/result paths.
8. Update this file if the next best action changes.

## Ready Playtests

- `npm run loop:smoke`
  Loads the `survivor` page through a local static server, verifies `render_game_to_text`, and captures `survivor/test-artifacts/loop-smoke-menu.png`.

- `npm run loop:result-damage`
  Forces Boss and final-Boss damage, enters result mode, verifies `resultDamageSources` and `resultBuildAdvice`, and captures `survivor/test-artifacts/loop-result-damage-readout.png`.

- `npm run loop:pause-info`
  Seeds a fire build and one readable damage source, opens Pause > Skills/Stats/Missions, verifies skill details, damage sources, objective compass, run log, and mission rows, and captures `survivor/test-artifacts/loop-pause-info-skills.png`, `survivor/test-artifacts/loop-pause-info-stats.png`, and `survivor/test-artifacts/loop-pause-info-missions.png`.

- `npm run loop:combat-readability`
  Seeds representative normal combat sources, verifies at least five non-debug damage-source names plus a readable player-hit source, and captures `survivor/test-artifacts/loop-combat-readability.png`.

- `npm run loop:upgrade-choice`
  Pre-levels 火系符脈 to Lv.4, forces a 3-card level-up (near-evolution / utility / off-plan), verifies the `levelChoice` recommendation and card metadata, picks the recommended card, confirms the run resumes with the 炎王符 evolution applied, and captures `survivor/test-artifacts/loop-upgrade-choice.png` and `loop-upgrade-choice-resumed.png`.

## Next Product Queue

1. Agent D - Artifact cleanup and QA hygiene.
   Decide which screenshots/JSON should live under `survivor/test-artifacts/`, which root-level evidence is retained, and which generated patterns belong in `.gitignore`. Do not delete evidence without an explicit cleanup decision. Add a short inventory note to `progress.md` or a docs file.

## Next Three Loops

1. Loop 1: Agents A and B work in parallel if branches/worktrees are available. Merge A first if both touch damage or upgrade recommendation text.
2. Loop 2: Agent C builds pause/info coverage after A's damage-source labels exist, then verifies the pause panels against the expanded combat state.
3. Loop 3: Agent D cleans generated-artifact policy after A-C create their new screenshots/JSON, so the cleanup decision covers the final evidence shape.

## Completed Loop Items

- 2026-06-21: Added result-screen build advice from damage sources, including `resultBuildAdvice` state and `loop:result-damage` coverage.
- 2026-06-22: Added a 4-agent UI/content-depth production roadmap and aligned this queue to the next three loops.
- 2026-06-22: Added `loop:pause-info` and verified Pause > Skills/Stats/Missions screenshots plus JSON state coverage.
- 2026-06-22: Added `loop:combat-readability` and a deterministic normal-source seed covering符咒、燃燒、毒傷、旋刃、召喚、Boss 法彈受擊提示.
- 2026-06-28: Agent B done — added `debug_choose_upgrade` and `loop:upgrade-choice`, verifying the level-up recommendation, card metadata, deterministic evolve pick, and run resume. Loop 1 is now complete; next is Agent D artifact cleanup.

## Do Not Do Yet

- Do not migrate the whole project to Unreal before the browser version has a stable, fun core loop.
- Do not delete old screenshots or untracked playtest JSON without an explicit cleanup decision.
- Do not rewrite `survivor/game.js` into modules until tests cover the current flows well enough.
- Do not let multiple agents edit the same game files in the same branch without a handoff note.

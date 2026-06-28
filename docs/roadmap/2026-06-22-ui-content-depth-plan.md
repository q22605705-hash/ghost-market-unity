# UI Content Depth Production Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for parallel execution or `superpowers:executing-plans` for single-agent execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the survivor roguelite's UI/content depth through four coordinated, testable production slices.

**Architecture:** Keep the browser roguelite in `survivor/` as the active product path and treat `UnityProject/` as out of scope. Each agent owns one narrow player-facing slice, adds deterministic Playwright coverage through `scripts/playtest-survivor-loop.mjs`, and records verification in `progress.md`.

**Tech Stack:** Plain JavaScript canvas game in `survivor/game.js`, static shell in `survivor/index.html`, Node/Playwright loop harness in `scripts/playtest-survivor-loop.mjs`, npm scripts in `package.json`.

---

## Source Context

Planning inputs read on 2026-06-22:

- `HANDOFF_ROGUELITE.md`: Active workstream is the `survivor/` browser roguelite; current priority is readable combat, deeper roguelite loops, run rewards, Boss/final-Boss feedback, and repeatable QA.
- `NEXT_ACTIONS.md`: Current queue lists combat readability, `loop:upgrade-choice`, `loop:pause-info`, and artifact cleanup.
- `progress.md`: Recent work added result damage readouts, result build advice, loop smoke/result-damage harnesses, pause run logs, threat/radar panels, objective compass, collection/result progress, and settings accessibility.

## Files And Ownership

- `survivor/game.js`: Agents A-C may touch this only for their assigned UI/content slice. Agent D should not touch game behavior unless cleanup policy reveals a broken artifact reference.
- `survivor/index.html`: Agents A-C may update cache version or shell metadata only when their runtime changes need it.
- `scripts/playtest-survivor-loop.mjs`: Agents A-C add one deterministic loop case each. Agent D may add artifact inventory checks only if needed.
- `package.json`: Agents A-C add one npm script for their loop case.
- `progress.md`: Every implementation agent appends a dated entry with exact checks and artifact paths.
- `NEXT_ACTIONS.md`: Planning agent owns the queue. Implementation agents update it only when their completed slice changes the next best action.
- `docs/roadmap/2026-06-22-ui-content-depth-plan.md`: Planning reference. Update only when ownership, order, or acceptance criteria change.

## Prioritized Backlog

### P0 - Agent A: Combat Readability And Damage Source Names

**Player value:** Normal runs should tell the player what dealt damage and what caused HP loss without relying on debug labels.

**Files:**
- Modify: `survivor/game.js`
- Modify: `scripts/playtest-survivor-loop.mjs`
- Modify: `package.json`
- Modify: `progress.md`

**Scope:**
- Audit all normal `damageEnemy` call paths and ensure source labels are readable for talisman shots, orbit blades, summons, burn/poison ticks, elemental/evolved skills, Boss/final-Boss damage, hazards, enemy contact, and enemy projectiles.
- Keep debug labels clearly marked as debug-only.
- Add `loop:combat-readability` to force representative normal combat sources and assert `render_game_to_text().damageSources` contains readable non-debug names.

**Acceptance criteria:**
- `render_game_to_text().damageSources` shows at least five non-debug player damage sources after the deterministic playtest.
- Pause > Stats and result damage readouts use the same source labels.
- Enemy HP-loss and player HP-loss readouts distinguish contact, projectile, hazard, Boss seal, and debug damage.
- Screenshot and JSON evidence land under `survivor/test-artifacts/`.

**Verification commands:**

```powershell
node --check survivor\game.js
node --check scripts\playtest-survivor-loop.mjs
npx.cmd tsc --pretty false
npm run loop:combat-readability
npm run loop:result-damage
```

### P1 - Agent B: Upgrade Choice Content Depth

**Player value:** Level-up choices should feel intentional, with recommendation text, visible build direction, evolution pressure, and reliable resume behavior.

**Files:**
- Modify: `survivor/game.js`
- Modify: `scripts/playtest-survivor-loop.mjs`
- Modify: `package.json`
- Modify: `progress.md`

**Scope:**
- Add `loop:upgrade-choice`.
- Force a level-up choice set containing one near-evolution card, one utility card, and one off-plan card.
- Verify `render_game_to_text().levelChoice` exposes recommendation headline, recommendation reason, card levels, family/type labels, and selected-card result.
- Pick a card and confirm mode returns to `playing`, build progress updates, and no overlay remains.

**Acceptance criteria:**
- The recommended card is deterministic for the forced choice set.
- The screenshot shows the recommended card without text clipping or overlapping the card footer.
- The JSON result confirms mode returns to `playing` and the chosen skill level/evolution state changes.
- The loop runs without console errors, failed requests, or 400/404 responses.

**Verification commands:**

```powershell
node --check survivor\game.js
node --check scripts\playtest-survivor-loop.mjs
npx.cmd tsc --pretty false
npm run loop:upgrade-choice
npm run loop:smoke
```

### P1 - Agent C: Pause/Info Inspection Depth

**Player value:** The player should be able to pause mid-run and understand objectives, threats, build state, damage sources, run log, and radar state at a glance.

**Files:**
- Modify: `survivor/game.js`
- Modify: `scripts/playtest-survivor-loop.mjs`
- Modify: `package.json`
- Modify: `progress.md`

**Scope:**
- Add `loop:pause-info`.
- Enter a run, seed enemies/hazards/pickups/Boss warning/build progress/damage sources, then open Pause > Stats and Pause > Missions.
- Verify `pausePanel` includes damage sources, run log, objective compass, threat summary, radar/minimap summary, and build progress.
- Inspect screenshots for panel overlap, bottom-button clipping, and unreadable text.

**Acceptance criteria:**
- Stats view exposes current damage sources and latest hit source.
- Missions view exposes objective compass and run log.
- Threat/radar/build panels are represented in text state and visibly separated in screenshots.
- The playtest saves separate Stats and Missions screenshots under `survivor/test-artifacts/`.

**Verification commands:**

```powershell
node --check survivor\game.js
node --check scripts\playtest-survivor-loop.mjs
npx.cmd tsc --pretty false
npm run loop:pause-info
npm run loop:result-damage
```

### P2 - Agent D: Artifact Cleanup And QA Hygiene

**Player value:** Future agents can trust the evidence folders and avoid bloating the repo with stale screenshots or ambiguous generated files.

**Files:**
- Modify: `.gitignore` only if a cleanup policy is approved by the current owner.
- Modify: `NEXT_ACTIONS.md`
- Modify: `progress.md`
- Optionally create: `docs/roadmap/artifact-policy.md`

**Scope:**
- Inventory root-level screenshots/JSON, `survivor/test-artifacts/`, and old playtest result files.
- Propose categories: committed evidence, generated local evidence, temporary scratch, and must-keep references.
- Do not delete files unless the user explicitly approves deletion.
- If `.gitignore` changes are made, keep patterns narrow enough to avoid hiding source assets or accepted evidence.

**Acceptance criteria:**
- A written artifact policy exists in docs or `progress.md`.
- `NEXT_ACTIONS.md` states which evidence paths future agents should use.
- No source art, accepted sprite sheets, or handoff docs are moved or deleted.
- `git status --short` remains explainable after the cleanup policy pass.

**Verification commands:**

```powershell
git status --short
git diff --check -- .gitignore NEXT_ACTIONS.md progress.md docs/roadmap/artifact-policy.md
```

## Four-Agent Responsibilities

Agent A owns combat readability. It works closest to damage state, damage labels, player-hit sources, Pause > Stats, and result damage panels.

Agent B owns upgrade choice depth. It works closest to level-up cards, recommendation rules, evolution messaging, card click/keyboard paths, and the `loop:upgrade-choice` script.

Agent C owns pause/info inspection. It works closest to pause tabs, objective compass, run log, build progress, threat/radar summaries, and pause screenshots.

Agent D owns QA hygiene. It works after the first three agents have produced artifacts, then documents how generated evidence should be retained or ignored.

## Cross-Agent Rules

- Do not edit `UnityProject/`.
- Do not rewrite `survivor/game.js` into modules during these loops.
- Do not delete old screenshots or JSON without explicit approval.
- If two agents both need `survivor/game.js`, merge in this order: Agent A, Agent B, Agent C.
- Each agent must append to `progress.md`; no agent should rewrite older progress entries.
- Each new loop script must save both screenshot and JSON evidence under `survivor/test-artifacts/`.
- Each agent should run only the verification commands needed for its slice plus one existing regression loop.

## Next Three Loops

### Loop 1 - Damage And Upgrade Foundations

- [x] Agent A implements combat readability labels and `loop:combat-readability`.
- [x] Agent B implements `loop:upgrade-choice` after checking whether Agent A changed shared recommendation/damage text. (2026-06-28; added `debug_choose_upgrade`.)
- [x] Planning check: confirm both loops save artifacts in `survivor/test-artifacts/` and append progress entries.

Loop 1 exit criteria:
- `npm run loop:combat-readability` passes.
- `npm run loop:upgrade-choice` passes.
- `npm run loop:result-damage` still passes.
- `progress.md` has dated entries for both slices.

### Loop 2 - Pause Inspection Pass

- [ ] Agent C implements `loop:pause-info`.
- [ ] Agent C verifies Pause > Stats after Agent A's damage labels are present.
- [ ] Agent C verifies Pause > Missions after existing objective compass/run-log/radar data is seeded.

Loop 2 exit criteria:
- `npm run loop:pause-info` passes.
- Pause Stats and Missions screenshots are visually inspected.
- No panel text overlaps bottom buttons, top HUD, or right-side tracker areas.

### Loop 3 - Evidence Policy And Queue Reset

- [ ] Agent D inventories generated artifacts and writes the cleanup policy.
- [ ] Agent D updates `NEXT_ACTIONS.md` with the next queue after A-C complete.
- [ ] Planning check: identify the next content-depth theme, likely enemy/Boss variety, run rewards, or collection progression.

Loop 3 exit criteria:
- Artifact policy is documented.
- No evidence is deleted without approval.
- `NEXT_ACTIONS.md` reflects the next product queue.
- `git status --short` can be summarized without mystery artifacts created by the loop scripts.

## Production Risks

- `survivor/game.js` is a shared large file, so agents must keep changes narrow and avoid opportunistic refactors.
- Existing Chinese text appears mojibaked in some docs and UI strings. Agents should preserve existing runtime text unless their slice requires a specific label update.
- Root-level screenshot sprawl is already large. New automation must write to `survivor/test-artifacts/`.
- Some files are already modified or untracked. Agents must not revert work they did not create.

## Planning Self-Review

- Spec coverage: The plan covers prioritized backlog, four-agent responsibilities, acceptance criteria, and the next three loops.
- Placeholder scan: No TBD/TODO/fill-in placeholders remain.
- Scope check: This planning pass changes docs only; implementation files are named for future agents but not edited here.

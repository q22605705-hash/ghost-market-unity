2026-06-10 survivor rebuild

Goal
- Replace the old action prototype with a new 2D pixel-art bullet-heaven / survivor game.
- Core loop: enemies keep approaching the player, ranged enemies fire projectiles, the player survives by moving, dashing, auto-attacking, collecting XP, and choosing upgrades.

Controls
- WASD / arrow keys: move.
- Shift / Space: dash.
- Mouse or number keys are used on the upgrade screen.

Gameplay implemented
- Static Canvas game, no Unity WebGL loader and no previous Phaser prototype.
- Auto-targeting talisman shots.
- Orbiting blade weapon.
- Chasing enemies, ranged mages, and tougher brute enemies.
- Enemy contact damage and enemy projectile damage.
- XP soul drops, pickup magnet, level-up pause, and three upgrade cards.
- Upgrade pool includes damage, attack speed, movement speed, magnet, max HP, orbit blade count, weapon area, pierce, and regeneration.
- XP pacing was rebalanced so early upgrades no longer fire every few seconds: initial level requirement is 20 XP, then scales with a steeper formula.
- XP pickups now only magnetize inside the player's pickup radius. The previous timed full-map auto-pull was removed.
- Base pickup radius is 135px; the magnet upgrade adds 30px per pick instead of jumping by 45px.
- Camera view was zoomed out to 0.78x so the player can read enemy pressure and pickup fields earlier.
- Enemy durability was increased while player base damage was reduced slightly: normal enemies no longer die in one hit, but are not full bullet sponges.
- Upgrade choices now include elemental branches. At level 2+, the player is offered Fire, Water, or Lightning affinity; after choosing one, future level-ups guarantee at least one matching branch upgrade.
- Fire branch: burn duration, explosion chance, and fire burst damage.
- Water branch: slow duration, area/control growth, and piercing shard chance.
- Lightning branch: chain jumps, crit bonus, and storm attack-speed scaling.
- A second GPT green-screen sheet was generated for skill visuals and normalized into survivor/assets/skill-effects.png.
- Skill effects now include Fire, Water, Lightning, Poison, Shadow, Holy, Wind, and upgrade-card icons.
- Added four additional branches:
- Poison: venom damage, poison cloud spread, and enemy damage weakening.
- Shadow: curse duration, low-health execute damage, and void burst scaling.
- Holy: hit-based healing, shield mitigation, and holy smite bonus damage.
- Wind: movement/dash tempo, cyclone visuals, and projectile split/pierce chance.

Art pipeline
- The approved GPT green-screen sheet is survivor/assets/raw/gpt-approved-survivor-greenscreen.png.
- The game now uses the approved black-cloaked swordsman / crawling beast / lantern mage / horned brute sheet instead of the later placeholder Taoist sheet.
- A component-based normalization pass removes the green screen, groups each sprite by connected components, and outputs survivor/assets/survivor-sprites.png.
- Character rows use a strict bottom-center feet anchor at x=64, y=112; effect rows use center anchor x=64, y=64.
- Verification confirmed all 12 frames in hero idle, hero run, beast, mage, and brute rows share bottom y=112 and center x around 64.
- Verification confirmed 1,261,102 transparent pixels and 0 opaque green pixels in survivor/assets/survivor-sprites.png.

Testing
- Local server smoke test returned HTTP 200.
- Playwright local menu and gameplay checks passed with screenshots.
- Long simulation reached around 75 seconds, level 13, 172 kills, 26 active enemies, ranged enemies and enemy bullets present, with no page errors or failed asset requests.
- After integrating the approved GPT art, Playwright confirmed survivor-sprites.png loaded at 1536x1024 and gameplay actors are drawn from the PNG sheet.
- Anchor verification confirmed hero idle/run frames do not drift: center range 63.5-64 and foot bottom 112 for all frames.
- XP rebalance test: stationary play died around 35s at Lv1 with 63 pickups left on the field, confirming distant XP no longer auto-pulls.
- XP rebalance test with movement reached around 51s at Lv4 with no console errors or failed requests.
- Zoom/element test reached around 58s at Lv5 with 57 kills and 66 enemies alive, confirming enemies survive longer and pressure is readable at the wider zoom.
- Level-up logs confirmed Lv2 offered elemental affinities and later level-ups offered the selected element's branch upgrades.
- Skill visual test confirmed skill-effects.png loads at 1024x768 with 0 opaque green pixels, Lv2 can offer new branches such as Wind, and later level-ups guarantee matching branch upgrades.

2026-06-12 cute non-pixel art pass

- Generated a new GPT white-matte cartoon survivor sheet based on the user's cute dark hooded reference direction, without copying the referenced character exactly.
- Added scripts/normalize-cute-cartoon-survivor-sheet.mjs to remove edge-connected matte, clean bottom ground-shadow remnants, and anchor character rows at bottom-center.
- Replaced survivor/assets/survivor-sprites.png with the cute non-pixel hero, rounded shadow enemy, lantern caster, stone brute, teal soul pickups, teal projectiles, and talisman/blade frames.
- Added survivor/assets/survivor-art.json and survivor/assets/survivor-art-quality.json verification output for 96 placements.
- Updated the game background toward a softer dark teal fantasy floor instead of the previous hard cyber grid.
- Added upgrade icon fallbacks for neutral/base upgrades, including 劍符增傷, 聚魂鈴, 護命符, 大符紙, 穿透符, and 回春印.
- Local Playwright test confirmed no console errors, no failed requests, survivor-sprites.png loaded at 1536x1024, and upgrade cards display the new icons centered in their circles.
- Anchor sanity check confirmed hero idle/run frames remain centered around x=63.5 and run bottoms stay near y=112, reducing frame-to-frame drift.
- Note: the installed develop-web-game client could not resolve Playwright from the skill directory, so verification used the project's own Playwright dependency through an inline script instead.

2026-06-12 copyright-safety art revision

- User flagged the first cute dark hero as too close to the provided reference. Replaced it immediately with a legally distinct original paper-talisman spirit mage direction.
- New hero avoids cat ears, animal hood silhouette, yellow half-lidded eyes, teal pendant, and floating spear. Its identifiers are a folded cream paper hat, black ink face, mint dot eyes, talisman ribbons, navy cloak, and small wooden charm wand.
- Regenerated the full 12x8 white-matte sheet with larger per-cell margins, replaced survivor/assets/raw/gpt-cute-cartoon-survivor-whitematte.png, and reran scripts/normalize-cute-cartoon-survivor-sheet.mjs.
- Adjusted the sprite quality gate so character rows remain strict while small effect frames can pass with a lower minimum opaque-pixel count.
- Local Playwright verification passed with no console errors or failed requests. Screenshots confirmed the game now shows the original paper-mage silhouette and upgrade icons still render correctly.

2026-06-12 cat-element hero revision

- User asked to add cat elements back into the protagonist while avoiding the earlier reference similarity risk.
- Replaced the hero with an original lucky-talisman cat mage: cream maneki-neko inspired face, red/gold ritual cap, talisman scarf ribbons, bell belt, brush tail, and calligraphy charm brush.
- Kept the design away from the risky reference markers: no black hooded cat silhouette, no yellow half-lidded eyes, no teal pendant, and no floating spear.
- Reran sprite normalization and verified 96 placements with no quality failures.
- Local Playwright verification passed with no console errors or failed requests. Hero idle/run anchors stayed centered around x=63.5 with bottom y=112.

2026-06-12 sprite pipeline correction

- User clarified the required image order: crop first, inspect the cropped image, reject and regenerate if GPT frames touch or merge, then create continuous action frames using the feet as the center anchor.
- Fixed normalize-cute-cartoon-survivor-sheet.mjs so hero idle/run rows use fixed-cell feet anchoring instead of visible bounding-box center. This prevents brush, tail, ribbons, and weapons from shifting the body anchor.
- Narrowed the luma-key matte detection so cream-white cat faces are not removed as background.
- Added pure-white residue cleanup for orphan matte pixels after crop/keying.
- Reran normalization and verified all 96 placements pass. Metadata now records hero sourceAnchor.mode as fixed-cell-feet.
- Local Playwright run/idle screenshots passed with no console errors or failed requests.

2026-06-13 hero anchor stopgap

- User reported the protagonist still visually drifts during animation. Re-tested locally with consecutive run screenshots before changing the asset again.
- Measurement showed the generated source strip itself has unstable body/face positions across frames, so merely anchoring the cell or bounding box is not enough.
- Updated the normalization script to detect hero body-face anchors, then added a conservative locked-stable-feet fallback for hero idle/run rows. The current shipped hero rows are 12-frame rows but each row is locked to one stable source column to eliminate visible drift.
- Verified by hash that all 12 idle cells match and all 12 run cells match, so sprite-frame playback cannot move the character within the draw anchor.
- Local Playwright run screenshots and idle screenshot passed with no console errors or failed requests.
- TODO for future art pass: generate or edit a new run strip from this locked source frame, then accept it only if crop inspection and body/feet center variance pass before use.

2026-06-13 IMAE reference pass and survivor structure upgrade

- User logged into the IMAE Guardian Girl web game in an isolated Chrome profile; used it only as gameplay/UI reference, not for copying or extracting copyrighted assets.
- Captured reference flow screenshots for title, home, stage select, combat, upgrade choices, and result/stat screens.
- Reworked survivor/game.js toward a short-mission survivor structure: first stage now targets 75 kills, combat clears into a result screen, and the menu is a stage-card selection instead of a plain start panel.
- Camera was pulled farther out to 0.68, Canvas/CSS smoothing changed away from forced pixelated rendering, and enemy/player values were rebalanced so normal foes take multiple hits without becoming long slogs.
- Upgrade UI now shows family/type pills, skill level text, large keyed icons, and a bottom skill-slot dock. Chosen upgrades are tracked with name, level, family, and active/passive type.
- HUD now shows wave, level, kill objective, timer, HP, dash, XP, current element, and top-right skill slots similar to a mobile survivor layout.
- Result screen now summarizes clear state, rank, time, kills, level, and the build taken during the run.
- Damage text aggregation now proves stacked damage is applied while hiding absurd x-counts from tiny DOT/rapid blade ticks.
- Final browser QA screenshots: survivor-final-menu.png, survivor-final-upgrade.png, survivor-final-gameplay.png.
- Final QA state after 31 seconds: playing, Lv4, 41/75 kills, 2 ranged enemies, 3 enemy bullets, 8 uncollected pickups, fire branch upgrades active, no console errors or failed requests.

2026-06-13 green-screen art rebuild and audio pass

- User rejected the previous delivery because music/SFX were missing, animation art was not truly rebuilt, white-edge artifacts remained, and the character still visually drifted.
- Generated a new original GPT green-screen sprite sheet with a cute chibi cat-talisman hero, shadow blob enemies, lantern caster, stone brute, soul crystals, elemental effects, talismans, and blade/projectile rows. The sheet is saved at survivor/assets/raw/gpt-cute-cartoon-survivor-greenmatte.png.
- Added scripts/normalize-green-cartoon-survivor-sheet.mjs for chroma-green keying, green spill cleanup, bottom-center character anchoring, and quality reporting.
- Added scripts/defringe-and-animate-survivor-sheet.mjs as a second gate that removes remaining white fringe, locks hero feet at y=112, and rebuilds hero idle/run into 12 visible frames without moving the feet.
- Final sprite quality report: hero idle centerRange 3, run centerRange 1.5, both bottomRange 0, both whiteEdgePixels 0.
- Added WebAudio background music and SFX for shooting, hit impact, player hurt, level-up, and clear. Audio starts after player input and can be toggled with M.
- Local browser QA screenshots: survivor-new-art-menu.png, survivor-new-art-start.png, survivor-new-art-gameplay.png.
- Local QA state after 18 seconds: playing, Lv3, 20/75 kills, one ranged enemy, three enemy bullets, two field pickups, audio enabled, no console errors or failed requests.

2026-06-13 full rendered asset audit correction

- User correctly challenged the claim that the game had been fully playtested: previous QA only exercised flow/screenshots and missed that skill-effects.png and gpt-skill-icons-whitematte.png were still in the render path.
- Removed all runtime references to the old white-matte skill effect/icon assets. The game now draws gameplay sprites, skill effects, projectiles, pickups, and upgrade icons from survivor/assets/survivor-sprites.png only.
- Fixed normalize-green-cartoon-survivor-sheet.mjs so it preserves all 12 GPT-generated frames per hero row and aligns each frame by visible body center and fixed bottom anchor, instead of rebuilding rows from one source frame.
- Verified hero animation hashes: idle row unique=12/12 and run row unique=12/12.
- Rechecked upgrade icons: fire, water, sword, lightning, poison, and holy cards now use distinct frames from the green-screen sprite sheet.
- Long local playtest reached result/clear: 44.2s, 76/75 kills, Lv5, audio enabled, no console errors, no failed requests. Screenshots: asset-audit-start.png, asset-audit-run.png, asset-audit-upgrade-icons-fixed.png, asset-audit-upgrade-icons-elements.png, asset-audit-long-play.png, run-frame-00.png, run-frame-06.png.

2026-06-13 strict 12-frame animation pass

- User pointed out that many skill/action animations still only used a few frames and looked stiff.
- Removed all runtime sub-frame animation subsets from drawSkillEffect. Skill effect bursts now advance through frames 0-11 over their lifetime.
- Updated player talisman bullets from 6-frame use to 12-frame use.
- Updated orbiting weapon animation from the old 6-frame subset to 12-frame use.
- Updated soul pickups from a static frame to a 12-frame cycle based on pickup lifetime.
- Enemy bullets, hero idle/run, and enemy rows already used 12-frame playback and were rechecked.
- Local QA captured twelve-frame-audit-00.png through twelve-frame-audit-11.png plus twelve-frame-long-clear.png. Long run reached CLEAR at 57s, 75/75 kills, Lv5, fire build, audio enabled, no console errors, no failed requests.

2026-06-13 visual foot-center correction

- User reported that the protagonist art still was not centered on the feet. Rechecked the rendered frames and found the previous quality gate was using bottom contact and bounding-box center, which can be skewed by tail, brush, ribbon, or weapon pixels.
- Updated scripts/normalize-green-cartoon-survivor-sheet.mjs to detect the hero's visual foot-contact pixels relative to the head/body center, then shift each hero idle/run cell so the foot-contact center lands on the fixed frame anchor.
- Added a second output correction pass that measures the finalized transparent cells and recenters the detected foot contact, instead of trusting only source crop positions.
- Reran the green-screen normalization. Final hero metrics: idle footCenterRange 0.91px, run footCenterRange 0.72px, both bottomRange 0, greenPixels 0.
- Captured foot-center-frame-00.png through foot-center-frame-11.png and inspected representative frames before accepting the asset.
- Long local Playwright run reached CLEAR at 54.3s, 75/75 kills, Lv5, fire build, audio enabled, no console errors, no failed requests. Screenshot: foot-center-long-clear.png.

2026-06-16 enemy-depth pass

- Added three non-boss enemy roles to make combat less flat: skitter rushes faster at close range, bomber leaves an explosion hazard when killed, and warden grants nearby enemies a guarded damage-reduction aura.
- Mixed the new roles into timed waves, elite pressure events, and later elite spawns so they appear through normal play instead of only in debug.
- Updated enemy drawing so each role has a readable marker or aura, and updated the records panel to describe the current enemy set and behavior rules.
- Added debug state output for per-kind enemy counts and guarded enemies, plus targeted spawn/kill helpers for browser playtests.
- Verified with syntax/type checks and a browser playtest. The test entered gameplay, spawned warden/ghoul/skitter/bomber groups, confirmed guardedEnemies > 0, killed a bomber, and confirmed hazards increased. Screenshot: survivor/playtest-enemy-depth.png.

2026-06-16 phase-depth and result polish

- Added a four-step in-run phase structure: opening, ambush, rupture, and warded. Each phase has an objective, message, enemy pressure set, and HUD banner.
- Phase changes now spawn relevant enemy groups and trigger pressure events, so progression changes the actual combat shape rather than only the label.
- Added Boss pre-warning before a node spawns, plus phaseReached data in run summaries and render_game_to_text.
- Pause stats now show the current phase and tactical objective. Result screen now records the reached phase and uses an opaque, cleaner reward layout so combat HUD does not bleed through.
- Verified with syntax/type checks and Playwright. The test started a run, advanced to ambush, confirmed Boss warning node 30, opened pause, advanced to warded, completed the run, and confirmed the result summary phase. Screenshots: survivor/playtest-phase-gameplay.png, survivor/playtest-phase-pause.png, survivor/playtest-phase-result-final-spacing.png.

2026-06-16 guidance and onboarding pass

- Added a transient in-run guidance chip for first movement, first soul pickup, skill growth, damage recovery, Boss warnings, and phase-specific threats.
- Hints are tracked in state with seenHints and tutorialHint so browser tests can verify that the relevant guidance fired without relying only on screenshots.
- Added concise rules to records/settings/pause settings: soul pickups only attract nearby, hints are temporary, and phase/enemy rules are discoverable outside combat.
- Fixed a screenshot-caught issue where the guidance chip was visible through the pause overlay by drawing it only during active playing mode.
- Verified with syntax/type checks and Playwright. The test confirmed start, souls, Boss, and ambush hints, opened pause settings, and captured cleaned screenshots: survivor/playtest-guidance-start.png, survivor/playtest-guidance-boss.png, survivor/playtest-guidance-pause-clean.png.

2026-06-16 mission-picker pass

- Promoted the existing mission presets into real player-facing mode selection on the home screen: Memory Cultivation, Gauntlet Trial, and Moon Garden.
- The selected mode is persisted in save data, reflected in the side task chip and Play button, and determines the mission passed into resetGame.
- Moon Garden is visibly locked until a memory fragment exists, while Gauntlet starts as a distinct 110-kill run instead of being hidden in code.
- Added render_game_to_text/debug_select_mission coverage for selectedMission and selectedMissionTitle.
- Verified with syntax/type checks and Playwright. The test clicked Gauntlet in the menu, started it, confirmed mission=gauntlet and targetKills=110, then confirmed locked Garden cannot be selected without a fragment. Screenshots: survivor/playtest-mission-picker-menu.png, survivor/playtest-mission-picker-gauntlet.png, survivor/playtest-mission-picker-garden-locked.png.

2026-06-16 mission-rewards loop pass

- Added claimable mission helpers and exposed claimableMissionCount/claimableMissionReward in render_game_to_text so the post-run reward loop can be verified.
- Home task chip now shows when missions are claimable, and the missions panel shows total claimable count and total moon dust reward.
- Result screen now surfaces claimable missions as a concrete next action, with a "Claim Missions" button that opens the missions panel directly.
- Added debug_claim_mission for deterministic verification while keeping normal row-click claiming intact.
- Verified with syntax/type checks and Playwright. The test completed a run, confirmed two claimable missions worth 200 moon dust, clicked the result "Claim Missions" button, claimed the first mission, and confirmed moon dust increased from 63 to 143 while claimable count dropped from 2 to 1. Screenshots: survivor/playtest-mission-rewards-result.png, survivor/playtest-mission-rewards-panel.png, survivor/playtest-mission-rewards-claimed.png.

2026-06-16 shop-polish pass

- Improved the moon dust shop so it now shows permanent progression total, affordable upgrade count, and a recommended next upgrade.
- Affordable rows are visually outlined and each upgrade row now says whether it is buyable, locked by cost, or maxed.
- Added permanentUpgradeSummary to render_game_to_text plus debug_buy_permanent_upgrade for deterministic checks.
- Updated shop click coordinates after the new recommendation header moved the upgrade rows.
- Verified with syntax/type checks and Playwright. The test opened the shop with 120 moon dust, confirmed five affordable upgrades, bought the first upgrade by clicking the visible row, and confirmed moon dust dropped to 75 while max_hp rose to level 1 and total permanent level became 1. Screenshots: survivor/playtest-shop-polish-before.png, survivor/playtest-shop-polish-after.png.

2026-06-16 touch-controls pass

- Added canvas virtual controls for mobile-style play: left-lower drag joystick for movement and right-lower dash button for evasion.
- Touch controls only activate during active gameplay, leaving menu, pause, result, and level-up card clicks unchanged.
- Keyboard and virtual movement now share the same player movement and dash logic, including cooldown/invulnerability.
- Added touchControl state to render_game_to_text and updated settings text to mention touch controls.
- Adjusted the transient hint panel and bottom message positioning so the new joystick/dash controls do not overlap key text.
- Verified with syntax/type checks and Playwright. The test dragged the joystick right, confirmed touchControl.dx=1 and player movement from x=1300 to x=1511, released it, clicked the dash button, and confirmed dash movement plus cooldown. Screenshots: survivor/playtest-touch-controls-moving.png, survivor/playtest-touch-controls-dash.png, survivor/playtest-touch-controls-final.png.

2026-06-16 boss-hud readability pass

- Added activeBosses and bossHudSummary so the game can summarize active boss count, total boss HP, HP ratio, and nearest boss distance.
- Added a dedicated Boss HUD panel during combat with HP bar, total HP value, count, and nearest distance.
- Added an edge direction indicator for off-screen bosses so players can track the encounter target when the camera does not show it.
- Added boss data to render_game_to_text plus debug_damage_boss for deterministic HUD verification.
- Verified with syntax/type checks and Playwright. The test spawned a boss, confirmed full HP summary, damaged it from 1150 to 730 HP, confirmed the ratio dropped, and inspected screenshots for HUD overlap. Screenshots: survivor/playtest-boss-hud-full.png, survivor/playtest-boss-hud-damaged.png.

2026-06-16 performance budget and pause access pass

- Added runtime entity budgets for non-boss enemies, pickups, effects, damage text, enemy bullets, and hazards so crowded fights cannot grow without bounds.
- Added spawn skipping, oldest-item trimming, and farthest-enemy cleanup helpers; render_game_to_text now exposes entityBudget limits, counts, and trim/skip stats for verification.
- Added debug_stress_entities to generate a reproducible crowded combat state and prove the budget caps are actually enforced.
- Cleaned combat HUD layering so Boss HUD, objective banners, and phase banners only show during active play, not behind upgrade/pause/result overlays.
- Added a visible in-game pause button in the upper-right corner, shared keyboard/button pause logic, and pausePanel output with active skills, passives, stats, and controls.
- Verified with syntax/type checks and Playwright. Stress test capped enemies at 135, pickups at 190, effects at 90, damage text at 85, skipped 95 excess spawns, and produced no console errors. Pause test clicked the new button, confirmed time stopped while paused, switched to the stats tab, resumed with Esc, and inspected screenshots: survivor/playtest-performance-budget-final.png, survivor/playtest-pause-ui-stats.png.

2026-06-16 pause codex and lower HP pass

- Expanded the in-run pause screen from three tabs to five: skills, stats, missions, codex, and settings.
- Added mission progress/status helpers so the pause mission tab can show current kill objective, phase objective, Boss nodes, long-term mission progress, rewards, and claim status.
- Added an in-run codex tab explaining enemy roles and core skill rules: active skill slot limit, same-skill upgrades, elemental branches, passives, soul pickup range, and level-up pause behavior.
- Extended render_game_to_text pausePanel with mission rows, codex summaries, and updated controls for deterministic browser verification.
- Lowered base player max HP from 85 to 70 now that there is no passive healing loop; survivability can still be built through gear, permanent upgrades, and defensive skill choices.
- Verified with syntax/type checks and Playwright. The test started a fresh run at 70/70 HP, opened pause, switched to missions/codex/settings, resumed play, and produced no console errors. Screenshots: survivor/playtest-hp-pause-missions.png, survivor/playtest-hp-pause-codex.png.

2026-06-16 elite rewards pass

- Added runRewards state for per-run moon dust, Boss kills, and elite kills, reset at the start of each run and exposed through render_game_to_text.
- Added awardStrongEnemyLoot so wardens, brutes, and bosses create a visible reward moment: screen shake, burst effects, extra soul pickups, bottom message, and moon dust added to the run summary.
- Boss kills now grant +12 moon dust, brutes +2, and wardens +1. The reward is included in final moon dust payout instead of being only a floating text effect.
- Result reward strip now shows Moon Dust, Boss, Elite, and Memory/Garden score as separate readable cards.
- Fixed a killEnemy edge case where already-removed enemies could still count as killed again during chained damage.
- Rebuilt index.html title/aria text as clean "符火夜行" and updated cache version to elite-rewards-20260616.
- Verified with syntax/type checks and Playwright. The test spawned and killed a Boss, confirmed message "Boss 討伐：+12 月塵", runRewards { moonDust: 12, bossKills: 1 }, final moon dust 75, no console errors, and inspected screenshots: survivor/playtest-elite-reward-boss-final.png, survivor/playtest-elite-reward-result-final.png.

2026-06-16 upgrade clarity pass

- Added upgradeIntent and optionSummary so level-up cards and render_game_to_text now distinguish NEW, UPGRADE, EVOLVE, PASSIVE, and MAX states.
- Level-up cards now show intent pills, next-level details, and gold EVOLVE borders when the next pick will trigger an evolution.
- openLevelUp now prioritizes one already-owned active skill when possible, so players see a clearer path to leveling and evolving a build instead of only random new names.
- Added setUpgradeOptions to de-duplicate option candidates and avoid repeated cards.
- Fixed evolution message ordering so choosing an evolution candidate leaves the visible message as "炎王符 進化完成" instead of being overwritten by the normal Lv.5 message.
- Updated cache version to upgrade-clarity-20260616.
- Verified with syntax/type checks and Playwright. The test forced 火系符脈 Lv.4, confirmed the first card reported intent EVOLVE with detail "選後進化為 炎王符", selected it, confirmed evolvedSkills includes 炎王符 and message "炎王符 進化完成", and inspected screenshots: survivor/playtest-upgrade-clarity-evolve.png, survivor/playtest-upgrade-clarity-normal.png.

2026-06-16 boss reward choice pass

- Added a real Boss reward choice state (`bossReward`) so Boss deaths now pause combat and offer three run-only reward cards instead of only dropping moon dust.
- Added six Boss boons: damage, attack speed, max HP without healing, magnet range, area size, and pierce. These are tracked separately from active/passive skills and do not consume the five active skill slots.
- Added click and 1/2/3 keyboard selection for Boss rewards, plus deterministic `debug_choose_boss_reward` coverage for browser tests.
- Result and pause stats now surface acquired Boss boons so players can inspect current run rewards inside the game and after a run.
- Updated cache version to `boss-reward-choice-20260616b`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, and browser playtests. The test started a run at 70 HP, killed a Boss, confirmed 3 reward cards and +12 moon dust, selected a reward, confirmed mode returned to `playing`, forced result, confirmed `lastRunSummary.bossBoons`, opened pause stats, and inspected screenshots: `survivor/playtest-boss-reward-choice-fixed.png`, `survivor/playtest-boss-reward-after-choice.png`, `survivor/playtest-boss-reward-result.png`, `survivor/playtest-pause-stats.png`.

2026-06-16 run contract pass

- Added per-run contracts so each run starts with a short objective such as killing enemies, defeating Boss/elite enemies, reaching Lv.4, or reaching a Moon Garden score target.
- Contracts now appear in the combat HUD with progress and reward, in the pause mission tab, and on the result screen.
- Finished contracts add bonus moon dust into the final run payout and are stored in the run summary as `runChallenge`.
- Added `debug_set_run_challenge` for deterministic browser verification.
- Updated cache version to `run-contract-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, and browser playtests. The test started a run, confirmed the HUD contract and pause mission tab, forced the `first_wave` contract, completed the run, confirmed `35/35`, `challengeBonus: 10`, final moon dust `+73`, no console errors, and inspected screenshots: `survivor/playtest-run-contract-hud.png`, `survivor/playtest-run-contract-pause.png`, `survivor/playtest-run-contract-result-fixed.png`.

2026-06-16 event choice pass

- Converted timed combat events into a player-facing "異變抉擇" choice screen. When the director event timer fires, combat pauses and offers three risk/reward event cards.
- Added five event choices: soul rain with extra skitters, spirit rush with damage gain, seal field with bullet clear and invulnerability, elite bounty with moon dust, and safe focus with attack-speed gain.
- Added `eventChoice` mode, click and 1/2/3 selection, event choice history, and deterministic debug helpers `debug_open_event_choice` / `debug_choose_event_choice`.
- Event choices are now exposed through `render_game_to_text`, shown in pause stats, and included in final run summaries/result screen.
- Removed the duplicate in-HUD event label that overlapped the phase banner; bottom messages now carry event feedback.
- Updated cache version to `event-choice-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, and browser playtests. The test opened event choice, confirmed 3 cards, selected one, confirmed mode returned to playing and the event applied, then verified pause/result event history. Screenshots: `survivor/playtest-event-choice-open.png`, `survivor/playtest-event-choice-after.png`, `survivor/playtest-event-choice-pause-stats-fixed.png`, `survivor/playtest-event-choice-result.png`.

2026-06-16 final boss pass

- Changed run completion so reaching the kill target no longer immediately ends the run. It now summons a marked final boss, and the run clears only after that final boss is defeated.
- Added `finalBossActive` and `finalBossDefeated` state, final-boss spawning, final-boss defeat handling, and a shared `completeRun` helper.
- Final bosses reuse the existing boss behavior but get higher HP, stronger stats, a gold HP bar, a "終" marker, and a pulsing purple/gold aura so they are visually distinct from normal bosses.
- Final boss kills grant +28 run moon dust and are included in the final run summary without opening the normal Boss reward picker.
- HUD objective, Boss HUD, pause mission tab, result screen, and `render_game_to_text` now expose final-boss state.
- Added deterministic debug helpers `debug_spawn_final_boss` and `debug_damage_final_boss`.
- Updated cache version to `final-boss-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, and browser playtests. Tests confirmed manual final boss spawn, target-kill trigger does not immediately clear the run, final boss kill changes result to cleared, summary records `finalBossDefeated: true`, and screenshots were inspected: `survivor/playtest-final-boss-spawn-fixed.png`, `survivor/playtest-final-boss-target-spawn.png`, `survivor/playtest-final-boss-complete-result.png`.

2026-06-16 summon companion pass

- Upgraded summons from invisible stat-only bonuses into visible in-run companions with their own position, cooldown, pulse, and action state.
- Added companion follow behavior and summon-specific support:
  - Moon Cat pulls nearby soul pickups toward the companion.
  - Paper Imp fires a small talisman projectile at nearby enemies.
  - Bell Spirit periodically accelerates the player's firing rhythm and displays a pulse.
  - Shadow Moth slows/curses nearby enemies and deals light pulse damage.
- Reworked companion rendering so each summon has distinct visuals and action markers instead of a single generic dot.
- Added `companion` data to `render_game_to_text` and `debug_select_summon` for deterministic browser tests.
- Updated cache version to `summon-companion-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, and browser playtests. Tests switched summons, spawned enemies, advanced time, confirmed companion state/effects/damage text, and inspected screenshots: `survivor/playtest-summon-paper-imp.png`, `survivor/playtest-summon-shadow-moth-fixed.png`, `survivor/playtest-summon-bell-spirit.png`.

2026-06-16 menu and pause framework pass

- Cleaned the browser title and canvas aria label to `月影貓符師`, removing the mojibake title from `index.html`.
- Added a main-menu battle preview panel that states the selected mode, final-boss objective, initial HP, and the no-auto-healing rule before the player starts.
- Reworked the start button label into a cleaner localized `開始探索` presentation and fixed a screenshot-caught text overlap on the button.
- Added clickable pause action buttons for `繼續遊戲` and `回主畫面` so in-run pause is not keyboard-only.
- Changed pause background clicks to show guidance instead of accidentally unpausing, reducing misclicks on the overlay.
- Updated `render_game_to_text` pause controls so automation and debug output match the new button-based pause flow.
- Updated cache version to `menu-pause-framework-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, keyword search for removed healing terms, and Playwright browser tests. The test loaded menu, started a run at 70/70 HP, opened pause from the top-right button, resumed with the new button, reopened pause, returned to menu with the new button, and produced no console errors. Screenshots inspected: `survivor/playtest-menu-pause-framework-menu-fixed.png`, `survivor/playtest-menu-pause-framework-pause-fixed.png`.

2026-06-16 combat telegraph pass

- Added readable attack windups for ranged enemies and Bosses. Mage/Boss shots now enter a short casting state before the projectile is created instead of firing instantly.
- Added visual telegraphs: pink aiming lanes for queued shots, cast rings around charging enemies, and a radial/area warning for Boss special attacks.
- Changed Boss special attacks into a two-step flow: `queueBossSpecial` starts the warning, then `resolveBossSpecial` fires the radial barrage or creates seal hazards after the warning delay.
- Added `castingEnemies` to `render_game_to_text` and `debug_force_enemy_cast` for deterministic browser verification of mage shots, boss shots, and boss specials.
- Updated cache version to `combat-telegraph-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright browser tests. The test forced mage shot, boss shot, and boss special telegraphs, confirmed casting state appears before bullets/hazards, confirmed after the delay `enemyBullets`/`hazards` are created and casting clears, and produced no console errors. Screenshots inspected: `survivor/playtest-combat-telegraph-mage.png`, `survivor/playtest-combat-telegraph-boss-shot.png`, `survivor/playtest-combat-telegraph-boss-special.png`, `survivor/playtest-combat-telegraph-after-fire.png`.

2026-06-16 home progression guidance pass

- Added a data-driven `homeGuidanceRows` route list for the main menu so the player can see the next useful action instead of only separate buttons.
- The route list prioritizes claimable missions, affordable permanent upgrades, summon unlocks, memory-fragment progress, and finally starting the selected run.
- Added a visible `今日路線` panel to the home screen and removed the overlapping old memory-event card from the same area.
- Guidance rows are clickable: selecting a route opens the matching menu tab such as shop, summon, missions, or memory.
- Added `homeGuidance` to `render_game_to_text` for deterministic browser checks.
- Updated cache version to `home-progression-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright browser tests. Tests checked a fresh save, then added 160 moon dust, confirmed guidance prioritizes shop/summon/memory/start, clicked the first guidance row and confirmed the shop tab opened with no console errors. Screenshots inspected: `survivor/playtest-home-progression-affordable-fixed.png`, `survivor/playtest-home-progression-shop-click-fixed.png`.

2026-06-16 upgrade readability pass

- Improved the level-up screen so it now shows the current active slot count, passive count, and the rule that selecting the same skill upgrades it instead of occupying another slot.
- Added slot-aware hints to each upgrade card:
  - Existing active skills show that they upgrade without taking a new slot.
  - New active skills show that they will consume one active slot and how many slots remain afterward.
  - Passive skills show that they go into the passive record instead of the active skill bar.
- Added `activeSkillFreeSlots` and `upgradeSlotHint`, and exposed `slotHint` through `optionSummary` / `render_game_to_text`.
- Updated cache version to `upgrade-readability-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright browser tests. The test forced a level-up with an existing active upgrade, a new active element, and a passive option; `render_game_to_text` confirmed the three slot hints, selecting the existing active raised it from Lv.1 to Lv.2 without adding a new active slot, and screenshots were inspected: `survivor/playtest-upgrade-readability-cards.png`, `survivor/playtest-upgrade-readability-after-pick.png`.

2026-06-16 result next-actions pass

- Added result-screen next action cards so the end of a run now points to concrete follow-up actions instead of only returning to the menu.
- Added `resultNextActions`, which prioritizes claimable missions, affordable permanent upgrades, newly formed memory fragments, and starting another run.
- Result action buttons now route directly to Missions, Shop, Memory, or the home screen.
- Shortened result action copy after screenshot review so reward numbers no longer wrap awkwardly inside the cards.
- Updated cache version to `result-next-actions-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright browser tests. The test forced a completed run with a fire memory fragment, confirmed 63+ moon dust and a new memory in the result summary, clicked the first next-action button to open the Missions tab, produced no console errors, and inspected screenshots: `survivor/playtest-result-next-actions-fixed.png`, `survivor/playtest-result-next-actions-click.png`.

2026-06-16 settings controls pass

- Converted the settings tab from a text-only list into interactive controls for audio, fullscreen, and local save management.
- Added a shared `toggleAudioMute` path so the settings button and keyboard M key use the same audio state and status message.
- Added a two-step local save reset flow with `requestSaveReset`, `cancelSaveReset`, `confirmSaveReset`, `state.resetConfirm`, and `settings` data in `render_game_to_text`.
- Tightened the settings panel layout after screenshot review so the reset / confirm / cancel buttons stay inside the panel instead of pressing into the start button area.
- Updated cache version to `settings-controls-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, the develop-web-game Playwright client, and a deeper Playwright interaction script. The test opened settings, toggled audio off, requested reset, canceled while moon dust stayed at 88, requested reset again, confirmed reset, saw moon dust return to 0, and produced no console errors. Screenshots inspected: `survivor/playtest-settings-controls-open.png`, `survivor/playtest-settings-controls-confirm.png`, `survivor/playtest-settings-controls-reset.png`.

2026-06-16 pause inspection pass

- Upgraded the in-run pause skill tab from a name list into an inspectable build screen. Active skills now show selectable rows, the selected row has a highlight, and the right panel shows skill name, level, type, description, next upgrade/evolution hint, active-slot count, and current element route summary.
- Added `pauseSkillIndex`, `pauseInspectableSkills`, `pauseSelectedSkill`, and `skillDetailSummary` so the selected skill state is deterministic and exposed through `render_game_to_text`.
- Added pause-content click handling: clicking an active or visible passive skill updates the inspected detail, and the pause settings tab now has real audio/fullscreen buttons instead of only shortcut text.
- Reworked the pause settings controls into a two-column layout after screenshot review so the shortcut list no longer overlaps the bottom action buttons.
- Updated cache version to `pause-inspection-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test applied a fire build, opened pause skills, confirmed 4 active skills, clicked the second skill, confirmed the selected detail changed, opened pause settings, clicked the audio button, confirmed audioMuted became true, and produced no console errors. Screenshots inspected: `survivor/playtest-pause-inspection-skills.png`, `survivor/playtest-pause-inspection-selected.png`, `survivor/playtest-pause-inspection-settings.png`.

2026-06-16 menu codex pass

- Reworked the main-menu records panel into a usable codex with four sub-tabs: overview, enemies, skill routes, and rules.
- Added codex data helpers for enemy behaviors, elemental skill-route summaries, and core system rules so players can inspect the game structure before starting a run.
- Added `recordsTab`, `recordTabs`, `handleRecordsClick`, and `recordsTab` output in `render_game_to_text` so the menu codex is clickable and deterministic in browser tests.
- Tightened codex layout after screenshot review: the skill route page now uses compact single-column rows, and enemy Boss-node text stays inside the panel instead of drifting toward the play button.
- Updated cache version to `menu-codex-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test opened the top-right codex, clicked overview/enemies/skills/rules tabs, confirmed `recordsTab` changed each time, produced no console errors, and inspected screenshots: `survivor/playtest-menu-codex-overview.png`, `survivor/playtest-menu-codex-enemies.png`, `survivor/playtest-menu-codex-skills.png`, `survivor/playtest-menu-codex-rules.png`.

2026-06-16 combat tracker pass

- Replaced the separate short objective and contract HUD snippets with a single right-side combat tracker panel.
- Added `combatTrackerSummary` and `nextBossTarget` so the HUD and `render_game_to_text` share the same objective, phase, Boss/next-Boss, danger/event, and run-contract summary.
- The tracker now surfaces the current run objective, next Boss or Boss HP, active event/hazard/cast warning, and current contract progress in one place.
- Updated cache version to `combat-tracker-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test started a run, confirmed `combatTracker.objective`, triggered a seal-field event and confirmed the danger text changed, spawned a Boss and confirmed the tracker showed Boss HP, with no console errors. Screenshots inspected: `survivor/playtest-combat-tracker-normal.png`, `survivor/playtest-combat-tracker-danger.png`, `survivor/playtest-combat-tracker-boss.png`.

2026-06-16 upgrade decision pass

- Improved the level-up choice screen so each card now shows a clearer level preview (`NEW -> Lv.1` or `Lv.x -> Lv.y`) instead of relying on the old `0/5` style label.
- Added `upgradeBuildImpact` and `upgradeLevelPreview` so cards explain whether the pick upgrades an existing skill, opens an elemental route, adds a new active skill, or becomes a passive.
- Reworked the bottom active-skill slots from small circles into five labeled rectangular slots with icons, levels, and empty-slot labels.
- Shortened the card impact copy after screenshot review so it no longer overlaps the slot hint at the bottom of the card.
- Updated cache version to `upgrade-decision-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test forced a fire build, opened three upgrade cards (existing active upgrade, existing branch upgrade, passive), confirmed slot hints/details were present, selected the existing active upgrade, confirmed it leveled to Lv.2 while active slot count stayed at 4, and produced no console errors. Screenshots inspected: `survivor/playtest-upgrade-decision-cards.png`, `survivor/playtest-upgrade-decision-after-pick.png`.

2026-06-16 damage feedback pass

- Added player hurt feedback for the no-auto-heal combat tuning: contact damage, enemy bullets, and hazards now route through `triggerPlayerHurtFeedback`.
- Added `hurtFlash`, screen shake, shared hurt SFX/hint messaging, and a low-HP vignette so damage is visible without relying only on the HP bar.
- Moved the damage overlay behind the HUD after screenshot review so blood/red flash no longer washes out the top bars, combat tracker, pause button, or virtual controls.
- Added a low-HP HUD warning and exposed `hpRatio`, `hurtFlash`, and `lowHp` through `render_game_to_text`.
- Added `debug_damage_player` for deterministic Playwright verification of normal, hurt, and low-HP states.
- Updated cache version to `damage-feedback-20260616c`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=damage-feedback-20260616c`, started a run, forced 18 damage and 999 damage, confirmed `hurtFlash` and `lowHp` states, produced no console errors, and screenshots were inspected: `survivor/playtest-damage-feedback-normal.png`, `survivor/playtest-damage-feedback-hurt.png`, `survivor/playtest-damage-feedback-lowhp.png`.

2026-06-16 story track pass

- Added a five-chapter main story track (`STORY_CHAPTERS`) so the game has a clearer long-term objective beyond independent missions and resources.
- Added `storyProgressSummary`, exposed it through `render_game_to_text`, and included it in run summaries after save updates so result screens show post-run chapter progress.
- Surfaced the current story chapter in the main battle preview, home guidance rows, records overview, pause mission tab, and result screen.
- Tightened pause mission layout after screenshot review: the right column now shows current story plus two long-term mission summaries so it no longer overlaps the Continue / Main Menu buttons.
- Updated cache version to `story-track-20260616c`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=story-track-20260616c`, confirmed fresh saves start at chapter `first_memory`, confirmed home guidance points to records/story, opened records overview, opened pause missions, forced a result, confirmed result story progress exists, and produced no console errors. Screenshots inspected: `survivor/playtest-story-track-menu.png`, `survivor/playtest-story-track-records.png`, `survivor/playtest-story-track-pause.png`, `survivor/playtest-story-track-result.png`.

2026-06-16 dynamic music pass

- Reworked the WebAudio music scheduler into a state-aware dynamic music layer instead of a single static loop.
- Added `musicMoodSummary`, with lobby, pause, result, battle, danger, and Boss moods. Mood intensity uses kill progress, enemy crowding, low HP, hazards/casting, and active Boss/final Boss pressure.
- The generated music now changes BPM, bass pattern, lead accents, noise density, and oscillator type by mood while keeping the existing no-external-audio setup.
- Surfaced the active music layer in the menu settings panel and in-run pause settings panel.
- Added `audio.musicMood` to `render_game_to_text` for deterministic browser verification.
- Updated cache version to `dynamic-music-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=dynamic-music-20260616`, confirmed battle mood, spawned a Boss and confirmed Boss mood, forced low HP after killing the Boss and confirmed danger mood, opened pause settings and confirmed pause mood, with no console errors. Screenshots inspected: `survivor/playtest-dynamic-music-battle.png`, `survivor/playtest-dynamic-music-boss.png`, `survivor/playtest-dynamic-music-settings.png`.

2026-06-16 milestone banner pass

- Added a short-lived central milestone banner system for important combat beats so phase changes and Boss events are not communicated only through small HUD text.
- Added `showMilestoneBanner`, `updateMilestoneBanner`, `drawMilestoneBanner`, and `state.milestoneBanner`.
- Hooked banners into stage phase transitions, Boss warnings, Boss spawns, final boss spawn, and run clear.
- Added `milestoneBanner` to `render_game_to_text` and `debug_show_milestone` for deterministic visual tests.
- Updated cache version to `milestone-banner-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=milestone-banner-20260616`, forced phase, Boss warning, Boss, and final-boss banners, confirmed the banner state/timer in `render_game_to_text`, and produced no console errors. Screenshots inspected: `survivor/playtest-milestone-phase.png`, `survivor/playtest-milestone-bossWarning.png`, `survivor/playtest-milestone-boss.png`, `survivor/playtest-milestone-final.png`.

2026-06-16 challenge feedback pass

- Added immediate in-run feedback when a run contract/commission is completed instead of waiting until the result screen to reveal the bonus.
- Added `runChallengeCompleted` and `challengeToast` state, reset at run start and exposed through `render_game_to_text`.
- Added `updateRunChallengeFeedback` so a contract completion triggers once, plays reward feedback, shows a right-side toast, shakes lightly, and spawns a golden effect near the player.
- The combat tracker now shows completed contracts as `完成 +reward` with a full reward bar.
- Added `debug_complete_run_challenge` for deterministic browser tests.
- Updated cache version to `challenge-feedback-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=challenge-feedback-20260616`, set `first_wave`, forced completion, confirmed `runChallengeCompleted`, `challengeToast`, and tracker done state, confirmed the toast expires after its timer, and produced no console errors. Screenshots inspected: `survivor/playtest-challenge-feedback-before.png`, `survivor/playtest-challenge-feedback-toast.png`.

2026-06-16 ambience layer pass

- Added a subtle world-space ambience layer so the battle scene has moving environmental life instead of only a static background under sprites.
- Added `AMBIENCE_NODES` with wisps, rune circles, drifting mist, and small petal motes placed around the arena.
- Added `visibleAmbienceNodes` and `drawAmbience`, rendered after the background and before pickups/enemies/player so the ambience stays behind gameplay objects and HUD.
- Exposed `ambience.total`, `ambience.visible`, and `ambience.kinds` through `render_game_to_text` for deterministic browser verification.
- Updated cache version to `ambience-layer-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=ambience-layer-20260616`, started a run, shifted the player/camera, confirmed 12 ambience nodes and all four ambience kinds were visible, and produced no console errors. Screenshots inspected: `survivor/playtest-ambience-start.png`, `survivor/playtest-ambience-shifted.png`.

2026-06-16 home dashboard pass

- Added a home growth dashboard so the lobby communicates meta progression instead of leaving missions, training, and summons as disconnected buttons.
- Added `homeDashboardSummary`, including current story chapter progress, claimable mission reward count/value, permanent training level/affordability, and summon ownership/next unlock state.
- Added `drawGrowthDashboardPanel` and adjusted the left-side home layout to show battle preview, growth dashboard, and compact daily route without overlapping the bottom dock or the play button.
- Added click routing for the dashboard cards: mission rewards open Missions, permanent training opens Shop, and summon progress opens Summon.
- Exposed `homeDashboard` through `render_game_to_text` for deterministic menu verification.
- Updated cache version to `home-dashboard-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=home-dashboard-20260616`, injected a save with claimable rewards, affordable upgrades, and an affordable summon, confirmed the dashboard state, clicked all three dashboard cards, confirmed tab routing to Missions/Shop/Summon, and produced no console errors. Screenshots inspected: `survivor/playtest-home-dashboard.png`, `survivor/playtest-home-dashboard-missions.png`.

2026-06-16 result plan pass

- Added a post-run planning summary to the result screen so the end of a run clearly points to the next meta-progression steps instead of only showing raw rewards.
- Added `postRunPlanSummary`, which summarizes current story objective, claimable mission rewards, permanent training affordability, and next summon unlock state.
- Added `drawPostRunPlan` to the right side of the result screen, keeping the existing bottom next-action cards intact.
- Exposed `postRunPlan` through `render_game_to_text` while in result mode.
- Updated cache version to `result-plan-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=result-plan-20260616`, injected a save with claimable missions, affordable training, and a summon unlock, forced the result screen, confirmed post-run rows for story/missions/training/summon with correct destination tabs, and produced no console errors. Screenshots inspected: `survivor/playtest-result-plan.png`, `survivor/playtest-result-plan-confirmed.png`.

2026-06-16 result route pass

- Made the result screen's right-side post-run plan interactive instead of informational only.
- Added `openResultDestination` so result action buttons and post-run plan rows share consistent routing back to the lobby.
- Clicking the post-run Story/Missions/Training/Summon rows now opens Records/Missions/Shop/Summon respectively.
- Added a short hint to the post-run plan area and exposed `resultActions` through `render_game_to_text`.
- Updated cache version to `result-route-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=result-route-20260616`, forced the result screen, clicked each post-run plan row, confirmed the lobby opened on the expected tab, and produced no console errors. Screenshot inspected: `survivor/playtest-result-route-result.png`.

2026-06-16 mission claim-all pass

- Added `claimAllMissions` so players can collect all currently claimable long-term mission rewards in one action.
- Added a claim-all button and reward total to the Missions panel when at least one mission can be claimed.
- The Missions panel now shows an explanatory empty state when no mission rewards are available.
- Wired the new button into the existing menu click handler without changing single-mission row claiming.
- Updated cache version to `mission-claim-all-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=mission-claim-all-20260616`, injected a save with 3 claimable missions and 25 moon dust, opened the Missions tab, clicked claim-all, confirmed moon dust became 375, confirmed claimable missions became 0, and produced no console errors. Screenshots inspected: `survivor/playtest-mission-claim-all-before.png`, `survivor/playtest-mission-claim-all-after.png`.

2026-06-16 shop auto-train pass

- Added `autoBuyPermanentUpgrades` so players can spend available moon dust on permanent training without clicking every affordable row one by one.
- The auto-train purchase loop follows the existing `recommendedPermanentUpgrade` priority, buying only upgrades the player can afford and stopping when moon dust is insufficient or all training is maxed.
- Added an Auto Train button and explanatory text to the Shop panel when any permanent upgrade is affordable; otherwise the panel shows the next required moon dust.
- Wired the new button into the existing shop click handler without changing single-row upgrade purchases.
- Updated cache version to `shop-auto-train-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=shop-auto-train-20260616`, injected a save with 500 moon dust, opened the Shop tab, clicked auto-train, confirmed moon dust dropped to 40, permanent training rose from 0/42 to 8/42, and produced no console errors. Screenshots inspected: `survivor/playtest-shop-auto-train-before.png`, `survivor/playtest-shop-auto-train-after.png`.

2026-06-16 summon auto-contract pass

- Added `affordableLockedSummons` and `autoUnlockSummons` so players can unlock all currently affordable summon companions from the Summon panel in one action.
- Auto-contract follows the existing summon list order, spends only available moon dust, unlocks each affordable companion, and selects the newest unlocked companion as active.
- Added an Auto Contract button and summon affordability summary to the Summon panel; when nothing is affordable, it shows the next required moon dust or completion text.
- Wired the new button into the existing summon click handler without changing single-companion unlock/select behavior.
- Updated cache version to `summon-auto-contract-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=summon-auto-contract-20260616`, injected a save with 600 moon dust and only the starter summon, opened the Summon tab, clicked auto-contract, confirmed 3 companions unlocked, moon dust dropped to 80, the latest companion became selected, and produced no console errors. Screenshots inspected: `survivor/playtest-summon-auto-contract-before.png`, `survivor/playtest-summon-auto-contract-after.png`.

2026-06-16 memory delete pass

- Added safe memory-fragment deletion so players can manage old run memories instead of being stuck with every saved fragment until the 8-fragment cap rotates them out.
- Added `memoryDeleteConfirmId`, `requestDeleteSelectedMemory`, `cancelDeleteMemory`, and `confirmDeleteSelectedMemory`.
- The Memory panel now shows selected-memory details and a two-step delete flow; selecting another memory cancels the pending delete confirmation.
- Deleting the selected memory updates save data, clears confirmation state, and automatically selects the next available fragment if one remains.
- Exposed `selectedFragmentId` and `memoryDeleteConfirmId` through `render_game_to_text` for deterministic testing.
- Updated cache version to `memory-delete-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=memory-delete-20260616`, injected three memory fragments, selected the second, requested delete, confirmed delete, verified only that fragment was removed, verified confirmation state cleared, and produced no console errors. Screenshots inspected: `survivor/playtest-memory-delete-before.png`, `survivor/playtest-memory-delete-confirming.png`, `survivor/playtest-memory-delete-after.png`.

2026-06-16 equipment preview pass

- Added equipment stat previews so the Equipment panel shows actual numeric impact instead of relying only on descriptive text.
- Added `statsWithEquipment`, `signedValue`, and `equipmentPreviewRows`, simulating base/meta/summon stats plus a candidate equipment item without changing active combat state.
- The Equipment panel now shows the selected item plus visible stat deltas such as magnet range, max HP, damage, and pierce.
- Exposed `equipmentPreview` through `render_game_to_text` while the Equipment tab is open.
- Updated cache version to `equipment-preview-20260616`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test loaded `game.js?v=equipment-preview-20260616`, opened the Equipment tab, switched through Soul Bell/Blood Cloak/Mirror Charm, confirmed preview values `+42`, `+35`, and `+3/+1`, and produced no console errors. Screenshots inspected: `survivor/playtest-equipment-preview-bell.png`, `survivor/playtest-equipment-preview-mirror.png`.

2026-06-17 garden preview pass

- Added `gardenMissionPreview` so selecting Moon Garden shows the selected memory name, power, level, active/evolved skill count, and best Garden score in the pre-run preview.
- Updated the battle preview panel to switch from the standard kill-objective copy to Garden-specific memory, high-score, and no-soul-fire copy when Moon Garden is selected.
- Exposed `gardenPreview` through `render_game_to_text` while the menu has Moon Garden selected.
- Updated cache version to `garden-preview-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The test injected a Lv.7 / power 188 memory fragment with `bestGarden` 4321, selected Moon Garden, confirmed `gardenPreview` values and no console errors, then inspected `survivor/playtest-garden-preview.png` for layout overlap.

2026-06-17 skill codex pass

- Upgraded the Records > Skills tab from a static element list into an interactive skill-route codex.
- Added `codexElement`, `elementCodexMeta`, `elementCodexDetail`, and compact text helpers so each element route exposes its core unlock, three branches, max-level evolution, role, and build advice.
- Clicking Fire/Water/Lightning/Poison/Shadow/Holy/Wind now switches the visible route detail and updates the menu message.
- Added a darker Records content backing panel so the codex is readable over the animated lobby and mission picker.
- Exposed `skillCodex` and `codexElement` through `render_game_to_text`.
- Updated cache version to `skill-codex-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The browser test opened Records > Skills, confirmed Fire detail, clicked Poison and Holy, confirmed each route has 3 branches plus an evolution, and produced no console errors. Screenshot inspected after layout fixes: `survivor/playtest-skill-codex-holy.png`.

2026-06-17 next action pass

- Reworked the home guidance area into a clearer "next action" panel so the lobby tells players what to do now instead of only listing several equal-weight route hints.
- Added `homeNextAction`, prioritizing claimable mission rewards, affordable permanent training, affordable summon unlocks, current story objective, Moon Garden availability, and finally starting the selected run.
- Added `runHomeAction` so clicking the primary recommendation routes directly to the relevant tab, selects Moon Garden when appropriate, or starts the selected mission.
- Updated the guidance panel layout to show one prominent recommendation card plus compact secondary steps.
- Exposed `homeNextAction` through `render_game_to_text`.
- Updated cache version to `next-action-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The browser test injected a save with a claimable mission reward, confirmed the home recommendation targeted Missions, clicked the recommendation, confirmed the Missions tab opened, and produced no console errors. Screenshots inspected: `survivor/playtest-next-action-home.png`, `survivor/playtest-next-action-missions.png`.

2026-06-17 menu scrim pass

- Added `drawMenuTabScrim` so non-home lobby panels have a stronger dark backing before their content is drawn.
- The scrim dims the right-side mission picker, side buttons, and play button behind Missions, Records, Shop, Summon, Equipment, Memory, Stats, and Settings panels, improving readability without changing tab behavior.
- Updated cache version to `menu-scrim-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The browser test opened Missions and Records > Skills, confirmed tab state and no console errors, then inspected screenshots: `survivor/playtest-menu-scrim-missions.png`, `survivor/playtest-menu-scrim-records.png`.

2026-06-17 combat readout pass

- Added `combatReadoutSummary` so active combat exposes the player's current element, active skill slots, passive count, evolution count, equipment, and run-contract progress in one concise readout.
- Expanded the upper-left combat HUD to show the build line (`element · active slots · evolutions`) and the current contract progress/reward below the HP, dash, and XP/Garden bars.
- Moved the low-HP warning lower so it does not collide with the new readout.
- Exposed `combatReadout` through `render_game_to_text`.
- Updated cache version to `combat-readout-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The browser test started a run, applied a Fire build, completed the run contract, confirmed `combatReadout.element === fire`, active slots, and completed challenge data, and produced no console errors. Screenshot inspected: `survivor/playtest-combat-readout.png`.

2026-06-17 upgrade decision pass

- Added `upgradeDecisionSummary` so each level-up option has a concise decision reason in addition to intent, slot hint, and build impact.
- Decision summaries distinguish evolution timing, existing-skill upgrades, passive support, full active slots, and opening a new route.
- Updated level-up cards to show a fixed "decision reason" block, reducing visual clutter compared with the previous stacked impact/slot text.
- Extended `optionSummary` so `render_game_to_text` exposes `impact` and `decision` for every level-up card.
- Updated cache version to `upgrade-decision-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The browser test forced a level-up screen with EVOLVE/PASSIVE/NEW options, confirmed decision titles `進化時機`, `被動補強`, and `開新流派`, and produced no console errors. Screenshot was inspected after a layout fix: `survivor/playtest-upgrade-decision-screen.png`.

2026-06-17 choice decision pass

- Added decision summaries for Boss rewards and event choices so all combat-pausing choice screens now explain why an option is useful, not only what it does.
- Added `bossRewardDecision` and extended `bossRewardSummary` with decision metadata.
- Added `eventChoiceDecision` and extended `eventChoiceSummary` with decision and risk metadata.
- Updated Boss reward and event choice cards to use a fixed decision block matching the level-up card style.
- Updated cache version to `choice-decision-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The browser test forced a Boss reward screen and an event-choice screen, confirmed all cards expose decision titles/risk text through `render_game_to_text`, and produced no console errors. Screenshots inspected: `survivor/playtest-choice-decision-boss.png`, `survivor/playtest-choice-decision-event.png`.

2026-06-17 choice fit-text pass

- Added `fitText`, a canvas-width-aware text truncation helper, so choice cards stop relying only on character counts for mixed Chinese/English/numeric text.
- Applied `fitText` to level-up cards, Boss reward cards, and event choice cards for descriptions, decision bodies, risk lines, and slot hints.
- Updated cache version to `choice-fittext-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The browser test opened level-up, Boss reward, and event choice screens, confirmed state output remained correct, and produced no console errors. Screenshots inspected: `survivor/playtest-choice-fittext-upgrade.png`, `survivor/playtest-choice-fittext-boss.png`, `survivor/playtest-choice-fittext-event.png`.
2026-06-17 result highlights pass

- Added `resultHighlights` to summarize post-run commission/challenge status, build shape, Boss/event choices, and memory/Garden outcome.
- Replaced the single result-screen run-challenge line with three compact highlight cards and shifted/compacted the skill recap to preserve the lower next-action area.
- Exposed `resultHighlights` through `render_game_to_text`.
- Updated cache version to `result-highlights-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, and Playwright. The browser test forced a result screen after applying a Fire build, completing a run challenge, taking a Boss reward, and choosing an event, confirmed at least 3 result highlights including Build, and produced no console errors. Screenshot inspected: `survivor/playtest-result-highlights.png`.

2026-06-17 progress tracker pass

- Added `completionTrackerSummary` so story, missions, permanent training, summon contracts, and memory/Garden progression share one player-facing completion model.
- Updated the home growth dashboard to show overall completion percentage plus the current gap instead of only story percentage.
- Updated Records > Overview and the in-run Pause > Missions page to surface the same completion tracker/urgent gap, making progression readable before and during a run.
- Exposed `completionTracker` through `render_game_to_text`.
- Updated cache version to `progress-tracker-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, HTTP 200, and Playwright. The browser test loaded the menu, confirmed 5 tracker rows, opened Records overview, opened Pause > Missions, confirmed tracker state in all modes, produced no console errors or failed requests, and screenshots were inspected: `survivor/playtest-progress-tracker-home.png`, `survivor/playtest-progress-tracker-records.png`, `survivor/playtest-progress-tracker-pause.png`.

2026-06-17 story rewards pass

- Turned story chapters into claimable progression rewards by adding per-chapter moon-dust rewards and `claimedStoryChapters` save data.
- Added `claimAllStoryRewards`, story claimable counts/dust to `storyProgressSummary`, and debug helpers for deterministic browser tests.
- Updated the home next-action system so completed-but-unclaimed story chapters become the highest-priority recommendation.
- Updated Records > Overview with a story reward claim button and compact chapter rows showing progress/claimed/claimable state.
- Updated result next-action cards and post-run planning rows so completed runs can route the player directly to story reward claims.
- Updated cache version to `story-rewards-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, HTTP 200, and Playwright. The browser test created a claimable first chapter, confirmed home recommendation routed to Records, claimed +80 moon dust, confirmed claimable count returned to 0, and produced no console errors. A second result-screen test confirmed `records` appears as a result next action and story claim data appears in post-run planning. Screenshots inspected: `survivor/playtest-story-rewards-home.png`, `survivor/playtest-story-rewards-records-before.png`, `survivor/playtest-story-rewards-records-after.png`, `survivor/playtest-story-rewards-result.png`.

2026-06-17 story focus pass

- Added `storyRunFocus` so the current unfinished story chapter now becomes a run-level focus with a title, objective, battle note, preferred commission, pressure enemy mix, and color.
- `resetGame` now stores `state.storyFocus`, selects a matching run commission when possible, spawns a small chapter-specific pressure group at the start of the run, and shows a chapter focus milestone banner.
- Combat HUD now shows the current story focus and progress; Pause > Missions now explains the focus and why the current run objective/commission matters.
- Exposed `storyFocus` through `render_game_to_text` and included it in `combatTracker`.
- Updated cache version to `story-focus-20260617b`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, HTTP 200, and Playwright. The browser test confirmed a fresh save starts with first-memory focus and the Lv.4 commission, then advanced save state to the companion chapter and confirmed elite-breaker commission plus warden/brute pressure enemies. Pause > Missions was opened and screenshot-inspected after fixing a text overlap. Screenshots inspected: `survivor/playtest-story-focus-first.png`, `survivor/playtest-story-focus-companion.png`, `survivor/playtest-story-focus-pause-fixed.png`.

2026-06-17 story event pass

- Added `storyEventChoice`, generating one chapter-specific event card from the active `storyFocus` instead of relying only on generic event choices.
- `openEventChoice` now guarantees the first card is a STORY card tied to the current chapter, while the remaining two options come from the generic event pool.
- Story event cards carry `source`, `storyId`, and `storyTitle` through `eventChoiceSummary`, use chapter-colored borders, and display a STORY pill in the event-choice screen.
- Added story-specific decision copy for first memory, final-boss clear, hunter, companion, and garden chapters.
- Choosing the companion story event now triggers elite pressure, spawns elite enemies, grants +10 run moon dust, and records the story event in `eventChoicesTaken`.
- Updated cache version to `story-event-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, version search, HTTP 200, and Playwright. The browser test opened an event choice on a fresh save and confirmed the first card was the first-memory story option, then advanced to the companion chapter, confirmed the first card was the companion story option, selected it, confirmed run moon dust rose by +10 and the story event was recorded, with no console errors or failed requests. Screenshots inspected: `survivor/playtest-story-event-first.png`, `survivor/playtest-story-event-companion-open.png`, `survivor/playtest-story-event-companion-chosen.png`.

2026-06-17 final boss phase pass

- Added final-boss HP phase tracking with three readable phases: first phase, second-phase Moon Wheel pressure, and final Frenzy pressure.
- Final boss now records `phaseBreaks` so each break event only fires once, and `bossHudSummary` exposes `finalPhase` through `render_game_to_text`.
- At 66% HP the final boss triggers a radial bullet pattern, visual effect, screen shake, skitter pressure, and mage support.
- At 33% HP the final boss triggers seal hazards, stronger pressure, warden/brute/skitter support, and a final-phase milestone banner.
- Boss HUD now shows the current final phase and next break target, and shifts downward while a milestone banner is visible so the two overlays do not collide.
- Added `debug_set_final_boss_hp_ratio` for deterministic browser tests.
- Updated cache version to `final-boss-phase-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Playwright. The browser test spawned the final boss, forced 60% HP and 25% HP, confirmed phase data, bullets, hazards, and spawned support enemies, with no console errors or failed requests. Screenshots inspected: `survivor/playtest-final-boss-phase-1-fixed.png`, `survivor/playtest-final-boss-phase-2-fixed.png`, `survivor/playtest-final-boss-phase-3-fixed.png`.

2026-06-17 run briefing pass

- Added a pre-run `briefing` mode so pressing Start no longer drops the player directly into combat.
- `startSelectedMission` now opens an expedition briefing, while `confirmRunBriefing` performs the actual `resetGame` start.
- The briefing summarizes selected mode, target kills, final-boss condition, story focus, run commission, equipment, summon, core combat rules, and Garden memory data when relevant.
- Added mouse and keyboard flow: Start opens briefing, Esc returns to the lobby, Enter confirms, and the briefing's buttons mirror those actions.
- Exposed `runBriefing` through `render_game_to_text` for deterministic browser checks.
- Updated cache version to `run-briefing-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Playwright. The browser test opened the menu, clicked Start into briefing, used Esc to return, used Enter to open briefing again, confirmed into gameplay, and verified the previewed commission matched the actual run challenge. No console errors or failed requests. Screenshots inspected after layout fix: `survivor/playtest-run-briefing-menu-fixed.png`, `survivor/playtest-run-briefing-open-fixed.png`, `survivor/playtest-run-briefing-playing-fixed.png`.

2026-06-17 tutorial quest pass

- Added an in-run tutorial quest strip so early gameplay teaches the core loop through visible checklist progress instead of relying only on temporary hint popups.
- The checklist tracks real run state: movement distance, soul pickups collected, upgrades chosen, Boss node progress, and final-boss defeat.
- Added `tutorialProgress` reset/run tracking, movement distance accumulation, soul pickup counting, and upgrade-choice counting.
- Added `tutorialQuestSummary` and a compact HUD panel positioned away from the bottom hint box, virtual controls, top combat HUD, and right combat tracker.
- Exposed `tutorialQuest` through `render_game_to_text` and added `debug_set_tutorial_progress` for deterministic browser tests.
- Updated cache version to `tutorial-quest-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Playwright. The browser test entered gameplay through the briefing, moved to complete the movement step, advanced tutorial progress to soul/upgrade completion, defeated a debug Boss to complete the Boss step, and confirmed no console errors or failed requests. Screenshots inspected after layout fix: `survivor/playtest-tutorial-quest-moved-fixed.png`, `survivor/playtest-tutorial-quest-progressed-fixed.png`, `survivor/playtest-tutorial-quest-bossdone-fixed.png`.

2026-06-17 story scene pass

- Added `storySceneSummary` so each main story chapter now has a mood, opening narration, battle framing, success text, and next-step direction.
- The pre-run briefing now shows a chapter prologue card instead of only a mechanical objective card.
- The result screen now includes a compact story continuation card showing current chapter progress, success text, and claimable/main next action.
- Exposed `storyScene` through `render_game_to_text` for deterministic browser verification.
- Updated cache version to `story-scene-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Playwright. The browser test opened briefing and confirmed the first-memory scene data, forced a result screen and confirmed the result story scene advanced with current story state, with no console errors or failed requests. Screenshots inspected: `survivor/playtest-story-scene-briefing.png`, `survivor/playtest-story-scene-result.png`.

2026-06-17 result polish pass

- Reworked the result screen layout so story continuation, rewards, highlights, skill recap, post-run plan, and next-action buttons have clearer zones.
- Moved post-run planning from a narrow, clipped right edge layout into a compact right-side vertical stack.
- Adjusted the next-action buttons into a tighter bottom row and removed the old overlap with the plan/event text area.
- Updated result-screen click hitboxes to match the new post-run plan and next-action button positions.
- Updated cache version to `result-polish-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Playwright. The browser test forced a result screen, clicked a post-run plan item and a next-action button using scaled canvas coordinates, confirmed both route to Records, and produced no console errors or failed requests. Screenshot inspected after overlap fixes: `survivor/playtest-result-polish-clean.png`.

2026-06-17 build progress pass

- Added `buildProgressSummary` so the run now tracks active skill slots, passive count, evolved count, core skill, closest evolution target, and a practical next-build recommendation.
- Added an in-run `drawBuildProgressPanel` under the combat tracker. It highlights "進化前一步" when a skill is at Lv.4/5 and changes to evolved status after Lv.5 instead of implying the whole element level is shared.
- Exposed `buildProgress` through `render_game_to_text` for deterministic checks.
- Added an inline favicon to stop browser favicon 404 noise during QA, and rebuilt `index.html` with a clean `月影貓符師` title/aria label after spotting mojibake in the browser shell.
- Updated cache version to `build-progress-20260617b`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. The browser test entered gameplay, applied `火系符脈` to Lv.4, confirmed `nextEvolution` was `火系符脈 -> 炎王符`, then applied one more level and confirmed `evolvedCount: 1`, `evolved: 炎王符`, no console errors, no failed requests, and no 400/404 responses. Screenshots were emitted and visually inspected in the Codex app.
- Note: the installed `develop-web-game` script `web_game_playwright_client.js` could not run from shell because it lives under `.codex` and its ESM import cannot resolve this workspace's `node_modules/playwright`. `NODE_PATH` did not help. Browser plugin Playwright verification was used instead.

2026-06-17 threat readability pass

- Added `threatSummary` so combat now summarizes casting enemies, enemy bullets, hostile hazard zones, near enemies, nearest threat, and the latest hit source.
- Added `lastHit` tracking for contact damage, enemy bullets, boss seal hazards, and debug damage so the HUD can tell the player why HP dropped.
- Added a compact in-run threat warning panel below the main HUD plus edge direction arrows for nearby/off-screen threats.
- Exposed `threat` through `render_game_to_text` for deterministic browser checks.
- Updated cache version to `threat-readability-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. Tests forced a mage cast, debug player damage, and a Boss special cast/resolve sequence; confirmed `危險預警`, `高危險`, and `受擊：怨月封印` states appeared correctly, screenshots were visually inspected, and there were no console errors, failed requests, or 400/404 responses.

2026-06-17 combat radar pass

- Added `minimapSummary` to summarize player position, Boss/final Boss, hostile hazard zones, nearby pickup samples, elite/ranged enemies, and enemy density clusters in normalized world coordinates.
- Added a compact in-run radar panel under the threat warning area, showing player, Boss, elites, hazard rings, soul pickups, and enemy clusters without covering the main combat space.
- Exposed `minimap` through `render_game_to_text` for deterministic browser checks.
- Updated cache version to `combat-radar-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. Tests spawned Boss, mage, warden, soul-rain pickups, and Boss seal hazards; confirmed radar counts and hazard samples in text state, inspected screenshots, and saw no console errors, failed requests, or 400/404 responses.

2026-06-17 death flow pass

- Added `deathSummary` so failed runs now expose cause of death, run stats, earned moon dust, reached phase, current skills, run challenge progress, story progress, and retry tips.
- Reworked `drawDead` from a simple three-line panel into a real failure summary with action buttons: retry, return to courtyard, and open permanent upgrades.
- Changed death keyboard flow: Enter now retries the same mission through the run briefing, while Esc returns to the courtyard.
- Added `retryLastRun`, death action hitboxes, `deathSummary` in `render_game_to_text`, and `debug_force_death` for deterministic QA.
- Updated cache version to `death-flow-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. Tests forced death with a named cause, confirmed the death summary, pressed Enter into briefing, pressed Enter again into a fresh run, and clicked "go upgrade" into the shop; screenshots were inspected and there were no console errors, failed requests, or 400/404 responses.

2026-06-17 pause run log pass

- Added `runLogSummary` to summarize the current run's loot, Boss boons, active event pressure, and current threat state while the run is still in progress.
- Added a compact "本局紀錄" block to Pause > Missions so players can inspect what happened this run without waiting for the result screen.
- Exposed `pausePanel.runLog` through `render_game_to_text` for deterministic QA.
- Updated cache version to `pause-run-log-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. Tests spawned a Boss, forced a Boss reward, triggered soul rain, forced a mage cast, opened Pause > Missions, confirmed run-log rows in text state, inspected screenshots after fixing a bottom-button overlap, and saw no console errors, failed requests, or 400/404 responses.

2026-06-17 upgrade choice pass

- Added `levelChoiceSummary` and `upgradeRecommendationScore` so level-up choices now have a deterministic recommended card, headline, and decision text.
- Reworked the level-up screen with a "本次建議" brief, a gold recommended-card state, per-card level progress bars, current-level text, and clearer "選後效果" messaging.
- Exposed `levelChoice` through `render_game_to_text` while the game is in `level` mode.
- Updated cache version to `upgrade-choice-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. The browser test forced `火系符脈` to Lv.4, opened level choices with `火系符脈 / 聚魂鈴 / 旋刃`, confirmed the recommendation was the EVOLVE card, pressed `1`, confirmed mode returned to `playing`, `炎王符` appeared in evolved skills, the build panel showed evolved status, and there were no console errors, failed requests, or 400/404 responses. Screenshots were emitted and visually inspected in the Codex app.

2026-06-17 settings accessibility pass

- Added persistent player settings to the existing local save: audio, screen shake, damage numbers, and combat hints.
- Reworked the main Settings panel and Pause > Settings panel so these toggles are available both before and during combat.
- Routed the M-key/audio toggle through the same saved setting so audio state persists after reload instead of only changing runtime state.
- Applied settings to gameplay presentation: disabled hints suppress tutorial popups, disabled damage numbers hide floating combat text, and disabled screen shake keeps camera shake offsets at 0 even while hit shake is decaying.
- Exposed settings and camera shake values through `render_game_to_text`, plus added `debug_set_setting` and `debug_toggle_setting` for deterministic browser QA.
- Fixed the broken HTML title/aria label and updated cache version to `settings-accessibility-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. Tests opened the main Settings page, persisted toggles across reload, inspected Pause > Settings after a layout fix, verified screen-shake-off keeps `shakeX/shakeY` at 0 while shake is active, restored default settings, and saw no console errors or failed 400/404 responses.

2026-06-17 objective compass pass

- Added `objectiveCompassSummary` as a shared run-goal model for story focus, run commission, and final-boss completion.
- Added a visual objective compass to the pre-run briefing so the player sees the three actual goals before entering combat.
- Added the same compact compass to Pause > Missions and adjusted the run-log layout to avoid bottom-button overlap.
- Exposed `objectiveCompass` through `render_game_to_text` and included the compact summary in `pausePanel.objectiveCompass` for deterministic QA.
- Updated cache version to `objective-compass-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. Tests opened the briefing, confirmed three compass rows in text state, inspected the briefing screenshot, entered gameplay, opened Pause > Missions, fixed a run-log/button overlap, re-tested the pause screenshot, and saw no console errors or failed 400/404 responses.

2026-06-17 combat medals pass

- Added `combatMedals` as a short-lived combat feedback layer for visible run achievements during active play.
- Added `pushCombatMedal`, `updateCombatMedals`, and `drawCombatMedals`; medals show as compact left-side achievement cards and avoid the right-side tracker/build/tutorial panels.
- Hooked medals into run challenge completion, stage phase transitions, and strong enemy rewards so objectives feel like events instead of only bottom text.
- Run challenge completion now also creates a small immediate soul pickup burst near the player in addition to the end-of-run moon dust bonus.
- Exposed `combatMedals` through `render_game_to_text` and added `debug_push_combat_medal` for deterministic Browser QA.
- Updated cache version to `combat-medals-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. Tests forced challenge/phase/boss medals, inspected screenshots, moved medals after they overlapped the tutorial tracker, re-tested the screenshot, verified natural challenge and phase triggers, and saw no console errors or failed 400/404 responses.

2026-06-17 collection progress pass

- Added `collectionSummary` as a lightweight collection/completion model covering memory fragments, summons, elemental branches seen in builds, strong enemy/final boss progress, and Moon Garden score.
- Added the collection percent and next collection target to the home growth dashboard, using compact dots so it does not crowd the mode picker or next-action panel.
- Added a compact collection row to Records > Overview and adjusted the story rows to avoid clipping at the bottom of the small records panel.
- Exposed `collection` through `render_game_to_text` for deterministic QA.
- Updated cache version to `collection-progress-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. Tests inspected the home dashboard and Records overview screenshots, fixed an overcrowded home collection row and a clipped records story row, and saw no console errors or failed 400/404 responses.

2026-06-17 result progress pass

- Added `runProgressDeltaSummary` so the result screen explicitly summarizes what the run advanced: story rewards, memory/collection progress, and run commission completion.
- Replaced the older visual highlight strip on the result screen with a clearer `本局推進` strip placed between rewards and the skill recap.
- Exposed `resultProgressDelta` through `render_game_to_text` for deterministic QA.
- Fixed a result-screen crash in `collectionSummary` by normalizing memory skill entries before calling `elementNameFromName`.
- Updated cache version to `result-progress-20260617`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, HTTP 200, and Browser/Playwright using system Chrome. Tests forced a completed fire-build run, confirmed result progress rows in text state, caught and fixed the collection crash, inspected the final result screenshot after layout adjustment, and saw no console errors or failed 400/404 responses.

2026-06-21 handoff recovery and damage readout closeout

- Recovered the project handoff from the exported Codex chunks under `C:\tmp\CodexSessionRecovery` without reading the original JSONL or writing anything back into sessions.
- Confirmed the active workstream is the `survivor` browser roguelite, while `UnityProject` remains a compiled Unity framework/prototype path.
- Closed the unfinished damage-readout slice: damage sources are tracked from `damageEnemy`, summarized through `damageSourceSummary`, shown in Pause > Stats, and exposed as `damageSources` in `render_game_to_text`.
- Labeled debug damage helpers (`debug_damage_boss`, `debug_damage_final_boss`, `debug_kill_enemy_kind`) so deterministic QA damage no longer appears as unmarked output.
- Current cache version is `damage-readout-20260617`; `index.html` title and canvas aria label are `貓符月影`.

2026-06-21 result damage readout pass

- Added a compact result-screen `輸出排行` panel next to the run skill recap, showing total recorded damage and the top three damage sources with percentage bars.
- Reused `lastRunSummary.damageSources` from `finalizeRun` so the result screen reflects the actual run instead of recalculating after the run ends.
- Added fallback `damageSources` data for the result summary path and exposed `resultDamageSources` through `render_game_to_text` for deterministic QA.
- Compacted the result skill list width so the new damage panel does not overlap post-run planning or next-action buttons.
- Updated cache version to `result-damage-readout-20260621`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, `git diff --check`, and local Playwright. The browser test forced Boss and final-Boss damage, completed into result mode, confirmed `resultDamageSources` contains both sources, emitted `survivor/playtest-result-damage-readout.png`, and saw no console errors or failed requests.

2026-06-21 survivor loop workflow pass

- Added `NEXT_ACTIONS.md` as the durable loop plan for continuing the `survivor` browser roguelite.
- Added `scripts/playtest-survivor-loop.mjs`, a reusable local-server + Playwright harness that starts `survivor`, runs deterministic checks, saves screenshots/JSON to `survivor/test-artifacts/`, and shuts the server down.
- Added package scripts `loop:smoke` and `loop:result-damage`.
- The loop contract now requires reading handoff/progress/next actions, making one player-facing improvement, running static checks, running at least one loop playtest, inspecting screenshots, and appending a dated `progress.md` entry.
- Verified with `node --check` for `survivor/game.js` and `scripts/playtest-survivor-loop.mjs`, `npx.cmd tsc --pretty false`, `git diff --check`, `npm run loop:smoke`, and `npm run loop:result-damage`. New artifacts: `survivor/test-artifacts/loop-smoke-menu.png`, `survivor/test-artifacts/loop-smoke-result.json`, `survivor/test-artifacts/loop-result-damage-readout.png`, and `survivor/test-artifacts/loop-result-damage-result.json`.

2026-06-21 result build advice pass

- Added `resultDamageAdvice`, turning the top result-screen damage source into a next-run build recommendation.
- The advice detects elemental sources, orbit blades, summon output, debug output, and generic concentrated/spread damage patterns.
- Result screen `輸出排行` now includes the recommendation title and one-line advice body below the damage bars.
- Exposed `resultBuildAdvice` through `render_game_to_text`.
- Updated `loop:result-damage` to assert that result build advice exists alongside `resultDamageSources`.
- Updated cache version to `result-build-advice-20260621` and moved result next-action cards down slightly after screenshot review.
- Verified with `node --check survivor/game.js`, `node --check scripts/playtest-survivor-loop.mjs`, `npx.cmd tsc --pretty false`, and `npm run loop:result-damage`. Screenshot inspected: `survivor/test-artifacts/loop-result-damage-readout.png`.

2026-06-22 agent lane setup and pause-info loop pass

- Added `AGENTS.md` to define the four production lanes: Planning, Coding, Testing, and Image/Cutout, with ownership and conflict rules for future work.
- Planning lane added `docs/roadmap/2026-06-22-ui-content-depth-plan.md` and expanded `NEXT_ACTIONS.md` into a concrete UI/content-depth loop plan.
- Coding lane added the in-run damage-focus readout to the right-side combat tracker so normal non-debug damage sources get surfaced during play.
- Image/Cutout lane added `ASSET_PIPELINE.md`, documenting current survivor runtime assets, missing hero/enemy/boss/environment/icon batches, and GPT-image/cutout handoff prompts.
- Testing lane added `loop:pause-info`; main integration then corrected it to open Pause > Skills, Pause > Stats, and Pause > Missions, saving separate screenshots and checking skill detail, damage source rows, objective compass, run log, and mission rows.
- Verified with `node --check survivor/game.js`, `node --check scripts/playtest-survivor-loop.mjs`, `npx.cmd tsc --pretty false`, `npm run loop:smoke`, `npm run loop:result-damage`, and `npm run loop:pause-info`.
- New evidence: `survivor/test-artifacts/loop-pause-info-skills.png`, `survivor/test-artifacts/loop-pause-info-stats.png`, `survivor/test-artifacts/loop-pause-info-missions.png`, and `survivor/test-artifacts/loop-pause-info-result.json`.

2026-06-22 combat readability loop pass

- Added `loop:combat-readability` to the local Playwright harness and package scripts.
- Added `debug_seed_combat_readability`, a deterministic combat QA seed that records normal, non-debug damage sources for baseline talismans, burn ticks, poison ticks, orbit blades, and the selected summon.
- The same seed triggers a readable player-hit source (`Boss 法彈`) so the threat/last-hit readout can be verified alongside output sources.
- Updated the runtime cache version to `combat-readability-20260622`.
- Verified the TDD red path first: `npm run loop:combat-readability` failed while `debug_seed_combat_readability` was missing.
- Verified green with `node --check survivor/game.js`, `node --check scripts/playtest-survivor-loop.mjs`, and `npm run loop:combat-readability`.
- New evidence: `survivor/test-artifacts/loop-combat-readability.png` and `survivor/test-artifacts/loop-combat-readability-result.json`.

2026-06-28 upgrade choice loop pass (Agent B / roadmap P1)

- Continued the recovered Codex handoff: read the exported chunks under `C:\tmp\CodexSessionRecovery\rollout-2026-06-09...`, merged a project handoff summary (`肉鴿手遊專案交接摘要.md`), and resumed the `docs/roadmap/2026-06-22-ui-content-depth-plan.md` backlog at Agent B.
- Added `window.debug_choose_upgrade(index)` so deterministic QA can pick a level-up card and resume the run (previously only Boss/event reward choices had debug pick hooks).
- Added `loop:upgrade-choice` to `scripts/playtest-survivor-loop.mjs` and `package.json`. It pre-levels 火系符脈 to Lv.4, forces a 3-card choice (near-evolution / utility passive / off-plan element via `debug_set_upgrade_options`), and asserts `render_game_to_text().levelChoice` exposes the recommendation headline/body, three options with level/nextLevel/family/type/intent, and a deterministic `EVOLVE` recommendation on the fire card (Lv.4 -> Lv.5).
- After picking the recommended card it asserts mode returns to `playing`, the level overlay clears (`levelChoice` null), the fire skill reaches max level, and `evolvedSkills` contains 炎王符.
- Updated cache version to `upgrade-choice-20260628` (`ASSET_VERSION` in `survivor/game.js` and `?v=` in `survivor/index.html`).
- Verified green with `node --check survivor/game.js`, `node --check scripts/playtest-survivor-loop.mjs`, `npx.cmd tsc --pretty false`, `npm run loop:upgrade-choice`, and the `npm run loop:smoke` regression. The upgrade-choice screenshot was visually inspected for card/footer text clipping. No console errors or failed requests.
- New evidence: `survivor/test-artifacts/loop-upgrade-choice.png`, `survivor/test-artifacts/loop-upgrade-choice-resumed.png`, and `survivor/test-artifacts/loop-upgrade-choice-result.json`.

2026-06-28 summoner enemy content pass (enemy depth)

- Added a new elite enemy archetype 召虺 (kind `weaver`) to make late waves demand target prioritization instead of pure crowd clearing.
- `weaver` is a slow, distance-keeping caster (`GAME_CONFIG.enemyProfiles.weaver`) that periodically telegraphs a conjure (`conjureCast`, ~0.7s windup with a purple aura pulse and the banner 「召虺正在召喚雜兵：先擊破它」) and then summons 2-3 ghoul/skitter minions near itself. Implemented `updateWeaver`, `queueWeaverConjure`, and `resolveWeaverConjure`; wired the weaver branch into `updateEnemies` and gave it the mage-style retreat-when-close movement.
- Made the weaver a real elite everywhere: `enemyStyle` (purple, 召 mark, mage row), `drawEnemyAura` conjure ring, `awardStrongEnemyLoot` (counts as `eliteKills`, drops moon dust + soul burst), minimap `elites` filter, and the minimap elite colour.
- Spawn integration: added `weaver` to the late 護陣 stage phase and to the 召喚契約 story chapter pressure, and updated the 護陣 objective/message text to call out summoners.
- Observability: added `summonerEnemies` and `conjuringEnemies` counts to `render_game_to_text`, and surfaced the conjure windup inside `castingEnemies` (new `conjure` field). Added `debug_force_weaver_conjure` for deterministic QA.
- Added `loop:enemy-summoner` to the harness and package scripts: spawns a weaver, forces the conjure telegraph, advances time, asserts minions actually arrive and the telegraph clears, then kills the weaver and asserts it registers as an elite takedown.
- Updated cache version to `summoner-enemy-20260628` (`ASSET_VERSION` in `survivor/game.js` and `?v=` in `survivor/index.html`).
- Verified green with `node --check survivor/game.js`, `node --check scripts/playtest-survivor-loop.mjs`, `npx.cmd tsc --pretty false`, `npm run loop:enemy-summoner`, plus the `npm run loop:smoke` and `npm run loop:upgrade-choice` regressions. Inspected the telegraph screenshot (conjure banner visible). No console errors or failed requests.
- New evidence: `survivor/test-artifacts/loop-enemy-summoner-telegraph.png`, `survivor/test-artifacts/loop-enemy-summoner-resolved.png`, and `survivor/test-artifacts/loop-enemy-summoner-result.json`.

2026-07-03 weaver bespoke art integration (Codex handoff REQ-001)

- Processed the Codex-delivered green-screen weaver sheet (`survivor/assets/incoming/weaver/weaver-greenscreen.png`, 2172x724, 12x4 @181px).
- Added `scripts/normalize-weaver-sheet.mjs`: corner-sampled chroma key + green despill, bilinear 181px->128px resample per cell, and a measured foot anchor. Output `survivor/assets/weaver-sprites.png` (1536x512, matte residual ratio 0) and `survivor/assets/weaver-art.json` (rows idle/conjure/hit/death, anchor y=116).
- Loaded a dedicated `weaverSprites` image and added `drawWeaverSprite`; `drawEnemies` now renders the weaver from its own sheet with state-driven rows (conjure row while `conjureCast`, hit row while recoiling, idle otherwise) instead of the previous tinted mage sprite. Bumped weaver on-screen size to 120 for elite presence; kept the 召 mark and health bar.
- Updated cache version to `weaver-art-20260703` (`ASSET_VERSION` + `index.html`).
- Verified with `node --check survivor/game.js`, `npx.cmd tsc --pretty false`, `npm run loop:enemy-summoner`, and `npm run loop:smoke`. Telegraph screenshot confirms the golden conjure frame renders in-game with no console errors or failed requests.
- This is the first full Claude×Codex art-pipeline round trip (Codex generated the art, Claude cut it out and wired it in). REQ-001 marked done in `collab/TO_CODEX.md` / `collab/FROM_CODEX.md`.

2026-07-03 two elite enemies from Codex specs (Codex handoff REQ-002)

- Implemented both elites from `collab/REQ-002-elite-enemy-spec.md` (content-only specs authored by Codex; Claude wrote all runtime code).
- `mirror_lantern` / 鏡燈使: retreating ranged elite. Telegraphs an offset "mirror" marker beside the player (teal line from lantern + amber line marker->player), then fires the projectile FROM the marker so the player must dodge perpendicular, not just kite backward. Splits into two weaker bolts below 45% HP. Hit source `鏡燈法彈` (enemy bullets now carry an optional `source` label). Spawns in the 裂潮 stage phase.
- `talisman_binder` / 縛符師: places two `bindSeal` hazards near the player's projected path (0.55s arm, 3.0s active) that deal small damage and apply a 0.9s ~42% slow on contact with no hard stun. Added a player-slow system (`p.slowT` scales movement in `updatePlayer`). Hit source `縛符陷阱`. Spawns in the 護陣 stage phase.
- Both are treated as elites: retreat-when-close movement, `awardStrongEnemyLoot` entries, minimap elite filter+colour, `enemyStyle` marks (鏡/縛). Added observability (`bindSeals`, `playerSlowed`, `castingEnemies.mirror`) and debug hooks (`debug_force_mirror_shot`, `debug_force_bind_seals`, `debug_move_player_to_bind_seal`).
- Added `loop:elite-enemies`: forces the mirror shot and asserts a projectile spawns from the offset marker; forces bind seals, moves the player onto one, and asserts the player is slowed with a readable `縛符陷阱` hit source.
- Updated cache version to `elite-enemies-20260703`.
- Verified with `node --check` (game.js + harness), `npx.cmd tsc --pretty false`, `npm run loop:elite-enemies`, and the `loop:enemy-summoner` + `loop:smoke` regressions. Mirror telegraph screenshot inspected. No console errors or failed requests.
- Follow-up queued as REQ-003: both elites still reuse a tinted mage sprite; bespoke art is the next Codex batch.
- New evidence: `survivor/test-artifacts/loop-elite-mirror-telegraph.png`, `loop-elite-bind-seals.png`, `loop-elite-bind-slow.png`, `loop-elite-enemies-result.json`.

2026-07-03 bespoke elite art integration (Codex handoff REQ-003)

- Processed the Codex-delivered green-screen sheets for `mirror_lantern` and `talisman_binder` (both 2172x724, 12x4).
- Added a generic `scripts/normalize-elite-sheet.mjs <kind>` (same chroma key + green despill + 181px->128px resample + measured foot anchor as the weaver script) and produced `survivor/assets/mirror_lantern-sprites.png` (footY 122) and `survivor/assets/talisman_binder-sprites.png` (footY 117), both matte residual ratio 0.
- Refactored the weaver-specific runtime draw path into a generic `ELITE_SHEETS` registry (`weaver`, `mirror_lantern`, `talisman_binder`) + `drawEliteSprite` + `eliteActing`. All three elites now render from their own bespoke sheet with state-driven rows (idle / action / hit); the binder shows its seal-casting frame via a short `bindPose`. Removed `weaverSprites`/`drawWeaverSprite`/`WEAVER_ROWS` in favour of the registry.
- Bumped elite on-screen sizes for presence and updated cache version to `elite-art-20260703`.
- Verified with `node --check survivor/game.js`, `npm run loop:elite-enemies`, `npm run loop:enemy-summoner`, and `npm run loop:smoke`. Mirror-lantern telegraph screenshot confirms the bespoke lantern art (not a tinted mage) renders with the offset telegraph. No console errors or failed requests.
- Queued REQ-004 (hero full action sheet, Batch A) as the next Codex art batch.

2026-07-04 hero full action sheet integration (Codex handoff REQ-004)

- Processed the Codex-delivered green-screen hero sheet (`survivor/assets/incoming/hero/hero-greenscreen.png`, 1774x887, 12x6).
- Generalized `scripts/normalize-elite-sheet.mjs` to accept a row count + row names (`node scripts/normalize-elite-sheet.mjs hero 6 idle,run,attack,hit,dash,death`); produced `survivor/assets/hero-sprites.png` (1536x768, footY 122, matte residual 0) + `hero-art.json`.
- Loaded a dedicated `heroSprites` image and rewrote `drawPlayer` to render from it with state-driven rows (idle/run/attack/hit/dash); action rows use timer-driven one-shot frames. Added `p.attackT` (set on auto-fire), `p.hurtT` (set in `triggerPlayerHurtFeedback`), and `p.dashAnimT` (set on dash), all decayed in `updatePlayer`. Kept the old main-sheet hero rows as a fallback if the bespoke sheet has not loaded.
- Exposed `player.heroAnim` in `render_game_to_text` and added `debug_player_anim(kind)` for deterministic QA.
- Added `loop:hero-anim`: asserts the hero sheet loads, each action row (attack/hit/dash) triggers, and the one-shot hit/dash timers decay back to idle (attack legitimately persists while auto-firing).
- Updated cache version to `hero-art-20260703`.
- Verified with `node --check` (game.js + harness), `npx.cmd tsc --pretty false`, `npm run loop:hero-anim`, and the `loop:smoke` / `loop:combat-readability` / `loop:elite-enemies` regressions. Attack-frame screenshot confirms the bespoke cat-mage art renders. No console errors or failed requests.
- The player now has real attack/hit/dash/death animation instead of idle/run-only + VFX. Queued REQ-005 (final boss / boss bespoke sheets) as the next Codex art batch.

2026-07-04 final boss bespoke art integration (Codex handoff REQ-005)

- Processed the Codex-delivered green-screen final boss sheet (`survivor/assets/incoming/final_boss/final_boss-greenscreen.png`, 2172x724, 12x4).
- Normalized via `scripts/normalize-elite-sheet.mjs final_boss 4 idle,cast,hit,death` → `survivor/assets/final_boss-sprites.png` (1536x512, footY 127, matte residual 0) + `final_boss-art.json`.
- Added `final_boss` to the `ELITE_SHEETS` registry and an `eliteSheetKey(e)` helper so the final boss (which has `kind:"boss"` plus the `finalBoss` flag) renders from its bespoke moon-deity sheet; `eliteActing` treats `castT`/`specialCast` as the cast row. Regular non-final bosses keep the tinted-brute fallback.
- Added `loop:final-boss`: spawns the final boss, asserts it is active with a phase HUD, forces the 怨月封印 special, and confirms the cast is surfaced in `castingEnemies`; captures idle + cast screenshots.
- Updated cache version to `final-boss-art-20260704`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, `npm run loop:final-boss`, and the `loop:smoke` / `loop:hero-anim` / `loop:enemy-summoner` regressions. Cast screenshot confirms the bespoke boss art renders. No console errors or failed requests.
- Five bespoke sheets now integrated (hero + weaver + mirror_lantern + talisman_binder + final_boss). Next Codex art batch: Batch D UI icons, or a regular-boss sheet.

2026-07-04 regular boss bespoke art integration (Codex handoff BOSS-001)

- Processed the Codex-delivered green-screen regular boss sheet (`survivor/assets/incoming/boss/boss-greenscreen.png`, 2172x724, 12x4).
- Normalized via `scripts/normalize-elite-sheet.mjs boss 4 idle,cast,hit,death` → `survivor/assets/boss-sprites.png` (1536x512, footY 121, matte residual 0) + `boss-art.json`.
- Added `boss` to the `ELITE_SHEETS` registry. Because `eliteSheetKey` returns the raw kind for non-final bosses, the regular boss now renders from its bespoke oni-warlord sheet automatically. Generalized `eliteActing` so any `kind:"boss"` (final or regular) uses the cast row while casting.
- Added `loop:boss`: spawns a non-final boss, confirms it is not the final boss, forces the special cast, and checks the cast is surfaced; captures idle + cast screenshots.
- Updated cache version to `boss-art-20260704`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, `npm run loop:boss`, and the `loop:final-boss` / `loop:smoke` / `loop:elite-enemies` regressions. Cast screenshot confirms the bespoke oni boss renders with its purple cast circle. No console errors or failed requests.
- Six bespoke sheets now integrated; no enemy or the hero reuses a tinted placeholder any more. Next Codex art batch: Batch D UI icons.

2026-07-04 UI icon roster integration (Codex handoff Batch D / ICONS-001)

- Processed the Codex-delivered green-screen UI icon roster (`survivor/assets/incoming/icons/ui-icons-roster-greenscreen.png`, 1536x1024, 6x4 @256px, 24 semantic icons with an `icon-roster.json` id map).
- Added `scripts/normalize-icons.mjs` (chroma key + green despill + 256px->128px resample per cell; tuned the green test to keep teal/cyan icon art) → `survivor/assets/ui-icons.png` (768x512, matte residual 0) + `ui-icons.json` (id → [col,row]).
- Added a hardcoded `UI_ICONS` id→cell map (24 ids: 7 elements + health/shield/speed/magnet/summon/moon_dust/memory_shard/boss_key/reroll/revive/blade/talisman/burn/slow/curse/armor/pickup_range), a `drawUiIcon(id, x, y, size)` helper, and a `familyIconId(family)` mapper (elements + Melee→blade / Utility→speed / Survive→shield / else talisman).
- Wired a family/element icon onto every level-up card (next to the family pill) as the first visible use; the 24 ids are runtime keys ready for more placements (currency, status effects, HUD).
- Updated cache version to `ui-icons-20260704`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, `npm run loop:upgrade-choice` (screenshot shows fire/water element icons + the Utility speed icon on the cards, atlas loads with no failed request), and the `loop:smoke` / `loop:pause-info` regressions. No console errors.
- This completes the queued Codex art batches (hero + 3 elites + 2 bosses + UI icons). No character or the hero uses a placeholder; icons are id-keyed for future UI polish.

2026-07-04 UI icon HUD polish pass (Claude solo, uses the ICONS-001 atlas)

- Spread the newly-integrated UI icon roster across the most-seen surfaces (no new art needed):
  - In-run HUD: element icon next to the element/equipment line (element ids map 1:1 to icon ids), and a `drawPlayerStatusIcons` strip showing slow / shield / low-HP icons by the health bar.
  - Home screen: moon dust and memory shard now show their bespoke icons via a new optional `iconId` arg on `drawTopResource`.
  - Home hero preview now renders from the bespoke `heroSprites` idle row (with a slow idle cycle) instead of the old main-sheet sprite; falls back if the sheet has not loaded.
- Updated cache version to `ui-icons-hud-20260704`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, and the `loop:smoke` (home hero + resource icons), `loop:combat-readability`, `loop:upgrade-choice`, `loop:elite-enemies`, and `loop:final-boss` screenshots/regressions. Home menu screenshot confirms the bespoke cat-mage preview and the moon-dust/memory-shard icons. No console errors or failed requests.

2026-07-04 enemy status icons (Claude solo, combat readability)

- Added `drawEnemyStatusIcons`: afflicted enemies now show a small icon strip above their health bar for burn / poison / slow / curse, using the ICONS-001 atlas ids. Improves at-a-glance readability of which debuffs are active on which enemy.
- Added `debug_afflict_enemy` and a `loop:enemy-status` playtest that applies all four statuses to a ghoul and screenshots the icons.
- Updated cache version to `enemy-status-20260704`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, `npm run loop:enemy-status`, and `npm run loop:smoke`. Screenshot confirms the status icons render above the afflicted enemy. No console errors or failed requests.
- Backed up: pushed main to origin (github q22605705-hash/ghost-market-unity) after the HUD polish pass; the whole art overhaul + content work is now on GitHub.

2026-07-04 result screen icons (Claude solo, finishing polish)

- Added `damageIconId(name)` and put element/blade/summon/talisman icons before each `輸出排行` row in `drawResultDamageSources` (real element runs show fire/water/etc.; debug sources correctly show none).
- Added reward icons to `drawRewardStrip` (月塵→moon_dust, Boss→boss_key, 精英→summon, 記憶→memory_shard) and a moon_dust icon to the death-screen 月塵 stat cell.
- Updated cache version to `result-icons-20260704`.
- Verified with `node --check`, `npx.cmd tsc --pretty false`, and `npm run loop:result-damage`; the result screenshot shows the bespoke hero art plus the reward icons. No console errors or failed requests.

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

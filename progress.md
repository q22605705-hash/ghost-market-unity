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

Art pipeline
- Pixel-art source sheet is generated with GPT as a green-screen sprite sheet.
- Local Luma Key pass removes the green background into transparency.
- The integrated GPT sheet is 1536x1024 with 8 rows and 12 columns: hero idle, hero run, ghoul, mage, brute, soul pickup, enemy fireball, talisman projectile / orbit blade.
- Verification confirmed 1,155,042 transparent pixels and 0 opaque green pixels in survivor/assets/survivor-sprites.png.
- A cleanup pass removes cross-row debris from the soul pickup row so cropped sprites do not leave brown fragments in gameplay.

Testing
- Local server smoke test returned HTTP 200.
- Playwright local menu and gameplay checks passed with screenshots.
- Long simulation reached around 75 seconds, level 13, 172 kills, 26 active enemies, ranged enemies and enemy bullets present, with no page errors or failed asset requests.
- After integrating GPT art, Playwright confirmed survivor-sprites.png loaded at 1536x1024 and gameplay actors are drawn from the PNG sheet.
- GPT art gameplay screenshot reached around 30 seconds, level 8, 63 kills, with mage, brute, enemy fireball, talisman projectile, orbit blades, and soul pickups visible.

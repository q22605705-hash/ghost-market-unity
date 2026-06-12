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

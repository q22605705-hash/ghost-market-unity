# Survivor Asset Pipeline

Last reviewed: 2026-06-22

This note is owned by the image/cutout lane. It documents the current visual asset pipeline for the browser survivor roguelite and lists the asset gaps the main agent should address with future image generation. Do not treat this as permission to edit game code or binary images.

## Runtime Asset Set

The standalone survivor game in `survivor/` currently loads these visual assets:

- `survivor/assets/survivor-sprites.png`
  - Main 1536x1024, 12 column x 8 row, 128px-cell character/effect sheet.
  - Runtime rows are `heroIdle`, `heroRun`, `ghoul`, `mage`, `brute`, `soul`, `enemyFire`, and `talismanAndBlade`.
  - Metadata: `survivor/assets/survivor-art.json`.
  - Quality reports: `survivor/assets/survivor-art-quality.json` and `survivor/assets/survivor-animation-quality.json`.

- `survivor/assets/map-shrine-courtyard.png`
  - Current single battlefield/background plate.

- `survivor/assets/skill-vfx-cutouts/normalized/*.png`
  - Runtime VFX atlases loaded by `survivor/game.js`: `magic-tags.png`, `magic-bursts.png`, `magic-fields.png`, and `item-icons-fx.png`.
  - Used for projectiles, hit bursts, field effects, and upgrade/item icons.

- `survivor/assets/skill-effects.png`
  - Older/generated 1024x768, 8 column x 6 row, 128px-cell sheet with rows for fire, water, lightning, poison/shadow, support/wind, and icons.
  - Metadata and quality gate live in `survivor/assets/skill-effects.json` and `survivor/assets/skill-effects-quality.json`.
  - It is useful as source/reference material, but the current runtime now points at the normalized cutout VFX atlases instead.

- `public/assets/**`
  - Separate Phaser/prototype asset lane processed by `scripts/process-assets.mjs`: hero, imp, brute, boss, market background, and platform.
  - Keep this lane separate from `survivor/assets/**` unless the main agent explicitly decides to merge systems.

## Pipeline Scripts

- `scripts/generate-survivor-assets.mjs`
  - Generates a procedural fallback green-screen survivor sheet and luma-keys it.
  - Good fallback or reference, not the current preferred art direction.

- `scripts/luma-key-survivor-assets.mjs`
  - Removes green matte from `survivor/assets/raw/gpt-pixel-survivor-greenscreen.png`.
  - Writes `survivor/assets/survivor-sprites.png` and `survivor/assets/survivor-art.json`.

- `scripts/normalize-approved-survivor-sheet.mjs`, `scripts/normalize-cute-cartoon-survivor-sheet.mjs`, `scripts/normalize-green-cartoon-survivor-sheet.mjs`
  - Normalize GPT-produced survivor sheets into the 12x8, 128px-cell runtime format.
  - Important behavior: edge-connected matte removal, feet/center anchoring, placement reports, and quality gates.

- `scripts/defringe-and-animate-survivor-sheet.mjs`
  - Removes white fringe, demattes edges, locks hero foot line, and synthesizes slight idle/run motion from base frames.
  - Writes `survivor/assets/survivor-animation-quality.json`.

- `scripts/normalize-skill-effects.mjs`
  - Converts a GPT green-screen skill effect sheet into a normalized 8x6 effect atlas.

- `scripts/repair-skill-effects.mjs`
  - Repairs weak poison/shadow cells and replaces icon cells from the white-matte GPT icon sheet.
  - Updates quality metadata with a pass/fail gate.

- `scripts/tmp-image-check.*` and `scripts/tmp-image-analyze.cjs`
  - Audit helpers for local image checks. Keep them as analysis utilities; they should not become runtime dependencies.

## Current Strengths

- The survivor sprite sheet has metadata for all 96 placements and reports no placement failures.
- Hero idle/run rows are anchored, but their current animation is partly synthetic and very conservative.
- Enemy rows exist for ghoul, mage, brute, soul, and projectile/fire rows.
- The VFX lane has multiple normalized atlases for tags, bursts, fields, and item/icon effects.
- Runtime debug text confirms the intended split: player/enemies from `survivor-sprites.png`, skills and icons from cutout VFX atlases.

## Asset Gaps

Highest priority:

1. Player combat readability frames
   - Missing dedicated hero attack, hit, death, dash, pickup, and level-up/power-up rows.
   - Current hero rows are idle/run only; attack feedback is mostly VFX/game-code driven.

2. Enemy variety and state coverage
   - Existing rows cover a few enemy silhouettes, but there are no clear hit, death, elite, summon, miniboss, or final boss sprite sets in the survivor runtime sheet.
   - The game has Boss/final-Boss concepts, but the survivor runtime asset set does not yet have bespoke boss sheets.

3. Environment breadth
   - Only one main map background is present for the survivor runtime.
   - Missing tile/prop sets: shrine gate, lanterns, grass/stone variants, hazard telegraphs, destructibles, reward chest, boss arena markers, and garden/memory-run variants.

4. UI icon consistency
   - Upgrade and skill icons exist, but the source manifests include mojibake labels and mixed legacy/new sheets.
   - Missing a clean source-of-truth icon roster keyed to skill ids, elements, passives, summons, currency, and status effects.

5. Cutout provenance
   - The normalized cutout atlases are present, but their source extraction path is not captured in a single clean manifest.
   - Some manifests contain absolute paths with corrupted characters, so future agents should not rely on those paths.

## Main-Agent Image Generation Handoff

Generate new images in batches that preserve the current 128px/160px cell discipline and avoid mixed camera angles.

### Batch A: Hero Complete Sheet

Prompt intent:

```text
Cute dark-fantasy cat talisman survivor, readable top-down/isometric action RPG sprite sheet, transparent-safe flat matte background, consistent character scale and feet anchor, 12 frames per row, 128px cells, rows: idle, run, attack slash, cast talisman, hit recoil, dash, death, pickup/level-up. Strong silhouette, no text, no UI, no shadows connected to feet, no cropped limbs.
```

Cutout steps:

1. Ask for either green matte or white matte, not mixed backgrounds.
2. Run the closest survivor normalizer, preferring a new copy of `normalize-cute-cartoon-survivor-sheet.mjs` if white matte.
3. Check placement count equals `12 columns * expected rows`.
4. Verify feet anchors and bottom drift before runtime integration.
5. Run a visual audit screenshot after the main agent updates references.

### Batch B: Enemy And Boss Sheets

Prompt intent:

```text
Cute dark-fantasy yokai enemy sprite sheets for a survivor roguelite, transparent-safe flat matte background, 12 frames per row, consistent feet anchors and scale. Separate rows for small ghoul, ranged mage, armored brute, floating soul, elite variant, miniboss, final moon boss idle, final moon boss attack. Clear hit/death silhouettes, no text, no UI, no background props.
```

Cutout steps:

1. Use separate sheets for regular enemies and bosses if one sheet loses consistency.
2. Normalize into either a new enemy sheet or extended rows in `survivor-sprites.png`.
3. Create metadata with row names before game-code integration.
4. Quality gate: no opaque matte pixels, no clipped boss frames, stable feet anchors for grounded enemies.

### Batch C: Environment And Props

Prompt intent:

```text
Cute dark-fantasy moon shrine courtyard environment assets for a survivor roguelite, hand-painted game-ready props on transparent-safe matte: shrine gate, stone lantern, broken talisman posts, moon grass clumps, cracked shrine tiles, hazard sigils, reward chest, memory crystal, summon altar, boss arena boundary markers. Cohesive palette, no text, no characters.
```

Cutout steps:

1. Prefer props on transparent/flat matte sheets and backgrounds as separate full plates.
2. Keep map plates separate from prop atlases.
3. Build a manifest with prop names, intended draw layer, and collision/hazard role.

### Batch D: UI Icons

Prompt intent:

```text
Readable mobile-game upgrade and status icons for a cute dark-fantasy survivor roguelite, 128px square icon cells, transparent-safe matte, cohesive line weight and palette, icons for fire, water, lightning, poison, shadow, holy, wind, health, armor, speed, magnet, summon, moon dust, memory shard, boss key, reroll, revive. No letters, no text.
```

Cutout steps:

1. Normalize to `128px` icon cells.
2. Produce a clean JSON manifest keyed by game ids, not by source row labels.
3. Compare icons in upgrade cards at mobile width before accepting them.

## Acceptance Checks For Future Asset Drops

- All runtime PNGs load without network errors in the survivor page.
- Matte remnants are below the quality threshold used by existing reports.
- Character sheets include explicit row names, columns, cell size, anchor mode, and source image path.
- Grounded characters keep foot anchors stable; floating effects use center anchors.
- Game screenshots verify assets at menu, active combat, upgrade choice, and result screens.
- Root-level audit screenshots stay as evidence until an explicit cleanup pass decides what to keep.


# Regular Boss Incoming Art

Status: ready for Claude normalization

## Source Image

- File: `survivor/assets/incoming/boss/boss-greenscreen.png`
- Generated source: GPT image generation through Codex image lane
- Source dimensions: 2172 x 724
- Background: flat chroma green `#00ff00`
- Intended normalized target: 12 columns x 4 rows, 128px cells, final sheet `1536 x 512`

## Intended Rows

- Row 0: `idle`
- Row 1: `cast`
- Row 2: `hit`
- Row 3: `death`

## Claude Handoff Notes

This is an incoming source sheet, not a runtime-ready atlas yet. Please crop/normalize it into the project's 128px-cell boss sheet format before integrating.

Suggested normalization checks:

- Preserve 12 frames per row and 4 rows.
- Remove the green matte.
- Keep bottom-center foot anchor stable; this regular Boss is grounded and heavier than elites.
- Cast row includes a purple seal circle and projectile/boss-skill windup; crop with enough padding so the circle, talismans, and hands do not clip.
- Hit row includes mask flash/crack and armor recoil; keep the body aligned with idle.
- Death row intentionally collapses into armor, talisman scraps, and purple smoke; keep early death frames readable and allow late frames to become sparse.
- Compare normalized scale against current non-final `boss` render size and the already-integrated `final_boss` sheet before wiring runtime references.

## Generation Prompt Summary

Cute dark-fantasy regular non-final Boss yokai, top-down/isometric roguelite sprite sheet, chroma green background, 12 frames per row, rows idle/cast/hit/death, oni mask, heavy prayer beads, cracked talisman armor, ember-purple seal aura, distinct from the cosmic final moon boss, no text, no labels, no UI.

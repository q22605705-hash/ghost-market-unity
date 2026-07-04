# REQ-005 Final Boss Incoming Art

Status: ready for Claude normalization

## Source Image

- File: `survivor/assets/incoming/final_boss/final_boss-greenscreen.png`
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
- Keep bottom-center or visual-center anchor stable; this boss is larger than regular enemies.
- Cast row includes moon-wheel/seal-charging effects; crop with enough padding so halo, seals, and lunar core do not clip.
- Hit row includes aura flicker and seal recoil; keep the boss body aligned with idle.
- Death row intentionally collapses into moon fragments, robe debris, and fading spirit matter; keep early death frames readable and allow late frames to become sparse.
- Compare normalized scale against current final-boss render size before wiring runtime references.

## Generation Prompt Summary

Cute dark-fantasy moon-seal final boss yokai, top-down/isometric roguelite sprite sheet, chroma green background, 12 frames per row, rows idle/cast/hit/death, crescent halo, sealed lunar mask, talisman seals, moon-wheel bullet barrage or sealing ritual cast, no text, no labels, no UI.

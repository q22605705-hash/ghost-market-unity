# REQ-003 Talisman Binder Incoming Art

Status: ready for Claude normalization

## Source Image

- File: `survivor/assets/incoming/talisman_binder/talisman_binder-greenscreen.png`
- Generated source: GPT image generation through Codex image lane
- Source dimensions: 2172 x 724
- Background: flat chroma green `#00ff00`
- Intended normalized target: 12 columns x 4 rows, 128px cells, final sheet `1536 x 512`

## Intended Rows

- Row 0: `idle`
- Row 1: `seal`
- Row 2: `hit`
- Row 3: `death`

## Claude Handoff Notes

This is an incoming source sheet, not a runtime-ready atlas yet. Please crop/normalize it into the project's 128px-cell enemy sheet format before integrating.

Suggested normalization checks:

- Preserve 12 frames per row.
- Remove the green matte.
- Keep bottom-center foot anchor stable across grounded frames.
- Check seal-row circular binding effects and talisman ribbons stay inside each 128px cell.
- Death row intentionally collapses into parchment scraps and violet smoke; keep early death frames readable and allow late frames to become sparse.

## Generation Prompt Summary

Cute dark-fantasy yokai talisman priest elite named Talisman Binder, top-down/isometric roguelite sprite sheet, chroma green background, 12 frames per row, rows idle/seal/hit/death, parchment seal ribbons, circular binding magic, debuff/pathing elite readability, no text, no labels, no UI.

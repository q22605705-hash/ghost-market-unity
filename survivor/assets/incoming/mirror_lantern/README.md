# REQ-003 Mirror Lantern Incoming Art

Status: ready for Claude normalization

## Source Image

- File: `survivor/assets/incoming/mirror_lantern/mirror_lantern-greenscreen.png`
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

This is an incoming source sheet, not a runtime-ready atlas yet. Please crop/normalize it into the project's 128px-cell enemy sheet format before integrating.

Suggested normalization checks:

- Preserve 12 frames per row.
- Remove the green matte.
- Keep visual center/bottom-center anchor stable for the floating lantern body.
- Check cast-row mirror portals and teal/amber projectile effects stay inside each 128px cell.
- Death row intentionally fades into lantern smoke and mirror shards; keep early death frames readable and allow late frames to become sparse.

## Generation Prompt Summary

Cute dark-fantasy yokai shrine lantern elite named Mirror Lantern, top-down/isometric roguelite sprite sheet, chroma green background, 12 frames per row, rows idle/cast/hit/death, amber lantern core, teal mirror glow, crescent mirror shards, ranged elite readability, no text, no labels, no UI.

# REQ-001 Weaver Incoming Art

Status: ready for Claude normalization

## Source Image

- File: `survivor/assets/incoming/weaver/weaver-greenscreen.png`
- Generated source: GPT image generation through Codex image lane
- Source dimensions: 2172 x 724
- Background: flat chroma green `#00ff00`
- Intended normalized target: 12 columns x 4 rows, 128px cells, final sheet `1536 x 512`

## Intended Rows

- Row 0: `idle`
- Row 1: `conjure`
- Row 2: `hit`
- Row 3: `death`

## Claude Handoff Notes

This is an incoming source sheet, not a runtime-ready atlas yet. Please crop/normalize it into the project's 128px-cell enemy sheet format before integrating.

Suggested normalization checks:

- Preserve 12 frames per row.
- Remove the green matte.
- Keep bottom-center anchor stable across grounded frames.
- Check conjure effects stay inside each 128px cell after scaling.
- Death row intentionally fades into spirit/thread fragments; keep enough opacity for early death frames and allow late frames to become sparse.

## Generation Prompt Summary

Cute dark-fantasy yokai spider-thread summoner enemy named Weaver, top-down/isometric roguelite sprite sheet, chroma green background, 12 frames per action, rows idle/conjure/hit/death, talisman ribbons, spectral thread arcs, mage-replacement readability, no text, no labels, no UI.

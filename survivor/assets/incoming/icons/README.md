# Batch D UI Icon Roster

Status: ready for Claude slicing/normalization

## Source Image

- File: `survivor/assets/incoming/icons/ui-icons-roster-greenscreen.png`
- Manifest: `survivor/assets/incoming/icons/icon-roster.json`
- Generated source: GPT image generation through Codex image lane
- Source dimensions: 1536 x 1024
- Background: flat chroma green `#00ff00`
- Source layout: 6 columns x 4 rows, 256px cells
- Intended normalized target: 6 columns x 4 rows, 128px cells, final sheet `768 x 512`

## ID Order

Left to right, top to bottom:

- Row 0: `fire`, `water`, `lightning`, `poison`, `shadow`, `holy`
- Row 1: `wind`, `health`, `shield`, `speed`, `magnet`, `summon`
- Row 2: `moon_dust`, `memory_shard`, `boss_key`, `reroll`, `revive`, `blade`
- Row 3: `talisman`, `burn`, `slow`, `curse`, `armor`, `pickup_range`

## Claude Handoff Notes

This is an incoming source sheet, not a runtime-ready icon atlas yet.

Suggested normalization checks:

- Remove the green matte.
- Slice 24 icons using the source 256px grid.
- Downscale each cell to 128px square.
- Keep `icon-roster.json` ids as the source of truth for runtime keys.
- Verify high readability at mobile sizes, especially `poison`, `wind`, `holy`, `slow`, and `pickup_range`.
- Talisman papers intentionally use abstract geometric marks, not readable text.

## Generation Prompt Summary

Readable mobile-game upgrade/status icons for a cute dark-fantasy survivor roguelite, 24 icons, 6x4 grid, chroma green background, cohesive talisman/yokai style, keyed by element/stat/status/currency ids, no text labels, no connected UI frames.

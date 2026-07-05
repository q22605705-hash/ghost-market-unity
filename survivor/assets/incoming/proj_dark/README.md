# proj_dark Incoming Asset

Request: REQ-010

This folder contains a Codex-generated projectile effect source sheet for Claude to integrate in the runtime lane.

- Source: `proj_dark-greenscreen.png`
- Manifest: `proj_dark-manifest.json`
- Background: chroma green `#00ff00`
- Sheet size: 1536 x 256
- Source grid: 6 columns x 1 row, 256px cells
- Frame order: spark, coalesce, lance, wisp, rupture, fade
- Anchor intent: visual-center projectile anchor in each cell

The sheet was generated with the built-in image generation path, then normalized to exact 256px cells and flattened back to a clean green matte. Claude should remove the matte, slice by the manifest grid, and wire runtime references in the runtime lane.

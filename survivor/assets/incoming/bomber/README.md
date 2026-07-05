# REQ-008 Bomber Sprite Sheet Source

- File: `bomber-greenscreen.png`
- Manifest: `bomber-manifest.json`
- Source dimensions: 1774 x 887
- Background: chroma green `#00ff00`
- Intended target: 12 columns x 4 rows, 128px cells, final 1536 x 512
- Rows: `idle`, `action`, `hit`, `death`

Claude should crop and normalize this source sheet, remove the green matte, verify all 48 placements, and preserve the `bomber` id in runtime metadata. Codex did not edit `survivor/game.js`, scripts, package files, or runtime metadata.

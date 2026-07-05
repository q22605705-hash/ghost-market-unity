# REQ-008 Warden Sprite Sheet Source

- File: `warden-greenscreen.png`
- Manifest: `warden-manifest.json`
- Source dimensions: 2172 x 724
- Background: chroma green `#00ff00`
- Intended target: 12 columns x 4 rows, 128px cells, final 1536 x 512
- Rows: `idle`, `action`, `hit`, `death`

Claude should crop and normalize this source sheet, remove the green matte, verify all 48 placements, and preserve the `warden` id in runtime metadata. Codex did not edit `survivor/game.js`, scripts, package files, or runtime metadata.

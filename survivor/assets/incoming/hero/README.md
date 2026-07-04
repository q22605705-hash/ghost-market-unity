# REQ-004 Hero Complete Action Sheet

Status: ready for Claude normalization

## Source Image

- File: `survivor/assets/incoming/hero/hero-greenscreen.png`
- Generated source: GPT image generation through Codex image lane
- Source dimensions: 1774 x 887
- Background: flat chroma green `#00ff00`
- Intended normalized target: 12 columns x 6 rows, 128px cells, final sheet `1536 x 768`

## Intended Rows

- Row 0: `idle`
- Row 1: `run`
- Row 2: `attack`
- Row 3: `hit`
- Row 4: `dash`
- Row 5: `death`

## Claude Handoff Notes

This is an incoming source sheet, not a runtime-ready atlas yet. Please crop/normalize it into the project's 128px-cell hero sheet format before integrating.

Suggested normalization checks:

- Preserve 12 frames per row and 6 rows.
- Remove the green matte.
- Keep bottom-center foot anchor stable across idle, run, attack, hit, and dash frames.
- Dash row includes short afterimage/cloth streaks; keep them contained inside each 128px cell after scaling.
- Attack row includes talisman/cast bursts; crop with enough padding so effects do not clip.
- Death row intentionally transitions into downed poses; keep the final pose readable and non-gory.
- Compare normalized idle/run rows against the current hero scale before replacing runtime rows.

## Generation Prompt Summary

Cute dark-fantasy black cat talisman master hero, top-down/isometric roguelite sprite sheet, chroma green background, 12 frames per row, rows idle/run/attack/hit/dash/death, hooded moon-purple robe, parchment talismans, small staff, consistent bottom-center anchor, no text, no labels, no UI.

// Content-aware normalizer for the summons sheet: the generated creatures are
// NOT aligned to a 12-column grid, so fixed-interval cutting sliced through
// bodies. Instead: chroma-key the whole image, split into 4 row bands, find
// sprite runs by transparent column gaps, and center each run in a 128 cell.
// Rows are tiled ping-pong to 12 frames and remain per-row idle loops.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = path.join(repoRoot, "survivor/assets/incoming/summons/summons-greenscreen.png");
const outPng = path.join(repoRoot, "survivor/assets/summons-sprites.png");
const outJson = path.join(repoRoot, "survivor/assets/summons-art.json");
const ROW_NAMES = ["moon_cat", "paper_imp", "bell_spirit", "shadow_moth"];
const COLS = 12;
const ROWS = 4;
const CELL = 128;

const src = PNG.sync.read(fs.readFileSync(srcPath));
const bandH = Math.floor(src.height / ROWS);

function px(x, y) {
  const i = (y * src.width + x) << 2;
  return [src.data[i], src.data[i + 1], src.data[i + 2]];
}
const corners = [px(2, 2), px(src.width - 3, 2), px(2, src.height - 3), px(src.width - 3, src.height - 3)];
const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((s, p) => s + p[c], 0) / corners.length));
function isMatte(r, g, b) {
  if (Math.hypot(r - bg[0], g - bg[1], b - bg[2]) < 120) return true;
  if (g > 90 && g > r + 45 && g > b + 45) return true;
  return false;
}
function despill(r, g, b) {
  const rb = (r + b) / 2;
  if (g > rb + 24) g = Math.round(rb + (g - rb) * 0.35);
  return [r, g, b];
}

const out = new PNG({ width: COLS * CELL, height: ROWS * CELL });
const report = {};
for (let r = 0; r < ROWS; r++) {
  const y0 = r * bandH;
  const y1 = Math.min(src.height, y0 + bandH);
  // Column opacity histogram for this band.
  const colHit = new Array(src.width).fill(0);
  for (let x = 0; x < src.width; x++) {
    for (let y = y0; y < y1; y++) {
      const [pr, pg, pb] = px(x, y);
      if (!isMatte(pr, pg, pb)) colHit[x]++;
    }
  }
  // Sprite runs: contiguous columns with >=3 hits, separated by gaps >=6 cols.
  const runs = [];
  let start = -1, gap = 0;
  for (let x = 0; x < src.width; x++) {
    if (colHit[x] >= 3) {
      if (start < 0) start = x;
      gap = 0;
    } else if (start >= 0) {
      gap++;
      if (gap >= 6) {
        runs.push([start, x - gap]);
        start = -1;
        gap = 0;
      }
    }
  }
  if (start >= 0) runs.push([start, src.width - 1]);
  // Keep meaningful runs (wide enough to be a creature, not a stray fleck).
  const wide = runs.filter(([a, b]) => b - a >= 40);
  const chosen = (wide.length ? wide : runs).slice(0, 12);
  report[ROW_NAMES[r]] = { runs: runs.length, used: chosen.length };
  // Render each run into a 128 cell (fit + center, feet-free floating center).
  const cells = chosen.map(([a, b]) => {
    // vertical bounds of this run
    let top = y1, bot = y0;
    for (let x = a; x <= b; x++) {
      for (let y = y0; y < y1; y++) {
        const [pr, pg, pb] = px(x, y);
        if (!isMatte(pr, pg, pb)) { if (y < top) top = y; if (y > bot) bot = y; }
      }
    }
    const w = b - a + 1, h = bot - top + 1;
    const scale = Math.min(1, 116 / Math.max(w, h));
    const w2 = Math.max(1, Math.round(w * scale)), h2 = Math.max(1, Math.round(h * scale));
    const ox = Math.floor((CELL - w2) / 2), oy = Math.floor((CELL - h2) / 2);
    const buf = new Uint8ClampedArray(CELL * CELL * 4);
    for (let yy = 0; yy < h2; yy++) {
      for (let xx = 0; xx < w2; xx++) {
        const sx = a + Math.min(w - 1, Math.round(xx / scale));
        const sy = top + Math.min(h - 1, Math.round(yy / scale));
        let [pr, pg, pb] = px(sx, sy);
        if (isMatte(pr, pg, pb)) continue;
        [pr, pg, pb] = despill(pr, pg, pb);
        const o = ((oy + yy) * CELL + (ox + xx)) << 2;
        buf[o] = pr; buf[o + 1] = pg; buf[o + 2] = pb; buf[o + 3] = 255;
      }
    }
    return buf;
  });
  // Ping-pong tile the cells into 12 slots.
  const pingpong = cells.length > 2 ? [...cells, ...cells.slice(1, -1).reverse()] : cells;
  for (let c = 0; c < COLS; c++) {
    const buf = pingpong[c % pingpong.length];
    if (!buf) continue;
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        const si = (y * CELL + x) << 2;
        const oo = ((r * CELL + y) * out.width + (c * CELL + x)) << 2;
        out.data[oo] = buf[si]; out.data[oo + 1] = buf[si + 1]; out.data[oo + 2] = buf[si + 2]; out.data[oo + 3] = buf[si + 3];
      }
    }
  }
}
fs.writeFileSync(outPng, PNG.sync.write(out));
fs.writeFileSync(outJson, `${JSON.stringify({ source: "incoming/summons/summons-greenscreen.png", contentAware: true, cols: COLS, rows: ROWS, cell: CELL, rowNames: ROW_NAMES, anchor: { x: 64, y: 64 }, report }, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, report }, null, 2));

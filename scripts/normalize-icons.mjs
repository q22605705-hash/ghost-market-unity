// Normalize the Codex-delivered UI icon roster into a runtime 6x4, 128px-cell
// atlas with the green matte removed. Icons are centered (no foot anchor).
//
// Source: survivor/assets/incoming/icons/ui-icons-roster-greenscreen.png (1536x1024, 6x4 @256px)
// Output: survivor/assets/ui-icons.png (768x512) + survivor/assets/ui-icons.json (id -> [col,row])
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = path.join(repoRoot, "survivor/assets/incoming/icons/ui-icons-roster-greenscreen.png");
const rosterPath = path.join(repoRoot, "survivor/assets/incoming/icons/icon-roster.json");
const outPng = path.join(repoRoot, "survivor/assets/ui-icons.png");
const outJson = path.join(repoRoot, "survivor/assets/ui-icons.json");

const roster = JSON.parse(fs.readFileSync(rosterPath, "utf8"));
const COLS = roster.sourceGrid.columns;
const ROWS = roster.sourceGrid.rows;
const CELL = roster.targetGrid.cellSize;

const src = PNG.sync.read(fs.readFileSync(srcPath));
const srcCellW = Math.floor(src.width / COLS);
const srcCellH = Math.floor(src.height / ROWS);

function px(img, x, y) {
  const i = (y * img.width + x) << 2;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}
const corners = [px(src, 2, 2), px(src, src.width - 3, 2), px(src, 2, src.height - 3), px(src, src.width - 3, src.height - 3)];
const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((s, p) => s + p[c], 0) / corners.length));

function isMatte(r, g, b) {
  if (Math.hypot(r - bg[0], g - bg[1], b - bg[2]) < 116) return true;
  if (g > 100 && g > r + 55 && g > b + 55) return true; // green-dominant halo (keeps teal/cyan art)
  return false;
}
function despill(r, g, b) {
  const rb = (r + b) / 2;
  if (g > rb + 26) g = Math.round(rb + (g - rb) * 0.4);
  return [r, g, b];
}
function sampleCell(cx, cy, u, v) {
  const fx = cx * srcCellW + u * (srcCellW - 1);
  const fy = cy * srcCellH + v * (srcCellH - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, src.width - 1);
  const y1 = Math.min(y0 + 1, src.height - 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const out = [0, 0, 0, 0];
  for (const [sx, sy, w] of [[x0, y0, (1 - tx) * (1 - ty)], [x1, y0, tx * (1 - ty)], [x0, y1, (1 - tx) * ty], [x1, y1, tx * ty]]) {
    let [r, g, b, a] = px(src, sx, sy);
    if (a === 0 || isMatte(r, g, b)) a = 0;
    else { a = 255; [r, g, b] = despill(r, g, b); }
    out[0] += r * w * (a / 255);
    out[1] += g * w * (a / 255);
    out[2] += b * w * (a / 255);
    out[3] += a * w;
  }
  const a = out[3];
  if (a < 8) return [0, 0, 0, 0];
  return [Math.round(out[0] / (a / 255)), Math.round(out[1] / (a / 255)), Math.round(out[2] / (a / 255)), Math.round(Math.min(255, a))];
}

const out = new PNG({ width: COLS * CELL, height: ROWS * CELL });
let matte = 0;
let solid = 0;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        const [pr, pg, pb, pa] = sampleCell(c, r, x / (CELL - 1), y / (CELL - 1));
        const oi = ((r * CELL + y) * out.width + (c * CELL + x)) << 2;
        out.data[oi] = pr;
        out.data[oi + 1] = pg;
        out.data[oi + 2] = pb;
        out.data[oi + 3] = pa;
        if (pa > 40) { solid++; if (pg > pr + 40 && pg > pb + 40) matte++; }
      }
    }
  }
}
fs.writeFileSync(outPng, PNG.sync.write(out));

const ids = {};
for (const entry of roster.ids) ids[entry.id] = [entry.column, entry.row];
fs.writeFileSync(outJson, `${JSON.stringify({ cols: COLS, rows: ROWS, cell: CELL, ids }, null, 2)}\n`);

console.log(JSON.stringify({ ok: true, count: roster.ids.length, matteResidualRatio: Number((solid ? matte / solid : 0).toFixed(4)), out: path.relative(repoRoot, outPng) }, null, 2));

// Normalize a Codex-delivered elite green-screen source sheet into a runtime
// 12 x 4, 128px-cell sheet with the green matte removed and a measured foot anchor.
//
// Usage: node scripts/normalize-elite-sheet.mjs <kind>
//   reads  survivor/assets/incoming/<kind>/<kind>-greenscreen.png (12x4 grid, any square cell)
//   writes survivor/assets/<kind>-sprites.png (1536 x 512) + survivor/assets/<kind>-art.json
//
// Rows are idle / action / hit / death (action = conjure|cast|seal per elite).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const kind = process.argv[2];
if (!kind) throw new Error("Usage: node scripts/normalize-elite-sheet.mjs <kind>");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = path.join(repoRoot, `survivor/assets/incoming/${kind}/${kind}-greenscreen.png`);
const outPng = path.join(repoRoot, `survivor/assets/${kind}-sprites.png`);
const outJson = path.join(repoRoot, `survivor/assets/${kind}-art.json`);

const COLS = 12;
const ROWS = 4;
const CELL = 128;
const ROW_NAMES = ["idle", "action", "hit", "death"];

const src = PNG.sync.read(fs.readFileSync(srcPath));
const srcCellW = Math.floor(src.width / COLS);
const srcCellH = Math.floor(src.height / ROWS);

function px(img, x, y) {
  const i = (y * img.width + x) << 2;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}
const corners = [
  px(src, 2, 2),
  px(src, src.width - 3, 2),
  px(src, 2, src.height - 3),
  px(src, src.width - 3, src.height - 3)
];
const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((sum, p) => sum + p[c], 0) / corners.length));

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
  const samples = [
    [x0, y0, (1 - tx) * (1 - ty)],
    [x1, y0, tx * (1 - ty)],
    [x0, y1, (1 - tx) * ty],
    [x1, y1, tx * ty]
  ];
  for (const [sx, sy, w] of samples) {
    let [r, g, b, a] = px(src, sx, sy);
    if (a === 0 || isMatte(r, g, b)) {
      a = 0;
    } else {
      a = 255;
      [r, g, b] = despill(r, g, b);
    }
    out[0] += r * w * (a / 255);
    out[1] += g * w * (a / 255);
    out[2] += b * w * (a / 255);
    out[3] += a * w;
  }
  const a = out[3];
  if (a < 8) return [0, 0, 0, 0];
  return [
    Math.round(out[0] / (a / 255)),
    Math.round(out[1] / (a / 255)),
    Math.round(out[2] / (a / 255)),
    Math.round(Math.min(255, a))
  ];
}

const out = new PNG({ width: COLS * CELL, height: ROWS * CELL });
let mattePixels = 0;
let solidPixels = 0;
const footBottoms = [];

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    let bottom = 0;
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        const [pr, pg, pb, pa] = sampleCell(c, r, x / (CELL - 1), y / (CELL - 1));
        const oi = ((r * CELL + y) * out.width + (c * CELL + x)) << 2;
        out.data[oi] = pr;
        out.data[oi + 1] = pg;
        out.data[oi + 2] = pb;
        out.data[oi + 3] = pa;
        if (pa > 40) {
          solidPixels++;
          if (y > bottom) bottom = y;
          if (pg > pr + 40 && pg > pb + 40) mattePixels++;
        }
      }
    }
    if (r === 0) footBottoms.push(bottom);
  }
}

fs.writeFileSync(outPng, PNG.sync.write(out));

footBottoms.sort((a, b) => a - b);
const footY = footBottoms[Math.floor(footBottoms.length / 2)] || 118;
const matteRatio = solidPixels ? mattePixels / solidPixels : 0;
const meta = {
  source: `survivor/assets/incoming/${kind}/${kind}-greenscreen.png`,
  sourceSize: [src.width, src.height],
  bgSample: bg,
  cols: COLS,
  rows: ROWS,
  cell: CELL,
  rowNames: ROW_NAMES,
  anchor: { x: 64, y: footY },
  matteResidualRatio: Number(matteRatio.toFixed(4)),
  placements: COLS * ROWS
};
fs.writeFileSync(outJson, `${JSON.stringify(meta, null, 2)}\n`);

console.log(JSON.stringify({ ok: true, kind, footY, matteResidualRatio: meta.matteResidualRatio, out: path.relative(repoRoot, outPng) }, null, 2));

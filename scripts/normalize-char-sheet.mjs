// Normalize a Codex green-screen character sheet into a runtime 12 x <rows>,
// 128px-cell sheet AND re-anchor every frame so the body is horizontally
// centered and its feet sit on a fixed line. This removes GPT per-frame drift
// (the cause of characters sliding/jumping between idle/run/attack/etc.).
//
// Usage: node scripts/normalize-char-sheet.mjs <kind> <rows> <comma,names>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const kind = process.argv[2];
if (!kind) throw new Error("Usage: node scripts/normalize-char-sheet.mjs <kind> <rows> <names>");
const ROWS = Number(process.argv[3]) || 4;
const ROW_NAMES = process.argv[4] ? process.argv[4].split(",") : ["idle", "action", "hit", "death"];

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = path.join(repoRoot, `survivor/assets/incoming/${kind}/${kind}-greenscreen.png`);
const outPng = path.join(repoRoot, `survivor/assets/${kind}-sprites.png`);
const outJson = path.join(repoRoot, `survivor/assets/${kind}-art.json`);

const COLS = 12;
const CELL = 128;
const FOOT_Y = 120; // where each frame's feet are placed in the output cell
const MIN_COL_PIXELS = 10; // a column needs this many opaque px to count as "body" (ignores thin wisps)

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
  if (Math.hypot(r - bg[0], g - bg[1], b - bg[2]) < 120) return true;
  if (g > 90 && g > r + 45 && g > b + 45) return true;
  return false;
}
function despill(r, g, b) {
  const rb = (r + b) / 2;
  if (g > rb + 24) g = Math.round(rb + (g - rb) * 0.35);
  return [r, g, b];
}
// Resize one source cell to a fresh 128x128 RGBA buffer (green removed).
function renderCell(cx, cy) {
  const buf = new Uint8ClampedArray(CELL * CELL * 4);
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      const fx = cx * srcCellW + (x / (CELL - 1)) * (srcCellW - 1);
      const fy = cy * srcCellH + (y / (CELL - 1)) * (srcCellH - 1);
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const x1 = Math.min(x0 + 1, src.width - 1), y1 = Math.min(y0 + 1, src.height - 1);
      const tx = fx - x0, ty = fy - y0;
      let R = 0, G = 0, B = 0, A = 0;
      for (const [sx, sy, w] of [[x0, y0, (1 - tx) * (1 - ty)], [x1, y0, tx * (1 - ty)], [x0, y1, (1 - tx) * ty], [x1, y1, tx * ty]]) {
        let [r, g, b, a] = px(src, sx, sy);
        if (a === 0 || isMatte(r, g, b)) a = 0; else { a = 255;[r, g, b] = despill(r, g, b); }
        R += r * w * (a / 255); G += g * w * (a / 255); B += b * w * (a / 255); A += a * w;
      }
      const o = (y * CELL + x) << 2;
      if (A < 8) { buf[o + 3] = 0; continue; }
      buf[o] = Math.round(R / (A / 255)); buf[o + 1] = Math.round(G / (A / 255)); buf[o + 2] = Math.round(B / (A / 255)); buf[o + 3] = Math.round(Math.min(255, A));
    }
  }
  return buf;
}
// Find the body box: columns with >= MIN_COL_PIXELS opaque pixels.
function bodyBox(buf) {
  const colCount = new Array(CELL).fill(0);
  for (let x = 0; x < CELL; x++) for (let y = 0; y < CELL; y++) if (buf[((y * CELL + x) << 2) + 3] > 60) colCount[x]++;
  let first = -1, last = -1;
  for (let x = 0; x < CELL; x++) if (colCount[x] >= MIN_COL_PIXELS) { if (first < 0) first = x; last = x; }
  if (first < 0) { // fallback: any opaque
    for (let x = 0; x < CELL; x++) if (colCount[x] > 0) { if (first < 0) first = x; last = x; }
  }
  if (first < 0) return null;
  let footY = 0;
  for (let x = first; x <= last; x++) for (let y = 0; y < CELL; y++) if (buf[((y * CELL + x) << 2) + 3] > 60 && y > footY) footY = y;
  return { centerX: Math.round((first + last) / 2), footY };
}

const out = new PNG({ width: COLS * CELL, height: ROWS * CELL });
let matte = 0, solid = 0;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const buf = renderCell(c, r);
    const box = bodyBox(buf);
    const dx = box ? Math.round(64 - box.centerX) : 0;
    const dy = box ? Math.round(FOOT_Y - box.footY) : 0;
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        const srcX = x - dx, srcY = y - dy;
        const oo = ((r * CELL + y) * out.width + (c * CELL + x)) << 2;
        if (srcX < 0 || srcX >= CELL || srcY < 0 || srcY >= CELL) { out.data[oo + 3] = 0; continue; }
        const si = (srcY * CELL + srcX) << 2;
        out.data[oo] = buf[si]; out.data[oo + 1] = buf[si + 1]; out.data[oo + 2] = buf[si + 2]; out.data[oo + 3] = buf[si + 3];
        if (buf[si + 3] > 40) { solid++; if (buf[si + 1] > buf[si] + 40 && buf[si + 1] > buf[si + 2] + 40) matte++; }
      }
    }
  }
}
fs.writeFileSync(outPng, PNG.sync.write(out));
fs.writeFileSync(outJson, `${JSON.stringify({ source: `incoming/${kind}/${kind}-greenscreen.png`, cols: COLS, rows: ROWS, cell: CELL, rowNames: ROW_NAMES, anchor: { x: 64, y: FOOT_Y }, reanchored: true, matteResidualRatio: Number((solid ? matte / solid : 0).toFixed(4)) }, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, kind, rows: ROWS, anchor: { x: 64, y: FOOT_Y }, matteResidualRatio: Number((solid ? matte / solid : 0).toFixed(4)) }, null, 2));

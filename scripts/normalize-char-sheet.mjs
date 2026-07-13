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
if (!kind) throw new Error("Usage: node scripts/normalize-char-sheet.mjs <kind> <rows> <names> [center]");
const ROWS = Number(process.argv[3]) || 4;
const ROW_NAMES = process.argv[4] ? process.argv[4].split(",") : ["idle", "action", "hit", "death"];
// "center" mode: floating creatures — anchor the body centroid instead of the
// feet, and stabilize every row (each row is its own idle loop).
const CENTER_MODE = process.argv[5] === "center";

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
// Aspect-preserving: non-square source cells are letterboxed, not squeezed.
const cellScale = CELL / Math.max(srcCellW, srcCellH);
const fitW = Math.round(srcCellW * cellScale);
const fitH = Math.round(srcCellH * cellScale);
const fitOX = Math.floor((CELL - fitW) / 2);
const fitOY = Math.floor((CELL - fitH) / 2);
function renderCell(cx, cy) {
  const buf = new Uint8ClampedArray(CELL * CELL * 4);
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      if (x < fitOX || x >= fitOX + fitW || y < fitOY || y >= fitOY + fitH) continue;
      const fx = cx * srcCellW + ((x - fitOX) / (fitW - 1)) * (srcCellW - 1);
      const fy = cy * srcCellH + ((y - fitOY) / (fitH - 1)) * (srcCellH - 1);
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
// Anchor each frame by its FEET, not its whole-body bounding box: the bbox
// centre shifts whenever an arm/tail/prop swings, which made the body jitter
// frame-to-frame. Feet stay planted, so aligning the feet centroid keeps the
// animation coherent while the upper body moves freely.
function bodyBox(buf) {
  const colCount = new Array(CELL).fill(0);
  for (let x = 0; x < CELL; x++) for (let y = 0; y < CELL; y++) if (buf[((y * CELL + x) << 2) + 3] > 60) colCount[x]++;
  let first = -1, last = -1;
  for (let x = 0; x < CELL; x++) if (colCount[x] >= MIN_COL_PIXELS) { if (first < 0) first = x; last = x; }
  if (first < 0) { // fallback: any opaque
    for (let x = 0; x < CELL; x++) if (colCount[x] > 0) { if (first < 0) first = x; last = x; }
  }
  if (first < 0) return null;
  let footY = 0, topY = CELL;
  for (let x = first; x <= last; x++) for (let y = 0; y < CELL; y++) if (buf[((y * CELL + x) << 2) + 3] > 60) { if (y > footY) footY = y; if (y < topY) topY = y; }
  if (CENTER_MODE) {
    // Floating body: anchor the bbox centre.
    return { centerX: Math.round((first + last) / 2), footY, centerY: Math.round((topY + footY) / 2) };
  }
  // Feet centroid: opaque pixels in the bottom 14px of the body, body columns only.
  let sx = 0, n = 0;
  for (let y = Math.max(0, footY - 14); y <= footY; y++) {
    for (let x = first; x <= last; x++) {
      if (colCount[x] >= MIN_COL_PIXELS && buf[((y * CELL + x) << 2) + 3] > 60) { sx += x; n++; }
    }
  }
  const centerX = n ? sx / n : (first + last) / 2;
  return { centerX: Math.round(centerX), footY };
}

// --- Pass 1: render + re-anchor every frame into per-row frame buffers. ---
const rowsFrames = [];
let matte = 0, solid = 0;
for (let r = 0; r < ROWS; r++) {
  const frames = [];
  for (let c = 0; c < COLS; c++) {
    const buf = renderCell(c, r);
    const box = bodyBox(buf);
    const dx = box ? Math.round(64 - box.centerX) : 0;
    const dy = box ? (CENTER_MODE ? Math.round(66 - box.centerY) : Math.round(FOOT_Y - box.footY)) : 0;
    const shifted = new Uint8ClampedArray(CELL * CELL * 4);
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        const srcX = x - dx, srcY = y - dy;
        if (srcX < 0 || srcX >= CELL || srcY < 0 || srcY >= CELL) continue;
        const si = (srcY * CELL + srcX) << 2, di = (y * CELL + x) << 2;
        shifted[di] = buf[si]; shifted[di + 1] = buf[si + 1]; shifted[di + 2] = buf[si + 2]; shifted[di + 3] = buf[si + 3];
        if (buf[si + 3] > 40) { solid++; if (buf[si + 1] > buf[si] + 40 && buf[si + 1] > buf[si + 2] + 40) matte++; }
      }
    }
    frames.push(shifted);
  }
  rowsFrames.push(frames);
}

// --- Pass 2: stabilize looping rows (idle/run). GPT frames are independent
// drawings, not an animation cycle — adjacent frames can differ by 30-57% of
// pixels, which plays back as flicker. Build a smooth ping-pong loop from the
// most mutually-similar frames instead. ---
function frameDiff(a, b) {
  let diff = 0, count = 0;
  for (let i = 0; i < CELL * CELL; i++) {
    const o = i << 2;
    const va = a[o + 3] > 60, vb = b[o + 3] > 60;
    if (!va && !vb) continue;
    count++;
    if (va !== vb) diff++;
    else if (Math.abs(a[o] - b[o]) + Math.abs(a[o + 1] - b[o + 1]) + Math.abs(a[o + 2] - b[o + 2]) > 90) diff++;
  }
  return count ? diff / count : 0;
}
// Stabilize every repeatedly-played row. The hero auto-attacks every ~0.4s and
// enemies cycle their action rows continuously, so incoherent GPT frames in
// attack/hit/dash/action strobe just as badly as idle did. Only death rows
// keep their raw order (a genuine one-shot dissolve progression).
const LOOP_ROWS = new Set(["idle", "run", "attack", "hit", "dash", "action"]);
const stabilized = {};
for (let r = 0; r < ROWS; r++) {
  if (!CENTER_MODE && !LOOP_ROWS.has(ROW_NAMES[r])) continue;
  const frames = rowsFrames[r];
  const D = frames.map((a) => frames.map((b) => frameDiff(a, b)));
  // Medoid = frame most similar to all others.
  let medoid = 0, best = Infinity;
  for (let i = 0; i < COLS; i++) {
    const total = D[i].reduce((s, v) => s + v, 0);
    if (total < best) { best = total; medoid = i; }
  }
  // Greedy nearest-neighbour chain. Idle/run must stay alive (min 3 frames);
  // gesture rows (attack/hit/dash/action) may collapse to a single stable pose
  // when no mutually-similar frames exist — the VFX carry the action feel, and
  // a static pose beats strobing through unrelated drawings.
  const minFrames = ROW_NAMES[r] === "idle" || ROW_NAMES[r] === "run" ? 3 : 1;
  const chain = [medoid];
  const used = new Set(chain);
  while (chain.length < 5) {
    const last = chain[chain.length - 1];
    let next = -1, nd = Infinity;
    for (let i = 0; i < COLS; i++) if (!used.has(i) && D[last][i] < nd) { nd = D[last][i]; next = i; }
    if (next < 0) break;
    if (chain.length >= minFrames && nd > 0.18) break;
    chain.push(next);
    used.add(next);
  }
  if (ROW_NAMES[r] === "attack") {
    // Combo pose layout: pick 4 maximally-distinct poses (farthest-point
    // sampling from the medoid) and lay them out as 4 blocks of 3 identical
    // frames. The runtime cycles one block per shot — pose variety instead of
    // (impossible) frame animation.
    const poses = [medoid];
    while (poses.length < 4) {
      let best = -1, bestScore = -1;
      for (let i = 0; i < COLS; i++) {
        if (poses.includes(i)) continue;
        const score = Math.min(...poses.map((q) => D[i][q]));
        if (score > bestScore) { bestScore = score; best = i; }
      }
      if (best < 0) break;
      poses.push(best);
    }
    const seq = [];
    for (let i = 0; i < COLS; i++) seq.push(poses[Math.floor(i / 3) % poses.length]);
    rowsFrames[r] = seq.map((idx) => frames[idx]);
    stabilized[ROW_NAMES[r]] = { poses, medoid, comboBlocks: 4 };
    continue;
  }
  // Ping-pong sequence tiled into the 12 slots.
  const pingpong = [...chain, ...chain.slice(1, -1).reverse()];
  const seq = [];
  for (let i = 0; i < COLS; i++) seq.push(pingpong[i % pingpong.length]);
  rowsFrames[r] = seq.map((idx) => frames[idx]);
  stabilized[ROW_NAMES[r]] = { chain, medoid };
}

// --- Pass 3: write the sheet. ---
const out = new PNG({ width: COLS * CELL, height: ROWS * CELL });
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const buf = rowsFrames[r][c];
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
fs.writeFileSync(outJson, `${JSON.stringify({ source: `incoming/${kind}/${kind}-greenscreen.png`, cols: COLS, rows: ROWS, cell: CELL, rowNames: ROW_NAMES, anchor: { x: 64, y: FOOT_Y }, reanchored: true, matteResidualRatio: Number((solid ? matte / solid : 0).toFixed(4)) }, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, kind, rows: ROWS, anchor: { x: 64, y: FOOT_Y }, stabilized, matteResidualRatio: Number((solid ? matte / solid : 0).toFixed(4)) }, null, 2));

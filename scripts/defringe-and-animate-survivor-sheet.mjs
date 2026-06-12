import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const sheetPath = path.join(root, "survivor", "assets", "survivor-sprites.png");
const reportPath = path.join(root, "survivor", "assets", "survivor-animation-quality.json");
const img = PNG.sync.read(fs.readFileSync(sheetPath));
const cell = 128;
const cols = 12;
const heroRows = [0, 1];

function idx(x, y) {
  return (y * img.width + x) * 4;
}

function get(x, y) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return [0, 0, 0, 0];
  const i = idx(x, y);
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}

function set(x, y, rgba) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = idx(x, y);
  img.data[i] = rgba[0];
  img.data[i + 1] = rgba[1];
  img.data[i + 2] = rgba[2];
  img.data[i + 3] = rgba[3];
}

function isNearWhite(r, g, b, a) {
  if (a < 16) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const avg = (r + g + b) / 3;
  return avg > 214 && max - min < 44;
}

function transparentNeighbor(x, y) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    if (get(x + dx, y + dy)[3] < 20) return true;
  }
  return false;
}

function defringe() {
  const next = Buffer.from(img.data);
  let removed = 0;
  let softened = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = idx(x, y);
      const [r, g, b, a] = get(x, y);
      if (!isNearWhite(r, g, b, a) || !transparentNeighbor(x, y)) continue;
      const veryWhite = r > 232 && g > 232 && b > 232;
      if (veryWhite || a < 230) {
        next[i + 3] = 0;
        removed++;
      } else {
        next[i] = Math.max(0, r - 18);
        next[i + 1] = Math.max(0, g - 18);
        next[i + 2] = Math.max(0, b - 18);
        next[i + 3] = Math.min(a, 210);
        softened++;
      }
    }
  }
  img.data.set(next);
  return { removed, softened };
}

function knockOutMatte(rgb) {
  const [r, g, b, a] = rgb;
  const distanceFromWhite = Math.max(255 - r, 255 - g, 255 - b);
  const alpha = Math.max(a, Math.min(255, distanceFromWhite * 4.2));
  const matte = 255 - alpha;
  const nr = Math.max(0, Math.min(255, Math.round((r - matte) * 255 / Math.max(1, alpha))));
  const ng = Math.max(0, Math.min(255, Math.round((g - matte) * 255 / Math.max(1, alpha))));
  const nb = Math.max(0, Math.min(255, Math.round((b - matte) * 255 / Math.max(1, alpha))));
  return [nr, ng, nb, Math.min(a, alpha)];
}

function dematteEdges() {
  let changed = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const [r, g, b, a] = get(x, y);
      if (a <= 0 || !transparentNeighbor(x, y)) continue;
      if (!isNearWhite(r, g, b, a)) continue;
      const dematted = knockOutMatte([r, g, b, a]);
      if (dematted[3] < 32) dematted[3] = 0;
      set(x, y, dematted);
      changed++;
    }
  }
  return changed;
}

function tintRemainingWhiteEdges() {
  let changed = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const [r, g, b, a] = get(x, y);
      if (a <= 0 || !transparentNeighbor(x, y)) continue;
      if (!isNearWhite(r, g, b, a)) continue;
      set(x, y, [Math.min(r, 206), Math.min(g, 197), Math.min(b, 176), Math.min(a, 184)]);
      changed++;
    }
  }
  return changed;
}

function enforceHeroFootLine() {
  let cleared = 0;
  for (const row of heroRows) {
    for (let col = 0; col < cols; col++) {
      const x0 = col * cell;
      const y0 = row * cell;
      for (let y = 113; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          if (get(x0 + x, y0 + y)[3] <= 0) continue;
          set(x0 + x, y0 + y, [0, 0, 0, 0]);
          cleared++;
        }
      }
    }
  }
  return cleared;
}

function readCell(row, col) {
  const pixels = [];
  const x0 = col * cell;
  const y0 = row * cell;
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      const rgba = get(x0 + x, y0 + y);
      if (rgba[3] > 0) pixels.push({ x, y, rgba });
    }
  }
  return pixels;
}

function clearCell(row, col) {
  const x0 = col * cell;
  const y0 = row * cell;
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) set(x0 + x, y0 + y, [0, 0, 0, 0]);
  }
}

function writeAnimatedCell(row, col, base, mode) {
  const x0 = col * cell;
  const y0 = row * cell;
  clearCell(row, col);
  const phase = (col / cols) * Math.PI * 2;
  for (const p of base) {
    const upper = Math.max(0, Math.min(1, (96 - p.y) / 76));
    const lowerLock = p.y >= 96 ? 0 : upper;
    const idleBreath = mode === "idle" ? Math.sin(phase) * 1.2 * upper : 0;
    const runSway = mode === "run" ? Math.sin(phase) * 3.2 * lowerLock : 0;
    const runLift = mode === "run" ? -Math.abs(Math.sin(phase)) * 1.6 * upper : 0;
    const tailFlick = p.x < 42 && p.y > 56 && p.y < 108 ? Math.sin(phase + 1.4) * 2 : 0;
    const charmSwing = p.x > 74 && p.y > 48 && p.y < 112 ? Math.sin(phase - 0.7) * 1.2 : 0;
    const nx = Math.round(p.x + idleBreath + runSway + tailFlick + charmSwing);
    const ny = Math.round(p.y + runLift);
    set(x0 + nx, y0 + ny, p.rgba);
  }
  for (const p of base) {
    if (p.y < 96) continue;
    set(x0 + p.x, y0 + p.y, p.rgba);
  }
}

function cellBounds(row, col) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const x0 = col * cell;
  const y0 = row * cell;
  let whiteEdge = 0;
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      const [r, g, b, a] = get(x0 + x, y0 + y);
      if (a <= 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (isNearWhite(r, g, b, a) && transparentNeighbor(x0 + x, y0 + y)) whiteEdge++;
    }
  }
  return { minX, minY, maxX, maxY, centerX: (minX + maxX) / 2, bottom: maxY, whiteEdge };
}

const before = { defringe: defringe(), dematte: dematteEdges() };
const idleBase = readCell(0, 0);
const runBase = readCell(1, 0);
for (let col = 0; col < cols; col++) {
  writeAnimatedCell(0, col, idleBase, "idle");
  writeAnimatedCell(1, col, runBase, "run");
}
const afterDefringe = { removed: 0, softened: 0, dematte: 0, footLineCleared: enforceHeroFootLine(), tintedWhiteEdges: tintRemainingWhiteEdges() };

const bounds = [];
for (const row of heroRows) {
  for (let col = 0; col < cols; col++) bounds.push({ row, col, ...cellBounds(row, col) });
}
const byRow = Object.groupBy(bounds, (b) => b.row);
const rowReports = Object.entries(byRow).map(([row, items]) => {
  const centers = items.map((b) => b.centerX);
  const bottoms = items.map((b) => b.bottom);
  return {
    row: Number(row),
    centerRange: Number((Math.max(...centers) - Math.min(...centers)).toFixed(2)),
    bottomRange: Math.max(...bottoms) - Math.min(...bottoms),
    whiteEdgePixels: items.reduce((sum, b) => sum + b.whiteEdge, 0)
  };
});

fs.writeFileSync(sheetPath, PNG.sync.write(img));
fs.writeFileSync(reportPath, JSON.stringify({ before, afterDefringe, rows: rowReports, bounds }, null, 2));
console.log(JSON.stringify({ before, afterDefringe, rows: rowReports }, null, 2));

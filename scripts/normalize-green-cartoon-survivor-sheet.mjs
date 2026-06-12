import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const rawPath = path.join(root, "survivor", "assets", "raw", "gpt-cute-cartoon-survivor-greenmatte.png");
const outPath = path.join(root, "survivor", "assets", "survivor-sprites.png");
const qualityPath = path.join(root, "survivor", "assets", "survivor-animation-quality.json");
const source = PNG.sync.read(fs.readFileSync(rawPath));
const cell = 128;
const cols = 12;
const rows = 8;
const out = new PNG({ width: cols * cell, height: rows * cell });
for (let i = 0; i < out.data.length; i += 4) out.data[i + 3] = 0;

function idx(img, x, y) {
  return (y * img.width + x) * 4;
}

function read(img, x, y) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return [0, 0, 0, 0];
  const i = idx(img, x, y);
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}

function write(x, y, rgba) {
  if (x < 0 || y < 0 || x >= out.width || y >= out.height) return;
  const i = idx(out, x, y);
  out.data[i] = rgba[0];
  out.data[i + 1] = rgba[1];
  out.data[i + 2] = rgba[2];
  out.data[i + 3] = rgba[3];
}

function isGreenMatte(r, g, b, a) {
  if (a <= 0) return false;
  return g > 150 && g > r * 1.45 && g > b * 1.45;
}

function greenSpillClean([r, g, b, a]) {
  if (a <= 0) return [0, 0, 0, 0];
  if (isGreenMatte(r, g, b, a)) return [0, 0, 0, 0];
  const spill = Math.max(0, g - Math.max(r, b) - 24);
  if (spill <= 0) return [r, g, b, a];
  return [r, Math.max(0, g - spill * 1.25), b, Math.max(0, a - spill * 0.35)];
}

function isWhiteEdge([r, g, b, a]) {
  if (a < 16) return false;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return (r + g + b) / 3 > 218 && spread < 48;
}

function isNearWhite([r, g, b, a]) {
  if (a < 16) return false;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return (r + g + b) / 3 > 218 && spread < 48;
}

function hasTransparentNeighbor(x, y) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    if (read(out, x + dx, y + dy)[3] < 16) return true;
  }
  return false;
}

function postCleanEdges() {
  let removedWhite = 0;
  let tintedWhite = 0;
  let clearedFoot = 0;
  for (let y = 0; y < out.height; y++) {
    for (let x = 0; x < out.width; x++) {
      const color = read(out, x, y);
      const [r, g, b, a] = color;
      if (a <= 0) continue;
      if (isGreenMatte(r, g, b, a)) {
        write(x, y, [0, 0, 0, 0]);
        continue;
      }
      if (isNearWhite(color) && hasTransparentNeighbor(x, y)) {
        if (r > 238 && g > 238 && b > 238) {
          write(x, y, [0, 0, 0, 0]);
          removedWhite++;
        } else {
          write(x, y, [Math.min(r, 204), Math.min(g, 198), Math.min(b, 178), Math.min(a, 190)]);
          tintedWhite++;
        }
      }
    }
  }
  for (let row = 0; row <= 1; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = col * cell;
      const y0 = row * cell;
      for (let y = 113; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          if (read(out, x0 + x, y0 + y)[3] <= 0) continue;
          write(x0 + x, y0 + y, [0, 0, 0, 0]);
          clearedFoot++;
        }
      }
    }
  }
  return { removedWhite, tintedWhite, clearedFoot };
}

function cellPixels(row, col) {
  const x0 = Math.round(col * source.width / cols);
  const y0 = Math.round(row * source.height / rows);
  const x1 = col === cols - 1 ? source.width : Math.round((col + 1) * source.width / cols);
  const y1 = row === rows - 1 ? source.height : Math.round((row + 1) * source.height / rows);
  const pixels = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let sy = y0; sy < y1; sy++) {
    for (let sx = x0; sx < x1; sx++) {
      const color = greenSpillClean(read(source, sx, sy));
      if (color[3] < 24) continue;
      const x = sx - x0;
      const y = sy - y0;
      pixels.push({ x, y, color });
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!pixels.length) return null;
  return { pixels, minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function copyCell(row, col) {
  const src = cellPixels(row, col);
  if (!src) return null;
  const character = row <= 4;
  const dstAnchorX = col * cell + 64;
  const dstAnchorY = row * cell + (character ? 112 : 64);
  const srcAnchorX = src.minX + src.width / 2;
  const srcAnchorY = character ? src.maxY : src.minY + src.height / 2;
  const maxW = character ? 112 : 116;
  const maxH = character ? 112 : 116;
  const scale = Math.min(maxW / src.width, maxH / src.height, 1);

  for (const p of src.pixels) {
    const dx = Math.round(dstAnchorX + (p.x - srcAnchorX) * scale);
    const dy = Math.round(dstAnchorY + (p.y - srcAnchorY) * scale);
    if (character && dy > row * cell + 112) continue;
    write(dx, dy, p.color);
  }
  return {
    row,
    col,
    character,
    scale: Number(scale.toFixed(3)),
    sourceBounds: {
      minX: src.minX,
      minY: src.minY,
      maxX: src.maxX,
      maxY: src.maxY,
      width: src.width,
      height: src.height,
      pixels: src.pixels.length
    }
  };
}

function localBounds(row, col) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let green = 0;
  let whiteEdge = 0;
  const x0 = col * cell;
  const y0 = row * cell;
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      const color = read(out, x0 + x, y0 + y);
      const [r, g, b, a] = color;
      if (a <= 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (isGreenMatte(r, g, b, a)) green++;
      if (isWhiteEdge(color) && (x <= minX + 2 || x >= maxX - 2 || y <= minY + 2 || y >= maxY - 2)) whiteEdge++;
    }
  }
  return { row, col, minX, minY, maxX, maxY, centerX: (minX + maxX) / 2, bottom: maxY, green, whiteEdge };
}

const placements = [];
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) placements.push(copyCell(row, col));
}
const cleanup = postCleanEdges();

const bounds = [];
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) bounds.push(localBounds(row, col));
}
const heroRows = [0, 1].map((row) => {
  const items = bounds.filter((b) => b.row === row);
  const centers = items.map((b) => b.centerX);
  const bottoms = items.map((b) => b.bottom);
  return {
    row,
    centerRange: Number((Math.max(...centers) - Math.min(...centers)).toFixed(2)),
    bottomRange: Math.max(...bottoms) - Math.min(...bottoms),
    greenPixels: items.reduce((sum, b) => sum + b.green, 0),
    whiteEdgePixels: items.reduce((sum, b) => sum + b.whiteEdge, 0)
  };
});

fs.writeFileSync(outPath, PNG.sync.write(out));
fs.writeFileSync(qualityPath, JSON.stringify({ source: rawPath, cleanup, placements, rows: heroRows, bounds }, null, 2));
console.log(JSON.stringify({ cleanup, rows: heroRows }, null, 2));

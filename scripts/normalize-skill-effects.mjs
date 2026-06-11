import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const rawPath = path.join(root, "survivor", "assets", "raw", "gpt-skill-effects-greenscreen.png");
const outPath = path.join(root, "survivor", "assets", "skill-effects.png");
const metaPath = path.join(root, "survivor", "assets", "skill-effects.json");
const source = PNG.sync.read(fs.readFileSync(rawPath));

const cols = 8;
const rows = 6;
const cell = 128;
const out = new PNG({ width: cols * cell, height: rows * cell });
for (let i = 0; i < out.data.length; i += 4) out.data[i + 3] = 0;

function isGreen(r, g, b) {
  return (g > 120 && g > r * 1.22 && g > b * 1.12)
    || (g > 55 && r < 120 && b < 150 && g > r * 1.04 && g > b * 1.02);
}

function readPixel(x, y) {
  if (x < 0 || y < 0 || x >= source.width || y >= source.height) return [0, 0, 0, 0];
  const i = (y * source.width + x) * 4;
  const r = source.data[i];
  const g = source.data[i + 1];
  const b = source.data[i + 2];
  const a = source.data[i + 3];
  if (a === 0 || isGreen(r, g, b)) return [0, 0, 0, 0];
  return [r, g, b, a];
}

function writePixel(x, y, color) {
  if (x < 0 || y < 0 || x >= out.width || y >= out.height) return;
  const i = (y * out.width + x) * 4;
  out.data[i] = color[0];
  out.data[i + 1] = color[1];
  out.data[i + 2] = color[2];
  out.data[i + 3] = color[3];
}

function boundsFor(srcX, srcY, srcW, srcH) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = srcY; y < srcY + srcH; y++) {
    for (let x = srcX; x < srcX + srcW; x++) {
      if (readPixel(x, y)[3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function copyCell(row, col) {
  const srcW = source.width / cols;
  const srcH = source.height / rows;
  const srcX = Math.round(col * srcW);
  const srcY = Math.round(row * srcH);
  const box = boundsFor(srcX, srcY, Math.round(srcW), Math.round(srcH));
  if (!box) return null;
  const scale = Math.min(112 / box.width, 112 / box.height, 1.15);
  const anchorX = box.minX + box.width / 2;
  const anchorY = box.minY + box.height / 2;
  const dstX = col * cell + 64;
  const dstY = row * cell + 64;
  for (let y = box.minY; y <= box.maxY; y++) {
    for (let x = box.minX; x <= box.maxX; x++) {
      const color = readPixel(x, y);
      if (color[3] === 0) continue;
      const ox = Math.round(dstX + (x - anchorX) * scale);
      const oy = Math.round(dstY + (y - anchorY) * scale);
      writePixel(ox, oy, color);
    }
  }
  return { row, col, sourceBounds: box, scale: Number(scale.toFixed(3)) };
}

const placements = [];
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) placements.push(copyCell(row, col));
}

fs.writeFileSync(outPath, PNG.sync.write(out));

let transparent = 0;
let opaqueGreen = 0;
for (let i = 0; i < out.data.length; i += 4) {
  const r = out.data[i];
  const g = out.data[i + 1];
  const b = out.data[i + 2];
  const a = out.data[i + 3];
  if (a === 0) transparent++;
  if (a > 0 && isGreen(r, g, b)) opaqueGreen++;
}

fs.writeFileSync(metaPath, JSON.stringify({
  source: "GPT-generated skill effects green-screen sheet, luma keyed and normalized",
  raw: "assets/raw/gpt-skill-effects-greenscreen.png",
  texture: "assets/skill-effects.png",
  cell,
  columns: cols,
  rows: {
    fire: 0,
    water: 1,
    lightning: 2,
    poisonShadow: 3,
    supportWind: 4,
    icons: 5
  },
  verification: {
    transparentPixels: transparent,
    opaqueGreenPixels: opaqueGreen,
    width: out.width,
    height: out.height
  },
  placements: placements.filter(Boolean)
}, null, 2));

console.log(`normalized skill effects -> ${outPath}`);
console.log(`transparent=${transparent} opaqueGreen=${opaqueGreen} size=${out.width}x${out.height}`);

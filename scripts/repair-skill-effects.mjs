import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const sheetPath = path.join(root, "survivor", "assets", "skill-effects.png");
const iconRawPath = path.join(root, "survivor", "assets", "raw", "gpt-skill-icons-whitematte.png");
const metaPath = path.join(root, "survivor", "assets", "skill-effects.json");
const reportPath = path.join(root, "survivor", "assets", "skill-effects-quality.json");

const sheet = PNG.sync.read(fs.readFileSync(sheetPath));
const iconRaw = PNG.sync.read(fs.readFileSync(iconRawPath));
const cell = 128;

function idx(img, x, y) {
  return (y * img.width + x) * 4;
}

function rgba(img, x, y) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return [0, 0, 0, 0];
  const i = idx(img, x, y);
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}

function set(img, x, y, c) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = idx(img, x, y);
  img.data[i] = c[0];
  img.data[i + 1] = c[1];
  img.data[i + 2] = c[2];
  img.data[i + 3] = c[3];
}

function isWhite(r, g, b) {
  return r > 218 && g > 218 && b > 218 && Math.max(r, g, b) - Math.min(r, g, b) < 38;
}

function isBadMatte(r, g, b, a) {
  if (a === 0) return false;
  const green = (g > 120 && g > r * 1.22 && g > b * 1.12)
    || (g > 55 && r < 120 && b < 150 && g > r * 1.04 && g > b * 1.02);
  return green || isWhite(r, g, b);
}

function clearCell(row, col) {
  for (let y = row * cell; y < (row + 1) * cell; y++) {
    for (let x = col * cell; x < (col + 1) * cell; x++) set(sheet, x, y, [0, 0, 0, 0]);
  }
}

function sourceBounds(srcX, srcY, srcW, srcH) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = srcY; y < srcY + srcH; y++) {
    for (let x = srcX; x < srcX + srcW; x++) {
      const [r, g, b, a] = rgba(iconRaw, x, y);
      if (a < 16 || isWhite(r, g, b)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function copyWhiteMatteIcon(srcCol, srcRow, dstCol) {
  const rawCols = 8;
  const rawRows = 2;
  const srcW = iconRaw.width / rawCols;
  const srcH = iconRaw.height / rawRows;
  const srcX = Math.round(srcCol * srcW);
  const srcY = Math.round(srcRow * srcH);
  const box = sourceBounds(srcX, srcY, Math.round(srcW), Math.round(srcH));
  if (!box) throw new Error(`Icon cell ${srcCol},${srcRow} is empty`);

  clearCell(5, dstCol);
  const scale = Math.min(92 / box.width, 92 / box.height);
  const anchorX = box.minX + box.width / 2;
  const anchorY = box.minY + box.height / 2;
  const dstX = dstCol * cell + 64;
  const dstY = 5 * cell + 64;
  const pixels = [];

  for (let y = box.minY; y <= box.maxY; y++) {
    for (let x = box.minX; x <= box.maxX; x++) {
      const [r, g, b, a] = rgba(iconRaw, x, y);
      if (a < 16 || isWhite(r, g, b)) continue;
      const ox = Math.round(dstX + (x - anchorX) * scale);
      const oy = Math.round(dstY + (y - anchorY) * scale);
      pixels.push([ox, oy, r, g, b, a]);
    }
  }

  for (const [x, y] of pixels) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > 3) continue;
        set(sheet, x + dx, y + dy, [5, 10, 13, 230]);
      }
    }
  }
  for (const [x, y, r, g, b, a] of pixels) set(sheet, x, y, [r, g, b, Math.max(225, a)]);
}

function drawDisc(row, col, cx, cy, radius, color, alpha = 230) {
  const ox = col * cell;
  const oy = row * cell;
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y > radius * radius) continue;
      const falloff = 1 - Math.sqrt(x * x + y * y) / radius;
      const a = Math.round(alpha * Math.max(0.18, falloff));
      set(sheet, ox + cx + x, oy + cy + y, [color[0], color[1], color[2], a]);
    }
  }
}

function drawLine(row, col, x1, y1, x2, y2, color, width = 4, alpha = 235) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x1 + (x2 - x1) * t);
    const y = Math.round(y1 + (y2 - y1) * t);
    drawDisc(row, col, x, y, width, color, alpha);
  }
}

function repairPoisonShadowRow() {
  for (let col = 0; col < 3; col++) clearCell(3, col);
  const poison = [132, 248, 72];
  const acid = [202, 255, 62];
  const shadow = [145, 96, 255];
  for (let i = 0; i < 10; i++) {
    drawDisc(3, 0, 32 + i * 7, 72 + Math.round(Math.sin(i) * 15), 10 + (i % 3), i % 2 ? acid : poison, 210);
  }
  drawLine(3, 0, 26, 52, 104, 52, poison, 3, 240);
  drawLine(3, 0, 64, 24, 64, 104, poison, 3, 220);
  for (let i = 0; i < 8; i++) drawDisc(3, 1, 30 + i * 9, 38 + (i % 2) * 30, 13, i % 2 ? shadow : poison, 220);
  drawLine(3, 1, 30, 86, 98, 36, shadow, 5, 240);
  drawLine(3, 2, 24, 64, 104, 64, shadow, 5, 240);
  drawLine(3, 2, 64, 24, 64, 104, poison, 4, 230);
  drawDisc(3, 2, 64, 64, 28, [38, 16, 70], 220);
  drawDisc(3, 2, 64, 64, 16, shadow, 210);
}

function cellStats(row, col) {
  let count = 0;
  let matte = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = row * cell; y < (row + 1) * cell; y++) {
    for (let x = col * cell; x < (col + 1) * cell; x++) {
      const [r, g, b, a] = rgba(sheet, x, y);
      if (a > 16) {
        count++;
        if (isBadMatte(r, g, b, a)) matte++;
        minX = Math.min(minX, x - col * cell);
        minY = Math.min(minY, y - row * cell);
        maxX = Math.max(maxX, x - col * cell);
        maxY = Math.max(maxY, y - row * cell);
      }
    }
  }
  return {
    row,
    col,
    opaquePixels: count,
    mattePixels: matte,
    bounds: count ? { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 } : null
  };
}

for (let col = 0; col < 8; col++) copyWhiteMatteIcon(col, 1, col);
repairPoisonShadowRow();

const checks = [];
for (let row = 0; row < 6; row++) {
  for (let col = 0; col < 8; col++) checks.push(cellStats(row, col));
}

const failures = checks.filter((c) => c.opaquePixels < 450);
if (failures.length) {
  throw new Error(`Skill effect quality check failed: ${JSON.stringify(failures.slice(0, 8))}`);
}

fs.writeFileSync(sheetPath, PNG.sync.write(sheet));
const previous = JSON.parse(fs.readFileSync(metaPath, "utf8"));
previous.source = "GPT-generated skill effects with green-screen effects plus white-matte GPT UI icons, quality gated";
previous.rawIcons = "assets/raw/gpt-skill-icons-whitematte.png";
previous.verification = {
  ...previous.verification,
  qualityGate: "pass",
  minOpaquePixels: Math.min(...checks.map((c) => c.opaquePixels)),
  maxMatteLikePixels: Math.max(...checks.map((c) => c.mattePixels)),
  repairedCells: ["row 3 col 0-2 poison/shadow", "row 5 col 0-7 upgrade icons"]
};
fs.writeFileSync(metaPath, JSON.stringify(previous, null, 2));
fs.writeFileSync(reportPath, JSON.stringify({ checks, failures: [] }, null, 2));
console.log(`repaired skill effects -> ${sheetPath}`);
console.log(`quality pass minOpaque=${previous.verification.minOpaquePixels} maxMatteLike=${previous.verification.maxMatteLikePixels}`);
